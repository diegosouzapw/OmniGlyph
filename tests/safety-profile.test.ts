import { afterEach, describe, expect, it } from 'vitest';
import {
  isOmniGlyphSupportedModel,
  isOmniGlyphSupportedModelForScope,
  setAllowedModelBases,
} from '../src/core/applicability.js';
import {
  mergeCompressionProfileOptions,
  resolveCompressionProfile,
} from '../src/core/safety-policy.js';
import { resolveNodeTransformOptions } from '../src/node.js';
import { resolveWorkerTransformOptions } from '../src/worker.js';

const previousModels = process.env.OMNIGLYPH_MODELS;
const previousProfile = process.env.OMNIGLYPH_PROFILE;

afterEach(() => {
  setAllowedModelBases(null);
  if (previousModels === undefined) delete process.env.OMNIGLYPH_MODELS;
  else process.env.OMNIGLYPH_MODELS = previousModels;
  if (previousProfile === undefined) delete process.env.OMNIGLYPH_PROFILE;
  else process.env.OMNIGLYPH_PROFILE = previousProfile;
});

describe('coding-safe compression profile', () => {
  it('keeps authority and live request state native', () => {
    const options = mergeCompressionProfileOptions(
      resolveCompressionProfile('coding-safe'),
    );

    expect(options).toMatchObject({
      compress: true,
      compressSystem: false,
      compressTools: false,
      compressReminders: false,
      compressToolResults: false,
      collapseHistory: true,
      historyAmortizationHorizon: 4,
    });
    expect(options.gptHistory?.keepTail).toBe(12);
  });

  it('does not let caller overrides weaken the native-state boundary', () => {
    const options = mergeCompressionProfileOptions(
      resolveCompressionProfile('coding-safe'),
      {
        compressSystem: true,
        compressTools: true,
        compressReminders: true,
        compressToolResults: true,
        historyAmortizationHorizon: 1,
        gptHistory: {
          keepTail: 0,
          keepRecentPairs: 0,
          minCollapsePrefix: 1,
          minCollapseTokens: 1,
        },
      },
    );

    expect(options.compressSystem).toBe(false);
    expect(options.compressTools).toBe(false);
    expect(options.compressReminders).toBe(false);
    expect(options.compressToolResults).toBe(false);
    expect(options.historyAmortizationHorizon).toBe(4);
    expect(options.gptHistory).toMatchObject({
      keepTail: 12,
      keepRecentPairs: 12,
      minCollapsePrefix: 16,
      minCollapseTokens: 4_000,
    });
  });

  it('keeps the default unchanged and supports balanced or passthrough policy', () => {
    const aggressive = resolveCompressionProfile(undefined);
    expect(aggressive.name).toBe('aggressive');
    expect(mergeCompressionProfileOptions(aggressive)).toEqual({});

    const balanced = mergeCompressionProfileOptions(
      resolveCompressionProfile('balanced'),
    );
    expect(balanced.compressSystem).toBe(false);
    expect(balanced.gptHistory?.keepTail).toBe(8);

    const passthrough = mergeCompressionProfileOptions(
      resolveCompressionProfile('passthrough'),
      { compress: true },
    );
    expect(passthrough.compress).toBe(false);
  });

  it('does not let safe scopes promote configured experimental models', () => {
    process.env.OMNIGLYPH_MODELS = 'claude-fable-5,gpt-5.6,grok-4.5';

    expect(isOmniGlyphSupportedModelForScope('claude-fable-5', 'coding-safe')).toBe(true);
    expect(isOmniGlyphSupportedModelForScope('gpt-5.6', 'balanced')).toBe(true);
    expect(isOmniGlyphSupportedModelForScope('grok-4.5', 'coding-safe')).toBe(false);
    expect(isOmniGlyphSupportedModelForScope('grok-4.5', 'aggressive')).toBe(true);
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
      compressTools: false,
      compressReminders: false,
      compressToolResults: false,
      collapseHistory: true,
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
    }).compress).toBe(false);
  });

  it('makes the Worker profile authoritative over permissive transform flags', () => {
    const options = resolveWorkerTransformOptions({
      OMNIGLYPH_PROFILE: 'coding-safe',
      COMPRESS: 'true',
      COMPRESS_TOOLS: 'true',
      COMPRESS_REMINDERS: 'true',
      COMPRESS_TOOL_RESULTS: 'true',
    });

    expect(options).toMatchObject({
      compress: true,
      compressSystem: false,
      compressTools: false,
      compressReminders: false,
      compressToolResults: false,
      collapseHistory: true,
    });
  });
});
