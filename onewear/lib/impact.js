import { IMPACT } from './catalog.js';

// Rough savings from renting instead of buying new.
export function impactFor(category) {
  return IMPACT[category] || { water: 2500, co2: 6 };
}
