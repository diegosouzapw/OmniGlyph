import { describe, expect, it } from 'vitest';
import { measureSample } from '../eval/template-compression/measure-tokens.js';
import { CORPUS } from '../eval/template-compression/fixtures/corpus.js';

describe('measure-tokens', () => {
  it('reports a positive reduction on a best-tier sample', async () => {
    const best = CORPUS.find((s) => s.id === 'best-worker-log')!;
    const r = await measureSample(best.text, 'claude-fable-5');
    expect(r.templated.imageTokens).toBeLessThan(r.raw.imageTokens);
    expect(r.reductionPct).toBeGreaterThan(0);
  });
});
