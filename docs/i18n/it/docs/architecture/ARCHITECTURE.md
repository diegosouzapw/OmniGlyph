# Architecture

Mappa in una pagina della codebase.

## Pipeline della richiesta

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

## Fatturazione (esatta, misurata)

| modulo | provider | modello |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patch da 28 px + 4/blocco, limiti di ridimensionamento per livello; geometria della pagina (entrambi i livelli renderizzano la pagina standard 1568×728 — il livello ad alta risoluzione è una trappola di fatturazione, vedi [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | regimi patch/tile per modello, `detail` per profilo, geometria della striscia |
| `src/core/gemini-model-profiles.ts` | Google | formula tile (unità di crop `floor(min/1.5)`) + costi fissi `media_resolution` |

## Rendering

- `src/core/render.ts` — testo → PNG tramite un atlas di glifi pre-calcolato
  (Spleen 5×8 + fallback Unifont), reflow con sentinelle di a-capo `↵`,
  atlas 1-bit in produzione (misurato migliore di AA su Fable).
- `src/core/render-cache.ts` — memoizzazione LRU dei render deterministici
  (lo slab statico + i chunk della cronologia congelati altrimenti si
  ri-renderizzerebbero a ogni richiesta).
- `src/core/history.ts` — collassa i turni vecchi in chunk immagine
  append-only che restano byte-identici così il caching dei prompt continua
  a fare hit.
- `src/core/png.ts` — encoder PNG deterministico minimale (nessuna
  dipendenza nativa).

## Guard rail

- Allowlist dei modelli (`src/core/applicability.ts`): solo i modelli che
  hanno superato il benchmark di lettura vengono trasformati in immagine;
  tutto il resto passa byte-identico.
- I valori byte-esatti (SHA, id) viaggiano come testo in un factsheet
  accanto all'immagine (`src/core/factsheet.ts`); originali recuperabili
  tramite `emitRecoverable`.
- I tool nativi tipizzati (`type !== 'custom'`) non vengono mai riscritti
  (guardia 400).

## Benchmark e riscontri

`benchmarks/` contiene i due banchi di prova che hanno prodotto ogni numero
nel README — vedi [benchmarks/README.md](../../benchmarks/README.md).
