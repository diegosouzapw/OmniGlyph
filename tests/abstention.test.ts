import { describe, it, expect } from 'vitest';
import { transformRequest } from '../src/core/transform.js';
import { HISTORY_SYNTHETIC_INTRO } from '../src/core/history.js';

const enc = new TextEncoder();
const dec = new TextDecoder();
const ABSTAIN = 'not safe to quote from the image';

// The main failure mode of imaged text is confabulation: the reader invents a
// plausible exact value instead of abstaining. The rendered framing now tells
// the model to defer exact identifiers to the factsheet / source rather than guess.
describe('exact-string abstention framing', () => {
  it('the imaged slab banner discourages guessing exact values from images', async () => {
    const bigSystem = 'You are a coding agent with detailed operating instructions. '.repeat(300);
    const { info } = await transformRequest(
      enc.encode(JSON.stringify({
        model: 'claude-fable-5',
        system: bigSystem,
        messages: [{ role: 'user', content: 'hi' }],
      })),
      { compress: true, minCompressChars: 1, charsPerToken: 1 },
    );
    expect(info.compressed).toBe(true);
    // imageSourceText is the exact text rendered into the slab image(s).
    expect(info.imageSourceText ?? '').toContain(ABSTAIN);
  });

  it('the history-transcript framing carries the same abstention', () => {
    expect(HISTORY_SYNTHETIC_INTRO).toContain('do not guess an exact value seen only in the image');
  });

  it('adds nothing when the transform is not applied', async () => {
    const { body: out, info } = await transformRequest(
      enc.encode(JSON.stringify({
        model: 'claude-fable-5',
        system: 'short',
        messages: [{ role: 'user', content: 'hi' }],
      })),
      { compress: false },
    );
    expect(info.compressed).toBe(false);
    expect(dec.decode(out)).not.toContain(ABSTAIN);
  });
});
