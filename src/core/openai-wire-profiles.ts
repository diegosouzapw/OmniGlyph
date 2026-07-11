/**
 * Per-model OpenAI-wire rendering + vision-cost profiles.
 *
 * One place to retune when a new model ships with different image tokenization,
 * a different downscale threshold (max safe portrait-strip width), or a different
 * max image height. Numbers audited 2026-07-05 against the official
 * developers.openai.com images-vision guide ("Model sizing behavior" +
 * "Calculating costs" tables) — see docs/ROADMAP.md Phase 1 (D1-D5).
 *
 * Retune without a code change via the OMNIGLYPH_MODEL_PROFILES env var (JSON
 * map of model-id PREFIX -> partial profile; longest matching prefix wins,
 * checked BEFORE the built-in table). Partial fields fall back to the built-in
 * match, so you can override just one knob:
 *
 *   OMNIGLYPH_MODEL_PROFILES='{"gpt-5.6":{"vision":{"regime":"patch","multiplier":1,"patchCap":12000},"stripCols":200,"maxHeightPx":2400}}'
 *   OMNIGLYPH_MODEL_PROFILES='{"gpt-5.6":{"stripCols":176}}'   # widen only
 *
 * The legacy OMNIGLYPH_GPT_PROFILES name is still accepted (falls back when
 * OMNIGLYPH_MODEL_PROFILES is unset) so existing deployments keep working.
 */

import type { RenderStyle } from './render.js';

/**
 * OpenAI-wire strip heights, DECOUPLED from render.ts's Anthropic geometry.
 * OpenAI's tile regime resizes to fit 2048×2048 then shortest side → 768; the
 * patch regime shrinks only past the patch budget / 2048 px dimension cap.
 * 2048 px aligns EXACTLY with both billing grids (4×512 tiles; 64×32 patches),
 * so tile/flagship pages get 15 free rows vs the old 1932. Cap-1536 patch
 * models page at 1920 (60×32 = 1440 patches) to keep slack under the budget
 * instead of sitting exactly on it.
 */
export const WIRE_MAX_HEIGHT_PX = 2048;
const H_CAP1536 = 1920;

/** Image-token cost model (mirrors OpenAI's mandatory pre-tokenize resize). */
export type VisionCost =
  | { regime: 'tile'; base: number; perTile: number }
  | { regime: 'patch'; multiplier: number; patchCap: number };

export interface ModelProfile {
  /** How OpenAI bills the rendered images as input tokens. */
  vision: VisionCost;
  /** Max portrait-strip width in COLUMNS before the API downscales (destroying
   *  5px glyphs). 152 cols x 5px + 8px pad = 768px = OpenAI's shortest-side floor. */
  stripCols: number;
  /** Max rendered image height in px. Threaded into the renderer so the gate's
   *  cost estimate and the actual page split agree. */
  maxHeightPx: number;
  /** `detail` sent on every emitted image part. `original` (10k-patch/6000px
   *  budget) exists only on gpt-5.4+ flagships — sending it elsewhere is out of
   *  contract (audit D5). Everything else gets `high`. */
  detail: 'original' | 'high';
  /** Optional per-model render style (glyph cell padding, grid, marker). Absent
   *  for GPT/o-series (they render at the default 5×8 cell); set only for models
   *  that measured better at a denser cell (e.g. Grok's effective 9×12). */
  style?: RenderStyle;
}

/** Default downscale-safe strip width (768px). Exported as the global cols default. */
export const DEFAULT_STRIP_COLS = 152;

const C = DEFAULT_STRIP_COLS;
const H = WIRE_MAX_HEIGHT_PX;

/**
 * Conservative fallback for unrecognized models: tile 85/170 over-states cost,
 * which biases the gate toward pass-through (safe). Matches gpt-4o/4.1/4.5.
 */
export const DEFAULT_MODEL_PROFILE: ModelProfile = {
  vision: { regime: 'tile', base: 85, perTile: 170 },
  stripCols: C,
  maxHeightPx: H,
  detail: 'high',
};

interface ProfileRule {
  test: (m: string) => boolean;
  profile: ModelProfile;
}

/** True for the patch-billed mini/nano family (o4-mini has its own 1.72 rule). */
const isMiniNanoPatch = (m: string): boolean =>
  /^(?:gpt-5(?:\.\d+)?|gpt-4\.1)-(?:mini|nano)/.test(m);

/**
 * Built-in profiles, evaluated in order (first match wins). Doc buckets
 * (2026-07-05): flagship patch (5.4/5.5, original, cap 10000) · patch 1536
 * (minis/nanos, 5.1/5.2/5.3 + codex variants, o4-mini) · tile (4o/4.1/4.5,
 * gpt-5/gpt-5-chat-latest, o-series exceto o4-mini).
 */
const BUILTIN_RULES: ProfileRule[] = [
  // nano patch models: ceil(patches * 2.46), cap 1536
  {
    test: (m) => isMiniNanoPatch(m) && /nano/.test(m),
    profile: { vision: { regime: 'patch', multiplier: 2.46, patchCap: 1536 }, stripCols: C, maxHeightPx: H_CAP1536, detail: 'high' },
  },
  // mini patch models: ceil(patches * 1.62), cap 1536
  {
    test: (m) => isMiniNanoPatch(m) && !/nano/.test(m),
    profile: { vision: { regime: 'patch', multiplier: 1.62, patchCap: 1536 }, stripCols: C, maxHeightPx: H_CAP1536, detail: 'high' },
  },
  // o4-mini: documented multiplier 1.72 (audit D1 — was lumped with the 1.62 minis)
  {
    test: (m) => /^o4-mini/.test(m),
    profile: { vision: { regime: 'patch', multiplier: 1.72, patchCap: 1536 }, stripCols: C, maxHeightPx: H_CAP1536, detail: 'high' },
  },
  // codex-mini variants (gpt-5-codex-mini, gpt-5.1-codex-mini): doc bucket patch
  // 1536 (audit D4 — gpt-5-codex-mini previously fell to the gpt-5 tile rule).
  // Multiplier undocumented; 1.62 assumed like the other minis (conservative).
  {
    test: (m) => /^gpt-5(?:\.\d+)?-codex-mini/.test(m),
    profile: { vision: { regime: 'patch', multiplier: 1.62, patchCap: 1536 }, stripCols: C, maxHeightPx: H_CAP1536, detail: 'high' },
  },
  // gpt-4o-mini: documented tile 2833/5667 (audit D2 — previously fell to the
  // 85/170 default, under-stating cost ~33× and INVERTING the gate; imaging on
  // 4o-mini is always a loss and must never pass).
  {
    test: (m) => /^gpt-4o-mini/.test(m),
    profile: { vision: { regime: 'tile', base: 2833, perTile: 5667 }, stripCols: C, maxHeightPx: H, detail: 'high' },
  },
  // gpt-5.6 flagship — EXPLICIT slot so the day-one retune is one line (or one env
  // var). Assumed flagship-class (original/10000) until the real numbers land.
  {
    test: (m) => /^gpt-5\.6/.test(m),
    profile: { vision: { regime: 'patch', multiplier: 1, patchCap: 10000 }, stripCols: C, maxHeightPx: H, detail: 'original' },
  },
  // Flagship patch bucket per doc: gpt-5.4 / gpt-5.5 — detail original (10k/6000px)
  {
    test: (m) => /^gpt-5\.[45]/.test(m),
    profile: { vision: { regime: 'patch', multiplier: 1, patchCap: 10000 }, stripCols: C, maxHeightPx: H, detail: 'original' },
  },
  // Remaining 5.x point releases (5.1/5.2/5.3 incl. -codex/-chat-latest): doc
  // bucket patch cap 1536 SEM original (audit D3 — previously assumed 10000).
  // Multiplier not listed in the doc table; 1.0 assumed.
  {
    test: (m) => /^gpt-5\.\d/.test(m),
    profile: { vision: { regime: 'patch', multiplier: 1, patchCap: 1536 }, stripCols: C, maxHeightPx: H_CAP1536, detail: 'high' },
  },
  // gpt-5 / gpt-5-chat-latest: tile 70/140
  {
    test: (m) => /^gpt-5/.test(m),
    profile: { vision: { regime: 'tile', base: 70, perTile: 140 }, stripCols: C, maxHeightPx: H, detail: 'high' },
  },
  // o1 / o3 reasoning: tile 75/150
  {
    test: (m) => /^o[13]/.test(m),
    profile: { vision: { regime: 'tile', base: 75, perTile: 150 }, stripCols: C, maxHeightPx: H, detail: 'high' },
  },
  // Grok (Responses path), opt-in only. Live climb 2026-07-09 on grok-4.5: 5×8
  // and 7×10 confabulate exact IDs; effective 9×12 (Spleen 5×8 + 4px spacing) is
  // the densest arm that reached 4/4 exact, 0 confab. The verbatim fact-sheet
  // rides beside the images as defense in depth. Vision numbers here are a
  // conservative placeholder — visionTokensForModel prices Grok by pixels.
  {
    test: (m) => /^grok-/.test(m),
    profile: {
      vision: { regime: 'tile', base: 85, perTile: 170 },
      stripCols: 84,
      maxHeightPx: H,
      detail: 'high',
      style: { cellWBonus: 4, cellHBonus: 4 },
    },
  },
];

function resolveBuiltin(m: string): ModelProfile {
  for (const rule of BUILTIN_RULES) if (rule.test(m)) return rule.profile;
  return DEFAULT_MODEL_PROFILE;
}

// --- env override (OMNIGLYPH_GPT_PROFILES) ----------------------------------
// Parsed lazily and memoized on the raw env string so tests can mutate
// process.env and have it re-read, without re-parsing on every hot-path call.

let envRaw: string | null = null;
let envMap: Map<string, ModelProfile> = new Map();

function isValidVision(v: unknown): v is VisionCost {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (o.regime === 'tile') return Number.isFinite(o.base) && Number.isFinite(o.perTile);
  if (o.regime === 'patch') return Number.isFinite(o.multiplier) && Number.isFinite(o.patchCap);
  return false;
}

function posInt(v: unknown, fallback: number): number {
  return Number.isFinite(v) && (v as number) > 0 ? Math.floor(v as number) : fallback;
}

function validDetail(v: unknown, fallback: 'original' | 'high'): 'original' | 'high' {
  return v === 'original' || v === 'high' ? v : fallback;
}

function parseEnvProfiles(raw: string): Map<string, ModelProfile> {
  const out = new Map<string, ModelProfile>();
  if (!raw) return out;
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    return out; // malformed env never throws — fall back to built-ins
  }
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const key = k.toLowerCase();
    const base = resolveBuiltin(key); // partial fields fall back to the built-in match
    const p = v as Partial<ModelProfile>;
    out.set(key, {
      vision: isValidVision(p.vision) ? p.vision : base.vision,
      stripCols: posInt(p.stripCols, base.stripCols),
      maxHeightPx: posInt(p.maxHeightPx, base.maxHeightPx),
      detail: validDetail(p.detail, base.detail),
      style: p.style ?? base.style,
    });
  }
  return out;
}

function envProfiles(): Map<string, ModelProfile> {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const raw = (env && (env.OMNIGLYPH_MODEL_PROFILES || env.OMNIGLYPH_GPT_PROFILES)) || '';
  if (raw !== envRaw) {
    envRaw = raw;
    envMap = parseEnvProfiles(raw);
  }
  return envMap;
}

/**
 * Resolve the full rendering + vision-cost profile for a model id. Env overrides
 * (longest matching prefix) win over the built-in table; unknown models get the
 * conservative `DEFAULT_MODEL_PROFILE`.
 */
export function resolveModelProfile(model: string | null | undefined): ModelProfile {
  const m = (model ?? '').toLowerCase();
  const env = envProfiles();
  if (env.size > 0) {
    let best: ModelProfile | undefined;
    let bestLen = -1;
    for (const [k, p] of env) {
      if (m.startsWith(k) && k.length > bestLen) {
        best = p;
        bestLen = k.length;
      }
    }
    if (best) return best;
  }
  return resolveBuiltin(m);
}
