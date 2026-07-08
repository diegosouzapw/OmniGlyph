# Benchmarki

Każda liczba, którą deklaruje OmniGlyph, pochodzi z jednego z dwóch
poniższych zestawów — możliwych do ponownego uruchomienia, deterministycznych
tam, gdzie to możliwe, z surowymi dowodami odpowiedź po odpowiedzi w
`*/results/*.jsonl`. Skonsolidowana analiza:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — ile tak naprawdę kosztuje obraz?

Darmowe sondy `count_tokens` względem żywego API Anthropic, porównujące
wycofany wzór `w·h/750` z aktualnym modelem płatków 28 px w 11 geometriach
testowych na 2 modelach × 2 poziomach rozdzielczości.

**Wynik (2026-07-05): model płatków pasuje z resztą ZERO w każdej próbie**
— rozliczenie = `⌈w/28⌉ × ⌈h/28⌉` po zmianie rozmiaru per poziom, plus stały
narzut +3/+4 tokeny na blok obrazu. Strona produkcyjna (1568×728) kosztuje
dokładnie 1460 tokenów i przenosi 28 080 znaków ≈ **19,2 znaku/token** vs
~2 znaki/token jako gęsty tekst.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # tylko przewidywania, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # żywy sweep, wciąż $0 (count_tokens jest darmowe)
```

## 2. `density-frontier/` — czy model faktycznie potrafi to PRZECZYTAĆ?

Koszt (offline, dokładny) × dokładność odczytu (żywa) w konfiguracjach
renderowania, geometriach stron, atlasach glifów i dostawcach. Korpus
zasadza dokładne co do ciągu znaków needles (identyfikatory hex,
camelCase, ciągi cyfr) plus **dystraktory niemal identyczne zbudowane ze
zmierzonych par mylącego podobieństwa glifów** — dzięki czemu cicha
konfabulacja jest wykrywana, nie tylko liczona jako błąd. Ocena jest
deterministyczna (bez sędziego LLM): `correct` / `abstained` (uczciwe
`ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Wyniki nagłówkowe** (n=30 na ramię):

| ramię | dokładne odczyty | uwagi |
|---|---:|---|
| Fable 5 · strona standardowa · atlas 1-bit (produkcja) | **30/30** | zero błędów, zero konfabulacji |
| Fable 5 · strona standardowa · atlas AA (stary domyślny) | 25/30 | 5 uczciwych wstrzymań — dlatego produkcja przełączyła się na 1-bit |
| Fable 5 · strona wysokiej rozdz. 1928² | 1–2/30 | rozliczona 3,3× więcej, ale koder ją zresamplował — pułapka rozliczeniowa, nie włączona |
| Opus 4.8 · glify 10×16 | 23–26/30 | opcjonalny tryb bezpieczny |
| GPT-5.5 · pasek 768px (oba atlasy) | 0/60 | + ~40× zawyżenie tokenów wyjściowych względem własnej kontroli tekstowej (30/30, 62 tok) |
| Gemini 2.5-flash (częściowe, limit) | 0/26 | konfabuluje zamiast się wstrzymać |

Trzy transporty: bezpośrednie API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/
`GEMINI_API_KEY`), OpenRouter (`OPENROUTER_API_KEY`) i `--via-cli`
(subskrypcja Claude Code — $0). Nauka wyciągnięta w trudny sposób:
pośrednicy (OpenRouter, narzędzie Read w CLI) zmniejszają duże obrazy;
tylko wyniki bezpośredniego API są autorytatywne dla czytelności.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # tabela kosztów, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # przez subskrypcję, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Testy jednostkowe przypinające części czyste (korpus, ocena, wzory kosztów):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
