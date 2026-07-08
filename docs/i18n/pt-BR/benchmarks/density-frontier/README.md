# density-frontier — custo × precisão por resolução

🌐 Traduzido: [todos os idiomas](../../../README.md)

Harness que mede a **fronteira de Pareto entre custo e legibilidade** dos
renders texto→imagem, por provedor (Anthropic / OpenAI / Gemini), geometria
de página, célula de glifo e estilo de atlas.

Páginas mais baratas (mais densas) carregam mais caracteres por token, mas em
algum ponto deixam de ser legíveis. Uma config só pode ir para produção onde
**ambas** as condições se sustentam — o custo é baixo *e* o modelo ainda a lê
perfeitamente:

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

Cada resposta é pontuada em exatamente um de três resultados — o do meio é o
que torna o gate confiável:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Uma config que produz até mesmo um único 🔴 é desqualificada, não importa
quão barata seja.

A assimetria central: desde o sweep de cobrança (2026-07-05,
`benchmarks/billing-sweep/`), **o custo é exatamente previsível offline** —
patches de 28 px + 4/bloco na Anthropic (`src/core/anthropic-vision.ts`),
perfis de patch/tile na OpenAI (`src/core/openai.ts`),
tiles/media_resolution no Gemini (`gemini-cost.ts`). Só a **precisão de
leitura** precisa da API.

## Design

- **Corpus** (`corpus.ts`): preenchimento denso estilo log/JSON + needles
  plantados das classes que a matriz de confusibilidade diz que falham (hex
  de 12 caracteres, camelCase, dígitos 6/8/5/3) + **distratores near-miss**
  construídos a partir dos pares confusíveis medidos. Se o modelo responde
  com o distrator, a confusão foi *prevista* — esse é o modo de falha
  silenciosa que está sendo detectado, não apenas contado como erro.
  Determinístico (mulberry32).
- **Configs** (`configs.ts`): grade curada — páginas padrão 1568×728 vs.
  alta resolução 1928×1928 (o A/B que decide a geometria por tier), AA vs.
  1-bit (resolve a contradição do render denso), célula 7×10/10×16 (modo
  seguro do Opus), faixa GPT, e as duas apostas do Gemini (≤384² = 258
  fixo; `media_resolution: low` = 280 fixo → ~116 caracteres/token *se*
  legível).
- **Score** (`score.ts`): correspondência exata determinística, sem
  LLM-juiz. Três resultados: `correct` / `abstained` (sentinela ILEGIVEL —
  falha honesta) / `silent_wrong` (o modo perigoso), com uma flag de
  distrator.

## Executando

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Configs específicas: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
As respostas caem em `results/*.jsonl` (uma linha por pergunta, com a
resposta bruta para auditoria).

## Barra de aceitação (herdada dos PRs upstream #35/#36)

Uma config só vira padrão de produção se: **gist == baseline de texto** E
**zero strings exatas erradas silenciosamente** E **economia positiva**. A
primeira execução obrigatória é `anthropic-std-5x8-aa` vs.
`anthropic-hires-5x8-aa` no Fable — a checagem pontual de legibilidade da
página grande antes de habilitar o tier de alta resolução.

## `--via-omniroute` — e2e através do OmniRoute (P3: prova de não degradação)

Os transportes acima renderizam texto→PNG **no próprio harness** e enviam as
imagens. `--via-omniroute` faz o oposto, que é o caminho de produção: envia
o **texto denso** para uma instância do OmniRoute em execução, deixa o
**motor `omniglyph` renderizar** as páginas e encaminhá-las para a
Anthropic, e mede as leituras + a economia. Se as leituras se mantiverem
iguais à rota direta **e** o OmniRoute reportar compressão, fica provado que
o render+encaminhamento do OmniRoute **não degrada** as páginas.

Pré-requisitos (operacionais):

1. **OmniRoute em execução** (`npm run dev`, padrão `http://localhost:20128`).
2. Um **provedor Anthropic** configurado no OmniRoute com uma **chave real**
   (rota direta — o gate `providerTransport==='direct'` só passa para o
   provedor `anthropic`).
3. O **motor `omniglyph` HABILITADO** na config de compressão do OmniRoute
   (`config.engines.omniglyph.enabled = true`) — o header `engine:omniglyph`
   só dispara com o motor ligado. (O motor é `stable:false`/preview; habilite
   explicitamente.)
4. Uma **chave de API do OmniRoute** em `OMNIROUTE_API_KEY` (a que o cliente
   usa para se autenticar contra o OmniRoute, não a da Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Cada resposta registra `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(do header de resposta `X-OmniRoute-Compression`) no JSONL; a linha da
tabela mostra quantas respostas voltaram comprimidas + a economia mediana.
**Barra P3**: os mesmos acertos verbatim/gist da rota direta (não
degradação) **com** `omnirouteSavings` não nulo (provando que um render
aconteceu, não uma leitura de texto bruto). Se aparecer `did NOT compress`,
o motor não está habilitado no OmniRoute (ou o corpo não passou pelos gates
fail-closed).

Testes para as partes puras: `tests/density-frontier.test.ts` (inclui
`buildOmnirouteRequest` e `parseCompressionSavings` do transporte
via-omniroute).
