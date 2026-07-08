# Arhitectură

Harta codebase-ului pe o singură pagină.

## Pipeline-ul de request

```
client (Claude Code / orice SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosturi (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  handler fetch unic, standard Web:
  │                                rutare, passthrough de autentificare, count_tokens
  │                                contrafactual, evenimente de usage/telemetrie
  ▼
src/core/transform.ts              PIPELINE-UL (calea Anthropic):
  │   1. parsează body-ul, rezolvă nivelul de viziune din model
  │   2. gate de profitabilitate — cost exact de imagine vs cost de text
  │   3. convertește: slab static · tool_results mari · istoric colapsat
  │   4. reintroduce păstrând ancorele cache_control ale clientului
  ▼
API upstream (api.anthropic.com / api.openai.com)
```

## Facturare (exactă, măsurată)

| modul | furnizor | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patch-uri de 28 px + 4/bloc, plafoane de resize per nivel; geometrie de pagină (ambele niveluri randează pagina standard 1568×728 — nivelul de rezoluție înaltă este o capcană de facturare, vedeți [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | regimuri patch/tile per model, `detail` per profil, geometrie de strip |
| `src/core/gemini-model-profiles.ts` | Google | formula de tile (unitate de crop `floor(min/1.5)`) + costuri fixe `media_resolution` |

## Randare

- `src/core/render.ts` — text → PNG printr-un atlas de glife precopt (Spleen
  5×8 + fallback Unifont), reflow cu sentinele de newline `↵`, atlas pe 1 bit
  în producție (măsurat mai bine decât AA pe Fable).
- `src/core/render-cache.ts` — memoizare LRU a render-urilor deterministe
  (slab-ul static + chunk-urile de istoric înghețate altfel s-ar re-randa la
  fiecare request).
- `src/core/history.ts` — colapsează turele vechi în chunk-uri de imagine
  append-only înghețate care rămân identice pe bit astfel încât cache-ul de
  prompt continuă să lovească.
- `src/core/png.ts` — encoder PNG minimal, determinist (fără dependențe
  native).

## Guard rails

- Allowlist de model (`src/core/applicability.ts`): doar modelele care au
  trecut benchmark-ul de citire sunt transformate în imagine; restul trece
  identic pe bit.
- Valorile exacte pe bit (SHA-uri, id-uri) călătoresc ca text într-un fact
  sheet lângă imagine (`src/core/factsheet.ts`); originale recuperabile prin
  `emitRecoverable`.
- Uneltele native tipizate (`type !== 'custom'`) nu sunt niciodată rescrise
  (guard 400).

## Benchmarks & dovezi

`benchmarks/` conține cele două harness-uri care au produs fiecare cifră din
README — vedeți [benchmarks/README.md](../../benchmarks/README.md).
