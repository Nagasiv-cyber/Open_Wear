import { validateRequest } from '@/lib/validate';
import { rateLimit, clientKey } from '@/lib/rateLimit';
import { ownerHashFrom } from '@/lib/identity';
import { getSeedListings } from '@/lib/listings';
import { isAvailable } from '@/lib/scoring';
import { isIsoDate, todayIst } from '@/lib/dates';
import {
  getDb, fetchListingRow, rowToListing, fetchAcceptedBookings, applyBookings,
  findOpenRequest, insertRequest, fetchRequestsByBorrower, rowToRequest,
} from '@/lib/db';
import { ok, fail, noDb, noKey, readJson, serverError } from '@/lib/http';
import { sendAll } from '@/lib/sms';
import { sms } from '@/lib/messages';

// GET /api/requests — the caller's rental requests (as a borrower).
export async function GET(request) {
  const db = getDb();
  if (!db) return noDb();
  const me = ownerHashFrom(request);
  if (!me) return noKey();
  try {
    const rows = await fetchRequestsByBorrower(db, me);
    return ok({ requests: rows.map((r) => rowToRequest(r, 'borrower')) });
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/requests — ask to rent an outfit for a date.
export async function POST(request) {
  if (!rateLimit('req:' + clientKey(request), { limit: 15 })) return fail(429, 'Too many requests at once. Wait a minute.');
  const db = getDb();
  if (!db) return noDb();
  const me = ownerHashFrom(request);
  if (!me) return noKey();
  const body = await readJson(request);
  if (!body) return fail(400, 'Request body must be valid JSON.');

  const today = isIsoDate(body.today) ? body.today : todayIst();
  const v = validateRequest(body, today);
  if (!v.ok) return fail(422, 'Some details need fixing.', { fields: v.errors });
  const { listingId, eventDate, borrowerName, borrowerContact } = v.value;

  try {
    // Find the outfit: a sample listing or a community one.
    let listing = getSeedListings(today).find((l) => l.id === listingId);
    let ownerHash = null;
    let lenderPhone = null;
    if (!listing) {
      const row = await fetchListingRow(db, listingId);
      if (!row) return fail(404, 'That outfit is no longer listed.');
      listing = rowToListing(row);
      ownerHash = row.owner_hash;
      lenderPhone = row.lender_phone || null;
    }
    if (ownerHash === me) return fail(409, 'This is your own listing.');

    [listing] = applyBookings([listing], await fetchAcceptedBookings(db, today, listingId));
    if (!isAvailable(listing, eventDate)) return fail(409, 'This outfit is already booked around that date. Pick another date.');
    if (await findOpenRequest(db, { listingId, borrowerHash: me, eventDate })) {
      return fail(409, 'You already requested this outfit for that date.');
    }

    const row = await insertRequest(db, {
      listing_id: listingId,
      listing_snapshot: {
        title: listing.title, category: listing.category, price: listing.price, deposit: listing.deposit,
        retailPrice: listing.retailPrice, areaId: listing.areaId, colors: listing.colors, lender: listing.lender,
        photoUrl: listing.photoUrl || null,
      },
      listing_owner_hash: ownerHash,
      event_date: eventDate,
      borrower_name: borrowerName,
      borrower_contact: borrowerContact,
      borrower_hash: me,
    });
    // Text the lender about the new request and confirm to the borrower.
    const info = { title: listing.title, borrowerName, lenderName: listing.lender.name, eventDate };
    const texts = [{ role: 'you', to: borrowerContact, text: sms.requestSentToBorrower(info) }];
    if (lenderPhone) texts.unshift({ role: 'lender', to: lenderPhone, text: sms.newRequestToLender(info) });
    const smsResults = await sendAll(texts);

    return ok({ request: rowToRequest(row, 'borrower'), sms: smsResults }, 201);
  } catch (err) {
    return serverError(err);
  }
}
