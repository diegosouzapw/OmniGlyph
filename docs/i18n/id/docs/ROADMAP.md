# Roadmap fork — "OmniGlyph milik kami" + integrasi OmniRoute

Rencana kerja konsolidasi (2026-07-05) berdasarkan: sweep billing terukur,
audit OpenAI/Gemini terhadap dokumentasi resmi, analisis tool serupa, dan
harness density-frontier. Status setiap item: ☐ tertunda · ◐ sebagian · ☑ selesai di sini.

## Fase 0 — Fondasi pengukuran (SELESAI di repo ini)

- ☑ Billing Anthropic eksak (patch 28px, 2 tier, +4/blok) — `src/core/anthropic-vision.ts`, sweep di `benchmarks/billing-sweep/`.
- ☑ Gate profitabilitas dengan biaya eksak (menggantikan w·h/750 × 1,10).
- ☑ Geometri per tier: Fable/Opus 4.8/Sonnet 5 → halaman 1928×1928 (3,3× lebih sedikit gambar); standard → 1568×728. 691 test hijau.
- ☑ Harness `benchmarks/density-frontier/` (biaya offline × akurasi via API, needle dengan distractor yang membingungkan, penilaian deterministik).

## Fase 1 — Perbaikan billing multi-provider (bug terkonfirmasi dalam audit)

Prioritas ditentukan oleh audit (dokumen resmi ditangkap 2026-07-05):

1. ☐ **D2 (gate TERBALIK)**: `gpt-4o-mini` jatuh ke tile default 85/170, padahal biayanya **2833 base / 5667 per tile** (~33× diremehkan, ~0,8 char/token) — menggambar padanya selalu rugi dan gate-nya menyetujui. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` dikirim tanpa syarat (`src/core/openai.ts:392,402`), padahal hanya ada di gpt-5.4+; harus diturunkan dari profile.
3. ☐ **D1**: pengali `o4-mini` 1.62 → **1.72** (diremehkan 5,8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` berada di bucket patch **cap 1536 tanpa `original`** (kode mengasumsikan 10000); `gpt-5-codex-mini` berada di rezim yang salah (tile → patch).
5. ☐ **Geometri GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (selaras dengan KEDUA rezim: patch 64×32 dan tile 4×512; +6,25% karakter gratis). Profile khusus 5.4/5.5 `original`: hingga 1568×5984 (9.163 patch ≤ 10k, ~233k karakter dalam satu blok) — A/B keterbacaan dulu sebelum diaktifkan.
6. ☐ **Dukungan Gemini** (baru): `src/core/gemini.ts` + `gemini-model-profiles.ts` + rute `:generateContent`/`:streamGenerateContent` di proxy. Geometri yang dapat didokumentasikan: **1152×1536 (crop unit 768 eksak, 4 tile, 42,2 char/token — rasio terbaik yang terdokumentasi dari 3 provider)**; taruhan yang perlu dikalibrasi: 768² dengan `media_resolution:MEDIUM` (56,4) dan Gemini 3 HIGH. Perhatian: endpoint kompatibel-OpenAI dari Gemini akan melewati transformer OpenAI dengan billing yang salah.

## Fase 2 — Kualitas pembacaan (harness density-frontier sebagai juri)

- ◐ A/B penentu std vs high-res pada Fable (sedang berjalan; standar: gist == teks DAN nol silent-wrong DAN savings > 0).
- ☐ Menyelesaikan kontradiksi AA vs 1-bit di jalur padat (kode bilang "eval-only", produksi memakai AA).
- ☐ (DITUNDA dengan justifikasi 2026-07-06) Operasi glyph: konfigurasi produksi membaca 30/30 — tidak ada miss terukur untuk diperbaiki hari ini. Tinjau ulang jika target di bawah 100% masuk lingkup (mis. Opus) atau jika pengukuran baru menunjukkan regresi.
- ☑ ~~A/B tema terang~~ TERSELESAIKAN lewat inspeksi (2026-07-06): render SUDAH hitam-di-atas-putih (render.ts:635/822, invert pasca-blit) — selaras dengan literatur; hipotesis ini lahir dari premis yang salah (gambar contoh dari upstream).
- ☐ Wordlist dengan checksum untuk ID byte-exact (upstream #38, didukung) + banner abstensi (#31/#32) + camelCase di factsheet (#33/#34).
- ☑ Port #45: $schema/$id dipertahankan, tuple di-strip per elemen (commit di main).
- ☑ Retry-no-refusal (#37/H11): sniffer dengan replay tanpa kehilangan + retry tunggal dengan body asli; telemetri refusalRetried (commit di main).
- ☐ Tool rehydrate (`RecoverableBlock` → tool yang dapat dipanggil; LensVLM memvalidasi re-ekspansi selektif).

## Fase 3 — Performa/robustisitas

- ☐ Cache LRU untuk render (deterministik per invarian; slab + chunk beku dirender ulang setiap request hari ini).
- ☐ Encode PNG di worker thread; level deflate yang dapat dikonfigurasi.
- ☐ Port perbaikan upstream yang masih terbuka: #44 (tool native bertipe → 400), #45 (schema-strip draft-07 → loop 400), #42 (proxy CONNECT untuk Claude Desktop), #19 (double-billing deskripsi GPT).
- ☐ Implementasikan ADAPTIVE_CPT_PLAN (cpt berdasarkan peran blok; slab nyata = 1,50).

## Fase 4 — Fork itu sendiri

- ☐ Nama/repo sendiri (keputusan Diego) + `git remote` upstream untuk cherry-pick.
- ☐ **TS di mana-mana**: core sudah TS; konversi `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (standar: tsx + vitest; `benchmarks/density-frontier/` sudah lahir seperti itu).
- ☐ Standar kualitas OmniRoute: eslint 9 + prettier, CI dengan typecheck/test/build/link-check, CONTRIBUTING, SECURITY, i18n README (pt-BR duluan), CHANGELOG semantik.
- ☐ **GIF alih-alih video** di README (rekam dengan vhs/asciinema+agg; berdampingan plain vs proxy).
- ☐ Dashboard v2 (implementasi ulang lewat API HTTP — tidak mewarisi kode pihak ketiga): launcher "buka terminal dengan ANTHROPIC_BASE_URL", verifikasi "apakah trafik lewat saya?", inspector gambar-vs-teks, sesi, panel biaya dalam mata uang, i18n ringan, SSE alih-alih polling, persistensi SQLite dengan retensi (skema 24 kolomnya adalah titik awal yang bagus).
- ☐ Ide-ide kecil dari dense-image-gen: mode `lines` (layout dipertahankan untuk kode/tabel), `--keep-ws`, judul asal per halaman ("system prompt" / "tool docs" / "history turn N"), CLI standalone `render arquivo.md -o out.png`.

## Fase 5 — Port ke OmniRoute

- ☐ Engine `CompressionEngine` (template `cavemanAdapter.ts`), terdaftar di `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plumbing: meneruskan `supportsVision` di `chatCore.ts:1297` (1 baris) atau resolve lewat `isVisionModelId`.
- ☐ Urutan di stack: terakhir (RTK/Caveman/renderer semantik lebih dulu; OmniGlyph menggambar residualnya).
- ☐ Invarian: jangan pernah menulis ulang blok dengan `cache_control` dari klien (pelajaran #4560); fidelity gate (#5127) butuh pengecualian yang dideklarasikan atau factsheet-teks yang memenuhi invarian; telemetri percobaan dengan `skip_reason` (pelajaran #4268).
- ☐ Routing: fallback/retry pasca-engine harus menghormati kapabilitas visi dan allowlist (kompresi ulang atau bypass).
- ☐ Sinergi CCR: `emitRecoverable` → store CCR dengan retrieval per potongan (`head/tail/grep`, #5187) = re-ekspansi selektif lengkap.
- ☐ Free-tier stretching sebagai fitur pemasaran: setiap token free tier menghasilkan ~2-3× lebih banyak karakter pada model dengan visi; free tier Gemini + geometri 1152×1536 adalah kasus terkuat.

## Risiko terbuka

- Penolakan Fable pasca-redeploy dalam konteks yang digambar (upstream #37) — mitigasi sebelum default-on di OmniRoute.
- Arbitrase harga: jika Anthropic mengubah harga visi, penghematan berubah — counterfactual per permintaan (`count_tokens`) adalah pertahanannya.
- OpenAI: pengukuran komunitas (PageWatch) melihat token completion naik dan latensi 2× — ukur per provider sebelum diaktifkan.

## Hasil A/B 2026-07-05 (via OpenRouter — TIDAK KONKLUSIF untuk geometri, valid untuk mode kegagalan)

| konfigurasi | verbatim | abst. | terfilter | silent-wrong |
|---|---|---|---|---|
| fable std 5×8 (AA dan 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 diprediksi) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 diprediksi) |
| opus hires 10×16 | **7/9 terbaca** | 0 | 21 tanpa kredit | 2 (digit) |

Temuan yang valid: (1) classifier (issue #37) adalah mode kegagalan DOMINAN
untuk pertanyaan transkripsi pada halaman standard — 100% terfilter — dan
tidak terpicu pada halaman besar; wording penting. (2) Abstensi berfungsi: 20×
ILEGIVEL vs 5 konfabulasi pada halaman besar. (3) Opus pada 10×16 membaca 78%
eksak (n=9) vs 0% historis pada 5×8 — bukti pertama sendiri dari titik lutut.
(4) Ketidakterbacaan halaman besar via OpenRouter menunjukkan RESAMPLE pada
transport (tier standard Bedrock/Vertex?) — hipotesis penentu untuk diuji pada
API langsung Anthropic; A/B geometri tetap TERBUKA sampai saat itu. Kredit
OpenRouter habis di tengah lengan Opus.

## Matriks 2×2 final (2026-07-05, via CLI/langganan, Fable 5, n=30/lengan)

| halaman × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| high-res 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

Nol konfabulasi di 4 lengan (120 pertanyaan — setiap miss adalah ILEGIVEL).
DITERAPKAN: DENSE_RENDER_STYLE dibalik ke 1-bit (aa:false) dengan pin di
tests/dense-style.test.ts. Opus 4.8: 26/30 pada 10×16 di halaman besar, 30/30
ILEGIVEL pada 5×8 — mode aman Opus layak. Halaman high-res tetap terdegradasi
oleh transport (CLI Read/OpenRouter resample); putusan WYSIWYG dari geometri
masih bergantung pada API langsung.
