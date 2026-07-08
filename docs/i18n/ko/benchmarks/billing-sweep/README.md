# Anthropic 비전 과금 스윕

🌐 번역: [모든 언어](../../../README.md)

**존재하는 이유:** 수익성 게이트는 비용 추정치가 *정확할* 때만 안전합니다.
공식이 조금이라도 어긋나면 실제로는 비용이 더 드는 블록을 변환하게
됩니다. 그래서 이 스윕은 프로덕션에 배포되기 전에 공식을 API의 실제
숫자에 맞춰 고정합니다 — **잔차 0**으로.

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

두 가지 열려 있는 기하 구조 질문을 판정하는 무료 `count_tokens` 스윕입니다:

1. **공식** — API는 `ceil(w/28) × ceil(h/28)` 패치(현재 문서 기준)로
   과금하는가, 아니면 폐기된 `w·h/750`으로 과금하는가? 프로브 집합은 행당
   25–180토큰 차이로 이 둘을 구분합니다.
2. **티어** — `claude-fable-5`는 고해상도 상한(긴 변 ≤ 2576px, ≤ 4784
   비주얼 토큰)을 받는가? `page-old-1928x1928` 행이 판정자입니다:
   측정치 ≈ **4761**이면 고해상도 WYSIWYG를 의미하며(오래된 큰 페이지는
   같은 문자/토큰 비율에서 오늘날의 1568×728보다 이미지당 ~3.3배 더 많은
   문자를 담습니다); ≈ **1521**이면 표준 티어 리샘플을 의미하고, 그러면
   1568×728이 여전히 옳습니다.

맥락: 현재의 1568×728 페이지 뒤에 있는 2026-07-01 스윕(가독성 감사,
2026-07-01)은 표준 티어 모델인 `claude-sonnet-4-5`에서 측정되었지만,
프로덕션은 비전 문서에서 고해상도 티어로 분류하는 Fable 5를 대상으로
합니다. 그 감사는 또한 현재 페이지를 1460토큰으로 측정했는데, 이는 /750의
1522보다 패치 공식의 1456에 더 가까워, API가 이미 패치 과금으로 전환했을
가능성을 시사합니다.

## 실행

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

API를 **직접** 호출해야 합니다 — 바디를 변환하게 되는 OmniGlyph 프록시를
절대 거치지 마세요. `count_tokens`는 무료입니다; 전체 스윕은 약 25건의
요청을 만듭니다.

## 출력 읽기

모델별로 각 프로브 행은 측정된 이미지 토큰(이미지 포함 값에서 텍스트
전용 베이스라인을 뺀 값)을 네 가지 예측
(`patch`/`legacy750` × `standard`/`highres`) 모두와 비교해 보여줍니다;
요약은 평균 절대 잔차로 가설의 순위를 매깁니다. `--probe-multi`는
이미지당 상한(2×1092² ≈ 2×1521)을 확인합니다; `--probe-20plus`는
20개 초과 이미지 규칙(2000px를 초과하는 변은 리샘플이 아니라 거부되어야
함)을 확인합니다. 행은 `results/*.jsonl`에 남으며, 예측 수식은
`formulas.mjs`에 있고 `tests/billing-sweep-formulas.test.ts`로
고정됩니다.

## 판정 이후

- 패치 공식이 확인되면 → OmniGlyph PR #27(정확한 리사이즈 변환)을 포팅하고
  `src/core/transform.ts`의 `ANTHROPIC_PIXELS_PER_TOKEN` 게이트 수학을
  맞춥니다.
- Fable에서 고해상도 티어가 확인되면 → GPT 경로가 이미 자체
  `GPT_MAX_HEIGHT_PX`를 유지하는 방식을 본받아, 티어별 페이지 기하 구조를
  다시 도입합니다(Fable/Opus 4.8/Sonnet 5용 1928×1928급 페이지, 표준용
  1568×728).
