import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, parseDate, parseBudget, parseStyles } from '../lib/parser.js';

const TODAY = '2026-09-29'; // a Tuesday

test('parses a full natural-language request', () => {
  const q = parseQuery("Friend's wedding sangeet in Anna Nagar next Saturday, I'm M size, budget ₹800, nothing too loud", TODAY);
  assert.equal(q.occasion, 'wedding');
  assert.equal(q.size, 'M');
  assert.equal(q.budget, 800);
  assert.equal(q.date, '2026-10-03');
  assert.equal(q.areaId, 'anna-nagar');
  assert.deepEqual(q.styles, ['minimal']);
});

test('"not too loud" does not count as bold', () => {
  assert.deepEqual(parseStyles('something not too loud'), ['minimal']);
});

test('pre-wedding shoot is a photoshoot, not a wedding', () => {
  assert.equal(parseQuery('pre-wedding shoot in Adyar', TODAY).occasion, 'photoshoot');
});

test('relative and absolute dates', () => {
  assert.equal(parseDate('tomorrow', TODAY), '2026-09-30');
  assert.equal(parseDate('in 5 days', TODAY), '2026-10-04');
  assert.equal(parseDate('on 12th Oct', TODAY), '2026-10-12');
  assert.equal(parseDate('Jan 3', TODAY), '2027-01-03');
  assert.equal(parseDate('31 feb', TODAY), null);
});

test('budget formats', () => {
  assert.equal(parseBudget('under 2k'), 2000);
  assert.equal(parseBudget('rs 1,500'), 1500);
  assert.equal(parseBudget('600 rupees'), 600);
  assert.equal(parseBudget('size 5'), null);
});

test('garment words imply gender', () => {
  assert.equal(parseQuery('need a sherwani', TODAY).gender, 'men');
  assert.equal(parseQuery('need a half saree', TODAY).categories[0], 'half-saree');
});
