#!/usr/bin/env tsx
/**
 * density-frontier runner — cost (offline, exact) × read accuracy (API)
 * per render configuration, provider, and resolution.
 *
 * Usage:
 *   pnpm exec tsx eval/density-frontier/run.ts --dry-run          # costs only, $0
 *   ANTHROPIC_API_KEY=... pnpm exec tsx eval/density-frontier/run.ts \
 *     --configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa --trials 2
 *   OPENAI_API_KEY / GEMINI_API_KEY enable the other providers.
 *
 * Each trial = 1 corpus (distinct seed) rendered under the config + every
 * verbatim/gist question in a single conversation per question. Output: JSONL
 * per answer in results/ + final cost × accuracy × silent-wrong table.
 * Acceptance bar (upstream PRs #35/#36): gist == text baseline AND zero
 * silent wrong exact strings AND positive savings.
 */
import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { bytesToBase64 } from '../../src/core/png.js';
import { buildCorpus, type Question } from './corpus.js';
import { CURATED_CONFIGS, configCost, type FrontierConfig } from './configs.js';
import { scoreAnswer } from './score.js';
import { askViaOmniroute, type CompressionSavings } from './omniroute.js';

const HERE = dirname(fileURLToPath(new URL(import.meta.url)));

const { values: args } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    configs: { type: 'string', default: '' },
    trials: { type: 'string', default: '1' },
    seed: { type: 'string', default: '20260705' },
    sections: { type: 'string', default: '9' },
    // Transport via the Claude Code CLI (subscription, not API): 1 `claude -p`
    // call PER CONFIG, batched questions, reading via the Read tool with Bash
    // forbidden (methodology of the upstream glyph-matrix sweep).
    'via-cli': { type: 'boolean', default: false },
    // Transport via a running OmniRoute: sends TEXT, the omniglyph engine renders
    // and forwards to Anthropic. Proves OmniRoute does not degrade the image (same
    // bar as the direct route) + savings from the response header. Requires
    // OMNIROUTE_API_KEY (and optional OMNIROUTE_URL, default http://localhost:20128).
    'via-omniroute': { type: 'boolean', default: false },
  },
});

function apiKeyFor(provider: FrontierConfig['provider']): string | undefined {
  if (provider === 'anthropic') return process.env.ANTHROPIC_API_KEY ?? process.env.OPENROUTER_API_KEY;
  if (provider === 'openai') return process.env.OPENAI_API_KEY;
  return process.env.GEMINI_API_KEY;
}

/** OpenRouter slugs for the grid's Anthropic models (fallback: anthropic/<model>).
 *  Alternative transport when only OPENROUTER_API_KEY is set — accuracy is of the
 *  SAME underlying model; cost is still computed offline. */
const OPENROUTER_SLUGS: Record<string, string> = {
  'claude-fable-5': 'anthropic/claude-fable-5',
  'claude-opus-4-8': 'anthropic/claude-opus-4.8',
  'claude-sonnet-4-5': 'anthropic/claude-sonnet-4.5',
};

async function askOpenRouter(cfg: FrontierConfig, pngs: Uint8Array[], q: Question): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_SLUGS[cfg.model] ?? `anthropic/${cfg.model}`,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          ...pngs.map((p) => ({ type: 'image_url', image_url: { url: `data:image/png;base64,${bytesToBase64(p)}` } })),
          { type: 'text', text: q.prompt },
        ],
      }],
    }),
  });
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    error?: { message: string };
  };
  if (json.error) return `[API_ERROR] ${json.error.message}`;
  const text = json.choices?.[0]?.message?.content ?? '';
  if (text.trim() === '') return `[EMPTY:${json.choices?.[0]?.finish_reason ?? 'unknown'}]`;
  return text;
}

async function askAnthropic(cfg: FrontierConfig, pngs: Uint8Array[], q: Question): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKeyFor('anthropic')!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          ...pngs.map((p) => ({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: bytesToBase64(p) } })),
          { type: 'text', text: q.prompt },
        ],
      }],
    }),
  });
  const json = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    stop_reason?: string;
    error?: { message: string };
  };
  if (json.error) return `[API_ERROR] ${json.error.message}`;
  const text = (json.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
  // An empty answer is a distinct failure mode (classifier refusal —
  // upstream #37 — or max_tokens exceeded): label it with the stop_reason so
  // scoring/auditing can distinguish it from a misread.
  if (text.trim() === '') return `[EMPTY:${json.stop_reason ?? 'unknown'}]`;
  return text;
}

/** Completion tokens of the LAST call (loop is sequential). Feeds the output
 *  inflation metric (H7): an image in context can make the answer more expensive. */
let lastOutputTokens: number | undefined;

/** Savings reported by OmniRoute on the LAST via-omniroute call (response
 *  header). null = engine did not fire → 30/30 would be a raw-text read, not proof. */
let lastOmnirouteSavings: CompressionSavings | null = null;

async function askOpenAI(cfg: FrontierConfig, pngs: Uint8Array[], q: Question, textContext?: string): Promise<string> {
  lastOutputTokens = undefined;
  const content = textContext !== undefined
    ? [
        { type: 'text', text: `Contexto da sessão (texto denso):\n\n${textContext}` },
        { type: 'text', text: q.prompt },
      ]
    : [
        ...pngs.map((p) => ({ type: 'image_url', image_url: { url: `data:image/png;base64,${bytesToBase64(p)}`, detail: 'original' } })),
        { type: 'text', text: q.prompt },
      ];
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKeyFor('openai')!}` },
    body: JSON.stringify({
      model: cfg.model,
      // High ceiling: on gpt-5.x, reasoning counts as completion — a low
      // ceiling returns an empty answer (same trap as max_tokens on Fable).
      max_completion_tokens: 4096,
      messages: [{ role: 'user', content }],
    }),
  });
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    usage?: { completion_tokens?: number };
    error?: { message: string };
  };
  if (json.error) return `[API_ERROR] ${json.error.message}`;
  lastOutputTokens = json.usage?.completion_tokens;
  const text = json.choices?.[0]?.message?.content ?? '';
  if (text.trim() === '') return `[EMPTY:${json.choices?.[0]?.finish_reason ?? 'unknown'}]`;
  return text;
}

async function askGemini(cfg: FrontierConfig, pngs: Uint8Array[], q: Question, textContext?: string, attempt = 1): Promise<string> {
  lastOutputTokens = undefined;
  const parts: unknown[] = textContext !== undefined
    ? [{ text: `Contexto da sessão (texto denso):\n\n${textContext}` }]
    : pngs.map((p) => ({ inlineData: { mimeType: 'image/png', data: bytesToBase64(p) } }));
  parts.push({ text: q.prompt });
  const generationConfig: Record<string, unknown> = { maxOutputTokens: 4096 };
  // The media_resolution override is GLOBAL on v1beta (Gemini 2.5 style);
  // per-part only exists on v1alpha/Gemini 3.
  if (cfg.geminiMediaResolution !== undefined && textContext === undefined) {
    generationConfig.mediaResolution = `MEDIA_RESOLUTION_${cfg.geminiMediaResolution.toUpperCase()}`;
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${apiKeyFor('gemini')!}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig }),
    },
  );
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    usageMetadata?: { candidatesTokenCount?: number };
    error?: { message: string; code?: number };
  };
  if (json.error) {
    // Free tier: per-minute 429 — back off and retry instead of losing the question.
    if (json.error.code === 429 && attempt <= 4) {
      await new Promise((r) => setTimeout(r, 20_000 * attempt));
      return askGemini(cfg, pngs, q, textContext, attempt + 1);
    }
    return `[API_ERROR] ${json.error.message}`;
  }
  lastOutputTokens = json.usageMetadata?.candidatesTokenCount;
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (text.trim() === '') return `[EMPTY:${json.candidates?.[0]?.finishReason ?? 'unknown'}]`;
  return text;
}

const ASK = { anthropic: askAnthropic, openai: askOpenAI, gemini: askGemini } as const;

/** Direct to the provider when the native key exists; Anthropic falls back to
 *  OpenRouter when only OPENROUTER_API_KEY is present. */
function askFor(cfg: FrontierConfig): (c: FrontierConfig, p: Uint8Array[], q: Question) => Promise<string> {
  if (cfg.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY && process.env.OPENROUTER_API_KEY) {
    return askOpenRouter;
  }
  return ASK[cfg.provider];
}

/** One `claude -p` call per config: writes the pages to disk, asks for all of
 *  them to be read via Read plus a single JSON {label: value}. Returns the
 *  label→answer map ('[EMPTY:cli_...]' on transport/parse failure). */
/** Splits the questions into chunks (smaller calls finish faster and a refusal
 *  only takes down its chunk) and retries each chunk once on transport failure. */
function askChunkedViaCli(
  cfg: FrontierConfig,
  pngs: Uint8Array[],
  labels: Array<{ label: string; ask: string }>,
  chunkSize: number = 10,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < labels.length; i += chunkSize) {
    const chunk = labels.slice(i, i + chunkSize);
    let result = askBatchViaCli(cfg, pngs, chunk);
    if (Object.values(result).every((v) => v.startsWith('[EMPTY:cli_'))) {
      result = askBatchViaCli(cfg, pngs, chunk); // single retry — refusal/hang is stochastic
    }
    Object.assign(out, result);
  }
  return out;
}

function askBatchViaCli(
  cfg: FrontierConfig,
  pngs: Uint8Array[],
  labels: Array<{ label: string; ask: string }>,
): Record<string, string> {
  const dir = mkdtempSync(join(tmpdir(), 'density-frontier-'));
  const paths = pngs.map((p, i) => {
    const f = join(dir, `page${i}.png`);
    writeFileSync(f, p);
    return f;
  });
  const prompt =
    'Leia com a ferramenta Read, NA ORDEM, estes arquivos de imagem (páginas de texto denso renderizado):\n' +
    paths.map((p) => `- ${p}`).join('\n') +
    '\n\nDepois de ler TODAS as páginas, responda SOMENTE com um objeto JSON válido (sem markdown, sem explicação) com exatamente estas chaves:\n' +
    labels.map((l) => `- "${l.label}": ${l.ask}`).join('\n') +
    '\n\nSe não conseguir ler algum valor com total segurança, use exatamente a string "ILEGIVEL" naquela chave. Não chute valores.';
  const res = spawnSync('claude', ['-p', prompt, '--model', cfg.model, '--allowedTools', 'Read', '--disallowedTools', 'Bash'], {
    encoding: 'utf8',
    timeout: 900_000,
    maxBuffer: 32 * 1024 * 1024,
    input: '', // closes stdin — without this the CLI waits for input and hangs (ETIMEDOUT)
  });
  if (res.error || res.status !== 0) {
    const why = res.error?.message
      ?? `exit ${res.status}: stderr=${(res.stderr ?? '').slice(0, 200)} stdout=${(res.stdout ?? '').slice(0, 300)}`;
    return Object.fromEntries(labels.map((l) => [l.label, `[EMPTY:cli_${why}]`]));
  }
  const out = res.stdout ?? '';
  const start = out.indexOf('{');
  const end = out.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return Object.fromEntries(labels.map((l) => [l.label, `[EMPTY:cli_no_json] ${out.slice(0, 120)}`]));
  }
  try {
    const parsed = JSON.parse(out.slice(start, end + 1)) as Record<string, unknown>;
    return Object.fromEntries(labels.map((l) => [l.label, String(parsed[l.label] ?? '[EMPTY:cli_missing_key]')]));
  } catch {
    return Object.fromEntries(labels.map((l) => [l.label, '[EMPTY:cli_bad_json]']));
  }
}

async function main(): Promise<void> {
  const wanted = args.configs ? new Set(args.configs.split(',').map((s) => s.trim())) : null;
  const configs = CURATED_CONFIGS.filter((c) => wanted === null || wanted.has(c.id));
  const trials = Math.max(1, parseInt(args.trials, 10));
  const baseSeed = parseInt(args.seed, 10);
  const sections = Math.max(3, parseInt(args.sections, 10));
  const dry = args['dry-run'];

  const outDir = join(HERE, 'results');
  const outFile = join(outDir, `frontier-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`);
  if (!dry) {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, '');
  }

  console.log('config'.padEnd(30) + 'imgs'.padStart(5) + 'imgTok'.padStart(8) + 'chars/tok'.padStart(10)
    + '  verbatim  gist  silent-wrong (dist.)');

  for (const cfg of configs) {
    const key = apiKeyFor(cfg.provider);
    // Cost is identical across trials (same geometry); measure it on the first corpus.
    const corpus0 = buildCorpus({ seed: baseSeed, sections });
    const cost = await configCost(cfg, corpus0.pageText);
    let line = cfg.id.padEnd(30) + String(cost.images).padStart(5) + String(cost.imageTokens).padStart(8)
      + cost.charsPerToken.toFixed(1).padStart(10);

    const viaCli = args['via-cli'] && cfg.provider === 'anthropic';
    const viaOmniroute = args['via-omniroute'] && cfg.provider === 'anthropic';
    const omnirouteUrl = process.env.OMNIROUTE_URL ?? 'http://localhost:20128';
    const omnirouteKey = process.env.OMNIROUTE_API_KEY;
    const canRun = viaCli || (viaOmniroute && !!omnirouteKey) || (!!key && !viaCli && !viaOmniroute);
    if (dry || !canRun) {
      const why = dry
        ? '  (dry-run)'
        : viaOmniroute
          ? '  (defina OMNIROUTE_API_KEY — pulado)'
          : '  (sem API key — pulado)';
      console.log(line + why);
      continue;
    }

    const tally = { correct: 0, abstained: 0, noAnswer: 0, silentWrong: 0, predicted: 0, gistCorrect: 0, gistTotal: 0, total: 0 };
    // via-omniroute: how many answers actually came back compressed (engine fired) and
    // the median savings% — the proof that a render+forward happened, not a raw-text read.
    let omnirouteCompressed = 0;
    const omnirouteSavingsPcts: number[] = [];
    for (let t = 0; t < trials; t++) {
      const corpus = t === 0 ? corpus0 : buildCorpus({ seed: baseSeed + t, sections });
      const { pngs } = t === 0 ? cost : await configCost(cfg, corpus.pageText);
      const allQuestions = [...corpus.verbatimQuestions, ...corpus.gistQuestions];
      const batch = viaCli
        ? askChunkedViaCli(cfg, pngs, allQuestions.map((q) => ({
            label: q.label,
            ask: q.kind === 'verbatim'
              ? `o valor EXATO do campo "id" na linha rotulada "${q.label}"`
              : q.prompt.replace(/ Responda somente.*$/, ''),
          })))
        : null;
      for (const q of allQuestions) {
        lastOmnirouteSavings = null;
        let answer: string;
        if (batch !== null) {
          answer = batch[q.label]!;
        } else if (viaOmniroute) {
          // Sends TEXT to OmniRoute; the omniglyph engine renders and forwards.
          const r = await askViaOmniroute(omnirouteUrl, omnirouteKey!, cfg, corpus.pageText, q);
          answer = r.text;
          lastOmnirouteSavings = r.savings;
        } else if (cfg.textControl) {
          answer = cfg.provider === 'gemini'
            ? await askGemini(cfg, [], q, corpus.pageText)
            : await askOpenAI(cfg, [], q, corpus.pageText);
        } else {
          answer = await askFor(cfg)(cfg, pngs, q);
        }
        if (lastOmnirouteSavings) {
          omnirouteCompressed++;
          omnirouteSavingsPcts.push(lastOmnirouteSavings.savingsPercent);
        }
        const score = scoreAnswer(q, answer);
        if (q.kind === 'gist') {
          tally.gistTotal++;
          if (score.outcome === 'correct') tally.gistCorrect++;
        } else {
          tally.total++;
          if (score.outcome === 'correct') tally.correct++;
          else if (score.outcome === 'abstained') tally.abstained++;
          else if (score.outcome === 'no_answer') tally.noAnswer++;
          else {
            tally.silentWrong++;
            if (score.matchedDistractor || score.predictedConfusion) tally.predicted++;
          }
        }
        appendFileSync(outFile, JSON.stringify({
          ts: new Date().toISOString(), config: cfg.id, model: cfg.model, trial: t,
          kind: q.kind, label: q.label, expected: q.expected, answer, ...score,
          images: cost.images, imageTokens: cost.imageTokens,
          outputTokens: lastOutputTokens,
          // via-omniroute: savings reported by OmniRoute (null = engine did not fire).
          omnirouteSavings: lastOmnirouteSavings,
        }) + '\n');
        if (batch === null) await new Promise((r) => setTimeout(r, 250));
      }
    }
    line += `  ${tally.correct}/${tally.total} (+${tally.abstained} abst., ${tally.noAnswer} filtr.)`.padEnd(28)
      + `${tally.gistCorrect}/${tally.gistTotal}`.padEnd(6)
      + `  ${tally.silentWrong} (${tally.predicted} previstas)`;
    if (viaOmniroute) {
      const med = omnirouteSavingsPcts.length
        ? [...omnirouteSavingsPcts].sort((a, b) => a - b)[Math.floor(omnirouteSavingsPcts.length / 2)]
        : null;
      line += omnirouteCompressed > 0
        ? `  [OmniRoute: comprimiu ${omnirouteCompressed}, savings mediano ${med}%]`
        : `  [OmniRoute: did NOT compress — is the omniglyph engine enabled in the config?]`;
    }
    console.log(line);
  }

  if (!dry) console.log(`\nrespostas em ${outFile}`);
  else console.log('\n(dry-run: exact offline costs; set the API keys and drop --dry-run to measure accuracy)');
}

await main();
