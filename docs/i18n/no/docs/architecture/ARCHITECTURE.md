# Arkitektur

Ettsides kart over kodebasen.

## Forespørselspipeline

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

## Fakturering (eksakt, målt)

| modul | leverandør | modell |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px-patcher + 4/blokk, tak for endring av størrelse per nivå; sidegeometri (begge nivåer rendrer standard 1568×728-siden — høyoppløsningsnivået er en faktureringsfelle, se [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | patch/flis-regimer per modell, `detail` per profil, stripgeometri |
| `src/core/gemini-model-profiles.ts` | Google | flisformel (`floor(min/1.5)` beskjæringsenhet) + `media_resolution`-flatkostnader |

## Rendring

- `src/core/render.ts` — tekst → PNG via et bakt glyffatlas (Spleen 5×8 +
  Unifont-reserve), omflyt med `↵`-linjeskift-sentinels, 1-bit-atlas i
  produksjon (målt bedre enn AA på Fable).
- `src/core/render-cache.ts` — LRU-memoisering av deterministiske
  rendringer (statisk slab + frosne historikkbiter rendres ellers på nytt
  ved hver forespørsel).
- `src/core/history.ts` — slår sammen gamle runder til append-only frosne
  bildebiter som forblir byte-identiske slik at prompt-caching fortsetter
  å treffe.
- `src/core/png.ts` — minimal deterministisk PNG-koder (ingen native
  avhengigheter).

## Vaktrekkverk

- Modell-tillatelsesliste (`src/core/applicability.ts`): kun modeller som
  besto lesebenchmarken blir avbildet; alt annet passerer byte-identisk.
- Byte-eksakte verdier (SHA-er, ID-er) reiser som tekst i et faktaark ved
  siden av bildet (`src/core/factsheet.ts`); gjenopprettbare originaler via
  `emitRecoverable`.
- Native typede verktøy (`type !== 'custom'`) skrives aldri om (400-vakt).

## Benchmarks og kvitteringer

`benchmarks/` inneholder de to riggene som produserte hvert tall i README-en
— se [benchmarks/README.md](../../benchmarks/README.md).
