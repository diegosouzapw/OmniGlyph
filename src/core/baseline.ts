/**
 * Cache-aware baseline math for the unproxied counterfactual.
 * Workers-safe: no node:, no Buffer, no process.*. Pure number math.
 * See the CACHING_AND_SAVINGS design note (omniglyph-history mirror) for the full derivation and audit history.
 */

/** Documented Anthropic price ratios: cc_5m = 1.25×, cr = 0.1× base input. One-line change if rates change. */
export const CACHE_CREATE_RATE = 1.25;
export const CACHE_READ_RATE = 0.1;

/** Anthropic prompt-cache TTL (seconds). Kept for callers that display provider
 *  docs, but savings math does not use TTL to infer a hypothetical text-cache
 *  hit: text is considered warm only when the actual request reports cr > 0. */
export const CACHE_TTL_SEC = 300;

/** This session's previous usage-bearing turn, used only for warm split sizing. */
export interface BaselineWarmthPrev {
  /** Completion time of that turn, in wall-clock seconds. */
  ts: number;
  /** Cacheable-prefix tokens measured that turn (0 if the probe missed). */
  cacheable: number;
  /** Hash of the image-bound/static text prefix. If it changes, do not reuse the
   *  prior prefix size for this row's text reused/grown split. */
  prefixSha?: string;
}

/**
 * Decide whether the TEXT counterfactual's prefix was warm this turn.
 *
 * Strict accounting rule: the imagined text path gets the same observed cache
 * state as the real image path. `cr > 0` is server proof that the request read a
 * warm prefix, so the text baseline is warm too. `cr === 0` means the actual
 * request did not read cache, so the text baseline is priced cold too. We do not
 * use wall-clock TTL to claim that text would have been warm while images were
 * cold; that would be an unobservable counterfactual and can create negative
 * rows from cache assumptions rather than token savings.
 *
 * When cr proves warmth, a completed same-prefix prior is used only to estimate
 * how much of the text prefix was reused vs grown. If none is available, assume
 * full reuse of this turn's cacheable prefix; this is conservative for savings.
 *
 * @param prev       this session's previous usage-bearing turn, or undefined.
 * @param nowSec     request-start wall-clock seconds, used only to reject prior
 *                   rows that had not completed before this request was sent.
 * @param cacheable  this turn's cacheable-prefix tokens (the full-reuse credit
 *                   when warm only via cr, since cr proves a read but not the split).
 * @param cr         observed cache-read tokens this turn; the only warm/cold signal.
 * @param ttlSec     legacy parameter; no longer decides warm/cold. It only
 *                   bounds whether a prior prefix size is used for reused/grown
 *                   splitting after cr > 0 has already proved warmth.
 * @param prefixSha  stable-prefix fingerprint for the text counterfactual. A
 *                   prior prefix size is reused only when this matches.
 */
export function deriveBaselineWarmth(
  prev: BaselineWarmthPrev | undefined,
  nowSec: number,
  cacheable: number,
  cr: number,
  ttlSec: number = CACHE_TTL_SEC,
  prefixSha?: string,
): { warm: boolean; prevCacheable: number } {
  const age = prev !== undefined ? nowSec - prev.ts : Number.POSITIVE_INFINITY;
  const samePrefix = prev === undefined
    || prev.prefixSha === undefined
    || prefixSha === undefined
    || prev.prefixSha === prefixSha;
  // cr is the only warm/cold signal. A prior only refines the warm split.
  if (!(cr > 0)) return { warm: false, prevCacheable: 0 };
  // Fresh prior: use its real prefix size for the reused/grown split. Without
  // one, cr proves warmth but not the split, so assume full reuse.
  const freshPrior = prev !== undefined && age >= 0 && age < ttlSec && samePrefix;
  return { warm: true, prevCacheable: freshPrior ? prev!.cacheable : cacheable };
}

/**
 * Weighted input cost for the unproxied TEXT counterfactual (see the CACHING_AND_SAVINGS design note (omniglyph-history mirror)).
 *
 * Warmth matters: a TEXT prefix is only a cheap cache-read when a warm cache
 * actually existed this turn. The previous warmth-FREE version always priced
 * the cacheable prefix at CACHE_READ_RATE, which fabricated a "free read" on
 * cold/TTL-expiry turns where text would in fact have paid a 1.25× create —
 * that produced a phantom loss vs the imaged path (which DOES pay the create).
 *
 *   cold turn (first turn / >5min since this session's last turn):
 *     text has no warm cache either ⇒ cacheable×CACHE_CREATE_RATE + coldTail×1.0
 *   warm turn (a prior turn cached the prefix within TTL):
 *     text append-caches ⇒ reused×CACHE_READ_RATE + grown×CACHE_CREATE_RATE + coldTail×1.0
 *     where reused = min(prevCacheable, cacheable), grown = cacheable − reused.
 *     This is what TEXT pays regardless of whether OmniGlyph's image busted its
 *     own cache on a growth turn — so the real growth loss is preserved.
 *
 * Saving = baseline_eff − actual_eff; can be negative (honestly reported, not floored).
 *
 * @param baselineCacheable  tokens up to the last cache_control marker. ≤0 ⇒ credit nothing.
 * @param warm               was a warm cache available for this session this turn?
 * @param prevCacheable      cacheable prefix size on this session's previous turn (warm only).
 */
export function computeBaselineInputEff(
  baseline: number,
  baselineCacheable: number,
  inputTokens: number,
  cc: number,
  cr: number,
  warm = false,
  prevCacheable = 0,
): number {
  if (baseline <= 0) return 0;
  // Probe miss: can't split prefix from tail, so credit nothing (same as actual).
  if (baselineCacheable <= 0) return computeActualInputEff(inputTokens, cc, cr);
  const cacheable = Math.min(baselineCacheable, baseline);
  const coldTail = baseline - cacheable;
  if (warm) {
    // Text reads the prefix it already had cached (0.10×) and creates only the
    // growth since last turn (1.25×). Independent of the image path's cache.
    const reused = Math.min(Math.max(prevCacheable, 0), cacheable);
    const grown = cacheable - reused;
    return reused * CACHE_READ_RATE + grown * CACHE_CREATE_RATE + coldTail * 1.0;
  }
  // Cold (first turn / TTL expiry): no warm cache for text either, so it
  // re-creates the whole cacheable prefix at the create rate — same event the
  // imaged path pays. Removes the phantom "free read" that fabricated a loss.
  return cacheable * CACHE_CREATE_RATE + coldTail * 1.0;
}

/** Weighted input cost OmniGlyph actually paid this turn. */
export function computeActualInputEff(
  inputTokens: number,
  cc: number,
  cr: number,
): number {
  return inputTokens + cc * CACHE_CREATE_RATE + cr * CACHE_READ_RATE;
}
