# Benchmarkok

Minden szám, amit az OmniGlyph állít, a lenti két harness egyikéből
származik — újrafuttatható, ahol lehet determinisztikus, nyers
válaszonkénti bizonyítékokkal a `*/results/*.jsonl`-ban. Konszolidált
elemzés: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — mennyibe kerül valójában egy kép?

Ingyenes `count_tokens` próbák az élő Anthropic API ellen, amelyek
összehasonlítják a kivezetett `w·h/750` képletet a jelenlegi 28 px-es
patch-modellel 11 próba-geometrián, 2 modellen × 2 felbontási szinten.

**Eredmény (2026-07-05): a patch-modell NULLA maradékkal illeszkedik minden
próbára** — a számlázás `⌈w/28⌉ × ⌈h/28⌉` szintenkénti átméretezés után,
plusz egy fix +3/+4 token képblokkonként. Az éles oldal (1568×728) pontosan
1460 tokenbe kerül, és 28 080 karaktert hordoz ≈ **19,2 karakter/token**,
szemben a sűrű szöveg ~2 karakter/tokenjével.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — a modell valóban tudja OLVASNI?

Költség (offline, pontos) × olvasási pontosság (élő) render-konfigurációk,
oldalgeometriák, glifatlaszok és szolgáltatók között. A korpusz
pontos-string tűket ültet el (hex azonosítók, camelCase, számjegysorok)
plusz **near-miss elterelőket, a mért glif-összetéveszthetőségi párokból
építve** — így a néma konfabuláció is detektálva van, nem csak
hibásnak számolva. A pontozás determinisztikus (nincs LLM-bíró):
`correct` / `abstained` (őszinte `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Fő eredmények** (n=30 karonként):

| kar | pontos olvasás | megjegyzés |
|---|---:|---|
| Fable 5 · standard oldal · 1-bit atlasz (éles) | **30/30** | nulla hiba, nulla konfabuláció |
| Fable 5 · standard oldal · AA atlasz (régi alapérték) | 25/30 | 5 őszinte tartózkodás — miért állt át az éles az 1-bitre |
| Fable 5 · high-res 1928²-es oldal | 1–2/30 | 3,3×-szal számlázva, de az enkóder resample-eli — a számlázási csapda, nincs bekapcsolva |
| Opus 4.8 · 10×16-os glifek | 23–26/30 | az opt-in biztonságos mód |
| GPT-5.5 · 768px-es csík (mindkét atlasz) | 0/60 | + ~40×-es kimenet-token felfújás a saját szöveges kontrolljához képest (30/30, 62 token) |
| Gemini 2.5-flash (részleges, kvóta) | 0/26 | tartózkodás helyett konfabulál |

Három transzport: közvetlen API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), és `--via-cli` (egy Claude Code
előfizetés — 0 USD). A nehéz úton tanult figyelmeztetés: a közvetítők
(OpenRouter, a CLI Read eszköze) átméretezik a nagy képeket; csak a
közvetlen API eredményei irányadók az olvashatóságra.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

A tiszta részeket rögzítő unit tesztek (korpusz, pontozás, költségképletek):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
