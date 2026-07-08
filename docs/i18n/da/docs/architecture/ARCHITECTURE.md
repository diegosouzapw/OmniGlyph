# Arkitektur

Et-siders kort over kodebasen.

## Forespørgselspipeline

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

## Afregning (præcis, målt)

| modul | udbyder | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px-patches + 4/blok, per-tier resize-lofter; sidegeometri (begge tiers renderer standardsiden 1568×728 — hi-res-tieret er en afregningsfælde, se [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | per-model patch/flise-regimer, `detail` per profil, strip-geometri |
| `src/core/gemini-model-profiles.ts` | Google | fliseformel (`floor(min/1.5)` beskæringsenhed) + `media_resolution` flade omkostninger |

## Rendering

- `src/core/render.ts` — tekst → PNG via et indbagt glyf-atlas (Spleen 5×8 +
  Unifont-fallback), reflow med `↵`-linjeskift-sentineller, 1-bit atlas i
  produktion (målt bedre end AA på Fable).
- `src/core/render-cache.ts` — LRU-memoisering af deterministiske renderinger
  (statisk slab + frosne historikchunks genrenderes ellers ved hver forespørgsel).
- `src/core/history.ts` — kollapser gamle ture til append-only frosne billed-
  chunks, der forbliver byte-identiske, så prompt-caching bliver ved med at ramme.
- `src/core/png.ts` — minimal deterministisk PNG-encoder (ingen native afhængigheder).

## Beskyttelsesmekanismer

- Model-allowlist (`src/core/applicability.ts`): kun modeller, der har bestået
  læsebenchmarken, bliver billeddannet; alt andet passerer byte-identisk igennem.
- Byte-nøjagtige værdier (SHA'er, id'er) rejser som tekst i et faktaark ved siden
  af billedet (`src/core/factsheet.ts`); genoprettelige originaler via `emitRecoverable`.
- Native typede værktøjer (`type !== 'custom'`) omskrives aldrig (400-beskyttelse).

## Benchmarks & dokumentation

`benchmarks/` indeholder de to rammeværker, der producerede hvert tal i README'en
— se [benchmarks/README.md](../../benchmarks/README.md).
