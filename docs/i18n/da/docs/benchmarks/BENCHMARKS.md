# OmniGlyph — Konsoliderede målinger (2026-07-05)

Alt MÅLT i denne session, med kilde og n; hypoteser klart adskilt til sidst.
Dokumentation: `benchmarks/billing-sweep/results/` og
`benchmarks/density-frontier/results/` (JSONL per svar).

## 1. Anthropic-afregning (direkte count_tokens, $0, 11 geometrier × 2 modeller)

Bekræftet formel: `tokens = ceil(w/28) × ceil(h/28)` efter per-tier resize,
**+3/blok (Fable 5) / +4/blok (Sonnet 4.5)** — NUL afvigelse på tværs af alle rækker.

| probe | dimensioner | Fable 5 (høj opløsning) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| dok-anker | 1092×1092 | 1524 | 1525 |
| dok-anker | 1000×1000 | 1299 | 1300 |
| standardside | 1568×728 | 1459 | 1460 |
| **stor side** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resampling) |
| hi-res-loft | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res lang kant | 2576×1204 | 3959 | 1516 |
| høj strimmel | 768×1932 | 1935 | 1292 (resampling) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 billeder) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→nedskalering, IKKE afvist i count_tokens) | 3585 |

Afledte beslutninger (implementeret): præcis per-patch-spærring; per-model-tier
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = høj opløsning); `cols` 313→312.

## 2. Læsenøjagtighed (density-frontier, hex/camelCase/ciffer-needles + distraktorer)

### Fable 5 2×2-matrix — via CLI/abonnement, n=30/arm, samme korpus (~16,6k tegn)

| side × atlas | nøjagtig | afståelser (ILEGIVEL) | stille fejl |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100 %)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83 %) | 5 | 0 |
| høj opløsning 1928×1928 · **1-bit** | 20/30 (67 %) | 10 | 0 |
| høj opløsning 1928×1928 · AA | 0/30 | 29 | 1 (forudsagt af matricen) |

→ **1-bit > AA på begge sider; nul konfabulation på tværs af 120 spørgsmål.**
ANVENDT: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ hi-res ankommer degraderet af transport-resampling (se H1/H3) — de 67 %
er et gulv, ikke et loft.

### Opus 4.8 — via CLI/abonnement, n=30/arm

| konfiguration | nøjagtig | afståelser | fejl |
|---|---:|---:|---:|
| høj opløsning · 10×16-celle | **26/30 (87 %)** | 0 | 4 (cifre) |
| standard · 5×8-celle | 0/30 | 30 | 0 |

→ Opus-knækpunktet bekræftet med vores eget n (upstream målte 95 % ved 10×16 med
n=20). "Opus sikker tilstand" er levedygtig: 10×16 på den store side ≈ 1,7 tegn per
billedtoken på benchmark-korpuset.

### Via OpenRouter (samme korpus/spørgsmål) — uafgjort for læsbarhed

| målt faktum | tal |
|---|---|
| content_filter på transskriptionsspørgsmål (standardsider) | 60/60 (100 %) |
| content_filter på hi-res-sider | 5-6/30 (~20 %) |
| Fable hi-res: afståelser + fejl | 20 ILEGIVEL + 5 fejl (2 forudsagt) |
| Opus 10×16 (før kredit løb tør) | 7/9 nøjagtig (78 %) |
| fejllæsninger forudsagt af forvekslelighedsmatricen | 4→a, 0→8, S/s-case |

### Transportsammenligning (samme spørgsmål, samme indhold)

| transport | filter/afvisning | stor side læsbar? |
|---|---|---|
| Direkte API (n=9, før kredit løb tør) | 0 | ikke testet |
| OpenRouter | ~100 % std / ~20 % hi-res | nej (mistanke: resampling) |
| Claude Code CLI (abonnement) | 0 content_filter; ~50 % af store batches gik i stå (løst med chunks på 10 + genforsøg) | nej (mistanke: Read skalerer) |

## 3. Omkostning per udbyder (offline, præcis — FULDE sider, teoretisk)

| udbyder · side | tokens/side | tegn/side | **tegn/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (alle modeller) | 1460 | 28.080 | **19,2** | målt |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (3,3× færre billeder) | afregning målt; læsbarhed afventer (H1) |
| GPT-5 (flise) strimmel 768×2048 | 1190 | ~38.760 | **32,6** | revideret dokumentation |
| GPT-5.4/5.5 (patch, original) op til 1568×5984 | ~9.163 | ~233k | **25,4** | dokumentation; læsbarhed ikke testet |
| gpt-4o-mini | 48.169/strimmel | — | **0,8 — ALDRIG billeddan** | dokumentation (bug D2 rettet) |
| Gemini flise 1533×1152 (nativ beskæringsenhed 768) | 1032 | 43.615 | **42,3 ← bedst dokumenteret** | dokumentation; læsbarhed ikke testet |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (hvis læsbar)** | hypotese H6 |

## 4. Fundne og rettede fejl (revision mod officiel dokumentation)

| id | fejl | konsekvens | commit |
|---|---|---|---|
| D2 | gpt-4o-mini faldt ind under standardfliseregimet 85/170 (faktisk: 2833/5667) | omkostning undervurderet ~33× — **inverteret spærring** | e6bc75f |
| D1 | o4-mini-multiplikator 1,62 (faktisk 1,72) | −5,8 % | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) med loft 10000 (faktisk 1536, uden original) | ville gå i stykker med større sider | e6bc75f |
| D4 | gpt-5-codex-mini i fliseregimet (faktisk: patch 1536) | ≥+23 % undervurderet | e6bc75f |
| D5 | detail:'original' hardkodet for hver model (findes kun i 5.4+) | uden for kontrakten | e6bc75f |
| #44 | beskrivelses-stub injiceret i typede værktøjer → 400 + stille fallback | besparelser nulstillet uden signal | 0f66e32 |
| AA | AA-atlas i produktion imod "kun-eval"-kommentaren | −17pp læsning på Fable | 9a25585 |
| — | slab cols 313 (1573px) → 0,997× resampling + ekstra patch-kolonne | rettet til 312 | baseline |

## 5. Åbne hypoteser (hvad det koster at lukke hver enkelt)

| id | hypotese | nuværende evidens | afgørende test | omkostning |
|---|---|---|---|---|
| H1 | 1928²-siden læser ≥ standard på det direkte API (WYSIWYG bevist i afregning) | afregning 4764 uden resampling; 1-bit læser allerede 67 % selv degraderet | direkte A/B std vs. hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit på det direkte API ≈ 100 % med 3,3× færre billeder | H1 + 2×2-matrix | samme som H1 | samme |
| H3 | CLI'ens Read og OpenRouter skalerer billeder >1568/2000px | 5×8 dør, og 10×16 overlever PÅ SAMME side | én 1928²-side med 20×32-glyffer per transport | ~US$0 (CLI) |
| H4 | Afvisning afhænger af formulering (agent-læser-en-fil ≈ 0 % vs. rå API ≈ 100 %) | transportsammenligning ovenfor | formulerings-A/B på den reelle proxysti | lav |
| H5 | Gemini-flise 1533×1152 læsbar ved 5×8 (42 tegn/token) | ingen | density-frontier med GEMINI_API_KEY | ~gratis (gratistier) |
| H6 | media_resolution:low læsbar (116 tegn/token) | usandsynligt (lav-opløsnings-encoder), men ingen har målt det | 1 kald | ~gratis |
| H7 | GPT: strimmel-læsbarhed + completion-token-opblæsning (PageWatch-risiko) | fællesskabet så −40 % prompt men +completion/2× latenstid | density-frontier med OPENAI_API_KEY | ~US$2-5 |
| H8 | Glyfkirurgi (H~K, 0/8, 5/3…) konverterer afståelser til læsninger | efter 1-bit blev ALLE Fable-fejl til afståelser | redigér ~10 bitmaps + genkør matricen | $0 (CLI) |
| H9 | Lyst tema (sort-på-hvidt) > inverteret | litteratur (Glyph-artiklen, Tesseract); aldrig målt på en kommerciel VLM | stil-flag + 2 arme | $0 (CLI) |
| H10 | Opus ved 7×10 lander mellem 0 % (5×8) og 87 % (10×16) → fin afvejning | upstream-kurve 35 % ved 7×10 (n=20) | 1 ekstra arm | $0 (CLI) |
| H11 | Genforsøg-ved-afvisning i proxyen genopretter de ~50 % filtrerede batches | afvisning er stokastisk per kald | implementér + mål i produktion | kode |

## 6. Operationelle udestående punkter

1. `gh auth login` → opret privat `diegosouzapw/omniglyph` + push (10 lokale commits).
2. Anthropic-kredit (H1/H2, geometridommen) og OpenRouter (opbrugt).
3. **Rotér** Anthropic- og OpenRouter-**nøglerne**, der blev eksponeret i chatten.
4. Kodekø: #45 (schema-strip draft-07), genforsøg-ved-afvisning (H11), glyf-
   kirurgi (H8), Fase 4 (TS i scripts, GIF'er, dokumentation, dashboard v2), Fase 5
   (OmniRoute-motor).

## TILLÆG 2026-07-06 — A/B via direkte API (165 kald): H1/H2 AFKRÆFTET

| konfiguration | nøjagtig | afst. | afvisning | fejl |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA og 1-bit) | 0/60 | 0 | **60/60 afvisning** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 forudsagt) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 forudsagt) |
| opus hires 10×16 | **23/30 (77 %)** | 1 | 0 | 6 |

DOM: hi-res-tierets 1928²-side afregnes WYSIWYG (4764 tok,
sweep), men ENCODEREN modtager ikke fuld opløsning — 1-2/30 læst,
med enkelt-glyf-ombytningsfejl (6→8, a→4), signaturen på en intern
resampling. **Afregning ≠ encoder-input → fælde: 3,3× omkostningen, dårligere læsbarhed.**
ANVENDT: pageGeometryForTier() tilbageført — begge tiers renderer 1568×728;
tier-infrastrukturen bevaret (præcis afregning forbliver gyldig, og fremtidig
gentuning er 1 linje). H3 opdateret: "transport-resampling" var (også) API'ets
eget encoder. Afvisning ved transskription via rå API: 100 % på standardsiden
(H4 forstærket — kun agent-formuleringen slipper igennem). Opus 10×16 bekræftet på
begge transporter (77-87 %).

## TILLÆG 2026-07-06 (2) — GPT-5.5-batteri via direkte API: H7 lukket (FEJLET)

| arm | verbatim | gist | output/svar |
|---|---:|---:|---:|
| strimmel 768×2048 5×8 AA | 0/30 (18 afst, 5 filtreret, 7 fejl) | 0/3 | 2.639 tok |
| strimmel 5×8 1-bit | 0/30 (15 afst, 5 filtreret, 10 fejl) | 1/3 | 2.383 tok |
| TEKST (kontrol) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 kan ikke læse 5×8-glyffer (0/60; ikke engang gist overlever) og opblæser
completion ~40× i forsøget på at tyde dem (2,4-2,7k reasoning-tokens per
spørgsmål) — promptbesparelserne opsluges af outputtet. Den perfekte tekst-
kontrol beviser, at korpuset/spørgsmålene er fornuftige. Bekræfter og kvantificerer
5.5-opt-in'en; gpt-5.6 (standard) forbliver utestet (kontoen har ingen adgang).
Fremtid (H12): GPT-spærringen skal modellere output-opblæsning, ikke kun prompt-
tokens.

## TILLÆG 2026-07-06 (3) — Gemini 2.5-flash (DELVIS: gratistier-kvote sprang midtvejs)

Af de ~26 billedsvar, der kom igennem, før kvoten døde: **0 korrekte,
1 afståelse, ~25 KONFABULATIONER** — og de er ikke glyf-forvekslinger: de er
tilfældige cifre (`indexLedgerInd → 0040375615`), dvs. encoderen ser
næsten intet ved de testede tætheder (nativ flise 42 tegn/tok og MEDIUM
flad) og 2.5-flash OPFINDER i stedet for at afstå (ignorerer ILEGIVEL-
instruktionen). Tekstkontrol: 3/3 på dem, der kom igennem. Ingen output-
opblæsning (6-28 tok/svar).

Foreløbigt signal: H5/H6 hælder mod NEJ på 2.5-flash, med en fejltilstand
VÆRRE end GPT's (stille konfabulation i stedet for afståelse) — Gemini ville
kræve ekstra sikkerhedsforanstaltninger i proxyen. Afventer lukning: genkør med
betalt kvote eller på en anden dag, og test gemini-2.5-pro (flash er den svageste
læser i familien). Native-flise-siden har stadig det bedste DOKUMENTEREDE
forhold (42,3 tegn/token); det er læsbarheden, der er i tvivl.

Omkostningsnote: delvise sider (korpusets sidste) afregnes dårligt under flise-
regimet (lav højde → lille beskæringsenhed → flere fliser) — padding af den sidste
side til 1152px højde er en obligatorisk optimering, hvis Gemini kommer med.
