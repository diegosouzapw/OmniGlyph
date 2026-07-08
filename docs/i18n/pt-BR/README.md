🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="Um render real: system prompt + docs de ferramentas compactados em uma única página densa de 1568×728" width="820"/>

<br/>

# 🖼️ OmniGlyph — Contexto como Imagem

### Corte sua conta do Claude em **59–70%** renderizando contexto volumoso como páginas PNG densas — o mesmo conteúdo, numa fração dos tokens.

**Modelos cobram texto por token, mas cobram uma imagem pelas suas dimensões — não por quanto texto há dentro dela.**

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

| métrica | resultado | comprovante |
|---|---|---|
| Redução de conta de ponta a ponta | **59–70%** | trace de produção, 13.709 requests |
| Tokens por bloco convertido | **10× menos** (28.080 caracteres: 14.040 → 1.460 tokens) | [billing sweep](../../../benchmarks/billing-sweep/README.md) |
| Precisão da fórmula de cobrança | resíduo **zero** em 22 sondas `count_tokens`, 2 modelos × 2 tiers | `benchmarks/billing-sweep/results/` |
| Precisão de leitura exata, config de produção | **30/30 (100%)** no Claude Fable 5 | [density frontier](../../../benchmarks/density-frontier/README.md) |
| Confabulações silenciosas em ~300 sondas de leitura | **0** — todo erro se abstém como `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Placar de modelos** (consegue ler renders densos? n=30 por braço, pontuação determinística):

| modelo | leitura | veredito |
|---|---|---|
| Claude **Fable 5** | **100%** exato | ✅ alvo de produção |
| Claude Opus 4.8 | 77–87% com glifos 4× maiores | ⚠️ modo seguro opcional (economia cai para ~2×) |
| GPT-5.5 | 0/60 — e infla suas respostas ~40× tentando | ❌ bloqueado pelo gate, com prova |
| Gemini 2.5-flash | 0/26 — e confabula em vez de se abster | ❌ bloqueado (teste parcial, limitado por quota) |

A vantagem é **específica do Fable hoje** — outros encoders de visão ainda não resolvem glifos densos. O [harness de benchmark](../../../benchmarks/README.md) retesta qualquer modelo novo em um único comando.

# 🤔 Por que OmniGlyph?

Toda sessão longa de agente arrasta o mesmo peso morto em cada request: o system prompt, docs de ferramentas e histórico antigo — recobrados por token, a cada turno. O OmniGlyph é um **proxy local** que reescreve essas partes volumosas em páginas PNG densas *antes de saírem da sua máquina*:

- **Matemática de cobrança exata, não heurística** — calcula a fórmula real de tokens de imagem do provedor (medida com resíduo zero) e converte somente quando a conta compensa.
- **Fail-closed por design** — modelos que não conseguem ler renders densos são bloqueados por um gate, com comprovantes de benchmark. Sem perda de qualidade silenciosa.
- **Privado e local-first** — a reescrita acontece em `127.0.0.1`; nada extra é enviado a lugar nenhum.
- **Reprodutível** — todo número acima tem um comprovante em `benchmarks/*/results/`, re-executável em um único comando.

# ⚡ Início Rápido

```bash
npx omniglyph                                     # proxy em 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # aponte o Claude Code para ele
```

![Início rápido: inicie o proxy, verifique o dashboard, aponte o Claude Code para ele](../../../docs/assets/demo-quickstart.gif)

Funciona dos dois jeitos:
- **Chave de API** (paga por token): sua conta cai 59–70% de ponta a ponta.
- **Sessão de assinatura**: você não paga menos, mas os limites de uso são contados em tokens — então seus limites se esticam **~2–3×**.

Dashboard em <http://127.0.0.1:47821/>: tokens economizados, cada conversão texto→imagem lado a lado, kill switch, chips de modelo ao vivo. As respostas fazem streaming normalmente — só o *request* é comprimido, nunca a saída do modelo.

# ⚙️ Como funciona

```
bloco de request volumoso ──► gate de rentabilidade ──► reflow + render (atlas 1-bit 5×8)
                       (matemática de cobrança exata)     ──► páginas PNG 1568×728 ──► reinserido, cache-friendly
```

- **A cobrança é calculada exatamente, antes de converter**: a Anthropic cobra `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens por imagem (patches de 28 px — medido com resíduo zero). Uma página cheia carrega 28.080 caracteres por 1.460 tokens ≈ **19 caracteres/token**, contra ~2 caracteres/token para texto denso. O gate converte somente quando a conta compensa.
- **O que é convertido**: o system prompt estático + docs de ferramentas, histórico antigo colapsado, saídas grandes de ferramenta.
- **O que nunca é convertido**: suas mensagens, turnos recentes, a saída do modelo, prosa esparsa, valores byte-exatos (hashes/IDs viajam junto como texto), e qualquer modelo que falhou no benchmark de leitura.

# 🧭 A parte honesta

- **É lossy.** Recall byte-exato a partir de imagens é inerentemente não confiável. Mitigações já implementadas: identificadores exatos viajam como texto ao lado da imagem, e a config de produção medida produziu **zero confabulações silenciosas** — leituras que falham se abstêm.
- **Só o Fable 5 está aprovado hoje**, com comprovantes. GPT-5.5 e Gemini 2.5-flash mensuravelmente não conseguem ler renders densos; Opus 4.8 precisa de glifos 4× maiores. O gate impõe isso.
- **Encontramos e evitamos uma armadilha de cobrança**: o tier de imagem em alta resolução cobra 3,3× mais por página, mas o encoder de visão não recebe a resolução extra — páginas maiores leem *pior*. Medido, documentado em [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md), não habilitado.
- Preços mudam; a métrica durável é o corte de tokens, que o proxy registra por request contra um contrafactual gratuito de `count_tokens`.

# 🔬 Reproduza cada número

```bash
pnpm install && pnpm test                                     # suíte completa
node benchmarks/billing-sweep/run.mjs --dry-run               # previsões de cobrança, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # tabela de custo, $0
# com chaves: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (ou --via-cli para uma assinatura do Claude Code)
```

![Os dois harnesses de benchmark rodando em modo dry-run](../../../docs/assets/demo-benchmarks.gif)

Metodologia completa e todas as tabelas de resultado: [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md). Comprovantes brutos por resposta: `benchmarks/*/results/*.jsonl`.

# 🚀 A família OmniRoute

O OmniGlyph também é distribuído como um **motor de compressão nativo dentro do [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — o gateway de IA gratuito. Lá ele roda como o motor `omniglyph` (modo standalone único ou empilhado com os outros motores), com gates fail-closed e contabilidade de tokens ciente de imagem.

# 🛠️ Stack Técnica

| camada | tecnologia |
|---|---|
| Linguagem | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Renderização | atlas de glifos 1-bit próprio (derivado de Spleen/Unifont, licenças em `assets/`) → PNG |
| Testes | Vitest — TDD, mais guards de integridade de docs e de rebrand |
| Benchmarks | harnesses em `benchmarks/` (billing-sweep, density-frontier) com comprovantes JSONL |

## Estrutura do projeto

| caminho | o que é |
|---|---|
| `src/` | o proxy: pipeline de transformação, cobrança exata por provedor, renderizador, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | os harnesses que produziram cada número acima — re-executáveis |
| `docs/` | [BENCHMARKS](../../../docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](../../../docs/architecture/ARCHITECTURE.md) · [ROADMAP](../../../docs/ROADMAP.md) |

# 📧 Suporte & Comunidade

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugs e pedidos de funcionalidade
- 🔒 [SECURITY.md](SECURITY.md) — relatos de vulnerabilidade
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD estrito + medição antes de afirmações
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licença

MIT — veja [LICENSE](../../../LICENSE).
