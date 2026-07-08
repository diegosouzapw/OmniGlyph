# Arkitektura

Isang pahinang mapa ng codebase.

## Request pipeline

```
client (Claude Code / anumang SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  iisang Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, mga usage/telemetry event
  ▼
src/core/transform.ts              ANG pipeline (Anthropic path):
  │   1. i-parse ang body, i-resolve ang vision tier mula sa modelo
  │   2. profitability gate — eksaktong gastos ng imahe vs gastos ng text
  │   3. i-convert: static slab · malalaking tool_results · na-collapse na history
  │   4. ibalik ang splice habang pinapanatili ang cache_control anchors ng client
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Billing (eksakto, sinukat)

| module | provider | modelo |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px na patches + 4/block, mga resize cap kada tier; page geometry (parehong tier ay nagre-render ng standard 1568×728 na pahina — ang high-res tier ay isang billing trap, tingnan ang [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | mga patch/tile regime kada modelo, `detail` kada profile, strip geometry |
| `src/core/gemini-model-profiles.ts` | Google | tile formula (`floor(min/1.5)` crop unit) + flat na gastos ng `media_resolution` |

## Rendering

- `src/core/render.ts` — text → PNG sa pamamagitan ng isang baked na glyph
  atlas (Spleen 5×8 + Unifont fallback), reflow na may `↵` newline sentinel,
  1-bit na atlas sa production (sinukat na mas mahusay kaysa AA sa Fable).
- `src/core/render-cache.ts` — LRU memoization ng deterministic na render
  (kung hindi, ang static slab + frozen history chunks ay muling nire-render
  sa bawat request).
- `src/core/history.ts` — kino-collapse ang mga lumang turn sa append-only na
  frozen image chunks na nananatiling byte-identical upang patuloy na tumama
  ang prompt caching.
- `src/core/png.ts` — minimal na deterministic PNG encoder (walang native na
  dependencies).

## Guard rails

- Model allowlist (`src/core/applicability.ts`): mga modelo lamang na pumasa
  sa reading benchmark ang nako-image; lahat ng iba pa ay dumadaan nang
  byte-identical.
- Byte-exact na mga value (SHAs, ids) ay sumasakay bilang text sa isang fact
  sheet sa tabi ng imahe (`src/core/factsheet.ts`); mga nabawing orihinal sa
  pamamagitan ng `emitRecoverable`.
- Hindi kailanman isinusulat-muli ang mga native na typed tool
  (`type !== 'custom'`) (400 guard).

## Benchmarks at resibo

Hawak ng `benchmarks/` ang dalawang harness na gumawa ng bawat numero sa
README — tingnan ang [benchmarks/README.md](../../benchmarks/README.md).
