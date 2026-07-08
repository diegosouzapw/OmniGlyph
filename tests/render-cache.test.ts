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
