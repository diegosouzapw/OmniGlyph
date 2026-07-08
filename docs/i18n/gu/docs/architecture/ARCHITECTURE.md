# Architecture

Codebase નો one-page નકશો.

## Request pipeline

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

## Billing (exact, measured)

| module | provider | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px patches + 4/block, per-tier resize caps; page geometry (બંને tiers standard 1568×728 page રેન્ડર કરે છે — high-res tier એક billing trap છે, જુઓ [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | per-model patch/tile regimes, profile દીઠ `detail`, strip geometry |
| `src/core/gemini-model-profiles.ts` | Google | tile formula (`floor(min/1.5)` crop unit) + `media_resolution` flat costs |

## Rendering

- `src/core/render.ts` — baked glyph atlas (Spleen 5×8 + Unifont fallback)
  દ્વારા text → PNG, `↵` newline sentinels સાથે reflow, production માં
  1-bit atlas (Fable પર AA કરતાં માપેલું વધુ સારું).
- `src/core/render-cache.ts` — ડિટરમિનિસ્ટિક renders નું LRU memoization
  (અન્યથા static slab + frozen history chunks દરેક request પર re-render
  થાય છે).
- `src/core/history.ts` — જૂના turns ને append-only frozen image chunks
  માં collapse કરે છે જે byte-identical રહે છે જેથી prompt caching hit
  કરતું રહે.
- `src/core/png.ts` — minimal ડિટરમિનિસ્ટિક PNG encoder (કોઈ native
  deps નહીં).

## Guard rails

- Model allowlist (`src/core/applicability.ts`): ફક્ત જે મોડેલ્સ reading
  benchmark માં પાસ થયા હોય તેમને imaged કરાય છે; બાકીના બધા
  byte-identical પસાર થાય છે.
- Byte-exact values (SHAs, ids) images ની બાજુમાં fact sheet માં text
  તરીકે ચાલે છે (`src/core/factsheet.ts`); `emitRecoverable` દ્વારા
  recoverable originals.
- Native typed tools (`type !== 'custom'`) ક્યારેય rewrite થતા નથી
  (400 guard).

## Benchmarks & receipts

`benchmarks/` બે harnesses ધરાવે છે જેણે README ની દરેક સંખ્યા બનાવી
— જુઓ [benchmarks/README.md](../../benchmarks/README.md).
