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
