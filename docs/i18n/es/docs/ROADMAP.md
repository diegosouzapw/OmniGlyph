# Roadmap del fork — "nuestro OmniGlyph" + integración con OmniRoute

Plan de trabajo consolidado (2026-07-05) a partir de: sweep de billing medido,
auditoría de OpenAI/Gemini contra la documentación oficial, análisis de
herramientas relacionadas, y el harness density-frontier. Estado de cada
ítem: ☐ pendiente · ◐ parcial · ☑ hecho aquí.

## Fase 0 — Fundamento de medición (HECHO en este repo)

- ☑ Billing exacto de Anthropic (parches de 28px, 2 tiers, +4/bloque) — `src/core/anthropic-vision.ts`, sweep en `benchmarks/billing-sweep/`.
- ☑ Gate de rentabilidad con costo exacto (reemplazó w·h/750 × 1.10).
- ☑ Geometría por tier: Fable/Opus 4.8/Sonnet 5 → páginas 1928×1928 (3.3× menos imágenes); estándar → 1568×728. 691 tests en verde.
- ☑ Harness `benchmarks/density-frontier/` (costo × precisión offline vía API, needles con distractores confusables, puntuación determinista).

## Fase 1 — Correcciones de billing multi-proveedor (bugs confirmados en la auditoría)

Prioridad fijada por la auditoría (docs oficiales capturados el 2026-07-05):

1. ☐ **D2 (gate INVERTIDO)**: `gpt-4o-mini` cae en el tile por defecto 85/170, pero cuesta **2833 base / 5667 por tile** (~33× subestimado, ~0.8 char/token) — convertirlo a imagen siempre es una pérdida y el gate lo aprueba. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` se envía incondicionalmente (`src/core/openai.ts:392,402`), pero solo existe desde gpt-5.4+; derivarlo del perfil.
3. ☐ **D1**: multiplicador de `o4-mini` 1.62 → **1.72** (subestima en 5.8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` están en el bucket de patch con **cap 1536 sin `original`** (el código asume 10000); `gpt-5-codex-mini` está en el régimen equivocado (tile → patch).
5. ☐ **Geometría GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (alinea con AMBOS regímenes: parches 64×32 y tiles 4×512; +6.25% de chars gratis). Perfil `original` dedicado para 5.4/5.5: hasta 1568×5984 (9,163 parches ≤ 10k, ~233k chars en un solo bloque) — primero A/B de legibilidad.
6. ☐ **Soporte de Gemini** (nuevo): `src/core/gemini.ts` + `gemini-model-profiles.ts` + rutas `:generateContent`/`:streamGenerateContent` en el proxy. Geometría documentable: **1152×1536 (unidad de recorte exacta 768, 4 tiles, 42.2 chars/token — la mejor ratio documentada de los 3 proveedores)**; apuestas a calibrar: 768² con `media_resolution:MEDIUM` (56.4) y Gemini 3 HIGH. Precaución: el endpoint compatible con OpenAI de Gemini pasaría por el transformer de OpenAI con billing incorrecto.

## Fase 2 — Calidad de lectura (harness density-frontier como juez)

- ◐ A/B decisivo std vs high-res en Fable (en curso; barra: gist == texto Y cero silent-wrong Y ahorro > 0).
- ☐ Resolver la contradicción AA vs 1-bit en la ruta densa (el código dice "eval-only", producción usa AA).
- ☐ (DIFERIDO con justificación 2026-07-06) Cirugía de glifos: la config de producción lee 30/30 — no hay un miss medible para que la cirugía lo arregle hoy. Revisitar si entra en alcance un objetivo sub-100% (p. ej. Opus) o si nuevas mediciones muestran una regresión.
- ☑ ~~A/B de tema claro~~ RESUELTO por inspección (2026-07-06): el render YA ES negro-sobre-blanco (render.ts:635/822, inversión post-blit) — alineado con la literatura; la hipótesis nació de una premisa equivocada (imagen de ejemplo upstream).
- ☐ Wordlist con checksum para IDs byte-exactos (upstream #38, respaldado) + banner de abstención (#31/#32) + camelCase en el factsheet (#33/#34).
- ☑ Port #45: $schema/$id preservados, tuples eliminados por elemento (commit en main).
- ☑ Reintento en rechazo (#37/H11): sniffer de replay sin pérdida + un único reintento con el cuerpo original; telemetría refusalRetried (commit en main).
- ☐ Herramienta de rehidratación (`RecoverableBlock` → tool invocable; LensVLM valida la re-expansión selectiva).

## Fase 3 — Rendimiento/robustez

- ☐ Cache de render LRU (determinista por invariante; el slab + los chunks congelados hoy se re-renderizan en cada request).
- ☐ Codificación PNG en un worker thread; nivel de deflate configurable.
- ☐ Portar fixes abiertos de upstream: #44 (native tools tipados → 400), #45 (schema-strip draft-07 → loop de 400), #42 (proxy CONNECT para Claude Desktop), #19 (doble facturación de descripciones GPT).
- ☐ Implementar ADAPTIVE_CPT_PLAN (cpt por rol de bloque; slab real = 1.50).

## Fase 4 — El fork en sí

- ☐ Nombre/repo propio (decisión de Diego) + `git remote` upstream para cherry-picks.
- ☐ **TS en todas partes**: el core ya es TS; convertir `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (patrón: tsx + vitest; `benchmarks/density-frontier/` nació así).
- ☐ Estándar de calidad OmniRoute: eslint 9 + prettier, CI con typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR primero), CHANGELOG semántico.
- ☐ **GIFs en vez de videos** en el README (grabar con vhs/asciinema+agg; lado a lado texto plano vs proxy).
- ☐ Dashboard v2 (reimplementar vía API HTTP — no heredar código de terceros): launcher "abrir terminal con ANTHROPIC_BASE_URL", check "¿el tráfico está pasando por mí?", inspector imagen-vs-texto, sesiones, panel de costo en moneda, i18n ligero, SSE en vez de polling, persistencia SQLite con retención (su esquema de 24 columnas es un buen punto de partida).
- ☐ Micro-ideas de dense-image-gen: modo `lines` (layout preservado para código/tablas), `--keep-ws`, título de origen por página ("system prompt" / "docs de herramientas" / "turno de historial N"), CLI standalone `render archivo.md -o out.png`.

## Fase 5 — Port a OmniRoute

- ☐ Motor `CompressionEngine` (template `cavemanAdapter.ts`), registrado en `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plomería: pasar `supportsVision` en `chatCore.ts:1297` (1 línea) o resolver vía `isVisionModelId`.
- ☐ Orden del stack: al final (RTK/Caveman/renderers semánticos primero; OmniGlyph convierte a imagen el residual).
- ☐ Invariantes: nunca reescribir bloques con el `cache_control` del cliente (lección #4560); el gate de fidelidad (#5127) necesita una exención declarada o un factsheet de texto que satisfaga los invariantes; telemetría de intento con `skip_reason` (lección #4268).
- ☐ Routing: el fallback/retry post-engine debe respetar la capacidad de visión y la allowlist (recomprimir o hacer bypass).
- ☐ Sinergia con CCR: `emitRecoverable` → store de CCR con recuperación por porción (`head/tail/grep`, #5187) = re-expansión selectiva completa.
- ☐ Estiramiento del tier gratuito como feature de marketing: cada token del tier gratuito rinde ~2-3× más chars en modelos de visión; el tier gratuito de Gemini + geometría 1152×1536 es el caso más fuerte.

## Riesgos abiertos

- Rechazos de Fable después de un redeploy en contexto convertido a imagen (upstream #37) — mitigar antes de activarlo por defecto en OmniRoute.
- Arbitraje de precios: si Anthropic recalcula el precio de visión, el ahorro cambia — el contrafactual por request (`count_tokens`) es la defensa.
- OpenAI: una medición comunitaria (PageWatch) vio subir los tokens de completion y 2× de latencia — medir por proveedor antes de habilitar.

## Resultados A/B 2026-07-05 (vía OpenRouter — INCONCLUSO para geometría, válido para modos de falla)

| config | verbatim | abst. | filtrado | silent-wrong |
|---|---|---|---|---|
| fable std 5×8 (AA y 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 predichos) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 predichos) |
| opus hires 10×16 | **7/9 leídos** | 0 | 21 sin créditos | 2 (dígito) |

Hallazgos válidos: (1) el clasificador (issue #37) es el modo de falla DOMINANTE
para preguntas de transcripción en la página estándar — 100% filtrado — y no
dispara en la página grande; la redacción importa. (2) La abstención funciona:
20× ILEGIVEL vs 5 confabulaciones en la página grande. (3) Opus a 10×16 lee 78%
exacto (n=9) vs 0% histórico a 5×8 — primera evidencia de primera mano de la
rodilla de la curva. (4) La ilegibilidad de la página grande vía OpenRouter
sugiere un RESAMPLE de transporte (¿tier estándar de Bedrock/Vertex?) —
hipótesis decisiva a probar en la API directa de Anthropic; el A/B de geometría
permanece ABIERTO hasta entonces. Los créditos de OpenRouter se agotaron a
mitad del brazo de Opus.

## Matriz final 2×2 (2026-07-05, vía CLI/suscripción, Fable 5, n=30/brazo)

| página × atlas | 1-bit | AA |
|---|---|---|
| estándar 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| alta resolución 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

Cero confabulación en los 4 brazos (120 preguntas — cada miss fue ILEGIVEL).
APLICADO: DENSE_RENDER_STYLE cambiado a 1-bit (aa:false) con un pin en
tests/dense-style.test.ts. Opus 4.8: 26/30 a 10×16 en la página grande,
30/30 ILEGIVEL a 5×8 — el modo seguro de Opus es viable. La página de alta
resolución sigue degradada por los transportes (CLI Read/resample de
OpenRouter); el veredicto de geometría WYSIWYG aún depende de la API directa.
