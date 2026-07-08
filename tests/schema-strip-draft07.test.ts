/**
 * Port of upstream fix #45: the stripper removed `$schema` — without it the
 * API validates the schema as 2020-12, where TUPLE-form `items` (draft-07,
 * `items: [a, b]`) is invalid → 400 in a silent loop with fallback to the
 * uncompressed path (savings zeroed). Real case: Voiceflow MCP.
 *
 * Fix: `$schema`/`$id` survive (tiny strings; validation semantics and $ref
 * resolution depend on them); tuple elements have their annotations stripped
 * individually instead of passing/collapsing the whole array.
 */
import { describe, expect, it } from 'vitest';
import { stripSchemaDescriptions } from '../src/core/schema-strip.js';

describe('draft-07 survival (upstream #45)', () => {
  it('preserves $schema and $id while stripping annotations as usual', () => {
    const out = stripSchemaDescriptions({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $id: 'https://example.com/tool.json',
      type: 'object',
      description: 'longa descrição que deve sair',
      properties: { x: { type: 'string', description: 'anotação' } },
    }) as Record<string, unknown>;
    expect(out.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(out.$id).toBe('https://example.com/tool.json');
    expect(out.description).toBeUndefined();
    expect((out.properties as Record<string, Record<string, unknown>>).x!.description).toBeUndefined();
    expect((out.properties as Record<string, Record<string, unknown>>).x!.type).toBe('string');
  });

  it('tuple-form items stays an ARRAY, in order, with annotations stripped per element', () => {
    const out = stripSchemaDescriptions({
      type: 'array',
      items: [
        { type: 'string', description: 'primeiro' },
        { type: 'number', title: 'segundo' },
      ],
      additionalItems: false,
    }) as Record<string, unknown>;
    const items = out.items as Array<Record<string, unknown>>;
    expect(Array.isArray(items)).toBe(true);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({ type: 'string' });
    expect(items[1]).toEqual({ type: 'number' });
    expect(out.additionalItems).toBe(false);
  });

  it('additionalItems as a subschema is stripped too', () => {
    const out = stripSchemaDescriptions({
      type: 'array',
      items: [{ type: 'string' }],
      additionalItems: { type: 'integer', description: 'resto' },
    }) as Record<string, unknown>;
    expect(out.additionalItems).toEqual({ type: 'integer' });
  });

  it('$comment is still removed (pure annotation, no semantics)', () => {
    const out = stripSchemaDescriptions({ type: 'object', $comment: 'nota interna' }) as Record<string, unknown>;
    expect(out.$comment).toBeUndefined();
  });
});
