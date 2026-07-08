/**
 * Port of upstream fix #44: TYPED native tools (type !== 'custom', e.g.
 * advisor_20260301) have a server-side schema that rejects extra fields —
 * injecting the description stub causes a 400 "Extra inputs are not
 * permitted" and the client's silent fallback switches models, zeroing the
 * whole session's savings without anyone noticing. These tools must pass
 * through BYTE-IDENTICAL.
 */
import { describe, expect, it } from 'vitest';
import { transformRequest } from '../src/core/transform.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

const BIG_SYSTEM = `${'X'.repeat(500)}\n${'Instrução densa de sistema para passar o gate. '.repeat(400)}`;
const TYPED_TOOL = { type: 'advisor_20260301', name: 'advisor' };
const CUSTOM_TOOL = {
  name: 'do_thing',
  description: 'Documentação longa da ferramenta. '.repeat(300),
  input_schema: { type: 'object', properties: { x: { type: 'string', description: 'parâmetro x' } } },
};

function body(tools: unknown[]): Uint8Array {
  return enc.encode(JSON.stringify({
    model: 'claude-fable-5',
    max_tokens: 128,
    system: BIG_SYSTEM,
    tools,
    messages: [{ role: 'user', content: [{ type: 'text', text: 'oi' }] }],
  }));
}

describe('typed native tools pass through untouched (upstream #44)', () => {
  it('does not inject description or touch the schema when type !== custom; compresses the rest', async () => {
    const { body: out, info } = await transformRequest(body([TYPED_TOOL, CUSTOM_TOOL]));
    expect(info.compressed).toBe(true);
    const parsed = JSON.parse(dec.decode(out)) as { tools: Array<Record<string, unknown>> };
    expect(parsed.tools[0]).toEqual(TYPED_TOOL); // byte-identical
    expect(String(parsed.tools[1]!.description)).toMatch(/^ⓘ Full docs/);
  });

  it('does not render the typed tool doc in the imaged Tool Reference', async () => {
    const { info } = await transformRequest(body([TYPED_TOOL, CUSTOM_TOOL]));
    expect(info.imageSourceText).toBeDefined();
    expect(info.imageSourceText).not.toContain('## Tool: advisor');
    expect(info.imageSourceText).toContain('## Tool: do_thing');
  });

  it('explicit type: "custom" remains compressible', async () => {
    const { body: out } = await transformRequest(body([{ ...CUSTOM_TOOL, type: 'custom' }]));
    const parsed = JSON.parse(dec.decode(out)) as { tools: Array<Record<string, unknown>> };
    expect(String(parsed.tools[0]!.description)).toMatch(/^ⓘ Full docs/);
  });
});
