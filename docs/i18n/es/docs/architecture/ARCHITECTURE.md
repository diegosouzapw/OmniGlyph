# Arquitectura

Mapa de una página del código base.

## Pipeline de request

```
cliente (Claude Code / cualquier SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  handler fetch único con estándares Web:
  │                                routing, passthrough de auth, contrafactual
  │                                de count_tokens, eventos de uso/telemetría
  ▼
src/core/transform.ts              EL pipeline (ruta Anthropic):
  │   1. parsea el body, resuelve el tier de visión a partir del modelo
  │   2. gate de rentabilidad — costo exacto de imagen vs costo de texto
  │   3. convierte: slab estático · tool_results grandes · historial colapsado
  │   4. empalma de vuelta preservando los anclajes cache_control del cliente
  ▼
API upstream (api.anthropic.com / api.openai.com)
```

## Billing (exacto, medido)

| módulo | proveedor | modelo |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | parches de 28 px + 4/bloque, límites de resize por tier; geometría de página (ambos tiers renderizan la página estándar 1568×728 — el tier de alta resolución es una trampa de billing, ver [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | regímenes de patch/tile por modelo, `detail` por perfil, geometría de strip |
| `src/core/gemini-model-profiles.ts` | Google | fórmula de tile (`floor(min/1.5)` unidad de recorte) + costos fijos de `media_resolution` |

## Renderizado

- `src/core/render.ts` — texto → PNG vía un atlas de glifos horneado (Spleen
  5×8 + fallback Unifont), reflow con centinelas de salto de línea `↵`, atlas
  1-bit en producción (medido mejor que AA en Fable).
- `src/core/render-cache.ts` — memoización LRU de renders deterministas (el
  slab estático + los chunks de historial congelados se re-renderizan en cada
  request de lo contrario).
- `src/core/history.ts` — colapsa turnos antiguos en chunks de imagen
  append-only congelados que se mantienen byte-idénticos para que el prompt
  caching siga acertando.
- `src/core/png.ts` — encoder PNG mínimo y determinista (sin dependencias
  nativas).

## Guard rails

- Allowlist de modelos (`src/core/applicability.ts`): solo los modelos que
  pasaron el benchmark de lectura se convierten a imagen; el resto pasa
  byte-idéntico.
- Valores byte-exactos (SHAs, ids) viajan como texto en una hoja de datos
  junto a la imagen (`src/core/factsheet.ts`); originales recuperables vía
  `emitRecoverable`.
- Las herramientas nativas tipadas (`type !== 'custom'`) nunca se reescriben
  (guard de 400).

## Benchmarks y comprobantes

`benchmarks/` contiene los dos harnesses que produjeron cada número del
README — ver [benchmarks/README.md](../../benchmarks/README.md).
