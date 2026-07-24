export interface Query { id: string; q: string; exact: string }
export interface Sample {
  id: string;
  tier: 'best' | 'typical' | 'worst';
  text: string;
  queries: Query[];
}

// Repetitive samples are large ON PURPOSE. Image billing is page/tile-quantized:
// templating cuts characters, but that only cuts TOKENS once the shorter text
// saves whole rendered pages. A 40-line log fits one page in both arms → 0%
// measured reduction even though the templated text is far shorter. Realistic
// verbose dumps (logs, big test runs) are hundreds of lines, so the corpus uses
// that scale — where the raw arm spills to multiple pages and the win is real.
const workerLog = Array.from({ length: 800 }, (_, k) =>
  `worker-${(k % 8) + 1} request ${4800 + k} failed after ${30 * ((k % 3) + 1)} sec`,
).join('\n');

const gitLog = Array.from({ length: 800 }, (_, k) =>
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
    text: Array.from({ length: 800 }, (_, k) =>
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
      ...Array.from({ length: 800 }, (_, k) =>
        `-rw-r--r-- 1 user user ${1000 + k * 7} file_${k}.ts`,
      ),
    ].join('\n'),
    queries: [
      // file_5 → 1000 + 5*7 = 1035 (unique: no file_1035 in range, no other size 1035).
      { id: 'q-size-file5', q: 'What is the byte size of file_5.ts?', exact: '1035' },
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
