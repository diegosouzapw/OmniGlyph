import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { DashboardState } from '../src/dashboard.js';
import type { SessionsPaths } from '../src/sessions.js';
import type { TrackEvent } from '../src/core/tracker.js';

/**
 * After a restart, replay() rebuilds the recent table from the JSONL. It must
 * restore the Saved delta AND the Details breakdown for compressed rows — the
 * PNG thumbnails are gone (in-memory ring) but everything else reconstructs.
 * Regression guard for "old rows lose save + details after restart".
 */
function makeTmp(): SessionsPaths {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-restart-'));
  return { eventsFile: path.join(dir, 'events.jsonl'), sidecarDir: path.join(dir, '4xx') };
}
function writeEvents(paths: SessionsPaths, events: unknown[]): void {
  fs.mkdirSync(path.dirname(paths.eventsFile), { recursive: true });
  fs.writeFileSync(paths.eventsFile, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
}
function ev(p: Record<string, unknown>): TrackEvent {
  return {
    ts: '2026-06-19T00:00:00Z',
    method: 'POST',
    path: '/v1/messages',
    status: 200,
    duration_ms: 100,
    ...p,
  } as unknown as TrackEvent;
}

let tmp: SessionsPaths;
afterEach(() => {
  try {
    fs.rmSync(path.dirname(tmp.eventsFile), { recursive: true, force: true });
  } catch {
    /* leak the tmpdir; OS reaps */
  }
});

describe('restart restore (replay)', () => {
  it('restores Saved delta + Details breakdown for a compressed row', async () => {
    tmp = makeTmp();
    writeEvents(tmp, [
      ev({
        compressed: true,
        input_tokens: 100,
        cache_read_tokens: 5000,
        output_tokens: 139,
        baseline_tokens: 6000,
        baseline_cacheable_tokens: 5000,
        baseline_probe_status: 'ok',
        image_count: 2,
        bucket_chars: { static_slab: 9000 },
      }),
    ]);
    const dash = new DashboardState(tmp, async () => new Map());
    await dash.replay(tmp.eventsFile); // simulate restart

    const recent = (await dash.serveRecent().json()) as { recent: Array<Record<string, unknown>> };
    const row = recent.recent[0]!;
    expect(typeof row.session_saved_so_far_delta).toBe('number'); // Saved column populated
    expect(typeof row.img_id).toBe('number'); // Details link present

    const url = new URL(`http://x/fragments/context-map?req=${row.img_id}`);
    const html = await (await dash.serveFragment('context-map', url, 1234)).text();
    expect(html).toContain('ctx-headline'); // breakdown rendered…
    expect(html).not.toContain("isn't kept anymore"); // …not the evicted-fallback note
    expect(html).toContain('thumbnails expired'); // honest about the gone PNGs
  });

  it('gives uncompressed rows no Details link', async () => {
    tmp = makeTmp();
    writeEvents(tmp, [ev({ compressed: false, input_tokens: 50, output_tokens: 20 })]);
    const dash = new DashboardState(tmp, async () => new Map());
    await dash.replay(tmp.eventsFile);
    const recent = (await dash.serveRecent().json()) as { recent: Array<Record<string, unknown>> };
    expect(recent.recent[0]!.img_id).toBeUndefined();
  });

  it('credits zero saved on an uncompressed row even when a probe baseline landed', async () => {
    // Provider-prefixed routes (e.g. /anthropic/messages) now run the
    // count_tokens probe, so a passthrough row can carry baseline_tokens.
    // The unproxied counterfactual for an untouched body IS what it paid —
    // crediting the cache-modeled baseline here would fabricate savings.
    tmp = makeTmp();
    writeEvents(tmp, [
      ev({
        compressed: false,
        input_tokens: 100,
        cache_read_tokens: 5000,
        output_tokens: 139,
        baseline_tokens: 6000,
        baseline_cacheable_tokens: 5000,
        baseline_probe_status: 'ok',
      }),
    ]);
    const dash = new DashboardState(tmp, async () => new Map());
    await dash.replay(tmp.eventsFile);

    const recent = (await dash.serveRecent().json()) as { recent: Array<Record<string, unknown>> };
    const row = recent.recent[0]!;
    // No baseline column, no Saved delta — OmniGlyph didn't move this bill.
    expect(row.baseline_input).toBeUndefined();
    expect(row.session_saved_so_far_delta).toBeUndefined();
  });
});
