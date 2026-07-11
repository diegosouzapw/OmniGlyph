# Design — Grok adoption + provider-neutral render profiles

Date: 2026-07-11
Status: approved (brainstorm), pending implementation-plan

## Problem

OmniGlyph images bulky LLM request blocks into 1-bit PNG pages only for models
that pass a reading benchmark (fail-closed gate) and only when the exact billing
math wins. Today the per-model render + billing profile resolver
(`src/core/gpt-model-profiles.ts`) is GPT-shaped: it carries geometry
(`stripCols`, `maxHeightPx`) and OpenAI vision cost, but **not** the glyph
atlas / render style, and its naming assumes GPT.

We want to:

1. **Adopt Grok** (opt-in) with its own render profile (denser cell + verbatim
   fact-sheet) and its own xAI billing rates.
2. **Generalize** the profile abstraction because more OpenAI-wire-compatible
   providers are coming — the `/v1/responses` + `/v1/chat/completions` leg is a
   wire protocol, not a single vendor.
3. Keep everything **fail-closed**: Grok must not image until *our own*
   measurement clears it, even though upstream measured it.

Ported (adapted) from upstream commits `cd4c9ef` (model-specific render
profiles), the Grok slice of `5eb80a4` (price/gate Responses by model), and
`056f970` (Grok image-recall eval). The upstream reading evidence is n=1
synthetic; we require our own receipt before enabling.

Out of scope: the `gpt-5.6-sol` profile (failed reading 0/4 → violates the
fail-closed rule), the JetBrains Mono / gray atlases (Sol-only, and Grok reuses
the Spleen/Unifont atlases we already ship), and the full upstream
`MODEL_RENDER_PROFILES` doc (we keep a concise note of our own). The
context-window README chart (upstream `8d7ba3e`) is a separate, simpler track
with its own spec/PR.

## Architecture

### Modules touched

- **`src/core/openai-wire-profiles.ts`** (renamed from `gpt-model-profiles.ts`).
  Provider-neutral profile resolver for every model served over the OpenAI wire
  (GPT, Grok, future providers).
  - `ModelProfile` (was `GptModelProfile`) gains a **render-style** field:
    `{ font, cellWBonus, cellHBonus, factsheet, grid?, gridCols?, markerScale?,
    markerRed? }`, plus a **provider/billing discriminator** so each rule carries
    its own vision-cost regime and cache/output multipliers instead of assuming
    the GPT table.
  - `resolveModelProfile()` (was `resolveGptProfile`). A `grok-*` `ProfileRule`
    resolves to: Spleen+Unifont **9×12 effective** (via `cellWBonus`/
    `cellHBonus` over the 5×8 base), **84 columns**, **1932 px** max height,
    `factsheet: true`, `detail: 'high'`, xAI billing.
  - The resolver is **internal**: `src/core/index.ts` re-exports
    `resolveVisionCost` / `openAIVisionTokens` from `openai.ts`, **not**
    `resolveGptProfile`. Only `openai.ts`, `openai-history.ts`, and
    `tests/gpt-billing-audit.test.ts` import it — so the rename is internal-only
    and needs no back-compat aliases (OmniRoute's consumed symbols are
    unaffected). Verified against `index.ts` on 2026-07-11.
  - **Override env**: `OMNIGLYPH_GPT_PROFILES` keeps working; add the neutral
    `OMNIGLYPH_MODEL_PROFILES` (same parser, extended to accept the new style
    fields, with validation + fallback). The GPT-specific name is documented as
    a legacy alias.

- **`src/core/openai.ts`** — honor the **resolved render style** when rendering
  (today it uses fixed GPT geometry). Grok renders at its 9×12 + fact-sheet
  profile. The profitability gate must derive pixel width / row capacity /
  pagination / image cost from the *same* resolved profile, so a style override
  can never leave the gate on stale geometry.

- **`src/core/openai-savings.ts`** — Grok cache (0.25×) / output (3×)
  multipliers and vision regime (~1000 image tokens / MPix) behind the provider
  discriminator; GPT rates unchanged.

- **`src/core/applicability.ts`** — the **unverified gate** (see below).

- **`eval/grok-density/`** (new, adapted from upstream `056f970`) — the
  measurement harness that produces *our* reading receipt. Supports
  `--via-cli` / `--via-omniroute` so grok-4.5 is validated through the
  subscription at $0 (same convention as the existing benchmarks). Running it is
  a follow-up step, not part of the infra PRs.

- **`gemini-model-profiles.ts`** — untouched (Gemini is a different wire / leg).

### Fail-closed gate — three Grok states

Grok being present in `OMNIGLYPH_MODELS` (opt-in) is **necessary but not
sufficient**. `applicability.ts` holds `UNVERIFIED_MODEL_BASES = ['grok']`, and
the gate crosses `isAllowed` × verification:

1. **Unverified, no ack** (default after the infra PRs): even with `grok-4.5` in
   `OMNIGLYPH_MODELS`, Grok is **not imaged** — the request passes through as
   text and telemetry / dashboard report reason `model_unverified`.
2. **Unverified + explicit ack** (`OMNIGLYPH_UNVERIFIED_MODELS=grok-4.5`):
   imaged, but the dashboard flags "unverified — operator override." Deliberate
   friction; nobody images an unverified model silently.
3. **Verified** (after our receipt lands): normal opt-in via `OMNIGLYPH_MODELS`,
   no ack needed.

The gate is truly lifted — `grok` removed from `UNVERIFIED_MODEL_BASES`, a
one-line change **backed by the committed receipt** — only once our own harness
clears the acceptance bar: **4/4 exact, 0 confabulations, gist + guard pass,
positive savings** (upstream's bar). Measurement before claims.

## Routing (no change needed)

Grok is xAI, OpenAI-compatible: requests already reach the OpenAI leg by path
(`/v1/responses`, `/v1/chat/completions`). Grok is distinguished by the
`model: grok-*` field, and `resolveModelProfile` already keys off the model id —
so the `grok-*` rule slots into the existing resolver. No new routing.

The fact-sheet reuses `src/core/factsheet.ts` unchanged — it is the same verbatim
exact-token mechanism Grok's profile needs.

## Testing (strict TDD, RED first)

- **Resolver**: `grok-*` → Grok profile (9×12, 84 cols, `factsheet`, xAI
  billing); `OMNIGLYPH_MODEL_PROFILES` / `OMNIGLYPH_GPT_PROFILES` apply the new
  style fields; back-compat aliases resolve identically.
- **Gate** (`applicability`): `grok` in `OMNIGLYPH_MODELS` **without** ack →
  ineligible, reason `model_unverified`; **with** ack → eligible; verified-set
  membership behavior; GPT/Claude paths unchanged.
- **Billing**: Grok cache 0.25× / output 3× applied; gate derives cost from the
  resolved profile (a style override cannot leave the gate on wrong geometry).
- **Render**: `openai.ts` honors the resolved style for grok (9×12 + fact-sheet).
- **e2e** on the OpenAI leg: grok-4.5 **with** ack images with the Grok profile;
  **without** ack passes through as text.
- **Rename**: existing profile tests migrate to `openai-wire-profiles`; a
  back-compat alias test guards the public API.
- **Harness**: scaffolding + acceptance-bar scoring unit-tested without a live
  call.

Full validation per repo rule on every PR: `pnpm run lint && pnpm run typecheck
&& pnpm test && pnpm run build`. Never weaken the model gate or the profitability
gate to go green (hard rule #2).

## Attribution

Ported from maintainer commits (`cd4c9ef`, the Grok slice of `5eb80a4`,
`056f970`). Credit lives in the commit trailers (`Co-authored-by` +
`Inspired-by <commit-url>` per commit) and in the CHANGELOG **without** the
maintainer handle (rebrand guard forbids it in tracked files).

## PR decomposition (one concern per PR)

1. **Rename / generalize** the resolver — provider-neutral `ModelProfile` +
   style field + provider/billing discriminator + `OMNIGLYPH_MODEL_PROFILES`,
   with back-compat aliases. **Pure refactor, no behavior change** (existing GPT
   behavior byte-identical; tests migrated).
2. **Grok** — profile rule + style threading through `openai.ts` + xAI billing +
   the unverified gate in `applicability.ts`.
3. **(follow-up)** measurement harness (`eval/grok-density/`, `--via-cli`) →
   run via CLI/OmniRoute → commit receipt → flip Grok to Verified.

The context-window chart (`8d7ba3e`) is a separate lightweight track after the
Grok work.

## Open questions / risks

- **Provider-neutral file name**: proposed `openai-wire-profiles.ts`
  (alternative `vision-model-profiles.ts`). Confirm before the rename PR.
- **Public-API surface**: resolved — the resolver is internal (not in
  `index.ts`), so the rename is internal-only. OmniRoute consumes
  `resolveVisionCost` / `openAIVisionTokens` (from `openai.ts`), which the
  rename does not touch.
- **Grok billing constants** must reflect real xAI pricing; source them
  explicitly (upstream constants + xAI docs), since they feed the profitability
  gate.
- **CLI/OmniRoute validation path** must actually reach grok-4.5 at $0; if it
  fails, the receipt (and the Verified flip) waits on an API-key run.
