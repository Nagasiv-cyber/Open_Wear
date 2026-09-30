'use client';
// One place for every browser -> server call: adds the device key header,
// parses JSON, and turns failures into readable Error messages.
import { getDeviceKey } from './storage';

let statusPromise = null;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const key = getDeviceKey();
  if (key) headers['x-onewear-key'] = key;
  let res;
  try {
    res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('You seem to be offline. Check your connection and try again.', 0, {});
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status}).`, res.status, data);
  return data;
}

// { db: boolean, ai: boolean } — fetched once per page load.
export function getStatus() {
  if (!statusPromise) statusPromise = api('/api/status').catch(() => ({ db: false, ai: false }));
  return statusPromise;
}
