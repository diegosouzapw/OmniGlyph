/**
 * GPT (OpenAI Responses / Chat) history-collapse CONTRACT (TDD).
 *
 * The GPT path has NO `cache_control` markers — OpenAI prompt-caching is
 * automatic and prefix-based. So the whole game is byte-stability: keep the
 * collapsed-history image byte-identical as the conversation grows, so the
 * rendered prefix keeps hitting OpenAI's automatic prefix cache.
 *
 * Some of these pin behaviour that already holds; some are EXPECTED-FAIL today
 * and define the work:
 *   - APPEND-ONLY: frozen earlier chunks stay byte-identical as turns are added.
 *   - TOKEN FLOOR: the min-collapse gate is measured in o200k tokens, not chars.
 *
 * Run just this file:  pnpm vitest run tests/gpt-cache-align.test.ts
 */
import { describe, expect, it } from 'vitest';
import { planGptCollapse } from '../src/core/openai-history.js';
import type { HistoryTurn } from '../src/core/openai-history.js';

const yes = () => true;

/** N plain user/assistant turns, each `chars` long of body text. */
function plainTurns(n: number, chars = 1000): HistoryTurn[] {
  return Array.from({ length: n }, (_, i) => ({
    text: `--- ${i % 2 === 0 ? 'user' : 'assistant'} ---\n${'x'.repeat(chars)}`,
    openIds: [],
    closeIds: [],
    opaque: false,
  }));
}

/** Hex of the first image's PNG bytes — for byte-identity assertions. */
function firstPng(p: { images: { png: Uint8Array }[] }): string | undefined {
  const png = p.images[0]?.png;
  return png ? Buffer.from(png).toString('hex') : undefined;
}
function allPng(p: { images: { png: Uint8Array }[] }): string[] {
  return p.images.map((im) => Buffer.from(im.png).toString('hex'));
}

describe('GPT cache contract — invariants that should already hold', () => {
  it('is deterministic — same input twice = identical image bytes', async () => {
    const a = await planGptCollapse(plainTurns(40, 1000), 0, yes, { collapseChunk: 10 });
    const b = await planGptCollapse(plainTurns(40, 1000), 0, yes, { collapseChunk: 10 });
    expect(a.images.length).toBeGreaterThan(0);
    expect(allPng(a)).toEqual(allPng(b));
  });

  it('snaps the boundary to a chunk grid — text byte-stable within a window', async () => {
    const base = plainTurns(60, 1000);
    const a = await planGptCollapse(base.slice(0, 34), 0, yes, { collapseChunk: 10 });
    const b = await planGptCollapse(base.slice(0, 35), 0, yes, { collapseChunk: 10 });
    expect(a.endExclusive).toBe(b.endExclusive);
    expect(a.text).toBe(b.text);
  });

  it('emits no cache_control — GPT prefix cache is automatic, markerless', async () => {
    const plan = await planGptCollapse(plainTurns(40, 1000), 0, yes, { collapseChunk: 10 });
    // RenderedImage carries pixels only; the caller (openai.ts) splices a plain
    // synthetic user message with no cache_control. Nothing here adds a marker.
    for (const img of plan.images) {
      expect(img).not.toHaveProperty('cache_control');
    }
  });
});

describe('GPT cache contract — token floor (the design change)', () => {
  it('floor gate is measured in tokens (below_min_tokens), not chars', async () => {
    // A prefix far above any char floor — but a huge token floor must still
    // reject it, proving the unit is o200k tokens, not characters.
    const turns = plainTurns(40, 1000); // ~40k chars
    const plan = await planGptCollapse(turns, 0, yes, {
      collapseChunk: 10,
      minCollapseTokens: 10_000_000,
    });
    expect(plan.images).toHaveLength(0);
    expect(plan.reason).toBe('below_min_tokens');
  });

  it('collapses once the token count clears the floor', async () => {
    const turns = plainTurns(40, 1000);
    const plan = await planGptCollapse(turns, 0, yes, {
      collapseChunk: 10,
      minCollapseTokens: 0,
    });
    expect(plan.images.length).toBeGreaterThan(0);
  });
});

describe('GPT cache contract — APPEND-ONLY (EXPECTED FAIL today)', () => {
  it('earlier history image stays byte-identical as the conversation grows past a chunk', async () => {
    // a collapses [0..20); b collapses [0..40) — both pp=0, chunk=10.
    // The first frozen chunk [0..10) must render the SAME bytes in both, or the
    // grown prefix busts OpenAI's automatic prefix cache every turn.
    const base = plainTurns(60, 1000);
    const a = await planGptCollapse(base.slice(0, 28), 0, yes, { collapseChunk: 10 });
    const b = await planGptCollapse(base.slice(0, 48), 0, yes, { collapseChunk: 10 });
    expect(a.images.length).toBeGreaterThan(0);
    expect(b.images.length).toBeGreaterThan(0);
    // b collapses strictly more turns than a (crossed a chunk boundary).
    expect(b.endExclusive).toBeGreaterThan(a.endExclusive);
    // …but the FIRST frozen page must be byte-identical.
    expect(firstPng(b)).toBe(firstPng(a));
  });

  it('every image of the smaller collapse is a byte-identical prefix of the larger', async () => {
    const base = plainTurns(60, 1000);
    const a = await planGptCollapse(base.slice(0, 28), 0, yes, { collapseChunk: 10 });
    const b = await planGptCollapse(base.slice(0, 48), 0, yes, { collapseChunk: 10 });
    const aPng = allPng(a);
    const bPng = allPng(b);
    // Append-only: a's frozen chunk images are a prefix of b's image list.
    expect(bPng.slice(0, aPng.length)).toEqual(aPng);
  });
});

describe('GPT cache contract — TOKEN-LENGTH sectioning (the design)', () => {
  // Sections are sealed at deterministic cumulative-o200k-token boundaries from
  // protectedPrefix. A sealed section's bytes depend only on its turn range, so
  // it stays byte-identical (prefix-cache hit) as the conversation grows. Leftover
  // tail turns that don't fill a whole section are NOT collapsed (stay live text).

  it('a smaller section target produces more (smaller) image sections', async () => {
    const turns = plainTurns(40, 1000); // 128 o200k tokens/turn (~30 collapsible after keepTail/snap)
    const big = await planGptCollapse(turns, 0, yes, { sectionTokens: 1500 });
    const small = await planGptCollapse(turns, 0, yes, { sectionTokens: 600 });
    expect(big.images.length).toBeGreaterThan(0);
    expect(small.images.length).toBeGreaterThan(big.images.length);
  });

  it('seals sections by TOKEN target, not turn count: collapsedTurns ≈ sectionTokens/perTurn', async () => {
    // 128 tok/turn, sectionTokens=2000 → ~16 turns seal one section. Collapse end
    // lands on a section boundary (multiple of ~16), never mid-section.
    const turns = plainTurns(60, 1000);
    const plan = await planGptCollapse(turns, 0, yes, { sectionTokens: 2000 });
    expect(plan.collapsedTurns).toBeGreaterThanOrEqual(16);
    // collapsedTurns is a whole number of sealed sections (~16 turns each).
    expect(plan.collapsedTurns % 16).toBe(0);
  });

  it('every emitted image stays within the gpt-5.x patch budget (≤6000px, ≤10000 patches)', async () => {
    const plan = await planGptCollapse(plainTurns(80, 1500), 0, yes, { sectionTokens: 2000 });
    expect(plan.images.length).toBeGreaterThan(0);
    for (const im of plan.images) {
      expect(im.width).toBeLessThanOrEqual(6000);
      expect(im.height).toBeLessThanOrEqual(6000);
      const patches = Math.ceil(im.width / 32) * Math.ceil(im.height / 32);
      expect(patches).toBeLessThanOrEqual(10000);
    }
  });

  it('sealed sections are append-only byte-stable across growth (token-grid)', async () => {
    const base = plainTurns(90, 1000);
    const a = await planGptCollapse(base.slice(0, 40), 0, yes, { sectionTokens: 1500 });
    const b = await planGptCollapse(base.slice(0, 80), 0, yes, { sectionTokens: 1500 });
    expect(a.images.length).toBeGreaterThan(0);
    expect(b.endExclusive).toBeGreaterThan(a.endExclusive);
    // Every image a emitted (all sealed sections) is a byte-identical prefix of b.
    expect(allPng(b).slice(0, allPng(a).length)).toEqual(allPng(a));
  });
});
