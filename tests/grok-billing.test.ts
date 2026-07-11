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
