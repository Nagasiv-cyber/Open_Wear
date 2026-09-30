// Explainable matching. Every result carries a per-factor breakdown so the
// user (and a judge) can see exactly why an outfit ranked where it did.
import { getArea, haversineKm, DEFAULT_AREA_ID } from './areas.js';
import { RELATED_OCCASIONS, SIZES, OCCASIONS, STYLES } from './catalog.js';
import { diffDays } from './dates.js';

export const WEIGHTS = { occasion: 0.3, size: 0.25, distance: 0.2, budget: 0.15, style: 0.1 };

// An outfit is blocked from 1 day before an event (handover) to 2 days after
// (return + dry-cleaning). Two events clash if their blocked windows overlap,
// i.e. if they are within 3 days of each other.
export const BUFFER = { before: 1, after: 2 };
const CLASH_DAYS = BUFFER.before + BUFFER.after;

const NEUTRAL = 0.7; // score used when the user didn't specify a factor
const MAX_KM = 25;   // beyond this, distance score bottoms out

export function isAvailable(listing, dateIso) {
  if (!dateIso) return true;
  return !listing.bookedDates.some((b) => Math.abs(diffDays(dateIso, b)) <= CLASH_DAYS);
}

function occasionScore(listing, occasion) {
  if (!occasion) return { score: NEUTRAL };
  if (listing.occasions.includes(occasion)) return { score: 1, reason: `Made for ${OCCASIONS[occasion].toLowerCase()}` };
  if (listing.occasions.some((o) => RELATED_OCCASIONS[occasion]?.includes(o))) return { score: 0.5 };
  return { score: 0 };
}

function sizeScore(listing, size) {
  if (!size) return { score: NEUTRAL };
  if (listing.sizes.includes(size)) return { score: 1, reason: `Your size (${size})` };
  const i = SIZES.indexOf(size);
  const near = listing.sizes.some((s) => Math.abs(SIZES.indexOf(s) - i) === 1);
  return near ? { score: 0.4, reason: 'One size off, may need alteration' } : { score: 0 };
}

function distanceScore(listing, areaId) {
  const from = getArea(areaId || DEFAULT_AREA_ID);
  const to = getArea(listing.areaId);
  if (!from || !to) return { score: NEUTRAL, km: null };
  const km = haversineKm(from, to);
  const score = Math.max(0, 1 - km / MAX_KM);
  return { score, km, reason: km < 0.5 ? 'Right near you' : km < 3 ? `${km.toFixed(1)} km away` : null };
}

function budgetScore(listing, budget) {
  if (!budget) return { score: NEUTRAL };
  if (listing.price <= budget) return { score: 1, reason: 'Within budget' };
  const over = (listing.price - budget) / budget;
  return { score: Math.max(0, 1 - over * 4) }; // 25% over budget -> 0
}

function styleScore(listing, styles, categories) {
  const parts = [];
  let reason = null;
  if (styles?.length) {
    const hits = styles.filter((s) => listing.styles.includes(s));
    parts.push(hits.length / styles.length);
    if (hits.length) reason = `${STYLES[hits[0]]} look`;
  }
  if (categories?.length) {
    const hit = categories.includes(listing.category);
    parts.push(hit ? 1 : 0);
  }
  if (!parts.length) return { score: NEUTRAL };
  return { score: parts.reduce((a, b) => a + b, 0) / parts.length, reason };
}

export function scoreListing(listing, q) {
  const f = {
    occasion: occasionScore(listing, q.occasion),
    size: sizeScore(listing, q.size),
    distance: distanceScore(listing, q.areaId),
    budget: budgetScore(listing, q.budget),
    style: styleScore(listing, q.styles, q.categories),
  };
  const total = Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * f[k].score, 0);
  const breakdown = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const reasons = Object.values(f).map((v) => v.reason).filter(Boolean);
  return {
    score: Math.round(total * 100),
    breakdown,
    reasons,
    distanceKm: f.distance.km == null ? null : Math.round(f.distance.km * 10) / 10,
  };
}

export function rankListings(listings, q, { limit = 12 } = {}) {
  const excluded = { unavailable: 0, gender: 0 };
  const ranked = [];
  for (const l of listings) {
    if (q.gender && l.gender !== 'unisex' && l.gender !== q.gender) { excluded.gender++; continue; }
    if (!isAvailable(l, q.date)) { excluded.unavailable++; continue; }
    ranked.push({ listing: l, ...scoreListing(l, q) });
  }
  ranked.sort((a, b) => b.score - a.score || (a.distanceKm ?? 99) - (b.distanceKm ?? 99) || a.listing.price - b.listing.price);
  return { results: ranked.slice(0, limit), excluded, considered: listings.length };
}
