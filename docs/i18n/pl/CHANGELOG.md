# Dziennik zmian

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · wersjonowanie semantyczne.

## [1.0.0] — 2026-07-07

Pierwsze publiczne wydanie.

### Produkt

- **Proxy kompresujący kontekst jako obraz**: przepisuje rozbudowane części
  każdego zapytania LLM (system prompt, dokumentacja narzędzi, stara historia,
  duże wyniki narzędzi) na gęste strony PNG 1-bit, zanim opuszczą Twoją
  maszynę. Lokalny serwer Node i host Cloudflare Workers.
- **Dokładna matematyka rozliczeń per dostawca** (`src/core/`): płatki 28px
  Anthropic + narzut 3–4 tokenów/blok (własny sweep, zerowa reszta), wzory
  OpenAI i Gemini zweryfikowane wobec oficjalnej dokumentacji. Eksportowane
  w rdzeniu pakietu (`anthropicImageTokens`, `resolveAnthropicVisionTier`,
  limity poziomów).
- **Zmierzona konfiguracja renderowania produkcyjnego**: gęsty atlas glifów
  1-bit (bez antyaliasingu), strony poziomu standardowego — każdy wybór
  poparty dowodem z benchmarku w `benchmarks/*/results/`.
- **Zestawy benchmarków** (`benchmarks/`): billing-sweep (rozliczanie tokenów)
  i density-frontier (granica dokładności odczytu w modelach/gęstościach),
  możliwe do ponownego uruchomienia przez API, OpenRouter, Claude Code CLI
  lub przez OmniRoute (`--via-omniroute`).
- **Ponawianie przy odmowie**: sniffer SSE/JSON odtwarza oryginalne
  zapytanie, gdy model odmawia renderowanej strony (wyłącznik
  `retryRefusalWithOriginal`).
- **Pamięć podręczna LRU renderowania** dla deterministycznych stron.
- **Silnik OmniRoute**: dostarczany jako silnik kompresji `omniglyph` w
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (tryb pojedynczy
  i potok w stosie), z bramkami zamkniętymi w razie awarii i rozliczaniem
  tokenów świadomym obrazów.

### Liczby (wszystkie odtwarzalne)

- Przykładowy render UI: 1015 znaków → PNG 438×120, 254 → 84 tokeny
  (**66,9% oszczędności**).
- Standardowa strona 1568×728 = 1456 tokenów obrazu niezależnie od tego,
  ile tekstu przenosi.
- Claude odczytuje gęste strony 1-bit ze 100% skutecznością przy gęstości
  produkcyjnej; Opus 4.8 odczytuje 77–87% przy 10×16.

### Decyzje negatywne (zmierzone, nie opinie)

- **Poziom wysokiej rozdzielczości to pułapka rozliczeniowa**: strona 1928²
  jest rozliczana WYSIWYG, ale koder nie otrzymuje pełnej rozdzielczości —
  oba poziomy renderują strony standardowe.
- **GPT-5.5 odrzucony**: 0/60 odczytów gęstego paska i ~40× zawyżenie
  ukończenia względem kontroli tekstowej.
- **gpt-4o-mini nigdy nie jest przekształcany na obraz** (próg 2833/5667
  tokenów czyni to nieopłacalnym).
- **Gemini 2.5-flash konfabuluje** zamiast się wstrzymać na gęstych stronach
  (0/26) — oczekuje na ponowny test z płatnym limitem.
