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

# 🖥️ O dashboard

O pacote inclui um dashboard local completo — offline, num único ficheiro, sem pedidos externos. Seis páginas, atualizadas em direto via SSE à medida que os pedidos fluem:

![Visão geral: cartões de KPI de centro de controlo, sparkline de poupança e feed de eventos em direto](../../assets/dashboard-overview.png)

- **Overview** — centro de controlo: % de poupança, $ poupados, latência p95, acertos de cache, erros, feed em direto.
- **Live Flow** — o pipeline como um grafo de nós: client → gate → renderer / passthrough → API, com uma partícula por pedido real.
- **Telemetry** — um hodómetro de tokens/$ e uma linha temporal de pedidos em direto; clique em qualquer pedido para ver exatamente que partes se tornaram imagens e ler o texto de origem por trás de cada página.
- **Benchmarks** — os recibos do harness renderizados a partir de `benchmarks/*/results/`, uma linha por experiência de modelo·configuração, e **execute os benchmarks a partir da UI**: os dry-runs de `$0` transmitem a sua saída em direto; as execuções reais ficam bloqueadas atrás da sua chave de API mais uma confirmação explícita de custo.
- **Sessions / History** — as sessões principais por tokens poupados e todos os eventos em disco.

| Live Flow | Benchmarks |
|---|---|
| ![O pipeline de pedidos como um grafo de nós em direto](../../assets/dashboard-flow.png) | ![Recibos de benchmarks e dry-runs na UI](../../assets/dashboard-benchmarks.png) |

![Telemetry: hodómetro e linha temporal de pedidos em direto](../../assets/dashboard-telemetry.png)

# ⚙️ Como funciona

```
bloco de pedido volumoso ──► gate de rentabilidade ──► reflow + render (atlas 1-bit 5×8)
                       (matemática de faturação exata)     ──► páginas PNG 1568×728 ──► reinserção, compatível com cache
```

- **A faturação é calculada com exatidão, antes de converter**: a Anthropic cobra `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens por imagem (patches de 28 px — medido com resíduo zero). Uma página completa transporta 28.080 caracteres por 1.460 tokens ≈ **19 caracteres/token**, contra ~2 caracteres/token para texto denso. O gate só converte quando a matemática compensa.
- **O que é convertido**: o prompt de sistema estático + documentação de ferramentas, histórico antigo já recolhido, saídas de ferramentas volumosas.
- **O que nunca é convertido**: as suas mensagens, turnos recentes, a saída do modelo, prosa esparsa, valores exatos ao byte (hashes/IDs seguem à parte como texto) e qualquer modelo que tenha falhado o benchmark de leitura.

# 📚 Uso como biblioteca (sem proxy)

Tudo o que o proxy faz por pedido é também uma API documentada e importável:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Renderiza qualquer texto em páginas PNG densas de 1 bit
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Ou execute você mesmo a transformação completa do pedido — gate, matemática de faturação e tudo
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // o corpo JSON bruto de /v1/messages
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` fixa blocos como texto; `options.emitRecoverable` devolve os originais dos blocos transformados em imagem. A matemática de faturação exata também é exportada na raiz do pacote (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — é isso que o [OmniRoute](https://github.com/diegosouzapw/OmniRoute) consome. Runtime puro em JS (Node e edge/Workers). Superfície completa: `src/core/index.ts`.

# 📤 Exportação offline — sem proxy, sem Claude Code

Não usa o Claude Code? Renderize o contexto em páginas PNG **localmente** e cole-as no Cursor, no ChatGPT ou em qualquer chat que aceite carregamento de imagens. Sem proxy, sem chave de API, sem conta ligada:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Fica com uma pasta única, com tudo pronto para largar no chat:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` renderiza o seu diff ainda não submetido, `--diff <ref>` um intervalo de commits, `--open` revela a pasta (macOS). Tudo corre na sua máquina — o caminho de exportação nunca inicia o proxy e nunca chama um modelo. Execute `omniglyph export --help` para ver todas as flags.

# 🧭 A parte honesta

- **É com perdas.** A recuperação exata ao byte a partir de imagens é, por natureza, pouco fiável. Mitigações implementadas: os identificadores exatos viajam como texto ao lado da imagem, e a configuração de produção medida produziu **zero confabulações silenciosas** — leituras falhadas abstêm-se.
- **Apenas a Fable 5 está aprovada hoje**, com recibos. O GPT-5.5 e o Gemini 2.5-flash comprovadamente não conseguem ler renders densos; o Opus 4.8 precisa de glifos 4× maiores. O gate impõe isto.
- **Encontrámos e evitámos uma armadilha de faturação**: o nível de imagem de alta resolução cobra 3,3× mais por página, mas o codificador de visão não recebe a resolução extra — páginas maiores leem-se *pior*. Medido, documentado em [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md), não ativado.
- Os preços mudam; a métrica duradoura é o corte de tokens, que o proxy regista por pedido face a um contrafactual gratuito de `count_tokens`.

# 🧠 FAQ

**Os 59–70% são de ponta a ponta, ou só nos pedidos que foram tocados?**
De ponta a ponta — a fatura inteira. A maioria das ferramentas de compressão reporta poupanças apenas na fatia que tocou, o que infla o número. O nosso denominador é *todo* pedido: os pequenos que o gate corretamente deixou intocados, todas as escritas e leituras de cache, e todos os tokens de saída (que o proxy nunca comprime). O valor "apenas comprimido" é mais alto e é citado à parte, nunca como o número principal.

**Como é medida a poupança?**
Os dois lados do mesmo pedido, no mesmo momento. Para cada POST em `/v1/messages` o proxy dispara uma sonda gratuita de `count_tokens` sobre o corpo original não comprimido (o contrafactual) em paralelo com o encaminhamento real, e lê o bloco de utilização efetivamente faturado pelo fornecedor na resposta — ambos ficam registados na mesma linha de evento. O preço de cache é aplicado de forma idêntica aos dois lados, pelo que o desconto de cache se cancela e não pode ser contado a dobrar como "poupança". A fórmula vive em `src/core/baseline.ts`; pode ser re-derivada a partir do seu próprio registo de eventos.

**Porque é que uma falha seria uma confabulação e não um erro de leitura?**
Porque a visão dos modelos não é OCR: a página torna-se embeddings de patches, nunca caracteres discretos, pelo que não existe uma confiança por glifo capaz de falhar de forma explícita — quando os pixels subdeterminam um glifo, o prior linguístico preenche a lacuna com algo plausível. É exatamente por esse mecanismo que o OmniGlyph é fail-closed quanto a isto: os valores exatos ao byte viajam sempre como texto ao lado da imagem, os modelos que leem mal são bloqueados pelo gate, e a configuração de produção medida produziu **zero** confabulações silenciosas em ~300 sondas de leitura — leituras falhadas abstêm-se.

**E o trabalho exato ao byte (hashes, IDs, segredos)?**
Os turnos recentes e os identificadores exatos permanecem como texto por design. Para cargas de trabalho que são *inteiramente* exatas ao byte, encaminhe-as para um modelo fora da allowlist (por exemplo, um subagente noutro modelo Claude) — tudo o que estiver fora da allowlist passa byte a byte idêntico, sem ser tocado.

**O DeepSeek-OCR já não resolveu se isto funciona?**
Provou que o *canal* funciona — com um par codificador/descodificador treinado para essa tarefa. O ceticismo vem de quando nenhum modelo de produção genérico conseguia ler renders densos; isso mudou, e a [classificação por modelo](../../../README.md#-the-numbers--measured-not-estimated) acima mostra exatamente quem os lê hoje, com recibos. O [conjunto de benchmarks](../../../benchmarks/README.md) volta a testar qualquer modelo novo num único comando — o gate segue os dados, não o hype.

**Posso usá-lo sem o Claude Code — Cursor, ChatGPT, um simples pipe?**
Sim, de duas formas. Como **proxy**, funciona com qualquer cliente que permita definir a URL base da API (`ANTHROPIC_BASE_URL`, ou a URL base da OpenAI) — Claude Code, os seus próprios scripts, qualquer coisa por HTTP. E para ferramentas que não conseguem usar proxy, a **Exportação offline** acima renderiza o contexto em páginas PNG que cola à mão — o `omniglyph export --stdin` até lê diretamente de um pipe Unix.

**Como é que, na prática, transforma texto numa imagem?**
Faz reflow do texto e pinta-o com um atlas de glifos 1-bit de 5×8 píxeis sobre páginas PNG densas de 1568×728 — um bit por píxel, sem anti-aliasing, pelo que o modelo cobra a página pelas suas dimensões, não pela quantidade de caracteres que contém. **Como funciona** acima tem o pipeline; o documento de benchmarks tem a geometria e o porquê de mais denso nem sempre ser mais barato.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Agradecimentos

O OmniGlyph assenta sobre os ombros de um projeto em particular — esta secção é o nosso agradecimento permanente.

| Projeto | Como moldou o OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **A descoberta sobre a qual todo este projeto foi construído.** O pxpipe provou, com recibos, que o canal de visão de um LLM de produção consegue transportar contexto textual denso por uma fração do custo em tokens — e que a conversão tem de ser decidida por pedido através de matemática de faturação exata, nunca por intuição. A renderização densa de 1 bit, o gate de rentabilidade, o contrafactual de `count_tokens`, a allowlist fail-closed de modelos e a cultura de documentação "meça antes de afirmar" foram todos pioneiros ali. O OmniGlyph descende diretamente dessa base de código (MIT — a linha de copyright original permanece na nossa [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | A família de fontes bitmap 5×8 da qual deriva o nosso atlas de glifos denso de 1 bit (licença em `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Cobertura para os glifos fora do alcance do Spleen, no mesmo atlas (licença em `assets/`). |

Se acha o OmniGlyph útil, vá dar uma estrela ao projeto original também — a descoberta foi deles. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licença

MIT — ver [LICENSE](../../../LICENSE).
