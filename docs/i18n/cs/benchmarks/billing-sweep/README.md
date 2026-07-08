# Billing sweep pro vision Anthropic

Bezplatný sweep `count_tokens`, který rozhoduje dvě otevřené otázky
geometrie:

1. **Vzorec** — účtuje API patche `ceil(w/28) × ceil(h/28)` (aktuální
   dokumentace) nebo zastaralé `w·h/750`? Sada testů odděluje tyto dva o
   25–180 tokenů na řádek.
2. **Úroveň** — dostává `claude-fable-5` limity vysokého rozlišení (dlouhá
   hrana ≤ 2576 px, ≤ 4784 vizuálních tokenů)? Řádek `page-old-1928x1928` je
   rozhodující: ≈ **4761** naměřeno znamená high-res WYSIWYG (stará velká
   stránka nese ~3,3× více znaků na obrázek než dnešní 1568×728, při stejném
   poměru znaků/token); ≈ **1521** znamená resample standardní úrovně a
   1568×728 zůstává správná.

Kontext: sweep z 2026-07-01 stojící za aktuální stránkou 1568×728 (audit
čitelnosti, 2026-07-01) byl měřen na `claude-sonnet-4-5` — modelu standardní
úrovně — zatímco produkce cílí na Fable 5, kterého dokumentace vision řadí
do úrovně vysokého rozlišení. Tento audit také naměřil aktuální stránku na
1460 tokenů: blíž vzorci patchů (1456) než /750 (1522), což naznačuje, že
API se už přesunulo na billing podle patchů.

## Spuštění

```bash
pnpm run build                              # nezbytný předpoklad dist/ (jako u všech evalů)
node benchmarks/billing-sweep/run.mjs --dry-run   # jen predikce, žádný klíč, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Musí zasáhnout API **přímo** — nikdy přes proxy OmniGlyph, která by tělo
transformovala. `count_tokens` je zdarma; plný sweep udělá ~25 requestů.

## Čtení výstupu

Pro každý model ukazuje každý řádek testu naměřené obrázkové tokeny
(s obrázkem minus čistě textová základní linie) oproti všem čtyřem
predikcím (`patch`/`legacy750` × `standard`/`highres`); souhrn řadí
hypotézy podle průměrného absolutního reziduálu. `--probe-multi` kontroluje
limit na obrázek (2×1092² ≈ 2×1521); `--probe-20plus` kontroluje pravidlo
pro >20 obrázků (strana >2000 px musí být odmítnuta, ne zmenšena). Řádky
přistávají v `results/*.jsonl`; matematika predikcí žije v `formulas.mjs`,
ukotvená v `tests/billing-sweep-formulas.test.ts`.

## Po verdiktu

- Vzorec patchů potvrzen → portovat OmniGlyph PR #27 (přesný překlad
  zmenšení) a sladit gate matematiku `ANTHROPIC_PIXELS_PER_TOKEN` v
  `src/core/transform.ts`.
- Úroveň high-res potvrzena na Fable → znovu zavést geometrii stránky podle
  úrovně (stránky třídy 1928×1928 pro Fable/Opus 4.8/Sonnet 5, 1568×728 pro
  standard), zrcadlí to, jak cesta GPT už udržuje vlastní
  `GPT_MAX_HEIGHT_PX`.
