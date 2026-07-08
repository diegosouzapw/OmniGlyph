/**
 * TDD spec for eval/billing-sweep/formulas.mjs — the pure prediction math the
 * count_tokens sweep compares against measurements.
 *
 * Two competing billing models for Anthropic vision input:
 *  - patch: current documented model — resize to fit tier caps, then
 *    ceil(w/28) × ceil(h/28) visual tokens (28 px patches).
 *  - legacy750: retired w·h/750 model with the empirically measured resample
 *    behavior from docs/LEGIBILITY-AUDIT-2026-07-01.md.
 *
 * Anchor vectors come from the official vision doc table (platform.claude.com):
 * 1092×1092 → 1521 · 1000×1000 → 1296 · 3840×2160 → 1560 (standard) / 4784
 * (high-res). If these fail, the resize translation is wrong — do not adjust
 * the expectations.
 */
import { describe, expect, it } from 'vitest';
import {
  GEOMETRIES,
  TIERS,
  predictLegacy750,
  predictPatchTokens,
} from '../benchmarks/billing-sweep/formulas.mjs';

describe('TIERS', () => {
  it('models the two documented resolution tiers', () => {
    expect(TIERS.standard).toEqual({ longEdgeMax: 1568, tokenCap: 1568 });
    expect(TIERS.highres).toEqual({ longEdgeMax: 2576, tokenCap: 4784 });
  });
});

describe('predictPatchTokens — official doc table anchors', () => {
  it('1092×1092 = 1521 tokens, unresized, on both tiers', () => {
    for (const tier of ['standard', 'highres'] as const) {
      const p = predictPatchTokens(1092, 1092, tier);
      expect(p.tokens).toBe(1521); // 39×39
      expect(p.resampled).toBe(false);
      expect(p.outW).toBe(1092);
      expect(p.outH).toBe(1092);
    }
  });

  it('1000×1000 = 1296 tokens (36×36), unresized', () => {
    expect(predictPatchTokens(1000, 1000, 'standard').tokens).toBe(1296);
  });

  it('3840×2160 resizes to 1560 tokens on standard tier', () => {
    const p = predictPatchTokens(3840, 2160, 'standard');
    expect(p.tokens).toBe(1560); // max long edge 1456 → 52×30 patches
    expect(p.resampled).toBe(true);
    expect(p.outW).toBe(1456);
  });

  it('3840×2160 resizes to exactly 4784 tokens on high-res tier', () => {
    const p = predictPatchTokens(3840, 2160, 'highres');
    expect(p.tokens).toBe(4784); // long edge 2576 → 92×52 patches
    expect(p.resampled).toBe(true);
    expect(p.outW).toBe(2576);
  });
});

describe('predictPatchTokens — OmniGlyph page geometries', () => {
  it('current 1568×728 page is WYSIWYG on both tiers at 1456 tokens', () => {
    for (const tier of ['standard', 'highres'] as const) {
      const p = predictPatchTokens(1568, 728, tier);
      expect(p.tokens).toBe(1456); // 56×26
      expect(p.resampled).toBe(false);
    }
  });

  it('old 1928×1928 page: WYSIWYG 4761 tokens on high-res, resampled ≤1568 on standard', () => {
    const hi = predictPatchTokens(1928, 1928, 'highres');
    expect(hi.tokens).toBe(4761); // 69×69, just under the 4784 cap
    expect(hi.resampled).toBe(false);

    const std = predictPatchTokens(1928, 1928, 'standard');
    expect(std.resampled).toBe(true);
    expect(std.tokens).toBeLessThanOrEqual(1568);
    expect(std.tokens).toBeGreaterThan(1400); // resize targets the cap, not far below it
  });

  it('1960×1960 exceeds the high-res token cap (70×70=4900) and must shrink', () => {
    const p = predictPatchTokens(1960, 1960, 'highres');
    expect(p.resampled).toBe(true);
    expect(p.tokens).toBeLessThanOrEqual(4784);
    expect(p.tokens).toBeGreaterThan(4500);
  });

  it('768×1932 tall strip: WYSIWYG 1932 on high-res (28×69), resampled on standard', () => {
    const hi = predictPatchTokens(768, 1932, 'highres');
    expect(hi.tokens).toBe(1932);
    expect(hi.resampled).toBe(false);

    const std = predictPatchTokens(768, 1932, 'standard');
    expect(std.resampled).toBe(true);
    expect(std.tokens).toBeLessThanOrEqual(1568);
  });

  it('preserves aspect ratio within rounding when resizing', () => {
    const p = predictPatchTokens(3840, 2160, 'standard');
    expect(p.outW / p.outH).toBeCloseTo(3840 / 2160, 1);
  });
});

describe('predictLegacy750 — retired w·h/750 model as measured in the 2026-07-01 audit', () => {
  it('1568×728 bills linear ≈1522 on standard (1,141,504 px / 750)', () => {
    const p = predictLegacy750(1568, 728, 'standard');
    expect(p.tokens).toBe(1522);
    expect(p.resampled).toBe(false);
  });

  it('1092×1092 clamps to the measured ~1525 standard cap', () => {
    const p = predictLegacy750(1092, 1092, 'standard');
    expect(p.tokens).toBe(1525);
  });

  it('1400×700 on high-res bills linear 1307 (980,000 px / 750), unresized', () => {
    const p = predictLegacy750(1400, 700, 'highres');
    expect(p.tokens).toBe(1307);
    expect(p.resampled).toBe(false);
  });

  it('1928×1928 on high-res clamps to the 4784 area cap (3.72 MP > 3.588 MP)', () => {
    const p = predictLegacy750(1928, 1928, 'highres');
    expect(p.tokens).toBe(4784);
    expect(p.resampled).toBe(true);
  });
});

describe('GEOMETRIES — sweep probe design', () => {
  it('every probe names a rationale and positive dimensions', () => {
    expect(GEOMETRIES.length).toBeGreaterThanOrEqual(8);
    for (const g of GEOMETRIES) {
      expect(g.w).toBeGreaterThan(0);
      expect(g.h).toBeGreaterThan(0);
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.why.length).toBeGreaterThan(0);
    }
  });

  it('includes the doc anchors, both OmniGlyph pages, and at least one tier discriminator', () => {
    const labels = GEOMETRIES.map((g) => g.label);
    expect(labels).toContain('doc-anchor-1092');
    expect(labels).toContain('page-current-1568x728');
    expect(labels).toContain('page-old-1928x1928');
  });

  it('each probe discriminates patch vs legacy by ≥25 tokens on some tier, or discriminates tiers', () => {
    for (const g of GEOMETRIES) {
      const gaps = (['standard', 'highres'] as const).map((tier) =>
        Math.abs(predictPatchTokens(g.w, g.h, tier).tokens - predictLegacy750(g.w, g.h, tier).tokens),
      );
      const tierGap = Math.abs(
        predictPatchTokens(g.w, g.h, 'standard').tokens - predictPatchTokens(g.w, g.h, 'highres').tokens,
      );
      expect(Math.max(...gaps, tierGap)).toBeGreaterThanOrEqual(25);
    }
  });
});
