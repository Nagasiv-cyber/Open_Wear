import { ownerHashFrom } from '@/lib/identity';
import { getDb, deleteListing, deletePhotos } from '@/lib/db';
import { ok, fail, noDb, noKey, serverError } from '@/lib/http';

// DELETE /api/listings/:id — only the lender who created it can remove it.
export async function DELETE(request, { params }) {
  const db = getDb();
  if (!db) return noDb();
  const owner = ownerHashFrom(request);
  if (!owner) return noKey();
  const { id } = await params;
  try {
    const listingId = String(id).slice(0, 60);
    const removed = await deleteListing(db, listingId, owner);
    if (!removed) return fail(404, 'Listing not found, or it isn\'t yours.');
    await deletePhotos(db, listingId);
    return ok({ removed: true });
  } catch (err) {
    return serverError(err);
  }
}
