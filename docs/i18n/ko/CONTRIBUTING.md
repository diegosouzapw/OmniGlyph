# Contributing to OmniGlyph

관심 가져주셔서 감사합니다! 이 프로젝트에는 협상 불가능한 두 가지 문화
규칙이 있습니다 — 이 규칙들이 README의 모든 숫자를 신뢰할 수 있는 이유입니다.

## 규칙 1 — 엄격한 TDD

모든 프로덕션 코드는 먼저 실패한 테스트에서 태어납니다:

1. 테스트를 작성하고 **올바른 이유로 실패하는 것을 확인**합니다.
2. 통과시키기 위한 최소한의 코드를 작성합니다.
3. 그린 상태를 유지하며 리팩터링합니다.

전체 기준은 다음과 같습니다: `pnpm run typecheck && pnpm test && pnpm run build`
— 세 가지 모두, 항상(docs 링크 린트와 리브랜드 가드는
`tests/docs-integrity.test.ts`를 통해 `pnpm test` 내부에서 실행됩니다).

## 규칙 2 — 주장보다 측정이 먼저

기하 구조, 아틀라스, 과금 공식, 또는 모델 범위에 대한 어떤 변경도 측정된
숫자 없이는 반영되지 않습니다. 이 저장소는 이 원칙을 중심으로 구축되어
있습니다:

- 과금 비용 → `benchmarks/billing-sweep/`로 증명합니다(`count_tokens`는
  무료이며, 기대되는 잔차는 0입니다).
- 가독성 → `benchmarks/density-frontier/`로 증명합니다(arm당 n≥30,
  결정론적 채점, `benchmarks/*/results/`에 커밋된 JSONL 근거).
- 프로덕션 기본값을 변경하기 위한 수용 기준: gist == 텍스트 베이스라인
  **그리고** 은밀한 정확-문자열 오류 0건 **그리고** 양(positive)의 절감.

숫자가 없는 가설은 `docs/ROADMAP.md`에 가설로 들어갑니다 — 절대 README에
사실로 들어가지 않습니다. "당연해 보이는" 아이디어 두 가지가 이미 데이터로
반박된 바 있습니다(고해상도 페이지, 안티에일리어싱 아틀라스). 이 프로세스는
작동합니다.

## Setup

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI는 20/22/24를 테스트), pnpm 10 (package.json의
`packageManager`로 고정됨).

## Structure

| 폴더 | 규칙 |
|---|---|
| `src/core/` | 런타임에 종속되지 않음(Web API만 사용 — Node와 Workers 모두에서 실행) |
| `src/node.ts` / `src/worker.ts` | 호스트 배관(plumbing)만 담당 |
| `benchmarks/` | 재실행 가능한 하네스; JSONL 결과는 근거이며 커밋됩니다 |
| `docs/` | benchmarks/ (숫자), architecture/ (지도), ROADMAP (가설), ops/ (OmniRoute) |

## Commits and PRs

- 컨벤셔널 커밋(`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`, `test:`,
  `chore:`), 본문에는 관련 숫자와 함께 *이유*를 설명합니다.
- 작고 초점이 명확한 PR; 동작 변경에는 이를 고정하는 테스트와, 해당되는
  경우 이를 정당화하는 벤치마크가 함께 옵니다.
- 클라이언트의 `cache_control` 블록을 다시 쓰지 마세요, 논의 없이 런타임
  의존성을 추가하지 마세요(core는 의도적으로 의존성이 적습니다), 렌더
  경로에서 `Math.random`/타임스탬프를 사용하지 마세요(결정성은 바이트
  동일성으로 테스트되는 엄격한 불변식입니다).
