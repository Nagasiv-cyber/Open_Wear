// Server-side validation shared by every API route. Never trust the client.
import { AREAS } from './areas.js';
import { SIZES, OCCASIONS, STYLES, CATEGORIES, GENDERS } from './catalog.js';
import { isIsoDate, addDays } from './dates.js';

const HEX = /^#[0-9a-f]{6}$/i;
const PHONE_RE = /^(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;
const MAX_PHOTO_BYTES = 700 * 1024; // the browser shrinks photos well below this

// Checks a photo sent as a data URL ("data:image/jpeg;base64,...").
// Looks at the file's first bytes, not just its label, so a renamed
// non-image can't get through.
export function parsePhoto(dataUrl) {
  if (typeof dataUrl !== 'string') return { ok: false, error: 'Photo must be an image.' };
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return { ok: false, error: 'Use a JPG, PNG or WebP photo.' };
  const bytes = Buffer.from(m[2], 'base64');
  if (bytes.length > MAX_PHOTO_BYTES) return { ok: false, error: 'Photo is too large. Try a smaller one.' };
  const b = bytes;
  const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const isWebp = b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP';
  const mime = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebp ? 'image/webp' : null;
  if (!mime) return { ok: false, error: 'That file is not a valid image.' };
  return { ok: true, mime, bytes, dataUrl: `data:${mime};base64,${m[2]}` };
}
const clean = (s, max) => String(s ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const inEnum = (v, obj) => typeof v === 'string' && Object.prototype.hasOwnProperty.call(obj, v);
const areaIds = new Set(AREAS.map((a) => a.id));

// Cleans a parsed/edited query. Unknown or invalid values become null
// instead of throwing, so one bad field never breaks the search.
export function sanitizeQuery(q = {}) {
  const budget = Number(q.budget);
  return {
    occasion: inEnum(q.occasion, OCCASIONS) ? q.occasion : null,
    size: SIZES.includes(q.size) ? q.size : null,
    budget: Number.isFinite(budget) && budget >= 50 && budget <= 100000 ? Math.round(budget) : null,
    date: isIsoDate(q.date) ? q.date : null,
    areaId: areaIds.has(q.areaId) ? q.areaId : null,
    gender: q.gender === 'women' || q.gender === 'men' ? q.gender : null,
    styles: Array.isArray(q.styles) ? [...new Set(q.styles.filter((s) => inEnum(s, STYLES)))].slice(0, 5) : [],
    categories: Array.isArray(q.categories) ? [...new Set(q.categories.filter((c) => inEnum(c, CATEGORIES)))].slice(0, 5) : [],
  };
}

// requirePhone is set by the server, never by the request: new listings need
// a phone for SMS; listings re-checked from browser storage don't carry one.
export function validateListing(input = {}, { requirePhone = true } = {}) {
  const errors = {};
  const title = clean(input.title, 80);
  if (title.length < 4) errors.title = 'Give the outfit a name of at least 4 characters.';
  if (!inEnum(input.category, CATEGORIES)) errors.category = 'Pick a category.';
  if (!inEnum(input.gender, GENDERS)) errors.gender = 'Pick who it fits.';
  const sizes = Array.isArray(input.sizes) ? SIZES.filter((s) => input.sizes.includes(s)) : [];
  if (!sizes.length) errors.sizes = 'Select at least one size.';
  const occasions = Array.isArray(input.occasions) ? Object.keys(OCCASIONS).filter((o) => input.occasions.includes(o)) : [];
  if (!occasions.length) errors.occasions = 'Select at least one occasion.';
  const styles = Array.isArray(input.styles) ? Object.keys(STYLES).filter((s) => input.styles.includes(s)) : [];
  const price = Math.round(Number(input.price));
  if (!Number.isFinite(price) || price < 50 || price > 20000) errors.price = 'Rental price must be between ₹50 and ₹20,000.';
  const deposit = Math.round(Number(input.deposit));
  if (!Number.isFinite(deposit) || deposit < 0 || deposit > 50000) errors.deposit = 'Deposit must be between ₹0 and ₹50,000.';
  const retailPrice = Math.round(Number(input.retailPrice) || 0);
  if (!areaIds.has(input.areaId)) errors.areaId = 'Pick your area.';
  const lenderName = clean(input.lenderName, 40);
  if (lenderName.length < 2) errors.lenderName = 'Enter your name.';
  const lenderPhone = clean(input.lenderPhone, 20);
  if (requirePhone && !PHONE_RE.test(lenderPhone)) {
    errors.lenderPhone = 'Enter a valid 10-digit mobile number. Borrowers see it only after you accept.';
  }
  let photo = null;
  if (input.photo) {
    photo = parsePhoto(input.photo);
    if (!photo.ok) errors.photo = photo.error;
  }
  const colors = Array.isArray(input.colors) && input.colors.length === 2 && input.colors.every((c) => HEX.test(c))
    ? input.colors : ['#1E2A5A', '#E9A21B'];
  const id = typeof input.id === 'string' && /^local-[a-z0-9-]{4,40}$/.test(input.id) ? input.id : null;

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    listing: {
      id: id || `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      title, category: input.category, gender: input.gender, sizes, occasions,
      styles: styles.length ? styles : ['minimal'], colors, price, deposit,
      retailPrice: retailPrice > 0 ? retailPrice : price * 10,
      areaId: input.areaId,
      lender: { name: lenderName, verified: false },
      photoUrl: photo?.ok ? photo.dataUrl : null,
      bookedDates: [],
      source: 'local',
    },
    // Kept apart from the listing so it is never echoed back to browsers.
    private: { lenderPhone: PHONE_RE.test(lenderPhone) ? lenderPhone : null, photo: photo?.ok ? photo : null },
  };
}

const PHONE = /^(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;
const LISTING_ID = /^(ow-\d{3}|local-[a-z0-9-]{4,40})$/;

// Validates a rental request. todayIso anchors the allowed date range:
// the event must be at least 1 day away (pickup happens the day before).
export function validateRequest(input = {}, todayIso) {
  const errors = {};
  if (typeof input.listingId !== 'string' || !LISTING_ID.test(input.listingId)) errors.listingId = 'Unknown outfit.';
  if (!isIsoDate(input.eventDate)) errors.eventDate = 'Pick a valid event date.';
  else if (input.eventDate < addDays(todayIso, 1)) errors.eventDate = 'The event must be at least a day away so you can pick it up.';
  else if (input.eventDate > addDays(todayIso, 365)) errors.eventDate = 'Pick a date within the next year.';
  const borrowerName = clean(input.borrowerName, 40);
  if (borrowerName.length < 2) errors.borrowerName = 'Enter your name.';
  const borrowerContact = clean(input.borrowerContact, 20);
  if (!PHONE.test(borrowerContact)) errors.borrowerContact = 'Enter a valid 10-digit Indian mobile number.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { listingId: input.listingId, eventDate: input.eventDate, borrowerName, borrowerContact } };
}
