# Benchmark

Setiap angka yang diklaim OmniGlyph berasal dari salah satu dari dua harness
di bawah ini — dapat dijalankan ulang, deterministik jika memungkinkan,
dengan bukti mentah per jawaban di `*/results/*.jsonl`. Analisis konsolidasi:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — berapa sebenarnya biaya sebuah gambar?

Probe `count_tokens` gratis terhadap API Anthropic langsung, membandingkan
formula lama `w·h/750` dengan model patch 28 px saat ini pada 11 geometri
probe di 2 model × 2 tier resolusi.

**Hasil (2026-07-05): model patch cocok dengan residual NOL di setiap probe**
— ditagih = `⌈w/28⌉ × ⌈h/28⌉` setelah resize per tier, plus +3/+4 token tetap
per blok gambar. Halaman produksi (1568×728) biayanya persis 1.460 token dan
membawa 28.080 karakter ≈ **19,2 karakter/token** dibandingkan ~2
karakter/token sebagai teks padat.

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
