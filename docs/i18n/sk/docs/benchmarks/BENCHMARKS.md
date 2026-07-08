# OmniGlyph — Konsolidované merania (2026-07-05)

Všetko NAMERANÉ v tejto session, so zdrojom a n; hypotézy jasne oddelené
na konci. Dôkazy: `benchmarks/billing-sweep/results/` a
`benchmarks/density-frontier/results/` (JSONL na odpoveď).

## 1. Účtovanie Anthropic (priamy count_tokens, $0, 11 geometrií × 2 modely)

Potvrdený vzorec: `tokens = ceil(w/28) × ceil(h/28)` po zmene veľkosti
podľa úrovne, **+3/blok (Fable 5) / +4/blok (Sonnet 4.5)** — NULOVÉ
rezíduum naprieč všetkými riadkami.

| sonda | rozmery | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| kotva doc | 1092×1092 | 1524 | 1525 |
| kotva doc | 1000×1000 | 1299 | 1300 |
| štandardná stránka | 1568×728 | 1459 | 1460 |
| **veľká stránka** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| strop hi-res | 1960×1960 | 4764 (clamp) | 1525 |
| dlhá hrana hi-res | 2576×1204 | 3959 | 1516 |
| vysoký pás | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 obr.) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→zníženie rozlíšenia, NEODMIETNUTÉ v count_tokens) | 3585 |

Odvodené rozhodnutia (implementované): presná brána podľa záplat;
úroveň podľa modelu (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res);
`cols` 313→312.

## 2. Presnosť čítania (density-frontier, ihly hex/camelCase/číslica + distraktory)

### Matica 2×2 pre Fable 5 — cez CLI/subscription, n=30/rameno, ten istý korpus (~16,6 tis. znakov)

| stránka × atlas | presne | zdržania sa (ILEGIVEL) | tiché chyby |
|---|---:|---:|---:|
| štandard 1568×728 · **1-bit** | **30/30 (100 %)** | 0 | 0 |
| štandard 1568×728 · AA | 25/30 (83 %) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67 %) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (predikovaná maticou) |

→ **1-bit > AA na oboch stránkach; nulová konfabulácia naprieč 120
otázkami.** APLIKOVANÉ: `DENSE_RENDER_STYLE` → `aa:false` (commit
9a25585).
⚠️ high-res prichádza degradovaná transportným resamplom (pozri H1/H3) —
67 % je podlaha, nie strop.

### Opus 4.8 — cez CLI/subscription, n=30/rameno

| konfigurácia | presne | zdržania sa | chyby |
|---|---:|---:|---:|
| high-res · bunka 10×16 | **26/30 (87 %)** | 0 | 4 (číslice) |
| štandard · bunka 5×8 | 0/30 | 30 | 0 |

→ Koleno Opusu potvrdené s naším vlastným n (upstream namerané 95 % pri
10×16 s n=20). „Bezpečný režim Opus" je životaschopný: 10×16 na veľkej
stránke ≈ 1,7 znaku na token obrázka na korpuse harnessu.

### Cez OpenRouter (rovnaký korpus/otázky) — nepresvedčivé pre čitateľnosť

| nameraný fakt | číslo |
|---|---|
| content_filter na otázkach prepisu (štandardné stránky) | 60/60 (100 %) |
| content_filter na high-res stránkach | 5-6/30 (~20 %) |
| Fable high-res: zdržania sa + chyby | 20 ILEGIVEL + 5 chýb (2 predikované) |
| Opus 10×16 (pred minutím kreditov) | 7/9 presne (78 %) |
| nesprávne čítania predikované maticou zameniteľnosti | 4→a, 0→8, prípad S/s |

### Porovnanie transportov (rovnaká otázka, rovnaký obsah)

| transport | filter/odmietnutie | veľká stránka čitateľná? |
|---|---|---|
| Priame API (n=9, pred minutím kreditov) | 0 | netestované |
| OpenRouter | ~100 % std / ~20 % hi-res | nie (podozrenie: resample) |
| Claude Code CLI (subscription) | 0 content_filter; ~50 % veľkých dávok zaseklo (vyriešené chunkami po 10 + opakovaním) | nie (podozrenie: Read mení veľkosť) |

## 3. Náklady na poskytovateľa (offline, presné — CELÉ stránky, teoretické)

| poskytovateľ · stránka | tokeny/stránka | znaky/stránka | **znaky/token** | stav |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (všetky modely) | 1460 | 28 080 | **19,2** | merané |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92 160 | **19,3** (3,3× menej obrázkov) | účtovanie merané; čitateľnosť čaká (H1) |
| GPT-5 (dlaždica) pás 768×2048 | 1190 | ~38 760 | **32,6** | auditovaná dokumentácia |
| GPT-5.4/5.5 (patch, original) až 1568×5984 | ~9 163 | ~233 tis. | **25,4** | dokumentácia; čitateľnosť netestovaná |
| gpt-4o-mini | 48 169/pás | — | **0,8 — NIKDY neobrázkovať** | dokumentácia (chyba D2 opravená) |
| Gemini dlaždica 1533×1152 (natívna jednotka orezu 768) | 1032 | 43 615 | **42,3 ← najlepšia zdokumentovaná** | dokumentácia; čitateľnosť netestovaná |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32 604 | **116 (ak čitateľné)** | hypotéza H6 |

## 4. Nájdené a opravené chyby (audit oproti oficiálnej dokumentácii)

| id | chyba | dopad | commit |
|---|---|---|---|
| D2 | gpt-4o-mini spadal do predvolenej dlaždice 85/170 (skutočnosť: 2833/5667) | náklady podhodnotené ~33× — **obrátená brána** | e6bc75f |
| D1 | multiplikátor o4-mini 1,62 (skutočnosť 1,72) | −5,8 % | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) so stropom 10000 (skutočnosť 1536, bez original) | pokazilo by sa s väčšími stránkami | e6bc75f |
| D4 | gpt-5-codex-mini v režime dlaždíc (skutočnosť: patch 1536) | ≥+23 % podhodnotené | e6bc75f |
| D5 | detail:'original' natvrdo pre každý model (existuje iba v 5.4+) | mimo kontraktu | e6bc75f |
| #44 | stub popisu vložený do typovaných nástrojov → 400 + tichý fallback | úspory vynulované bez signálu | 0f66e32 |
| AA | AA atlas v produkcii oproti komentáru „iba pre eval" | −17pp čítania na Fable | 9a25585 |
| — | slab cols 313 (1573px) → resample 0,997× a extra stĺpec záplat | opravené na 312 | baseline |

## 5. Otvorené hypotézy (čo stojí uzavretie každej z nich)

| id | hypotéza | súčasný dôkaz | rozhodujúci test | cena |
|---|---|---|---|---|
| H1 | Stránka 1928² sa číta ≥ štandard na priamom API (WYSIWYG dokázané v účtovaní) | účtovanie 4764 bez resample; 1-bit už číta 67 % aj degradovaná | priamy A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit na priamom API ≈ 100 % s 3,3× menej obrázkov | H1 + matica 2×2 | rovnaký ako H1 | rovnaká |
| H3 | Read v CLI a OpenRouter zmenšujú obrázky >1568/2000px | 5×8 zomiera a 10×16 prežíva NA TEJ ISTEJ stránke | jedna stránka 1928² s glyfmi 20×32 na transport | ~US$0 (CLI) |
| H4 | Odmietnutie závisí od formulácie (agent čítajúci súbor ≈ 0 % vs surové API ≈ 100 %) | porovnanie transportov vyššie | A/B test formulácie na reálnej ceste proxy | nízka |
| H5 | Gemini dlaždica 1533×1152 čitateľná pri 5×8 (42 znakov/tok) | žiadny | density-frontier s GEMINI_API_KEY | ~zadarmo (bezplatná úroveň) |
| H6 | media_resolution:low čitateľné (116 znakov/tok) | nepravdepodobné (nízkorozlišovací enkodér), ale nikto to nemeral | 1 volanie | ~zadarmo |
| H7 | GPT: čitateľnosť stripu + nafúknutie tokenov dokončenia (riziko PageWatch) | komunita videla −40 % promptu, ale +dokončenie/2× latenciu | density-frontier s OPENAI_API_KEY | ~US$2-5 |
| H8 | Chirurgia glyfov (H~K, 0/8, 5/3…) konvertuje zdržania sa na čítania | po 1-bit sa VŠETKY neúspechy Fable stali zdržaniami sa | upraviť ~10 bitmáp + znova spustiť maticu | $0 (CLI) |
| H9 | Svetlá téma (čierna na bielej) > invertovaná | literatúra (paper Glyph, Tesseract); nikdy nemerané na komerčnom VLM | príznak štýlu + 2 ramená | $0 (CLI) |
| H10 | Opus pri 7×10 pristáva medzi 0 % (5×8) a 87 % (10×16) → dobrý kompromis | upstream krivka 35 % pri 7×10 (n=20) | 1 extra rameno | $0 (CLI) |
| H11 | Opakovanie pri odmietnutí v proxy obnoví ~50 % filtrovaných dávok | odmietnutie je stochastické na volanie | implementovať + merať v produkcii | kód |

## 6. Prevádzkové otvorené položky

1. `gh auth login` → vytvoriť súkromný `diegosouzapw/omniglyph` + push (10
   lokálnych commitov).
2. Kredity Anthropic (H1/H2, verdikt o geometrii) a OpenRouter (minuté).
3. **Rotovať kľúče** Anthropic a OpenRouter vystavené v chate.
4. Fronta kódu: #45 (schema-strip draft-07), retry-on-refusal (H11),
   chirurgia glyfov (H8), Fáza 4 (TS v skriptoch, GIF-y, dokumentácia,
   dashboard v2), Fáza 5 (engine OmniRoute).

## DODATOK 2026-07-06 — A/B test cez priame API (165 volaní): H1/H2 VYVRÁTENÉ

| konfigurácia | presne | zdrž. | odmietnutie | chyby |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA aj 1-bit) | 0/60 | 0 | **60/60 odmietnutie** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predikované) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predikované) |
| opus hires 10×16 | **23/30 (77 %)** | 1 | 0 | 6 |

VERDIKT: high-res úroveň stránky 1928² sa ÚČTUJE WYSIWYG (4764 tok,
sweep), ale ENKODÉR nedostáva plné rozlíšenie — 1-2/30 čítaní, s chybami
zámeny jednotlivých glyfov (6→8, a→4), podpisom interného resamplu.
**Účtovanie ≠ vstup enkodéra → pasca: 3,3× náklady, horšia čitateľnosť.**
APLIKOVANÉ: pageGeometryForTier() vrátené späť — obe úrovne renderujú
1568×728; infraštruktúra úrovní zachovaná (presné účtovanie zostáva
platné a budúce prelaďovanie je 1 riadok). H3 aktualizovaná: „transportný
resample" bol (aj) enkodér samotného API. Odmietnutie prepisu cez surové
API: 100 % na štandardnej stránke (H4 posilnená — iba agentská
formulácia unikne). Opus 10×16 potvrdený na oboch transportoch
(77-87 %).

## DODATOK 2026-07-06 (2) — Batéria GPT-5.5 cez priame API: H7 uzavretá (ZLYHALA)

| rameno | verbatim | gist | výstup/odpoveď |
|---|---:|---:|---:|
| pás 768×2048 5×8 AA | 0/30 (18 zdrž., 5 filtr., 7 chýb) | 0/3 | 2 639 tok |
| pás 5×8 1-bit | 0/30 (15 zdrž., 5 filtr., 10 chýb) | 1/3 | 2 383 tok |
| TEXT (kontrola) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 nedokáže čítať glyfy 5×8 (0/60; ani gist neprežije) a pri snahe o
rozlúštenie nafukuje dokončenie ~40× (2,4-2,7 tis. reasoning tokenov na
otázku) — úspory promptu pohltí výstup. Dokonalá textová kontrola
dokazuje, že korpus/otázky sú v poriadku. Potvrdzuje a kvantifikuje
opt-in pre 5.5; gpt-5.6 (predvolený) zostáva netestovateľný (účet nemá
prístup). Budúce (H12): brána GPT musí modelovať nafúknutie výstupu, nie
iba tokeny promptu.

## DODATOK 2026-07-06 (3) — Gemini 2.5-flash (ČIASTOČNÉ: kvóta bezplatnej úrovne vybuchla v polovici behu)

Z ~26 obrázkových odpovedí, ktoré prešli pred smrťou kvóty: **0 správnych,
1 zdržanie sa, ~25 KONFABULÁCIÍ** — a nie sú to zámeny glyfov: sú to
náhodné číslice (`indexLedgerInd → 0040375615`), t. j. enkodér nevidí
takmer nič pri testovaných hustotách (natívna dlaždica 42 znaky/tok a
plochá MEDIUM) a 2.5-flash SI VYMÝŠĽA namiesto zdržania sa (ignoruje
inštrukciu ILEGIVEL). Textová kontrola: 3/3 na tých, ktoré prešli. Žiadne
nafúknutie výstupu (6-28 tok/odpoveď).

Predbežný signál: H5/H6 sa naklánajú k NIE pri 2.5-flash, s režimom
zlyhania HORŠÍM než pri GPT (tichá konfabulácia namiesto zdržania sa) —
Gemini by vyžadoval extra ochranné opatrenia v proxy. Čaká na uzavretie:
znovu spustiť s platenou kvótou alebo v iný deň a otestovať
gemini-2.5-pro (flash je najslabší čitateľ v rodine). Stránka s natívnou
dlaždicou má stále najlepší ZDOKUMENTOVANÝ pomer (42,3 znaku/token); v
pochybnosti je čitateľnosť.

Poznámka k nákladom: čiastočné stránky (posledná v korpuse) sa v režime
dlaždíc účtujú zle (malá výška → malá jednotka orezu → viac dlaždíc) —
doplnenie poslednej stránky na výšku 1152px je povinná optimalizácia,
ak Gemini vstúpi do hry.
