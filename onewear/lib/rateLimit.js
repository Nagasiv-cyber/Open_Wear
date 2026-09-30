// Small in-memory rate limiter. On serverless it is per-instance and best
// effort, which is enough to stop accidental request floods in a prototype.
const hits = new Map();

export function rateLimit(key, { limit = 30, windowMs = 60000 } = {}) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now - entry.start > windowMs) {
    hits.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  if (hits.size > 5000) hits.clear();
  return entry.count <= limit;
}

export function clientKey(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
}
