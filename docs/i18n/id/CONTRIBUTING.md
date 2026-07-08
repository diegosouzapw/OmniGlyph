# Berkontribusi ke OmniGlyph

Terima kasih atas minat Anda! Proyek ini memiliki dua aturan budaya yang tidak
bisa ditawar — itulah alasan setiap angka di README dapat dipercaya.

## Aturan 1 — TDD Ketat

Semua kode produksi lahir dari sebuah test yang gagal terlebih dahulu:

1. Tulis test-nya dan **lihat ia gagal karena alasan yang benar**.
2. Tulis yang minimum agar lolos.
3. Refactor sambil tetap hijau.

Standar penuhnya adalah: `pnpm run typecheck && pnpm test && pnpm run build`
— ketiganya, selalu (lint-link docs dan guard rebrand berjalan di dalam
`pnpm test` lewat `tests/docs-integrity.test.ts`).

## Aturan 2 — Pengukuran sebelum klaim

Tidak ada perubahan pada geometri, atlas, formula penagihan, atau lingkup
model yang bisa masuk tanpa angka yang terukur. Repositori ini dibangun di
sekitar disiplin ini:

- Biaya penagihan → buktikan dengan `benchmarks/billing-sweep/` (`count_tokens`
  gratis; residual yang diharapkan: nol).
- Keterbacaan → buktikan dengan `benchmarks/density-frontier/` (n≥30 per lengan,
  penilaian deterministik, bukti JSONL yang di-commit ke `benchmarks/*/results/`).
- Standar penerimaan untuk mengubah default produksi: gist == baseline teks
  **DAN** nol error string-eksak diam-diam **DAN** penghematan positif.

Hipotesis tanpa angka masuk ke `docs/ROADMAP.md` sebagai hipotesis — tidak
pernah ke README sebagai fakta. Dua ide yang "jelas" sudah dibantah dengan data
(halaman resolusi tinggi, atlas anti-aliased); prosesnya berhasil.

## Setup

```bash
pnpm install
pnpm test              # suite lengkap, ~40–90s
pnpm run dev:node      # proxy lokal dalam mode watch
```

Node ≥18 (CI menguji 20/22/24), pnpm 10 (dipin oleh `packageManager` di
package.json).

## Struktur

| folder | aturan |
|---|---|
| `src/core/` | tidak tergantung runtime (hanya Web API — jalan di Node dan Workers) |
| `src/node.ts` / `src/worker.ts` | hanya plumbing host |
| `benchmarks/` | harness yang dapat dijalankan ulang; hasil JSONL adalah bukti, di-commit |
| `docs/` | benchmarks/ (angka), architecture/ (peta), ROADMAP (hipotesis), ops/ (OmniRoute) |

## Commit dan PR

- Conventional commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), body menjelaskan *alasannya* dengan angka yang relevan.
- PR kecil dan fokus; perubahan perilaku disertai test yang mengunci mereka
  dan, jika berlaku, benchmark yang menjustifikasinya.
- Jangan tulis ulang blok `cache_control` klien, jangan menambah dependency
  runtime tanpa diskusi (core sengaja dibuat ringan dependency), jangan pakai
  `Math.random`/timestamp di jalur render (determinisme adalah invarian yang
  keras, diuji dengan kesetaraan byte).
