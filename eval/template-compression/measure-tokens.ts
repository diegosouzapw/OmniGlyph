import { renderTextToImages } from '../../dist/core/library.js';
import { visionTokensForModel } from '../../dist/core/openai.js';
import { templatize } from './templatize.js';

export interface ArmCost { imageTokens: number; pages: number }

async function costOf(text: string, model: string): Promise<ArmCost> {
  const { pages } = await renderTextToImages(text, { reflow: true });
  let imageTokens = 0;
  for (const p of pages) imageTokens += visionTokensForModel(model, p.width, p.height);
  return { imageTokens, pages: pages.length };
}

export async function measureSample(
  text: string,
  model: string,
): Promise<{ raw: ArmCost; templated: ArmCost; reductionPct: number }> {
  const raw = await costOf(text, model);
  const templated = await costOf(templatize(text).text, model);
  const reductionPct = raw.imageTokens === 0 ? 0
    : ((raw.imageTokens - templated.imageTokens) / raw.imageTokens) * 100;
  return { raw, templated, reductionPct };
}
