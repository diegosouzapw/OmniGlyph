/**
 * TDD spec for the render memoization layer (src/core/render-cache.ts).
 * Renders are deterministic by hard invariant (tests/render.test.ts pins
 * byte-identity), so identical inputs may be served from memory — today the
 * static slab and every frozen history chunk re-render and re-encode on EVERY
 * request. The cache must key on ALL render-affecting inputs and evict LRU
 * under a byte budget.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearRenderCache,
  renderCacheStats,
  renderTextToPngsCached,
  setRenderCacheMaxBytes,
} from '../src/core/render-cache.js';

const DENSE = 'dense line of page content '.repeat(200);

beforeEach(() => {
  clearRenderCache();
});

describe('renderTextToPngsCached', () => {
  it('serves the second identical call from memory (same bytes, one real render)', async () => {
    const a = await renderTextToPngsCached(DENSE, 312, 28080, { aa: true }, 728);
    const before = renderCacheStats();
    const b = await renderTextToPngsCached(DENSE, 312, 28080, { aa: true }, 728);
    const after = renderCacheStats();
    expect(after.hits).toBe(before.hits + 1);
    expect(after.misses).toBe(before.misses);
    expect(b.length).toBe(a.length);
    expect(Buffer.from(b[0]!.png)).toEqual(Buffer.from(a[0]!.png));
  });

  it('misses when any render-affecting input differs (cols, height, style, slot)', async () => {
    await renderTextToPngsCached(DENSE, 312, 28080, { aa: true }, 728);
    await renderTextToPngsCached(DENSE, 384, 92160, { aa: true }, 1928); // geometry
    await renderTextToPngsCached(DENSE, 312, 28080, { aa: false }, 728); // atlas
    await renderTextToPngsCached(DENSE, 312, 28080, { aa: true, colorByRole: true }, 728, 'tag');
    const s = renderCacheStats();
    expect(s.misses).toBe(4);
    expect(s.hits).toBe(0);
  });

  it('evicts least-recently-used entries when over the byte budget', async () => {
    clearRenderCache(1); // 1-byte budget forces immediate eviction
    await renderTextToPngsCached(DENSE, 312, 28080, {}, 728);
    await renderTextToPngsCached(DENSE, 312, 28080, {}, 728);
    const s = renderCacheStats();
    expect(s.hits).toBe(0); // nothing fit in the cache
    expect(s.entries).toBe(0);
    expect(s.oversized).toBe(2);
  });

  it('uses a fixed-width full-digest key regardless of source length', async () => {
    const short = await renderTextToPngsCached('x '.repeat(50), 312, 28080, {}, 728);
    const shortPngBytes = short.reduce((sum, image) => sum + image.png.length, 0);
    const shortOverhead = renderCacheStats().totalBytes - shortPngBytes;

    clearRenderCache();
    const long = await renderTextToPngsCached('x '.repeat(50_000), 312, 28080, {}, 728);
    const longPngBytes = long.reduce((sum, image) => sum + image.png.length, 0);
    const longOverhead = renderCacheStats().totalBytes - longPngBytes;

    expect(shortOverhead).toBe(128); // 64 hex UTF-16 code units
    expect(longOverhead).toBe(shortOverhead);
  });

  it('does not double-count bytes when concurrent misses replace the same key', async () => {
    const [first] = await Promise.all([
      renderTextToPngsCached(DENSE, 312, 28080, {}, 728),
      renderTextToPngsCached(DENSE, 312, 28080, {}, 728),
    ]);
    const expectedBytes = first!.reduce((sum, image) => sum + image.png.length, 128);
    const stats = renderCacheStats();

    expect(stats.misses).toBe(2);
    expect(stats.entries).toBe(1);
    expect(stats.totalBytes).toBe(expectedBytes);
  });

  it('shrinks or disables the budget immediately while retaining counters', async () => {
    await renderTextToPngsCached(DENSE, 312, 28080, {}, 728);
    const populated = renderCacheStats();

    setRenderCacheMaxBytes(populated.totalBytes - 1);
    const shrunk = renderCacheStats();
    expect(shrunk.entries).toBe(0);
    expect(shrunk.evictions).toBe(1);
    expect(shrunk.maxBytes).toBe(populated.totalBytes - 1);

    setRenderCacheMaxBytes(0);
    expect(renderCacheStats()).toMatchObject({
      entries: 0,
      hits: populated.hits,
      misses: populated.misses,
      evictions: 1,
      maxBytes: 0,
    });
  });

  it('ignores invalid runtime budgets', () => {
    const before = renderCacheStats().maxBytes;
    setRenderCacheMaxBytes(-1);
    setRenderCacheMaxBytes(Number.NaN);
    expect(renderCacheStats().maxBytes).toBe(before);
  });

  it('returns results byte-identical to the uncached renderer', async () => {
    const { renderTextToPngsWithCharLimit } = await import('../src/core/render.js');
    const direct = await renderTextToPngsWithCharLimit(DENSE, 312, 28080, { aa: true }, 728);
    const cached = await renderTextToPngsCached(DENSE, 312, 28080, { aa: true }, 728);
    expect(cached.length).toBe(direct.length);
    for (let i = 0; i < direct.length; i++) {
      expect(Buffer.from(cached[i]!.png)).toEqual(Buffer.from(direct[i]!.png));
    }
  });
});
