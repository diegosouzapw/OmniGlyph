# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [1.0.0] — 2026-07-07

Rilis publik pertama.

### Produk

- **Proxy kompresi context-as-image**: menulis ulang bagian-bagian besar dari
  setiap permintaan LLM (system prompt, dokumentasi tool, riwayat lama, output
  tool besar) menjadi halaman PNG 1-bit padat sebelum meninggalkan mesin Anda.
  Server Node lokal dan host Cloudflare Workers.
- **Matematika penagihan eksak per provider** (`src/core/`): patch 28px
  Anthropic + overhead 3–4 token/blok (sweep sendiri, residual nol), formula
  OpenAI dan Gemini diaudit terhadap dokumentasi resmi. Diekspor di root paket
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, batas tingkatan).
- **Konfigurasi render produksi yang terukur**: atlas glyph 1-bit padat (tanpa
  anti-aliasing), halaman tingkatan standar — setiap pilihan didukung oleh
  bukti benchmark di `benchmarks/*/results/`.
- **Harness benchmark** (`benchmarks/`): billing-sweep (akuntansi token) dan
  density-frontier (frontier akurasi-baca lintas model/kepadatan), dapat
  dijalankan ulang via API, OpenRouter, Claude Code CLI, atau lewat OmniRoute
  (`--via-omniroute`).
- **Retry penolakan**: sniffer SSE/JSON memutar ulang permintaan asli ketika
  sebuah model menolak halaman yang dirender (kill switch
  `retryRefusalWithOriginal`).
- **Cache render LRU** untuk halaman deterministik.
- **Engine OmniRoute**: hadir sebagai engine kompresi `omniglyph` di
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (mode tunggal dan
  pipeline bertumpuk), dengan gate fail-closed dan akuntansi token
  sadar-gambar.

### Angka-angka (semuanya dapat direproduksi)

- Contoh render UI: 1015 karakter → PNG 438×120, 254 → 84 token (**hemat 66,9%**).
- Halaman standar 1568×728 = 1456 token gambar terlepas dari berapa banyak teks yang dikandungnya.
- Claude membaca halaman 1-bit padat pada 100% di kepadatan produksi; Opus 4.8 membaca
  77–87% pada 10×16.

### Keputusan negatif (terukur, bukan opini)

- **Tingkatan resolusi tinggi adalah jebakan penagihan**: halaman 1928² ditagih
  WYSIWYG tetapi encoder tidak menerima resolusi penuh — kedua tingkatan
  merender halaman standar.
- **GPT-5.5 ditolak**: 0/60 pembacaan strip padat dan inflasi completion ~40×
  dibandingkan kontrol teks.
- **gpt-4o-mini tidak pernah digambar** (floor 2833/5667 token membuatnya tidak menguntungkan).
- **Gemini 2.5-flash berkonfabulasi** alih-alih abstain pada halaman padat
  (0/26) — menunggu pengujian ulang dengan kuota berbayar.
