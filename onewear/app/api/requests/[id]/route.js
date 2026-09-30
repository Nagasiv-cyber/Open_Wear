import { ownerHashFrom } from '@/lib/identity';
import { getSeedListings } from '@/lib/listings';
import { isAvailable, BUFFER } from '@/lib/scoring';
import { diffDays, todayIst } from '@/lib/dates';
import {
  getDb, fetchRequest, updateRequestStatus, fetchAcceptedBookings, fetchPendingForListing,
  declineRequests, rowToRequest, fetchListingRow,
} from '@/lib/db';
import { sendAll } from '@/lib/sms';
import { sms } from '@/lib/messages';
import { ok, fail, noDb, noKey, readJson, serverError } from '@/lib/http';

const UUID = /^[0-9a-f-]{36}$/i;

// The details an SMS needs, taken from a stored request row.
const info = (row) => ({
  title: row.listing_snapshot?.title || 'your outfit',
  lenderName: row.listing_snapshot?.lender?.name || 'The lender',
  borrowerName: row.borrower_name || 'The borrower',
  eventDate: row.event_date,
});

// PATCH /api/requests/:id  { action: 'cancel' | 'accept' | 'decline' }
// Borrowers can cancel their own pending/accepted requests.
// Lenders can accept or decline pending requests for their outfits.
export async function PATCH(request, { params }) {
  const db = getDb();
  if (!db) return noDb();
  const me = ownerHashFrom(request);
  if (!me) return noKey();
  const { id } = await params;
  if (!UUID.test(id)) return fail(404, 'Request not found.');
  const body = await readJson(request);
  const action = body?.action;
  if (!['cancel', 'accept', 'decline'].includes(action)) return fail(400, 'Action must be cancel, accept or decline.');

  try {
    const req = await fetchRequest(db, id);
    if (!req) return fail(404, 'Request not found.');

    if (action === 'cancel') {
      if (req.borrower_hash !== me) return fail(403, 'Only the person who made this request can cancel it.');
      if (!['pending', 'accepted'].includes(req.status)) return fail(409, `This request is already ${req.status}.`);
      const updated = await updateRequestStatus(db, id, req.status, 'cancelled');
      if (!updated) return fail(409, 'This request just changed. Refresh and try again.');
      // If the lender had already accepted, let them know the dates are free.
      const smsResults = req.status === 'accepted' && req.lender_contact
        ? await sendAll([{ role: 'lender', to: req.lender_contact, text: sms.cancelledToLender(info(req)) }])
        : [];
      return ok({ request: rowToRequest(updated, 'borrower'), sms: smsResults });
    }

    // accept / decline
    if (!req.listing_owner_hash || req.listing_owner_hash !== me) return fail(403, 'Only the lender of this outfit can respond.');
    if (req.status !== 'pending') return fail(409, `This request is already ${req.status}.`);

    if (action === 'decline') {
      const updated = await updateRequestStatus(db, id, 'pending', 'declined');
      if (!updated) return fail(409, 'This request just changed. Refresh and try again.');
      const smsResults = await sendAll([{ role: 'borrower', to: req.borrower_contact, text: sms.declinedToBorrower(info(req)) }]);
      return ok({ request: rowToRequest(updated, 'lender'), sms: smsResults });
    }

    // Accept: make sure no other accepted booking clashes, then accept and
    // auto-decline other pending requests that would now clash.
    const today = todayIst();
    const seed = getSeedListings(today).find((l) => l.id === req.listing_id);
    const booked = [
      ...(seed?.bookedDates || []),
      ...(await fetchAcceptedBookings(db, today, req.listing_id)).map((b) => b.event_date),
    ];
    if (!isAvailable({ bookedDates: booked }, req.event_date)) {
      return fail(409, 'You already accepted another booking around this date.');
    }
    // Share the lender's number with the borrower from this point on.
    const listingRow = await fetchListingRow(db, req.listing_id);
    const lenderPhone = listingRow?.lender_phone || null;
    const updated = await updateRequestStatus(db, id, 'pending', 'accepted', { lender_contact: lenderPhone });
    if (!updated) return fail(409, 'This request just changed. Refresh and try again.');

    const clash = BUFFER.before + BUFFER.after;
    const others = (await fetchPendingForListing(db, req.listing_id))
      .filter((p) => Math.abs(diffDays(p.event_date, req.event_date)) <= clash)
      .map((p) => p.id);
    const declined = await declineRequests(db, others);

    const smsResults = await sendAll([
      { role: 'borrower', to: req.borrower_contact, text: sms.acceptedToBorrower({ ...info(req), lenderPhone }) },
      ...declined.map((d) => ({ role: 'declined borrower', to: d.borrower_contact, text: sms.declinedToBorrower(info(d)) })),
    ]);

    return ok({ request: rowToRequest(updated, 'lender'), autoDeclined: others.length, sms: smsResults });
  } catch (err) {
    return serverError(err);
  }
}
