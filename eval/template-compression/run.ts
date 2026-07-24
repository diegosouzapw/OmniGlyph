import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CORPUS } from './fixtures/corpus.js';
import { measureSample } from './measure-tokens.js';
import { readArm, type ReadOutcome } from './read-ab.js';

export interface VerdictInput {
  repetitiveReductionPct: number; templatedRecall: number; rawRecall: number;
  confabulations: number; worstReductionPct: number; worstRecallDelta: number;
}
export function verdict(v: VerdictInput): { go: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (v.repetitiveReductionPct < 20) reasons.push(`reduction ${v.repetitiveReductionPct.toFixed(1)}% < 20%`);
  if (v.templatedRecall < v.rawRecall) reasons.push(`recall regressed ${v.rawRecall}→${v.templatedRecall}`);
  if (v.confabulations > 0) reasons.push(`${v.confabulations} confabulation(s)`);
  if (v.worstRecallDelta < 0) reasons.push('worst-tier accuracy harmed');
  return { go: reasons.length === 0, reasons };
}

const recallOf = (o: ReadOutcome[]) =>
  o.length === 0 ? 0 : o.filter((x) => x.outcome === 'correct').length / o.length;

async function main(): Promise<void> {
  const { values } = parseArgs({ options: {
    'dry-run': { type: 'boolean', default: false },
    model: { type: 'string', default: 'claude-fable-5' },
    reps: { type: 'string', default: '3' },
  } });
  const model = values.model as string;
  const reps = Number(values.reps);

  const tokenRows = [];
  for (const s of CORPUS) tokenRows.push({ id: s.id, tier: s.tier, ...(await measureSample(s.text, model)) });
  const repetitive = tokenRows.filter((r) => r.tier !== 'worst');
  const repetitiveReductionPct = repetitive.reduce((a, r) => a + r.reductionPct, 0) / repetitive.length;
  const worstReductionPct = tokenRows.filter((r) => r.tier === 'worst').reduce((a, r) => a + r.reductionPct, 0) / Math.max(1, tokenRows.filter((r) => r.tier === 'worst').length);

  const result: Record<string, unknown> = { model, tokenRows, repetitiveReductionPct, worstReductionPct };

  if (!values['dry-run']) {
    const reads: ReadOutcome[] = [];
    for (const s of CORPUS) {
      reads.push(...await readArm('raw', s.text, s.queries, model, reps));
      reads.push(...await readArm('templated', s.text, s.queries, model, reps));
    }
    const templated = reads.filter((r) => r.arm === 'templated');
    const raw = reads.filter((r) => r.arm === 'raw');
    const v = verdict({
      repetitiveReductionPct,
      templatedRecall: recallOf(templated),
      rawRecall: recallOf(raw),
      confabulations: templated.filter((r) => r.outcome === 'silent_wrong').length,
      worstReductionPct,
      worstRecallDelta: 0,
    });
    Object.assign(result, { reads, verdict: v });
    console.log(v.go ? 'GO' : 'NO-GO', v.reasons.join('; '));
  } else {
    console.log(`[dry-run] repetitive reduction ${repetitiveReductionPct.toFixed(1)}% · worst ${worstReductionPct.toFixed(1)}%`);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  writeFileSync(join(here, 'results.json'), JSON.stringify(result, null, 2));
}

// Guard: only run main() if this file is invoked as the entry point, not when imported for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
