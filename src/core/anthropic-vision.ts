/**
 * Anthropic vision billing (measured) and per-tier page geometry.
 *
 * Ground truth: benchmarks/billing-sweep count_tokens run of 2026-07-05. Billing is
 * 28 px patches — `ceil(w/28) × ceil(h/28)` after a per-tier resize — plus a
 * fixed per-image-block overhead (+3 measured on claude-fable-5, +4 on
 * claude-sonnet-4-5). The retired w·h/750 formula loses on every probe.
 *
 * Tiers (vision docs, confirmed by the sweep): Fable 5 / Mythos 5 / Opus 4.8 /
 * Opus 4.7 / Sonnet 5 get high-resolution caps (long edge ≤ 2576 px, ≤ 4784
 * visual tokens/image); everything else gets standard (≤ 1568 px, ≤ 1568).
 * On the high-res tier a 1928×1928 page billed 4764 = 69×69 + 3, unresampled —
 * so big pages are WYSIWYG for Fable-class readers, and the 2026-07-01 clamp
 * to 1568×728 (measured on standard-tier claude-sonnet-4-5) only binds the
 * standard tier.
 */

export type AnthropicVisionTier = 'standard' | 'highres';

/** 28 px patch — the billing unit measured across all 11 sweep probes. */
const PATCH_PX = 28;

/** Fixed extra tokens billed per image BLOCK (framing, not pixels). Measured
 *  +3 on fable, +4 on sonnet-4-5; 4 keeps the gate conservative. */
export const ANTHROPIC_IMAGE_BLOCK_OVERHEAD_TOKENS = 4;

/** Per-tier resize caps: max long edge (px) and max visual tokens per image. */
export const ANTHROPIC_TIER_CAPS: Record<AnthropicVisionTier, { longEdgeMax: number; tokenCap: number }> = {
  standard: { longEdgeMax: 1568, tokenCap: 1568 },
  highres: { longEdgeMax: 2576, tokenCap: 4784 },
};

/** Model bases on the high-resolution tier. Matching mirrors applicability.ts:
 *  exact base or `-suffix` alias, [variant] tags stripped first. */
const HIGHRES_MODEL_BASES = [
  'claude-fable-5',
  'claude-mythos-5',
  'claude-opus-4-8',
  'claude-opus-4-7',
  'claude-sonnet-5',
];

const VARIANT_TAG = /\[[^\]]*\]/g;

/** Unknown/absent models resolve to `standard` — fail-conservative, because a
 *  standard 1568×728 page bills WYSIWYG on BOTH tiers, while a high-res page
 *  sent to a standard-tier model gets resampled to blur. */
export function resolveAnthropicVisionTier(model: string | null | undefined): AnthropicVisionTier {
  if (typeof model !== 'string') return 'standard';
  const base = model.replace(VARIANT_TAG, '');
  return HIGHRES_MODEL_BASES.some((b) => base === b || base.startsWith(`${b}-`))
    ? 'highres'
    : 'standard';
}

function patchTokens(w: number, h: number): number {
  return Math.ceil(w / PATCH_PX) * Math.ceil(h / PATCH_PX);
}

/**
 * Exact visual-token cost of a w×h image on the given tier, EXCLUDING the
 * per-block overhead (add ANTHROPIC_IMAGE_BLOCK_OVERHEAD_TOKENS per block).
 * Resize mirrors the API: the largest aspect-preserving size satisfying both
 * the long-edge and token caps, found by binary search on the long edge —
 * patch count is non-decreasing in the long edge, so the search is sound.
 * Validated to residual 0 against all sweep probes on both tiers.
 */
export function anthropicImageTokens(width: number, height: number, tier: AnthropicVisionTier): number {
  const { longEdgeMax, tokenCap } = ANTHROPIC_TIER_CAPS[tier];
  if (Math.max(width, height) <= longEdgeMax && patchTokens(width, height) <= tokenCap) {
    return patchTokens(width, height);
  }
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const tokensAt = (edge: number): number => patchTokens(edge, Math.round((short * edge) / long));
  let lo = PATCH_PX;
  let hi = Math.min(longEdgeMax, long);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2);
    if (tokensAt(mid) <= tokenCap) lo = mid;
    else hi = mid - 1;
  }
  return tokensAt(lo);
}

/** Render-page geometry: soft-wrap columns, page-height ceiling, and the char
 *  budget (cols × rows) that fills the page. */
export interface PageGeometry {
  readonly cols: number;
  readonly maxHeightPx: number;
  readonly charsPerImage: number;
}

/** Audited standard page (legibility audit 2026-07-01, omniglyph-history mirror): 1568×728 fits
 *  the standard-tier caps exactly — WYSIWYG on every model. 312×5+8 = 1568 px,
 *  90 rows of 8 px, 28080 chars. */
export const STANDARD_PAGE: PageGeometry = { cols: 312, maxHeightPx: 728, charsPerImage: 28080 };

/** BILLING-max page for the high-res tier (384×5+8 = 1928 px, 240 rows, 92160
 *  chars = 69×69 = 4761 patches under the 4784 cap). REFUTED as a production
 *  geometry on 2026-07-06 (density-frontier, direct API, n=30/arm): the page
 *  is BILLED WYSIWYG but the vision encoder does not receive the full
 *  resolution — Fable read 1-2/30 (vs 25-30/30 on standard), with single-glyph
 *  swap errors (6→8, a→4, e→8), the signature of an internal resample.
 *  Billing ≠ encoder input: 3.3× the cost with worse legibility. Exported for
 *  evals and for pricing large user images. */
export const HIGHRES_PAGE: PageGeometry = { cols: 384, maxHeightPx: 1928, charsPerImage: 92160 };

/** RENDER geometry per tier: BOTH use the standard page. The high-res tier
 *  changes what the API BILLS (larger caps — anthropicImageTokens), not what
 *  the encoder sees (measured 2026-07-06). The per-tier threading stays in
 *  the codebase — if the encoder ever aligns with billing, the retune is
 *  repointing this function to HIGHRES_PAGE. */
export function pageGeometryForTier(_tier: AnthropicVisionTier): PageGeometry {
  return STANDARD_PAGE;
}
