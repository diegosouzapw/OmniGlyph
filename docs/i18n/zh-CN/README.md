🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — 将上下文渲染为图像

### 通过将臃肿的上下文渲染为高密度 PNG 页面，把你的 Claude 账单削减 **59–70%** —— 同样的内容,占用的 token 却只有原来的一小部分。

**模型按 token 数对文本计费,但对图像是按尺寸计费——与图像里装了多少文字无关。**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

隶属于 [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) 家族 · [🌐 所有语言](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| 指标 | 结果 | 凭据 |
|---|---|---|
| 端到端账单降幅 | **59–70%** | 生产环境流量记录,13,709 次请求 |
| 每个被转换区块的 token 数 | **减少 10 倍**(28,080 字符:14,040 → 1,460 token) | [billing sweep](benchmarks/billing-sweep/README.md) |
| 计费公式准确度 | 在 22 次 `count_tokens` 探测(2 个模型 × 2 档位)中残差为**零** | `benchmarks/billing-sweep/results/` |
| 生产配置下的精确读取准确率 | Claude Fable 5 上 **30/30(100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| 约 300 次读取探测中的静默虚构次数 | **0**——每次失败都以 `ILEGIVEL` 弃权 | `benchmarks/density-frontier/results/` |

**模型评分卡**(能否读取高密度渲染图?每组 n=30,确定性评分):

| 模型 | 阅读准确率 | 结论 |
|---|---|---|
| Claude **Fable 5** | 精确匹配 **100%** | ✅ 生产环境目标模型 |
| Claude Opus 4.8 | 4 倍字形尺寸下 77–87% | ⚠️ 可选安全模式(节省比降至约 2 倍) |
| GPT-5.5 | 0/60——且尝试时答案膨胀约 40 倍 | ❌ 被门控拦截,有实证 |
| Gemini 2.5-flash | 0/26——且用虚构代替弃权 | ❌ 被拦截(部分测试,受配额限制) |

这一优势**目前仅限 Fable**——其他视觉编码器尚无法解析高密度字形。[基准测试套件](benchmarks/README.md) 可用一条命令重新测试任何新模型。

# 🤔 Why OmniGlyph?

每一次长时间运行的智能体会话,都会在每次请求中拖着同样的"死重"——系统提示词、工具文档、旧的历史记录——每一轮都要按 token 重新计费。OmniGlyph 是一个**本地代理**,会在这些臃肿的部分*离开你的机器之前*,将其重写为高密度的 PNG 页面:

- **精确的计费数学,而非启发式方法**——它会计算服务商真实的图像 token 计费公式(测得残差为零),只在数学上划算时才转换。
- **失败即关闭(fail-closed)的设计**——无法读取高密度渲染图的模型会被门控拦截,并附有基准测试凭据。不会有静默的质量损失。
- **私密且本地优先**——重写发生在 `127.0.0.1` 上;不会有额外内容被发送到任何地方。
- **可复现**——上面的每一个数字都在 `benchmarks/*/results/` 中有对应凭据,可用一条命令重新运行。

# ⚡ Quick Start

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

两种用法皆可:
- **API key**(按 token 付费):端到端账单降低 59–70%。
- **订阅会话**:不会少付费,但用量限额是按 token 计算的——所以你的额度能延展 **约 2–3 倍**。

仪表盘位于 <http://127.0.0.1:47821/>:节省的 token 数、每一次文本→图像转换的并排对比、终止开关、实时模型标签。响应照常流式输出——只有*请求*被压缩,模型的输出从不受影响。

# 🔌 配合 Claude 客户端使用

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

# 🖥️ 仪表盘

包内自带一套完整的本地仪表盘——离线运行、单文件、零外部请求。六个页面,随请求流转通过 SSE 实时更新:

![总览:任务控制台式的 KPI 卡片、节省趋势图和实时事件流](../../assets/dashboard-overview.png)

- **Overview**——任务控制台:节省百分比、节省的 $ 金额、延迟 p95、缓存命中、错误数、实时事件流。
- **Live Flow**——以节点图呈现的处理管线:client → gate → renderer / passthrough → API,每个真实请求对应一个粒子。
- **Telemetry**——token/$ 里程表与实时请求时间线;点击任意请求即可精确查看哪些部分变成了图像,并读取每一页背后的源文本。
- **Benchmarks**——从 `benchmarks/*/results/` 渲染出的基准测试凭据,每个 model·config 实验一行,并且**可以直接在界面中运行基准测试**:`$0` 的 dry-run 会实时流式输出;实时运行则需要你的 API key 加上明确的费用确认才会解锁。
- **Sessions / History**——按节省 token 数排序的热门会话,以及磁盘上的每一个事件。

| Live Flow | Benchmarks |
|---|---|
| ![以实时节点图呈现的请求处理管线](../../assets/dashboard-flow.png) | ![基准测试凭据与界面内的 dry-run](../../assets/dashboard-benchmarks.png) |

![Telemetry:里程表与实时请求时间线](../../assets/dashboard-telemetry.png)

# ⚙️ How it works

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **在转换之前精确计算计费**:Anthropic 按 `⌈w/28⌉ × ⌈h/28⌉ + 4` token 对每张图像计费(28 像素分块——测得残差为零)。一整页可承载 28,080 字符,只花费 1,460 token,约合 **19 字符/token**,而高密度文本约为 2 字符/token。门控只在数学上划算时才转换。
- **会被转换的内容**:静态系统提示词 + 工具文档、已折叠的旧历史记录、大型工具输出。
- **绝不会被转换的内容**:你的消息、最近几轮对话、模型的输出、稀疏的散文文本、字节精确的值(哈希/ID 会以文本形式随图像一起传输),以及任何未通过阅读基准测试的模型。

# 📚 Library use (no proxy)

代理对每个请求所做的一切,同样是一套有文档说明、可导入的 API:

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

`options.keepSharp(block)` 会将区块固定为文本;`options.emitRecoverable` 会返回被转成图像的区块的原始内容。精确的计费数学同样在包的根路径导出(`anthropicImageTokens`、`resolveAnthropicVisionTier`、`openAIVisionTokens`)——这正是 [OmniRoute](https://github.com/diegosouzapw/OmniRoute) 所依赖的。纯 JS 运行时(Node 与 edge/Workers 皆可)。完整接口见:`src/core/index.ts`。

# 📤 离线导出 — 无需代理,无需 Claude Code

不使用 Claude Code?在**本地**把上下文渲染为 PNG 页面,然后粘贴到 Cursor、ChatGPT,或任何接受图像上传的聊天工具中。无需代理、无需 API key、无需接入任何账户:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

你会得到一个文件夹,里面装着丢进聊天工具所需的一切:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` 渲染你尚未提交的改动,`--diff <ref>` 渲染某个提交范围,`--open` 显示该文件夹(macOS)。这一切都在你的机器上运行——导出流程从不启动代理,也从不调用任何模型。运行 `omniglyph export --help` 查看全部参数。

# 🧭 The honest part

- **这是有损的。** 从图像中做到字节精确的还原,本质上是不可靠的。已采取的缓解措施:精确标识符以文本形式随图像一起传输,并且测得的生产配置产生了**零静默虚构**——读取失败时会主动弃权。
- **目前只有 Fable 5 获得批准**,且有实证。GPT-5.5 和 Gemini 2.5-flash 经测量确实无法读取高密度渲染图;Opus 4.8 需要 4 倍大小的字形。门控机制强制执行这一点。
- **我们发现并规避了一个计费陷阱**:高分辨率图像档位每页计费高出 3.3 倍,但视觉编码器并未获得额外的分辨率——更大的页面反而读取*更差*。已测量,记录于 [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md),未启用。
- 价格会变动;持久有效的指标是 token 削减比例,代理会针对每次请求,相对于免费的 `count_tokens` 反事实基准记录该比例。

# 🧠 FAQ

**我在会话中途启用它，用量猛增 — 为什么？**
没有 OmniGlyph 运行的会话，其整个前缀已被 Anthropic 以 0.1× 读取费率缓存为文本；第一条带图像的请求会在单个提示中把这一切作为 1.25× 的全新缓存写入重新付费。代理对此有防护：对于从未图像化过的会话，会把这笔一次性成本计入盈亏平衡门控，只有仍然划算时才切换到图像 — 否则会话保持文本形式，节省从你的下一个新会话开始。

**59–70% 是端到端的,还是只统计被处理过的请求?**
是端到端的——整份账单。多数压缩工具只统计自己处理过的那一部分请求的节省量,这样数字会显得更好看。我们的分母是*每一个*请求:那些被门控正确地保持原样的小请求、全部的缓存写入与读取,以及全部的输出 token(代理从不压缩输出)。仅统计被压缩部分的节省比例会更高,会单独列出,但绝不作为主要数字。

**节省量是怎么测量的?**
同一个请求的两侧,在同一时刻测量。每次 `/v1/messages` POST 请求,代理都会对原始未压缩的请求体发起一次免费的 `count_tokens` 探测(作为反事实基准),与真实的转发请求并行进行,并从响应中读取服务商实际计费的 usage 区块——两者落在同一条事件记录里。缓存计费对两侧采用完全相同的规则,因此缓存折扣会相互抵消,不会被重复计入"节省量"。计算公式在 `src/core/baseline.ts` 中;你可以从自己的事件日志中重新推导。

**为什么读取失误会是"虚构",而不是普通的读取错误?**
因为模型视觉并非 OCR:页面会变成分块(patch)嵌入向量,而非离散字符,所以不存在可以"大声报错"的逐字形置信度——当像素不足以确定某个字形时,语言模型的先验知识会用看似合理的内容去填补空白。正是这个机制,让 OmniGlyph 对此采取失败即关闭的策略:字节精确的值始终以文本形式随图像一起传输,读取有误的模型会被门控拦截,而测得的生产配置在约 300 次读取探测中产生了**零**次静默虚构——读取失败时会主动弃权。

**字节精确的内容(哈希、ID、密钥)怎么处理?**
最近几轮对话和精确标识符按设计始终保持为文本。对于*全部*都要求字节精确的工作负载,可以把它们路由到不在允许列表内的模型(例如另一个 Claude 模型上的子智能体)——任何不在允许列表内的模型都会原样透传,字节级不变。

**DeepSeek-OCR 不是已经证明这条路可行了吗?**
它证明的是这条*通道*可行——使用的是专门为此训练的编码器/解码器组合。当初的质疑,是基于"没有任何一个现成的生产模型能读取高密度渲染图"这一事实;而这一点已经改变,上文的[模型评分卡](../../../README.md#-the-numbers--measured-not-estimated)清楚展示了如今究竟是哪些模型能读取它们,并附有实证。[基准测试套件](../../../benchmarks/README.md)可以用一条命令重新测试任何新模型——门控只跟随数据,不跟随炒作。

**不用 Claude Code 也能用吗——Cursor、ChatGPT,或者一条普通的管道?**
可以,有两种方式。作为**代理**,它适用于任何允许你设置 API 基础 URL 的客户端(`ANTHROPIC_BASE_URL`,或 OpenAI 的基础 URL)——Claude Code、你自己的脚本,任何基于 HTTP 的客户端都行。而对于无法走代理的工具,上面的**离线导出**会把上下文渲染为 PNG 页面,由你手动粘贴——`omniglyph export --stdin` 甚至能直接从 Unix 管道读取。

**它究竟是怎么把文本变成图像的?**
它会重排文本,并用一套 1-bit 5×8 像素字形图集把文本绘制到高密度的 1568×728 PNG 页面上——每个像素 1 比特,不做抗锯齿,因此模型是按页面的尺寸计费,而不是按里面装了多少字符。上面的 **How it works** 介绍了整条流水线;基准测试文档则给出了几何细节,以及为什么密度更高并不总是更便宜。

# 🔬 Reproduce every number

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

完整方法论与所有结果表格见:[docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)。原始的逐条回答凭据:`benchmarks/*/results/*.jsonl`。

# 🚀 The OmniRoute family

OmniGlyph 同时也作为**原生压缩引擎内置于 [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** 中——那是一个免费的 AI 网关。在其中它以 `omniglyph` 引擎的形式运行(可独立单模式运行,也可与其他引擎叠加使用),具备失败即关闭的门控机制和感知图像的 token 核算。

# 🛠️ Tech Stack

| 层 | 技术 |
|---|---|
| 语言 | TypeScript(strict 模式)、ESM |
| 运行时 | Node ≥18 · Cloudflare Workers(`wrangler.toml`) |
| 渲染 | 自研 1-bit 字形图集(源自 Spleen/Unifont,授权信息见 `assets/`)→ PNG |
| 测试 | Vitest——TDD,外加文档完整性与品牌重命名守护测试 |
| 基准测试 | `benchmarks/` 套件(billing-sweep、density-frontier),附带 JSONL 凭据 |

## Project layout

| 路径 | 内容 |
|---|---|
| `src/` | 代理本体:转换流水线、按服务商精确计费、渲染器、宿主(Node + Cloudflare Workers) |
| `benchmarks/` | 产出上述所有数字的测试套件——可重新运行 |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & Community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) —— 缺陷与功能请求
- 🔒 [SECURITY.md](SECURITY.md) —— 漏洞报告
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) —— 严格 TDD + 先测量后声明
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 Acknowledgments

OmniGlyph 站在了一个项目的肩膀之上——本节是我们永久的致谢。

| 项目 | 对 OmniGlyph 的影响 |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **整个项目所依赖的那个发现。** pxpipe 用实证证明了:生产环境 LLM 的视觉通道能够以远低于常规的 token 成本承载高密度的文本上下文——而且是否转换必须基于精确的计费数学,逐请求判断,绝不能凭感觉。高密度 1-bit 渲染、盈利性门控、`count_tokens` 反事实基准、失败即关闭的模型允许列表,以及"先测量、后声明"的文档文化,全都源自那里率先探索。OmniGlyph 直接衍生自那个代码库(MIT 协议——原始版权声明保留在我们的 [LICENSE](../../../LICENSE) 中)。 |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | 我们高密度 1-bit 字形图集所派生自的 5×8 位图字体家族(授权信息见 `assets/`)。 |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | 在同一图集中,为超出 Spleen 覆盖范围的字形提供补充(授权信息见 `assets/`)。 |

如果你觉得 OmniGlyph 有用,也请给上游项目点一个 star——这个发现是他们的。🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 License

MIT —— 见 [LICENSE](../../../LICENSE)。
