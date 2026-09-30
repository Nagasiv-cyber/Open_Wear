// Chennai neighbourhoods with approximate centre coordinates.
// Aliases are the ways people actually type these names.
export const AREAS = [
  { id: 'rec-thandalam', name: 'REC Thandalam', lat: 13.0105, lng: 80.0035, aliases: ['rec', 'rajalakshmi', 'thandalam', 'rec campus'] },
  { id: 'poonamallee', name: 'Poonamallee', lat: 13.0473, lng: 80.0945, aliases: ['poonamallee', 'poonamalli'] },
  { id: 'porur', name: 'Porur', lat: 13.0382, lng: 80.1565, aliases: ['porur'] },
  { id: 'anna-nagar', name: 'Anna Nagar', lat: 13.085, lng: 80.2101, aliases: ['anna nagar', 'annanagar'] },
  { id: 'kodambakkam', name: 'Kodambakkam', lat: 13.05, lng: 80.221, aliases: ['kodambakkam'] },
  { id: 't-nagar', name: 'T. Nagar', lat: 13.0418, lng: 80.2341, aliases: ['t nagar', 't. nagar', 'tnagar', 't.nagar', 'thyagaraya nagar'] },
  { id: 'nungambakkam', name: 'Nungambakkam', lat: 13.0569, lng: 80.2425, aliases: ['nungambakkam'] },
  { id: 'mylapore', name: 'Mylapore', lat: 13.0368, lng: 80.2676, aliases: ['mylapore'] },
  { id: 'guindy', name: 'Guindy', lat: 13.0067, lng: 80.2206, aliases: ['guindy'] },
  { id: 'adyar', name: 'Adyar', lat: 13.0012, lng: 80.2565, aliases: ['adyar'] },
  { id: 'besant-nagar', name: 'Besant Nagar', lat: 13.0003, lng: 80.2667, aliases: ['besant nagar', 'besantnagar', 'bessie'] },
  { id: 'velachery', name: 'Velachery', lat: 12.9815, lng: 80.218, aliases: ['velachery'] },
  { id: 'chromepet', name: 'Chromepet', lat: 12.9516, lng: 80.1462, aliases: ['chromepet', 'chrompet'] },
  { id: 'tambaram', name: 'Tambaram', lat: 12.9249, lng: 80.1, aliases: ['tambaram'] },
  { id: 'sholinganallur', name: 'Sholinganallur (OMR)', lat: 12.901, lng: 80.2279, aliases: ['sholinganallur', 'omr'] },
];

export const DEFAULT_AREA_ID = 'rec-thandalam';

export function getArea(id) {
  return AREAS.find((a) => a.id === id) || null;
}

// Great-circle distance in km between two lat/lng points.
export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
