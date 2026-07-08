/**
 * Corpus generator for the density-frontier eval: dense filler + planted
 * exact-string needles from the classes the legibility audit says fail
 * (hex ids, camelCase, digit-heavy values), plus NEAR-MISS DISTRACTORS built
 * from the measured glyph-confusability pairs. If a model answers with a
 * distractor, that is a *predicted* confusion — the silent failure mode this
 * harness exists to detect. Deterministic (mulberry32) so pages are
 * byte-identical across runs and cacheable.
 */

/** Measured confusable substitutions (LEGIBILITY-AUDIT-2026-07-01 + glyph-matrix
 *  sweep): gold glyph → most likely misread. Used to build near-miss distractors. */
export const CONFUSABLE_GLYPHS: Record<string, string> = {
  '0': '8',
  '8': '0',
  '3': '5',
  '5': '3',
  '6': '8',
  '7': '4',
  '4': '9',
  '9': '4',
  '1': 'd',
  'd': '1',
  'e': '8',
  'f': '5',
  'b': '8',
  'c': 'e',
  'a': '4',
  '2': '4',
};

export interface Question {
  kind: 'verbatim' | 'gist';
  label: string;
  prompt: string;
  expected: string;
  distractors: string[];
}

export interface DensityCorpus {
  pageText: string;
  /** label → exact planted value. */
  gold: Record<string, string>;
  /** label → near-miss variants planted elsewhere in the text. */
  distractors: Record<string, string[]>;
  verbatimQuestions: Question[];
  gistQuestions: Question[];
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HEX = '0123456789abcdef';
const CAMEL_PARTS = ['token', 'ledger', 'shard', 'cache', 'render', 'patch', 'frame', 'index', 'probe', 'batch'];

/** Swap one confusable glyph at a deterministic position ≥1 (keeps length). */
function nearMiss(gold: string, rnd: () => number): string {
  const positions = [...gold].map((ch, i) => (CONFUSABLE_GLYPHS[ch] !== undefined ? i : -1)).filter((i) => i >= 0);
  if (positions.length === 0) return gold; // caller skips identical distractors
  const pos = positions[Math.floor(rnd() * positions.length)]!;
  const swapped = CONFUSABLE_GLYPHS[gold[pos]!]!;
  return gold.slice(0, pos) + swapped + gold.slice(pos + 1);
}

export function buildCorpus(opts: { seed: number; sections: number }): DensityCorpus {
  const rnd = mulberry32(opts.seed);
  const hex = (n: number) => Array.from({ length: n }, () => HEX[Math.floor(rnd() * 16)]!).join('');
  const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
  const camel = () => {
    const parts = Array.from({ length: 3 }, () => CAMEL_PARTS[Math.floor(rnd() * CAMEL_PARTS.length)]!);
    return parts[0]! + parts.slice(1).map((p) => p[0]!.toUpperCase() + p.slice(1)).join('');
  };

  const gold: Record<string, string> = {};
  const distractors: Record<string, string[]> = {};
  const verbatimQuestions: Question[] = [];
  const gistQuestions: Question[] = [];
  const lines: string[] = [];

  const gistFacts: Array<{ key: string; question: string; answer: string }> = [
    { key: 'decisao', question: 'Qual estratégia foi adotada na decisão registrada?', answer: `rollout-${['gradual', 'canario', 'imediato'][int(0, 2)]}` },
    { key: 'porta', question: 'Em qual porta o serviço foi publicado?', answer: String(int(3000, 9999)) },
    { key: 'ambiente', question: 'Para qual ambiente foi o deploy?', answer: ['staging', 'producao', 'homolog'][int(0, 2)]! },
  ];

  for (let s = 0; s < opts.sections; s++) {
    const label = `REGISTRO-${String.fromCharCode(65 + (s % 26))}${s >= 26 ? s : ''}`;
    // Alternate needle class per section: hex id / camelCase symbol / digit run.
    const cls = s % 3;
    const value = cls === 0 ? hex(12) : cls === 1 ? camel() : `${int(100000, 999999)}${hex(4)}`;
    gold[label] = value;
    const variants: string[] = [];
    const v = nearMiss(value, rnd);
    if (v !== value) variants.push(v);
    distractors[label] = variants;

    // Filler: dense JSON-ish log lines around the needle.
    for (let i = 0; i < 6; i++) {
      lines.push(JSON.stringify({ lvl: ['info', 'warn', 'dbg'][int(0, 2)], op: camel(), id: hex(12), dur: int(90, 9900) }));
    }
    lines.push(`${label}: {"id":"${value}","status":"ok","attempt":${int(1, 5)}}`);
    // Plant the near-miss in a DIFFERENT, unlabeled filler line further along.
    for (const variant of variants) {
      lines.push(JSON.stringify({ lvl: 'trace', op: camel(), ref: variant, dur: int(90, 9900) }));
    }

    verbatimQuestions.push({
      kind: 'verbatim',
      label,
      prompt:
        `Nas imagens, localize a linha "${label}" e transcreva EXATAMENTE o valor do campo "id" dela. ` +
        'Responda somente com o valor. Se não conseguir ler com total segurança, responda exatamente: ILEGIVEL',
      expected: value,
      distractors: variants,
    });
  }

  for (const f of gistFacts) {
    lines.splice(int(0, lines.length - 1), 0, `[nota] ${f.key}: ${f.answer} (registrado pelo operador)`);
    gistQuestions.push({
      kind: 'gist',
      label: f.key,
      prompt: `${f.question} Responda somente com o valor. Se não estiver nas imagens, responda: ILEGIVEL`,
      expected: f.answer,
      distractors: [],
    });
  }

  return { pageText: lines.join('\n'), gold, distractors, verbatimQuestions, gistQuestions };
}
