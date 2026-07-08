# Architecture

Codebaseஇன் one-page map.

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
| `src/core/anthropic-vision.ts` | Anthropic | 28 px patches + 4/block, per-tier resize caps; page geometry (இரண்டு tiers-உம் standard 1568×728 பக்கத்தை render செய்கின்றன — high-res tier ஒரு billing trap, [BENCHMARKS](../benchmarks/BENCHMARKS.md) பார்க்கவும்) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | per-model patch/tile regimes, profileக்கு `detail`, strip geometry |
| `src/core/gemini-model-profiles.ts` | Google | tile formula (`floor(min/1.5)` crop unit) + `media_resolution` flat costs |

## Rendering

- `src/core/render.ts` — text → PNG ஒரு baked glyph atlas மூலம் (Spleen 5×8 +
  Unifont fallback), `↵` newline sentinelsஉடன் reflow, productionஇல் 1-bit
  atlas (Fableஇல் AAஐ விட சிறப்பாக அளவிடப்பட்டது).
- `src/core/render-cache.ts` — deterministic rendersஇன் LRU memoization
  (இல்லையெனில் static slab + frozen history chunks ஒவ்வொரு requestக்கும் re-render ஆகும்).
- `src/core/history.ts` — பழைய turnsஐ append-only frozen image chunksஆக
  collapse செய்கிறது, அவை byte-identical ஆக இருப்பதால் prompt caching hit
  ஆகிக்கொண்டே இருக்கும்.
- `src/core/png.ts` — minimal deterministic PNG encoder (native depsஇல்லாமல்).

## Guard rails

- Model allowlist (`src/core/applicability.ts`): reading benchmarkஐ pass செய்த
  மாடல்கள் மட்டுமே imaged ஆகின்றன; மற்ற அனைத்தும் byte-identical ஆக pass ஆகின்றன.
- Byte-exact values (SHAs, ids) படத்தின் அருகில் ஒரு fact sheetஇல் உரையாகப்
  பயணிக்கின்றன (`src/core/factsheet.ts`); `emitRecoverable` மூலம் recoverable
  originals.
- Native typed tools (`type !== 'custom'`) ஒருபோதும் மறுஎழுதப்படுவதில்லை (400 guard).

## Benchmarks & ஆதாரங்கள்

`benchmarks/` READMEஇன் ஒவ்வொரு எண்ணையும் உருவாக்கிய இரண்டு harnessesஐ
வைத்திருக்கிறது — [benchmarks/README.md](../../benchmarks/README.md) பார்க்கவும்.
