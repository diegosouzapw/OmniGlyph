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
const PEM_BEGIN_PREFIX = '-----BEGIN ';
const PEM_END_PREFIX = '-----END ';
const PEM_PRIVATE_SUFFIX = 'PRIVATE KEY-----';
const PEM_LABEL_MAX = 64;
// The VALUE class is an explicit allowlist that already excludes U+21B5 (↵,
// the reflow newline sentinel — see render.ts NL_SENTINEL), so a Bearer token
// abutting a reflowed line break can't swallow it. Unlike ASSIGNMENT below,
// no change needed here — kept as a `\S`-free allowlist on purpose.
const BEARER_PATTERN = /\bBearer\s+([A-Za-z0-9._~+/=-]{20,})/g;
// Value of a secret-NAMED assignment is a secret regardless of its entropy.
// The value class excludes ↵ (see findSecrets' entropy-fallback chunker
// below for why): `\S` would treat the reflow sentinel as ordinary content
// and let the captured VALUE bleed across a line boundary into the next
// line's text whenever the secret's value directly abuts a ↵ (the common
// case — reflow joins lines with no separating whitespace).
const ASSIGNMENT_PATTERN = /\b([A-Z0-9_]+)[ \t]*[=:][ \t]*([^\s↵]{8,})/g;
const SECRET_ASSIGNMENT_FRAGMENTS = [
  'API',
  'SECRET',
  'TOKEN',
  'PASSWORD',
  'PASSWD',
  'PRIVATE',
  'CREDENTIAL',
  'ACCESS',
] as const;

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

function isPemLabel(label: string): boolean {
  if (label.length > PEM_LABEL_MAX) return false;
  for (const code of label) {
    if (code !== ' ' && (code < 'A' || code > 'Z')) return false;
  }
  return true;
}

function findPemMarker(
  line: string,
  prefix: string,
  from: number,
): { start: number; end: number } | undefined {
  let markerStart = line.indexOf(prefix, from);
  while (markerStart >= 0) {
    const labelStart = markerStart + prefix.length;
    // Inspect a bounded header window so repeated fake BEGIN/END prefixes can
    // never make suffix search re-scan the rest of an attacker-controlled line.
    const window = line.slice(
      labelStart,
      labelStart + PEM_LABEL_MAX + PEM_PRIVATE_SUFFIX.length,
    );
    const suffixOffset = window.indexOf(PEM_PRIVATE_SUFFIX);
    if (suffixOffset >= 0) {
      const label = window.slice(0, suffixOffset);
      if (isPemLabel(label)) {
        return {
          start: markerStart,
          end: labelStart + suffixOffset + PEM_PRIVATE_SUFFIX.length,
        };
      }
    }
    markerStart = line.indexOf(prefix, labelStart);
  }
  return undefined;
}

/** Locate complete PEM private-key blocks with one forward pass over the text.
 * PEM markers are line-oriented, so no regex needs to backtrack across an
 * attacker-controlled body. The end label intentionally need not match the
 * begin label, preserving the previous guard's fail-safe detection behavior. */
function scanPemLine(
  line: string,
  lineStart: number,
  openStart: number | undefined,
  spans: Array<{ start: number; end: number }>,
): number | undefined {
  let cursor = 0;
  while (cursor <= line.length) {
    const prefix = openStart === undefined ? PEM_BEGIN_PREFIX : PEM_END_PREFIX;
    const marker = findPemMarker(line, prefix, cursor);
    if (!marker) return openStart;
    if (openStart === undefined) {
      openStart = lineStart + marker.start;
    } else {
      spans.push({ start: openStart, end: lineStart + marker.end });
      openStart = undefined;
    }
    cursor = marker.end;
  }
  return openStart;
}

function findPemSpans(text: string): Array<{ start: number; end: number }> {
  const spans: Array<{ start: number; end: number }> = [];
  let openStart: number | undefined;
  let lineStart = 0;
  for (const line of text.split('\n')) {
    openStart = scanPemLine(line, lineStart, openStart, spans);
    lineStart += line.length + 1;
  }
  return spans;
}

function findKeyHits(text: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const re of KEY_PATTERNS) {
    for (const m of text.matchAll(re)) hits.push({ start: m.index, end: m.index + m[0].length, kind: 'key' });
  }
  return hits;
}

function findBearerHits(text: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const m of text.matchAll(BEARER_PATTERN)) {
    const token = m[1]!;
    if (isPublicChunk(token)) continue;
    const start = m.index + m[0].indexOf(token);
    hits.push({ start, end: start + token.length, kind: 'bearer' });
  }
  return hits;
}

function findAssignmentHits(text: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const m of text.matchAll(ASSIGNMENT_PATTERN)) {
    const name = m[1]!;
    const value = m[2]!;
    if (!SECRET_ASSIGNMENT_FRAGMENTS.some((fragment) => name.includes(fragment))) continue;
    if (value.includes('[REDACTED:')) continue;
    const start = m.index + m[0].lastIndexOf(value);
    hits.push({ start, end: start + value.length, kind: 'assignment' });
  }
  return hits;
}

function findEntropyHits(text: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const m of text.matchAll(/[^\s↵]+/g)) {
    const chunk = m[0];
    if (chunk.includes('[REDACTED:')) continue;
    const { value, offset } = isolateAssignmentValue(chunk);
    if (value.length < ENTROPY_MIN_LEN || value.length > ENTROPY_MAX_LEN) continue;
    if (isPublicChunk(value) || shannonBitsPerChar(value) < ENTROPY_BITS) continue;
    hits.push({ start: m.index + offset, end: m.index + offset + value.length, kind: 'entropy' });
  }
  return hits;
}

const SPECIFICITY: Record<string, number> = {
  pem: 5,
  key: 4,
  bearer: 3,
  assignment: 2,
  entropy: 1,
};

function collapseOverlappingHits(hits: SecretHit[]): SecretHit[] {
  hits.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return b.end - a.end;
    return (SPECIFICITY[b.kind] ?? 0) - (SPECIFICITY[a.kind] ?? 0);
  });

  const out: SecretHit[] = [];
  let lastEnd = -1;
  for (const hit of hits) {
    if (hit.start >= lastEnd) {
      out.push(hit);
      lastEnd = hit.end;
      continue;
    }
    const previous = out[out.length - 1]!;
    if ((SPECIFICITY[previous.kind] ?? 0) >= (SPECIFICITY[hit.kind] ?? 0)) continue;
    out[out.length - 1] = hit;
    lastEnd = hit.end;
  }
  return out;
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
  // Entropy fallback over whitespace-free chunks. A NAME=value chunk is
  // judged on its value alone (see isolateAssignmentValue) so a secret value
  // behind an innocuous name is still caught.
  //
  // ↵ (U+21B5) is the history reflow's hard-newline sentinel (render.ts
  // NL_SENTINEL) — reflow() joins lines with NO surrounding whitespace, so a
  // plain `\S+` chunker treats ↵ as ordinary content and glues an entire
  // multi-line, secret-free transcript into ONE chunk spanning every line,
  // which reads as high-entropy and false-positives as a secret. ↵ is a
  // token BOUNDARY (it marks where a line ends), never token content, so it
  // must split chunks exactly like whitespace does.
  const pemHits = findPemSpans(text).map(({ start, end }) => ({ start, end, kind: 'pem' }));
  return collapseOverlappingHits([
    ...pemHits,
    ...findKeyHits(text),
    ...findBearerHits(text),
    ...findAssignmentHits(text),
    ...findEntropyHits(text),
  ]);
}

/** Prefix-preserving mask: keeps 4 chars for debuggability, kills the secret.
 *  Deterministic and idempotent (masked text produces zero new hits). */
export function redactSecrets(text: string): { text: string; hits: number } {
  const hits = findSecrets(text);
  if (hits.length === 0) return { text, hits: 0 };
  let out = '';
  let cursor = 0;
  for (const h of hits) {
    out += text.slice(cursor, h.start);
    out += text.slice(h.start, Math.min(h.start + 4, h.end)) + `…[REDACTED:${h.kind}]`;
    cursor = h.end;
  }
  out += text.slice(cursor);
  return { text: out, hits: hits.length };
}

/** OMNIGLYPH_GUARD_SECRETS = off (default) | text | redact.
 *  Same Workers-safe env access pattern as applicability.ts. */
export function secretGuardMode(): SecretGuardMode {
  const raw = typeof process !== 'undefined' ? process.env?.OMNIGLYPH_GUARD_SECRETS : undefined;
  const v = (raw ?? '').trim().toLowerCase();
  return v === 'text' || v === 'redact' ? v : 'off';
}

/** One-call contract for every imaging choke point. `blocked` means: keep
 *  this block as native text (mode 'text' and a secret is present). */
export function guardImagedText(text: string): {
  mode: SecretGuardMode; text: string; hits: number; blocked: boolean;
} {
  const mode = secretGuardMode();
  if (mode === 'off') return { mode, text, hits: 0, blocked: false };
  if (mode === 'redact') {
    const r = redactSecrets(text);
    return { mode, text: r.text, hits: r.hits, blocked: false };
  }
  const hits = findSecrets(text).length;
  return { mode, text, hits, blocked: hits > 0 };
}
