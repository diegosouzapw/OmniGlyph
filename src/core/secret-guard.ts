/**
 * Secret guard — detects live credentials in text OmniGlyph is about to turn
 * into rendered artifacts (PNG pages, factsheet lines, IDS rows).
 *
 * Runtime traffic only: this never touches the repo hard rule #1 concern and
 * never mutates what the upstream API receives. Pure and deterministic, same
 * constraints as factsheet.ts. See docs/superpowers/specs/2026-07-12-secret-guard-design.md.
 */

export type SecretGuardMode = 'off' | 'text' | 'redact';

export interface SecretHit {
  start: number;
  end: number;
  kind: string; // 'key' | 'pem' | 'bearer' | 'assignment' | 'entropy'
}

// High-precision vendor prefixes. Case matters where the ecosystem's does.
const KEY_PATTERNS: readonly RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{16,}/g,             // OpenAI / Anthropic / Stripe secret keys
  /\bgh[pousr]_[A-Za-z0-9]{20,}/g,        // GitHub tokens
  /\bxox[baprs]-[A-Za-z0-9-]{10,}/g,      // Slack tokens
  /\bAKIA[0-9A-Z]{16}\b/g,                // AWS access key id
  /\bAIza[0-9A-Za-z_-]{35}\b/g,           // Google API key
];
const PEM_PATTERN = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;
const BEARER_PATTERN = /\bBearer\s+([A-Za-z0-9._~+/=-]{20,})/g;
// Value of a secret-NAMED assignment is a secret regardless of its entropy.
const ASSIGNMENT_PATTERN =
  /\b[A-Z0-9_]*(?:API|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|ACCESS)[A-Z0-9_]*\s*[=:]\s*(\S{8,})/g;

// Public high-entropy shapes the codebase already trusts (factsheet.ts grammar).
// Kept as local copies: factsheet.ts does not export them, and the two modules
// must be able to evolve independently (a factsheet shape change should not
// silently widen what the guard lets through).
const PUBLIC_SHAPES: readonly RegExp[] = [
  /^(?=[0-9a-f]*\d)[0-9a-f]{7,40}$/,                                                   // git sha / opaque hex
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,     // UUID
  /^\d[\d,_]*$|^\d+\.\d+$/,                                                            // number / port
  /^[A-Z][A-Z0-9]{2,}(?:_[A-Z0-9]+)+$/,                                                // CONST_IDS / env names
  /^(?=[A-Z0-9-]*\d)[A-Z][A-Z0-9]+(?:-[A-Z0-9]+)+$/,                                   // PROJ-1482 / CVE-…
  /^\[U\+[0-9A-F]{4,6}\]$/,                                                            // render glyph escape
];
const URLISH = /^https?:\/\//;
const PATHISH = /^(?:[\w@~+.-]+)?(?:\/[\w.@+-]+)+\/?$/;

const ENTROPY_MIN_LEN = 20;
const ENTROPY_MAX_LEN = 256;
const ENTROPY_BITS = 3.6;

function shannonBitsPerChar(s: string): number {
  const freq = new Map<string, number>();
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let bits = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    bits -= p * Math.log2(p);
  }
  return bits;
}

function isPublicChunk(chunk: string): boolean {
  if (URLISH.test(chunk)) {
    // URLs are public UNLESS they smuggle credentials.
    return !chunk.includes('@') && !/[?&](?:key|token|secret|password|sig)=/i.test(chunk);
  }
  if (PATHISH.test(chunk)) return true;
  return PUBLIC_SHAPES.some((re) => re.test(chunk));
}

/** For a `NAME=value` / `NAME: value` chunk, isolate the value so entropy and
 *  public-shape checks judge it alone — never the chunk as a whole. Otherwise
 *  a secret-looking value hides behind an innocuous-looking name (`FOO_BAR=
 *  kJ8#mQz!...`), because the combined chunk's entropy is diluted by the
 *  low-entropy `NAME=` prefix. Skips URLs: `scheme://` contains ':' but is
 *  not a name/value pair, and splitting it would corrupt URL-credential
 *  detection in `isPublicChunk`. */
function isolateAssignmentValue(chunk: string): { value: string; offset: number } {
  if (!URLISH.test(chunk)) {
    const sepIndex = chunk.search(/[=:]/);
    if (sepIndex > 0 && sepIndex < chunk.length - 1) {
      return { value: chunk.slice(sepIndex + 1), offset: sepIndex + 1 };
    }
  }
  return { value: chunk, offset: 0 };
}

/** All secret spans in `text`, sorted by start. Overlapping hits collapse to
 *  the more specific kind first (pem/key/bearer/assignment over entropy),
 *  then earliest-start/longest-match — never the first pattern that happened
 *  to run. This matters because the entropy fallback can produce a hit that
 *  starts earlier than, and fully contains, a narrower pem/key/bearer/
 *  assignment hit: a whole `NAME=value` chunk can itself read as high-entropy
 *  (e.g. the raw text still contains the low-entropy `NAME=` prefix inside a
 *  wider `\S+` token boundary), while the assignment pattern only claims the
 *  value's span. Picking "earliest, then longest" alone would keep the vague
 *  entropy hit and lose the precise kind; specificity-first keeps the
 *  precise one so redaction never splices twice. */
export function findSecrets(text: string): SecretHit[] {
  if (!text) return [];
  const hits: SecretHit[] = [];
  const push = (start: number, end: number, kind: string) => hits.push({ start, end, kind });

  for (const m of text.matchAll(PEM_PATTERN)) push(m.index, m.index + m[0].length, 'pem');
  for (const re of KEY_PATTERNS) {
    for (const m of text.matchAll(re)) push(m.index, m.index + m[0].length, 'key');
  }
  for (const m of text.matchAll(BEARER_PATTERN)) {
    const tok = m[1]!;
    const start = m.index + m[0].indexOf(tok);
    if (!isPublicChunk(tok)) push(start, start + tok.length, 'bearer');
  }
  for (const m of text.matchAll(ASSIGNMENT_PATTERN)) {
    const val = m[1]!;
    if (val.includes('[REDACTED:')) continue; // idempotency under re-runs
    const start = m.index + m[0].lastIndexOf(val);
    push(start, start + val.length, 'assignment');
  }
  // Entropy fallback over whitespace-free chunks. A NAME=value chunk is
  // judged on its value alone (see isolateAssignmentValue) so a secret value
  // behind an innocuous name is still caught.
  for (const m of text.matchAll(/\S+/g)) {
    const chunk = m[0];
    if (chunk.includes('[REDACTED:')) continue;
    const { value, offset } = isolateAssignmentValue(chunk);
    if (value.length < ENTROPY_MIN_LEN || value.length > ENTROPY_MAX_LEN) continue;
    if (isPublicChunk(value)) continue;
    if (shannonBitsPerChar(value) < ENTROPY_BITS) continue;
    push(m.index + offset, m.index + offset + value.length, 'entropy');
  }

  const SPECIFICITY: Record<string, number> = {
    pem: 5,
    key: 4,
    bearer: 3,
    assignment: 2,
    entropy: 1,
  };

  hits.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return b.end - a.end;
    return (SPECIFICITY[b.kind] ?? 0) - (SPECIFICITY[a.kind] ?? 0);
  });

  const out: SecretHit[] = [];
  let lastEnd = -1;
  for (const h of hits) {
    if (h.start < lastEnd) {
      const prevHit = out[out.length - 1];
      if ((SPECIFICITY[prevHit!.kind] ?? 0) >= (SPECIFICITY[h.kind] ?? 0)) {
        continue;
      }
      out[out.length - 1] = h;
      lastEnd = h.end;
    } else {
      out.push(h);
      lastEnd = h.end;
    }
  }
  return out;
}
