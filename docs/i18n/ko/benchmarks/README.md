# Benchmarks

🌐 번역: [모든 언어](../../README.md)

OmniGlyph가 주장하는 모든 숫자는 아래 두 하네스 중 하나에서 나옵니다 —
재실행 가능하고, 가능한 한 결정론적이며, `*/results/*.jsonl`에 답변별
원시 근거가 있습니다. 통합 분석: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 절감 효과가 작동하는 방식 (그림 한 장으로)

프로바이더는 텍스트를 **토큰 단위로** 과금하지만, 이미지는 안에 얼마나
많은 텍스트가 담겨 있는지가 아니라 **그 크기(dimensions)로** 과금합니다.
표준 페이지 한 장은 텍스트가 아무리 촘촘해도 비용이 고정입니다:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

동일한 컨텍스트를 두 가지 방식으로 과금하면:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

이미지가 이기는 이유 — 토큰당 담기는 문자 수:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph는 정확한 계산이 이긴다고 말할 때만, 그리고 페이지를 읽는다고
증명된 모델에 대해서만 이 교체를 수행합니다. 아래 두 하네스가 각각의
절반을 증명합니다.

## 1. `billing-sweep/` — 이미지는 실제로 얼마의 비용이 드는가?

라이브 Anthropic API에 대한 무료 `count_tokens` 프로브로, 폐기된
`w·h/750` 공식과 현재의 28px 패치 모델을 모델 2개 × 해상도 티어 2개에
걸친 11개 프로브 기하 구조에서 비교합니다.

**결과 (2026-07-05): 패치 모델은 모든 프로브에서 잔차 0으로 정확히
맞습니다** — 티어별 리사이즈 이후 `⌈w/28⌉ × ⌈h/28⌉`에 이미지 블록당
고정 +3/+4토큰을 더해 과금됩니다. 프로덕션 페이지(1568×728)는 정확히
1,460토큰이 들고 28,080자를 담아 ≈ **19.2자/토큰**이며, 밀도 높은
텍스트로는 ~2자/토큰입니다.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

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

한눈에 보는 판독 정확도 — 이것이 **바로** fail-closed 모델 게이트를
그림으로 나타낸 것입니다:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

✅ arm만 출시됩니다. 판독이 나쁜 것은 무엇이든 *근거와 함께* 차단되며,
3단계 채점 방식은 확신에 차서 오답을 내놓는 모델(`silent_wrong`)이
정직하게 기권하는 모델(`ILEGIVEL`)보다 더 나쁘게 취급된다는 것을
의미합니다.

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
