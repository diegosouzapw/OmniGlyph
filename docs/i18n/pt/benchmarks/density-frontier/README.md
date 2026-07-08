# density-frontier — custo × precisão por resolução

🌐 Traduzido: [todos os idiomas](../../../README.md)

Conjunto que mede a **fronteira de Pareto entre custo e legibilidade** dos
renders texto→imagem, por fornecedor (Anthropic / OpenAI / Gemini),
geometria de página, célula de glifo e estilo de atlas.

Páginas mais baratas (mais densas) transportam mais caracteres por token mas,
a certa altura, deixam de ser legíveis. Uma configuração só pode ir para
produção onde **ambas** as condições se verificam — o custo é baixo *e* o
modelo continua a lê-la na perfeição:

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
que torna o gate digno de confiança:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Uma configuração que produza mesmo que seja um único 🔴 é desqualificada, por
mais barata que seja.

A assimetria central: desde o sweep de faturação (2026-07-05,
`benchmarks/billing-sweep/`), **o custo é exatamente previsível offline** —
patches de 28 px + 4/bloco na Anthropic (`src/core/anthropic-vision.ts`),
perfis de patch/tile na OpenAI (`src/core/openai.ts`), tiles/media_resolution
no Gemini (`gemini-cost.ts`). Só a **precisão de leitura** precisa da API.

## Design

- **Corpus** (`corpus.ts`): preenchimento denso em estilo log/JSON + agulhas
  plantadas das classes que a matriz de confundibilidade indica que falham
  (hex de 12 caracteres, camelCase, dígitos 6/8/5/3) + **distratores
  quase-idênticos construídos a partir dos pares confundíveis medidos**. Se o
  modelo responder com o distrator, a confusão foi *prevista* — é esse o modo
  de falha silenciosa a detetar, não apenas a contar como erro.
  Determinístico (mulberry32).
- **Configurações** (`configs.ts`): grelha curada — páginas standard
  1568×728 vs alta resolução 1928×1928 (o A/B que decide a geometria por
  nível), AA vs 1-bit (resolve a contradição do render denso), célula 7×10/
  10×16 (modo seguro do Opus), faixa GPT, e as duas apostas do Gemini
  (≤384² = 258 fixo; `media_resolution: low` = 280 fixo → ~116
  caracteres/token *se* legível).
- **Pontuação** (`score.ts`): correspondência exata determinística, sem
  juiz LLM. Três resultados: `correct` / `abstained` (sentinela ILEGIVEL —
  falha honesta) / `silent_wrong` (o modo perigoso), com uma flag de
  distrator.

## Executar

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Configurações específicas: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
As respostas ficam em `results/*.jsonl` (uma linha por pergunta, com a
resposta bruta para auditoria).

## Barra de aceitação (herdada das PRs #35/#36 do upstream)

Uma configuração só se torna padrão de produção se: **gist == linha de base
de texto** E **zero strings exatas erradas silenciosamente** E **poupança
positiva**. A primeira execução obrigatória é `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` na Fable — a verificação pontual de legibilidade da
página grande antes de ativar o nível de alta resolução.

## `--via-omniroute` — de ponta a ponta através do OmniRoute (P3: prova de não degradação)

Os transportes acima renderizam texto→PNG **no próprio conjunto** e enviam
as imagens. O `--via-omniroute` faz o oposto, que é o caminho de produção:
envia o **texto denso** para uma instância do OmniRoute em execução, deixa o
**motor `omniglyph` renderizar** as páginas e reencaminhá-las para a
Anthropic, e mede as leituras + a poupança. Se as leituras se mantiverem
iguais à rota direta **e** o OmniRoute reportar compressão, fica provado que
o render+reencaminhamento do OmniRoute **não degrada** as páginas.

Pré-requisitos (operacionais):

1. **OmniRoute em execução** (`npm run dev`, por omissão
   `http://localhost:20128`).
2. Um **fornecedor Anthropic** configurado no OmniRoute com uma **chave
   real** (rota direta — o gate `providerTransport==='direct'` só passa
   para o fornecedor `anthropic`).
3. O **motor `omniglyph` ATIVADO** na configuração de compressão do
   OmniRoute (`config.engines.omniglyph.enabled = true`) — o cabeçalho
   `engine:omniglyph` só dispara com o motor ligado. (O motor é
   `stable:false`/pré-visualização; ative-o explicitamente.)
4. Uma **chave de API do OmniRoute** em `OMNIROUTE_API_KEY` (a que o cliente
   usa para se autenticar contra o OmniRoute, não a da Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Cada resposta regista `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(a partir do cabeçalho de resposta `X-OmniRoute-Compression`) no JSONL; a
linha da tabela mostra quantas respostas voltaram comprimidas + a poupança
mediana. **Barra P3**: os mesmos acertos de verbatim/gist que a rota direta
(não degradação) **com** `omnirouteSavings` não nulo (provando que aconteceu
um render, não uma leitura de texto bruto). Se aparecer `did NOT compress`,
o motor não está ativado no OmniRoute (ou o corpo não passou pelos gates
fail-closed).

Testes para as partes puras: `tests/density-frontier.test.ts` (inclui
`buildOmnirouteRequest` e `parseCompressionSavings` do transporte
via-omniroute).
