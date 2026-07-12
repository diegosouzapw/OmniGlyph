// Grok image-recall receipt — does OmniGlyph's SHIPPED Grok profile read exact
// tokens back? See README.md.
//
// This validates the exact production config a `grok-*` request renders as:
// the profile from resolveModelProfile('grok-4.5') (dense effective 9×12 cell,
// 84-col strip, 1-bit, fact-sheet rides beside the image in the real transform).
// It does NOT change any default — Grok stays fail-closed in
// UNVERIFIED_MODEL_BASES until a LIVE run here clears the bar.
//
// Dry-run (default): renders the fixture and prints the token/savings math ($0).
// Live (GROK_DENSITY_LIVE=1): also calls the model over the OpenAI Responses
// API and scores the battery. Point OPENAI_BASE_URL + OPENAI_API_KEY at any
// OpenAI-compatible Responses endpoint that serves the Grok model — a direct
// xAI endpoint, or an OmniRoute gateway (also OpenAI-compatible). Do NOT route
// this harness through OmniGlyph itself — the goal is raw image-reading quality.
//
// Build first:  pnpm run build && node eval/grok-density/run.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderTextToPngs } from '../../dist/core/render.js';
import { resolveModelProfile } from '../../dist/core/openai-wire-profiles.js';
import { visionTokensForModel } from '../../dist/core/openai.js';

const here = dirname(fileURLToPath(import.meta.url));

// --- Fixture: synthetic session with embedded precision-critical tokens ------
const TRUTH = {
  hex: 'a3f9c1e0b7d2',
  camel: 'tokenLedgerShard',
  path: 'src/core/anthropic-vision.ts',
  flag: '--max-visual-tokens',
  port: '47821',
};
const SESSION = [
  '<user t="1">Wire up the retry path. Use a retry budget of 3 attempts, backing off 250ms.</user>',
  `<assistant t="2">Done. The token cache key is ${TRUTH.hex}. I renamed the field to ${TRUTH.camel}`,
  `and moved the tier math into ${TRUTH.path}. The CLI now takes ${TRUTH.flag}. Proxy stays on port ${TRUTH.port}.</assistant>`,
  '<user t="3">Good. Keep the retry budget as decided; do not change the backoff.</user>',
  ...Array.from({ length: 40 }, (_, i) =>
    `<assistant t="${4 + i}">step ${i}: processed shard ${i} of the ${TRUTH.camel}, ok, continuing the run.</assistant>`),
].join('\n');

const QUESTIONS = [
  { id: 'hex', kind: 'exact', q: 'What is the exact token cache key (12-char hex) mentioned in the transcript?', answer: TRUTH.hex },
  { id: 'camel', kind: 'exact', q: 'What is the exact field name the assistant renamed the field to?', answer: TRUTH.camel },
  { id: 'path', kind: 'exact', q: 'What exact file path did the tier math move into?', answer: TRUTH.path },
  { id: 'port', kind: 'exact', q: 'What port does the proxy stay on?', answer: TRUTH.port },
  { id: 'gist', kind: 'gist', q: 'What retry budget was decided (a number of attempts)?', answer: '3' },
  { id: 'guard', kind: 'guard', q: 'What database password was configured in this session? If it was not stated, say "NOT STATED".', answer: 'NOT STATED' },
];

// Acceptance bar to flip Grok out of UNVERIFIED_MODEL_BASES (src/core/applicability.ts):
// exact 4/4, 0 confabulations, gist ok, guard ok, positive savings.
const BAR = { exact: 4, confab: 0 };

const MODEL = process.env.GROK_DENSITY_MODEL || 'grok-4.5';
const PROFILE = resolveModelProfile(MODEL);
// Rough baseline for the savings display only (chars ÷ 4 ≈ text tokens).
const TEXT_TOKENS = Math.ceil(SESSION.length / 4);

function responsesBaseUrl() {
  const base = (process.env.OPENAI_BASE_URL || '').replace(/\/$/, '');
  if (!base) throw new Error('OPENAI_BASE_URL is required for live runs');
  return base.endsWith('/responses') ? base : `${base}/responses`;
}

async function callModel(model, dataUrls, question) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is required for live runs');
  const content = [
    ...dataUrls.map((u) => ({ type: 'input_image', image_url: u, detail: 'high' })),
    {
      type: 'input_text',
      text: question + '\nAnswer with ONLY the exact value, or "NOT STATED" if it is not present. Do not guess.',
    },
  ];
  const t0 = Date.now();
  const payload = { model, stream: false, max_output_tokens: 512, input: [{ role: 'user', content }] };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.GROK_DENSITY_TIMEOUT_MS || 180000));
  let res;
  try {
    res = await fetch(responsesBaseUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(`fetch failed: ${err && err.message ? err.message : err}`, { cause: err });
  } finally {
    clearTimeout(timer);
  }
  const raw = await res.text();
  let j;
  try { j = JSON.parse(raw); } catch { throw new Error(`Responses HTTP ${res.status}: non-JSON body ${raw.slice(0, 200)}`); }
  if (!res.ok) throw new Error(`Responses HTTP ${res.status}: ${j?.error?.message || raw.slice(0, 300)}`);
  let text = typeof j.output_text === 'string' ? j.output_text : '';
  if (!text && Array.isArray(j.output)) {
    for (const item of j.output) {
      if (!item || item.type !== 'message' || !Array.isArray(item.content)) continue;
      for (const part of item.content) {
        if (part && (part.type === 'output_text' || part.type === 'text') && typeof part.text === 'string') text += part.text;
      }
    }
  }
  return { text: text.trim(), ms: Date.now() - t0, status: j.status || null };
}

function score(kind, expected, got, status) {
  if (!got) return { ok: false, abstained: false, confab: false, refused: status === 'incomplete' || status === 'failed' };
  const g = got.toLowerCase();
  const abstained = /not stated|unknown|not safe|can't|cannot|not present|i don't know|do not know/.test(g);
  if (kind === 'guard') return { ok: abstained, abstained, confab: !abstained, refused: false };
  if (kind === 'gist') return { ok: g.includes(String(expected).toLowerCase()), abstained, confab: false, refused: false };
  const ok = got.includes(expected);
  return { ok, abstained, confab: !ok && !abstained, refused: false };
}

process.on('unhandledRejection', (err) => { console.error('unhandledRejection', err); process.exitCode = 1; });

const live = process.env.GROK_DENSITY_LIVE === '1' || process.env.GROK_DENSITY_LIVE === 'true';

console.log(`Grok image-recall receipt · model=${MODEL} · live=${live}`);
console.log(`profile (as shipped): stripCols=${PROFILE.stripCols} maxHeightPx=${PROFILE.maxHeightPx} style=${JSON.stringify(PROFILE.style)}`);
console.log(`text baseline ≈ ${TEXT_TOKENS} tok (chars/4)`);

// Render the fixture EXACTLY as a production grok request would: profile strip
// width, profile style (dense 9×12), profile max page height. Single portrait
// strip, no multi-col packing — matches the Responses transform.
const imgs = await renderTextToPngs(SESSION, PROFILE.stripCols, PROFILE.style ?? {}, PROFILE.maxHeightPx);
const pages = imgs.map((im) => ({ png: im.png, width: im.width, height: im.height }));
const imageTokens = pages.reduce((n, p) => n + visionTokensForModel(MODEL, p.width, p.height), 0);
const savingsPct = Math.round((1 - imageTokens / TEXT_TOKENS) * 100);
const dims = pages.map((p) => `${p.width}x${p.height}`);
console.log(`\n${pages.length} page(s) ${dims.join(',')} → ${imageTokens} img tok vs ${TEXT_TOKENS} text (${savingsPct}% saved)`);

const results = {
  generatedAt: new Date().toISOString(),
  model: MODEL,
  profile: PROFILE,
  textTokens: TEXT_TOKENS,
  imageTokens,
  savingsPct,
  pages: pages.length,
  dims,
  live,
  bar: BAR,
  battery: null,
  verdict: null,
};

if (live) {
  console.log(`\ncalling ${MODEL} over Responses...`);
  const dataUrls = pages.map((p) => 'data:image/png;base64,' + Buffer.from(p.png).toString('base64'));
  const m = { exactCorrect: 0, exactTotal: 0, confab: 0, abstain: 0, refused: 0, gistOk: false, guardOk: false, answers: [] };
  for (const q of QUESTIONS) {
    let text, ms, status;
    try {
      ({ text, ms, status } = await callModel(MODEL, dataUrls, q.q));
    } catch (err) {
      console.error(`  ${q.id.padEnd(6)} ERROR ${err.message}`);
      m.answers.push({ id: q.id, kind: q.kind, expected: q.answer, got: '', error: String(err.message || err), ok: false, refused: true, ms: 0 });
      m.refused++;
      if (q.kind === 'exact') m.exactTotal++;
      continue;
    }
    const s = score(q.kind, q.answer, text, status);
    m.answers.push({ id: q.id, kind: q.kind, expected: q.answer, got: text, status, ...s, ms });
    if (q.kind === 'exact') { m.exactTotal++; if (s.ok) m.exactCorrect++; }
    if (s.confab) m.confab++;
    if (s.abstained) m.abstain++;
    if (s.refused) m.refused++;
    if (q.kind === 'gist' && !s.refused) m.gistOk = s.ok;
    if (q.kind === 'guard' && !s.refused) m.guardOk = s.ok;
    const mark = s.ok ? 'OK' : s.refused ? 'REFUSED' : s.abstained ? 'ABSTAIN' : s.confab ? 'CONFAB' : 'MISS';
    console.log(`  ${q.id.padEnd(6)} ${mark.padEnd(8)} got=${JSON.stringify(text).slice(0, 80)} (${ms}ms)`);
  }
  results.battery = m;
  const pass = m.exactCorrect >= BAR.exact && m.confab <= BAR.confab && m.gistOk && m.guardOk && savingsPct > 0;
  results.verdict = pass ? 'PASS' : 'FAIL';
  console.log(`\n  → exact ${m.exactCorrect}/${m.exactTotal} · confab ${m.confab} · gist ${m.gistOk ? 'ok' : 'FAIL'} · guard ${m.guardOk ? 'ok' : 'FAIL'} · ${savingsPct}% saved`);
  console.log(`  VERDICT: ${results.verdict} (bar: exact ${BAR.exact}/4, confab ${BAR.confab}, gist+guard ok, savings > 0)`);
  if (pass) console.log('  → PASS: commit this results.json and remove "grok" from UNVERIFIED_MODEL_BASES in src/core/applicability.ts.');
  else console.log('  → FAIL: Grok stays fail-closed (unverified). Do not flip.');
}

const outPath = join(here, 'results.json');
writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`\nWrote ${outPath}`);
if (!live) console.log('Dry-run only ($0). Re-run with GROK_DENSITY_LIVE=1 (+ OPENAI_BASE_URL/OPENAI_API_KEY at a Grok endpoint) to score reading and produce the receipt.');
