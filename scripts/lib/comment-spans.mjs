/**
 * SHARED COMMENT-SPAN CLASSIFIER (extracted phase 155, plan 05).
 *
 * Answers one question for every guard that must tell code from prose: which character
 * ranges on this line are comment TEXT? It is quote-aware and template-literal-aware, so a
 * `//` inside a string is not a comment and a `/*` inside a template literal does not open a
 * block.
 *
 * WHY THIS MODULE EXISTS. It was extracted verbatim from
 * `scripts/assert-comment-hygiene.mjs`, which had itself copied it from
 * `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs`. Phase 155 needed a THIRD
 * consumer -- `scripts/assert-edge-env-defaults.mjs`, whose check 1 must not trip on the
 * four docstrings that phase wrote to explain the very pattern it forbids -- and a third
 * hand-rolled copy was refused. A tokenizer bug fixed in one copy and not the others is a
 * guard that disagrees with its sibling about what a comment is, which is the failure this
 * extraction removes for the two consumers under `scripts/`.
 *
 * THE REMAINING COPY, stated plainly so it is not mistaken for an oversight. The
 * `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` copy stays where it is: it
 * declares no `export` at all and self-executes its whole enumeration on import, and
 * `.claude/` is a D-15 exempt tree that phase 152 recorded as one it may not touch. THAT
 * COPY AND THIS MODULE MUST STILL BE CHANGED TOGETHER. If you fix a tokenizer bug here, fix
 * it there, and vice versa. The one deliberate divergence is marked NET-NEW below (the
 * line-1 shebang rule, which `assert-comment-hygiene.mjs` rule 2 needs and the source
 * classifier does not have).
 *
 * NO BEHAVIOUR CHANGED IN THE EXTRACTION. The bodies below are byte-identical to the ones
 * they replaced; only the `export` keyword was added and the stale "(copied)" annotations
 * were corrected, this file now being the canonical copy for `scripts/`. The proof that the
 * move is inert is `node scripts/assert-comment-hygiene.mjs --self-test`, which diffs the
 * committed fixtures against the live classifier, plus a whole-tree run diffed against the
 * pre-extraction output.
 *
 * Node built-ins only, no build step, no dependency: this module is imported by guards that
 * must run before anything is built, so it cannot itself require a build. That is the same
 * bootstrapping constraint `scripts/assert-unit-test-coverage.mjs:39-41` states for being
 * outside TypeScript, and it applies here for the same reason.
 */

// ── Comment families, by extension ────────────────────────────────────────
// c    : `//` line, `/* */` block (and its `*` continuation, which the block state
//        machine covers without a special case)
// html : `<!-- -->`
// hash : `#` to end of line
// sql  : `--` to end of line
//
// `css` and `scss` were ADDED by plan 153-11 under operator ruling D7b, and their arrival
// order is load-bearing rather than incidental: the ruling required the first-party sweep of
// `apps/frontend/src/app.css` to land FIRST, so the rule they enable was never live against a
// pre-existing violation. `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` has
// carried both keys all along, so this addition NARROWS the copy divergence rather than
// widening it. A CSS comment is `/* */` only -- there is no `//` line comment in the CSS
// grammar -- but the `c` family's block machine is what reads `/* */`, and its `//` arm is
// inert in a file that contains none, so `{ c: true }` is the correct family and matches the
// source copy byte for byte.
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
  yml: { hash: true }
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

  // NET-NEW, not present in the source classifier: a line-1 `#!` is an interpreter
  // directive, not a comment. It cannot be inside any carried state (it is line 1), so the
  // test sits ahead of them. Inert for rule 1 — no shebang carries an escape — but rule 2
  // (D-A4) would otherwise read the shebang as the opening line of a comment span and flag
  // the first real comment below it as a continuation. It belongs in the classifier now, so
  // that the copy relationship above has one recorded divergence rather than a surprise.
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
 * The comment opener is NOT part of the body. It travels with `openerEnd` because rule
 * 2 (D-A4) compares POST-MARKER indent, so the marker must be strippable; rule 1 uses it to
 * quote a readable comment body back at the reader instead of an opener nobody typed.
 */
export const OPENER_RE = /^([ \t]*)(\/\/+|\/\*+\*?|\*+|<!--|-{2,}|#+)([ \t]*)/;

export function openerEnd(line, spans) {
  if (spans.length === 0) return 0;
  const [spanStart] = spans[0];
  const m = OPENER_RE.exec(line.slice(spanStart));
  return m ? spanStart + m[0].length : spanStart;
}
