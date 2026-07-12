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

# 🔌 Gunakan dengan klien Claude

Start the proxy in one terminal, then point the client at it.

**Claude Code CLI (macOS/Linux):**

```bash
npx omniglyph
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude
```

**Claude Code CLI (Windows PowerShell):**

```powershell
npx omniglyph
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:47821"
claude
```

**Claude Desktop** uses the same `ANTHROPIC_BASE_URL` environment variable for its bundled Claude Code runtime — start `omniglyph` first, then launch Claude Desktop from an environment where `ANTHROPIC_BASE_URL` is set to `http://127.0.0.1:47821`.

# 🖥️ Dashboard

Dashboard lokal lengkap disertakan di dalam paket — offline, single-file, tanpa permintaan eksternal. Enam halaman, diperbarui secara langsung lewat SSE seiring permintaan mengalir:

![Overview: kartu KPI mission-control, sparkline penghematan, dan feed event langsung](../../assets/dashboard-overview.png)

- **Overview** — mission control: persentase penghematan, $ yang dihemat, latensi p95, cache hits, error, live feed.
- **Live Flow** — pipeline sebagai node graph: client → gate → renderer / passthrough → API, dengan satu partikel per permintaan nyata.
- **Telemetry** — odometer token/$ dan linimasa permintaan langsung; klik permintaan mana pun untuk melihat persis bagian mana yang menjadi gambar dan membaca teks sumber di balik setiap halaman.
- **Benchmarks** — bukti harness yang dirender dari `benchmarks/*/results/`, satu baris per eksperimen model·config, dan **jalankan benchmark langsung dari UI**: dry-run `$0` menstream outputnya secara langsung; live run tetap terkunci di balik API key Anda plus konfirmasi biaya eksplisit.
- **Sessions / History** — sesi teratas berdasarkan token yang dihemat dan setiap event di disk.

| Live Flow | Benchmarks |
|---|---|
| ![Pipeline permintaan sebagai node graph langsung](../../assets/dashboard-flow.png) | ![Bukti benchmark dan dry-run di dalam UI](../../assets/dashboard-benchmarks.png) |

![Telemetry: odometer dan linimasa permintaan langsung](../../assets/dashboard-telemetry.png)

# ⚙️ Cara kerjanya

```
blok permintaan besar ──► gate profitabilitas ──► reflow + render (atlas 1-bit 5×8)
                       (matematika penagihan eksak)  ──► halaman PNG 1568×728 ──► sambung kembali, ramah-cache
```

- **Penagihan dihitung secara eksak, sebelum konversi**: Anthropic menagih `⌈w/28⌉ × ⌈h/28⌉ + 4` token per gambar (patch 28 px — terukur hingga residual nol). Satu halaman penuh membawa 28.080 karakter untuk 1.460 token ≈ **19 karakter/token**, dibandingkan ~2 karakter/token untuk teks padat. Gate hanya mengonversi ketika hitungannya menang.
- **Yang dikonversi**: system prompt statis + dokumentasi tool, riwayat lama yang di-collapse, output tool besar.
- **Yang tidak pernah dikonversi**: pesan Anda, giliran terbaru, output model, prosa jarang, nilai byte-exact (hash/ID ikut sebagai teks), dan model mana pun yang gagal benchmark pembacaan.

# 📚 Penggunaan sebagai library (tanpa proxy)

Semua yang dilakukan proxy per permintaan juga tersedia sebagai API yang terdokumentasi dan dapat diimpor:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render teks apa pun menjadi halaman PNG 1-bit yang padat
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Atau jalankan sendiri transform permintaan lengkap — gate, matematika penagihan, semuanya
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // body JSON /v1/messages mentah
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` mengunci blok sebagai teks; `options.emitRecoverable` mengembalikan versi asli dari blok yang sudah dijadikan gambar. Matematika penagihan eksak juga dikirim di root paket (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — itulah yang dikonsumsi [OmniRoute](https://github.com/diegosouzapw/OmniRoute). Runtime murni JS (Node dan edge/Workers). Permukaan lengkap: `src/core/index.ts`.

# 📤 Ekspor offline — tanpa proxy, tanpa Claude Code

Tidak pakai Claude Code? Render konteks menjadi halaman PNG **secara lokal** dan tempelkan ke Cursor, ChatGPT, atau chat apa pun yang menerima unggahan gambar. Tanpa proxy, tanpa API key, tanpa akun yang perlu disambungkan:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Anda mendapat satu folder berisi semua yang perlu ditempelkan ke chat:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` merender diff Anda yang belum di-commit, `--diff <ref>` sebuah rentang commit, `--open` membuka folder-nya (macOS). Semuanya berjalan di mesin Anda — jalur ekspor tidak pernah menjalankan proxy dan tidak pernah memanggil model. Jalankan `omniglyph export --help` untuk setiap flag.

# 🧭 Bagian jujur

- **Ini lossy.** Recall byte-exact dari gambar secara alami tidak dapat diandalkan. Mitigasi yang sudah dikirim: identifier eksak berjalan sebagai teks di samping gambar, dan konfigurasi produksi yang terukur menghasilkan **nol konfabulasi diam-diam** — pembacaan yang gagal akan abstain.
- **Hanya Fable 5 yang disetujui hari ini**, dengan bukti. GPT-5.5 dan Gemini 2.5-flash secara terukur tidak bisa membaca render padat; Opus 4.8 butuh glyph 4× lebih besar. Gate menegakkan ini.
- **Kami menemukan dan menghindari jebakan penagihan**: tingkatan gambar resolusi tinggi menagih 3,3× lebih mahal per halaman, tetapi encoder visi tidak menerima resolusi ekstra tersebut — halaman yang lebih besar justru dibaca *lebih buruk*. Terukur, didokumentasikan di [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), tidak diaktifkan.
- Harga berubah; metrik yang tahan lama adalah pemotongan token, yang dicatat proxy per permintaan terhadap counterfactual `count_tokens` gratis.

# 🧠 FAQ

**Saya mengaktifkannya di tengah sesi dan pemakaian melonjak — kenapa?**
Sesi yang berjalan tanpa OmniGlyph memiliki seluruh prefiksnya di-cache oleh Anthropic sebagai teks dengan tarif baca 0,1×; permintaan pertama dengan gambar akan membayar ulang semuanya sebagai penulisan cache baru dengan tarif 1,25× dalam satu prompt. Proxy melindungi dari ini: sesi yang belum pernah diubahnya menjadi gambar memasukkan biaya sekali itu ke gerbang titik impas dan hanya beralih ke gambar jika masih menguntungkan — jika tidak, sesi tetap teks dan penghematan dimulai pada sesi baru berikutnya.

**Apakah 59–70% itu end-to-end, atau hanya pada permintaan yang tersentuh?**
End-to-end — total tagihan. Sebagian besar tool kompresi melaporkan penghematan hanya pada bagian yang mereka sentuh, yang membuat angkanya terlihat lebih bagus. Penyebut kami adalah *setiap* permintaan: yang kecil yang secara benar dibiarkan oleh gate, semua penulisan dan pembacaan cache, dan semua token output (yang tidak pernah dikompresi oleh proxy). Hasil hanya-yang-dikompresi lebih tinggi dan dikutip terpisah, tidak pernah sebagai angka utama.

**Bagaimana penghematan ini diukur?**
Kedua sisi dari permintaan yang sama, pada momen yang sama. Untuk setiap POST `/v1/messages`, proxy menembakkan probe `count_tokens` gratis pada body asli yang belum dikompresi (counterfactual) secara paralel dengan forward yang sesungguhnya, dan membaca blok usage yang benar-benar ditagih provider dari respons — keduanya masuk ke baris event yang sama. Harga cache diterapkan secara identik pada kedua sisi, sehingga diskon caching saling meniadakan dan tidak bisa dihitung ganda sebagai "penghematan". Formulanya ada di `src/core/baseline.ts`; turunkan ulang sendiri dari log event Anda.

**Mengapa kesalahan baca disebut konfabulasi, bukan error pembacaan?**
Karena visi model bukan OCR: halaman menjadi embedding patch, tidak pernah karakter diskret, sehingga tidak ada confidence per-glyph yang bisa gagal dengan jelas — ketika piksel tidak cukup menentukan sebuah glyph, prior bahasa mengisi celah itu dengan sesuatu yang masuk akal. Mekanisme itulah alasan OmniGlyph bersikap fail-closed soal ini: nilai byte-exact selalu berjalan sebagai teks di samping gambar, model yang salah baca diblokir oleh gate, dan konfigurasi produksi yang terukur menghasilkan **nol** konfabulasi diam-diam dalam ~300 probe pembacaan — pembacaan yang gagal akan abstain.

**Bagaimana dengan pekerjaan byte-exact (hash, ID, secret)?**
Giliran terbaru dan identifier eksak tetap berupa teks by design. Untuk beban kerja yang *seluruhnya* byte-exact, arahkan ke model yang tidak masuk allowlist (misalnya subagent pada model Claude lain) — apa pun di luar allowlist lewat begitu saja, byte-identik, tanpa disentuh.

**Bukankah DeepSeek-OCR sudah menyelesaikan pertanyaan apakah ini bekerja?**
Itu membuktikan *jalurnya* bekerja — dengan pasangan encoder/decoder yang dilatih khusus untuk tugas itu. Skeptisisme itu berasal dari masa ketika belum ada model produksi standar yang bisa membaca render padat; itu sudah berubah, dan [kartu skor model](../../../README.md#-the-numbers--measured-not-estimated) di atas menunjukkan persis siapa yang bisa membacanya hari ini, dengan bukti. [Harness benchmark](../../../benchmarks/README.md) menguji ulang model baru mana pun dalam satu perintah.

**Bisakah saya memakainya tanpa Claude Code — Cursor, ChatGPT, atau pipe biasa?**
Bisa, dengan dua cara. Sebagai **proxy**, ia bekerja dengan client apa pun yang memungkinkan Anda menyetel API base URL (`ANTHROPIC_BASE_URL`, atau OpenAI base URL) — Claude Code, skrip Anda sendiri, apa pun yang berbasis HTTP. Dan untuk tool yang tidak bisa mem-proxy, **Ekspor offline** di atas merender konteks menjadi halaman PNG yang Anda tempelkan secara manual — `omniglyph export --stdin` bahkan membaca langsung dari pipe Unix.

**Bagaimana sebenarnya ia mengubah teks menjadi gambar?**
Ia me-reflow teks dan melukisnya dengan atlas glyph 1-bit 5×8 piksel ke halaman PNG 1568×728 yang padat — satu bit per piksel, tanpa anti-aliasing, sehingga model menagih halaman berdasarkan dimensinya, bukan berdasarkan berapa banyak karakter di dalamnya. **Cara kerjanya** di atas memuat pipeline-nya; dokumen benchmark memuat geometri dan alasan kenapa lebih padat tidak selalu lebih murah.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Ucapan Terima Kasih

OmniGlyph berdiri di atas bahu satu proyek secara khusus — bagian ini adalah ucapan terima kasih permanen kami.

| Proyek | Bagaimana ia membentuk OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Penemuan yang menjadi fondasi seluruh proyek ini.** pxpipe membuktikan, dengan bukti, bahwa kanal visi LLM produksi dapat membawa konteks tekstual yang padat dengan sebagian kecil biaya token — dan bahwa konversi itu harus diputuskan per permintaan lewat matematika penagihan eksak, bukan lewat firasat. Rendering 1-bit yang padat, gate profitabilitas, counterfactual `count_tokens`, allowlist model fail-closed, dan budaya dokumentasi "ukur dulu sebelum klaim" semuanya dirintis di sana. OmniGlyph adalah turunan langsung dari codebase itu (MIT — baris hak cipta asli tetap ada di [LICENSE](../../../LICENSE) kami). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Keluarga font bitmap 5×8 tempat atlas glyph 1-bit padat kami berasal (lisensi di `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Cakupan untuk glyph di luar jangkauan Spleen dalam atlas yang sama (lisensi di `assets/`). |

Jika OmniGlyph berguna bagi Anda, beri bintang juga pada proyek upstream-nya — penemuan ini adalah milik mereka. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Lisensi

MIT — lihat [LICENSE](../../../LICENSE).
