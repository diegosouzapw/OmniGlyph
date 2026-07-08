# OmniGlyph — Konsolidovaná měření (2026-07-05)

🌐 Přeloženo: [všechny jazyky](../../../README.md)

Vše ZMĚŘENÉ v této relaci, se zdrojem a n; hypotézy jasně oddělené na konci.
Doklady: `benchmarks/billing-sweep/results/` a
`benchmarks/density-frontier/results/` (JSONL na odpověď).

## TL;DR — celý výsledek ve dvou pruzích

**Náklady** — jedna standardní stránka 1568×728 nese 28 080 znaků za fixních
1 460 tokenů; stejný text odeslaný surově stojí ~10× víc:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Přesnost** — ale pouze tam, kde model stránku skutečně čte. Gate je
fail-closed; odesílá se pouze řádek ✅:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Zbytek tohoto dokumentu jsou doklady za těmito dvěma pruhy.

## 1. Billing Anthropic (přímý count_tokens, $0, 11 geometrií × 2 modely)

Potvrzený vzorec: `tokens = ceil(w/28) × ceil(h/28)` po zmenšení podle úrovně,
**+3/blok (Fable 5) / +4/blok (Sonnet 4.5)** — NULOVÝ reziduál napříč všemi
řádky.

| test | rozměry | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| kotva dokumentu | 1092×1092 | 1524 | 1525 |
| kotva dokumentu | 1000×1000 | 1299 | 1300 |
| standardní stránka | 1568×728 | 1459 | 1460 |
| **velká stránka** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| strop hi-res | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res dlouhá hrana | 2576×1204 | 3959 | 1516 |
| vysoký proužek | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 obr.) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→zmenšení, NENÍ odmítnuto v count_tokens) | 3585 |

Odvozená rozhodnutí (implementováno): přesný gate podle patchů; úroveň podle
modelu (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Přesnost čtení (density-frontier, jehly hex/camelCase/číslice + distraktory)

### Matice 2×2 Fable 5 — přes CLI/předplatné, n=30/rameno, stejný korpus (~16,6k znaků)

| stránka × atlas | přesně | zdržení se (ILEGIVEL) | tiché chyby |
|---|---:|---:|---:|
| standard 1568×728 · **1bit** | **30/30 (100 %)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83 %) | 5 | 0 |
| high-res 1928×1928 · **1bit** | 20/30 (67 %) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (predikováno maticí) |

→ **1bit > AA na obou stránkách; nulová konfabulace napříč 120 otázkami.**
APLIKOVÁNO: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res dorazí degradovaná transportním resamplem (viz H1/H3) — 67 %
je podlaha, ne strop.

### Opus 4.8 — přes CLI/předplatné, n=30/rameno

| konfigurace | přesně | zdržení se | chyby |
|---|---:|---:|---:|
| high-res · buňka 10×16 | **26/30 (87 %)** | 0 | 4 (číslice) |
| standard · buňka 5×8 | 0/30 | 30 | 0 |

→ Zlom (knee) Opus potvrzen naším n (upstream naměřil 95 % při 10×16 s
n=20). „Bezpečný režim Opus" je životaschopný: 10×16 na velké stránce ≈
1,7 znaku na obrázkový token na korpusu harness.

### Přes OpenRouter (stejný korpus/otázky) — neprůkazné pro čitelnost

| změřený fakt | číslo |
|---|---|
| content_filter u otázek na přepis (standardní stránky) | 60/60 (100 %) |
| content_filter u high-res stránek | 5-6/30 (~20 %) |
| Fable high-res: zdržení se + chyby | 20 ILEGIVEL + 5 chyb (2 predikováno) |
| Opus 10×16 (než došly kredity) | 7/9 přesně (78 %) |
| chybná čtení predikovaná maticí zaměnitelnosti | 4→a, 0→8, S/s velikost |

### Srovnání transportů (stejná otázka, stejný obsah)

| transport | filtr/odmítnutí | velká stránka čitelná? |
|---|---|---|
| Přímé API (n=9, než došly kredity) | 0 | netestováno |
| OpenRouter | ~100 % std / ~20 % hi-res | ne (podezření: resample) |
| Claude Code CLI (předplatné) | 0 content_filter; ~50 % velkých dávek zaseknuto (vyřešeno po dávkách po 10 + retry) | ne (podezření: Read zmenšuje) |

## 3. Náklady na poskytovatele (offline, přesné — CELÉ stránky, teoreticky)

| poskytovatel · stránka | tokenů/stránka | znaků/stránka | **znaků/token** | stav |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (všechny modely) | 1460 | 28 080 | **19,2** | změřeno |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92 160 | **19,3** (3,3× méně obrázků) | billing změřen; čitelnost čeká (H1) |
| GPT-5 (dlaždice) proužek 768×2048 | 1190 | ~38 760 | **32,6** | dokumentace prověřena |
| GPT-5.4/5.5 (patch, original) až 1568×5984 | ~9 163 | ~233k | **25,4** | dokumentace; čitelnost netestována |
| gpt-4o-mini | 48 169/proužek | — | **0,8 — NIKDY nezobrazovat jako obrázek** | dokumentace (bug D2 opraven) |
| Gemini dlaždice 1533×1152 (nativní jednotka ořezu 768) | 1032 | 43 615 | **42,3 ← nejlepší zdokumentovaný** | dokumentace; čitelnost netestována |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32 604 | **116 (pokud čitelné)** | hypotéza H6 |

## 4. Nalezené a opravené chyby (audit oproti oficiální dokumentaci)

| id | chyba | dopad | commit |
|---|---|---|---|
| D2 | gpt-4o-mini spadal do výchozí dlaždice 85/170 (skutečnost: 2833/5667) | náklady podhodnoceny ~33× — **obrácený gate** | e6bc75f |
| D1 | multiplikátor o4-mini 1,62 (skutečnost 1,72) | −5,8 % | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) s capem 10000 (skutečnost 1536, bez original) | by se rozbilo u větších stránek | e6bc75f |
| D4 | gpt-5-codex-mini v režimu dlaždic (skutečnost: patch 1536) | ≥+23 % podhodnoceno | e6bc75f |
| D5 | detail:'original' natvrdo pro každý model (existuje jen od 5.4+) | mimo kontrakt | e6bc75f |
| #44 | zástupný popis vložen do typovaných nástrojů → 400 + tichý fallback | úspory vynulovány bez signálu | 0f66e32 |
| AA | atlas AA v produkci proti komentáři „pouze pro eval" | −17pp čtení na Fable | 9a25585 |
| — | slab cols 313 (1573px) → resample 0,997× a extra sloupec patchů | opraveno na 312 | výchozí stav |

## 5. Otevřené hypotézy (co stojí uzavřít každou z nich)

| id | hypotéza | aktuální důkaz | rozhodující test | cena |
|---|---|---|---|---|
| H1 | Stránka 1928² se čte ≥ standard na přímém API (WYSIWYG prokázáno v billingu) | billing 4764 bez resamplu; 1bit už čte 67 % i degradovaný | přímý A/B std vs. hi-res (1bit) | ~US$4 API |
| H2 | hi-res + 1bit na přímém API ≈ 100 % s 3,3× méně obrázky | H1 + matice 2×2 | stejné jako H1 | stejná |
| H3 | Read CLI a OpenRouter zmenšují obrázky >1568/2000px | 5×8 umírá a 10×16 přežívá NA STEJNÉ stránce | jedna stránka 1928² s glyfy 20×32 na transport | ~US$0 (CLI) |
| H4 | Odmítnutí závisí na formulaci (agent-čte-soubor ≈ 0 % vs. raw API ≈ 100 %) | srovnání transportů výše | A/B formulace na skutečné cestě proxy | nízká |
| H5 | Gemini dlaždice 1533×1152 čitelné při 5×8 (42 znaků/tok) | žádný | density-frontier s GEMINI_API_KEY | ~zdarma (free tier) |
| H6 | media_resolution:low čitelné (116 znaků/tok) | nepravděpodobné (nízkorozlišovací enkodér), ale nikdo to nezměřil | 1 volání | ~zdarma |
| H7 | GPT: čitelnost proužku + nafouknutí completion tokenů (riziko PageWatch) | komunita viděla −40 % promptu, ale +completion/2× latenci | density-frontier s OPENAI_API_KEY | ~US$2-5 |
| H8 | Chirurgie glyfů (H~K, 0/8, 5/3…) přemění zdržení se na čtení | po 1bit se VŠECHNY neúspěchy Fable staly zdrženími se | upravit ~10 bitmap + přeběhnout matici | $0 (CLI) |
| H9 | Světlé téma (černá na bílé) > invertované | literatura (paper Glyph, Tesseract); nikdy nezměřeno na komerčním VLM | flag stylu + 2 ramena | $0 (CLI) |
| H10 | Opus při 7×10 přistane mezi 0 % (5×8) a 87 % (10×16) → dobrý kompromis | upstream křivka 35 % při 7×10 (n=20) | 1 extra rameno | $0 (CLI) |
| H11 | Opakování po odmítnutí v proxy zachraňuje ~50 % filtrovaných dávek | odmítnutí je pro každé volání stochastické | implementovat + měřit v produkci | kód |

## 6. Otevřené provozní položky

1. `gh auth login` → vytvořit soukromý `diegosouzapw/omniglyph` + push (10 lokálních commitů).
2. Kredity Anthropic (H1/H2, verdikt geometrie) a OpenRouter (vyčerpáno).
3. **Rotovat** klíče Anthropic a OpenRouter vystavené v chatu.
4. Fronta kódu: #45 (schema-strip draft-07), opakování po odmítnutí (H11), chirurgie
   glyfů (H8), Fáze 4 (TS ve skriptech, GIFy, dokumentace, dashboard v2), Fáze 5
   (engine OmniRoute).

## DODATEK 2026-07-06 — A/B přes přímé API (165 volání): H1/H2 VYVRÁCENO

| konfigurace | přesně | zdrž. | odmítnutí | chyby |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA i 1bit) | 0/60 | 0 | **60/60 odmítnutí** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predikováno) |
| fable hires 5×8 1bit | 1/30 | 23 | 1 | 3 (2 predikováno) |
| opus hires 10×16 | **23/30 (77 %)** | 1 | 0 | 6 |

VERDIKT: high-res úroveň se stránkou 1928² je ÚČTOVÁNA WYSIWYG (4764 tok,
sweep), ale ENKODÉR nedostává plné rozlišení — přečteno 1-2/30, s chybami
záměny jednotlivých glyfů (6→8, a→4), signaturou interního resamplu.
**Billing ≠ vstup enkodéru → past: 3,3× náklady, horší čitelnost.**
APLIKOVÁNO: pageGeometryForTier() vráceno zpět — obě úrovně vykreslují
1568×728; infrastruktura úrovní zachována (přesný billing zůstává platný a
budoucí přeladění je 1 řádek). H3 aktualizováno: „transportní resample" byl
(také) vlastní enkodér API. Odmítnutí u přepisu přes raw API: 100 % na
standardní stránce (H4 posílena — uniká pouze formulace agenta). Opus 10×16
potvrzen na obou transportech (77-87 %).

## DODATEK 2026-07-06 (2) — Baterie GPT-5.5 přes přímé API: H7 uzavřena (SELHALA)

| rameno | doslovné | gist | výstup/odpověď |
|---|---:|---:|---:|
| proužek 768×2048 5×8 AA | 0/30 (18 zdrž., 5 filtrováno, 7 chyb) | 0/3 | 2 639 tok |
| proužek 5×8 1bit | 0/30 (15 zdrž., 5 filtrováno, 10 chyb) | 1/3 | 2 383 tok |
| TEXT (kontrola) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 neumí přečíst glyfy 5×8 (0/60; ani gist nepřežije) a nafukuje
completion ~40× při pokusu je rozluštit (2,4-2,7k reasoning tokenů na
otázku) — úspory promptu pohltí výstup. Perfektní textová kontrola
dokazuje, že korpus/otázky jsou v pořádku. Potvrzuje a kvantifikuje opt-in
5.5; gpt-5.6 (výchozí) zůstává netestovatelný (účet nemá přístup).
Budoucnost (H12): gate pro GPT musí modelovat nafouknutí výstupu, nejen
tokeny promptu.

## DODATEK 2026-07-06 (3) — Gemini 2.5-flash (ČÁSTEČNÉ: kvóta free tieru vyčerpána v půli běhu)

Z ~26 obrázkových odpovědí, které prošly, než kvóta zemřela: **0 správně,
1 zdržení se, ~25 KONFABULACÍ** — a nejde o záměny glyfů: jsou to náhodné
číslice (`indexLedgerInd → 0040375615`), tj. enkodér při testovaných
hustotách nevidí téměř nic (nativní dlaždice 42 znaků/tok a MEDIUM ploché)
a 2.5-flash SI VYMÝŠLÍ místo zdržení se (ignoruje instrukci ILEGIVEL).
Textová kontrola: 3/3 na těch, co prošly. Žádné nafouknutí výstupu
(6-28 tok/odpověď).

Předběžný signál: H5/H6 se u 2.5-flash klání k NE, s režimem selhání
HORŠÍM než u GPT (tichá konfabulace místo zdržení se) — Gemini by
vyžadoval extra pojistky v proxy. Zbývá uzavřít: přeběhnout s placenou
kvótou nebo jindy a otestovat gemini-2.5-pro (flash je nejslabší čtenář v
rodině). Stránka s nativní dlaždicí má stále nejlepší ZDOKUMENTOVANÝ poměr
(42,3 znaků/token); v pochybnosti je čitelnost.

Poznámka k nákladům: částečné stránky (poslední v korpusu) se účtují
špatně pod režimem dlaždic (menší výška → menší jednotka ořezu → více
dlaždic) — doplnění poslední stránky na výšku 1152px je povinná
optimalizace, pokud přijde Gemini.
