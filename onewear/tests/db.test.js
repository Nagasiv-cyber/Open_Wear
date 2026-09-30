import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyBookings, rowToRequest, rowToListing, listingToRow } from '../lib/db.js';
import { hashKey } from '../lib/identity.js';
import { validateRequest } from '../lib/validate.js';

const TODAY = '2026-09-29';

test('accepted bookings are added to the right listing only', () => {
  const listings = [{ id: 'a', bookedDates: ['2026-10-01'] }, { id: 'b', bookedDates: [] }];
  const out = applyBookings(listings, [{ listing_id: 'a', event_date: '2026-10-20' }]);
  assert.deepEqual(out[0].bookedDates, ['2026-10-01', '2026-10-20']);
  assert.deepEqual(out[1].bookedDates, []);
});

test('borrower phone is hidden until the lender accepts', () => {
  const row = { id: 'r', listing_id: 'a', listing_snapshot: {}, event_date: TODAY, status: 'pending', borrower_name: 'P', borrower_contact: '9876543210' };
  assert.equal(rowToRequest(row, 'lender').borrowerContact, null);
  assert.equal(rowToRequest({ ...row, status: 'accepted' }, 'lender').borrowerContact, '9876543210');
  assert.equal(rowToRequest({ ...row, status: 'accepted' }, 'borrower').borrowerContact, null);
});

test('listing survives a round trip through the database shape', () => {
  const l = { id: 'local-abcd', title: 'Test saree', category: 'saree', gender: 'women', sizes: ['M'], occasions: ['wedding'], styles: ['minimal'], colors: ['#000000', '#ffffff'], price: 300, deposit: 900, retailPrice: 3000, areaId: 'adyar', lender: { name: 'A' } };
  const back = rowToListing(listingToRow(l, 'hash1'), 'hash1');
  assert.equal(back.title, l.title);
  assert.equal(back.retailPrice, 3000);
  assert.equal(back.mine, true);
  assert.equal(rowToListing(listingToRow(l, 'hash1'), 'other').mine, false);
});

test('device keys are stored only as a hash', () => {
  const h = hashKey('abc');
  assert.equal(h.length, 64);
  assert.notEqual(h, 'abc');
  assert.equal(hashKey('abc'), h);
});

test('request validation', () => {
  assert.equal(validateRequest({ listingId: 'ow-001', eventDate: '2026-10-03', borrowerName: 'Asha', borrowerContact: '+91 98765 43210' }, TODAY).ok, true);
  const bad = validateRequest({ listingId: "'; drop table", eventDate: TODAY, borrowerName: '', borrowerContact: '12345' }, TODAY);
  assert.equal(bad.ok, false);
  assert.deepEqual(Object.keys(bad.errors).sort(), ['borrowerContact', 'borrowerName', 'eventDate', 'listingId']);
});
