# 更新日志

格式:[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · 语义化版本控制。

## [1.0.0] — 2026-07-07

首个公开发布版本。

### 产品本身

- **将上下文渲染为图像的压缩代理**:在每个 LLM 请求离开你的机器之前,将其中臃肿的部分
  (系统提示词、工具文档、旧历史记录、大型工具输出)重写为高密度的 1-bit PNG 页面。
  提供本地 Node 服务器和 Cloudflare Workers 宿主两种形式。
- **按服务商精确的计费数学**(`src/core/`):Anthropic 采用 28px 分块 +
  每块 3–4 token 的开销(自研测量,残差为零),OpenAI 与 Gemini 的计费公式
  均已对照官方文档审计。在包根导出(`anthropicImageTokens`、
  `resolveAnthropicVisionTier`、档位上限)。
- **经测量的生产环境渲染配置**:高密度 1-bit 字形图集(无抗锯齿),
  标准档位页面——每一项选择都有 `benchmarks/*/results/` 中的基准测试凭据支撑。
- **基准测试套件**(`benchmarks/`):billing-sweep(token 核算)与
  density-frontier(跨模型/密度的读取准确率边界),可通过 API、
  OpenRouter、Claude Code CLI 或经由 OmniRoute(`--via-omniroute`)重新运行。
- **拒绝重试**:当模型拒绝渲染出的页面时,SSE/JSON 探测器会重放原始请求
  (终止开关 `retryRefusalWithOriginal`)。
- **LRU 渲染缓存**,用于确定性页面。
- **OmniRoute 引擎**:作为 `omniglyph` 压缩引擎内置于
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) 中(单模式与
  叠加流水线均支持),具备失败即关闭的门控机制和感知图像的 token 核算。

### 数字(全部可复现)

- 示例 UI 渲染:1015 字符 → 438×120 PNG,254 → 84 token(**节省 66.9%**)。
- 标准页面 1568×728 = 1456 个图像 token,无论其中承载多少文字都不变。
- Claude 在生产密度下以 100% 的准确率读取高密度 1-bit 页面;Opus 4.8 在
  10×16 尺寸下读取准确率为 77–87%。

### 负面决策(基于测量,而非主观判断)

- **高分辨率档位是一个计费陷阱**:1928² 页面按所见即所得(WYSIWYG)计费,
  但编码器并未获得完整分辨率——两个档位实际上都渲染标准页面。
- **拒绝采用 GPT-5.5**:高密度条带的读取准确率为 0/60,相较文本对照组
  补全内容膨胀约 40 倍。
- **gpt-4o-mini 从未启用图像化**(2833/5667 token 的下限使其无法盈利)。
- **Gemini 2.5-flash 在高密度页面上出现虚构**而非弃权
  (0/26)——待付费配额下重新测试。
