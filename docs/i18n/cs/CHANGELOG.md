# Changelog

Formát: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · sémantické verzování.

## [1.0.0] — 2026-07-07

První veřejné vydání.

### Produkt

- **Kompresní proxy pro kontext jako obrázek**: přepisuje objemné části každého
  LLM requestu (system prompt, dokumentace nástrojů, stará historie, velké
  výstupy nástrojů) do hustých 1bitových PNG stránek dřív, než opustí váš
  počítač. Lokální Node server a host pro Cloudflare Workers.
- **Přesná billingová matematika na poskytovatele** (`src/core/`): Anthropic
  28px patche + režie 3–4 tokeny/blok (vlastní sweep, nulový reziduál), vzorce
  OpenAI a Gemini prověřené oproti oficiální dokumentaci. Exportováno v kořeni
  balíčku (`anthropicImageTokens`, `resolveAnthropicVisionTier`, limity úrovní).
- **Měřená produkční konfigurace renderu**: hustá 1bitová atlasová mřížka
  glyfů (bez vyhlazování/anti-aliasingu), stránky standardní úrovně — každá
  volba podložená dokladem z benchmarku v `benchmarks/*/results/`.
- **Harness benchmarků** (`benchmarks/`): billing-sweep (účtování tokenů) a
  density-frontier (hranice přesnosti čtení napříč modely/hustotami),
  opakovatelné přes API, OpenRouter, Claude Code CLI, nebo přes OmniRoute
  (`--via-omniroute`).
- **Opakování po odmítnutí**: sniffer SSE/JSON zopakuje původní request, když
  model odmítne vykreslenou stránku (kill switch `retryRefusalWithOriginal`).
- **LRU cache renderů** pro deterministické stránky.
- **Engine OmniRoute**: dodává se jako kompresní engine `omniglyph` v
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (samostatný režim a
  naskládaná pipeline), s fail-closed gaty a účtováním tokenů, které bere v
  úvahu obrázky.

### Čísla (vše reprodukovatelné)

- Ukázkový render UI: 1015 znaků → 438×120 PNG, 254 → 84 tokenů (**ušetřeno 66,9 %**).
- Standardní stránka 1568×728 = 1456 obrázkových tokenů bez ohledu na to, kolik textu nese.
- Claude čte husté 1bitové stránky na 100 % při produkční hustotě; Opus 4.8 čte
  77–87 % při 10×16.

### Negativní rozhodnutí (změřeno, ne názory)

- **Vysokorozlišovací úroveň je billingová past**: stránka 1928² je účtována
  WYSIWYG, ale enkodér nedostává plné rozlišení — obě úrovně vykreslují
  standardní stránky.
- **GPT-5.5 zamítnut**: 0/60 čtení husté proužky a ~40× nafouknutí dokončení
  oproti textové kontrole.
- **gpt-4o-mini nikdy nezobrazován jako obrázek** (práh 2833/5667 tokenů dělá
  konverzi neziskovou).
- **Gemini 2.5-flash konfabuluje** místo toho, aby se zdržel u hustých stránek
  (0/26) — čeká na opakovaný test s placenou kvótou.
