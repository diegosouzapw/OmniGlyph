/**
 * Config grid for the density-frontier eval: provider × page geometry ×
 * glyph cell × atlas style. Cost is computed OFFLINE per config by actually
 * rendering the corpus (billing is exactly predictable: Anthropic 28 px
 * patches + 4/block; OpenAI patch/tile profiles; Gemini tiles) — only
 * accuracy needs API calls.
 */
import { renderTextToPngsWithCharLimit, type RenderStyle } from '../../src/core/render.js';
import {
  ANTHROPIC_IMAGE_BLOCK_OVERHEAD_TOKENS,
  anthropicImageTokens,
  type AnthropicVisionTier,
} from '../../src/core/anthropic-vision.js';
import { openAIVisionTokens } from '../../src/core/openai.js';
import {
  geminiImageTokens,
  geminiMediaResolutionTokens,
  resolveGeminiGeneration,
  type GeminiMediaResolution,
} from '../../src/core/gemini-model-profiles.js';

export type Provider = 'anthropic' | 'openai' | 'gemini';

export interface FrontierConfig {
  id: string;
  provider: Provider;
  /** Model the accuracy trials run against (and, for anthropic, tier source). */
  model: string;
  tier?: AnthropicVisionTier;
  page: { cols: number; maxHeightPx: number; charsPerImage: number };
  style: RenderStyle;
  /** Gemini 3 only: fixed per-image billing override (280/560/1120/2240). */
  geminiMediaResolution?: GeminiMediaResolution;
  /** CONTROL arm: sends the corpus as plain TEXT (no images). Measures the
   *  accuracy baseline and the completion-token inflation (H7). */
  textControl?: boolean;
  notes: string;
}

/** rows(page) × cols budget, mirroring the renderer height math. */
function pageBudget(cols: number, maxHeightPx: number, cellH: number): number {
  return cols * Math.max(1, Math.floor((maxHeightPx - 8) / cellH));
}

function cfg(
  id: string,
  provider: Provider,
  model: string,
  cols: number,
  maxHeightPx: number,
  style: RenderStyle,
  notes: string,
  tier?: AnthropicVisionTier,
): FrontierConfig {
  const cellH = 8 + (style.cellHBonus ?? 0);
  return {
    id,
    provider,
    model,
    tier,
    page: { cols, maxHeightPx, charsPerImage: pageBudget(cols, maxHeightPx, cellH) },
    style,
    notes,
  };
}

/** Curated grid (~1 API-trial batch per entry). The full cross-product is
 *  intentionally NOT default — extend per hypothesis, measure, prune. */
export const CURATED_CONFIGS: FrontierConfig[] = [
  // — Anthropic: the decision this harness was built for —
  cfg('anthropic-std-5x8-aa', 'anthropic', 'claude-fable-5', 312, 728, { aa: true }, 'current production (standard page)', 'highres'),
  cfg('anthropic-hires-5x8-aa', 'anthropic', 'claude-fable-5', 384, 1928, { aa: true }, 'restored large page — the decisive A/B', 'highres'),
  cfg('anthropic-hires-5x8-1bit', 'anthropic', 'claude-fable-5', 384, 1928, { aa: false }, 'settles the AA vs 1-bit contradiction of the dense render', 'highres'),
  cfg('anthropic-std-5x8-1bit', 'anthropic', 'claude-fable-5', 312, 728, { aa: false }, '1-bit on the standard page', 'highres'),
  cfg('anthropic-hires-7x10-aa', 'anthropic', 'claude-fable-5', 274, 1928, { aa: true, cellWBonus: 2, cellHBonus: 2 }, '7×10 cell on the large page (safe mode for Opus)', 'highres'),
  cfg('anthropic-opus-hires-10x16', 'anthropic', 'claude-opus-4-8', 192, 1928, { aa: true, cellWBonus: 5, cellHBonus: 8 }, 'Opus knee (10×16) on the large page — does Opus become a viable target?', 'highres'),
  cfg('anthropic-opus-std-5x8-aa', 'anthropic', 'claude-opus-4-8', 312, 728, { aa: true }, 'Opus baseline on the production config — reproduces the measured read tax', 'highres'),
  // — OpenAI (gpt-5.5 flagship patch, detail original): 768×2048 strip + the
  //   two A/Bs that matter — atlas (replicates the Fable finding) and the
  //   text control (baseline + completion-token inflation, H7) —
  cfg('openai-5.5-strip-5x8-aa', 'openai', 'gpt-5.5', 152, 2048, { aa: true }, 'strip 768×2048 do path GPT (flagship patch)'),
  cfg('openai-5.5-strip-5x8-1bit', 'openai', 'gpt-5.5', 152, 2048, { aa: false }, 'atlas 1-bit no GPT — o flip que venceu no Fable'),
  {
    ...cfg('openai-5.5-text-control', 'openai', 'gpt-5.5', 152, 2048, {}, 'controle: mesmo corpus como TEXTO puro — mede inflação de completion'),
    textControl: true,
  },
  // — Gemini 2.5 (account without Gemini 3): landscape page 1533×1152 → shorter
  //   side 1152 = exact 768 crop unit (native tiles, zero glyph resampling),
  //   2×2 tiles = 1032 tok → 42.3 chars/token, the best documented ratio.
  //   Straight 1-bit (winner on Fable). Geometry: src/core/gemini-model-profiles.ts.
  cfg('gemini-tile-1533x1152', 'gemini', 'gemini-2.5-flash', 305, 1152, { aa: false }, 'tile-native page: 43,615 chars at 1,032 tok (42.3 chars/token)'),
  {
    ...cfg('gemini-medium-1148', 'gemini', 'gemini-2.5-flash', 228, 1152, { aa: false }, 'media_resolution:MEDIUM on 2.5 = fixed 256 tok → ~127 chars/token IF readable (uncharted territory)'),
    geminiMediaResolution: 'medium',
  },
  {
    ...cfg('gemini-text-control', 'gemini', 'gemini-2.5-flash', 305, 1152, {}, 'controle: corpus como TEXTO puro — baseline + inflação de output'),
    textControl: true,
  },
];

export interface ConfigCost {
  images: number;
  imageTokens: number;
  charsPerToken: number;
  dims: Array<{ width: number; height: number }>;
  pngs: Uint8Array[];
}

/** Render the corpus under the config and price it exactly, offline. */
export async function configCost(config: FrontierConfig, pageText: string): Promise<ConfigCost> {
  const imgs = await renderTextToPngsWithCharLimit(
    pageText,
    config.page.cols,
    config.page.charsPerImage,
    config.style,
    config.page.maxHeightPx,
  );
  let imageTokens = 0;
  for (const img of imgs) {
    if (config.provider === 'anthropic') {
      imageTokens +=
        anthropicImageTokens(img.width, img.height, config.tier ?? 'standard') +
        ANTHROPIC_IMAGE_BLOCK_OVERHEAD_TOKENS;
    } else if (config.provider === 'openai') {
      imageTokens += openAIVisionTokens(config.model, img.width, img.height);
    } else {
      imageTokens += config.geminiMediaResolution !== undefined
        ? geminiMediaResolutionTokens(config.geminiMediaResolution, resolveGeminiGeneration(config.model))
        : geminiImageTokens(img.width, img.height);
    }
  }
  return {
    images: imgs.length,
    imageTokens,
    charsPerToken: pageText.length / Math.max(1, imageTokens),
    dims: imgs.map((i) => ({ width: i.width, height: i.height })),
    pngs: imgs.map((i) => i.png),
  };
}
