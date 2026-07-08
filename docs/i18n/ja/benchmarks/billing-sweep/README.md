# Anthropicビジョン課金スイープ

2つの未解決なジオメトリの問いを決着させる、無料の`count_tokens`スイープ。

1. **式** — APIは`ceil(w/28) × ceil(h/28)`パッチ（現行ドキュメント）で課金するのか、
   それとも廃止された`w·h/750`なのか? プローブ集合は、この2つを1行あたり
   25〜180トークンの差で切り分ける。
2. **ティア** — `claude-fable-5`は高解像度キャップ（長辺 ≤ 2576px、≤ 4784ビジュアル
   トークン）を得るのか? `page-old-1928x1928`の行が決め手: 実測が約**4761**であれば
   高解像度WYSIWYG（古い大きいページは、現在の1568×728と同じ文字/トークン比のまま
   約3.3倍多くの文字を1画像に収める）; 約**1521**であればstandardティアのリサンプルで、
   1568×728が正しいままとなる。

背景: 現行の1568×728ページの根拠となった2026-07-01のスイープ（可読性監査、
2026-07-01）は`claude-sonnet-4-5`（standardティアのモデル）で計測されたが、
本番のターゲットはFable 5であり、ビジョンドキュメントではhigh-resolutionティアに
分類されている。その監査では現行ページを1460トークンとも計測しており、これは
/750式の1522よりもパッチ式の1456に近く、APIがすでにパッチ課金へ移行していた
ことを示唆していた。

## 実行

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

**必ずAPIに直接**アクセスすること — OmniGlyphプロキシ経由では絶対にダメで、
ボディが変換されてしまう。`count_tokens`は無料; フルスイープは約25リクエストを行う。

## 出力の読み方

モデルごとに、各プローブ行は測定された画像トークン数（画像ありからテキストのみ
ベースラインを引いたもの）を、4つの予測すべて（`patch`/`legacy750` ×
`standard`/`highres`）に対して示す; サマリは平均絶対残差で仮説をランク付けする。
`--probe-multi`は画像1枚あたりの上限（2×1092² ≈ 2×1521）を確認し、
`--probe-20plus`は20枚超えのルール（2000pxを超える辺はリサイズではなく
リジェクトされるべき）を確認する。行は`results/*.jsonl`に格納され、
予測ロジックは`formulas.mjs`にあり、`tests/billing-sweep-formulas.test.ts`で
ピン留めされている。

## 判定後の対応

- パッチ式が確認された場合 → OmniGlyph PR #27（厳密なリサイズ変換）を移植し、
  `src/core/transform.ts`内の`ANTHROPIC_PIXELS_PER_TOKEN`ゲート計算を整合させる。
- Fableでhigh-resティアが確認された場合 → ティアごとのページジオメトリを再導入する
  （Fable/Opus 4.8/Sonnet 5には1928×1928クラスのページ、standardには1568×728）、
  GPTパスがすでに独自の`GPT_MAX_HEIGHT_PX`を維持しているのと同じ構造で。
