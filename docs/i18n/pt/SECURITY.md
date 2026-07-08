# Política de Segurança

## Reportar vulnerabilidades

Abra um aviso de segurança privado no GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) ou
contacte diretamente o mantenedor (diegosouza.pw@outlook.com). Não abra
uma issue pública para uma vulnerabilidade explorável.

## Modelo de ameaça (o que o OmniGlyph é)

O OmniGlyph é um **proxy local** entre o seu cliente (ex.: Claude Code) e as
APIs de LLM. Por design, vê todo o conteúdo da sua sessão e as suas
credenciais em trânsito. As decisões de segurança correspondentes:

- **Vincula-se ao loopback por omissão** (`127.0.0.1`): o dashboard não tem
  autenticação e serve o contexto de sessão capturado (texto de origem das
  imagens, telemetria). `HOST=0.0.0.0` é uma opção explícita e expõe tudo
  isso à rede — use-a apenas numa rede de confiança.
- **Credenciais**: o proxy reencaminha os cabeçalhos de autenticação do
  cliente para o upstream e não os persiste. As chaves fornecidas via
  ambiente (`ANTHROPIC_API_KEY`, etc.) ficam apenas em memória.
- **Telemetria local**: `~/.omniglyph/events.jsonl` guarda metadados por
  pedido (contagens de tokens, hashes de corpo) e, em erros 4xx, amostras
  de corpo comprimidas — trate o ficheiro como sensível.
- **O conteúdo imageificado tem perdas**: valores exatos ao byte (segredos,
  hashes) nunca devem depender de leituras de imagem; o pipeline mantém-nos
  como texto, mas a regra de ouro é: não coloque segredos no contexto do
  LLM.
- **Cadeia de fornecimento**: `pnpm-workspace.yaml` impõe um
  `minimumReleaseAge` de 3 dias para qualquer pacote novo; o núcleo tem uma
  única dependência de runtime.

## Versões suportadas

Apenas a linha de lançamento mais recente (`main` / `v1.x` mais recente)
recebe correções.
