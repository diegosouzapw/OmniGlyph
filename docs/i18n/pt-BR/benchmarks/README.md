# Benchmarks

🌐 Traduzido: [todos os idiomas](../../README.md)

Todo número que o OmniGlyph afirma vem de um dos dois harnesses abaixo —
re-executáveis, determinísticos onde possível, com comprovantes brutos por
resposta em `*/results/*.jsonl`. Análise consolidada: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Como a economia funciona (em uma imagem)

Provedores cobram **texto por token**, mas cobram uma **imagem pelas suas
dimensões** — não por quanto texto está compactado dentro dela. Uma página
padrão tem um custo fixo, não importa quão denso seja o texto:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

O mesmo contexto, cobrado de duas formas:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Por que a imagem vence — caracteres carregados por token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

O OmniGlyph só faz essa troca quando a matemática exata diz que ela vence, e
apenas para modelos comprovadamente capazes de ler a página. Os dois
harnesses abaixo comprovam cada metade.

## 1. `billing-sweep/` — quanto uma imagem realmente custa?

Sondas gratuitas de `count_tokens` contra a API ao vivo da Anthropic,
comparando a fórmula aposentada `w·h/750` vs. o modelo atual de patch de 28px
em 11 geometrias de sonda em 2 modelos × 2 tiers de resolução.

**Resultado (2026-07-05): o modelo de patch se encaixa com resíduo ZERO em
toda sonda** — cobrado = `⌈w/28⌉ × ⌈h/28⌉` após redimensionamento por tier,
mais um fixo de +3/+4 tokens por bloco de imagem. A página de produção
(1568×728) custa exatamente 1.460 tokens e carrega 28.080 caracteres ≈
**19,2 caracteres/token** vs. ~2 caracteres/token como texto denso.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — o modelo consegue de fato LER isso?

Custo (offline, exato) × precisão de leitura (ao vivo) entre configs de
render, geometrias de página, atlas de glifos e provedores. O corpus planta
needles de string exata (ids hex, camelCase, sequências de dígitos) mais
**distratores near-miss construídos a partir dos pares de confusibilidade de
glifos medidos** — assim a confabulação silenciosa é detectada, não apenas
contada como erro. A pontuação é determinística (sem LLM-juiz):
`correct` / `abstained` (`ILEGIVEL` honesto) / `silent_wrong` / `no_answer`.

**Resultados principais** (n=30 por braço):

| braço | leituras exatas | notas |
|---|---:|---|
| Fable 5 · página padrão · atlas 1-bit (produção) | **30/30** | zero erros, zero confabulação |
| Fable 5 · página padrão · atlas AA (padrão antigo) | 25/30 | 5 abstenções honestas — por que a produção mudou para 1-bit |
| Fable 5 · página alta resolução 1928² | 1–2/30 | cobrada 3,3× mais, mas com resample no encoder — a armadilha de cobrança, não habilitada |
| Opus 4.8 · glifos 10×16 | 23–26/30 | o modo seguro opcional |
| GPT-5.5 · faixa de 768px (ambos os atlas) | 0/60 | + inflação de ~40× nos tokens de output vs. seu próprio controle de texto (30/30, 62 tok) |
| Gemini 2.5-flash (parcial, quota) | 0/26 | confabula em vez de se abster |

Precisão de leitura em uma olhada — isto **é** o fail-closed model gate, desenhado:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Só o braço ✅ vai para produção. Qualquer coisa que leia mal é bloqueada *com
um comprovante*, e a pontuação de três vias significa que um modelo que
chuta errado (`silent_wrong`) é tratado como pior do que um que se abstém
honestamente (`ILEGIVEL`).

Três transportes: API direta (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), e `--via-cli` (uma assinatura do Claude
Code — $0). Ressalva aprendida do jeito difícil: intermediários (OpenRouter,
a ferramenta Read do CLI) redimensionam imagens grandes; apenas resultados de
API direta são autoritativos para legibilidade.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Testes unitários fixando as partes puras (corpus, pontuação, fórmulas de
custo): `tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
