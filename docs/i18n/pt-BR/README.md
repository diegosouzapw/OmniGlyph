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

# 🖥️ O dashboard

Um dashboard local completo vem embutido no pacote — offline, em arquivo único, zero requests externos. Seis páginas, atualizadas ao vivo via SSE conforme os requests fluem:

![Overview: cards de KPI estilo centro de controle, sparkline de economia e feed de eventos ao vivo](../../assets/dashboard-overview.png)

- **Overview** — centro de controle: % de economia, $ economizado, latência p95, cache hits, erros, feed ao vivo.
- **Live Flow** — o pipeline como um grafo de nós: cliente → gate → renderer / passthrough → API, com uma partícula por request real.
- **Telemetry** — um odômetro de tokens/$ e uma linha do tempo de requests ao vivo; clique em qualquer request para ver exatamente quais partes viraram imagem e ler o texto de origem por trás de cada página.
- **Benchmarks** — os comprovantes do harness renderizados a partir de `benchmarks/*/results/`, uma linha por experimento modelo·config, e **rode os benchmarks pela UI**: dry-runs de `$0` fazem streaming da saída ao vivo; execuções reais ficam bloqueadas atrás da sua chave de API mais uma confirmação explícita de custo.
- **Sessions / History** — as sessões com mais tokens economizados e todo evento em disco.

| Live Flow | Benchmarks |
|---|---|
| ![O pipeline de requests como um grafo de nós ao vivo](../../assets/dashboard-flow.png) | ![Comprovantes de benchmark e dry-runs na UI](../../assets/dashboard-benchmarks.png) |

![Telemetry: odômetro e linha do tempo de requests ao vivo](../../assets/dashboard-telemetry.png)

# ⚙️ Como funciona

```
bloco de request volumoso ──► gate de rentabilidade ──► reflow + render (atlas 1-bit 5×8)
                       (matemática de cobrança exata)     ──► páginas PNG 1568×728 ──► reinserido, cache-friendly
```

- **A cobrança é calculada exatamente, antes de converter**: a Anthropic cobra `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens por imagem (patches de 28 px — medido com resíduo zero). Uma página cheia carrega 28.080 caracteres por 1.460 tokens ≈ **19 caracteres/token**, contra ~2 caracteres/token para texto denso. O gate converte somente quando a conta compensa.
- **O que é convertido**: o system prompt estático + docs de ferramentas, histórico antigo colapsado, saídas grandes de ferramenta.
- **O que nunca é convertido**: suas mensagens, turnos recentes, a saída do modelo, prosa esparsa, valores byte-exatos (hashes/IDs viajam junto como texto), e qualquer modelo que falhou no benchmark de leitura.

# 📚 Uso como biblioteca (sem proxy)

Tudo que o proxy faz por request também é uma API documentada e importável:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Renderize qualquer texto em páginas PNG densas de 1-bit
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Ou execute você mesmo toda a transformação do request — gate, matemática de cobrança e tudo mais
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // o JSON body cru do /v1/messages
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` fixa blocos como texto; `options.emitRecoverable` retorna os originais dos blocos convertidos em imagem. A matemática de cobrança exata também é exportada na raiz do pacote (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — é isso que o [OmniRoute](https://github.com/diegosouzapw/OmniRoute) consome. Runtime puro-JS (Node e edge/Workers). Superfície completa: `src/core/index.ts`.

# 📤 Exportação offline — sem proxy, sem Claude Code

Não usa o Claude Code? Renderize o contexto em páginas PNG **localmente** e cole-as no Cursor, ChatGPT ou qualquer chat que aceite upload de imagens. Sem proxy, sem chave de API, sem nenhuma conta configurada:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Você recebe uma única pasta com tudo pronto para arrastar para o chat:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` renderiza seu diff ainda não commitado, `--diff <ref>` um intervalo de commits, `--open` revela a pasta (macOS). Tudo roda na sua máquina — o caminho de exportação nunca inicia o proxy e nunca chama um modelo. Rode `omniglyph export --help` para ver todas as flags.

# 🧭 A parte honesta

- **É lossy.** Recall byte-exato a partir de imagens é inerentemente não confiável. Mitigações já implementadas: identificadores exatos viajam como texto ao lado da imagem, e a config de produção medida produziu **zero confabulações silenciosas** — leituras que falham se abstêm.
- **Só o Fable 5 está aprovado hoje**, com comprovantes. GPT-5.5 e Gemini 2.5-flash mensuravelmente não conseguem ler renders densos; Opus 4.8 precisa de glifos 4× maiores. O gate impõe isso.
- **Encontramos e evitamos uma armadilha de cobrança**: o tier de imagem em alta resolução cobra 3,3× mais por página, mas o encoder de visão não recebe a resolução extra — páginas maiores leem *pior*. Medido, documentado em [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md), não habilitado.
- Preços mudam; a métrica durável é o corte de tokens, que o proxy registra por request contra um contrafactual gratuito de `count_tokens`.

# 🧠 FAQ

**Os 59–70% são de ponta a ponta, ou só nos requests que ele tocou?**
De ponta a ponta — a conta inteira. A maioria das ferramentas de compressão reporta economia só na fatia que tocou, o que infla o número. Nosso denominador é *todo* request: os pequenos que o gate corretamente deixou intocados, todas as escritas e leituras de cache, e todos os tokens de saída (que o proxy nunca comprime). Rodando só sobre o que foi convertido o número fica maior, e é citado à parte, nunca como manchete.

**Como a economia é medida?**
Os dois lados do mesmo request, no mesmo momento. Para cada POST em `/v1/messages` o proxy dispara uma sonda `count_tokens` gratuita sobre o body original não comprimido (o contrafactual) em paralelo com o envio real, e lê o bloco de uso efetivamente cobrado pelo provedor na resposta — ambos caem na mesma linha de evento. O preço de cache é aplicado de forma idêntica aos dois lados, então o desconto de cache se cancela e não pode ser contado em dobro como "economia". A fórmula está em `src/core/baseline.ts`; re-derive a partir do seu próprio log de eventos.

**Por que um erro seria uma confabulação, e não um simples erro de leitura?**
Porque visão de modelo não é OCR: a página vira embeddings de patch, nunca caracteres discretos — então não existe uma confiança por glifo para falhar de forma visível. Quando os pixels subdeterminam um glifo, o prior linguístico preenche a lacuna com algo plausível. É exatamente por esse mecanismo que o OmniGlyph é fail-closed nesse ponto: valores byte-exatos sempre viajam como texto ao lado da imagem, modelos que leem errado são bloqueados pelo gate, e a config de produção medida produziu **zero** confabulações silenciosas em ~300 sondas de leitura — leituras que falham se abstêm.

**E o trabalho byte-exato (hashes, IDs, segredos)?**
Turnos recentes e identificadores exatos permanecem como texto, por design. Para cargas de trabalho que são *inteiramente* byte-exatas, roteie-as para um modelo fora do allowlist (por exemplo, um subagente rodando em outro modelo Claude) — qualquer coisa fora do allowlist passa intocada, byte-idêntica.

**O DeepSeek-OCR não resolveu de vez se isso funciona?**
Ele provou que o *canal* funciona — com um par encoder/decoder treinado especificamente para a tarefa. O ceticismo vem de uma época em que nenhum modelo de produção padrão conseguia ler renders densos; isso mudou, e o [placar de modelos](../../../README.md#-the-numbers--measured-not-estimated) acima mostra exatamente quem os lê hoje, com comprovantes. O [harness de benchmark](../../../benchmarks/README.md) retesta qualquer modelo novo em um único comando — o gate segue os dados, não o hype.

**Dá para usar sem o Claude Code — no Cursor, no ChatGPT, num pipe simples?**
Sim, de dois jeitos. Como **proxy**, funciona com qualquer cliente que permita definir a URL base da API (`ANTHROPIC_BASE_URL`, ou a URL base da OpenAI) — Claude Code, seus próprios scripts, qualquer coisa via HTTP. E para ferramentas que não conseguem usar proxy, a **Exportação offline** acima renderiza o contexto em páginas PNG que você cola à mão — o `omniglyph export --stdin` lê até direto de um pipe Unix.

**Como ele de fato transforma texto em imagem?**
Ele faz o reflow do texto e o pinta com um atlas de glifos 1-bit de 5×8 pixels em páginas PNG densas de 1568×728 — um bit por pixel, sem anti-aliasing, então o modelo cobra a página pelas suas dimensões, não por quantos caracteres há dentro dela. A seção **Como funciona** acima traz o pipeline; o doc de benchmarks traz a geometria e por que mais denso nem sempre é mais barato.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Agradecimentos

O OmniGlyph se apoia nos ombros de um projeto em particular — esta seção é nosso agradecimento permanente.

| Projeto | Como moldou o OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **A descoberta sobre a qual todo este projeto é construído.** O pxpipe provou, com comprovantes, que o canal de visão de um LLM de produção pode carregar contexto textual denso por uma fração do custo em tokens — e que a conversão precisa ser decidida por request pela matemática exata de cobrança, nunca por intuição. A renderização densa em 1-bit, o gate de rentabilidade, o contrafactual `count_tokens`, o allowlist fail-closed de modelos e a cultura de documentação "meça antes de afirmar" foram todos pioneiros ali. O OmniGlyph descende diretamente daquele codebase (MIT — a linha de copyright original permanece na nossa [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | A família de fontes bitmap 5×8 da qual nosso atlas de glifos denso em 1-bit deriva (licença em `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Cobertura para os glifos além do alcance do Spleen, no mesmo atlas (licença em `assets/`). |

Se você acha o OmniGlyph útil, vá dar uma estrela no projeto original também — a descoberta foi deles. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licença

MIT — veja [LICENSE](../../../LICENSE).
