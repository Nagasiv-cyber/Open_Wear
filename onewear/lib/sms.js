// Sends SMS through Twilio's REST API. Server-only.
//
// Design rule: an SMS problem must never break a rental request. sendSms
// never throws; it always resolves to a result the UI can show:
//   { status: 'sent' }                   Twilio accepted the message
//   { status: 'skipped', reason }        SMS not configured, or no number
//   { status: 'failed', reason }         Twilio refused or timed out
const TIMEOUT_MS = 5000;

export function isSmsEnabled() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

// "98765 43210", "+91 98765-43210", "919876543210" -> "+919876543210"
export function toE164India(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

// Shows only the last 4 digits, for on-screen confirmations.
export function maskPhone(raw) {
  const e = toE164India(raw);
  return e ? `••••••${e.slice(-4)}` : 'unknown number';
}

// Keeps texts short (1 SMS segment where possible) and strips anything odd.
export function cleanSmsText(text) {
  return String(text).replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 300);
}

export async function sendSms(to, text) {
  const number = toE164India(to);
  if (!number) return { status: 'skipped', reason: 'no valid number' };
  if (!isSmsEnabled()) return { status: 'skipped', reason: 'SMS not configured' };

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: number, From: process.env.TWILIO_FROM_NUMBER, Body: cleanSmsText(text) }),
      signal: controller.signal,
    });
    if (res.ok) return { status: 'sent' };
    const data = await res.json().catch(() => ({}));
    // Twilio error 21608 = trial account texting an unverified number.
    const reason = data.code === 21608 ? 'number not verified in Twilio trial' : data.message || `Twilio error ${res.status}`;
    console.error('SMS failed:', reason);
    return { status: 'failed', reason };
  } catch (err) {
    console.error('SMS failed:', err.name === 'AbortError' ? 'timeout' : err.message);
    return { status: 'failed', reason: err.name === 'AbortError' ? 'timed out' : 'network error' };
  } finally {
    clearTimeout(timer);
  }
}

// Sends several texts in parallel and returns a summary safe to show on
// screen: who it was for, the masked number and what happened.
export async function sendAll(messages) {
  const results = await Promise.all(
    messages.map(async (m) => ({ role: m.role, to: maskPhone(m.to), ...(await sendSms(m.to, m.text)) })),
  );
  return results;
}
