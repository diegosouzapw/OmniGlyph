# Sweep di fatturazione visione Anthropic

🌐 Tradotto: [tutte le lingue](../../../README.md)

**Perché esiste:** il gate di redditività è sicuro solo se la stima di costo
è *esatta*. Una formula anche leggermente sbagliata convertirebbe blocchi
che in realtà costano di più. Quindi questo sweep fissa la formula ai numeri
reali dell'API prima che vada in produzione — a **residuo zero**.

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

Sweep gratuito `count_tokens` che decide due domande aperte sulla
geometria:

1. **Formula** — l'API fattura patch `ceil(w/28) × ceil(h/28)`
   (documentazione attuale) o il ritirato `w·h/750`? Il set di sonde separa
   i due per 25–180 token per riga.
2. **Livello** — `claude-fable-5` riceve i limiti ad alta risoluzione
   (lato lungo ≤ 2576 px, ≤ 4784 token visivi)? La riga
   `page-old-1928x1928` è la decisiva: ≈ **4761** misurato significa
   WYSIWYG high-res (la vecchia pagina grande contiene ~3,3× più caratteri
   per immagine rispetto all'attuale 1568×728, allo stesso rapporto
   caratteri/token); ≈ **1521** significa resample a livello standard, e
   1568×728 resta corretta.

Contesto: lo sweep del 2026-07-01 dietro l'attuale pagina 1568×728 (audit
di leggibilità, 2026-07-01) è stato misurato su `claude-sonnet-4-5` — un
modello a livello standard — mentre la produzione punta a Fable 5, che la
documentazione sulla visione colloca nel livello ad alta risoluzione.
Quell'audit ha misurato anche la pagina attuale a 1460 token: più vicino
alla formula a patch (1456) che a /750 (1522), suggerendo che l'API fosse
già passata alla fatturazione a patch.

## Esecuzione

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Deve colpire l'API **direttamente** — mai attraverso il proxy OmniGlyph,
che trasformerebbe il corpo. `count_tokens` è gratuito; lo sweep completo
fa ~25 richieste.

## Lettura dell'output

Per modello, ogni riga di sonda mostra i token immagine misurati (con
immagine meno baseline solo testo) rispetto a tutte e quattro le
previsioni (`patch`/`legacy750` × `standard`/`highres`); il riepilogo
classifica le ipotesi per residuo medio assoluto. `--probe-multi` verifica
il cap per immagine (2×1092² ≈ 2×1521); `--probe-20plus` verifica la
regola oltre 20 immagini (un lato >2000 px deve essere rifiutato, non
ridimensionato). Le righe finiscono in `results/*.jsonl`; la matematica
delle previsioni vive in `formulas.mjs`, fissata da
`tests/billing-sweep-formulas.test.ts`.

## Dopo il verdetto

- Formula a patch confermata → portare la PR #27 di OmniGlyph
  (traduzione esatta del ridimensionamento) e allineare la matematica del
  gate `ANTHROPIC_PIXELS_PER_TOKEN` in `src/core/transform.ts`.
- Livello high-res confermato su Fable → reintrodurre una geometria di
  pagina per livello (pagine della classe 1928×1928 per Fable/Opus
  4.8/Sonnet 5, 1568×728 per standard), rispecchiando come il percorso
  GPT già mantiene il proprio `GPT_MAX_HEIGHT_PX`.
</content>
