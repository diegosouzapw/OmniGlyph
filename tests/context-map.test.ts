/**
 * The Context Map "Details" headline must use the SAME cache-weighted tokens
 * as the recent row's As-text / Sent / Saved columns. The old headline divided
 * the RAW count_tokens baseline by RAW sent tokens (cache-blind), so it could
 * trumpet "74% smaller" on a request the cache-aware row marked a net loss —
 * the exact contradiction that made the number untrustworthy. These tests pin
 * the two panels together.
 *
 * Warmth is server-observed: ContextMapData.warm is true only when the actual
 * request reported cache_read > 0. The narration must never claim a hypothetical
 * text cache read on a cache_read=0 row.
 */
import { describe, it, expect } from 'vitest';
import {
  renderContextMapFragment,
  renderRecentFragment,
  type ContextMapData,
} from '../src/dashboard/fragments.js';
import type { RecentPayload } from '../src/dashboard/types.js';

function ctx(p: Partial<ContextMapData> = {}): ContextMapData {
  return {
    id: 1,
    baselineTokens: 0,
    realInput: 0,
    baselineInputEff: 0,
    actualInputEff: 0,
    haveBaseline: true,
    cacheRead: 0,
    warm: false,
    output: 0,
    imageCount: 1,
    buckets: { static_slab: 1000 },
    imageIds: [1],
    compressed: true,
    ...p,
  };
}

describe('renderContextMapFragment — cache-aware headline', () => {
  it('says "smaller" only when the cache-weighted baseline actually beats what was sent', () => {
    const html = renderContextMapFragment(ctx({ baselineInputEff: 2000, actualInputEff: 400 }), []);
    expect(html).toContain('<span class="ctx-big">80%</span> smaller');
    expect(html).not.toContain('bigger');
  });

  it('says "bigger" — not "smaller" — when imaging cost more than the cached text would have (the trust bug)', () => {
    // The user's real shape: cache-weighted text baseline (~1,500) < image sent
    // (~1,800). The RAW count_tokens (~7,500) is what made the old headline lie
    // "76% smaller" while the row's Saved column showed a loss. This is a WARM
    // turn (text prefix cached) that also read its image cache (cacheRead > 0) —
    // "would have been a cheap cache-read" is a true explanation for the gap.
    const html = renderContextMapFragment(
      ctx({
        warm: true,
        baselineInputEff: 1500,
        actualInputEff: 1800,
        baselineTokens: 7500,
        realInput: 1800,
        cacheRead: 1500,
      }),
      [],
    );
    expect(html).toContain('<span class="ctx-big">20%</span> bigger');
    // Must NOT resurrect the cache-blind "smaller" claim in the headline.
    expect(html).not.toContain('class="ctx-big">76%</span> smaller');
    // The sub-line still surfaces the raw shrink AND explains why it cost more.
    expect(html).toContain('76% smaller');
    expect(html).toContain('cache-read');
  });

  it('headline direction always agrees with the row Saved column (baselineInputEff − actualInputEff)', () => {
    const cases: ReadonlyArray<readonly [number, number]> = [
      [2000, 400], // saving → smaller
      [1500, 1800], // loss → bigger
    ];
    for (const [b, a] of cases) {
      const html = renderContextMapFragment(ctx({ baselineInputEff: b, actualInputEff: a }), []);
      if (b - a > 0) {
        expect(html).toMatch(/ctx-big">\d+%<\/span> smaller/);
      } else {
        expect(html).toContain('bigger');
      }
    }
  });

  it('makes no savings claim when the baseline probe did not resolve', () => {
    const html = renderContextMapFragment(
      ctx({ haveBaseline: false, baselineInputEff: 0, actualInputEff: 1800, baselineTokens: 7500, realInput: 1800 }),
      [],
    );
    expect(html).toContain('billing-equivalent input tokens sent');
    expect(html).not.toContain('% smaller');
    expect(html).not.toContain('% bigger');
    expect(html).toContain('no trustworthy text baseline');
  });
});

describe('renderContextMapFragment — cold vs warm honesty', () => {
  // The headline/sub-line must not claim a 0.1× read discount on a turn whose
  // actual request had no cache read. On a cold turn the text baseline's prefix
  // is priced at the 1.25× create rate too, so "cached text" / "reads at 0.1×"
  // would be counting unobserved cache as savings.
  it('COLD turn (no warmth): no read discount claimed, text is not called "cached"', () => {
    const html = renderContextMapFragment(
      ctx({
        warm: false,
        baselineInputEff: 1_600_000,
        actualInputEff: 12_600,
        baselineTokens: 1_280_000,
        realInput: 12_600,
        cacheRead: 0,
      }),
      [],
    );
    // headline: a real saving is still shown…
    expect(html).toContain('smaller');
    // …but the text side is plain "text", never "cached text".
    expect(html).toContain('text would bill as');
    expect(html).not.toContain('as cached text');
    // sub-line tells the truth about the cold turn instead of inventing 0.1×.
    expect(html).toContain('No warm text cache this turn');
    expect(html).not.toContain('reads at 0.1×), same basis');
  });

  it('WARM turn (text cached, image also hit): the 0.1× read basis is legitimately claimed', () => {
    const html = renderContextMapFragment(
      ctx({
        warm: true,
        baselineInputEff: 2000,
        actualInputEff: 400,
        baselineTokens: 9000,
        realInput: 600,
        cacheRead: 5000,
      }),
      [],
    );
    expect(html).toContain('smaller');
    expect(html).toContain('cached text would bill as');
    expect(html).toContain('after cache discounts (reads at 0.1×), same basis as the Saved column');
    expect(html).not.toContain('No warm text cache this turn');
  });

  it('COLD + bigger: still no fabricated read discount', () => {
    // Imaging cost more even cold (image tokens > text tokens). The sub-line must
    // attribute it to token count, not a phantom cache-read.
    const html = renderContextMapFragment(
      ctx({
        warm: false,
        baselineInputEff: 1000,
        actualInputEff: 1500,
        baselineTokens: 1100,
        realInput: 1500,
        cacheRead: 0,
      }),
      [],
    );
    expect(html).toContain('bigger');
    expect(html).toContain('for text');
    expect(html).not.toContain('as cached text');
    expect(html).toContain('No warm text cache this turn');
    expect(html).not.toContain('cheap cache-read');
  });

  it('cache_read=0: text is cold too, no cache-busted warm-text narration', () => {
    const html = renderContextMapFragment(
      ctx({
        warm: false,
        cacheRead: 0,
        baselineInputEff: 3500,
        actualInputEff: 2500,
        baselineTokens: 3000,
        realInput: 2000,
      }),
      [],
    );
    expect(html).toContain('smaller');
    expect(html).toContain('text would bill as');
    expect(html).toContain('No warm text cache this turn');
    expect(html).not.toContain('cached text');
    expect(html).not.toContain('re-imaged the prefix and missed the image cache');
  });
});

describe('renderRecentFragment — billed delta presentation', () => {
  it('shows negative saved deltas instead of hiding imaging losses as missing data', () => {
    const html = renderRecentFragment({
      recent: [
        {
          ts: 0,
          method: 'POST',
          path: '/v1/messages',
          status: 200,
          compressed: true,
          cc_added: 1,
          cache_read: 0,
          baseline_input: 7618,
          actual_input: 69526,
          session_saved_so_far_delta: -61908,
        },
      ],
      has_preview: false,
      preview_meta: '',
    } satisfies RecentPayload);

    expect(html).toContain('Saved/lost');
    expect(html).toContain('class="num neg">-61,908</td>');
    expect(html).not.toContain('class="num pos">—</td>');
  });
});
