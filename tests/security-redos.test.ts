import { describe, expect, it } from 'vitest';

import { appendIdsBlock } from '../src/core/factsheet.js';
import { findSecrets } from '../src/core/secret-guard.js';

describe('security — adversarial text remains bounded', () => {
  it('rejects repeated PEM and assignment prefixes without polynomial backtracking', () => {
    const pemNoise = '-----BEGIN PRIVATE KEY-----'.repeat(3_000);
    const assignmentNoise = `${'API'.repeat(30_000)} not-an-assignment`;
    const started = performance.now();

    expect(findSecrets(`${pemNoise}\n${assignmentNoise}`)).toEqual([]);

    // A linear scan of ~170 KiB stays comfortably below this on the slowest
    // supported CI runtime. The vulnerable regexes took multiple seconds.
    expect(performance.now() - started).toBeLessThan(1_000);
  }, 10_000);

  it('appends precision IDs without rescanning a long whitespace prefix', () => {
    const started = performance.now();
    const result = appendIdsBlock(`${' '.repeat(50_000)}commit 9d121ac`);

    expect(result).toContain('\nIDS\nhex 9d121ac\n');
    expect(performance.now() - started).toBeLessThan(1_000);
  }, 10_000);
});
