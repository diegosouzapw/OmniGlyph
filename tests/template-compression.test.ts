import { describe, expect, it } from 'vitest';
import { templatize, reconstruct, skeletonize } from '../eval/template-compression/templatize.js';

describe('templatize', () => {
  it('skeletonizes digit runs and captures values in order', () => {
    expect(skeletonize('worker-7 request 4832 failed after 30 sec')).toEqual({
      skeleton: 'worker-\x1E request \x1E failed after \x1E sec',
      values: ['7', '4832', '30'],
    });
  });

  it('collapses a contiguous run of same-shape lines into a Template/Rows block', () => {
    const raw = [
      'worker-7 request 4832 failed after 30 sec',
      'worker-7 request 4833 failed after 60 sec',
      'worker-8 request 4834 failed after 60 sec',
    ].join('\n');
    const { text } = templatize(raw);
    expect(text).toBe(
      'Template: worker-{} request {} failed after {} sec\nRows:\n7,4832,30\n7,4833,60\n8,4834,60',
    );
  });

  it('is lossless: reconstruct(templatize(x)) === x', () => {
    const raw = [
      'worker-7 request 4832 failed after 30 sec',
      'worker-7 request 4833 failed after 60 sec',
      'worker-8 request 4834 failed after 60 sec',
    ].join('\n');
    expect(reconstruct(templatize(raw).mapping)).toBe(raw);
  });

  it('leaves non-repetitive text untouched (run shorter than MIN_RUN)', () => {
    const raw = 'hello world\njust one 42 number\nthe end';
    const { text, mapping } = templatize(raw);
    expect(text).toBe(raw);
    expect(mapping.segments).toEqual([{ kind: 'raw', lines: raw.split('\n') }]);
    expect(reconstruct(mapping)).toBe(raw);
  });

  it('only groups lines that actually vary (skeleton must contain a variable)', () => {
    const raw = 'same line\nsame line\nsame line';
    // identical lines have no digit variable -> not a template win, passthrough
    expect(templatize(raw).text).toBe(raw);
  });

  it('round-trips mixed raw + grouped + raw with values at line edges', () => {
    const raw = [
      'header',
      '10 apples',
      '20 apples',
      '30 apples',
      'footer 9',
    ].join('\n');
    expect(reconstruct(templatize(raw).mapping)).toBe(raw);
    expect(templatize(raw).text).toContain('Template: {} apples');
  });

  it('stays lossless when digit positions differ across same-letter lines', () => {
    // 'a1b1c'/'a2b2c'/'a3b3c' share the layout 'a{}b{}c'; 'ab4c4' has the same
    // letters but a DIFFERENT digit layout ('ab{}c{}'). Grouping on a marker-less
    // skeleton would merge it and corrupt the round-trip — the marker prevents that.
    const raw = ['a1b1c', 'a2b2c', 'a3b3c', 'ab4c4'].join('\n');
    expect(reconstruct(templatize(raw).mapping)).toBe(raw);
  });
});
