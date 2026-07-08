# Benchmarks

Bawat numerong sinasabi ng OmniGlyph ay nagmula sa isa sa dalawang harness sa
ibaba — maaaring paulit-ulit na patakbuhin, deterministic kung saan
posible, na may hilaw na resibo kada sagot sa `*/results/*.jsonl`.
Pinagsama-samang pagsusuri: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — magkano ba talaga ang gastos ng isang imahe?

Libreng `count_tokens` probes laban sa live na API ng Anthropic, na
inihahambing ang retiradong formula na `w·h/750` laban sa kasalukuyang modelo
na 28 px-patch sa 11 probe geometry sa 2 modelo × 2 tier ng resolution.

**Resulta (2026-07-05): bagay ang patch model na may residual na ZERO sa
bawat probe** — sinisingil bilang `⌈w/28⌉ × ⌈h/28⌉` matapos ang resize kada
tier, dagdag ang fixed na +3/+4 tokens kada image block. Ang production page
(1568×728) ay tumatakbo nang eksaktong 1,460 tokens at may dalang 28,080
chars ≈ **19.2 chars/token** kumpara sa ~2 chars/token bilang siksik na text.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # mga prediksyon lamang, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, $0 pa rin (libre ang count_tokens)
```

## 2. `density-frontier/` — kaya bang basahin ito ng modelo?

Gastos (offline, eksakto) × katumpakan ng pagbasa (live) sa iba't ibang
render config, page geometry, glyph atlas, at provider. Nagtatanim ang
corpus ng exact-string needles (hex ids, camelCase, digit runs) dagdag ang
**near-miss distractors na binuo mula sa mga sinukat na glyph-confusability
pair** — kaya nakikita ang tahimik na confabulation, hindi lang binibilang na
mali. Deterministic ang scoring (walang LLM judge): `correct` / `abstained`
(tapat na `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Pangunahing resulta** (n=30 kada arm):

| arm | eksaktong pagbasa | mga tala |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | zero errors, zero confabulation |
| Fable 5 · standard page · AA atlas (lumang default) | 25/30 | 5 tapat na abstention — kaya lumipat ang production sa 1-bit |
| Fable 5 · high-res 1928² na pahina | 1–2/30 | sinisingil nang 3.3× ngunit encoder-resampled — ang billing trap, hindi pinagana |
| Opus 4.8 · 10×16 na glyphs | 23–26/30 | ang opt-in safe mode |
| GPT-5.5 · 768px strip (parehong atlas) | 0/60 | + ~40× na output-token inflation kumpara sa sarili nitong text control (30/30, 62 tok) |
| Gemini 2.5-flash (bahagya, quota) | 0/26 | nagko-confabulate sa halip na umatras |

Tatlong transport: direct API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), at `--via-cli` (isang subscription ng
Claude Code — $0). Babala na natutunan sa mahirap na paraan: ang mga
intermediary (OpenRouter, ang Read tool ng CLI) ay nire-resample ang
malalaking imahe; ang mga resulta ng direct API lamang ang authoritative
para sa legibility.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # talahanayan ng gastos, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # sa pamamagitan ng subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Mga unit test na nagpipin sa mga purong bahagi (corpus, scoring, mga formula
ng gastos): `tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
