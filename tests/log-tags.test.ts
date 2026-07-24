import { describe, expect, it } from 'vitest';
import { skipReasonTag } from '../src/log-tags.js';

/** The console request-log line tags a non-compressed outcome so skip reasons
 *  are greppable in `omniglyph` stdout / `wrangler tail` (e.g. savings:skip(not_profitable)). */
describe('skipReasonTag', () => {
  it('wraps a skip reason as savings:skip(<reason>)', () => {
    expect(skipReasonTag('not_profitable')).toBe('savings:skip(not_profitable)');
    expect(skipReasonTag('below_threshold')).toBe('savings:skip(below_threshold)');
  });

  it('is empty when there is no reason (no spurious tag)', () => {
    expect(skipReasonTag(undefined)).toBe('');
    expect(skipReasonTag('')).toBe('');
  });
});
