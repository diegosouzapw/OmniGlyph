# density-frontier — koszt × dokładność per rozdzielczość

🌐 Przetłumaczono: [wszystkie języki](../../../README.md)

Zestaw, który mierzy **granicę Pareto między kosztem a czytelnością**
renderów tekst→obraz, per dostawca (Anthropic / OpenAI / Gemini), geometria
strony, komórka glifu i styl atlasu.

Tańsze (gęstsze) strony przenoszą więcej znaków na token, ale w pewnym
momencie przestają być czytelne. Konfiguracja może trafić do produkcji tylko
tam, gdzie spełnione są **oba** warunki — koszt jest niski *i* model wciąż
odczytuje ją bezbłędnie:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

Każda odpowiedź jest oceniana dokładnie na jeden z trzech wyników — środkowy
jest tym, co czyni bramkę wiarygodną:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Konfiguracja, która produkuje choć jedno 🔴, jest dyskwalifikowana,
niezależnie od tego, jak tania.

Centralna asymetria: od sweepu rozliczeniowego (2026-07-05,
`benchmarks/billing-sweep/`), **koszt jest dokładnie przewidywalny offline**
— płatki 28 px + 4/blok na Anthropic (`src/core/anthropic-vision.ts`),
profile patch/kafelek na OpenAI (`src/core/openai.ts`), kafelki/
media_resolution na Gemini (`gemini-cost.ts`). Tylko **dokładność odczytu**
wymaga API.

## Projekt

- **Korpus** (`corpus.ts`): gęste wypełnienie w stylu log/JSON + zasadzone
  needles z klas, które macierz mylącego podobieństwa wskazuje jako
  zawodne (hex 12-znakowy, camelCase, cyfry 6/8/5/3) + **dystraktory niemal
  identyczne** zbudowane ze zmierzonych par mylącego podobieństwa. Jeśli
  model odpowiada dystraktorem, pomyłka była *przewidziana* — to właśnie
  ten cichy tryb awarii jest wykrywany, nie tylko liczony jako błąd.
  Deterministyczny (mulberry32).
- **Konfiguracje** (`configs.ts`): wyselekcjonowana siatka — strony
  standardowe 1568×728 vs wysoka rozdz. 1928×1928 (A/B, które rozstrzyga
  geometrię per poziom), AA vs 1-bit (rozwiązuje sprzeczność gęstego
  renderu), komórka 7×10/10×16 (tryb bezpieczny Opus), pasek GPT i dwa
  zakłady Gemini (≤384² = 258 płaskie; `media_resolution: low` = 280 stałe
  → ~116 znaków/token *jeśli* czytelne).
- **Wynik** (`score.ts`): deterministyczne dopasowanie dokładne, bez
  sędziego LLM. Trzy wyniki: `correct` / `abstained` (sentinel ILEGIVEL —
  uczciwe niepowodzenie) / `silent_wrong` (niebezpieczny tryb), z flagą
  dystraktora.

## Uruchomienie

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # tabela kosztów, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × konfiguracja × próba
```

Konkretne konfiguracje: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Odpowiedzi trafiają do `results/*.jsonl` (jedna linia na pytanie, z surową
odpowiedzią do audytu).

## Poprzeczka akceptacji (odziedziczona z PR-ów upstream #35/#36)

Konfiguracja staje się domyślną wartością produkcyjną tylko jeśli: **gist
== bazowa linia tekstowa** ORAZ **zero cichych błędów w dokładnych ciągach
znaków** ORAZ **dodatnie oszczędności**. Pierwsze obowiązkowe uruchomienie
to `anthropic-std-5x8-aa` vs `anthropic-hires-5x8-aa` na Fable — punktowa
kontrola czytelności dużej strony przed włączeniem poziomu wysokiej
rozdzielczości.

## `--via-omniroute` — e2e przez OmniRoute (P3: dowód braku degradacji)

Transporty powyżej renderują tekst→PNG **w zestawie testowym** i wysyłają
obrazy. `--via-omniroute` robi coś przeciwnego, co jest ścieżką produkcyjną:
wysyła **gęsty tekst** do działającej instancji OmniRoute, pozwala, aby
silnik **`omniglyph` wyrenderował** strony i przekazał je do Anthropic, oraz
mierzy odczyty + oszczędności. Jeśli odczyty pozostają takie same jak na
bezpośredniej trasie **i** OmniRoute raportuje kompresję, udowodnione jest,
że renderowanie + przekazywanie OmniRoute **nie degraduje** stron.

Wymagania wstępne (operacyjne):

1. **OmniRoute działające** (`npm run dev`, domyślnie
   `http://localhost:20128`).
2. **Dostawca Anthropic** skonfigurowany w OmniRoute z **prawdziwym kluczem**
   (trasa bezpośrednia — bramka `providerTransport==='direct'` przechodzi
   tylko dla dostawcy `anthropic`).
3. Silnik **`omniglyph` WŁĄCZONY** w konfiguracji kompresji OmniRoute
   (`config.engines.omniglyph.enabled = true`) — nagłówek
   `engine:omniglyph` uruchamia się tylko przy włączonym silniku. (Silnik
   jest `stable:false`/preview; włącz go jawnie.)
4. **Klucz API OmniRoute** w `OMNIROUTE_API_KEY` (ten, którego klient
   używa do uwierzytelnienia w OmniRoute, nie ten Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<twój-klucz-omniroute> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Każda odpowiedź zapisuje `omnirouteSavings: { originalTokens,
compressedTokens, savingsPercent }` (z nagłówka odpowiedzi
`X-OmniRoute-Compression`) w JSONL; wiersz tabeli pokazuje, ile odpowiedzi
wróciło skompresowanych + medianę oszczędności. **Poprzeczka P3**: te same
trafienia dosłowne/gist co na trasie bezpośredniej (brak degradacji) **z**
niepustym `omnirouteSavings` (dowodząc, że render się odbył, a nie odczyt
surowego tekstu). Jeśli pojawi się `did NOT compress`, silnik nie jest
włączony w OmniRoute (lub treść nie przeszła bramek zamkniętych w razie
awarii).

Testy dla części czystych: `tests/density-frontier.test.ts` (zawiera
`buildOmnirouteRequest` i `parseCompressionSavings` z transportu
via-omniroute).
