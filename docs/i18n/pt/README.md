🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="Um render real: prompt de sistema + documentação de ferramentas comprimidos numa única página densa de 1568×728" width="820"/>

<br/>

# 🖼️ OmniGlyph — Contexto como imagem

### Reduza a sua fatura da Claude em **59–70%** ao renderizar contexto volumoso como páginas PNG densas — o mesmo conteúdo, numa fração dos tokens.

**Os modelos cobram texto por token, mas cobram uma imagem pelas suas dimensões — não pela quantidade de texto que contém.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-os-nmeros--medidos-no-estimados)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](../../../benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](../../../benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-a-parte-honesta)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Parte da família [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Todos os idiomas](../README.md)

</div>

---

# 📊 Os números — medidos, não estimados

| métrica | resultado | recibo |
|---|---|---|
| Redução de fatura de ponta a ponta | **59–70%** | traço de produção, 13.709 pedidos |
| Tokens por bloco convertido | **10× menos** (28.080 caracteres: 14.040 → 1.460 tokens) | [billing sweep](../../../benchmarks/billing-sweep/README.md) |
| Precisão da fórmula de faturação | resíduo **zero** em 22 sondas `count_tokens`, 2 modelos × 2 níveis | `benchmarks/billing-sweep/results/` |
| Precisão de leitura exata, configuração de produção | **30/30 (100%)** na Claude Fable 5 | [density frontier](../../../benchmarks/density-frontier/README.md) |
| Confabulações silenciosas em ~300 sondas de leitura | **0** — todas as falhas abstêm-se como `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Classificação por modelo** (consegue ler renders densos? n=30 por braço, pontuação determinística):

| modelo | leitura | veredito |
|---|---|---|
| Claude **Fable 5** | **100%** exato | ✅ alvo de produção |
| Claude Opus 4.8 | 77–87% com glifos 4× maiores | ⚠️ modo seguro opcional (poupança cai para ~2×) |
| GPT-5.5 | 0/60 — e infla as respostas ~40× a tentar | ❌ bloqueado pelo gate, com prova |
| Gemini 2.5-flash | 0/26 — e confabula em vez de se abster | ❌ bloqueado (teste parcial, limitado por quota) |

A vantagem é **específica da Fable, hoje**— outros codificadores de visão ainda não conseguem resolver glifos densos. O [conjunto de benchmarks](../../../benchmarks/README.md) volta a testar qualquer modelo novo num único comando.

# 🤔 Porquê o OmniGlyph?

Toda a sessão de agente de longa duração arrasta o mesmo peso morto em cada pedido: o prompt de sistema, a documentação de ferramentas e o histórico antigo — voltados a faturar por token, a cada turno. O OmniGlyph é um **proxy local** que reescreve essas partes volumosas em páginas PNG densas *antes de saírem da sua máquina*:

- **Matemática de faturação exata, não heurísticas** — calcula a fórmula real de tokens de imagem do fornecedor (medida com resíduo zero) e só converte quando a matemática compensa.
- **Fail-closed por design** — modelos que não conseguem ler renders densos são bloqueados por um gate, com recibos de benchmark. Sem perda de qualidade silenciosa.
- **Privado e local-first** — a reescrita acontece em `127.0.0.1`; nada extra é enviado para lado nenhum.
- **Reprodutível** — cada número acima tem um recibo em `benchmarks/*/results/`, reexecutável num único comando.

# ⚡ Início rápido

```bash
npx omniglyph                                     # proxy em 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # aponte o Claude Code para ele
```

![Início rápido: iniciar o proxy, verificar o dashboard, apontar o Claude Code para ele](../../../docs/assets/demo-quickstart.gif)

Funciona nos dois sentidos:
- **Chave de API** (pagamento por token): a sua fatura cai 59–70% de ponta a ponta.
- **Sessão de subscrição**: não paga menos, mas os limites de utilização são contados em tokens — pelo que os seus limites esticam **~2–3×**.

Dashboard em <http://127.0.0.1:47821/>: tokens poupados, cada conversão texto→imagem lado a lado, interruptor de emergência, chips de modelos em direto. As respostas fazem streaming normalmente — apenas o *pedido* é comprimido, nunca a saída do modelo.

# ⚙️ Como funciona

```
bloco de pedido volumoso ──► gate de rentabilidade ──► reflow + render (atlas 1-bit 5×8)
                       (matemática de faturação exata)     ──► páginas PNG 1568×728 ──► reinserção, compatível com cache
```

- **A faturação é calculada com exatidão, antes de converter**: a Anthropic cobra `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens por imagem (patches de 28 px — medido com resíduo zero). Uma página completa transporta 28.080 caracteres por 1.460 tokens ≈ **19 caracteres/token**, contra ~2 caracteres/token para texto denso. O gate só converte quando a matemática compensa.
- **O que é convertido**: o prompt de sistema estático + documentação de ferramentas, histórico antigo já recolhido, saídas de ferramentas volumosas.
- **O que nunca é convertido**: as suas mensagens, turnos recentes, a saída do modelo, prosa esparsa, valores exatos ao byte (hashes/IDs seguem à parte como texto) e qualquer modelo que tenha falhado o benchmark de leitura.

# 🧭 A parte honesta

- **É com perdas.** A recuperação exata ao byte a partir de imagens é, por natureza, pouco fiável. Mitigações implementadas: os identificadores exatos viajam como texto ao lado da imagem, e a configuração de produção medida produziu **zero confabulações silenciosas** — leituras falhadas abstêm-se.
- **Apenas a Fable 5 está aprovada hoje**, com recibos. O GPT-5.5 e o Gemini 2.5-flash comprovadamente não conseguem ler renders densos; o Opus 4.8 precisa de glifos 4× maiores. O gate impõe isto.
- **Encontrámos e evitámos uma armadilha de faturação**: o nível de imagem de alta resolução cobra 3,3× mais por página, mas o codificador de visão não recebe a resolução extra — páginas maiores leem-se *pior*. Medido, documentado em [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md), não ativado.
- Os preços mudam; a métrica duradoura é o corte de tokens, que o proxy regista por pedido face a um contrafactual gratuito de `count_tokens`.

# 🔬 Reproduza cada número

```bash
pnpm install && pnpm test                                     # suíte completa
node benchmarks/billing-sweep/run.mjs --dry-run               # previsões de faturação, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # tabela de custos, $0
# com chaves: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (ou --via-cli para uma subscrição do Claude Code)
```

![Os dois conjuntos de benchmarks em execução em modo dry-run](../../../docs/assets/demo-benchmarks.gif)

Metodologia completa e todas as tabelas de resultados: [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md). Recibos brutos por resposta: `benchmarks/*/results/*.jsonl`.

# 🚀 A família OmniRoute

O OmniGlyph também é distribuído como um **motor de compressão nativo dentro do [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — a gateway de IA gratuita. Aí funciona como o motor `omniglyph` (modo autónomo isolado ou empilhado com os outros motores), com gates fail-closed e contabilização de tokens sensível a imagens.

# 🛠️ Stack tecnológico

| camada | tecnologia |
|---|---|
| Linguagem | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Renderização | atlas de glifos 1-bit próprio (derivado de Spleen/Unifont, licenças em `assets/`) → PNG |
| Testes | Vitest — TDD, mais guardas de integridade de documentação e de rebranding |
| Benchmarks | conjuntos em `benchmarks/` (billing-sweep, density-frontier) com recibos JSONL |

## Estrutura do projeto

| caminho | o que é |
|---|---|
| `src/` | o proxy: pipeline de transformação, faturação exata por fornecedor, renderizador, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | os conjuntos que produziram cada número acima — reexecutáveis |
| `docs/` | [BENCHMARKS](../../../docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](../../../docs/architecture/ARCHITECTURE.md) · [ROADMAP](../../../docs/ROADMAP.md) |

# 📧 Suporte e comunidade

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugs e pedidos de funcionalidades
- 🔒 [SECURITY.md](SECURITY.md) — relatórios de vulnerabilidades
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD estrito + medição antes de afirmações
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licença

MIT — ver [LICENSE](../../../LICENSE).
