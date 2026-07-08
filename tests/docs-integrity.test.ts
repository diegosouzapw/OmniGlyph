import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Guard against docs drift: markdown links (and their #fragments) that rot when
// files move, get renamed, or lose a heading. Dependency-light: pure fs + regex,
// runs inside the existing `pnpm test` / CI. Covers inline links, image links,
// reference-style links, and simple HTML href/src across the tracked docs.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** README + docs/** + benchmarks/** markdown tracked by the guard. */
function markdownFiles(): string[] {
  const out = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md'];
  const walk = (rel: string, opts: { onlyReadme?: boolean } = {}): void => {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) return;
    for (const name of fs.readdirSync(abs, { withFileTypes: true })) {
      const childRel = path.join(rel, name.name);
      if (name.isDirectory()) {
        if (name.name === 'node_modules' || name.name.startsWith('.')) continue;
        walk(childRel, opts);
      } else if (name.name.endsWith('.md')) {
        // benchmarks/ holds huge run logs; only its READMEs are prose worth link-checking.
        if (opts.onlyReadme && name.name !== 'README.md') continue;
        out.push(childRel);
      }
    }
  };
  walk('docs');
  walk('benchmarks', { onlyReadme: true });
  return [...new Set(out)].filter((f) => fs.existsSync(path.join(repoRoot, f)));
}

/** GitHub-style heading anchor slug. */
// GitHub replaces EACH space with a hyphen without collapsing or trimming, so
// "📊 The numbers — measured" slugs to "-the-numbers--measured" (leading dash
// from the emoji, double dash from the removed em-dash).
function slugify(heading: string): string {
  return heading
    .trim()
    .replace(/`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // link text only
    .replace(/[*_~]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-');
}

/** Set of heading anchors defined in a markdown file (skips fenced code). */
function headingAnchors(md: string): Set<string> {
  const anchors = new Set<string>();
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) anchors.add(slugify(m[1]!));
  }
  return anchors;
}

interface Link {
  readonly target: string; // path portion (may be empty for same-page #frag)
  readonly fragment: string | null;
  readonly raw: string;
}

const EXTERNAL = /^(https?:|mailto:|data:|tel:|ftp:)/i;

/** Extract every local link target from a markdown file: inline `](x)` / images,
 *  reference definitions `[ref]: x`, and simple HTML `href=`/`src=`. */
function localLinks(md: string): Link[] {
  const links: Link[] = [];
  const push = (rawTarget: string): void => {
    let t = rawTarget.trim();
    if (t.startsWith('<') && t.endsWith('>')) t = t.slice(1, -1);
    t = t.split(/\s+/)[0]!; // drop an optional "title"
    if (!t || EXTERNAL.test(t)) return;
    const hash = t.indexOf('#');
    const target = hash >= 0 ? t.slice(0, hash) : t;
    const fragment = hash >= 0 ? t.slice(hash + 1) : null;
    links.push({ target: target.split('?')[0]!, fragment, raw: rawTarget });
  };
  for (const m of md.matchAll(/\]\(([^)]+)\)/g)) push(m[1]!); // inline + image
  for (const m of md.matchAll(/^\s*\[[^\]]+\]:\s*(\S.*)$/gm)) push(m[1]!); // reference defs
  for (const m of md.matchAll(/(?:href|src)\s*=\s*"([^"]+)"/gi)) push(m[1]!); // simple HTML
  return links;
}

describe('docs integrity', () => {
  const files = markdownFiles();
  const anchorsByFile = new Map<string, Set<string>>();
  for (const f of files) anchorsByFile.set(f, headingAnchors(fs.readFileSync(path.join(repoRoot, f), 'utf8')));

  it('scans README, docs/**, and benchmarks/**/README.md', () => {
    expect(files).toContain('README.md');
    expect(files).toContain(path.join('docs', 'benchmarks', 'BENCHMARKS.md'));
    expect(files).toContain(path.join('benchmarks', 'density-frontier', 'README.md'));
    expect(files.length).toBeGreaterThan(4);
  });

  it('every relative link/image/href points to a file that exists', () => {
    const dead: string[] = [];
    for (const rel of files) {
      const dir = path.dirname(path.join(repoRoot, rel));
      for (const link of localLinks(fs.readFileSync(path.join(repoRoot, rel), 'utf8'))) {
        if (!link.target) continue; // same-page #fragment, checked below
        if (!fs.existsSync(path.resolve(dir, link.target))) dead.push(`${rel} → ${link.raw}`);
      }
    }
    expect(dead, `dead relative links:\n${dead.join('\n')}`).toEqual([]);
  });

  it('rebrand guard: no reference to the upstream project outside LICENSE and marked credits', () => {
    // The upstream is MIT: its copyright line STAYS in the LICENSE (legal
    // obligation). Everything else in the public repo is OmniGlyph-branded
    // only — this test freezes that forever. `archive/` no longer exists in
    // public; the private omniglyph-history mirror preserves the history with
    // the original attributions.
    //
    // ONE deliberate exception: the Acknowledgments section of the README
    // (and its i18n translations) credits the upstream author by name — an
    // intentional thank-you, not rebrand drift. It must sit between explicit
    // `omniglyph:upstream-credits` markers; anything outside them still fails.
    const forbidden = /pxpipe|teamchong|claude-image-proxy/i;
    const creditsBlock = /<!--\s*omniglyph:upstream-credits:start\s*-->[\s\S]*?<!--\s*omniglyph:upstream-credits:end\s*-->/g;
    const scanExt = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.md', '.json', '.yml', '.yaml', '.txt', '.toml', '.html', '.css', '.sh']);
    // `_references/` (upstream checkouts) and `docs/ops/` (operational notes)
    // are gitignored, local-only trees — never published, so they are outside
    // the rebrand guard's scope by design.
    const skipDirs = new Set(['node_modules', 'dist', 'archive', 'results', '_references']);
    const skipPaths = new Set(['docs/ops']);
    const selfRel = path.relative(repoRoot, fileURLToPath(import.meta.url)).replace(/\\/g, '/');
    const hits: string[] = [];
    const walk = (rel: string): void => {
      for (const name of fs.readdirSync(path.join(repoRoot, rel), { withFileTypes: true })) {
        const childRel = rel ? path.join(rel, name.name) : name.name;
        if (name.isDirectory()) {
          if (skipDirs.has(name.name) || name.name.startsWith('.')) continue;
          if (skipPaths.has(childRel.replace(/\\/g, '/'))) continue;
          walk(childRel);
          continue;
        }
        if (name.name === 'LICENSE') continue; // upstream legal line stays
        if (childRel.replace(/\\/g, '/') === selfRel) continue; // this test quotes the terms
        if (!scanExt.has(path.extname(name.name))) continue;
        const raw = fs.readFileSync(path.join(repoRoot, childRel), 'utf8');
        // Marked credits are only honored in markdown — code/config never gets the exception.
        const body = path.extname(name.name) === '.md' ? raw.replace(creditsBlock, '') : raw;
        if (forbidden.test(body)) {
          const line = body.split('\n').findIndex((l) => forbidden.test(l)) + 1;
          hits.push(`${childRel}:${line}`);
        }
      }
    };
    walk('');
    expect(hits, `upstream references found:\n${hits.join('\n')}`).toEqual([]);
  });

  it('README credits the upstream discovery inside the marked acknowledgments section', () => {
    // The concept OmniGlyph implements — context-as-image with exact billing
    // math — was discovered and proven by the upstream project. That credit is
    // a permanent part of the README, fenced by the markers the rebrand guard
    // honors. Removing the section (or its markers) is a regression.
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const block = /<!--\s*omniglyph:upstream-credits:start\s*-->([\s\S]*?)<!--\s*omniglyph:upstream-credits:end\s*-->/.exec(readme);
    expect(block, 'README.md must contain the omniglyph:upstream-credits marker pair').not.toBeNull();
    expect(block![1]).toMatch(/github\.com\/teamchong\/pxpipe/);
    expect(block![1]).toMatch(/acknowledg/i);
  });

  it('every #fragment resolves to a heading in the target markdown file', () => {
    const dead: string[] = [];
    for (const rel of files) {
      const dir = path.dirname(path.join(repoRoot, rel));
      for (const link of localLinks(fs.readFileSync(path.join(repoRoot, rel), 'utf8'))) {
        if (!link.fragment) continue;
        // Resolve which file the fragment lives in (same file if target empty).
        const targetRel = link.target
          ? path.relative(repoRoot, path.resolve(dir, link.target)).replace(/\\/g, '/')
          : rel;
        if (!targetRel.endsWith('.md')) continue; // only markdown has heading anchors
        const anchors = anchorsByFile.get(targetRel);
        if (anchors === undefined) continue; // target outside the scanned set
        if (!anchors.has(link.fragment.toLowerCase())) dead.push(`${rel} → #${link.fragment}`);
      }
    }
    expect(dead, `broken heading anchors:\n${dead.join('\n')}`).toEqual([]);
  });
});
