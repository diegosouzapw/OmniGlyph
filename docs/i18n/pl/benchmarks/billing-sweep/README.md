# Sweep rozliczeń wizji Anthropic

🌐 Przetłumaczono: [wszystkie języki](../../../README.md)

**Dlaczego istnieje:** bramka rentowności jest bezpieczna tylko wtedy, gdy
szacunek kosztu jest *dokładny*. Wzór, który myli się choćby odrobinę,
przekształciłby bloki, które w rzeczywistości kosztują więcej. Dlatego ten
sweep przypina wzór do rzeczywistych liczb API, zanim ten trafi do produkcji
— do **zerowej reszty**.

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

Darmowy sweep `count_tokens`, który rozstrzyga dwa otwarte pytania
geometryczne:

1. **Wzór** — czy API rozlicza płatki `ceil(w/28) × ceil(h/28)` (aktualna
   dokumentacja), czy wycofane `w·h/750`? Zestaw sond rozdziela oba wzory o
   25–180 tokenów na wiersz.
2. **Poziom** — czy `claude-fable-5` otrzymuje limity wysokiej rozdzielczości
   (długa krawędź ≤ 2576 px, ≤ 4784 tokenów wizualnych)? Wiersz
   `page-old-1928x1928` jest rozstrzygający: ≈ **4761** zmierzone oznacza
   WYSIWYG wysokiej rozdzielczości (stara duża strona przenosi ~3,3× więcej
   znaków na obraz niż dzisiejsza 1568×728, przy tym samym stosunku
   znaki/token); ≈ **1521** oznacza resample poziomu standardowego, a
   1568×728 pozostaje poprawne.

Kontekst: sweep z 2026-07-01 stojący za obecną stroną 1568×728 (audyt
czytelności, 2026-07-01) był mierzony na `claude-sonnet-4-5` — modelu
poziomu standardowego — podczas gdy produkcja celuje w Fable 5, który
dokumentacja wizji umieszcza w poziomie wysokiej rozdzielczości. Ten sam
audyt zmierzył też obecną stronę na 1460 tokenów: bliżej wzoru płatków
(1456) niż /750 (1522), co sugerowało, że API już przeszło na rozliczanie
płatkami.

## Uruchomienie

```bash
pnpm run build                              # dist/ jako wymóg wstępny (jak przy każdym evalu)
node benchmarks/billing-sweep/run.mjs --dry-run   # tylko przewidywania, bez klucza, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Musi trafiać bezpośrednio do API — nigdy przez proxy OmniGlyph, który
przekształciłby treść. `count_tokens` jest darmowe; pełny sweep wykonuje
~25 zapytań.

## Odczytywanie wyniku

Per model, każdy wiersz sondy pokazuje zmierzone tokeny obrazu (z obrazem
minus bazowa linia tylko tekstowa) względem wszystkich czterech przewidywań
(`patch`/`legacy750` × `standard`/`highres`); podsumowanie rankinguje
hipotezy według średniej bezwzględnej reszty. `--probe-multi` sprawdza limit
per obraz (2×1092² ≈ 2×1521); `--probe-20plus` sprawdza regułę >20 obrazów
(bok >2000 px musi być odrzucony, nie zmniejszony). Wiersze trafiają do
`results/*.jsonl`; matematyka przewidywań znajduje się w `formulas.mjs`,
przypięta przez `tests/billing-sweep-formulas.test.ts`.

## Po werdykcie

- Wzór płatków potwierdzony → przenieść PR #27 OmniGlyph (dokładne
  tłumaczenie zmiany rozmiaru) i dopasować matematykę bramki
  `ANTHROPIC_PIXELS_PER_TOKEN` w `src/core/transform.ts`.
- Poziom wysokiej rozdzielczości potwierdzony na Fable → ponownie wprowadzić
  geometrię strony per poziom (strony klasy 1928×1928 dla Fable/Opus
  4.8/Sonnet 5, 1568×728 dla standardu), odzwierciedlając sposób, w jaki
  ścieżka GPT już zachowuje własne `GPT_MAX_HEIGHT_PX`.
