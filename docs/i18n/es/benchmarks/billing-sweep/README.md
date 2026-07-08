# Sweep de billing de visión de Anthropic

Sweep gratuito de `count_tokens` que decide dos preguntas abiertas de
geometría:

1. **Fórmula** — ¿la API factura parches `ceil(w/28) × ceil(h/28)` (docs
   actuales) o el `w·h/750` retirado? El conjunto de pruebas separa las dos
   por 25–180 tokens por fila.
2. **Tier** — ¿`claude-fable-5` obtiene los límites de alta resolución (borde
   largo ≤ 2576 px, ≤ 4784 tokens visuales)? La fila `page-old-1928x1928` es
   la que decide: ≈ **4761** medidos significa alta resolución WYSIWYG (la
   página grande antigua lleva ~3.3× más chars por imagen que la actual
   1568×728, con los mismos chars/token); ≈ **1521** significa resample de
   tier estándar, y 1568×728 se mantiene correcta.

Contexto: el sweep del 2026-07-01 detrás de la página actual 1568×728
(auditoría de legibilidad, 2026-07-01) se midió en `claude-sonnet-4-5` — un
modelo de tier estándar — mientras producción apunta a Fable 5, que la
documentación de visión coloca en el tier de alta resolución. Esa auditoría
también midió la página actual en 1460 tokens: más cerca de la fórmula de
parches (1456) que de /750 (1522), sugiriendo que la API ya se había movido
a billing por parches.

## Ejecutar

```bash
pnpm run build                              # requisito de dist/ (como todos los evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # solo predicciones, sin clave, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Debe pegarle a la API **directamente** — nunca a través del proxy de
OmniGlyph, que transformaría el cuerpo. `count_tokens` es gratis; el sweep
completo hace ~25 requests.

## Leyendo la salida

Por modelo, cada fila de prueba muestra los tokens de imagen medidos (con
imagen menos la base solo-texto) contra las cuatro predicciones
(`patch`/`legacy750` × `standard`/`highres`); el resumen ordena las
hipótesis por residuo absoluto medio. `--probe-multi` revisa el cap por
imagen (2×1092² ≈ 2×1521); `--probe-20plus` revisa la regla de >20 imágenes
(un lado >2000 px debe ser rechazado, no re-muestreado). Las filas caen en
`results/*.jsonl`; la matemática de predicción vive en `formulas.mjs`, fijada
por `tests/billing-sweep-formulas.test.ts`.

## Después del veredicto

- Fórmula de parches confirmada → portar el PR #27 de OmniGlyph (traducción
  exacta de resize) y alinear la matemática del gate
  `ANTHROPIC_PIXELS_PER_TOKEN` en `src/core/transform.ts`.
- Tier de alta resolución confirmado en Fable → reintroducir una geometría
  de página por tier (páginas clase 1928×1928 para Fable/Opus 4.8/Sonnet 5,
  1568×728 para estándar), reflejando cómo la ruta de GPT ya mantiene su
  propio `GPT_MAX_HEIGHT_PX`.
