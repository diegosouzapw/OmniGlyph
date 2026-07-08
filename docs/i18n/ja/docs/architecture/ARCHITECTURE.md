# アーキテクチャ

コードベースの1ページマップ。

## リクエストパイプライン

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

## 課金（厳密、実測済み）

| モジュール | プロバイダ | モデル |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28pxパッチ + ブロックあたり4トークン、ティアごとのリサイズ上限; ページのジオメトリ（どちらのティアも標準の1568×728ページをレンダリングする — 高解像度ティアは課金の罠、[BENCHMARKS](../benchmarks/BENCHMARKS.md)を参照） |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | モデルごとのパッチ/タイルレジーム、プロファイルごとの`detail`、ストリップジオメトリ |
| `src/core/gemini-model-profiles.ts` | Google | タイル式（`floor(min/1.5)`のクロップ単位）+ `media_resolution`の定額コスト |

## レンダリング

- `src/core/render.ts` — テキスト → PNG（焼き込み済みのグリフアトラス経由、Spleen 5×8 +
  Unifontフォールバック）、`↵`改行センチネルによるリフロー、本番では1ビットアトラス
  （FableにおいてAAより優れていると実測されている）。
- `src/core/render-cache.ts` — 決定論的なレンダリングのLRUメモ化（静的なslabと
  フローズンな履歴チャンクは、そうしないと毎リクエストで再レンダリングされてしまう）。
- `src/core/history.ts` — 古いターンをアペンドオンリーのフローズン画像チャンクに折りたたみ、
  それらはバイト同一のまま維持されるためプロンプトキャッシュがヒットし続ける。
- `src/core/png.ts` — 最小限の決定論的PNGエンコーダ（ネイティブ依存なし）。

## ガードレール

- モデルの許可リスト（`src/core/applicability.ts`）: 読み取りベンチマークに合格した
  モデルのみが画像化され、それ以外はバイト同一のまま素通しされる。
- バイト単位で正確な値（SHA、id）は画像の隣のファクトシートにテキストとして併走する
  （`src/core/factsheet.ts`）; `emitRecoverable`経由で復元可能なオリジナル。
- ネイティブのtypedツール（`type !== 'custom'`）は決して書き換えられない（400ガード）。

## ベンチマークと根拠

`benchmarks/`には、READMEのすべての数値を生成した2つのハーネスが格納されています
— [benchmarks/README.md](../../benchmarks/README.md)を参照してください。
