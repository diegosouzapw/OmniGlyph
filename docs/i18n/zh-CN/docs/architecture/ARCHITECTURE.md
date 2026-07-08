# 架构

代码库的一页式地图。

## 请求流水线

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  single Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, usage/telemetry events
  ▼
src/core/transform.ts              THE pipeline (Anthropic path):
  │   1. parse body, resolve vision tier from model
  │   2. profitability gate — exact image cost vs text cost
  │   3. convert: static slab · large tool_results · collapsed history
  │   4. splice back preserving the client's cache_control anchors
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## 计费(精确,已测量)

| 模块 | 服务商 | 模型 |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px 分块 + 每块 4 token,按档位区分的缩放上限;页面几何结构(两个档位实际都渲染标准的 1568×728 页面——高分辨率档位是一个计费陷阱,详见 [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | 按模型区分的分块/瓦片计费模式、按档案区分的 `detail` 参数、剥离几何结构 |
| `src/core/gemini-model-profiles.ts` | Google | 瓦片公式(`floor(min/1.5)` 裁剪单元)+ `media_resolution` 固定成本 |

## 渲染

- `src/core/render.ts` —— 通过预烘焙的字形图集(Spleen 5×8 +
  Unifont 回退)将文本转换为 PNG,使用 `↵` 换行哨兵字符进行重排,
  生产环境使用 1-bit 图集(在 Fable 上测得优于 AA)。
- `src/core/render-cache.ts` —— 对确定性渲染结果做 LRU 记忆化
  (否则静态区块 + 冻结的历史区块会在每次请求中重新渲染)。
- `src/core/history.ts` —— 将旧的对话轮次折叠为仅追加的冻结图像区块,
  这些区块保持字节级一致,从而让提示词缓存持续命中。
- `src/core/png.ts` —— 极简的确定性 PNG 编码器(无原生依赖)。

## 防护机制

- 模型允许列表(`src/core/applicability.ts`):只有通过阅读基准测试的
  模型才会被图像化;其余模型原样透传,字节级不变。
- 字节精确的值(SHA、ID)以文本形式存放于图像旁的事实表中
  (`src/core/factsheet.ts`);可通过 `emitRecoverable` 恢复原始内容。
- 原生类型化工具(`type !== 'custom'`)绝不会被重写(400 防护)。

## 基准测试与凭据

`benchmarks/` 中包含产出 README 里每一个数字的两套测试套件——
详见 [benchmarks/README.md](../../benchmarks/README.md)。
