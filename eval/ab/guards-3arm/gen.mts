/**
 * 3-arm guard eval generator (task: do IDS rows earn their ~290 image tokens/block
 * on the Fable path, on top of the text fact sheet?).
 *
 * Arms (rendered here; queried by run.sh):
 *   A  = production: PNG rendered from appendIdsBlock(text), fact sheet in prompt
 *   B  = fact-sheet only: plain PNG, fact sheet in prompt
 *   C  = none: plain PNG, no fact sheet
 *
 * Corpus: synthetic session-log JSONL (12-hex ids + unique dur_ms), 2 pages,
 * each < DENSE_CONTENT_CHARS_PER_IMAGE so one PNG per page. Query mirrors
 * eval/verbatim-15: "which id has dur_ms=X" — association must come from the
 * image; guards can only help as exact-spelling correction, which is exactly
 * the mechanism under test.
 *
 * Strata per page (4 golds sampled from each):
 *   ids+sheet  — id is in the in-image IDS block (and therefore in the sheet)
 *   sheet-only — id is in the 96-token fact sheet but not the 16-row IDS block
 *
 * No "uncovered" stratum: Fable dense pages cap at 91 rows (728px / 8px cells), so a
 * single-image block holds ≤91 log lines and the 96-token sheet budget covers every id
 * in it. Uncovered ids only exist on multi-image blocks (one sheet per block, >96 ids).
 * Body is capped at 72 lines/page so arm A (body + 17 IDS rows) stays single-image.
 *
 * Known confound (noted, accepted): tier-0 ranking is length-desc then lexical-asc,
 * so strata correlate with leading hex chars. The decision-relevant contrast
 * (A vs B, paired per trial) is unaffected — same golds, same strata.
 *
 * Deterministic: seeded PRNG, no Date/random in emitted content.
 * Run: npx tsx eval/ab/guards-3arm/gen.mts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendIdsBlock,
  extractFactSheetEntries,
  factSheetText,
} from '../../../src/core/factsheet.js';
import {
  DENSE_CONTENT_CHARS_PER_IMAGE,
  DENSE_CONTENT_COLS,
  DENSE_RENDER_STYLE,
  renderTextToPngsWithCharLimit,
  shrinkColsToContent,
} from '../../../src/core/render.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'work');

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x3a7f00d);
const randInt = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const HEX = '0123456789abcdef';
/** 12-hex id guaranteed to contain ≥1 digit (extraction pattern requires it). */
function id12(): string {
  for (;;) {
    let s = '';
    for (let i = 0; i < 12; i++) s += HEX[Math.floor(rnd() * 16)];
    if (/\d/.test(s)) return s;
  }
}
function shuffle<T>(xs: T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const OPS = ['render', 'upload', 'fetch', 'decode', 'verify', 'commit', 'snap', 'probe', 'merge', 'flush'];
const PAGES = 3;
const LINES_PER_PAGE = 72; // 72 body + 17 IDS rows ≤ 91-row page → arm A stays single-image
const GOLDS_PER_STRATUM = 4;

interface Rec { page: number; id: string; dur: number }
const durs = new Set<number>();
function uniqDur(): number {
  for (;;) {
    const d = randInt(500, 9499);
    if (!durs.has(d)) { durs.add(d); return d; }
  }
}

const trials: Array<{ i: number; page: number; stratum: string; dur: number; gold: string }> = [];
const meta: Record<string, unknown>[] = [];

for (let page = 0; page < PAGES; page++) {
  const recs: Rec[] = [];
  const lines: string[] = [];
  let secs = 4 * 3600 + page * 1200;
  for (let n = 0; n < LINES_PER_PAGE; n++) {
    const id = id12();
    const dur = uniqDur();
    secs += randInt(1, 9);
    const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
    const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    const ms = String(randInt(0, 999)).padStart(3, '0');
    const line =
      `{"ts": "2026-07-12T${hh}:${mm}:${ss}.${ms}Z", "id": "${id}", "op": "${OPS[randInt(0, OPS.length - 1)]}", ` +
      `"dur_ms": ${dur}, "ok": ${rnd() < 0.9}, "lane": ${randInt(1, 8)}, "bytes": ${randInt(1000, 99999)}}`;
    lines.push(line);
    recs.push({ page, id, dur });
  }
  const pageText = lines.join('\n');

  // Guard sets, computed with the real production code paths.
  const armAText = appendIdsBlock(pageText);
  const idsIdx = armAText.indexOf('\nIDS\n');
  if (idsIdx < 0) throw new Error(`page ${page}: appendIdsBlock added no IDS block`);
  const idsTokens = new Set(
    armAText.slice(idsIdx + 5).trim().split('\n').map((l) => l.trim().split(/\s+/).pop()!),
  );
  const sheetTokens = new Set(extractFactSheetEntries(pageText).map((e) => e.token));
  for (const t of idsTokens) {
    if (!sheetTokens.has(t)) console.warn(`page ${page}: IDS token not in sheet (unexpected): ${t}`);
  }
  const sheet = factSheetText(pageText);

  // Strata.
  const s1 = recs.filter((r) => idsTokens.has(r.id));
  const s2 = recs.filter((r) => sheetTokens.has(r.id) && !idsTokens.has(r.id));
  const s3 = recs.filter((r) => !sheetTokens.has(r.id));
  for (const [name, pool] of [['ids+sheet', s1], ['sheet-only', s2], ['uncovered', s3]] as const) {
    for (const r of shuffle(pool).slice(0, GOLDS_PER_STRATUM)) {
      trials.push({ i: trials.length, page, stratum: name, dur: r.dur, gold: r.id });
    }
  }

  // Render both variants with the exact production dense single-col path
  // (transform.ts:1362 minus/plus the appendIdsBlock wrap).
  const renderOne = async (text: string, file: string) => {
    const imgs = await renderTextToPngsWithCharLimit(
      text,
      shrinkColsToContent(text, DENSE_CONTENT_COLS),
      DENSE_CONTENT_CHARS_PER_IMAGE,
      DENSE_RENDER_STYLE,
    );
    if (imgs.length !== 1) throw new Error(`${file}: expected 1 png, got ${imgs.length}`);
    writeFileSync(join(OUT, file), imgs[0].png);
    return { w: imgs[0].width, h: imgs[0].height };
  };
  const dimA = await renderOne(armAText, `pageA${page}.png`);
  const dimP = await renderOne(pageText, `pageP${page}.png`);

  writeFileSync(join(OUT, `factsheet${page}.txt`), sheet);
  writeFileSync(join(OUT, `corpus${page}.txt`), pageText);
  meta.push({
    page,
    lines: lines.length,
    chars: pageText.length,
    idsTokens: [...idsTokens],
    idsHexCount: [...idsTokens].filter((t) => /^[0-9a-f]{12}$/.test(t)).length,
    sheetTokenCount: sheetTokens.size,
    sheetHexCount: [...sheetTokens].filter((t) => /^[0-9a-f]{12}$/.test(t)).length,
    sheetChars: sheet.length,
    strata: { 'ids+sheet': s1.length, 'sheet-only': s2.length, uncovered: s3.length },
    dims: { A: dimA, P: dimP },
  });
}

writeFileSync(join(OUT, 'trials.json'), JSON.stringify(trials, null, 1));
writeFileSync(join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
console.log(JSON.stringify(meta, null, 1));
console.log(`trials: ${trials.length}`);
