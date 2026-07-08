# Contribuir a OmniGlyph

¡Gracias por tu interés! Este proyecto tiene dos reglas de cultura no negociables —
son la razón por la que se puede confiar en cada número del README.

## Regla 1 — TDD estricto

Todo el código de producción nace de un test que falló primero:

1. Escribe el test y **míralo fallar por el motivo correcto**.
2. Escribe lo mínimo para que pase.
3. Refactoriza manteniéndolo en verde.

La barra completa es: `pnpm run typecheck && pnpm test && pnpm run build` — las
tres, siempre (el link-lint de docs y el guard de rebrand corren dentro de
`pnpm test` vía `tests/docs-integrity.test.ts`).

## Regla 2 — Medición antes de afirmaciones

Ningún cambio a la geometría, al atlas, a la fórmula de billing o al alcance de
modelos se integra sin un número medido. El repositorio está construido alrededor
de esta disciplina:

- Costo de billing → pruébalo con `benchmarks/billing-sweep/` (`count_tokens` es
  gratis; residuo esperado: cero).
- Legibilidad → pruébala con `benchmarks/density-frontier/` (n≥30 por brazo,
  puntuación determinista, comprobantes JSONL versionados en
  `benchmarks/*/results/`).
- La barra de aceptación para cambiar un default de producción: gist == baseline
  de texto **Y** cero errores silenciosos de string exacto **Y** ahorro positivo.

Las hipótesis sin números van a `docs/ROADMAP.md` como hipótesis — nunca al README
como hechos. Dos ideas "obvias" ya fueron refutadas con datos (la página de alta
resolución, el atlas con anti-aliasing); el proceso funciona.

## Configuración

```bash
pnpm install
pnpm test              # suite completa, ~40–90s
pnpm run dev:node      # proxy local en modo watch
```

Node ≥18 (CI prueba 20/22/24), pnpm 10 (fijado por `packageManager` en
package.json).

## Estructura

| carpeta | regla |
|---|---|
| `src/core/` | agnóstico de runtime (solo Web APIs — corre en Node y Workers) |
| `src/node.ts` / `src/worker.ts` | solo plomería de host |
| `benchmarks/` | harnesses re-ejecutables; los resultados JSONL son comprobantes, versionados |
| `docs/` | benchmarks/ (números), architecture/ (mapa), ROADMAP (hipótesis), ops/ (OmniRoute) |

## Commits y PRs

- Commits convencionales (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), cuerpo explicando el *por qué* con los números relevantes.
- PRs pequeños y enfocados; los cambios de comportamiento vienen con el test que
  los fija y, cuando aplica, el benchmark que los justifica.
- No reescribas los bloques `cache_control` del cliente, no agregues dependencias
  de runtime sin discusión (el core es deliberadamente ligero en dependencias),
  no uses `Math.random`/timestamps en las rutas de render (el determinismo es un
  invariante duro, probado por identidad de bytes).
