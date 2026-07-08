# OmniGlyph — Skonsolidowane pomiary (2026-07-05)

🌐 Przetłumaczono: [wszystkie języki](../../../README.md)

Wszystko ZMIERZONE w tej sesji, ze źródłem i n; hipotezy wyraźnie oddzielone
na końcu. Dowody: `benchmarks/billing-sweep/results/` i
`benchmarks/density-frontier/results/` (JSONL per odpowiedź).

## TL;DR — cały wynik w dwóch paskach

**Koszt** — jedna standardowa strona 1568×728 mieści 28 080 znaków za
płaskie 1460 tokenów; ten sam tekst wysłany surowo kosztuje ~10× więcej:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Dokładność** — ale tylko tam, gdzie model faktycznie odczytuje stronę.
Bramka zamyka się w razie awarii; wysyłany jest tylko wiersz ✅:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Reszta tego dokumentu to dowody stojące za tymi dwoma paskami.

## 1. Rozliczenia Anthropic (bezpośrednie count_tokens, $0, 11 geometrii × 2 modele)

Potwierdzony wzór: `tokens = ceil(w/28) × ceil(h/28)` po zmianie rozmiaru
per poziom, **+3/blok (Fable 5) / +4/blok (Sonnet 4.5)** — ZEROWA reszta we
wszystkich wierszach.

| sonda | wymiary | Fable 5 (wysoka rozdz.) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| kotwica dokumentu | 1092×1092 | 1524 | 1525 |
| kotwica dokumentu | 1000×1000 | 1299 | 1300 |
| strona standardowa | 1568×728 | 1459 | 1460 |
| **duża strona** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| sufit wysokiej rozdz. | 1960×1960 | 4764 (limit) | 1525 |
| wysoka rozdz., długa krawędź | 2576×1204 | 3959 | 1516 |
| wysoki pasek | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 obrazów) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→zmniejszenie, NIE odrzucone w count_tokens) | 3585 |

Wyprowadzone decyzje (wdrożone): dokładna bramka per płatek; poziom per
model (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = wysoka rozdz.); `cols` 313→312.

## 2. Dokładność odczytu (density-frontier, needles hex/camelCase/cyfra + dystraktory)

### Macierz 2×2 Fable 5 — przez CLI/subskrypcję, n=30/ramię, ten sam korpus (~16,6 tys. znaków)

| strona × atlas | dokładne | wstrzymania (ILEGIVEL) | ciche błędy |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| wysoka rozdz. 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| wysoka rozdz. 1928×1928 · AA | 0/30 | 29 | 1 (przewidziane przez macierz) |

→ **1-bit > AA na obu stronach; zero konfabulacji na 120 pytań.**
ZASTOSOWANE: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ wysoka rozdz. dociera zdegradowana przez resample transportu (zobacz
H1/H3) — 67% to podłoga, nie sufit.

### Opus 4.8 — przez CLI/subskrypcję, n=30/ramię

| konfiguracja | dokładne | wstrzymania | błędy |
|---|---:|---:|---:|
| wysoka rozdz. · komórka 10×16 | **26/30 (87%)** | 0 | 4 (cyfry) |
| standard · komórka 5×8 | 0/30 | 30 | 0 |

→ Załamanie krzywej Opus potwierdzone naszym n (upstream zmierzył 95% przy
10×16 z n=20). „Tryb bezpieczny Opus” jest wykonalny: 10×16 na dużej
stronie ≈ 1,7 znaku na token obrazu na korpusie testowym.

### Przez OpenRouter (ten sam korpus/pytania) — nierozstrzygające dla czytelności

| zmierzony fakt | liczba |
|---|---|
| content_filter na pytaniach transkrypcyjnych (strony standardowe) | 60/60 (100%) |
| content_filter na stronach wysokiej rozdz. | 5-6/30 (~20%) |
| Fable wysoka rozdz.: wstrzymania + błędy | 20 ILEGIVEL + 5 błędów (2 przewidziane) |
| Opus 10×16 (przed wyczerpaniem kredytów) | 7/9 dokładne (78%) |
| pomyłki przewidziane przez macierz mylącego podobieństwa | 4→a, 0→8, wielkość liter S/s |

### Porównanie transportów (to samo pytanie, ta sama treść)

| transport | filtr/odmowa | duża strona czytelna? |
|---|---|---|
| Bezpośrednie API (n=9, przed wyczerpaniem kredytów) | 0 | nietestowane |
| OpenRouter | ~100% std / ~20% wysoka rozdz. | nie (podejrzewany: resample) |
| Claude Code CLI (subskrypcja) | 0 content_filter; ~50% dużych partii zawieszonych (rozwiązane przez porcje po 10 + ponowienie) | nie (podejrzewane: Read zmniejsza rozmiar) |

## 3. Koszt per dostawca (offline, dokładny — PEŁNE strony, teoretyczny)

| dostawca · strona | tokeny/strona | znaki/strona | **znaki/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (wszystkie modele) | 1460 | 28 080 | **19,2** | zmierzone |
| Anthropic wysoka rozdz. 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92 160 | **19,3** (3,3× mniej obrazów) | rozliczenie zmierzone; czytelność oczekująca (H1) |
| GPT-5 (kafelek) pasek 768×2048 | 1190 | ~38 760 | **32,6** | audytowana dokumentacja |
| GPT-5.4/5.5 (patch, original) do 1568×5984 | ~9163 | ~233 tys. | **25,4** | dokumentacja; czytelność nietestowana |
| gpt-4o-mini | 48 169/pasek | — | **0,8 — NIGDY nie przekształcać na obraz** | dokumentacja (błąd D2 naprawiony) |
| Gemini kafelek 1533×1152 (natywna jednostka przycięcia 768) | 1032 | 43 615 | **42,3 ← najlepszy udokumentowany** | dokumentacja; czytelność nietestowana |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32 604 | **116 (jeśli czytelne)** | hipoteza H6 |

## 4. Znalezione i naprawione błędy (audyt wobec oficjalnej dokumentacji)

| id | błąd | wpływ | commit |
|---|---|---|---|
| D2 | gpt-4o-mini wpadał do domyślnego kafelka 85/170 (rzeczywiste: 2833/5667) | koszt niedoszacowany ~33× — **odwrócona bramka** | e6bc75f |
| D1 | mnożnik o4-mini 1,62 (rzeczywisty 1,72) | −5,8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) z limitem 10000 (rzeczywisty 1536, brak original) | pękłoby przy większych stronach | e6bc75f |
| D4 | gpt-5-codex-mini w reżimie kafelka (rzeczywisty: patch 1536) | ≥+23% niedoszacowane | e6bc75f |
| D5 | detail:'original' zakodowane na sztywno dla każdego modelu (istnieje tylko w 5.4+) | poza kontraktem | e6bc75f |
| #44 | zaślepka opisu wstrzykiwana do typowanych narzędzi → 400 + cichy fallback | oszczędności wyzerowane bez sygnału | 0f66e32 |
| AA | atlas AA w produkcji wbrew komentarzowi „eval-only” | −17pp odczytu na Fable | 9a25585 |
| — | slab cols 313 (1573px) → resample 0,997× i dodatkowa kolumna płatka | naprawione na 312 | baza |

## 5. Otwarte hipotezy (co kosztuje zamknięcie każdej z nich)

| id | hipoteza | obecny dowód | test decydujący | koszt |
|---|---|---|---|---|
| H1 | Strona 1928² czyta się ≥ standard na bezpośrednim API (WYSIWYG dowiedzione w rozliczeniach) | rozliczenie 4764 bez resample; 1-bit już czyta 67% nawet zdegradowane | bezpośredni A/B std vs wysoka rozdz. (1-bit) | ~4 USD API |
| H2 | wysoka rozdz. + 1-bit na bezpośrednim API ≈ 100% z 3,3× mniej obrazów | H1 + macierz 2×2 | to samo co H1 | to samo |
| H3 | Read CLI i OpenRouter zmniejszają obrazy >1568/2000px | 5×8 umiera, a 10×16 przeżywa NA TEJ SAMEJ stronie | jedna strona 1928² z glifami 20×32 per transport | ~0 USD (CLI) |
| H4 | Odmowa zależy od sformułowania (agent-czytający-plik ≈ 0% vs surowe API ≈ 100%) | porównanie transportów powyżej | A/B sformułowania na rzeczywistej ścieżce proxy | niskie |
| H5 | Gemini kafelek 1533×1152 czytelny przy 5×8 (42 znaki/tok) | brak | density-frontier z GEMINI_API_KEY | ~darmowe (darmowy poziom) |
| H6 | media_resolution:low czytelne (116 znaków/tok) | mało prawdopodobne (koder niskiej rozdz.), ale nikt nie zmierzył | 1 wywołanie | ~darmowe |
| H7 | GPT: czytelność paska + zawyżenie tokenów ukończenia (ryzyko PageWatch) | społeczność zaobserwowała −40% promptu ale +ukończenie/2× opóźnienie | density-frontier z OPENAI_API_KEY | ~2-5 USD |
| H8 | Chirurgia glifów (H~K, 0/8, 5/3…) zamienia wstrzymania w odczyty | po 1-bit WSZYSTKIE pomyłki Fable stały się wstrzymaniami | edycja ~10 bitmap + ponowne uruchomienie macierzy | 0 USD (CLI) |
| H9 | Motyw jasny (czarny na białym) > odwrócony | literatura (artykuł Glyph, Tesseract); nigdy niezmierzone na komercyjnym VLM | flaga stylu + 2 ramiona | 0 USD (CLI) |
| H10 | Opus przy 7×10 ląduje między 0% (5×8) a 87% (10×16) → dobry kompromis | krzywa upstream 35% przy 7×10 (n=20) | 1 dodatkowe ramię | 0 USD (CLI) |
| H11 | Ponawianie przy odmowie w proxy odzyskuje ~50% odfiltrowanych partii | odmowa jest stochastyczna per wywołanie | wdrożyć + zmierzyć w produkcji | kod |

## 6. Zaległości operacyjne

1. `gh auth login` → utworzyć prywatne `diegosouzapw/omniglyph` + push (10
   lokalnych commitów).
2. Kredyty Anthropic (H1/H2, werdykt geometrii) i OpenRouter (wyczerpane).
3. **Rotacja kluczy** Anthropic i OpenRouter ujawnionych w czacie.
4. Kolejka kodu: #45 (schema-strip draft-07), retry-on-refusal (H11),
   chirurgia glifów (H8), Faza 4 (TS w skryptach, GIFy, dokumentacja,
   panel v2), Faza 5 (silnik OmniRoute).

## ANEKS 2026-07-06 — A/B przez bezpośrednie API (165 wywołań): H1/H2 OBALONE

| konfiguracja | dokładne | wstrzym. | odmowa | błędy |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA i 1-bit) | 0/60 | 0 | **60/60 odmowa** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 przewidziane) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 przewidziane) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

WERDYKT: strona 1928² poziomu wysokiej rozdz. jest ROZLICZANA WYSIWYG (4764
tok, sweep), ale KODER nie otrzymuje pełnej rozdzielczości — 1-2/30
odczytane, z błędami zamiany pojedynczego glifu (6→8, a→4), sygnaturą
wewnętrznego resample. **Rozliczenie ≠ wejście kodera → pułapka: 3,3× koszt,
gorsza czytelność.** ZASTOSOWANE: pageGeometryForTier() cofnięte — oba
poziomy renderują 1568×728; infrastruktura poziomów zachowana (dokładne
rozliczenie pozostaje ważne, a przyszłe dostrojenie to 1 linia). H3
zaktualizowane: „resample transportu” był (także) własnym koderem API.
Odmowa przy transkrypcji przez surowe API: 100% na standardowej stronie
(H4 wzmocnione — tylko framing agenta się wymyka). Opus 10×16 potwierdzony
na obu transportach (77-87%).

## ANEKS 2026-07-06 (2) — bateria GPT-5.5 przez bezpośrednie API: H7 zamknięte (NIEUDANE)

| ramię | dosłowne | gist | wyjście/odpowiedź |
|---|---:|---:|---:|
| pasek 768×2048 5×8 AA | 0/30 (18 wstrzym., 5 odfiltrowane, 7 błędów) | 0/3 | 2639 tok |
| pasek 5×8 1-bit | 0/30 (15 wstrzym., 5 odfiltrowane, 10 błędów) | 1/3 | 2383 tok |
| TEKST (kontrola) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 nie potrafi odczytać glifów 5×8 (0/60; nawet gist nie przetrwał) i
zawyża ukończenie ~40× próbując je odszyfrować (2,4-2,7 tys. tokenów
rozumowania per pytanie) — oszczędności promptu są pożerane przez wyjście.
Perfekcyjna kontrola tekstowa dowodzi, że korpus/pytania są rozsądne.
Potwierdza i kwantyfikuje opt-in dla 5.5; gpt-5.6 (domyślny) pozostaje
nietestowalny (konto bez dostępu). Przyszłość (H12): bramka GPT musi
modelować zawyżenie wyjścia, nie tylko tokeny promptu.

## ANEKS 2026-07-06 (3) — Gemini 2.5-flash (CZĘŚCIOWE: limit darmowego poziomu wyczerpał się w trakcie)

Z ~26 odpowiedzi obrazowych, które przeszły przed wyczerpaniem limitu:
**0 poprawnych, 1 wstrzymanie, ~25 KONFABULACJI** — i nie są to pomyłki
glifów: to losowe cyfry (`indexLedgerInd → 0040375615`), tzn. koder widzi
prawie nic przy testowanych gęstościach (natywny kafelek 42 znaki/tok i
płaskie MEDIUM), a 2.5-flash WYMYŚLA zamiast się wstrzymać (ignoruje
instrukcję ILEGIVEL). Kontrola tekstowa: 3/3 na tych, które przeszły. Brak
zawyżenia wyjścia (6-28 tok/odpowiedź).

Wstępny sygnał: H5/H6 skłaniają się ku NIE dla 2.5-flash, z trybem awarii
GORSZYM niż GPT (cicha konfabulacja zamiast wstrzymania) — Gemini
wymagałby dodatkowych zabezpieczeń w proxy. Do zamknięcia: ponowne
uruchomienie z płatnym limitem lub innego dnia, oraz test gemini-2.5-pro
(flash to najsłabszy czytelnik w rodzinie). Strona natywnego kafelka wciąż
ma najlepszy UDOKUMENTOWANY współczynnik (42,3 znaku/token); to czytelność
budzi wątpliwości.

Uwaga o kosztach: częściowe strony (ostatnia w korpusie) rozliczają się
źle w reżimie kafelkowym (mała wysokość → mała jednostka przycięcia →
więcej kafelków) — dopełnienie ostatniej strony do 1152px wysokości to
obowiązkowa optymalizacja, jeśli Gemini zostanie włączony.
