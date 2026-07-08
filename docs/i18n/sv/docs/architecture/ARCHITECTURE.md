# Arkitektur

Enkelsidig karta över kodbasen.

## Förfrågningskedja

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

## Fakturering (exakt, mätt)

| modul | leverantör | modell |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px-patchar + 4/block, per-nivå-förminskningstak; sidgeometri (båda nivåerna renderar standardsidan 1568×728 — den högupplösta nivån är en faktureringsfälla, se [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | per-modell patch/platt-regimer, `detail` per profil, remsgeometri |
| `src/core/gemini-model-profiles.ts` | Google | plattformel (`floor(min/1.5)` beskärningsenhet) + `media_resolution`-fasta kostnader |

## Rendering

- `src/core/render.ts` — text → PNG via en inbränd glyfatlas (Spleen 5×8 +
  Unifont-reserv), omflödning med `↵`-radbrytningsmarkörer, 1-bitars atlas
  i produktion (mätt bättre än AA på Fable).
- `src/core/render-cache.ts` — LRU-minnesbuffring av deterministiska
  renderingar (statisk slab + frysta historikbitar renderas annars om vid
  varje förfrågan).
- `src/core/history.ts` — fäller ihop gamla turer till append-only frysta
  bildbitar som förblir byte-identiska så att promptcachning fortsätter
  träffa.
- `src/core/png.ts` — minimal deterministisk PNG-kodare (inga
  native-beroenden).

## Skyddsräcken

- Modelltillåtelselista (`src/core/applicability.ts`): endast modeller som
  klarat läsbenchmarken blir avbildade; allt annat passerar
  byte-identiskt.
- Byte-exakta värden (SHA:er, id:n) reser som text i ett faktablad
  bredvid bilden (`src/core/factsheet.ts`); återhämtningsbara original
  via `emitRecoverable`.
- Inbyggda typade verktyg (`type !== 'custom'`) skrivs aldrig om
  (400-skydd).

## Benchmarks & belägg

`benchmarks/` innehåller de två ramverken som tagit fram varje siffra i
README:n — se [benchmarks/README.md](../../benchmarks/README.md).
