# 架構

程式碼庫的單頁地圖。

## 請求流水線

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

## 計費(精確,已測量)

| 模組 | 服務商 | 模型 |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px 分塊 + 每區塊 4 token,依檔位設定縮放上限;頁面幾何結構(兩個檔位都渲染標準的 1568×728 頁面——高解析度檔位是計費陷阱,見 [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | 依模型而異的分塊/拼貼機制、依設定檔而定的 `detail`、剝除幾何資訊 |
| `src/core/gemini-model-profiles.ts` | Google | 拼貼公式(`floor(min/1.5)` 裁切單元)+ `media_resolution` 固定成本 |

## 渲染

- `src/core/render.ts` —— 透過內建的字形圖集(Spleen 5×8 +
  Unifont 備援)將文字轉為 PNG,以 `↵` 換行哨兵符號進行重新排版,
  生產環境使用 1-bit 圖集(測得優於 Fable 上的 AA)。
- `src/core/render-cache.ts` —— 對確定性渲染結果做 LRU 記憶化
  (否則靜態區塊 + 凍結歷史區塊每次請求都會重新渲染)。
- `src/core/history.ts` —— 將舊的對話輪次折疊成僅追加的凍結圖像
  區塊,並保持位元組完全一致,讓提示詞快取持續命中。
- `src/core/png.ts` —— 最小化的確定性 PNG 編碼器(無原生依賴)。

## 防護機制

- 模型允許清單(`src/core/applicability.ts`):只有通過閱讀基準測試的
  模型才會被圖像化;其餘一律以位元組不變的方式直接通過。
- 位元組精確的值(SHA、id)會以文字形式存在圖像旁的資訊卡中
  (`src/core/factsheet.ts`);可透過 `emitRecoverable` 復原原始內容。
- 原生具型別的工具(`type !== 'custom'`)絕不會被重寫(400 防護)。

## 基準測試與憑證

`benchmarks/` 保存產出 README 中每一個數字的兩套測試套件——
見 [benchmarks/README.md](../../benchmarks/README.md)。
