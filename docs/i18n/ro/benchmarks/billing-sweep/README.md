# Sweep de facturare de viziune Anthropic

Sweep gratuit `count_tokens` care decide două întrebări deschise de geometrie:

1. **Formula** — API-ul facturează patch-uri `ceil(w/28) × ceil(h/28)`
   (documentația curentă) sau `w·h/750` (retras)? Setul de sonde separă cele
   două cu 25–180 tokeni per rând.
2. **Nivelul** — primește `claude-fable-5` plafoanele de rezoluție înaltă
   (margine lungă ≤ 2576 px, ≤ 4784 tokeni vizuali)? Rândul
   `page-old-1928x1928` este decisiv: ≈ **4761** măsurat înseamnă WYSIWYG de
   rezoluție înaltă (pagina veche mare conține ~3.3× mai multe caractere per
   imagine decât pagina de astăzi 1568×728, la același caractere/token);
   ≈ **1521** înseamnă resample de nivel standard, iar 1568×728 rămâne corect.

Context: sweep-ul din 2026-07-01 din spatele paginii curente 1568×728
(audit de lizibilitate, 2026-07-01) a fost măsurat pe `claude-sonnet-4-5` —
un model de nivel standard — în timp ce producția vizează Fable 5, pe care
documentația de viziune îl plasează la nivelul de rezoluție înaltă. Acel
audit a măsurat de asemenea pagina curentă la 1460 tokeni: mai aproape de
formula de patch-uri (1456) decât de /750 (1522), sugerând că API-ul deja
trecuse la facturarea pe patch-uri.

## Rulare

```bash
pnpm run build                              # prerechizit dist/ (ca toate eval-urile)
node benchmarks/billing-sweep/run.mjs --dry-run   # doar predicții, fără cheie, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Trebuie să lovească API-ul **direct** — niciodată prin proxy-ul OmniGlyph,
care ar transforma body-ul. `count_tokens` este gratuit; sweep-ul complet
face ~25 de request-uri.

## Interpretarea rezultatului

Per model, fiecare rând de sondă arată tokenii de imagine măsurați (cu-imagine
minus baseline doar-text) față de toate cele patru predicții
(`patch`/`legacy750` × `standard`/`highres`); rezumatul clasează ipotezele
după reziduul absolut mediu. `--probe-multi` verifică plafonul per imagine
(2×1092² ≈ 2×1521); `--probe-20plus` verifică regula de >20 imagini (o
margine >2000 px trebuie respinsă, nu re-eșantionată). Rândurile aterizează
în `results/*.jsonl`; matematica de predicție trăiește în `formulas.mjs`,
fixată de `tests/billing-sweep-formulas.test.ts`.

## După verdict

- Formula de patch confirmată → portați OmniGlyph PR #27 (traducere exactă de
  resize) și aliniați matematica de gate `ANTHROPIC_PIXELS_PER_TOKEN` în
  `src/core/transform.ts`.
- Nivel de rezoluție înaltă confirmat pe Fable → reintroduceți o geometrie de
  pagină per nivel (pagini de clasă 1928×1928 pentru Fable/Opus 4.8/Sonnet 5,
  1568×728 pentru standard), oglindind modul în care calea GPT deja își
  păstrează propriul `GPT_MAX_HEIGHT_PX`.
