# Sweep billing visi Anthropic

🌐 Diterjemahkan: [semua bahasa](../../../README.md)

**Kenapa ini ada:** gate profitabilitas hanya aman jika estimasi biayanya
*eksak*. Formula yang meleset sedikit saja akan mengonversi blok yang
sebenarnya lebih mahal. Jadi sweep ini mengunci formula ke angka nyata API
sebelum dirilis — sampai ke **residual nol**.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

Sweep `count_tokens` gratis yang memutuskan dua pertanyaan geometri terbuka:

1. **Formula** — apakah API menagih patch `ceil(w/28) × ceil(h/28)` (dokumentasi
   saat ini) atau `w·h/750` yang sudah pensiun? Set probe memisahkan keduanya
   dengan 25–180 token per baris.
2. **Tier** — apakah `claude-fable-5` mendapatkan cap resolusi tinggi (sisi
   panjang ≤ 2576 px, ≤ 4784 token visual)? Baris `page-old-1928x1928` adalah
   penentunya: ≈ **4761** yang terukur berarti high-res WYSIWYG (halaman besar
   lama membawa ~3,3× lebih banyak karakter per gambar dibanding 1568×728
   hari ini, dengan karakter/token yang sama); ≈ **1521** berarti resample
   tier standard, dan 1568×728 tetap benar.

Konteks: sweep 2026-07-01 di balik halaman 1568×728 saat ini (audit
keterbacaan, 2026-07-01) diukur pada `claude-sonnet-4-5` — model tier
standard — sementara produksi menargetkan Fable 5, yang oleh dokumentasi visi
ditempatkan di tier resolusi tinggi. Audit itu juga mengukur halaman saat ini
pada 1460 token: lebih dekat ke 1456 dari formula patch dibanding 1522 dari
/750, mengindikasikan API sudah pindah ke billing patch.

## Menjalankan

```bash
pnpm run build                              # prasyarat dist/ (seperti semua eval)
node benchmarks/billing-sweep/run.mjs --dry-run   # hanya prediksi, tanpa key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Harus mengenai API **langsung** — jangan pernah lewat proxy OmniGlyph, yang
akan mentransformasi body-nya. `count_tokens` gratis; sweep lengkap membuat
~25 permintaan.

## Membaca output

Per model, setiap baris probe menampilkan token gambar terukur (dengan-gambar
dikurangi baseline teks-saja) terhadap keempat prediksi
(`patch`/`legacy750` × `standard`/`highres`); ringkasan meranking hipotesis
berdasarkan residual absolut rata-rata. `--probe-multi` memeriksa cap
per-gambar (2×1092² ≈ 2×1521); `--probe-20plus` memeriksa aturan >20-gambar
(sisi >2000 px harus ditolak, bukan di-resample). Baris masuk ke
`results/*.jsonl`; matematika prediksi ada di `formulas.mjs`, dikunci oleh
`tests/billing-sweep-formulas.test.ts`.

## Setelah putusan

- Formula patch terkonfirmasi → port PR OmniGlyph #27 (translasi resize
  eksak) dan selaraskan matematika gate `ANTHROPIC_PIXELS_PER_TOKEN` di
  `src/core/transform.ts`.
- Tier high-res terkonfirmasi pada Fable → hadirkan kembali geometri halaman
  per-tier (halaman kelas 1928×1928 untuk Fable/Opus 4.8/Sonnet 5, 1568×728
  untuk standard), meniru cara jalur GPT sudah mempertahankan
  `GPT_MAX_HEIGHT_PX`-nya sendiri.
