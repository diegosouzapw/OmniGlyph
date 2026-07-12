/**
 * gen-context-chart.ts — README chart: how many *characters* a frontier context
 * window has held over time, GPT-1 (2018) → Fable 5 (2026), as a line chart on
 * a real year axis, with the omniglyph-imaged point measured live through the
 * render pipeline (no hardcoded density claims).
 *
 *   npx tsx scripts/gen-context-chart.ts
 *
 * Writes docs/assets/context-window-chars.png and prints the data table.
 *
 * Method
 *  - Text points: window tokens × 4 chars/token (the standard English-prose
 *    rule of thumb; token-dense content like code/JSON tokenizes *worse*,
 *    ~2-2.5, so 4 is the generous assumption for the text series).
 *  - omniglyph point: window tokens × measured chars-per-vision-token, computed
 *    by rendering a representative dense fixture (this repo's own docs +
 *    source + JSON) through renderTextToImages and pricing pixels at the
 *    documented Anthropic rate of 750 px/token.
 *
 * Window sizes (announcement-era frontier defaults), with release dates used
 * for x-axis placement:
 *   GPT-1 512 (Jun 2018, Radford et al.) · GPT-2 1,024 (Feb 2019) · GPT-3
 *   2,048 (May 2020, Brown et al.) · GPT-3.5/ChatGPT 4,096 (Nov 2022) · GPT-4
 *   8,192 base (Mar 2023) · Claude 2 100K (Jul 2023) · GPT-4 Turbo 128K (Nov
 *   2023) · Claude 2.1 200K (Nov 2023) · Gemini 1.5 Pro 1M (Feb 2024) ·
 *   GPT-4.1 1,047,576 (Apr 2025) · Fable 5 200K standard, 1M as
 *   claude-fable-5[1m] (2026).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { renderTextToImages } from '../src/core/library.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/assets/context-window-chars.png');

const TEXT_CPT = 4; // chars per text token, prose rule of thumb
const PX_PER_VISION_TOKEN = 750; // Anthropic image pricing: tokens = w*h/750

// ---------------------------------------------------------------------------
// 1. Measure chars-per-vision-token through the real pipeline.
// ---------------------------------------------------------------------------
async function measureDensity(): Promise<number> {
  // Representative token-dense context — the kinds of content omniglyph actually
  // images (markdown docs, TS source, JSON), taken from this repo itself.
  // Literal ↵ sentinels are stripped: these files *document* the sentinel, and
  // reflow() deliberately bails on source that already contains it.
  const fixture = [
    readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'),
    readFileSync(join(ROOT, 'docs/ROADMAP.md'), 'utf8'),
    readFileSync(join(ROOT, 'src/core/library.ts'), 'utf8'),
    readFileSync(join(ROOT, 'package.json'), 'utf8'),
  ]
    .join('\n\n')
    .replaceAll('↵', '');

  const r = await renderTextToImages(fixture, { reflow: true });
  if (r.droppedChars > 0) {
    throw new Error(`fixture dropped ${r.droppedChars} chars — atlas gap, fix before charting`);
  }
  const visionTokens = Math.ceil(r.pixels / PX_PER_VISION_TOKEN);
  const cpt = fixture.length / visionTokens;
  console.log(
    `measured density: ${fixture.length} chars → ${r.pages.length} pages, ` +
      `${r.pixels} px = ${visionTokens} vision tokens → ${cpt.toFixed(2)} chars/vision-token`,
  );
  return cpt;
}

// ---------------------------------------------------------------------------
// 2. Data
// ---------------------------------------------------------------------------
type LabelSide = 'above' | 'below' | 'left' | 'right';

interface Point {
  name: string;
  /** Release date as fractional year — x position. */
  x: number;
  /** Model context window, in tokens. */
  tokens: number;
  chars: number;
  /** Vendor series — each gets its own line. 'omniglyph' is the measured overlay point. */
  kind: 'openai' | 'gemini' | 'claude' | 'omniglyph';
  /** Where to hang the label so the cluttered 2023 cluster stays readable. */
  label: LabelSide;
  /** Extra vertical label offset (px) — staggers the linear-scale floor pileup. */
  dy?: number;
}

function points(imageCpt: number): Point[] {
  const t = (
    kind: Point['kind'],
    name: string,
    x: number,
    tokens: number,
    label: LabelSide,
    dy?: number,
  ): Point => ({ name, x, tokens, chars: tokens * TEXT_CPT, kind, label, dy });
  return [
    t('openai', 'GPT-1', 2018.45, 512, 'above'),
    t('openai', 'GPT-2', 2019.12, 1_024, 'above', -36),
    t('openai', 'GPT-3', 2020.4, 2_048, 'above'),
    t('openai', 'GPT-3.5', 2022.91, 4_096, 'above', -36),
    t('openai', 'GPT-4', 2023.2, 8_192, 'right'),
    t('claude', 'Claude 2', 2023.53, 100_000, 'left', -14),
    t('openai', 'GPT-4 Turbo', 2023.85, 128_000, 'right', -26),
    t('claude', 'Claude 2.1', 2023.89, 200_000, 'above', -30),
    t('gemini', 'Gemini 1.0 Pro', 2023.93, 32_768, 'right', 4),
    // Feb '24: 128K standard / 1M limited preview; 1M GA May 23, 2024; 2M opened
    // to all developers June 27, 2024 — plotted at its 2M peak. The 2M window
    // retired with 1.5's deprecation (2.5 Pro shipped 1M), so the line dips.
    t('gemini', 'Gemini 1.5 Pro', 2024.49, 2_097_152, 'left'),
    t('openai', 'GPT-4.1', 2025.28, 1_047_576, 'below'),
    // Gemini 2.5 Pro: 1M window, GA at Google I/O May 20, 2025
    t('gemini', 'Gemini 2.5 Pro', 2025.38, 1_000_000, 'above'),
    // Sonnet 4: 1M public beta (Tier 4) Aug 12, 2025 — Anthropic's first 1M;
    // beta retired Apr 30, 2026 as 1M became standard on newer models
    t('claude', 'Sonnet 4 [1m]', 2025.61, 1_000_000, 'below', 36),
    // GPT-5.6 (Sol/Terra/Luna): GA July 9, 2026 — API docs list 1.05M ctx (1.5M was a pre-launch leak)
    t('openai', 'GPT-5.6', 2026.52, 1_050_000, 'right'),
    // the model powering this session: claude-fable-5[1m], 1M-token window
    t('claude', 'Fable 5 [1m]', 2026.05, 1_000_000, 'below'),
    {
      name: 'Fable 5 [1m] + OmniGlyph',
      x: 2026.05,
      tokens: 1_000_000,
      chars: Math.round(1_000_000 * imageCpt),
      kind: 'omniglyph',
      label: 'above',
    },
  ];
}

const fmt = (v: number): string =>
  v >= 1e6
    ? `${+(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M`
    : v >= 1e3
      ? `${+(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K`
      : String(v);

/** Token windows read best in power-of-two units: 4,096 → "4K", 1,047,576 → "1M". */
const fmtTok = (t: number): string =>
  t >= 1e6
    ? `${Math.round(t / 1e6)}M`
    : t >= 1024
      ? t % 1024 === 0 && t < 10_000
        ? `${t / 1024}K`
        : `${Math.round(t / 1e3)}K`
      : String(t);

// ---------------------------------------------------------------------------
// 3. Draw
// ---------------------------------------------------------------------------
function draw(data: Point[], imageCpt: number): Buffer {
  const S = 2; // supersample for crisp README rendering
  const W = 1180 * S;
  const H = 1000 * S;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);

  const bg = '#0d1117';
  const grid = '#21262d';
  const axis = '#8b949e';
  const ink = '#e6edf3';
  const dim = '#8b949e';
  const colors: Record<Point['kind'], string> = {
    openai: '#10a37f',
    gemini: '#a371f7',
    claude: '#58a6ff',
    omniglyph: '#f0883e',
  };

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1180, 1000);

  // Title block
  ctx.fillStyle = ink;
  ctx.font = '600 24px sans-serif';
  ctx.fillText('Characters a frontier context window holds', 36, 44);
  ctx.fillStyle = dim;
  ctx.font = '400 14px sans-serif';
  ctx.fillText(
    `each point: model · context window (tokens) → characters it holds · text at ~${TEXT_CPT} chars/token · ` +
      `OmniGlyph measured at ${imageCpt.toFixed(1)} chars/vision-token (px ÷ ${PX_PER_VISION_TOKEN})`,
    36,
    68,
  );

  // Plot area
  const left = 76;
  const right = 1180 - 36;
  const top = 100;
  const bottom = 1000 - 72;
  // Linear scale — log gave every decade equal height, which flattened the whole
  // point of the chart: 18M must physically tower ~4.5× over the 4M pack.
  const Y_MAX = 20_000_000;
  const X_MIN = 2018;
  const X_MAX = 2027.25;
  const y = (v: number) => bottom - (v / Y_MAX) * (bottom - top);
  const x = (v: number) => left + ((v - X_MIN) / (X_MAX - X_MIN)) * (right - left);

  // Horizontal gridlines + y labels (every 2M — 18M lands exactly on a line)
  ctx.font = '400 13px sans-serif';
  for (let v = 0; v <= Y_MAX; v += 2_000_000) {
    const gy = y(v);
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, gy);
    ctx.lineTo(right, gy);
    ctx.stroke();
    ctx.fillStyle = axis;
    ctx.textAlign = 'right';
    ctx.fillText(fmt(v), left - 10, gy + 4);
  }

  // Vertical year gridlines + x labels
  ctx.textAlign = 'center';
  for (let yr = 2018; yr <= 2026; yr++) {
    const gx = x(yr);
    ctx.strokeStyle = grid;
    ctx.beginPath();
    ctx.moveTo(gx, top);
    ctx.lineTo(gx, bottom);
    ctx.stroke();
    ctx.fillStyle = axis;
    ctx.fillText(String(yr), gx, bottom + 24);
  }

  // Axis titles
  ctx.save();
  ctx.translate(20, (top + bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = axis;
  ctx.fillText('characters (linear scale)', 0, 0);
  ctx.restore();
  ctx.fillStyle = axis;
  ctx.fillText('release year', (left + right) / 2, 1000 - 40);

  // One line per vendor series (chronological within each series)
  for (const vendor of ['openai', 'gemini', 'claude'] as const) {
    const pts = data.filter((p) => p.kind === vendor);
    ctx.strokeStyle = colors[vendor];
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(x(p.x), y(p.chars));
      else ctx.lineTo(x(p.x), y(p.chars));
    });
    ctx.stroke();
  }

  // Dashed connector: Fable 5 text → Fable 5 + omniglyph (same window, imaged)
  const fable = data.find((p) => p.name === 'Fable 5 [1m]')!;
  const px = data.find((p) => p.kind === 'omniglyph')!;
  ctx.strokeStyle = colors.omniglyph;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x(fable.x), y(fable.chars) - 7);
  ctx.lineTo(x(px.x), y(px.chars) + 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'left';
  const annLine1 = `${(px.chars / fable.chars).toFixed(1)}×`;
  const annLine2 = 'same window, imaged';
  const annX = x(px.x) + 12;
  const annY = (y(fable.chars) + y(px.chars)) / 2 + 4;
  // bg-colored glyph halo so crossing lines never obscure the annotation;
  // two short lines on the RIGHT of the connector — the left side now belongs
  // to Gemini 2.5 Pro's label, and GPT-5.6's label sits well below these rows
  ctx.lineJoin = 'round';
  ctx.strokeStyle = bg;
  ctx.lineWidth = 5;
  ctx.font = '700 15px sans-serif';
  ctx.strokeText(annLine1, annX, annY - 9);
  ctx.fillStyle = colors.omniglyph;
  ctx.fillText(annLine1, annX, annY - 9);
  ctx.font = '600 12px sans-serif';
  ctx.strokeText(annLine2, annX, annY + 9);
  ctx.fillText(annLine2, annX, annY + 9);

  // Points + labels
  for (const p of data) {
    const cx = x(p.x);
    const cy = y(p.chars);
    const emphasized = p.kind === 'omniglyph' || p.name === 'Fable 5 [1m]';
    ctx.beginPath();
    ctx.arc(cx, cy, emphasized ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fillStyle = colors[p.kind];
    ctx.fill();

    const line1 = p.name;
    // no " tok" — the subtitle defines the pattern, and the ~4M band is crowded
    const line2 = `${fmtTok(p.tokens)} → ${fmt(p.chars)} chars`;
    const nameColor = colors[p.kind];
    let lx = cx;
    let ly1: number;
    let align: CanvasTextAlign = 'center';
    switch (p.label) {
      case 'above':
        ly1 = cy - 28;
        break;
      case 'below':
        ly1 = cy + 22;
        break;
      case 'left':
        lx = cx - 12;
        ly1 = cy - 3;
        align = 'right';
        break;
      case 'right':
        lx = cx + 12;
        ly1 = cy - 3;
        align = 'left';
        break;
    }
    ly1 += p.dy ?? 0;
    ctx.textAlign = align;

    // bg-colored glyph halo so crossing series lines never strike through text,
    // without erasing whole rectangles out of neighboring lines/labels
    ctx.lineJoin = 'round';
    ctx.strokeStyle = bg;
    ctx.lineWidth = 5;
    ctx.font = emphasized ? '700 14px sans-serif' : '600 13px sans-serif';
    ctx.strokeText(line1, lx, ly1);
    ctx.fillStyle = nameColor;
    ctx.fillText(line1, lx, ly1);
    ctx.font = '400 12px sans-serif';
    ctx.strokeText(line2, lx, ly1 + 15);
    ctx.fillStyle = dim;
    ctx.fillText(line2, lx, ly1 + 15);
  }
  ctx.textAlign = 'left';

  // Legend (upper-left of plot — the lines hug the bottom there)
  const legend: Array<[string, string]> = [
    [colors.openai, `OpenAI · GPT — plain text @ ~${TEXT_CPT} chars/token`],
    [colors.gemini, 'Google · Gemini'],
    [colors.claude, 'Anthropic · Claude → Fable'],
    [colors.omniglyph, 'Fable 5 [1m] · same 1M window · OmniGlyph images (measured)'],
  ];
  ctx.font = '400 13px sans-serif';
  let ly = top + 20;
  for (const [c, label] of legend) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(left + 22, ly - 4, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.fillText(label, left + 36, ly);
    ly += 22;
  }

  // Footnote
  ctx.fillStyle = '#484f58';
  ctx.font = '400 12px sans-serif';
  ctx.fillText(
    `same ratio at any size: a standard 200K Fable 5 window × OmniGlyph ≈ ${fmt(Math.round(200_000 * imageCpt))} chars (vs 800K as text). Regenerate: npx tsx scripts/gen-context-chart.ts`,
    36,
    1000 - 14,
  );

  return canvas.toBuffer('image/png');
}

// ---------------------------------------------------------------------------
const imageCpt = await measureDensity();
const data = points(imageCpt);

console.log('\n  model                released   window (tokens)   chars in window');
for (const p of data) {
  console.log(
    `  ${p.name.padEnd(20)} ${String(Math.floor(p.x)).padEnd(10)} ${fmtTok(p.tokens).padStart(6)}            ${fmt(p.chars).padStart(6)}`,
  );
}
const fable = data.find((p) => p.name === 'Fable 5 [1m]')!;
const px = data.find((p) => p.kind === 'omniglyph')!;
console.log(
  `\n  OmniGlyph multiplier on the same window (any size): ${(px.chars / fable.chars).toFixed(2)}×`,
);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, draw(data, imageCpt));
console.log(`\nwrote ${OUT}`);
