import { describe, expect, it } from 'vitest';
import { readArm } from '../eval/template-compression/read-ab.js';
import type { AskImages } from '../eval/template-compression/read-ab.js';
import type { Query } from '../eval/template-compression/fixtures/corpus.js';

describe('read-ab scoring', () => {
  it('classifies a correct exact answer and a confabulated one', async () => {
    // The `claude -p` transport is the only impure seam. readArm takes it as an
    // injected last param (default = the real askImages), so the test passes a
    // stub directly instead of relying on ESM module-binding spies — vi.spyOn on
    // a named export does not reliably intercept a call the module makes to its
    // own local binding, which would let this test silently spawn a real process.
    const stubAsk: AskImages = async (_pngs, q) => (q.id === 'ok' ? '60' : '999');
    const queries: Query[] = [
      { id: 'ok', q: 'x', exact: '60' },
      { id: 'bad', q: 'y', exact: '60' },
    ];
    const out = await readArm('templated', '10\n20\n30', queries, 'claude-fable-5', 1, stubAsk);
    expect(out.find((o) => o.queryId === 'ok')!.outcome).toBe('correct');
    expect(out.find((o) => o.queryId === 'bad')!.outcome).toBe('silent_wrong');
  });
});
