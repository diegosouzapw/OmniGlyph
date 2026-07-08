# 基准测试

OmniGlyph 所声称的每一个数字,都来自下面两套测试套件之一——
可重新运行、尽可能确定性,并在 `*/results/*.jsonl` 中保留原始的逐条回答凭据。
综合分析见:[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)。

## 1. `billing-sweep/` —— 一张图像到底要花多少钱?

针对正式 Anthropic API 的免费 `count_tokens` 探测,在 11 种探针几何结构、
2 个模型 × 2 个分辨率档位上,比较已淘汰的 `w·h/750` 公式与当前的
28 px 分块模型。

**结果(2026-07-05):分块模型在每一个探针上的残差都为零**
——计费方式为按档位缩放后 `⌈w/28⌉ × ⌈h/28⌉`,外加每个图像区块固定的
+3/+4 token。生产环境的页面(1568×728)恰好花费 1,460 token,
承载 28,080 字符,约合 **19.2 字符/token**,而高密度文本约为
2 字符/token。

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` —— 模型真的能"读"出来吗?

跨渲染配置、页面几何结构、字形图集和服务商,对比成本(离线、精确)
× 阅读准确率(实时)。语料中植入了字节精确的字符串探针(十六进制 ID、
camelCase、连续数字),外加**根据已测量的字形混淆对构建的近似干扰项**——
因此静默虚构能够被检测出来,而不只是被计为答错。评分是确定性的
(不使用 LLM 评委):`correct` / `abstained`(诚实的 `ILEGIVEL`)/
`silent_wrong` / `no_answer`。

**核心结果**(每组 n=30):

| 测试组 | 精确读取数 | 备注 |
|---|---:|---|
| Fable 5 · 标准页面 · 1-bit 图集(生产配置) | **30/30** | 零错误,零虚构 |
| Fable 5 · 标准页面 · AA 图集(旧默认值) | 25/30 | 5 次诚实弃权——这正是生产环境切换到 1-bit 的原因 |
| Fable 5 · 高分辨率 1928² 页面 | 1–2/30 | 计费高 3.3 倍但被编码器重采样——这是计费陷阱,未启用 |
| Opus 4.8 · 10×16 字形 | 23–26/30 | 可选的安全模式 |
| GPT-5.5 · 768px 条带(两种图集) | 0/60 | 相较其自身文本对照组(30/30,62 token),输出 token 膨胀约 40 倍 |
| Gemini 2.5-flash(部分测试,受配额限制) | 0/26 | 用虚构代替弃权 |

三种传输方式:直连 API(`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`)、
OpenRouter(`OPENROUTER_API_KEY`),以及 `--via-cli`(Claude Code
订阅——$0)。一个来之不易的教训:中间层(OpenRouter、CLI 的 Read 工具)
会对大图像重采样;只有直连 API 的结果对可读性而言才具有权威性。

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

钉住纯函数部分的单元测试(语料、评分、成本公式):
`tests/billing-sweep-formulas.test.ts`、`tests/density-frontier.test.ts`、
`tests/anthropic-vision.test.ts`、`tests/gemini-profiles.test.ts`、
`tests/gpt-billing-audit.test.ts`。
