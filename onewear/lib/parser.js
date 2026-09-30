// Turns a sentence like
//   "friend's sangeet in Anna Nagar next Saturday, size M, under ₹800, nothing too loud"
// into structured search fields. This rule-based parser always runs; an
// optional LLM (lib/llm.js) can refine it, but the app never depends on it.
import { AREAS } from './areas.js';
import { SIZES, CATEGORIES } from './catalog.js';
import { addDays, isIsoDate, toDate, toIso } from './dates.js';

const OCCASION_WORDS = {
  photoshoot: ['pre-wedding', 'photoshoot', 'photo shoot', 'portfolio shoot', 'shoot'],
  wedding: ['wedding', 'marriage', 'reception', 'sangeet', 'mehendi', 'mehndi', 'engagement', 'muhurtham', 'haldi', 'nischayathartham'],
  interview: ['interview', 'placement', 'internship', 'hr round', 'campus drive'],
  party: ['party', 'birthday', 'farewell', 'prom', 'cocktail', 'date night', 'dinner'],
  college: ['college', 'culturals', 'cultural', 'fest', 'symposium', 'ethnic day', 'traditional day', 'annual day', 'freshers', 'graduation', 'convocation', 'devfest', 'hackathon'],
  festival: ['diwali', 'deepavali', 'pongal', 'onam', 'navratri', 'golu', 'festival', 'puja', 'pooja', 'temple'],
};

const STYLE_WORDS = {
  minimal: ['not too loud', 'nothing too loud', 'not loud', 'subtle', 'minimal', 'simple', 'elegant', 'pastel', 'understated', 'sober', 'light colour', 'light color'],
  bold: ['bold', 'bright', 'loud', 'statement', 'flashy', 'heavy', 'grand', 'standout', 'stand out'],
  traditional: ['traditional', 'ethnic', 'classic', 'silk', 'kanjivaram', 'kanchipuram'],
  modern: ['modern', 'western', 'trendy', 'indo-western', 'fusion', 'contemporary', 'stylish'],
  formal: ['formal', 'professional', 'corporate', 'business'],
};

const CATEGORY_WORDS = {
  saree: ['saree', 'sari', 'kanjivaram', 'banarasi'],
  'half-saree': ['half saree', 'half-saree', 'pavadai', 'dhavani'],
  lehenga: ['lehenga', 'lehnga', 'ghagra'],
  anarkali: ['anarkali', 'churidar'],
  gown: ['gown'],
  dress: ['dress', 'midi', 'frock'],
  sherwani: ['sherwani', 'bandhgala'],
  'kurta-set': ['kurta', 'kurti', 'nehru jacket'],
  'veshti-set': ['veshti', 'vesti', 'dhoti', 'mundu'],
  'blazer-suit': ['blazer', 'suit', 'tuxedo', 'coat'],
  'formal-set': ['formal set', 'formals'],
  'indo-western': ['indo-western', 'indo western', 'fusion'],
};

const WOMEN_WORDS = ['women', 'woman', 'womens', 'girl', 'girls', 'female', 'ladies', 'lady', 'her', 'she'];
const MEN_WORDS = ['men', 'man', 'mens', 'guy', 'guys', 'boy', 'boys', 'male', 'gents'];
const WOMEN_CATS = ['saree', 'half-saree', 'lehenga', 'anarkali', 'gown', 'dress'];
const MEN_CATS = ['sherwani', 'veshti-set'];

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (w) => new RegExp(`(^|[^a-z])${escape(w)}(?=$|[^a-z])`, 'i');

// Returns the index of the first whole-word occurrence of `w` in `text`, or -1.
function findWord(text, w) {
  const m = wordRe(w).exec(text);
  return m ? m.index + m[1].length : -1;
}

export function parseOccasion(text) {
  let best = null;
  for (const [occasion, words] of Object.entries(OCCASION_WORDS)) {
    for (const w of words) {
      const i = findWord(text, w);
      if (i === -1) continue;
      // Earliest mention wins; on a tie, the longer (more specific) phrase wins.
      if (!best || i < best.index || (i === best.index && w.length > best.word.length)) {
        best = { occasion, index: i, word: w };
      }
    }
  }
  return best ? best.occasion : null;
}

export function parseSize(text) {
  const direct =
    /\bsize\s*[:\-]?\s*(xxl|xl|xs|s|m|l)\b/i.exec(text) ||
    /\b(xxl|xl|xs|s|m|l)\s*size\b/i.exec(text) ||
    /\b(XXL|XL|XS|M|L)\b/.exec(text);
  if (direct) return direct[1].toUpperCase();
  const words = /\b(?:i'?m|i am|wear|fit|size)\s+(?:a\s+)?(extra small|extra large|small|medium|large)\b/i.exec(text);
  if (words) {
    return { 'extra small': 'XS', small: 'S', medium: 'M', large: 'L', 'extra large': 'XL' }[words[1].toLowerCase()];
  }
  return null;
}

export function parseBudget(text) {
  const toNum = (raw, k) => {
    const n = parseFloat(raw.replace(/,/g, ''));
    return k ? Math.round(n * 1000) : Math.round(n);
  };
  const patterns = [
    /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(k)?\b/i,
    /\b([\d,]+(?:\.\d+)?)\s*(k)?\s*(?:rs|rupees|inr|₹|\/-)/i,
    /(?:budget|under|below|within|max|maximum|upto|up to|less than)\s*(?:of\s*|is\s*)?(?:₹|rs\.?)?\s*([\d,]+(?:\.\d+)?)\s*(k)?\b/i,
    /\b(\d+(?:\.\d+)?)\s*(k)\b/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) {
      const n = toNum(m[1], m[2]);
      if (n >= 50 && n <= 100000) return n;
    }
  }
  return null;
}

// Resolves phrases like "tomorrow", "next Saturday", "5th Oct" relative to todayIso.
export function parseDate(text, todayIso) {
  const t = text.toLowerCase();
  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(t);
  if (iso && isIsoDate(iso[1])) return iso[1];

  if (/\bday after tomorrow\b/.test(t)) return addDays(todayIso, 2);
  if (/\btomorrow\b/.test(t)) return addDays(todayIso, 1);
  if (/\b(today|tonight)\b/.test(t)) return todayIso;

  const inDays = /\bin\s+(\d{1,2})\s+days?\b/.exec(t);
  if (inDays) return addDays(todayIso, parseInt(inDays[1], 10));

  const todayDow = toDate(todayIso).getUTCDay();
  const weekendRe = /\b(this|next|coming)?\s*weekend\b/.exec(t);
  const dowMatch = new RegExp(`\\b(this|next|coming)?\\s*(${WEEKDAYS.join('|')})\\b`).exec(t);
  if (dowMatch || weekendRe) {
    const target = dowMatch ? WEEKDAYS.indexOf(dowMatch[2]) : 6;
    let delta = (target - todayDow + 7) % 7;
    if (delta === 0) delta = 7;
    return addDays(todayIso, delta);
  }

  const monthRe = MONTHS.join('|');
  const dayMonth = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?(${monthRe})[a-z]*\\b`).exec(t);
  const monthDay = new RegExp(`\\b(${monthRe})[a-z]*\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`).exec(t);
  const dm = dayMonth ? { d: +dayMonth[1], m: MONTHS.indexOf(dayMonth[2]) } : monthDay ? { d: +monthDay[2], m: MONTHS.indexOf(monthDay[1]) } : null;
  if (dm && dm.d >= 1 && dm.d <= 31) {
    const today = toDate(todayIso);
    let year = today.getUTCFullYear();
    let candidate = new Date(Date.UTC(year, dm.m, dm.d));
    if (candidate.getUTCMonth() !== dm.m) return null; // e.g. 31 Feb
    if (candidate < today) candidate = new Date(Date.UTC(year + 1, dm.m, dm.d));
    return toIso(candidate);
  }

  const bareDay = /\b(?:on\s+(?:the\s+)?)?(\d{1,2})(st|nd|rd|th)\b/.exec(t);
  if (bareDay) {
    const d = +bareDay[1];
    const today = toDate(todayIso);
    let candidate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), d));
    if (candidate < today) candidate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, d));
    if (d >= 1 && d <= 31 && candidate.getUTCDate() === d) return toIso(candidate);
  }
  return null;
}

export function parseArea(text) {
  let best = null;
  for (const area of AREAS) {
    for (const alias of [area.name, ...area.aliases]) {
      const i = findWord(text, alias);
      if (i !== -1 && (!best || alias.length > best.len)) best = { id: area.id, len: alias.length };
    }
  }
  return best ? best.id : null;
}

export function parseStyles(text) {
  let rest = text;
  const found = [];
  for (const [style, words] of Object.entries(STYLE_WORDS)) {
    for (const w of words) {
      if (findWord(rest, w) !== -1) {
        if (!found.includes(style)) found.push(style);
        // Remove so "not too loud" doesn't also count as "loud".
        rest = rest.replace(wordRe(w), '$1 ');
      }
    }
  }
  return found;
}

export function parseCategories(text) {
  const found = [];
  // Longer phrases first so "half saree" wins over "saree".
  const entries = Object.entries(CATEGORY_WORDS).flatMap(([cat, words]) => words.map((w) => [cat, w]));
  entries.sort((a, b) => b[1].length - a[1].length);
  let rest = text;
  for (const [cat, w] of entries) {
    if (findWord(rest, w) !== -1) {
      if (!found.includes(cat)) found.push(cat);
      rest = rest.replace(wordRe(w), '$1 ');
    }
  }
  return found.filter((c) => c in CATEGORIES);
}

export function parseGender(text, categories = []) {
  const women = WOMEN_WORDS.some((w) => findWord(text, w) !== -1) || categories.some((c) => WOMEN_CATS.includes(c));
  const men = MEN_WORDS.some((w) => findWord(text, w) !== -1) || categories.some((c) => MEN_CATS.includes(c));
  if (women && !men) return 'women';
  if (men && !women) return 'men';
  return null;
}

export function parseQuery(text, todayIso) {
  const clean = String(text || '').slice(0, 500);
  const categories = parseCategories(clean);
  return {
    occasion: parseOccasion(clean),
    size: parseSize(clean),
    budget: parseBudget(clean),
    date: parseDate(clean, todayIso),
    areaId: parseArea(clean),
    gender: parseGender(clean, categories),
    styles: parseStyles(clean),
    categories,
  };
}

export { SIZES };
