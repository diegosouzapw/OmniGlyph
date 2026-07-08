# OmniGlyph — Vipimo vilivyoratibiwa (2026-07-05)

Kila kitu KILICHOPIMWA katika kikao hiki, pamoja na chanzo na n; nadharia
zimetenganishwa wazi mwishoni. Risiti: `benchmarks/billing-sweep/results/`
na `benchmarks/density-frontier/results/` (JSONL kwa kila jibu).

## 1. Bili ya Anthropic (count_tokens ya moja kwa moja, $0, jiometri 11 × miundo 2)

Fomula iliyothibitishwa: `tokens = ceil(w/28) × ceil(h/28)` baada ya
kubadilisha ukubwa kwa kila ngazi, **+3/kizuizi (Fable 5) / +4/kizuizi
(Sonnet 4.5)** — mabaki SIFURI katika safu zote.

| uchunguzi | vipimo | Fable 5 (ubora wa juu) | Sonnet 4.5 (kawaida) |
|---|---|---:|---:|
| nanga ya hati | 1092×1092 | 1524 | 1525 |
| nanga ya hati | 1000×1000 | 1299 | 1300 |
| ukurasa wa kawaida | 1568×728 | 1459 | 1460 |
| **ukurasa mkubwa** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| kikomo cha ubora wa juu | 1960×1960 | 4764 (clamp) | 1525 |
| ukingo mrefu wa ubora wa juu | 2576×1204 | 3959 | 1516 |
| ukanda mrefu | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (nyingi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>picha 20) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→kupunguzwa ubora, HAIJAKATALIWA katika count_tokens) | 3585 |

Maamuzi yaliyotokana (yametekelezwa): lango sahihi la kipande; ngazi kwa
kila muundo (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = ubora wa juu); `cols`
313→312.

## 2. Usahihi wa usomaji (density-frontier, sindano za hex/camelCase/tarakimu +
vikengeushi)

### Muundo wa 2×2 wa Fable 5 — kupitia CLI/usajili, n=30/kikundi, kundi
lilelile la data (~herufi 16.6k)

| ukurasa × atlasi | sahihi | kujiepusha (ILEGIVEL) | hitilafu za kimya |
|---|---:|---:|---:|
| kawaida 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| kawaida 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| ubora wa juu 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| ubora wa juu 1928×1928 · AA | 0/30 | 29 | 1 (ilitabiriwa na muundo) |

→ **1-bit > AA kwenye kurasa zote mbili; uvumbuzi sifuri katika maswali 120.**
IMETEKELEZWA: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ ukurasa wa ubora wa juu unafika umeharibika na usafirishaji wa resample
(angalia H1/H3) — 67% ni sakafu, si dari.

### Opus 4.8 — kupitia CLI/usajili, n=30/kikundi

| mpangilio | sahihi | kujiepusha | hitilafu |
|---|---:|---:|---:|
| ubora wa juu · seli 10×16 | **26/30 (87%)** | 0 | 4 (tarakimu) |
| kawaida · seli 5×8 | 0/30 | 30 | 0 |

→ Goti la Opus limethibitishwa na n yetu wenyewe (upstream ilipima 95% kwa
10×16 na n=20). "Hali salama ya Opus" inaweza kutekelezwa: 10×16 kwenye
ukurasa mkubwa ≈ herufi 1.7 kwa kila token ya picha katika kundi la data la
mfumo.

### Kupitia OpenRouter (kundi la data/maswali sawa) — hayakamiliki kwa
usomekaji

| ukweli uliopimwa | idadi |
|---|---|
| content_filter kwenye maswali ya unukuzi (kurasa za kawaida) | 60/60 (100%) |
| content_filter kwenye kurasa za ubora wa juu | 5-6/30 (~20%) |
| Fable ubora wa juu: kujiepusha + hitilafu | 20 ILEGIVEL + hitilafu 5 (2 zilizotabiriwa) |
| Opus 10×16 (kabla mikopo haijaisha) | 7/9 sahihi (78%) |
| makosa yaliyotabiriwa na muundo wa kufanana | 4→a, 0→8, herufi kubwa/ndogo S/s |

### Ulinganisho wa usafirishaji (swali lilelile, maudhui yaleyale)

| usafirishaji | kichujio/kukataliwa | ukurasa mkubwa unasomeka? |
|---|---|---|
| API ya moja kwa moja (n=9, kabla mikopo haijaisha) | 0 | haikujaribiwa |
| OpenRouter | ~100% std / ~20% hi-res | hapana (inashukiwa: resample) |
| CLI ya Claude Code (usajili) | 0 content_filter; ~50% ya makundi makubwa yalisimama (yalitatuliwa kwa vipande vya 10 + kujaribu tena) | hapana (inashukiwa: Read hupunguza ukubwa) |

## 3. Gharama kwa kila mtoa huduma (nje ya mtandao, sahihi — kurasa KAMILI,
kinadharia)

| mtoa huduma · ukurasa | token/ukurasa | herufi/ukurasa | **herufi/token** | hali |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (miundo yote) | 1460 | 28,080 | **19.2** | imepimwa |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (mara 3.3 picha chache) | bili imepimwa; usomekaji unasubiri (H1) |
| GPT-5 (kigae) ukanda 768×2048 | 1190 | ~38,760 | **32.6** | hati zilizokaguliwa |
| GPT-5.4/5.5 (kipande, original) hadi 1568×5984 | ~9,163 | ~233k | **25.4** | hati; usomekaji haujajaribiwa |
| gpt-4o-mini | 48,169/ukanda | — | **0.8 — KAMWE USICHORE KAMA PICHA** | hati (hitilafu D2 imerekebishwa) |
| Gemini kigae 1533×1152 (kitengo cha ukataji asilia 768) | 1032 | 43,615 | **42.3 ← bora zaidi ulioandikwa** | hati; usomekaji haujajaribiwa |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (ikiwa inasomeka)** | nadharia H6 |

## 4. Hitilafu zilizogunduliwa na kurekebishwa (ukaguzi dhidi ya hati rasmi)

| id | hitilafu | athari | commit |
|---|---|---|---|
| D2 | gpt-4o-mini ilianguka katika kigae chaguo-msingi 85/170 (halisi: 2833/5667) | gharama ilipunguzwa makadirio ~mara 33 — **lango lililogeuzwa** | e6bc75f |
| D1 | kizidishi cha o4-mini 1.62 (halisi 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) na kikomo 10000 (halisi 1536, bila original) | ingevunjika na kurasa kubwa zaidi | e6bc75f |
| D4 | gpt-5-codex-mini katika utawala wa kigae (halisi: kipande 1536) | ≥+23% kupunguzwa makadirio | e6bc75f |
| D5 | detail:'original' imewekwa ngumu kwa kila muundo (ipo tu katika 5.4+) | nje ya mkataba | e6bc75f |
| #44 | kigezo cha maelezo kiliingizwa katika zana zilizoandikwa → 400 + kurudi nyuma kimya | akiba ilifutwa bila ishara | 0f66e32 |
| AA | atlasi ya AA katika uzalishaji kinyume na maoni ya "eval-only" | −17pp usomaji kwenye Fable | 9a25585 |
| — | slab cols 313 (px 1573) → resample 0.997× + safu ya ziada ya kipande | imerekebishwa kuwa 312 | msingi |

## 5. Nadharia wazi (gharama ya kufunga kila moja)

| id | nadharia | ushahidi wa sasa | jaribio la maamuzi | gharama |
|---|---|---|---|---|
| H1 | Ukurasa wa 1928² husomeka ≥ kawaida kwenye API ya moja kwa moja (WYSIWYG imethibitishwa katika bili) | bili 4764 bila resample; 1-bit tayari inasoma 67% hata ikiwa imeharibika | A/B ya moja kwa moja std dhidi ya hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit kwenye API ya moja kwa moja ≈ 100% na mara 3.3 picha chache | H1 + muundo wa 2×2 | sawa na H1 | sawa |
| H3 | Read ya CLI na OpenRouter hupunguza ukubwa wa picha >px 1568/2000 | 5×8 hufa na 10×16 hunusurika KATIKA UKURASA HULE HULE | ukurasa mmoja wa 1928² na glyph 20×32 kwa kila usafirishaji | ~US$0 (CLI) |
| H4 | Kukataliwa hutegemea uundaji (wakala-anayesoma-faili ≈ 0% dhidi ya API ghafi ≈ 100%) | ulinganisho wa usafirishaji hapo juu | A/B ya maneno kwenye njia halisi ya proxy | chini |
| H5 | Gemini kigae 1533×1152 kinasomeka kwa 5×8 (herufi 42 kwa token) | hakuna | density-frontier na GEMINI_API_KEY | ~bure (ngazi bure) |
| H6 | media_resolution:low inasomeka (herufi 116 kwa token) | haiwezekani (kichakataji cha ubora wa chini), lakini hakuna aliyepima | wito 1 | ~bure |
| H7 | GPT: usomekaji wa ukanda + upandishaji wa token za umalizio (hatari ya PageWatch) | jamii iliona −40% prompt lakini +umalizio/muda mara 2 | density-frontier na OPENAI_API_KEY | ~US$2-5 |
| H8 | Upasuaji wa glyph (H~K, 0/8, 5/3…) hubadilisha kujiepusha kuwa usomaji | baada ya 1-bit, MAKOSA YOTE ya Fable yakawa kujiepusha | hariri bitmap ~10 + endesha upya muundo | $0 (CLI) |
| H9 | Mandhari nyepesi (weusi-kwenye-weupe) > iliyogeuzwa | fasihi (karatasi ya Glyph, Tesseract); haijapimwa kwenye VLM ya kibiashara | bendera ya mtindo + vikundi 2 | $0 (CLI) |
| H10 | Opus kwa 7×10 unaanguka kati ya 0% (5×8) na 87% (10×16) → biashara nzuri | mkondo wa upstream 35% kwa 7×10 (n=20) | kikundi 1 zaidi | $0 (CLI) |
| H11 | Kujaribu-tena-baada-ya-kukataliwa katika proxy hurejesha ~50% ya makundi yaliyochujwa | kukataliwa ni bahati nasibu kwa kila wito | tekeleza + pima katika uzalishaji | msimbo |

## 6. Vipengele vinavyosubiri vya uendeshaji

1. `gh auth login` → tengeneza `diegosouzapw/omniglyph` ya faragha + sukuma
   (commit 10 za ndani).
2. Mikopo ya Anthropic (H1/H2, uamuzi wa jiometri) na OpenRouter
   (imekwisha).
3. **Zungusha** funguo za Anthropic na OpenRouter zilizofichuliwa kwenye
   mazungumzo.
4. Foleni ya msimbo: #45 (kuondoa schema draft-07), kujaribu-tena-baada-ya-kukataliwa
   (H11), upasuaji wa glyph (H8), Awamu ya 4 (TS katika scripts, GIF, hati,
   dashibodi v2), Awamu ya 5 (injini ya OmniRoute).

## NYONGEZA 2026-07-06 — A/B kupitia API ya moja kwa moja (wito 165): H1/H2
ZIMEKANUSHWA

| mpangilio | sahihi | kujiepusha | kukataliwa | hitilafu |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA na 1-bit) | 0/60 | 0 | **60/60 kukataliwa** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 zilizotabiriwa) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 zilizotabiriwa) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

UAMUZI: ukurasa wa 1928² wa ngazi ya ubora wa juu HUTOZWA KWA WYSIWYG (token
4764, uchunguzi) lakini KICHAKATAJI hakipati ubora kamili — usomaji 1-2/30,
na hitilafu za kubadilishana glyph moja (6→8, a→4), dalili ya resample ya
ndani. **Bili ≠ ingizo la kichakataji → mtego: mara 3.3 ya gharama, usomekaji
mbaya zaidi.** IMETEKELEZWA: pageGeometryForTier() imerudishwa nyuma;
ngazi zote mbili huchora 1568×728; miundombinu ya ngazi imehifadhiwa (bili
sahihi inabaki halali na urekebishaji wa baadaye ni mstari 1). H3
imesasishwa: "resample ya usafirishaji" ilikuwa (pia) kichakataji cha API
lenyewe. Kukataliwa kwa unukuzi kupitia API ghafi: 100% kwenye ukurasa wa
kawaida (H4 imeimarishwa — uundaji wa wakala pekee unaepuka). Opus 10×16
imethibitishwa katika usafirishaji wote miwili (77-87%).

## NYONGEZA 2026-07-06 (2) — kundi la GPT-5.5 kupitia API ya moja kwa moja:
H7 imefungwa (IMESHINDWA)

| kikundi | halisi | mfano | matokeo/jibu |
|---|---:|---:|---:|
| ukanda 768×2048 5×8 AA | 0/30 (18 kujiepusha, 5 vilivyochujwa, 7 hitilafu) | 0/3 | token 2,639 |
| ukanda 5×8 1-bit | 0/30 (15 kujiepusha, 5 vilivyochujwa, 10 hitilafu) | 1/3 | token 2,383 |
| MAANDISHI (udhibiti) | **30/30** | **3/3** | token **62** |

GPT-5.5 haiwezi kusoma glyph za 5×8 (0/60; hata mfano hausalimiki) na
hupandisha umalizio ~mara 40 ikijaribu kufafanua (token 2.4-2.7k za
mantiki kwa kila swali) — akiba ya prompt hulika na matokeo. Udhibiti wa
maandishi kamili huthibitisha kuwa kundi la data/maswali ni ya kimantiki.
Inathibitisha na kupima 5.5 ya hiari; gpt-5.6 (chaguo-msingi) inabaki
haijajaribiwa (akaunti haina ufikiaji). Baadaye (H12): lango la GPT lazima
lizingatie upandishaji wa matokeo, si tu token za prompt.

## NYONGEZA 2026-07-06 (3) — Gemini 2.5-flash (SEHEMU: mgao wa ngazi bure
uliisha katikati ya mzunguko)

Kati ya majibu ~26 ya picha yaliyopita kabla mgao haujaisha: **0 sahihi, 1
kujiepusha, ~25 UVUMBUZI** — na si mkanganyiko wa glyph: ni tarakimu za
nasibu (`indexLedgerInd → 0040375615`), yaani kichakataji karibu hakioni
chochote katika msongamano uliojaribiwa (kigae asilia herufi 42 kwa token
na MEDIUM tambarare) na 2.5-flash HUBUNI badala ya kujiepusha (hupuuza
maelekezo ya ILEGIVEL). Udhibiti wa maandishi: 3/3 kwenye zile zilizopita.
Hakuna upandishaji wa matokeo (token 6-28 kwa jibu).

Ishara ya awali: H5/H6 huelekea HAPANA kwenye 2.5-flash, na hali ya
kushindwa MBAYA ZAIDI kuliko ya GPT (uvumbuzi wa kimya badala ya
kujiepusha) — Gemini ingehitaji ulinzi wa ziada katika proxy. Inasubiri
kufungwa: jaribu tena na mgao ulioolipiwa au siku nyingine, na jaribu
gemini-2.5-pro (flash ndiye msomaji dhaifu zaidi wa familia). Ukurasa wa
kigae asilia bado una uwiano BORA ULIOANDIKWA (herufi 42.3 kwa token); ni
usomekaji ndio unaotiliwa shaka.

Kumbuka ya gharama: kurasa za sehemu (ya mwisho ya kundi la data) hutozwa
vibaya chini ya utawala wa kigae (urefu mfupi → kitengo kidogo cha ukataji
→ vigae zaidi) — kuongeza pedi kwenye ukurasa wa mwisho hadi px 1152 za
urefu ni uboreshaji wa lazima ikiwa Gemini itaingizwa.
