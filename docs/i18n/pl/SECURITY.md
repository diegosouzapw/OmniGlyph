# Polityka bezpieczeństwa

## Zgłaszanie luk bezpieczeństwa

Otwórz prywatne zgłoszenie bezpieczeństwa na GitHubie
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) lub
skontaktuj się bezpośrednio z opiekunem projektu (diegosouza.pw@outlook.com).
Nie otwieraj publicznego zgłoszenia dla luki nadającej się do wykorzystania.

## Model zagrożeń (czym jest OmniGlyph)

OmniGlyph to **lokalny proxy** między Twoim klientem (np. Claude Code) a API
LLM. Z założenia widzi całą treść Twojej sesji i Twoje poświadczenia w
trakcie przesyłania. Odpowiednie decyzje dotyczące bezpieczeństwa:

- **Domyślnie wiąże się z loopback** (`127.0.0.1`): panel nie ma
  uwierzytelniania i serwuje przechwycony kontekst sesji (tekst źródłowy
  obrazów, telemetria). `HOST=0.0.0.0` to wyraźne opt-in i eksponuje to
  wszystko sieci — używaj tego tylko w zaufanej sieci.
- **Poświadczenia**: proxy przekazuje nagłówki uwierzytelniania klienta do
  serwera nadrzędnego i ich nie przechowuje. Klucze podane przez zmienne
  środowiskowe (`ANTHROPIC_API_KEY` itp.) pozostają w pamięci.
- **Lokalna telemetria**: `~/.omniglyph/events.jsonl` przechowuje metadane
  per zapytanie (liczby tokenów, hashe treści) oraz, przy błędach 4xx,
  skompresowane próbki treści — traktuj ten plik jako wrażliwy.
- **Treść przekształcona w obraz jest stratna**: wartości dokładne co do
  bajtu (sekrety, hashe) nigdy nie powinny zależeć od odczytów obrazów;
  potok zachowuje je jako tekst, ale złota zasada brzmi: nie umieszczaj
  sekretów w kontekście LLM.
- **Łańcuch dostaw**: `pnpm-workspace.yaml` wymusza `minimumReleaseAge`
  wynoszący 3 dni dla każdego nowego pakietu; rdzeń ma pojedynczą zależność
  uruchomieniową.

## Obsługiwane wersje

Tylko najnowsza linia wydania (`main` / najnowsza `v1.x`) otrzymuje
poprawki.
