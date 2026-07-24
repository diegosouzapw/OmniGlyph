/**
 * Direct Google AI Studio client for the Gemini reading/billing receipts.
 *
 * Talks to generativelanguage.googleapis.com directly (NOT through the proxy),
 * so the receipt can be produced before the google.ts wire lane exists.
 *
 * The API key is read from GEMINI_API_KEY (or GOOGLE_API_KEY) at call time and
 * is NEVER written to disk, results, or logs. Keep it in your env only.
 */
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function requireKey() {
  if (!KEY) throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) is unset — export it in your env');
  return true;
}
export const model = () => MODEL;

async function post(method, body, tries = 5) {
  requireKey();
  let last;
  for (let i = 0; i < tries; i++) {
    let r;
    try {
      r = await fetch(`${BASE}/${MODEL}:${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
        body: JSON.stringify(body),
      });
    } catch (e) {
      last = `network ${e.message}`;
      await sleep(3000 * (i + 1));
      continue;
    }
    const j = await r.json().catch(() => ({}));
    if (r.ok) return j;
    last = `HTTP ${r.status}: ${(j?.error?.message || JSON.stringify(j)).slice(0, 140)}`;
    if (r.status === 503 || r.status === 429 || r.status >= 500) {
      await sleep(5000 * (i + 1));
      continue;
    }
    throw new Error(last);
  }
  throw new Error(`gave up after ${tries}: ${last}`);
}

/** Real token count for a rendered PNG (billing ground truth). Free endpoint. */
export async function countImageTokens(pngB64) {
  const j = await post('countTokens', {
    contents: [{ parts: [{ inlineData: { mimeType: 'image/png', data: pngB64 } }] }],
  });
  return j.totalTokens;
}

/** Generate against a parts array; returns { text, finishReason, usage }. */
export async function generate(parts, { maxOutputTokens = 4096 } = {}) {
  const j = await post('generateContent', {
    contents: [{ parts }],
    generationConfig: { maxOutputTokens, temperature: 0 },
  });
  const cand = j.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text).filter(Boolean).join('').trim();
  return { text, finishReason: cand?.finishReason, usage: j.usageMetadata || null };
}
