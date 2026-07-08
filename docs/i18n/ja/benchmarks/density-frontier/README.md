# density-frontier — 解像度ごとのコスト×精度

テキスト→画像レンダーの、**コストと可読性のパレートフロンティア**を、プロバイダ
（Anthropic / OpenAI / Gemini）、ページジオメトリ、グリフセル、アトラススタイル
ごとに計測するハーネス。

中心的な非対称性: billing sweep（2026-07-05、`benchmarks/billing-sweep/`）以降、
**コストはオフラインで正確に予測可能**である — Anthropicでは28pxパッチ + 4/ブロック
（`src/core/anthropic-vision.ts`）、OpenAIではpatch/tileプロファイル
（`src/core/openai.ts`）、Geminiではtile/media_resolution
（`gemini-cost.ts`）。API呼び出しが必要なのは**読み取り精度**だけである。

## 設計

- **コーパス**（`corpus.ts`）: 高密度なlog/JSON風のフィラーに、混同可能性マトリクスが
  失敗すると示すクラス（12文字の16進数、camelCase、桁6/8/5/3）からの仕込みneedleを加え、
  さらに**実測された混同ペアから構築した近似ミスのdistractor**を加えたもの。
  モデルがdistractorで答えた場合、その混同は*予測どおり*だったことになる —
  それが検出対象の無自覚な失敗モードであり、単に不正解として数えるものではない。
  決定論的（mulberry32）。
- **構成**（`configs.ts`）: 厳選されたグリッド — standard 1568×728ページ対
  high-res 1928×1928（ティアごとのジオメトリを決定するA/B）、AA対1ビット
  （高密度レンダーの矛盾を解消）、7×10/10×16セル（Opusのセーフモード）、
  GPTストリップ、そしてGeminiの2つのベット（≤384² = 258固定;
  `media_resolution: low` = 280固定 → *読めれば*約116文字/トークン）。
- **スコア**（`score.ts`）: 決定論的な完全一致、LLM判定なし。3つの結果:
  `correct` / `abstained`（ILEGIVELセンチネル — 正直な失敗）/ `silent_wrong`
  （危険なモード）、distractorフラグ付き。

## 実行

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

特定の構成: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`。
回答は`results/*.jsonl`に格納される（監査のための生の回答を含め1問1行）。

## 受け入れ基準（upstream PR #35/#36から継承）

構成が本番デフォルトになるのは以下すべてを満たす場合のみ: **gist == テキスト
ベースライン** かつ **無自覚な誤った完全一致文字列がゼロ** かつ **プラスの節約効果**。
最初の必須実行は、Fableでの`anthropic-std-5x8-aa`対`anthropic-hires-5x8-aa`——
high-resティアを有効化する前の、大きいページの可読性スポットチェックである。

## `--via-omniroute` — OmniRoute経由のe2e（P3: 非劣化の証明）

上記のトランスポートは、**ハーネス内で**テキスト→PNGをレンダリングして画像を送信する。
`--via-omniroute`はその逆であり、これが本番パスにあたる: **高密度テキスト**を
稼働中のOmniRouteインスタンスに送信し、`omniglyph`エンジンにページを**レンダリング**
させてAnthropicへ転送させ、読み取り結果と節約効果を計測する。読み取り結果がdirect
ルートと同じままで、かつOmniRouteが圧縮を報告すれば、OmniRouteのレンダー+転送が
ページを**劣化させない**ことが証明される。

前提条件（運用面）:

1. **OmniRouteが稼働中**であること（`npm run dev`、デフォルトは`http://localhost:20128`）。
2. OmniRouteに**実キー付きのAnthropicプロバイダ**が設定されていること（directルート —
   `providerTransport==='direct'`ゲートは`anthropic`プロバイダに対してのみ通る）。
3. OmniRouteの圧縮設定で**`omniglyph`エンジンが有効化**されていること
   （`config.engines.omniglyph.enabled = true`）— `engine:omniglyph`ヘッダーは
   エンジンが有効な場合のみ発火する（このエンジンは`stable:false`/プレビューであり、
   明示的に有効化する必要がある）。
4. `OMNIROUTE_API_KEY`に**OmniRoute側のAPIキー**があること（クライアントがOmniRoute
   に対して認証するためのキーであり、Anthropicのキーではない）。

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

各回答は、JSONL内に`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
を記録する（`X-OmniRoute-Compression`レスポンスヘッダー由来）; テーブルの行には、
圧縮されて返ってきた回答数と中央値の節約率が表示される。**P3の基準**: directルートと
同じverbatim/gistのヒット数（非劣化）**かつ**非nullな`omnirouteSavings`（レンダーが
実際に起きたことの証明であり、生テキストの読み取りではないこと）。`did NOT compress`
と表示された場合、OmniRoute側でエンジンが有効化されていない（またはボディが
フェイルクローズなゲートを通過しなかった）ことを意味する。

純粋な部分のテスト: `tests/density-frontier.test.ts`（via-omniroute transportの
`buildOmnirouteRequest`と`parseCompressionSavings`を含む）。
