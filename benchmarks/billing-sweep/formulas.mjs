/**
 * Pure prediction math for the Anthropic vision-billing sweep.
 *
 * Two competing models, compared against live count_tokens measurements by
 * eval/billing-sweep/run.mjs:
 *
 *  - patch (current docs): resize to the largest aspect-preserving size that
 *    satisfies BOTH tier caps (long edge, visual-token cap), then bill
 *    ceil(w/28) × ceil(h/28) — 28 px patches. Reproduces the official doc
 *    table (1092² → 1521, 1000² → 1296, 3840×2160 → 1560 std / 4784 hi-res).
 *
 *  - legacy750 (retired docs, and how the 2026-07-01 audit modeled standard
 *    tier): downscale to fit long edge AND an area cap, then bill area/750.
 *
 * Tier membership: Fable 5 / Mythos 5 / Opus 4.8 / Opus 4.7 / Sonnet 5 are
 * high-resolution; everything else (incl. the audit's claude-sonnet-4-5) is
 * standard. Which formula/tier the API actually applies TODAY is exactly what
 * the sweep measures — do not trust these predictions as ground truth.
 */

const PATCH = 28;

/** Documented per-tier caps for the patch model. */
export const TIERS = {
  standard: { longEdgeMax: 1568, tokenCap: 1568 },
  highres: { longEdgeMax: 2576, tokenCap: 4784 },
};

/** Legacy-model caps: area cap = tokenCap × 750 px. Standard-area value is the
 *  audit's measured ~1.15 MP / ~1525-token clamp, not a documented number. */
const LEGACY_TIERS = {
  standard: { longEdgeMax: 1568, areaMax: 1_143_750 },
  highres: { longEdgeMax: 2576, areaMax: 3_588_000 },
};

function patchTokens(w, h) {
  return Math.ceil(w / PATCH) * Math.ceil(h / PATCH);
}

/**
 * Current documented model. Returns { tokens, outW, outH, resampled }.
 * Resize = binary search for the largest integer long edge whose
 * aspect-preserved dimensions stay under the tier's patch-token cap.
 */
export function predictPatchTokens(w, h, tier) {
  const { longEdgeMax, tokenCap } = TIERS[tier];
  if (Math.max(w, h) <= longEdgeMax && patchTokens(w, h) <= tokenCap) {
    return { tokens: patchTokens(w, h), outW: w, outH: h, resampled: false };
  }
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  const dimsAt = (L) => [L, Math.round((short * L) / long)];
  const fits = (L) => {
    const [l, s] = dimsAt(L);
    return patchTokens(l, s) <= tokenCap;
  };
  // tokens(L) is non-decreasing (both ceil factors grow with L), so the
  // largest fitting L is binary-searchable.
  let lo = PATCH;
  let hi = Math.min(longEdgeMax, long);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi + 1) / 2);
    if (fits(mid)) lo = mid;
    else hi = mid - 1;
  }
  const [outLong, outShort] = dimsAt(lo);
  const [outW, outH] = w >= h ? [outLong, outShort] : [outShort, outLong];
  return { tokens: patchTokens(outW, outH), outW, outH, resampled: true };
}

/**
 * Retired area/750 model with the audit's measured resample behavior.
 * When the area cap binds, the billed value is the cap itself (areaMax/750),
 * matching the audit's flat 1525 readings on standard tier.
 */
export function predictLegacy750(w, h, tier) {
  const { longEdgeMax, areaMax } = LEGACY_TIERS[tier];
  const edgeScale = Math.min(1, longEdgeMax / Math.max(w, h));
  let outW = Math.round(w * edgeScale);
  let outH = Math.round(h * edgeScale);
  let resampled = edgeScale < 1;
  let tokens;
  if (outW * outH > areaMax) {
    const areaScale = Math.sqrt(areaMax / (outW * outH));
    outW = Math.round(outW * areaScale);
    outH = Math.round(outH * areaScale);
    resampled = true;
    tokens = Math.round(areaMax / 750);
  } else {
    tokens = Math.round((outW * outH) / 750);
  }
  return { tokens, outW, outH, resampled };
}

/**
 * Sweep probes. Each either separates the two formulas by ≥25 tokens on some
 * tier, or separates the two tiers outright (the page-old row is THE probe
 * that decides whether Fable 5 gets WYSIWYG 1928×1928 pages).
 */
export const GEOMETRIES = [
  {
    label: 'doc-anchor-1092',
    w: 1092,
    h: 1092,
    why: 'official table anchor: patch=1521 both tiers; legacy hi-res=1590',
  },
  {
    label: 'doc-anchor-1000',
    w: 1000,
    h: 1000,
    why: 'official table anchor: patch=1296 vs legacy=1333',
  },
  {
    label: 'page-current-1568x728',
    w: 1568,
    h: 728,
    why: 'current OmniGlyph page: patch=1456 vs legacy=1522 (audit measured 1460)',
  },
  {
    label: 'page-old-1928x1928',
    w: 1928,
    h: 1928,
    why: 'TIER probe: hi-res WYSIWYG=4761 vs standard resample≈1521',
  },
  {
    label: 'probe-hi-cap-1960x1960',
    w: 1960,
    h: 1960,
    why: '70×70=4900 patches exceeds hi-res cap: measures at-cap shrink',
  },
  {
    label: 'probe-long-edge-2576x1204',
    w: 2576,
    h: 1204,
    why: 'exact hi-res long-edge bound: patch=3956 vs legacy=4135',
  },
  {
    label: 'probe-small-728x728',
    w: 728,
    h: 728,
    why: 'small linear region: patch=676 vs legacy=707',
  },
  {
    label: 'probe-mid-1120x560',
    w: 1120,
    h: 560,
    why: 'mid linear region: patch=800 vs legacy=836',
  },
  {
    label: 'probe-strip-768x1932',
    w: 768,
    h: 1932,
    why: 'tall strip (GPT-like aspect): hi-res patch=1932 vs legacy=1978; tier gap 644',
  },
  {
    label: 'probe-beyond-2800x600',
    w: 2800,
    h: 600,
    why: 'long edge beyond hi-res bound: patch=1840 vs legacy=1896',
  },
];
