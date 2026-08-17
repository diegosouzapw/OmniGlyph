import { describe, expect, it } from 'vitest';
import { CORPUS } from '../eval/template-compression/fixtures/corpus.js';
import { templatize, reconstruct } from '../eval/template-compression/templatize.js';

describe('template-compression corpus', () => {
  it('covers all three tiers', () => {
    const tiers = new Set(CORPUS.map((s) => s.tier));
    expect(tiers).toEqual(new Set(['best', 'typical', 'worst']));
  });

  it('every sample is losslessly templatizable', () => {
    for (const s of CORPUS) {
      expect(reconstruct(templatize(s.text).mapping), s.id).toBe(s.text);
    }
  });

  it("every query's exact answer literally appears in its sample text", () => {
    for (const s of CORPUS) {
      for (const query of s.queries) {
        expect(s.text.includes(query.exact), `${s.id}/${query.id}`).toBe(true);
      }
    }
  });

  it('worst-tier samples gain little from templating (<5% line-collapse)', () => {
    for (const s of CORPUS.filter((x) => x.tier === 'worst')) {
      const before = s.text.split('\n').length;
      const after = templatize(s.text).text.split('\n').length;
      expect(after / before, s.id).toBeGreaterThan(0.95);
    }
  });
});
