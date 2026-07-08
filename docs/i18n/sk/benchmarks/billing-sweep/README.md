# Sweep účtovania vízie Anthropic

🌐 Preložené: [všetky jazyky](../../../README.md)

**Prečo existuje:** brána ziskovosti je bezpečná iba vtedy, ak je odhad
nákladov *presný*. Vzorec, ktorý je o čosi mimo, by konvertoval bloky, ktoré
v skutočnosti stoja viac. Preto tento sweep pripína vzorec k skutočným
číslam API pred nasadením — na **nulové rezíduum**.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

Bezplatný sweep `count_tokens`, ktorý rozhoduje dve otvorené otázky
geometrie:

1. **Vzorec** — účtuje API dlaždice `ceil(w/28) × ceil(h/28)` (aktuálna
   dokumentácia) alebo vyradené `w·h/750`? Sada sond oddeľuje tieto dva
   o 25 – 180 tokenov na riadok.
2. **Úroveň** — dostáva `claude-fable-5` stropy vysokého rozlíšenia
   (dlhá hrana ≤ 2576 px, ≤ 4784 vizuálnych tokenov)? Riadok
   `page-old-1928x1928` je rozhodujúci: ≈ **4761** nameraných znamená
   high-res WYSIWYG (stará veľká stránka nesie ~3,3× viac znakov na
   obrázok ako dnešná 1568×728, pri rovnakom pomere znaky/token); ≈
   **1521** znamená resample štandardnej úrovne a 1568×728 zostáva
   správna.

Kontext: sweep z 2026-07-01 za dnešnou stránkou 1568×728 (audit
čitateľnosti, 2026-07-01) bol meraný na `claude-sonnet-4-5` — model
štandardnej úrovne — zatiaľ čo produkcia cieli na Fable 5, ktorý
dokumentácia vízie zaraďuje do úrovne vysokého rozlíšenia. Tento audit
tiež nameral aktuálnu stránku na 1460 tokenov: bližšie k patch vzorcu
1456 než k /750 s 1522, čo naznačuje, že API sa už predtým presunulo na
patch účtovanie.

## Spustenie

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Musí zasiahnuť API **priamo** — nikdy cez OmniGlyph proxy, ktorý by telo
transformoval. `count_tokens` je zadarmo; celý sweep robí ~25 požiadaviek.

## Čítanie výstupu

Na model každý riadok sondy zobrazuje namerané tokeny obrázka (s obrázkom
mínus textová základná línia) oproti všetkým štyrom predikciám
(`patch`/`legacy750` × `standard`/`highres`); súhrn zoraďuje hypotézy podľa
strednej absolútnej reziduálnej odchýlky. `--probe-multi` kontroluje strop
na obrázok (2×1092² ≈ 2×1521); `--probe-20plus` kontroluje pravidlo pre
>20 obrázkov (strana >2000 px musí byť odmietnutá, nie zmenšená).
Riadky pristávajú v `results/*.jsonl`; matematika predikcií žije v
`formulas.mjs`, pripnutá `tests/billing-sweep-formulas.test.ts`.

## Po verdikte

- Patch vzorec potvrdený → portovať OmniGlyph PR #27 (presný preklad
  zmeny veľkosti) a zosúladiť matematiku brány
  `ANTHROPIC_PIXELS_PER_TOKEN` v `src/core/transform.ts`.
- Úroveň vysokého rozlíšenia potvrdená na Fable → znovu zaviesť geometriu
  stránky podľa úrovne (stránky triedy 1928×1928 pre Fable/Opus 4.8/Sonnet
  5, 1568×728 pre štandard), zrkadliac spôsob, akým si cesta GPT už
  udržiava vlastný `GPT_MAX_HEIGHT_PX`.
