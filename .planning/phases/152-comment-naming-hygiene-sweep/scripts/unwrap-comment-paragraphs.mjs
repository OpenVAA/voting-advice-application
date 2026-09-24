#!/usr/bin/env node

/**
 * FORCED-LINE-BREAK INSTRUMENT (phase 152, requirement REVIEW-HYG-01 / D-A4).
 *
 * The incident this file exists for: a pre-ship review of PRs #865/#866/#869/#870 asked, of a
 * two-line `// reason:` comment wrapping at ~110 characters, to "Remove line breaks from
 * multiline comments EVERYWHERE." Measured, "everywhere" is 14,094 comment lines in 5,550
 * wrapped paragraphs across 747 files — 17x the planning-reference sweep, and 40% of the
 * 34,885-line non-blank comment corpus. A rule that size cannot be carried in a reviewer's
 * head or a plan's prose; it has to be one predicate, in one file, that anyone can re-run.
 *
 * ONE PREDICATE, THREE MODES. The disposition decision selects a FLAG, not a rewrite of this
 * file, so that changing the disposition later cannot change the definition by accident:
 *
 *   --report           (default) count and queue; write nothing.
 *   --gratuitous-only  restrict to paragraphs that would still fit in 120 characters joined —
 *                      i.e. the author broke a line that did not need breaking. This is
 *                      disposition (c), implemented as a filter over the same predicate
 *                      rather than as a second definition of it.
 *   --apply            perform the join.
 *
 * ── THE PREDICATE, D-A4 VERBATIM ───────────────────────────────────────────
 * "A comment line that ends without terminal punctuation AND whose next line continues the
 * same comment span at the same indent."
 *
 *   terminal punctuation : `.` `!` `?` — the STRICT reading. A line ending in a comma is
 *                          unambiguously a forced break, so `,` `;` `:` are NOT terminal.
 *   the same indent      : compared POST-MARKER. ` * foo` and `// foo` both measure from the
 *                          first character after the `*` / `//`, via the shared `OPENER_RE`.
 *                          Without this every JSDoc block reads as one indent-mismatched mess.
 *   the same span        : physical adjacency AND the same comment span. A trailing comment on
 *                          a code line is its own span and never joins with the line below.
 *
 * A line-1 `#!` shebang is never a comment-span start.
 *
 * ── THE CODIFIED EXCLUSIONS — CONSTANTS, NEVER FLAGS ───────────────────────
 * Per the repo's own no-opt-out principle (`scripts/assert-unit-test-coverage.mjs:47-53`:
 * "an opt-out that can be flipped when the guard is inconvenient makes its green meaningless
 * … Excusing a workspace requires editing this file, which is then reviewed as the decision it
 * is"), every exclusion below is a NAMED CONSTANT in this file. There is no runtime flag, no
 * ignore file and no per-path roster. Excusing a case means editing this file.
 *
 * Without them the guard is unkeepable: a future author adding a JSDoc `@param` list would
 * redden the build. Measured counts at the time of the ruling, per category:
 *
 *   BANNER_RULE        1,418   `////`, `====`, `----` separator lines
 *   NEXT_IS_LIST_ITEM  1,258   next line starts `- `, `* `, `1. `, `(a)` …
 *   NEXT_IS_JSDOC_TAG    429   next line starts `@param`, `@returns`, …
 *   HANGING_INDENT       567   next line is more deeply indented (ASCII tables, code samples)
 *   COMMENT_TABLE         34   pipe-table rows inside comments
 *   PARAGRAPH_BREAK        —   see Amendment 1 below
 *
 * ── ⚠ AMENDMENT 1 — THE PARAGRAPH-BREAK RULE IS A NAMED RULE ───────────────
 * Operator ruling, verbatim: "When doing the sweep, note that paragraph breaks are allowed,
 * i.e. 2 consecutive linebreaks with the same indent."
 *
 * A BLANK COMMENT LINE TERMINATES THE PARAGRAPH. The sweep must never join across one:
 *
 *     // first paragraph ends here
 *     //                              <- paragraph break: never join across this
 *     // second paragraph starts here
 *
 * This behaviour was ALREADY present in the reference predicate as the incidental line
 * `if (!cur.content.trim() || !nxt.content.trim()) continue;`. The amendment is therefore NOT
 * a behaviour change — it is the promotion of an incidental implementation detail to a
 * first-class, named, fixture-tested rule, so that a later refactor of this file cannot
 * silently drop it. It has: a named predicate (`PARAGRAPH_BREAK`) sitting with the other five;
 * a committed fixture PAIR (`--self-test`) proving zero violations at the junction and one
 * when the blank line is removed; and its own row in the report's excluded-category counts.
 *
 * ── ORDERING, AND WHY THE SIX ROWS ARE COMPARABLE ──────────────────────────
 * The reference predicate skips blank-content junctions BEFORE the terminal-punctuation test.
 * Here the terminal-punctuation test comes first, so that every one of the six exclusion rows
 * counts the same thing: junctions that WOULD have been reported as forced line breaks and
 * were not, because of that exclusion. The behaviour is identical either way — both orderings
 * skip — but only this one makes `paragraph-break` comparable to `banner-rule` beside it.
 *
 * `BLOCK_DELIMITER` is a seventh counted row and is NOT one of the ruled categories: it is an
 * eligibility precondition. Joining a line carrying a C-block opener, a C-block terminator, or an HTML comment opener or terminator, into its
 * neighbour would destroy the comment block the classifier depends on.
 *
 * ⚠ NO DASH RULE OF ANY KIND, and one must never be added. 212 comment lines use a
 * double-hyphen as a dash, two of them ESLint disable-directive rule-description separators
 * (`apps/frontend/src/hooks.server.ts:1`, `apps/frontend/src/hooks.ts:1`) where a rewrite
 * changes the DIRECTIVE'S PARSE; 3,025 more already use real em/en dash characters. D-A5(b)
 * and D-A5(c) were both rejected. This file joins lines. It does not normalise punctuation,
 * and the word "dash" appears in it only in this prohibition.
 *
 * ⚠ `.editorconfig` IS NOT MODIFIED BY THIS PHASE. Its `max_line_length = 120` IS this
 * repository's Prettier `printWidth` (the shared prettier config sets none), so deleting it
 * would reformat the monorepo at width 80. The ruling records instead that the 120 maximum is
 * not expected to apply to comments and does not: Prettier does not reflow comments (proven by
 * running the repo's own binary against a 302-character comment, which survived byte-identical)
 * and there is no ESLint max-length rule anywhere in the shared config. A 400-character joined
 * comment line produced by `--apply` is SANCTIONED, not a violation.
 *
 * Usage (run from the repo root):
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --report
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --gratuitous-only --report
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --apply
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --self-test
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs --report --queue-out <path>
 *
 * Exit codes — the caller must be able to branch on the status alone:
 *   0  report/apply completed, or --self-test passed
 *   1  --self-test failed, or a named precondition failure (an unreadable file or tracked set).
 *      An input this instrument cannot read is a line break it cannot see — this fails closed.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  commentSpans,
  enumerateTrackedFiles,
  ExemptPathError,
  FAMILY_BY_EXT,
  OPENER_RE,
  REPO_ROOT,
  SCAN_ROOTS
} from './hygiene-codemod.mjs';

const SELF = '.planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs';
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const KNOWN_FLAGS = new Set(['--report', '--gratuitous-only', '--apply', '--self-test', '--queue-out', '-h', '--help']);
const APPLY = argv.includes('--apply');
const GRATUITOUS_ONLY = argv.includes('--gratuitous-only');
const SELF_TEST = argv.includes('--self-test');

/** The `.editorconfig` maximum. Used ONLY by `--gratuitous-only`; never enforced. */
const GRATUITOUS_LIMIT = 120;

const SCAN_EXTS = ['ts', 'tsx', 'js', 'mjs', 'cjs', 'svelte', 'sql', 'sh', 'bash', 'yaml', 'yml'];
const GLOBS = SCAN_ROOTS.map((root) => `${root}/**/*.{${SCAN_EXTS.join(',')}}`);

// ── The predicate's own constants ─────────────────────────────────────────
/** D-A4's "terminal punctuation", strict reading: a comma-ended line IS a forced break. */
const TERMINAL_PUNCTUATION = /[.!?][)\]`"'*]*\s*$/;

// ── The six codified exclusions. Constants, never flags. ──────────────────
/**
 * Banner, rule and SECTION-HEADER lines. A heading is structure exactly as a rule line is:
 * neither is prose, and neither may absorb the paragraph beneath it.
 *
 *   pure rule line     `////`, `====`, `-----`                          measured 1,418
 *   ATX heading        `## Why`, `# Terminal 1 -- start the server:`      measured 11
 *   decorated header   `-- The DECISIVE constraint ------------------`    measured 22
 *
 * The last two alternatives were added by `152-14` after its dry run showed the sweep folding
 * `axeScan.ts`'s `## Why` heading into the paragraph under it, and `appContext.svelte.ts`'s
 * box-drawn section header into the sentence under it. It is a WIDENING of an existing ruled
 * category, not a new one -- the ruling's five categories are unchanged in number and meaning.
 *
 * The decorated-header alternative matches a run of three or more BOX-DRAWING characters
 * anywhere on the line; ASCII `-`/`=` runs are already covered by the pure-rule alternative and
 * are deliberately NOT matched mid-line, because an ASCII em-dash-as-`---` inside prose is
 * common and a box-drawing run in a comment is only ever decoration.
 */
const BANNER_RULE = /^\s*([/=*#_~-]{4,}|[-=]{3,})\s*$|^\s*#{1,6}\s+\S|[\u2500-\u257F]{3,}/;
/** The next line opens a list item: `- `, `* `, `1. `, `(a)`. Measured 1,258. */
const NEXT_IS_LIST_ITEM = /^\s*([-*•+>]|\d+[.)]|\([a-z0-9]+\)|[a-z][.)]\s)/;
/** The next line opens a JSDoc tag: `@param`, `@returns`. Measured 429. */
const NEXT_IS_JSDOC_TAG = /^\s*@\w+/;
/**
 * A row of a table drawn inside a comment. TWO SYNTAXES, ONE CATEGORY.
 *
 *   pipe-delimited      `| a | b |`                                 measured 34
 *   column-aligned      `election_a:              dddddddd-dddd-…`  measured 42
 *
 * The second alternative was added by `152-14` after its dry run showed the sweep would fold
 * `apps/supabase/supabase/tests/database/00-helpers.test.sql`'s 28-row name-to-UUID reference
 * table into a single 1,738-character line. A table drawn with aligned columns is the same
 * artefact as a table drawn with pipes; only the ink differs, and this constant is named for
 * the artefact. It is therefore a WIDENING of an existing ruled category, not a sixth one —
 * the ruling's five categories are unchanged in number and in meaning.
 *
 * The alternative requires a key ending in `:` followed by TWO OR MORE spaces and then a
 * value: one space is ordinary prose (`Note: the thing`), two or more is a deliberate
 * alignment column. Measured blast radius over the live queue: 42 junctions in exactly four
 * files — `00-helpers.test.sql` (35), `benchmarks/data/generate-shared-data.sql` (5),
 * `dev-seed/src/templates/e2e/base.ts` (1), `tests/seed-test-data.ts` (1) — every one of them
 * verified by hand to be a real reference table. No prose junction is suppressed.
 *
 * Edited here rather than waived by a flag, per the no-opt-out principle in the docblock:
 * excusing a case means editing this file, so it is reviewed as the decision it is.
 */
const COMMENT_TABLE = /^\s*(\||\S+:\s{2,}\S)/;
/**
 * Hanging-indent continuation: the next line is more deeply indented. Measured 567. This is the
 * constant whose own name has always covered "ASCII tables, code samples" -- see the docblock.
 */
const HANGING_INDENT = (curContent, nxtContent) => /^\s{2,}/.test(nxtContent) && !/^\s{2,}/.test(curContent);
/**
 * The SECOND half of the same category: an indented CODE SAMPLE or SHELL RECIPE that is not
 * fenced. `HANGING_INDENT` above catches the block's ENTRY (unindented prose -> indented first
 * line) but not its INTERIOR, because a recipe's lines all sit at the SAME indent -- so a
 * four-command runbook was being folded into one line.
 *
 * Deliberately STRICT rather than "both sides indented". Measured on the live queue: 2,094
 * junctions have both sides indented by two or more, and the overwhelming majority of them are
 * ordinary wrapped prose inside an indented docblock paragraph -- excluding all of them would
 * cost 16% of the sanctioned sweep for no correctness gain. This predicate instead requires a
 * line to LOOK LIKE a command or a statement: a shell invocation or env assignment, a JS/TS
 * statement ending in `;`/`{`/`,`, a lone closing bracket, an alignment-arrow row, or a `$`
 * prompt. That is 202 junctions in 61 files -- 1.5% of the sweep, all of it code.
 *
 * Added by `152-14`; a widening of `HANGING_INDENT`'s category, not a new one.
 */
const INDENTED_CODE_SAMPLE = new RegExp(
  [
    '^\\s{2,}(yarn|npx|node|git|curl|cd|echo|source|export|pnpm|npm|docker|supabase|bash|sh|tsx|[A-Z_]{3,}=)\\s',
    '^\\s{2,}(const|let|var|import|return|await|function|class|type|interface|if|for|while)\\s.*[;{,]\\s*$',
    '^\\s{2,}[}\\])];?\\s*$',
    '^\\s{2,}\\S.*\\s(\u2192|->)\\s.*$',
    '^\\s{2,}\\$\\s'
  ].join('|')
);
/**
 * ⚠ AMENDMENT 1 to the operator's line-break ruling — THE PARAGRAPH-BREAK RULE.
 * A blank comment line terminates the paragraph; the sweep never joins across one. Named and
 * counted alongside the other five so a refactor cannot lose it. See the docblock, and
 * `152-LINEBREAK-RULING.md` § "Amendment 1".
 */
const PARAGRAPH_BREAK = (curContent, nxtContent) => !curContent.trim() || !nxtContent.trim();
/**
 * NOT one of the ruled categories — an eligibility precondition. A line carrying a block
 * opener or terminator cannot be joined into its neighbour without destroying the block.
 */
const BLOCK_DELIMITER = /\/\*|\*\/|<!--|-->/;
/**
 * ALSO NOT one of the ruled categories — a second eligibility precondition, of exactly the same
 * kind as `BLOCK_DELIMITER` above, added by `152-14` after its dry run.
 *
 * A fenced code block inside a comment — the ``` ```tsx … ``` ``` of a JSDoc `@example` — is
 * CODE, not wrapped prose. Its line breaks are semantic: they are the program's own. D-A4's
 * class is *wrapped prose*, and the ruling's exclusions exist so that structure is not folded
 * into a line. Joining a line that is inside a fence, or that IS a fence delimiter, destroys
 * the block just as surely as joining a `/*` destroys the comment — which is why this sits with
 * `BLOCK_DELIMITER` rather than with the five, and leaves the ruling's five categories
 * unchanged in number and in meaning.
 *
 * Measured on the live queue before it was added: **282 fence-block comment lines were inside
 * paragraphs the sweep was about to join**, across ~140 files — the whole component library's
 * `@example` usage blocks (`Button.svelte:40-49` was a ten-line `tsx` sample about to become one
 * line), every `@openvaa/llm` and `@openvaa/question-info` docblock sample, and the `sh`
 * reproduction commands in the dev-seed negative-control fixtures.
 *
 * The fence state is tracked PER COMMENT SPAN and reset at every span boundary, so an
 * unterminated fence cannot leak into the next comment.
 */
const CODE_FENCE = /^\s*(```|~~~)/;

/**
 * A THIRD eligibility precondition, of the same kind as `BLOCK_DELIMITER` and `CODE_FENCE`, and
 * the most dangerous of the three: a TOOL DIRECTIVE comment.
 *
 * A directive is not prose. It is read by ESLint, TypeScript, Prettier, Svelte or a coverage
 * tool, and every one of them requires the directive to be the FIRST thing in its comment. Join
 * a line of prose onto `eslint-disable-next-line @typescript-eslint/no-unused-expressions` and
 * the directive silently stops applying -- the rule it was suppressing fires again, or worse,
 * a rule it was suppressing for a reason goes unsuppressed in a file nobody re-reads.
 *
 * Found by `yarn lint:check` going RED on the first apply: this sweep had folded
 * `candidate/register/+page.svelte:51`'s prose into its `eslint-disable-next-line`, and the
 * `no-unused-expressions` error it had legitimately suppressed came back. Two `svelte-ignore
 * state_referenced_locally` directives in the entity-filter components were damaged the same
 * way and would NOT have reddened any gate -- a compiler warning would simply have returned.
 *
 * This is the SAME threat the phase's no-dash-rule prohibition guards (T-152-03: an edit that
 * changes a directive's PARSE), reached by a different mechanism. Three junctions live.
 */
const TOOL_DIRECTIVE =
  /^\s*(eslint-disable|eslint-enable|eslint-env|globals\s|@ts-(expect-error|ignore|nocheck)|prettier-ignore|svelte-ignore|c8\s+ignore|istanbul\s+ignore|v8\s+ignore|biome-ignore|noqa|deno-lint-ignore|@vitest-environment|sourceMappingURL)/;

const EXCLUSION_ROWS = [
  'banner-rule',
  'list-item',
  'jsdoc-tag',
  'hanging-indent',
  'comment-table',
  'paragraph-break',
  'code-fence',
  'tool-directive',
  'block-delimiter'
];

function familyFor(rel) {
  return FAMILY_BY_EXT[(rel.split('.').pop() || '').toLowerCase()] || {};
}

/**
 * The file's comment lines, in order, as
 * `{ i, indent, marker, content, spanId, commentOnly, raw }`.
 *
 * `indent` is the POST-MARKER column: the offset of the first character after the opener
 * token, marker included and its trailing whitespace NOT included (that whitespace stays at
 * the head of `content`, because it is exactly what `HANGING_INDENT` reads).
 */
function commentLinesOf(rel, text) {
  const fam = familyFor(rel);
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false };
  const lines = text.split('\n');
  const out = [];
  let spanId = 0;
  let previousWasComment = false;
  let previousWasTrailing = false;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // A line-1 `#!` is an interpreter directive, not a comment-span start.
    if (i === 0 && line.startsWith('#!')) {
      previousWasComment = false;
      previousWasTrailing = false;
      continue;
    }
    const spans = commentSpans(line, fam, state);
    if (spans.length === 0) {
      previousWasComment = false;
      previousWasTrailing = false;
      continue;
    }
    const [spanStart, spanEnd] = spans[0];
    const commentOnly = line.slice(0, spanStart).trim() === '' && line.slice(spanEnd).trim() === '';
    const m = OPENER_RE.exec(line.slice(spanStart));
    const indent = m ? spanStart + m[1].length + m[2].length : spanStart;

    // A trailing comment on a code line is its own span, and so is the line after it.
    if (!previousWasComment || previousWasTrailing || !commentOnly) {
      spanId++;
      inFence = false; // fence state is per span; an unterminated fence never leaks forward
    }

    const content = line.slice(indent);
    const isFenceDelimiter = CODE_FENCE.test(content);
    // The delimiter lines themselves count as in-fence: joining either one destroys the block.
    const inFenceHere = inFence || isFenceDelimiter;
    if (isFenceDelimiter) inFence = !inFence;

    out.push({ i, indent, marker: m ? m[2] : '', content, spanId, commentOnly, raw: line, inFence: inFenceHere });
    previousWasComment = true;
    previousWasTrailing = !commentOnly;
  }
  return out;
}

/**
 * Every forced-line-break junction in one file, plus the per-category counts of the junctions
 * that were excluded. A "junction" is the boundary between line k and line k+1; a paragraph is
 * a maximal run of lines linked by junctions.
 */
function scanText(rel, text) {
  const cl = commentLinesOf(rel, text);
  const excluded = Object.fromEntries(EXCLUSION_ROWS.map((r) => [r, 0]));
  const junctions = [];

  for (let k = 0; k < cl.length - 1; k++) {
    const cur = cl[k];
    const nxt = cl[k + 1];
    if (nxt.i !== cur.i + 1) continue; // physically adjacent
    if (nxt.spanId !== cur.spanId) continue; // continues the same comment span
    if (nxt.indent !== cur.indent) continue; // at the same (post-marker) indent

    // Terminal punctuation first, so that each exclusion row below counts junctions that WOULD
    // otherwise have been reported. See ORDERING in the docblock.
    if (TERMINAL_PUNCTUATION.test(cur.content)) continue;

    if (BLOCK_DELIMITER.test(cur.raw) || BLOCK_DELIMITER.test(nxt.raw)) {
      excluded['block-delimiter']++;
      continue;
    }
    // A fenced code block is code, not wrapped prose: its line breaks are the program's own.
    if (cur.inFence || nxt.inFence) {
      excluded['code-fence']++;
      continue;
    }
    // A tool directive must stay first in its comment or it silently stops applying.
    if (TOOL_DIRECTIVE.test(cur.content) || TOOL_DIRECTIVE.test(nxt.content)) {
      excluded['tool-directive']++;
      continue;
    }
    if (PARAGRAPH_BREAK(cur.content, nxt.content)) {
      excluded['paragraph-break']++;
      continue;
    }
    if (BANNER_RULE.test(cur.content) || BANNER_RULE.test(nxt.content)) {
      excluded['banner-rule']++;
      continue;
    }
    if (NEXT_IS_JSDOC_TAG.test(nxt.content)) {
      excluded['jsdoc-tag']++;
      continue;
    }
    if (COMMENT_TABLE.test(cur.content) || COMMENT_TABLE.test(nxt.content)) {
      excluded['comment-table']++;
      continue;
    }
    if (NEXT_IS_LIST_ITEM.test(nxt.content)) {
      excluded['list-item']++;
      continue;
    }
    if (
      HANGING_INDENT(cur.content, nxt.content) ||
      INDENTED_CODE_SAMPLE.test(cur.content) ||
      INDENTED_CODE_SAMPLE.test(nxt.content)
    ) {
      excluded['hanging-indent']++;
      continue;
    }
    junctions.push({ k, line: cur.i + 1 });
  }

  // Chain adjacent junctions into paragraphs.
  const paragraphs = [];
  for (let idx = 0; idx < junctions.length; ) {
    const startK = junctions[idx].k;
    let endK = junctions[idx].k + 1;
    let next = idx + 1;
    while (next < junctions.length && junctions[next].k === endK) {
      endK = junctions[next].k + 1;
      next++;
    }
    const members = cl.slice(startK, endK + 1);
    const joined = members.map((l) => l.content.trim()).join(' ');
    const head = members[0];
    const leading = /^[ \t]*/.exec(head.content)[0];
    paragraphs.push({
      file: rel,
      firstLine: head.i,
      lastLine: members[members.length - 1].i,
      lineCount: members.length,
      junctions: endK - startK,
      joinedText: `${head.raw.slice(0, head.indent)}${leading}${joined}`,
      startIndex: head.i,
      endIndex: members[members.length - 1].i
    });
    idx = next;
  }

  return { paragraphs, excluded, commentLines: cl.length };
}

function treeOf(rel) {
  return rel.split('/')[0];
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

// ── Self-test over the committed fixture pair ─────────────────────────────
/**
 * The Amendment-1 pair. The two inputs differ by ONE LINE — the blank comment line between the
 * paragraphs — and that single difference is the whole assertion: zero violations with it,
 * one without it. A single fixture could not express that; the pair is the evidence.
 */
const FIXTURES = [
  [
    'fixtures/unwrap-comment-paragraphs.input.paragraph-break.ts',
    'fixtures/unwrap-comment-paragraphs.expected.paragraph-break.violations'
  ],
  [
    'fixtures/unwrap-comment-paragraphs.input.paragraph-joined.ts',
    'fixtures/unwrap-comment-paragraphs.expected.paragraph-joined.violations'
  ]
];

/**
 * Degenerate and structural inputs a fixture file cannot carry alongside a positive case.
 * Each of the five ruled structural categories has one, so the report rows beside them are
 * proven to fire rather than merely declared.
 */
const EDGE_CASES = [
  { name: 'an empty file', ext: 'ts', text: '', violations: [], excluded: {} },
  { name: 'a file with zero comment lines', ext: 'ts', text: 'export const a = 1;\n', violations: [], excluded: {} },
  {
    name: 'a line-1 shebang is not a comment-span start',
    ext: 'sh',
    text: '#!/usr/bin/env bash\n# a comment with no terminal punctuation\necho hi\n',
    violations: [],
    excluded: {}
  },
  {
    // Two junctions, both excluded: the banner is the NEXT line at the first and the CURRENT
    // line at the second. Counting both is the point — a banner blocks a join from either side.
    name: 'BANNER_RULE — a rule line is never joined, from either side',
    ext: 'ts',
    text: '// prose with no full stop\n// ==========\n// more prose.\n',
    violations: [],
    excluded: { 'banner-rule': 2 }
  },
  {
    // Two junctions: lead-in -> item, and item -> item. A list is never folded into prose and
    // its items are never folded into each other.
    name: 'NEXT_IS_LIST_ITEM — a list under a lead-in is never joined',
    ext: 'ts',
    text: '// The three cases are\n// - the first\n// - the second.\n',
    violations: [],
    excluded: { 'list-item': 2 }
  },
  {
    name: 'NEXT_IS_JSDOC_TAG — a tag list is never joined',
    ext: 'ts',
    text: '// Adds two numbers\n// @param a the first\n',
    violations: [],
    excluded: { 'jsdoc-tag': 1 }
  },
  {
    name: 'HANGING_INDENT — a deeper-indented continuation is never joined',
    ext: 'ts',
    text: '// The table below\n//    col   value\n',
    violations: [],
    excluded: { 'hanging-indent': 1 }
  },
  {
    name: 'COMMENT_TABLE — a pipe-table row is never joined',
    ext: 'ts',
    text: '// The table below\n// | a | b |\n',
    violations: [],
    excluded: { 'comment-table': 1 }
  },
  {
    // The second syntax of the SAME category (see COMMENT_TABLE). Two junctions: lead-in ->
    // first row, and row -> row. A reference table drawn with aligned columns instead of pipes
    // must not fold into one line.
    name: 'COMMENT_TABLE — a column-aligned table row is never joined',
    ext: 'ts',
    text: '// The identifiers are\n// election_a:   dddddddd-0001\n// election_b:   dddddddd-0002\n',
    violations: [],
    excluded: { 'comment-table': 2 }
  },
  {
    // The boundary that keeps the alignment alternative honest: ONE space after the colon is
    // ordinary prose and still joins. Two or more is a deliberate alignment column.
    name: 'COMMENT_TABLE — a single space after a colon is prose, not a table',
    ext: 'ts',
    text: '// Note: the thing that wraps\n// onto a second line.\n',
    violations: [1],
    excluded: {}
  },
  {
    // Five junctions across the block, every one excluded: lead-in -> opening fence, fence ->
    // code, code -> code, code -> closing fence, and closing fence -> the prose beneath it. The
    // prose AFTER the block still joins with the line after IT, which is the sixth junction and
    // the one violation -- a fence must not disable the sweep for the rest of the comment.
    name: 'CODE_FENCE -- a fenced @example block is code, and is never folded into a line',
    ext: 'ts',
    text: [
      '// Usage',
      '// ```tsx',
      '// <Button',
      '//   onClick={fn} />',
      '// ```',
      '// and some prose that wraps',
      '// onto a second line.',
      ''
    ].join('\n'),
    violations: [6],
    excluded: { 'code-fence': 5 }
  },
  {
    // An unterminated fence must not leak past the end of its comment span, or one stray
    // backtick line would silently disable the sweep for the whole rest of the file.
    name: 'CODE_FENCE -- an unterminated fence does not leak into the next comment span',
    ext: 'ts',
    text: '// ```ts\nexport const a = 1;\n// prose that wraps without\n// terminal punctuation.\n',
    violations: [3],
    excluded: {}
  },
  {
    // A heading is structure. Two junctions: heading -> body, and the body's own wrap, which is
    // the one violation -- excluding the heading must not disable the sweep for the paragraph.
    name: 'BANNER_RULE -- an ATX heading never absorbs the paragraph beneath it',
    ext: 'ts',
    text: '// ## Why\n// prose that wraps without\n// terminal punctuation.\n',
    violations: [2],
    excluded: { 'banner-rule': 1 }
  },
  {
    name: 'BANNER_RULE -- a box-drawn section header never absorbs the paragraph beneath it',
    ext: 'ts',
    text: '// \u2500\u2500 The constraint \u2500\u2500\u2500\u2500\u2500\u2500\n// prose that wraps without\n// terminal punctuation.\n',
    violations: [2],
    excluded: { 'banner-rule': 1 }
  },
  {
    // Four junctions, all excluded: the block entry is HANGING_INDENT's, the three interior
    // command-to-command junctions are INDENTED_CODE_SAMPLE's. Both report on the same row,
    // because they are two halves of one ruled category.
    name: 'HANGING_INDENT -- an unfenced indented shell recipe is never folded into a line',
    ext: 'ts',
    text: [
      '// Running the journey:',
      '//   yarn db:reset',
      '//   source /tmp/eflow10b.env',
      '//   yarn dev',
      '//   npx playwright test',
      ''
    ].join('\n'),
    violations: [],
    excluded: { 'hanging-indent': 4 }
  },
  {
    // The boundary: ordinary wrapped prose at a uniform indent is NOT a code sample and still
    // joins. This is the 2,094-junction population the strict predicate deliberately spares.
    name: 'HANGING_INDENT -- indented wrapped prose is not a code sample and still joins',
    ext: 'ts',
    text: '//   prose indented but still prose,\n//   wrapping onto a second line.\n',
    violations: [1],
    excluded: {}
  },
  {
    // Both directions: prose -> directive (the live `candidate/register/+page.svelte` case) and
    // directive -> its own following line. Neither may join.
    name: 'TOOL_DIRECTIVE -- prose never joins onto an eslint-disable-next-line',
    ext: 'ts',
    text: '// Track changes to re-enable submit after error\n// eslint-disable-next-line @typescript-eslint/no-unused-expressions\nfoo;\n',
    violations: [],
    excluded: { 'tool-directive': 1 }
  },
  {
    name: 'TOOL_DIRECTIVE -- svelte-ignore is protected too',
    ext: 'svelte',
    text: '// Update selection when filter values change\n// svelte-ignore state_referenced_locally\n',
    violations: [],
    excluded: { 'tool-directive': 1 }
  },
  {
    name: 'a trailing comment on a code line never joins the comment beneath it',
    ext: 'ts',
    text: 'export const a = 1; // a trailing note\n// a fresh comment line\n',
    violations: [],
    excluded: {}
  },
  {
    name: 'the plain positive case — two wrapped prose lines',
    ext: 'ts',
    text: '// prose that wraps without\n// terminal punctuation.\n',
    violations: [1],
    excluded: {}
  }
];

function selfTest() {
  let failures = 0;
  console.log('PHASE 152 — forced-line-break instrument (SELF-TEST)\n');

  for (const [inRel, expRel] of FIXTURES) {
    const input = readFileSync(resolve(SCRIPT_DIR, inRel), 'utf-8');
    const expected = readFileSync(resolve(SCRIPT_DIR, expRel), 'utf-8')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const { paragraphs } = scanText(inRel, input);
    const actual = [];
    for (const p of paragraphs) for (let n = 0; n < p.junctions; n++) actual.push(`${inRel}:${p.firstLine + 1 + n}`);
    if (actual.join('\n') === expected.join('\n')) {
      console.log(`  ✓ ${inRel}  (violations: ${actual.length})`);
      continue;
    }
    failures++;
    console.log(`  ✗ ${inRel}`);
    console.log(`        actual  : ${JSON.stringify(actual)}`);
    console.log(`        expected: ${JSON.stringify(expected)}`);
  }

  console.log('');
  for (const edge of EDGE_CASES) {
    const { paragraphs, excluded } = scanText(`edge.${edge.ext}`, edge.text);
    const actualViolations = [];
    for (const p of paragraphs) for (let n = 0; n < p.junctions; n++) actualViolations.push(p.firstLine + 1 + n);
    const actualExcluded = Object.fromEntries(Object.entries(excluded).filter(([, v]) => v > 0));
    const ok =
      JSON.stringify(actualViolations) === JSON.stringify(edge.violations) &&
      JSON.stringify(actualExcluded) === JSON.stringify(edge.excluded);
    if (ok) {
      console.log(`  ✓ edge case: ${edge.name}`);
      continue;
    }
    failures++;
    console.log(`  ✗ edge case: ${edge.name}`);
    console.log(`        actual  : violations=${JSON.stringify(actualViolations)} excluded=${JSON.stringify(actualExcluded)}`);
    console.log(`        expected: violations=${JSON.stringify(edge.violations)} excluded=${JSON.stringify(edge.excluded)}`);
  }

  console.log(`\n── Summary ──\n  Fixtures: ${FIXTURES.length}\n  Edge cases: ${EDGE_CASES.length}\n  Failures: ${failures}`);
  console.log(`\n${failures === 0 ? '✓ Self-test PASSED. No file on disk was touched.' : '✗ Self-test FAILED.'}`);
  console.log('\nMODE: self-test (no files written).');
  return failures === 0 ? 0 : 1;
}

function printUsage() {
  console.log(
    [
      'FORCED-LINE-BREAK INSTRUMENT (phase 152, requirement REVIEW-HYG-01 / D-A4)',
      '',
      'Usage:',
      '  node …/unwrap-comment-paragraphs.mjs --report              count and queue; write nothing',
      '  node …/unwrap-comment-paragraphs.mjs --gratuitous-only --report   joined result <= 120 chars only',
      '  node …/unwrap-comment-paragraphs.mjs --apply               perform the join',
      '  node …/unwrap-comment-paragraphs.mjs --self-test           run the committed fixtures',
      '',
      'The five structural exclusions and the Amendment-1 paragraph-break rule are CONSTANTS in',
      'this file. There is no flag that adds, removes or waives one.'
    ].join('\n')
  );
}

function main() {
  const unknown = argv.filter((a, i) => a.startsWith('-') && !KNOWN_FLAGS.has(a) && argv[i - 1] !== '--queue-out');
  if (unknown.length > 0) {
    console.error(`[ERROR] ${SELF}: unknown flag '${unknown[0]}'.`);
    process.exitCode = 1;
    return;
  }
  if (argv.includes('-h') || argv.includes('--help')) {
    printUsage();
    process.exitCode = 0;
    return;
  }
  if (SELF_TEST) {
    process.exitCode = selfTest();
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  const queueIdx = argv.indexOf('--queue-out');
  const queueOut =
    queueIdx >= 0 && argv[queueIdx + 1] && !argv[queueIdx + 1].startsWith('--')
      ? resolve(argv[queueIdx + 1])
      : join(tmpdir(), `152-linebreak-queue${GRATUITOUS_ONLY ? '-gratuitous' : ''}.tsv`);

  let files;
  try {
    ({ files } = enumerateTrackedFiles(GLOBS, REPO_ROOT));
  } catch (error) {
    if (error instanceof ExemptPathError) violate(`${error.message} — this instrument never reads an exempt tree.`);
    else violate(`could not enumerate ${GLOBS.join(' ')} (${error.message}). This fails closed.`);
    process.exitCode = 1;
    return;
  }

  const excludedTotals = Object.fromEntries(EXCLUSION_ROWS.map((r) => [r, 0]));
  const byTree = Object.fromEntries(SCAN_ROOTS.map((r) => [r, 0]));
  const allParagraphs = [];
  let scanned = 0;
  let rewritten = 0;
  let commentLines = 0;

  for (const rel of files.sort()) {
    let text;
    try {
      text = readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
    } catch (error) {
      violate(`could not read '${rel}' (${error.message}). This fails closed.`);
      continue;
    }
    scanned++;

    const { paragraphs, excluded, commentLines: n } = scanText(rel, text);
    commentLines += n;
    for (const row of EXCLUSION_ROWS) excludedTotals[row] += excluded[row];

    const selected = GRATUITOUS_ONLY ? paragraphs.filter((p) => p.joinedText.length <= GRATUITOUS_LIMIT) : paragraphs;
    for (const p of selected) {
      byTree[treeOf(rel)] = (byTree[treeOf(rel)] ?? 0) + p.junctions;
      allParagraphs.push(p);
    }

    if (!APPLY || selected.length === 0) continue;

    // Rewrite back to front so earlier line indices stay valid.
    const lines = text.split('\n');
    for (let idx = selected.length - 1; idx >= 0; idx--) {
      const p = selected[idx];
      lines.splice(p.startIndex, p.endIndex - p.startIndex + 1, p.joinedText);
    }
    const next = lines.join('\n');
    if (next !== text) {
      writeFileSync(resolve(REPO_ROOT, rel), next, 'utf-8');
      rewritten++;
    }
  }

  const totalJunctions = allParagraphs.reduce((sum, p) => sum + p.junctions, 0);
  const distinctFiles = new Set(allParagraphs.map((p) => p.file));
  const lengths = allParagraphs.map((p) => p.joinedText.length).sort((a, b) => a - b);

  const mode = APPLY ? 'APPLY' : 'REPORT';
  console.log(
    `Forced-line-break instrument (phase 152: REVIEW-HYG-01, D-A4) — MODE: ${mode}` +
      `${GRATUITOUS_ONLY ? ' (gratuitous-only: joined result <= 120 chars)' : ''}`
  );
  console.log(`  scope: ${SCAN_ROOTS.map((r) => `${r}/`).join(' ')}  files scanned: ${scanned}  comment lines: ${commentLines}\n`);

  console.log('  wrapped-prose junctions (the target class)');
  for (const root of SCAN_ROOTS) console.log(`    ${root.padEnd(22)} ${byTree[root] ?? 0}`);
  console.log(`    ${'total'.padEnd(22)} ${totalJunctions}`);
  console.log(`    ${'in paragraphs'.padEnd(22)} ${allParagraphs.length}`);
  console.log(`    ${'across files'.padEnd(22)} ${distinctFiles.size}`);
  console.log(`    ${'comment lines affected'.padEnd(22)} ${totalJunctions + allParagraphs.length}`);

  console.log('\n  joined length (characters, whole line including the comment marker)');
  console.log(
    `    p50=${percentile(lengths, 50)}  p75=${percentile(lengths, 75)}  p90=${percentile(lengths, 90)}  ` +
      `p99=${percentile(lengths, 99)}  max=${lengths.length ? lengths[lengths.length - 1] : 0}  ` +
      `over ${GRATUITOUS_LIMIT}: ${lengths.filter((l) => l > GRATUITOUS_LIMIT).length}`
  );

  console.log('\n  structurally excluded junctions (codified CONSTANTS in this file, never flags)');
  for (const row of EXCLUSION_ROWS) {
    const note =
      row === 'paragraph-break'
        ? '  <- Amendment 1: a blank comment line ends the paragraph'
        : row === 'block-delimiter' || row === 'code-fence' || row === 'tool-directive'
          ? '  <- eligibility precondition, not one of the five'
          : '';
    console.log(`    ${row.padEnd(22)} ${String(excludedTotals[row]).padStart(6)}${note}`);
  }

  if (!APPLY) {
    const tsv = allParagraphs
      .map((p) => `${p.file}\t${p.firstLine + 1}\t${p.lastLine + 1}\t${p.lineCount}\t${p.joinedText.length}`)
      .join('\n');
    writeFileSync(queueOut, `path\tfirst_line\tlast_line\tlines\tjoined_length\n${tsv}\n`, 'utf-8');
    console.log(`\n  queue written: ${queueOut}`);
  }

  console.log(
    `\n${APPLY ? `✓ Changes written. Files rewritten: ${rewritten}.` : 'Report only. Nothing was written to the source tree.'}`
  );
  console.log(`\nMODE: ${APPLY ? 'APPLY (files on disk were modified)' : 'REPORT (no source file was modified)'}`);
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
