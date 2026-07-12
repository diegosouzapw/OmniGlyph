/** Applicability helpers for OmniGlyph's production-safe model scope. */

export type OmniGlyphApplicabilityReason =
  | 'eligible'
  | 'unsupported_model'
  | 'unsupported_method'
  | 'unsupported_path'
  | 'empty_body'
  | 'model_unverified';

export interface OmniGlyphApplicabilityInput {
  readonly model?: string | null;
  readonly method?: string | null;
  readonly path?: string | null;
  readonly bodyBytes?: number | null;
}

/** Strip bracketed variant tags (e.g. `[1m]`) before model matching so base and
 *  variant gate identically. Linear scan — model ids come from client requests. */
export function stripVariantTags(model: string): string {
  if (!model.includes('[')) return model;
  let out = '';
  let i = 0;
  while (i < model.length) {
    const open = model.indexOf('[', i);
    if (open === -1) { out += model.slice(i); break; }
    const close = model.indexOf(']', open + 1);
    if (close === -1) { out += model.slice(i); break; }
    out += model.slice(i, open);
    i = close + 1;
  }
  return out;
}

function baseModelId(model: string): string {
  return stripVariantTags(model);
}

/** Dashboard runtime override; null = fall back to OMNIGLYPH_MODELS env / built-in default. In-memory only. */
let runtimeModelBases: readonly string[] | null = null;

/** Built-in default scope when OMNIGLYPH_MODELS is unset: Fable 5 (Claude) plus
 *  GPT 5.6. GPT 5.5 and Opus 4.8 are intentionally off — same pipeline but
 *  measurably worse at reading imaged content (FINDINGS.md 2026-06-16: Opus 4.8
 *  ~2pp arithmetic, 6/15 dense-hex recall vs Fable's 100/100; GPT 5.5 likewise
 *  degrades on imaged history/context) — so silently imaging them is the wrong
 *  default. Both stay opt-in via the dashboard chips or OMNIGLYPH_MODELS. */
const DEFAULT_MODEL_BASES = ['claude-fable-5', 'gpt-5.6'];

function falsey(v: string): boolean {
  return /^(0|false|no|off|none)$/i.test(v.trim());
}

/** OMNIGLYPH_MODELS env / built-in default, ignoring the runtime override. One CSV
 *  controls every family (Claude + GPT). Resolution (read per-call so scope flips LIVE):
 *  - unset or empty        → built-in default (Fable 5 + GPT 5.6)
 *  - `off`/`0`/`false`/... → compress nothing
 *  - CSV of model bases    → exactly those families (e.g. `claude-fable-5,gpt-5.6`) */
function envOrDefaultBases(): string[] {
  // Edge-safe: `process` is undefined off-Node; `typeof` avoids a ReferenceError.
  const raw = typeof process !== 'undefined' ? process.env?.OMNIGLYPH_MODELS : undefined;
  if (raw === undefined) return [...DEFAULT_MODEL_BASES];
  const trimmed = raw.trim();
  if (!trimmed) return [...DEFAULT_MODEL_BASES];
  if (falsey(trimmed)) return [];
  return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
}

function allowedModelBases(): string[] {
  if (runtimeModelBases !== null) return [...runtimeModelBases];
  return envOrDefaultBases();
}

/** Current effective allowed-model scope (Claude + GPT). */
export function getAllowedModelBases(): string[] {
  return allowedModelBases();
}

/** OMNIGLYPH_MODELS env / default scope, independent of runtime override.
 *  Dashboard unions this into its chip set so env-enabled models are always shown as toggles. */
export function getConfiguredModelBases(): string[] {
  return envOrDefaultBases();
}

/** Set the dashboard runtime override. Empty array = compress nothing; null = clear override. Not persisted. */
export function setAllowedModelBases(list: readonly string[] | null): void {
  runtimeModelBases = list === null ? null : list.map((s) => s.trim()).filter(Boolean);
}

/** Membership test against the single allowed scope. Matches exact base or `-suffix`
 *  alias; [variant] tags stripped first. */
function isAllowed(model: string | null | undefined): boolean {
  if (typeof model !== 'string') return false;
  const base = baseModelId(model);
  return allowedModelBases().some((b) => base === b || base.startsWith(`${b}-`));
}

/** True when OmniGlyph may transform this Anthropic model. */
export function isOmniGlyphSupportedModel(model: string | null | undefined): boolean {
  return isAllowed(model);
}

/** True when OmniGlyph may transform this GPT model. Shares the single OMNIGLYPH_MODELS scope. */
export function isOmniGlyphSupportedGptModel(model: string | null | undefined): boolean {
  return isAllowed(model);
}

/** Canonical set of Anthropic Messages routes OmniGlyph transforms. Shared with
 *  createProxy (src/core/proxy.ts) so the public applicability helper and the
 *  proxy router can never disagree on which paths are eligible — they did: the
 *  proxy accepts /anthropic/messages, but the helper's old `endsWith` check
 *  rejected it (and would have wrongly accepted /foo/v1/messages). Exact matches
 *  only, so /v1/messages/count_tokens stays unsupported. */
export function isAnthropicMessagesPath(pathname: string): boolean {
  return pathname === '/v1/messages'
    || pathname === '/anthropic/v1/messages'
    || pathname === '/anthropic/messages';
}

/** Bases that pass reading only on upstream's evidence, not OmniGlyph's own.
 *  Grok 4.5 upstream: 5×8 white packing + the in-image IDS block reads exact
 *  IDs (7/7 retest), but pure-image is still not Fable-level and the full
 *  quality suite is incomplete — synthetic fixtures only. Fail-closed: these
 *  bases may be opted into OMNIGLYPH_MODELS, but stay text-only until an
 *  operator explicitly acks the risk (OMNIGLYPH_UNVERIFIED_MODELS) — and are
 *  removed from this list only when OmniGlyph's own reading receipt clears
 *  them (measurement before claims; see eval/grok-density). */
const UNVERIFIED_MODEL_BASES = ['grok'];

function isUnverifiedBase(model: string | null | undefined): boolean {
  if (typeof model !== 'string') return false;
  // Lowercase to match isGrokModel/resolveModelProfile — a safety gate must fail
  // closed regardless of casing, or `Grok-4.5` would still render+price as Grok
  // while escaping the unverified check.
  const base = baseModelId(model).toLowerCase();
  return UNVERIFIED_MODEL_BASES.some((b) => base === b || base.startsWith(`${b}-`));
}

function unverifiedAckBases(): string[] {
  const raw = typeof process !== 'undefined' ? process.env?.OMNIGLYPH_UNVERIFIED_MODELS : undefined;
  if (!raw || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/** True when OmniGlyph may actually IMAGE this model (vs pass it through as
 *  text). Verified models: always. Unverified bases (e.g. grok): only when the
 *  exact base is acked via OMNIGLYPH_UNVERIFIED_MODELS. Casing-insensitive. */
export function isModelImageable(model: string | null | undefined): boolean {
  if (!isUnverifiedBase(model)) return true;
  const base = baseModelId(model as string).toLowerCase();
  return unverifiedAckBases().some((b) => base === b || base.startsWith(`${b}-`));
}

export function shouldTransformAnthropicMessages(
  input: OmniGlyphApplicabilityInput,
): { eligible: boolean; reason: OmniGlyphApplicabilityReason } {
  if (input.method !== undefined && input.method !== null && input.method.toUpperCase() !== 'POST') {
    return { eligible: false, reason: 'unsupported_method' };
  }
  if (input.path !== undefined && input.path !== null && !isAnthropicMessagesPath(input.path)) {
    return { eligible: false, reason: 'unsupported_path' };
  }
  if (input.bodyBytes !== undefined && input.bodyBytes !== null && input.bodyBytes <= 0) {
    return { eligible: false, reason: 'empty_body' };
  }
  if (!isOmniGlyphSupportedModel(input.model)) {
    return { eligible: false, reason: 'unsupported_model' };
  }
  return { eligible: true, reason: 'eligible' };
}
