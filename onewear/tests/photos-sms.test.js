import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePhoto, validateListing } from '../lib/validate.js';
import { toE164India, maskPhone, cleanSmsText, sendSms } from '../lib/sms.js';
import { sms } from '../lib/messages.js';

const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const base = { title: 'Silk saree', category: 'saree', gender: 'women', sizes: ['M'], occasions: ['wedding'], price: 400, deposit: 1000, areaId: 'adyar', lenderName: 'Asha' };

test('real images pass, disguised files are rejected', () => {
  assert.equal(parsePhoto(`data:image/png;base64,${PNG_1PX}`).mime, 'image/png');
  // A PNG labelled as JPEG is detected by its bytes and relabelled correctly.
  assert.equal(parsePhoto(`data:image/jpeg;base64,${PNG_1PX}`).mime, 'image/png');
  const text = Buffer.from('<script>alert(1)</script>').toString('base64');
  assert.equal(parsePhoto(`data:image/png;base64,${text}`).ok, false);
  assert.equal(parsePhoto('data:image/svg+xml;base64,PHN2Zz4=').ok, false);
  assert.equal(parsePhoto('https://evil.example/x.png').ok, false);
});

test('oversized photos are rejected', () => {
  const big = Buffer.alloc(800 * 1024, 1);
  big[0] = 0xff; big[1] = 0xd8; big[2] = 0xff;
  assert.equal(parsePhoto(`data:image/jpeg;base64,${big.toString('base64')}`).ok, false);
});

test('new listings need a phone; the phone stays out of the public listing', () => {
  assert.equal(validateListing(base).errors.lenderPhone !== undefined, true);
  const r = validateListing({ ...base, lenderPhone: '98765 43210', photo: `data:image/png;base64,${PNG_1PX}` });
  assert.equal(r.ok, true);
  assert.equal(JSON.stringify(r.listing).includes('98765'), false);
  assert.equal(r.private.lenderPhone, '98765 43210');
  assert.ok(r.listing.photoUrl.startsWith('data:image/png'));
  // Re-checking stored browser listings (no phone) is allowed only when the server says so.
  assert.equal(validateListing(base, { requirePhone: false }).ok, true);
  assert.equal(validateListing({ ...base, requirePhone: false }).ok, false);
});

test('Indian numbers are normalised and masked', () => {
  assert.equal(toE164India('98765 43210'), '+919876543210');
  assert.equal(toE164India('+91-98765-43210'), '+919876543210');
  assert.equal(toE164India('919876543210'), '+919876543210');
  assert.equal(toE164India('12345'), null);
  assert.equal(maskPhone('9876543210'), '••••••3210');
});

test('SMS text is single-line and short', () => {
  const t = sms.acceptedToBorrower({ title: 'A very long and fancy title for a lehenga with gold work', lenderName: 'Asha', lenderPhone: '9876543210', eventDate: '2026-10-10' });
  assert.ok(t.length <= 200, `too long: ${t.length}`);
  assert.equal(cleanSmsText('a\n\nb   c'), 'a b c');
});

test('without Twilio configured, SMS is skipped, never thrown', async () => {
  const r = await sendSms('9876543210', 'hi');
  assert.equal(r.status, 'skipped');
  assert.equal((await sendSms('bad', 'hi')).status, 'skipped');
});

test('Twilio request is well-formed, and trial errors are explained', async () => {
  const saved = { ...process.env };
  const realFetch = globalThis.fetch;
  Object.assign(process.env, { TWILIO_ACCOUNT_SID: 'AC123', TWILIO_AUTH_TOKEN: 'tok', TWILIO_FROM_NUMBER: '+15550001111' });
  let seen;
  try {
    globalThis.fetch = async (url, opts) => {
      seen = { url, opts };
      return new Response(JSON.stringify({ sid: 'SM1' }), { status: 201 });
    };
    assert.equal((await sendSms('98765 43210', 'Hello\nthere')).status, 'sent');
    assert.ok(seen.url.endsWith('/Accounts/AC123/Messages.json'));
    const form = new URLSearchParams(seen.opts.body);
    assert.equal(form.get('To'), '+919876543210');
    assert.equal(form.get('From'), '+15550001111');
    assert.equal(form.get('Body'), 'Hello there');
    assert.equal(seen.opts.headers.Authorization, 'Basic ' + Buffer.from('AC123:tok').toString('base64'));

    globalThis.fetch = async () => new Response(JSON.stringify({ code: 21608, message: 'unverified' }), { status: 400 });
    const r = await sendSms('98765 43210', 'hi');
    assert.equal(r.status, 'failed');
    assert.equal(r.reason, 'number not verified in Twilio trial');

    globalThis.fetch = async () => { throw new Error('down'); };
    assert.equal((await sendSms('98765 43210', 'hi')).status, 'failed');
  } finally {
    globalThis.fetch = realFetch;
    process.env = saved;
  }
});
