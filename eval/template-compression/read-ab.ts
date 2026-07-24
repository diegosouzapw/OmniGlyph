// Paired A/B exact-recall reader: renders each arm's text to PNG pages, has
// the model read them, and scores each answer with the shared density-frontier
// scorer. `askImages` (the `claude -p` CLI call) is the only impure seam; it is
// injected into readArm with the real transport as the default so production
// callers need no wiring, while tests can pass a stub and stay $0/offline.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderTextToImages } from '../../dist/core/library.js';
import { scoreAnswer } from '../../benchmarks/density-frontier/score.js';
import { templatize } from './templatize.js';
import type { Query } from './fixtures/corpus.js';

export type Arm = 'raw' | 'templated';

export interface ReadOutcome {
  arm: Arm;
  queryId: string;
  rep: number;
  answer: string;
  outcome: 'correct' | 'abstained' | 'no_answer' | 'silent_wrong';
}

/** Transport seam signature — a single question read against the arm's rendered pages. */
export type AskImages = (pngs: Uint8Array[], q: Query, model: string) => Promise<string>;

/** The real transport: writes PNG pages to a temp dir and shells out to the
 *  `claude` CLI in headless mode, restricted to Read (no Bash) so the model can
 *  only look at the images we handed it. Returns '[API_ERROR]' on a non-zero
 *  exit or empty stdout so scoreAnswer routes failures to 'no_answer' instead
 *  of contaminating the silent-wrong rate. */
export async function askImages(pngs: Uint8Array[], q: Query, model: string): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'tc-read-'));
  try {
    const paths = pngs.map((png, k) => {
      const p = join(dir, `page-${k}.png`);
      writeFileSync(p, png);
      return p;
    });
    const prompt =
      `Read the attached page image(s): ${paths.join(', ')}. ` +
      `Answer ONLY with the exact value, no prose. If you cannot read it, answer exactly ILEGIVEL. ` +
      `Question: ${q.q}`;
    const res = spawnSync(
      'claude',
      ['-p', prompt, '--model', model, '--allowedTools', 'Read', '--disallowedTools', 'Bash'],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    if (res.status !== 0 || !res.stdout) return '[API_ERROR]';
    return res.stdout.trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function readArm(
  arm: Arm,
  text: string,
  queries: Query[],
  model: string,
  reps: number,
  ask: AskImages = askImages,
): Promise<ReadOutcome[]> {
  const source = arm === 'templated' ? templatize(text).text : text;
  const { pages } = await renderTextToImages(source, { reflow: true });
  const pngs = pages.map((p) => p.png);
  const out: ReadOutcome[] = [];
  for (const q of queries) {
    for (let rep = 0; rep < reps; rep++) {
      const answer = await ask(pngs, q, model);
      const { outcome } = scoreAnswer({ expected: q.exact, distractors: [] }, answer);
      out.push({ arm, queryId: q.id, rep, answer, outcome });
    }
  }
  return out;
}
