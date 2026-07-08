# Fork 路線圖——「我們自己的 OmniGlyph」+ OmniRoute 整合

彙整自(2026-07-05):已測量的計費掃描、對照官方文件的 OpenAI/Gemini
審核、相關工具的分析,以及 density-frontier 測試套件的工作計畫。
各項目狀態:☐ 待處理 · ◐ 部分完成 · ☑ 本儲存庫已完成。

## 第 0 階段——測量基礎(本儲存庫已完成)

- ☑ 精確的 Anthropic 計費(28px 分塊、2 個檔位、每區塊 +4)——`src/core/anthropic-vision.ts`,掃描見 `benchmarks/billing-sweep/`。
- ☑ 具精確成本的獲利門控(取代了 w·h/750 × 1.10)。
- ☑ 依檔位分級的幾何結構:Fable/Opus 4.8/Sonnet 5 → 1928×1928 頁面(圖像數減少 3.3 倍);標準檔位 → 1568×728。691 項測試通過。
- ☑ `benchmarks/density-frontier/` 測試套件(離線經 API 計算的成本 × 準確率,含易混淆干擾項的需求,確定性評分)。

## 第 1 階段——多服務商計費修正(審核中確認的錯誤)

依審核結果排定優先順序(官方文件擷取於 2026-07-05):

1. ☐ **D2(反向門控)**:`gpt-4o-mini` 落入預設的 85/170 分塊區,但實際成本為 **每分塊基礎 2833 / 5667**(低估約 33 倍,約 0.8 字元/token)——對它進行圖像化必然虧本,但門控卻核准了它。`src/core/gpt-model-profiles.ts:51-59`。
2. ☐ **D5**:`detail:'original'` 被無條件送出(`src/core/openai.ts:392,402`),但該值僅在 gpt-5.4 以上才存在;應改為由設定檔推導。
3. ☐ **D1**:`o4-mini` 乘數 1.62 → 應為 **1.72**(低估 5.8%)。
4. ☐ **D3/D4**:`gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` 屬於**不含 `original` 時上限為 1536** 的分塊區間(程式碼誤以為是 10000);`gpt-5-codex-mini` 落在錯誤的計費機制(分塊區 → 誤判為分塊)。
5. ☐ **GPT 幾何結構**:`GPT_MAX_HEIGHT_PX` 應從 1932 → 2048(同時對齊兩種機制:64×32 分塊與 4×512 拼貼;可多獲得 +6.25% 免費字元)。專屬的 5.4/5.5 `original` 設定檔:最高可達 1568×5984(9,163 個分塊 ≤ 10k,單一區塊內約 233k 字元)——需先做易讀性 A/B 測試。
6. ☐ **Gemini 支援**(新功能):`src/core/gemini.ts` + `gemini-model-profiles.ts` + 代理中的 `:generateContent`/`:streamGenerateContent` 路由。可記錄於文件的幾何結構:**1152×1536(精確裁切單元 768,4 個拼貼,42.2 字元/token——三家服務商中文件記載最佳的比例)**;待校準的推測方案:768² 搭配 `media_resolution:MEDIUM`(56.4)以及 Gemini 3 HIGH。注意:Gemini 的 OpenAI 相容端點會經過 OpenAI 轉換器,計費會出錯。

## 第 2 階段——閱讀品質(以 density-frontier 測試套件作為裁判)

- ◐ 在 Fable 上進行決定性的標準版 vs 高解析度 A/B 測試(進行中;驗收標準:摘要等同於文字 且 零靜默錯誤 且 淨節省為正)。
- ☐ 解決高密度路徑中 AA 與 1-bit 之間的矛盾(程式碼註解寫著「僅供評估使用」,但生產環境卻用了 AA)。
- ☐(2026-07-06 附理由延後)字形手術:生產配置的讀取準確率為 30/30——目前沒有可測量的失讀案例需要靠手術修正。若有未達 100% 的目標納入範圍(例如 Opus),或新的測量顯示退化,再重新檢視。
- ☑ ~~淺色主題 A/B~~ 已透過檢視解決(2026-07-06):渲染結果**已經是**黑底白字(render.ts:635/822,後期反轉處理)——與文獻一致;此假設源自錯誤前提(上游範例圖像)。
- ☐ 為位元組精確的 ID 建立含校驗碼的詞表(上游 #38,已採納)+ 棄權橫幅(#31/#32)+ 資訊卡中的 camelCase(#33/#34)。
- ☑ 移植 #45:保留 $schema/$id,逐元素剝除 tuple(已提交至 main)。
- ☑ 拒絕時重試(#37/H11):無損重播偵測器 + 以原始內容進行單次重試;refusalRetried 遙測(已提交至 main)。
- ☐ 復原工具(`RecoverableBlock` → 可呼叫工具;LensVLM 驗證選擇性重新展開)。

## 第 3 階段——效能/穩健性

- ☐ LRU 渲染快取(依不變量做確定性判斷;目前靜態區塊 + 凍結區塊每次請求都重新渲染)。
- ☐ 在 worker thread 中進行 PNG 編碼;可設定的 deflate 等級。
- ☐ 移植開放的上游修正:#44(具型別的原生工具 → 400)、#45(schema 剝除 draft-07 → 400 迴圈)、#42(Claude Desktop 的 CONNECT 代理)、#19(GPT 描述重複計費)。
- ☐ 實作 ADAPTIVE_CPT_PLAN(依區塊角色設定 cpt;實際 slab = 1.50)。

## 第 4 階段——Fork 本身

- ☐ 自有名稱/儲存庫(由 Diego 決定)+ 上游 `git remote` 供 cherry-pick 使用。
- ☐ **全面採用 TS**:核心已是 TS,轉換 `eval/*.mjs`、`demo/`、`scripts/*.mjs`、`bench/`(模式:tsx + vitest;`benchmarks/density-frontier/` 就是這樣誕生的)。
- ☐ OmniRoute 品質標準:eslint 9 + prettier、含 typecheck/test/build/link-check 的 CI、CONTRIBUTING、SECURITY、README i18n(pt-BR 優先)、語意化 CHANGELOG。
- ☐ README 中**用 GIF 取代影片**(以 vhs/asciinema+agg 錄製;純文字版 vs 代理版並排比較)。
- ☐ 儀表板 v2(透過 HTTP API 重新實作——不繼承第三方程式碼):「開啟已設定 ANTHROPIC_BASE_URL 的終端機」啟動器、「流量是否經過我?」檢查、圖像 vs 文字檢視器、工作階段管理、以貨幣顯示的成本面板、輕量 i18n、以 SSE 取代輪詢、具保留期限的 SQLite 持久化(其 24 欄的結構是不錯的起點)。
- ☐ 來自 dense-image-gen 的微創意:`lines` 模式(保留程式碼/表格的排版)、`--keep-ws`、每頁的來源標題(「system prompt」/「tool docs」/「history turn N」)、獨立 CLI `render arquivo.md -o out.png`。

## 第 5 階段——移植至 OmniRoute

- ☐ `CompressionEngine` 引擎(`cavemanAdapter.ts` 範本),註冊於 `engines/index.ts` + `engineCatalog.ts`;`targets: ["messages","tool_results"]`、`applyAsync`。
- ☐ 接線工作:在 `chatCore.ts:1297` 傳入 `supportsVision`(1 行)或透過 `isVisionModelId` 解析。
- ☐ 堆疊順序:排在最後(RTK/Caveman/語意渲染器優先;OmniGlyph 對剩餘部分做圖像化)。
- ☐ 不變量:絕不重寫客戶端的 `cache_control` 區塊(教訓 #4560);保真度門控(#5127)需要一個明確聲明的例外情形,或一份滿足不變量的文字資訊卡;附帶 `skip_reason` 的嘗試遙測(教訓 #4268)。
- ☐ 路由:引擎後的 fallback/retry 必須尊重視覺能力與允許清單(重新壓縮或略過)。
- ☐ 與 CCR 的協同:`emitRecoverable` → CCR 儲存,支援逐切片檢索(`head/tail/grep`,#5187)= 完整的選擇性重新展開。
- ☐ 把免費檔位延展當作行銷賣點:在視覺模型上,每個免費檔位 token 可換得約 2-3 倍的字元;Gemini 免費檔位 + 1152×1536 幾何結構是最有力的案例。

## 未解決的風險

- Fable 在重新部署後、於圖像化上下文中出現拒絕(上游 #37)——在 OmniRoute 中預設啟用之前需先緩解。
- 價格套利:若 Anthropic 調整視覺定價,節省幅度會隨之改變——逐請求的反事實(`count_tokens`)是防線。
- OpenAI:社群測量(PageWatch)觀察到完成 token 上升且延遲加倍——啟用前需按服務商各自測量。

## 2026-07-05 A/B 結果(經 OpenRouter——對幾何結構無定論,但對失敗模式有效)

| 配置 | 逐字精確 | 棄權 | 已過濾 | 靜默錯誤 |
|---|---|---|---|---|
| fable 標準 5×8(AA 與 1-bit) | 0/30 | 0 | **30/30 內容過濾** | 0 |
| fable 高解析度 5×8(AA) | 0/30 | **20 ILEGIVEL** | 0 | 5(預測到 2 個) |
| fable 高解析度 5×8(1-bit) | 0/30 | 20 | 1 | 4(預測到 2 個) |
| opus 高解析度 10×16 | **7/9 已讀取** | 0 | 21 額度用盡 | 2(數字) |

有效發現:(1)分類器(議題 #37)是標準頁面上轉錄類問題**主要**的失敗
模式——100% 被過濾——但在大頁面上不會觸發;措辭很重要。
(2)棄權機制有效:大頁面上出現 20 次 ILEGIVEL,對比 5 次虛構。
(3)Opus 在 10×16 下的精確讀取率為 78%(n=9),對比 5×8 下歷史數據
0%——首次第一手證據證實了拐點的存在。
(4)大頁面經由 OpenRouter 的不可讀性,暗示傳輸層存在**重新取樣**
(Bedrock/Vertex 標準檔位?)——這是待在 Anthropic 直接 API 上測試的
決定性假設;幾何結構的 A/B 測試在此之前仍屬未決。OpenRouter 額度
在 Opus 那組測試中途耗盡。

## 最終 2×2 矩陣(2026-07-05,經 CLI/訂閱,Fable 5,每組 n=30)

| 頁面 × 圖集 | 1-bit | AA |
|---|---|---|
| 標準 1568×728 | **30/30(100%)** | 25/30 + 5 棄權 |
| 高解析度 1928×1928 | **20/30(67%)** + 10 棄權 | 0/30 + 29 棄權 |

四組測試中零虛構(120 個問題——每個失讀都是 ILEGIVEL)。已套用:
DENSE_RENDER_STYLE 已改為 1-bit(aa:false),並在
tests/dense-style.test.ts 中釘住。Opus 4.8:在大頁面 10×16 下為
26/30,在 5×8 下為 30/30 ILEGIVEL——Opus 安全模式可行。高解析度頁面
仍因傳輸層(CLI Read/OpenRouter 重新取樣)而降質;所見即所得的
幾何結構定論仍有待直接 API 驗證。
