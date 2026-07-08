# Architecture

Eine einseitige Übersicht über die Codebasis.

## Request-Pipeline

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

## Billing (exakt, gemessen)

| Modul | Anbieter | Modell |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28-px-Patches + 4/Block, Größenbegrenzungen pro Tarifstufe; Seitengeometrie (beide Tarifstufen rendern die Standard-1568×728-Seite — die High-Res-Stufe ist eine Billing-Falle, siehe [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | Patch/Kachel-Regime pro Modell, `detail` pro Profil, Strip-Geometrie |
| `src/core/gemini-model-profiles.ts` | Google | Kachel-Formel (`floor(min/1.5)` Zuschnitt-Einheit) + `media_resolution`-Pauschalkosten |

## Rendering

- `src/core/render.ts` — Text → PNG über einen fest eingebrannten
  Glyphenatlas (Spleen 5×8 + Unifont-Fallback), Reflow mit
  `↵`-Zeilenumbruch-Sentinels, 1-Bit-Atlas in der Produktion (gemessen besser
  als AA bei Fable).
- `src/core/render-cache.ts` — LRU-Memoisierung deterministischer Renderings
  (statischer Slab + eingefrorene Verlaufs-Chunks würden sonst bei jedem
  Request neu gerendert).
- `src/core/history.ts` — fasst alte Runden zu Append-only-eingefrorenen
  Bild-Chunks zusammen, die byte-identisch bleiben, damit Prompt-Caching
  weiterhin trifft.
- `src/core/png.ts` — minimaler deterministischer PNG-Encoder (keine
  nativen Abhängigkeiten).

## Sicherheitsschranken

- Modell-Allowlist (`src/core/applicability.ts`): nur Modelle, die den
  Lese-Benchmark bestanden haben, werden verbildlicht; alles andere läuft
  byte-identisch durch.
- Byte-exakte Werte (SHAs, IDs) reisen als Text in einem Factsheet neben dem
  Bild mit (`src/core/factsheet.ts`); wiederherstellbare Originale über
  `emitRecoverable`.
- Native typisierte Tools (`type !== 'custom'`) werden nie umgeschrieben
  (400-Schutz).

## Benchmarks & Belege

`benchmarks/` enthält die beiden Harnesses, die jede Zahl in der README
erzeugt haben — siehe [benchmarks/README.md](../../benchmarks/README.md).
