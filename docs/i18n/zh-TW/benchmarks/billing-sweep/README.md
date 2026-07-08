# Anthropic 視覺計費掃描

🌐 已翻譯:[所有語言](../../../README.md)

**存在的理由:** 唯有成本估算是**精確**的,獲利性門控才安全。若公式
稍有偏差,就可能誤將實際成本更高的區塊也轉換掉。因此這項掃描會在
上線前,把公式釘死在 API 的真實數字上——做到**殘差為零**。

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

免費的 `count_tokens` 掃描,用來裁定兩個懸而未決的幾何結構問題:

1. **公式**——API 是按 `ceil(w/28) × ceil(h/28)` 分塊計費(目前文件所述),
   還是按已淘汰的 `w·h/750`?探測集會依每列 25–180 token 的差異
   來區分這兩者。
2. **檔位**——`claude-fable-5` 是否享有高解析度檔位的上限(長邊
   ≤ 2576 px,≤ 4784 個視覺 token)?`page-old-1928x1928` 這一列是
   決定性的:約 **4761** 的測量值代表高解析度所見即所得(舊的大頁面
   每張圖像承載的字元數約為今日 1568×728 的 3.3 倍,字元/token 比例
   相同);約 **1521** 則代表標準檔位重新取樣,1568×728 仍然正確。

背景:目前 1568×728 頁面所依據的 2026-07-01 掃描(易讀性審核,
2026-07-01)是在 `claude-sonnet-4-5`(標準檔位模型)上測量的,
而生產環境的目標是 Fable 5,視覺文件將其歸類為高解析度檔位。
該次審核也測得當時的頁面耗費 1460 token:比起 /750 公式的 1522,
更接近分塊公式的 1456,暗示 API 當時已經改用分塊計費。

## 執行

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

必須**直接**打到 API——絕不能經過 OmniGlyph 代理,否則內容會被
轉換。`count_tokens` 是免費的;完整掃描約發出 25 個請求。

## 解讀輸出結果

針對每個模型,每一列探測結果會顯示測得的圖像 token 數(含圖請求減去
純文字基準),並對照全部四種預測(`patch`/`legacy750` ×
`standard`/`highres`);摘要依平均絕對殘差為各假設排名。
`--probe-multi` 檢查每張圖像的上限(2×1092² ≈ 2×1521);
`--probe-20plus` 檢查 >20 張圖像的規則(邊長 >2000 px 必須被拒絕,
而非被縮小)。各列會寫入 `results/*.jsonl`;預測數學位於
`formulas.mjs`,由 `tests/billing-sweep-formulas.test.ts` 釘住。

## 得出結論之後

- 確認分塊公式 → 移植 OmniGlyph PR #27(精確的縮放轉換),並在
  `src/core/transform.ts` 中對齊 `ANTHROPIC_PIXELS_PER_TOKEN` 門控數學。
- 在 Fable 上確認高解析度檔位 → 重新引入依檔位而定的頁面幾何結構
  (Fable/Opus 4.8/Sonnet 5 使用 1928×1928 類別頁面,標準檔位使用
  1568×728),與 GPT 路徑既有的獨立 `GPT_MAX_HEIGHT_PX` 機制相呼應。
