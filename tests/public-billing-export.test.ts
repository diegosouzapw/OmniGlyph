/**
 * Public API contract: Anthropic's vision billing must be importable from the
 * package root (`omniglyph`) so hosts like OmniRoute can make their token
 * estimators image-aware (type:image blocks are billed by dimension, not by
 * base64 char). Guards against accidental removal of the re-export.
 */
import { describe, expect, it } from 'vitest';
import {
  anthropicImageTokens,
  resolveAnthropicVisionTier,
  ANTHROPIC_IMAGE_BLOCK_OVERHEAD_TOKENS,
  ANTHROPIC_TIER_CAPS,
} from '../src/core/index.js';

describe('public billing export (root index)', () => {
  it('re-exports the measured billing with the canonical values', () => {
    expect(typeof anthropicImageTokens).toBe('function');
    expect(typeof resolveAnthropicVisionTier).toBe('function');
    // Measured vector (benchmarks/billing-sweep): standard page 1568×728 = 1456.
    expect(anthropicImageTokens(1568, 728, 'standard')).toBe(1456);
    expect(ANTHROPIC_IMAGE_BLOCK_OVERHEAD_TOKENS).toBe(4);
    expect(ANTHROPIC_TIER_CAPS.standard).toBeTruthy();
  });

  it('resolveAnthropicVisionTier classifies Fable 5', () => {
    expect(resolveAnthropicVisionTier('claude-fable-5')).toMatch(/standard|highres/);
  });
});
