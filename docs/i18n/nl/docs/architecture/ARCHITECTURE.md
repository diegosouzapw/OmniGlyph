# Architectuur

Kaart van de codebase op één pagina.

## Verzoekpijplijn

```
client (Claude Code / elke SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  enkele Web-standard fetch-handler:
  │                                routering, auth-passthrough, count_tokens
  │                                tegenfeitelijke, usage/telemetrie-events
  ▼
src/core/transform.ts              DE pijplijn (Anthropic-pad):
  │   1. parse body, los vision-tier op uit model
  │   2. winstgevendheidspoort — exacte imagekosten vs tekstkosten
  │   3. converteren: statische slab · grote tool_results · ingeklapte geschiedenis
  │   4. terugvoegen met behoud van de cache_control-ankers van de client
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Billing (exact, gemeten)

| module | provider | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px-patches + 4/blok, resize-caps per tier; paginageometrie (beide tiers renderen de standaardpagina 1568×728 — de high-res-tier is een billing-valkuil, zie [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | patch/tile-regimes per model, `detail` per profiel, strip-geometrie |
| `src/core/gemini-model-profiles.ts` | Google | tile-formule (`floor(min/1.5)` crop-eenheid) + platte kosten voor `media_resolution` |

## Rendering

- `src/core/render.ts` — tekst → PNG via een ingebakken glyf-atlas (Spleen
  5×8 + Unifont fallback), reflow met `↵`-newline-sentinels, 1-bit atlas in
  productie (gemeten beter dan AA op Fable).
- `src/core/render-cache.ts` — LRU-memoisatie van deterministische renders
  (statische slab + bevroren geschiedenischunks worden anders bij elk
  verzoek opnieuw gerenderd).
- `src/core/history.ts` — klapt oude beurten in tot append-only bevroren
  image-chunks die byte-identiek blijven zodat prompt-caching blijft hitten.
- `src/core/png.ts` — minimale deterministische PNG-encoder (geen native
  dependencies).

## Guard rails

- Model-allowlist (`src/core/applicability.ts`): alleen modellen die de
  leesbenchmark haalden, worden als afbeelding gerenderd; al het andere gaat
  byte-identiek door.
- Byte-exacte waarden (SHA's, id's) reizen als tekst mee in een fact sheet
  naast de afbeelding (`src/core/factsheet.ts`); herstelbare originelen via
  `emitRecoverable`.
- Native typed tools (`type !== 'custom'`) worden nooit herschreven
  (400-guard).

## Benchmarks & bewijzen

`benchmarks/` bevat de twee harnesses die elk cijfer in de README hebben
opgeleverd — zie [benchmarks/README.md](../../benchmarks/README.md).
