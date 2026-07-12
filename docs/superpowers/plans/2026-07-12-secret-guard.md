# Secret Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect live credentials in text that OmniGlyph is about to turn into rendered artifacts (PNGs, factsheet lines, IDS rows) and, behind an opt-in flag, either keep those blocks as text or redact the secrets in the artifacts — never mutating what the upstream API receives.

**Architecture:** One pure detection module (`src/core/secret-guard.ts`) + guard checks at the existing "render text is about to become an image" choke points (the same places `appendIdsBlock` runs). Mode comes from `OMNIGLYPH_GUARD_SECRETS` read in core with the same `typeof process !== 'undefined'` pattern as `unverifiedAckBases()` in `applicability.ts` (Workers-safe).

**Tech Stack:** TypeScript strict, ESM (`.js` import suffixes), vitest.

**Spec:** `docs/superpowers/specs/2026-07-12-secret-guard-design.md` (user-approved decisions: default `off`; prefix-preserving mask; render-text only; branch based on the open stack tip).

## Global Constraints

- Branch: `feat/secret-guard` based on `origin/feat/port-responses-tool-pairs` (stack tip; PR will be stacked on #29). Worktree: `.claude/worktrees/secret-guard` (remove the stale `feat/port-pr-39-secret-guard` branch/worktree first if present).
- Strict TDD: every task writes the failing test first and watches it fail for the right reason.
- Rebrand guard: the three upstream brand terms (see the `forbidden` regex in `tests/docs-integrity.test.ts`) must not appear in any tracked file — including this plan. Upstream URL only in the `Inspired-by:` commit trailer.
- NEVER `git stash`. Never weaken an existing test or gate. Never touch `benchmarks/*/results/`.
- The forwarded/upstream request body must be byte-identical in ALL modes (the guard only affects OmniGlyph-created artifacts).
- The matched secret text NEVER reaches info/tracker/dashboard/logs — counts only.
- Push the branch as soon as the first commit lands (the environment has wiped local worktrees before; origin is the durable store).
- Attribution (Task 1's commit only): the upstream commits are bot-authored — credit the human PR author:
  ```
  Co-authored-by: rYo-STUDIO-1bit <rYo-STUDIO-1bit@users.noreply.github.com>
  Inspired-by: <the upstream PR-39 URL — real trailer in the commit only; spelled out here it would trip the rebrand guard>
  ```
  No AI attribution trailers anywhere.
- Validation per task: the named test files + `pnpm run typecheck`. Final: `pnpm run lint && pnpm run typecheck && pnpm test && pnpm run build` (full suite in background; the 4xx-gzip test in `proxy-usage.test.ts` is a known load flake — re-run the file isolated to distinguish).

---

### Task 1: Detection core — `findSecrets`

**Files:**
- Create: `src/core/secret-guard.ts`
- Test: `tests/secret-guard.test.ts`

**Interfaces:**
- Produces: `interface SecretHit { start: number; end: number; kind: string }`, `findSecrets(text: string): SecretHit[]` (sorted by `start`, non-overlapping — longest match wins on overlap).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/secret-guard.test.ts
import { describe, expect, it } from 'vitest';
import { findSecrets } from '../src/core/secret-guard.js';

const kinds = (t: string) => findSecrets(t).map((h) => h.kind);

describe('findSecrets — prefix patterns', () => {
  it('catches vendor key prefixes', () => {
    expect(kinds('key sk-ant-api03-abcdef0123456789abcdef')).toContain('key');
    expect(kinds('ghp_abcdefghijklmnopqrst0123456789')).toContain('key');
    expect(kinds('xoxb-1234567890-abcdefghij')).toContain('key');
    expect(kinds('AKIAIOSFODNN7EXAMPLE')).toContain('key');
    expect(kinds('AIzaSyA-abcdefghijklmnopqrstuvwxyz0123456')).toContain('key');
  });
  it('catches PEM private key blocks as one hit', () => {
    const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEow…snip…\n-----END RSA PRIVATE KEY-----';
    const hits = findSecrets(pem);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.kind).toBe('pem');
  });
});

describe('findSecrets — Bearer', () => {
  it('flags the token after Bearer, not the word Bearer', () => {
    const t = 'authorization: Bearer abcdefghijklmnopqrstuv123456';
    const [h] = findSecrets(t);
    expect(h!.kind).toBe('bearer');
    expect(t.slice(h!.start, h!.end)).toBe('abcdefghijklmnopqrstuv123456');
  });
  it('ignores short Bearer values (< 20 chars)', () => {
    expect(findSecrets('Bearer abc123')).toHaveLength(0);
  });
});

describe('findSecrets — labeled assignments', () => {
  it('flags the VALUE of secret-named assignments regardless of entropy', () => {
    const t = 'export STRIPE_API_KEY=hello-world-not-random';
    const [h] = findSecrets(t);
    expect(h!.kind).toBe('assignment');
    expect(t.slice(h!.start, h!.end)).toBe('hello-world-not-random');
  });
  it('supports colon separators and PASSWORD/TOKEN/CREDENTIAL names', () => {
    expect(kinds('DB_PASSWORD: hunter2hunter2')).toContain('assignment');
    expect(kinds('ACCESS_TOKEN=abcdefgh12345678')).toContain('assignment');
  });
  it('does NOT flag non-secret-named assignments (factsheet keeps them)', () => {
    expect(findSecrets('ACTIVE_MANIFEST=/srv/x/runtime-map.json')).toHaveLength(0);
    expect(findSecrets('CONTROL_PORT=47831')).toHaveLength(0);
  });
});

describe('findSecrets — entropy fallback excludes every public factsheet shape', () => {
  it('flags a bare high-entropy chunk', () => {
    expect(kinds('deploy with kJ8#mQz!vR2$xN9pLw4Yt7Bc')).toContain('entropy');
  });
  it('rejects git SHAs, UUIDs, tickets, consts, numbers, URLs, paths', () => {
    const publicText = [
      'commit 9065ada2df9cad31e2ffe2d71bf2',                     // SHAPE_HEX
      '123e4567-e89b-12d3-a456-426614174000',                    // SHAPE_UUID
      'PROJ-1482 CVE-2024-30078',                                // SHAPE_TICKET
      'OMNIGLYPH_GPT_HISTORY_MAX_IMAGES',                        // SHAPE_CONST
      '1,234,567 47821 3.14159',                                 // SHAPE_NUM
      'https://github.com/anthropics/claude-code/issues/123',    // URL
      'src/core/anthropic-vision.ts /home/user/.config/app.json' // paths
    ].join('\n');
    expect(findSecrets(publicText)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run and watch it fail for the right reason**

Run: `npx vitest run tests/secret-guard.test.ts`
Expected: FAIL — `Cannot find module '../src/core/secret-guard.js'` (or `findSecrets is not a function`).

- [ ] **Step 3: Implement the module**

```ts
// src/core/secret-guard.ts
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

/** All secret spans in `text`, sorted by start; overlaps collapse to the first
 *  (earliest, then longest) match so redaction never splices twice. */
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
  // Entropy fallback over whitespace-free chunks.
  for (const m of text.matchAll(/\S+/g)) {
    const chunk = m[0];
    if (chunk.length < ENTROPY_MIN_LEN || chunk.length > ENTROPY_MAX_LEN) continue;
    if (chunk.includes('[REDACTED:')) continue;
    if (isPublicChunk(chunk)) continue;
    if (shannonBitsPerChar(chunk) < ENTROPY_BITS) continue;
    push(m.index, m.index + chunk.length, 'entropy');
  }

  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: SecretHit[] = [];
  let lastEnd = -1;
  for (const h of hits) {
    if (h.start < lastEnd) continue; // overlap: earliest/longest already kept
    out.push(h);
    lastEnd = h.end;
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/secret-guard.test.ts`
Expected: PASS. If the entropy fixture fails, print `shannonBitsPerChar` of the fixture and tune the FIXTURE (never the 3.6 threshold — it is a spec value).

- [ ] **Step 5: Typecheck + eslint + commit + push**

```bash
pnpm run typecheck && npx eslint src/core/secret-guard.ts tests/secret-guard.test.ts
git add src/core/secret-guard.ts tests/secret-guard.test.ts
git commit -m "feat(secret-guard): detect credentials in render-bound text

Prefix patterns (sk-/gh*/xox*/AKIA/AIza/PEM), Bearer tokens, secret-named
assignments, and a Shannon-entropy fallback that excludes every public
high-entropy shape the factsheet grammar already trusts (SHAs, UUIDs,
tickets, consts, numbers, URLs, paths). Detection only — no integration yet.

Co-authored-by: rYo-STUDIO-1bit <rYo-STUDIO-1bit@users.noreply.github.com>
Inspired-by: <the upstream PR-39 URL — real trailer in the commit only; spelled out here it would trip the rebrand guard>"
git push -u origin feat/secret-guard
```

---

### Task 2: `redactSecrets` + mode reader

**Files:**
- Modify: `src/core/secret-guard.ts` (append)
- Test: `tests/secret-guard.test.ts` (append)

**Interfaces:**
- Produces: `redactSecrets(text: string): { text: string; hits: number }` (prefix-preserving mask `first4…[REDACTED:kind]`; deterministic; idempotent), `secretGuardMode(): SecretGuardMode` (env-driven, default `'off'`), `guardImagedText(text: string): { mode: SecretGuardMode; text: string; hits: number; blocked: boolean }` — the single call sites use in Tasks 3–5. `blocked === (mode==='text' && hits>0)`; in `redact` mode `text` is the redacted text; otherwise the original.

- [ ] **Step 1: Write the failing tests** (append to `tests/secret-guard.test.ts`)

```ts
import { redactSecrets, secretGuardMode, guardImagedText } from '../src/core/secret-guard.js';
import { afterEach, beforeEach } from 'vitest';

describe('redactSecrets', () => {
  it('masks with a prefix-preserving, kind-tagged token', () => {
    const { text, hits } = redactSecrets('use sk-live-abcdefghijklmnop1234 now');
    expect(hits).toBe(1);
    expect(text).toBe('use sk-l…[REDACTED:key] now');
  });
  it('is idempotent and deterministic', () => {
    const once = redactSecrets('TOKEN=abcdefgh12345678').text;
    expect(redactSecrets(once)).toEqual({ text: once, hits: 0 });
    expect(redactSecrets('TOKEN=abcdefgh12345678').text).toBe(once);
  });
  it('never leaves more than 4 original chars of any hit', () => {
    const secret = 'kJ8#mQz!vR2$xN9pLw4Yt7Bc';
    const { text } = redactSecrets(`x ${secret} y`);
    expect(text).not.toContain(secret.slice(4));
  });
});

describe('secretGuardMode', () => {
  const saved = process.env.OMNIGLYPH_GUARD_SECRETS;
  beforeEach(() => { delete process.env.OMNIGLYPH_GUARD_SECRETS; });
  afterEach(() => {
    if (saved === undefined) delete process.env.OMNIGLYPH_GUARD_SECRETS;
    else process.env.OMNIGLYPH_GUARD_SECRETS = saved;
  });
  it("defaults to 'off' and ignores junk values", () => {
    expect(secretGuardMode()).toBe('off');
    process.env.OMNIGLYPH_GUARD_SECRETS = 'banana';
    expect(secretGuardMode()).toBe('off');
  });
  it('honors text and redact (case-insensitive)', () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    expect(secretGuardMode()).toBe('text');
    process.env.OMNIGLYPH_GUARD_SECRETS = 'REDACT';
    expect(secretGuardMode()).toBe('redact');
  });
  it('guardImagedText wires the three modes', () => {
    const secret = 'API_KEY=abcdefgh12345678';
    expect(guardImagedText(secret)).toEqual({ mode: 'off', text: secret, hits: 0, blocked: false });
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    expect(guardImagedText(secret)).toMatchObject({ mode: 'text', text: secret, blocked: true });
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const g = guardImagedText(secret);
    expect(g.blocked).toBe(false);
    expect(g.text).toContain('[REDACTED:assignment]');
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/secret-guard.test.ts` → FAIL `redactSecrets is not a function`.

- [ ] **Step 3: Implement** (append to `src/core/secret-guard.ts`)

```ts
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
```

Idempotency check while implementing: `findSecrets` must return 0 hits on masked output. The mask `sk-l…[REDACTED:key]` must not re-match `KEY_PATTERNS` (it won't: `…` breaks the char class) nor `ASSIGNMENT_PATTERN` (guarded by the `[REDACTED:` skip). If any pattern still re-matches, extend the `[REDACTED:` skip to that pattern's loop — never weaken the mask.

- [ ] **Step 4: Run** — `npx vitest run tests/secret-guard.test.ts` → PASS.

- [ ] **Step 5: Commit + push**

```bash
pnpm run typecheck && npx eslint src/core/secret-guard.ts tests/secret-guard.test.ts
git add -u && git commit -m "feat(secret-guard): prefix-preserving redaction and env-driven mode

OMNIGLYPH_GUARD_SECRETS = off (default) | text | redact. redactSecrets is
deterministic and idempotent; guardImagedText is the single contract the
imaging choke points consume." && git push
```

---

### Task 3: Anthropic lanes — slab + block images

**Files:**
- Modify: `src/core/transform.ts` (two anchors below)
- Test: `tests/secret-guard-lanes.test.ts` (new)

**Interfaces:**
- Consumes: `guardImagedText` (Task 2).
- Produces: `TransformInfo.secretHits?: number` (add to the interface next to `droppedChars`); reason string `'secret_kept_text'` set on the slab skip.

**Anchors** (current line refs from the stack tip; re-locate by the quoted code, not the numbers):

1. `textToImageBlocks` (~line 1439): `const renderText = appendIdsBlock(text);`
2. Slab site (~line 1819): `const combinedWithHeader = appendIdsBlock(imageInstructionHeader + combined);`
3. Every `factSheetText(` call site in `transform.ts` whose input text also feeds an image (find with `grep -n "factSheetText(" src/core/transform.ts`).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/secret-guard-lanes.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { transformRequest } from '../src/core/transform.js';

const SECRET = 'sk-live-abcdefghijklmnop1234';
const enc = new TextEncoder();
const dec = new TextDecoder();

function slabReq(extra = ''): Uint8Array {
  return enc.encode(JSON.stringify({
    model: 'claude-fable-5',
    system: 'Operating rules for this session. '.repeat(6000) + ` DEPLOY_API_TOKEN=${SECRET} ` + extra,
    messages: [{ role: 'user', content: 'hi' }],
  }));
}

afterEach(() => { delete process.env.OMNIGLYPH_GUARD_SECRETS; });

describe('Anthropic slab lane', () => {
  it('off (default): images exactly as before, secretHits absent', async () => {
    const { body, info } = await transformRequest(slabReq());
    expect(info.compressed).toBe(true);
    expect(info.secretHits ?? 0).toBe(0);
    expect(dec.decode(body)).toContain(SECRET); // native text still carries it upstream
  });

  it('text: slab is NOT imaged, reason=secret_kept_text, body keeps the secret natively', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    const { body, info } = await transformRequest(slabReq());
    expect(info.imageCount ?? 0).toBe(0);
    expect(info.reason).toBe('secret_kept_text');
    expect(info.secretHits).toBeGreaterThan(0);
    expect(dec.decode(body)).toContain(SECRET);
  });

  it('redact: slab still images; imageSourceText and factsheet carry the mask, not the secret', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const { body, info } = await transformRequest(slabReq());
    expect(info.compressed).toBe(true);
    expect(info.secretHits).toBeGreaterThan(0);
    const rendered = info.imageSourceText ?? '';
    expect(rendered).toContain('[REDACTED:');
    expect(rendered).not.toContain(SECRET);
    const out = dec.decode(body);
    // The factsheet text block (rides beside the image) must be masked too…
    const factsheetBlocks = (JSON.parse(out).messages?.[0]?.content ?? [])
      .filter((b: { type?: string; text?: string }) => b.type === 'text' && /\[|factsheet|EXACT/i.test(b.text ?? ''));
    for (const b of factsheetBlocks) expect(b.text).not.toContain(SECRET);
    // …while the un-imaged native remainder is untouched (never mutate client traffic).
  });
});
```

Note for the implementer: build the fixture so the slab actually images (mirror an existing passing fixture from `tests/public-api.test.ts` for sizes/shape); assert against whatever `info` fields that suite already uses (`imageSourceText` exists on this branch). Adjust ONLY fixture plumbing, never the assertions' meaning.

- [ ] **Step 2: Run to verify failure** — `npx vitest run tests/secret-guard-lanes.test.ts` → the `text` test FAILS (slab still images / no reason) and the `redact` test FAILS (secret visible in `imageSourceText`).

- [ ] **Step 3: Implement**

At anchor 2 (slab), replace:

```ts
const combinedWithHeader = appendIdsBlock(imageInstructionHeader + combined);
```

with:

```ts
// Secret guard: never create rendered artifacts of a credential.
const slabGuard = guardImagedText(imageInstructionHeader + combined);
if (slabGuard.hits > 0) info.secretHits = (info.secretHits ?? 0) + slabGuard.hits;
if (slabGuard.blocked) {
  info.reason ??= 'secret_kept_text';
  // fall through to the existing "slab not imaged" path — same branch the
  // profitability gate takes when it declines (skip render, keep text).
}
const combinedWithHeader = appendIdsBlock(slabGuard.text);
```

and gate the render on `!slabGuard.blocked` exactly where the profitability gate already short-circuits (`if (slabGateEval …profitable…)` region — compose as `profitable && !slabGuard.blocked`, keeping the gate's own telemetry intact). Import at top: `import { guardImagedText } from './secret-guard.js';`

At anchor 1 (`textToImageBlocks`), replace:

```ts
const renderText = appendIdsBlock(text);
```

with:

```ts
const blockGuard = guardImagedText(text);
if (blockGuard.blocked) return null; // caller keeps the block as native text
const renderText = appendIdsBlock(blockGuard.text);
```

Change the function's return type to `Promise<…| null>` and update every call site (find with `grep -n "textToImageBlocks(" src/core/transform.ts`) to keep the original text block when it returns `null`, mirroring each site's existing "gate declined" branch, and accumulate `info.secretHits` there via a small helper if the hit count is needed (acceptable v1: count only at the slab + factsheet sites; block-lane hits may reuse `guardImagedText(text).hits` before the call).

At anchor 3 (factsheet sites feeding imaged content): pass the GUARDED text (`slabGuard.text` / `blockGuard.text`) into `factSheetText(...)` instead of the raw text, so redact-mode masks propagate to the factsheet line. Do not touch factsheet call sites whose output only describes native text.

- [ ] **Step 4: Run** — `npx vitest run tests/secret-guard-lanes.test.ts tests/public-api.test.ts tests/paging.test.ts tests/history.test.ts` → all PASS (existing suites must be untouched by default-off).

- [ ] **Step 5: Commit + push**

```bash
pnpm run typecheck && npx eslint src/core/transform.ts tests/secret-guard-lanes.test.ts
git add -u && git add tests/secret-guard-lanes.test.ts
git commit -m "feat(secret-guard): guard the Anthropic slab and block image lanes" && git push
```

---

### Task 4: Anthropic history lane

**Files:**
- Modify: `src/core/history.ts` (chunk site, ~line 614–620: the `const withIds = appendIdsBlock(chunkRender);` block)
- Test: `tests/secret-guard-lanes.test.ts` (append)

**Interfaces:**
- Consumes: `guardImagedText` (Task 2).
- Produces: `collapseHistory` result `info.reason === 'secret_kept_text'` when a history chunk is blocked in `text` mode (collapse aborted — v1 keeps whole-history semantics simple); redacted chunk text + slot in `redact` mode.

- [ ] **Step 1: Write the failing test** (append; build a 12-turn history fixture that collapses — copy the shape of the existing "packs micro histories via reflow" fixture in `tests/history.test.ts` — with `DEPLOY_TOKEN=${SECRET}` inside turn 3):

```ts
describe('Anthropic history lane', () => {
  it('text: a secret-bearing history does not collapse into images', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    const { info } = await collapseHistoryFixtureWithSecret(); // helper in this file
    expect(info.reason).toBe('secret_kept_text');
    expect(info.collapsedImages ?? 0).toBe(0);
  });
  it('redact: history collapses and the rendered chunk text is masked', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const { info, renderedText } = await collapseHistoryFixtureWithSecret();
    expect(info.collapsedImages).toBeGreaterThan(0);
    expect(renderedText).toContain('[REDACTED:');
    expect(renderedText).not.toContain(SECRET);
  });
});
```

(The helper calls `collapseHistory` directly, like `tests/history.test.ts` does, and captures the render text via the same seam that suite uses; if no seam exists, assert on the factsheet text block emitted next to the history image instead — it is produced from the same guarded string.)

- [ ] **Step 2: Run to verify failure** — text-mode test fails (history still collapses).

- [ ] **Step 3: Implement.** In `history.ts`, immediately before the `appendIdsBlock(chunkRender)` block:

```ts
const chunkGuard = guardImagedText(chunkRender);
if (chunkGuard.blocked) {
  info.reason = 'secret_kept_text';
  return { messages, info }; // abort collapse — history stays native text
}
chunkRender = chunkGuard.text;
// keep chunkSlot aligned: redaction is length-changing, so rebuild the slot
// for the redacted spans with neutral marks (reuse neutralizeSentinel/roleSlotSegment
// helpers the file already imports) — 1:1 line alignment is what matters.
```

Import `guardImagedText`. Mirror the exact early-return shape the function already uses for its other bail-outs (grep `return { messages, info }` in the function for the pattern). Also pass `chunkGuard.text` into the history `factSheetText(...)` call.

- [ ] **Step 4: Run** — `npx vitest run tests/secret-guard-lanes.test.ts tests/history.test.ts` → PASS.

- [ ] **Step 5: Commit + push** — `git add -u && git commit -m "feat(secret-guard): guard the Anthropic history lane" && git push`

---

### Task 5: OpenAI lanes — both slabs + history sections

**Files:**
- Modify: `src/core/openai.ts` (`prepareImagedRenderText` ~line 298; slab sites ~lines 861 and 1081)
- Modify: `src/core/openai-history.ts` (the two `appendIdsBlock` application sites inside `planGptCollapse`, and the section render inside `planResponsesPairCollapse`)
- Test: `tests/secret-guard-lanes.test.ts` (append)

**Interfaces:**
- Consumes: `guardImagedText` (Task 2).
- Produces: `prepareImagedRenderText(text): { text: string; blocked: boolean; hits: number }` (signature change, both call sites updated); blocked slab → existing uncompressed path with `info.reason ??= 'secret_kept_text'`; blocked history section → that section is skipped (stays native), other sections still collapse.

- [ ] **Step 1: Write the failing tests** (append; mirror the fixture style of `tests/openai-gpt5.test.ts` — `transformOpenAIResponses` with `{ charsPerToken: 1, minCompressChars: 1 }`):

```ts
describe('OpenAI slab lane', () => {
  it('text: instructions with a secret stay native; reason=secret_kept_text', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    const r = await responsesFixtureWithSecret(); // BIG_INSTRUCTIONS + SECRET
    expect(r.info.compressed).toBe(false);
    expect(r.info.reason).toBe('secret_kept_text');
    expect(new TextDecoder().decode(r.body)).toContain(SECRET);
  });
  it('redact: images, and imageSourceText + factsheet are masked', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const r = await responsesFixtureWithSecret();
    expect(r.info.compressed).toBe(true);
    expect(r.info.imageSourceText).toContain('[REDACTED:');
    expect(r.info.imageSourceText).not.toContain(SECRET);
  });
});
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement.**

```ts
/** Guard + IDS for any text about to become an OpenAI-leg image. */
function prepareImagedRenderText(text: string): { text: string; blocked: boolean; hits: number } {
  const g = guardImagedText(text);
  return { text: g.blocked ? text : appendIdsBlock(g.text), blocked: g.blocked, hits: g.hits };
}
```

At both slab sites (`const renderedText = prepareImagedRenderText(header + combined);`):

```ts
const prep = prepareImagedRenderText(header + combined);
if (prep.hits > 0) info.secretHits = (info.secretHits ?? 0) + prep.hits;
if (prep.blocked) {
  info.reason ??= 'secret_kept_text';
  // take the same return path as `!gate.profitable` at this site (leave the
  // request untouched) — locate it directly below and mirror it.
}
const renderedText = prep.text;
```

Pass `prep.text` (minus the header — slice or guard `combined` separately if the factsheet input is the raw `combined`) into this site's `factSheetText(...)` call. In `openai-history.ts`, wrap each section render: `const g = guardImagedText(sectionRender); if (g.blocked) continue; sectionRender = o.idsBlock ? appendIdsBlock(g.text) : g.text;` (adapt to the exact local variable names at each site; the Responses pair-collapse section loop gets the identical treatment).

- [ ] **Step 4: Run** — `npx vitest run tests/secret-guard-lanes.test.ts tests/openai-gpt5.test.ts tests/openai-history.test.ts tests/grok-billing.test.ts tests/grok-gate.test.ts` → PASS.

- [ ] **Step 5: Commit + push** — `git commit -m "feat(secret-guard): guard the OpenAI slab and history-section lanes"`.

---

### Task 6: Amplification + never-mutate-traffic regressions (e2e)

**Files:**
- Test: `tests/secret-guard-lanes.test.ts` (append — no production code expected; any failure here is a Task 3–5 bug to fix in place)

- [ ] **Step 1: Write the tests**

1. **Amplification (the PR #21 + #28 interplay):** in `redact` mode, a slab containing `STRIPE_API_KEY=sk-live-abcdefghijklmnop1234` must produce (a) no occurrence of the raw key in any `info.imageSourceTexts` entry (the IDS block is rendered from guarded text), and (b) no occurrence in any text block of the transformed body except the client's own native text. In `off` mode, document the amplification as EXPECTED (assert the factsheet does contain the assignment) — this pins the flag's value story.
2. **Traffic invariance:** run the proxy e2e harness style from `tests/grok-gate.test.ts` (fakeUpstream + driveAndCapture) once per mode; assert the FORWARDED body observed by fakeUpstream still contains the raw secret byte-for-byte in all three modes (`off`, `text`, `redact`) — the guard must never sanitize what the client chose to send.
3. **Telemetry hygiene:** `JSON.stringify(info)` must never contain the raw secret in any mode.

- [ ] **Step 2: Run** — `npx vitest run tests/secret-guard-lanes.test.ts` → PASS (or fix the lane, never the assert).

- [ ] **Step 3: Commit + push** — `git commit -m "test(secret-guard): amplification and traffic-invariance regressions"`.

---

### Task 7: Telemetry, help text, CHANGELOG, final validation

**Files:**
- Modify: `src/core/transform.ts` (only if `secretHits` isn't already on `TransformInfo` from Task 3)
- Modify: `src/core/tracker.ts` (persist `secret_hits` next to the fields added for `responses_composition` — copy that pattern)
- Modify: `src/i18n/messages/en.json` (`cli.help`: add an `OMNIGLYPH_GUARD_SECRETS` block right after `OMNIGLYPH_KEEP_SYSTEM_TEXT`'s position — English only; ×41 translation is a follow-up, same as PR #26)
- Modify: `CHANGELOG.md` (`### Added`, neighbors' style, ends with `(thanks @rYo-STUDIO-1bit)`, no upstream URL)
- Test: `tests/tracker.test.ts` (append: event with `secret_hits` round-trips; copy the `responses_composition` test shape)

- [ ] **Step 1: Failing tracker test → Step 2: implement → Step 3: run file.**
- [ ] **Step 4: Full validation**

```bash
pnpm run lint && pnpm run typecheck && pnpm run build
pnpm test   # background; >2 min. Known flake: proxy-usage 4xx-gzip — re-run isolated to distinguish.
```

- [ ] **Step 5: Commit + push; update the ledger** (`docs/ops/port-upstream/port-tasks/_ported.jsonl`: upstream 39, kind "cut-down", branch, commit, note) — ledger is orchestrator-side if a subagent executes this task.

- [ ] **Step 6: Open the PR** — base `feat/port-responses-tool-pairs`, title `feat(secret-guard): keep credentials out of rendered artifacts (opt-in)`, body: problem (persistence + amplification surfaces), the three modes, decisions from the spec, traffic-invariance guarantee, test evidence. Note the stack (#28 → #29 → this).

## Self-review (done while writing)

- Spec coverage: detection (T1), redaction+mode (T2), slab lane (T3), block lane (T3), history lane (T4), OpenAI lanes (T5), extraction surfaces (T3/T5 factsheet inputs + IDS via guarded text), telemetry count-only (T3/T7), never-mutate traffic (T6), default off (T2), prefix mask (T2), no headers (nothing scans headers), stacked base (Global Constraints). `compressSystem` interplay is behavioral-only (different stack) — noted in spec, no code here.
- Placeholders: none — every code step shows code; the two "mirror the existing branch at this site" instructions name the exact branch to mirror and how to find it.
- Type consistency: `guardImagedText` return `{mode,text,hits,blocked}` used identically in T3/T4/T5; `SecretHit{start,end,kind}` only in T1/T2; `prepareImagedRenderText` new signature confined to T5 with both call sites listed.
