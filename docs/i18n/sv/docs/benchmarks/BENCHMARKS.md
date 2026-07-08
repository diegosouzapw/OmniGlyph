# OmniGlyph — Konsoliderade mätningar (2026-07-05)

🌐 Översatt: [alla språk](../../../README.md)

Allt MÄTT i denna session, med källa och n; hypoteser tydligt separerade i
slutet. Belägg: `benchmarks/billing-sweep/results/` och
`benchmarks/density-frontier/results/` (JSONL per svar).

## TL;DR — hela resultatet i två staplar

**Kostnad** — en standard 1568×728-sida rymmer 28,080 tecken för en fast
kostnad av 1,460 tokens; samma text skickad rått kostar ~10× mer:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Noggrannhet** — men bara där modellen faktiskt läser sidan. Spärren är
fail-closed; endast ✅-raden skickas i produktion:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Resten av det här dokumentet är beläggen bakom de här två staplarna.

## 1. Anthropic-fakturering (direkt count_tokens, $0, 11 geometrier × 2 modeller)

Bekräftad formel: `tokens = ceil(w/28) × ceil(h/28)` efter förminskning per
nivå, **+3/block (Fable 5) / +4/block (Sonnet 4.5)** — NOLL residual över
alla rader.

| prob | dimensioner | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| doc anchor | 1092×1092 | 1524 | 1525 |
| doc anchor | 1000×1000 | 1299 | 1300 |
| standardsida | 1568×728 | 1459 | 1460 |
| **stor sida** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resampling) |
| hi-res-tak | 1960×1960 | 4764 (klämt) | 1525 |
| hi-res lång kant | 2576×1204 | 3959 | 1516 |
| hög smal remsa | 768×1932 | 1935 | 1292 (resampling) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 bilder) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→nedskalning, INTE avvisat i count_tokens) | 3585 |

Härledda beslut (implementerade): exakt per-patch-spärr; per-modell-nivå
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Läsnoggrannhet (density-frontier, hex/camelCase/siffernålar + distraktorer)

### Fable 5 2×2-matris — via CLI/prenumeration, n=30/arm, samma korpus (~16.6k tecken)

| sida × atlas | exakt | avstår (ILEGIVEL) | tysta fel |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (förutspått av matrisen) |

→ **1-bit > AA på båda sidorna; noll konfabulation över 120 frågor.**
TILLÄMPAT: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res anländer försämrad av transport-resampling (se H1/H3) —
67% är ett golv, inget tak.

### Opus 4.8 — via CLI/prenumeration, n=30/arm

| konfiguration | exakt | avstår | fel |
|---|---:|---:|---:|
| high-res · 10×16-cell | **26/30 (87%)** | 0 | 4 (siffror) |
| standard · 5×8-cell | 0/30 | 30 | 0 |

→ Opus-knäet bekräftat med vårt eget n (uppströms mätte 95% vid 10×16 med
n=20). "Opus säkert läge" är genomförbart: 10×16 på den stora sidan ≈
1.7 tecken per bild-token på korpusens mätning.

### Via OpenRouter (samma korpus/frågor) — oavgjort för läsbarhet

| mätt faktum | siffra |
|---|---|
| content_filter på transkriptionsfrågor (standardsidor) | 60/60 (100%) |
| content_filter på high-res-sidor | 5-6/30 (~20%) |
| Fable high-res: avstående + fel | 20 ILEGIVEL + 5 fel (2 förutspådda) |
| Opus 10×16 (innan krediterna tog slut) | 7/9 exakt (78%) |
| felläsningar förutspådda av förvillelsematrisen | 4→a, 0→8, S/s-versal |

### Transportjämförelse (samma fråga, samma innehåll)

| transport | filter/avvisning | stor sida läsbar? |
|---|---|---|
| Direkt API (n=9, innan krediterna tog slut) | 0 | ej testad |
| OpenRouter | ~100% std / ~20% hi-res | nej (misstänkt: resampling) |
| Claude Code CLI (prenumeration) | 0 content_filter; ~50% av stora batcher fastnade (löst med bitar om 10 + omförsök) | nej (misstänkt: Read förminskar) |

## 3. Kostnad per leverantör (offline, exakt — FULLA sidor, teoretiskt)

| leverantör · sida | tokens/sida | tecken/sida | **tecken/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (alla modeller) | 1460 | 28,080 | **19.2** | mätt |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× färre bilder) | fakturering mätt; läsbarhet väntande (H1) |
| GPT-5 (platta) remsa 768×2048 | 1190 | ~38,760 | **32.6** | granskad dokumentation |
| GPT-5.4/5.5 (patch, original) upp till 1568×5984 | ~9,163 | ~233k | **25.4** | dokumentation; läsbarhet otestad |
| gpt-4o-mini | 48,169/remsa | — | **0.8 — AVBILDA ALDRIG** | dokumentation (bugg D2 fixad) |
| Gemini platta 1533×1152 (native beskärningsenhet 768) | 1032 | 43,615 | **42.3 ← bäst dokumenterat** | dokumentation; läsbarhet otestad |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (om läsbart)** | hypotes H6 |

## 4. Buggar hittade och fixade (granskning mot officiell dokumentation)

| id | bugg | påverkan | commit |
|---|---|---|---|
| D2 | gpt-4o-mini hamnade i standardplattan 85/170 (verkligt: 2833/5667) | kostnad underskattad ~33× — **omvänd spärr** | e6bc75f |
| D1 | o4-mini-multiplikator 1.62 (verklig 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) med tak 10000 (verkligt 1536, ingen original) | skulle gå sönder med större sidor | e6bc75f |
| D4 | gpt-5-codex-mini i platt-regimen (verkligt: patch 1536) | ≥+23% underskattat | e6bc75f |
| D5 | detail:'original' hårdkodat för varje modell (finns bara i 5.4+) | utanför kontraktet | e6bc75f |
| #44 | beskrivningsstubb injicerad i typade verktyg → 400 + tyst reservläge | besparingar nollställda utan signal | 0f66e32 |
| AA | AA-atlas i produktion mot "eval-only"-kommentaren | −17pp läsning på Fable | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× resampling + extra patchkolumn | fixat till 312 | baslinje |

## 5. Öppna hypoteser (vad varje enskild kostar att stänga)

| id | hypotes | nuvarande bevis | avgörande test | kostnad |
|---|---|---|---|---|
| H1 | 1928²-sidan läses ≥ standard på det direkta API:et (WYSIWYG bevisat i fakturering) | fakturering 4764 utan resampling; 1-bit läser redan 67% även försämrad | direkt A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit på det direkta API:et ≈ 100% med 3.3× färre bilder | H1 + 2×2-matris | samma som H1 | samma |
| H3 | CLI:ns Read och OpenRouter ändrar storlek på bilder >1568/2000px | 5×8 dör och 10×16 överlever PÅ SAMMA sida | en 1928²-sida med 20×32-glyfer per transport | ~US$0 (CLI) |
| H4 | Avvisning beror på formulering (agent-läser-en-fil ≈ 0% vs rått API ≈ 100%) | transportjämförelsen ovan | formulerings-A/B på den verkliga proxyvägen | låg |
| H5 | Gemini-platta 1533×1152 läsbar vid 5×8 (42 tecken/tok) | ingen | density-frontier med GEMINI_API_KEY | ~gratis (gratisnivå) |
| H6 | media_resolution:low läsbar (116 tecken/tok) | osannolikt (lågupplöst kodare), men ingen har mätt det | 1 anrop | ~gratis |
| H7 | GPT: remsläsbarhet + completion-token-inflation (PageWatch-risk) | gemenskapen såg −40% prompt men +completion/2× latens | density-frontier med OPENAI_API_KEY | ~US$2-5 |
| H8 | Glyfkirurgi (H~K, 0/8, 5/3…) omvandlar avstående till läsningar | efter 1-bit blev ALLA Fable-missar avstående | redigera ~10 bitmappar + kör om matrisen | $0 (CLI) |
| H9 | Ljust tema (svart-på-vitt) > inverterat | litteratur (Glyph-artikeln, Tesseract); aldrig mätt på en kommersiell VLM | stilflagga + 2 armar | $0 (CLI) |
| H10 | Opus vid 7×10 hamnar mellan 0% (5×8) och 87% (10×16) → bra avvägning | uppströms kurva 35% vid 7×10 (n=20) | 1 extra arm | $0 (CLI) |
| H11 | Omförsök-vid-avvisning i proxyn återhämtar ~50% av filtrerade batcher | avvisning är stokastisk per anrop | implementera + mät i produktion | kod |

## 6. Väntande driftärenden

1. `gh auth login` → skapa privat `diegosouzapw/omniglyph` + push (10 lokala
   commits).
2. Anthropic-krediter (H1/H2, geometribeslutet) och OpenRouter (uttömda).
3. **Rotera** Anthropic- och OpenRouter-**nycklarna** som exponerades i
   chatten.
4. Kodkö: #45 (schema-strippning draft-07), omförsök-vid-avvisning (H11),
   glyfkirurgi (H8), Fas 4 (TS i skripten, GIF:er, dokumentation,
   instrumentpanel v2), Fas 5 (OmniRoute-motor).

## TILLÄGG 2026-07-06 — A/B via direkt API (165 anrop): H1/H2 VEDERLAGDA

| konfiguration | exakt | avstår | avvisning | fel |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA och 1-bit) | 0/60 | 0 | **60/60 avvisning** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 förutspådda) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 förutspådda) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

SLUTSATS: den högupplösta nivåns 1928²-sida faktureras WYSIWYG (4764 tok,
mätning) men KODAREN tar inte emot den fulla upplösningen — 1-2/30 läst,
med enskilda glyfbytesfel (6→8, a→4), signaturen för en intern
resampling. **Fakturering ≠ kodarindata → fälla: 3.3× kostnaden, sämre
läsbarhet.** TILLÄMPAT: pageGeometryForTier() återställd — båda nivåerna
renderar 1568×728; nivåinfrastrukturen behålls (exakt fakturering
förblir giltig och framtida omjustering är 1 rad). H3 uppdaterad:
"transport-resamplingen" var (också) API:ets egen kodare. Avvisning vid
transkription via rått API: 100% på standardsidan (H4 förstärkt —
endast agentformuleringen slipper undan). Opus 10×16 bekräftad på båda
transporterna (77-87%).

## TILLÄGG 2026-07-06 (2) — GPT-5.5-batteri via direkt API: H7 stängd (MISSLYCKAD)

| arm | ordagrant | gist | utdata/svar |
|---|---:|---:|---:|
| remsa 768×2048 5×8 AA | 0/30 (18 avstår, 5 filtrerade, 7 fel) | 0/3 | 2,639 tok |
| remsa 5×8 1-bit | 0/30 (15 avstår, 5 filtrerade, 10 fel) | 1/3 | 2,383 tok |
| TEXT (kontroll) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 kan inte läsa 5×8-glyfer (0/60; inte ens gist överlever) och blåser
upp utdatan ~40× i försöket att dechiffrera dem (2.4-2.7k
resonemangstokens per fråga) — promptbesparingarna slukas av utdatan. Den
felfria textkontrollen bevisar att korpusen/frågorna är sunda. Bekräftar
och kvantifierar valbarheten för 5.5; gpt-5.6 (standard) förblir otestbar
(kontot saknar åtkomst). Framtid (H12): GPT-spärren måste modellera
utdatainflation, inte bara prompttokens.

## TILLÄGG 2026-07-06 (3) — Gemini 2.5-flash (DELVIS: gratisnivåkvoten tog slut mitt i)

Av de ~26 bildsvaren som kom igenom innan kvoten dog: **0 korrekta,
1 avstående, ~25 KONFABULATIONER** — och de är inte glyfförväxlingar: de är
slumpmässiga siffror (`indexLedgerInd → 0040375615`), dvs. kodaren ser
nästan ingenting vid de testade densiteterna (native platta 42 tecken/tok
och MEDIUM platt) och 2.5-flash HITTAR PÅ i stället för att avstå
(ignorerar ILEGIVEL-instruktionen). Textkontroll: 3/3 på dem som kom
igenom. Ingen utdatainflation (6-28 tok/svar).

Preliminär signal: H5/H6 lutar mot NEJ på 2.5-flash, med en felmod SÄMRE
än GPT:s (tyst konfabulation i stället för avstående) — Gemini skulle
behöva extra skyddsåtgärder i proxyn. Väntande att stänga: kör om med
betald kvot eller en annan dag, och testa gemini-2.5-pro (flash är den
svagaste läsaren i familjen). Native-plattsidan har fortfarande det bästa
DOKUMENTERADE förhållandet (42.3 tecken/token); det är läsbarheten som är
osäker.

Kostnadsanteckning: partiella sidor (korpusens sista) faktureras dåligt
under platt-regimen (kort höjd → liten beskärningsenhet → fler plattor) —
att fylla ut den sista sidan till 1152px höjd är en obligatorisk
optimering om Gemini kommer in.
