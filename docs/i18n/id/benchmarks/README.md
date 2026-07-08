# Benchmark

🌐 Diterjemahkan: [semua bahasa](../../README.md)

Setiap angka yang diklaim OmniGlyph berasal dari salah satu dari dua harness
di bawah ini — dapat dijalankan ulang, deterministik jika memungkinkan,
dengan bukti mentah per jawaban di `*/results/*.jsonl`. Analisis konsolidasi:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Cara kerja penghematannya (dalam satu gambar)

Provider menagih **teks per token**, tetapi menagih **gambar berdasarkan
dimensinya** — bukan berdasarkan seberapa banyak teks yang dijejalkan di
dalamnya. Satu halaman standard adalah biaya flat, tidak peduli sepadat apa
teksnya:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Konteks yang sama, ditagih dengan dua cara:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Kenapa gambar menang — karakter yang dibawa per token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph hanya melakukan penukaran ini ketika matematika eksak mengatakan itu
menang, dan hanya untuk model yang terbukti bisa membaca halamannya. Dua
harness di bawah ini membuktikan masing-masing separuhnya.

## 1. `billing-sweep/` — berapa sebenarnya biaya sebuah gambar?

Probe `count_tokens` gratis terhadap API Anthropic langsung, membandingkan
formula lama `w·h/750` dengan model patch 28 px saat ini pada 11 geometri
probe di 2 model × 2 tier resolusi.

**Hasil (2026-07-05): model patch cocok dengan residual NOL di setiap probe**
— ditagih = `⌈w/28⌉ × ⌈h/28⌉` setelah resize per tier, plus +3/+4 token tetap
per blok gambar. Halaman produksi (1568×728) biayanya persis 1.460 token dan
membawa 28.080 karakter ≈ **19,2 karakter/token** dibandingkan ~2
karakter/token sebagai teks padat.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # hanya prediksi, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # sweep langsung, tetap $0 (count_tokens gratis)
```

## 2. `density-frontier/` — apakah model benar-benar bisa MEMBACAnya?

Biaya (offline, eksak) × akurasi-baca (langsung) di berbagai konfigurasi
render, geometri halaman, atlas glyph, dan provider. Corpus menanam needle
string-eksak (id hex, camelCase, rangkaian digit) ditambah **distractor
near-miss yang dibangun dari pasangan konfusabilitas glyph yang terukur** —
sehingga konfabulasi diam-diam terdeteksi, tidak hanya dihitung salah.
Penilaian bersifat deterministik (bukan LLM-judge): `correct` / `abstained`
(`ILEGIVEL` yang jujur) / `silent_wrong` / `no_answer`.

**Hasil utama** (n=30 per lengan):

| lengan | pembacaan eksak | catatan |
|---|---:|---|
| Fable 5 · halaman standard · atlas 1-bit (produksi) | **30/30** | nol error, nol konfabulasi |
| Fable 5 · halaman standard · atlas AA (default lama) | 25/30 | 5 abstensi jujur — kenapa produksi dibalik ke 1-bit |
| Fable 5 · halaman high-res 1928² | 1–2/30 | ditagih 3,3× tetapi encoder-resampled — jebakan billing, tidak diaktifkan |
| Opus 4.8 · glyph 10×16 | 23–26/30 | mode aman opt-in |
| GPT-5.5 · strip 768px (kedua atlas) | 0/60 | + inflasi token output ~40× dibanding kontrol teksnya sendiri (30/30, 62 tok) |
| Gemini 2.5-flash (sebagian, kuota) | 0/26 | berkonfabulasi alih-alih abstain |

Akurasi baca sekilas — ini **adalah** gate model fail-closed itu sendiri,
digambarkan:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Hanya lengan ✅ yang dirilis. Apa pun yang membaca dengan buruk diblokir
*dengan bukti*, dan skor tiga arah berarti model yang menebak salah
(`silent_wrong`) diperlakukan lebih buruk daripada model yang jujur mengaku
tidak bisa (`ILEGIVEL`).

Tiga transport: API langsung (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), dan `--via-cli` (langganan Claude Code —
$0). Catatan yang dipelajari dengan cara sulit: perantara (OpenRouter, tool
Read pada CLI) me-resample gambar besar; hanya hasil API-langsung yang
otoritatif untuk keterbacaan.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # tabel biaya, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via langganan, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Unit test yang mengunci bagian murninya (corpus, penilaian, formula biaya):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
