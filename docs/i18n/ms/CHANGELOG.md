# Log Perubahan

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versi semantik.

## [1.0.0] — 2026-07-07

Keluaran awam pertama.

### Produk

- **Proksi pemampatan konteks-sebagai-imej**: menulis semula bahagian besar
  setiap permintaan LLM (system prompt, dokumentasi alat, sejarah lama, output
  alat yang besar) menjadi halaman PNG 1-bit padat sebelum ia meninggalkan
  mesin anda. Pelayan Node tempatan dan hos Cloudflare Workers.
- **Matematik pengebilan tepat bagi setiap penyedia** (`src/core/`): patch
  28px Anthropic + overhed 3–4 token/blok (ujian sendiri, sifar baki), formula
  OpenAI dan Gemini diaudit berbanding dokumentasi rasmi. Dieksport pada akar
  pakej (`anthropicImageTokens`, `resolveAnthropicVisionTier`, had tingkat).
- **Konfigurasi render pengeluaran yang diukur**: atlas glif 1-bit padat
  (tiada anti-aliasing), halaman tingkat standard — setiap pilihan disokong
  oleh resit penanda aras dalam `benchmarks/*/results/`.
- **Harness penanda aras** (`benchmarks/`): billing-sweep (perakaunan token)
  dan density-frontier (sempadan ketepatan bacaan merentasi model/kepadatan),
  boleh dijalankan semula melalui API, OpenRouter, Claude Code CLI, atau
  melalui OmniRoute (`--via-omniroute`).
- **Cuba semula penolakan**: pengendus SSE/JSON menghantar semula permintaan
  asal apabila model menolak halaman yang dirender (suis kill
  `retryRefusalWithOriginal`).
- **Cache render LRU** untuk halaman deterministik.
- **Enjin OmniRoute**: dihantar sebagai enjin pemampatan `omniglyph` dalam
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (mod tunggal dan
  saluran paip bertindan), dengan get gagal-tertutup dan perakaunan token
  sedar-imej.

### Angka (semuanya boleh dihasilkan semula)

- Contoh render UI: 1015 aksara → PNG 438×120, 254 → 84 token (**66.9%
  dijimatkan**).
- Halaman standard 1568×728 = 1456 token imej tanpa mengira berapa banyak
  teks yang dipegangnya.
- Claude membaca halaman padat 1-bit pada 100% pada kepadatan pengeluaran;
  Opus 4.8 membaca 77–87% pada 10×16.

### Keputusan negatif (diukur, bukan pendapat)

- **Tingkat resolusi tinggi ialah perangkap pengebilan**: halaman 1928²
  dikenakan bil secara WYSIWYG tetapi pengekod tidak menerima resolusi penuh
  — kedua-dua tingkat merender halaman standard.
- **GPT-5.5 ditolak**: 0/60 bacaan jalur padat dan ~40× penggembungan
  penyiapan berbanding kawalan teks.
- **gpt-4o-mini tidak pernah dijadikan imej** (had 2833/5667 token menjadikan
  ia tidak menguntungkan).
- **Gemini 2.5-flash mengarang jawapan** berbanding menahan diri pada halaman
  padat (0/26) — menunggu ujian semula dengan kuota berbayar.
