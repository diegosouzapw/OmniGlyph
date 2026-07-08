# Changelog

Formát: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · sémantické verzovanie.

## [1.0.0] — 2026-07-07

Prvé verejné vydanie.

### Produkt

- **Proxy na kompresiu kontextu ako obrázka**: prepisuje objemné časti každej
  LLM požiadavky (systémový prompt, dokumentáciu nástrojov, starú históriu,
  veľké výstupy nástrojov) na husté 1-bitové PNG stránky predtým, než opustia
  váš počítač. Lokálny Node server a Cloudflare Workers host.
- **Presná účtovacia matematika na poskytovateľa** (`src/core/`): Anthropic
  28px záplaty + réžia 3 – 4 tokeny/blok (vlastný sweep, nulové rezíduum),
  vzorce pre OpenAI a Gemini overené proti oficiálnej dokumentácii. Exportované
  na koreni balíka (`anthropicImageTokens`, `resolveAnthropicVisionTier`,
  stropy úrovní).
- **Meraná produkčná konfigurácia renderu**: hustá 1-bitová atlasová mriežka
  glyfov (bez anti-aliasingu), stránky štandardnej úrovne — každá voľba
  podložená benchmarkovým dôkazom v `benchmarks/*/results/`.
- **Benchmarkové harnessy** (`benchmarks/`): billing-sweep (účtovanie tokenov)
  a density-frontier (hranica presnosti čítania naprieč modelmi/hustotami),
  opätovne spustiteľné cez API, OpenRouter, Claude Code CLI, alebo cez
  OmniRoute (`--via-omniroute`).
- **Opakovanie pri odmietnutí**: SSE/JSON sniffer prehrá pôvodnú požiadavku,
  keď model odmietne vykreslenú stránku (vypínač `retryRefusalWithOriginal`).
- **LRU render cache** pre deterministické stránky.
- **Engine OmniRoute**: dodáva sa ako kompresný engine `omniglyph` v
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (single mode aj
  vrstvený pipeline), s fail-closed bránami a účtovaním tokenov s ohľadom
  na obrázky.

### Čísla (všetky reprodukovateľné)

- Ukážkový render UI: 1015 znakov → 438×120 PNG, 254 → 84 tokenov
  (**ušetrených 66,9 %**).
- Štandardná stránka 1568×728 = 1456 tokenov obrázka bez ohľadu na to, koľko
  textu obsahuje.
- Claude číta husté 1-bitové stránky na 100 % pri produkčnej hustote; Opus 4.8
  číta 77 – 87 % pri 10×16.

### Negatívne rozhodnutia (merané, nie názory)

- **Vysokorozlišovacia úroveň je účtovacia pasca**: stránka 1928² sa účtuje
  WYSIWYG, ale enkodér nedostáva plné rozlíšenie — obe úrovne renderujú
  štandardné stránky.
- **GPT-5.5 zamietnutý**: 0/60 čítaní hustého pásu a ~40× nafúknutie
  dokončenia oproti textovej kontrole.
- **gpt-4o-mini sa nikdy neobrázkuje** (spodná hranica 2833/5667 tokenov
  robí konverziu nerentabilnou).
- **Gemini 2.5-flash konfabuluje** namiesto toho, aby sa zdržal na hustých
  stránkach (0/26) — čaká na opätovný test s platenou kvótou.
