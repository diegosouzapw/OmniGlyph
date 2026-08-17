import { afterEach, describe, expect, it } from 'vitest';

import {
  isOmniGlyphSupportedModel,
  isOmniGlyphSupportedModelForScope,
  mergeCompressionProfileOptions,
  resolveCompressionProfile,
  shouldKeepToolResultSharp,
  transformAnthropicMessages,
  transformOpenAIChatCompletions,
} from '../src/core/index.js';
import { resolveNodeTransformOptions } from '../src/node.js';
import { resolveWorkerTransformOptions } from '../src/worker.js';

const enc = new TextEncoder();
const dec = new TextDecoder();
const previousModels = process.env.OMNIGLYPH_MODELS;
const previousProfile = process.env.OMNIGLYPH_PROFILE;

afterEach(() => {
  if (previousModels === undefined) delete process.env.OMNIGLYPH_MODELS;
  else process.env.OMNIGLYPH_MODELS = previousModels;
  if (previousProfile === undefined) delete process.env.OMNIGLYPH_PROFILE;
  else process.env.OMNIGLYPH_PROFILE = previousProfile;
});

describe('compression safety profiles', () => {
  it('keeps the legacy transform policy when no profile is selected', () => {
    const profile = resolveCompressionProfile();
    expect(profile.name).toBe('aggressive');
    expect(mergeCompressionProfileOptions(profile)).toEqual({});
  });

  it('keeps authority, schemas and live tool state native in coding-safe mode', () => {
    const options = mergeCompressionProfileOptions(resolveCompressionProfile('coding-safe'));
    expect(options).toMatchObject({
      compress: true,
      compressSystem: false,
      compressTools: false,
      compressReminders: false,
      compressToolResults: false,
      minCompressChars: Number.MAX_SAFE_INTEGER,
      collapseHistory: true,
      historyAmortizationHorizon: 4,
      anthropicHistory: { keepTail: 12, minCollapsePrefix: 16 },
      gptHistory: {
        keepTail: 12,
        keepRecentPairs: 12,
        minCollapsePrefix: 16,
        minCollapseTokens: 4_000,
      },
    });
  });

  it('allows stricter caller settings but cannot weaken a safe boundary', () => {
    const options = mergeCompressionProfileOptions(
      resolveCompressionProfile('balanced'),
      {
        compressSystem: true,
        compressTools: true,
        compressReminders: true,
        compressToolResults: true,
        historyAmortizationHorizon: 6,
        anthropicHistory: { keepTail: 2, minCollapsePrefix: 2 },
        gptHistory: {
          keepTail: 2,
          keepRecentPairs: 2,
          minCollapsePrefix: 2,
          minCollapseTokens: 2,
        },
      },
    );
    expect(options.compressSystem).toBe(false);
    expect(options.compressTools).toBe(false);
    expect(options.compressReminders).toBe(false);
    expect(options.compressToolResults).toBe(false);
    expect(options.historyAmortizationHorizon).toBe(6);
    expect(options.anthropicHistory).toMatchObject({ keepTail: 8, minCollapsePrefix: 12 });
    expect(options.gptHistory).toMatchObject({
      keepTail: 8,
      keepRecentPairs: 8,
      minCollapsePrefix: 12,
      minCollapseTokens: 3_000,
    });
  });

  it('cannot turn passthrough back into a transform', () => {
    const options = mergeCompressionProfileOptions(
      resolveCompressionProfile('passthrough'),
      { compress: true, compressToolResults: true },
    );
    expect(options.compress).toBe(false);
  });

  it('rejects unknown profile names instead of silently broadening policy', () => {
    expect(() => resolveCompressionProfile('turbo')).toThrow(
      "invalid OMNIGLYPH_PROFILE 'turbo'",
    );
  });

  it('recognizes exact coding-state shapes conservatively', () => {
    expect(shouldKeepToolResultSharp({
      kind: 'tool_result',
      text: 'diff --git a/src/a.ts b/src/a.ts\n@@ -1 +1 @@',
    })).toBe(true);
    expect(shouldKeepToolResultSharp({
      kind: 'tool_result',
      text: '{"commit":"a1b2c3d4","ok":true}',
    })).toBe(true);
    expect(shouldKeepToolResultSharp({
      kind: 'tool_result',
      text: 'ordinary prose without machine state',
    })).toBe(false);
  });

  it('safe scopes cannot promote models outside the measured default set', () => {
    process.env.OMNIGLYPH_MODELS =
      'claude-fable-5,gpt-5.6,claude-opus-4-8,grok-4.5';
    expect(isOmniGlyphSupportedModelForScope('claude-fable-5', 'coding-safe')).toBe(true);
    expect(isOmniGlyphSupportedModelForScope('gpt-5.6', 'balanced')).toBe(true);
    expect(isOmniGlyphSupportedModelForScope('claude-opus-4-8', 'coding-safe')).toBe(false);
    expect(isOmniGlyphSupportedModelForScope('grok-4.5', 'balanced')).toBe(false);
    expect(isOmniGlyphSupportedModelForScope('claude-opus-4-8', 'aggressive')).toBe(true);
    expect(isOmniGlyphSupportedModelForScope('claude-fable-5', 'passthrough')).toBe(false);
  });

  it('applies the environment profile to the production model gate', () => {
    process.env.OMNIGLYPH_MODELS = 'claude-fable-5,grok-4.5';
    process.env.OMNIGLYPH_PROFILE = 'coding-safe';
    expect(isOmniGlyphSupportedModel('claude-fable-5')).toBe(true);
    expect(isOmniGlyphSupportedModel('grok-4.5')).toBe(false);

    process.env.OMNIGLYPH_PROFILE = 'aggressive';
    expect(isOmniGlyphSupportedModel('grok-4.5')).toBe(true);
  });

  it('composes the Node profile with legacy and runtime kill switches', () => {
    expect(resolveNodeTransformOptions({
      profile: 'coding-safe',
      keepSystemText: false,
      forcePassthrough: false,
      compressionEnabled: true,
    })).toMatchObject({
      compressSystem: false,
      compressToolResults: false,
      minCompressChars: Number.MAX_SAFE_INTEGER,
      anthropicHistory: { keepTail: 12 },
    });
    expect(resolveNodeTransformOptions({
      profile: 'aggressive',
      keepSystemText: true,
      forcePassthrough: false,
      compressionEnabled: true,
    })).toEqual({
      compressSystem: false,
      compressTools: false,
      compressReminders: false,
    });
    expect(resolveNodeTransformOptions({
      profile: 'coding-safe',
      keepSystemText: false,
      forcePassthrough: true,
      compressionEnabled: true,
    })).toEqual({ compress: false });
  });

  it('makes the Worker profile authoritative over permissive bindings', () => {
    const options = resolveWorkerTransformOptions({
      OMNIGLYPH_PROFILE: 'coding-safe',
      COMPRESS: 'true',
      COMPRESS_TOOLS: 'true',
      COMPRESS_REMINDERS: 'true',
      COMPRESS_TOOL_RESULTS: 'true',
      MIN_COMPRESS_CHARS: '1',
    });
    expect(options).toMatchObject({
      compress: true,
      compressSystem: false,
      compressTools: false,
      compressReminders: false,
      compressToolResults: false,
      minCompressChars: Number.MAX_SAFE_INTEGER,
      anthropicHistory: { keepTail: 12 },
    });
  });

  it('keeps OpenAI system authority and tool schemas native', async () => {
    const system = 'Exact developer authority. '.repeat(3_000);
    const tool = {
      type: 'function',
      function: {
        name: 'edit_file',
        description: 'Exact tool contract. '.repeat(500),
        parameters: {
          type: 'object',
          properties: { path: { type: 'string' } },
          required: ['path'],
        },
      },
    };
    const body = enc.encode(JSON.stringify({
      model: 'gpt-5.6',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: 'Keep this request native.' },
      ],
      tools: [tool],
    }));
    const options = mergeCompressionProfileOptions(
      resolveCompressionProfile('coding-safe'),
      { charsPerToken: 1, minCompressChars: 1 },
    );
    const result = await transformOpenAIChatCompletions(body, options);
    const output = JSON.parse(dec.decode(result.body)) as {
      messages: Array<{ role: string; content: unknown }>;
      tools: unknown[];
    };

    expect(result.info.compressed).toBe(false);
    expect(output.messages[0]).toEqual({ role: 'system', content: system });
    expect(output.tools).toEqual([tool]);
  });

  it('keeps native authority and live state while collapsing old Anthropic history', async () => {
    const system = 'Exact operating authority. '.repeat(500);
    const tool = {
      name: 'edit_file',
      description: 'Exact editing contract. '.repeat(300),
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string' }, content: { type: 'string' } },
        required: ['path', 'content'],
      },
    };
    const messages: Array<{
      role: 'user' | 'assistant';
      content: unknown;
    }> = Array.from({ length: 34 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `closed history ${index} ${'context '.repeat(700)}`,
    }));
    messages.push(
      {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'toolu_live', name: 'edit_file', input: { path: 'src/a.ts' } },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_live',
            content: `src/a.ts:42 exact live result ${'x'.repeat(12_000)}`,
          },
          { type: 'text', text: 'Continue from the exact live result.' },
        ],
      },
    );

    const result = await transformAnthropicMessages({
      model: 'claude-fable-5',
      options: { profile: 'coding-safe', charsPerToken: 1 },
      body: enc.encode(JSON.stringify({
        model: 'claude-fable-5',
        max_tokens: 128,
        system,
        tools: [tool],
        messages,
      })),
    });
    const output = JSON.parse(dec.decode(result.body)) as {
      system: string;
      tools: unknown[];
      messages: unknown[];
    };

    expect(result.applied).toBe(true);
    expect(result.info.collapsedTurns).toBeGreaterThan(0);
    expect(output.system).toBe(system);
    expect(output.tools).toEqual([tool]);
    expect(JSON.stringify(output.messages)).toContain('src/a.ts:42 exact live result');
    expect(JSON.stringify(output.messages)).toContain('Continue from the exact live result.');
  });
});
