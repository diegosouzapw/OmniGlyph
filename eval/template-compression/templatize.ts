// Naive, LOSSLESS log-templatizer for the measurement spike: it folds a
// contiguous run of >=MIN_RUN lines that share a digit-skeleton into one
// `Template:`/`Rows:` block. Variables are digit runs only (YAGNI: no word
// alignment, no entropy heuristics). Losslessness is the invariant the harness
// asserts — skeleton + row values reconstruct each original line exactly, and
// blocks stay in original position (contiguous runs only, so nothing reorders).

// For public API, SENTINEL is empty (skeletonize returns skeletons without visible markers).
// Internally, we use an invisible marker for split/join operations.
export const SENTINEL = '';
export const MIN_RUN = 3;

// Internal marker using record separator character (invisible in normal use)
const INTERNAL_MARKER = '\x1E';

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

// Convert skeleton from public format (no markers) to internal format (with markers)
function internalizeSkeletonize(line: string): { skeleton: string; values: string[] } {
  const values: string[] = [];
  const skeleton = line.replace(/[0-9]+/g, (m) => {
    values.push(m);
    return INTERNAL_MARKER;
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
  return skeleton.split(INTERNAL_MARKER).join('{}');
}

export function templatize(text: string): { text: string; mapping: TemplateMapping } {
  const lines = text.split('\n');
  const segments: Segment[] = [];
  let i = 0;
  while (i < lines.length) {
    const { skeleton: publicSkeleton, values } = skeletonize(lines[i]!);
    // A run is templatable only if the skeleton actually has a variable slot.
    if (values.length > 0) {
      let j = i + 1;
      const rows: string[][] = [values];
      while (j < lines.length) {
        const next = skeletonize(lines[j]!);
        if (next.skeleton !== publicSkeleton || next.values.length === 0) break;
        rows.push(next.values);
        j++;
      }
      if (rows.length >= MIN_RUN) {
        // Store internal skeleton (with markers) in mapping
        const { skeleton: internalSkeleton } = internalizeSkeletonize(lines[i]!);
        segments.push({ kind: 'group', skeleton: internalSkeleton, rows });
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
    const parts = seg.skeleton.split(INTERNAL_MARKER);
    for (const row of seg.rows) {
      let line = parts[0]!;
      for (let k = 0; k < row.length; k++) line += row[k]! + parts[k + 1]!;
      out.push(line);
    }
  }
  return out.join('\n');
}
