import { NextResponse } from 'next/server';

export const ok = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (status, error, extra = {}) => NextResponse.json({ error, ...extra }, { status });

// Returned when Supabase isn't configured. The client sees mode:'local'
// and falls back to saving in the browser.
export const noDb = () => fail(501, 'Shared database is not connected. Saving in this browser instead.', { mode: 'local' });
export const noKey = () => fail(401, 'Missing device key. Reload the page and try again.');

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

export function serverError(err) {
  console.error(err);
  return fail(500, 'Something went wrong on our side. Try again in a moment.');
}
