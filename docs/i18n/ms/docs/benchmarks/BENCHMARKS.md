# OmniGlyph — Pengukuran konsolidasi (2026-07-05)

🌐 Diterjemahkan: [semua bahasa](../../../README.md)

Segala yang DIUKUR dalam sesi ini, dengan sumber dan n; hipotesis diasingkan
dengan jelas di penghujung. Resit: `benchmarks/billing-sweep/results/` dan
`benchmarks/density-frontier/results/` (JSONL setiap jawapan).

## TL;DR — keseluruhan hasil dalam dua bar

**Kos** — satu halaman standard 1568×728 membawa 28,080 aksara untuk
1,460 token tetap; teks yang sama dihantar mentah berkos ~10× lebih:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Ketepatan** — tetapi hanya di mana model benar-benar membaca halaman
itu. Get ini bersifat gagal-tertutup; hanya baris ✅ yang dilancarkan:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Selebihnya dokumen ini ialah resit di sebalik kedua-dua bar itu.

## 1. Pengebilan Anthropic (count_tokens terus, $0, 11 geometri × 2 model)

Formula disahkan: `tokens = ceil(w/28) × ceil(h/28)` selepas saiz semula
setiap tingkat, **+3/blok (Fable 5) / +4/blok (Sonnet 4.5)** — SIFAR baki
merentasi semua baris.

| ujian | dimensi | Fable 5 (resolusi tinggi) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| jangkar dok | 1092×1092 | 1524 | 1525 |
| jangkar dok | 1000×1000 | 1299 | 1300 |
| halaman standard | 1568×728 | 1459 | 1460 |
| **halaman besar** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| siling resolusi tinggi | 1960×1960 | 4764 (clamp) | 1525 |
| tepi panjang resolusi tinggi | 2576×1204 | 3959 | 1516 |
| jalur tinggi | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imej) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→turunkan skala, TIDAK ditolak dalam count_tokens) | 3585 |

Keputusan terbitan (dilaksanakan): get patch tepat; tingkat setiap model
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = resolusi tinggi); `cols` 313→312.

## 2. Ketepatan bacaan (density-frontier, needle heks/camelCase/digit + pengganggu)

### Matriks 2×2 Fable 5 — melalui CLI/langganan, n=30/lengan, korpus sama (~16.6k aksara)

| halaman × atlas | tepat | penahanan diri (ILEGIVEL) | ralat senyap |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| resolusi tinggi 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| resolusi tinggi 1928×1928 · AA | 0/30 | 29 | 1 (diramal oleh matriks) |

→ **1-bit > AA pada kedua-dua halaman; sifar konfabulasi merentasi 120
soalan.** DILAKSANAKAN: `DENSE_RENDER_STYLE` → `aa:false` (komit 9a25585).
⚠️ halaman resolusi tinggi tiba merosot oleh resample pengangkutan (lihat
H1/H3) — 67% itu ialah lantai, bukan siling.

### Opus 4.8 — melalui CLI/langganan, n=30/lengan

| konfigurasi | tepat | penahanan diri | ralat |
|---|---:|---:|---:|
| resolusi tinggi · sel 10×16 | **26/30 (87%)** | 0 | 4 (digit) |
| standard · sel 5×8 | 0/30 | 30 | 0 |

→ Titik lutut Opus disahkan dengan n kami sendiri (upstream mengukur 95%
pada 10×16 dengan n=20). "Mod selamat Opus" boleh dilaksanakan: 10×16 pada
halaman besar ≈ 1.7 aksara setiap token imej pada korpus harness.

### Melalui OpenRouter (korpus/soalan sama) — tidak muktamad untuk kebolehbacaan

| fakta diukur | angka |
|---|---|
| content_filter pada soalan transkripsi (halaman standard) | 60/60 (100%) |
| content_filter pada halaman resolusi tinggi | 5-6/30 (~20%) |
| Fable resolusi tinggi: penahanan diri + ralat | 20 ILEGIVEL + 5 ralat (2 diramal) |
| Opus 10×16 (sebelum kredit habis) | 7/9 tepat (78%) |
| salah baca diramal oleh matriks keliru | 4→a, 0→8, S/s huruf besar/kecil |

### Perbandingan pengangkutan (soalan sama, kandungan sama)

| pengangkutan | tapisan/penolakan | halaman besar boleh dibaca? |
|---|---|---|
| API terus (n=9, sebelum kredit habis) | 0 | tidak diuji |
| OpenRouter | ~100% std / ~20% resolusi tinggi | tidak (disyaki: resample) |
| Claude Code CLI (langganan) | 0 content_filter; ~50% kelompok besar tersekat (diselesaikan dengan kelompok 10 + cuba semula) | tidak (disyaki: Read mengubah saiz) |

## 3. Kos setiap penyedia (luar talian, tepat — halaman PENUH, teori)

| penyedia · halaman | token/halaman | aksara/halaman | **aksara/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (semua model) | 1460 | 28,080 | **19.2** | diukur |
| Anthropic resolusi tinggi 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× lebih sedikit imej) | pengebilan diukur; kebolehbacaan menunggu (H1) |
| GPT-5 (jubin) jalur 768×2048 | 1190 | ~38,760 | **32.6** | dokumentasi diaudit |
| GPT-5.4/5.5 (patch, original) sehingga 1568×5984 | ~9,163 | ~233k | **25.4** | dokumentasi; kebolehbacaan tidak diuji |
| gpt-4o-mini | 48,169/jalur | — | **0.8 — JANGAN SEKALI-KALI jadikan imej** | dokumentasi (pepijat D2 dibetulkan) |
| Gemini jubin 1533×1152 (unit potongan asli 768) | 1032 | 43,615 | **42.3 ← nisbah terdokumen terbaik** | dokumentasi; kebolehbacaan tidak diuji |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (jika boleh dibaca)** | hipotesis H6 |

## 4. Pepijat ditemui dan dibetulkan (audit berbanding dokumentasi rasmi)

| id | pepijat | impak | komit |
|---|---|---|---|
| D2 | gpt-4o-mini jatuh ke jubin lalai 85/170 (sebenar: 2833/5667) | kos dianggarkan terlalu rendah ~33× — **get terbalik** | e6bc75f |
| D1 | pengganda o4-mini 1.62 (sebenar 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) dengan had 10000 (sebenar 1536, tiada original) | akan rosak dengan halaman lebih besar | e6bc75f |
| D4 | gpt-5-codex-mini dalam rejim jubin (sebenar: patch 1536) | ≥+23% dianggarkan terlalu rendah | e6bc75f |
| D5 | detail:'original' dikodkan keras untuk setiap model (hanya wujud dalam 5.4+) | di luar kontrak | e6bc75f |
| #44 | stub penerangan disuntik ke dalam alat bertaip → 400 + gagal senyap | penjimatan disifarkan tanpa isyarat | 0f66e32 |
| AA | atlas AA dalam pengeluaran bertentangan komen "eval-only" | −17pp bacaan pada Fable | 9a25585 |
| — | slab cols 313 (1573px) → resample 0.997× + lajur patch tambahan | dibetulkan kepada 312 | garis dasar |

## 5. Hipotesis terbuka (kos untuk menutup setiap satu)

| id | hipotesis | bukti semasa | ujian penentu | kos |
|---|---|---|---|---|
| H1 | Halaman 1928² dibaca ≥ standard pada API terus (WYSIWYG dibuktikan dalam pengebilan) | pengebilan 4764 tanpa resample; 1-bit sudah membaca 67% walaupun merosot | A/B terus std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit pada API terus ≈ 100% dengan 3.3× lebih sedikit imej | H1 + matriks 2×2 | sama seperti H1 | sama |
| H3 | Read CLI dan OpenRouter mengubah saiz imej >1568/2000px | 5×8 mati dan 10×16 bertahan PADA HALAMAN YANG SAMA | satu halaman 1928² dengan glif 20×32 setiap pengangkutan | ~US$0 (CLI) |
| H4 | Penolakan bergantung pada framing (ejen-membaca-fail ≈ 0% vs API mentah ≈ 100%) | perbandingan pengangkutan di atas | A/B kata-kata pada laluan proksi sebenar | rendah |
| H5 | Jubin Gemini 1533×1152 boleh dibaca pada 5×8 (42 aksara/tok) | tiada | density-frontier dengan GEMINI_API_KEY | ~percuma (tingkat percuma) |
| H6 | media_resolution:low boleh dibaca (116 aksara/tok) | tidak berkemungkinan (pengekod resolusi rendah), tetapi tiada siapa mengukurnya | 1 panggilan | ~percuma |
| H7 | GPT: kebolehbacaan jalur + penggembungan token penyiapan (risiko PageWatch) | komuniti melihat −40% prompt tetapi +penyiapan/2× kependaman | density-frontier dengan OPENAI_API_KEY | ~US$2-5 |
| H8 | Pembedahan glif (H~K, 0/8, 5/3…) menukar penahanan diri menjadi bacaan | selepas 1-bit, SEMUA kegagalan Fable menjadi penahanan diri | sunting ~10 bitmap + jalankan semula matriks | $0 (CLI) |
| H9 | Tema cerah (hitam-atas-putih) > songsang | literatur (kertas Glyph, Tesseract); tidak pernah diukur pada VLM komersial | flag gaya + 2 lengan | $0 (CLI) |
| H10 | Opus pada 7×10 mendarat antara 0% (5×8) dan 87% (10×16) → pertukaran munasabah | lengkung upstream 35% pada 7×10 (n=20) | 1 lengan tambahan | $0 (CLI) |
| H11 | Cuba-semula-penolakan dalam proksi memulihkan ~50% kelompok yang ditapis | penolakan bersifat stokastik setiap panggilan | laksanakan + ukur dalam pengeluaran | kod |

## 6. Item tertunda operasi

1. `gh auth login` → cipta `diegosouzapw/omniglyph` peribadi + tolak (push)
   (10 komit tempatan).
2. Kredit Anthropic (H1/H2, keputusan geometri) dan OpenRouter (habis).
3. **Putarkan kunci** Anthropic dan OpenRouter yang terdedah dalam sembang.
4. Baris gilir kod: #45 (pelucutan skema draft-07), cuba-semula-penolakan
   (H11), pembedahan glif (H8), Fasa 4 (TS dalam skrip, GIF, dokumentasi,
   papan pemuka v2), Fasa 5 (enjin OmniRoute).

## ADDENDUM 2026-07-06 — A/B melalui API terus (165 panggilan): H1/H2 DISANGGAH

| konfigurasi | tepat | penahanan diri | penolakan | ralat |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA dan 1-bit) | 0/60 | 0 | **60/60 penolakan** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 diramal) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 diramal) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

KEPUTUSAN: tingkat resolusi tinggi halaman 1928² DIKENAKAN BIL WYSIWYG
(4764 tok, ujian) tetapi PENGEKOD tidak menerima resolusi penuh — 1-2/30
dibaca, dengan ralat pertukaran glif tunggal (6→8, a→4), tandatangan
resample dalaman. **Pengebilan ≠ input pengekod → perangkap: 3.3× kos,
kebolehbacaan lebih teruk.** DILAKSANAKAN: pageGeometryForTier()
dikembalikan — kedua-dua tingkat merender 1568×728; infra tingkat
dikekalkan (pengebilan tepat kekal sah dan penentuan semula masa depan
ialah 1 baris). H3 dikemas kini: "resample pengangkutan" itu (juga) ialah
pengekod API sendiri. Penolakan pada transkripsi melalui API mentah: 100%
pada halaman standard (H4 diperkukuh — hanya framing ejen terlepas). Opus
10×16 disahkan pada kedua-dua pengangkutan (77-87%).

## ADDENDUM 2026-07-06 (2) — Kelompok GPT-5.5 melalui API terus: H7 ditutup (GAGAL)

| lengan | verbatim | gist | output/jawapan |
|---|---:|---:|---:|
| jalur 768×2048 5×8 AA | 0/30 (18 penahanan diri, 5 ditapis, 7 ralat) | 0/3 | 2,639 tok |
| jalur 5×8 1-bit | 0/30 (15 penahanan diri, 5 ditapis, 10 ralat) | 1/3 | 2,383 tok |
| TEKS (kawalan) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 tidak dapat membaca glif 5×8 (0/60; malah gist pun tidak
bertahan) dan menggembungkan penyiapan ~40× cuba mentafsirnya (2.4-2.7k
token penaakulan setiap soalan) — penjimatan prompt ditelan oleh output.
Kawalan teks yang sempurna membuktikan korpus/soalan adalah waras.
Mengesahkan dan mengukur opt-in 5.5; gpt-5.6 (lalai) kekal tidak diuji
(akaun tiada akses).
Masa depan (H12): get GPT mesti memodelkan penggembungan output, bukan
sekadar token prompt.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (SEPARA: kuota tingkat percuma habis di tengah larian)

Daripada ~26 jawapan imej yang berjaya sebelum kuota mati: **0 betul, 1
penahanan diri, ~25 KONFABULASI** — dan ia bukan kekeliruan glif: ia
digit rawak (`indexLedgerInd → 0040375615`), iaitu pengekod hampir tidak
melihat apa-apa pada kepadatan yang diuji (jubin asli 42 aksara/tok dan
MEDIUM flat) dan 2.5-flash MENGARANG berbanding menahan diri (mengabaikan
arahan ILEGIVEL). Kawalan teks: 3/3 pada yang berjaya. Tiada
penggembungan output (6-28 tok/jawapan).

Isyarat awal: H5/H6 cenderung ke arah TIDAK pada 2.5-flash, dengan mod
kegagalan LEBIH TERUK daripada GPT (konfabulasi senyap berbanding
penahanan diri) — Gemini akan memerlukan perlindungan tambahan dalam
proksi. Menunggu ditutup: jalankan semula dengan kuota berbayar atau pada
hari lain, dan uji gemini-2.5-pro (flash ialah pembaca paling lemah dalam
keluarga itu). Halaman jubin asli masih mempunyai nisbah TERDOKUMEN
terbaik (42.3 aksara/token); kebolehbacaan itulah yang masih diragui.

Nota kos: halaman separa (yang terakhir dalam korpus) dikenakan bil
teruk di bawah rejim jubin (ketinggian pendek → unit potongan kecil →
lebih banyak jubin) — memadatkan halaman terakhir kepada ketinggian
1152px ialah pengoptimuman wajib jika Gemini turut serta.
