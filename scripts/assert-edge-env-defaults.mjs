#!/usr/bin/env node

/**
 * EDGE-FUNCTION ENVIRONMENT-DEFAULT GUARD (phase 155, requirement REVIEW-EDGE-02).
 *
 * The incident this file exists for: seven environment reads across the three Edge Functions
 * silently substituted a value for missing configuration. Two of them were not merely untidy.
 * `invite-candidate` fell back from `SITE_URL` to the Supabase API host, so an operator who
 * never set `SITE_URL` sent candidates invite links addressed at the API origin instead of the
 * site origin — a link the recipient cannot use, produced by a deployment that reported no
 * error at all. `identity-callback` fell back from `DEFAULT_PROJECT_ID` to a hard-coded seed
 * project id, so self-registered candidates were written into a default tenant rather than the
 * intended one. In both cases the misconfiguration became a wrong RESULT rather than a loud
 * failure, and nothing in the tree would have said so.
 *
 * Phase 155 fixed all seven. Decision D-D2 explicitly REJECTED fixing them without a guard, on
 * the grounds that the next Edge Function reopens the class: this file is what closes the class
 * rather than its instances.
 *
 * THREE checks, each a distinct way the tree could silently regress:
 *
 *   Check 1 (REVIEW-EDGE-02) — no environment read anywhere under the functions tree is
 *     followed by a defaulting operator. This is the class D-D2 names.
 *   Check 2 — the modules that exist as verbatim copies across function directories stay
 *     byte-identical. Supabase treats each top-level function directory as its own deployment
 *     unit and this repository has no shared-module directory for Edge Functions, so
 *     `envConfig.ts` and `jwtSegment.ts` exist in triplicate and in duplicate respectively.
 *     Drift between them means one function keeps a fix and another quietly does not.
 *   Check 3 — every module that has a test beside it stays reachable from vitest, meaning no
 *     remote-URL import and no reference to the Deno global. That property is the ONLY reason
 *     vitest can import these files at all (`claimConfig.ts` was created to establish it and
 *     says so in its own docstring). Losing it turns a passing test file into an unresolvable
 *     import, and a test that cannot run is a failure wearing a pass.
 *
 * WHY THIS TREE NEEDS A GUARD OF ITS OWN. `turbo run lint --dry` reports the supabase workspace
 * as having no `lint` task, and there is no ESLint configuration anywhere under it, so an ESLint
 * rule would mean first standing up an entire lint surface for a Deno codebase with URL imports.
 * Besides Prettier and the vitest files added by this phase, this guard is the only automated
 * check that reaches `apps/supabase/supabase/functions` at all.
 *
 * This is a deliberate regular-expression read rather than an abstract-syntax parse, for the
 * reason the sibling guards give: these are hand-authored source files, the pattern is a
 * two-token shape, and a regex read is the cheapest thing that can name the violation precisely.
 * Node built-ins only, no build step, no dependency.
 *
 * NO OPT-OUT, BY CONSTRUCTION. There is no flag, no ignore file, no per-path exception roster
 * and no warn-only tier. The two exclusions that exist are NAMED CONSTANTS in this file
 * (`NOT_DUPLICATED` and the `*.test.ts` rule in check 2), each with its reason written beside
 * it, following `scripts/assert-unit-test-coverage.mjs:47-53`: "an opt-out that can be flipped
 * when the guard is inconvenient makes its green meaningless … Excusing a workspace requires
 * editing this file, which is then reviewed as the decision it is."
 *
 * COMMENTS ARE EXCLUDED STRUCTURALLY, AND THAT IS LOAD-BEARING. This phase deliberately wrote
 * four docstrings that quote `Deno.env.get('X') || fallback` in prose in order to declare why
 * the shape is abolished, and the testable modules likewise name the Deno global in prose while
 * containing none in code. A guard that reddened on the documentation explaining it would be
 * unkeepable, and a guard tuned until it stopped complaining would be worthless. So this file
 * does not pattern-match its way around the problem: it imports the repository's shared,
 * quote-aware and template-literal-aware comment-span classifier
 * (`scripts/lib/comment-spans.mjs`, extracted for this purpose from
 * `scripts/assert-comment-hygiene.mjs`) and ignores any match whose start index falls inside a
 * comment span. Matching on the raw text and excluding by index means line numbers are exact by
 * construction, with no text mutation to keep in step.
 *
 * Usage:
 *   node scripts/assert-edge-env-defaults.mjs
 *
 * Exit codes:
 *   0 - all three checks clean
 *   1 - at least one violation, or a named precondition failure (a file or directory this guard
 *       could not read). An input this guard cannot read is a property it cannot verify, and is
 *       never read as "everything is accounted for" — this fails closed.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { commentSpans, inSpans } from './lib/comment-spans.mjs';

const SELF = 'scripts/assert-edge-env-defaults.mjs';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** Hard-coded. Not configurable, not overridable — see NO OPT-OUT in the docblock. */
const FUNCTIONS_DIR = path.resolve(REPO_ROOT, 'apps', 'supabase', 'supabase', 'functions');

/** The comment family for every file this guard reads. They are all TypeScript. */
const TS_FAMILY = { c: true };

// ── Check 1: the environment-default class ────────────────────────────────
// THE PREDICATE IS ANCHORED ON THE ENVIRONMENT READ, NOT ON THE START OF THE ASSIGNMENT, and
// that is the whole point rather than an implementation detail. The worst site in the original
// set read `const projectId = project_id || Deno.env.get('DEFAULT_PROJECT_ID') || SEED_ID;`,
// whose fallback chain BEGINS with a request-body operand. A matcher anchored on the assignment
// would have silently exempted exactly the site that mattered most.
//
// Equally, the predicate must not match a defaulting operator on an ordinary value, so
// `payload.user_roles || []` stays legal: that is a legitimate absent-claim default on a decoded
// JWT claim, it is not an environment read, and "fixing" it would be a regression.
const ENV_DEFAULT_RE = /Deno\.env\.get\(\s*['"`][^'"`]+['"`]\s*\)\s*(\?\?|\|\|)/g;

// ── Check 2: the duplicated sibling modules ───────────────────────────────
/**
 * The modules held byte-identical across function directories.
 *
 * A NAMED CONSTANT rather than an auto-detected set of every repeated basename, and the reason
 * is measured rather than stylistic. `index.ts` also appears in all three directories and is of
 * course different in each: it is the function body. `jwtSegment.test.ts` appears in two and is
 * also legitimately different — `send-email/jwtSegment.test.ts` states in its own docstring that
 * it is "deliberately NOT shared with `invite-candidate/jwtSegment.test.ts`", because a copy
 * without its own test is a copy that can rot, and its fixture exercises `project_admin`, the
 * role only that function honours. Auto-detecting every repeated basename would therefore put
 * this guard three violations into the red on the day it shipped, which is the shape this
 * milestone rejected: a guard cannot go live against pre-existing violations, and one tuned
 * until it stops complaining proves nothing.
 */
const DUPLICATED_MODULES = ['envConfig.ts', 'jwtSegment.ts'];

// ── Check 3: the testability contract ─────────────────────────────────────
/** A remote-origin module specifier. `npm:` and `jsr:` are Deno-only resolvers vitest cannot follow either. */
const REMOTE_IMPORT_RE = /from\s*['"`](https?:\/\/|npm:|jsr:)/g;

/** Any reference to the Deno runtime global. A module holding one cannot be imported by vitest. */
const DENO_GLOBAL_RE = /\bDeno\s*\./g;

function fail(message) {
  console.error(`[ERROR] ${SELF}: ${message}`);
}

/**
 * Every `.ts` file under the functions tree, as repo-relative paths, sorted.
 *
 * Sorted so that two runs over an unchanged tree emit violations in the same order; directory
 * iteration order is a filesystem property and is not one this guard may inherit.
 */
function enumerateTsFiles() {
  let entries;
  try {
    entries = readdirSync(FUNCTIONS_DIR, { recursive: true, withFileTypes: true });
  } catch (error) {
    fail(
      `could not read '${path.relative(REPO_ROOT, FUNCTIONS_DIR)}' (${error.message}). A tree this ` +
        'guard cannot enumerate is a tree it cannot verify — this fails closed.'
    );
    return null;
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => path.relative(REPO_ROOT, path.join(entry.parentPath ?? entry.path, entry.name)))
    .sort();
}

/** Read a file, or fail closed. A file this guard cannot read is a property it cannot verify. */
function readSource(relPath) {
  try {
    return readFileSync(path.resolve(REPO_ROOT, relPath), 'utf8');
  } catch (error) {
    fail(
      `could not read '${relPath}' (${error.message}). A file this guard cannot read is a property ` +
        'it cannot verify — this fails closed.'
    );
    return null;
  }
}

/**
 * Build the comment map for one file: the absolute character ranges that are comment TEXT, and
 * the absolute start offset of each line so a match index can be turned back into a line number.
 *
 * The spans come from the shared classifier, so a `//` inside a string literal and a `/*` inside
 * a template literal are correctly NOT comments, and a doc comment spanning many lines is
 * correctly all comment.
 */
function commentMapOf(text) {
  const state = { inBlockC: false, inBlockHtml: false, inTemplate: false, lineIndex: 0 };
  const lines = text.split('\n');
  const spans = [];
  const lineStarts = [];
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    lineStarts.push(offset);
    state.lineIndex = i;
    for (const [start, end] of commentSpans(line, TS_FAMILY, state)) {
      spans.push([offset + start, offset + end]);
    }
    offset += line.length + 1;
  }

  return { spans, lineStarts };
}

/** The 1-based line number containing absolute character index `idx`. */
function lineNumberOf(lineStarts, idx) {
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
 * Every match of `re` in `text` that is NOT inside a comment, as `{ index, line, text }`.
 *
 * The whole file is scanned rather than each line separately, deliberately. Prettier keeps every
 * one of these expressions on a single line today, but a longer variable name would wrap the
 * operator onto the next line, and a line-scoped scan would then miss the very thing it exists
 * to find. Matches are returned in ascending index order, which is what makes the output stable.
 */
function codeMatches(text, re, map) {
  const found = [];
  re.lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (inSpans(match.index, map.spans)) continue;
    found.push({
      index: match.index,
      line: lineNumberOf(map.lineStarts, match.index),
      text: match[0]
    });
  }
  return found;
}

function main() {
  const files = enumerateTsFiles();
  if (files === null) {
    process.exitCode = 1;
    return;
  }

  let violations = 0;
  const violate = (message) => {
    violations++;
    fail(message);
  };

  const sources = new Map();
  for (const rel of files) {
    const text = readSource(rel);
    if (text === null) {
      process.exitCode = 1;
      return;
    }
    sources.set(rel, text);
  }

  // --- Check 1: no environment read followed by a defaulting operator ---
  for (const rel of files) {
    const text = sources.get(rel);
    const map = commentMapOf(text);
    for (const hit of codeMatches(text, ENV_DEFAULT_RE, map)) {
      const operator = hit.text.includes('??') ? '??' : '||';
      violate(
        `${rel}:${hit.line}: an environment read is followed by '${operator}', which silently ` +
          'substitutes a value for missing configuration. A missing variable must fail loudly ' +
          'naming the variable, not be papered over: the same shape addressed invite links at the ' +
          'wrong host and seeded candidates into a default tenant, and reported no error either ' +
          'time. Replace the default with a throw naming the variable — see `requireEnv` in the ' +
          '`envConfig.ts` beside this file (REVIEW-EDGE-02).'
      );
    }
  }

  // --- Check 2: the duplicated sibling modules stay byte-identical ---
  for (const basename of DUPLICATED_MODULES) {
    const copies = files.filter((rel) => path.basename(rel) === basename);
    if (copies.length < 2) {
      violate(
        `expected at least two copies of '${basename}' under the functions tree and found ` +
          `${copies.length}. Either a deployment unit lost its copy of a shared module, or the ` +
          'module was renamed without updating this guard, which would leave the remaining copies ' +
          'unheld (REVIEW-EDGE-02).'
      );
      continue;
    }
    const [canonical, ...rest] = copies;
    for (const other of rest) {
      if (sources.get(other) !== sources.get(canonical)) {
        violate(
          `'${other}' has drifted from '${canonical}'. These are verbatim copies because Supabase ` +
            'treats each top-level function directory as its own deployment unit and this repository ' +
            'has no shared-module directory for Edge Functions. Drift means one function keeps a fix ' +
            'and another quietly does not. Make the two files identical, or remove the duplication ' +
            'deliberately and update this guard (REVIEW-EDGE-02).'
        );
      }
    }
  }

  // --- Check 3: modules with a test beside them stay reachable from vitest ---
  const present = new Set(files);
  for (const rel of files) {
    if (rel.endsWith('.test.ts')) continue;
    if (!present.has(`${rel.slice(0, -'.ts'.length)}.test.ts`)) continue;

    const text = sources.get(rel);
    const map = commentMapOf(text);

    for (const hit of codeMatches(text, REMOTE_IMPORT_RE, map)) {
      violate(
        `${rel}:${hit.line}: this module has a test beside it and now imports from a remote ` +
          'origin. vitest cannot resolve a URL, `npm:` or `jsr:` specifier, so the test file next ' +
          'to it stops being an assertion and becomes an unresolvable import — a test that cannot ' +
          'run is a failure wearing a pass. Keep the module free of remote imports and let the ' +
          'Edge Function entry point hold them (REVIEW-EDGE-02).'
      );
    }

    for (const hit of codeMatches(text, DENO_GLOBAL_RE, map)) {
      violate(
        `${rel}:${hit.line}: this module has a test beside it and now references the Deno runtime ` +
          'global. That global does not exist under vitest, so the test beside it stops running. ' +
          'Pass the value in as a parameter instead and let the caller read the environment — the ' +
          'shape `requireEnv(name, value)` exists for exactly this reason (REVIEW-EDGE-02).'
      );
    }
  }

  console.log(
    `Edge-function environment-default guard (phase 155: REVIEW-EDGE-02) — files scanned: ` +
      `${files.length}; checks live: 3 of 3 (env-default; copy-drift; vitest-reachability). ` +
      `${violations} violation(s).`
  );

  process.exitCode = violations > 0 ? 1 : 0;
}

main();
