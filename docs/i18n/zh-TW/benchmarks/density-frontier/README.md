# density-frontier —— 各解析度的成本 × 準確率

🌐 已翻譯:[所有語言](../../../README.md)

此測試套件用於測量文字→圖像渲染在**成本與可讀性之間的帕累托邊界**,
依服務商(Anthropic / OpenAI / Gemini)、頁面幾何結構、字形格與
圖集樣式分組進行測量。

較便宜(較密集)的頁面每個 token 可承載更多字元,但密度過高終究
會變得無法讀取。唯有**同時**滿足兩個條件——成本低*且*模型仍能
完美讀取——的配置才被允許上線:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

每個回答都會被評為以下三種結果之一——中間這一種正是讓這道門控
值得信賴的關鍵:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

只要配置產生一次 🔴,無論多便宜都會被淘汰。

核心的不對稱性在於:自計費掃描(2026-07-05,
`benchmarks/billing-sweep/`)之後,**成本已可離線精確預測**——
Anthropic 上是 28 px 分塊 + 每區塊 4 token(`src/core/anthropic-vision.ts`),
OpenAI 上是分塊/拼貼設定檔(`src/core/openai.ts`),Gemini 上是
拼貼/media_resolution(`gemini-cost.ts`)。只有**讀取準確率**
需要呼叫 API。

## 設計

- **語料**(`corpus.ts`):高密度的 log/JSON 風格填充內容 +
  依混淆矩陣所示會失敗的類別而埋入的需求(12 字元十六進位、
  camelCase、6/8/5/3 位數字)+ **由已測量的混淆字形配對建構的
  近似干擾項**。如果模型以干擾項作答,代表這個混淆是*被預測到*的
  ——這正是要偵測的靜默失敗模式,而不只是被算作答錯。確定性
  (mulberry32)。
- **配置**(`configs.ts`):精心挑選的網格——標準 1568×728 頁面
  vs 高解析度 1928×1928(決定依檔位分幾何結構的 A/B 測試)、
  AA vs 1-bit(解決高密度渲染的矛盾)、7×10/10×16 字形格
  (Opus 安全模式)、GPT strip,以及兩種 Gemini 推測方案
  (≤384² = 固定 258;`media_resolution: low` = 固定 280 → 若可讀
  約 116 字元/token)。
- **評分**(`score.ts`):確定性精確比對,無 LLM 裁判。三種結果:
  `correct` / `abstained`(ILEGIVEL 哨兵符號——誠實的失敗)/
  `silent_wrong`(危險的模式),並附帶干擾項旗標。

## 執行方式

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

特定配置:`--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`。
回答會寫入 `results/*.jsonl`(每個問題一行,含原始回答以供稽核)。

## 驗收標準(繼承自上游 PR #35/#36)

只有滿足以下條件,配置才能成為生產環境預設值:**大意等同於文字
基準** 且 **零靜默的精確字串錯誤** 且 **淨節省為正**。第一個必要
執行項目是在 Fable 上比較 `anthropic-std-5x8-aa` 與
`anthropic-hires-5x8-aa`——在啟用高解析度檔位之前,先對大頁面做
易讀性抽查。

## `--via-omniroute` —— 經 OmniRoute 的端到端測試(P3:不劣化證明)

上述傳輸層都是**在測試套件內部**將文字渲染為 PNG 再送出圖像。
`--via-omniroute` 則相反,走的是生產環境的路徑:將**高密度文字**
送至正在執行的 OmniRoute 執行個體,讓 **`omniglyph` 引擎渲染**
頁面並轉送給 Anthropic,再測量讀取結果與節省幅度。若讀取結果與
直連路徑保持一致,**且** OmniRoute 回報有壓縮,即可證明 OmniRoute
的渲染+轉送**不會**使頁面劣化。

前置需求(維運面):

1. **OmniRoute 正在執行**(`npm run dev`,預設
   `http://localhost:20128`)。
2. OmniRoute 中已設定一個具**真實金鑰**的 **Anthropic 服務商**
   (直連路徑——`providerTransport==='direct'` 門控只對 `anthropic`
   服務商放行)。
3. OmniRoute 的壓縮設定中已**啟用 `omniglyph` 引擎**
   (`config.engines.omniglyph.enabled = true`)——只有引擎開啟時,
   `engine:omniglyph` 標頭才會出現。(此引擎為
   `stable:false`/預覽狀態;需明確啟用。)
4. `OMNIROUTE_API_KEY` 中設定了 **OmniRoute API key**(用戶端用來
   向 OmniRoute 驗證身分的金鑰,不是 Anthropic 的金鑰)。

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

每個回答都會在 JSONL 中記錄
`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(來自 `X-OmniRoute-Compression` 回應標頭);表格列會顯示有多少
回答確實回傳了已壓縮的結果 + 節省幅度的中位數。**P3 驗收標準**:
與直連路徑相同的逐字/大意命中率(不劣化)**且**
`omnirouteSavings` 非空值(證明確實發生了渲染,而不是讀取原始
文字)。若出現 `did NOT compress`,代表 OmniRoute 中未啟用該引擎
(或內容未通過失敗即關閉的門控)。

純邏輯部分的測試:`tests/density-frontier.test.ts`(包含 via-omniroute
傳輸層的 `buildOmnirouteRequest` 與 `parseCompressionSavings`)。
