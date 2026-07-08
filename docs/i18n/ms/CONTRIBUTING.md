# Menyumbang kepada OmniGlyph

Terima kasih atas minat anda! Projek ini mempunyai dua peraturan budaya yang
tidak boleh dirunding — itulah sebab setiap angka dalam README boleh
dipercayai.

## Peraturan 1 — TDD Ketat

Semua kod pengeluaran lahir daripada ujian yang gagal terlebih dahulu:

1. Tulis ujian dan **lihat ia gagal atas sebab yang betul**.
2. Tulis yang minimum untuk lulus.
3. Susun semula (refactor) sambil kekal hijau.

Bar penuh ialah: `pnpm run typecheck && pnpm test && pnpm run build` —
ketiga-tiganya, sentiasa (lint pautan dokumentasi dan pengawal penjenamaan
semula berjalan di dalam `pnpm test` melalui `tests/docs-integrity.test.ts`).

## Peraturan 2 — Pengukuran sebelum dakwaan

Tiada perubahan pada geometri, atlas, formula pengebilan, atau skop model
yang dilaksanakan tanpa angka yang diukur. Repositori ini dibina di sekitar
disiplin ini:

- Kos pengebilan → buktikan dengan `benchmarks/billing-sweep/`
  (`count_tokens` percuma; baki yang dijangka: sifar).
- Kebolehbacaan → buktikan dengan `benchmarks/density-frontier/` (n≥30 setiap
  lengan, penskoran deterministik, resit JSONL disimpan dalam
  `benchmarks/*/results/`).
- Bar penerimaan untuk mengubah lalai pengeluaran: gist == garis dasar teks
  **DAN** sifar ralat rentetan-tepat senyap **DAN** penjimatan positif.

Hipotesis tanpa angka pergi ke `docs/ROADMAP.md` sebagai hipotesis — tidak
pernah ke README sebagai fakta. Dua idea "jelas" telah dipatahkan dengan
data (halaman resolusi tinggi, atlas anti-aliased); proses ini berfungsi.

## Persediaan

```bash
pnpm install
pnpm test              # suite penuh, ~40–90s
pnpm run dev:node      # proksi tempatan dalam mod watch
```

Node ≥18 (CI menguji 20/22/24), pnpm 10 (dipin oleh `packageManager` dalam
package.json).

## Struktur

| folder | peraturan |
|---|---|
| `src/core/` | tidak bergantung pada runtime (hanya Web API — berjalan pada Node dan Workers) |
| `src/node.ts` / `src/worker.ts` | hanya perpaipan hos |
| `benchmarks/` | harness boleh dijalankan semula; hasil JSONL ialah resit, disimpan |
| `docs/` | benchmarks/ (angka), architecture/ (peta), ROADMAP (hipotesis), ops/ (OmniRoute) |

## Komit dan PR

- Komit konvensional (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), badan menerangkan *sebab* dengan angka yang berkaitan.
- PR kecil, fokus; perubahan tingkah laku disertakan dengan ujian yang
  mengesahkannya dan, apabila berkaitan, penanda aras yang mewajarkannya.
- Jangan tulis semula blok `cache_control` klien, jangan tambah kebergantungan
  runtime tanpa perbincangan (teras sengaja ringan dari segi kebergantungan),
  jangan gunakan `Math.random`/cap masa dalam laluan render (ketentuan
  deterministik ialah invarian keras, diuji dengan identiti bait).
