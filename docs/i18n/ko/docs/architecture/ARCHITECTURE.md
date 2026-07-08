# Architecture

코드베이스에 대한 한 페이지짜리 지도입니다.

## Request pipeline

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

## Billing (정확함, 측정됨)

| 모듈 | 프로바이더 | 모델 |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28px 패치 + 블록당 4, 티어별 리사이즈 상한; 페이지 기하 구조(두 티어 모두 표준 1568×728 페이지를 렌더링함 — 고해상도 티어는 과금 함정임, [BENCHMARKS](../benchmarks/BENCHMARKS.md) 참고) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | 모델별 패치/타일 체제, 프로필별 `detail`, 스트립 기하 구조 |
| `src/core/gemini-model-profiles.ts` | Google | 타일 공식(`floor(min/1.5)` 크롭 단위) + `media_resolution` 고정 비용 |

## Rendering

- `src/core/render.ts` — 구워 넣은(baked) 글리프 아틀라스(Spleen 5×8 +
  Unifont 폴백)를 통한 텍스트 → PNG 변환, `↵` 줄바꿈 센티널을 사용한
  리플로우, 프로덕션에서의 1비트 아틀라스(Fable에서 AA보다 더 나은 것으로
  측정됨).
- `src/core/render-cache.ts` — 결정론적 렌더의 LRU 메모이제이션(그렇지
  않으면 정적 슬랩 + 고정된 히스토리 청크가 모든 요청마다 다시
  렌더링됨).
- `src/core/history.ts` — 오래된 턴을 append-only 방식의 고정된 이미지
  청크로 압축하며, 이는 바이트 단위로 동일하게 유지되어 프롬프트 캐싱이
  계속 적중하게 합니다.
- `src/core/png.ts` — 최소한의 결정론적 PNG 인코더(네이티브 의존성
  없음).

## Guard rails

- 모델 허용 목록(`src/core/applicability.ts`): 판독 벤치마크를 통과한
  모델만 이미지화되며, 나머지는 바이트 단위로 동일하게 그대로 통과합니다.
- 바이트 단위로 정확한 값(SHA, ID)은 이미지 옆의 팩트시트에 텍스트로
  동행합니다(`src/core/factsheet.ts`); `emitRecoverable`을 통한 복원
  가능한 원본.
- 네이티브 타입 지정 도구(`type !== 'custom'`)는 절대 다시 쓰이지
  않습니다(400 가드).

## Benchmarks & receipts

`benchmarks/`에는 README의 모든 숫자를 만들어낸 두 하네스가 있습니다 —
[benchmarks/README.md](../../benchmarks/README.md)를 참고하세요.
