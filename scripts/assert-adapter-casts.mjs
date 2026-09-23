#!/usr/bin/env node

/**
 * ADAPTER-BOUNDARY CAST GUARD (phase 157, requirement REVIEW-ADP-01).
 *
 * The incident this file exists for: the Supabase adapter read typed JSONB columns by
 * asserting the opaque generated `Json` type straight into an application shape — fifteen
 * occurrences of the exact spelling `as Json as unknown as X`, spread across
 * `supabaseDataProvider.ts` and `supabaseDataWriter.ts`. A triple cast through `unknown` is
 * the one form TypeScript cannot object to, so a malformed row reached domain constructors
 * with the compiler reporting nothing. Phase 157 plan 07 replaced all fifteen with a zod
 * `safeParse` that validates the stored shape and derives the application value from the
 * validated result. That took the count to zero, ONCE. Without a standing check, criterion 1's
 * "a grep for casts on adapter reads returns empty" closes by inspection, and the class is
 * free to reopen on the next pull request that finds the cast quicker than the schema.
 *
 * FOUR checks, ordered so that the vacuity precondition runs first:
 *
 *   Check 0 — the corpus is real. The scan directory resolves, it yields at least one
 *     TypeScript file, and it contains the three named anchor files the whole guard is about.
 *     This check exists because of a defect this very phase hit twice: an acceptance criterion
 *     grepping for a string that occurs nowhere in the repository measured nothing and reported
 *     a pass. A guard whose corpus is empty reports zero violations and looks green forever, and
 *     zero-from-an-inert-guard is indistinguishable from zero-from-a-clean-tree unless the guard
 *     proves its corpus first.
 *   Check 1 (the primary assertion) — no line under the adapter directory matches
 *     `as\s+Json\s+as\s+unknown\s+as`. That is the exact spelling of the smell, its measured
 *     baseline was 15 before plan 07 and 0 after, and it cannot fire on the phase-164 nullability
 *     compensations or on the internal type assertions, none of which use the triple form.
 *   Check 2 (the literal-spelling assertion) — none of four literal cast strings the phase
 *     removed reappears. Each had a measured non-zero baseline before plan 07
 *     (`as Partial<DynamicSettings>` 2, `as AppCustomization` 1, `as LocalizedAnswers` 4,
 *     `as StoredImage` 14) and each is zero after it, so all four are regression guards over
 *     real history rather than patterns invented to be satisfiable.
 *   Check 3 — chain membership. The root `lint:check` script still contains this guard as one
 *     of its `&&` links. A guard nobody runs is a guard nobody has, so the guard makes its own
 *     absence from the chain a failure.
 *
 * MEMBERSHIP, NEVER POSITION. Check 3 splits `lint:check` on `&&` and looks for its own link in
 * the resulting token set. It must never assert an index or a terminal position: every link after
 * a failing one is equally skipped, so position is incidental, and asserting it makes appending
 * the next guard a test failure. That is the phase-144 lesson recorded verbatim in commit
 * `b410d3a90`, "assert typecheck's chain MEMBERSHIP in lint:check, not its position".
 *
 * WHY NOT AN ESLINT RULE. A `no-restricted-syntax` selector on `TSAsExpression` cannot tell the
 * in-scope boundary casts from the phase-164 nullability compensations, the `as const` literal
 * narrowings and the `toDataObject` argument widenings that legitimately share the file. It would
 * fire on dozens of accepted lines, and a guard that noisy gets disabled rather than obeyed.
 *
 * WHY A REGEX READ RATHER THAN AN AST PARSE. The assertion is about an exact source spelling, in
 * one hand-authored directory, and a regex read is the cheapest thing that can name the offending
 * line. This matches the house style of `scripts/assert-a11y-scan-wiring.mjs` and
 * `scripts/assert-unit-test-coverage.mjs`: Node built-ins only, no build step, exit 1 naming the
 * specific problem.
 *
 * ON `.mjs` RATHER THAN TYPESCRIPT. The assert-script family is deliberately plain ESM so it runs
 * with no build step and can therefore gate the build itself; `scripts/assert-unit-test-coverage.mjs`
 * states the bootstrapping reason at length. CLAUDE.md's "use TypeScript strictly" rule is not
 * violated by following that established precedent.
 *
 * Usage:
 *   node scripts/assert-adapter-casts.mjs
 *
 * Exit codes:
 *   0 - all four checks clean
 *   1 - at least one violation, or a named precondition failure (the scan directory or a file
 *       missing or unreadable, or the corpus missing an anchor)
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = 'scripts/assert-adapter-casts.mjs';
const REQUIREMENT = 'REVIEW-ADP-01';
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** The directory whose every `.ts` file is the guarded corpus. */
const ADAPTER_DIR_REL = path.join('apps', 'frontend', 'src', 'lib', 'api', 'adapters', 'supabase');
const ADAPTER_DIR = path.resolve(REPO_ROOT, ADAPTER_DIR_REL);

/** The root manifest, read for check 3's chain-membership assertion. */
const ROOT_MANIFEST = path.resolve(REPO_ROOT, 'package.json');

/** This guard's own `&&` link, as it must appear in the `lint:check` chain. */
const CHAIN_LINK = 'yarn assert:adapter-casts';

/** This guard's own entry in the root `scripts` block. */
const SCRIPT_NAME = 'assert:adapter-casts';

/**
 * Check 0's anchors. If the corpus does not contain these three files, the directory has been
 * renamed or restructured and this guard is scanning something other than the adapter. Failing
 * loudly is the only honest outcome; reporting zero violations over the wrong corpus is the
 * failure mode check 0 exists to prevent.
 */
const ANCHOR_FILES = [
  path.join('dataProvider', 'supabaseDataProvider.ts'),
  path.join('dataWriter', 'supabaseDataWriter.ts'),
  path.join('adminWriter', 'supabaseAdminWriter.ts')
];

/**
 * Check 1's pattern. The triple cast through `unknown`, which is the one assertion form
 * TypeScript cannot object to and therefore the one that silently defeats the type system.
 */
const TRIPLE_CAST = /as\s+Json\s+as\s+unknown\s+as/;

/**
 * Check 2's literal cast strings, each with the baseline it carried before phase 157 plan 07
 * removed it. The baseline is recorded beside the pattern so a later reader can tell a
 * regression guard over real history from a pattern that never matched anything.
 */
const REMOVED_CASTS = [
  { literal: 'as Partial<DynamicSettings>', baselineBeforePlan07: 2 },
  { literal: 'as AppCustomization', baselineBeforePlan07: 1 },
  { literal: 'as LocalizedAnswers', baselineBeforePlan07: 4 },
  { literal: 'as StoredImage', baselineBeforePlan07: 14 }
];

let violations = 0;

/** Record one violation, printed immediately so the whole set is visible in a single run. */
function violate(message) {
  violations += 1;
  console.error(`[VIOLATION] ${message}`);
}

/**
 * Read one file, failing closed. A file this guard cannot read is a file it cannot verify, so an
 * unreadable path is a violation rather than a skip.
 */
function readSource(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    violate(
      `${SELF}: could not read '${path.relative(REPO_ROOT, filePath)}' (${error.message}). ` +
        'A file this guard cannot read is a boundary cast it cannot rule out — this fails closed.'
    );
    return null;
  }
}

/**
 * Collect every `.ts` file under the adapter directory, recursively. Returns `null` when the walk
 * itself fails, which check 0 then reports as a precondition failure.
 */
function collectTypeScriptFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    violate(
      `${SELF}: could not enumerate '${path.relative(REPO_ROOT, dir)}' (${error.message}). ` +
        'A directory this guard cannot walk is a corpus it cannot scan — this fails closed.'
    );
    return null;
  }

  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = collectTypeScriptFiles(full);
      if (nested === null) return null;
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  // Check 0: the corpus is real before any zero it produces is allowed to mean anything.
  const files = collectTypeScriptFiles(ADAPTER_DIR);
  if (files === null) {
    console.log(`Adapter-boundary cast guard (phase 157: ${REQUIREMENT}) — ${violations} violation(s).`);
    process.exitCode = 1;
    return;
  }

  if (files.length === 0) {
    violate(
      `${SELF}: '${ADAPTER_DIR_REL}' contains no '.ts' files, so every check below would report a ` +
        'vacuous zero. Either the adapter moved, in which case update ADAPTER_DIR_REL in this file, ' +
        'or the corpus is genuinely gone, in which case this guard has nothing left to guard.'
    );
  }

  const relativeFiles = files.map((file) => path.relative(ADAPTER_DIR, file));
  for (const anchor of ANCHOR_FILES) {
    if (!relativeFiles.includes(anchor)) {
      violate(
        `${SELF}: the anchor file '${path.join(ADAPTER_DIR_REL, anchor)}' is not in the scanned ` +
          'corpus. This guard is therefore scanning something other than the adapter it was written ' +
          'for, and its zero would be vacuous. Update ANCHOR_FILES in this file when the adapter is ' +
          'deliberately restructured.'
      );
    }
  }

  // Checks 1 and 2 share one pass over the corpus, so every file is read exactly once.
  let linesScanned = 0;
  let filesRead = 0;
  for (const file of files) {
    const source = readSource(file);
    if (source === null) continue;
    filesRead += 1;

    const relative = path.relative(REPO_ROOT, file);
    const lines = source.split('\n');
    linesScanned += lines.length;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      if (TRIPLE_CAST.test(line)) {
        violate(
          `${relative}:${lineNumber} — a triple cast through 'unknown' asserts an unvalidated JSONB ` +
            `value into an application shape (${REQUIREMENT}). Parse the stored shape with its zod ` +
            "schema and derive the value from the parse result instead; see 'parseJsonbColumn.ts'.\n" +
            `    ${line.trim()}`
        );
      }

      for (const { literal, baselineBeforePlan07 } of REMOVED_CASTS) {
        if (line.includes(literal)) {
          violate(
            `${relative}:${lineNumber} — the cast '${literal}' is back. Phase 157 plan 07 removed ` +
              `its ${baselineBeforePlan07} occurrence${baselineBeforePlan07 === 1 ? '' : 's'} by ` +
              `validating the column at the boundary (${REQUIREMENT}). Parse, then derive — do not assert.\n` +
              `    ${line.trim()}`
          );
        }
      }
    });
  }

  // Check 3: chain membership, asserted as a token-set test and never as an index.
  const manifestSource = readSource(ROOT_MANIFEST);
  if (manifestSource !== null) {
    let manifest;
    try {
      manifest = JSON.parse(manifestSource);
    } catch (error) {
      violate(`${SELF}: the root 'package.json' is not valid JSON (${error.message}) — this fails closed.`);
      manifest = null;
    }

    if (manifest) {
      const scripts = manifest.scripts ?? {};

      if (typeof scripts[SCRIPT_NAME] !== 'string') {
        violate(
          `the root 'package.json' no longer defines a '${SCRIPT_NAME}' script. Restore ` +
            `"${SCRIPT_NAME}": "node ${SELF}" so the chain has something to call.`
        );
      }

      const lintCheck = scripts['lint:check'];
      if (typeof lintCheck !== 'string') {
        violate(
          "the root 'package.json' no longer defines a 'lint:check' script, so this guard cannot be a member of it."
        );
      } else {
        const links = lintCheck.split('&&').map((link) => link.trim());
        if (!links.includes(CHAIN_LINK)) {
          violate(
            `'${CHAIN_LINK}' is no longer one of the '&&' links of the root 'lint:check' chain, so ` +
              'this guard runs nowhere and its green means nothing. Append it back. The assertion is ' +
              'on MEMBERSHIP of the chain, never on position within it, so the link may sit anywhere.'
          );
        }
      }
    }
  }

  console.log(
    `Adapter-boundary cast guard (phase 157: ${REQUIREMENT}) — ${filesRead} file(s), ` +
      `${linesScanned} line(s) scanned under ${ADAPTER_DIR_REL}; ${violations} violation(s).`
  );
  process.exitCode = violations > 0 ? 1 : 0;
}

main();
