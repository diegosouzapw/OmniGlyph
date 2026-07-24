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
