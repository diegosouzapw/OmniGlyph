/**
 * TDD spec for per-tier page geometry threading through the transform:
 * a claude-fable-5 body (high-res vision tier, measured 2026-07-05) must render
 * 1928 px-wide big pages; a standard-tier model keeps the audited 1568×728.
 */
import { describe, expect, it } from 'vitest';
import { transformRequest } from '../src/core/transform.js';
import { collapseHistory } from '../src/core/history.js';
import type { Message } from '../src/core/types.js';

/** Dense slab: one over-wide line pins shrinkColsToContent at the cols cap,
 *  the rest guarantees multiple standard pages worth of rows. */
function bigDenseText(): string {
  const wide = 'X'.repeat(500);
  const lines = Array.from({ length: 400 }, (_, i) => `const row_${i} = compute(${i * 17}, "${'v'.repeat(80)}");`);
  return `${wide}\n${lines.join('\n')}`;
}

function encodeBody(model: string): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({
    model,
    max_tokens: 128,
    system: bigDenseText(),
    messages: [{ role: 'user', content: [{ type: 'text', text: 'oi' }] }],
  }));
}

describe('per-tier slab geometry through transformRequest', () => {
  // Measured 2026-07-06 (direct API, n=30/arm): the high-res tier's 1928²
  // page is BILLED WYSIWYG but the encoder does not receive the full
  // resolution (Fable read 1-2/30 vs 25-30/30 on standard) — a billing trap.
  // ALL models render the standard page; the tier still matters for COST
  // (billing caps) and the threading infra stays for a future retune.
  it('claude-fable-5 (high-res tier) also renders on the standard 1568×728 page', async () => {
    const { info } = await transformRequest(encodeBody('claude-fable-5'));
    expect(info.compressed).toBe(true);
    expect(info.imageDims?.length).toBeGreaterThan(0);
    for (const d of info.imageDims!) {
      expect(d.width).toBe(1568); // 2·4 + 312·5
      expect(d.height).toBeLessThanOrEqual(728);
    }
  });

  it('standard-tier model likewise — single production geometry', async () => {
    const { info } = await transformRequest(encodeBody('claude-sonnet-4-5'));
    expect(info.compressed).toBe(true);
    expect(info.imageDims?.length).toBeGreaterThan(0);
    for (const d of info.imageDims!) {
      expect(d.width).toBe(1568);
      expect(d.height).toBeLessThanOrEqual(728);
    }
  });

  it('same content → same page count on both tiers', async () => {
    const fable = await transformRequest(encodeBody('claude-fable-5'));
    const std = await transformRequest(encodeBody('claude-sonnet-4-5'));
    expect(fable.info.imageCount).toBe(std.info.imageCount);
  });
});

describe('per-tier history geometry through collapseHistory', () => {
  function turns(n: number): Message[] {
    return Array.from({ length: n }, (_, i) => ({
      role: (i % 2 === 0 ? 'user' : 'assistant') as Message['role'],
      content: [{ type: 'text' as const, text: `turno ${i}: ${'conteúdo denso '.repeat(120)}` }],
    }));
  }

  it('renders collapsed history at the injected high-res dense geometry', async () => {
    const { info } = await collapseHistory(turns(16), () => true, {
      denseCols: 384,
      denseCharsPerImage: 92160,
      maxHeightPx: 1928,
      minCollapsePrefix: 4,
      keepTail: 2,
    });
    expect(info.collapsedTurns).toBeGreaterThan(0);
    expect(info.collapsedImageDims.length).toBeGreaterThan(0);
    for (const d of info.collapsedImageDims) {
      expect(d.width).toBeLessThanOrEqual(1928);
      expect(d.width).toBeGreaterThan(1568); // wide content fills past the standard bound
      expect(d.height).toBeLessThanOrEqual(1928);
    }
  });

  it('defaults to the standard dense geometry when no override is given', async () => {
    const { info } = await collapseHistory(turns(16), () => true, {
      minCollapsePrefix: 4,
      keepTail: 2,
    });
    expect(info.collapsedTurns).toBeGreaterThan(0);
    for (const d of info.collapsedImageDims) {
      expect(d.width).toBeLessThanOrEqual(1568);
      expect(d.height).toBeLessThanOrEqual(728);
    }
  });
});
