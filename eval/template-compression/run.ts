import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CORPUS, type Sample } from './fixtures/corpus.js';
import { measureSample } from './measure-tokens.js';
import { readArm, type ReadOutcome } from './read-ab.js';

type TaggedReadOutcome = ReadOutcome & { tier: Sample['tier'] };

export interface VerdictInput {
  repetitiveReductionPct: number; templatedRecall: number; rawRecall: number;
  confabulations: number; worstReductionPct: number; worstRecallDelta: number;
  totalReads: number;
}
export function verdict(v: VerdictInput): { go: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (v.repetitiveReductionPct < 20) reasons.push(`reduction ${v.repetitiveReductionPct.toFixed(1)}% < 20%`);
  if (v.templatedRecall < v.rawRecall) reasons.push(`recall regressed ${v.rawRecall}→${v.templatedRecall}`);
  if (v.confabulations > 0) reasons.push(`${v.confabulations} confabulation(s)`);
  if (v.worstRecallDelta < 0) reasons.push('worst-tier accuracy harmed');
  if (v.worstReductionPct < -1) reasons.push('worst-tier tokens bloated');
  if (v.totalReads === 0) reasons.push('no reads occurred — reading safety unverified');
  if (v.rawRecall < 0.5) reasons.push(`raw-arm recall ${v.rawRecall.toFixed(2)} < 0.5 — setup/model unreliable, cannot certify`);
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
  // Math.max(1, ...) guards against a malformed --reps (e.g. "0", "abc", "-2")
  // silently producing zero reads per arm — verdict()'s totalReads gate exists
  // specifically to catch that case, so main() must not manufacture it.
  const reps = Math.max(1, Math.floor(Number(values.reps)) || 1);

  const tokenRows = [];
  for (const s of CORPUS) tokenRows.push({ id: s.id, tier: s.tier, ...(await measureSample(s.text, model)) });
  const repetitive = tokenRows.filter((r) => r.tier !== 'worst');
  const repetitiveReductionPct = repetitive.reduce((a, r) => a + r.reductionPct, 0) / repetitive.length;
  const worstReductionPct = tokenRows.filter((r) => r.tier === 'worst').reduce((a, r) => a + r.reductionPct, 0) / Math.max(1, tokenRows.filter((r) => r.tier === 'worst').length);

  const result: Record<string, unknown> = { model, tokenRows, repetitiveReductionPct, worstReductionPct };

  if (!values['dry-run']) {
    // Tag each outcome with its sample's tier so the worst-tier recall delta
    // (the actual harm signal verdict() gates on) can be isolated from the
    // repetitive-tier reads that dominate the pooled recall numbers.
    const reads: TaggedReadOutcome[] = [];
    for (const s of CORPUS) {
      for (const r of await readArm('raw', s.text, s.queries, model, reps)) reads.push({ ...r, tier: s.tier });
      for (const r of await readArm('templated', s.text, s.queries, model, reps)) reads.push({ ...r, tier: s.tier });
    }
    const templated = reads.filter((r) => r.arm === 'templated');
    const raw = reads.filter((r) => r.arm === 'raw');
    const worstRawRecall = recallOf(raw.filter((r) => r.tier === 'worst'));
    const worstTemplatedRecall = recallOf(templated.filter((r) => r.tier === 'worst'));
    const v = verdict({
      repetitiveReductionPct,
      templatedRecall: recallOf(templated),
      rawRecall: recallOf(raw),
      confabulations: templated.filter((r) => r.outcome === 'silent_wrong').length,
      worstReductionPct,
      worstRecallDelta: worstTemplatedRecall - worstRawRecall,
      totalReads: reads.length,
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
