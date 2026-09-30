// Browser storage helpers. Storage can be disabled or full, so every call is
// guarded and falls back to an empty value instead of crashing the page.
const KEYS = { listings: 'onewear:listings', requests: 'onewear:requests' };

function read(key) {
  try {
    const raw = window.localStorage.getItem(key);
    const val = raw ? JSON.parse(raw) : [];
    return Array.isArray(val) ? val : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const getMyListings = () => read(KEYS.listings);
export const saveMyListing = (l) => write(KEYS.listings, [l, ...getMyListings()].slice(0, 20));
export const removeMyListing = (id) => write(KEYS.listings, getMyListings().filter((l) => l.id !== id));
export const getRequests = () => read(KEYS.requests);
export const saveRequest = (r) => write(KEYS.requests, [r, ...getRequests()].slice(0, 50));

export function localTodayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const cancelRequest = (id) => write(KEYS.requests, getRequests().filter((r) => r.id !== id));

// A random key identifying this browser to the server. The server only
// stores its hash. Kept in localStorage so the same browser keeps ownership
// of its listings and requests.
export function getDeviceKey() {
  try {
    let key = window.localStorage.getItem('onewear:key');
    if (!key) {
      key = crypto.randomUUID();
      window.localStorage.setItem('onewear:key', key);
    }
    return key;
  } catch {
    return null;
  }
}

// Remembers the borrower's name and phone so they don't retype it.
export function getProfile() {
  try {
    const p = JSON.parse(window.localStorage.getItem('onewear:profile') || '{}');
    return { name: typeof p.name === 'string' ? p.name : '', phone: typeof p.phone === 'string' ? p.phone : '' };
  } catch {
    return { name: '', phone: '' };
  }
}

export function saveProfile(profile) {
  try {
    window.localStorage.setItem('onewear:profile', JSON.stringify(profile));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}
