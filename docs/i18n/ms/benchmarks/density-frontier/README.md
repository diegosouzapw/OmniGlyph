# density-frontier — kos × ketepatan setiap resolusi

Harness yang mengukur **sempadan Pareto antara kos dan kebolehbacaan** bagi
render teks→imej, setiap penyedia (Anthropic / OpenAI / Gemini), geometri
halaman, sel glif, dan gaya atlas.

Ketidaksimetrian utama: sejak ujian pengebilan (2026-07-05,
`benchmarks/billing-sweep/`), **kos boleh diramal secara tepat luar
talian** — patch 28 px + 4/blok pada Anthropic
(`src/core/anthropic-vision.ts`), profil patch/jubin pada OpenAI
(`src/core/openai.ts`), jubin/media_resolution pada Gemini
(`gemini-cost.ts`). Hanya **ketepatan bacaan** yang memerlukan API.

## Reka bentuk

- **Korpus** (`corpus.ts`): pengisi gaya log/JSON padat + needle tertanam
  daripada kelas yang menurut matriks keliru-glif gagal (heks 12-aksara,
  camelCase, digit 6/8/5/3) + **pengganggu hampir-terlepas** yang dibina
  daripada pasangan keliru yang diukur. Jika model menjawab dengan
  pengganggu, kekeliruan itu *diramal* — itulah mod kegagalan senyap yang
  dikesan, bukan sekadar dikira salah. Deterministik (mulberry32).
- **Konfigurasi** (`configs.ts`): grid terpilih — halaman standard
  1568×728 vs resolusi tinggi 1928×1928 (A/B yang menentukan geometri
  setiap tingkat), AA vs 1-bit (menyelesaikan percanggahan render padat),
  sel 7×10/10×16 (mod selamat Opus), jalur GPT, dan dua taruhan Gemini
  (≤384² = 258 flat; `media_resolution: low` = 280 tetap → ~116
  aksara/token *jika* boleh dibaca).
- **Skor** (`score.ts`): padanan tepat deterministik, tiada hakim-LLM.
  Tiga hasil: `correct` / `abstained` (sentinel ILEGIVEL — kegagalan
  jujur) / `silent_wrong` (mod berbahaya), dengan penanda pengganggu.

## Menjalankan

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # jadual kos, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needle+3 gist × konfigurasi × ujian
```

Konfigurasi khusus: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Jawapan mendarat dalam `results/*.jsonl` (satu baris setiap soalan, dengan
jawapan mentah untuk pengauditan).

## Bar penerimaan (diwarisi daripada PR upstream #35/#36)

Konfigurasi hanya menjadi lalai pengeluaran jika: **gist == garis dasar
teks** DAN **sifar rentetan tepat salah-senyap** DAN **penjimatan
positif**. Larian wajib pertama ialah `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` pada Fable — pemeriksaan kebolehbacaan halaman
besar sebelum mengaktifkan tingkat resolusi tinggi.

## `--via-omniroute` — hujung ke hujung melalui OmniRoute (P3: bukti tiada kemerosotan)

Pengangkutan di atas merender teks→PNG **dalam harness** dan menghantar
imej. `--via-omniroute` melakukan sebaliknya, iaitu laluan pengeluaran: ia
menghantar **teks padat** kepada instans OmniRoute yang sedang berjalan,
membiarkan enjin **`omniglyph` merender** halaman dan menghantarnya ke
Anthropic, serta mengukur bacaan + penjimatan. Jika bacaan kekal sama
dengan laluan terus **dan** OmniRoute melaporkan pemampatan, terbukti
bahawa render+hantar OmniRoute **tidak merosotkan** halaman.

Prasyarat (operasi):

1. **OmniRoute berjalan** (`npm run dev`, lalai `http://localhost:20128`).
2. Penyedia **Anthropic** dikonfigurasi dalam OmniRoute dengan **kunci
   sebenar** (laluan terus — get `providerTransport==='direct'` hanya
   lulus untuk penyedia `anthropic`).
3. **Enjin `omniglyph` DIAKTIFKAN** dalam konfigurasi pemampatan OmniRoute
   (`config.engines.omniglyph.enabled = true`) — header
   `engine:omniglyph` hanya tercetus apabila enjin diaktifkan. (Enjin ini
   `stable:false`/pratonton; aktifkan secara eksplisit.)
4. Kunci API OmniRoute dalam `OMNIROUTE_API_KEY` (yang digunakan klien
   untuk mengesahkan diri terhadap OmniRoute, bukan yang Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Setiap jawapan merekodkan
`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(daripada header respons `X-OmniRoute-Compression`) dalam JSONL; baris
jadual menunjukkan berapa banyak jawapan yang kembali dimampatkan +
penjimatan median. **Bar P3**: bacaan verbatim/gist yang sama seperti
laluan terus (tiada kemerosotan) **dengan** `omnirouteSavings` bukan-null
(membuktikan render berlaku, bukan bacaan teks mentah). Jika `did NOT
compress` muncul, enjin tidak diaktifkan dalam OmniRoute (atau badan tidak
melepasi get gagal-tertutup).

Ujian untuk bahagian tulen: `tests/density-frontier.test.ts` (termasuk
`buildOmnirouteRequest` dan `parseCompressionSavings` daripada pengangkutan
via-omniroute).
