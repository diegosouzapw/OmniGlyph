/**
 * Phase 5 of the dashboard redesign: a functional Benchmarks page.
 *
 *   - parseBenchResults() / BenchRunner live in src/dashboard/bench.ts, kept
 *     out of dashboard.ts (already 1600+ lines) per the phase brief.
 *   - renderBenchFragment() lives in src/dashboard/fragments.ts alongside
 *     every other render*Fragment.
 *   - DashboardState wires both together: GET /fragments/bench reads the
 *     real on-disk benchmarks/{billing-sweep,density-frontier}/results/
 *     (short TTL cache) + the runner's live state; POST /api/bench/run and
 *     /api/bench/cancel drive
 *     the runner; stdout/exit are pushed onto the existing /events/stream
 *     SSE broadcast as `{bench:{...}}` frames (see tests/sse-stream.test.ts
 *     for the frame-reading pattern reused below).
 *
 * Fixtures under tests/fixtures/bench-*.jsonl are REAL lines copied from
 * benchmarks/{billing-sweep,density-frontier}/results/*.jsonl — never
 * fabricated shapes. See the file headers for the exact source runs.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { DashboardState, dashboardPath } from '../src/dashboard.js';
import {
  parseBenchResults,
  harnessScriptsExist,
  BenchRunner,
  type BenchCommand,
  type BenchHarness,
  type BenchMode,
} from '../src/dashboard/bench.js';
import { renderBenchFragment } from '../src/dashboard/fragments.js';
import type { SessionsPaths } from '../src/sessions.js';

const FIXTURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
);
const BILLING_FIXTURE = fs.readFileSync(
  path.join(FIXTURES_DIR, 'bench-billing-sweep.jsonl'),
  'utf8',
);
const DENSITY_FIXTURE = fs.readFileSync(
  path.join(FIXTURES_DIR, 'bench-density-frontier.jsonl'),
  'utf8',
);

// ---- parser -----------------------------------------------------------------

describe('parseBenchResults(..., "billing-sweep")', () => {
  it('aggregates real probe rows: counts, residual max/total, per-model split', () => {
    const agg = parseBenchResults(BILLING_FIXTURE, 'billing-sweep');
    // Fixture: 3 claude-fable-5 rows (measured 1524/1299/1459 vs pred.patch.standard
    // 1521/1296/1456 → residuals 3/3/3) + 2 claude-sonnet-4-5 rows (1525/1300 vs
    // 1521/1296 → residuals 4/4). Matches docs/benchmarks/BENCHMARKS.md's measured
    // "+3/block (Fable 5) / +4/block (Sonnet 4.5)" verdict.
    expect(agg.totalProbes).toBe(5);
    expect(agg.measuredProbes).toBe(5);
    expect(agg.residualMax).toBe(4);
    expect(agg.residualTotal).toBe(17);
    expect(agg.models).toHaveLength(2);
    const fable = agg.models.find((m) => m.model === 'claude-fable-5');
    const sonnet = agg.models.find((m) => m.model === 'claude-sonnet-4-5');
    expect(fable).toEqual({ model: 'claude-fable-5', probes: 3, measured: 3, residualMax: 3, residualTotal: 9 });
    expect(sonnet).toEqual({ model: 'claude-sonnet-4-5', probes: 2, measured: 2, residualMax: 4, residualTotal: 8 });
  });

  it('skips corrupted/partial lines without throwing', () => {
    const text = BILLING_FIXTURE + '\nnot json at all {{{\n\n{"model":"x"}\n';
    expect(() => parseBenchResults(text, 'billing-sweep')).not.toThrow();
    const agg = parseBenchResults(text, 'billing-sweep');
    // The 5 real rows still count; the garbage line is skipped; the bare
    // `{"model":"x"}` row has no `pred`, so it counts as a probe but never
    // contributes a residual (measuredProbes must not grow, no NaN).
    expect(agg.totalProbes).toBe(6);
    expect(agg.measuredProbes).toBe(5);
    expect(Number.isNaN(agg.residualMax)).toBe(false);
    expect(Number.isNaN(agg.residualTotal)).toBe(false);
  });

  it('empty input → empty aggregate, never NaN', () => {
    const agg = parseBenchResults('', 'billing-sweep');
    expect(agg).toEqual({ totalProbes: 0, measuredProbes: 0, residualMax: 0, residualTotal: 0, models: [] });
  });
});

describe('parseBenchResults(..., "density-frontier")', () => {
  // Grouping is per (model, config), NOT per model: the results mix every
  // experimental density/config sweep, so a per-model rollup would blend
  // production-config reads with deliberately-overdense experiments and
  // contradict the measured claims (e.g. Fable 5 reads 100% at production
  // density but far less at experimental ones). One row per experiment.
  it('aggregates by (model, config): attempts, exact hits, abstentions, last date', () => {
    const agg = parseBenchResults(DENSITY_FIXTURE, 'density-frontier');
    expect(agg.totalRows).toBe(13);
    expect(agg.models).toHaveLength(4);

    const fableStd = agg.models.find(
      (m) => m.model === 'claude-fable-5' && m.config === 'anthropic-std-5x8-aa',
    );
    expect(fableStd).toEqual({
      model: 'claude-fable-5',
      config: 'anthropic-std-5x8-aa',
      attempts: 6,
      correct: 3,
      abstained: 1,
      lastDate: '2026-07-05T19:25:47.422Z',
    });

    const fableHires = agg.models.find(
      (m) => m.model === 'claude-fable-5' && m.config === 'anthropic-hires-5x8-1bit',
    );
    expect(fableHires).toEqual({
      model: 'claude-fable-5',
      config: 'anthropic-hires-5x8-1bit',
      attempts: 1,
      correct: 0,
      abstained: 1,
      lastDate: '2026-07-05T16:34:48.508Z',
    });

    const gpt = agg.models.find((m) => m.model === 'gpt-5.5');
    expect(gpt).toEqual({
      model: 'gpt-5.5',
      config: 'openai-5.5-strip-5x8-aa',
      attempts: 3,
      correct: 0,
      abstained: 1,
      lastDate: '2026-07-06T04:44:57.266Z',
    });

    const gemini = agg.models.find((m) => m.model === 'gemini-2.5-flash');
    expect(gemini).toEqual({
      model: 'gemini-2.5-flash',
      config: 'gemini-tile-1533x1152',
      attempts: 3,
      correct: 0,
      abstained: 0,
      lastDate: '2026-07-06T06:07:27.039Z',
    });
  });

  it('skips corrupted lines without throwing', () => {
    const text = DENSITY_FIXTURE + '\n{broken\n\n';
    expect(() => parseBenchResults(text, 'density-frontier')).not.toThrow();
    expect(parseBenchResults(text, 'density-frontier').totalRows).toBe(13);
  });

  it('empty input → empty aggregate', () => {
    expect(parseBenchResults('', 'density-frontier')).toEqual({ totalRows: 0, models: [] });
  });
});

// ---- harnessScriptsExist ------------------------------------------------

describe('harnessScriptsExist()', () => {
  let tmpRoot: string;
  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-bench-avail-'));
  });
  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('false when benchmarks/ is entirely absent (npm install without the checkout)', () => {
    expect(harnessScriptsExist(tmpRoot)).toBe(false);
  });

  it('true only once BOTH harness entrypoints exist', () => {
    fs.mkdirSync(path.join(tmpRoot, 'benchmarks', 'billing-sweep'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'benchmarks', 'billing-sweep', 'run.mjs'), '// stub');
    expect(harnessScriptsExist(tmpRoot)).toBe(false);
    fs.mkdirSync(path.join(tmpRoot, 'benchmarks', 'density-frontier'), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, 'benchmarks', 'density-frontier', 'run.ts'), '// stub');
    expect(harnessScriptsExist(tmpRoot)).toBe(true);
  });
});

// ---- BenchRunner --------------------------------------------------------

/** Fake, fast, deterministic "harness" scripts — never touch the real
 *  benchmarks/ tree or spend a cent. Written into a fresh tmpdir per test. */
function writeFakeScripts(dir: string): { threeLines: string; sleeper: string } {
  const threeLines = path.join(dir, 'three-lines.mjs');
  fs.writeFileSync(
    threeLines,
    "console.log('line1');\nconsole.log('line2');\nconsole.log('line3');\nprocess.exit(0);\n",
  );
  const sleeper = path.join(dir, 'sleeper.mjs');
  fs.writeFileSync(sleeper, 'setTimeout(() => {}, 60000);\n');
  return { threeLines, sleeper };
}

function fixedCommand(scriptPath: string): (repoRoot: string, harness: BenchHarness, mode: BenchMode) => BenchCommand {
  return () => ({ cmd: process.execPath, args: [scriptPath] });
}

describe('BenchRunner', () => {
  let tmpRoot: string;
  let scripts: { threeLines: string; sleeper: string };
  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-bench-runner-'));
    scripts = writeFakeScripts(tmpRoot);
  });
  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('rejects an invalid harness before spawning anything', () => {
    const runner = new BenchRunner({ repoRoot: tmpRoot, resolveCommand: fixedCommand(scripts.threeLines) });
    const result = runner.start({ harness: 'not-a-harness', mode: 'dry' });
    expect(result).toEqual({ ok: false, status: 400, error: expect.any(String) });
    expect(runner.getState().running).toBe(false);
  });

  it('rejects an invalid mode', () => {
    const runner = new BenchRunner({ repoRoot: tmpRoot, resolveCommand: fixedCommand(scripts.threeLines) });
    const result = runner.start({ harness: 'billing-sweep', mode: 'turbo' });
    expect(result).toEqual({ ok: false, status: 400, error: expect.any(String) });
  });

  it('rejects live mode without confirm:true', () => {
    const runner = new BenchRunner({
      repoRoot: tmpRoot,
      resolveCommand: fixedCommand(scripts.threeLines),
      envKeyPresent: () => true,
    });
    const result = runner.start({ harness: 'billing-sweep', mode: 'live' });
    expect(result).toEqual({ ok: false, status: 400, error: expect.any(String) });
  });

  it('rejects live mode with confirm:true but no env key (412)', () => {
    const runner = new BenchRunner({
      repoRoot: tmpRoot,
      resolveCommand: fixedCommand(scripts.threeLines),
      envKeyPresent: () => false,
    });
    const result = runner.start({ harness: 'billing-sweep', mode: 'live', confirm: true });
    expect(result).toEqual({ ok: false, status: 412, error: expect.any(String) });
    expect((result as { error: string }).error).toMatch(/ANTHROPIC_API_KEY/);
  });

  it('accepts live mode with confirm:true and a present env key', async () => {
    const runner = new BenchRunner({
      repoRoot: tmpRoot,
      resolveCommand: fixedCommand(scripts.threeLines),
      envKeyPresent: () => true,
    });
    const exited = new Promise<void>((resolve) => {
      const result = runner.start(
        { harness: 'billing-sweep', mode: 'live', confirm: true },
        { onExit: () => resolve() },
      );
      expect(result).toEqual({ ok: true });
    });
    await exited;
  });

  it('runs a fake script: onLine gets every stdout line, onExit gets code 0, lock releases', async () => {
    const runner = new BenchRunner({ repoRoot: tmpRoot, resolveCommand: fixedCommand(scripts.threeLines) });
    const lines: string[] = [];
    let exitCode: number | null | undefined;
    let exitHarness: BenchHarness | undefined;
    await new Promise<void>((resolve) => {
      const result = runner.start(
        { harness: 'billing-sweep', mode: 'dry' },
        {
          onLine: (_h, line) => lines.push(line),
          onExit: (h, code) => {
            exitHarness = h;
            exitCode = code;
            resolve();
          },
        },
      );
      expect(result).toEqual({ ok: true });
      expect(runner.getState().running).toBe(true);
      expect(runner.getState().harness).toBe('billing-sweep');
    });
    expect(lines).toEqual(['line1', 'line2', 'line3']);
    expect(exitCode).toBe(0);
    expect(exitHarness).toBe('billing-sweep');
    expect(runner.getState().running).toBe(false);
  });

  it('refuses a second start while one is already running (409), then accepts once it exits', async () => {
    const runner = new BenchRunner({ repoRoot: tmpRoot, resolveCommand: fixedCommand(scripts.threeLines) });
    const firstExit = new Promise<void>((resolve) => {
      const first = runner.start({ harness: 'billing-sweep', mode: 'dry' }, { onExit: () => resolve() });
      expect(first).toEqual({ ok: true });
    });
    const second = runner.start({ harness: 'density-frontier', mode: 'dry' });
    expect(second).toEqual({ ok: false, status: 409, error: expect.any(String) });

    await firstExit;
    const third = runner.start({ harness: 'density-frontier', mode: 'dry' });
    expect(third).toEqual({ ok: true });
    runner.cancel();
  });

  it('cancel() kills the current child: onExit fires with a non-zero/non-null signal, lock releases', async () => {
    const runner = new BenchRunner({ repoRoot: tmpRoot, resolveCommand: fixedCommand(scripts.sleeper) });
    const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
      const result = runner.start(
        { harness: 'billing-sweep', mode: 'dry' },
        { onExit: (_h, code, signal) => resolve({ code, signal }) },
      );
      expect(result).toEqual({ ok: true });
      expect(runner.getState().running).toBe(true);
      const cancelled = runner.cancel();
      expect(cancelled).toBe(true);
    });
    const { code, signal } = await exited;
    expect(code !== 0 || signal !== null).toBe(true);
    expect(runner.getState().running).toBe(false);
  });

  it('cancel() on an idle runner is a harmless no-op', () => {
    const runner = new BenchRunner({ repoRoot: tmpRoot, resolveCommand: fixedCommand(scripts.threeLines) });
    expect(runner.cancel()).toBe(false);
  });
});

// ---- renderBenchFragment --------------------------------------------------

describe('renderBenchFragment()', () => {
  const data = {
    billingSweep: parseBenchResults(BILLING_FIXTURE, 'billing-sweep'),
    densityFrontier: parseBenchResults(DENSITY_FIXTURE, 'density-frontier'),
  };

  it('shows both harness cards with their real aggregates + a results/ source note', () => {
    const html = renderBenchFragment(data, { harnessAvailable: true, canLive: false, running: null });
    expect(html).toContain('billing-sweep');
    expect(html).toContain('density-frontier');
    expect(html).toContain('benchmarks/billing-sweep/results/');
    expect(html).toContain('benchmarks/density-frontier/results/');
    expect(html).toContain('claude-fable-5');
    expect(html).toContain('gpt-5.5');
    expect(html).not.toContain('NaN');
  });

  it('enables run buttons when the harness is available', () => {
    const html = renderBenchFragment(data, { harnessAvailable: true, canLive: true, running: null });
    expect(html).toContain('bench-run-dry');
    expect(html).toContain('bench-run-live');
    expect(html).toContain('id="bench-run-dry-billing-sweep"');
    expect(html).toContain('id="bench-run-live-density-frontier"');
    // Buttons present and not carrying the disabled attribute.
    expect(html).not.toMatch(/id="bench-run-dry-billing-sweep"[^>]*disabled/);
  });

  it('disables every run button and shows the checkout note when harnessAvailable is false', () => {
    const html = renderBenchFragment(data, { harnessAvailable: false, canLive: true, running: null });
    expect(html).toContain('checkout');
    expect(html).toMatch(/id="bench-run-dry-billing-sweep"[^>]*disabled/);
    expect(html).toMatch(/id="bench-run-live-billing-sweep"[^>]*disabled/);
  });

  it('disables the live button (but not dry) when canLive is false', () => {
    const html = renderBenchFragment(data, { harnessAvailable: true, canLive: false, running: null });
    expect(html).not.toMatch(/id="bench-run-dry-billing-sweep"[^>]*disabled/);
    expect(html).toMatch(/id="bench-run-live-billing-sweep"[^>]*disabled/);
  });

  it('shows a streaming terminal with traffic lights + cancel while a run is active', () => {
    const html = renderBenchFragment(data, {
      harnessAvailable: true,
      canLive: true,
      running: { running: true, harness: 'billing-sweep', startedAt: Date.now(), lines: ['probe 1/9', 'probe 2/9'] },
    });
    expect(html).toContain('bench-term');
    expect(html).toContain('term-dot-red');
    expect(html).toContain('term-dot-yellow');
    expect(html).toContain('term-dot-green');
    expect(html).toContain('id="bench-cancel"');
    expect(html).toContain('probe 1/9');
    expect(html).toContain('probe 2/9');
  });

  it('escapes stdout lines in the terminal (no raw HTML injection)', () => {
    const html = renderBenchFragment(data, {
      harnessAvailable: true,
      canLive: true,
      running: { running: true, harness: 'billing-sweep', startedAt: Date.now(), lines: ['<script>evil()</script>'] },
    });
    expect(html).not.toContain('<script>evil()</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ---- DashboardState wiring: routes, fragment, SSE -------------------------

function makeTmp(): SessionsPaths {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-benchdash-'));
  return {
    eventsFile: path.join(dir, 'events.jsonl'),
    sidecarDir: path.join(dir, '4xx-bodies'),
  };
}

/** Builds a throwaway repoRoot with just enough of a benchmarks/ tree for
 *  harnessScriptsExist() + the results reader to see real fixture data,
 *  without ever touching the actual repo's benchmarks/ results directories. */
function makeBenchRepoRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-benchrepo-'));
  const billingDir = path.join(root, 'benchmarks', 'billing-sweep');
  const densityDir = path.join(root, 'benchmarks', 'density-frontier');
  fs.mkdirSync(path.join(billingDir, 'results'), { recursive: true });
  fs.mkdirSync(path.join(densityDir, 'results'), { recursive: true });
  fs.writeFileSync(path.join(billingDir, 'run.mjs'), '// stub, not executed by these tests');
  fs.writeFileSync(path.join(densityDir, 'run.ts'), '// stub, not executed by these tests');
  fs.writeFileSync(path.join(billingDir, 'results', 'sweep-test.jsonl'), BILLING_FIXTURE);
  fs.writeFileSync(path.join(densityDir, 'results', 'frontier-test.jsonl'), DENSITY_FIXTURE);
  return root;
}

describe('dashboardPath() — bench routes', () => {
  it('routes POST /api/bench/run and /api/bench/cancel', () => {
    expect(dashboardPath('/api/bench/run')).toEqual({ kind: 'api-bench-run' });
    expect(dashboardPath('/api/bench/cancel')).toEqual({ kind: 'api-bench-cancel' });
  });

  it('routes GET /fragments/bench through the generic fragment route', () => {
    expect(dashboardPath('/fragments/bench')).toEqual({ kind: 'fragment', name: 'bench' });
  });
});

describe('DashboardState — bench fragment + routes (no runner configured)', () => {
  let tmp: SessionsPaths;
  let dash: DashboardState;
  beforeEach(() => {
    tmp = makeTmp();
    dash = new DashboardState(tmp, async () => new Map());
  });
  afterEach(() => {
    fs.rmSync(path.dirname(tmp.eventsFile), { recursive: true, force: true });
  });

  it('serveFragment("bench") still renders (harness unavailable) instead of 503ing the page', async () => {
    const res = await dash.serveFragment('bench', new URL('http://x/fragments/bench'), 47821);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('checkout');
  });

  it('handleBenchRun() 503s when no bench runner was configured', async () => {
    const res = await dash.handleBenchRun({ harness: 'billing-sweep', mode: 'dry' });
    expect(res.status).toBe(503);
  });
});

describe('DashboardState — bench fragment + routes (fake runner configured)', () => {
  let tmp: SessionsPaths;
  let repoRoot: string;
  let dash: DashboardState;
  let scripts: { threeLines: string; sleeper: string };

  beforeEach(() => {
    tmp = makeTmp();
    repoRoot = makeBenchRepoRoot();
    scripts = writeFakeScripts(repoRoot);
    dash = new DashboardState(
      tmp,
      async () => new Map(),
      () =>
        new BenchRunner({
          repoRoot,
          resolveCommand: fixedCommand(scripts.threeLines),
          envKeyPresent: () => true,
        }),
    );
  });
  afterEach(() => {
    fs.rmSync(path.dirname(tmp.eventsFile), { recursive: true, force: true });
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  it('serveFragment("bench") shows the real fixture aggregates with the harness available', async () => {
    const res = await dash.serveFragment('bench', new URL('http://x/fragments/bench'), 47821);
    const html = await res.text();
    expect(html).toContain('claude-fable-5');
    expect(html).toContain('bench-run-dry');
    expect(html).not.toContain('checkout');
  });

  it('handleBenchRun() 400s on an invalid harness', async () => {
    const res = await dash.handleBenchRun({ harness: 'nope', mode: 'dry' });
    expect(res.status).toBe(400);
  });

  it('handleBenchRun() 400s on live mode without confirm', async () => {
    const res = await dash.handleBenchRun({ harness: 'billing-sweep', mode: 'live' });
    expect(res.status).toBe(400);
  });

  it('handleBenchRun() starts a dry run (200 {started:true}), a concurrent second call 409s, handleBenchCancel always 200s', async () => {
    const res1 = await dash.handleBenchRun({ harness: 'billing-sweep', mode: 'dry' });
    expect(res1.status).toBe(200);
    expect(await res1.json()).toEqual({ started: true });

    const res2 = await dash.handleBenchRun({ harness: 'density-frontier', mode: 'dry' });
    expect(res2.status).toBe(409);

    const cancelRes = dash.handleBenchCancel();
    expect(cancelRes.status).toBe(200);
  });

  it('streams stdout lines and the exit frame over /events/stream as {bench:{...}}', async () => {
    const sseRes = dash.serveEventsStream();
    const reader = sseRes.body!.getReader();
    const readFrame = async (): Promise<unknown> => {
      const { value, done } = await reader.read();
      if (done || !value) throw new Error('stream ended unexpectedly');
      const text = new TextDecoder().decode(value);
      const line = text.split('\n').find((l) => l.startsWith('data: '));
      if (!line) throw new Error(`no data: line in frame: ${JSON.stringify(text)}`);
      return JSON.parse(line.slice('data: '.length));
    };
    await readFrame(); // initial hello frame

    const started = await dash.handleBenchRun({ harness: 'billing-sweep', mode: 'dry' });
    expect(started.status).toBe(200);

    const frame1 = (await readFrame()) as { bench?: { harness: string; line: string } };
    expect(frame1.bench?.harness).toBe('billing-sweep');
    expect(frame1.bench?.line).toBe('line1');

    const frame2 = (await readFrame()) as { bench?: { line: string } };
    expect(frame2.bench?.line).toBe('line2');
    const frame3 = (await readFrame()) as { bench?: { line: string } };
    expect(frame3.bench?.line).toBe('line3');

    const exitFrame = (await readFrame()) as { bench?: { harness: string; done: boolean; code: number | null } };
    expect(exitFrame.bench?.harness).toBe('billing-sweep');
    expect(exitFrame.bench?.done).toBe(true);
    expect(exitFrame.bench?.code).toBe(0);

    await reader.cancel();
  });
});
