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

# 🔌 搭配 Claude 用戶端使用

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

# 🖥️ The dashboard

套件內建一個完整的本地儀表板——離線運作、單一檔案、零對外連線。共六個頁面,隨請求流動透過 SSE 即時更新:

![Overview:任務指揮中心風格的 KPI 卡片、節省趨勢圖與即時事件動態消息](../../assets/dashboard-overview.png)

- **Overview**——任務指揮中心:節省百分比、節省金額、延遲 p95、快取命中數、錯誤數、即時動態消息。
- **Live Flow**——以節點圖呈現的處理流程:client → gate → renderer / passthrough → API,每個真實請求對應一個粒子。
- **Telemetry**——token/$ 里程表與即時請求時間軸;點擊任一請求即可看到哪些部分變成了圖像,並讀取每一頁背後的原始文字。
- **Benchmarks**——從 `benchmarks/*/results/` 渲染出的測試套件憑證,每個 model·config 實驗一列,並且**可直接在介面中執行基準測試**:`$0` 的 dry-run 會即時串流其輸出;正式執行則需要你的 API key 加上明確的費用確認才會解鎖。
- **Sessions / History**——依節省 token 數排名的熱門工作階段,以及磁碟上的每一筆事件記錄。

| Live Flow | Benchmarks |
|---|---|
| ![以即時節點圖呈現的請求處理流程](../../assets/dashboard-flow.png) | ![基準測試憑證與介面內建的 dry-run](../../assets/dashboard-benchmarks.png) |

![Telemetry:里程表與即時請求時間軸](../../assets/dashboard-telemetry.png)

# ⚙️ How it works

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **在轉換之前精確計算計費**:Anthropic 按 `⌈w/28⌉ × ⌈h/28⌉ + 4` token 對每張圖像計費(28 像素分塊——測得殘差為零)。一整頁可承載 28,080 字元,只花費 1,460 token,約合 **19 字元/token**,而高密度文字約為 2 字元/token。門控只在數學上划算時才轉換。
- **會被轉換的內容**:靜態系統提示詞 + 工具文件、已折疊的舊歷史記錄、大型工具輸出。
- **絕不會被轉換的內容**:你的訊息、最近幾輪對話、模型的輸出、稀疏的散文文字、位元組精確的值(雜湊/ID 會以文字形式隨圖像一起傳輸),以及任何未通過閱讀基準測試的模型。

# 📚 Library use (no proxy)

代理程式在每次請求中所做的一切,也都是一套有文件記載、可直接匯入使用的 API:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render any text to dense 1-bit PNG pages
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Or run the full request transform yourself — gate, billing math and all
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // the raw /v1/messages JSON body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` 會將區塊固定為文字;`options.emitRecoverable` 會回傳已轉為圖像之區塊的原始內容。精確的計費數學也一併於套件根目錄提供(`anthropicImageTokens`、`resolveAnthropicVisionTier`、`openAIVisionTokens`)——這正是 [OmniRoute](https://github.com/diegosouzapw/OmniRoute) 所使用的部分。純 JS 執行環境(Node 與 edge/Workers 皆可)。完整介面請見:`src/core/index.ts`。

# 📤 離線匯出——免代理、免 Claude Code

沒有使用 Claude Code?在**本地**將上下文渲染為 PNG 頁面,再貼進 Cursor、ChatGPT,或任何接受圖像上傳的聊天工具。免代理、免 API key、不必串接任何帳號:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

你會得到一個資料夾,裡面備齊了所有要丟進聊天工具的東西:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` 會渲染你尚未提交的 diff,`--diff <ref>` 是一段提交範圍,`--open` 會顯示該資料夾(macOS)。這一切都在你的機器上執行——匯出流程永遠不會啟動代理,也永遠不會呼叫任何模型。執行 `omniglyph export --help` 可查看所有旗標。

# 🧭 The honest part

- **這是有損的。** 從圖像中做到位元組精確的還原,本質上是不可靠的。已採取的緩解措施:精確識別碼以文字形式隨圖像一起傳輸,並且測得的生產配置產生了**零靜默虛構**——讀取失敗時會主動棄權。
- **目前只有 Fable 5 獲得批准**,且有實證。GPT-5.5 和 Gemini 2.5-flash 經測量確實無法讀取高密度渲染圖;Opus 4.8 需要 4 倍大小的字形。門控機制強制執行這一點。
- **我們發現並規避了一個計費陷阱**:高解析度圖像檔位每頁計費高出 3.3 倍,但視覺編碼器並未獲得額外的解析度——更大的頁面反而讀取*更差*。已測量,記錄於 [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md),未啟用。
- 價格會變動;持久有效的指標是 token 削減比例,代理會針對每次請求,相對於免費的 `count_tokens` 反事實基準記錄該比例。

# 🧠 FAQ

**我在工作階段中途啟用它，用量暴增 — 為什麼？**
沒有 OmniGlyph 執行的工作階段，其整個前綴已被 Anthropic 以 0.1× 讀取費率快取為文字；第一個帶圖像的請求會在單一提示中把這一切作為 1.25× 的全新快取寫入重新付費。代理對此有防護：對於從未圖像化過的工作階段，會把這筆一次性成本計入損益平衡閘門，只有仍然划算時才切換到圖像 — 否則工作階段保持文字形式，節省從你的下一個新工作階段開始。

**59–70% 是端到端的數字,還是只計算它處理過的那部分請求?**
是端到端——整體帳單。大多數壓縮工具只針對自己處理過的那部分請求回報節省幅度,這會讓數字顯得比實際好看。我們的分母是*每一筆*請求:門控正確略過、未經處理的小請求、所有快取寫入與讀取,以及所有輸出 token(代理程式從不壓縮輸出)。「僅計算被壓縮部分」得出的數字會更高,會另外單獨引用,絕不作為主打數字。

**節省幅度是如何測量的?**
針對同一筆請求的兩側,在同一時刻測量。代理程式在每次 `/v1/messages` POST 請求中,會與真正的轉發並行,對原始未壓縮的請求本體發出一次免費的 `count_tokens` 探測(作為反事實基準),並從回應中讀取服務商實際計費的用量區塊——兩者會落在同一筆事件記錄裡。快取定價對兩側套用方式相同,因此快取折扣會相互抵銷,不會被重複計入「節省」之中。該公式定義於 `src/core/baseline.ts`;你也可以從自己的事件記錄重新推導。

**為什麼讀取失敗會是虛構,而不是讀取錯誤?**
因為模型的視覺能力並非 OCR:頁面會變成區塊嵌入(patch embeddings),而非離散字元,因此不存在逐字形的信心值可供大聲宣告失敗——當像素不足以確定某個字形時,語言先驗會用看似合理的內容填補空白。這正是 OmniGlyph 對此採取失敗即關閉策略的原因:位元組精確的值永遠以文字形式隨圖像一起傳輸,誤讀的模型會被門控攔截,而測得的生產配置在約 300 次讀取探測中產生了**零**次靜默虛構——讀取失敗時會主動棄權。

**位元組精確的工作(雜湊、ID、機密資訊)呢?**
最近幾輪對話與精確識別碼依設計保持為文字。對於*完全*要求位元組精確的工作負載,請將其路由到未列入允許清單的模型(例如另一個 Claude 模型上的子智能體)——任何不在允許清單內的內容都會原封不動、逐位元組地通過。

**DeepSeek-OCR 不是已經證明這行得通了嗎?**
它證明的是這個*通道*可行——但那是用專為此任務訓練的編碼器/解碼器配對做到的。當初的質疑源自於當時沒有任何現成的生產模型能讀取高密度渲染圖;如今情況已經改變,上方的[模型評分卡](../../../README.md#-the-numbers--measured-not-estimated)確切顯示了今天誰能讀取這些渲染圖,並附有實證。[基準測試套件](../../../benchmarks/README.md) 可用一條命令重新測試任何新模型——門控依據的是資料,而非炒作。

**不使用 Claude Code 也能用嗎——Cursor、ChatGPT、單純的管線?**
可以,有兩種方式。作為**代理**,它能搭配任何允許你設定 API base URL 的客戶端(`ANTHROPIC_BASE_URL`,或 OpenAI 的 base URL)——Claude Code、你自己的腳本,任何走 HTTP 的東西都行。而對於無法使用代理的工具,上方的**離線匯出**會把上下文渲染成 PNG 頁面,讓你手動貼上——`omniglyph export --stdin` 甚至能直接從 Unix 管線讀取。

**它究竟是怎麼把文字變成圖像的?**
它會重新排版文字,並用 1-bit 5×8 像素的字形圖集,將其繪製到高密度的 1568×728 PNG 頁面上——每像素一個位元、無反鋸齒,因此模型是按頁面的尺寸計費,而非取決於裡面裝了多少字元。上方的 **How it works** 說明了整條流水線;基準測試文件則說明了幾何原理,以及為何密度更高未必更省。

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Acknowledgments

OmniGlyph 的誕生,特別要歸功於一個專案——這一節是我們永久的致謝。

| 專案 | 對 OmniGlyph 的影響 |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **這整個專案賴以建立的發現。** pxpipe 以實證證明了,生產環境中 LLM 的視覺通道能以極低的 token 成本承載高密度的文字上下文——而且轉換與否必須依據精確的計費數學逐請求判斷,而非憑感覺。高密度的 1-bit 渲染、獲利門控、`count_tokens` 反事實基準、失敗即關閉的模型允許清單,以及「先測量、後聲明」的文件文化,都是在該專案中率先開創的。OmniGlyph 直接衍生自那個程式碼庫(MIT 授權——原始的著作權聲明保留在我們的 [LICENSE](../../../LICENSE) 中)。 |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | 我們高密度 1-bit 字形圖集所衍生自的 5×8 點陣字型家族(授權見 `assets/`)。 |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | 為同一圖集提供超出 Spleen 範圍的字形涵蓋(授權見 `assets/`)。 |

如果你覺得 OmniGlyph 有用,也去為上游專案加星——這項發現是他們的。🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 License

MIT —— 見 [LICENSE](../../../LICENSE)。
