# OmniGlyph — Konsolidasi pengukuran (2026-07-05)

🌐 Diterjemahkan: [semua bahasa](../../../README.md)

Semua yang TERUKUR dalam sesi ini, dengan sumber dan n; hipotesis dipisahkan
dengan jelas di bagian akhir. Bukti: `benchmarks/billing-sweep/results/` dan
`benchmarks/density-frontier/results/` (JSONL per jawaban).

## TL;DR — seluruh hasil dalam dua batang

**Biaya** — satu halaman standard 1568×728 memuat 28.080 karakter untuk
biaya flat 1.460 token; teks yang sama dikirim mentah biayanya ~10× lebih
mahal:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Akurasi** — tetapi hanya di mana model benar-benar membaca halamannya.
Gate-nya fail-closed; hanya baris ✅ yang dirilis:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Sisa dokumen ini adalah bukti di balik kedua batang tersebut.

## 1. Billing Anthropic (count_tokens langsung, $0, 11 geometri × 2 model)

Formula terkonfirmasi: `tokens = ceil(w/28) × ceil(h/28)` setelah resize per
tier, **+3/blok (Fable 5) / +4/blok (Sonnet 4.5)** — residual NOL di semua
baris.

| probe | dimensi | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| jangkar doc | 1092×1092 | 1524 | 1525 |
| jangkar doc | 1000×1000 | 1299 | 1300 |
| halaman standard | 1568×728 | 1459 | 1460 |
| **halaman besar** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| plafon hi-res | 1960×1960 | 4764 (clamp) | 1525 |
| long edge hi-res | 2576×1204 | 3959 | 1516 |
| strip tinggi | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 gambar) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, TIDAK ditolak di count_tokens) | 3585 |

Keputusan turunan (diimplementasikan): gate eksak berdasarkan patch; tier per
model (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Akurasi pembacaan (density-frontier, needle hex/camelCase/digit + distractor)

### Matriks 2×2 Fable 5 — via CLI/langganan, n=30/lengan, corpus sama (~16,6k karakter)

| halaman × atlas | eksak | abstensi (ILEGIVEL) | error diam-diam |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (diprediksi oleh matriks) |

→ **1-bit > AA di kedua halaman; nol konfabulasi dalam 120 pertanyaan.**
DITERAPKAN: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res tiba dalam kondisi terdegradasi karena resample transport (lihat H1/H3) — 67% adalah lantai, bukan langit-langit.

### Opus 4.8 — via CLI/langganan, n=30/lengan

| konfigurasi | eksak | abstensi | error |
|---|---:|---:|---:|
| high-res · sel 10×16 | **26/30 (87%)** | 0 | 4 (digit) |
| standard · sel 5×8 | 0/30 | 30 | 0 |

→ Titik lutut Opus terkonfirmasi dengan n sendiri (upstream median 95% pada
10×16 dengan n=20). "Mode aman Opus" layak: 10×16 di halaman besar ≈ 1,7
char/token gambar dalam corpus harness.

### Via OpenRouter (corpus/pertanyaan sama) — tidak konklusif untuk keterbacaan

| fakta terukur | angka |
|---|---|
| content_filter pada pertanyaan transkripsi (halaman standard) | 60/60 (100%) |
| content_filter pada halaman high-res | 5-6/30 (~20%) |
| Fable high-res: abstensi + error | 20 ILEGIVEL + 5 error (2 diprediksi) |
| Opus 10×16 (sebelum kredit habis) | 7/9 eksak (78%) |
| misread yang diprediksi oleh matriks konfusabilitas | 4→a, 0→8, huruf besar S/s |

### Perbandingan transport (pertanyaan sama, konten sama)

| transport | filter/penolakan | halaman besar terbaca? |
|---|---|---|
| API langsung (n=9, sebelum kredit habis) | 0 | belum diuji |
| OpenRouter | ~100% std / ~20% hi-res | tidak (dugaan: resample) |
| CLI Claude Code (langganan) | 0 content_filter; ~50% dari batch besar macet (diselesaikan dengan chunk 10 + retry) | tidak (dugaan: Read me-resize) |

## 3. Biaya per provider (offline, eksak — halaman PENUH, teoretis)

| provider · halaman | token/halaman | karakter/halaman | **karakter/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (semua model) | 1460 | 28.080 | **19,2** | terukur |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (3,3× lebih sedikit gambar) | billing terukur; keterbacaan tertunda (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38.760 | **32,6** | doc diaudit |
| GPT-5.4/5.5 (patch, original) hingga 1568×5984 | ~9.163 | ~233k | **25,4** | doc; keterbacaan belum diuji |
| gpt-4o-mini | 48.169/strip | — | **0,8 — JANGAN PERNAH digambar** | doc (bug D2 diperbaiki) |
| Gemini tile 1533×1152 (crop unit 768 native) | 1032 | 43.615 | **42,3 ← rasio terbaik terdokumentasi** | doc; keterbacaan belum diuji |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (jika terbaca)** | hipotesis H6 |

## 4. Bug ditemukan dan diperbaiki (audit lewat dokumentasi resmi)

| id | bug | dampak | commit |
|---|---|---|---|
| D2 | gpt-4o-mini jatuh ke tile default 85/170 (nyata: 2833/5667) | biaya ~33× diremehkan — **gate terbalik** | e6bc75f |
| D1 | pengali o4-mini 1,62 (nyata 1,72) | −5,8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) dengan cap 10000 (nyata 1536, tanpa original) | akan gagal dengan halaman lebih besar | e6bc75f |
| D4 | gpt-5-codex-mini di rezim tile (nyata: patch 1536) | ≥+23% diremehkan | e6bc75f |
| D5 | detail:'original' di-hardcode untuk semua model (hanya ada di 5.4+) | di luar kontrak | e6bc75f |
| #44 | stub deskripsi disuntikkan ke tool bertipe → 400 + fallback diam-diam | savings menjadi nol tanpa sinyal | 0f66e32 |
| AA | atlas AA di produksi bertentangan dengan komentar "eval-only" | −17pp keterbacaan pada Fable | 9a25585 |
| — | slab cols 313 (1573px) → resample 0,997× + kolom patch ekstra | diperbaiki jadi 312 | baseline |

## 5. Hipotesis terbuka (biaya untuk menutup masing-masing)

| id | hipotesis | bukti saat ini | uji penentu | biaya |
|---|---|---|---|---|
| H1 | Halaman 1928² terbaca ≥ standard di API langsung (WYSIWYG terbukti di billing) | billing 4764 tanpa resample; 1-bit sudah terbaca 67% meski terdegradasi | A/B langsung std vs hi-res (1-bit) | ~US$ 4 API |
| H2 | hi-res + 1-bit di API langsung ≈ 100% dengan 3,3× lebih sedikit gambar | H1 + matriks 2×2 | sama seperti H1 | sama |
| H3 | Read dari CLI dan OpenRouter me-resize gambar >1568/2000px | 5×8 mati dan 10×16 bertahan PADA HALAMAN YANG SAMA | 1 halaman 1928² dengan glyph 20×32 per masing-masing transport | ~US$ 0 (CLI) |
| H4 | Penolakan bergantung pada framing (agen-membaca-file ≈ 0% vs API mentah ≈ 100%) | perbandingan transport di atas | A/B wording di jalur proxy nyata | rendah |
| H5 | Gemini tile 1533×1152 terbaca pada 5×8 (42 char/tok) | tidak ada | density-frontier dengan GEMINI_API_KEY | ~gratis (free tier) |
| H6 | media_resolution:low terbaca (116 char/tok) | tidak mungkin (encoder resolusi rendah), tapi belum pernah diukur | 1 panggilan | ~gratis |
| H7 | GPT: keterbacaan strip + inflasi token completion (risiko PageWatch) | komunitas melihat −40% prompt tapi +completion/latensi 2× | density-frontier dengan OPENAI_API_KEY | ~US$ 2-5 |
| H8 | Glyph surgery (H~K, 0/8, 5/3…) mengubah abstensi menjadi pembacaan | pasca-1-bit, SEMUA miss Fable berubah jadi abstensi | edit ~10 bitmap + jalankan ulang matriks | $0 (CLI) |
| H9 | Tema terang (hitam-di-atas-putih) > terbalik | literatur (Glyph paper, Tesseract); belum pernah diukur pada VLM komersial | flag style + 2 lengan | $0 (CLI) |
| H10 | Opus pada 7×10 berada di antara 0% (5×8) dan 87% (10×16) → trade-off halus | kurva upstream 35% pada 7×10 (n=20) | 1 lengan tambahan | $0 (CLI) |
| H11 | Retry-no-refusal pada proxy memulihkan ~50% batch yang terfilter | penolakan bersifat stokastik per panggilan | implementasi + ukur di produksi | kode |

## 6. Pending operasional

1. `gh auth login` → buat `diegosouzapw/omniglyph` privat + push (10 commit lokal).
2. Kredit Anthropic (H1/H2, putusan geometri) dan OpenRouter (habis).
3. **Rotasi key** Anthropic dan OpenRouter yang terekspos di chat.
4. Antrean kode: #45 (schema-strip draft-07), retry-no-refusal (H11), glyph
   surgery (H8), Fase 4 (TS di scripts, GIF, docs, dashboard v2), Fase 5
   (engine OmniRoute).

## ADENDUM 2026-07-06 — A/B via API langsung (165 panggilan): H1/H2 DIBANTAH

| konfigurasi | eksak | abst. | penolakan | error |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA dan 1-bit) | 0/60 | 0 | **60/60 penolakan** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 diprediksi) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 diprediksi) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

PUTUSAN: halaman 1928² dari tier high-res DITAGIH WYSIWYG (4764 tok, sweep)
tetapi ENCODER tidak menerima resolusi penuh — 1-2/30 terbaca dengan error
pertukaran glyph tunggal (6→8, a→4), tanda tangan resample internal.
**Billing ≠ input encoder → jebakan: 3,3× biaya, keterbacaan lebih buruk.**
DITERAPKAN: pageGeometryForTier() dikembalikan — kedua tier merender
1568×728; infra tier dipertahankan (billing eksak tetap valid dan retune
di masa depan tinggal 1 baris). H3 diperbarui: "resample transport" itu
(juga) adalah encoder dari API itu sendiri. Penolakan pada transkripsi via
API mentah: 100% pada halaman standard (H4 diperkuat — hanya framing agen
yang lolos). Opus 10×16 terkonfirmasi pada kedua transport (77-87%).

## ADENDUM 2026-07-06 (2) — Batch GPT-5.5 via API langsung: H7 ditutup (DITOLAK)

| lengan | verbatim | gist | output/respons |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtr, 7 error) | 0/3 | 2.639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtr, 10 error) | 1/3 | 2.383 tok |
| TEKS (kontrol) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 tidak bisa membaca glyph 5×8 (0/60; bahkan gist tidak selamat) dan
menggembungkan completion ~40× saat mencoba menerjemahkan (2,4-2,7k token
reasoning per pertanyaan) — penghematan prompt habis dimakan oleh output.
Kontrol dalam teks sempurna membuktikan corpus/pertanyaan sehat. Mengonfirmasi
dan mengukur opt-in dari 5.5; gpt-5.6 (default) tetap tidak dapat diuji (akun
tanpa akses). Masa depan (H12): gate GPT harus memodelkan inflasi output,
bukan hanya token prompt.

## ADENDUM 2026-07-06 (3) — Gemini 2.5-flash (SEBAGIAN: kuota free tier habis di tengah jalan)

Dari ~26 jawaban gambar yang lolos sebelum kuota mati: **0 benar,
1 abstensi, ~25 KONFABULASI** — dan itu bukan kebingungan glyph: itu adalah
digit acak (`indexLedgerInd → 0040375615`), artinya encoder hampir tidak
melihat apa pun pada kepadatan yang diuji (tile native 42 char/tok dan flat
MEDIUM) dan 2.5-flash MENGARANG alih-alih abstain (mengabaikan instruksi
ILEGIVEL). Kontrol dalam teks: 3/3 pada yang lolos. Tanpa inflasi output
(6-28 tok/jawaban).

Sinyal awal: H5/H6 cenderung TIDAK pada 2.5-flash, dengan mode kegagalan
yang LEBIH BURUK dari GPT (konfabulasi diam-diam alih-alih abstensi) —
Gemini akan membutuhkan safeguard ekstra di proxy. Tertunda untuk ditutup:
jalankan ulang dengan kuota berbayar atau di hari lain, dan uji
gemini-2.5-pro (flash adalah pembaca terlemah dalam keluarganya). Halaman
tile-native tetap memiliki rasio terbaik yang TERDOKUMENTASI (42,3
char/token); yang masih diragukan adalah keterbacaannya.

Catatan biaya: halaman parsial (terakhir dari corpus) ditagih buruk dalam
rezim tile (tinggi pendek → crop unit kecil → lebih banyak tile) —
mengganjal halaman terakhir hingga tinggi 1152px adalah optimisasi wajib
jika Gemini masuk.
