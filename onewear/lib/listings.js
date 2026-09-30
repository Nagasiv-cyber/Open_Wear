// Seed inventory for the prototype: realistic outfits listed by people
// across Chennai. bookedIn = days from today on which the outfit is already
// booked for someone else's event, so availability works on any demo date.
import { addDays } from './dates.js';

// [id, title, category, gender, sizes, occasions, styles, colors, price, deposit, retail, area, lender, verified, bookedIn]
const ROWS = [
  ['ow-001', 'Kanjivaram silk in temple red', 'saree', 'women', ['S', 'M', 'L'], ['wedding', 'festival'], ['traditional', 'bold'], ['#9E1B32', '#D4A017'], 650, 2000, 18000, 'mylapore', 'Lakshmi R.', true, [2, 12]],
  ['ow-002', 'Pastel organza with silver border', 'saree', 'women', ['S', 'M'], ['wedding', 'party', 'photoshoot'], ['minimal', 'modern'], ['#E8C5D0', '#C0C0C8'], 450, 1500, 7500, 't-nagar', 'Priya S.', true, [5]],
  ['ow-003', 'Mint Chanderi cotton', 'saree', 'women', ['M', 'L', 'XL'], ['college', 'festival', 'interview'], ['minimal', 'traditional'], ['#A8D5BA', '#F2E6C9'], 250, 800, 3200, 'porur', 'Divya K.', false, []],
  ['ow-004', 'Peacock blue soft silk', 'saree', 'women', ['S', 'M', 'L'], ['wedding', 'festival', 'college'], ['traditional'], ['#0E5E6F', '#C9A227'], 400, 1500, 9000, 'rec-thandalam', 'Harini V.', true, [1]],
  ['ow-005', 'Black georgette with sequin pallu', 'saree', 'women', ['XS', 'S', 'M'], ['party', 'photoshoot', 'college'], ['bold', 'modern'], ['#1A1A22', '#B8B8C8'], 500, 1500, 8500, 'anna-nagar', 'Meera J.', true, []],
  ['ow-006', 'Mustard half saree set', 'half-saree', 'women', ['XS', 'S', 'M'], ['festival', 'college', 'photoshoot'], ['traditional', 'bold'], ['#D9A21B', '#7A1F3D'], 550, 1500, 9500, 'tambaram', 'Swetha M.', true, [3]],
  ['ow-007', 'Lavender half saree with zari', 'half-saree', 'women', ['S', 'M'], ['festival', 'wedding'], ['traditional', 'minimal'], ['#B7A6D6', '#E0C068'], 500, 1500, 8800, 'rec-thandalam', 'Keerthana P.', false, []],
  ['ow-008', 'Wine velvet bridal-guest lehenga', 'lehenga', 'women', ['S', 'M', 'L'], ['wedding', 'party'], ['bold', 'traditional'], ['#5E1224', '#D4A017'], 1200, 4000, 32000, 'nungambakkam', 'Aishwarya N.', true, [4, 9]],
  ['ow-009', 'Powder blue floral lehenga', 'lehenga', 'women', ['XS', 'S', 'M'], ['wedding', 'photoshoot', 'party'], ['minimal', 'modern'], ['#AFCBE3', '#F5D6E0'], 900, 3000, 21000, 'adyar', 'Nandhini R.', true, []],
  ['ow-010', 'Emerald mirror-work lehenga', 'lehenga', 'women', ['M', 'L', 'XL'], ['wedding', 'festival'], ['bold', 'traditional'], ['#0B6E4F', '#E8C547'], 1000, 3500, 26000, 'velachery', 'Sangeetha B.', false, [6]],
  ['ow-011', 'Peach sangeet lehenga', 'lehenga', 'women', ['S', 'M'], ['wedding', 'party'], ['minimal', 'modern'], ['#F4B89B', '#FFF0E1'], 800, 2500, 17500, 'rec-thandalam', 'Janani T.', true, []],
  ['ow-012', 'Maroon floor-length anarkali', 'anarkali', 'women', ['M', 'L', 'XL', 'XXL'], ['wedding', 'festival', 'party'], ['traditional', 'bold'], ['#6D1A36', '#D8B26E'], 600, 2000, 12000, 'anna-nagar', 'Fathima Z.', true, [2]],
  ['ow-013', 'Ivory chikankari anarkali', 'anarkali', 'women', ['S', 'M', 'L'], ['festival', 'college', 'wedding'], ['minimal', 'traditional'], ['#F3EEDF', '#C9B99A'], 450, 1500, 8000, 'kodambakkam', 'Riya D.', false, []],
  ['ow-014', 'Midnight blue satin gown', 'gown', 'women', ['S', 'M', 'L'], ['party', 'photoshoot'], ['bold', 'modern'], ['#1B2A5C', '#7C8CC4'], 700, 2500, 14000, 'besant-nagar', 'Tanya G.', true, []],
  ['ow-015', 'Blush tulle prom gown', 'gown', 'women', ['XS', 'S', 'M'], ['party', 'photoshoot', 'college'], ['minimal', 'modern'], ['#F2C4CE', '#FFFFFF'], 600, 2000, 11000, 'poonamallee', 'Sneha A.', false, [8]],
  ['ow-016', 'Little black cocktail dress', 'dress', 'women', ['XS', 'S', 'M', 'L'], ['party', 'college'], ['modern', 'minimal'], ['#141418', '#3A3A44'], 300, 1000, 4500, 'guindy', 'Ananya K.', true, []],
  ['ow-017', 'Sunflower midi dress', 'dress', 'women', ['S', 'M', 'L'], ['photoshoot', 'party', 'college'], ['bold', 'modern'], ['#F2B90F', '#FFFFFF'], 250, 800, 3500, 'rec-thandalam', 'Pooja L.', false, []],
  ['ow-018', 'Charcoal women\'s blazer suit', 'blazer-suit', 'women', ['XS', 'S', 'M', 'L'], ['interview'], ['formal', 'minimal'], ['#3B3F46', '#8A8F98'], 350, 1500, 7500, 'sholinganallur', 'Kavya H.', true, [1]],
  ['ow-019', 'Navy trouser and blazer set', 'formal-set', 'women', ['S', 'M', 'L', 'XL'], ['interview', 'college'], ['formal', 'minimal'], ['#1F2A44', '#E6E8EE'], 300, 1200, 6000, 'rec-thandalam', 'Deepika S.', true, []],
  ['ow-020', 'Beige formal set', 'formal-set', 'women', ['M', 'L'], ['interview'], ['formal', 'minimal'], ['#CDB99A', '#FFFFFF'], 280, 1000, 5200, 'porur', 'Varsha N.', false, []],
  ['ow-021', 'Ivory and gold sherwani', 'sherwani', 'men', ['M', 'L', 'XL'], ['wedding'], ['traditional', 'bold'], ['#F1E7D0', '#C9A227'], 1100, 4000, 28000, 't-nagar', 'Arjun M.', true, [3, 10]],
  ['ow-022', 'Bottle green velvet sherwani', 'sherwani', 'men', ['L', 'XL', 'XXL'], ['wedding', 'party'], ['bold', 'traditional'], ['#12402E', '#C49A3A'], 1000, 3500, 24000, 'anna-nagar', 'Rahul V.', false, []],
  ['ow-023', 'Navy bandhgala sherwani', 'sherwani', 'men', ['S', 'M', 'L'], ['wedding', 'festival'], ['minimal', 'traditional'], ['#1C2951', '#B0B6C8'], 900, 3000, 19000, 'rec-thandalam', 'Karthik R.', true, []],
  ['ow-024', 'Silk veshti with cream shirt', 'veshti-set', 'men', ['M', 'L', 'XL', 'XXL'], ['wedding', 'festival', 'college'], ['traditional', 'minimal'], ['#FFFDF5', '#D4A017'], 250, 800, 3500, 'mylapore', 'Senthil K.', true, [2]],
  ['ow-025', 'Jari-border veshti set', 'veshti-set', 'men', ['S', 'M', 'L'], ['festival', 'college', 'wedding'], ['traditional'], ['#FAF6EA', '#B8860B'], 200, 600, 2800, 'rec-thandalam', 'Vignesh P.', false, []],
  ['ow-026', 'Mustard kurta with white churidar', 'kurta-set', 'men', ['S', 'M', 'L', 'XL'], ['festival', 'college', 'wedding'], ['traditional', 'bold'], ['#D9A21B', '#FFFFFF'], 250, 800, 3200, 'chromepet', 'Sanjay T.', true, []],
  ['ow-027', 'Black kurta with Nehru jacket', 'kurta-set', 'men', ['M', 'L', 'XL'], ['party', 'wedding', 'college'], ['modern', 'bold'], ['#16161C', '#8B6B3E'], 400, 1200, 6500, 'velachery', 'Aravind S.', true, [4]],
  ['ow-028', 'Pastel pink kurta set', 'kurta-set', 'unisex', ['S', 'M', 'L'], ['festival', 'photoshoot', 'wedding'], ['minimal', 'modern'], ['#F2C6CF', '#FFF6F0'], 300, 1000, 4200, 'adyar', 'Rohan B.', false, []],
  ['ow-029', 'Charcoal two-piece suit', 'blazer-suit', 'men', ['M', 'L', 'XL'], ['interview', 'party'], ['formal', 'minimal'], ['#34373D', '#6E737C'], 450, 2000, 12000, 'nungambakkam', 'Vikram A.', true, [1, 7]],
  ['ow-030', 'Navy slim-fit suit', 'blazer-suit', 'men', ['S', 'M', 'L'], ['interview', 'party', 'college'], ['formal', 'modern'], ['#1A2748', '#5A6E9C'], 400, 1800, 10500, 'rec-thandalam', 'Hari K.', true, []],
  ['ow-031', 'Grey blazer with chinos', 'blazer-suit', 'men', ['M', 'L', 'XL', 'XXL'], ['interview', 'college'], ['formal', 'minimal'], ['#8A8D93', '#D8CBB0'], 300, 1200, 6800, 'guindy', 'Naveen J.', false, []],
  ['ow-032', 'Maroon tuxedo', 'blazer-suit', 'men', ['M', 'L'], ['party', 'photoshoot'], ['bold', 'modern'], ['#5A0F20', '#141418'], 600, 2500, 15000, 'besant-nagar', 'Aditya G.', true, []],
  ['ow-033', 'Indo-western asymmetric jacket set', 'indo-western', 'men', ['S', 'M', 'L'], ['party', 'wedding', 'photoshoot'], ['modern', 'bold'], ['#2E3A59', '#C9A227'], 700, 2500, 14000, 'kodambakkam', 'Sidharth N.', true, [5]],
  ['ow-034', 'Olive indo-western set', 'indo-western', 'women', ['S', 'M', 'L'], ['party', 'college', 'photoshoot'], ['modern', 'minimal'], ['#5F6B3A', '#E9E2CC'], 450, 1500, 7800, 'tambaram', 'Gayathri E.', false, []],
  ['ow-035', 'Rust cotton kurta', 'kurta-set', 'men', ['M', 'L', 'XL'], ['college', 'festival'], ['minimal', 'traditional'], ['#A5472A', '#F2E6D8'], 180, 500, 2200, 'poonamallee', 'Manoj R.', true, []],
  ['ow-036', 'Rani pink Banarasi', 'saree', 'women', ['M', 'L', 'XL', 'XXL'], ['wedding', 'festival'], ['bold', 'traditional'], ['#C2185B', '#D4A017'], 700, 2500, 20000, 'velachery', 'Revathi S.', true, []],
];

export function getSeedListings(todayIso) {
  return ROWS.map(([id, title, category, gender, sizes, occasions, styles, colors, price, deposit, retailPrice, areaId, lenderName, verified, bookedIn]) => ({
    id, title, category, gender, sizes, occasions, styles, colors,
    price, deposit, retailPrice, areaId,
    lender: { name: lenderName, verified },
    bookedDates: bookedIn.map((n) => addDays(todayIso, n)),
    source: 'seed',
  }));
}
