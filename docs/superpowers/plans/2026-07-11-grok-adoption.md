# Grok Adoption (PR2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Grok as an opt-in, fail-closed-gated model on the OpenAI-compatible wire leg, with its own render style (denser cell) and exact xAI billing, without changing any GPT behavior.

**Architecture:** Extend the provider-neutral `ModelProfile` with an optional render `style`, thread that style through the existing render call sites (GPT keeps `{}` → byte-identical), price Grok images by a measured pixel model and its xAI cache/output rates, and gate Grok behind a second "unverified" predicate that only lets it image after an explicit operator acknowledgement (until our own reading receipt lands).

**Tech Stack:** TypeScript (strict, ESM, `.js` import suffixes), vitest, pnpm.

**Base branch:** this plan's worktree is branched from `refactor/openai-wire-profiles-rename` (PR1, the rename), NOT `main` — PR1 is not merged yet. The worktree `.claude/worktrees/grok-provider` already exists on branch `feat/grok-adoption`.

## Global Constraints

- Strict TDD: write the failing test first, watch it fail for the right reason, then the minimal implementation. No production code without a test.
- Never weaken the fail-closed model gate or the profitability gate to go green. Grok is OFF by default and stays fail-closed (opt-in + unverified-ack).
- Any GPT behavior change is a regression: Tasks 1-2 must keep the full suite byte-identical (same pass count as the branch base).
- ESM only; TS imports use the `.js` suffix. Full validation before each commit: `pnpm run lint && pnpm run typecheck && pnpm test && pnpm run build` — all clean. The suite is >2min; run it in the background.
- Rebrand guard (`tests/docs-integrity.test.ts`, part of the suite): no upstream project/author names in tracked files. Attribution goes ONLY in commit trailers, derived from git at commit time (see "Attribution" below) — never written literally into a tracked file.
- No AI attribution trailers.
- Exact Grok values are MEASURED constants copied verbatim from the upstream commits — do not round or invent: `GROK_TOKENS_PER_MEGAPIXEL = 1000`, `GROK_CACHE_READ_RATE = 0.25`, `GROK_OUTPUT_RATE = 3`, Grok `stripCols = 84`, Grok style `{ cellWBonus: 4, cellHBonus: 4 }` (Spleen 5×8 + 4px spacing = effective 9×12), Grok `maxHeightPx = WIRE_MAX_HEIGHT_PX` (2048, our current constant — deliberately NOT the upstream 1932; our GPT profiles already use 2048).

## Attribution (every commit)

Derive the trailer from git so no upstream name lands in a tracked file. Each task's commit cites the upstream commit that sourced it (`cd4c9ef` for profile/style/pixel-vision, `5eb80a4` for the Grok rates + gate framing). Template:

```bash
CO=$(git show -s --format='Co-authored-by: %an <%ae>' <SRC_SHA>)
INSP="Inspired-by: $(git remote get-url upstream | sed 's/\.git$//')/commit/<SRC_SHA>"
git commit -m "$(printf '%s\n\n%s\n\n%s\n%s\n' '<subject>' '<body>' "$CO" "$INSP")"
```

---

### Task 1: Add optional render `style` to ModelProfile and thread it through rendering (GPT byte-identical)

**Files:**
- Modify: `src/core/openai-wire-profiles.ts` (`ModelProfile` interface ~line 36; `parseEnvProfiles` ~line 187)
- Modify: `src/core/openai.ts` (render call sites: the two `renderTextToPngs(renderedText, cols, {}, ...)` at ~690 and ~897)
- Modify: `src/core/openai-history.ts` (render call site `renderTextToPngs(sectionRender, o.cols, {}, o.maxHeightPx)` ~383; thread a `style` through `GptHistoryOptions`/`planGptCollapse`)
- Test: `tests/gpt-billing-audit.test.ts` (resolver still returns the same 4 fields for GPT; `.style` is undefined for GPT)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ModelProfile.style?: RenderStyle` (optional, imported `type RenderStyle` from `./render.js`). When absent, render call sites pass `{}` (current behavior). `resolveModelProfile(model).style` is `undefined` for every current model.

- [ ] **Step 1: Write the failing test** — add to `tests/gpt-billing-audit.test.ts`:

```ts
import { resolveModelProfile } from '../src/core/openai-wire-profiles.js';

it('current GPT models carry no render style (style stays byte-identical default)', () => {
  for (const m of ['gpt-5.6', 'gpt-5-chat-latest', 'o4-mini', 'gpt-4o-mini']) {
    // No style field on any shipped GPT profile → renderer keeps its {} default.
    expect(resolveModelProfile(m).style, m).toBeUndefined();
  }
});
```

- [ ] **Step 2: Run it — verify it fails** — `npx vitest run tests/gpt-billing-audit.test.ts -t 'render style'` → FAIL (`style` not a property yet → TS error or undefined-access mismatch). If it passes trivially (undefined === undefined), that's acceptable as a guard; proceed.

- [ ] **Step 3: Add the optional field** — in `src/core/openai-wire-profiles.ts`, add a type-only import at the top with the other imports: `import type { RenderStyle } from './render.js';` and add to the `ModelProfile` interface after `detail`:

```ts
  /** Optional per-model render style (glyph cell padding, grid, marker). Absent
   *  for GPT/o-series (they render at the default 5×8 cell); set only for models
   *  that measured better at a denser cell (e.g. Grok's effective 9×12). */
  style?: RenderStyle;
```

Then in `parseEnvProfiles`, preserve an override's `style` (fall back to `base.style`): add `style: p.style ?? base.style,` to the object built in the loop.

- [ ] **Step 4: Thread the style at the render call sites** — replace the hardcoded `{}` with the resolved style:
  - `src/core/openai.ts` ~690: `const images = await renderTextToPngs(renderedText, cols, resolveModelProfile(req.model).style ?? {}, resolveModelProfile(req.model).maxHeightPx);`
  - `src/core/openai.ts` ~897 (Responses path): same replacement.
  - `src/core/openai-history.ts` ~383: the render must use the profile style. Thread a `style?: RenderStyle` field through `GptHistoryOptions` (add the field), set it from the caller in `openai.ts` where `planGptCollapse` is invoked (the two `cols:/maxHeightPx:` option blocks at ~750-751 and ~988-989 gain `style: resolveModelProfile(req.model).style`), and at line ~383 pass `o.style ?? {}` instead of `{}`.

- [ ] **Step 5: Run the focused test + typecheck** — `npx vitest run tests/gpt-billing-audit.test.ts` (green) and `pnpm run typecheck` (clean — a type-only import must not create a runtime cycle; `render.ts` does not import from `openai-wire-profiles.ts`, so this is safe).

- [ ] **Step 6: Full suite — must be byte-identical** — `pnpm test` in the background. Expected: same pass count as the branch base (the `feat/grok-adoption` HEAD before this task). GPT profiles have no `style` → `?? {}` → identical render calls. If ANY render/e2e test changes output, a threading edit changed behavior — fix the edit; do not touch assertions.

- [ ] **Step 7: Lint + build, then commit** — `pnpm run lint && pnpm run build`, then commit with the attribution template (`SRC_SHA=cd4c9ef`), subject `feat(profiles): thread an optional per-model render style through the OpenAI-wire renderer`.

---

### Task 2: Add the neutral `OMNIGLYPH_MODEL_PROFILES` env name (alias of the GPT one)

**Files:**
- Modify: `src/core/openai-wire-profiles.ts` (`envProfiles` ~line 197)
- Test: `tests/gpt-billing-audit.test.ts`

**Interfaces:**
- Consumes: Task 1's `style` field (override can now carry style).
- Produces: `resolveModelProfile` reads `OMNIGLYPH_MODEL_PROFILES` OR the legacy `OMNIGLYPH_GPT_PROFILES` (the neutral name wins if both are set).

- [ ] **Step 1: Failing test** — add to `tests/gpt-billing-audit.test.ts`:

```ts
import { afterEach } from 'vitest';
afterEach(() => { delete process.env.OMNIGLYPH_MODEL_PROFILES; delete process.env.OMNIGLYPH_GPT_PROFILES; });

it('OMNIGLYPH_MODEL_PROFILES overrides a profile (neutral env name)', () => {
  process.env.OMNIGLYPH_MODEL_PROFILES = JSON.stringify({ 'gpt-5.6': { stripCols: 99 } });
  expect(resolveModelProfile('gpt-5.6').stripCols).toBe(99);
});

it('legacy OMNIGLYPH_GPT_PROFILES still works', () => {
  process.env.OMNIGLYPH_GPT_PROFILES = JSON.stringify({ 'gpt-5.6': { stripCols: 77 } });
  expect(resolveModelProfile('gpt-5.6').stripCols).toBe(77);
});
```

- [ ] **Step 2: Run — verify the neutral-name test fails** — `npx vitest run tests/gpt-billing-audit.test.ts -t 'neutral env name'` → FAIL (99 !== the built-in stripCols, because only `OMNIGLYPH_GPT_PROFILES` is read today). The legacy test passes already.

- [ ] **Step 3: Implement** — in `envProfiles()`, read the neutral name first, then the legacy fallback:

```ts
function envProfiles(): Map<string, ModelProfile> {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const raw = (env && (env.OMNIGLYPH_MODEL_PROFILES || env.OMNIGLYPH_GPT_PROFILES)) || '';
  if (raw !== envRaw) {
    envRaw = raw;
    envMap = parseEnvProfiles(raw);
  }
  return envMap;
}
```

- [ ] **Step 4: Run the two tests — green** — `npx vitest run tests/gpt-billing-audit.test.ts -t 'env name'` and `-t 'legacy'`.

- [ ] **Step 5: Update the doc comment** — in `openai-wire-profiles.ts`, the header/example comments may now name `OMNIGLYPH_MODEL_PROFILES` as the primary and note `OMNIGLYPH_GPT_PROFILES` as the accepted legacy alias — both are now live, so this is accurate (unlike PR1, where only the legacy name worked).

- [ ] **Step 6: Full suite + lint + build + commit** — `SRC_SHA=cd4c9ef`, subject `feat(profiles): accept the provider-neutral OMNIGLYPH_MODEL_PROFILES env name`.

---

### Task 3: Grok image pricing by measured pixel model (`visionTokensForModel`)

**Files:**
- Modify: `src/core/openai.ts` (add `isGrokModel`, `GROK_TOKENS_PER_MEGAPIXEL`, `visionTokensForModel` near `openAIVisionTokens` ~line 93; swap the two pricing call sites at ~486 and ~525)
- Test: `tests/gpt-billing-audit.test.ts` (or a focused `tests/grok-billing.test.ts` — a new file is fine)

**Interfaces:**
- Consumes: nothing from Tasks 1-2.
- Produces: `isGrokModel(model): boolean`; `GROK_TOKENS_PER_MEGAPIXEL = 1000`; `visionTokensForModel(model: string, w: number, h: number): number` — Grok → `max(1, ceil(w*h/1_000_000 * 1000))`, everything else → `openAIVisionTokens(model, w, h)`.

- [ ] **Step 1: Failing test** — create `tests/grok-billing.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isGrokModel, visionTokensForModel, GROK_TOKENS_PER_MEGAPIXEL, openAIVisionTokens } from '../src/core/openai.js';

describe('Grok pixel vision pricing', () => {
  it('detects grok models', () => {
    expect(isGrokModel('grok-4.5')).toBe(true);
    expect(isGrokModel('gpt-5.6')).toBe(false);
    expect(isGrokModel(null)).toBe(false);
  });
  it('prices Grok by measured tokens/megapixel', () => {
    expect(GROK_TOKENS_PER_MEGAPIXEL).toBe(1000);
    // 764x980 ≈ 0.7487 MPix → ceil(748.72) = 749
    expect(visionTokensForModel('grok-4.5', 764, 980)).toBe(749);
    // never below 1 image token
    expect(visionTokensForModel('grok-4.5', 1, 1)).toBe(1);
  });
  it('leaves GPT pricing on the OpenAI tile/patch formula', () => {
    expect(visionTokensForModel('gpt-5.6', 768, 728)).toBe(openAIVisionTokens('gpt-5.6', 768, 728));
  });
});
```

- [ ] **Step 2: Run — verify it fails** — `npx vitest run tests/grok-billing.test.ts` → FAIL (`isGrokModel`/`visionTokensForModel` not exported).

- [ ] **Step 3: Implement** — in `src/core/openai.ts`, just below `openAIVisionTokens` (~line 104), add:

```ts
/** True for xAI Grok models (served on the OpenAI-compatible wire). */
export function isGrokModel(model: string | null | undefined): boolean {
  return (model ?? '').toLowerCase().startsWith('grok-');
}

/** Measured 2026-07-09 on grok-4.5: image-token delta ≈ 1000 per megapixel
 *  across several page sizes (768×336 → 268, 764×980 → 748, …). */
export const GROK_TOKENS_PER_MEGAPIXEL = 1000;

/** Per-image vision-token cost for the model actually serving the request.
 *  Grok bills by measured tokens/MPix; GPT/o-series use the OpenAI tile/patch
 *  formula. Model-based, not endpoint-based. */
export function visionTokensForModel(model: string, w: number, h: number): number {
  if (isGrokModel(model)) {
    const pixels = Math.max(0, w) * Math.max(0, h);
    return Math.max(1, Math.ceil((pixels / 1_000_000) * GROK_TOKENS_PER_MEGAPIXEL));
  }
  return openAIVisionTokens(model, w, h);
}
```

- [ ] **Step 4: Swap the two pricing call sites** to be model-aware:
  - `openai.ts` ~486: `const perStrip = visionTokensForModel(model, stripW, resolveModelProfile(model).maxHeightPx);`
  - `openai.ts` ~525: `for (const img of images) n += visionTokensForModel(model, img.width, img.height);`

- [ ] **Step 5: Run the test — green** — `npx vitest run tests/grok-billing.test.ts`. The GPT-equivalence test proves the swap is byte-identical for GPT (`visionTokensForModel` falls through to `openAIVisionTokens`).

- [ ] **Step 6: Full suite + lint + build + commit** — `SRC_SHA=cd4c9ef`, subject `feat(openai): price Grok images by measured tokens-per-megapixel`.

---

### Task 4: Grok cache-read and output rates

**Files:**
- Modify: `src/core/openai-savings.ts` (constants ~line 20; `openAICacheReadRate` ~line 29; `openAIOutputRate` ~line 35)
- Test: `tests/grok-billing.test.ts`

**Interfaces:**
- Produces: `GROK_CACHE_READ_RATE = 0.25`, `GROK_OUTPUT_RATE = 3`; `openAICacheReadRate('grok-4.5') === 0.25`, `openAIOutputRate('grok-4.5') === 3`.

- [ ] **Step 1: Failing test** — add to `tests/grok-billing.test.ts`:

```ts
import { openAICacheReadRate, openAIOutputRate, GROK_CACHE_READ_RATE, GROK_OUTPUT_RATE } from '../src/core/openai-savings.js';

describe('Grok billing rates', () => {
  it('uses xAI cache/output ratios for grok', () => {
    expect(GROK_CACHE_READ_RATE).toBe(0.25);
    expect(GROK_OUTPUT_RATE).toBe(3);
    expect(openAICacheReadRate('grok-4.5')).toBe(0.25);
    expect(openAIOutputRate('grok-4.5')).toBe(3);
  });
  it('leaves gpt-5 rates unchanged', () => {
    expect(openAICacheReadRate('gpt-5.6')).toBe(0.1);
    expect(openAIOutputRate('gpt-5.6')).toBe(8);
  });
});
```

- [ ] **Step 2: Run — verify it fails** — `npx vitest run tests/grok-billing.test.ts -t 'xAI cache'` → FAIL (grok falls into the generic `0.5`/`4` fallback).

- [ ] **Step 3: Implement** — in `src/core/openai-savings.ts`, add the constants near the GPT ones:

```ts
/** Grok cached prompt list ratio from xAI model pricing metadata. */
export const GROK_CACHE_READ_RATE = 0.25;
/** Grok completion/input list ratio from xAI model pricing metadata. */
export const GROK_OUTPUT_RATE = 3;
```

Add a `grok-` branch before the fallback in each function:
```ts
export function openAICacheReadRate(model: string | undefined): number {
  const m = (model ?? '').toLowerCase();
  if (/^gpt-5/.test(m)) return OPENAI_GPT5_CACHE_READ_RATE;
  if (m.startsWith('grok-')) return GROK_CACHE_READ_RATE;
  return 0.5;
}
export function openAIOutputRate(model: string | undefined): number {
  const m = (model ?? '').toLowerCase();
  if (/^gpt-5/.test(m)) return OPENAI_GPT5_OUTPUT_RATE;
  if (m.startsWith('grok-')) return GROK_OUTPUT_RATE;
  return 4;
}
```

- [ ] **Step 4: Run the test — green** — `npx vitest run tests/grok-billing.test.ts`.

- [ ] **Step 5: Full suite + lint + build + commit** — `SRC_SHA=5eb80a4`, subject `feat(openai): apply xAI cache/output rates for Grok savings math`.

---

### Task 5: The `grok-*` profile rule

**Files:**
- Modify: `src/core/openai-wire-profiles.ts` (`BUILTIN_RULES`, before the fallthrough)
- Test: `tests/grok-billing.test.ts`

**Interfaces:**
- Consumes: Task 1's `ModelProfile.style`.
- Produces: `resolveModelProfile('grok-4.5')` → `{ vision: <placeholder tile 85/170>, stripCols: 84, maxHeightPx: WIRE_MAX_HEIGHT_PX, detail: 'high', style: { cellWBonus: 4, cellHBonus: 4 } }`.

- [ ] **Step 1: Failing test** — add to `tests/grok-billing.test.ts`:

```ts
import { resolveModelProfile, WIRE_MAX_HEIGHT_PX } from '../src/core/openai-wire-profiles.js';

describe('Grok render profile', () => {
  it('resolves grok to the dense 9x12 opt-in profile', () => {
    const p = resolveModelProfile('grok-4.5');
    expect(p.stripCols).toBe(84);
    expect(p.maxHeightPx).toBe(WIRE_MAX_HEIGHT_PX);
    expect(p.detail).toBe('high');
    expect(p.style).toEqual({ cellWBonus: 4, cellHBonus: 4 });
  });
});
```

- [ ] **Step 2: Run — verify it fails** — `npx vitest run tests/grok-billing.test.ts -t 'dense 9x12'` → FAIL (grok falls to `DEFAULT_MODEL_PROFILE`: stripCols 152, no style).

- [ ] **Step 3: Implement** — add to `BUILTIN_RULES` (before the array closes, order is fine — no other rule matches `grok-`):

```ts
  // Grok (Responses path), opt-in only. Live climb 2026-07-09 on grok-4.5: 5×8
  // and 7×10 confabulate exact IDs; effective 9×12 (Spleen 5×8 + 4px spacing) is
  // the densest arm that reached 4/4 exact, 0 confab. The verbatim fact-sheet
  // rides beside the images as defense in depth. Vision numbers here are a
  // conservative placeholder — visionTokensForModel prices Grok by pixels.
  {
    test: (m) => /^grok-/.test(m),
    profile: {
      vision: { regime: 'tile', base: 85, perTile: 170 },
      stripCols: 84,
      maxHeightPx: H,
      detail: 'high',
      style: { cellWBonus: 4, cellHBonus: 4 },
    },
  },
```

- [ ] **Step 4: Run the test — green** — `npx vitest run tests/grok-billing.test.ts`.

- [ ] **Step 5: Full suite + lint + build + commit** — `SRC_SHA=cd4c9ef`, subject `feat(profiles): add the opt-in grok-* dense render profile`.

---

### Task 6: The fail-closed "unverified" gate

**Files:**
- Modify: `src/core/applicability.ts` (reason union ~line 3; add `UNVERIFIED_MODEL_BASES`, `OMNIGLYPH_UNVERIFIED_MODELS` parsing, `isModelImageable`)
- Modify: `src/core/proxy.ts` (~832-847, the OpenAI-leg gate)
- Test: `tests/grok-gate.test.ts` (new)

**Interfaces:**
- Produces in `applicability.ts`: `isModelImageable(model): boolean` — `true` for any model that is NOT an unverified base, and for an unverified base ONLY when it is acked via `OMNIGLYPH_UNVERIFIED_MODELS`. New reason `'model_unverified'`.
- `proxy.ts` sets `r.info.reason = 'model_unverified'` and forces `compress: false` when the model is supported but not imageable.

- [ ] **Step 1: Failing test** — create `tests/grok-gate.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { isModelImageable } from '../src/core/applicability.js';

afterEach(() => { delete process.env.OMNIGLYPH_UNVERIFIED_MODELS; });

describe('unverified-model gate', () => {
  it('a verified model is always imageable', () => {
    expect(isModelImageable('gpt-5.6')).toBe(true);
    expect(isModelImageable('claude-fable-5')).toBe(true);
  });
  it('grok is NOT imageable without an explicit ack', () => {
    expect(isModelImageable('grok-4.5')).toBe(false);
  });
  it('grok becomes imageable with OMNIGLYPH_UNVERIFIED_MODELS ack', () => {
    process.env.OMNIGLYPH_UNVERIFIED_MODELS = 'grok-4.5';
    expect(isModelImageable('grok-4.5')).toBe(true);
  });
  it('an ack for a different grok variant does not cover this one', () => {
    process.env.OMNIGLYPH_UNVERIFIED_MODELS = 'grok-9';
    expect(isModelImageable('grok-4.5')).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify it fails** — `npx vitest run tests/grok-gate.test.ts` → FAIL (`isModelImageable` not exported).

- [ ] **Step 3: Implement in `applicability.ts`** — add `'model_unverified'` to `OmniGlyphApplicabilityReason`, and after `isAllowed`:

```ts
/** Bases that pass reading only on upstream's n=1 evidence, not OmniGlyph's own.
 *  Fail-closed: they may be opted into OMNIGLYPH_MODELS, but stay text-only
 *  until an operator explicitly acks the risk (OMNIGLYPH_UNVERIFIED_MODELS) —
 *  and are removed from this list only when OmniGlyph's own reading receipt
 *  clears them (measurement before claims). */
const UNVERIFIED_MODEL_BASES = ['grok'];

function isUnverifiedBase(model: string | null | undefined): boolean {
  if (typeof model !== 'string') return false;
  const base = baseModelId(model);
  return UNVERIFIED_MODEL_BASES.some((b) => base === b || base.startsWith(`${b}-`));
}

function unverifiedAckBases(): string[] {
  const raw = typeof process !== 'undefined' ? process.env?.OMNIGLYPH_UNVERIFIED_MODELS : undefined;
  if (!raw || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/** True when OmniGlyph may actually IMAGE this model (vs pass it through as
 *  text). Verified models: always. Unverified bases (e.g. grok): only when the
 *  exact base is acked via OMNIGLYPH_UNVERIFIED_MODELS. */
export function isModelImageable(model: string | null | undefined): boolean {
  if (!isUnverifiedBase(model)) return true;
  const base = baseModelId(model as string);
  return unverifiedAckBases().some((b) => base === b || base.startsWith(`${b}-`));
}
```

- [ ] **Step 4: Run the unit test — green** — `npx vitest run tests/grok-gate.test.ts`.

- [ ] **Step 5: Wire it into the proxy** — in `src/core/proxy.ts` (~832-847), import `isModelImageable`, and change the gate so a supported-but-unverified model passes through with the specific reason:

```ts
const modelOk = isMessages
  ? isOmniGlyphSupportedModel(model)
  : isOmniGlyphSupportedGptModel(model);
const imageOk = modelOk && isModelImageable(model);
const effectiveOpts = imageOk
  ? transformOpts
  : { ...transformOpts, compress: false };
// ...after the transform call:
if (!modelOk) r.info.reason = 'unsupported_model';
else if (!imageOk) r.info.reason = 'model_unverified';
```

- [ ] **Step 6: Add a proxy-level e2e for the reason** — add to `tests/grok-gate.test.ts` a test driving `createProxy` with a `grok-4.5` `/v1/chat/completions` body (see the fake-upstream pattern in `tests/savings-math-e2e.test.ts`): with `OMNIGLYPH_MODELS=grok-4.5` and NO ack, assert `event.info?.reason === 'model_unverified'` and the forwarded body has no `image_url`; with the ack set, assert it compresses. (Copy the `fakeUpstream`/`driveAndCapture` helpers from `savings-math-e2e.test.ts`; pin `OMNIGLYPH_MODELS`/`OMNIGLYPH_UNVERIFIED_MODELS` in `beforeAll`/`afterAll` like that file does.)

- [ ] **Step 7: Full suite + lint + build + commit** — `SRC_SHA=5eb80a4`, subject `feat(gate): fail-closed unverified-model gate (Grok opt-in requires an explicit ack)`.

---

### Task 7: CHANGELOG + resolver/gate doc note

**Files:**
- Modify: `CHANGELOG.md` (Added section under `[Unreleased]`)
- Test: none (docs); the rebrand guard + docs-integrity in the suite cover it.

- [ ] **Step 1: Add the CHANGELOG entries** — under `### Added` in `[Unreleased]` (no maintainer handle — rebrand guard):

```markdown
- **feat(grok):** opt-in support for xAI **Grok** on the OpenAI-compatible wire.
  Grok renders at an effective 9×12 cell (denser than the 5×8 default) with the
  verbatim fact-sheet, is priced by a measured ~1000 tokens/megapixel model and
  xAI cache/output rates, and stays **fail-closed**: even in `OMNIGLYPH_MODELS`
  it is text-only until an operator explicitly acks the risk via
  `OMNIGLYPH_UNVERIFIED_MODELS=grok-4.5` — pending OmniGlyph's own reading
  receipt. The OpenAI-wire profile resolver is now provider-neutral and accepts
  the `OMNIGLYPH_MODEL_PROFILES` env (legacy `OMNIGLYPH_GPT_PROFILES` still
  works).
```

- [ ] **Step 2: Verify the rebrand guard + docs-integrity** — `npx vitest run tests/docs-integrity.test.ts` → 5/5.

- [ ] **Step 3: Full suite + lint + build + commit** — `SRC_SHA=5eb80a4`, subject `docs(changelog): note opt-in Grok support and the neutral profile env`.

- [ ] **Step 4: Push + open the PR (stacked on PR1, left OPEN)**:

```bash
git push -u origin feat/grok-adoption
gh pr create --repo diegosouzapw/OmniGlyph --base refactor/openai-wire-profiles-rename \
  --head feat/grok-adoption \
  --title "feat(grok): opt-in Grok adoption on the OpenAI-wire leg (fail-closed)" \
  --body "Adds Grok as an opt-in, fail-closed-gated model: dense 9×12 render style, measured pixel + xAI-rate billing, and an unverified-model gate that keeps Grok text-only until an explicit ack (and, later, our own reading receipt). GPT behavior unchanged (Tasks 1-2 byte-identical). Stacked on the PR1 rename; base retargets to main when PR1 merges. Attribution in the commit trailers."
```

---

## Self-Review

**Spec coverage:** implements PR2 of `docs/superpowers/specs/2026-07-11-grok-provider-profiles-design.md` — style field + threading (T1), neutral env (T2), Grok pixel billing (T3), Grok rates (T4), grok profile (T5), unverified gate (T6), changelog (T7). Deviations from the spec, deliberate and noted here: (a) the `factsheet: true` profile flag is DROPPED — the fact-sheet is already unconditional on the OpenAI-wire leg, so the flag would be vestigial (YAGNI); (b) Grok `maxHeightPx` uses our `WIRE_MAX_HEIGHT_PX` (2048), not the upstream 1932, matching our current GPT profiles; (c) no third `VisionCost` regime — Grok pricing lives in `visionTokensForModel`, exactly as upstream does. The measurement harness (PR3) and the chart are out of scope, as the spec states.

**Placeholder scan:** none — every step has exact code or an exact old→new edit with file:line.

**Type consistency:** `ModelProfile.style?: RenderStyle` (T1) is consumed by the grok rule (T5) and threaded in T1; `visionTokensForModel` (T3) is used by the pricing swaps in T3; `isModelImageable` (T6) is used in proxy.ts (T6). `WIRE_MAX_HEIGHT_PX` and `H` are the same constant (`H = WIRE_MAX_HEIGHT_PX`), used consistently.

## Follow-on

- **PR3 — measurement:** adapt the Grok reading harness to `eval/grok-density/` with `--via-cli`/`--via-omniroute`, run it via the xAI subscription ($0), commit the receipt, and — if it clears 4/4 exact / 0 confab / positive savings — remove `grok` from `UNVERIFIED_MODEL_BASES` (the one-line flip backed by the committed receipt).
- **Chart** (`8d7ba3e`): separate lightweight track.
