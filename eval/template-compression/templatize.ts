// Naive, LOSSLESS log-templatizer for the measurement spike: it folds a
// contiguous run of >=MIN_RUN lines that share a digit-skeleton into one
// `Template:`/`Rows:` block. Variables are digit runs only (YAGNI: no word
// alignment, no entropy heuristics). Losslessness is the invariant the harness
// asserts — skeleton + row values reconstruct each original line exactly, and
// blocks stay in original position (contiguous runs only, so nothing reorders).

// SENTINEL is an in-band record-separator marker. skeletonize replaces every
// digit run with it, so the skeleton does double duty: it groups lines by
// identical variable LAYOUT (same marker positions AND count), and it splits
// cleanly for reconstruction. Grouping on a marker-less skeleton would merge
// lines whose digits sit in different places (e.g. `a1b1c` and `ab4c4` both
// reduce to `abc`) and corrupt reconstruction — the marker keeps layouts distinct.
export const SENTINEL = '\x1E';
export const MIN_RUN = 3;

export interface SkeletonResult {
  skeleton: string;
  values: string[];
}

export function skeletonize(line: string): SkeletonResult {
  const values: string[] = [];
  const skeleton = line.replace(/[0-9]+/g, (m) => {
    values.push(m);
    return SENTINEL;
  });
  return { skeleton, values };
}

export type Segment =
  | { kind: 'raw'; lines: string[] }
  | { kind: 'group'; skeleton: string; rows: string[][] };

export interface TemplateMapping {
  segments: Segment[];
}

function skeletonToTemplate(skeleton: string): string {
  return skeleton.split(SENTINEL).join('{}');
}

export function templatize(text: string): { text: string; mapping: TemplateMapping } {
  const lines = text.split('\n');
  const segments: Segment[] = [];
  let i = 0;
  while (i < lines.length) {
    const { skeleton, values } = skeletonize(lines[i]!);
    // A run is templatable only if the skeleton actually has a variable slot.
    if (values.length > 0) {
      let j = i + 1;
      const rows: string[][] = [values];
      while (j < lines.length) {
        const next = skeletonize(lines[j]!);
        // Marker-bearing skeleton: identical string ⇒ identical variable layout,
        // so every grouped row has the same slot count and positions (lossless).
        if (next.skeleton !== skeleton) break;
        rows.push(next.values);
        j++;
      }
      if (rows.length >= MIN_RUN) {
        segments.push({ kind: 'group', skeleton, rows });
        i = j;
        continue;
      }
    }
    // Not a run: accumulate into the current raw segment.
    const last = segments[segments.length - 1];
    if (last && last.kind === 'raw') last.lines.push(lines[i]!);
    else segments.push({ kind: 'raw', lines: [lines[i]!] });
    i++;
  }

  const rendered = segments
    .map((seg) => {
      if (seg.kind === 'raw') return seg.lines.join('\n');
      const header = `Template: ${skeletonToTemplate(seg.skeleton)}`;
      const rows = seg.rows.map((r) => r.join(',')).join('\n');
      return `${header}\nRows:\n${rows}`;
    })
    .join('\n');

  return { text: rendered, mapping: { segments } };
}

export function reconstruct(mapping: TemplateMapping): string {
  const out: string[] = [];
  for (const seg of mapping.segments) {
    if (seg.kind === 'raw') {
      out.push(seg.lines.join('\n'));
      continue;
    }
    const parts = seg.skeleton.split(SENTINEL);
    for (const row of seg.rows) {
      let line = parts[0]!;
      for (let k = 0; k < row.length; k++) line += row[k]! + parts[k + 1]!;
      out.push(line);
    }
  }
  return out.join('\n');
}
