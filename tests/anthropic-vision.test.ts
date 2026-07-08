/**
 * TDD spec for src/core/anthropic-vision.ts — measured Anthropic vision billing
 * (28 px patches + per-tier resize caps) and the per-tier page geometry.
 *
 * Ground truth: benchmarks/billing-sweep run of 2026-07-05 (results/sweep-*.jsonl).
 * Every geometry measured exactly ceil(w/28)×ceil(h/28) after tier resize,
 * plus a fixed per-image-block overhead (+3 on claude-fable-5, +4 on
 * claude-sonnet-4-5). claude-fable-5 got the high-resolution caps (2576 px /
 * 4784 visual tokens): 1928×1928 billed 4764 = 69×69 + 3, NOT resampled.
 */
import { describe, expect, it } from 'vitest';
import {
  ANTHROPIC_IMAGE_BLOCK_OVERHEAD_TOKENS,
  HIGHRES_PAGE,
  STANDARD_PAGE,
  anthropicImageTokens,
  pageGeometryForTier,
  resolveAnthropicVisionTier,
} from '../src/core/anthropic-vision.js';
import { CELL_H, CELL_W, PAD_X, PAD_Y } from '../src/core/render.js';

describe('resolveAnthropicVisionTier', () => {
  it('puts the documented high-resolution models on the highres tier', () => {
    for (const m of ['claude-fable-5', 'claude-mythos-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-sonnet-5']) {
      expect(resolveAnthropicVisionTier(m), m).toBe('highres');
    }
  });

  it('accepts -suffix aliases and [variant] tags like the applicability matcher', () => {
    expect(resolveAnthropicVisionTier('claude-fable-5-20260115')).toBe('highres');
    expect(resolveAnthropicVisionTier('claude-fable-5[1m]')).toBe('highres');
  });

  it('defaults everything else to standard (fail-conservative: standard pages are WYSIWYG on both tiers)', () => {
    for (const m of ['claude-sonnet-4-5', 'claude-3-5-haiku-20241022', 'claude-opus-4-5', 'gpt-5.6', '', null, undefined]) {
      expect(resolveAnthropicVisionTier(m), String(m)).toBe('standard');
    }
  });

  it('does not tier-match on substring lookalikes', () => {
    expect(resolveAnthropicVisionTier('claude-sonnet-50')).toBe('standard');
    expect(resolveAnthropicVisionTier('myclaude-fable-5')).toBe('standard');
  });
});

describe('anthropicImageTokens — sweep-measured vectors (billed minus per-image overhead)', () => {
  it('bills WYSIWYG patches for in-cap images', () => {
    expect(anthropicImageTokens(1568, 728, 'standard')).toBe(1456); // measured 1459/1460
    expect(anthropicImageTokens(1568, 728, 'highres')).toBe(1456);
    expect(anthropicImageTokens(1092, 1092, 'standard')).toBe(1521); // measured 1524/1525
    expect(anthropicImageTokens(1000, 1000, 'standard')).toBe(1296); // measured 1299/1300
    expect(anthropicImageTokens(728, 728, 'standard')).toBe(676); // measured 679/680
    expect(anthropicImageTokens(1120, 560, 'standard')).toBe(800); // measured 803/804
  });

  it('gives the old 1928×1928 page WYSIWYG 4761 on highres, resample ≈1521 on standard', () => {
    expect(anthropicImageTokens(1928, 1928, 'highres')).toBe(4761); // measured 4764 on fable
    expect(anthropicImageTokens(1928, 1928, 'standard')).toBe(1521); // measured 1525 on sonnet-4-5
  });

  it('matches the remaining sweep probes on the fable (highres) column', () => {
    expect(anthropicImageTokens(2576, 1204, 'highres')).toBe(3956); // measured 3959
    expect(anthropicImageTokens(768, 1932, 'highres')).toBe(1932); // measured 1935
    expect(anthropicImageTokens(2800, 600, 'highres')).toBe(1840); // measured 1843
    expect(anthropicImageTokens(1960, 1960, 'highres')).toBe(4761); // measured 4764 (shrunk to cap)
  });

  it('exposes the measured per-image-block overhead (conservative +4)', () => {
    expect(ANTHROPIC_IMAGE_BLOCK_OVERHEAD_TOKENS).toBe(4);
  });
});

describe('page geometry per tier', () => {
  it('standard keeps the audited 1568×728 page (312 cols × 90 rows = 28080 chars)', () => {
    expect(STANDARD_PAGE).toEqual({ cols: 312, maxHeightPx: 728, charsPerImage: 28080 });
    expect(pageGeometryForTier('standard')).toEqual(STANDARD_PAGE);
  });

  it('HIGHRES_PAGE stays exported as the reference billing-max (384×240, 92160 chars)', () => {
    expect(HIGHRES_PAGE).toEqual({ cols: 384, maxHeightPx: 1928, charsPerImage: 92160 });
  });

  it('BOTH tiers render the standard page — high-res is a billing trap (measured 2026-07-06)', () => {
    // Direct API, n=30/arm: the 1928² page is BILLED WYSIWYG (4764 tok) but
    // the encoder does not receive the full resolution — Fable read 1-2/30 vs
    // 25-30/30 on standard, with single-glyph swap errors (the signature of
    // an internal resample). 3.3× the cost with worse legibility → production
    // stays on standard.
    expect(pageGeometryForTier('highres')).toEqual(STANDARD_PAGE);
    expect(pageGeometryForTier('standard')).toEqual(STANDARD_PAGE);
  });

  it('both geometries are self-consistent with the renderer cell math and tier caps', () => {
    for (const [page, tier] of [[STANDARD_PAGE, 'standard'], [HIGHRES_PAGE, 'highres']] as const) {
      const widthPx = 2 * PAD_X + page.cols * CELL_W;
      const rows = Math.floor((page.maxHeightPx - 2 * PAD_Y) / CELL_H);
      expect(page.charsPerImage).toBe(page.cols * rows);
      // Full page must bill WYSIWYG (no resample) on its own tier…
      const full = anthropicImageTokens(widthPx, page.maxHeightPx, tier);
      expect(full).toBe(Math.ceil(widthPx / 28) * Math.ceil(page.maxHeightPx / 28));
      // …and stay under the >20-images dimension rule (≤2000 px per side).
      expect(widthPx).toBeLessThanOrEqual(2000);
      expect(page.maxHeightPx).toBeLessThanOrEqual(2000);
    }
  });
});
