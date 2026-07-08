# Ujian pengebilan visi Anthropic

🌐 Diterjemahkan: [semua bahasa](../../../README.md)

**Sebab ia wujud:** get keberuntungan hanya selamat jika anggaran kos itu
*tepat*. Formula yang tersasar sedikit sahaja boleh menukar blok yang
sebenarnya kos lebih tinggi. Justeru ujian ini mengunci formula kepada
angka sebenar API sebelum ia dilancarkan — kepada **baki sifar**.

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

Ujian `count_tokens` percuma yang menyelesaikan dua soalan geometri
terbuka:

1. **Formula** — adakah API mengenakan bil `ceil(w/28) × ceil(h/28)` patch
   (dokumentasi semasa) atau `w·h/750` yang telah lapuk? Set ujian
   memisahkan kedua-duanya dengan 25–180 token setiap baris.
2. **Tingkat** — adakah `claude-fable-5` mendapat had resolusi tinggi
   (tepi panjang ≤ 2576 px, ≤ 4784 token visual)? Baris
   `page-old-1928x1928` ialah penentu: ≈ **4761** yang diukur bermakna
   WYSIWYG resolusi tinggi (halaman besar lama memegang ~3.3× lebih
   banyak aksara setiap imej daripada halaman 1568×728 hari ini, pada
   aksara/token yang sama); ≈ **1521** bermakna resample tingkat standard,
   dan 1568×728 kekal betul.

Konteks: ujian 2026-07-01 di sebalik halaman 1568×728 semasa (audit
kebolehbacaan, 2026-07-01) diukur pada `claude-sonnet-4-5` — model tingkat
standard — manakala pengeluaran menyasarkan Fable 5, yang diletakkan oleh
dokumentasi visi dalam tingkat resolusi tinggi. Audit itu juga mengukur
halaman semasa pada 1460 token: lebih hampir kepada 1456 formula patch
berbanding 1522 daripada /750, mengesyaki API sudah berpindah kepada
pengebilan patch.

## Jalankan

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Mesti mengenai API secara **langsung** — jangan sekali-kali melalui proksi
OmniGlyph, yang akan mengubah badan permintaan. `count_tokens` percuma;
ujian penuh membuat ~25 permintaan.

## Membaca output

Bagi setiap model, setiap baris ujian menunjukkan token imej yang diukur
(dengan-imej tolak garis dasar teks-sahaja) berbanding kesemua empat
ramalan (`patch`/`legacy750` × `standard`/`highres`); ringkasan menyusun
hipotesis mengikut baki mutlak min. `--probe-multi` menyemak had setiap
imej (2×1092² ≈ 2×1521); `--probe-20plus` menyemak peraturan >20-imej
(sisi >2000 px mesti ditolak, bukan diresample). Baris mendarat dalam
`results/*.jsonl`; matematik ramalan berada dalam `formulas.mjs`, dikunci
oleh `tests/billing-sweep-formulas.test.ts`.

## Selepas keputusan

- Formula patch disahkan → port PR #27 OmniGlyph (terjemahan saiz semula
  tepat) dan selaraskan matematik get `ANTHROPIC_PIXELS_PER_TOKEN` dalam
  `src/core/transform.ts`.
- Tingkat resolusi tinggi disahkan pada Fable → perkenalkan semula
  geometri halaman setiap tingkat (halaman kelas 1928×1928 untuk
  Fable/Opus 4.8/Sonnet 5, 1568×728 untuk standard), mencerminkan cara
  laluan GPT sudah mengekalkan `GPT_MAX_HEIGHT_PX` sendiri.
