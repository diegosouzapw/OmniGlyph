🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontekst jako obraz

### Zmniejsz swój rachunek za Claude o **59–70%**, renderując rozbudowany kontekst jako gęste strony PNG — ta sama treść, za ułamek tokenów.

**Modele rozliczają tekst za token, ale obraz rozliczają według jego wymiarów — niezależnie od tego, ile tekstu się w nim znajduje.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-liczby--zmierzone-nie-oszacowane)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-uczciwa-cz)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Część rodziny [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Wszystkie języki](../README.md)

</div>

---

# 📊 Liczby — zmierzone, nie oszacowane

| metryka | wynik | dowód |
|---|---|---|
| Redukcja rachunku end-to-end | **59–70%** | ślad produkcyjny, 13 709 zapytań |
| Tokeny na przekonwertowany blok | **10× mniej** (28 080 znaków: 14 040 → 1 460 tokenów) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Dokładność wzoru rozliczeniowego | reszta **zerowa** w 22 sondach `count_tokens`, 2 modele × 2 poziomy | `benchmarks/billing-sweep/results/` |
| Dokładność dosłownego odczytu, konfiguracja produkcyjna | **30/30 (100%)** na Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Ciche konfabulacje w ~300 próbach odczytu | **0** — każde niepowodzenie zwraca `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Karta wyników modeli** (czy potrafi odczytać gęste renderingi? n=30 na wariant, ocena deterministyczna):

| model | odczyt | werdykt |
|---|---|---|
| Claude **Fable 5** | **100%** dokładnie | ✅ cel produkcyjny |
| Claude Opus 4.8 | 77–87% przy 4× rozmiarze glifu | ⚠️ opcjonalny tryb bezpieczny (oszczędności spadają do ~2×) |
| GPT-5.5 | 0/60 — i mimo to zawyża swoje odpowiedzi ~40× | ❌ zablokowany przez bramkę, z dowodem |
| Gemini 2.5-flash | 0/26 — i konfabuluje zamiast się wstrzymać | ❌ zablokowany (test częściowy, ograniczony limitem) |

Przewaga jest **dziś specyficzna dla Fable** — inne kodery wizji nie potrafią jeszcze rozpoznawać gęstych glifów. [Zestaw benchmarków](benchmarks/README.md) ponownie testuje każdy nowy model w jednej komendzie.

# 🤔 Dlaczego OmniGlyph?

Każda długo działająca sesja agenta ciągnie za sobą ten sam martwy ciężar przy każdym zapytaniu: system prompt, dokumentację narzędzi i starą historię — ponownie rozliczane za token, przy każdej turze. OmniGlyph to **lokalny proxy**, który przepisuje te rozbudowane części na gęste strony PNG *zanim opuszczą Twoją maszynę*:

- **Dokładna matematyka rozliczeń, nie heurystyki** — oblicza rzeczywisty wzór tokenizacji obrazów dostawcy (zmierzony do zerowej reszty) i konwertuje tylko wtedy, gdy matematyka na to wskazuje.
- **Zamknięty w razie awarii z założenia** — modele, które nie potrafią odczytać gęstych renderingów, są blokowane przez bramkę, z dowodami z benchmarków. Żadnej cichej utraty jakości.
- **Prywatny i lokalny w pierwszej kolejności** — przepisanie odbywa się na `127.0.0.1`; nic dodatkowego nie jest nigdzie wysyłane.
- **Odtwarzalny** — każda liczba powyżej ma dowód w `benchmarks/*/results/`, możliwy do ponownego uruchomienia jedną komendą.

# ⚡ Szybki start

```bash
npx omniglyph                                     # proxy na 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # skieruj Claude Code na proxy
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Działa w obu przypadkach:
- **Klucz API** (płatność za token): Twój rachunek spada o 59–70% end-to-end.
- **Sesja subskrypcyjna**: nie płacisz mniej, ale limity użycia są liczone w tokenach — więc Twoje limity rozciągają się **~2–3×**.

Panel pod adresem <http://127.0.0.1:47821/>: zaoszczędzone tokeny, każda konwersja tekst→obraz obok siebie, wyłącznik awaryjny, żywe chipy modeli. Odpowiedzi strumieniują normalnie — kompresowane jest tylko *zapytanie*, nigdy wyjście modelu.

# 🖥️ Panel (dashboard)

Pełny lokalny panel dostarczany jest wewnątrz pakietu — offline, single-file, zero zewnętrznych zapytań. Sześć stron, aktualizowanych na żywo przez SSE w miarę napływu zapytań:

![Overview: karty KPI mission-control, sparkline oszczędności i żywy feed zdarzeń](../../assets/dashboard-overview.png)

- **Overview** — centrum dowodzenia: % oszczędności, $ zaoszczędzone, opóźnienie p95, trafienia cache, błędy, żywy feed.
- **Live Flow** — potok jako graf węzłów: client → gate → renderer / passthrough → API, z cząstką na każde realne zapytanie.
- **Telemetry** — licznik tokenów/$ oraz żywa oś czasu zapytań; kliknij dowolne zapytanie, aby zobaczyć dokładnie, które części stały się obrazami, i odczytać tekst źródłowy stojący za każdą stroną.
- **Benchmarks** — dowody z harnessu wyrenderowane z `benchmarks/*/results/`, jeden wiersz na eksperyment model·konfiguracja, oraz **uruchamianie benchmarków bezpośrednio z UI**: przebiegi `$0` dry-run strumieniują swój output na żywo; przebiegi live pozostają zablokowane za Twoim kluczem API oraz jawnym potwierdzeniem kosztu.
- **Sessions / History** — najlepsze sesje pod względem zaoszczędzonych tokenów oraz każde zdarzenie zapisane na dysku.

| Live Flow | Benchmarks |
|---|---|
| ![Potok zapytań jako żywy graf węzłów](../../assets/dashboard-flow.png) | ![Dowody benchmarków i dry-runy bezpośrednio w UI](../../assets/dashboard-benchmarks.png) |

![Telemetry: licznik oraz żywa oś czasu zapytań](../../assets/dashboard-telemetry.png)

# ⚙️ Jak to działa

```
rozbudowany blok zapytania ──► bramka opłacalności ──► reflow + render (atlas 1-bit 5×8)
                       (dokładna matematyka rozliczeń)     ──► strony PNG 1568×728 ──► sklejenie z powrotem, przyjazne dla cache
```

- **Rozliczenie jest obliczane dokładnie, przed konwersją**: Anthropic rozlicza `⌈w/28⌉ × ⌈h/28⌉ + 4` tokeny za obraz (płatki 28 px — zmierzone do zerowej reszty). Pełna strona przenosi 28 080 znaków za 1 460 tokenów ≈ **19 znaków/token**, w porównaniu do ~2 znaków/token dla gęstego tekstu. Bramka konwertuje tylko wtedy, gdy matematyka się opłaca.
- **Co się konwertuje**: statyczny system prompt + dokumentacja narzędzi, stara zwinięta historia, duże wyniki narzędzi.
- **Co nigdy się nie konwertuje**: Twoje wiadomości, ostatnie tury, wyjście modelu, rzadka proza, wartości dokładne co do bajtu (hashe/identyfikatory jadą obok jako tekst) oraz każdy model, który nie przeszedł benchmarku odczytu.

# 📚 Użycie jako biblioteka (bez proxy)

Wszystko, co proxy robi dla każdego zapytania, jest też udokumentowanym, importowalnym API:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Renderuj dowolny tekst do gęstych stron PNG 1-bit
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Lub uruchom pełną transformację zapytania samodzielnie — bramka, matematyka rozliczeń i reszta
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // surowe ciało JSON /v1/messages
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` przypina bloki jako tekst; `options.emitRecoverable` zwraca oryginały bloków zamienionych na obrazy. Dokładna matematyka rozliczeń jest też dostarczana w rdzeniu pakietu (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — to właśnie z niej korzysta [OmniRoute](https://github.com/diegosouzapw/OmniRoute). Środowisko uruchomieniowe czyste w JS (Node i edge/Workers). Pełny interfejs: `src/core/index.ts`.

# 📤 Eksport offline — bez proxy, bez Claude Code

Nie korzystasz z Claude Code? Wyrenderuj kontekst do stron PNG **lokalnie** i wklej je do Cursor, ChatGPT lub dowolnego czatu, który przyjmuje przesyłanie obrazów. Bez proxy, bez klucza API, bez podpiętego konta:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Otrzymujesz jeden folder ze wszystkim, co wystarczy wrzucić do czatu:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` renderuje Twój niezacommitowany diff, `--diff <ref>` zakres commitów, `--open` pokazuje folder (macOS). Wszystko działa na Twojej maszynie — ścieżka eksportu nigdy nie uruchamia proxy i nigdy nie wywołuje modelu. Uruchom `omniglyph export --help`, aby zobaczyć wszystkie flagi.

# 🧭 Uczciwa część

- **To jest stratne.** Dokładny co do bajtu zapis z obrazów jest z natury zawodny. Wdrożone środki zaradcze: dokładne identyfikatory podróżują jako tekst obok obrazu, a zmierzona konfiguracja produkcyjna dała **zero cichych konfabulacji** — nieudane odczyty się wstrzymują.
- **Dziś zatwierdzony jest tylko Fable 5**, z dowodami. GPT-5.5 i Gemini 2.5-flash mierzalnie nie potrafią odczytać gęstych renderingów; Opus 4.8 potrzebuje 4× większych glifów. Bramka to wymusza.
- **Znaleźliśmy i uniknęliśmy pułapki rozliczeniowej**: warstwa obrazu wysokiej rozdzielczości rozlicza 3,3× więcej za stronę, ale koder wizji nie otrzymuje dodatkowej rozdzielczości — większe strony czyta się *gorzej*. Zmierzone, udokumentowane w [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), nie włączone.
- Ceny się zmieniają; trwałą metryką jest cięcie tokenów, które proxy loguje dla każdego zapytania względem darmowego kontrfaktycznego `count_tokens`.

# 🧠 FAQ

**Czy 59–70% to wynik end-to-end, czy tylko dla zapytań, których dotknęła konwersja?**
End-to-end — cały rachunek. Większość narzędzi kompresujących raportuje oszczędności tylko na fragmencie, którego dotknęły, co upiększa liczbę. Naszym mianownikiem jest *każde* zapytanie: te małe, które bramka słusznie zostawiła nietknięte, wszystkie zapisy i odczyty cache oraz wszystkie tokeny wyjściowe (których proxy nigdy nie kompresuje). Wynik liczony tylko dla skompresowanych zapytań jest wyższy i podawany osobno, nigdy jako nagłówek.

**Jak mierzona jest oszczędność?**
Obie strony tego samego zapytania, w tym samym momencie. Dla każdego POST-a `/v1/messages` proxy wystrzeliwuje darmową sondę `count_tokens` na oryginalnym, nieskompresowanym ciele (kontrfaktyk) równolegle z prawdziwym przekazaniem dalej i odczytuje z odpowiedzi blok użycia faktycznie rozliczony przez dostawcę — oba lądują w tym samym wierszu zdarzenia. Cennik cache jest stosowany identycznie po obu stronach, więc rabat za cache się znosi i nie może zostać podwójnie policzony jako „oszczędność”. Wzór znajduje się w `src/core/baseline.ts`; możesz go odtworzyć na podstawie własnego dziennika zdarzeń.

**Dlaczego pominięcie miałoby być konfabulacją, a nie błędem odczytu?**
Ponieważ wizja modelu to nie OCR: strona staje się osadzeniami płatków (patch embeddings), nigdy dyskretnymi znakami, więc nie ma pewności co do pojedynczego glifu, na której można by głośno zawieść — gdy piksele niedostatecznie determinują glif, wcześniejsze doświadczenie językowe modelu wypełnia lukę czymś prawdopodobnym. Ten mechanizm jest właśnie powodem, dla którego OmniGlyph jest w tej kwestii zamknięty w razie awarii: wartości dokładne co do bajtu zawsze podróżują jako tekst obok obrazu, modele, które błędnie odczytują, są blokowane przez bramkę, a zmierzona konfiguracja produkcyjna dała **zero** cichych konfabulacji w ~300 sondach odczytu — nieudane odczyty się wstrzymują.

**A co z pracą dokładną co do bajtu (hashe, identyfikatory, sekrety)?**
Ostatnie tury i dokładne identyfikatory z założenia pozostają tekstem. Dla obciążeń, które są *w całości* dokładne co do bajtu, kieruj je do modelu spoza białej listy (np. subagenta na innym modelu Claude) — wszystko poza białą listą przechodzi bez zmian, identyczne co do bajtu.

**Czy DeepSeek-OCR nie rozstrzygnął już, czy to działa?**
Udowodnił, że *kanał* działa — przy użyciu pary enkoder/dekoder wytrenowanej do tego zadania. Sceptycyzm pochodzi z czasów, gdy żaden standardowy model produkcyjny nie potrafił odczytać gęstych renderingów; to się zmieniło, a [karta wyników modeli](../../../README.md#-the-numbers--measured-not-estimated) powyżej pokazuje dokładnie, kto potrafi je dziś odczytać, z dowodami. [Zestaw benchmarków](../../../benchmarks/README.md) ponownie testuje każdy nowy model w jednej komendzie — bramka podąża za danymi, nie za hype'em.

**Czy mogę używać tego bez Claude Code — Cursor, ChatGPT, zwykły potok?**
Tak, na dwa sposoby. Jako **proxy** działa z dowolnym klientem, który pozwala ustawić bazowy adres URL API (`ANTHROPIC_BASE_URL` lub bazowy adres URL OpenAI) — Claude Code, Twoje własne skrypty, cokolwiek po HTTP. A dla narzędzi, które nie potrafią korzystać z proxy, **Eksport offline** powyżej renderuje kontekst do stron PNG, które wklejasz ręcznie — `omniglyph export --stdin` czyta nawet bezpośrednio z potoku Unix.

**Jak to właściwie zamienia tekst w obraz?**
Ponownie rozkłada tekst i maluje go 1-bitowym atlasem glifów 5×8 pikseli na gęstych stronach PNG 1568×728 — jeden bit na piksel, bez antyaliasingu, więc model rozlicza stronę według jej wymiarów, a nie według tego, ile znaków się w niej znajduje. **Jak to działa** powyżej opisuje potok; dokument z benchmarkami zawiera geometrię oraz to, dlaczego gęściej nie zawsze znaczy taniej.

# 🔬 Odtwórz każdą liczbę

```bash
pnpm install && pnpm test                                     # pełny zestaw
node benchmarks/billing-sweep/run.mjs --dry-run               # przewidywania rozliczeń, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # tabela kosztów, $0
# z kluczami: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (lub --via-cli dla subskrypcji Claude Code)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Pełna metodologia i każda tabela wyników: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Surowe dowody odpowiedź po odpowiedzi: `benchmarks/*/results/*.jsonl`.

# 🚀 Rodzina OmniRoute

OmniGlyph jest również dostarczany jako **natywny silnik kompresji wewnątrz [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — darmowej bramy AI. Tam działa jako silnik `omniglyph` (samodzielny tryb pojedynczy lub w stosie z innymi silnikami), z bramkami zamkniętymi w razie awarii i rozliczaniem tokenów świadomym obrazów.

# 🛠️ Stos technologiczny

| warstwa | technologia |
|---|---|
| Język | TypeScript (strict), ESM |
| Środowisko uruchomieniowe | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Renderowanie | własny atlas glifów 1-bit (pochodny od Spleen/Unifont, licencje w `assets/`) → PNG |
| Testy | Vitest — TDD, plus strażnicy integralności dokumentacji i rebrandingu |
| Benchmarki | zestawy `benchmarks/` (billing-sweep, density-frontier) z dowodami JSONL |

## Struktura projektu

| ścieżka | co |
|---|---|
| `src/` | proxy: potok transformacji, dokładne rozliczenia per dostawca, renderer, hosty (Node + Cloudflare Workers) |
| `benchmarks/` | zestawy, które wyprodukowały każdą liczbę powyżej — możliwe do ponownego uruchomienia |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Wsparcie i społeczność

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — błędy i prośby o nowe funkcje
- 🔒 [SECURITY.md](SECURITY.md) — zgłoszenia luk bezpieczeństwa
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — ścisłe TDD + pomiar przed twierdzeniami
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 Podziękowania

OmniGlyph stoi na barkach jednego projektu w szczególności — ta sekcja to nasze stałe podziękowanie.

| Projekt | Jak ukształtował OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Odkrycie, na którym zbudowany jest cały ten projekt.** pxpipe udowodnił, z dowodami, że kanał wizji produkcyjnego LLM może przenosić gęsty kontekst tekstowy za ułamek kosztu tokenów — i że decyzja o konwersji musi być podejmowana dla każdego zapytania na podstawie dokładnej matematyki rozliczeń, nigdy na wyczucie. Gęste renderowanie 1-bit, bramka opłacalności, kontrfaktyk `count_tokens`, biała lista modeli zamknięta w razie awarii oraz kultura dokumentacji „zmierz, zanim stwierdzisz” — wszystko to zostało tam zapoczątkowane. OmniGlyph wywodzi się bezpośrednio z tej bazy kodu (MIT — oryginalna linia praw autorskich pozostaje w naszym pliku [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Rodzina fontów bitmapowych 5×8, z której wywodzi się nasz gęsty atlas glifów 1-bit (licencja w `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Pokrycie dla glifów wykraczających poza zakres Spleen w tym samym atlasie (licencja w `assets/`). |

Jeśli OmniGlyph okazuje się przydatny, zostaw gwiazdkę też na projekcie źródłowym — to ich odkrycie. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licencja

MIT — zobacz [LICENSE](../../../LICENSE).
