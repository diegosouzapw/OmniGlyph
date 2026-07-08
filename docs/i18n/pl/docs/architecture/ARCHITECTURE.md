# Architektura

Jednostronicowa mapa bazy kodu.

## Potok zapytań

```
client (Claude Code / dowolne SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosty (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  pojedynczy handler fetch zgodny z Web:
  │                                routing, przekazywanie autoryzacji,
  │                                kontrfaktyczny count_tokens, zdarzenia
  │                                użycia/telemetrii
  ▼
src/core/transform.ts              PODSTAWOWY potok (ścieżka Anthropic):
  │   1. parsowanie treści, rozwiązanie poziomu wizji z modelu
  │   2. bramka opłacalności — dokładny koszt obrazu vs koszt tekstu
  │   3. konwersja: statyczny slab · duże tool_results · zwinięta historia
  │   4. sklejenie z powrotem z zachowaniem kotwic cache_control klienta
  ▼
API nadrzędne (api.anthropic.com / api.openai.com)
```

## Rozliczenia (dokładne, zmierzone)

| moduł | dostawca | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | płatki 28 px + 4/blok, limity zmiany rozmiaru per poziom; geometria strony (oba poziomy renderują standardową stronę 1568×728 — poziom wysokiej rozdzielczości to pułapka rozliczeniowa, zobacz [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | reżimy patch/kafelek per model, `detail` per profil, geometria paska |
| `src/core/gemini-model-profiles.ts` | Google | wzór kafelków (`floor(min/1.5)` jednostka przycięcia) + stałe koszty `media_resolution` |

## Renderowanie

- `src/core/render.ts` — tekst → PNG przez wypieczony atlas glifów (Spleen
  5×8 + fallback Unifont), reflow z sentinelami nowej linii `↵`, atlas
  1-bit w produkcji (zmierzone jako lepsze niż AA na Fable).
- `src/core/render-cache.ts` — memoizacja LRU deterministycznych renderów
  (inaczej statyczny slab + zamrożone fragmenty historii renderowałyby się
  ponownie przy każdym zapytaniu).
- `src/core/history.ts` — zwija stare tury w fragmenty obrazów tylko do
  dopisywania, które pozostają identyczne co do bajtu, aby cache promptów
  wciąż trafiał.
- `src/core/png.ts` — minimalny deterministyczny koder PNG (bez natywnych
  zależności).

## Zabezpieczenia

- Lista dozwolonych modeli (`src/core/applicability.ts`): tylko modele,
  które przeszły benchmark odczytu, są przekształcane na obraz; wszystko
  inne przechodzi bez zmian, identyczne co do bajtu.
- Wartości dokładne co do bajtu (SHA, id) jadą jako tekst w arkuszu faktów
  obok obrazu (`src/core/factsheet.ts`); oryginały do odzyskania przez
  `emitRecoverable`.
- Natywne typowane narzędzia (`type !== 'custom'`) nigdy nie są przepisywane
  (zabezpieczenie 400).

## Benchmarki i dowody

`benchmarks/` przechowuje dwa zestawy, które wyprodukowały każdą liczbę w
README — zobacz [benchmarks/README.md](../../benchmarks/README.md).
