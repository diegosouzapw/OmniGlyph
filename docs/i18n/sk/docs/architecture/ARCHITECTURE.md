# Architektúra

Jednostránková mapa kódovej bázy.

## Pipeline požiadavky

```
klient (Claude Code / akékoľvek SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosty (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  jediný fetch handler podľa Web štandardov:
  │                                smerovanie, prepustenie autentifikácie,
  │                                kontrafaktuál count_tokens, telemetria
  │                                usage/events
  ▼
src/core/transform.ts              TEN pipeline (cesta Anthropic):
  │   1. parsovanie tela, vyriešenie úrovne vízie z modelu
  │   2. brána ziskovosti — presné náklady obrázka vs textu
  │   3. konverzia: statický slab · veľké tool_results · zbalená história
  │   4. spätné zošitie so zachovaním klientskych kotiev cache_control
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Účtovanie (presné, merané)

| modul | poskytovateľ | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px záplaty + 4/blok, stropy zmeny veľkosti podľa úrovne; geometria stránky (obe úrovne renderujú štandardnú stránku 1568×728 — vysokorozlišovacia úroveň je účtovacia pasca, pozri [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | patch/dlaždicové režimy podľa modelu, `detail` podľa profilu, geometria stripu |
| `src/core/gemini-model-profiles.ts` | Google | vzorec dlaždíc (`floor(min/1.5)` jednotka orezu) + ploché náklady `media_resolution` |

## Renderovanie

- `src/core/render.ts` — text → PNG cez zapečenú atlasovú mriežku glyfov
  (Spleen 5×8 + Unifont fallback), reflow so sentinelmi nového riadku `↵`,
  1-bitový atlas v produkcii (meraný ako lepší než AA na Fable).
- `src/core/render-cache.ts` — LRU memoizácia deterministických renderov
  (statický slab + zamrznuté chunky histórie sa inak renderujú znova pri
  každej požiadavke).
- `src/core/history.ts` — zbaľuje staré kolá do append-only zamrznutých
  obrázkových chunkov, ktoré zostávajú identické na úrovni bajtov, aby
  cachovanie promptov naďalej trafilo.
- `src/core/png.ts` — minimálny deterministický PNG enkodér (bez natívnych
  závislostí).

## Ochranné mantinely

- Allowlist modelov (`src/core/applicability.ts`): iba modely, ktoré prešli
  benchmarkom čítania, sa obrázkujú; všetko ostatné prechádza identické na
  úrovni bajtov.
- Hodnoty na úrovni bajtov (SHA, ID) cestujú ako text vo factsheete vedľa
  obrázka (`src/core/factsheet.ts`); obnoviteľné originály cez
  `emitRecoverable`.
- Natívne typované nástroje (`type !== 'custom'`) sa nikdy neprepisujú
  (ochrana proti 400).

## Benchmarky a dôkazy

`benchmarks/` obsahuje dva harnessy, ktoré vyprodukovali každé číslo v
README — pozri [benchmarks/README.md](../../benchmarks/README.md).
