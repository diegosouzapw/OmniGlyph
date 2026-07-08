/**
 * Live pipeline flow view — a node-graph (React-Flow-style, but dependency-free
 * SVG) showing how requests move through the proxy: client → gate → imaged /
 * passthrough → upstream → response. Honesty rules follow the hero: the
 * headline ratio uses the cache-weighted pair (baseline_input_weighted vs
 * actual_input_weighted), never raw count_tokens, and losses show as losses.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { renderFlowFragment, renderPage } from '../src/dashboard/fragments.js';
import { DashboardState } from '../src/dashboard.js';
import type { SessionsPaths } from '../src/sessions.js';
import type { StatsPayload } from '../src/dashboard/types.js';

function payload(p: Partial<StatsPayload>): StatsPayload {
  return {
    requests: 15,
    compressed_requests: 12,
    passthrough: 3,
    baseline_input_weighted: 7000,
    actual_input_weighted: 1800,
    saved_input_tokens: 5200,
    saved_usd: 1.23,
    output_weighted: 695,
    measured_text_chars: 90_000,
    measured_thinking_chars: 5_000,
    measured_tool_use_chars: 5_000,
    compression_enabled: true,
    pricing_assumptions: { output_multiplier: 5 },
    ...p,
  } as StatsPayload;
}

describe('renderFlowFragment', () => {
  it('renders the full pipeline as an SVG node graph', () => {
    const html = renderFlowFragment(payload({}));
    expect(html).toContain('flow-view');
    expect(html).toContain('<svg');
    for (const label of ['Claude Code', 'Gate', 'Renderer', 'Passthrough', 'Anthropic API', 'Response']) {
      expect(html).toContain(label);
    }
  });

  it('labels the branches with the imaged vs passthrough request counts', () => {
    const html = renderFlowFragment(payload({ compressed_requests: 12, passthrough: 3 }));
    expect(html).toContain('12 imaged');
    expect(html).toContain('3 passthrough');
  });

  it('headline savings use the cache-weighted pair (74% on 7000→1800) and show $ saved', () => {
    const html = renderFlowFragment(
      payload({ baseline_input_weighted: 7000, actual_input_weighted: 1800, saved_usd: 1.23 }),
    );
    expect(html).toContain('74%');
    expect(html).toContain('$1.23');
    expect(html).toContain('flow-pos');
    expect(html).not.toContain('flow-neg');
  });

  it('a weighted net loss shows as a loss, never a win', () => {
    // Raw text would look like a win; the cache-weighted pair says imaging cost more.
    const html = renderFlowFragment(
      payload({ baseline_input_weighted: 1546, actual_input_weighted: 1863 }),
    );
    expect(html).toContain('flow-neg');
    expect(html).not.toContain('flow-pos');
    expect(html).toContain('more');
  });

  it('gate badge follows the kill switch', () => {
    expect(renderFlowFragment(payload({ compression_enabled: true }))).toContain('ON');
    const off = renderFlowFragment(payload({ compression_enabled: false }));
    expect(off).toContain('OFF');
    expect(off).toContain('flow-off');
  });

  it('zero traffic renders a waiting state with no NaN anywhere', () => {
    const html = renderFlowFragment(
      payload({
        requests: 0,
        compressed_requests: 0,
        passthrough: 0,
        baseline_input_weighted: 0,
        actual_input_weighted: 0,
        saved_input_tokens: 0,
        saved_usd: 0,
        measured_text_chars: 0,
        measured_thinking_chars: 0,
        measured_tool_use_chars: 0,
      }),
    );
    expect(html).toContain('Waiting');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
  });
});

describe('flow view wiring', () => {
  it('the page polls /fragments/flow', () => {
    expect(renderPage(47821, 'flow')).toContain('/fragments/flow');
  });

  let dash: DashboardState;
  beforeEach(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-flow-'));
    const paths: SessionsPaths = {
      eventsFile: path.join(dir, 'events.jsonl'),
      sidecarDir: path.join(dir, '4xx-bodies'),
    };
    dash = new DashboardState(paths, async () => new Map());
  });

  it('serveFragment("flow") returns the graph', async () => {
    const res = await dash.serveFragment('flow', new URL('http://x/fragments/flow'), 47821);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('flow-view');
  });
});
