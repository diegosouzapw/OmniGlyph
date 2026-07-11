import { describe, it, expect } from 'vitest';
import { isGrokModel, visionTokensForModel, GROK_TOKENS_PER_MEGAPIXEL, openAIVisionTokens } from '../src/core/openai.js';
import { openAICacheReadRate, openAIOutputRate, GROK_CACHE_READ_RATE, GROK_OUTPUT_RATE } from '../src/core/openai-savings.js';

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
