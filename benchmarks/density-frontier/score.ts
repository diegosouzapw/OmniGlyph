/**
 * Deterministic scoring for density-frontier answers — no LLM judge.
 * Outcomes:
 *  - correct: exact match (whitespace/quote wrapping tolerated);
 *  - abstained: the model used the ILEGIVEL sentinel (honest failure);
 *  - no_answer: transport/classifier failure ([EMPTY:...] / [API_ERROR]) —
 *    not a reading error, must not contaminate silent-wrong rates;
 *  - silent_wrong: any other answer — the dangerous mode.
 * Flags on silent_wrong:
 *  - matchedDistractor: the answer equals a PLANTED near-miss variant;
 *  - predictedConfusion: same length and every differing position is a
 *    measured confusable pair (either direction) — the confusability matrix
 *    predicted this misread even without a planted distractor.
 */
import { CONFUSABLE_GLYPHS, type Question } from './corpus.js';

export interface Score {
  outcome: 'correct' | 'abstained' | 'no_answer' | 'silent_wrong';
  matchedDistractor: boolean;
  predictedConfusion: boolean;
  normalized: string;
}

function normalize(answer: string): string {
  return answer.trim().replace(/^["'`\s]+|["'`\s.]+$/g, '');
}

function confusablePair(a: string, b: string): boolean {
  return CONFUSABLE_GLYPHS[a] === b || CONFUSABLE_GLYPHS[b] === a;
}

function isPredictedConfusion(expected: string, got: string): boolean {
  if (got.length !== expected.length || got === expected) return false;
  let diffs = 0;
  for (let i = 0; i < expected.length; i++) {
    if (got[i] !== expected[i]) {
      if (!confusablePair(expected[i]!, got[i]!)) return false;
      diffs++;
    }
  }
  return diffs > 0;
}

export function scoreAnswer(question: Pick<Question, 'expected' | 'distractors'>, answer: string): Score {
  const normalized = normalize(answer);
  if (normalized === question.expected) {
    return { outcome: 'correct', matchedDistractor: false, predictedConfusion: false, normalized };
  }
  if (answer.startsWith('[EMPTY:') || answer.startsWith('[API_ERROR]')) {
    return { outcome: 'no_answer', matchedDistractor: false, predictedConfusion: false, normalized };
  }
  if (/\bILEGIVEL\b/i.test(answer)) {
    return { outcome: 'abstained', matchedDistractor: false, predictedConfusion: false, normalized };
  }
  return {
    outcome: 'silent_wrong',
    matchedDistractor: question.distractors.includes(normalized),
    predictedConfusion: isPredictedConfusion(question.expected, normalized),
    normalized,
  };
}
