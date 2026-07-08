/**
 * TDD spec for the density-frontier eval harness (eval/density-frontier/):
 * cost × read-accuracy across render configs, providers and resolutions.
 *
 * Cost is OFFLINE (billing is now exactly predictable per provider); only
 * accuracy needs API calls. The corpus plants exact-string needles from the
 * classes the confusability matrix says fail (hex, camelCase, digits), plus
 * near-miss distractors so silent confabulation is DETECTED, not just counted
 * as a wrong answer.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCorpus, CONFUSABLE_GLYPHS } from '../benchmarks/density-frontier/corpus.js';
import { geminiImageTokens, geminiMediaResolutionTokens } from '../benchmarks/density-frontier/gemini-cost.js';
import { CURATED_CONFIGS, configCost } from '../benchmarks/density-frontier/configs.js';
import { scoreAnswer } from '../benchmarks/density-frontier/score.js';
import { askViaOmniroute, buildOmnirouteRequest, parseCompressionSavings } from '../benchmarks/density-frontier/omniroute.js';

describe('buildCorpus', () => {
  it('is deterministic for the same seed and differs across seeds', () => {
    const a = buildCorpus({ seed: 42, sections: 6 });
    const b = buildCorpus({ seed: 42, sections: 6 });
    const c = buildCorpus({ seed: 43, sections: 6 });
    expect(a.pageText).toBe(b.pageText);
    expect(a.pageText).not.toBe(c.pageText);
  });

  it('plants every gold needle verbatim in the page text', () => {
    const corpus = buildCorpus({ seed: 7, sections: 8 });
    const labels = Object.keys(corpus.gold);
    expect(labels.length).toBeGreaterThanOrEqual(8);
    for (const label of labels) {
      expect(corpus.pageText).toContain(corpus.gold[label]!);
    }
  });

  it('plants near-miss distractors that differ from gold by confusable glyphs only', () => {
    const corpus = buildCorpus({ seed: 7, sections: 8 });
    let checked = 0;
    for (const [label, variants] of Object.entries(corpus.distractors)) {
      const gold = corpus.gold[label]!;
      for (const v of variants) {
        expect(v).not.toBe(gold);
        expect(v.length).toBe(gold.length);
        expect(corpus.pageText).toContain(v);
        // Every differing position must be a documented confusable swap.
        for (let i = 0; i < v.length; i++) {
          if (v[i] !== gold[i]) {
            expect(CONFUSABLE_GLYPHS[gold[i]!], `${label}: ${gold[i]}→${v[i]}`).toBe(v[i]);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('emits verbatim and gist questions wired to planted answers', () => {
    const corpus = buildCorpus({ seed: 7, sections: 8 });
    expect(corpus.verbatimQuestions.length).toBeGreaterThanOrEqual(8);
    expect(corpus.gistQuestions.length).toBeGreaterThanOrEqual(3);
    for (const q of corpus.verbatimQuestions) {
      expect(corpus.pageText).toContain(q.expected);
      expect(q.prompt.length).toBeGreaterThan(10);
    }
    for (const q of corpus.gistQuestions) {
      expect(corpus.pageText).toContain(q.expected);
    }
  });
});

describe('geminiImageTokens — documented tile math', () => {
  it('bills 258 flat when both dimensions ≤ 384', () => {
    expect(geminiImageTokens(384, 384)).toBe(258);
    expect(geminiImageTokens(300, 100)).toBe(258);
  });

  it('reproduces the official 960×540 → 6 tiles = 1548 example', () => {
    // crop unit = floor(min(960,540)/1.5) = 360 → ceil(960/360)×ceil(540/360) = 3×2
    expect(geminiImageTokens(960, 540)).toBe(1548);
  });

  it('a 768×768 square is NOT one tile: crop unit 512 → 4 crops = 1032', () => {
    // Consequence of the documented formula: the flat 258 only exists ≤384px.
    expect(geminiImageTokens(768, 768)).toBe(1032);
  });

  it('media_resolution (Gemini 3) is a fixed per-image cost regardless of size', () => {
    expect(geminiMediaResolutionTokens('low')).toBe(280);
    expect(geminiMediaResolutionTokens('medium')).toBe(560);
    expect(geminiMediaResolutionTokens('high')).toBe(1120);
  });
});

describe('CURATED_CONFIGS grid', () => {
  it('has unique ids and covers both Anthropic tiers plus at least one non-Anthropic provider', () => {
    const ids = CURATED_CONFIGS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CURATED_CONFIGS.some((c) => c.provider === 'anthropic' && c.page.maxHeightPx === 1928)).toBe(true);
    expect(CURATED_CONFIGS.some((c) => c.provider === 'anthropic' && c.page.maxHeightPx === 728)).toBe(true);
    expect(CURATED_CONFIGS.some((c) => c.provider !== 'anthropic')).toBe(true);
  });

  it('every config computes a positive offline cost and chars/token for a real corpus', async () => {
    const corpus = buildCorpus({ seed: 7, sections: 8 });
    for (const cfg of CURATED_CONFIGS) {
      const cost = await configCost(cfg, corpus.pageText);
      expect(cost.imageTokens, cfg.id).toBeGreaterThan(0);
      expect(cost.images, cfg.id).toBeGreaterThanOrEqual(1);
      expect(cost.charsPerToken, cfg.id).toBeGreaterThan(0);
      // No config may render pages wider/taller than its declared page box.
      for (const d of cost.dims) {
        expect(d.width, cfg.id).toBeLessThanOrEqual(2 * 4 + cfg.page.cols * (5 + (cfg.style.cellWBonus ?? 0)));
        expect(d.height, cfg.id).toBeLessThanOrEqual(cfg.page.maxHeightPx);
      }
    }
  });
});

describe('scoreAnswer', () => {
  const q = { kind: 'verbatim' as const, label: 'F', prompt: 'qual o id?', expected: 'a3f8c2d19b4e', distractors: ['a3f8c2d1984e'] };

  it('classifies exact match as correct (tolerating whitespace/quote wrapping)', () => {
    expect(scoreAnswer(q, 'a3f8c2d19b4e').outcome).toBe('correct');
    expect(scoreAnswer(q, ' "a3f8c2d19b4e" ').outcome).toBe('correct');
  });

  it('classifies the declared-illegible sentinel as abstained', () => {
    expect(scoreAnswer(q, 'ILEGIVEL').outcome).toBe('abstained');
    expect(scoreAnswer(q, 'não consigo ler com segurança: ILEGIVEL').outcome).toBe('abstained');
  });

  it('classifies wrong values as silent_wrong and flags distractor matches as predicted confusion', () => {
    const wrong = scoreAnswer(q, 'deadbeef0000');
    expect(wrong.outcome).toBe('silent_wrong');
    expect(wrong.matchedDistractor).toBe(false);
    const confused = scoreAnswer(q, 'a3f8c2d1984e');
    expect(confused.outcome).toBe('silent_wrong');
    expect(confused.matchedDistractor).toBe(true);
  });

  it('classifies transport failures ([EMPTY:...]/[API_ERROR]) as no_answer, not silent_wrong', () => {
    expect(scoreAnswer(q, '[EMPTY:content_filter]').outcome).toBe('no_answer');
    expect(scoreAnswer(q, '[API_ERROR] credit balance too low').outcome).toBe('no_answer');
  });

  it('flags any same-length wrong answer whose diffs are all confusable swaps as predictedConfusion', () => {
    // 0→8 at position 6 (a pair measured in the sweep), without being the planted distractor.
    const s = scoreAnswer({ expected: '2d909e99f1b3', distractors: [] }, '2d989e99f1b3');
    expect(s.outcome).toBe('silent_wrong');
    expect(s.predictedConfusion).toBe(true);
    // A non-confusable swap (0→x) is not predicted.
    const t = scoreAnswer({ expected: '2d909e99f1b3', distractors: [] }, '2d9x9e99f1b3');
    expect(t.predictedConfusion).toBe(false);
  });
});

describe('via-omniroute transport (P3 e2e)', () => {
  const anthropicCfg = CURATED_CONFIGS.find((c) => c.provider === 'anthropic')!;
  const q = { kind: 'verbatim' as const, label: 'REGISTRO-A', prompt: 'qual o id?', expected: 'abc123' };

  it('builds the Anthropic-format request for /v1/messages with the engine:omniglyph header', () => {
    const req = buildOmnirouteRequest('http://localhost:20128/', 'sk-omni-test', anthropicCfg, 'CONTEXTO DENSO', q);
    expect(req.url).toBe('http://localhost:20128/v1/messages'); // trailing slash normalized
    expect(req.headers['x-omniroute-compression']).toBe('engine:omniglyph');
    expect(req.headers['x-api-key']).toBe('sk-omni-test');
    expect(req.headers['anthropic-version']).toBe('2023-06-01');
    expect(req.body.model).toBe(anthropicCfg.model);
    // Sends TEXT (not PNGs): OmniRoute does the rendering. Page + question.
    expect(req.body.messages[0]!.content[0]).toEqual({ type: 'text', text: 'CONTEXTO DENSO' });
    expect(req.body.messages[0]!.content[1]).toEqual({ type: 'text', text: q.prompt });
  });

  it('extracts savings from tokens=<orig>-><comp> in the X-OmniRoute-Compression header', () => {
    const s = parseCompressionSavings('stacked; source=request-header tokens=11912->2709; rules: omniglyph:context-as-imagex1');
    expect(s).toEqual({ originalTokens: 11912, compressedTokens: 2709, savingsPercent: 77.3 });
  });

  it('returns null when the header is absent or has no compression (engine did not fire)', () => {
    expect(parseCompressionSavings(null)).toBeNull();
    expect(parseCompressionSavings('off; source=off')).toBeNull(); // no tokens=... → did not compress
    expect(parseCompressionSavings('tokens=0->0')).toBeNull(); // orig 0 → does not count
  });
});

// Proves the ENTIRE transport flow against a SIMULATED OmniRoute (mocked fetch):
// correct request → Anthropic-format response → extracted answer + savings from the header.
// The LIVE run (real OmniRoute + key) is left for the end; here we guarantee via TDD
// that the mechanics work without depending on infra.
describe('askViaOmniroute — simulated e2e flow (mocked fetch)', () => {
  const cfg = CURATED_CONFIGS.find((c) => c.provider === 'anthropic')!;
  const q = { kind: 'verbatim' as const, label: 'REGISTRO-A', prompt: 'qual o id?', expected: 'abc123' };

  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(opts: { header?: string | null; body: unknown }) {
    const fetchMock = vi.fn(async () => ({
      headers: { get: (k: string) => (k.toLowerCase() === 'x-omniroute-compression' ? (opts.header ?? null) : null) },
      json: async () => opts.body,
    }));
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('happy path: extracts the response text and the savings from the header', async () => {
    const fetchMock = stubFetch({
      header: 'stacked; source=request-header tokens=11912->2709; rules: omniglyph:context-as-imagex1',
      body: { content: [{ type: 'text', text: 'abc123' }], stop_reason: 'end_turn' },
    });
    const r = await askViaOmniroute('http://localhost:20128', 'sk-omni', cfg, 'CONTEXTO DENSO', q);
    expect(r.text).toBe('abc123');
    expect(r.savings).toEqual({ originalTokens: 11912, compressedTokens: 2709, savingsPercent: 77.3 });
    // Confirm it hit the right endpoint with the engine-selection header.
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:20128/v1/messages');
    expect((init.headers as Record<string, string>)['x-omniroute-compression']).toBe('engine:omniglyph');
  });

  it('no compression header → savings null (engine did not fire; 30/30 would be raw text)', async () => {
    stubFetch({ header: null, body: { content: [{ type: 'text', text: 'abc123' }], stop_reason: 'end_turn' } });
    const r = await askViaOmniroute('http://localhost:20128', 'sk-omni', cfg, 'ctx', q);
    expect(r.text).toBe('abc123');
    expect(r.savings).toBeNull();
  });

  it('error response → [API_ERROR], preserving savings if present', async () => {
    stubFetch({ header: 'tokens=100->40', body: { error: { message: 'credit balance too low' } } });
    const r = await askViaOmniroute('http://localhost:20128', 'sk-omni', cfg, 'ctx', q);
    expect(r.text).toBe('[API_ERROR] credit balance too low');
    expect(r.savings?.savingsPercent).toBe(60);
  });

  it('empty content (refusal/max_tokens) → [EMPTY:<stop_reason>]', async () => {
    stubFetch({ header: 'tokens=100->40', body: { content: [], stop_reason: 'refusal' } });
    const r = await askViaOmniroute('http://localhost:20128', 'sk-omni', cfg, 'ctx', q);
    expect(r.text).toBe('[EMPTY:refusal]');
  });
});
