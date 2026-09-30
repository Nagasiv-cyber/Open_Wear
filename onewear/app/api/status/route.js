import { ok } from '@/lib/http';
import { isDbEnabled } from '@/lib/db';
import { isSmsEnabled } from '@/lib/sms';

// Tells the UI which features are live, without revealing any secrets.
export async function GET() {
  return ok({ db: isDbEnabled(), ai: Boolean(process.env.GEMINI_API_KEY), sms: isSmsEnabled() });
}
