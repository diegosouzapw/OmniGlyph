import type { HistoryCollapseOptions } from './history.js';
import type { GptHistoryOptions } from './openai-history.js';
import type { KeepSharpBlock, TransformOptions } from './transform.js';

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

type AnthropicHistoryPolicy = Partial<
  Pick<HistoryCollapseOptions, 'keepTail' | 'minCollapsePrefix'>
>;

const SAMPLE_HEAD_CHARS = 64_000;
const SAMPLE_TAIL_CHARS = 32_000;

function boundedSample(text: string): string {
  if (text.length <= SAMPLE_HEAD_CHARS + SAMPLE_TAIL_CHARS) return text;
  return `${text.slice(0, SAMPLE_HEAD_CHARS)}\n${text.slice(-SAMPLE_TAIL_CHARS)}`;
}

function looksStructured(text: string): boolean {
  const value = text.trim();
  if (!(
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  )) return false;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null && typeof parsed === 'object';
  } catch {
    return false;
  }
}

function lineSignalsMachineState(line: string): boolean {
  const value = line.trimStart();
  const sourcePrefixes = [
    'import ', 'export ', 'const ', 'let ', 'var ', 'function ', 'class ',
    'interface ', 'type ', 'def ', 'async def ', 'fn ', 'package ', '#include ',
    'public ', 'private ', 'protected ',
  ];
  if (sourcePrefixes.some((prefix) => value.startsWith(prefix))) return true;
  if (
    value.startsWith('diff --git ') || value.startsWith('@@ -') ||
    value.startsWith('+++ ') || value.startsWith('--- ') ||
    value.startsWith('at ') || value.startsWith('Traceback (most recent call last)') ||
    value.startsWith('Caused by:') || value.startsWith('panic:')
  ) return true;
  return line.includes('error TS') || line.includes('warning TS') ||
    line.includes('fatal error:') || line.includes('undefined reference') ||
    line.includes('SyntaxError:') || line.includes('TypeError:') ||
    line.includes('AssertionError:') || line.includes('FAILED') ||
    line.includes('FAIL ') || line.includes('PASS ') || line.includes('test result:');
}

function hasExactMachineToken(text: string): boolean {
  // All expressions operate on a bounded sample and avoid nested quantifiers.
  return /\b[0-9a-f]{7,40}\b/.test(text) ||
    /\b[A-Z][A-Z0-9_]{2,}\b/.test(text) ||
    /--[A-Za-z][A-Za-z0-9_-]*/.test(text) ||
    /(?:^|\s)(?:\.\.\/|\.\/|\/)[^\s:]+:\d+(?::\d+)?\b/m.test(text);
}

/**
 * Conservative classifier for exact live coding state. False positives only
 * retain text; false negatives could send machine-readable state through OCR.
 */
export function shouldKeepToolResultSharp(block: KeepSharpBlock): boolean {
  if (!block.text) return false;
  const sample = boundedSample(block.text);
  if (sample.includes('```') || looksStructured(sample)) return true;
  for (const line of sample.split('\n')) {
    if (lineSignalsMachineState(line)) return true;
  }
  return hasExactMachineToken(sample);
}

const PROFILES: Record<CompressionProfileName, CompressionProfile> = {
  'coding-safe': {
    name: 'coding-safe',
    description: 'keep authority and live tool state native; collapse only old closed history',
    transform: {
      compress: true,
      compressSystem: false,
      compressTools: false,
      compressReminders: false,
      compressToolResults: false,
      minCompressChars: Number.MAX_SAFE_INTEGER,
      collapseHistory: true,
      historyAmortizationHorizon: 4,
      reflow: true,
      anthropicHistory: { keepTail: 12, minCollapsePrefix: 16 },
      gptHistory: {
        keepTail: 12,
        keepRecentPairs: 12,
        minCollapsePrefix: 16,
        minCollapseTokens: 4_000,
      },
      keepSharp: shouldKeepToolResultSharp,
    },
  },
  balanced: {
    name: 'balanced',
    description: 'keep live state native with a shorter protected history tail',
    transform: {
      compress: true,
      compressSystem: false,
      compressTools: false,
      compressReminders: false,
      compressToolResults: false,
      minCompressChars: Number.MAX_SAFE_INTEGER,
      collapseHistory: true,
      historyAmortizationHorizon: 3,
      reflow: true,
      anthropicHistory: { keepTail: 8, minCollapsePrefix: 12 },
      gptHistory: {
        keepTail: 8,
        keepRecentPairs: 8,
        minCollapsePrefix: 12,
        minCollapseTokens: 3_000,
      },
      keepSharp: shouldKeepToolResultSharp,
    },
  },
  aggressive: {
    name: 'aggressive',
    description: 'existing transform policy',
    transform: {},
  },
  passthrough: {
    name: 'passthrough',
    description: 'route only; disable context transforms',
    transform: { compress: false },
  },
};

export function resolveCompressionProfile(raw?: string): CompressionProfile {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value || value === 'aggressive' || value === 'legacy') return PROFILES.aggressive;
  if (value === 'safe' || value === 'coding' || value === 'coding-safe') {
    return PROFILES['coding-safe'];
  }
  if (value === 'balanced') return PROFILES.balanced;
  if (value === 'off' || value === 'disabled' || value === 'passthrough') {
    return PROFILES.passthrough;
  }
  throw new Error(
    `invalid OMNIGLYPH_PROFILE '${raw}'; expected coding-safe, balanced, aggressive or passthrough`,
  );
}

function maxDefined(base: number | undefined, caller: number | undefined): number | undefined {
  if (base === undefined) return caller;
  if (caller === undefined) return base;
  return Math.max(base, caller);
}

function tightenAnthropicHistory(
  base: AnthropicHistoryPolicy | undefined,
  caller: AnthropicHistoryPolicy | undefined,
): AnthropicHistoryPolicy | undefined {
  if (!base && !caller) return undefined;
  return {
    ...base,
    ...caller,
    keepTail: maxDefined(base?.keepTail, caller?.keepTail),
    minCollapsePrefix: maxDefined(base?.minCollapsePrefix, caller?.minCollapsePrefix),
  };
}

function tightenGptHistory(
  base: Partial<GptHistoryOptions> | undefined,
  caller: Partial<GptHistoryOptions> | undefined,
): Partial<GptHistoryOptions> | undefined {
  if (!base && !caller) return undefined;
  return {
    ...base,
    ...caller,
    keepTail: maxDefined(base?.keepTail, caller?.keepTail),
    keepRecentPairs: maxDefined(base?.keepRecentPairs, caller?.keepRecentPairs),
    minCollapsePrefix: maxDefined(base?.minCollapsePrefix, caller?.minCollapsePrefix),
    minCollapseTokens: maxDefined(base?.minCollapseTokens, caller?.minCollapseTokens),
  };
}

/** Merge caller overrides without allowing safe profiles to regain lossy lanes. */
export function mergeCompressionProfileOptions(
  profile: CompressionProfile,
  overrides: TransformOptions = {},
): TransformOptions {
  const baseKeep = profile.transform.keepSharp;
  const callerKeep = overrides.keepSharp;
  const keepSharp = baseKeep && callerKeep
    ? (block: KeepSharpBlock): boolean => {
        let base = false;
        let caller = false;
        try { base = baseKeep(block) === true; } catch { /* retain caller result */ }
        try { caller = callerKeep(block) === true; } catch { /* retain base result */ }
        return base || caller;
      }
    : callerKeep ?? baseKeep;
  const merged: TransformOptions = {
    ...profile.transform,
    ...overrides,
    ...(keepSharp ? { keepSharp } : {}),
  };

  if (profile.name === 'passthrough') return { ...merged, compress: false };
  if (profile.name === 'aggressive') return merged;

  return {
    ...merged,
    compress: overrides.compress === false ? false : true,
    compressSystem: false,
    compressTools: false,
    compressReminders: false,
    compressToolResults: false,
    minCompressChars: maxDefined(
      profile.transform.minCompressChars,
      overrides.minCompressChars,
    ),
    collapseHistory: overrides.collapseHistory === false ? false : true,
    historyAmortizationHorizon: maxDefined(
      profile.transform.historyAmortizationHorizon,
      overrides.historyAmortizationHorizon,
    ),
    anthropicHistory: tightenAnthropicHistory(
      profile.transform.anthropicHistory,
      overrides.anthropicHistory,
    ),
    gptHistory: tightenGptHistory(profile.transform.gptHistory, overrides.gptHistory),
  };
}
