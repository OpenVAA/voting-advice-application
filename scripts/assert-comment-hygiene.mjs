#!/usr/bin/env node

/**
 * COMMENT HYGIENE GUARD (phase 152, requirement REVIEW-HYG-01).
 *
 * The incident this file exists for: a pre-ship review of PRs #865/#866/#869/#870 found
 * comments across `apps/**`, `packages/**` and `tests/**` that had stopped explaining the
 * code in front of them — prose broken across lines for no reason, and one docstring whose
 * punctuation had been written as a six-character source escape instead of the character it
 * encodes (`apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte:12`,
 * `– default: The contents to wrap.`). Fixing the instances closes nothing: the class
 * reopens on the next PR that writes a comment. Eleven further phases (153-164) were queued
 * to write new comments immediately after the sweep. So the sweep's durable half is THIS
 * FILE, wired into `yarn lint:check` — the one command every local run and CI pass through.
 * A convention that lives only in a review comment is a convention that reopens; a check is
 * a check. (D-A4, D-N1: "the enforcement, not the ordering, is what makes the sweep
 * durable".)
 *
 * TWO rules, and only two — BOTH LIVE, neither flag-gated, neither warn-only:
 *
 *   Rule 1 (D-A5) — A literal `\uXXXX` escape inside a comment span. The rule is
 *     comment-SCOPED, never a `git grep`: the tree carries eight non-comment
 *     occurrences that must not be touched, five of them the import-sort regex strings in
 *     `packages/shared-config/eslint.config.mjs:164,171-174` whose corruption would break
 *     lint repo-wide, plus `apps/frontend/src/lib/components/select/Select.svelte:87` and
 *     `apps/frontend/src/lib/i18n/translations/index.ts:62,63`.
 *   Rule 2 (D-A4) — the forced-line-break predicate: a comment line ending without terminal
 *     punctuation whose next line continues the same span at the same post-marker indent.
 *     Added by plan 152-15, once plan 152-14's sweep had taken the tree to zero for it, and
 *     added to THIS already-wired guard rather than to a second one. One gate, two rules.
 *     D-N1(c) was rejected precisely because a guard that fails on N pre-existing violations
 *     cannot be enabled until the sweep runs — so the rule waited for the sweep instead of
 *     shipping disabled, which is no guard at all.
 *
 * ── WHERE RULE 2 COMES FROM: A LIFT, NOT A RE-DERIVATION ──────────────────
 * Rule 2's predicate, its five ruled structural exclusions, its Amendment-1 paragraph-break
 * rule and its three eligibility preconditions are LIFTED VERBATIM from the phase instrument
 * `.planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs`,
 * which is the predicate the operator-sanctioned sweep actually ran over 727 files. THE TWO
 * PREDICATES MUST NOT DIVERGE: the instrument is what took the tree to zero, so a guard that
 * disagrees with it either reddens on structure the sweep deliberately preserved, or passes
 * text the sweep would have joined. The instrument is a ONE-SHOT PHASE ARTEFACT and stops
 * being run once phase 152 closes; this file is the STANDING GATE and runs forever. If a
 * predicate bug is found here, fix it here and record the divergence — do not silently let
 * the two drift.
 *
 * The lift includes the four hardenings plan 152-14 measured against the real tree, each of
 * which was found by reading the sweep's own diff before it was spent: column-aligned tables
 * (42 junctions in 4 files), fenced `@example` blocks (903 junctions across ~140 files, the
 * largest and worst class), tool directives (9 junctions — one of which had already silently
 * re-enabled an ESLint error), and ATX / box-drawn section headers (43 junctions), plus the
 * unfenced indented shell recipes in `HANGING_INDENT`'s row (135 junctions). A guard carrying
 * the NAIVE predicate instead of the hardened one would redden on all of them.
 *
 * ⚠ STANDING PROHIBITION — this guard has NO rule about dashes of any kind, and one must
 * never be added "while we're in there". 212 comment lines in these trees use a
 * double-hyphen as a dash, and two of those — `apps/frontend/src/hooks.server.ts:1` and
 * `apps/frontend/src/hooks.ts:1` — are ESLint disable-directive rule-description
 * separators, where a rewrite changes the DIRECTIVE'S PARSE and could silently disable
 * `func-style` across the whole frontend. A further 3,025 comment lines already use real
 * em/en dash characters and are correct as they stand. A third rule of that shape fails on
 * 3,237 lines on its first run. D-A5 option (b) (normalise the double-hyphens) and option
 * (c) (flatten every dash to a plain hyphen) were both explicitly considered and REJECTED.
 * Per D-A5 and 152-CONTEXT.md <open> item 6.
 *
 * THE PROHIBITION EXTENDS TO RULE 2, and rule 2 does not weaken it. Rule 2 operates on LINE
 * BREAKS and TERMINAL PUNCTUATION only: it decides whether two adjacent comment lines are one
 * broken sentence, and if they are it says so. It never rewrites punctuation, never normalises
 * a character to another character, and never inspects a double-hyphen except through the SQL
 * comment marker in the shared classifier — which is the point: in a `.sql` file the double
 * hyphen IS the comment opener, so a rule of that shape could not even be expressed here
 * without breaking the tokenizer it depends on. Plan 152-14 found the SAME threat (T-152-03,
 * an edit that changes a directive's parse) reachable by a route the prohibition does not
 * cover — a JOIN that absorbs an `eslint-disable-next-line` — which is why `TOOL_DIRECTIVE`
 * below is an eligibility precondition and not a nicety.
 *
 * ⚠ COPY RELATIONSHIP — the comment-span classifier (`commentSpans`, `inSpans`,
 * `FAMILY_BY_EXT`, `OPENER_RE`/`openerEnd`) NO LONGER LIVES IN THIS FILE. Phase 155 plan 05
 * extracted it verbatim to `scripts/lib/comment-spans.mjs`, which this file now imports,
 * because a second guard under `scripts/` needed the same answer to the same question:
 * `assert-edge-env-defaults.mjs` must tell a forbidden environment default apart from the
 * four docstrings that describe one. A third hand-rolled copy would have been a third
 * opinion about what a comment is. Nothing about this guard's behaviour changed in the
 * move: `--self-test` and a whole-tree run were diffed across it and were byte-identical.
 *
 * The `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` copy the classifier
 * originally came from STAYS a copy. That module declares no `export` at all and
 * self-executes its whole enumeration on import, so importing it would run a codemod; and
 * editing it means editing `.claude/`, a D-15 exempt tree phase 152 recorded as one it may
 * not touch. THAT COPY AND `scripts/lib/comment-spans.mjs` MUST STILL BE CHANGED TOGETHER.
 * If you fix a tokenizer bug in one, fix it in the other. The one deliberate divergence is
 * marked NET-NEW in the extracted module (the line-1 shebang rule, which rule 2 needs and
 * the source classifier does not have).
 *
 * COST STATEMENT, in the terms `scripts/assert-unit-test-coverage.mjs:33-38` uses for its
 * own: this guard shells out once, to `execFileSync('git', ['ls-files', ...])`, which
 * forfeits the no-subprocess bootstrapping purity the rest of the family keeps. It is paid
 * knowingly. `globSync` sees the working tree, not the index, so without the intersection
 * the guard would read gitignored build output — generated paraglide sources, the
 * `tests/e2e-runs/**` evidence directories — and report violations in files nobody can fix
 * because they are regenerated. `SKIP_PATH_RE` is the cheap belt and the tracked-set
 * intersection is the structural one; BOTH are kept, because the source module records that
 * either alone has been wrong before. The rest of the family's bootstrapping properties
 * hold: no build step, no transpiler, no workspace import, no new dependency.
 *
 * SANCTIONED EXCEPTION, quoted from `scripts/assert-unit-test-coverage.mjs:39-41` so a later
 * reader does not "improve" this file into a `.ts` one against CLAUDE.md's strict-TypeScript
 * directive: "This file is deliberately OUTSIDE TypeScript, against CLAUDE.md's 'use
 * TypeScript strictly', for that same bootstrapping reason: a guard that must run before
 * anything is built cannot itself require a build."
 *
 * ── THE EXTENSION SET, AND THE ONE FAMILY DELIBERATELY LEFT OUT ───────────
 * Plan 152-01 shipped this guard scanning eleven extension families and RECORDED THE GAP for
 * 152-15 to dispose of: the source codemod also classifies `.css`, `.scss`, `.html`, `.xml`,
 * `.toml`, `.zsh`, `.mts`, `.cts`, `.jsx` and `.md`, and RESEARCH § 1.5 counted 6 `.css` and 4
 * `.html` comment-bearing files in the scan roots that this guard could not see. 152-15
 * measured the gap rather than inheriting it, by widening this map and reading the result:
 *
 *   `.html` — 4 tracked files, **0 violations under either rule**. ADDED. Free to close, and
 *     closing it means the four files are gated from now on instead of merely clean today.
 *   `.css` / `.scss` — ADDED by plan 153-11 under operator ruling D7b, in the order that
 *     ruling fixed. 152-15 measured 4 comment-bearing files carrying 19 live rule-2 violations
 *     (`app.css` 14, `inter.css` 3, `prism-vs.css` 2) and DECLINED to add the family, because
 *     enabling a rule against N pre-existing violations is exactly the D-N1(c) shape this phase
 *     rejected: such a guard must ship red or ship disabled, and a disabled guard is no guard.
 *     It registered the question for the operator instead. The operator ruled on 2026-08-29:
 *     sweep the one first-party file, exclude the two vendored ones by name, THEN add the
 *     family. 153-11 did exactly that — `app.css` swept to zero in commit `58be1b985`, proven
 *     comment-only with zero allow entries over a range bounded at that commit, and the family
 *     added afterwards with the guard green on arrival. The two exclusions are
 *     `VENDORED_EXCLUSIONS` below. One inherited figure did not survive re-measurement: six
 *     `.css` files are tracked under the scan roots and FIVE of them carry comments, not four
 *     — `packages/argument-condensation/tools/visualization/styles.css` (23 comment openers)
 *     and `apps/docs/src/routes/layout.css` (1) both carry comments and both were already at
 *     zero violations, so the 19-violation total 152-15 recorded was right even though its
 *     file count was one low. No `.scss` file is tracked anywhere in the scan roots; the
 *     extension is registered so that the first one added is covered on arrival rather than
 *     entering a blind spot.
 *
 * `.md` stays out for a different and stronger reason: the shared classifier maps `md` to an
 * empty comment family, so a Markdown file has no comment spans at all and both rules would be
 * silently inert on it. That question is also the operator's.
 *
 * INPUT SURFACE: the tracked files under `apps/`, `packages/` and `tests/` — three
 * HARD-CODED scan roots. There is deliberately no `--files` glob, no ignore file, no
 * per-path exception roster and no warn-only tier. That is what makes the D-15 exemption
 * (`.planning/`, `.claude/`, `.agents/`, `CLAUDE.md`, and root `scripts/` itself, all of
 * which are agent-facing planning infrastructure rather than shipped source) unbypassable BY
 * CONSTRUCTION rather than by a check somebody can argue with: those paths are not under a
 * scan root, so no argument can steer the guard into them. Excusing a file requires editing
 * this script, which is then reviewed as the decision it is.
 *
 * Usage:
 *   node scripts/assert-comment-hygiene.mjs                 # scan the tree
 *   node scripts/assert-comment-hygiene.mjs --self-test     # run the committed fixtures
 *   node scripts/assert-comment-hygiene.mjs --emit-fixtures # regenerate expected files
 *
 * Exit codes:
 *   0 - clean, or --self-test passed
 *   1 - at least one violation, or a named precondition failure (a file, a directory or the
 *       tracked-file set this guard could not read). An input this guard cannot read is
 *       hygiene it cannot verify, and is never read as "everything is accounted for" — this
 *       fails closed.
 */

import { execFileSync } from 'node:child_process';
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  FAMILY_BY_EXT,
  OPENER_RE,
  commentSpans,
  extensionOf,
  familyFor,
  inSpans,
  openerEnd
} from './lib/comment-spans.mjs';

const SELF = 'scripts/assert-comment-hygiene.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

// ── CLI args ──────────────────────────────────────────────────────────────
// Membership tests over `process.argv`, no dependency — the shape used by
// `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs:132-186`, minus every flag
// that could narrow or widen the scan (see INPUT SURFACE above).
const argv = process.argv.slice(2);
const KNOWN_FLAGS = new Set(['--self-test', '--emit-fixtures', '-h', '--help']);
const SELF_TEST = argv.includes('--self-test');
const EMIT_FIXTURES = argv.includes('--emit-fixtures');

const SCAN_EXTS = Object.keys(FAMILY_BY_EXT);
/** Hard-coded. Not configurable, not overridable — see INPUT SURFACE in the docblock. */
const SCAN_ROOTS = ['apps', 'packages', 'tests'];
const GLOBS = SCAN_ROOTS.map((root) => `${root}/**/*.{${SCAN_EXTS.join(',')}}`);

// Generated / vendored trees. Reading these would report violations in files nobody can fix,
// because they are regenerated. Copied verbatim from hygiene-codemod.mjs:201-202.
const SKIP_PATH_RE =
  /(^|\/)(node_modules|\.svelte-kit|\.turbo|\.yarn|\.git|dist|build|coverage|playwright-report|playwright-results[\w-]*|test-results|e2e-runs|paraglide|project\.inlang|snippets)\//;

/**
 * VENDORED THIRD-PARTY TEXT, EXCLUDED BY NAME. Operator ruling D7b, 2026-08-29.
 *
 * Two files under the scan roots are not this project's prose. Their rule-2 junctions sit
 * inside licence and attribution text that arrived verbatim from upstream, and rewrapping such
 * text to satisfy a line-break rule edits someone else's licence notice — a trade this project
 * does not make. They are excluded here rather than swept.
 *
 * A NAMED CONSTANT, exactly like the five ruled structural exclusions below, and for the same
 * reason: there is no flag, no ignore file, no per-path roster and no warn-only tier. Excusing
 * a file means editing this list, which is then reviewed as the decision it is. Each entry
 * carries the reason it is here, so a later reader can tell a sanctioned exclusion from a gap.
 *
 * The exclusion is REPORTED in this guard's summary line, never silent: a guard that quietly
 * declines to look at a file reports a green about a question it did not ask.
 */
const VENDORED_EXCLUSIONS = new Map([
  [
    'apps/frontend/static/fonts/inter.css',
    'a verbatim OFL-licensed @fontsource/inter@5.3.0 distribution header (3 rule-2 junctions)'
  ],
  ['apps/docs/src/lib/layouts/prism-vs.css', 'an upstream author credit for the VS Prism theme (2 rule-2 junctions)']
]);

// ── Rule 1 (D-A5): a literal unicode escape inside a comment span ─────────
const UNICODE_ESCAPE_RE = /\\u[0-9a-fA-F]{4}/g;
const QUOTE_LIMIT = 120;

/** The comment body a finding sits in, opener stripped, for the violation message. */
function quoteComment(line, spans, idx) {
  const span = spans.find(([s, e]) => idx >= s && idx < e) ?? spans[0];
  const raw = line.slice(span[0], span[1]);
  const body = raw.slice(openerEnd(raw, [[0, raw.length]])).trim();
  return body.length > QUOTE_LIMIT ? `${body.slice(0, QUOTE_LIMIT)}…` : body;
}

// ── Rule 2 (D-A4): a forced line break inside a comment paragraph ─────────
// THE PREDICATE, D-A4 VERBATIM: "a comment line that ends without terminal punctuation AND
// whose next line continues the same comment span at the same indent."
//
//   terminal punctuation : `.` `!` `?` — the STRICT reading. A line ending in a comma is
//                          unambiguously a forced break, so `,` `;` `:` are NOT terminal.
//   the same indent      : compared POST-MARKER, via the shared `OPENER_RE`. ` * foo` and
//                          `// foo` both measure from the first character after the opener.
//                          Without this every JSDoc block reads as one indent-mismatched mess.
//   the same span        : physical adjacency AND the same comment span. A trailing comment on
//                          a code line is its own span and never joins with the line below.
//
// A line-1 `#!` shebang is never a comment-span start — the classifier's one NET-NEW rule,
// which exists for THIS rule and is exercised by the fixtures and the inline edge cases below.
/** D-A4's "terminal punctuation", strict reading: a comma-ended line IS a forced break. */
const TERMINAL_PUNCTUATION = /[.!?][)\]`"'*]*\s*$/;

// ── The five ruled structural exclusions. CONSTANTS, never flags. ─────────
// Per this repo's own no-opt-out principle (`scripts/assert-unit-test-coverage.mjs:47-53`:
// "an opt-out that can be flipped when the guard is inconvenient makes its green meaningless
// … Excusing a workspace requires editing this file, which is then reviewed as the decision it
// is"), every exclusion below is a NAMED CONSTANT in this file. There is no runtime flag, no
// ignore file, no per-path exception roster and no warn-only tier for any of them. Excusing a
// case means EDITING THIS FILE, which is then reviewed as the decision it is.
//
// Without them the guard is unkeepable, which is the whole reason they are ruled: a future
// author adding a JSDoc `@param` list, a reference table or a fenced `@example` block would
// redden the build for writing perfectly ordinary structure, and the pressure would then be to
// weaken the guard rather than to fix the comment.
/**
 * Banner, rule and SECTION-HEADER lines. A heading is structure exactly as a rule line is:
 * neither is prose, and neither may absorb the paragraph beneath it.
 *
 *   pure rule line     `////`, `====`, `-----`
 *   ATX heading        `## Why`
 *   decorated header   box-drawing runs used as section decoration
 *
 * The box-drawing alternative matches a run of three or more box-drawing characters anywhere
 * on the line; ASCII `-`/`=` runs are covered by the pure-rule alternative and are deliberately
 * NOT matched mid-line, because an ASCII `---` inside prose is common while a box-drawing run
 * in a comment is only ever decoration.
 */
const BANNER_RULE = /^\s*([/=*#_~-]{4,}|[-=]{3,})\s*$|^\s*#{1,6}\s+\S|[\u2500-\u257F]{3,}/;
/** The next line opens a list item: `- `, `* `, `1. `, `(a)`. */
const NEXT_IS_LIST_ITEM = /^\s*([-*•+>]|\d+[.)]|\([a-z0-9]+\)|[a-z][.)]\s)/;
/** The next line opens a JSDoc tag: `@param`, `@returns`. */
const NEXT_IS_JSDOC_TAG = /^\s*@\w+/;
/**
 * A row of a table drawn inside a comment. TWO SYNTAXES, ONE CATEGORY: pipe-delimited
 * (`| a | b |`) and column-aligned (`election_a:              dddddddd-dddd-…`). A table drawn
 * with aligned columns is the same artefact as one drawn with pipes; only the ink differs, and
 * this constant is named for the artefact.
 *
 * The alignment alternative requires a key ending in `:` followed by TWO OR MORE spaces and
 * then a value: one space is ordinary prose (`Note: the thing`), two or more is a deliberate
 * alignment column. That boundary has its own committed edge case below.
 */
const COMMENT_TABLE = /^\s*(\||\S+:\s{2,}\S)/;
/** Hanging-indent continuation: the next line is more deeply indented (tables, code samples). */
const HANGING_INDENT = (curContent, nxtContent) => /^\s{2,}/.test(nxtContent) && !/^\s{2,}/.test(curContent);
/**
 * The SECOND half of the same category: an indented CODE SAMPLE or SHELL RECIPE that is not
 * fenced. `HANGING_INDENT` catches the block's ENTRY (unindented prose → indented first line)
 * but not its INTERIOR, because a recipe's lines all sit at the SAME indent.
 *
 * Deliberately STRICT rather than "both sides indented": on the live tree 2,094 junctions have
 * both sides indented by two or more, and nearly all of them are ordinary wrapped prose inside
 * an indented docblock paragraph. This predicate instead requires a line to LOOK LIKE a command
 * or a statement. Its boundary — indented prose still joins — has its own edge case below.
 */
const INDENTED_CODE_SAMPLE = new RegExp(
  [
    '^\\s{2,}(yarn|npx|node|git|curl|cd|echo|source|export|pnpm|npm|docker|supabase|bash|sh|tsx|[A-Z_]{3,}=)\\s',
    '^\\s{2,}(const|let|var|import|return|await|function|class|type|interface|if|for|while)\\s.*[;{,]\\s*$',
    '^\\s{2,}[}\\])];?\\s*$',
    '^\\s{2,}\\S.*\\s(→|->)\\s.*$',
    '^\\s{2,}\\$\\s'
  ].join('|')
);
/**
 * AMENDMENT 1 to the operator's line-break ruling, verbatim: "paragraph breaks are allowed,
 * i.e. 2 consecutive linebreaks with the same indent". A BLANK COMMENT LINE TERMINATES THE
 * PARAGRAPH, and nothing is ever joined across one. Named here rather than left incidental so
 * a refactor of this file cannot silently drop it.
 */
const PARAGRAPH_BREAK = (curContent, nxtContent) => !curContent.trim() || !nxtContent.trim();
/**
 * NOT one of the ruled categories — an eligibility precondition. A line carrying a block opener
 * or terminator cannot be joined into its neighbour without destroying the block itself.
 */
const BLOCK_DELIMITER = /\/\*|\*\/|<!--|-->/;
/**
 * A second eligibility precondition. A fenced code block inside a comment — the ```` ```tsx ````
 * of a JSDoc `@example` — is CODE, not wrapped prose, and its line breaks are the program's
 * own. D-A4's class is *wrapped prose*. The fence state is tracked PER COMMENT SPAN and reset
 * at every span boundary, so an unterminated fence cannot leak into the next comment.
 */
const CODE_FENCE = /^\s*(```|~~~)/;
/**
 * The third eligibility precondition, and the most dangerous of them. A TOOL DIRECTIVE is not
 * prose: it is read by ESLint, TypeScript, Prettier, Svelte or a coverage tool, and every one
 * of them requires the directive to be the FIRST thing in its comment. Join a line of prose
 * onto `eslint-disable-next-line @typescript-eslint/no-unused-expressions` and the directive
 * silently stops applying. Plan 152-14 hit exactly that, live, on its first apply.
 */
const TOOL_DIRECTIVE =
  /^\s*(eslint-disable|eslint-enable|eslint-env|globals\s|@ts-(expect-error|ignore|nocheck)|prettier-ignore|svelte-ignore|c8\s+ignore|istanbul\s+ignore|v8\s+ignore|biome-ignore|noqa|deno-lint-ignore|@vitest-environment|sourceMappingURL)/;

/**
 * The file's comment lines, in order, as `{ i, indent, content, spanId, raw, inFence }`.
 *
 * `indent` is the POST-MARKER column: the offset of the first character after the opener token,
 * marker included and its trailing whitespace NOT included — that whitespace stays at the head
 * of `content`, because it is exactly what `HANGING_INDENT` reads.
 */
function commentLinesOf(text, fam) {
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false, lineIndex: 0 };
  const lines = text.split('\n');
  const out = [];
  let spanId = 0;
  let previousWasComment = false;
  let previousWasTrailing = false;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    state.lineIndex = i;
    // A line-1 `#!` yields no span from the classifier, so it lands here as "not a comment"
    // and can neither start a span nor continue one.
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

    out.push({ i, indent, content, spanId, raw: line, inFence: inFenceHere });
    previousWasComment = true;
    previousWasTrailing = !commentOnly;
  }
  return out;
}

/**
 * Every forced-line-break junction in one file's comment lines. A "junction" is the boundary
 * between comment line k and comment line k+1; the reported line is the FIRST of the two — the
 * line that ends mid-sentence — so the location pastes straight into an editor at the line to
 * join.
 *
 * The terminal-punctuation test comes BEFORE every exclusion, so that each exclusion below only
 * ever suppresses a junction that would otherwise have been reported.
 */
function forcedLineBreaks(commentLines) {
  const out = [];

  for (let k = 0; k < commentLines.length - 1; k++) {
    const cur = commentLines[k];
    const nxt = commentLines[k + 1];
    if (nxt.i !== cur.i + 1) continue; // physically adjacent
    if (nxt.spanId !== cur.spanId) continue; // continues the same comment span
    if (nxt.indent !== cur.indent) continue; // at the same (post-marker) indent
    if (TERMINAL_PUNCTUATION.test(cur.content)) continue;

    if (BLOCK_DELIMITER.test(cur.raw) || BLOCK_DELIMITER.test(nxt.raw)) continue;
    if (cur.inFence || nxt.inFence) continue;
    if (TOOL_DIRECTIVE.test(cur.content) || TOOL_DIRECTIVE.test(nxt.content)) continue;
    if (PARAGRAPH_BREAK(cur.content, nxt.content)) continue;
    if (BANNER_RULE.test(cur.content) || BANNER_RULE.test(nxt.content)) continue;
    if (NEXT_IS_JSDOC_TAG.test(nxt.content)) continue;
    if (COMMENT_TABLE.test(cur.content) || COMMENT_TABLE.test(nxt.content)) continue;
    if (NEXT_IS_LIST_ITEM.test(nxt.content)) continue;
    if (
      HANGING_INDENT(cur.content, nxt.content) ||
      INDENTED_CODE_SAMPLE.test(cur.content) ||
      INDENTED_CODE_SAMPLE.test(nxt.content)
    )
      continue;

    out.push(cur);
  }

  return out;
}

/**
 * Scan one file's text for BOTH rules. Returns `{ location, rule, message }` findings sorted by
 * line and then by rule number; `location` is `${label}:${lineNumber}`, one-based, so it pastes
 * straight into an editor.
 *
 * Rule 1 runs its own pass over the raw lines rather than over `commentLinesOf`, because it
 * needs EVERY span on a line (a line can carry two) while rule 2 needs only the first.
 */
function scanText(label, text, fam) {
  const findings = [];
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false, lineIndex: 0 };
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    state.lineIndex = i;
    const spans = commentSpans(line, fam, state);
    if (spans.length === 0) continue;

    UNICODE_ESCAPE_RE.lastIndex = 0;
    let match;
    while ((match = UNICODE_ESCAPE_RE.exec(line)) !== null) {
      if (!inSpans(match.index, spans)) continue;
      findings.push({
        location: `${label}:${i + 1}`,
        line: i + 1,
        rule: 1,
        message:
          `rule 1 (D-A5) — the literal escape '${match[0]}' appears inside a comment. Write the ` +
          `character it encodes instead. Comment: "${quoteComment(line, spans, match.index)}"`
      });
    }
  }

  for (const cur of forcedLineBreaks(commentLinesOf(text, fam))) {
    const body = cur.content.trim();
    findings.push({
      location: `${label}:${cur.i + 1}`,
      line: cur.i + 1,
      rule: 2,
      message:
        'rule 2 (D-A4) — this comment line ends without terminal punctuation and the line under ' +
        'it continues the same comment at the same indent. Join them into one line. Comment: ' +
        `"${body.length > QUOTE_LIMIT ? `${body.slice(0, QUOTE_LIMIT)}…` : body}"`
    });
  }

  findings.sort((a, b) => a.line - b.line || a.rule - b.rule);
  return findings;
}

// ── Self-test over committed fixtures ─────────────────────────────────────
// Detector-shaped adaptation of hygiene-codemod.mjs:736-780: that module is a rewriter, so
// its expected file is the rewritten text. This one produces no text, so the expected file
// is the `file:line` list it must report, one per line. Each fixture is named for its
// extension, so the family lookup is exercised by the roster itself.
const FIXTURES = [
  ['fixtures/assert-comment-hygiene.input.ts', 'fixtures/assert-comment-hygiene.expected.ts.violations'],
  ['fixtures/assert-comment-hygiene.input.svelte', 'fixtures/assert-comment-hygiene.expected.svelte.violations'],
  ['fixtures/assert-comment-hygiene.input.sql', 'fixtures/assert-comment-hygiene.expected.sql.violations'],
  ['fixtures/assert-comment-hygiene.input.sh', 'fixtures/assert-comment-hygiene.expected.sh.violations'],
  ['fixtures/assert-comment-hygiene.input.yaml', 'fixtures/assert-comment-hygiene.expected.yaml.violations'],
  ['fixtures/assert-comment-hygiene.input.mjs', 'fixtures/assert-comment-hygiene.expected.mjs.violations']
];

/**
 * Degenerate inputs a fixture file cannot express, because a fixture that is empty of
 * comments cannot also carry a positive case. Held inline so the truths "exits 0 on a file
 * with zero comment lines" and "a line-1 `#!` shebang is not a comment-span start" have a
 * committed proof rather than a claim.
 */
const EDGE_CASES = [
  { name: 'an empty file', ext: 'ts', text: '', expected: [] },
  {
    name: 'a file with zero comment lines',
    ext: 'ts',
    text: "export const A = 'no comment anywhere in this file';\nexport const B = 2;\n",
    expected: []
  },
  { name: 'a one-line comment span, clean', ext: 'ts', text: '// nothing to see here\n', expected: [] },
  {
    name: 'a one-line comment span carrying an escape',
    ext: 'ts',
    text: '// an escape \\u2013 on the only line of the file\n',
    expected: ['edge:1']
  },
  {
    name: 'a line-1 #! shebang is not a comment span, but line 2 is',
    ext: 'sh',
    text: '#!/usr/bin/env bash \\u2013\n# a real comment carrying \\u2013\n',
    expected: ['edge:2']
  },

  // ── Rule 2 (D-A4). Ported from the phase instrument's own edge cases so the two predicates
  // are provably the same predicate rather than two that merely agree today. Each ruled
  // exclusion has a case proving it FIRES, and the three whose boundary is arguable have a
  // second case proving the boundary — an exclusion that never stops firing is an exclusion
  // that has silently switched the rule off.
  {
    name: 'rule 2 — the plain positive case, two wrapped prose lines',
    ext: 'ts',
    text: '// prose that wraps without\n// terminal punctuation.\n',
    expected: ['edge:1']
  },
  {
    name: 'rule 2 — a line ending in terminal punctuation is not a forced break',
    ext: 'ts',
    text: '// a complete sentence.\n// and the next one.\n',
    expected: []
  },
  {
    name: 'rule 2 — a comma-ended line IS a forced break (the strict reading)',
    ext: 'ts',
    text: '// a clause that ends in a comma,\n// and its continuation.\n',
    expected: ['edge:1']
  },
  {
    name: 'rule 2, PARAGRAPH_BREAK — a blank comment line ends the paragraph (Amendment 1)',
    ext: 'ts',
    text: '// first paragraph ends here\n//\n// second paragraph starts here.\n',
    expected: []
  },
  {
    // A banner blocks a join from EITHER side: it is the next line at the first junction and
    // the current line at the second.
    name: 'rule 2, BANNER_RULE — a rule line is never joined, from either side',
    ext: 'ts',
    text: '// prose with no full stop\n// ==========\n// more prose.\n',
    expected: []
  },
  {
    name: 'rule 2, BANNER_RULE — an ATX heading never absorbs the paragraph beneath it',
    ext: 'ts',
    text: '// ## Why\n// prose that wraps without\n// terminal punctuation.\n',
    expected: ['edge:2']
  },
  {
    name: 'rule 2, NEXT_IS_LIST_ITEM — a list under a lead-in is never joined',
    ext: 'ts',
    text: '// The three cases are\n// - the first\n// - the second.\n',
    expected: []
  },
  {
    name: 'rule 2, NEXT_IS_JSDOC_TAG — a tag list is never joined',
    ext: 'ts',
    text: '// Adds two numbers\n// @param a the first\n',
    expected: []
  },
  {
    name: 'rule 2, HANGING_INDENT — a deeper-indented continuation is never joined',
    ext: 'ts',
    text: '// The table below\n//    col   value\n',
    expected: []
  },
  {
    name: 'rule 2, HANGING_INDENT — an unfenced indented shell recipe is never folded into a line',
    ext: 'ts',
    text: '// Running the journey:\n//   yarn db:reset\n//   yarn dev\n//   npx playwright test\n',
    expected: []
  },
  {
    // The boundary that keeps the recipe rule honest: ordinary wrapped prose at a uniform
    // indent is NOT a code sample and still joins.
    name: 'rule 2, HANGING_INDENT — indented wrapped prose is not a code sample and still joins',
    ext: 'ts',
    text: '//   prose indented but still prose,\n//   wrapping onto a second line.\n',
    expected: ['edge:1']
  },
  {
    name: 'rule 2, COMMENT_TABLE — a pipe-table row is never joined',
    ext: 'ts',
    text: '// The table below\n// | a | b |\n',
    expected: []
  },
  {
    name: 'rule 2, COMMENT_TABLE — a column-aligned table row is never joined',
    ext: 'ts',
    text: '// The identifiers are\n// election_a:   dddddddd-0001\n// election_b:   dddddddd-0002\n',
    expected: []
  },
  {
    // The boundary that keeps the alignment alternative honest: ONE space after the colon is
    // ordinary prose and still joins. Two or more is a deliberate alignment column.
    name: 'rule 2, COMMENT_TABLE — a single space after a colon is prose, not a table',
    ext: 'ts',
    text: '// Note: the thing that wraps\n// onto a second line.\n',
    expected: ['edge:1']
  },
  {
    // Five junctions across the block, every one excluded. The prose AFTER the block still
    // joins with the line after IT — a fence must not disable the rule for the rest of the
    // comment.
    name: 'rule 2, CODE_FENCE — a fenced @example block is code, and is never folded into a line',
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
    expected: ['edge:6']
  },
  {
    // An unterminated fence must not leak past the end of its comment span, or one stray
    // backtick line would silently switch the rule off for the whole rest of the file.
    name: 'rule 2, CODE_FENCE — an unterminated fence does not leak into the next comment span',
    ext: 'ts',
    text: '// ```ts\nexport const a = 1;\n// prose that wraps without\n// terminal punctuation.\n',
    expected: ['edge:3']
  },
  {
    name: 'rule 2, TOOL_DIRECTIVE — prose never joins onto an eslint-disable-next-line',
    ext: 'ts',
    text: '// Track changes to re-enable submit after error\n// eslint-disable-next-line @typescript-eslint/no-unused-expressions\nfoo;\n',
    expected: []
  },
  {
    name: 'rule 2, TOOL_DIRECTIVE — svelte-ignore is protected too',
    ext: 'svelte',
    text: '// Update selection when filter values change\n// svelte-ignore state_referenced_locally\n',
    expected: []
  },
  {
    name: 'rule 2, BLOCK_DELIMITER — a block opener or terminator is never joined away',
    ext: 'ts',
    text: '/**\n * prose that wraps without\n * terminal punctuation.\n */\n',
    expected: ['edge:2']
  },
  {
    name: 'rule 2 — a trailing comment on a code line never joins the comment beneath it',
    ext: 'ts',
    text: 'export const a = 1; // a trailing note\n// a fresh comment line\n',
    expected: []
  },
  {
    name: 'rule 2 — two comment lines at different post-marker indents are not one paragraph',
    ext: 'ts',
    text: '  // prose that wraps without\n// terminal punctuation.\n',
    expected: []
  },
  {
    // Load-bearing for rule 2, not for rule 1: WITHOUT the classifier's NET-NEW shebang rule
    // the interpreter directive would open the span and line 1 would be reported too.
    name: 'rule 2 — a line-1 #! shebang never opens a paragraph the line below continues',
    ext: 'sh',
    text: '#!/usr/bin/env bash\n#a line that would join if the shebang were a comment\n#and this one continues it.\n',
    expected: ['edge:2']
  }
];

function locationsOf(findings) {
  return findings.map((finding) => finding.location);
}

/** Serialise a location list the way the `.violations` files hold it: one per line. */
function serialise(locations) {
  return locations.length === 0 ? '' : `${locations.join('\n')}\n`;
}

function selfTest() {
  let failures = 0;
  console.log('PHASE 152 — comment hygiene guard (SELF-TEST)\n');

  for (const [inRel, expRel] of FIXTURES) {
    const inPath = path.resolve(SCRIPT_DIR, inRel);
    const expPath = path.resolve(SCRIPT_DIR, expRel);

    let input;
    try {
      input = readFileSync(inPath, 'utf-8');
    } catch (error) {
      failures++;
      console.error(`[ERROR] ${SELF}: could not read fixture '${inRel}' (${error.message}).`);
      continue;
    }

    const actual = serialise(locationsOf(scanText(inRel, input, familyFor(inRel))));

    if (EMIT_FIXTURES) {
      writeFileSync(expPath, actual, 'utf-8');
      console.log(`  ~ ${expRel} regenerated (review it by hand before committing)`);
      continue;
    }

    let expected;
    try {
      expected = readFileSync(expPath, 'utf-8');
    } catch (error) {
      failures++;
      console.error(`[ERROR] ${SELF}: could not read expected file '${expRel}' (${error.message}).`);
      continue;
    }

    if (actual === expected) {
      console.log(`  ✓ ${inRel}  (violations: ${actual === '' ? 0 : actual.trimEnd().split('\n').length})`);
      continue;
    }

    failures++;
    console.log(`  ✗ ${inRel}`);
    const a = actual.split('\n');
    const b = expected.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] === b[i]) continue;
      console.log(`      L${i + 1}`);
      console.log(`        actual  : ${JSON.stringify(a[i])}`);
      console.log(`        expected: ${JSON.stringify(b[i])}`);
    }
  }

  if (EMIT_FIXTURES) {
    console.log('\nMODE: emit-fixtures (expected files rewritten; no source file was touched).');
    return 0;
  }

  console.log('');
  for (const edge of EDGE_CASES) {
    const actual = locationsOf(scanText('edge', edge.text, FAMILY_BY_EXT[edge.ext]));
    if (serialise(actual) === serialise(edge.expected)) {
      console.log(`  ✓ edge case: ${edge.name}`);
      continue;
    }
    failures++;
    console.log(`  ✗ edge case: ${edge.name}`);
    console.log(`        actual  : ${JSON.stringify(actual)}`);
    console.log(`        expected: ${JSON.stringify(edge.expected)}`);
  }

  console.log(
    `\n── Summary ──\n  Fixtures: ${FIXTURES.length}\n  Edge cases: ${EDGE_CASES.length}\n  Failures: ${failures}`
  );
  console.log(`\n${failures === 0 ? '✓ Self-test PASSED. No file on disk was touched.' : '✗ Self-test FAILED.'}`);
  console.log('\nMODE: self-test (no files written).');
  return failures === 0 ? 0 : 1;
}

// ── Enumeration ───────────────────────────────────────────────────────────
function enumerateFiles(violate) {
  let raw;
  try {
    raw = globSync(GLOBS, { cwd: REPO_ROOT, exclude: (p) => SKIP_PATH_RE.test(`${p}/`) });
  } catch (error) {
    violate(
      `could not enumerate the scan roots ${SCAN_ROOTS.join(', ')} (${error.message}). A tree this ` +
        'guard cannot walk is hygiene it cannot verify — this fails closed.'
    );
    return null;
  }

  const byExt = raw.filter((f) => Object.hasOwn(FAMILY_BY_EXT, extensionOf(f)));

  let tracked;
  try {
    tracked = new Set(
      execFileSync('git', ['ls-files', '-z', '--', ...SCAN_ROOTS], {
        cwd: REPO_ROOT,
        maxBuffer: 64 * 1024 * 1024
      })
        .toString('utf-8')
        .split('\u0000')
        .filter(Boolean)
    );
  } catch (error) {
    violate(
      `could not read the tracked file set via 'git ls-files' (${error.message}). Without it the ` +
        'guard cannot tell a source file from generated build output, so it fails closed rather ' +
        'than reporting a scan it does not stand behind.'
    );
    return null;
  }

  const candidates = byExt.filter((f) => tracked.has(f.replaceAll('\\', '/'))).sort();

  // A stale exclusion is a silent hole: the file it names is renamed or deleted, the entry stops
  // matching anything, and the list keeps asserting a decision about a file that is not there.
  // Every entry must still name a real scannable file, or this fails closed.
  for (const [rel, reason] of VENDORED_EXCLUSIONS) {
    if (candidates.includes(rel)) continue;
    violate(
      `the vendored exclusion '${rel}' (${reason}) matches no tracked, scannable file under ` +
        `${SCAN_ROOTS.join(', ')}. An exclusion that excuses nothing is a hole nobody can see — ` +
        'delete the entry or correct the path.'
    );
  }

  const files = candidates.filter((f) => !VENDORED_EXCLUSIONS.has(f));

  if (files.length === 0) {
    violate(
      `no tracked, scannable file matched ${GLOBS.join(' ')}. A guard that scans nothing reports a ` +
        'green that means nothing — this fails closed.'
    );
    return null;
  }

  return files;
}

// ── Main ──────────────────────────────────────────────────────────────────
function printUsage() {
  console.log(
    [
      'COMMENT HYGIENE GUARD (phase 152, requirement REVIEW-HYG-01)',
      '',
      'Usage:',
      '  node scripts/assert-comment-hygiene.mjs                 scan apps/, packages/, tests/',
      '  node scripts/assert-comment-hygiene.mjs --self-test     run the committed fixtures',
      '  node scripts/assert-comment-hygiene.mjs --emit-fixtures regenerate expected files',
      '',
      'There is no flag that narrows, widens or waives the scan. See this file for why.'
    ].join('\n')
  );
}

function main() {
  const unknown = argv.filter((a) => a.startsWith('-') && !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(
      `[ERROR] ${SELF}: unknown flag '${unknown[0]}'. This guard takes no scan-narrowing arguments; ` +
        `run it with --help to see the three it does accept.`
    );
    process.exitCode = 1;
    return;
  }

  if (argv.includes('-h') || argv.includes('--help')) {
    printUsage();
    process.exitCode = 0;
    return;
  }

  if (SELF_TEST || EMIT_FIXTURES) {
    process.exitCode = selfTest();
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    console.error(`[ERROR] ${SELF}: ${message}`);
  };

  const files = enumerateFiles(violate);
  if (files === null) {
    process.exitCode = 1;
    return;
  }

  let scanned = 0;
  for (const rel of files) {
    let text;
    try {
      text = readFileSync(path.resolve(REPO_ROOT, rel), 'utf-8');
    } catch (error) {
      violate(
        `could not read '${rel}' (${error.message}). A file this guard cannot read is hygiene it ` +
          'cannot verify, and an unreadable file is never read as clean — this fails closed.'
      );
      continue;
    }
    scanned++;

    for (const finding of scanText(rel, text, familyFor(rel))) {
      violate(`${finding.location}: ${finding.message}`);
    }
  }

  console.log(
    `Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: ${scanned}; ` +
      `vendored files excluded by name: ${VENDORED_EXCLUSIONS.size} ` +
      `(${[...VENDORED_EXCLUSIONS.keys()].join(', ')}); ` +
      `rules live: 2 of 2 (unicode-escape-in-comment; forced-line-break). ` +
      `${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

main();
