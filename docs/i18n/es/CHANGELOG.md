# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versionado semántico.

## [1.0.0] — 2026-07-07

Primer lanzamiento público.

### El producto

- **Proxy de compresión de contexto como imagen**: reescribe las partes voluminosas
  de cada request LLM (system prompt, docs de herramientas, historial antiguo, salidas
  grandes de herramienta) en páginas PNG densas de 1-bit antes de que salgan de tu
  máquina. Servidor Node local y host de Cloudflare Workers.
- **Matemática de billing exacta por proveedor** (`src/core/`): parches de 28px de
  Anthropic + sobrecarga de 3–4 tokens/bloque (sweep propio, residuo cero), fórmulas
  de OpenAI y Gemini auditadas contra la documentación oficial. Exportado en la raíz
  del paquete (`anthropicImageTokens`, `resolveAnthropicVisionTier`, límites de tier).
- **Config de render de producción medida**: atlas de glifos 1-bit denso (sin
  anti-aliasing), páginas de tier estándar — cada decisión respaldada por un
  comprobante de benchmark en `benchmarks/*/results/`.
- **Harnesses de benchmark** (`benchmarks/`): billing-sweep (contabilidad de tokens) y
  density-frontier (frontera de precisión de lectura entre modelos/densidades),
  re-ejecutables vía API, OpenRouter, Claude Code CLI, o a través de OmniRoute
  (`--via-omniroute`).
- **Reintento en caso de rechazo**: un sniffer SSE/JSON repite el request original
  cuando un modelo rechaza la página renderizada (kill switch
  `retryRefusalWithOriginal`).
- **Cache de render LRU** para páginas deterministas.
- **Motor de OmniRoute**: se distribuye como el motor de compresión `omniglyph` en
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (modo único y pipeline
  apilado), con gates fail-closed y contabilidad de tokens consciente de imágenes.

### Los números (todos reproducibles)

- Render de ejemplo de UI: 1015 chars → PNG 438×120, 254 → 84 tokens (**66,9% ahorrado**).
- Página estándar 1568×728 = 1456 tokens de imagen sin importar cuánto texto contenga.
- Claude lee páginas densas de 1-bit al 100% en la densidad de producción; Opus 4.8
  lee 77–87% a 10×16.

### Decisiones negativas (medidas, no opiniones)

- **El tier de alta resolución es una trampa de billing**: la página de 1928² se
  cobra WYSIWYG pero el encoder no recibe la resolución completa — ambos tiers
  renderizan páginas estándar.
- **GPT-5.5 rechazado**: 0/60 lecturas del strip denso y ~40× de inflación de
  completion vs. el control de texto.
- **gpt-4o-mini nunca se convierte en imagen** (el piso de 2833/5667 tokens lo hace
  no rentable).
- **Gemini 2.5-flash confabula** en vez de abstenerse en páginas densas
  (0/26) — pendiente reprueba con cuota paga.
