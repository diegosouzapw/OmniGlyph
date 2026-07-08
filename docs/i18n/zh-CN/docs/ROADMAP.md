# Fork 路线图 —— "我们的 OmniGlyph" + OmniRoute 集成

综合工作计划(2026-07-05),来源于:已测量的计费扫描测试、
针对官方文档审计的 OpenAI/Gemini 计费、对相关工具的分析、
以及 density-frontier 测试套件。各项状态:☐ 待处理 · ◐ 部分完成 · ☑ 本仓库已完成。

## 阶段 0 —— 测量基础(本仓库已完成)

- ☑ 精确的 Anthropic 计费(28px 分块、2 个档位、每块 +4)—— `src/core/anthropic-vision.ts`,扫描测试见 `benchmarks/billing-sweep/`。
- ☑ 采用精确成本的盈利性门控(取代了 w·h/750 × 1.10)。
- ☑ 按档位区分的几何结构:Fable/Opus 4.8/Sonnet 5 → 1928×1928 页面(图像数减少 3.3 倍);标准档位 → 1568×728。691 个测试通过。
- ☑ `benchmarks/density-frontier/` 测试套件(离线通过 API 计算成本 × 准确率,带混淆干扰项的探针,确定性评分)。

## 阶段 1 —— 多服务商计费修复(审计中确认的缺陷)

按审计结果排定优先级(官方文档采集于 2026-07-05):

1. ☐ **D2(反向门控)**:`gpt-4o-mini` 落入默认的 85/170 分块档位,但实际成本为**每块 2833 基础 / 5667**(约低估 33 倍,约 0.8 字符/token)——对它进行图像化必然亏损,而门控却放行了它。`src/core/gpt-model-profiles.ts:51-59`。
2. ☐ **D5**:`detail:'original'` 被无条件发送(`src/core/openai.ts:392,402`),但该参数仅在 gpt-5.4+ 中存在;应从模型档案派生。
3. ☐ **D1**:`o4-mini` 系数 1.62 → 应为 **1.72**(低估 5.8%)。
4. ☐ **D3/D4**:`gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` 属于分块桶,**上限为 1536,不支持 `original`**(代码中误认为是 10000);`gpt-5-codex-mini` 处于错误的计费模式下(应为分块,却按瓦片处理)。
5. ☐ **GPT 几何结构**:`GPT_MAX_HEIGHT_PX` 从 1932 → 应改为 2048(与两种计费模式对齐:64×32 分块与 4×512 瓦片;可多容纳 6.25% 的空闲字符)。为 5.4/5.5 建立专属的 `original` 档案:最高可达 1568×5984(9,163 个分块 ≤ 10k,单个区块约 233k 字符)——需先做可读性 A/B 测试。
6. ☐ **Gemini 支持**(新增):`src/core/gemini.ts` + `gemini-model-profiles.ts` + 代理中的 `:generateContent`/`:streamGenerateContent` 路由。可文档化的几何结构:**1152×1536(精确裁剪单元 768,4 个瓦片,42.2 字符/token——三家服务商中已记录的最佳比率)**;待校准的猜想:768² 搭配 `media_resolution:MEDIUM`(56.4)以及 Gemini 3 的 HIGH 档位。注意:Gemini 兼容 OpenAI 的端点会走 OpenAI 转换器,导致计费错误。

## 阶段 2 —— 阅读质量(以 density-frontier 测试套件为判据)

- ◐ 在 Fable 上做出决定性的标准页 vs 高分辨率页 A/B 测试(进行中;验收标准:内容概要与文本一致 且 零静默错误 且 净节省为正)。
- ☐ 解决高密度渲染路径中 AA 与 1-bit 之间的矛盾(代码注释写着"仅用于评估",生产环境却使用了 AA)。
- ☐(2026-07-06 带理由推迟)字形手术:生产配置的读取率已是 30/30——今天没有可衡量的失读案例需要靠手术修复。若某个低于 100% 的目标进入范围(例如 Opus),或新的测量结果显示回退,再重新评估。
- ☑ ~~浅色主题 A/B~~ 经检查已解决(2026-07-06):渲染结果**已经是**黑底白字(render.ts:635/822,位块传输后取反)——与文献一致;该假设源于一个错误的前提(上游示例图像)。
- ☐ 为字节精确的 ID 建立带校验和的词表(上游 #38,已认可)+ 弃权提示条(#31/#32)+ 事实表中的 camelCase(#33/#34)。
- ☑ 移植 #45:保留 $schema/$id,逐元素剥离元组(已提交到 main)。
- ☑ 拒绝时重试(#37/H11):无损重放探测器 + 用原始请求体重试一次;refusalRetried 遥测(已提交到 main)。
- ☐ 恢复工具(`RecoverableBlock` → 可调用工具;LensVLM 验证选择性重新展开)。

## 阶段 3 —— 性能/健壮性

- ☐ LRU 渲染缓存(按不变量保证确定性;目前静态区块 + 冻结区块每次请求都会重新渲染)。
- ☐ 在工作线程中进行 PNG 编码;可配置的 deflate 压缩级别。
- ☐ 移植开放的上游修复:#44(类型化的原生工具 → 400)、#45(schema-strip draft-07 → 400 死循环)、#42(为 Claude Desktop 提供 CONNECT 代理)、#19(GPT 描述重复计费)。
- ☐ 实现 ADAPTIVE_CPT_PLAN(按区块角色划分 cpt;真实 slab = 1.50)。

## 阶段 4 —— fork 本身

- ☐ 独立的名称/仓库(由 Diego 决定)+ 用于 cherry-pick 的上游 `git remote`。
- ☐ **全面 TS 化**:核心库已是 TS,需转换 `eval/*.mjs`、`demo/`、`scripts/*.mjs`、`bench/`(模式:tsx + vitest;`benchmarks/density-frontier/` 就是这样诞生的)。
- ☐ 达到 OmniRoute 的质量标准:eslint 9 + prettier、带 typecheck/test/build/link-check 的 CI、CONTRIBUTING、SECURITY、README i18n(优先 pt-BR)、语义化 CHANGELOG。
- ☐ README 中**用 GIF 取代视频**(用 vhs/asciinema+agg 录制;原始版 vs 代理版并排对比)。
- ☐ 仪表盘 v2(通过 HTTP API 重新实现——不继承第三方代码):"打开设置了 ANTHROPIC_BASE_URL 的终端"启动器、"流量是否经过我"检查、图像与文本对比检视器、会话列表、以货币显示的成本面板、轻量级 i18n、用 SSE 取代轮询、带保留策略的 SQLite 持久化(其 24 列的表结构是不错的起点)。
- ☐ 来自 dense-image-gen 的小点子:`lines` 模式(为代码/表格保留排版)、`--keep-ws`、每页标注来源标题("系统提示词" / "工具文档" / "第 N 轮历史记录")、独立 CLI `render arquivo.md -o out.png`。

## 阶段 5 —— 移植到 OmniRoute

- ☐ `CompressionEngine` 引擎(以 `cavemanAdapter.ts` 为模板),注册到 `engines/index.ts` + `engineCatalog.ts`;`targets: ["messages","tool_results"]`,`applyAsync`。
- ☐ 接线工作:在 `chatCore.ts:1297` 传入 `supportsVision`(1 行代码),或通过 `isVisionModelId` 解析。
- ☐ 栈序:放在最后(RTK/Caveman/语义渲染器优先;OmniGlyph 对剩余部分做图像化)。
- ☐ 不变量:绝不重写客户端的 `cache_control` 区块(教训 #4560);保真度门控(#5127)需要一个声明的豁免,或一份满足不变量的文本事实表;带 `skip_reason` 的尝试遥测(教训 #4268)。
- ☐ 路由:引擎之后的回退/重试必须遵守视觉能力与允许列表(重新压缩或绕过)。
- ☐ 与 CCR 的协同:`emitRecoverable` → CCR 存储,支持按切片检索(`head/tail/grep`,#5187)= 完整的选择性重新展开。
- ☐ 将免费档位的延展作为营销卖点:在视觉模型上,每个免费档位 token 可产出约 2–3 倍的字符;Gemini 免费档位 + 1152×1536 几何结构是最有力的案例。

## 尚存风险

- Fable 在图像化上下文中重新部署后出现拒绝响应(上游 #37)——在 OmniRoute 中默认启用前需先缓解。
- 价格套利:若 Anthropic 调整视觉计费,节省比例会随之变化——按请求计算的反事实基准(`count_tokens`)是应对手段。
- OpenAI:社区测量(PageWatch)观察到补全 token 上升且延迟翻倍——启用前需按服务商分别测量。

## 2026-07-05 的 A/B 结果(经由 OpenRouter——几何结构方面尚无定论,但对失败模式有效)

| 配置 | 逐字精确 | 弃权 | 被过滤 | 静默错误 |
|---|---|---|---|---|
| fable 标准 5×8(AA 与 1-bit) | 0/30 | 0 | **30/30 被内容过滤** | 0 |
| fable 高分辨率 5×8(AA) | 0/30 | **20 次 ILEGIVEL** | 0 | 5(其中 2 次被预测到) |
| fable 高分辨率 5×8(1-bit) | 0/30 | 20 | 1 | 4(其中 2 次被预测到) |
| opus 高分辨率 10×16 | **7/9 读取成功** | 0 | 21 因额度耗尽 | 2(数字类) |

有效发现:(1)分类器(议题 #37)是标准页面在转录类问题上的**主导**失败模式——
100% 被过滤——但在大页面上不会触发;措辞很重要。(2)弃权机制有效:
大页面上出现 20 次 ILEGIVEL,相比之下只有 5 次虚构。(3)Opus 在 10×16
下的精确读取率达 78%(n=9),而在 5×8 下历史读取率为 0%——这是首次
第一手证据表明存在这个"拐点"。(4)大页面经由 OpenRouter 呈现的不可读性
暗示传输过程中存在**重采样**(Bedrock/Vertex 标准档位?)——这是一个
决定性假设,有待在 Anthropic 直连 API 上测试;在此之前几何结构的 A/B
测试结论仍为悬而未决。OpenRouter 额度在 Opus 测试组进行到一半时耗尽。

## 最终 2×2 矩阵(2026-07-05,经由 CLI/订阅,Fable 5,每组 n=30)

| 页面 × 图集 | 1-bit | AA |
|---|---|---|
| 标准 1568×728 | **30/30(100%)** | 25/30 + 5 次弃权 |
| 高分辨率 1928×1928 | **20/30(67%)** + 10 次弃权 | 0/30 + 29 次弃权 |

四组共 120 个问题中零虚构(每次失读都是 ILEGIVEL)。已应用:
DENSE_RENDER_STYLE 已切换为 1-bit(aa:false),并在
tests/dense-style.test.ts 中钉住。Opus 4.8:在大页面上以 10×16 达到
26/30,在 5×8 下则是 30/30 ILEGIVEL——Opus 安全模式可行。高分辨率页面
仍然受传输环节影响而降质(CLI 的 Read 工具/OpenRouter 重采样);
所见即所得几何结构的最终结论仍取决于直连 API 的测试。
