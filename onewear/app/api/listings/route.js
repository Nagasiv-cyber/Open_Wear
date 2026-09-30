import { validateListing } from '@/lib/validate';
import { rateLimit, clientKey } from '@/lib/rateLimit';
import { ownerHashFrom } from '@/lib/identity';
import { getDb, insertListing, fetchListingsByOwner, uploadPhoto, deletePhotos } from '@/lib/db';
import { ok, fail, noDb, noKey, readJson, serverError } from '@/lib/http';

// GET /api/listings — the caller's own listings (needs the device key).
export async function GET(request) {
  const db = getDb();
  if (!db) return noDb();
  const owner = ownerHashFrom(request);
  if (!owner) return noKey();
  try {
    return ok({ listings: await fetchListingsByOwner(db, owner) });
  } catch (err) {
    return serverError(err);
  }
}

// POST /api/listings — validate and save a new outfit, with optional photo.
// Without a database it validates only and returns mode:'local'.
export async function POST(request) {
  if (!rateLimit('list:' + clientKey(request), { limit: 10 })) return fail(429, 'Too many listings at once. Wait a minute.');
  const body = await readJson(request);
  if (!body) return fail(400, 'Request body must be valid JSON, and photos must be under 700 KB.');
  const result = validateListing(body);
  if (!result.ok) return fail(422, 'Some fields need fixing.', { fields: result.errors });

  const db = getDb();
  if (!db) return ok({ listing: result.listing, mode: 'local' }, 201);
  const owner = ownerHashFrom(request);
  if (!owner) return noKey();

  const listing = { ...result.listing };
  const { photo, lenderPhone } = result.private;
  try {
    if (photo) listing.photoUrl = await uploadPhoto(db, listing.id, photo);
    const saved = await insertListing(db, listing, owner, lenderPhone);
    return ok({ listing: saved, mode: 'db' }, 201);
  } catch (err) {
    if (photo) await deletePhotos(db, listing.id); // don't leave an orphaned photo
    return serverError(err);
  }
}
