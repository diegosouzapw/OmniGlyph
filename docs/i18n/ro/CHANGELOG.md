# Jurnal de modificări

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versionare semantică.

## [1.0.0] — 2026-07-07

Prima lansare publică.

### Produsul

- **Proxy de compresie context-ca-imagine**: rescrie părțile voluminoase ale
  fiecărui request LLM (system prompt, docs de unelte, istoric vechi, ieșiri
  mari de unelte) în pagini PNG dense pe 1 bit înainte să părăsească mașina
  dumneavoastră. Server Node local și host Cloudflare Workers.
- **Matematică de facturare exactă per furnizor** (`src/core/`): patch-uri
  Anthropic de 28px + 3–4 tokeni/bloc overhead (sweep propriu, reziduu zero),
  formule OpenAI și Gemini auditate față de documentația oficială. Exportate
  la rădăcina pachetului (`anthropicImageTokens`, `resolveAnthropicVisionTier`,
  plafoane de nivel).
- **Config de randare de producție măsurat**: atlas dens de glife pe 1 bit
  (fără anti-aliasing), pagini de nivel standard — fiecare alegere susținută
  de o dovadă din benchmark în `benchmarks/*/results/`.
- **Harness-uri de benchmark** (`benchmarks/`): billing-sweep (contabilizare
  de tokeni) și density-frontier (frontiera de precizie a citirii pe modele/
  densități), re-executabile prin API, OpenRouter, CLI-ul Claude Code, sau
  prin OmniRoute (`--via-omniroute`).
- **Reîncercare la refuz**: sniffer-ul SSE/JSON reia request-ul original
  atunci când un model refuză pagina randată (kill switch
  `retryRefusalWithOriginal`).
- **Cache LRU de randare** pentru pagini deterministe.
- **Motor OmniRoute**: livrat ca motorul de compresie `omniglyph` în
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (mod unic și
  pipeline stivuit), cu gate-uri fail-closed și contabilizare de tokeni
  conștientă de imagine.

### Cifrele (toate reproductibile)

- Randare UI de exemplu: 1015 caractere → PNG 438×120, 254 → 84 tokeni
  (**66.9% economisiți**).
- Pagina standard 1568×728 = 1456 tokeni de imagine indiferent de câtă text
  conține.
- Claude citește pagini dense pe 1 bit la 100% la densitatea de producție;
  Opus 4.8 citește 77–87% la 10×16.

### Decizii negative (măsurate, nu opinii)

- **Nivelul de rezoluție înaltă este o capcană de facturare**: pagina 1928²
  este facturată WYSIWYG dar encoderul nu primește rezoluția completă — ambele
  niveluri randează pagini standard.
- **GPT-5.5 respins**: 0/60 citiri ale benzii dense și ~40× inflație de
  completion față de controlul text.
- **gpt-4o-mini nu a fost niciodată transformat în imagine** (pragul de
  2833/5667 tokeni îl face neprofitabil).
- **Gemini 2.5-flash confabulează** în loc să se abțină pe pagini dense
  (0/26) — retest în așteptare cu cotă plătită.
