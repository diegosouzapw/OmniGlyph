# Arsitektur

Peta satu-halaman dari codebase.

## Pipeline permintaan

```
client (Claude Code / SDK apa pun)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        host (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  satu Web-standard fetch handler:
  │                                routing, passthrough auth, counterfactual
  │                                count_tokens, event usage/telemetri
  ▼
src/core/transform.ts              PIPELINE utama (jalur Anthropic):
  │   1. parse body, resolve tier visi dari model
  │   2. gate profitabilitas — biaya gambar eksak vs biaya teks
  │   3. konversi: slab statis · tool_results besar · riwayat yang di-collapse
  │   4. sambung kembali sambil mempertahankan anchor cache_control klien
  ▼
API upstream (api.anthropic.com / api.openai.com)
```

## Billing (eksak, terukur)

| modul | provider | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patch 28 px + 4/blok, batas resize per tier; geometri halaman (kedua tier merender halaman standard 1568×728 — tier high-res adalah jebakan billing, lihat [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | rezim patch/tile per model, `detail` per profile, geometri strip |
| `src/core/gemini-model-profiles.ts` | Google | formula tile (`floor(min/1.5)` crop unit) + biaya flat `media_resolution` |

## Rendering

- `src/core/render.ts` — teks → PNG lewat atlas glyph yang dipanggang (Spleen 5×8 +
  fallback Unifont), reflow dengan sentinel newline `↵`, atlas 1-bit di
  produksi (terukur lebih baik dari AA pada Fable).
- `src/core/render-cache.ts` — memoisasi LRU dari render deterministik (slab
  statis + chunk riwayat beku di-render ulang setiap request jika tidak ada
  ini).
- `src/core/history.ts` — meruntuhkan giliran lama menjadi chunk gambar beku
  append-only yang tetap identik byte agar prompt caching terus hit.
- `src/core/png.ts` — encoder PNG deterministik minimal (tanpa dependency
  native).

## Guard rails

- Allowlist model (`src/core/applicability.ts`): hanya model yang lolos
  benchmark pembacaan yang digambar; sisanya lewat identik byte.
- Nilai byte-exact (SHA, id) ikut sebagai teks di dalam fact sheet di samping
  gambar (`src/core/factsheet.ts`); original yang dapat dipulihkan lewat
  `emitRecoverable`.
- Tool native bertipe (`type !== 'custom'`) tidak pernah ditulis ulang
  (guard 400).

## Benchmark & bukti

`benchmarks/` menyimpan dua harness yang menghasilkan setiap angka di README
— lihat [benchmarks/README.md](../../benchmarks/README.md).
