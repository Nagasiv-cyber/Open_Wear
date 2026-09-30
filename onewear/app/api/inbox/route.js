import { ownerHashFrom } from '@/lib/identity';
import { getDb, fetchRequestsForOwner, rowToRequest } from '@/lib/db';
import { ok, noDb, noKey, serverError } from '@/lib/http';

// GET /api/inbox — requests other people made for the caller's outfits.
export async function GET(request) {
  const db = getDb();
  if (!db) return noDb();
  const me = ownerHashFrom(request);
  if (!me) return noKey();
  try {
    const rows = await fetchRequestsForOwner(db, me);
    return ok({ requests: rows.map((r) => rowToRequest(r, 'lender')) });
  } catch (err) {
    return serverError(err);
  }
}
