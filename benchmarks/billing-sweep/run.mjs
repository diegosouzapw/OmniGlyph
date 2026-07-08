#!/usr/bin/env node
/**
 * eval/billing-sweep/run.mjs — Anthropic vision-billing sweep via count_tokens.
 *
 * Decides two open questions that set OmniGlyph's page geometry (README "Fase 1"):
 *   1. FORMULA — does the API bill ceil(w/28)×ceil(h/28) patches (current docs)
 *      or the retired w·h/750? Predictions differ by 25-180 tokens per probe.
 *   2. TIER — does claude-fable-5 get the high-resolution caps (2576 px /
 *      4784 visual tokens)? If yes, the old 1928×1928 page is WYSIWYG on
 *      Fable and holds ~3.3× more chars per image than today's 1568×728.
 *
 * count_tokens is free — the sweep costs $0. It must hit the API DIRECTLY,
 * never through the OmniGlyph proxy (which would transform the body).
 *
 * Usage:
 *   pnpm run build                                  # dist/ prerequisite
 *   node eval/billing-sweep/run.mjs --dry-run       # predictions only, no key
 *   ANTHROPIC_API_KEY=sk-... node eval/billing-sweep/run.mjs
 *   ... --models claude-fable-5,claude-sonnet-4-5 --probe-20plus
 *
 * Output: table on stdout + JSONL rows in eval/billing-sweep/results/.
 */

import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { encodeGrayPng, bytesToBase64 } from '../../dist/core/png.js';
import { renderTextToPngs } from '../../dist/core/render.js';
import { GEOMETRIES, predictLegacy750, predictPatchTokens } from './formulas.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const API_VERSION = '2023-06-01';

const { values: args } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    models: { type: 'string', default: 'claude-fable-5,claude-sonnet-4-5' },
    'base-url': { type: 'string', default: 'https://api.anthropic.com' },
    'probe-multi': { type: 'boolean', default: false },
    'probe-20plus': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (args.help) {
  console.log('see header comment: node eval/billing-sweep/run.mjs [--dry-run] [--models csv] [--probe-multi] [--probe-20plus]');
  process.exit(0);
}

/** Deterministic pseudo-glyph fill so pages look like dense text, not flat
 *  color. Content cannot affect billing (only dimensions do) — this just keeps
 *  the probe images honest. LCG instead of Math.random for reproducibility. */
function synthPage(w, h) {
  const px = new Uint8Array(w * h).fill(12);
  let seed = (w * 73856093) ^ (h * 19349663);
  const next = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed);
  for (let cy = 0; cy + 8 <= h; cy += 8) {
    for (let cx = 0; cx + 5 <= w; cx += 5) {
      if (next() % 100 < 55) {
        for (let i = 0; i < 12; i++) {
          const gx = cx + (next() % 4);
          const gy = cy + (next() % 7);
          px[gy * w + gx] = 230;
        }
      }
    }
  }
  return px;
}

function imageBlock(b64) {
  return { type: 'image', source: { type: 'base64', media_type: 'image/png', data: b64 } };
}

function countBody(model, content) {
  return { model, messages: [{ role: 'user', content }] };
}

async function countTokens(model, content, attempt = 1) {
  const res = await fetch(`${args['base-url']}/v1/messages/count_tokens`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify(countBody(model, content)),
  });
  const text = await res.text();
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    await new Promise((r) => setTimeout(r, 2000 * attempt));
    return countTokens(model, content, attempt + 1);
  }
  if (!res.ok) return { error: `${res.status}: ${text.slice(0, 300)}` };
  return { tokens: JSON.parse(text).input_tokens };
}

function predictions(w, h) {
  return {
    patch: {
      standard: predictPatchTokens(w, h, 'standard').tokens,
      highres: predictPatchTokens(w, h, 'highres').tokens,
    },
    legacy750: {
      standard: predictLegacy750(w, h, 'standard').tokens,
      highres: predictLegacy750(w, h, 'highres').tokens,
    },
  };
}

const CANDIDATES = ['patch/standard', 'patch/highres', 'legacy750/standard', 'legacy750/highres'];

function candidateValue(pred, key) {
  const [formula, tier] = key.split('/');
  return pred[formula][tier];
}

async function buildProbes() {
  const probes = [];
  for (const g of GEOMETRIES) {
    const png = await encodeGrayPng(synthPage(g.w, g.h), g.w, g.h);
    probes.push({ ...g, png });
  }
  // Control row: a real pipeline page (dense geometry, real renderer). Fill
  // enough text to reach the full 90-row page → 1568×728, same as synthetic.
  const filler = Array.from({ length: 600 }, (_, i) => `line ${i} const x${i} = fn(${i * 7}); // dense filler`).join('\n');
  const pages = await renderTextToPngs(filler);
  const first = pages[0];
  probes.push({
    label: 'pipeline-real-page',
    w: first.width,
    h: first.height,
    why: 'real renderTextToPngs output — must bill identically to synthetic',
    png: first.png,
  });
  return probes;
}

function fmtRow(cells, widths) {
  return cells.map((c, i) => String(c).padStart(widths[i])).join('  ');
}

async function main() {
  const probes = await buildProbes();
  const models = args.models.split(',').map((s) => s.trim()).filter(Boolean);
  const dry = args['dry-run'];

  if (!dry && !process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set. Run with --dry-run for predictions only.');
    process.exit(1);
  }

  const outDir = join(HERE, 'results');
  const outFile = join(outDir, `sweep-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`);
  if (!dry) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, '');
  }

  const widths = [24, 11, 8, 10, 10, 10, 10, 20];
  console.log(fmtRow(['probe', 'sent', 'meas', 'patch/std', 'patch/hi', '750/std', '750/hi', 'best fit'], widths));

  for (const model of models) {
    console.log(`\n=== ${model} ===`);
    let baseline = null;
    if (!dry) {
      const b = await countTokens(model, [{ type: 'text', text: 'ok' }]);
      if (b.error) {
        console.error(`  baseline failed: ${b.error}`);
        continue;
      }
      baseline = b.tokens;
    }

    const residuals = Object.fromEntries(CANDIDATES.map((c) => [c, []]));
    for (const p of probes) {
      const pred = predictions(p.w, p.h);
      let measured = '-';
      let error;
      if (!dry) {
        const r = await countTokens(model, [imageBlock(bytesToBase64(p.png)), { type: 'text', text: 'ok' }]);
        await new Promise((s) => setTimeout(s, 300));
        if (r.error) error = r.error;
        else measured = r.tokens - baseline;
      }
      let best = '-';
      if (typeof measured === 'number') {
        for (const c of CANDIDATES) residuals[c].push(Math.abs(measured - candidateValue(pred, c)));
        best = CANDIDATES.reduce((a, b) =>
          Math.abs(measured - candidateValue(pred, a)) <= Math.abs(measured - candidateValue(pred, b)) ? a : b,
        );
      }
      console.log(fmtRow(
        [p.label, `${p.w}x${p.h}`, error ? 'ERR' : measured, pred.patch.standard, pred.patch.highres, pred.legacy750.standard, pred.legacy750.highres, error ? error.slice(0, 40) : best],
        widths,
      ));
      if (!dry) {
        appendFileSync(outFile, JSON.stringify({
          ts: new Date().toISOString(), model, label: p.label, w: p.w, h: p.h,
          pngBytes: p.png.length, baseline, measured: error ? null : measured, error, pred,
        }) + '\n');
      }
    }

    if (!dry && residuals[CANDIDATES[0]].length) {
      console.log('\n  mean |residual| per billing hypothesis:');
      const ranked = CANDIDATES
        .map((c) => [c, residuals[c].reduce((a, b) => a + b, 0) / residuals[c].length])
        .sort((a, b) => a[1] - b[1]);
      for (const [c, m] of ranked) console.log(`    ${c.padEnd(20)} ${m.toFixed(1)}`);
      console.log(`  → VERDICT for ${model}: ${ranked[0][0]}`);
    }

    if (!dry && args['probe-multi']) {
      const one = await encodeGrayPng(synthPage(1092, 1092), 1092, 1092);
      const b64 = bytesToBase64(one);
      const r = await countTokens(model, [imageBlock(b64), imageBlock(b64), { type: 'text', text: 'ok' }]);
      console.log(`  probe-multi 2×1092²: ${r.error ?? r.tokens - baseline} (per-image cap expects ≈2×1521)`);
    }

    if (!dry && args['probe-20plus']) {
      const small = bytesToBase64(await encodeGrayPng(synthPage(280, 280), 280, 280));
      const big = bytesToBase64(await encodeGrayPng(synthPage(2100, 2100), 2100, 2100));
      const twentyOne = Array.from({ length: 21 }, () => imageBlock(small));
      const ok = await countTokens(model, [...twentyOne, { type: 'text', text: 'ok' }]);
      const bad = await countTokens(model, [...twentyOne.slice(0, 20), imageBlock(big), { type: 'text', text: 'ok' }]);
      console.log(`  probe-20plus 21×280²: ${ok.error ?? ok.tokens - baseline}`);
      console.log(`  probe-20plus 20×280²+2100²: ${bad.error ?? bad.tokens - baseline} (>2000px/side must reject)`);
    }
  }

  if (!dry) console.log(`\nrows logged to ${outFile}`);
  else console.log('\n(dry-run: predictions only; set ANTHROPIC_API_KEY and drop --dry-run to measure)');
}

await main();
