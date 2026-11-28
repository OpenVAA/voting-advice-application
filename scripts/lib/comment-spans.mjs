/**
 * Shared comment-span classifier for the guards under `scripts/`.
 *
 * Answers which character ranges of a source file are comment text, so a guard can tell code from
 * prose. It is quote-aware and template-literal-aware: a `//` inside a string is not a comment and a
 * `/*` inside a template literal does not open a block.
 *
 * `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` carries its own copy of
 * `commentSpans`; change the two together. The one deliberate difference is the line-1 shebang rule
 * below.
 *
 * `node scripts/assert-comment-hygiene.mjs` runs its fixture self-test on every invocation, which
 * exercises every family here.
 *
 * Node built-ins only, no build step, no dependency: the guards that import this run before anything
 * is built.
 */

// ── Comment families, by extension ────────────────────────────────────────
// c    : `//` line, `/* */` block (and its `*` continuation, which the block state
//        machine covers without a special case)
// html : `<!-- -->`
// hash : `#` to end of line
// sql  : `--` to end of line
//
// Terraform and HCL (`tf`, `tfvars`, `hcl`) take both `#` and `//` line comments and `/* */`
// blocks, so they carry the `c` and `hash` families together. CSS has only `/* */` comments, which
// the `c` family's block machine reads; its `//` arm is inert there.
export const FAMILY_BY_EXT = {
  ts: { c: true },
  tsx: { c: true },
  js: { c: true },
  mjs: { c: true },
  cjs: { c: true },
  css: { c: true },
  scss: { c: true },
  html: { html: true },
  svelte: { c: true, html: true },
  sql: { c: true, sql: true },
  sh: { hash: true },
  bash: { hash: true },
  yaml: { hash: true },
  yml: { hash: true },
  tf: { c: true, hash: true },
  tfvars: { c: true, hash: true },
  hcl: { c: true, hash: true }
};

export function extensionOf(relPath) {
  return (relPath.split('.').pop() || '').toLowerCase();
}

export function familyFor(relPath) {
  return FAMILY_BY_EXT[extensionOf(relPath)];
}

// ── Comment-span classifier ───────────────────────────────────────────────
/**
 * Return the [start, end) character ranges on `line` that are comment TEXT, advancing the
 * per-file state machine. The three carried states are: inside a slash-star block, inside an
 * `<!-- -->` block, and inside a multi-line template literal (which must suppress comment
 * detection entirely — a `//` inside a template string is not a comment).
 */
export function commentSpans(line, fam, state) {
  const spans = [];
  const n = line.length;

  let i = 0;

  // A line-1 `#!` is an interpreter directive, not a comment. The codemod copy lacks this rule;
  // without it the comment-hygiene line-break rule would read the shebang as the start of a
  // comment and flag the first real comment below it as a continuation.
  if (state.lineIndex === 0 && line.startsWith('#!')) return spans;

  if (state.inTemplate) {
    // Inside a multi-line template literal: find its terminator, then fall through to
    // normal scanning for the remainder of the line.
    let j = 0;
    while (j < n) {
      if (line[j] === '\\') {
        j += 2;
        continue;
      }
      if (line[j] === '`') {
        state.inTemplate = false;
        j++;
        break;
      }
      j++;
    }
    if (state.inTemplate) return spans; // whole line is string content
    i = j;
  }

  if (state.inBlockC) {
    const end = line.indexOf('*/', i);
    if (end < 0) {
      spans.push([i, n]);
      return spans;
    }
    spans.push([i, end + 2]);
    state.inBlockC = false;
    i = end + 2;
  }

  if (state.inBlockHtml) {
    const end = line.indexOf('-->', i);
    if (end < 0) {
      spans.push([i, n]);
      return spans;
    }
    spans.push([i, end + 3]);
    state.inBlockHtml = false;
    i = end + 3;
  }

  let quote = null;
  while (i < n) {
    const ch = line[i];

    if (quote) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i++;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      i++;
      continue;
    }

    if (fam.c && ch === '/' && line[i + 1] === '/') {
      spans.push([i, n]);
      return spans;
    }
    if (fam.sql && ch === '-' && line[i + 1] === '-') {
      spans.push([i, n]);
      return spans;
    }
    if (fam.hash && ch === '#') {
      spans.push([i, n]);
      return spans;
    }
    if (fam.c && ch === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2);
      if (end < 0) {
        spans.push([i, n]);
        state.inBlockC = true;
        return spans;
      }
      spans.push([i, end + 2]);
      i = end + 2;
      continue;
    }
    if (fam.html && line.startsWith('<!--', i)) {
      const end = line.indexOf('-->', i + 4);
      if (end < 0) {
        spans.push([i, n]);
        state.inBlockHtml = true;
        return spans;
      }
      spans.push([i, end + 3]);
      i = end + 3;
      continue;
    }
    i++;
  }

  // An unterminated backtick is the only quote allowed to carry to the next line; a stray
  // apostrophe in markup text must not swallow the rest of the file.
  if (quote === '`') state.inTemplate = true;

  return spans;
}

export function inSpans(idx, spans) {
  return spans.some(([s, e]) => idx >= s && idx < e);
}

/**
 * A comment opener, which is not part of the comment body. The comment-hygiene line-break rule
 * compares the indent after the marker, and its escape rule quotes the body without the marker.
 */
export const OPENER_RE = /^([ \t]*)(\/\/+|\/\*+\*?|\*+|<!--|-{2,}|#+)([ \t]*)/;

export function openerEnd(line, spans) {
  if (spans.length === 0) return 0;
  const [spanStart] = spans[0];
  const m = OPENER_RE.exec(line.slice(spanStart));
  return m ? spanStart + m[0].length : spanStart;
}

// ── Whole-file helpers ────────────────────────────────────────────────────

/**
 * The comment spans of a whole file as absolute `[start, end)` character ranges, with each line's
 * absolute start offset and the lines themselves.
 * @param {string} text - The whole file.
 * @param {object} family - A comment family from `FAMILY_BY_EXT` or an equivalent literal.
 * @returns {{ spans: Array<[number, number]>, lineStarts: number[], lines: string[] }}
 */
export function commentMapOf(text, family) {
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false, lineIndex: 0 };
  const lines = text.split('\n');
  const spans = [];
  const lineStarts = [];
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    lineStarts.push(offset);
    state.lineIndex = i;
    for (const [start, end] of commentSpans(lines[i], family, state)) {
      spans.push([offset + start, offset + end]);
    }
    offset += lines[i].length + 1;
  }

  return { spans, lineStarts, lines };
}

/**
 * The 1-based line number containing absolute character index `idx`.
 * @param {number[]} lineStarts - The line-start offsets from `commentMapOf`.
 * @param {number} idx - An absolute character index.
 * @returns {number}
 */
export function lineNumberOf(lineStarts, idx) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (lineStarts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/**
 * `text` with every comment character replaced by a space, keeping every offset and line break, so
 * a match in the result reports the line the reader will open. Returns `text` unchanged when
 * `family` is falsy, which is what `familyFor` yields for an extension it does not know.
 * @param {string} text - The whole file.
 * @param {object | undefined | null} family - The file's comment family.
 * @returns {string}
 */
export function maskComments(text, family) {
  if (!family) return text;
  const { spans } = commentMapOf(text, family);
  if (spans.length === 0) return text;
  let masked = '';
  let last = 0;
  for (const [start, end] of spans) {
    masked += text.slice(last, start) + text.slice(start, end).replace(/[^\n]/g, ' ');
    last = end;
  }
  return masked + text.slice(last);
}

/**
 * Every match of the global regex `re` in `text` that does not start inside a comment, in ascending
 * index order. The whole file is scanned rather than line by line, so a match that wraps across
 * lines is still found.
 * @param {string} text - The whole file.
 * @param {RegExp} re - A regex with the `g` flag.
 * @param {{ spans: Array<[number, number]>, lineStarts: number[] }} map - From `commentMapOf(text, …)`.
 * @returns {Array<{ index: number, line: number, match: RegExpExecArray }>}
 */
export function codeMatches(text, re, map) {
  const found = [];
  re.lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match[0] === '') re.lastIndex++;
    if (inSpans(match.index, map.spans)) continue;
    found.push({ index: match.index, line: lineNumberOf(map.lineStarts, match.index), match });
  }
  return found;
}
