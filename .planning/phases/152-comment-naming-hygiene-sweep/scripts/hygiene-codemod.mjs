#!/usr/bin/env node
/**
 * PHASE 152 (plan 02, criterion 2 / REVIEW-HYG-02) — Codemod: strip leaked planning
 * references from COMMENT SPANS ONLY, and report everything it declines to rewrite.
 *
 * ── PROVENANCE, AND THE FOUR CHANGES ────────────────────────────────────────
 * This file is a RETARGETED COPY of
 * `.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` (935 lines, fixture-tested,
 * `--self-test` green at the time of the copy). The original is a D-15 exempt tree and this
 * phase's shipped procedure; it is NOT modified. This copy diverges from it in exactly four
 * places, each recorded at its site with the tag `PHASE-152 CHANGE (n)`:
 *
 *   (1) RULE 6 IS INVERTED. The source COLLAPSES `Phase 88` → `see phase 88`, the survivor
 *       form Phase 151's D-14 authorised. Phase 152's REVIEW-HYG-02 authorises no survivor
 *       at all — "no historical narrative, planning-artifact path, phase or plan number, or
 *       decision id survives". So `phase-ref` and `spike-ref` are DEMOTED TO RESIDUE
 *       (`phase-ref-deferred` / `spike-ref-deferred`), never rewritten, and the whole
 *       744-occurrence phase-reference class and 40-occurrence spike-reference class is
 *       owned by the agent judgement pass in waves 4-5.
 *       Why demote rather than delete-and-repair: attributive references (hard exclusion (h))
 *       — "Mirrors the Phase 64 fix", "went bare in Phase 113" — cannot be regex-repaired
 *       into a grammatical sentence. 113 of 704 were measured attributive at Phase-151 time.
 *       Widening a regex at exactly this point is how the incident recorded at
 *       `.claude/skills/ship-review-stack/SKILL.md:314` happened: 38 broken comments in the
 *       test tree, 28 in the routing surface, 6 in the components.
 *   (2) SCOPE IS NARROWED to code under `apps/**`, `packages/**` and `tests/**`. The source's
 *       default globs included `.md`, which produced 40 `markdown-file` residue rows on the
 *       dry run. `.md` stays mapped to an EMPTY comment family, so any `.md` reached through
 *       an explicit `--files` glob still lands in residue rather than being rewritten.
 *   (3) EVERY HARD EXCLUSION (a)-(h) AND EVERY STRUCTURAL GUARANTEE IS KEPT, unrelaxed.
 *       Each is a measured hazard, not a hypothesis. See the list below.
 *   (4) THE RELOCATION TRAIL IS FIXED and the fixture set is EXTENDED with a case covering
 *       the changed rule 6. A codemod whose fixtures do not cover the rule that changed is
 *       untested at exactly the point it changed.
 *
 * Verdict authority is still split: this script owns the deterministic half of comment
 * hygiene, and hands the judgement half to the phase's file-by-file agent pass. The split is
 * not stylistic — 126 of the matched lines are NOT comment-shaped and include a runtime
 * user-visible `console.warn` string, Playwright test titles, and an ESLint rule `message:`.
 * A regex-only pass over all of them would edit program behaviour.
 *
 * ⚠ STANDING CONSTRAINT — NO DASH RULE OF ANY KIND, and one must never be added "while
 * we're in there". 212 comment lines in these trees use a double-hyphen as a dash, and two
 * of them — `apps/frontend/src/hooks.server.ts:1` and `apps/frontend/src/hooks.ts:1` — are
 * ESLint disable-directive rule-description separators, where a rewrite changes the
 * DIRECTIVE'S PARSE and could silently disable `func-style` across the whole frontend. A
 * further 3,025 comment lines already carry real em/en dash characters and are correct as
 * they stand. D-A5(b) (normalise the double-hyphens) and D-A5(c) (flatten every dash to a
 * plain hyphen) were both explicitly considered and REJECTED. A rule of that shape would
 * fail on 3,237 lines on its first run.
 *
 * ⚠ STANDING CONSTRAINT — THE `hits + residue == total` BALANCE IS A COMPLETENESS CHECK,
 * NEVER A CORRECTNESS ONE. It proves that every occurrence the pattern set found was
 * classified exactly once. It cannot prove that any one of those classifications was right.
 * `.claude/skills/ship-review-stack/SKILL.md:265` records six Phase-151 artifacts that were
 * self-consistent and wrong, with this balance green throughout. A green balance is never
 * accepted as evidence that the rewrite was correct; the diff review and the residue
 * hand-review are, and neither substitutes for the other.
 *
 * Mirrors the two in-repo codemod precedents (apps/frontend/scripts/store-to-state-codemod.mjs
 * and .../flatten-current-codemod.mjs): `globSync` enumeration with an explicit empty-match
 * hard failure, dry-run by default, `--apply` to write, `--files <glob>` to restrict scope,
 * a warn-only second pass that REPORTS residue without rewriting it, and a final line that
 * always states which mode ran.
 *
 * ── ORDERED MECHANICAL RULES (RESEARCH § Pattern 4, rules 1-7) ───────────────
 * Applied in this order, left to right, and ONLY inside a classified comment span:
 *
 *   1. artifact-path      delete `.planning/...` paths (backticks included) and the bare
 *                         `NN-DOCNAME.md` / `NN-NN-DOCNAME.md` artifact-filename form.
 *   2. section-anchor     delete NUMERIC-leading anchors (`§9`, `§ 22`, `§17-22`).
 *   3. plan-number        delete `Plan 88-02` / `plan 122.03`.
 *   4. decision-id        delete `D-137-11` (long) and `D-13` (bare, with the `(?!-\d{2})`
 *                         guard that stops the bare form eating the long form's prefix),
 *                         plus the bare-uppercase task-ID class that travels with them
 *                         (`SWEEP-03`, `FLATTEN-02`, `EPERM-07`, …) — the same class under
 *                         a different spelling.
 *   5. milestone-version  DISABLED. Reported as residue, never rewritten (see below).
 *   6. defer              PHASE-152 CHANGE (1) — INVERTED. In the source this rule COLLAPSED
 *                         `Phase 88` → `see phase 88` and `Spike-024` → `see spike 024`.
 *                         Here it rewrites NOTHING: every `phase-ref` and `spike-ref` match
 *                         is reported as residue under `phase-ref-deferred` /
 *                         `spike-ref-deferred` (or, where exclusion (g) or (h) fires first,
 *                         under `ambiguous-reference` / `attributive-reference` — all three
 *                         reasons route to the same judgement pass). The collapsed survivor
 *                         form is never emitted. Leaving the source rule as-is would have
 *                         CREATED 60 more `see phase N` lines that this same phase then has
 *                         to delete, and would have left 642 already-collapsed lines
 *                         invisible to a gate that reads the `bare` column.
 *   7. degenerate-line    a comment-only line that becomes empty or punctuation-only after
 *                         1-6 is deleted whole.
 *
 * Deletions leave a NUL sentinel that a repair pass consumes, so whitespace and punctuation
 * are only normalised in the immediate neighbourhood of a removal. Aligned comment tables
 * elsewhere on the same line are left byte-identical.
 *
 * ── HARD EXCLUSIONS (each one is a measured hazard, not a hypothetical) ──────
 *  (a) COMMENT-SPAN CLASSIFIER. A rewrite happens only inside a span the classifier
 *      returns. The classifier is a per-file state machine over four comment families —
 *      C-family `//` line and slash-star block (with its `*` continuation), markup `<!-- -->`,
 *      SQL `--`,
 *      and shell/TOML/YAML `#` — with quote tracking (including multi-line template
 *      literals) so a `//` inside a string literal is not mistaken for a comment. C-6
 *      requires SQL and shell support: without it nine files are silently skipped or,
 *      worse, wrongly rewritten. Everything outside a span is left byte-identical and is
 *      emitted to the residue report.
 *  (b) D-15 EXEMPT TREES. `CLAUDE.md`, `.agents/`, `.claude/` and `.planning/` are
 *      agent-facing planning infrastructure, not shipped source. The scan refuses to open
 *      any path under them WHATEVER `--files` glob it is handed — the exemption is enforced
 *      in code, not by convention.
 *  (c) MILESTONE VERSIONS. `v\d+\.\d+` matches `Yarn 4.13`, `Node 22.22.1`,
 *      `playwright:v1.58.2-noble` and `Svelte 5` as readily as a `v2.11` milestone tag
 *      (RESEARCH Pitfall 6). Report-only; routed to the agent pass.
 *  (d) TODO / FIXME / HACK / XXX. 65 occurrences across 49 files. These are statements
 *      about the code's FUTURE, not leaked artifacts of how it was planned. D-14 does not
 *      authorise deleting them and this codemod never touches them. They are scanned only
 *      so that they are provably reported rather than silently ignored.
 *  (e) MARKDOWN FILES. Prose end to end, with different comment semantics — the whole file
 *      is effectively a comment span, so the classifier's safety argument does not hold.
 *      Routed whole to the agent pass. PHASE-152 CHANGE (2): `.md` is additionally OUT OF
 *      THE DEFAULT GLOB SET, so it is not even enumerated; the empty-family mapping is kept
 *      as the second line of defence for an explicit `--files` glob.
 *  (f) UNSTRIPPABLE SECTION ANCHORS. `§Context Destructuring Rule`, `§Pitfall 7`,
 *      `§"Seeding local data"` — a TITLED anchor has no mechanical end boundary, so deleting
 *      `§`+token mangles the prose that follows. Numeric-leading anchors DO have one and
 *      are rule 2; everything else is residue. The pattern set ends in a bare `§` so it is
 *      EXHAUSTIVE over the sign: an anchor shape nobody anticipated is reported, not dropped.
 *  (h) ATTRIBUTIVE REFERENCES. The collapsed form reads correctly in CITATION position
 *      (`see phase 61.`) and incorrectly in ATTRIBUTIVE position: `Mirrors the Phase 64 fix`
 *      would become `Mirrors the see phase 64 fix`, and `went bare in Phase 113` would
 *      become `went bare in see phase 113`. Measured, that is 113 of 704 phase references
 *      and 5 of 41 spike references — 16% of the surface. That measurement is the reason
 *      PHASE-152 CHANGE (1) demotes the whole class rather than swapping collapse for
 *      delete-and-repair: a mid-sentence DELETION of an attributive reference leaves
 *      grammatical rubble no mechanical repair can fix, exactly as a collapse leaves
 *      ungrammatical prose. Both need a human sentence. The exclusion is KEPT and still
 *      classified separately, so the attributive subset stays visible in the residue table
 *      as its own reason rather than being folded invisibly into the deferred bulk.
 *      Consequence, stated plainly: the `phase-ref` / `spike-ref` gate rows are still red
 *      after this codemod runs, and only the agent judgement pass can turn them green.
 *  (g) AMBIGUOUS PHASE / SPIKE WORDS. `# PHASE 1: JSONB Schema` (a benchmark script's own
 *      stage marker) and `// PHASE 2: PREPARE LLM INPUTS` (an algorithm stage) are not
 *      planning citations, and `spike-009-store-codemod.mjs` is a filename, not a spike
 *      reference. Collapsing them would produce a confidently wrong comment. Residue.
 *
 * ── Idempotency guarantee ───────────────────────────────────────────────────
 * Structural, per rule. Rules 1-4 DELETE their match, so after `--apply` no match remains
 * for a second run to find. Rule 6 now writes nothing at all (PHASE-152 CHANGE (1)), which
 * is a stronger fixed point than the source's rewrite-to-identical-text argument. Rule 7
 * only fires on a line the earlier rules changed. A second run therefore reports
 * `Files rewritten: 0`.
 *
 * ── Counting contract (the residue report is a handoff, not decoration) ─────
 * Every occurrence the pattern set finds is classified exactly once, as either a rule hit
 * or a residue item with a reason. Overlapping occurrences (a `v2.11` INSIDE a `.planning/`
 * path that rule 1 already deletes) are attributed to the earlier rule and counted once —
 * the count of those absorbed occurrences is printed separately so the arithmetic is
 * auditable. `hits + residue == total`, always, and the summary asserts it.
 *
 * Default: dry-run (prints what WOULD change, writes nothing, exit 0).
 * --apply:              actually write the changes.
 * --files <glob>:       replace the default in-scope globs (repeatable).
 * --residue-out <path>: write the residue table as TSV (path, line, reason, text).
 * --json-out <path>:    write the machine-readable summary as JSON.
 * --quiet:              summary only, no per-file detail.
 * --self-test:          run the committed fixtures through the transform and diff them against
 *                       the committed expected outputs. Writes nothing. Exit 1 on mismatch.
 * --emit-fixtures:      with --self-test, (re)write the `.expected.*` files from the current
 *                       transform. The regenerated files are then READ AND REVIEWED BY HAND
 *                       before they are committed -- an expected file that was never read is
 *                       a tautology, not a test.
 *
 * Usage (run from the repo root) — PHASE-152 CHANGE (4), the relocation trail:
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs --self-test
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs --apply
 *   node .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs --files 'packages/**'
 *
 * Exit codes -- the caller must be able to branch on the status alone:
 *   0  dry-run or apply completed; or --self-test passed
 *   1  the glob matched no file, or --self-test failed
 *   2  usage error, or the D-15 exemption guard fired
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SENTINEL = '\u0000';
// PHASE-152 CHANGE (6). A SECOND sentinel, live only inside `repair()`. Step 6 converts the
// deletion sentinel into this mark rather than straight into a space, so the enclosure and
// punctuation rules that follow can REQUIRE it as an anchor. Without it those rules are
// global over the line and reach text no deletion ever touched — the three measured
// incidents are named at `repair()` step 6. It is removed again at step 9 and never
// reaches a file.
const MARK = '\u0001';

// ── CLI args ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const SELF_TEST = argv.includes('--self-test');
const QUIET = argv.includes('--quiet');
const EMIT_FIXTURES = argv.includes('--emit-fixtures');

function valueOf(flag) {
  const i = argv.indexOf(flag);
  if (i < 0) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) {
    console.error(`hygiene-codemod.mjs: ${flag} needs a value`);
    process.exit(2);
  }
  return v;
}

function valuesOf(flag) {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== flag) continue;
    const v = argv[i + 1];
    if (!v || v.startsWith('--')) {
      console.error(`hygiene-codemod.mjs: ${flag} needs a value`);
      process.exit(2);
    }
    out.push(v);
  }
  return out;
}

const KNOWN_FLAGS = new Set([
  '--apply',
  '--self-test',
  '--quiet',
  '--emit-fixtures',
  '--files',
  '--residue-out',
  '--json-out',
  '-h',
  '--help'
]);
// PHASE-152 CHANGE (5) — this file is now BOTH a script and a module. The three sibling
// instruments (`uk-identifier-audit.mjs`, `assert-comment-only-diff.mjs`,
// `unwrap-comment-paragraphs.mjs`) all need this file's comment-span classifier, its family
// table, its D-15 exemption and its tracked-set enumeration. The alternative was three more
// hand-copies of a state machine that this phase already carries TWO of (here, and in
// `scripts/assert-comment-hygiene.mjs`), each of which has to be kept in sync by hand. Three
// more would make that unkeepable. So the CLI half is fenced behind `IS_MAIN` and the
// classifier half is exported. `import`ing this file now runs no enumeration, parses no
// argv, and writes nothing.
//
// The fence is `process.argv[1]`-based rather than `import.meta.main`, which is Node 24+;
// this repo runs Node 22.
const IS_MAIN = process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

// Flag VALUES are resolved only when this file is the entry point. `valueOf`/`valuesOf` exit
// the process on a malformed flag, so an importer whose own argv happens to contain `--files`
// or `--json-out` must never reach them.
let RESIDUE_OUT = null;
let JSON_OUT = null;
let USER_GLOBS = [];

if (IS_MAIN) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--') && !a.startsWith('-')) continue;
    if (!KNOWN_FLAGS.has(a)) {
      console.error(`hygiene-codemod.mjs: unknown flag: ${a}`);
      process.exit(2);
    }
    if (a === '--files' || a === '--residue-out' || a === '--json-out') i++;
  }
  RESIDUE_OUT = valueOf('--residue-out');
  JSON_OUT = valueOf('--json-out');
  USER_GLOBS = valuesOf('--files');
}

export const REPO_ROOT = resolve(process.cwd());

// ── D-15 exemption (b): enforced in code, not by convention ───────────────
export const EXEMPT_PREFIXES = ['.planning/', '.claude/', '.agents/'];
export const EXEMPT_FILES = ['CLAUDE.md'];

export function isExempt(rel) {
  const p = rel.replaceAll('\\', '/');
  return EXEMPT_PREFIXES.some((pre) => p === pre.slice(0, -1) || p.startsWith(pre)) || EXEMPT_FILES.includes(p);
}

// Generated / vendored trees. Rewriting these would be meaningless at best and would
// produce a dirty tree the operator has to unpick at worst.
export const SKIP_PATH_RE =
  /(^|\/)(node_modules|\.svelte-kit|\.turbo|\.yarn|\.git|dist|build|coverage|playwright-report|playwright-results[\w-]*|test-results|e2e-runs|paraglide|project\.inlang|snippets)\//;

// ── Comment families, by extension ────────────────────────────────────────
// c    : `//` line, `/* */` block (and its `*` continuation, which the block state
//        machine covers without a special case)
// html : `<!-- -->`
// hash : `#` to end of line
// sql  : `--` to end of line
export const FAMILY_BY_EXT = {
  ts: { c: true },
  tsx: { c: true },
  mts: { c: true },
  cts: { c: true },
  js: { c: true },
  mjs: { c: true },
  cjs: { c: true },
  jsx: { c: true },
  css: { c: true },
  scss: { c: true },
  svelte: { c: true, html: true },
  html: { html: true },
  xml: { html: true },
  storyboard: { html: true },
  sql: { c: true, sql: true },
  sh: { hash: true },
  bash: { hash: true },
  zsh: { hash: true },
  toml: { hash: true },
  yml: { hash: true },
  yaml: { hash: true },
  // Markdown is prose end to end (exclusion e). Listed with NO comment family so every
  // occurrence in a `.md` file lands in the residue report under `markdown-file`.
  md: {}
};

// PHASE-152 CHANGE (2) — scope narrowed. The source built its default globs from EVERY key
// of `FAMILY_BY_EXT`, `md` included, and the dry run then reported 40 `markdown-file` residue
// rows for files this phase's criterion does not cover. `md` is filtered out of the DEFAULT
// glob set here, while its empty-family mapping above is deliberately KEPT: a `.md` reached
// through an explicit `--files` glob must still land in residue rather than be rewritten.
// The three scan roots are the phase's whole scope: `apps/**`, `packages/**`, `tests/**`.
export const SCAN_EXTS = Object.keys(FAMILY_BY_EXT);
export const CODE_EXTS = SCAN_EXTS.filter((ext) => ext !== 'md');
export const SCAN_ROOTS = ['apps', 'packages', 'tests'];
export const DEFAULT_GLOBS = SCAN_ROOTS.map((root) => `${root}/**/*.{${CODE_EXTS.join(',')}}`);

// ── The pattern set ───────────────────────────────────────────────────────
// `kind` is the disposition when the occurrence IS inside a comment span in a non-Markdown
// file. `residue` rules are scanned solely so that what they find is provably reported.
// Order is the rule order; an occurrence overlapping an earlier rule's span is attributed
// to that earlier rule and counted once.
const RULES = [
  {
    id: 'artifact-path',
    kind: 'delete',
    // `trimTrailing` shrinks the match so the sentence's own full stop is NOT deleted with
    // the path: `documented at .planning/.../61-03-DIAGNOSIS.md.` must keep its period, or
    // the repair pass has no punctuation left to reattach and the sentence loses its end.
    trimTrailing: /[.,;:]+$/,
    patterns: [/`?\.planning\/[^\s`)\]]*`?/g, /\b\d{2,3}(?:-\d{2})?-[A-Z][A-Z0-9-]*\.md\b/g]
  },
  { id: 'section-anchor', kind: 'delete', patterns: [/§[ \t]*\d[\w.–-]*/g] },
  {
    id: 'section-anchor-alpha',
    kind: 'residue',
    reason: 'unstrippable-section-anchor',
    // The trailing bare `§` makes the set EXHAUSTIVE. Without it `§"Seeding local data"`
    // matched no rule at all and six occurrences were reported by nobody (threat
    // T-151-07-03), which a raw-grep reconciliation caught and the report's own
    // arithmetic could not have.
    patterns: [/§[ \t]*[A-Za-z][^\s,;)]*/g, /§/g]
  },
  { id: 'plan-number', kind: 'delete', patterns: [/\bplans?\s+\d+[-.]\d+\b/gi] },
  { id: 'decision-id-long', kind: 'delete', patterns: [/\bD-\d{2,3}-\d{2}\b/g] },
  { id: 'decision-id-bare', kind: 'delete', patterns: [/\bD-\d{2}\b(?!-\d{2})/g] },
  { id: 'task-id', kind: 'delete', patterns: [/\b[A-Z]{3,}-\d{2}\b/g] },
  { id: 'milestone-ver', kind: 'residue', reason: 'milestone-version', patterns: [/\bv\d+\.\d+\b/g] },
  // PHASE-152 CHANGE (1) — rule 6, inverted. `kind: 'defer'` is net-new: the occurrence is
  // ENUMERATED (so it is counted, reported and handed on) and never rewritten. There is no
  // `to:` callback on either rule, and there is no replacement-string literal anywhere in
  // this file that produces the collapsed `see phase N` / `see spike N` survivor form. The
  // form appears in this file only in docblock prose describing the rule that no longer
  // emits it, and in the fixture that proves it is not emitted.
  { id: 'phase-ref', kind: 'defer', reason: 'phase-ref-deferred', patterns: [/(?:\bsee\s+)?\bphases?\s+(\d+)(?:-\d{2}\b)?/gi] },
  { id: 'spike-ref', kind: 'defer', reason: 'spike-ref-deferred', patterns: [/(?:\bsee\s+)?\bspikes?[\s–/-](\d+)/gi] },
  { id: 'todo-class', kind: 'residue', reason: 'todo-class', patterns: [/\b(?:TODO|FIXME|HACK|XXX)\b/g] }
];

const RESIDUE_REASONS = [
  'not-a-comment-span',
  'markdown-file',
  'milestone-version',
  'todo-class',
  'unstrippable-section-anchor',
  'ambiguous-reference',
  'attributive-reference',
  // PHASE-152 CHANGE (1). The two deferred-reference reasons. Together with
  // `ambiguous-reference` and `attributive-reference` these account for every `phase-ref`
  // and `spike-ref` occurrence inside a comment span: none is rewritten, all are handed to
  // the judgement pass. The three-way split is diagnostic, not dispositional.
  'phase-ref-deferred',
  'spike-ref-deferred'
];

/**
 * Exclusion (g). `PHASE 1:` in a benchmark script and `PHASE 2: PREPARE LLM INPUTS` in the
 * condensation algorithm are stage markers, not planning citations; `Phase 1:` / `Phase 2:`
 * in the pgTAP helper file are the same thing. Measured across the whole in-scope tree,
 * ALL-CAPS-then-colon plus low-number-then-colon selects exactly the 11 false positives and
 * zero genuine citations (`Phase 69:`, `Phase 67:`, `Phase 136:` are all genuine and all
 * have a number well above the threshold).
 */
function isAmbiguousPhase(matchText, line, endIdx) {
  const rest = line.slice(endIdx);
  const colonFollows = /^\s*:/.test(rest);
  if (!colonFollows) return false;
  if (/\bPHASES?\s/.test(matchText)) return true;
  const n = Number(/(\d+)/.exec(matchText)[1]);
  return n <= 4;
}

/**
 * Exclusion (h). An article or preposition immediately before the reference means the
 * reference is being used as a NAME for something ("the Phase 64 fix", "in Phase 113"),
 * not as a pointer to go and read. Inserting `see` there is ungrammatical, so the match is
 * reported instead of rewritten. An already-collapsed `see phase N` is exempt: its `see`
 * is consumed by the pattern, so the word before it is not the reference's determiner.
 */
const ATTRIBUTIVE_RE =
  /\b(?:the|a|an|in|at|by|per|of|to|for|with|from|during|between|within|through|since|until|this|that|these|those|and|or)\s*$/i;

function isAttributive(matchText, line, startIdx) {
  if (/^see\b/i.test(matchText)) return false;
  return ATTRIBUTIVE_RE.test(line.slice(0, startIdx));
}

/** Exclusion (g). `spike-009-store-codemod.mjs` is a filename; `Spikes 020-023` is a range. */
function isAmbiguousSpike(_matchText, line, endIdx) {
  return /^[-_][A-Za-z]/.test(line.slice(endIdx));
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

// ── Deletion repair ───────────────────────────────────────────────────────
/**
 * Consume the NUL sentinels a delete rule left behind, repairing punctuation and whitespace
 * ONLY in their immediate neighbourhood. There is deliberately no global multi-space
 * collapse: aligned comment tables elsewhere on the line must stay byte-identical.
 */
// Punctuation that only existed to JOIN two things, at least one of which has just been
// deleted. Orphaned separators are removed; anything outside a sentinel's immediate
// neighbourhood is never examined, so a legitimate `(a/b)` elsewhere on the line survives.
const SEP = '[\\s,;/|+&~\u00b7\u2022\u2014\u2013-]';
const NUL = '\\u0000';

function repair(text, guardEnd) {
  const head = text.slice(0, guardEnd);
  let s = text.slice(guardEnd);

  // 0. A connective whose ONLY object was the deleted reference goes with it. Anchored on
  //    the sentinel, so a line-final `of` that still has its object on the NEXT line is
  //    left alone:  `documented at <ref>.`  ->  `documented.`
  s = s.replace(
    /[ \t]+\b(?:at|in|on|to|from|per|see|and|of|for|with|via|by|under|near|about|cf)\b[ \t]*\u0000[ \t]*([.,;:]?)[ \t]*$/i,
    '$1'
  );
  // 0b. A connective introducing a label that was itself the deleted reference:
  //    `load-bearing for FLATTEN-02: the trackingService`  ->  `load-bearing: the ...`
  s = s.replace(/[ \t]+\b(?:at|in|on|to|from|per|see|and|of|for|with|via|by|under)\b[ \t]*\u0000[ \t]*([,;:])/i, '$1');
  // 0c. A deletion sandwiched between two connectives takes the FIRST of them, which was
  //    its own preposition:  `refinement of <ref> for the seam`  ->  `refinement for the`.
  s = s.replace(
    /[ \t]+\b(?:at|in|on|to|from|per|of|for|with|via|by|under)\b[ \t]*\u0000[ \t]*(?=\b(?:at|in|on|to|from|per|of|for|with|via|by|under)\b)/i,
    ' '
  );
  // 1. Two deletions that were joined by a separator collapse to one sentinel.
  while (new RegExp(NUL + SEP + '*' + NUL).test(s)) {
    s = s.replace(new RegExp(NUL + SEP + '*' + NUL, 'g'), SENTINEL);
  }
  // 2. A deletion at the very head of the comment BODY takes the connective that
  //    introduced it:  `--   SCHM-01: customization`  ->  `--   customization`.
  s = s.replace(/^\u0000[ \t]*[,;:.\u2014\u2013-][ \t]*/, '');
  //    ...and a head deletion with no connective simply vanishes; the opener's own
  //    trailing whitespace already separates it from what follows.
  s = s.replace(/^\u0000[ \t]*/, '');
  // 3. A sentinel hard against an opening bracket takes the orphaned separators with it.
  s = s.replace(
    new RegExp(
      '([([{])[ \\t]*(?:\\b(?:at|in|on|to|from|per|see|of|for|with|via|by|under|cf)\\b[ \\t]*)?' +
        SEP +
        '*' +
        NUL +
        SEP +
        '*[,;:]?[ \\t]*',
      'gi'
    ),
    // PHASE-152 CHANGE (6): leave a MARK behind rather than nothing. Step 7 needs to
    // distinguish `(<deleted>)` — which must go — from a `()` that was ALREADY empty in
    // the source, such as `.strict()` or `import()`, which must survive byte-identical.
    // Without the mark, step 7's rule had to be global, and it ate both.
    '$1' + MARK
  );
  // 4. Same against a closing bracket.
  s = s.replace(new RegExp(SEP + '*' + NUL + SEP + '*([)\\]}])', 'g'), '$1');
  // 4b. An INFIX separator whose other operand was deleted is orphaned:
  //    `see phase 134 / <deleted> Option A`  ->  `see phase 134 Option A`.
  //    `,` and `;` are deliberately NOT in this class: after a deletion they are almost
  //    always the sentence's own punctuation, which step 5 preserves.
  s = s.replace(new RegExp('[ \\t]*[/|+&~][ \\t]*' + NUL, 'g'), SENTINEL);
  s = s.replace(new RegExp(NUL + '[ \\t]*[/|+&~][ \\t]*', 'g'), SENTINEL);
  // 5. A sentinel immediately before sentence punctuation leaves the punctuation attached.
  s = s.replace(new RegExp(SEP + '*' + NUL + '[ \\t]*([,;.:!?])', 'g'), '$1');
  // 6. Anything still standing becomes a MARK: a placeholder that reads as one space and
  //    REMEMBERS that a deletion happened at this offset. It absorbs the horizontal
  //    whitespace that surrounded the removed text. There is deliberately NO global
  //    multi-space collapse: aligned comment tables elsewhere on the line stay
  //    byte-identical.
  //
  //    PHASE-152 CHANGE (6) — the mark exists because steps 7 and 8 used to be GLOBAL.
  //    This function's own docblock promises to repair "ONLY in their immediate
  //    neighbourhood ... anything outside a sentinel's immediate neighbourhood is never
  //    examined", and three of its rules broke that promise. Measured on the real apply
  //    over apps/**, packages/** and tests/**, not reasoned about:
  //
  //      (i)   the global empty-parenthesis rule deleted PRE-EXISTING empty parentheses
  //            anywhere on the line. `.strict()` became `.strict `, `import()` became
  //            `import `, and `z.record(z.string(), z.unknown())` became
  //            `z.record(z.string, z.unknown)` — a FALSIFIED code sample in a docblock,
  //            on a line whose actual deletion was somewhere else entirely.
  //      (ii)  the global punctuation-adjacency rule ate the space before any
  //            sentence-leading `.`: `covered only .ts and .svelte` became
  //            `covered only.ts and.svelte`. Nowhere near the deletion at all.
  //      (iii) a deletion BETWEEN backticks left the pair as a hollow backtick-space-
  //            backtick, which the old doubled-backtick rule never matched, because
  //            step 6 had already put a space between them.
  //
  //    All three are now anchored on the mark, so a construct the deletion never touched
  //    is never examined. That is the contract this docblock always claimed to keep.
  s = s.replace(/[ \t]*\u0000[ \t]*/g, MARK);
  // 7. Enclosures THE DELETION emptied, absorbing one adjacent space. The mark must be
  //    INSIDE the enclosure: a `()` that was already empty in the source carries no mark
  //    and survives byte-identical.
  const dropEnclosure = (m, offset) => (offset === 0 ? /^[ \t]*/.exec(m)[0] : MARK);
  s = s.replace(/[ \t]*\(\u0001\)[ \t]*/g, dropEnclosure);
  s = s.replace(/[ \t]*\[\u0001\][ \t]*/g, dropEnclosure);
  //    ...and a code span whose entire content was the deleted reference. Same rule: the
  //    mark must sit between the two backticks, so a hand-written empty pair survives.
  s = s.replace(/[ \t]*`\u0001`[ \t]*/g, dropEnclosure);
  //    ...and the connective the now-empty enclosure was attached to:
  //    `  (D-05), which auto-scopes`  ->  `  which auto-scopes`.
  s = s.replace(/^([ \t]*)[,;:]\u0001/, '$1\u0001');
  // 8. Residual punctuation adjacency, ANCHORED ON THE MARK so that text the deletion
  //    never reached is not reflowed.
  s = s.replace(/\u0001+([,;.:!?)\]])/g, '$1');
  s = s.replace(/,\u0001*([.;:])/g, '$1');
  //    ...and a mark left hard against an opening bracket by step 3, where the closing
  //    partner was NOT adjacent so step 7 did not drop the pair: `(<deleted> the rule)`
  //    must read `(the rule)`, not `( the rule)`.
  s = s.replace(/([([{])\u0001+/g, '$1');
  // 9. A RUN of marks is one mark: two deletions either side of a construct step 7 removed
  //    ('Phase 88 <plan> (<decision>) and' -> mark mark 'and') would otherwise read as two
  //    spaces. Collapsing marks, not spaces, is what keeps an aligned comment table
  //    elsewhere on the line byte-identical.
  s = s.replace(/\u0001+/g, MARK);
  //    The mark then becomes the ordinary space it always read as; one that ended up at
  //    the end of the line goes with the rest of the trailing whitespace.
  s = s.replaceAll(MARK, ' ');
  s = s.replace(/[ \t]+$/, '');
  return head + s;
}

/**
 * The comment opener is NOT part of the body and must survive the repair pass untouched.
 * `-` and `/` are separator characters, so an unguarded repair regex will happily eat the
 * `--` of a SQL comment or the `//` of a line comment when a deletion sits right after it.
 * Returns the index just past the opener token and its trailing whitespace.
 */
export const OPENER_RE = /^([ \t]*)(\/\/+|\/\*+\*?|\*+|<!--|-{2,}|#+)([ \t]*)/;

export function openerEnd(line, spans) {
  if (spans.length === 0) return 0;
  const [spanStart] = spans[0];
  const m = OPENER_RE.exec(line.slice(spanStart));
  return m ? spanStart + m[0].length : spanStart;
}

/**
 * Warn-only prose check (the flatten-current-codemod.mjs PASS 2 shape). A MID-sentence
 * deletion can leave grammatical rubble no mechanical repair can fix: `As of Plan 88-02 the
 * selected election` becomes `As of the selected election`. Such lines ARE rewritten -- the
 * reference is gone, which is what criterion 3 asks for -- but they read badly, so they are
 * printed and counted as the judgement pass's prose-polish queue. A flag here is a request for a
 * human sentence, not a defect in the rewrite.
 */
const PROSE_SUSPECT_RES = [
  /\b(?:as of|according to|introduced by|documented in|described in|defined in)\s+(?:the|a|an|and|is|are|was|were|it|its|this|that)\b/i,
  /\b(?:see|per|cf)\s+(?:for|the|a|an|and|in|at|to|is|are)\b/i,
  /\b(?:see|per|cf)\s+\u00a7/i,
  /\b(?:of|for|in|at|to|from|with|by|per|on)\s+(?:of|for|in|at|to|from|with|by|per|on)\b/i,
  /\b(?:at|in|on|to|from|of|for|with|via|by|under)[ \t]*[,;:]/i,
  /\([ \t]*[,;:/|]/,
  /[,;][ \t]*[)\]]/
];

function proseSignature(text) {
  return PROSE_SUSPECT_RES.map((re) => (re.test(text) ? '1' : '0')).join('');
}

/** True when `after` trips a suspicion `before` did not — not merely "trips any". */
function newlyProseSuspect(before, after) {
  const b = proseSignature(before);
  const a = proseSignature(after);
  return [...a].some((bit, i) => bit === '1' && b[i] === '0');
}

/**
 * PHASE-152 CHANGE (1) — the source's `dedupePointers()` helper is DELETED, not disabled.
 * Its whole job was to fold consecutive duplicates of the collapsed survivor form
 * (`see phase 62 see phase 62` → one pointer), a form this copy never emits. Keeping it
 * would have left the only remaining literal of that form in this file inside a live
 * rewriting code path, where a later reader could not tell dead code from policy — and it
 * would have quietly rewritten a PRE-EXISTING collapsed pair on any line an earlier rule
 * happened to touch, which is a rewrite this phase's disposition does not authorise.
 */

/**
 * Rule 7. A comment-ONLY line whose body is empty or punctuation-only after rules 1-6 is
 * deleted whole. Lines carrying a block delimiter are never deleted — removing a `/**` or
 * a block terminator would break the block the classifier depends on.
 */
const DEGENERATE_BODY_RE = /^[\s—–*_=~.,;:()[\]`|/#+-]*$/;

function isDegenerateCommentLine(line, spans) {
  if (spans.length !== 1) return false;
  const [s, e] = spans[0];
  if (line.slice(0, s).trim() !== '') return false;
  if (line.slice(e).trim() !== '') return false;
  const body = line.slice(s, e);
  if (/\/\*|\*\/|<!--|-->/.test(body)) return false;
  if (/^\s*#!/.test(line)) return false; // shebang
  return DEGENERATE_BODY_RE.test(body);
}

// ── Transform ─────────────────────────────────────────────────────────────
/**
 * Classify and rewrite one file's text. Returns the new text, the per-rule hit list, the
 * residue list, and the count of occurrences absorbed by an earlier rule's span.
 */
function transform(relPath, original) {
  const ext = (relPath.split('.').pop() || '').toLowerCase();
  const fam = FAMILY_BY_EXT[ext] || {};
  const isMarkdown = ext === 'md';

  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false };
  const hits = [];
  const residue = [];
  const prose = [];
  let absorbed = 0;

  const lines = original.split('\n');
  const out = [];
  const deletedLines = [];

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    // Snapshot BEFORE the classifier advances: rule 7's re-classification of the rewritten
    // line must start from the same block state this line started from, or a `*`
    // continuation line inside a block comment classifies as code and can never be deleted.
    const stateBefore = { ...state };
    const spans = commentSpans(line, fam, state);

    // 1. Enumerate every occurrence, in rule order, discarding overlaps with an
    //    already-claimed interval (attributed to the earlier rule, counted once).
    const claimed = [];
    const found = [];
    for (const rule of RULES) {
      for (const re of rule.patterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line)) !== null) {
          if (m[0].length === 0) {
            re.lastIndex++;
            continue;
          }
          let text = m[0];
          if (rule.trimTrailing) text = text.replace(rule.trimTrailing, '');
          if (text.length === 0) continue;
          const start = m.index;
          const end = start + text.length;
          if (claimed.some(([s, e]) => start < e && end > s)) {
            absorbed++;
            continue;
          }
          claimed.push([start, end]);
          found.push({ rule, start, end, text, groups: m });
        }
      }
    }
    if (found.length === 0) {
      out.push(line);
      continue;
    }
    found.sort((a, b) => a.start - b.start);

    // 2. Disposition each occurrence exactly once.
    const edits = [];
    for (const f of found) {
      const record = { path: relPath, line: li + 1, text: f.text, rule: f.rule.id };
      if (isMarkdown) {
        residue.push({ ...record, reason: 'markdown-file' });
        continue;
      }
      if (!inSpans(f.start, spans)) {
        residue.push({ ...record, reason: 'not-a-comment-span' });
        continue;
      }
      if (f.rule.kind === 'residue') {
        residue.push({ ...record, reason: f.rule.reason });
        continue;
      }
      // Exclusion (g), KEPT UNRELAXED (PHASE-152 CHANGE (3)). `Phase 2: Smoke tests` in
      // `apps/supabase/.../00-helpers.test.sql:421` and `PHASE 1: JSONB SCHEMA` in
      // `run-concurrency-scaling.sh` are stage markers, not planning citations. They stay
      // classified as such rather than being swept into the deferred bulk, so the judgement
      // pass is told which of its queue items are not citations at all.
      if (f.rule.id === 'phase-ref' && isAmbiguousPhase(f.text, line, f.end)) {
        residue.push({ ...record, reason: 'ambiguous-reference' });
        continue;
      }
      if (f.rule.id === 'spike-ref' && isAmbiguousSpike(f.text, line, f.end)) {
        residue.push({ ...record, reason: 'ambiguous-reference' });
        continue;
      }
      // Exclusion (h), KEPT. Under PHASE-152 CHANGE (1) this no longer decides WHETHER the
      // occurrence is rewritten — nothing in the deferred class is — but it still decides
      // which residue reason it carries, which is what tells the judgement pass that this
      // one needs a rewritten sentence rather than a deleted citation.
      if (f.rule.kind === 'defer' && isAttributive(f.text, line, f.start)) {
        residue.push({ ...record, reason: 'attributive-reference' });
        continue;
      }
      // PHASE-152 CHANGE (1). The deferred class terminates here: reported, never edited.
      if (f.rule.kind === 'defer') {
        residue.push({ ...record, reason: f.rule.reason });
        continue;
      }
      const replacement = SENTINEL; // the only rewriting disposition left is `delete`
      edits.push({ ...f, replacement });
      hits.push(record);
    }

    if (edits.length === 0) {
      out.push(line);
      continue;
    }

    // 3. Apply right to left so earlier indices stay valid, then repair.
    let next = line;
    for (let k = edits.length - 1; k >= 0; k--) {
      const e = edits[k];
      next = next.slice(0, e.start) + e.replacement + next.slice(e.end);
    }
    next = repair(next, openerEnd(next, spans));

    // 4. Rule 7 — drop the line if it is now a degenerate comment-only line.
    const probe = { ...stateBefore };
    const nextSpans = commentSpans(next, fam, probe);
    if (isDegenerateCommentLine(next, nextSpans)) {
      deletedLines.push({ path: relPath, line: li + 1, before: line });
      continue;
    }
    if (newlyProseSuspect(line, next)) {
      prose.push({ path: relPath, line: li + 1, before: line.trim(), after: next.trim() });
    }
    out.push(next);
  }

  return { changed: out.join('\n'), hits, residue, prose, absorbed, deletedLines };
}

// ── Self-test ─────────────────────────────────────────────────────────────
// PHASE-152 CHANGE (4). The fifth entry is net-new and covers the rule that changed. Its
// third element names an EXPECTED-RESIDUE file: for the deferred class the interesting
// assertion is not "what did the codemod write" (it writes nothing) but "what did it hand
// on, and under which reason". A fixture that only diffed the output text would pass
// vacuously for a rule whose whole behaviour is to leave the text alone.
const FIXTURES = [
  ['fixtures/hygiene-codemod.input.ts', 'fixtures/hygiene-codemod.expected.ts'],
  ['fixtures/hygiene-codemod.input.svelte', 'fixtures/hygiene-codemod.expected.svelte'],
  ['fixtures/hygiene-codemod.input.sql', 'fixtures/hygiene-codemod.expected.sql'],
  ['fixtures/hygiene-codemod.input.sh', 'fixtures/hygiene-codemod.expected.sh'],
  [
    'fixtures/hygiene-codemod.input.deferred.ts',
    'fixtures/hygiene-codemod.expected.deferred.ts',
    'fixtures/hygiene-codemod.expected.deferred.residue'
  ]
];

/** `L<line>\t<reason>\t<text>` — one row per residue item, in the order they were found. */
function serialiseResidue(residue) {
  return `${residue.map((r) => `L${r.line}\t${r.reason}\t${r.text}`).join('\n')}\n`;
}

function selfTest() {
  let failures = 0;
  console.log('PHASE 152 — hygiene codemod, retargeted (SELF-TEST)\n');
  for (const [inRel, expRel, residueRel] of FIXTURES) {
    const inPath = resolve(SCRIPT_DIR, inRel);
    const expPath = resolve(SCRIPT_DIR, expRel);
    const input = readFileSync(inPath, 'utf-8');
    if (EMIT_FIXTURES) {
      const emitted = transform(inRel, input);
      writeFileSync(expPath, emitted.changed, 'utf-8');
      console.log(`  ~ ${expRel} regenerated (review it by hand before committing)`);
      if (residueRel) {
        writeFileSync(resolve(SCRIPT_DIR, residueRel), serialiseResidue(emitted.residue), 'utf-8');
        console.log(`  ~ ${residueRel} regenerated (review it by hand before committing)`);
      }
      continue;
    }
    const expected = readFileSync(expPath, 'utf-8');
    // The fixture is named for its extension so the family lookup is exercised too.
    const { changed, residue } = transform(inRel, input);
    let ok = true;
    if (changed !== expected) {
      ok = false;
      failures++;
      console.log(`  ✗ ${inRel}`);
      const a = changed.split('\n');
      const b = expected.split('\n');
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] === b[i]) continue;
        console.log(`      L${i + 1}`);
        console.log(`        actual  : ${JSON.stringify(a[i])}`);
        console.log(`        expected: ${JSON.stringify(b[i])}`);
      }
    }
    if (residueRel) {
      const expectedResidue = readFileSync(resolve(SCRIPT_DIR, residueRel), 'utf-8');
      const actualResidue = serialiseResidue(residue);
      if (actualResidue !== expectedResidue) {
        if (ok) failures++;
        ok = false;
        console.log(`  ✗ ${residueRel}`);
        const a = actualResidue.split('\n');
        const b = expectedResidue.split('\n');
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
          if (a[i] === b[i]) continue;
          console.log(`      row ${i + 1}`);
          console.log(`        actual  : ${JSON.stringify(a[i])}`);
          console.log(`        expected: ${JSON.stringify(b[i])}`);
        }
      }
    }
    if (ok) console.log(`  ✓ ${inRel}  (residue: ${residue.length}${residueRel ? ', residue roster asserted' : ''})`);
  }
  console.log(`\n── Summary ──\n  Fixtures: ${FIXTURES.length}\n  Failures: ${failures}`);
  console.log(`\n${failures === 0 ? '✓ Self-test PASSED. No file on disk was touched.' : '✗ Self-test FAILED.'}`);
  console.log(`\nMODE: self-test (no files written).`);
  process.exit(failures === 0 ? 0 : 1);
}

if (IS_MAIN && SELF_TEST) selfTest();

// ── Enumeration ───────────────────────────────────────────────
/**
 * PHASE-152 CHANGE (5). Lifted verbatim out of this file's former top level into an exported
 * function, so the three sibling instruments enumerate through the SAME exemption guard
 * rather than each rebuilding one. The order is load-bearing and unchanged:
 * glob -> D-15 exemption -> extension -> tracked-set intersection. The exemption fires FIRST,
 * so no `--files` argument can steer any caller into `.planning/`, `.claude/`, `.agents/` or
 * `CLAUDE.md`.
 *
 * It THROWS rather than exiting, so a caller with a different exit-code convention can fail
 * closed in its own terms. A throw and not a return value, because a caller that ignores a
 * return value scans the exempt tree anyway; one that ignores a throw does not run at all.
 */
export class ExemptPathError extends Error {
  constructor(paths) {
    super(
      `refusing to scan ${paths.length} path(s) under a D-15 exempt tree ` +
        `(CLAUDE.md, .agents/, .claude/, .planning/). First: ${paths[0]}`
    );
    this.name = 'ExemptPathError';
    this.paths = paths;
  }
}

export function enumerateTrackedFiles(globList = DEFAULT_GLOBS, root = REPO_ROOT) {
  const rawFiles = globSync(globList, { cwd: root, exclude: (p) => SKIP_PATH_RE.test(`${p}/`) });

  // Exemption guard (b) fires BEFORE any extension or tracked filter, so it cannot be
  // side-stepped by a glob that would have been narrowed away later.
  const exemptFiles = rawFiles.filter((f) => isExempt(f));
  if (exemptFiles.length > 0) throw new ExemptPathError(exemptFiles);

  const byExtFiles = rawFiles.filter((f) => Object.hasOwn(FAMILY_BY_EXT, (f.split('.').pop() || '').toLowerCase()));

  // globSync sees the working tree, not the index, so gitignored build output (the
  // `tests/e2e-runs/**` evidence directories, generated paraglide sources) would otherwise
  // be rewritten. Intersecting with the tracked set is the structural fix; SKIP_PATH_RE
  // above is the cheap one, and both are kept because either alone has been wrong before.
  let tracked;
  try {
    tracked = new Set(
      execFileSync('git', ['ls-files', '-z', '--', ...SCAN_ROOTS], {
        cwd: root,
        maxBuffer: 64 * 1024 * 1024
      })
        .toString('utf-8')
        .split('\u0000')
        .filter(Boolean)
    );
  } catch {
    tracked = null;
  }

  return {
    raw: rawFiles,
    files: tracked ? byExtFiles.filter((f) => tracked.has(f.replaceAll('\\', '/'))) : byExtFiles
  };
}

const globs = USER_GLOBS.length > 0 ? USER_GLOBS : DEFAULT_GLOBS;
let raw = [];
let files = [];
if (IS_MAIN) {
  try {
    ({ raw, files } = enumerateTrackedFiles(globs, REPO_ROOT));
  } catch (error) {
    if (!(error instanceof ExemptPathError)) throw error;
    console.error(`hygiene-codemod.mjs: ${error.message}`);
    console.error('These are agent-facing planning infrastructure, not shipped source. They ride the');
    console.error('top-of-stack planning slice with their citations intact and are never rewritten.');
    process.exit(2);
  }

  if (raw.length === 0) {
    console.error(`No files matched: ${globs.join(' ')}`);
    process.exit(1);
  }
  if (files.length === 0) {
    console.error(`No scannable tracked files matched: ${globs.join(' ')}`);
    process.exit(1);
  }
}

// PHASE-152 CHANGE (5) — everything below is the CLI, and runs only when this file is
// INVOKED. An `import` of it for the classifier gets the exports above and nothing else:
// no argv parsing, no enumeration, no writes, no `process.exit`.
if (IS_MAIN) {
  // ── Main ──────────────────────────────────────────────────────────────────
  console.log(`PHASE 152 — planning-reference hygiene codemod, retargeted ${APPLY ? '(APPLIED)' : '(DRY-RUN)'}\n`);

  const summary = {
    mode: APPLY ? 'apply' : 'dry-run',
    filesScanned: files.length,
    filesRewritten: 0,
    linesDeleted: 0,
    totalMatches: 0,
    totalHits: 0,
    totalResidue: 0,
    absorbed: 0,
    byRule: Object.fromEntries(RULES.filter((r) => r.kind !== 'residue').map((r) => [r.id, 0])),
    byReason: Object.fromEntries(RESIDUE_REASONS.map((r) => [r, 0])),
    residueFiles: 0,
    proseFlags: 0
  };

  const allResidue = [];
  const allProse = [];

  for (const rel of files) {
    const abs = resolve(REPO_ROOT, rel);
    let original;
    try {
      original = readFileSync(abs, 'utf-8');
    } catch {
      continue;
    }
    if (original.includes('\u0000')) continue; // binary-ish: the sentinel would be ambiguous

    const { changed, hits, residue, prose, absorbed, deletedLines } = transform(rel, original);

    summary.absorbed += absorbed;
    for (const h of hits) summary.byRule[h.rule] = (summary.byRule[h.rule] || 0) + 1;
    for (const r of residue) summary.byReason[r.reason] = (summary.byReason[r.reason] || 0) + 1;
    summary.totalHits += hits.length;
    summary.totalResidue += residue.length;
    summary.linesDeleted += deletedLines.length;
    if (residue.length > 0) summary.residueFiles++;
    summary.proseFlags += prose.length;
    allResidue.push(...residue);
    allProse.push(...prose);

    if (hits.length === 0 && residue.length === 0) continue;

    if (changed !== original) summary.filesRewritten++;

    if (!QUIET) {
      console.log(`▸ ${rel}  (rewrites: ${hits.length}, residue: ${residue.length})`);
      for (const h of hits) console.log(`    L${h.line}  ${h.rule}  ${JSON.stringify(h.text)}`);
      for (const d of deletedLines)
        console.log(`    L${d.line}  degenerate-line  DELETED  ${JSON.stringify(d.before.trim())}`);
      for (const r of residue) console.log(`    L${r.line}  ⚠ RESIDUE (${r.reason})  ${JSON.stringify(r.text)}`);
      for (const w of prose) console.log(`    L${w.line}  ⚠ PROSE-REVIEW  ${JSON.stringify(w.after)}`);
    }

    if (APPLY && changed !== original) writeFileSync(abs, changed, 'utf-8');
  }

  summary.totalMatches = summary.totalHits + summary.totalResidue;

  // ── Output ────────────────────────────────────────────────────────────────
  console.log('\n── Summary ──');
  console.log(`  Files scanned:      ${summary.filesScanned}`);
  console.log(`  Files rewritten:    ${summary.filesRewritten}`);
  console.log(`  Comment lines cut:  ${summary.linesDeleted}`);
  console.log(
    `  Total occurrences:  ${summary.totalMatches}   (hits ${summary.totalHits} + residue ${summary.totalResidue})`
  );
  console.log(`  Overlaps absorbed:  ${summary.absorbed}   (counted once, under the earlier rule)`);
  console.log('\n  per-rule hits');
  for (const [id, c] of Object.entries(summary.byRule)) console.log(`    ${id.padEnd(20)} ${c}`);
  console.log("\n  residue by reason  (this is the judgement pass's work queue)");
  for (const [id, c] of Object.entries(summary.byReason)) console.log(`    ${id.padEnd(28)} ${c}`);
  console.log(`    ${'files carrying residue'.padEnd(28)} ${summary.residueFiles}`);
  console.log(`\n  prose-review flags (rewritten, but the sentence needs a human): ${summary.proseFlags}`);

  const arithmeticOk = summary.totalHits + summary.totalResidue === summary.totalMatches;
  console.log(`\n  arithmetic (hits + residue == total): ${arithmeticOk ? 'OK' : 'BROKEN'}`);

  if (RESIDUE_OUT) {
    const tsv = allResidue
      .map((r) => `${r.path}\t${r.line}\t${r.reason}\t${r.rule}\t${r.text.replaceAll('\t', ' ')}`)
      .join('\n');
    writeFileSync(resolve(REPO_ROOT, RESIDUE_OUT), `path\tline\treason\trule\ttext\n${tsv}\n`, 'utf-8');
    console.log(`  residue TSV written: ${relative(REPO_ROOT, resolve(REPO_ROOT, RESIDUE_OUT))}`);
  }
  if (RESIDUE_OUT) {
    const proseOut = RESIDUE_OUT.replace(/(\.tsv)?$/, '.prose.tsv');
    const tsv = allProse.map((w) => `${w.path}\t${w.line}\t${w.before}\t${w.after}`).join('\n');
    writeFileSync(resolve(REPO_ROOT, proseOut), `path\tline\tbefore\tafter\n${tsv}\n`, 'utf-8');
    console.log(`  prose-review TSV written: ${proseOut}`);
  }
  if (JSON_OUT) {
    writeFileSync(resolve(REPO_ROOT, JSON_OUT), `${JSON.stringify(summary, null, 2)}\n`, 'utf-8');
    console.log(`  JSON summary written: ${relative(REPO_ROOT, resolve(REPO_ROOT, JSON_OUT))}`);
  }

  console.log(`\n${APPLY ? '✓ Changes written.' : 'Dry-run only. Nothing was written. Re-run with --apply to write.'}`);
  console.log(`\nMODE: ${APPLY ? 'APPLY (files on disk were modified)' : 'DRY-RUN (no file on disk was modified)'}`);
  process.exit(arithmeticOk ? 0 : 1);
}
