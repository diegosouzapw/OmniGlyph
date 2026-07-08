🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — 將上下文渲染為圖像

### 透過將臃腫的上下文渲染為高密度 PNG 頁面,把你的 Claude 帳單削減 **59–70%**——同樣的內容,佔用的 token 卻只有原本的一小部分。

**模型對文字是按 token 數計費,但對圖像是按尺寸計費——與圖像裡裝了多少文字無關。**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

隸屬於 [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) 家族 · [🌐 所有語言](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| 指標 | 結果 | 憑證 |
|---|---|---|
| 端到端帳單降幅 | **59–70%** | 生產環境流量記錄,13,709 次請求 |
| 每個被轉換區塊的 token 數 | **減少 10 倍**(28,080 字元:14,040 → 1,460 token) | [billing sweep](benchmarks/billing-sweep/README.md) |
| 計費公式準確度 | 在 22 次 `count_tokens` 探測(2 個模型 × 2 檔位)中殘差為**零** | `benchmarks/billing-sweep/results/` |
| 生產配置下的精確讀取準確率 | Claude Fable 5 上 **30/30(100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| 約 300 次讀取探測中的靜默虛構次數 | **0**——每次失敗都以 `ILEGIVEL` 棄權 | `benchmarks/density-frontier/results/` |

**模型評分卡**(能否讀取高密度渲染圖?每組 n=30,確定性評分):

| 模型 | 閱讀準確率 | 結論 |
|---|---|---|
| Claude **Fable 5** | 精確匹配 **100%** | ✅ 生產環境目標模型 |
| Claude Opus 4.8 | 4 倍字形尺寸下 77–87% | ⚠️ 可選安全模式(節省比降至約 2 倍) |
| GPT-5.5 | 0/60——且嘗試時答案膨脹約 40 倍 | ❌ 被門控攔截,有實證 |
| Gemini 2.5-flash | 0/26——且用虛構代替棄權 | ❌ 被攔截(部分測試,受配額限制) |

這一優勢**目前僅限 Fable**——其他視覺編碼器尚無法解析高密度字形。[基準測試套件](benchmarks/README.md) 可用一條命令重新測試任何新模型。

# 🤔 Why OmniGlyph?

每一次長時間執行的智能體工作階段,都會在每次請求中拖著同樣的「死重」——系統提示詞、工具文件、舊的歷史記錄——每一輪都要按 token 重新計費。OmniGlyph 是一個**本地代理**,會在這些臃腫的部分*離開你的機器之前*,將其重寫為高密度的 PNG 頁面:

- **精確的計費數學,而非啟發式方法**——它會計算服務商真實的圖像 token 計費公式(測得殘差為零),只在數學上划算時才轉換。
- **失敗即關閉(fail-closed)的設計**——無法讀取高密度渲染圖的模型會被門控攔截,並附有基準測試憑證。不會有靜默的品質損失。
- **私密且本地優先**——重寫發生在 `127.0.0.1` 上;不會有額外內容被送往任何地方。
- **可重現**——上面的每一個數字都在 `benchmarks/*/results/` 中有對應憑證,可用一條命令重新執行。

# ⚡ Quick Start

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

兩種用法皆可:
- **API key**(按 token 付費):端到端帳單降低 59–70%。
- **訂閱工作階段**:不會少付費,但用量限額是按 token 計算的——所以你的額度能延展 **約 2–3 倍**。

儀表板位於 <http://127.0.0.1:47821/>:節省的 token 數、每一次文字→圖像轉換的並排比較、終止開關、即時模型標籤。回應照常串流輸出——只有*請求*被壓縮,模型的輸出從不受影響。

# ⚙️ How it works

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **在轉換之前精確計算計費**:Anthropic 按 `⌈w/28⌉ × ⌈h/28⌉ + 4` token 對每張圖像計費(28 像素分塊——測得殘差為零)。一整頁可承載 28,080 字元,只花費 1,460 token,約合 **19 字元/token**,而高密度文字約為 2 字元/token。門控只在數學上划算時才轉換。
- **會被轉換的內容**:靜態系統提示詞 + 工具文件、已折疊的舊歷史記錄、大型工具輸出。
- **絕不會被轉換的內容**:你的訊息、最近幾輪對話、模型的輸出、稀疏的散文文字、位元組精確的值(雜湊/ID 會以文字形式隨圖像一起傳輸),以及任何未通過閱讀基準測試的模型。

# 🧭 The honest part

- **這是有損的。** 從圖像中做到位元組精確的還原,本質上是不可靠的。已採取的緩解措施:精確識別碼以文字形式隨圖像一起傳輸,並且測得的生產配置產生了**零靜默虛構**——讀取失敗時會主動棄權。
- **目前只有 Fable 5 獲得批准**,且有實證。GPT-5.5 和 Gemini 2.5-flash 經測量確實無法讀取高密度渲染圖;Opus 4.8 需要 4 倍大小的字形。門控機制強制執行這一點。
- **我們發現並規避了一個計費陷阱**:高解析度圖像檔位每頁計費高出 3.3 倍,但視覺編碼器並未獲得額外的解析度——更大的頁面反而讀取*更差*。已測量,記錄於 [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md),未啟用。
- 價格會變動;持久有效的指標是 token 削減比例,代理會針對每次請求,相對於免費的 `count_tokens` 反事實基準記錄該比例。

# 🔬 Reproduce every number

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

完整方法論與所有結果表格見:[docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)。原始的逐條回答憑證:`benchmarks/*/results/*.jsonl`。

# 🚀 The OmniRoute family

OmniGlyph 同時也作為**原生壓縮引擎內建於 [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** 之中——那是一個免費的 AI 閘道。在其中它以 `omniglyph` 引擎的形式運作(可獨立單模式執行,也可與其他引擎疊加使用),具備失敗即關閉的門控機制與感知圖像的 token 核算。

# 🛠️ Tech Stack

| 層 | 技術 |
|---|---|
| 語言 | TypeScript(strict 模式)、ESM |
| 執行環境 | Node ≥18 · Cloudflare Workers(`wrangler.toml`) |
| 渲染 | 自研 1-bit 字形圖集(源自 Spleen/Unifont,授權資訊見 `assets/`)→ PNG |
| 測試 | Vitest——TDD,外加文件完整性與品牌重命名守護測試 |
| 基準測試 | `benchmarks/` 套件(billing-sweep、density-frontier),附帶 JSONL 憑證 |

## Project layout

| 路徑 | 內容 |
|---|---|
| `src/` | 代理本體:轉換流水線、按服務商精確計費、渲染器、宿主(Node + Cloudflare Workers) |
| `benchmarks/` | 產出上述所有數字的測試套件——可重新執行 |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & Community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) —— 缺陷與功能請求
- 🔒 [SECURITY.md](SECURITY.md) —— 漏洞報告
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) —— 嚴格 TDD + 先測量後聲明
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 License

MIT —— 見 [LICENSE](../../../LICENSE)。
