/**
 * `TransformOptions.compressSystem` — keep the session config as native text.
 *
 * System-prompt-shaped content rendered inside user-message images trips
 * Anthropic's reasoning_extraction refusal classifier (`stop_reason: refusal`
 * on cold-start hellos; measured upstream: 2.6% of reminder-imaged requests
 * vs 0% uncompressed). With `compressSystem: false` the static slab is NEVER
 * rendered: `req.system` passes through byte-identical, the first user
 * message keeps its layout, and only tool_results / collapsed history may
 * still image.
 *
 * Contract being verified:
 *   - compressSystem:false → system field byte-identical, zero slab images,
 *     reason 'system_kept_text'; nothing else imaged → NOT "compressed".
 *   - compressSystem:false + big tool_result → tool_result still images and
 *     the request counts as compressed, system still text.
 *   - Composition with the OAuth-identity port: the identity block stays the
 *     first system block verbatim in BOTH modes.
 *   - Default (option absent): slab imaging unchanged (regression guard).
 *   - Node host: config file {"keepSystemText": true} surfaces as
 *     OMNIGLYPH_KEEP_SYSTEM_TEXT=1 (env still wins over file config).
 */

import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { transformRequest } from '../src/core/transform.js';
import { parseCli } from '../src/node.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

const BIG_SYSTEM = 'Detailed operating instructions for this session. '.repeat(1600); // ~80k chars
const BIG_TOOL_RESULT = 'line of tool output with plenty of prose to page. '.repeat(1000); // ~51k chars

function parse(body: Uint8Array): any {
  return JSON.parse(dec.decode(body));
}

function hasImageBlock(content: unknown): boolean {
  return Array.isArray(content) && content.some((b: any) => b?.type === 'image');
}

describe('transformRequest — compressSystem: false keeps the system slab as text', () => {
  it('never images the system slab: system field byte-identical, first message untouched', async () => {
    const input = {
      model: 'claude-3-5-sonnet',
      system: BIG_SYSTEM,
      messages: [{ role: 'user', content: 'hello' }],
    };
    const { body, info } = await transformRequest(enc.encode(JSON.stringify(input)), {
      compressSystem: false,
    });

    const out = parse(body);
    expect(out.system).toBe(BIG_SYSTEM); // arrives as TEXT, byte-identical
    expect(out.messages[0].content).toBe('hello'); // no slab splice
    expect(info.imageCount).toBe(0);
    expect(info.reason).toBe('system_kept_text');
    // Nothing imaged → this is a passthrough, not a compression.
    expect(info.compressed).toBe(false);
  });

  it('still images a big tool_result while the system stays text', async () => {
    const input = {
      model: 'claude-3-5-sonnet',
      system: BIG_SYSTEM,
      messages: [
        { role: 'user', content: 'run the tool' },
        { role: 'assistant', content: [{ type: 'tool_use', id: 'tu_1', name: 'run', input: {} }] },
        {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'tu_1', content: BIG_TOOL_RESULT }],
        },
      ],
    };
    const { body, info } = await transformRequest(enc.encode(JSON.stringify(input)), {
      compressSystem: false,
    });

    const out = parse(body);
    expect(out.system).toBe(BIG_SYSTEM);
    const toolResult = out.messages[2].content[0];
    expect(toolResult.type).toBe('tool_result');
    expect(hasImageBlock(toolResult.content)).toBe(true); // tool_result compression still runs
    expect(info.imageCount).toBeGreaterThan(0);
    expect(info.compressed).toBe(true);
    expect(info.reason).toBe('system_kept_text');
  });

  it('leaves tools untouched even with compressTools on — stubbed docs would have nowhere to ride', async () => {
    // Tool docs compress by riding INSIDE the imaged slab. With the slab
    // pinned as text there is no image to carry them: stubbing tools[] would
    // silently destroy every description. compressSystem=false must therefore
    // disable tool-doc compression regardless of compressTools.
    const description = 'Read a file from disk and return its contents. '.repeat(200);
    const input = {
      model: 'claude-3-5-sonnet',
      system: BIG_SYSTEM,
      tools: [{
        name: 'read_file',
        description,
        input_schema: { type: 'object', properties: { path: { type: 'string' } } },
      }],
      messages: [{ role: 'user', content: 'hello' }],
    };
    const { body } = await transformRequest(enc.encode(JSON.stringify(input)), {
      compressSystem: false,
    });

    expect(parse(body).tools).toEqual(input.tools);
  });

  it('keeps the Claude Code OAuth identity as the untouched first system block', async () => {
    const identity = "You are Claude Code, Anthropic's official CLI for Claude.";
    const system = [
      { type: 'text', text: identity, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: BIG_SYSTEM, cache_control: { type: 'ephemeral' } },
    ];
    const input = {
      model: 'claude-3-5-sonnet',
      system,
      messages: [{ role: 'user', content: 'hello' }],
    };
    const { body } = await transformRequest(enc.encode(JSON.stringify(input)), {
      compressSystem: false,
    });

    // keepSystemText never rewrites req.system: identity block (and the rest)
    // pass through byte-identical — the OAuth lane survives in this mode too.
    expect(parse(body).system).toEqual(system);
  });

  it('default (option absent) still images the slab and rewrites the system field', async () => {
    const input = {
      model: 'claude-3-5-sonnet',
      system: BIG_SYSTEM,
      messages: [{ role: 'user', content: 'hello' }],
    };
    const { body, info } = await transformRequest(enc.encode(JSON.stringify(input)), {});

    const out = parse(body);
    expect(info.compressed).toBe(true);
    expect(info.imageCount).toBeGreaterThan(0);
    expect(hasImageBlock(out.messages[0].content)).toBe(true); // slab spliced as images
    expect(JSON.stringify(out.system ?? '')).not.toContain(BIG_SYSTEM.slice(0, 200));
  });
});

describe('node host — keepSystemText config file default', () => {
  const ORIGINAL_CONFIG = process.env.OMNIGLYPH_CONFIG;
  const ORIGINAL_KEEP = process.env.OMNIGLYPH_KEEP_SYSTEM_TEXT;
  const tmpDirs: string[] = [];

  function writeConfig(contents: unknown): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'omniglyph-keep-system-'));
    tmpDirs.push(dir);
    const file = path.join(dir, 'config.json');
    fs.writeFileSync(file, JSON.stringify(contents), 'utf8');
    return file;
  }

  function setOptionalEnv(name: string, value: string | undefined): void {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }

  afterEach(() => {
    setOptionalEnv('OMNIGLYPH_CONFIG', ORIGINAL_CONFIG);
    setOptionalEnv('OMNIGLYPH_KEEP_SYSTEM_TEXT', ORIGINAL_KEEP);
    while (tmpDirs.length > 0) {
      const dir = tmpDirs.pop();
      if (dir) fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('surfaces {"keepSystemText": true} as OMNIGLYPH_KEEP_SYSTEM_TEXT=1', () => {
    process.env.OMNIGLYPH_CONFIG = writeConfig({ keepSystemText: true });
    delete process.env.OMNIGLYPH_KEEP_SYSTEM_TEXT;
    parseCli([]);
    expect(process.env.OMNIGLYPH_KEEP_SYSTEM_TEXT).toBe('1');
  });

  it('env wins over the file config', () => {
    process.env.OMNIGLYPH_CONFIG = writeConfig({ keepSystemText: true });
    process.env.OMNIGLYPH_KEEP_SYSTEM_TEXT = '0';
    parseCli([]);
    expect(process.env.OMNIGLYPH_KEEP_SYSTEM_TEXT).toBe('0');
  });
});
