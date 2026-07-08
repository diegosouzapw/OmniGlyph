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

# ⚙️ How it works

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **在转换之前精确计算计费**:Anthropic 按 `⌈w/28⌉ × ⌈h/28⌉ + 4` token 对每张图像计费(28 像素分块——测得残差为零)。一整页可承载 28,080 字符,只花费 1,460 token,约合 **19 字符/token**,而高密度文本约为 2 字符/token。门控只在数学上划算时才转换。
- **会被转换的内容**:静态系统提示词 + 工具文档、已折叠的旧历史记录、大型工具输出。
- **绝不会被转换的内容**:你的消息、最近几轮对话、模型的输出、稀疏的散文文本、字节精确的值(哈希/ID 会以文本形式随图像一起传输),以及任何未通过阅读基准测试的模型。

# 🧭 The honest part

- **这是有损的。** 从图像中做到字节精确的还原,本质上是不可靠的。已采取的缓解措施:精确标识符以文本形式随图像一起传输,并且测得的生产配置产生了**零静默虚构**——读取失败时会主动弃权。
- **目前只有 Fable 5 获得批准**,且有实证。GPT-5.5 和 Gemini 2.5-flash 经测量确实无法读取高密度渲染图;Opus 4.8 需要 4 倍大小的字形。门控机制强制执行这一点。
- **我们发现并规避了一个计费陷阱**:高分辨率图像档位每页计费高出 3.3 倍,但视觉编码器并未获得额外的分辨率——更大的页面反而读取*更差*。已测量,记录于 [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md),未启用。
- 价格会变动;持久有效的指标是 token 削减比例,代理会针对每次请求,相对于免费的 `count_tokens` 反事实基准记录该比例。

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

## 📄 License

MIT —— 见 [LICENSE](../../../LICENSE)。
