# Benchmarks

Cada número que OmniGlyph afirma proviene de uno de los dos harnesses de
abajo — re-ejecutables, deterministas donde es posible, con comprobantes
crudos por respuesta en `*/results/*.jsonl`. Análisis consolidado:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — ¿qué cuesta realmente una imagen?

Pruebas gratuitas de `count_tokens` contra la API en vivo de Anthropic,
comparando la fórmula retirada `w·h/750` contra el modelo actual de parches
de 28 px en 11 geometrías de prueba en 2 modelos × 2 tiers de resolución.

**Resultado (2026-07-05): el modelo de parches encaja con residuo CERO en
cada prueba** — se factura `⌈w/28⌉ × ⌈h/28⌉` tras el resize por tier, más
una sobrecarga fija de +3/+4 tokens por bloque de imagen. La página de
producción (1568×728) cuesta exactamente 1,460 tokens y lleva 28,080 chars
≈ **19.2 chars/token** vs ~2 chars/token como texto denso.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # solo predicciones, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # sweep en vivo, sigue siendo $0 (count_tokens es gratis)
```

## 2. `density-frontier/` — ¿el modelo puede realmente LEERLA?

Costo (offline, exacto) × precisión de lectura (en vivo) entre configs de
render, geometrías de página, atlas de glifos y proveedores. El corpus
planta needles de string exacto (ids hex, camelCase, corridas de dígitos)
más **distractores near-miss construidos a partir de los pares de
confusabilidad de glifos medidos** — así se detecta la confabulación
silenciosa, no solo se cuenta como error. La puntuación es determinista
(sin LLM-judge): `correct` / `abstained` (`ILEGIVEL` honesto) / `silent_wrong`
/ `no_answer`.

**Resultados destacados** (n=30 por brazo):

| brazo | lecturas exactas | notas |
|---|---:|---|
| Fable 5 · página estándar · atlas 1-bit (producción) | **30/30** | cero errores, cero confabulación |
| Fable 5 · página estándar · atlas AA (default antiguo) | 25/30 | 5 abstenciones honestas — por qué producción cambió a 1-bit |
| Fable 5 · página de alta resolución 1928² | 1–2/30 | facturada 3.3× más pero re-muestreada por el encoder — la trampa de billing, no habilitada |
| Opus 4.8 · glifos 10×16 | 23–26/30 | el modo seguro opcional |
| GPT-5.5 · strip de 768px (ambos atlas) | 0/60 | + ~40× de inflación de tokens de output vs su propio control de texto (30/30, 62 tok) |
| Gemini 2.5-flash (parcial, cuota) | 0/26 | confabula en vez de abstenerse |

Tres transportes: API directa (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), y `--via-cli` (una suscripción de Claude
Code — $0). Advertencia aprendida a las malas: los intermediarios
(OpenRouter, la herramienta Read del CLI) re-muestrean imágenes grandes;
solo los resultados de API directa son autoritativos para la legibilidad.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # tabla de costos, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # vía suscripción, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Tests unitarios que fijan las partes puras (corpus, scoring, fórmulas de
costo): `tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
