// All dates are plain "YYYY-MM-DD" strings, handled in UTC to avoid
// timezone drift between the browser (IST) and the server (UTC on Vercel).
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s) {
  if (typeof s !== 'string' || !ISO_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function toDate(iso) {
  return new Date(iso + 'T00:00:00Z');
}

export function toIso(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}

export function diffDays(aIso, bIso) {
  return Math.round((toDate(aIso) - toDate(bIso)) / 86400000);
}

export function todayIst() {
  // IST is UTC+5:30
  return toIso(new Date(Date.now() + 5.5 * 3600000));
}

export function formatDate(iso) {
  return toDate(iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  });
}
