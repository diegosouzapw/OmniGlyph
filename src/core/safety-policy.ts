import type { TransformOptions } from './transform.js';

export type CompressionProfileName =
  | 'coding-safe'
  | 'balanced'
  | 'aggressive'
  | 'passthrough';

export interface CompressionProfile {
  readonly name: CompressionProfileName;
  readonly description: string;
  readonly transform: Readonly<TransformOptions>;
}

const CODING_SAFE: CompressionProfile = {
  name: 'coding-safe',
  description: 'keep authority and live request state native; collapse only old history',
  transform: {
    compress: true,
    compressSystem: false,
    compressTools: false,
    compressReminders: false,
    compressToolResults: false,
    collapseHistory: true,
    historyAmortizationHorizon: 4,
    gptHistory: {
      keepTail: 12,
      keepRecentPairs: 12,
      minCollapsePrefix: 16,
      minCollapseTokens: 4_000,
    },
  },
};

const BALANCED: CompressionProfile = {
  name: 'balanced',
  description: 'keep authority and live request state native with a shorter protected history tail',
  transform: {
    compress: true,
    compressSystem: false,
    compressTools: false,
    compressReminders: false,
    compressToolResults: false,
    collapseHistory: true,
    historyAmortizationHorizon: 3,
    gptHistory: {
      keepTail: 8,
      keepRecentPairs: 8,
      minCollapsePrefix: 12,
      minCollapseTokens: 3_000,
    },
  },
};

const AGGRESSIVE: CompressionProfile = {
  name: 'aggressive',
  description: 'existing transform policy',
  transform: {},
};

const PASSTHROUGH: CompressionProfile = {
  name: 'passthrough',
  description: 'route only; disable context transforms',
  transform: { compress: false },
};

export function resolveCompressionProfile(raw?: string): CompressionProfile {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value || value === 'aggressive' || value === 'legacy') return AGGRESSIVE;
  if (value === 'safe' || value === 'coding' || value === 'coding-safe') return CODING_SAFE;
  if (value === 'balanced') return BALANCED;
  if (value === 'off' || value === 'disabled' || value === 'passthrough') return PASSTHROUGH;
  throw new Error(
    `invalid OMNIGLYPH_PROFILE '${raw}'; expected coding-safe, balanced, aggressive or passthrough`,
  );
}

export function mergeCompressionProfileOptions(
  profile: CompressionProfile,
  overrides: TransformOptions = {},
): TransformOptions {
  if (profile.name === 'passthrough') return { ...overrides, compress: false };
  if (profile.name === 'aggressive') return { ...overrides };

  const baseHistory = profile.transform.gptHistory;
  const callerHistory = overrides.gptHistory;
  const floor = (base: number | undefined, value: number | undefined): number | undefined => {
    if (base === undefined) return value;
    if (value === undefined) return base;
    return Math.max(base, value);
  };

  return {
    ...profile.transform,
    ...overrides,
    compressSystem: false,
    compressTools: false,
    compressReminders: false,
    compressToolResults: false,
    collapseHistory: overrides.collapseHistory === false
      ? false
      : profile.transform.collapseHistory,
    historyAmortizationHorizon: floor(
      profile.transform.historyAmortizationHorizon,
      overrides.historyAmortizationHorizon,
    ),
    gptHistory: {
      ...baseHistory,
      ...callerHistory,
      keepTail: floor(baseHistory?.keepTail, callerHistory?.keepTail),
      keepRecentPairs: floor(baseHistory?.keepRecentPairs, callerHistory?.keepRecentPairs),
      minCollapsePrefix: floor(baseHistory?.minCollapsePrefix, callerHistory?.minCollapsePrefix),
      minCollapseTokens: floor(baseHistory?.minCollapseTokens, callerHistory?.minCollapseTokens),
    },
  };
}
