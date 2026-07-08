/**
 * `--via-omniroute` transport: sends the dense context as TEXT to a running
 * OmniRoute instance, lets the `omniglyph` engine render the pages and forward
 * them to Anthropic, and measures the reads + the savings. It is the P3
 * end-to-end test: proves that going through OmniRoute (render + forward) does
 * NOT degrade the pages the model reads — the bar is the same as the direct
 * route (same verbatim/gist hits).
 *
 * Unlike the other transports (which send PNGs already rendered by the harness),
 * this one sends TEXT on purpose: OmniRoute does the rendering, which is exactly
 * the production path under test. The `X-OmniRoute-Compression` response header
 * carries `tokens=<orig>-><comp>` → savings measured straight from the response.
 *
 * Operational prerequisite (see README): OmniRoute running with an Anthropic
 * provider (direct route, real key) and the `omniglyph` engine ENABLED in the
 * compression config (the `engine:omniglyph` header only fires if
 * `config.engines.omniglyph.enabled === true`).
 */
import type { FrontierConfig } from './configs.js';
import type { Question } from './corpus.js';

export interface OmnirouteRequest {
  url: string;
  headers: Record<string, string>;
  body: {
    model: string;
    max_tokens: number;
    messages: Array<{ role: string; content: Array<{ type: 'text'; text: string }> }>;
  };
}

/** Builds the Anthropic-format request for OmniRoute's `/v1/messages` endpoint.
 *  Pure (no fetch) so it is testable. Sends the `pageText` as one dense text block
 *  + the question; the header selects the omniglyph engine per request. */
export function buildOmnirouteRequest(
  baseUrl: string,
  apiKey: string,
  cfg: FrontierConfig,
  pageText: string,
  q: Question,
): OmnirouteRequest {
  return {
    url: `${baseUrl.replace(/\/+$/, '')}/v1/messages`,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Selects the omniglyph engine per request. Only fires if enabled in OmniRoute.
      'x-omniroute-compression': 'engine:omniglyph',
    },
    body: {
      model: cfg.model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: pageText },
            { type: 'text', text: q.prompt },
          ],
        },
      ],
    },
  };
}

export interface CompressionSavings {
  originalTokens: number;
  compressedTokens: number;
  savingsPercent: number;
}

/** Extracts `tokens=<orig>-><comp>` from the `X-OmniRoute-Compression` response
 *  header. Returns null when absent/unparseable or when no compression actually
 *  happened (orig <= 0). `savingsPercent` = (1 - comp/orig) * 100, 1 decimal place. */
export function parseCompressionSavings(headerValue: string | null | undefined): CompressionSavings | null {
  if (!headerValue) return null;
  const m = headerValue.match(/tokens=(\d+)\s*->\s*(\d+)/);
  if (!m) return null;
  const originalTokens = Number(m[1]);
  const compressedTokens = Number(m[2]);
  if (!(originalTokens > 0)) return null;
  const savingsPercent = Math.round((1 - compressedTokens / originalTokens) * 1000) / 10;
  return { originalTokens, compressedTokens, savingsPercent };
}

export interface OmnirouteAnswer {
  text: string;
  /** null when OmniRoute reported no compression (engine did not fire) — in that case
   *  a 30/30 is trivial (it read raw text) and does NOT prove image non-degradation. */
  savings: CompressionSavings | null;
}

/** Makes the real call through OmniRoute. API errors/refusals become a labeled string
 *  ('[API_ERROR]'/'[EMPTY:...]') as in the other transports, so scoring can distinguish. */
export async function askViaOmniroute(
  baseUrl: string,
  apiKey: string,
  cfg: FrontierConfig,
  pageText: string,
  q: Question,
): Promise<OmnirouteAnswer> {
  const req = buildOmnirouteRequest(baseUrl, apiKey, cfg, pageText, q);
  const res = await fetch(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body),
  });
  const savings = parseCompressionSavings(res.headers.get('x-omniroute-compression'));
  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    stop_reason?: string;
    error?: { message: string };
  };
  if (json.error) return { text: `[API_ERROR] ${json.error.message}`, savings };
  const text = (json.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
  if (text.trim() === '') return { text: `[EMPTY:${json.stop_reason ?? 'unknown'}]`, savings };
  return { text, savings };
}
