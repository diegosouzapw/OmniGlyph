🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Context as Image

### Potong tagihan Claude Anda hingga **59–70%** dengan merender konteks yang besar sebagai halaman PNG yang padat — konten yang sama, dengan sebagian kecil dari jumlah token.

**Model menagih teks per token, tetapi menagih gambar berdasarkan dimensinya — bukan berdasarkan berapa banyak teks di dalamnya.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-angka-angka--terukur-bukan-estimasi)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-bagian-jujur)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Bagian dari keluarga [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute)

</div>

---

# 📊 Angka-angka — terukur, bukan estimasi

| metrik | hasil | bukti |
|---|---|---|
| Pengurangan tagihan end-to-end | **59–70%** | jejak produksi, 13.709 permintaan |
| Token per blok yang dikonversi | **10× lebih sedikit** (28.080 karakter: 14.040 → 1.460 token) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Akurasi formula penagihan | residual **nol** pada 22 probe `count_tokens`, 2 model × 2 tingkatan | `benchmarks/billing-sweep/results/` |
| Akurasi baca-persis, konfigurasi produksi | **30/30 (100%)** pada Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Konfabulasi diam-diam dalam ~300 probe baca | **0** — setiap kegagalan abstain sebagai `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Kartu skor model** (apakah bisa membaca render padat? n=30 per lengan, penilaian deterministik):

| model | membaca | putusan |
|---|---|---|
| Claude **Fable 5** | **100%** persis | ✅ target produksi |
| Claude Opus 4.8 | 77–87% pada ukuran glyph 4× | ⚠️ mode aman opt-in (penghematan turun ke ~2×) |
| GPT-5.5 | 0/60 — dan menggembungkan jawabannya ~40× saat mencoba | ❌ diblokir oleh gate, dengan bukti |
| Gemini 2.5-flash | 0/26 — dan berkonfabulasi alih-alih abstain | ❌ diblokir (uji sebagian, dibatasi kuota) |

Keunggulan ini **khusus-Fable hari ini** — encoder visi lain belum bisa mengurai glyph yang padat. [Harness benchmark](benchmarks/README.md) menguji ulang model baru mana pun dalam satu perintah.

# 🤔 Kenapa OmniGlyph?

Setiap sesi agen yang berjalan lama menyeret beban mati yang sama pada setiap permintaan: system prompt, dokumentasi tool, dan riwayat lama — ditagih ulang per token, setiap giliran. OmniGlyph adalah **proxy lokal** yang menulis ulang bagian-bagian besar itu menjadi halaman PNG padat *sebelum meninggalkan mesin Anda*:

- **Matematika penagihan yang eksak, bukan heuristik** — menghitung formula token-gambar asli dari provider (terukur hingga residual nol) dan hanya mengonversi ketika hitungannya menang.
- **Fail-closed by design** — model yang tidak bisa membaca render padat diblokir oleh sebuah gate, dengan bukti benchmark. Tidak ada penurunan kualitas diam-diam.
- **Privat & local-first** — penulisan ulang terjadi di `127.0.0.1`; tidak ada yang tambahan dikirim ke mana pun.
- **Dapat direproduksi** — setiap angka di atas punya bukti di `benchmarks/*/results/`, dapat dijalankan ulang dalam satu perintah.

# ⚡ Mulai Cepat

```bash
npx omniglyph                                     # proxy di 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # arahkan Claude Code ke sana
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Berfungsi dua arah:
- **API key** (bayar per token): tagihan Anda turun 59–70% end-to-end.
- **Sesi langganan**: Anda tidak membayar lebih murah, tetapi batas penggunaan dihitung dalam token — sehingga batas Anda meregang **~2–3×**.

Dashboard di <http://127.0.0.1:47821/>: token yang dihemat, setiap konversi teks→gambar berdampingan, kill switch, chip model langsung. Respons streaming berjalan normal — hanya *permintaan* yang dikompresi, tidak pernah output model.

# ⚙️ Cara kerjanya

```
blok permintaan besar ──► gate profitabilitas ──► reflow + render (atlas 1-bit 5×8)
                       (matematika penagihan eksak)  ──► halaman PNG 1568×728 ──► sambung kembali, ramah-cache
```

- **Penagihan dihitung secara eksak, sebelum konversi**: Anthropic menagih `⌈w/28⌉ × ⌈h/28⌉ + 4` token per gambar (patch 28 px — terukur hingga residual nol). Satu halaman penuh membawa 28.080 karakter untuk 1.460 token ≈ **19 karakter/token**, dibandingkan ~2 karakter/token untuk teks padat. Gate hanya mengonversi ketika hitungannya menang.
- **Yang dikonversi**: system prompt statis + dokumentasi tool, riwayat lama yang di-collapse, output tool besar.
- **Yang tidak pernah dikonversi**: pesan Anda, giliran terbaru, output model, prosa jarang, nilai byte-exact (hash/ID ikut sebagai teks), dan model mana pun yang gagal benchmark pembacaan.

# 🧭 Bagian jujur

- **Ini lossy.** Recall byte-exact dari gambar secara alami tidak dapat diandalkan. Mitigasi yang sudah dikirim: identifier eksak berjalan sebagai teks di samping gambar, dan konfigurasi produksi yang terukur menghasilkan **nol konfabulasi diam-diam** — pembacaan yang gagal akan abstain.
- **Hanya Fable 5 yang disetujui hari ini**, dengan bukti. GPT-5.5 dan Gemini 2.5-flash secara terukur tidak bisa membaca render padat; Opus 4.8 butuh glyph 4× lebih besar. Gate menegakkan ini.
- **Kami menemukan dan menghindari jebakan penagihan**: tingkatan gambar resolusi tinggi menagih 3,3× lebih mahal per halaman, tetapi encoder visi tidak menerima resolusi ekstra tersebut — halaman yang lebih besar justru dibaca *lebih buruk*. Terukur, didokumentasikan di [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), tidak diaktifkan.
- Harga berubah; metrik yang tahan lama adalah pemotongan token, yang dicatat proxy per permintaan terhadap counterfactual `count_tokens` gratis.

# 🔬 Reproduksi setiap angka

```bash
pnpm install && pnpm test                                     # suite lengkap
node benchmarks/billing-sweep/run.mjs --dry-run               # prediksi penagihan, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # tabel biaya, $0
# dengan key: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (atau --via-cli untuk langganan Claude Code)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Metodologi lengkap dan setiap tabel hasil: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Bukti mentah per jawaban: `benchmarks/*/results/*.jsonl`.

# 🚀 Keluarga OmniRoute

OmniGlyph juga hadir sebagai **mesin kompresi native di dalam [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — gateway AI gratis. Di sana ia berjalan sebagai engine `omniglyph` (mode tunggal berdiri sendiri atau ditumpuk dengan engine lain), dengan gate fail-closed dan akuntansi token yang sadar-gambar.

# 🛠️ Tech Stack

| lapisan | teknologi |
|---|---|
| Bahasa | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | atlas glyph 1-bit sendiri (turunan Spleen/Unifont, lisensi di `assets/`) → PNG |
| Tests | Vitest — TDD, plus guard docs-integrity dan rebrand |
| Benchmarks | harness `benchmarks/` (billing-sweep, density-frontier) dengan bukti JSONL |

## Tata letak proyek

| path | apa |
|---|---|
| `src/` | proxy: pipeline transform, penagihan eksak per provider, renderer, host (Node + Cloudflare Workers) |
| `benchmarks/` | harness yang menghasilkan setiap angka di atas — dapat dijalankan ulang |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Dukungan & Komunitas

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bug dan permintaan fitur
- 🔒 [SECURITY.md](SECURITY.md) — laporan kerentanan
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD ketat + pengukuran-sebelum-klaim
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Lisensi

MIT — lihat [LICENSE](../../../LICENSE).
