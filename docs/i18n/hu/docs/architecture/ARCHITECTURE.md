# Architektúra

A kódbázis egyoldalas térképe.

## Kérés pipeline

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

## Számlázás (pontos, mérve)

| modul | szolgáltató | modell |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px-es patch-ek + 4/blokk, szintenkénti átméretezési plafonok; oldalgeometria (mindkét szint a standard 1568×728-as oldalt rendereli — a high-res szint egy számlázási csapda, lásd [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | modellenkénti patch/csempe rezsimek, `detail` profilonként, csík-geometria |
| `src/core/gemini-model-profiles.ts` | Google | csempe-képlet (`floor(min/1.5)` vágási egység) + `media_resolution` fix költségek |

## Renderelés

- `src/core/render.ts` — szöveg → PNG egy előre sütött glifatlaszon
  keresztül (Spleen 5×8 + Unifont tartalék), reflow `↵` sortörés-jelölőkkel,
  1-bites atlasz éles környezetben (mérten jobb, mint az AA a Fable-en).
- `src/core/render-cache.ts` — az determinisztikus renderelések LRU
  memoizálása (a statikus slab + fagyasztott előzmény-chunk-ok egyébként
  minden kéréssel újrarenderelődnének).
- `src/core/history.ts` — a régi fordulókat append-only fagyasztott
  kép-chunk-okká zsugorítja, amelyek byte-azonosak maradnak, hogy a
  prompt-gyorsítótárazás továbbra is találjon.
- `src/core/png.ts` — minimális determinisztikus PNG-kódoló (natív
  függőségek nélkül).

## Védőkorlátok

- Modell-engedélyezőlista (`src/core/applicability.ts`): csak azok a
  modellek kapnak képet, amelyek átmentek az olvasási benchmarkon; minden
  más byte-azonosan halad át.
- A byte-pontos értékek (SHA-k, azonosítók) szövegként utaznak egy
  factsheet-ben a kép mellett (`src/core/factsheet.ts`); helyreállítható
  eredetik az `emitRecoverable`-lel.
- A natív típusos eszközök (`type !== 'custom'`) soha nincsenek átírva
  (400-as védőkorlát).

## Benchmarkok és bizonyítékok

A `benchmarks/` tartalmazza a két harness-t, amelyek a README minden számát
előállították — lásd [benchmarks/README.md](../../benchmarks/README.md).
