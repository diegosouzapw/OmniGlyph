# 變更日誌

格式:[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · 語意化版本。

## [1.0.0] — 2026-07-07

首次公開發行。

### 產品本身

- **上下文即圖像壓縮代理**:在每個 LLM 請求的臃腫部分(系統提示詞、工具文件、
  舊歷史記錄、大型工具輸出)離開你的機器之前,將其重寫為高密度的 1-bit
  PNG 頁面。提供本機 Node 伺服器與 Cloudflare Workers 主機。
- **各服務商的精確計費數學**(`src/core/`):Anthropic 28px 分塊 +
  每區塊 3–4 token 額外開銷(自行測量,零殘差),OpenAI 與 Gemini
  公式均對照官方文件審核。於套件根目錄匯出
  (`anthropicImageTokens`、`resolveAnthropicVisionTier`、檔位上限)。
- **經測量的生產渲染配置**:高密度 1-bit 字形圖集(無反鋸齒),
  標準檔位頁面——每項選擇都有 `benchmarks/*/results/` 中的基準測試憑證作為依據。
- **基準測試套件**(`benchmarks/`):billing-sweep(token 核算)與
  density-frontier(跨模型/密度的讀取準確率邊界),可透過 API、OpenRouter、
  Claude Code CLI 或經由 OmniRoute(`--via-omniroute`)重新執行。
- **拒絕重試**:SSE/JSON 偵測器會在模型拒絕已渲染的頁面時,重播原始請求
  (終止開關 `retryRefusalWithOriginal`)。
- 為確定性頁面提供 **LRU 渲染快取**。
- **OmniRoute 引擎**:作為 `omniglyph` 壓縮引擎內建於
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute)(單一模式與
  疊加流水線),具備失敗即關閉的門控機制與感知圖像的 token 核算。

### 數字(全部可重現)

- UI 渲染範例:1015 字元 → 438×120 PNG,254 → 84 token(**節省 66.9%**)。
- 標準頁面 1568×728 = 1456 個圖像 token,無論其中裝了多少文字都一樣。
- Claude 在生產密度下以 100% 準確率讀取高密度 1-bit 頁面;Opus 4.8 在
  10×16 下讀取準確率為 77–87%。

### 否決的方案(有測量依據,而非主觀意見)

- **高解析度檔位是計費陷阱**:1928² 頁面按所見即所得計費,但編碼器
  並未獲得完整解析度——兩個檔位都改為渲染標準頁面。
- **GPT-5.5 被否決**:高密度字串讀取準確率 0/60,且完成內容相對於
  文字對照組膨脹約 40 倍。
- **gpt-4o-mini 從未圖像化**(2833/5667 token 底線使其永遠不划算)。
- **Gemini 2.5-flash 會虛構**而非在高密度頁面上棄權(0/26)——
  待付費配額下重新測試。
