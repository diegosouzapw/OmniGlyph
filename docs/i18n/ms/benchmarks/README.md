# Penanda Aras

🌐 Diterjemahkan: [semua bahasa](../../README.md)

Setiap angka yang didakwa oleh OmniGlyph datang daripada salah satu daripada
dua harness di bawah — boleh dijalankan semula, deterministik jika boleh,
dengan resit mentah setiap jawapan dalam `*/results/*.jsonl`. Analisis
konsolidasi: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Cara penjimatan berfungsi (dalam satu gambar)

Penyedia mengenakan bil **teks mengikut token**, tetapi mengenakan bil
**imej mengikut dimensinya** — bukan mengikut berapa banyak teks yang
dipadatkan di dalamnya. Satu halaman standard mempunyai kos tetap tidak
kira sepadat mana teks itu:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Konteks yang sama, dikenakan bil dengan dua cara:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Sebab imej menang — aksara yang dibawa setiap token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph hanya membuat pertukaran ini apabila matematik tepat menunjukkan
ia menang, dan hanya untuk model yang terbukti dapat membaca halaman itu.
Dua harness di bawah membuktikan setiap separuh.

## 1. `billing-sweep/` — berapakah kos sebenar sesuatu imej?

Ujian `count_tokens` percuma berbanding API Anthropic langsung,
membandingkan formula lama `w·h/750` dengan model patch 28 px semasa
merentasi 11 geometri ujian pada 2 model × 2 tingkat resolusi.

**Hasil (2026-07-05): model patch sepadan dengan baki SIFAR pada setiap
ujian** — dikenakan bil = `⌈w/28⌉ × ⌈h/28⌉` selepas saiz semula tingkat,
ditambah +3/+4 token tetap setiap blok imej. Halaman pengeluaran
(1568×728) berkos tepat 1,460 token dan membawa 28,080 aksara ≈ **19.2
aksara/token** berbanding ~2 aksara/token sebagai teks padat.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
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

| arm | exact reads | notes |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | zero errors, zero confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5 honest abstentions — why production flipped to 1-bit |
| Fable 5 · high-res 1928² page | 1–2/30 | billed 3.3× but encoder-resampled — the billing trap, not enabled |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | the opt-in safe mode |
| GPT-5.5 · 768px strip (both atlases) | 0/60 | + ~40× output-token inflation vs its own text control (30/30, 62 tok) |
| Gemini 2.5-flash (partial, quota) | 0/26 | confabulates instead of abstaining |

Ketepatan bacaan sepintas lalu — ini **ialah** get model gagal-tertutup
itu sendiri, digambarkan:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Hanya lengan ✅ yang dilancarkan ke pengeluaran. Apa-apa yang membaca
dengan buruk disekat *disertai resit*, dan skor tiga hala bermaksud model
yang meneka salah (`silent_wrong`) dianggap lebih teruk daripada model
yang menahan diri secara jujur (`ILEGIVEL`).

Tiga pengangkutan: API terus (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), dan `--via-cli` (langganan Claude Code —
$0). Amaran yang dipelajari dengan susah payah: perantara (OpenRouter, alat
Read CLI) me-resample imej besar; hanya hasil API terus yang sah untuk
kebolehbacaan.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Ujian unit yang mengunci bahagian tulen (korpus, penskoran, formula kos):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
