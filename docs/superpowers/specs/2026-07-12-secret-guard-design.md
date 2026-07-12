# Secret guard — design spec (cut-down port of the upstream context risk router)

Status: APPROVED 2026-07-12 (user review) — decisions: default `off`;
prefix-preserving mask; v1 guards render text only (no headers); implementation
branch based on the tip of the open stack (`feat/port-responses-tool-pairs`).
Origin: upstream PR #39 intent ("keep secrets & high-risk blocks as text"),
re-scoped in the 2026-07-08 brainstorm to a minimal secret-detection module.
Attribution when implemented: Co-authored-by the human author (rYo-STUDIO-1bit's
human identity from the PR's first commit; the upstream commits are bot-authored
— never credit the bot). Upstream URL only in the `Inspired-by:` trailer.

## Problem

OmniGlyph images bulky request blocks. If a block carries a live credential
(API key, bearer token, `KEY=value` secret), imaging it has two bad effects:

1. **Persistence surface.** Rendered PNGs can be dumped (`OMNIGLYPH_DUMP_DIR`),
   captured by the dashboard gallery, or land in 4xx debug captures — a secret
   that lived in one request body now exists as an artifact on disk.
2. **Amplification surface (grew this week).** The factsheet and the new
   in-image IDS block (PR #28) deliberately EXTRACT and REPEAT
   precision-critical tokens next to / inside the images. A high-entropy secret
   is exactly what those extractors love:
   - `SHAPE_ASSIGNMENT` (PR #21) keeps `API_KEY=sk-live-…` as ONE tier-0 token
     in the factsheet **text** that rides beside the image.
   - `appendIdsBlock` (PR #28) would give the same secret its own isolated,
     maximally-legible 5×8 row **inside** the image.

Today nothing in the pipeline knows what a secret looks like.

## Non-goals

- Not a DLP product: no network calls, no vault integration, no config of
  custom patterns in v1 (the env-profile mechanism can grow that later).
- Not the upstream router: no risk *scoring*, no per-block routing policy
  (+1462 lines we deliberately did not port). One module, one flag.
- Does not change the repo hard rule #1 (secrets never in the repo) — this is
  about **runtime traffic** passing through the proxy.

## Design

### Module: `src/core/secret-guard.ts`

Pure, dependency-free, deterministic (same constraints as `factsheet.ts`).

Detection = union of:

1. **Prefix patterns** (high precision, case-sensitive where the ecosystem is):
   `sk-`, `sk-ant-`, `sk-proj-`, `gh[pousr]_`, `xox[baprs]-`, `AKIA[0-9A-Z]{16}`,
   `AIza[0-9A-Za-z_-]{35}`, `-----BEGIN … PRIVATE KEY-----` blocks.
2. **Bearer**: `Authorization: Bearer <token>` / bare `Bearer <token>` where
   `<token>` is ≥ 20 chars and not a known non-secret shape.
3. **Labeled assignment**: `KEY=<value>` / `KEY: <value>` where KEY matches a
   secret-ish name (`(API_|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|ACCESS_KEY)`;
   full list in implementation) — regardless of the value's entropy.
4. **Entropy fallback**: whitespace-free chunk, length 20–256, Shannon entropy
   ≥ 3.6 bits/char, **minus** every factsheet shape that is legitimately
   high-entropy but public: `SHAPE_HEX` (git SHAs), `SHAPE_UUID`, `SHAPE_NUM`,
   `SHAPE_CONST`, `SHAPE_TICKET`, URLs without userinfo/query-credentials, and
   file paths. (This is the false-positive control: the factsheet's own shape
   grammar defines what the codebase considers "normal" high-entropy text.)

API (draft):

```ts
export interface SecretHit { start: number; end: number; kind: string }
export function findSecrets(text: string): SecretHit[]
export function redactSecrets(text: string): { text: string; hits: number }
// mask: first 4 chars + '…' + kind marker, e.g. `sk-l…[REDACTED:key]` —
// deterministic, length-stable enough for cache alignment (exact rule in impl).
```

### Flag: `OMNIGLYPH_GUARD_SECRETS` = `off` | `text` | `redact`

- **`off`** (default): current behavior, zero cost. Fail-open by explicit
  default because the proxy is localhost-first and the flag is documented.
- **`text`**: any block/slab whose render text contains a secret is **not
  imaged** (stays native text, `reason: 'secret_kept_text'` in info). The
  secret still flows to the upstream API exactly as the client sent it —
  we only refuse to create *additional* rendered artifacts of it.
- **`redact`**: blocks still image, but `redactSecrets` runs on the render
  text **and** on every extraction surface (factsheet, IDS block) before
  rendering. The native text path is untouched (we never mutate what the
  upstream API receives — redaction applies only to OmniGlyph-created
  artifacts: PNGs, factsheet lines, IDS rows, dashboard captures).

### Integration lanes (two, as brainstormed — now three surfaces each)

1. **Slab lane** (`transform.ts` Anthropic slab + `openai.ts` both slabs):
   guard runs on the assembled render text after reflow, before
   `appendIdsBlock`/render. `text` mode skips imaging that slab; `redact`
   mode rewrites the render text.
2. **Block lane** (`history.ts` chunkRender + `openai-history.ts` sections +
   tool_result blocks): same contract per collapsed section/chunk.
3. **Extraction surfaces** (new since the brainstorm): `factSheetText` and
   `appendIdsBlock` outputs pass through the guard in `redact` mode; in `text`
   mode the block never reaches them. This closes the amplification loop that
   PR #21 + PR #28 opened.

Telemetry: `info.secretHits` (count only, never the matched text) + tracker
field; dashboard shows the count. The matched secret text NEVER goes to the
log/tracker/dashboard.

### Interaction with `compressSystem` (PR #26)

Independent flags, compose naturally: `OMNIGLYPH_KEEP_SYSTEM_TEXT` decides
whether the system slab images at all; the guard decides per-content. When both
apply, keep-system-text wins first (nothing to guard if nothing images).

## TDD plan (summary)

- Unit: each pattern family with true/false-positive fixtures; the entropy
  fallback proven to REJECT git SHAs, UUIDs, tickets, long constants, URLs,
  paths (the factsheet-shape exclusions, one assert per shape).
- Determinism + idempotence of `redactSecrets`.
- Lane tests: a slab/history chunk carrying `sk-live-…` (a) default off →
  unchanged; (b) `text` → no image, reason set, upstream body byte-identical;
  (c) `redact` → image present, rendered source text (via `imageSourceText`)
  has the mask, factsheet/IDS lines have the mask, native path untouched.
- Amplification regression: with `redact`, an uppercase `API_KEY=sk-…`
  assignment must NOT surface unmasked in `factSheetText` output nor in the
  `IDS` block (these are the PR #21/#28 interplays).
- e2e proxy: fakeUpstream asserts the forwarded body is byte-identical in all
  three modes (the guard never mutates client traffic).

## Decisions (user-reviewed 2026-07-12)

1. **Default `off`** — confirmed even after the IDS-block amplification
   analysis: the proxy is localhost-first, the flag is documented, and
   upstream #39 itself was opt-in.
2. **Masking rule**: prefix-preserving — `first4 + '…[REDACTED:kind]'`.
   Verify during implementation that redacted artifacts stay outside the
   anchored cache prefix (expected: images/factsheet are not part of it).
3. **v1 scope**: render text only. Auth headers never image; no header
   scanning, no header telemetry.
4. **Branch base**: `feat/port-responses-tool-pairs` (tip of the open stack)
   so the guard composes with the final pipeline shape (IDS, tool pairs);
   the PR is stacked and notes the merge order. The stale
   `feat/port-pr-39-secret-guard` worktree (empty, at 2d47a59) is removed and
   recreated from that base.
