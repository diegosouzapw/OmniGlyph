# density-frontier —— 每种分辨率下的成本 × 准确率

用于测量文本→图像渲染在**成本与可读性之间的帕累托前沿**的测试套件,
按服务商(Anthropic / OpenAI / Gemini)、页面几何结构、字形单元格
和图集风格划分。

核心的不对称性在于:自计费扫描测试(2026-07-05,
`benchmarks/billing-sweep/`)以来,**成本已可离线精确预测**——
Anthropic 上是 28 px 分块 + 每块 4 token(`src/core/anthropic-vision.ts`),
OpenAI 上是分块/瓦片档案(`src/core/openai.ts`),Gemini 上是
瓦片/media_resolution(`gemini-cost.ts`)。只有**阅读准确率**
仍需依赖 API。

## 设计

- **语料**(`corpus.ts`):高密度的日志/JSON 风格填充内容,加上从混淆矩阵
  判定会失败的类别中植入的探针(12 字符十六进制、camelCase、6/8/5/3
  位数字)+ **根据已测量的混淆字形对构建的近似干扰项**。若模型给出的答案
  正好是干扰项,说明这次混淆是*被预测到的*——这正是要检测的静默失败模式,
  而不只是简单地计为答错。是确定性的(mulberry32)。
- **配置**(`configs.ts`):精心挑选的网格——标准 1568×728 页面 vs
  高分辨率 1928×1928(用于裁定按档位区分几何结构的 A/B 测试)、
  AA vs 1-bit(用于解决高密度渲染中的矛盾)、7×10/10×16 单元格
  (Opus 安全模式)、GPT 条带,以及两个 Gemini 猜想(≤384² = 固定
  258;`media_resolution: low` = 固定 280 → *若可读*则约 116
  字符/token)。
- **评分**(`score.ts`):确定性精确匹配,不使用 LLM 评委。三种结果:
  `correct` / `abstained`(ILEGIVEL 哨兵——诚实的失败)/
  `silent_wrong`(危险的那种),并带有干扰项标记。

## 运行方式

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

指定配置:`--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`。
回答会存入 `results/*.jsonl`(每个问题一行,附带原始回答以便审计)。

## 验收标准(继承自上游 PR #35/#36)

只有满足以下条件,某个配置才能成为生产环境默认值:**内容概要与文本
基线一致** 且 **零静默的精确字符串错误** 且 **净节省为正**。
首个必须运行的测试是在 Fable 上对比 `anthropic-std-5x8-aa` 与
`anthropic-hires-5x8-aa`——这是在启用高分辨率档位之前,对大页面
可读性做的抽查。

## `--via-omniroute` —— 经由 OmniRoute 的端到端测试(P3:非降质证明)

上面的传输方式都是在测试套件**内部**把文本渲染为 PNG,然后发送图像。
`--via-omniroute` 则相反,走的是生产路径:它将**稠密文本**发送给
正在运行的 OmniRoute 实例,让 **`omniglyph` 引擎负责渲染**页面
并转发给 Anthropic,然后测量读取结果与节省效果。如果读取结果与
直连路径保持一致,**并且** OmniRoute 报告了压缩效果,就证明了
OmniRoute 的渲染+转发流程**不会造成降质**。

前置条件(操作层面):

1. **OmniRoute 正在运行**(`npm run dev`,默认地址
   `http://localhost:20128`)。
2. 在 OmniRoute 中配置了带**真实密钥**的 **Anthropic 服务商**
   (直连路由——`providerTransport==='direct'` 门控只对 `anthropic`
   服务商放行)。
3. 在 OmniRoute 的压缩配置中**启用了 `omniglyph` 引擎**
   (`config.engines.omniglyph.enabled = true`)——只有引擎开启后,
   `engine:omniglyph` 请求头才会出现。(该引擎为
   `stable:false`/预览状态;需显式启用。)
4. 在 `OMNIROUTE_API_KEY` 中设置了 **OmniRoute API 密钥**
   (客户端用于向 OmniRoute 认证的密钥,而非 Anthropic 的密钥)。

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

每条回答都会在 JSONL 中记录
`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(来自 `X-OmniRoute-Compression` 响应头);结果表格的每一行显示有多少条
回答带回了压缩信息,以及节省比例的中位数。**P3 验收标准**:与直连路径
相同的逐字/内容概要命中率(非降质)**且**非空的 `omnirouteSavings`
(证明确实发生了渲染,而不是读取了原始文本)。如果出现
`did NOT compress`,说明该引擎在 OmniRoute 中未启用
(或请求体未通过失败即关闭的门控)。

针对纯函数部分的测试:`tests/density-frontier.test.ts`
(包含来自 via-omniroute 传输方式的 `buildOmnirouteRequest` 和
`parseCompressionSavings`)。
