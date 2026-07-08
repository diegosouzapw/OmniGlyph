# OmniGlyph — Măsurători consolidate (2026-07-05)

🌐 Tradus: [toate limbile](../../../README.md)

Tot ce a fost MĂSURAT în această sesiune, cu sursă și n; ipotezele clar
separate la sfârșit. Dovezi: `benchmarks/billing-sweep/results/` și
`benchmarks/density-frontier/results/` (JSONL per răspuns).

## TL;DR — întregul rezultat în două bare

**Cost** — o pagină standard 1568×728 conține 28,080 caractere pentru un
cost fix de 1,460 tokeni; același text trimis brut costă ~10× mai mult:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Precizie** — dar doar acolo unde modelul chiar citește pagina. Gate-ul
este fail-closed; doar rândul ✅ ajunge în producție:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Restul acestui document sunt dovezile din spatele acestor două bare.

## 1. Facturare Anthropic (count_tokens direct, $0, 11 geometrii × 2 modele)

Formulă confirmată: `tokens = ceil(w/28) × ceil(h/28)` după resize per nivel,
**+3/bloc (Fable 5) / +4/bloc (Sonnet 4.5)** — reziduu ZERO pe toate rândurile.

| sondă | dimensiuni | Fable 5 (rezoluție înaltă) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| ancoră doc | 1092×1092 | 1524 | 1525 |
| ancoră doc | 1000×1000 | 1299 | 1300 |
| pagină standard | 1568×728 | 1459 | 1460 |
| **pagină mare** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| plafon rezoluție înaltă | 1960×1960 | 4764 (clamp) | 1525 |
| margine lungă rezoluție înaltă | 2576×1204 | 3959 | 1516 |
| bandă înaltă | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imagini) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, NU respins în count_tokens) | 3585 |

Decizii derivate (implementate): gate exact per patch; nivel per model
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = rezoluție înaltă); `cols` 313→312.

## 2. Precizia de citire (density-frontier, needle-uri hex/camelCase/cifră + distractori)

### Matricea 2×2 Fable 5 — via CLI/abonament, n=30/braț, același corpus (~16.6k caractere)

| pagină × atlas | exact | abțineri (ILEGIVEL) | erori silențioase |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| rezoluție înaltă 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| rezoluție înaltă 1928×1928 · AA | 0/30 | 29 | 1 (prezisă de matrice) |

→ **1-bit > AA pe ambele pagini; zero confabulație pe 120 de întrebări.**
APLICAT: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ pagina de rezoluție înaltă ajunge degradată de resample-ul de transport
(vedeți H1/H3) — 67% este un prag minim, nu un plafon.

### Opus 4.8 — via CLI/abonament, n=30/braț

| config | exact | abțineri | erori |
|---|---:|---:|---:|
| rezoluție înaltă · celulă 10×16 | **26/30 (87%)** | 0 | 4 (cifre) |
| standard · celulă 5×8 | 0/30 | 30 | 0 |

→ Genunchiul (knee) Opus confirmat cu n propriu (upstream a măsurat 95% la
10×16 cu n=20). "Modul sigur Opus" este viabil: 10×16 pe pagina mare ≈ 1.7
caractere per token de imagine pe corpusul harness-ului.

### Via OpenRouter (același corpus/întrebări) — neconcludent pentru lizibilitate

| fapt măsurat | număr |
|---|---|
| content_filter pe întrebări de transcriere (pagini standard) | 60/60 (100%) |
| content_filter pe pagini de rezoluție înaltă | 5-6/30 (~20%) |
| Fable rezoluție înaltă: abțineri + erori | 20 ILEGIVEL + 5 erori (2 prezise) |
| Opus 10×16 (înainte de epuizarea creditelor) | 7/9 exact (78%) |
| citiri greșite prezise de matricea de confuzabilitate | 4→a, 0→8, S/s caz |

### Comparație de transport (aceeași întrebare, același conținut)

| transport | filtrare/refuz | pagina mare lizibilă? |
|---|---|---|
| API direct (n=9, înainte de epuizarea creditelor) | 0 | netestat |
| OpenRouter | ~100% std / ~20% hi-res | nu (suspectat: resample) |
| CLI Claude Code (abonament) | 0 content_filter; ~50% din batch-urile mari au înghețat (rezolvat cu chunk-uri de 10 + retry) | nu (suspectat: Read redimensionează) |

## 3. Cost per furnizor (offline, exact — pagini COMPLETE, teoretic)

| furnizor · pagină | tokeni/pagină | caractere/pagină | **caractere/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (toate modelele) | 1460 | 28,080 | **19.2** | măsurat |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× mai puține imagini) | facturare măsurată; lizibilitate în așteptare (H1) |
| GPT-5 (tile) bandă 768×2048 | 1190 | ~38,760 | **32.6** | documentație auditată |
| GPT-5.4/5.5 (patch, original) până la 1568×5984 | ~9,163 | ~233k | **25.4** | docs; lizibilitate netestată |
| gpt-4o-mini | 48,169/bandă | — | **0.8 — NICIODATĂ transformat în imagine** | docs (bug D2 corectat) |
| Gemini tile 1533×1152 (unitate de crop nativă 768) | 1032 | 43,615 | **42.3 ← cel mai bun raport documentat** | docs; lizibilitate netestată |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (dacă este lizibil)** | ipoteză H6 |

## 4. Bug-uri găsite și corectate (audit față de documentația oficială)

| id | bug | impact | commit |
|---|---|---|---|
| D2 | gpt-4o-mini cădea în tile-ul implicit 85/170 (real: 2833/5667) | cost subestimat ~33× — **gate inversat** | e6bc75f |
| D1 | multiplicator o4-mini 1.62 (real 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) cu plafon 10000 (real 1536, fără original) | s-ar rupe cu pagini mai mari | e6bc75f |
| D4 | gpt-5-codex-mini în regimul de tile (real: patch 1536) | ≥+23% subestimat | e6bc75f |
| D5 | detail:'original' hardcodat pentru fiecare model (există doar în 5.4+) | în afara contractului | e6bc75f |
| #44 | stub de descriere injectat în unelte tipizate → 400 + fallback silențios | economiile anulate fără semnal | 0f66e32 |
| AA | atlas AA în producție contrar comentariului "eval-only" | −17pp precizie de citire pe Fable | 9a25585 |
| — | slab cols 313 (1573px) → resample 0.997× și coloană de patch în plus | corectat la 312 | baseline |

## 5. Ipoteze deschise (ce costă să închidă fiecare)

| id | ipoteză | dovadă curentă | test decisiv | cost |
|---|---|---|---|---|
| H1 | Pagina 1928² citește ≥ standard pe API-ul direct (WYSIWYG dovedit în facturare) | facturare 4764 fără resample; 1-bit deja citește 67% chiar degradat | A/B direct std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit pe API-ul direct ≈ 100% cu 3.3× mai puține imagini | H1 + matricea 2×2 | la fel ca H1 | la fel |
| H3 | Read-ul CLI-ului și OpenRouter redimensionează imagini >1568/2000px | 5×8 moare și 10×16 supraviețuiește PE ACEEAȘI pagină | o pagină 1928² cu glife de 20×32 per transport | ~US$0 (CLI) |
| H4 | Refuzul depinde de formulare (agent-care-citește-un-fișier ≈ 0% vs API brut ≈ 100%) | comparația de transport de mai sus | A/B de formulare pe calea reală a proxy-ului | scăzut |
| H5 | Tile Gemini 1533×1152 lizibil la 5×8 (42 caractere/tok) | niciuna | density-frontier cu GEMINI_API_KEY | ~gratuit (nivel gratuit) |
| H6 | media_resolution:low lizibil (116 caractere/tok) | improbabil (encoder de rezoluție joasă), dar nimeni nu a măsurat | 1 apel | ~gratuit |
| H7 | GPT: lizibilitate bandă + inflație de token de completion (risc PageWatch) | comunitatea a văzut −40% prompt dar +completion/2× latență | density-frontier cu OPENAI_API_KEY | ~US$2-5 |
| H8 | Chirurgia de glife (H~K, 0/8, 5/3…) transformă abțineri în citiri | după 1-bit, TOATE ratările Fable au devenit abțineri | editați ~10 bitmap-uri + rerulați matricea | $0 (CLI) |
| H9 | Tema luminoasă (negru-pe-alb) > inversată | literatură (paperul Glyph, Tesseract); niciodată măsurat pe un VLM comercial | flag de stil + 2 brațe | $0 (CLI) |
| H10 | Opus la 7×10 se situează între 0% (5×8) și 87% (10×16) → compromis bun | curba upstream 35% la 7×10 (n=20) | un braț în plus | $0 (CLI) |
| H11 | Reîncercarea-la-refuz în proxy recuperează ~50% din batch-urile filtrate | refuzul este stocastic per apel | implementare + măsurare în producție | cod |

## 6. Itemi operaționali în așteptare

1. `gh auth login` → creați `diegosouzapw/omniglyph` privat + push (10 commit-uri locale).
2. Credite Anthropic (H1/H2, verdictul de geometrie) și OpenRouter (epuizate).
3. **Rotiți cheile** Anthropic și OpenRouter expuse în chat.
4. Coadă de cod: #45 (schema-strip draft-07), reîncercare-la-refuz (H11),
   chirurgie de glife (H8), Faza 4 (TS în scripturi, GIF-uri, docs, dashboard
   v2), Faza 5 (motorul OmniRoute).

## ADDENDUM 2026-07-06 — A/B via API direct (165 apeluri): H1/H2 INFIRMATE

| config | exact | abst. | refuz | erori |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA și 1-bit) | 0/60 | 0 | **60/60 refuz** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 prezise) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 prezise) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

VERDICT: nivelul de rezoluție înaltă al paginii 1928² este FACTURAT WYSIWYG
(4764 tok, sweep) dar ENCODERUL nu primește rezoluția completă — 1-2/30
citite, cu erori de schimbare de glif unic (6→8, a→4), semnătura unui
resample intern. **Facturare ≠ input al encoderului → capcană: 3.3× costul,
lizibilitate mai proastă.** APLICAT: pageGeometryForTier() revenit — ambele
niveluri randează 1568×728; infrastructura de nivel păstrată (facturarea
exactă rămâne validă și reajustarea viitoare este 1 linie). H3 actualizat:
"resample-ul de transport" a fost (de asemenea) propriul encoder al API-ului.
Refuz la transcriere via API brut: 100% pe pagina standard (H4 întărit —
doar formularea de agent scapă). Opus 10×16 confirmat pe ambele transporturi
(77-87%).

## ADDENDUM 2026-07-06 (2) — Bateria GPT-5.5 via API direct: H7 închis (EȘUAT)

| braț | verbatim | gist | ieșire/răspuns |
|---|---:|---:|---:|
| bandă 768×2048 5×8 AA | 0/30 (18 abst, 5 filtrate, 7 erori) | 0/3 | 2,639 tok |
| bandă 5×8 1-bit | 0/30 (15 abst, 5 filtrate, 10 erori) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 nu poate citi glife 5×8 (0/60; nici măcar gist-ul supraviețuiește) și
umflă completion-ul ~40× încercând să le descifreze (2.4-2.7k tokeni de
raționament per întrebare) — economiile de prompt sunt devorate de ieșire.
Controlul text perfect dovedește că corpusul/întrebările sunt sănătoase.
Confirmă și cuantifică opt-in-ul 5.5; gpt-5.6 (implicit) rămâne netestabil
(contul nu are acces). Viitor (H12): gate-ul GPT trebuie să modeleze
inflația de ieșire, nu doar tokenii de prompt.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (PARȚIAL: cota nivelului gratuit s-a epuizat în timpul rulării)

Din cele ~26 de răspunsuri de imagine care au trecut înainte ca cota să
moară: **0 corecte, 1 abținere, ~25 CONFABULAȚII** — și nu sunt confuzii de
glif: sunt cifre aleatorii (`indexLedgerInd → 0040375615`), adică encoderul
nu vede aproape nimic la densitățile testate (tile nativ 42 caractere/tok și
MEDIUM plat) iar 2.5-flash INVENTEAZĂ în loc să se abțină (ignoră
instrucțiunea ILEGIVEL). Control text: 3/3 pe cele care au trecut. Fără
inflație de ieșire (6-28 tok/răspuns).

Semnal preliminar: H5/H6 înclină spre NU pe 2.5-flash, cu un mod de eșec
MAI RĂU decât al GPT (confabulație silențioasă în loc de abținere) — Gemini
ar necesita măsuri de siguranță suplimentare în proxy. Rămâne de închis:
rerulare cu cotă plătită sau într-o altă zi, și testarea gemini-2.5-pro
(flash este cel mai slab cititor din familie). Pagina cu tile nativ are încă
cel mai bun raport DOCUMENTAT (42.3 caractere/token); lizibilitatea este cea
pusă sub semnul întrebării.

Notă de cost: paginile parțiale (ultima din corpus) se facturează prost sub
regimul de tile (înălțime mică → unitate de crop mică → mai multe tile-uri)
— padding-ul ultimei pagini la 1152px înălțime este o optimizare obligatorie
dacă Gemini intră în joc.
