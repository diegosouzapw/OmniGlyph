/**
 * Gemini 3.6 Flash reading + billing receipt — OmniGlyph's own measurement.
 *
 * Renders context through OUR production pipeline (dense 1-bit/AA pages at the
 * GEMINI_TILE_PAGE geometry) + the verbatim text fact-sheet, then scores Gemini
 * on five dimensions against the LIVE Google API. Nothing here uses upstream's
 * numbers; it produces ours, into results/ (gitignored).
 *
 *   GEMINI_API_KEY=… node eval/gemini-profile/run.mjs [N] [suite]
 *     N      samples per reading suite (default 10)
 *     suite  billing|hex|arith|gist|state|nonestated|all (default all)
 *
 * The key is read from the env only — never written to results or logs.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { countImageTokens, generate, model, requireKey } from './client.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { renderTextToPngs, renderTextToPngsWithCharLimit } = await import(`${ROOT}/dist/core/render.js`);
const { geminiImageTokens, GEMINI_TILE_PAGE } = await import(`${ROOT}/dist/core/gemini-model-profiles.js`);
const { factSheetText } = await import(`${ROOT}/dist/core/factsheet.js`);

requireKey();
const N = Number(process.argv[2] || 10);
const ONLY = process.argv[3] || 'all';
const COLS = GEMINI_TILE_PAGE.cols;             // 305
const STYLE = { aa: true };                     // Gemini profile style (matches upstream)
const rnd = (n) => Math.floor(Math.random() * n);
const hex12 = () => Array.from({ length: 12 }, () => '0123456789abcdef'[rnd(16)]).join('');
const fillerRows = (n, tag) => Array.from({ length: n }, (_, i) =>
  `tool[${i}] ${tag}: extract static system + tool defs, reflow at ${80 + (i % 40)} cols, `
  + `render 1-bit PNG when the per-provider billing math wins over native text.`).join('\n');

/** Dense page(s) at our Gemini geometry, filled so page 0 is a full 1533×1152. */
function renderDense(bulk) {
  return renderTextToPngsWithCharLimit(bulk, COLS, GEMINI_TILE_PAGE.charsPerImage, STYLE, 1152);
}
/** Production recipe parts: imaged bulk + verbatim text fact-sheet + question. */
async function recipeParts(bulk, question, { imageOnly = false } = {}) {
  const imgs = await renderDense(bulk);
  const parts = imgs.map((im) => ({ inlineData: { mimeType: 'image/png', data: Buffer.from(im.png).toString('base64') } }));
  if (!imageOnly) parts.push({ text: `Verbatim identifiers extracted from the rendered context:\n${factSheetText(bulk)}` });
  parts.push({ text: question });
  return { parts, pages: imgs.length, dims: `${imgs[0].width}x${imgs[0].height}` };
}

const results = { model: model(), n: N, at: new Date().toISOString(), suites: {} };

// ─── 1. BILLING SWEEP: our formula vs REAL countTokens across geometries ───
async function billing() {
  const rows = [];
  const bulk = fillerRows(700, 'rewrites the request body');
  for (const [maxCh, maxH, label] of [
    [Infinity, 744, 'readable-744'],
    [GEMINI_TILE_PAGE.charsPerImage, 1152, 'dense-1152'],
  ]) {
    const imgs = maxCh === Infinity
      ? await renderTextToPngs(bulk, COLS, STYLE, maxH)
      : await renderTextToPngsWithCharLimit(bulk, COLS, maxCh, STYLE, maxH);
    const p = imgs[0];
    const real = await countImageTokens(Buffer.from(p.png).toString('base64'));
    const pred = geminiImageTokens(p.width, p.height);
    rows.push({ label, w: p.width, h: p.height, formula: pred, real, ratio: +(pred / real).toFixed(3) });
    console.log(`  [billing] ${p.width}x${p.height}  formula=${pred}  real=${real}  (${(pred / real).toFixed(2)}x)`);
  }
  results.suites.billing = rows;
}

// ─── reading helper: run n samples, score with a checker ───
async function readingSuite(name, makeCase, { imageOnly = false, maxOut = 4096 } = {}) {
  let pass = 0; const detail = [];
  for (let i = 0; i < N; i++) {
    const { bulk, question, check } = makeCase(i);
    const { parts, pages, dims } = await recipeParts(bulk, question, { imageOnly });
    let ok = false, said = '', err = null;
    try {
      const r = await generate(parts, { maxOutputTokens: maxOut });
      said = r.text; ok = check(r.text);
    } catch (e) { err = e.message; }
    if (ok) pass++;
    detail.push({ i, ok, said: said.slice(0, 80), err, pages, dims });
    process.stdout.write(ok ? '.' : (err ? 'E' : 'x'));
  }
  console.log(`\n  [${name}] ${pass}/${N}${imageOnly ? ' (image-only control)' : ''}`);
  results.suites[name] = { pass, n: N, imageOnly, detail };
  return pass;
}

// ─── 2. VERBATIM HEX: production recipe vs image-only control ───
function hexCase() {
  const keys = Array.from({ length: 4 }, () => hex12());
  const bulk = `===== CONTEXT SLAB =====\n`
    + keys.map((k, j) => `KEY_${'ABCD'[j]}=${k}`).join('  ') + '\n'
    + fillerRows(600, 'rewrites the request body') + '\n===== END =====';
  const question = 'List the four 12-character hex values (KEY_A..KEY_D). Copy EXACT characters; do not guess.';
  return { bulk, keys, question, check: (t) => keys.every((k) => t.includes(k)) };
}

// ─── 3. NOVEL ARITHMETIC: read two big novel numbers from context, multiply ───
function arithCase() {
  const a = 1000 + rnd(9000), b = 1000 + rnd(9000), ans = a * b;
  const bulk = `===== CONTEXT SLAB =====\nThe base rate is ${a} and the multiplier is ${b}.\n`
    + fillerRows(600, 'processes the ledger') + '\n===== END =====';
  return { bulk, question: `Using the base rate and multiplier stated in the context, compute base × multiplier. Answer with only the number.`,
    check: (t) => t.replace(/[,\s]/g, '').includes(String(ans)) };
}

// ─── 4. GIST RECALL: prose fact (not a factsheet identifier) from the image ───
function gistCase(i) {
  const animals = ['pangolin', 'axolotl', 'narwhal', 'quokka', 'tapir', 'okapi', 'dik-dik', 'serval'];
  const a = animals[i % animals.length];
  const bulk = `===== CONTEXT SLAB =====\n`
    + fillerRows(300, 'rewrites the request body')
    + `\nIMPORTANT: the on-call mascot for this rotation is the ${a}.\n`
    + fillerRows(300, 'processes the ledger') + '\n===== END =====';
  return { bulk, question: 'What animal is named as the on-call mascot for this rotation? One word.',
    check: (t) => t.toLowerCase().includes(a) };
}

// ─── 5. STATE TRACKING: last write wins across a sequence in the image ───
function stateCase() {
  const seq = Array.from({ length: 5 }, () => rnd(1000));
  const lines = seq.map((v, j) => `set counter = ${v}   # step ${j + 1}`).join('\n');
  const bulk = `===== CONTEXT SLAB =====\n${lines}\n`
    + fillerRows(500, 'rewrites the request body') + '\n===== END =====';
  return { bulk, question: 'After all the "set counter" steps in the context, what is the final counter value? Number only.',
    check: (t) => t.replace(/[,\s]/g, '').includes(String(seq[seq.length - 1])) };
}

// ─── 6. NEVER-STATED GUARD: must abstain, not confabulate ───
function noneCase() {
  const bulk = `===== CONTEXT SLAB =====\n`
    + fillerRows(600, 'rewrites the request body') + '\n===== END =====';
  return { bulk, question: 'What is the production database password stated in the context? '
    + 'If it is not present, reply exactly: NOT_STATED. Do not guess.',
    check: (t) => /NOT[_ ]STATED/i.test(t) && !/password\s*[:=]\s*\S{6,}/i.test(t) };
}

// ─── run ───
console.log(`Gemini receipt — model=${model()} N=${N} suite=${ONLY} cols=${COLS} style=${JSON.stringify(STYLE)}`);
if (ONLY === 'all' || ONLY === 'billing') await billing();
if (ONLY === 'all' || ONLY === 'hex') { await readingSuite('hex_prod', hexCase); await readingSuite('hex_imageonly', hexCase, { imageOnly: true }); }
if (ONLY === 'all' || ONLY === 'arith') await readingSuite('arith', arithCase);
if (ONLY === 'all' || ONLY === 'gist') await readingSuite('gist', gistCase);
if (ONLY === 'all' || ONLY === 'state') await readingSuite('state', stateCase);
if (ONLY === 'all' || ONLY === 'nonestated') await readingSuite('none_stated', noneCase);

const out = join(dirname(fileURLToPath(import.meta.url)), 'results', `receipt-${ONLY}-${results.at.replace(/[:.]/g, '-')}.json`);
writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`\nwrote ${out}`);
console.log('SUMMARY', JSON.stringify(Object.fromEntries(Object.entries(results.suites).map(([k, v]) => [k, Array.isArray(v) ? 'sweep' : `${v.pass}/${v.n}`])), null, 0));
