import { describe, expect, it } from 'vitest';
import { verdict } from '../eval/template-compression/run.js';

describe('go/no-go verdict', () => {
  it('is GO only when all criteria hold', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.9, rawRecall: 0.9, confabulations: 0, worstReductionPct: 1, worstRecallDelta: 0, totalReads: 10 }).go).toBe(true);
  });
  it('is NO-GO on any confabulation', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.9, rawRecall: 0.9, confabulations: 1, worstReductionPct: 1, worstRecallDelta: 0, totalReads: 10 }).go).toBe(false);
  });
  it('is NO-GO when reduction is under 20%', () => {
    expect(verdict({ repetitiveReductionPct: 12, templatedRecall: 0.9, rawRecall: 0.9, confabulations: 0, worstReductionPct: 1, worstRecallDelta: 0, totalReads: 10 }).go).toBe(false);
  });
  it('is NO-GO when templated recall regresses below raw', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.7, rawRecall: 0.9, confabulations: 0, worstReductionPct: 1, worstRecallDelta: 0, totalReads: 10 }).go).toBe(false);
  });
  it('is NO-GO when no reads occurred (reading safety unverified)', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.9, rawRecall: 0.9, confabulations: 0, worstReductionPct: 1, worstRecallDelta: 0, totalReads: 0 }).go).toBe(false);
  });
  it('is NO-GO when raw-arm recall is too low to certify', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.9, rawRecall: 0.3, confabulations: 0, worstReductionPct: 1, worstRecallDelta: 0, totalReads: 10 }).go).toBe(false);
  });
  it('is NO-GO when worst-tier tokens bloat', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.9, rawRecall: 0.9, confabulations: 0, worstReductionPct: -5, worstRecallDelta: 0, totalReads: 10 }).go).toBe(false);
  });
});
