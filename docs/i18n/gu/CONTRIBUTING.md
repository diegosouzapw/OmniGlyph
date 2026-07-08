# OmniGlyph માં યોગદાન આપવું

તમારા રસ બદલ આભાર! આ પ્રોજેક્ટના બે બિન-વાટાઘાટપાત્ર culture rules છે —
તે જ કારણ છે કે README માંની દરેક સંખ્યા પર વિશ્વાસ કરી શકાય છે.

## નિયમ 1 — Strict TDD

બધો પ્રોડક્શન કોડ પહેલા નિષ્ફળ ગયેલા ટેસ્ટમાંથી જન્મે છે:

1. ટેસ્ટ લખો અને **તેને યોગ્ય કારણસર નિષ્ફળ થતો જુઓ**.
2. તેને પાસ કરવા માટે ન્યૂનતમ કોડ લખો.
3. green રહીને refactor કરો.

પૂરો bar છે: `pnpm run typecheck && pnpm test && pnpm run build` — ત્રણેય,
હંમેશા (docs link-lint અને rebrand guard `tests/docs-integrity.test.ts` દ્વારા
`pnpm test` ની અંદર ચાલે છે).

## નિયમ 2 — દાવા પહેલા માપન

geometry, atlas, billing formula, અથવા model scope માં કોઈ ફેરફાર માપેલી
સંખ્યા વગર landing નથી થતો. Repository આ શિસ્ત આસપાસ બનેલી છે:

- Billing cost → `benchmarks/billing-sweep/` થી સાબિત કરો (`count_tokens`
  ફ્રી છે; અપેક્ષિત residual: શૂન્ય).
- Legibility → `benchmarks/density-frontier/` થી સાબિત કરો (n≥30 પ્રતિ arm,
  ડિટરમિનિસ્ટિક સ્કોરિંગ, `benchmarks/*/results/` માં commit થયેલા JSONL રસીદ).
- પ્રોડક્શન default બદલવા માટે acceptance bar: gist == text baseline
  **અને** zero silent exact-string errors **અને** positive savings.

સંખ્યા વગરના hypotheses `docs/ROADMAP.md` માં hypotheses તરીકે જાય છે — ક્યારેય
README માં facts તરીકે નહીં. બે "obvious" વિચારો ડેટા સાથે પહેલેથી જ ખોટા
સાબિત થયા છે (high-res page, anti-aliased atlas); આ પ્રક્રિયા કામ કરે છે.

## સેટઅપ

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI 20/22/24 ટેસ્ટ કરે છે), pnpm 10 (package.json માં
`packageManager` દ્વારા pinned).

## માળખું

| ફોલ્ડર | નિયમ |
|---|---|
| `src/core/` | runtime-agnostic (ફક્ત Web APIs — Node અને Workers પર ચાલે છે) |
| `src/node.ts` / `src/worker.ts` | ફક્ત host plumbing |
| `benchmarks/` | ફરીથી ચલાવી શકાય તેવા harnesses; JSONL results રસીદ છે, commit થયેલા |
| `docs/` | benchmarks/ (સંખ્યાઓ), architecture/ (નકશો), ROADMAP (hypotheses), ops/ (OmniRoute) |

## Commits અને PRs

- Conventional commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), body માં *શા માટે* સંબંધિત સંખ્યાઓ સાથે સમજાવેલું.
- નાના, focused PRs; behavior changes તેને pin કરતા test સાથે આવે છે અને,
  જ્યાં લાગુ પડે ત્યાં, તેને justify કરતા benchmark સાથે.
- Client ના `cache_control` blocks ને ફરીથી ન લખો, ચર્ચા વગર runtime
  dependencies ન ઉમેરો (core હેતુપૂર્વક dependency-light છે), render
  paths માં `Math.random`/timestamps નો ઉપયોગ ન કરો (determinism એક hard
  invariant છે, byte-identity દ્વારા tested).
