# Architektura

Jednostránková mapa kódové báze.

## Pipeline requestu

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hostitelé (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  jediný fetch handler dle Web standardu:
  │                                routing, průchod autentizace, kontrafaktuál
  │                                count_tokens, události usage/telemetrie
  ▼
src/core/transform.ts              PIPELINE SAMOTNÁ (cesta Anthropic):
  │   1. parsuje tělo, vyřeší vision úroveň z modelu
  │   2. gate ziskovosti — přesné náklady obrázku vs. náklady textu
  │   3. konvertuje: statický slab · velké tool_results · sbalená historie
  │   4. splice zpět při zachování klientových kotev cache_control
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Billing (přesný, měřený)

| modul | poskytovatel | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patche 28 px + 4/blok, limity zmenšení podle úrovně; geometrie stránky (obě úrovně vykreslují standardní stránku 1568×728 — high-res úroveň je billingová past, viz [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | režimy patch/dlaždice podle modelu, `detail` podle profilu, geometrie stripu |
| `src/core/gemini-model-profiles.ts` | Google | vzorec dlaždic (`floor(min/1.5)` jednotka ořezu) + ploché náklady `media_resolution` |

## Vykreslování

- `src/core/render.ts` — text → PNG přes zapečenou atlasovou mřížku glyfů
  (Spleen 5×8 + záložní Unifont), reflow se sentinely nového řádku `↵`,
  1bitový atlas v produkci (změřeno jako lepší než AA na Fable).
- `src/core/render-cache.ts` — LRU memoizace deterministických renderů
  (statický slab + zmrazené chunky historie by se jinak znovu vykreslovaly
  při každém requestu).
- `src/core/history.ts` — sbaluje staré tahy do append-only zmrazených
  obrázkových chunků, které zůstávají bajtově identické, takže cachování
  promptů dál funguje.
- `src/core/png.ts` — minimální deterministický PNG enkodér (bez nativních
  závislostí).

## Zábradlí (guard rails)

- Allowlist modelů (`src/core/applicability.ts`): jako obrázek se zobrazují
  jen modely, které prošly čtecím benchmarkem; vše ostatní prochází bajtově
  identicky.
- Hodnoty přesné na bajt (SHA, ID) cestují jako text v factsheetu vedle
  obrázku (`src/core/factsheet.ts`); obnovitelné originály přes
  `emitRecoverable`.
- Nativní typované nástroje (`type !== 'custom'`) se nikdy nepřepisují
  (guard 400).

## Benchmarky a doklady

`benchmarks/` obsahuje dva harness, které vyprodukovaly každé číslo v
READMEs — viz [benchmarks/README.md](../../benchmarks/README.md).
