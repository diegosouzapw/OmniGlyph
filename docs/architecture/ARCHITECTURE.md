# Architecture

One-page map of the codebase.

## Request pipeline

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  single Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, usage/telemetry events
  ▼
src/core/transform.ts              THE pipeline (Anthropic path):
  │   1. parse body, resolve vision tier from model
  │   2. profitability gate — exact image cost vs text cost
  │   3. convert: static slab · large tool_results · collapsed history
  │   4. splice back preserving the client's cache_control anchors
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Billing (exact, measured)

| module | provider | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px patches + 4/block, per-tier resize caps; page geometry (both tiers render the standard 1568×728 page — the high-res tier is a billing trap, see [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | per-model patch/tile regimes, `detail` per profile, strip geometry |
| `src/core/gemini-model-profiles.ts` | Google | tile formula (`floor(min/1.5)` crop unit) + `media_resolution` flat costs |

## Rendering

- `src/core/render.ts` — text → PNG via a baked glyph atlas (Spleen 5×8 +
  Unifont fallback), reflow with `↵` newline sentinels, 1-bit atlas in
  production (measured better than AA on Fable).
- `src/core/render-cache.ts` — LRU memoization of deterministic renders
  (static slab + frozen history chunks re-render on every request otherwise).
- `src/core/history.ts` — collapses old turns into append-only frozen image
  chunks that stay byte-identical so prompt caching keeps hitting.
- `src/core/png.ts` — minimal deterministic PNG encoder (no native deps).

## Guard rails

- Model allowlist (`src/core/applicability.ts`): only models that passed the
  reading benchmark get imaged; everything else passes through byte-identical.
- Byte-exact values (SHAs, ids) ride as text in a fact sheet next to the image
  (`src/core/factsheet.ts`); recoverable originals via `emitRecoverable`.
- Native typed tools (`type !== 'custom'`) are never rewritten (400 guard).

## Benchmarks & receipts

`benchmarks/` holds the two harnesses that produced every number in the README
— see [benchmarks/README.md](../../benchmarks/README.md).
