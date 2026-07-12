import { describe, it, expect } from 'vitest';
import {
  isGrokModel,
  visionTokensForModel,
  GROK_TOKENS_PER_MEGAPIXEL,
  openAIVisionTokens,
  evalOpenAIGate,
} from '../src/core/openai.js';
import { openAICacheReadRate, openAIOutputRate, GROK_CACHE_READ_RATE, GROK_OUTPUT_RATE } from '../src/core/openai-savings.js';
import { resolveModelProfile } from '../src/core/openai-wire-profiles.js';
import { renderTextToPngs } from '../src/core/render.js';
import { estimateImageCount } from '../src/core/transform.js';

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

describe('Grok render profile', () => {
  it('resolves grok to the stock 5x8 white-AA opt-in profile (short pages, no grid)', () => {
    // Upstream re-measured pure-image on grok-4.5 (2026-07-11): the dense 9x12
    // cell confabulates exact IDs; stock Spleen 5x8 on white AA with short 512px
    // pages plus the in-image IDS block is the stable 4/4 recipe (7/7 retest).
    // paperGray 240 without grid confabulates ports; grid alone does not fix hex.
    const p = resolveModelProfile('grok-4.5');
    expect(p.stripCols).toBe(152);
    expect(p.maxHeightPx).toBe(512);
    expect(p.detail).toBe('high');
    expect(p.style).toEqual({
      aa: true,
      grid: false,
      gridCols: 0,
      colorCycle: false,
      cellWBonus: 0,
      cellHBonus: 0,
    });
    expect(resolveModelProfile('grok-4').stripCols).toBe(152);
  });

  it('keeps the strip at the 768px short-side floor with a REAL 5x8 cell', () => {
    const p = resolveModelProfile('grok-4.5');
    const cellW = 5 + (p.style?.cellWBonus ?? 0);
    const cellH = 8 + (p.style?.cellHBonus ?? 0);
    expect(cellW).toBe(5);
    expect(cellH).toBe(8);
    // 2*PAD_X (8) + 152 cols x 5px = 768px — exactly OpenAI's shortest-side floor.
    expect(8 + p.stripCols * cellW).toBe(768);
  });
});

describe('OpenAI-wire gate: pages and last-page height must match the actual render', () => {
  // ~84k chars of prose — spans multiple pages with a PARTIAL last page, so the
  // residual-height last-page math is actually exercised.
  const slab = 'Follow the rules carefully. '.repeat(3000);

  it('RECEIPT: the estimate at the profile maxHeightPx matches the real rendered page count; a wrong height mis-counts', async () => {
    for (const model of ['grok-4.5', 'gpt-5.6']) {
      const prof = resolveModelProfile(model);
      const cols = prof.stripCols;
      const style = prof.style ?? {};
      const cellH = 8 + (style.cellHBonus ?? 0);
      const imgs = await renderTextToPngs(slab, cols, style, prof.maxHeightPx);
      const estAtProfile = estimateImageCount(slab, cols, 1, undefined, prof.maxHeightPx, cellH);
      const estAt728 = estimateImageCount(slab, cols, 1, undefined, 728, cellH);
      // Estimate at the render's own height tracks the actual page count (±1).
      expect(Math.abs(estAtProfile - imgs.length), `${model}: est ${estAtProfile} vs real ${imgs.length}`).toBeLessThanOrEqual(1);
      // The 728px Anthropic-band default mis-counts in whichever direction the
      // profile height diverges: gpt (2048) over-counts, grok (512) under-counts.
      if (prof.maxHeightPx > 728) expect(estAt728, model).toBeGreaterThan(imgs.length);
      else expect(estAt728, model).toBeLessThan(imgs.length);
    }
  });

  it('RECEIPT: gate imageTokens equal the real rendered PNG token bill for Grok (residual last page), and never under-state it for GPT', async () => {
    for (const model of ['grok-4.5', 'gpt-5.6']) {
      const prof = resolveModelProfile(model);
      const cols = prof.stripCols;
      const imgs = await renderTextToPngs(slab, cols, prof.style ?? {}, prof.maxHeightPx);
      const realTokens = imgs.reduce((n, im) => n + visionTokensForModel(model, im.width, im.height), 0);
      const est = evalOpenAIGate(model, slab, cols, 1).imageTokens;
      if (model === 'grok-4.5') {
        // Height binds Grok pages (63 rows < the 184-row char budget), so full
        // pages render at exactly maxHeightPx and the last page at its residual
        // height — the gate's bill must equal the real one, token for token.
        expect(est, `${model}: est ${est} vs real ${realTokens}`).toBe(realTokens);
        // And the residual fix is live: strictly cheaper than billing every
        // page as a full 512px strip (the pre-fix math).
        const fullStrip = visionTokensForModel(model, imgs[0]!.width, prof.maxHeightPx);
        expect(est).toBeLessThan(imgs.length * fullStrip);
      } else {
        // GPT pages are char-budget-bound below maxHeightPx; the gate charges
        // full pages at maxHeightPx (conservative) — it must never UNDER-state
        // the real bill, or a net-loss slab could slip through.
        expect(est, `${model}: est ${est} vs real ${realTokens}`).toBeGreaterThanOrEqual(realTokens);
      }
    }
  });

  it('a genuinely-saving Grok slab is judged profitable at the default gate', () => {
    const g = evalOpenAIGate('grok-4.5', slab, resolveModelProfile('grok-4.5').stripCols, 4);
    expect(g.profitable).toBe(true);
  });

  it('a single short page is billed at residual height, not a full strip', () => {
    const short = 'Keep the retry budget at 3 attempts. '.repeat(20); // < 1 page
    const cols = resolveModelProfile('grok-4.5').stripCols;
    const g = evalOpenAIGate('grok-4.5', short, cols, 1);
    const fullStrip = visionTokensForModel('grok-4.5', 768, 512);
    expect(g.imageTokens).toBeLessThan(fullStrip);
  });
});
