# density-frontier — biaya × akurasi per resolusi

🌐 Diterjemahkan: [semua bahasa](../../../README.md)

Harness yang mengukur **frontier Pareto antara biaya dan keterbacaan** dari
render teks→gambar, per provider (Anthropic / OpenAI / Gemini), geometri
halaman, sel glyph, dan style atlas.

Halaman yang lebih murah (lebih padat) membawa lebih banyak karakter per
token tapi pada titik tertentu berhenti bisa dibaca. Sebuah konfigurasi hanya
boleh dirilis jika **keduanya** terpenuhi — biaya rendah *dan* model masih
membacanya dengan sempurna:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

Setiap jawaban dinilai ke dalam tepat satu dari tiga hasil — hasil yang di
tengah itulah yang membuat gate ini bisa dipercaya:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Sebuah konfigurasi yang menghasilkan meski hanya satu 🔴 langsung
didiskualifikasi, sehemat apa pun biayanya.

Asimetri utamanya: sejak sweep billing (2026-07-05,
`benchmarks/billing-sweep/`), **biaya dapat diprediksi secara eksak
offline** — patch 28 px + 4/blok pada Anthropic (`src/core/anthropic-vision.ts`),
profile patch/tile pada OpenAI (`src/core/openai.ts`), tile/media_resolution
pada Gemini (`gemini-cost.ts`). Hanya **akurasi pembacaan** yang butuh API.

## Desain

- **Corpus** (`corpus.ts`): filler padat gaya log/JSON + needle yang ditanam
  dari kelas yang menurut matriks konfusabilitas gagal (hex 12 karakter,
  camelCase, rangkaian digit 6/8/5/3) + **distractor near-miss** yang
  dibangun dari pasangan konfusabilitas terukur. Jika model menjawab
  distractor tersebut, kebingungannya *terprediksi* — itu adalah mode
  kegagalan diam-diam yang terdeteksi, bukan hanya dihitung salah.
  Deterministik (mulberry32).
- **Konfigurasi** (`configs.ts`): grid terkurasi — halaman standard 1568×728
  vs high-res 1928×1928 (A/B yang menentukan geometri per tier), AA vs 1-bit
  (menyelesaikan kontradiksi render padat), sel 7×10/10×16 (mode aman Opus),
  strip GPT, dan dua taruhan Gemini (≤384² = 258 flat;
  `media_resolution: low` = 280 tetap → ~116 char/token *jika* terbaca).
- **Score** (`score.ts`): kecocokan eksak deterministik, tanpa LLM-judge.
  Tiga output: `correct` / `abstained` (sentinel ILEGIVEL — kegagalan jujur)
  / `silent_wrong` (mode berbahaya), dengan flag distractor.

## Menjalankan

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # tabel biaya, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needle+3 gist × konfigurasi × trial
```

Konfigurasi spesifik: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Jawaban jatuh ke `results/*.jsonl` (satu baris per pertanyaan, dengan jawaban
mentah untuk audit).

## Standar penerimaan (diwarisi dari PR #35/#36 upstream)

Sebuah konfigurasi hanya menjadi default produksi jika: **gist == baseline
teks** DAN **nol string eksak salah secara diam-diam** DAN **savings
positif**. Run wajib pertama adalah `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` pada Fable — spot-check keterbacaan halaman besar
sebelum mengaktifkan tier high-res.

## `--via-omniroute` — e2e lewat OmniRoute (P3: bukti non-degradasi)

Transport di atas merender teks→PNG **di dalam harness** dan mengirim
gambarnya. `--via-omniroute` melakukan kebalikannya, yaitu jalur produksi:
mengirim **teks padat** ke instance OmniRoute yang sedang berjalan,
membiarkan **engine `omniglyph` merender** halamannya dan meneruskannya ke
Anthropic, lalu mengukur pembacaan + savings. Jika pembacaan tetap sama
dengan rute langsung **dan** OmniRoute melaporkan kompresi, maka terbukti
bahwa render+forward OmniRoute **tidak mendegradasi** halamannya.

Prasyarat (operasional):

1. **OmniRoute berjalan** (`npm run dev`, default `http://localhost:20128`).
2. Sebuah **provider Anthropic** dikonfigurasi di OmniRoute dengan **key
   asli** (rute langsung — gate `providerTransport==='direct'` hanya lolos
   untuk provider `anthropic`).
3. Engine **`omniglyph` DIAKTIFKAN** di konfigurasi kompresi OmniRoute
   (`config.engines.omniglyph.enabled = true`) — header `engine:omniglyph`
   hanya muncul dengan engine ini diaktifkan. (Engine ini
   `stable:false`/preview; aktifkan secara eksplisit.)
4. Sebuah **API key OmniRoute itu sendiri** di `OMNIROUTE_API_KEY` (yang
   dipakai klien untuk autentikasi ke OmniRoute, bukan yang dari Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<key-omniroute-anda> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Setiap jawaban mencatat `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(dari header respons `X-OmniRoute-Compression`) ke JSONL; baris tabel
menunjukkan berapa banyak jawaban yang datang terkompresi + savings median.
**Standar P3**: pembacaan verbatim/gist yang sama dengan rute langsung
(non-degradasi) **dengan** `omnirouteSavings` tidak-null (bukti bahwa terjadi
render, bukan pembacaan teks mentah). Jika muncul `TIDAK terkompresi`, engine
tidak diaktifkan di OmniRoute (atau body tidak lolos gate fail-closed).

Test bagian murninya: `tests/density-frontier.test.ts` (termasuk
`buildOmnirouteRequest` dan `parseCompressionSavings` dari transport
via-omniroute).
