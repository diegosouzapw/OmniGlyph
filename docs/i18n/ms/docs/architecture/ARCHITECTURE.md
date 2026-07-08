# Seni Bina

Peta satu halaman bagi pangkalan kod.

## Saluran paip permintaan

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

## Pengebilan (tepat, diukur)

| modul | penyedia | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patch 28 px + 4/blok, had saiz semula setiap tingkat; geometri halaman (kedua-dua tingkat merender halaman standard 1568×728 — tingkat resolusi tinggi ialah perangkap pengebilan, lihat [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | rejim patch/jubin setiap model, `detail` setiap profil, geometri jalur |
| `src/core/gemini-model-profiles.ts` | Google | formula jubin (`floor(min/1.5)` unit potongan) + kos tetap `media_resolution` |

## Render

- `src/core/render.ts` — teks → PNG melalui atlas glif yang dibakar
  (Spleen 5×8 + fallback Unifont), reflow dengan sentinel baris baharu `↵`,
  atlas 1-bit dalam pengeluaran (diukur lebih baik daripada AA pada Fable).
- `src/core/render-cache.ts` — memoisasi LRU render deterministik (slab
  statik + kepingan sejarah beku dirender semula pada setiap permintaan
  jika tidak).
- `src/core/history.ts` — mengecilkan pusingan lama menjadi kepingan imej
  beku tambah-sahaja yang kekal identik-bait supaya cache prompt terus
  mengena.
- `src/core/png.ts` — pengekod PNG deterministik minimum (tiada
  kebergantungan asli).

## Pengawal keselamatan

- Senarai benar model (`src/core/applicability.ts`): hanya model yang
  lulus penanda aras bacaan dijadikan imej; selebihnya melalui secara
  identik-bait.
- Nilai tepat-bait (SHA, id) mengiringi sebagai teks dalam helaian fakta
  di sebelah imej (`src/core/factsheet.ts`); asal boleh dipulihkan melalui
  `emitRecoverable`.
- Alat asli bertaip (`type !== 'custom'`) tidak pernah ditulis semula
  (pengawal 400).

## Penanda aras & resit

`benchmarks/` menyimpan dua harness yang menghasilkan setiap angka dalam
README — lihat [benchmarks/README.md](../../benchmarks/README.md).
