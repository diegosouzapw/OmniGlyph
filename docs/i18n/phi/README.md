🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="Isang tunay na render: system prompt + dokumentasyon ng tool na naka-pack sa isang siksik na pahinang 1568×728" width="820"/>

<br/>

# 🖼️ OmniGlyph — Konteksto Bilang Larawan

### Bawasan ang iyong bayarin sa Claude ng **59–70%** sa pamamagitan ng pag-render ng malalaking konteksto bilang siksik na PNG pages — parehong nilalaman, sa isang maliit na bahagi ng mga token.

**Ang mga modelo ay sumisingil ng text kada token, ngunit sumisingil ng imahe base sa mga sukat nito — hindi kung gaano karaming text ang nakapaloob dito.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-ang-mga-numero--sinukat-hindi-tinantiya)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-ang-tapat-na-bahagi)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Bahagi ng pamilyang [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Lahat ng wika](../../../docs/i18n/README.md)

</div>

---

# 📊 Ang mga numero — sinukat, hindi tinantiya

| sukatan | resulta | resibo |
|---|---|---|
| Pagbawas ng bayarin end-to-end | **59–70%** | production trace, 13,709 requests |
| Mga token kada na-convert na block | **10× mas kaunti** (28,080 chars: 14,040 → 1,460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Katumpakan ng formula ng billing | residual na **zero** sa 22 `count_tokens` probes, 2 modelo × 2 tier | `benchmarks/billing-sweep/results/` |
| Katumpakan ng eksaktong pagbasa, production config | **30/30 (100%)** sa Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Tahimik na confabulations sa ~300 read probes | **0** — bawat kabiguan ay umaatras bilang `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Scorecard ng modelo** (kaya bang basahin ang siksik na render? n=30 kada arm, deterministic scoring):

| modelo | pagbasa | hatol |
|---|---|---|
| Claude **Fable 5** | **100%** eksakto | ✅ target para sa production |
| Claude Opus 4.8 | 77–87% sa 4× na sukat ng glyph | ⚠️ opt-in safe mode (bumababa ang savings sa ~2×) |
| GPT-5.5 | 0/60 — at pinapalaki ang mga sagot nito ng ~40× habang sinusubukan | ❌ hinarangan ng gate, na may patunay |
| Gemini 2.5-flash | 0/26 — at nagko-confabulate sa halip na umatras | ❌ hinarangan (bahagyang test, limitado ng quota) |

Ang bentahe ay **partikular kay Fable sa ngayon** — hindi pa nareresolba ng ibang vision encoder ang siksik na glyph. Muling sinusubok ng [benchmark harness](benchmarks/README.md) ang anumang bagong modelo sa isang command lamang.

# 🤔 Bakit OmniGlyph?

Bawat mahabang sesyon ng agent ay nagdadala ng parehong bigat sa bawat request: ang system prompt, dokumentasyon ng tool, at lumang history — sinisingil muli kada token, sa bawat turn. Ang OmniGlyph ay isang **lokal na proxy** na nagsusulat-muli ng mga malalaking bahaging ito bilang siksik na PNG pages *bago pa man ito umalis sa iyong makina*:

- **Eksaktong matematika ng billing, hindi heuristics** — kinukuwenta nito ang tunay na formula ng image-token ng provider (sinukat hanggang residual zero) at nagko-convert lamang kapag mananalo ang matematika.
- **Fail-closed bilang disenyo** — ang mga modelong hindi makabasa ng siksik na render ay hinaharangan ng isang gate, na may benchmark receipts. Walang tahimik na pagkawala ng kalidad.
- **Pribado at local-first** — nangyayari ang muling pagsulat sa `127.0.0.1`; walang karagdagang ipinapadala kahit saan.
- **Nauulit** — bawat numero sa itaas ay may resibo sa `benchmarks/*/results/`, na maaaring paulit-ulit na patakbuhin sa isang command.

# ⚡ Mabilisang Simula

```bash
npx omniglyph                                     # proxy sa 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # ituro ang Claude Code dito
```

![Mabilisang simula: simulan ang proxy, tingnan ang dashboard, ituro ang Claude Code dito](../../../docs/assets/demo-quickstart.gif)

Gumagana sa magkabilang paraan:
- **API key** (bayad kada token): bumababa ang iyong bayarin ng 59–70% end-to-end.
- **Subscription session**: hindi ka bumababa ng bayad, ngunit ang usage limits ay binibilang sa tokens — kaya ang iyong mga limitasyon ay umaabot ng **~2–3×** pa.

Dashboard sa <http://127.0.0.1:47821/>: mga natipid na token, bawat text→image conversion nang magkatabi, kill switch, live na model chips. Normal na dumadaloy (stream) ang mga tugon — ang *request* lamang ang nakompress, hindi kailanman ang output ng modelo.

# ⚙️ Paano ito gumagana

```
malaking request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (eksaktong matematika ng billing)     ──► 1568×728 PNG pages ──► ibalik ang splice, cache-friendly
```

- **Kinukuwenta ang billing nang eksakto, bago mag-convert**: sinisingil ng Anthropic ang `⌈w/28⌉ × ⌈h/28⌉ + 4` na token kada imahe (28 px na patches — sinukat hanggang residual zero). Ang isang buong pahina ay may 28,080 chars para sa 1,460 tokens ≈ **19 chars/token**, kumpara sa ~2 chars/token para sa siksik na text. Nagko-convert lamang ang gate kapag mananalo ang matematika.
- **Ano ang nako-convert**: ang static na system prompt + dokumentasyon ng tool, lumang naka-collapse na history, malalaking output ng tool.
- **Ano ang hindi kailanman nako-convert**: ang iyong mga mensahe, kamakailang turns, ang output ng modelo, kalat-kalat na prosa, byte-exact na mga value (ang mga hash/ID ay sumasakay bilang text sa tabi), at anumang modelong bumagsak sa reading benchmark.

# 🧭 Ang tapat na bahagi

- **Lossy ito.** Hindi maaasahan sa likas na katangian ang byte-exact na recall mula sa mga imahe. Mga mitigasyong ipinatupad: ang eksaktong mga identifier ay sumasakay bilang text sa tabi ng imahe, at ang sinukat na production config ay walang naging **tahimik na confabulations** — ang mga nabigong pagbasa ay umaatras.
- **Fable 5 lamang ang aprubado sa ngayon**, na may mga resibo. Sinukat na hindi makabasa ng siksik na render ang GPT-5.5 at Gemini 2.5-flash; kailangan ng Opus 4.8 ng 4× mas malaking glyph. Pinapatupad ito ng gate.
- **Natuklasan at naiwasan namin ang isang bitag sa billing**: ang high-resolution na image tier ay sumisingil ng 3.3× pa kada pahina, ngunit hindi natatanggap ng vision encoder ang karagdagang resolution — mas *masama* ang pagbasa sa mas malalaking pahina. Sinukat, dokumentado sa [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), hindi pinagana.
- Nagbabago ang mga presyo; ang matibay na sukatan ay ang pagbawas ng token, na itinatala ng proxy kada request laban sa isang libreng `count_tokens` na counterfactual.

# 🔬 Ulitin ang bawat numero

```bash
pnpm install && pnpm test                                     # buong suite
node benchmarks/billing-sweep/run.mjs --dry-run               # mga prediksyon ng billing, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # talahanayan ng gastos, $0
# na may keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (o --via-cli para sa subscription ng Claude Code)
```

![Ang dalawang benchmark harness na tumatakbo sa dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Buong metodolohiya at bawat talahanayan ng resulta: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Hilaw na resibo kada sagot: `benchmarks/*/results/*.jsonl`.

# 🚀 Ang pamilyang OmniRoute

Ang OmniGlyph ay ipinapadala rin bilang isang **native na compression engine sa loob ng [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — ang libreng AI gateway. Doon, tumatakbo ito bilang ang `omniglyph` engine (standalone single mode o naka-stack kasama ang ibang engines), na may fail-closed gates at image-aware na pagbibilang ng token.

# 🛠️ Tech Stack

| layer | tech |
|---|---|
| Wika | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | sariling 1-bit glyph atlas (hinango mula sa Spleen/Unifont, mga lisensya sa `assets/`) → PNG |
| Tests | Vitest — TDD, kasama ang docs-integrity at rebrand guards |
| Benchmarks | mga harness sa `benchmarks/` (billing-sweep, density-frontier) na may JSONL receipts |

## Istraktura ng proyekto

| path | ano ito |
|---|---|
| `src/` | ang proxy: transform pipeline, eksaktong billing kada provider, renderer, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | ang mga harness na gumawa ng bawat numero sa itaas — maaaring paulit-ulit na patakbuhin |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Suporta at Komunidad

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — mga bug at request para sa feature
- 🔒 [SECURITY.md](SECURITY.md) — mga ulat ng vulnerability
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — mahigpit na TDD + pagsukat bago mag-claim
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Lisensya

MIT — tingnan ang [LICENSE](../../../LICENSE).
