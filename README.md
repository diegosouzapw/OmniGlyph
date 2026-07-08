<div align="center">

<img src="./docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Context as Image

### Cut your Claude bill by **59–70%** by rendering bulky context as dense PNG pages — the same content, in a fraction of the tokens.

**Models bill text per token, but bill an image by its dimensions — not by how much text is inside it.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](package.json)

Part of the [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) family · [🌐 All languages](docs/i18n/README.md)

<table>
  <tr>
    <td align="center"><a href="README.md">🇺🇸</a></td>
    <td align="center"><a href="docs/i18n/ar/README.md">🇸🇦</a></td>
    <td align="center"><a href="docs/i18n/az/README.md">🇦🇿</a></td>
    <td align="center"><a href="docs/i18n/bg/README.md">🇧🇬</a></td>
    <td align="center"><a href="docs/i18n/bn/README.md">🇧🇩</a></td>
    <td align="center"><a href="docs/i18n/cs/README.md">🇨🇿</a></td>
    <td align="center"><a href="docs/i18n/da/README.md">🇩🇰</a></td>
    <td align="center"><a href="docs/i18n/de/README.md">🇩🇪</a></td>
    <td align="center"><a href="docs/i18n/es/README.md">🇪🇸</a></td>
    <td align="center"><a href="docs/i18n/fa/README.md">🇮🇷</a></td>
    <td align="center"><a href="docs/i18n/fi/README.md">🇫🇮</a></td>
    <td align="center"><a href="docs/i18n/fr/README.md">🇫🇷</a></td>
    <td align="center"><a href="docs/i18n/gu/README.md">🇮🇳</a></td>
    <td align="center"><a href="docs/i18n/he/README.md">🇮🇱</a></td>
  </tr>
  <tr>
    <td align="center"><a href="docs/i18n/hi/README.md">🇮🇳</a></td>
    <td align="center"><a href="docs/i18n/hu/README.md">🇭🇺</a></td>
    <td align="center"><a href="docs/i18n/id/README.md">🇮🇩</a></td>
    <td align="center"><a href="docs/i18n/it/README.md">🇮🇹</a></td>
    <td align="center"><a href="docs/i18n/ja/README.md">🇯🇵</a></td>
    <td align="center"><a href="docs/i18n/ko/README.md">🇰🇷</a></td>
    <td align="center"><a href="docs/i18n/mr/README.md">🇮🇳</a></td>
    <td align="center"><a href="docs/i18n/ms/README.md">🇲🇾</a></td>
    <td align="center"><a href="docs/i18n/nl/README.md">🇳🇱</a></td>
    <td align="center"><a href="docs/i18n/no/README.md">🇳🇴</a></td>
    <td align="center"><a href="docs/i18n/phi/README.md">🇵🇭</a></td>
    <td align="center"><a href="docs/i18n/pl/README.md">🇵🇱</a></td>
    <td align="center"><a href="docs/i18n/pt/README.md">🇵🇹</a></td>
    <td align="center"><a href="docs/i18n/pt-BR/README.md">🇧🇷</a></td>
  </tr>
  <tr>
    <td align="center"><a href="docs/i18n/ro/README.md">🇷🇴</a></td>
    <td align="center"><a href="docs/i18n/ru/README.md">🇷🇺</a></td>
    <td align="center"><a href="docs/i18n/sk/README.md">🇸🇰</a></td>
    <td align="center"><a href="docs/i18n/sv/README.md">🇸🇪</a></td>
    <td align="center"><a href="docs/i18n/sw/README.md">🇰🇪</a></td>
    <td align="center"><a href="docs/i18n/ta/README.md">🇮🇳</a></td>
    <td align="center"><a href="docs/i18n/te/README.md">🇮🇳</a></td>
    <td align="center"><a href="docs/i18n/th/README.md">🇹🇭</a></td>
    <td align="center"><a href="docs/i18n/tr/README.md">🇹🇷</a></td>
    <td align="center"><a href="docs/i18n/uk-UA/README.md">🇺🇦</a></td>
    <td align="center"><a href="docs/i18n/ur/README.md">🇵🇰</a></td>
    <td align="center"><a href="docs/i18n/vi/README.md">🇻🇳</a></td>
    <td align="center"><a href="docs/i18n/zh-CN/README.md">🇨🇳</a></td>
    <td align="center"><a href="docs/i18n/zh-TW/README.md">🇹🇼</a></td>
  </tr>
</table>

</div>

---

# 📊 The numbers — measured, not estimated

| metric | result | receipt |
|---|---|---|
| End-to-end bill reduction | **59–70%** | production trace, 13,709 requests |
| Tokens per converted block | **10× fewer** (28,080 chars: 14,040 → 1,460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Billing-formula accuracy | residual **zero** across 22 `count_tokens` probes, 2 models × 2 tiers | `benchmarks/billing-sweep/results/` |
| Exact-read accuracy, production config | **30/30 (100%)** on Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Silent confabulations in ~300 read probes | **0** — every miss abstains as `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Model scorecard** (can it read dense renders? n=30 per arm, deterministic scoring):

| model | reading | verdict |
|---|---|---|
| Claude **Fable 5** | **100%** exact | ✅ production target |
| Claude Opus 4.8 | 77–87% at 4× glyph size | ⚠️ opt-in safe mode (savings drop to ~2×) |
| GPT-5.5 | 0/60 — and inflates its answers ~40× trying | ❌ blocked by the gate, with proof |
| Gemini 2.5-flash | 0/26 — and confabulates instead of abstaining | ❌ blocked (partial test, quota-limited) |

The advantage is **Fable-specific today** — other vision encoders don't resolve dense glyphs yet. The [benchmark harness](benchmarks/README.md) re-tests any new model in one command.

# 🤔 Why OmniGlyph?

Every long-running agent session drags the same dead weight on every request: the system prompt, tool docs, and old history — re-billed per token, every turn. OmniGlyph is a **local proxy** that rewrites those bulky parts into dense PNG pages *before they leave your machine*:

- **Exact billing math, not heuristics** — it computes the provider's real image-token formula (measured to residual zero) and converts only when the math wins.
- **Fail-closed by design** — models that can't read dense renders are blocked by a gate, with benchmark receipts. No silent quality loss.
- **Private & local-first** — the rewrite happens on `127.0.0.1`; nothing extra is sent anywhere.
- **Reproducible** — every number above has a receipt in `benchmarks/*/results/`, re-runnable in one command.

# ⚡ Quick Start

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](docs/assets/demo-quickstart.gif)

Works both ways:
- **API key** (pay per token): your bill drops 59–70% end-to-end.
- **Subscription session**: you don't pay less, but usage limits are counted in tokens — so your limits stretch **~2–3×**.

Dashboard at <http://127.0.0.1:47821/>: tokens saved, every text→image conversion side by side, kill switch, live model chips. Responses stream normally — only the *request* is compressed, never the model's output.

# ⚙️ How it works

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **Billing is computed exactly, before converting**: Anthropic bills `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens per image (28 px patches — measured to residual zero). A full page carries 28,080 chars for 1,460 tokens ≈ **19 chars/token**, vs ~2 chars/token for dense text. The gate converts only when the math wins.
- **What converts**: the static system prompt + tool docs, old collapsed history, large tool outputs.
- **What never converts**: your messages, recent turns, the model's output, sparse prose, byte-exact values (hashes/IDs ride alongside as text), and any model that failed the reading benchmark.

# 🧭 The honest part

- **It is lossy.** Byte-exact recall from images is unreliable by nature. Mitigations shipped: exact identifiers travel as text next to the image, and the measured production config produced **zero silent confabulations** — failed reads abstain.
- **Only Fable 5 is approved today**, with receipts. GPT-5.5 and Gemini 2.5-flash measurably cannot read dense renders; Opus 4.8 needs 4× bigger glyphs. The gate enforces this.
- **We found and avoided a billing trap**: the high-resolution image tier bills 3.3× more per page, but the vision encoder doesn't receive the extra resolution — bigger pages read *worse*. Measured, documented in [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), not enabled.
- Prices change; the durable metric is the token cut, which the proxy logs per request against a free `count_tokens` counterfactual.

# 🔬 Reproduce every number

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](docs/assets/demo-benchmarks.gif)

Full methodology and every result table: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Raw per-answer receipts: `benchmarks/*/results/*.jsonl`.

# 🚀 The OmniRoute family

OmniGlyph also ships as a **native compression engine inside [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — the free AI gateway. There it runs as the `omniglyph` engine (standalone single mode or stacked with the other engines), with fail-closed gates and image-aware token accounting.

# 🛠️ Tech Stack

| layer | tech |
|---|---|
| Language | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | own 1-bit glyph atlas (Spleen/Unifont-derived, licenses in `assets/`) → PNG |
| Tests | Vitest — TDD, plus docs-integrity and rebrand guards |
| Benchmarks | `benchmarks/` harnesses (billing-sweep, density-frontier) with JSONL receipts |

## Project layout

| path | what |
|---|---|
| `src/` | the proxy: transform pipeline, exact billing per provider, renderer, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | the harnesses that produced every number above — re-runnable |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & Community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugs and feature requests
- 🔒 [SECURITY.md](SECURITY.md) — vulnerability reports
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — strict TDD + measurement-before-claims
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 License

MIT — see [LICENSE](LICENSE).
