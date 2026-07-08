# Roadmap fork — "OmniGlyph kami" + integrasi OmniRoute

Pelan kerja konsolidasi (2026-07-05) daripada: ujian pengebilan yang
diukur, audit OpenAI/Gemini berbanding dokumentasi rasmi, analisis alat
berkaitan, dan harness density-frontier. Status setiap item: ☐ belum
selesai · ◐ separa · ☑ selesai di sini.

## Fasa 0 — Asas pengukuran (SELESAI dalam repo ini)

- ☑ Pengebilan Anthropic tepat (patch 28px, 2 tingkat, +4/blok) —
  `src/core/anthropic-vision.ts`, ujian dalam `benchmarks/billing-sweep/`.
- ☑ Get keuntungan dengan kos tepat (menggantikan w·h/750 × 1.10).
- ☑ Geometri setiap tingkat: Fable/Opus 4.8/Sonnet 5 → halaman 1928×1928
  (3.3× lebih sedikit imej); standard → 1568×728. 691 ujian hijau.
- ☑ Harness `benchmarks/density-frontier/` (kos × ketepatan luar talian
  melalui API, needle dengan pengganggu keliru, penskoran deterministik).

## Fasa 1 — Pembetulan pengebilan berbilang penyedia (pepijat disahkan dalam audit)

Keutamaan ditetapkan oleh audit (dokumentasi rasmi ditangkap 2026-07-05):

1. ☐ **D2 (get TERBALIK)**: `gpt-4o-mini` jatuh ke jubin lalai 85/170, tetapi
   kosnya **2833 asas / 5667 setiap jubin** (~33× dianggarkan terlalu
   rendah, ~0.8 aksara/token) — menjadikannya imej sentiasa rugi dan get
   itu meluluskannya. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` dihantar tanpa syarat
   (`src/core/openai.ts:392,402`), tetapi hanya wujud dalam gpt-5.4+;
   terbitkan daripada profil.
3. ☐ **D1**: pengganda `o4-mini` 1.62 → **1.72** (dianggarkan terlalu
   rendah sebanyak 5.8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini`
   berada dalam baldi patch **had 1536 tanpa `original`** (kod
   menganggap 10000); `gpt-5-codex-mini` berada dalam rejim yang salah
   (jubin → patch).
5. ☐ **Geometri GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (selaras dengan
   KEDUA-DUA rejim: patch 64×32 dan jubin 4×512; +6.25% aksara percuma).
   Profil `original` khusus 5.4/5.5: sehingga 1568×5984 (9,163 patch ≤
   10k, ~233k aksara dalam satu blok) — kebolehbacaan A/B dahulu.
6. ☐ **Sokongan Gemini** (baharu): `src/core/gemini.ts` +
   `gemini-model-profiles.ts` + laluan `:generateContent`/
   `:streamGenerateContent` dalam proksi. Geometri boleh didokumenkan:
   **1152×1536 (unit potongan tepat 768, 4 jubin, 42.2 aksara/token —
   nisbah terdokumen terbaik antara 3 penyedia)**; taruhan untuk
   ditentukur: 768² dengan `media_resolution:MEDIUM` (56.4) dan Gemini 3
   HIGH. Berhati-hati: titik akhir serasi-OpenAI Gemini akan melalui
   transformer OpenAI dengan pengebilan yang salah.

## Fasa 2 — Kualiti bacaan (harness density-frontier sebagai hakim)

- ◐ A/B piawai vs resolusi tinggi yang menentukan pada Fable (sedang
  berjalan; bar: gist == teks DAN sifar salah-senyap DAN penjimatan > 0).
- ☐ Selesaikan percanggahan AA vs 1-bit dalam laluan padat (kod
  menyatakan "eval-only", pengeluaran menggunakan AA).
- ☐ (DITANGGUHKAN dengan rasional 2026-07-06) Pembedahan glif: konfigurasi
  pengeluaran membaca 30/30 — tiada kegagalan yang boleh diukur untuk
  pembedahan itu perbetulkan hari ini. Kaji semula jika sasaran di bawah
  100% memasuki skop (contohnya Opus) atau jika pengukuran baharu
  menunjukkan kemunduran.
- ☑ ~~A/B tema cerah~~ DISELESAIKAN melalui pemeriksaan (2026-07-06):
  render SUDAH PUN hitam-atas-putih (render.ts:635/822, songsang
  selepas-blit) — selaras dengan literatur; hipotesis lahir daripada
  premis yang salah (imej contoh upstream).
- ☐ Senarai perkataan dengan checksum untuk ID tepat-bait (upstream #38,
  disokong) + sepanduk penahanan diri (#31/#32) + camelCase dalam helaian
  fakta (#33/#34).
- ☑ Port #45: $schema/$id dikekalkan, tuple dikeluarkan setiap elemen
  (komit pada main).
- ☑ Cuba semula apabila ditolak (#37/H11): pengendus main semula lossless
  + satu cubaan semula dengan badan asal; telemetri refusalRetried (komit
  pada main).
- ☐ Alat rehidrat (`RecoverableBlock` → alat boleh panggil; LensVLM
  mengesahkan pengembangan semula terpilih).

## Fasa 3 — Prestasi/ketegaran

- ☐ Cache render LRU (deterministik mengikut invarian; slab + kepingan
  beku dirender semula pada setiap permintaan hari ini).
- ☐ Pengekodan PNG dalam thread pekerja; tahap deflate boleh dikonfigurasi.
- ☐ Port pembetulan upstream terbuka: #44 (alat asli bertaip → 400), #45
  (gelung 400 pelucutan skema draft-07), #42 (proksi CONNECT untuk Claude
  Desktop), #19 (pengebilan berganda penerangan GPT).
- ☐ Laksanakan ADAPTIVE_CPT_PLAN (cpt setiap peranan blok; slab sebenar =
  1.50).

## Fasa 4 — Fork itu sendiri

- ☐ Nama/repo sendiri (keputusan Diego) + `git remote` upstream untuk
  cherry-pick.
- ☐ **TS di mana-mana**: teras sudah TS, tukar `eval/*.mjs`, `demo/`,
  `scripts/*.mjs`, `bench/` (corak: tsx + vitest; `benchmarks/
  density-frontier/` lahir sedemikian).
- ☐ Standard kualiti OmniRoute: eslint 9 + prettier, CI dengan
  typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n
  (pt-BR dahulu), CHANGELOG semantik.
- ☐ **GIF berbanding video** dalam README (rakam dengan vhs/asciinema+agg;
  bersebelahan biasa vs proksi).
- ☐ Papan pemuka v2 (laksanakan semula melalui API HTTP — jangan warisi
  kod pihak ketiga): pelancar "buka terminal dengan
  ANTHROPIC_BASE_URL", semakan "adakah trafik melalui saya?", pemeriksa
  imej-vs-teks, sesi, panel kos dalam mata wang, i18n ringan, SSE
  berbanding polling, kegigihan SQLite dengan pengekalan (skema 24 lajur
  sedia ada adalah titik permulaan yang baik).
- ☐ Idea-mikro daripada dense-image-gen: mod `lines` (susun atur
  dikekalkan untuk kod/jadual), `--keep-ws`, tajuk asal setiap halaman
  ("system prompt" / "dokumentasi alat" / "pusingan sejarah N"), CLI
  berdiri sendiri `render arquivo.md -o out.png`.

## Fasa 5 — Port ke OmniRoute

- ☐ Enjin `CompressionEngine` (templat `cavemanAdapter.ts`), didaftarkan
  dalam `engines/index.ts` + `engineCatalog.ts`;
  `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Perpaipan: hantar `supportsVision` dalam `chatCore.ts:1297` (1 baris)
  atau selesaikan melalui `isVisionModelId`.
- ☐ Susunan tindanan: terakhir (RTK/Caveman/perender semantik dahulu;
  OmniGlyph menjadikan imej baki).
- ☐ Invarian: jangan sekali-kali tulis semula blok `cache_control` klien
  (pengajaran #4560); get kesetiaan (#5127) memerlukan pengecualian
  diisytiharkan atau helaian fakta teks yang memenuhi invarian; telemetri
  cubaan dengan `skip_reason` (pengajaran #4268).
- ☐ Penghalaan: cadangan/cuba semula pasca-enjin mesti menghormati
  keupayaan visi dan senarai benar (mampatkan semula atau langkau).
- ☐ Sinergi CCR: `emitRecoverable` → simpanan CCR dengan pengambilan
  setiap hirisan (`head/tail/grep`, #5187) = pengembangan semula terpilih
  penuh.
- ☐ Peregangan tingkat percuma sebagai ciri pemasaran: setiap token
  tingkat percuma menghasilkan ~2-3× lebih banyak aksara pada model visi;
  tingkat percuma Gemini + geometri 1152×1536 ialah kes terkuat.

## Risiko terbuka

- Penolakan Fable selepas-deploy semula dalam konteks yang dijadikan imej
  (upstream #37) — mitigasi sebelum default-on dalam OmniRoute.
- Arbitraj harga: jika Anthropic menetapkan semula harga visi, penjimatan
  berubah — kaunterfaktual setiap permintaan (`count_tokens`) ialah
  pertahanan.
- OpenAI: pengukuran komuniti (PageWatch) melihat token penyiapan naik
  dan kependaman 2× — ukur setiap penyedia sebelum diaktifkan.

## Hasil A/B 2026-07-05 (melalui OpenRouter — TIDAK MUKTAMAD untuk geometri, sah untuk mod kegagalan)

| konfigurasi | verbatim | penahanan diri | ditapis | salah-senyap |
|---|---|---|---|---|
| fable std 5×8 (AA dan 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 diramal) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 diramal) |
| opus hires 10×16 | **7/9 baca** | 0 | 21 kredit habis | 2 (digit) |

Penemuan sah: (1) pengklasifikasi (isu #37) ialah mod kegagalan DOMINAN
untuk soalan transkripsi pada halaman standard — 100% ditapis — dan tidak
tercetus pada halaman besar; kata-kata penting. (2) Penahanan diri
berfungsi: 20× ILEGIVEL berbanding 5 konfabulasi pada halaman besar. (3)
Opus pada 10×16 membaca 78% tepat (n=9) berbanding 0% sejarah pada 5×8 —
bukti langsung pertama titik lutut. (4) Ketidakbolehbacaan halaman besar
melalui OpenRouter mencadangkan RESAMPLE pengangkutan (tingkat standard
Bedrock/Vertex?) — hipotesis penentu untuk diuji pada API terus Anthropic;
A/B geometri kekal TERBUKA sehingga itu. Kredit OpenRouter habis di
pertengahan lengan Opus.

## Matriks 2×2 akhir (2026-07-05, melalui CLI/langganan, Fable 5, n=30/lengan)

| halaman × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 penahanan diri |
| resolusi tinggi 1928×1928 | **20/30 (67%)** + 10 penahanan diri | 0/30 + 29 penahanan diri |

Sifar konfabulasi merentasi 4 lengan (120 soalan — setiap kegagalan ialah
ILEGIVEL). DILAKSANAKAN: DENSE_RENDER_STYLE ditukar kepada 1-bit
(aa:false) dengan pin dalam tests/dense-style.test.ts. Opus 4.8: 26/30
pada 10×16 pada halaman besar, 30/30 ILEGIVEL pada 5×8 — mod selamat Opus
boleh dilaksanakan. Halaman resolusi tinggi kekal merosot oleh
pengangkutan (resample CLI Read/OpenRouter) — keputusan geometri WYSIWYG
masih bergantung pada API terus.
