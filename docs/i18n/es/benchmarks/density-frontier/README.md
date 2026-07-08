# density-frontier — costo × precisión por resolución

🌐 Traducido: [todos los idiomas](../../../README.md)

Harness que mide la **frontera de Pareto entre costo y legibilidad** de los
renders texto→imagen, por proveedor (Anthropic / OpenAI / Gemini), geometría
de página, celda de glifo, y estilo de atlas.

Las páginas más baratas (más densas) llevan más chars por token pero en
algún punto dejan de ser legibles. Una config solo puede enviarse a
producción cuando **ambas** condiciones se cumplen — el costo es bajo *y*
el modelo la sigue leyendo perfectamente:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

Cada respuesta se puntúa en exactamente uno de tres resultados — el del
medio es el que hace que el gate sea confiable:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Una config que produce aunque sea un solo 🔴 queda descalificada, sin
importar qué tan barata sea.

La asimetría central: desde el sweep de billing (2026-07-05,
`benchmarks/billing-sweep/`), **el costo es exactamente predecible offline**
— parches de 28 px + 4/bloque en Anthropic (`src/core/anthropic-vision.ts`),
perfiles de patch/tile en OpenAI (`src/core/openai.ts`),
tiles/media_resolution en Gemini (`gemini-cost.ts`). Solo la **precisión de
lectura** necesita la API.

## Diseño

- **Corpus** (`corpus.ts`): relleno denso estilo log/JSON + needles
  plantados de las clases que la matriz de confusabilidad dice que fallan
  (hex de 12 caracteres, camelCase, dígitos 6/8/5/3) + **distractores
  near-miss** construidos a partir de los pares confusables medidos. Si el
  modelo responde con el distractor, la confusión fue *predicha* — ese es el
  modo de falla silenciosa que se está detectando, no solo contando como
  error. Determinista (mulberry32).
- **Configs** (`configs.ts`): grilla curada — páginas estándar 1568×728 vs
  alta resolución 1928×1928 (el A/B que decide la geometría por tier), AA vs
  1-bit (resuelve la contradicción del render denso), celda 7×10/10×16 (modo
  seguro de Opus), strip de GPT, y las dos apuestas de Gemini (≤384² = 258
  plano; `media_resolution: low` = 280 fijo → ~116 chars/token *si* es
  legible).
- **Score** (`score.ts`): coincidencia exacta determinista, sin LLM-judge.
  Tres resultados: `correct` / `abstained` (centinela ILEGIVEL — falla
  honesta) / `silent_wrong` (el modo peligroso), con un flag de distractor.

## Ejecutar

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # tabla de costos, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Configs específicas: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Las respuestas caen en `results/*.jsonl` (una línea por pregunta, con la
respuesta cruda para auditoría).

## Barra de aceptación (heredada de los PRs upstream #35/#36)

Una config solo se vuelve default de producción si: **gist == baseline de
texto** Y **cero strings exactos silent-wrong** Y **ahorro positivo**. La
primera corrida obligatoria es `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` en Fable — la verificación puntual de legibilidad
de la página grande antes de habilitar el tier de alta resolución.

## `--via-omniroute` — e2e a través de OmniRoute (P3: prueba de no-degradación)

Los transportes de arriba renderizan texto→PNG **en el harness** y envían
las imágenes. `--via-omniroute` hace lo opuesto, que es la ruta de
producción: envía el **texto denso** a una instancia de OmniRoute en
ejecución, deja que el **motor `omniglyph`** renderice las páginas y las
reenvíe a Anthropic, y mide las lecturas + el ahorro. Si las lecturas se
mantienen iguales que en la ruta directa **y** OmniRoute reporta
compresión, queda probado que el render+forward de OmniRoute **no degrada**
las páginas.

Prerrequisitos (operacionales):

1. **OmniRoute corriendo** (`npm run dev`, default `http://localhost:20128`).
2. Un **proveedor Anthropic** configurado en OmniRoute con una **clave
   real** (ruta directa — el gate `providerTransport==='direct'` solo pasa
   para el proveedor `anthropic`).
3. El **motor `omniglyph` HABILITADO** en la config de compresión de
   OmniRoute (`config.engines.omniglyph.enabled = true`) — la cabecera
   `engine:omniglyph` solo se dispara con el motor encendido. (El motor es
   `stable:false`/preview; habilítalo explícitamente.)
4. Una **clave de API de OmniRoute** en `OMNIROUTE_API_KEY` (la que usa el
   cliente para autenticarse contra OmniRoute, no la de Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<tu-clave-de-omniroute> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Cada respuesta registra `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(de la cabecera de respuesta `X-OmniRoute-Compression`) en el JSONL; la fila
de la tabla muestra cuántas respuestas volvieron comprimidas + el ahorro
mediano. **Barra P3**: los mismos aciertos verbatim/gist que la ruta directa
(no-degradación) **con** `omnirouteSavings` no nulo (probando que ocurrió un
render, no una lectura de texto crudo). Si aparece `did NOT compress`, el
motor no está habilitado en OmniRoute (o el body no pasó los gates
fail-closed).

Tests para las partes puras: `tests/density-frontier.test.ts` (incluye
`buildOmnirouteRequest` y `parseCompressionSavings` del transporte
via-omniroute).
