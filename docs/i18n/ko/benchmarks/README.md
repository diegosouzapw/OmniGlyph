# Benchmarks

OmniGlyph가 주장하는 모든 숫자는 아래 두 하네스 중 하나에서 나옵니다 —
재실행 가능하고, 가능한 한 결정론적이며, `*/results/*.jsonl`에 답변별
원시 근거가 있습니다. 통합 분석:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — 이미지는 실제로 얼마의 비용이 드는가?

라이브 Anthropic API에 대한 무료 `count_tokens` 프로브로, 폐기된
`w·h/750` 공식과 현재의 28px 패치 모델을 모델 2개 × 해상도 티어 2개에
걸친 11개 프로브 기하 구조에서 비교합니다.

**결과 (2026-07-05): 패치 모델은 모든 프로브에서 잔차 0으로 정확히
맞습니다** — 티어별 리사이즈 이후 `⌈w/28⌉ × ⌈h/28⌉`에 이미지 블록당
고정 +3/+4토큰을 더해 과금됩니다. 프로덕션 페이지(1568×728)는 정확히
1,460토큰이 들고 28,080자를 담아 ≈ **19.2자/토큰**이며, 밀도 높은
텍스트로는 ~2자/토큰입니다.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — 모델이 실제로 이를 읽을 수 있는가?

렌더 설정, 페이지 기하 구조, 글리프 아틀라스, 프로바이더에 걸친 비용
(오프라인, 정확) × 판독 정확도(라이브). 코퍼스는 정확한 문자열 니들(hex
ID, camelCase, 숫자열)과 **측정된 글리프 혼동 가능 쌍으로 만들어진
near-miss 방해 요소**를 심어 놓아, 은밀한 컨퓨불레이션을 단순히 오답으로
집계하는 것이 아니라 실제로 탐지합니다. 채점은 결정론적입니다(LLM 심판
없음): `correct` / `abstained`(정직한 `ILEGIVEL`) / `silent_wrong` /
`no_answer`.

**주요 결과** (arm당 n=30):

| arm | 정확 판독 | 비고 |
|---|---:|---|
| Fable 5 · 표준 페이지 · 1비트 아틀라스 (프로덕션) | **30/30** | 오류 0건, 컨퓨불레이션 0건 |
| Fable 5 · 표준 페이지 · AA 아틀라스 (구 기본값) | 25/30 | 정직한 기권 5건 — 프로덕션이 1비트로 전환한 이유 |
| Fable 5 · 고해상도 1928² 페이지 | 1–2/30 | 3.3배로 과금되지만 인코더에 의해 리샘플됨 — 과금 함정, 활성화되지 않음 |
| Opus 4.8 · 10×16 글리프 | 23–26/30 | 옵트인 세이프 모드 |
| GPT-5.5 · 768px 스트립 (두 아틀라스 모두) | 0/60 | + 자체 텍스트 대조군(30/30, 62토큰) 대비 출력 토큰 인플레이션 약 40배 |
| Gemini 2.5-flash (부분, 쿼터) | 0/26 | 기권 대신 컨퓨불레이션 |

전송 계층 3가지: 직접 API(`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/
`GEMINI_API_KEY`), OpenRouter(`OPENROUTER_API_KEY`), `--via-cli`(Claude
Code 구독 — $0). 어렵게 배운 주의점: 중간 계층(OpenRouter, CLI Read
도구)은 큰 이미지를 리샘플합니다; 가독성에 대해 신뢰할 수 있는 것은
직접 API 결과뿐입니다.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

순수한 부분(코퍼스, 채점, 비용 공식)을 고정하는 단위 테스트:
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
