# OmniGlyph — Konsoliderte målinger (2026-07-05)

🌐 Oversatt: [alle språk](../../../README.md)

Alt MÅLT i denne økten, med kilde og n; hypoteser tydelig atskilt til slutt.
Kvitteringer: `benchmarks/billing-sweep/results/` og
`benchmarks/density-frontier/results/` (JSONL per svar).

## TL;DR — hele resultatet i to søyler

**Kostnad** — én standard 1568×728-side bærer 28,080 tegn for en flat
1,460 tokens; den samme teksten sendt rå koster ~10× mer:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Nøyaktighet** — men kun der modellen faktisk leser siden. Porten er
fail-closed; kun ✅-raden går i produksjon:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Resten av dette dokumentet er kvitteringene bak disse to søylene.

## 1. Anthropic-fakturering (direkte count_tokens, $0, 11 geometrier × 2 modeller)

Bekreftet formel: `tokens = ceil(w/28) × ceil(h/28)` etter endring av
størrelse per nivå, **+3/blokk (Fable 5) / +4/blokk (Sonnet 4.5)** — NULL
avvik på tvers av alle rader.

| probe | dimensjoner | Fable 5 (høyoppløsning) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| dokumentanker | 1092×1092 | 1524 | 1525 |
| dokumentanker | 1000×1000 | 1299 | 1300 |
| standardside | 1568×728 | 1459 | 1460 |
| **stor side** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resampling) |
| høyoppl.-tak | 1960×1960 | 4764 (klemt) | 1525 |
| høyoppl. langside | 2576×1204 | 3959 | 1516 |
| høy smal stripe | 768×1932 | 1935 | 1292 (resampling) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 bilder) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→nedskalert, IKKE avvist i count_tokens) | 3585 |

Avledede beslutninger (implementert): eksakt per-patch-port; per-modell-nivå
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = høyoppløsning); `cols` 313→312.

## 2. Lesenøyaktighet (density-frontier, hex/camelCase/siffer-needles + distraktorer)

### Fable 5 2×2-matrise — via CLI/abonnement, n=30/arm, samme korpus (~16.6k tegn)

| side × atlas | eksakt | avstandelser (ILEGIVEL) | stille feil |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| høyoppløsning 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| høyoppløsning 1928×1928 · AA | 0/30 | 29 | 1 (forutsagt av matrisen) |

→ **1-bit > AA på begge sidene; null konfabulasjon på tvers av 120
spørsmål.** ANVENDT: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ høyoppløsning ankommer degradert av transport-resampling (se H1/H3) —
67% er et gulv, ikke et tak.

### Opus 4.8 — via CLI/abonnement, n=30/arm

| konfig | eksakt | avstandelser | feil |
|---|---:|---:|---:|
| høyoppløsning · 10×16-celle | **26/30 (87%)** | 0 | 4 (siffer) |
| standard · 5×8-celle | 0/30 | 30 | 0 |

→ Opus-kneet bekreftet med vår egen n (oppstrøms målte 95% ved 10×16 med
n=20). "Opus sikker modus" er levedyktig: 10×16 på den store siden ≈ 1.7
tegn per bildetoken på riggens korpus.

### Via OpenRouter (samme korpus/spørsmål) — uavgjort for lesbarhet

| målt faktum | tall |
|---|---|
| content_filter på transkripsjonsspørsmål (standardsider) | 60/60 (100%) |
| content_filter på høyoppløsningssider | 5-6/30 (~20%) |
| Fable høyoppløsning: avstandelser + feil | 20 ILEGIVEL + 5 feil (2 forutsagt) |
| Opus 10×16 (før kredittene tok slutt) | 7/9 eksakt (78%) |
| feillesninger forutsagt av forvekslingsmatrisen | 4→a, 0→8, S/s-forveksling |

### Transportsammenligning (samme spørsmål, samme innhold)

| transport | filter/avslag | stor side lesbar? |
|---|---|---|
| Direkte API (n=9, før kredittene tok slutt) | 0 | ikke testet |
| OpenRouter | ~100% std / ~20% høyoppl. | nei (mistenkt: resampling) |
| Claude Code CLI (abonnement) | 0 content_filter; ~50% av store batcher stanset (løst med bolker på 10 + gjenforsøk) | nei (mistenkt: Read endrer størrelse) |

## 3. Kostnad per leverandør (offline, eksakt — HELE sider, teoretisk)

| leverandør · side | tokens/side | tegn/side | **tegn/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (alle modeller) | 1460 | 28,080 | **19.2** | målt |
| Anthropic høyoppl. 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× færre bilder) | fakturering målt; lesbarhet venter (H1) |
| GPT-5 (flis) stripe 768×2048 | 1190 | ~38,760 | **32.6** | revidert dokumentasjon |
| GPT-5.4/5.5 (patch, original) opptil 1568×5984 | ~9,163 | ~233k | **25.4** | dokumentasjon; lesbarhet ikke testet |
| gpt-4o-mini | 48,169/stripe | — | **0.8 — ALDRI avbild** | dokumentasjon (bug D2 fikset) |
| Gemini flis 1533×1152 (native beskjæringsenhet 768) | 1032 | 43,615 | **42.3 ← best dokumentert** | dokumentasjon; lesbarhet ikke testet |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (hvis lesbar)** | hypotese H6 |

## 4. Funne og fiksede feil (revisjon mot offisiell dokumentasjon)

| id | feil | konsekvens | commit |
|---|---|---|---|
| D2 | gpt-4o-mini falt inn i standardflisen 85/170 (faktisk: 2833/5667) | kostnad undervurdert ~33× — **invertert port** | e6bc75f |
| D1 | o4-mini-multiplikator 1.62 (faktisk 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) med tak 10000 (faktisk 1536, ingen original) | ville brytes med større sider | e6bc75f |
| D4 | gpt-5-codex-mini i flisregimet (faktisk: patch 1536) | ≥+23% undervurdert | e6bc75f |
| D5 | detail:'original' hardkodet for hver modell (finnes kun i 5.4+) | utenfor kontrakt | e6bc75f |
| #44 | beskrivelsesstubb injisert i typede verktøy → 400 + stille reserveløsning | besparelser nullstilt uten signal | 0f66e32 |
| AA | AA-atlas i produksjon i strid med "kun-eval"-kommentaren | −17pp lesing på Fable | 9a25585 |
| — | slab-kolonner 313 (1573px) → 0.997× resampling + ekstra patch-kolonne | fikset til 312 | baseline |

## 5. Åpne hypoteser (hva hver enkelt koster å avslutte)

| id | hypotese | nåværende bevis | avgjørende test | kostnad |
|---|---|---|---|---|
| H1 | 1928²-siden leser ≥ standard på det direkte API-et (WYSIWYG bevist i fakturering) | fakturering 4764 uten resampling; 1-bit leser allerede 67% selv degradert | direkte A/B std vs høyoppl. (1-bit) | ~US$4 API |
| H2 | høyoppl. + 1-bit på det direkte API-et ≈ 100% med 3.3× færre bilder | H1 + 2×2-matrise | samme som H1 | samme |
| H3 | CLI-ens Read og OpenRouter endrer størrelse på bilder >1568/2000px | 5×8 dør og 10×16 overlever PÅ SAMME side | én 1928²-side med 20×32-glyffer per transport | ~US$0 (CLI) |
| H4 | Avslag avhenger av rammeverket (agent-leser-en-fil ≈ 0% vs rå API ≈ 100%) | transportsammenligningen over | ordlyd-A/B på den reelle proxy-stien | lav |
| H5 | Gemini flis 1533×1152 lesbar ved 5×8 (42 tegn/tok) | ingen | density-frontier med GEMINI_API_KEY | ~gratis (gratisnivå) |
| H6 | media_resolution:low lesbar (116 tegn/tok) | usannsynlig (lavoppløsningsmodell), men ingen har målt det | 1 kall | ~gratis |
| H7 | GPT: strip-lesbarhet + fullførings-tokenoppblåsing (PageWatch-risiko) | fellesskapet så −40% prompt men +fullføring/2× latens | density-frontier med OPENAI_API_KEY | ~US$2-5 |
| H8 | Glyffkirurgi (H~K, 0/8, 5/3…) konverterer avstandelser til lesninger | etter 1-bit ble ALLE Fable-bommer avstandelser | rediger ~10 bitmaps + kjør matrisen på nytt | $0 (CLI) |
| H9 | Lyst tema (svart-på-hvitt) > invertert | litteratur (Glyph-papiret, Tesseract); aldri målt på en kommersiell VLM | stilflagg + 2 armer | $0 (CLI) |
| H10 | Opus ved 7×10 lander mellom 0% (5×8) og 87% (10×16) → god avveining | oppstrøms kurve 35% ved 7×10 (n=20) | 1 ekstra arm | $0 (CLI) |
| H11 | Gjenforsøk-ved-avslag i proxyen gjenoppretter de ~50% filtrerte batchene | avslag er stokastisk per kall | implementer + mål i produksjon | kode |

## 6. Driftsmessige gjenstående punkter

1. `gh auth login` → opprett privat `diegosouzapw/omniglyph` + push (10 lokale commits).
2. Anthropic-kreditter (H1/H2, geometridommen) og OpenRouter (oppbrukt).
3. **Roter** Anthropic- og OpenRouter-**nøklene** eksponert i chatten.
4. Kodekø: #45 (skjema-strip draft-07), gjenforsøk-ved-avslag (H11), glyff-
   kirurgi (H8), Fase 4 (TS i skriptene, GIF-er, dokumentasjon, dashbord v2),
   Fase 5 (OmniRoute-motor).

## TILLEGG 2026-07-06 — A/B via direkte API (165 kall): H1/H2 TILBAKEVIST

| konfig | eksakt | avst. | avslag | feil |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA og 1-bit) | 0/60 | 0 | **60/60 avslag** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 forutsagt) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 forutsagt) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

DOM: høyoppløsningsnivåets 1928²-side er FAKTURERT WYSIWYG (4764 tok,
sveip), men MODELLEN mottar ikke full oppløsning — 1-2/30 lest, med
enkeltglyff-bytte-feil (6→8, a→4), signaturen til en intern resampling.
**Fakturering ≠ modellinput → felle: 3.3× kostnaden, dårligere lesbarhet.**
ANVENDT: pageGeometryForTier() tilbakerullet — begge nivåene rendrer
1568×728; nivåinfrastrukturen beholdt (eksakt fakturering forblir gyldig
og fremtidig retuning er 1 linje). H3 oppdatert: "transport-resamplingen"
var (også) API-ets egen modell. Avslag på transkripsjon via rå API: 100%
på standardsiden (H4 forsterket — kun agent-rammeverket unnslipper). Opus
10×16 bekreftet på begge transporter (77-87%).

## TILLEGG 2026-07-06 (2) — GPT-5.5-batteri via direkte API: H7 avsluttet (MISLYKTES)

| arm | ordrett | gist | utdata/svar |
|---|---:|---:|---:|
| stripe 768×2048 5×8 AA | 0/30 (18 avst, 5 filtrert, 7 feil) | 0/3 | 2,639 tok |
| stripe 5×8 1-bit | 0/30 (15 avst, 5 filtrert, 10 feil) | 1/3 | 2,383 tok |
| TEKST (kontroll) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 kan ikke lese 5×8-glyffer (0/60; ikke engang gist overlever) og
blåser opp fullføringen ~40× i forsøket på å tyde dem (2.4-2.7k
resonneringstokens per spørsmål) — promptbesparelsene spises opp av
utdataene. Den perfekte tekstkontrollen beviser at korpuset/spørsmålene er
fornuftige. Bekrefter og kvantifiserer 5.5-opt-in; gpt-5.6 (standard)
forblir utestet (kontoen har ikke tilgang). Fremtid (H12): GPT-porten må
modellere utdataoppblåsing, ikke bare prompttokens.

## TILLEGG 2026-07-06 (3) — Gemini 2.5-flash (DELVIS: gratisnivå-kvoten sprang midtveis)

Av de ~26 bildesvarene som kom gjennom før kvoten døde: **0 riktige, 1
avstandelse, ~25 KONFABULASJONER** — og de er ikke glyffforvekslinger: de
er tilfeldige siffer (`indexLedgerInd → 0040375615`), altså modellen ser
nesten ingenting ved de testede tetthetene (native flis 42 tegn/tok og
MEDIUM flat) og 2.5-flash OPPFINNER i stedet for å avstå (ignorerer
ILEGIVEL-instruksjonen). Tekstkontroll: 3/3 på de som kom gjennom. Ingen
utdataoppblåsing (6-28 tok/svar).

Foreløpig signal: H5/H6 heller mot NEI på 2.5-flash, med en feilmodus
VERRE enn GPT-ens (stille konfabulasjon i stedet for avstandelse) — Gemini
ville kreve ekstra sikkerhetstiltak i proxyen. Gjenstår å avslutte:
kjør på nytt med betalt kvote eller en annen dag, og test gemini-2.5-pro
(flash er den svakeste leseren i familien). Native-flis-siden har fortsatt
det best DOKUMENTERTE forholdet (42.3 tegn/token); det er lesbarheten som
er i tvil.

Kostnadsnotat: delvise sider (den siste i korpuset) faktureres dårlig
under flisregimet (kort høyde → liten beskjæringsenhet → flere fliser) —
å polstre den siste siden til 1152px høyde er en obligatorisk optimalisering
hvis Gemini kommer inn.
