🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Konteks sebagai Imej

### Kurangkan bil Claude anda sebanyak **59–70%** dengan merender konteks besar sebagai halaman PNG padat — kandungan yang sama, dengan sebahagian kecil daripada bilangan token.

**Model mengenakan bil teks mengikut token, tetapi mengenakan bil imej mengikut dimensinya — bukan mengikut jumlah teks di dalamnya.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-angka--diukur-bukan-dianggar)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-bahagian-jujur)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Sebahagian daripada keluarga [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 All languages](../README.md)

</div>

---

# 📊 Angka — diukur, bukan dianggar

| metrik | hasil | resit |
|---|---|---|
| Pengurangan bil hujung ke hujung | **59–70%** | jejak pengeluaran, 13,709 permintaan |
| Token bagi setiap blok yang ditukar | **10× lebih sedikit** (28,080 aksara: 14,040 → 1,460 token) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Ketepatan formula pengebilan | baki **sifar** merentasi 22 ujian `count_tokens`, 2 model × 2 tingkat | `benchmarks/billing-sweep/results/` |
| Ketepatan bacaan tepat, konfigurasi pengeluaran | **30/30 (100%)** pada Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Konfabulasi senyap dalam ~300 ujian bacaan | **0** — setiap kegagalan menahan diri sebagai `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Kad skor model** (bolehkah ia membaca render padat? n=30 setiap lengan, penskoran deterministik):

| model | bacaan | keputusan |
|---|---|---|
| Claude **Fable 5** | **100%** tepat | ✅ sasaran pengeluaran |
| Claude Opus 4.8 | 77–87% pada saiz glif 4× | ⚠️ mod selamat opt-in (penjimatan turun ke ~2×) |
| GPT-5.5 | 0/60 — dan menggelembungkan jawapannya ~40× cuba | ❌ disekat oleh get, dengan bukti |
| Gemini 2.5-flash | 0/26 — dan mengarang jawapan berbanding menahan diri | ❌ disekat (ujian separa, dihadkan kuota) |

Kelebihan ini **khusus untuk Fable buat masa ini** — pengekod visi lain belum dapat mentafsir glif padat. [Harness penanda aras](benchmarks/README.md) menguji semula sebarang model baharu dengan satu arahan.

# 🤔 Kenapa OmniGlyph?

Setiap sesi ejen yang berjalan lama menyeret beban mati yang sama pada setiap permintaan: system prompt, dokumentasi alat, dan sejarah lama — dikenakan bil semula mengikut token, setiap pusingan. OmniGlyph ialah **proksi tempatan** yang menulis semula bahagian-bahagian besar itu menjadi halaman PNG padat *sebelum ia meninggalkan mesin anda*:

- **Matematik pengebilan tepat, bukan heuristik** — ia mengira formula token imej sebenar penyedia (diukur hingga baki sifar) dan hanya menukar apabila pengiraan itu menguntungkan.
- **Gagal-tertutup mengikut reka bentuk** — model yang tidak dapat membaca render padat disekat oleh get, dengan resit penanda aras. Tiada kehilangan kualiti secara senyap.
- **Peribadi & tempatan-dahulu** — penulisan semula berlaku pada `127.0.0.1`; tiada apa-apa tambahan dihantar ke mana-mana.
- **Boleh dihasilkan semula** — setiap angka di atas mempunyai resit dalam `benchmarks/*/results/`, boleh dijalankan semula dengan satu arahan.

# ⚡ Mula Pantas

```bash
npx omniglyph                                     # proksi pada 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # arahkan Claude Code kepadanya
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Berfungsi dalam kedua-dua cara:
- **Kunci API** (bayar mengikut token): bil anda turun 59–70% hujung ke hujung.
- **Sesi langganan**: anda tidak membayar kurang, tetapi had penggunaan dikira dalam token — jadi had anda meregang **~2–3×**.

Papan pemuka di <http://127.0.0.1:47821/>: token dijimatkan, setiap penukaran teks→imej bersebelahan, suis kill, cip model langsung. Respons mengalir seperti biasa — hanya *permintaan* yang dimampatkan, tidak pernah output model.

# ⚙️ Bagaimana ia berfungsi

```
blok permintaan besar ──► get keuntungan ──► reflow + render (atlas 1-bit 5×8)
                       (matematik pengebilan tepat)     ──► halaman PNG 1568×728 ──► sambung semula, mesra cache
```

- **Pengebilan dikira dengan tepat, sebelum menukar**: Anthropic mengenakan bil `⌈w/28⌉ × ⌈h/28⌉ + 4` token setiap imej (patch 28 piksel — diukur hingga baki sifar). Satu halaman penuh membawa 28,080 aksara untuk 1,460 token ≈ **19 aksara/token**, berbanding ~2 aksara/token untuk teks padat. Get ini hanya menukar apabila pengiraan itu menguntungkan.
- **Apa yang ditukar**: system prompt statik + dokumentasi alat, sejarah lama yang telah dikuncupkan, output alat yang besar.
- **Apa yang tidak pernah ditukar**: mesej anda, pusingan terkini, output model, prosa jarang, nilai tepat-bait (hash/ID mengiringi sebagai teks), dan mana-mana model yang gagal penanda aras bacaan.

# 🧭 Bahagian jujur

- **Ia lossy.** Ingatan tepat-bait daripada imej memang tidak boleh dipercayai sepenuhnya. Mitigasi yang telah dilaksanakan: pengecam tepat bergerak sebagai teks di sebelah imej, dan konfigurasi pengeluaran yang diukur menghasilkan **sifar konfabulasi senyap** — bacaan yang gagal menahan diri.
- **Hanya Fable 5 diluluskan buat masa ini**, dengan resit. GPT-5.5 dan Gemini 2.5-flash secara terukur tidak dapat membaca render padat; Opus 4.8 memerlukan glif 4× lebih besar. Get ini menguatkuasakan perkara ini.
- **Kami menemui dan mengelakkan perangkap pengebilan**: tingkat imej resolusi tinggi mengenakan bil 3.3× lebih banyak setiap halaman, tetapi pengekod visi tidak menerima resolusi tambahan itu — halaman yang lebih besar dibaca *lebih teruk*. Diukur, didokumenkan dalam [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), tidak diaktifkan.
- Harga berubah; metrik yang kekal ialah pengurangan token, yang direkodkan oleh proksi bagi setiap permintaan berbanding kaunterfaktual `count_tokens` percuma.

# 🔬 Hasilkan semula setiap angka

```bash
pnpm install && pnpm test                                     # suite penuh
node benchmarks/billing-sweep/run.mjs --dry-run               # ramalan pengebilan, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # jadual kos, $0
# dengan kunci: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (atau --via-cli untuk langganan Claude Code)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Metodologi penuh dan setiap jadual hasil: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Resit mentah bagi setiap jawapan: `benchmarks/*/results/*.jsonl`.

# 🚀 Keluarga OmniRoute

OmniGlyph juga dihantar sebagai **enjin pemampatan asli di dalam [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — get laluan AI percuma. Di sana ia berjalan sebagai enjin `omniglyph` (mod tunggal berdiri sendiri atau bertindan dengan enjin lain), dengan get gagal-tertutup dan perakaunan token sedar-imej.

# 🛠️ Timbunan Teknologi

| lapisan | teknologi |
|---|---|
| Bahasa | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Render | atlas glif 1-bit sendiri (terbitan Spleen/Unifont, lesen dalam `assets/`) → PNG |
| Ujian | Vitest — TDD, ditambah pengawal keutuhan dokumentasi dan penjenamaan semula |
| Penanda aras | harness `benchmarks/` (billing-sweep, density-frontier) dengan resit JSONL |

## Susun atur projek

| laluan | apa |
|---|---|
| `src/` | proksi: saluran transformasi, pengebilan tepat setiap penyedia, perender, hos (Node + Cloudflare Workers) |
| `benchmarks/` | harness yang menghasilkan setiap angka di atas — boleh dijalankan semula |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Sokongan & Komuniti

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — pepijat dan permintaan ciri
- 🔒 [SECURITY.md](SECURITY.md) — laporan kerentanan
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD ketat + pengukuran-sebelum-dakwaan
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Lesen

MIT — lihat [LICENSE](../../../LICENSE).
