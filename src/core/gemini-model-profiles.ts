/**
 * Gemini vision billing + dense-page geometry.
 * Ground truth (docs captured 2026-07-05, see docs/ROADMAP.md Phase 1):
 *  - ai.google.dev/gemini-api/docs/image-understanding — tiling: both dims
 *    ≤384 px → flat 258 tokens; larger → crop unit = floor(min(w,h)/1.5),
 *    tiles = ceil(w/unit) × ceil(h/unit), 258 each (official example:
 *    960×540 → unit 360 → 3×2 = 6 tiles = 1548). The doc qualifies the crop
 *    unit with "roughly" — calibrate with countTokens near tile boundaries.
 *  - .../media-resolution — media_resolution overrides with a FIXED per-image
 *    cost: Gemini 3 low/medium/high/ultra_high = 280/560/1120/2240 (default
 *    high=1120); Gemini 2.5 low/medium = 64/256.
 *
 * Structural consequence of the tile formula: the smaller dimension always
 * costs 2 tile rows (min/unit ≈ 1.5 → ceil 2), so max utilization on that
 * axis is 75% — and the crop unit equals the NATIVE 768 px tile resolution
 * (zero glyph resampling) only when min(w,h) ∈ [1152, 1153].
 */

export type GeminiGeneration = '3' | '2.5';

export type GeminiMediaResolution = 'low' | 'medium' | 'high' | 'ultra_high';

/** Tiling regime (default billing, Gemini ≤2.5 and Gemini 3 without override). */
export function geminiImageTokens(width: number, height: number): number {
  if (width <= 384 && height <= 384) return 258;
  const unit = Math.floor(Math.min(width, height) / 1.5);
  return Math.ceil(width / unit) * Math.ceil(height / unit) * 258;
}

const MEDIA_RESOLUTION_TOKENS: Record<GeminiGeneration, Partial<Record<GeminiMediaResolution, number>>> = {
  '3': { low: 280, medium: 560, high: 1120, ultra_high: 2240 },
  '2.5': { low: 64, medium: 256 },
};

/** Fixed per-image cost under a media_resolution override. Levels absent from
 *  a generation's table (e.g. ultra_high on 2.5) throw — better to fail at the
 *  gate than to silently underestimate. */
export function geminiMediaResolutionTokens(level: GeminiMediaResolution, generation: GeminiGeneration): number {
  const tokens = MEDIA_RESOLUTION_TOKENS[generation][level];
  if (tokens === undefined) {
    throw new Error(`media_resolution ${level} not documented for Gemini ${generation}`);
  }
  return tokens;
}

/** Family classifier. Unknown ids resolve to '3' (current generation — its
 *  fixed-cost table is the conservative default for the gate). */
export function resolveGeminiGeneration(model: string | null | undefined): GeminiGeneration {
  if (typeof model === 'string' && /^gemini-2\./.test(model)) return '2.5';
  return '3';
}

/**
 * Dense-page geometry for the tiling regime, derived from the renderer grid
 * (width = 8 + cols×5, height = 8 + rows×8):
 * the min side must be 1152 px EXACTLY for the crop unit to land on the
 * native 768 px tile. Width can't hit 1152 on the 5 px grid, but HEIGHT can
 * (8 + 143×8 = 1152) — so the page is landscape: 1533×1152 = 2×2 tiles =
 * 1032 tokens, 305×143 = 43,615 chars → 42.3 chars/token, the best
 * documented ratio across the three providers (Anthropic ≈19, GPT ≤33).
 */
export const GEMINI_TILE_PAGE = { cols: 305, maxHeightPx: 1152, charsPerImage: 43615 } as const;
