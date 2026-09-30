// Lightweight ownership without accounts. Each browser creates a random
// device key and sends it in a header. The server stores only its SHA-256
// hash, so a leaked database row can't be used to act as that person.
// Production next step: replace with Supabase Auth (phone OTP).
import { createHash } from 'node:crypto';

const KEY_RE = /^[a-f0-9-]{32,64}$/i;

export function hashKey(key) {
  return createHash('sha256').update(String(key)).digest('hex');
}

export function ownerHashFrom(request) {
  const key = request.headers.get('x-onewear-key');
  return key && KEY_RE.test(key) ? hashKey(key.toLowerCase()) : null;
}
