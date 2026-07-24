# Template-Compression Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `$0`-capable, product-isolated harness that answers one go/no-go: does templatizing repetitive tool outputs before render cut tokens ≥20% without regressing exact-value reading accuracy?

**Architecture:** A standalone spike under `eval/template-compression/` (mirrors `eval/grok-density`). A pure `templatize()` turns contiguous runs of same-shape lines into a `Template:`/`Rows:` block. The harness renders both the raw and templated text, measures image tokens on each arm (billing math, `$0`), then runs a paired A/B where the model reads each arm and answers exact-value queries — reusing the density-frontier `claude -p` read transport and `scoreAnswer` (which already flags `silent_wrong` = confabulation).

**Tech Stack:** TypeScript (ESM, `.js` import suffixes), `tsx` runner, vitest, the project's `renderTextToImages` / `visionTokensForModel` from `dist/core`, and `benchmarks/density-frontier/score.ts`.

## Global Constraints

- **Product-isolated:** nothing under `src/core/` changes; the harness only imports from it. No env flag, no transform wiring.
- **`$0` default:** `--dry-run` (token side only) runs with no model. Full reads go through `claude -p` (`--via-cli`, subscription), never a paid API key.
- **Fail-closed measurement:** a failed/empty read is NEVER scored correct; a wrong-but-confident answer is `silent_wrong` (a hard fail of the confab criterion).
- **Losslessness invariant:** `reconstruct(templatize(x).mapping) === x` for every input — asserted, not assumed.
- **Results are receipts:** `eval/template-compression/results.json` is git-ignored (like `eval/grok-density/results.json`); never hand-edited.
- **TypeScript strict, ESM only**; import from built `dist/core/*.js` in the runner (matches `eval/grok-density`), import `.js`-suffixed TS in vitest tests.
- **Brand:** OmniGlyph only in any tracked file; no upstream names/URLs (rebrand guard). Attribution rides in commit trailers.
- **Go/no-go bar (verbatim from spec):** ≥20% additional token reduction on repetitive tiers **and** templated recall ≥ raw recall **and** zero silent confabulations in the templated arm **and** no token/accuracy harm on the worst-case tier.

---

### Task 1: `templatize()` + `reconstruct()` — the pure core

**Files:**
- Create: `eval/template-compression/templatize.ts`
- Test: `tests/template-compression.test.ts`

**Interfaces:**
- Produces:
  - `SENTINEL = ''`, `MIN_RUN = 3`
  - `skeletonize(line: string): { skeleton: string; values: string[] }` — replaces each `/[0-9]+/g` run with `SENTINEL`, collecting the matched values in order.
  - `type Segment = { kind: 'raw'; lines: string[] } | { kind: 'group'; skeleton: string; rows: string[][] }`
  - `type TemplateMapping = { segments: Segment[] }`
  - `templatize(text: string): { text: string; mapping: TemplateMapping }`
  - `reconstruct(mapping: TemplateMapping): string`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/template-compression.test.ts
import { describe, expect, it } from 'vitest';
import { templatize, reconstruct, skeletonize } from '../eval/template-compression/templatize.js';

describe('templatize', () => {
  it('skeletonizes digit runs and captures values in order', () => {
    expect(skeletonize('worker-7 request 4832 failed after 30 sec')).toEqual({
      skeleton: 'worker- request  failed after  sec',
      values: ['7', '4832', '30'],
    });
  });

  it('collapses a contiguous run of same-shape lines into a Template/Rows block', () => {
    const raw = [
      'worker-7 request 4832 failed after 30 sec',
      'worker-7 request 4833 failed after 60 sec',
      'worker-8 request 4834 failed after 60 sec',
    ].join('\n');
    const { text } = templatize(raw);
    expect(text).toBe(
      'Template: worker-{} request {} failed after {} sec\nRows:\n7,4832,30\n7,4833,60\n8,4834,60',
    );
  });

  it('is lossless: reconstruct(templatize(x)) === x', () => {
    const raw = [
      'worker-7 request 4832 failed after 30 sec',
      'worker-7 request 4833 failed after 60 sec',
      'worker-8 request 4834 failed after 60 sec',
    ].join('\n');
    expect(reconstruct(templatize(raw).mapping)).toBe(raw);
  });

  it('leaves non-repetitive text untouched (run shorter than MIN_RUN)', () => {
    const raw = 'hello world\njust one 42 number\nthe end';
    const { text, mapping } = templatize(raw);
    expect(text).toBe(raw);
    expect(mapping.segments).toEqual([{ kind: 'raw', lines: raw.split('\n') }]);
    expect(reconstruct(mapping)).toBe(raw);
  });

  it('only groups lines that actually vary (skeleton must contain a variable)', () => {
    const raw = 'same line\nsame line\nsame line';
    // identical lines have no digit variable -> not a template win, passthrough
    expect(templatize(raw).text).toBe(raw);
  });

  it('round-trips mixed raw + grouped + raw with values at line edges', () => {
    const raw = [
      'header',
      '10 apples',
      '20 apples',
      '30 apples',
      'footer 9',
    ].join('\n');
    expect(reconstruct(templatize(raw).mapping)).toBe(raw);
    expect(templatize(raw).text).toContain('Template: {} apples');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/template-compression.test.ts`
Expected: FAIL — `Cannot find module '../eval/template-compression/templatize.js'`.

- [ ] **Step 3: Write the minimal implementation**

```typescript
// eval/template-compression/templatize.ts
// Naive, LOSSLESS log-templatizer for the measurement spike: it folds a
// contiguous run of >=MIN_RUN lines that share a digit-skeleton into one
// `Template:`/`Rows:` block. Variables are digit runs only (YAGNI: no word
// alignment, no entropy heuristics). Losslessness is the invariant the harness
// asserts — skeleton + row values reconstruct each original line exactly, and
// blocks stay in original position (contiguous runs only, so nothing reorders).

export const SENTINEL = '';
export const MIN_RUN = 3;

export interface SkeletonResult {
  skeleton: string;
  values: string[];
}

export function skeletonize(line: string): SkeletonResult {
  const values: string[] = [];
  const skeleton = line.replace(/[0-9]+/g, (m) => {
    values.push(m);
    return SENTINEL;
  });
  return { skeleton, values };
}

export type Segment =
  | { kind: 'raw'; lines: string[] }
  | { kind: 'group'; skeleton: string; rows: string[][] };

export interface TemplateMapping {
  segments: Segment[];
}

function skeletonToTemplate(skeleton: string): string {
  return skeleton.split(SENTINEL).join('{}');
}

export function templatize(text: string): { text: string; mapping: TemplateMapping } {
  const lines = text.split('\n');
  const segments: Segment[] = [];
  let i = 0;
  while (i < lines.length) {
    const { skeleton, values } = skeletonize(lines[i]!);
    // A run is templatable only if the skeleton actually has a variable slot.
    if (values.length > 0) {
      let j = i + 1;
      const rows: string[][] = [values];
      while (j < lines.length) {
        const next = skeletonize(lines[j]!);
        if (next.skeleton !== skeleton || next.values.length === 0) break;
        rows.push(next.values);
        j++;
      }
      if (rows.length >= MIN_RUN) {
        segments.push({ kind: 'group', skeleton, rows });
        i = j;
        continue;
      }
    }
    // Not a run: accumulate into the current raw segment.
    const last = segments[segments.length - 1];
    if (last && last.kind === 'raw') last.lines.push(lines[i]!);
    else segments.push({ kind: 'raw', lines: [lines[i]!] });
    i++;
  }

  const rendered = segments
    .map((seg) => {
      if (seg.kind === 'raw') return seg.lines.join('\n');
      const header = `Template: ${skeletonToTemplate(seg.skeleton)}`;
      const rows = seg.rows.map((r) => r.join(',')).join('\n');
      return `${header}\nRows:\n${rows}`;
    })
    .join('\n');

  return { text: rendered, mapping: { segments } };
}

export function reconstruct(mapping: TemplateMapping): string {
  const out: string[] = [];
  for (const seg of mapping.segments) {
    if (seg.kind === 'raw') {
      out.push(seg.lines.join('\n'));
      continue;
    }
    const parts = seg.skeleton.split(SENTINEL);
    for (const row of seg.rows) {
      let line = parts[0]!;
      for (let k = 0; k < row.length; k++) line += row[k]! + parts[k + 1]!;
      out.push(line);
    }
  }
  return out.join('\n');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/template-compression.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add tests/template-compression.test.ts eval/template-compression/templatize.ts
git commit -m "feat(eval): lossless digit-skeleton templatizer for the compression spike"
```

---

### Task 2: `fixtures/corpus.ts` — the three-tier corpus

**Files:**
- Create: `eval/template-compression/fixtures/corpus.ts`
- Test: `tests/template-compression-corpus.test.ts`

**Interfaces:**
- Consumes: `templatize`, `reconstruct` (Task 1).
- Produces:
  - `interface Query { id: string; q: string; exact: string }`
  - `interface Sample { id: string; tier: 'best' | 'typical' | 'worst'; text: string; queries: Query[] }`
  - `export const CORPUS: Sample[]`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/template-compression-corpus.test.ts
import { describe, expect, it } from 'vitest';
import { CORPUS } from '../eval/template-compression/fixtures/corpus.js';
import { templatize, reconstruct } from '../eval/template-compression/templatize.js';

describe('template-compression corpus', () => {
  it('covers all three tiers', () => {
    const tiers = new Set(CORPUS.map((s) => s.tier));
    expect(tiers).toEqual(new Set(['best', 'typical', 'worst']));
  });

  it('every sample is losslessly templatizable', () => {
    for (const s of CORPUS) {
      expect(reconstruct(templatize(s.text).mapping), s.id).toBe(s.text);
    }
  });

  it("every query's exact answer literally appears in its sample text", () => {
    for (const s of CORPUS) {
      for (const query of s.queries) {
        expect(s.text.includes(query.exact), `${s.id}/${query.id}`).toBe(true);
      }
    }
  });

  it('worst-tier samples gain little from templating (<5% line-collapse)', () => {
    for (const s of CORPUS.filter((x) => x.tier === 'worst')) {
      const before = s.text.split('\n').length;
      const after = templatize(s.text).text.split('\n').length;
      expect(after / before, s.id).toBeGreaterThan(0.95);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/template-compression-corpus.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the corpus**

Write `eval/template-compression/fixtures/corpus.ts` exporting `CORPUS` with at least two samples per tier. Each `text` is a realistic tool-output blob; each `queries` entry asks for an exact value that appears verbatim in `text`. No secrets. Concrete seed content:

```typescript
// eval/template-compression/fixtures/corpus.ts
export interface Query { id: string; q: string; exact: string }
export interface Sample {
  id: string;
  tier: 'best' | 'typical' | 'worst';
  text: string;
  queries: Query[];
}

const workerLog = Array.from({ length: 40 }, (_, k) =>
  `worker-${(k % 8) + 1} request ${4800 + k} failed after ${30 * ((k % 3) + 1)} sec`,
).join('\n');

const gitLog = Array.from({ length: 24 }, (_, k) =>
  `commit ${1000 + k} by dev${(k % 4) + 1} at 2026-07-${String((k % 28) + 1).padStart(2, '0')} +0300`,
).join('\n');

export const CORPUS: Sample[] = [
  {
    id: 'best-worker-log',
    tier: 'best',
    text: workerLog,
    queries: [
      // NUMERIC answers only: a compound token like "worker-3" renders as bare
      // "3" under the "worker-{}" template, so the model may answer "3" and be
      // wrongly scored against "worker-3" — biasing the A/B against the templated
      // arm. Ask for pure field values that read identically in both arms.
      // req 4833 → k=33 → 30*((33%3)+1)=30 ; req 4810 → k=10 → 30*((10%3)+1)=60.
      { id: 'q-dur-4833', q: 'How many seconds did request 4833 take before it failed?', exact: '30' },
      { id: 'q-dur-4810', q: 'How many seconds did request 4810 take before it failed?', exact: '60' },
    ],
  },
  {
    id: 'best-test-runner',
    tier: 'best',
    text: Array.from({ length: 30 }, (_, k) =>
      `test_case_${k} ... ok (${5 + (k % 9)} ms)`,
    ).join('\n'),
    queries: [
      { id: 'q-ms-7', q: 'How many ms did test_case_7 take?', exact: '12' },
    ],
  },
  {
    id: 'typical-git-log',
    tier: 'typical',
    text: gitLog,
    queries: [
      // numeric (see the fairness note above). commit 1005 → k=5 → day (5%28)+1=6.
      { id: 'q-commit-1005-day', q: 'On which 2-digit day of July was commit 1005 recorded?', exact: '06' },
    ],
  },
  {
    id: 'typical-ls',
    tier: 'typical',
    text: [
      'total 48',
      ...Array.from({ length: 12 }, (_, k) =>
        `-rw-r--r-- 1 user user ${100 + k * 7} Jul ${10 + k} file_${k}.ts`,
      ),
    ].join('\n'),
    queries: [
      { id: 'q-size-file5', q: 'What is the byte size of file_5.ts?', exact: '135' },
    ],
  },
  {
    id: 'worst-prose',
    tier: 'worst',
    text: [
      'The migration completed in three phases over the weekend.',
      'First we drained the queue, then swapped the primary, then re-enabled writes.',
      'No incident was declared and the on-call engineer signed off at midnight.',
    ].join('\n'),
    queries: [
      { id: 'q-phases', q: 'How many phases did the migration take (as the word used)?', exact: 'three' },
    ],
  },
  {
    id: 'worst-mixed-code',
    tier: 'worst',
    text: [
      'export function add(a: number, b: number): number {',
      '  return a + b;',
      '}',
      'const total = add(2, 40);',
    ].join('\n'),
    queries: [
      { id: 'q-arg', q: 'What is the second argument passed to add()?', exact: '40' },
    ],
  },
];
```

The queried values above are already reconciled with the generators (worked out
in the comments). The corpus test asserts every `exact` appears verbatim — if you
add samples, keep answers numeric and recompute, never weaken the test.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/template-compression-corpus.test.ts`
Expected: PASS. If the "exact appears" test fails, correct the query's `exact` to the value the generator actually produced (do not weaken the test).

- [ ] **Step 5: Commit**

```bash
git add tests/template-compression-corpus.test.ts eval/template-compression/fixtures/corpus.ts
git commit -m "test(eval): three-tier corpus with exact-value queries for the compression spike"
```

---

### Task 3: `measure-tokens.ts` — token reduction, both arms, `$0`

**Files:**
- Create: `eval/template-compression/measure-tokens.ts`
- Test: `tests/template-compression-tokens.test.ts`

**Interfaces:**
- Consumes: `templatize` (Task 1); `renderTextToImages` from `dist/core/library.js` (`(text, opts) => Promise<{ pages: {png,width,height}[]; pixels: number }>`); `visionTokensForModel` from `dist/core/openai.js`.
- Produces:
  - `interface ArmCost { imageTokens: number; pages: number }`
  - `async function measureSample(text: string, model: string): Promise<{ raw: ArmCost; templated: ArmCost; reductionPct: number }>`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/template-compression-tokens.test.ts
import { describe, expect, it } from 'vitest';
import { measureSample } from '../eval/template-compression/measure-tokens.js';
import { CORPUS } from '../eval/template-compression/fixtures/corpus.js';

describe('measure-tokens', () => {
  it('reports a positive reduction on a best-tier sample', async () => {
    const best = CORPUS.find((s) => s.id === 'best-worker-log')!;
    const r = await measureSample(best.text, 'claude-fable-5');
    expect(r.templated.imageTokens).toBeLessThan(r.raw.imageTokens);
    expect(r.reductionPct).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test — verify it fails** (`npx vitest run tests/template-compression-tokens.test.ts`, module not found). Requires `pnpm run build` first so `dist/core/*.js` exists.

- [ ] **Step 3: Implement**

```typescript
// eval/template-compression/measure-tokens.ts
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
```

Signature is confirmed: `visionTokensForModel(model: string, w: number, h: number): number` (`src/core/openai.ts:132`), so `visionTokensForModel(model, p.width, p.height)` is exact.

- [ ] **Step 4: Run test — verify it passes** (`pnpm run build && npx vitest run tests/template-compression-tokens.test.ts`, PASS).

- [ ] **Step 5: Commit**

```bash
git add tests/template-compression-tokens.test.ts eval/template-compression/measure-tokens.ts
git commit -m "feat(eval): token-reduction measurement (both arms, \$0) for the compression spike"
```

---

### Task 4: `read-ab.ts` — paired exact-recall A/B (reuses the CLI transport + scorer)

**Files:**
- Create: `eval/template-compression/read-ab.ts`
- Modify: `benchmarks/density-frontier/score.ts` — no change if `scoreAnswer` is already exported; otherwise export it (it is, per its `export function scoreAnswer`).

**Interfaces:**
- Consumes: `renderTextToImages`, `scoreAnswer` from `../../benchmarks/density-frontier/score.js`, `templatize`, corpus `Query`.
- Produces:
  - `type Arm = 'raw' | 'templated'`
  - `interface ReadOutcome { arm: Arm; queryId: string; rep: number; answer: string; outcome: 'correct' | 'abstained' | 'no_answer' | 'silent_wrong' }`
  - `async function readArm(arm: Arm, text: string, queries: Query[], model: string, reps: number): Promise<ReadOutcome[]>`

- [ ] **Step 1: Write the failing test** (transport is stubbed so the test stays `$0` and offline)

```typescript
// tests/template-compression-read.test.ts
import { describe, expect, it, vi } from 'vitest';
import * as readMod from '../eval/template-compression/read-ab.js';

describe('read-ab scoring', () => {
  it('classifies a correct exact answer and a confabulated one', async () => {
    // askImages is the only impure seam; stub it.
    vi.spyOn(readMod, 'askImages').mockImplementation(async (_pngs, q) =>
      q.id === 'ok' ? '60' : '999',
    );
    const queries = [
      { id: 'ok', q: 'x', exact: '60' },
      { id: 'bad', q: 'y', exact: '60' },
    ];
    const out = await readMod.readArm('templated', '10\n20\n30', queries, 'claude-fable-5', 1);
    expect(out.find((o) => o.queryId === 'ok')!.outcome).toBe('correct');
    expect(out.find((o) => o.queryId === 'bad')!.outcome).toBe('silent_wrong');
  });
});
```

- [ ] **Step 2: Run test — verify it fails** (module not found).

- [ ] **Step 3: Implement** — mirror the density-frontier `claude -p` reader (write PNG pages to a temp dir, `spawnSync('claude', ['-p', prompt, '--model', model, '--allowedTools', 'Read', '--disallowedTools', 'Bash'])`, read stdout), and score with the shared `scoreAnswer`.

```typescript
// eval/template-compression/read-ab.ts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderTextToImages } from '../../dist/core/library.js';
import { scoreAnswer } from '../../benchmarks/density-frontier/score.js';
import { templatize } from './templatize.js';
import type { Query } from './fixtures/corpus.js';

export type Arm = 'raw' | 'templated';
export interface ReadOutcome {
  arm: Arm; queryId: string; rep: number; answer: string;
  outcome: 'correct' | 'abstained' | 'no_answer' | 'silent_wrong';
}

/** The one impure seam — a `claude -p` call over the rendered pages. Exported so
 *  the test can stub it and stay $0/offline. Returns the model's answer text. */
export async function askImages(pngs: Uint8Array[], q: Query, model: string): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'tc-read-'));
  const paths = pngs.map((png, k) => {
    const p = join(dir, `page-${k}.png`);
    writeFileSync(p, png);
    return p;
  });
  const prompt =
    `Read the attached page image(s): ${paths.join(', ')}. ` +
    `Answer ONLY with the exact value, no prose. If you cannot read it, answer exactly ILEGIVEL. ` +
    `Question: ${q.q}`;
  const res = spawnSync('claude', ['-p', prompt, '--model', model, '--allowedTools', 'Read', '--disallowedTools', 'Bash'], {
    encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  if (res.status !== 0 || !res.stdout) return '[API_ERROR]';
  return res.stdout.trim();
}

export async function readArm(
  arm: Arm, text: string, queries: Query[], model: string, reps: number,
): Promise<ReadOutcome[]> {
  const source = arm === 'templated' ? templatize(text).text : text;
  const { pages } = await renderTextToImages(source, { reflow: true });
  const pngs = pages.map((p) => p.png);
  const out: ReadOutcome[] = [];
  for (const q of queries) {
    for (let rep = 0; rep < reps; rep++) {
      const answer = await askImages(pngs, q, model);
      const { outcome } = scoreAnswer({ expected: q.exact, distractors: [] }, answer);
      out.push({ arm, queryId: q.id, rep, answer, outcome });
    }
  }
  return out;
}
```

Signature is confirmed: `scoreAnswer(question: Pick<Question, 'expected' | 'distractors'>, answer: string): Score` compares `normalize(answer) === question.expected` where `expected` is a string (`benchmarks/density-frontier/score.ts:44`), so `scoreAnswer({ expected: q.exact, distractors: [] }, answer)` is exact. Keep `q.exact` in its already-normalized form (no wrapping quotes/whitespace).

- [ ] **Step 4: Run test — verify it passes** (`npx vitest run tests/template-compression-read.test.ts`, PASS — the transport is stubbed).

- [ ] **Step 5: Commit**

```bash
git add tests/template-compression-read.test.ts eval/template-compression/read-ab.ts
git commit -m "feat(eval): paired exact-recall A/B reader reusing the CLI transport + scorer"
```

---

### Task 5: `run.ts` — orchestrate, verdict, `results.json`

**Files:**
- Create: `eval/template-compression/run.ts`
- Create: `eval/template-compression/README.md`
- Modify: `.gitignore` — add `eval/template-compression/results.json`

**Interfaces:**
- Consumes: `CORPUS`, `measureSample` (Task 3), `readArm` (Task 4).
- Produces: a CLI: `tsx eval/template-compression/run.ts [--dry-run] [--model <id>] [--reps <n>]`.

- [ ] **Step 1: Write the failing test** (verdict logic is pure and testable without a model)

```typescript
// tests/template-compression-verdict.test.ts
import { describe, expect, it } from 'vitest';
import { verdict } from '../eval/template-compression/run.js';

describe('go/no-go verdict', () => {
  it('is GO only when all four criteria hold', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.9, rawRecall: 0.9, confabulations: 0, worstReductionPct: 1, worstRecallDelta: 0 }).go).toBe(true);
  });
  it('is NO-GO on any confabulation', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.9, rawRecall: 0.9, confabulations: 1, worstReductionPct: 1, worstRecallDelta: 0 }).go).toBe(false);
  });
  it('is NO-GO when reduction is under 20%', () => {
    expect(verdict({ repetitiveReductionPct: 12, templatedRecall: 0.9, rawRecall: 0.9, confabulations: 0, worstReductionPct: 1, worstRecallDelta: 0 }).go).toBe(false);
  });
  it('is NO-GO when templated recall regresses below raw', () => {
    expect(verdict({ repetitiveReductionPct: 25, templatedRecall: 0.7, rawRecall: 0.9, confabulations: 0, worstReductionPct: 1, worstRecallDelta: 0 }).go).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — verify it fails** (module not found).

- [ ] **Step 3: Implement** the runner with an exported pure `verdict()` plus the orchestration `main()`.

```typescript
// eval/template-compression/run.ts
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

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run tests + a live `$0` dry-run**

Run: `npx vitest run tests/template-compression-verdict.test.ts` → PASS.
Run: `pnpm run build && pnpm exec tsx eval/template-compression/run.ts --dry-run` → prints a reduction line, writes `results.json`, `$0`.

- [ ] **Step 5: Write `README.md`** (how to run dry vs live, what GO/NO-GO means, that `results.json` is git-ignored) and **`.gitignore`** the results.

```bash
printf '\n# template-compression spike receipts (regenerate via run.ts)\neval/template-compression/results.json\n' >> .gitignore
```

- [ ] **Step 6: Commit**

```bash
git add tests/template-compression-verdict.test.ts eval/template-compression/run.ts eval/template-compression/README.md .gitignore
git commit -m "feat(eval): orchestrator + go/no-go verdict for the template-compression spike"
```

---

### Task 6: Full-suite validation + spike run

- [ ] **Step 0 (secret-guard over fixtures):** confirm no credential-shaped string rides in the corpus. Run the existing detector over the fixtures:

```bash
pnpm exec tsx -e "import {detectSecrets} from './src/core/factsheet.js'; import {CORPUS} from './eval/template-compression/fixtures/corpus.js'; for (const s of CORPUS){const hits=detectSecrets(s.text); if(hits && hits.length){console.error('SECRET in',s.id,hits); process.exit(1);}} console.log('corpus secret-clean');"
```

Confirm the exported detector name in `src/core/factsheet.ts` (secret-guard landed via the `feat(secret-guard)` commit); if it differs, use that symbol. Expected: `corpus secret-clean`.

- [ ] **Step 1:** `pnpm run lint && pnpm run typecheck && pnpm test && pnpm run build` — all green (the new tests are `$0`/offline; the transport is stubbed in tests).
- [ ] **Step 2:** `pnpm exec tsx eval/template-compression/run.ts --dry-run` — capture the token-reduction number (the `$0` half of the receipt).
- [ ] **Step 3 (live, optional, `$0` via subscription):** `pnpm exec tsx eval/template-compression/run.ts` — produces the GO/NO-GO with reads. Requires the `claude` CLI on PATH.
- [ ] **Step 4:** Open the PR (never self-merge unless the user directs it). Body = the dry-run reduction number + the verdict if a live run was done. Attribution trailer: `Reported-by: u66u (…issues/121)` on the feature commit, `(thanks @u66u)` in the CHANGELOG **only if Phase 2 ships** — the spike itself is not a shipped feature.
