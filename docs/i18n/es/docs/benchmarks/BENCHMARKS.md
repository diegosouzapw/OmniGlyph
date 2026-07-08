# OmniGlyph — Mediciones consolidadas (2026-07-05)

Todo lo MEDIDO en esta sesión, con fuente y n; las hipótesis se separan
claramente al final. Comprobantes: `benchmarks/billing-sweep/results/` y
`benchmarks/density-frontier/results/` (JSONL por respuesta).

## 1. Billing de Anthropic (count_tokens directo, $0, 11 geometrías × 2 modelos)

Fórmula confirmada: `tokens = ceil(w/28) × ceil(h/28)` tras el resize por
tier, **+3/bloque (Fable 5) / +4/bloque (Sonnet 4.5)** — residuo CERO en todas
las filas.

| prueba | dims | Fable 5 (alta res) | Sonnet 4.5 (estándar) |
|---|---|---:|---:|
| ancla de doc | 1092×1092 | 1524 | 1525 |
| ancla de doc | 1000×1000 | 1299 | 1300 |
| página estándar | 1568×728 | 1459 | 1460 |
| **página grande** | **1928×1928** | **4764 (¡WYSIWYG!)** | 1525 (resample) |
| techo de alta res | 1960×1960 | 4764 (clamp) | 1525 |
| borde largo alta res | 2576×1204 | 3959 | 1516 |
| strip alto | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imgs) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, NO rechazado en count_tokens) | 3585 |

Decisiones derivadas (implementadas): gate exacto por parche; tier por modelo
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = alta resolución); `cols` 313→312.

## 2. Precisión de lectura (density-frontier, needles hex/camelCase/dígito + distractores)

### Matriz 2×2 de Fable 5 — vía CLI/suscripción, n=30/brazo, mismo corpus (~16.6k chars)

| página × atlas | exacto | abstenciones (ILEGIVEL) | errores silenciosos |
|---|---:|---:|---:|
| estándar 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| estándar 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| alta resolución 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| alta resolución 1928×1928 · AA | 0/30 | 29 | 1 (predicho por la matriz) |

→ **1-bit > AA en ambas páginas; cero confabulación en 120 preguntas.**
APLICADO: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ la alta resolución llega degradada por el resample del transporte
(ver H1/H3) — el 67% es un piso, no un techo.

### Opus 4.8 — vía CLI/suscripción, n=30/brazo

| config | exacto | abstenciones | errores |
|---|---:|---:|---:|
| alta res · celda 10×16 | **26/30 (87%)** | 0 | 4 (dígitos) |
| estándar · celda 5×8 | 0/30 | 30 | 0 |

→ Rodilla de Opus confirmada con nuestro propio n (upstream midió 95% a
10×16 con n=20). El "modo seguro de Opus" es viable: 10×16 en la página
grande ≈ 1.7 chars por token de imagen en el corpus del harness.

### Vía OpenRouter (mismo corpus/preguntas) — inconcluso para legibilidad

| hecho medido | número |
|---|---|
| content_filter en preguntas de transcripción (páginas estándar) | 60/60 (100%) |
| content_filter en páginas de alta resolución | 5-6/30 (~20%) |
| Fable alta res: abstenciones + errores | 20 ILEGIVEL + 5 errores (2 predichos) |
| Opus 10×16 (antes de agotarse los créditos) | 7/9 exacto (78%) |
| errores predichos por la matriz de confusabilidad | 4→a, 0→8, caso S/s |

### Comparación de transporte (misma pregunta, mismo contenido)

| transporte | filtro/rechazo | ¿página grande legible? |
|---|---|---|
| API directa (n=9, antes de agotarse los créditos) | 0 | no probado |
| OpenRouter | ~100% std / ~20% hi-res | no (sospecha: resample) |
| Claude Code CLI (suscripción) | 0 content_filter; ~50% de los lotes grandes se estancaron (resuelto con chunks de 10 + retry) | no (sospecha: Read redimensiona) |

## 3. Costo por proveedor (offline, exacto — páginas COMPLETAS, teórico)

| proveedor · página | tokens/página | chars/página | **chars/token** | estado |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (todos los modelos) | 1460 | 28,080 | **19.2** | medido |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× menos imágenes) | billing medido; legibilidad pendiente (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | docs auditados |
| GPT-5.4/5.5 (patch, original) hasta 1568×5984 | ~9,163 | ~233k | **25.4** | docs; legibilidad no probada |
| gpt-4o-mini | 48,169/strip | — | **0.8 — NUNCA convertir a imagen** | docs (bug D2 corregido) |
| Gemini tile 1533×1152 (unidad de recorte nativa 768) | 1032 | 43,615 | **42.3 ← mejor documentada** | docs; legibilidad no probada |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (si es legible)** | hipótesis H6 |

## 4. Bugs encontrados y corregidos (auditoría contra docs oficiales)

| id | bug | impacto | commit |
|---|---|---|---|
| D2 | gpt-4o-mini caía en el tile por defecto 85/170 (real: 2833/5667) | costo subestimado ~33× — **gate invertido** | e6bc75f |
| D1 | multiplicador de o4-mini 1.62 (real 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) con cap 10000 (real 1536, sin original) | se rompería con páginas más grandes | e6bc75f |
| D4 | gpt-5-codex-mini en el régimen tile (real: patch 1536) | ≥+23% subestimado | e6bc75f |
| D5 | detail:'original' hardcodeado para cada modelo (solo existe en 5.4+) | fuera de contrato | e6bc75f |
| #44 | stub de descripción inyectado en tools tipadas → 400 + fallback silencioso | ahorro anulado sin señal | 0f66e32 |
| AA | atlas AA en producción contra el comentario "eval-only" | −17pp de lectura en Fable | 9a25585 |
| — | cols de slab 313 (1573px) → resample 0.997× + columna de parche extra | corregido a 312 | baseline |

## 5. Hipótesis abiertas (qué cuesta cerrar cada una)

| id | hipótesis | evidencia actual | test decisivo | costo |
|---|---|---|---|---|
| H1 | La página 1928² lee ≥ estándar en la API directa (WYSIWYG probado en billing) | billing 4764 sin resample; 1-bit ya lee 67% incluso degradado | A/B directo std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit en la API directa ≈ 100% con 3.3× menos imágenes | H1 + matriz 2×2 | igual que H1 | igual |
| H3 | El Read del CLI y OpenRouter redimensionan imágenes >1568/2000px | 5×8 muere y 10×16 sobrevive EN LA MISMA página | una página 1928² con glifos 20×32 por transporte | ~US$0 (CLI) |
| H4 | El rechazo depende del framing (agente-leyendo-un-archivo ≈ 0% vs API cruda ≈ 100%) | comparación de transporte arriba | A/B de redacción en la ruta real del proxy | bajo |
| H5 | Gemini tile 1533×1152 legible a 5×8 (42 chars/tok) | ninguna | density-frontier con GEMINI_API_KEY | ~gratis (tier gratuito) |
| H6 | media_resolution:low legible (116 chars/tok) | improbable (encoder de baja res), pero nadie lo midió | 1 llamada | ~gratis |
| H7 | GPT: legibilidad del strip + inflación de tokens de completion (riesgo PageWatch) | la comunidad vio −40% de prompt pero +completion/2× latencia | density-frontier con OPENAI_API_KEY | ~US$2-5 |
| H8 | La cirugía de glifos (H~K, 0/8, 5/3…) convierte abstenciones en lecturas | tras 1-bit, TODOS los misses de Fable se volvieron abstenciones | editar ~10 bitmaps + re-correr la matriz | $0 (CLI) |
| H9 | Tema claro (negro-sobre-blanco) > invertido | literatura (paper Glyph, Tesseract); nunca medido en un VLM comercial | flag de estilo + 2 brazos | $0 (CLI) |
| H10 | Opus a 7×10 cae entre 0% (5×8) y 87% (10×16) → trade-off razonable | curva upstream 35% a 7×10 (n=20) | 1 brazo extra | $0 (CLI) |
| H11 | El reintento en rechazo del proxy recupera ~50% de los lotes filtrados | el rechazo es estocástico por llamada | implementar + medir en producción | código |

## 6. Pendientes operacionales

1. `gh auth login` → crear `diegosouzapw/omniglyph` privado + push (10 commits locales).
2. Créditos de Anthropic (H1/H2, el veredicto de geometría) y OpenRouter (agotados).
3. **Rotar las** claves de Anthropic y OpenRouter **expuestas** en el chat.
4. Cola de código: #45 (schema-strip draft-07), reintento en rechazo (H11), cirugía
   de glifos (H8), Fase 4 (TS en los scripts, GIFs, docs, dashboard v2), Fase 5
   (motor OmniRoute).

## ADENDA 2026-07-06 — A/B vía API directa (165 llamadas): H1/H2 REFUTADAS

| config | exacto | abst. | rechazo | errores |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA y 1-bit) | 0/60 | 0 | **60/60 rechazo** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predichos) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predichos) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

VEREDICTO: el tier de alta resolución de la página 1928² se COBRA WYSIWYG
(4764 tok, sweep) pero el ENCODER no recibe la resolución completa — se leen
1-2/30, con errores de intercambio de un solo glifo (6→8, a→4), la firma de
un resample interno. **Billing ≠ input del encoder → trampa: 3.3× el costo,
peor legibilidad.** APLICADO: se revirtió pageGeometryForTier() — ambos
tiers renderizan 1568×728; se mantiene la infra de tier (el billing exacto
sigue siendo válido y el futuro retune es 1 línea). H3 actualizada: el
"resample de transporte" era (también) el encoder propio de la API. Rechazo
en transcripción vía API cruda: 100% en la página estándar (H4 reforzada —
solo el framing de agente escapa). Opus 10×16 confirmado en ambos
transportes (77-87%).

## ADENDA 2026-07-06 (2) — batería GPT-5.5 vía API directa: H7 cerrada (FALLIDA)

| brazo | verbatim | gist | output/respuesta |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtrados, 7 errores) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtrados, 10 errores) | 1/3 | 2,383 tok |
| TEXTO (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 no puede leer glifos 5×8 (0/60; ni siquiera el gist sobrevive) e
infla el completion ~40× intentando descifrarlos (2.4-2.7k tokens de
razonamiento por pregunta) — el ahorro en el prompt es devorado por el
output. El control de texto perfecto prueba que el corpus/preguntas son
sanos. Confirma y cuantifica el opt-in de 5.5; gpt-5.6 (por defecto) sigue
sin poder probarse (la cuenta no tiene acceso). Futuro (H12): el gate de GPT
debe modelar la inflación de output, no solo los tokens de prompt.

## ADENDA 2026-07-06 (3) — Gemini 2.5-flash (PARCIAL: la cuota del tier gratuito se agotó a mitad de la corrida)

De las ~26 respuestas de imagen que pasaron antes de que la cuota muriera:
**0 correctas, 1 abstención, ~25 CONFABULACIONES** — y no son confusiones de
glifos: son dígitos aleatorios (`indexLedgerInd → 0040375615`), es decir, el
encoder no ve casi nada en las densidades probadas (tile nativo 42 chars/tok
y MEDIUM plano) y 2.5-flash INVENTA en vez de abstenerse (ignora la
instrucción ILEGIVEL). Control de texto: 3/3 en las que pasaron. Sin
inflación de output (6-28 tok/respuesta).

Señal preliminar: H5/H6 se inclinan hacia NO en 2.5-flash, con un modo de
falla PEOR que el de GPT (confabulación silenciosa en vez de abstención) —
Gemini requeriría salvaguardas extra en el proxy. Pendiente de cerrar:
re-correr con cuota paga o en otro día, y probar gemini-2.5-pro (flash es el
lector más débil de la familia). La página de tile nativo sigue teniendo la
mejor ratio DOCUMENTADA (42.3 chars/token); es la legibilidad la que está en
duda.

Nota de costo: las páginas parciales (la última del corpus) facturan mal
bajo el régimen de tile (altura corta → unidad de recorte pequeña → más
tiles) — rellenar la última página a 1152px de altura es una optimización
obligatoria si Gemini entra.
