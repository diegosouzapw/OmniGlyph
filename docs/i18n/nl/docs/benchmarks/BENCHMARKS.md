# OmniGlyph — Geconsolideerde metingen (2026-07-05)

Alles GEMETEN in deze sessie, met bron en n; hypothesen zijn duidelijk
gescheiden aan het einde. Bewijzen: `benchmarks/billing-sweep/results/` en
`benchmarks/density-frontier/results/` (JSONL per antwoord).

## 1. Anthropic-billing (directe count_tokens, $0, 11 geometrieën × 2 modellen)

Bevestigde formule: `tokens = ceil(w/28) × ceil(h/28)` na resize per tier,
**+3/blok (Fable 5) / +4/blok (Sonnet 4.5)** — NUL residu over alle rijen.

| probe | afmetingen | Fable 5 (high-res) | Sonnet 4.5 (standaard) |
|---|---|---:|---:|
| doc-anker | 1092×1092 | 1524 | 1525 |
| doc-anker | 1000×1000 | 1299 | 1300 |
| standaardpagina | 1568×728 | 1459 | 1460 |
| **grote pagina** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| hi-res plafond | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res lange rand | 2576×1204 | 3959 | 1516 |
| smalle strook | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 afb.) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, NIET afgewezen in count_tokens) | 3585 |

Afgeleide beslissingen (geïmplementeerd): exacte poort per patch;
model-tier (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Leesnauwkeurigheid (density-frontier, hex/camelCase/cijfer-needles + afleiders)

### Fable 5 2×2-matrix — via CLI/abonnement, n=30/arm, zelfde corpus (~16,6k tekens)

| pagina × atlas | exact | onthoudingen (ILEGIVEL) | stille fouten |
|---|---:|---:|---:|
| standaard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standaard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (voorspeld door de matrix) |

→ **1-bit > AA op beide pagina's; nul confabulatie over 120 vragen.**
TOEGEPAST: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res arriveert gedegradeerd door transport-resample (zie H1/H3) — de
67% is een vloer, geen plafond.

### Opus 4.8 — via CLI/abonnement, n=30/arm

| config | exact | onthoudingen | fouten |
|---|---:|---:|---:|
| high-res · 10×16-cel | **26/30 (87%)** | 0 | 4 (cijfers) |
| standaard · 5×8-cel | 0/30 | 30 | 0 |

→ Opus-knik bevestigd met onze eigen n (upstream mat 95% bij 10×16 met
n=20). "Opus safe mode" is haalbaar: 10×16 op de grote pagina ≈ 1,7 tekens
per image-token op het harness-corpus.

### Via OpenRouter (zelfde corpus/vragen) — niet conclusief voor leesbaarheid

| gemeten feit | getal |
|---|---|
| content_filter bij transcriptievragen (standaardpagina's) | 60/60 (100%) |
| content_filter bij high-res-pagina's | 5-6/30 (~20%) |
| Fable high-res: onthoudingen + fouten | 20 ILEGIVEL + 5 fouten (2 voorspeld) |
| Opus 10×16 (voordat de credits opraakten) | 7/9 exact (78%) |
| verkeerde lezingen voorspeld door de verwarringsmatrix | 4→a, 0→8, S/s-hoofdletter |

### Transportvergelijking (zelfde vraag, zelfde inhoud)

| transport | filter/weigering | grote pagina leesbaar? |
|---|---|---|
| Directe API (n=9, voordat de credits opraakten) | 0 | niet getest |
| OpenRouter | ~100% std / ~20% hi-res | nee (vermoed: resample) |
| Claude Code CLI (abonnement) | 0 content_filter; ~50% van grote batches vastgelopen (opgelost met chunks van 10 + retry) | nee (vermoed: Read schaalt terug) |

## 3. Kosten per provider (offline, exact — VOLLEDIGE pagina's, theoretisch)

| provider · pagina | tokens/pagina | tekens/pagina | **tekens/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (alle modellen) | 1460 | 28.080 | **19,2** | gemeten |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92.160 | **19,3** (3,3× minder afbeeldingen) | billing gemeten; leesbaarheid in afwachting (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38.760 | **32,6** | geauditeerde documentatie |
| GPT-5.4/5.5 (patch, original) tot 1568×5984 | ~9.163 | ~233k | **25,4** | documentatie; leesbaarheid ongetest |
| gpt-4o-mini | 48.169/strip | — | **0,8 — NOOIT als afbeelding** | documentatie (bug D2 opgelost) |
| Gemini tile 1533×1152 (native crop-eenheid 768) | 1032 | 43.615 | **42,3 ← beste gedocumenteerd** | documentatie; leesbaarheid ongetest |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32.604 | **116 (indien leesbaar)** | hypothese H6 |

## 4. Gevonden en opgeloste bugs (audit tegen officiële documentatie)

| id | bug | impact | commit |
|---|---|---|---|
| D2 | gpt-4o-mini viel in de standaardtegel 85/170 (werkelijk: 2833/5667) | kosten ~33× onderschat — **omgekeerde poort** | e6bc75f |
| D1 | o4-mini-multiplier 1,62 (werkelijk 1,72) | −5,8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) met cap 10000 (werkelijk 1536, geen original) | zou breken bij grotere pagina's | e6bc75f |
| D4 | gpt-5-codex-mini in het tile-regime (werkelijk: patch 1536) | ≥+23% onderschat | e6bc75f |
| D5 | detail:'original' hardcoded voor elk model (bestaat alleen in 5.4+) | buiten contract | e6bc75f |
| #44 | description-stub geïnjecteerd in typed tools → 400 + stille fallback | besparingen op nul zonder signaal | 0f66e32 |
| AA | AA-atlas in productie tegen het "eval-only"-commentaar in | −17pp leesvaardigheid op Fable | 9a25585 |
| — | slab cols 313 (1573px) → 0,997× resample + extra patchkolom | gefixt naar 312 | baseline |

## 5. Open hypothesen (wat het kost om elk af te sluiten)

| id | hypothese | huidig bewijs | beslissende test | kosten |
|---|---|---|---|---|
| H1 | De 1928²-pagina leest ≥ standaard op de directe API (WYSIWYG bewezen in billing) | billing 4764 zonder resample; 1-bit leest al 67% zelfs gedegradeerd | directe A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit op de directe API ≈ 100% met 3,3× minder afbeeldingen | H1 + 2×2-matrix | zelfde als H1 | zelfde |
| H3 | De Read van de CLI en OpenRouter schalen afbeeldingen >1568/2000px terug | 5×8 sterft en 10×16 overleeft OP DEZELFDE pagina | één 1928²-pagina met 20×32-glyfen per transport | ~US$0 (CLI) |
| H4 | Weigering hangt af van framing (agent-leest-een-bestand ≈ 0% vs raw API ≈ 100%) | transportvergelijking hierboven | formulering-A/B op het echte proxypad | laag |
| H5 | Gemini tile 1533×1152 leesbaar bij 5×8 (42 tekens/tok) | geen | density-frontier met GEMINI_API_KEY | ~gratis (free tier) |
| H6 | media_resolution:low leesbaar (116 tekens/tok) | onwaarschijnlijk (low-res-encoder), maar niemand heeft het gemeten | 1 call | ~gratis |
| H7 | GPT: strip-leesbaarheid + completion-token-inflatie (PageWatch-risico) | community zag −40% prompt maar +completion/2× latency | density-frontier met OPENAI_API_KEY | ~US$2-5 |
| H8 | Glyf-chirurgie (H~K, 0/8, 5/3…) zet onthoudingen om in lezingen | na 1-bit werden ALLE Fable-missers onthoudingen | ~10 bitmaps bewerken + de matrix opnieuw draaien | $0 (CLI) |
| H9 | Light theme (zwart-op-wit) > geïnverteerd | literatuur (Glyph-paper, Tesseract); nooit gemeten op een commerciële VLM | style-flag + 2 armen | $0 (CLI) |
| H10 | Opus bij 7×10 landt tussen 0% (5×8) en 87% (10×16) → goede trade-off | upstream-curve 35% bij 7×10 (n=20) | 1 extra arm | $0 (CLI) |
| H11 | Retry-on-refusal in de proxy herstelt de ~50% gefilterde batches | weigering is stochastisch per call | implementeren + meten in productie | code |

## 6. Openstaande operationele punten

1. `gh auth login` → private `diegosouzapw/omniglyph` aanmaken + push (10 lokale commits).
2. Anthropic-credits (H1/H2, het geometrieoordeel) en OpenRouter (uitgeput).
3. **Roteer de** Anthropic- en OpenRouter-**sleutels** die in de chat zijn blootgesteld.
4. Codewachtrij: #45 (schema-strip draft-07), retry-on-refusal (H11), glyf-
   chirurgie (H8), Fase 4 (TS in de scripts, GIF's, docs, dashboard v2), Fase 5
   (OmniRoute-engine).

## ADDENDUM 2026-07-06 — A/B via directe API (165 calls): H1/H2 WEERLEGD

| config | exact | onth. | weigering | fouten |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA en 1-bit) | 0/60 | 0 | **60/60 weigering** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 voorspeld) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 voorspeld) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

OORDEEL: de 1928²-pagina van de high-res-tier wordt WYSIWYG GEFACTUREERD
(4764 tok, sweep) maar de ENCODER ontvangt niet de volledige resolutie —
1-2/30 gelezen, met single-glyph-verwisselfouten (6→8, a→4), de signatuur
van een interne resample. **Billing ≠ encoder-input → valkuil: 3,3× de
kosten, slechtere leesbaarheid.** TOEGEPAST: pageGeometryForTier()
teruggedraaid — beide tiers renderen 1568×728; tier-infra behouden (exacte
billing blijft geldig en de toekomstige retune is 1 regel). H3
bijgewerkt: de "transport-resample" was (ook) de eigen encoder van de API.
Weigering bij transcriptie via raw API: 100% op de standaardpagina (H4
bevestigd — alleen de agent-framing ontsnapt). Opus 10×16 bevestigd op
beide transporten (77-87%).

## ADDENDUM 2026-07-06 (2) — GPT-5.5-batterij via directe API: H7 afgesloten (MISLUKT)

| arm | verbatim | gist | output/antwoord |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 onth, 5 gefilterd, 7 fouten) | 0/3 | 2.639 tok |
| strip 5×8 1-bit | 0/30 (15 onth, 5 gefilterd, 10 fouten) | 1/3 | 2.383 tok |
| TEKST (controle) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 kan geen 5×8-glyfen lezen (0/60; zelfs de gist overleeft niet) en
laat de completion ~40× oplopen bij de poging ze te ontcijferen (2,4-2,7k
reasoning-tokens per vraag) — de promptbesparingen worden opgeslokt door de
output. De perfecte tekstcontrole bewijst dat het corpus/de vragen deugdelijk
zijn. Bevestigt en kwantificeert de 5.5-opt-in; gpt-5.6 (standaard) blijft
ongetest (account heeft geen toegang). Toekomst (H12): de GPT-poort moet
output-inflatie modelleren, niet alleen prompt-tokens.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (GEDEELTELIJK: free-tier-quotum knapte halverwege)

Van de ~26 image-antwoorden die er doorheen kwamen voordat het quotum
opraakte: **0 correct, 1 onthouding, ~25 CONFABULATIES** — en het zijn geen
glyfverwarringen: het zijn willekeurige cijfers (`indexLedgerInd →
0040375615`), d.w.z. de encoder ziet vrijwel niets bij de geteste
dichtheden (native tile 42 tekens/tok en MEDIUM flat) en 2.5-flash VERZINT
in plaats van zich te onthouden (negeert de ILEGIVEL-instructie).
Tekstcontrole: 3/3 op de antwoorden die erdoorheen kwamen. Geen
output-inflatie (6-28 tok/antwoord).

Voorlopig signaal: H5/H6 neigen naar NEE op 2.5-flash, met een faalmodus
ERGER dan die van GPT (stille confabulatie in plaats van onthouding) —
Gemini zou extra waarborgen in de proxy nodig hebben. Nog af te sluiten:
opnieuw draaien met betaald quotum of op een andere dag, en gemini-2.5-pro
testen (flash is de zwakste lezer in de familie). De native-tile-pagina
heeft nog steeds de beste GEDOCUMENTEERDE ratio (42,3 tekens/token); het is
de leesbaarheid die in twijfel staat.

Kostennotitie: gedeeltelijke pagina's (de laatste van het corpus) worden
slecht gefactureerd onder het tile-regime (kortere hoogte → kleinere
crop-eenheid → meer tiles) — het opvullen van de laatste pagina tot 1152px
hoogte is een verplichte optimalisatie als Gemini erbij komt.
