/**
 * Pins the production dense style to the 1-BIT atlas.
 *
 * Measured 2026-07-05 (density-frontier via CLI/subscription, Fable 5, n=30
 * per arm, same corpus/questions):
 *   standard 1568×728 · 1-bit: 30/30  |  AA: 25/30 (+5 abstentions)
 *   high-res 1928×1928 · 1-bit: 20/30 |  AA: 0/30 (+29 abstentions)
 * 1-bit beat AA on both pages with zero confabulation in every arm.
 * The AA had been calibrated on Opus 4.7 (98.95% OCR) — but Opus cannot read
 * the 5×8 anyway (30/30 ILLEGIBLE) and the default target is Fable. If a
 * per-model style is reintroduced, this test should become a per-profile pin.
 */
import { describe, expect, it } from 'vitest';
import { DENSE_RENDER_STYLE } from '../src/core/render.js';

describe('DENSE_RENDER_STYLE', () => {
  it('uses the 1-bit atlas (aa: false) — measured superior to AA on Fable on both pages', () => {
    expect(DENSE_RENDER_STYLE).toEqual({ cellWBonus: 0, cellHBonus: 0, aa: false });
  });
});
