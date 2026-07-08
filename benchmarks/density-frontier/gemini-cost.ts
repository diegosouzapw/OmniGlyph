/**
 * Compat wrapper — the real implementation lives in src/core/gemini-model-profiles.ts
 * (promoted from the harness when Gemini support entered the core). Keeps the
 * 1-arg signature with default generation '3' for the eval consumers.
 */
import {
  geminiMediaResolutionTokens as coreMediaTokens,
  type GeminiGeneration,
  type GeminiMediaResolution,
} from '../../src/core/gemini-model-profiles.js';

export { geminiImageTokens } from '../../src/core/gemini-model-profiles.js';
export type { GeminiMediaResolution } from '../../src/core/gemini-model-profiles.js';

export function geminiMediaResolutionTokens(
  level: GeminiMediaResolution,
  generation: GeminiGeneration = '3',
): number {
  return coreMediaTokens(level, generation);
}
