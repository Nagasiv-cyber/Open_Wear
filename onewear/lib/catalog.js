// Shared vocabulary: every listing, parser result and form uses these values.
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const OCCASIONS = {
  wedding: 'Wedding & functions',
  interview: 'Interview & placements',
  party: 'Party',
  photoshoot: 'Photoshoot',
  college: 'College event',
  festival: 'Festival',
};

// Occasions that are "close enough" to each other for a partial match.
export const RELATED_OCCASIONS = {
  wedding: ['festival'],
  festival: ['wedding', 'college'],
  college: ['festival', 'party'],
  party: ['photoshoot', 'college'],
  photoshoot: ['party'],
  interview: [],
};

export const STYLES = {
  minimal: 'Subtle',
  bold: 'Bold',
  traditional: 'Traditional',
  modern: 'Modern',
  formal: 'Formal',
};

export const CATEGORIES = {
  saree: { label: 'Saree', pattern: 'drape' },
  'half-saree': { label: 'Half saree', pattern: 'drape' },
  lehenga: { label: 'Lehenga', pattern: 'motif' },
  anarkali: { label: 'Anarkali', pattern: 'motif' },
  gown: { label: 'Gown', pattern: 'sheen' },
  dress: { label: 'Dress', pattern: 'sheen' },
  sherwani: { label: 'Sherwani', pattern: 'motif' },
  'kurta-set': { label: 'Kurta set', pattern: 'check' },
  'veshti-set': { label: 'Veshti & shirt', pattern: 'drape' },
  'blazer-suit': { label: 'Blazer suit', pattern: 'pinstripe' },
  'formal-set': { label: 'Formal set', pattern: 'pinstripe' },
  'indo-western': { label: 'Indo-western', pattern: 'check' },
};

export const GENDERS = { women: 'Women', men: 'Men', unisex: 'Anyone' };

// Rough, conservative per-garment manufacturing footprint used for the
// "impact" estimate. These are order-of-magnitude figures, shown to users
// as estimates, not measurements.
export const IMPACT = {
  saree: { water: 3000, co2: 7 },
  'half-saree': { water: 3500, co2: 8 },
  lehenga: { water: 6000, co2: 14 },
  anarkali: { water: 4500, co2: 10 },
  gown: { water: 4000, co2: 11 },
  dress: { water: 2700, co2: 8 },
  sherwani: { water: 5500, co2: 13 },
  'kurta-set': { water: 3000, co2: 7 },
  'veshti-set': { water: 2500, co2: 5 },
  'blazer-suit': { water: 4500, co2: 18 },
  'formal-set': { water: 3000, co2: 9 },
  'indo-western': { water: 4000, co2: 10 },
};
