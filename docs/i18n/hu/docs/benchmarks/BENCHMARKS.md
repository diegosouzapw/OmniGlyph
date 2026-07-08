# OmniGlyph — Konszolidált mérések (2026-07-05)

Minden, ami ebben a munkamenetben MÉRVE lett, forrással és n-nel; a
hipotézisek egyértelműen elkülönítve a végén. Bizonyítékok:
`benchmarks/billing-sweep/results/` és `benchmarks/density-frontier/results/`
(JSONL válaszonként).

## 1. Anthropic számlázás (közvetlen count_tokens, $0, 11 geometria × 2 modell)

Megerősített képlet: `tokens = ceil(w/28) × ceil(h/28)` szintenkénti
átméretezés után, **+3/blokk (Fable 5) / +4/blokk (Sonnet 4.5)** — NULLA
maradék minden sorban.

| próba | méretek | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| doc horgony | 1092×1092 | 1524 | 1525 |
| doc horgony | 1000×1000 | 1299 | 1300 |
| standard oldal | 1568×728 | 1459 | 1460 |
| **nagy oldal** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| hi-res plafon | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res hosszú él | 2576×1204 | 3959 | 1516 |
| magas csík | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 kép) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→leskálázás, NEM elutasítva a count_tokens-ben) | 3585 |

Levezetett döntések (implementálva): pontos patch-alapú kapu; modellenkénti
szint (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Olvasási pontosság (density-frontier, hex/camelCase/számjegy tűk elterelőkkel)

### Fable 5 2×2-es mátrix — CLI/előfizetésen keresztül, n=30/kar, azonos korpusz (~16,6k karakter)

| oldal × atlasz | pontos | tartózkodás (ILEGIVEL) | néma hiba |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (a mátrix által predikálva) |

→ **1-bit > AA mindkét oldalon; nulla konfabuláció 120 kérdésen át.**
ALKALMAZVA: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ a high-res transzport-resample miatt degradáltan érkezik (lásd H1/H3), a
67% egy padló, nem plafon.

### Opus 4.8 — CLI/előfizetésen keresztül, n=30/kar

| konfig | pontos | tartózkodás | hiba |
|---|---:|---:|---:|
| high-res · 10×16 cella | **26/30 (87%)** | 0 | 4 (számjegy) |
| standard · 5×8 cella | 0/30 | 30 | 0 |

→ Az Opus töréspontja megerősítve a saját n-ünkkel (az upstream 95%-ot mért
10×16-nál, n=20-szal). Az "Opus biztonságos mód" életképes: 10×16 a nagy
oldalon ≈ 1,7 karakter kép-tokenenként a harness korpuszán.

### OpenRouteren keresztül (azonos korpusz/kérdések) — nem döntő az olvashatóságra

| mért tény | szám |
|---|---|
| content_filter transzkripciós kérdéseknél (standard oldalak) | 60/60 (100%) |
| content_filter high-res oldalaknál | 5-6/30 (~20%) |
| Fable high-res: tartózkodások + hibák | 20 ILEGIVEL + 5 hiba (2 predikált) |
| Opus 10×16 (a kreditek elfogyása előtt) | 7/9 pontos (78%) |
| az összekeverhetőségi mátrix által predikált téves olvasások | 4→a, 0→8, S/s eset |

### Transzport-összehasonlítás (azonos kérdés, azonos tartalom)

| transzport | szűrés/elutasítás | a nagy oldal olvasható? |
|---|---|---|
| Közvetlen API (n=9, a kreditek elfogyása előtt) | 0 | nem tesztelve |
| OpenRouter | ~100% std / ~20% hi-res | nem (gyanú: resample) |
| Claude Code CLI (előfizetés) | 0 content_filter; a nagy batch-ek ~50%-a elakadt (megoldva 10-es chunkokkal + retry) | nem (gyanú: Read átméretez) |

## 3. Költség szolgáltatónként (offline, pontos — TELJES oldalak, elméleti)

| szolgáltató · oldal | token/oldal | karakter/oldal | **karakter/token** | státusz |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (minden modell) | 1460 | 28 080 | **19,2** | mérve |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92 160 | **19,3** (3,3×-szal kevesebb kép) | számlázás mérve; olvashatóság függőben (H1) |
| GPT-5 (csempe) csík 768×2048 | 1190 | ~38 760 | **32,6** | auditált dokumentáció |
| GPT-5.4/5.5 (patch, original) akár 1568×5984-ig | ~9163 | ~233k | **25,4** | dokumentáció; olvashatóság nem tesztelve |
| gpt-4o-mini | 48 169/csík | — | **0,8 — SOHA NE képesítse** | dokumentáció (D2 hiba javítva) |
| Gemini csempe 1533×1152 (natív vágási egység 768) | 1032 | 43 615 | **42,3 ← legjobb dokumentált** | dokumentáció; olvashatóság nem tesztelve |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32 604 | **116 (ha olvasható)** | H6 hipotézis |

## 4. Talált és javított hibák (audit a hivatalos dokumentáció alapján)

| id | hiba | hatás | commit |
|---|---|---|---|
| D2 | a gpt-4o-mini az alapértelmezett 85/170-es csempébe esett (valós: 2833/5667) | költség alulbecsülve ~33×-szal — **fordított kapu** | e6bc75f |
| D1 | o4-mini szorzó 1,62 (valós 1,72) | −5,8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) 10000-es plafonnal (valós 1536, original nélkül) | nagyobb oldalaknál eltörne | e6bc75f |
| D4 | gpt-5-codex-mini a csempe-rezsimben (valós: patch 1536) | ≥+23% alulbecsülve | e6bc75f |
| D5 | detail:'original' minden modellhez hardkódolva (csak az 5.4+-ban létezik) | szerződésen kívül | e6bc75f |
| #44 | leírás-stub beszúrva típusos eszközökbe → 400 + néma fallback | a megtakarítás jelzés nélkül nullázódott | 0f66e32 |
| AA | AA atlasz éles környezetben a "csak-eval" komment ellenére | −17pp olvasás a Fable-en | 9a25585 |
| — | slab cols 313 (1573px) → 0,997×-es resample + extra patch oszlop | 312-re javítva | alapérték |

## 5. Nyitott hipotézisek (mennyibe kerül lezárni mindegyiket)

| id | hipotézis | jelenlegi bizonyíték | döntő teszt | költség |
|---|---|---|---|---|
| H1 | Az 1928²-es oldal ≥ standard olvasható a közvetlen API-n (WYSIWYG bizonyítva a számlázásban) | 4764-es számlázás resample nélkül; az 1-bit már degradáltan is 67%-ot olvas | közvetlen A/B std vs hi-res (1-bit) | ~4 USD API |
| H2 | hi-res + 1-bit a közvetlen API-n ≈ 100%, 3,3×-szal kevesebb képpel | H1 + 2×2-es mátrix | ugyanaz, mint H1 | ugyanaz |
| H3 | A CLI Read-je és az OpenRouter átméretezi a >1568/2000px-es képeket | az 5×8 elhal, a 10×16 túléli UGYANAZON az oldalon | egy 1928²-es oldal 20×32-es glifekkel transzportonként | ~0 USD (CLI) |
| H4 | Az elutasítás a megfogalmazástól függ (ágens-fájlt-olvas ≈ 0% vs nyers API ≈ 100%) | fenti transzport-összehasonlítás | megfogalmazás A/B a valós proxy útvonalon | alacsony |
| H5 | Gemini csempe 1533×1152 olvasható 5×8-nál (42 karakter/token) | nincs | density-frontier GEMINI_API_KEY-jel | ~ingyenes (ingyenes szint) |
| H6 | media_resolution:low olvasható (116 karakter/token) | valószínűtlen (alacsony felbontású enkóder), de senki nem mérte | 1 hívás | ~ingyenes |
| H7 | GPT: csík-olvashatóság + completion-token felfújás (PageWatch kockázat) | a közösség −40% promptot látott, de +completion/2×-es késleltetést | density-frontier OPENAI_API_KEY-jel | ~2-5 USD |
| H8 | Glif-sebészet (H~K, 0/8, 5/3…) a tartózkodásokat olvasásokká alakítja | 1-bit után MINDEN Fable-hiba tartózkodássá vált | ~10 bitmap szerkesztése + mátrix újrafuttatása | 0 USD (CLI) |
| H9 | Világos téma (fekete-fehéren) > invertált | szakirodalom (Glyph paper, Tesseract); soha nem mérve kereskedelmi VLM-en | stílus flag + 2 kar | 0 USD (CLI) |
| H10 | Opus 7×10-nél 0% (5×8) és 87% (10×16) között landol → jó kompromisszum | upstream görbe 35% 7×10-nél (n=20) | 1 extra kar | 0 USD (CLI) |
| H11 | Elutasításnál-újrapróbálkozás a proxyban visszanyeri a szűrt batch-ek ~50%-át | az elutasítás hívásonként sztochasztikus | implementálás + mérés élesben | kód |

## 6. Operatív függőben lévő tételek

1. `gh auth login` → privát `diegosouzapw/omniglyph` létrehozása + push (10 helyi commit).
2. Anthropic kreditek (H1/H2, a geometriai ítélet) és OpenRouter (elfogyott).
3. **Forgassa el** a chatben felfedett Anthropic és OpenRouter **kulcsokat**.
4. Kód-sor: #45 (schema-strip draft-07), elutasításnál-újrapróbálkozás (H11), glif-
   sebészet (H8), 4. fázis (TS a scriptekben, GIF-ek, dokumentáció, dashboard v2), 5. fázis
   (OmniRoute motor).

## KIEGÉSZÍTÉS 2026-07-06 — A/B közvetlen API-n keresztül (165 hívás): H1/H2 MEGCÁFOLVA

| konfig | pontos | tartózkodás | elutasítás | hiba |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA és 1-bit) | 0/60 | 0 | **60/60 elutasítás** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predikált) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predikált) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

ÍTÉLET: a high-res szint 1928²-es oldala WYSIWYG módon van SZÁMLÁZVA (4764
token, sweep), de az ENKÓDER nem kapja meg a teljes felbontást — 1-2/30
olvasás, egyedi-glif csere hibákkal (6→8, a→4), egy belső resample aláírásával.
**Számlázás ≠ enkóder bemenet → csapda: 3,3×-os költség, rosszabb
olvashatóság.** ALKALMAZVA: a pageGeometryForTier() visszaállítva — mindkét
szint az 1568×728-at rendereli; a szint-infrastruktúra megmaradt (a pontos
számlázás továbbra is érvényes, és a jövőbeli finomhangolás 1 sor). A H3
frissítve: a "transzport resample" (részben) maga az API enkódere volt. Az
elutasítás transzkripciónál nyers API-n keresztül: 100% a standard oldalon
(H4 megerősítve — csak az ágens-megfogalmazás menekül meg). Az Opus 10×16
mindkét transzporton megerősítve (77-87%).

## KIEGÉSZÍTÉS 2026-07-06 (2) — GPT-5.5 sorozat közvetlen API-n keresztül: H7 lezárva (SIKERTELEN)

| kar | szó szerinti | lényeg | kimenet/válasz |
|---|---:|---:|---:|
| csík 768×2048 5×8 AA | 0/30 (18 tartózkodás, 5 szűrve, 7 hiba) | 0/3 | 2639 token |
| csík 5×8 1-bit | 0/30 (15 tartózkodás, 5 szűrve, 10 hiba) | 1/3 | 2383 token |
| SZÖVEG (kontroll) | **30/30** | **3/3** | **62 token** |

A GPT-5.5 nem képes olvasni az 5×8-as glifeket (0/60; még a lényeg sem
marad meg), és a válaszát ~40×-esen felfújja próbálkozás közben (2,4-2,7k
reasoning token kérdésenként) — a prompt-megtakarítást felemészti a
kimenet. A tökéletes szöveges kontroll bizonyítja, hogy a korpusz/kérdések
épek. Megerősíti és számszerűsíti az 5.5-ös opt-int; a gpt-5.6
(alapértelmezett) továbbra sem tesztelhető (a fióknak nincs hozzáférése).
Jövőbeli (H12): a GPT-kapunak a kimenet-felfújást is modelleznie kell, nem
csak a prompt-tokeneket.

## KIEGÉSZÍTÉS 2026-07-06 (3) — Gemini 2.5-flash (RÉSZLEGES: az ingyenes szint kvótája kifutott középen)

A ~26 képválaszból, amik átjutottak, mielőtt a kvóta kifutott: **0 helyes,
1 tartózkodás, ~25 KONFABULÁCIÓ** — és ezek nem glif-összetévesztések:
véletlenszerű számjegyek (`indexLedgerInd → 0040375615`), azaz az enkóder
szinte semmit nem lát a tesztelt sűrűségeknél (natív csempe 42
karakter/token és MEDIUM flat), és a 2.5-flash TALÁL KI, ahelyett hogy
tartózkodna (figyelmen kívül hagyja az ILEGIVEL utasítást). Szöveges
kontroll: 3/3 azoknál, amik átjutottak. Nincs kimenet-felfújás (6-28
token/válasz).

Előzetes jel: a H5/H6 NEM felé hajlik a 2.5-flash-en, a GPT-énél ROSSZABB
hibamóddal (néma konfabuláció tartózkodás helyett) — a Geminihez extra
védőkorlátok kellenének a proxyban. Lezárandó: újrafuttatás fizetős
kvótával vagy másik napon, és a gemini-2.5-pro tesztelése (a flash a
leggyengébb olvasó a családban). A natív-csempe oldal továbbra is a
legjobb DOKUMENTÁLT arányú (42,3 karakter/token); az olvashatóság az, ami
kérdéses.

Költség-megjegyzés: a részleges oldalak (a korpusz utolsó oldala) rosszul
számláznak a csempe-rezsim alatt (alacsonyabb magasság → kisebb vágási
egység → több csempe) — az utolsó oldal 1152px magasságra való kitöltése
kötelező optimalizáció, ha a Gemini bekerül.
