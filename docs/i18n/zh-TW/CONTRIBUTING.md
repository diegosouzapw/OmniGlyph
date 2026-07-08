# 為 OmniGlyph 貢獻程式碼

感謝你的關注!本專案有兩條不可協商的文化規則——
它們是 README 中每一個數字都值得信賴的原因。

## 規則一——嚴格 TDD

所有生產程式碼都誕生於一個先失敗的測試:

1. 撰寫測試,並**看著它以正確的理由失敗**。
2. 撰寫讓它通過的最小程式碼。
3. 在保持綠燈的狀態下重構。

完整的檢驗標準是:`pnpm run typecheck && pnpm test && pnpm run build`——
三者缺一不可,始終如此(文件連結檢查與品牌重命名守護測試會在 `pnpm test`
內部經由 `tests/docs-integrity.test.ts` 執行)。

## 規則二——先測量,後聲明

對幾何結構、圖集、計費公式或模型範圍的任何變更,若沒有測得的數字,
一律不予合併。本儲存庫圍繞這條紀律建構:

- 計費成本 → 用 `benchmarks/billing-sweep/` 證明(`count_tokens` 是免費的;
  預期殘差:零)。
- 可讀性 → 用 `benchmarks/density-frontier/` 證明(每組 n≥30,確定性評分,
  JSONL 憑證提交至 `benchmarks/*/results/`)。
- 變更生產環境預設值的驗收標準:摘要等同於文字基準 **且**
  零靜默的精確字串錯誤 **且** 淨節省為正。

沒有數字支撐的假設應寫入 `docs/ROADMAP.md` 作為假設——絕不能作為
事實寫入 README。已有兩個「顯而易見」的想法被數據推翻
(高解析度頁面、反鋸齒圖集);這套流程行之有效。

## 環境設定

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18(CI 測試 20/22/24),pnpm 10(由 package.json 中的
`packageManager` 固定版本)。

## 結構

| 資料夾 | 規則 |
|---|---|
| `src/core/` | 與執行環境無關(僅 Web API——可在 Node 與 Workers 上執行) |
| `src/node.ts` / `src/worker.ts` | 僅負責主機的接線工作 |
| `benchmarks/` | 可重新執行的測試套件;JSONL 結果是憑證,需提交 |
| `docs/` | benchmarks/(數字)、architecture/(架構圖)、ROADMAP(假設)、ops/(OmniRoute) |

## Commits 與 PR

- 使用 Conventional Commits(`feat:`、`fix:`、`perf:`、`docs:`、`refactor:`、
  `test:`、`chore:`),內文說明*原因*並附上相關數字。
- 保持 PR 小而聚焦;行為變更需附上固定其行為的測試,並在適用時
  附上作為依據的基準測試。
- 不要重寫客戶端的 `cache_control` 區塊,未經討論不要新增執行時期依賴
  (核心刻意保持輕量依賴),渲染路徑中不要使用 `Math.random`/時間戳
  (確定性是硬性不變量,以位元組級一致性測試把關)。
