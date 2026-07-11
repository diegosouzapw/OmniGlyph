import { describe, it, expect } from 'vitest';
import {
  isGrokModel,
  visionTokensForModel,
  GROK_TOKENS_PER_MEGAPIXEL,
  openAIVisionTokens,
  evalOpenAIGate,
} from '../src/core/openai.js';
import { openAICacheReadRate, openAIOutputRate, GROK_CACHE_READ_RATE, GROK_OUTPUT_RATE } from '../src/core/openai-savings.js';
import { resolveModelProfile, WIRE_MAX_HEIGHT_PX } from '../src/core/openai-wire-profiles.js';
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
  it('resolves grok to the dense 9x12 opt-in profile', () => {
    const p = resolveModelProfile('grok-4.5');
    expect(p.stripCols).toBe(84);
    expect(p.maxHeightPx).toBe(WIRE_MAX_HEIGHT_PX);
    expect(p.detail).toBe('high');
    expect(p.style).toEqual({ cellWBonus: 4, cellHBonus: 4 });
  });
});

describe('Grok profitability gate uses resolved render-style geometry', () => {
  it('imageTokens reflect the effective 9x12 cell (wider strip + more pages), not the base 5x8', () => {
    // Same text, same cols, same charsPerToken for both models — isolates the
    // difference to the resolved style bonuses (grok's cellWBonus/cellHBonus)
    // rather than to differing stripCols. Long enough to span multiple pages
    // so the taller effective cell also changes the image *count*, not just
    // the per-image token price.
    const text = 'Follow the rules carefully. '.repeat(4000);
    const cols = 100;
    const cpt = 4;
    const grok = evalOpenAIGate('grok-4.5', text, cols, cpt);
    const gpt = evalOpenAIGate('gpt-5.6', text, cols, cpt);
    expect(grok.imageTokens).toBeGreaterThan(gpt.imageTokens);
  });
});

describe('OpenAI-wire gate: page count must match the actual render height', () => {
  // ~84k chars of prose — a slab that genuinely saves tokens when imaged at
  // Grok's dense 9x12 cell, but that the gate wrongly declined while it counted
  // pages at render.ts's 728px Anthropic-band default instead of the model's
  // real 2048px wire page height (the height the per-strip price already uses).
  const slab = 'Follow the rules carefully. '.repeat(3000);

  it('RECEIPT: the estimate at the profile maxHeightPx matches the real rendered page count; 728px over-counts', async () => {
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
      // The old 728px default strictly over-counts → over-costs the gate.
      expect(estAt728, model).toBeGreaterThan(imgs.length);
    }
  });

  it('a genuinely-saving Grok slab is judged profitable (was wrongly declined by the 728px over-count)', () => {
    const g = evalOpenAIGate('grok-4.5', slab, resolveModelProfile('grok-4.5').stripCols, 4);
    expect(g.profitable).toBe(true);
  });
});
