🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="Un render real: system prompt + docs de herramientas empaquetados en una página densa de 1568×728" width="820"/>

<br/>

# 🖼️ OmniGlyph — Contexto como Imagen

### Reduce tu factura de Claude en **59–70%** renderizando contexto voluminoso como páginas PNG densas — el mismo contenido, en una fracción de los tokens.

**Los modelos cobran el texto por token, pero cobran una imagen por sus dimensiones — no por cuánto texto contiene.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-los-nmeros--medidos-no-estimados)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-la-parte-honesta)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Parte de la familia [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Todos los idiomas](../../../docs/i18n/README.md)

</div>

---

# 📊 Los números — medidos, no estimados

| métrica | resultado | comprobante |
|---|---|---|
| Reducción de la factura de punta a punta | **59–70%** | traza de producción, 13.709 requests |
| Tokens por bloque convertido | **10× menos** (28.080 chars: 14.040 → 1.460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Precisión de la fórmula de billing | residuo **cero** en 22 pruebas de `count_tokens`, 2 modelos × 2 tiers | `benchmarks/billing-sweep/results/` |
| Precisión de lectura exacta, config de producción | **30/30 (100%)** en Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Confabulaciones silenciosas en ~300 pruebas de lectura | **0** — cada fallo se abstiene como `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Tabla de puntuación por modelo** (¿puede leer los renders densos? n=30 por brazo, puntuación determinista):

| modelo | lectura | veredicto |
|---|---|---|
| Claude **Fable 5** | **100%** exacta | ✅ objetivo de producción |
| Claude Opus 4.8 | 77–87% con glifos 4× más grandes | ⚠️ modo seguro opcional (el ahorro cae a ~2×) |
| GPT-5.5 | 0/60 — e infla sus respuestas ~40× intentándolo | ❌ bloqueado por el gate, con prueba |
| Gemini 2.5-flash | 0/26 — y confabula en vez de abstenerse | ❌ bloqueado (prueba parcial, limitada por cuota) |

La ventaja es **específica de Fable hoy** — los demás encoders de visión aún no resuelven glifos densos. El [harness de benchmarks](benchmarks/README.md) vuelve a probar cualquier modelo nuevo en un solo comando.

# 🤔 ¿Por qué OmniGlyph?

Toda sesión de agente de larga duración arrastra el mismo peso muerto en cada request: el system prompt, los docs de herramientas y el historial antiguo — recobrados por token, en cada turno. OmniGlyph es un **proxy local** que reescribe esas partes voluminosas en páginas PNG densas *antes de que salgan de tu máquina*:

- **Matemática de billing exacta, no heurísticas** — calcula la fórmula real de tokens por imagen del proveedor (medida a residuo cero) y convierte solo cuando la matemática gana.
- **Fail-closed por diseño** — los modelos que no pueden leer renders densos quedan bloqueados por un gate, con comprobantes de benchmark. Sin pérdida de calidad silenciosa.
- **Privado y local-first** — la reescritura ocurre en `127.0.0.1`; no se envía nada adicional a ningún lado.
- **Reproducible** — cada número de arriba tiene un comprobante en `benchmarks/*/results/`, re-ejecutable en un comando.

# ⚡ Inicio rápido

```bash
npx omniglyph                                     # proxy en 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # apunta Claude Code hacia él
```

![Inicio rápido: levanta el proxy, revisa el dashboard, apunta Claude Code hacia él](../../../docs/assets/demo-quickstart.gif)

Funciona de las dos formas:
- **Clave de API** (pago por token): tu factura baja 59–70% de punta a punta.
- **Sesión por suscripción**: no pagas menos, pero los límites de uso se cuentan en tokens — así que tus límites rinden **~2–3× más**.

Dashboard en <http://127.0.0.1:47821/>: tokens ahorrados, cada conversión texto→imagen lado a lado, kill switch, chips de modelo en vivo. Las respuestas hacen streaming normal — solo el *request* se comprime, nunca la salida del modelo.

# ⚙️ Cómo funciona

```
bloque de request voluminoso ──► gate de rentabilidad ──► reflow + render (atlas 1-bit 5×8)
                       (matemática de billing exacta)     ──► páginas PNG 1568×728 ──► empalme de vuelta, cache-friendly
```

- **El billing se calcula exactamente, antes de convertir**: Anthropic cobra `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens por imagen (parches de 28 px — medido a residuo cero). Una página completa lleva 28.080 chars por 1.460 tokens ≈ **19 chars/token**, contra ~2 chars/token del texto denso. El gate convierte solo cuando la matemática gana.
- **Qué se convierte**: el system prompt estático + docs de herramientas, el historial colapsado antiguo, las salidas grandes de herramienta.
- **Qué nunca se convierte**: tus mensajes, turnos recientes, la salida del modelo, prosa esparcida, valores byte-exactos (hashes/IDs viajan como texto junto a la imagen) y cualquier modelo que haya reprobado el benchmark de lectura.

# 🧭 La parte honesta

- **Es lossy.** El recall byte-exacto desde imágenes no es confiable por naturaleza. Mitigaciones aplicadas: los identificadores exactos viajan como texto junto a la imagen, y la config de producción medida produjo **cero confabulaciones silenciosas** — las lecturas fallidas se abstienen.
- **Solo Fable 5 está aprobado hoy**, con comprobantes. GPT-5.5 y Gemini 2.5-flash mesurablemente no pueden leer renders densos; Opus 4.8 necesita glifos 4× más grandes. El gate hace cumplir esto.
- **Encontramos y evitamos una trampa de billing**: el tier de imagen de alta resolución cobra 3,3× más por página, pero el encoder de visión no recibe la resolución extra — las páginas más grandes leen *peor*. Medido, documentado en [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), no habilitado.
- Los precios cambian; la métrica durable es el corte de tokens, que el proxy registra por request contra un contrafactual gratuito de `count_tokens`.

# 🔬 Reproduce cada número

```bash
pnpm install && pnpm test                                     # suite completa
node benchmarks/billing-sweep/run.mjs --dry-run               # predicciones de billing, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # tabla de costos, $0
# con claves: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (o --via-cli para una suscripción de Claude Code)
```

![Los dos harnesses de benchmark corriendo en modo dry-run](../../../docs/assets/demo-benchmarks.gif)

Metodología completa y cada tabla de resultados: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Comprobantes crudos por respuesta: `benchmarks/*/results/*.jsonl`.

# 🚀 La familia OmniRoute

OmniGlyph también se distribuye como un **motor de compresión nativo dentro de [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — el gateway de IA gratuito. Ahí corre como el motor `omniglyph` (modo único independiente o apilado con los demás motores), con gates fail-closed y contabilidad de tokens consciente de imágenes.

# 🛠️ Stack técnico

| capa | tecnología |
|---|---|
| Lenguaje | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Renderizado | atlas de glifos 1-bit propio (derivado de Spleen/Unifont, licencias en `assets/`) → PNG |
| Tests | Vitest — TDD, más guards de docs-integrity y rebrand |
| Benchmarks | harnesses en `benchmarks/` (billing-sweep, density-frontier) con comprobantes JSONL |

## Estructura del proyecto

| ruta | qué es |
|---|---|
| `src/` | el proxy: pipeline de transformación, billing exacto por proveedor, renderer, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | los harnesses que produjeron cada número de arriba — re-ejecutables |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Soporte y comunidad

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugs y pedidos de funcionalidad
- 🔒 [SECURITY.md](SECURITY.md) — reportes de vulnerabilidades
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD estricto + medición antes de afirmaciones
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licencia

MIT — ver [LICENSE](../../../LICENSE).
