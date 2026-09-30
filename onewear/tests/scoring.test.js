import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAvailable, rankListings, scoreListing } from '../lib/scoring.js';
import { getSeedListings } from '../lib/listings.js';
import { validateListing, sanitizeQuery } from '../lib/validate.js';

const TODAY = '2026-09-29';
const base = {
  id: 't1', title: 'Test', category: 'saree', gender: 'women', sizes: ['M'], occasions: ['wedding'],
  styles: ['minimal'], colors: ['#000000', '#ffffff'], price: 500, deposit: 1000, retailPrice: 5000,
  areaId: 'rec-thandalam', lender: { name: 'A', verified: true }, bookedDates: ['2026-10-10'],
};

test('cleaning buffer blocks nearby dates only', () => {
  assert.equal(isAvailable(base, '2026-10-07'), false);
  assert.equal(isAvailable(base, '2026-10-13'), false);
  assert.equal(isAvailable(base, '2026-10-06'), true);
  assert.equal(isAvailable(base, '2026-10-14'), true);
});

test('a perfect match scores 100', () => {
  const r = scoreListing(base, { occasion: 'wedding', size: 'M', budget: 600, areaId: 'rec-thandalam', styles: ['minimal'], categories: ['saree'] });
  assert.equal(r.score, 100);
});

test('wrong size ranks below right size', () => {
  const q = { occasion: 'wedding', size: 'M' };
  const right = scoreListing(base, q).score;
  const wrong = scoreListing({ ...base, sizes: ['XXL'] }, q).score;
  assert.ok(right > wrong);
});

test('gender filter and availability exclusions are counted', () => {
  const listings = getSeedListings(TODAY);
  const { results, excluded } = rankListings(listings, sanitizeQuery({ gender: 'men', date: '2026-10-01' }));
  assert.ok(results.every((r) => r.listing.gender !== 'women'));
  assert.ok(excluded.gender > 0);
});

test('invalid query values are dropped, not trusted', () => {
  const q = sanitizeQuery({ size: 'HUGE', budget: -5, areaId: '../etc', date: '2026-13-40', styles: ['bold', 'evil'] });
  assert.deepEqual(q, { occasion: null, size: null, budget: null, date: null, areaId: null, gender: null, styles: ['bold'], categories: [] });
});

test('listing validation rejects bad input and strips markup', () => {
  assert.equal(validateListing({}).ok, false);
  const ok = validateListing({ title: '<b>Silk</b> saree', category: 'saree', gender: 'women', sizes: ['M'], occasions: ['wedding'], price: 400, deposit: 1000, areaId: 'adyar', lenderName: 'Asha', lenderPhone: '9876543210' });
  assert.equal(ok.ok, true);
  assert.equal(ok.listing.title, 'bSilk/b saree');
});
