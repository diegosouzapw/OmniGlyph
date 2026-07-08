# Változásnapló

Formátum: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · szemantikus verziózás.

## [1.0.0] — 2026-07-07

Első nyilvános kiadás.

### A termék

- **Kontextus-mint-kép tömörítési proxy**: minden LLM-kérés terjedelmes részeit
  (rendszerprompt, eszközdokumentáció, régi előzmények, nagy eszközkimenetek)
  sűrű 1-bites PNG-oldalakká írja át, mielőtt azok elhagynák a gépét. Helyi
  Node-szerver és Cloudflare Workers host.
- **Pontos, szolgáltatónkénti számlázási matematika** (`src/core/`): Anthropic
  28px-es patch-ek + 3–4 token/blokk overhead (saját sweep, nulla maradék),
  OpenAI és Gemini képletek a hivatalos dokumentáció alapján auditálva. A
  csomag gyökerénél exportálva (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, szint-plafonok).
- **Mért éles renderelési konfiguráció**: sűrű 1-bites glifatlasz (élsimítás
  nélkül), standard szintű oldalak — minden döntés mögött benchmark-bizonyíték
  áll a `benchmarks/*/results/`-ban.
- **Benchmark harness-ek** (`benchmarks/`): billing-sweep (token-elszámolás) és
  density-frontier (olvasási pontossági határ modellek/sűrűségek között),
  újrafuttatható API-n, OpenRouteren, Claude Code CLI-n keresztül, vagy az
  OmniRoute-on át (`--via-omniroute`).
- **Elutasítás-újrapróbálkozás**: az SSE/JSON sniffer újrajátssza az eredeti
  kérést, ha egy modell elutasítja a renderelt oldalt (vészkapcsoló
  `retryRefusalWithOriginal`).
- **LRU render gyorsítótár** determinisztikus oldalakhoz.
- **OmniRoute motor**: `omniglyph` tömörítési motorként szállítva az
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute)-on belül (egyedi mód
  és rétegezett pipeline), fail-closed kapukkal és képtudatos
  token-elszámolással.

### A számok (mindegyik reprodukálható)

- Minta UI-renderelés: 1015 karakter → 438×120 PNG, 254 → 84 token
  (**66,9% megtakarítva**).
- Standard oldal 1568×728 = 1456 kép-token, függetlenül attól, mennyi szöveget
  tartalmaz.
- A Claude 100%-ban olvassa a sűrű 1-bites oldalakat éles sűrűségnél; az
  Opus 4.8 77–87%-ot olvas 10×16-nál.

### Negatív döntések (mérve, nem vélemény)

- **A nagyfelbontású szint számlázási csapda**: az 1928²-es oldal WYSIWYG
  módon van számlázva, de az enkóder nem kapja meg a teljes felbontást — mindkét
  szint standard oldalakat renderel.
- **A GPT-5.5 elutasítva**: a sűrű csík 0/60 olvasása és ~40×-es
  válaszfelfújás a szöveges kontrollhoz képest.
- **A gpt-4o-mini soha nem kerül képesítésre** (a 2833/5667-es token-plafon
  veszteségessé teszi).
- **A Gemini 2.5-flash konfabulál** tartózkodás helyett sűrű oldalaknál
  (0/26) — függőben a fizetős kvótás újrateszt.
