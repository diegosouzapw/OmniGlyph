# OmniGlyph-க்கு பங்களிப்பது

உங்கள் ஆர்வத்திற்கு நன்றி! இந்த திட்டத்திற்கு இரண்டு பேரம்பேசவியலாத culture விதிகள் உள்ளன —
அவைதான் README-இல் உள்ள ஒவ்வொரு எண்ணையும் நம்பக்கூடியதாக மாற்றும் காரணம்.

## விதி 1 — Strict TDD

அனைத்து production code-உம் முதலில் தோல்வியடைந்த ஒரு testலிருந்து பிறக்கிறது:

1. testஐ எழுதி **அது சரியான காரணத்திற்காக தோல்வியடைவதைப் பாருங்கள்**.
2. அதைப் pass செய்ய தேவையான குறைந்தபட்சத்தை எழுதுங்கள்.
3. green ஆக இருக்கும்போதே refactor செய்யுங்கள்.

முழு bar: `pnpm run typecheck && pnpm test && pnpm run build` — எப்போதும்
மூன்றும் (docs link-lint மற்றும் rebrand guard `pnpm test`க்குள் இயங்குகின்றன
`tests/docs-integrity.test.ts` மூலமாக).

## விதி 2 — கூற்றுகளுக்கு முன் அளவீடு

Geometry, atlas, billing formula, அல்லது model scopeக்கான எந்த மாற்றமும்
அளவிடப்பட்ட ஒரு எண் இல்லாமல் இறங்காது. இந்த repository இந்த
கட்டுப்பாட்டைச் சுற்றி கட்டமைக்கப்பட்டுள்ளது:

- Billing செலவு → `benchmarks/billing-sweep/`-உடன் நிரூபியுங்கள் (`count_tokens`
  இலவசம்; எதிர்பார்க்கப்படும் residual: பூஜ்ஜியம்).
- Legibility → `benchmarks/density-frontier/`-உடன் நிரூபியுங்கள் (n≥30 ஒரு armக்கு,
  deterministic scoring, `benchmarks/*/results/`-இல் commit செய்யப்பட்ட JSONL ஆதாரங்கள்).
- ஒரு production defaultஐ மாற்றுவதற்கான acceptance bar: gist == text baseline
  **மற்றும்** பூஜ்ஜிய silent exact-string errors **மற்றும்** நேர்மறை savings.

எண்கள் இல்லாத hypothesesகள் `docs/ROADMAP.md`-க்கு hypothesesஆகச் செல்கின்றன — ஒருபோதும்
README-க்கு உண்மைகளாக அல்ல. இரண்டு "தெளிவான" யோசனைகள் ஏற்கனவே data மூலம் மறுக்கப்பட்டுள்ளன
(high-res பக்கம், anti-aliased atlas); இந்த செயல்முறை வேலை செய்கிறது.

## அமைப்பு

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # watch modeஇல் local proxy
```

Node ≥18 (CI 20/22/24 testஆகிறது), pnpm 10 (package.jsonஇல் `packageManager`
மூலம் pinned).

## கட்டமைப்பு

| folder | விதி |
|---|---|
| `src/core/` | runtime-agnostic (Web APIs மட்டும் — Node மற்றும் Workersஇல் இயங்குகிறது) |
| `src/node.ts` / `src/worker.ts` | host plumbing மட்டும் |
| `benchmarks/` | மறுஇயக்கக்கூடிய harnesses; JSONL results ஆதாரங்கள், committed |
| `docs/` | benchmarks/ (எண்கள்), architecture/ (map), ROADMAP (hypotheses), ops/ (OmniRoute) |

## Commits மற்றும் PRs

- Conventional commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), relevant எண்களுடன் *ஏன்* என்பதை விளக்கும் body.
- சிறிய, focused PRs; behavior மாற்றங்கள் அவற்றை pin செய்யும் testஉடனும்,
  பொருந்தும்போது அவற்றை நியாயப்படுத்தும் benchmarkஉடனும் வருகின்றன.
- Client-இன் `cache_control` blocksஐ மறுஎழுதாதீர்கள், விவாதம் இல்லாமல் runtime
  dependencies சேர்க்காதீர்கள் (core வேண்டுமென்றே dependency-light), render
  pathsஇல் `Math.random`/timestamps பயன்படுத்தாதீர்கள் (determinism ஒரு
  கடினமான invariant, byte-identity மூலம் tested).
