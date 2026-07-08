# Penanda Aras

Setiap angka yang didakwa oleh OmniGlyph datang daripada salah satu daripada
dua harness di bawah — boleh dijalankan semula, deterministik jika boleh,
dengan resit mentah setiap jawapan dalam `*/results/*.jsonl`. Analisis
konsolidasi: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — berapakah kos sebenar sesuatu imej?

Ujian `count_tokens` percuma berbanding API Anthropic langsung,
membandingkan formula lama `w·h/750` dengan model patch 28 px semasa
merentasi 11 geometri ujian pada 2 model × 2 tingkat resolusi.

**Hasil (2026-07-05): model patch sepadan dengan baki SIFAR pada setiap
ujian** — dikenakan bil = `⌈w/28⌉ × ⌈h/28⌉` selepas saiz semula tingkat,
ditambah +3/+4 token tetap setiap blok imej. Halaman pengeluaran
(1568×728) berkos tepat 1,460 token dan membawa 28,080 aksara ≈ **19.2
aksara/token** berbanding ~2 aksara/token sebagai teks padat.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # ramalan sahaja, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # ujian langsung, masih $0 (count_tokens percuma)
```

## 2. `density-frontier/` — bolehkah model itu sebenarnya MEMBACANYA?

Kos (luar talian, tepat) × ketepatan bacaan (langsung) merentasi
konfigurasi render, geometri halaman, atlas glif dan penyedia. Korpus ini
menanam needle rentetan-tepat (id heks, camelCase, larian digit) ditambah
**pengganggu hampir-terlepas yang dibina daripada pasangan keliru-glif yang
diukur** — supaya konfabulasi senyap dapat dikesan, bukan sekadar dikira
salah. Penskoran deterministik (tiada hakim LLM): `correct` / `abstained`
(`ILEGIVEL` yang jujur) / `silent_wrong` / `no_answer`.

**Hasil utama** (n=30 setiap lengan):

| lengan | bacaan tepat | nota |
|---|---:|---|
| Fable 5 · halaman standard · atlas 1-bit (pengeluaran) | **30/30** | sifar ralat, sifar konfabulasi |
| Fable 5 · halaman standard · atlas AA (lalai lama) | 25/30 | 5 penahanan diri jujur — sebab pengeluaran ditukar kepada 1-bit |
| Fable 5 · halaman resolusi tinggi 1928² | 1–2/30 | dikenakan bil 3.3× tetapi diresample pengekod — perangkap pengebilan, tidak diaktifkan |
| Opus 4.8 · glif 10×16 | 23–26/30 | mod selamat opt-in |
| GPT-5.5 · jalur 768px (kedua-dua atlas) | 0/60 | + ~40× penggembungan token output berbanding kawalan teksnya sendiri (30/30, 62 tok) |
| Gemini 2.5-flash (separa, kuota) | 0/26 | mengarang jawapan berbanding menahan diri |

Tiga pengangkutan: API terus (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), dan `--via-cli` (langganan Claude Code —
$0). Amaran yang dipelajari dengan susah payah: perantara (OpenRouter, alat
Read CLI) me-resample imej besar; hanya hasil API terus yang sah untuk
kebolehbacaan.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # jadual kos, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # melalui langganan, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Ujian unit yang mengunci bahagian tulen (korpus, penskoran, formula kos):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
