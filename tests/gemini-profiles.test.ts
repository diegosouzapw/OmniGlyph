/**
 * TDD spec for src/core/gemini-model-profiles.ts — Gemini vision billing and
 * the dense-page geometry. Ground truth: ai.google.dev image-understanding +
 * media-resolution docs (captured 2026-07-05; see docs/ROADMAP.md Phase 1).
 *
 * Tiling (Gemini ≤2.5 default): both dims ≤384 → flat 258; else crop unit =
 * floor(min/1.5), tiles = ceil(w/unit)×ceil(h/unit), 258 each. Official
 * example: 960×540 → unit 360 → 3×2 = 6 tiles = 1548.
 * media_resolution (fixed per image): Gemini 3 low/medium/high/ultra_high =
 * 280/560/1120/2240; Gemini 2.5 low/medium = 64/256.
 */
import { describe, expect, it } from 'vitest';
import {
  GEMINI_TILE_PAGE,
  geminiImageTokens,
  geminiMediaResolutionTokens,
  resolveGeminiGeneration,
} from '../src/core/gemini-model-profiles.js';
import { CELL_H, CELL_W, PAD_X, PAD_Y } from '../src/core/render.js';

describe('geminiImageTokens — documented tile math', () => {
  it('flat 258 when both dimensions ≤ 384', () => {
    expect(geminiImageTokens(384, 384)).toBe(258);
    expect(geminiImageTokens(300, 100)).toBe(258);
  });

  it('reproduces the official 960×540 → 6 tiles = 1548 example', () => {
    expect(geminiImageTokens(960, 540)).toBe(1548);
  });

  it('a 768×768 square is 4 crops (unit 512) = 1032 — the 258 flat only exists ≤384', () => {
    expect(geminiImageTokens(768, 768)).toBe(1032);
  });

  it('the landscape dense page 1533×1152 hits crop unit 768 exactly → 2×2 tiles = 1032', () => {
    expect(geminiImageTokens(1533, 1152)).toBe(1032);
  });
});

describe('geminiMediaResolutionTokens — fixed per-image cost by generation', () => {
  it('Gemini 3 table: 280/560/1120/2240', () => {
    expect(geminiMediaResolutionTokens('low', '3')).toBe(280);
    expect(geminiMediaResolutionTokens('medium', '3')).toBe(560);
    expect(geminiMediaResolutionTokens('high', '3')).toBe(1120);
    expect(geminiMediaResolutionTokens('ultra_high', '3')).toBe(2240);
  });

  it('Gemini 2.5 table: low 64, medium 256 (flat)', () => {
    expect(geminiMediaResolutionTokens('low', '2.5')).toBe(64);
    expect(geminiMediaResolutionTokens('medium', '2.5')).toBe(256);
  });
});

describe('resolveGeminiGeneration', () => {
  it('classifies model ids by family', () => {
    expect(resolveGeminiGeneration('gemini-3-flash')).toBe('3');
    expect(resolveGeminiGeneration('gemini-3-pro-preview')).toBe('3');
    expect(resolveGeminiGeneration('gemini-2.5-flash')).toBe('2.5');
    expect(resolveGeminiGeneration('gemini-2.5-pro')).toBe('2.5');
  });

  it('defaults unknown/absent ids to generation 3', () => {
    expect(resolveGeminiGeneration('gemini-4-experimental')).toBe('3');
    expect(resolveGeminiGeneration(null)).toBe('3');
  });
});

describe('GEMINI_TILE_PAGE — the documented-best dense geometry (42+ chars/token)', () => {
  it('is 305 cols × 143 rows = 43,615 chars on a 1533×1152 page', () => {
    expect(GEMINI_TILE_PAGE).toEqual({ cols: 305, maxHeightPx: 1152, charsPerImage: 43615 });
  });

  it('is self-consistent with the renderer cell math and bills exactly 4 tiles', () => {
    const widthPx = 2 * PAD_X + GEMINI_TILE_PAGE.cols * CELL_W;
    const rows = Math.floor((GEMINI_TILE_PAGE.maxHeightPx - 2 * PAD_Y) / CELL_H);
    expect(widthPx).toBe(1533);
    expect(rows).toBe(143);
    expect(GEMINI_TILE_PAGE.charsPerImage).toBe(GEMINI_TILE_PAGE.cols * rows);
    // Height is the min side and lands the crop unit on 768 (native tile res):
    expect(Math.floor(GEMINI_TILE_PAGE.maxHeightPx / 1.5)).toBe(768);
    expect(geminiImageTokens(widthPx, GEMINI_TILE_PAGE.maxHeightPx)).toBe(1032);
    // Density: ≥42 chars/token — the best documented ratio of the 3 providers.
    expect(GEMINI_TILE_PAGE.charsPerImage / 1032).toBeGreaterThan(42);
  });
});
