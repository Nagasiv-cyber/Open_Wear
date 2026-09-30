// Optional AI refinement of the parsed query using Google Gemini.
// If no key is configured, the call fails, or it takes too long, we return
// null and the caller keeps the rule-based result. The app never blocks on AI.
import { AREAS } from './areas.js';
import { SIZES, OCCASIONS, STYLES, CATEGORIES } from './catalog.js';

const TIMEOUT_MS = 4000;

export async function refineWithLlm(text, todayIso) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  const prompt = `Extract outfit-rental search fields from the user's message. Today is ${todayIso}.
Return ONLY a JSON object with these keys (use null or [] when not mentioned):
occasion: one of ${JSON.stringify(Object.keys(OCCASIONS))}
size: one of ${JSON.stringify(SIZES)}
budget: number in rupees
date: "YYYY-MM-DD" of the event
areaId: one of ${JSON.stringify(AREAS.map((a) => a.id))}
gender: "women" | "men" | null
styles: array from ${JSON.stringify(Object.keys(STYLES))}
categories: array from ${JSON.stringify(Object.keys(CATEGORIES))}
Message: ${JSON.stringify(text)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Rules are the base; AI values replace them only where AI gave a valid value.
// (Both inputs are passed through sanitizeQuery by the caller first.)
export function mergeQueries(rules, ai) {
  if (!ai) return rules;
  const out = { ...rules };
  for (const k of ['occasion', 'size', 'budget', 'date', 'areaId', 'gender']) {
    if (ai[k] != null) out[k] = ai[k];
  }
  for (const k of ['styles', 'categories']) {
    if (ai[k]?.length) out[k] = [...new Set([...rules[k], ...ai[k]])];
  }
  return out;
}
