#!/usr/bin/env node

/**
 * UNIT-TEST COVERAGE GUARD (see phase 141, requirements UNIT-04 and UNIT-02 / decision D-17).
 *
 * The incident this file exists for: five `packages/*` workspaces — `core`, `matching`, `llm`,
 * `question-info` and `argument-condensation` — held 18 test files and 140 tests that no CI
 * command executed. Each shipped a `vitest.config.ts` so the root workspace file would discover
 * it, and three of the five even declared a `test` script, so from the repository root the tests
 * looked covered. They were — by a command CI never calls. Nothing in the tree could tell a wired
 * tree from an unwired one, and the hole was found by an audit rather than by a failure.
 *
 * A comment asking future authors to add a `test:unit` script would be the same kind of non-guard
 * this milestone exists to remove, so the invariant is CHECKED. Exiting non-zero here fails the
 * one command every local run and CI (`.github/workflows/main.yaml:70`) pass through, at the
 * earliest point at which the mistake is visible.
 *
 * The invariant has TWO directions, and both are checked here because either alone leaves a hole
 * the other closes:
 *
 *   Check 1 — declared coverage: a workspace that contains test files MUST declare a `test:unit`
 *             script, and that script MUST invoke the test runner. Without the declaration, tests
 *             sit in the tree implying a coverage that does not exist; without the second half,
 *             `"test:unit": "echo skip"` satisfies every other assertion in this file. (UNIT-04)
 *   Check 2 — turbo execution:   a workspace that declares `test:unit` MUST actually be executed
 *             by `turbo run test:unit`. Without it, the declaration is the same empty
 *             claim. (UNIT-02 / D-17)
 *
 * Check 1 alone would pass a tree where every workspace declares the script and turbo runs none
 * of them; Check 2 alone would pass a tree where the test-bearing workspaces declare nothing at
 * all. The pairing is what makes the guard honest in both directions.
 *
 * D-17's KNOWING COST, stated out loud rather than left to erode silently: Check 2 shells a turbo
 * dry run before turbo runs, which forfeits the no-subprocess bootstrapping purity D-08 wanted.
 * The rest of D-08 holds — no build step, no transpiler, no workspace import, no new dependency,
 * Node built-ins only — so this guard cannot deadlock against the pipeline it gates (`turbo.json`
 * declares `test:unit` `dependsOn: ["build"]`, and this file needs none of that output).
 *
 * This file is deliberately OUTSIDE TypeScript, against CLAUDE.md's "use TypeScript strictly", for
 * that same bootstrapping reason: a guard that must run before anything is built cannot itself
 * require a build. There is no root `lint` script, so nothing lints this file on a full-tree
 * run. It IS linted on commit: phase 153 (plan 153-05) split `.lintstagedrc.json`'s fused
 * `mjssvelte` token into `mjs,svelte`, so `.mjs` now matches the first glob and eslint runs on it
 * through lint-staged. This docblock previously said `.mjs` matched no lint-staged pattern — true
 * when written, false since `9973a2f69`. `prettier --write .` via `yarn format` remains its only
 * full-tree formatter.
 * `apps/supabase/scripts/lint-schema.mjs`, this file's skeleton, lives with the same property.
 *
 * INPUT SURFACE: the repository tree this guard is run from, plus the output of one read-only
 * turbo dry run that starts no task. Nothing else. There is deliberately no flag, no setting, no
 * per-workspace exception roster and no warn-only tier that could excuse a workspace from the
 * invariant at run time — an opt-out that can be flipped when the guard is inconvenient makes its
 * green meaningless, because nobody reading the output can tell whether it was earned or waived.
 * Excusing a workspace requires editing this file, which is then reviewed as the decision it is.
 *
 * Usage:
 *   node scripts/assert-unit-test-coverage.mjs
 *
 * Exit codes:
 *   0 - Both checks clean
 *   1 - At least one violation, or a named precondition failure
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** This file's own repo-relative path, so its messages can name where to go and change things. */
const SELF = 'scripts/assert-unit-test-coverage.mjs';

/**
 * The repository root, derived from THIS FILE's location rather than from the process CWD (phase
 * 141 review IN-04).
 *
 * Every path in this guard — the workspace roots, each `package.json`, the pinned turbo binary —
 * used to be resolved against wherever the process happened to be started, so the guard's
 * correctness depended on the caller's directory. Being launched from elsewhere failed by name
 * rather than silently, which was acceptable, but it was also entirely avoidable: this file's own
 * location fixes the repo root unconditionally. Paths are still WRITTEN and PRINTED repo-relative
 * (`packages/core`, not an absolute path) — `fromRepoRoot` is applied only at the filesystem call
 * sites, so the output stays readable and diffable.
 */
const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/** Resolve a repo-relative path for a filesystem call, independently of the process CWD. */
function fromRepoRoot(relativePath) {
  return path.resolve(REPO_ROOT, relativePath);
}

/**
 * The workspace roots this guard scans (D-16). Hoisted into ONE array so the scanned set has one
 * place to look, and so widening or narrowing it is a single visible edit rather than a change
 * scattered across the checks below.
 *
 * It must not drift from the root `package.json` `"workspaces"` globs, which are
 * `["packages/*", "apps/*"]`. The literal is KEPT (rather than derived silently) so the scanned
 * set stays readable at the top of the file — but it is no longer TRUSTED:
 * `assertWorkspaceRootsMatchManifest()` asserts set-equality against the globs on every run and
 * fails by name on a difference in EITHER direction. See phase 141 review CR-01 for why one
 * direction was not enough: a root covered by the globs but absent HERE is invisible to BOTH
 * checks, because `notExecuted` and `checkDeclaredCoverage` both iterate this guard's own
 * enumeration, and `unexpectedlyExecuted` only ever sees tasks turbo reports a real command for —
 * so a stray workspace holding failing tests and NO `test:unit` script lands in `unwired` and the
 * guard exits 0. That is byte-for-byte the state the five packages of this phase were in.
 */
const WORKSPACE_ROOTS = ['packages', 'apps'];

/**
 * What makes a file a test file. This is deliberately the pattern the RUNNER uses, not a hand-kept
 * suffix list, so the two cannot drift (phase 141 review WR-01).
 *
 * D-09 enumerated `.test.ts`, `.spec.ts`, `.test.tsx` verbatim, and every workspace here uses
 * Vitest's default `include`, `**\/*.{test,spec}.?(c|m)[jt]s?(x)`. The enumeration was therefore
 * strictly NARROWER than discovery: `a.spec.tsx`, `a.test.js`, `a.test.jsx`, `a.test.mts` and
 * `a.spec.cjs` are all files Vitest WOULD run and Check 1 could not see — so a workspace holding
 * only those, with no `test:unit` script, passed Check 1 while its tests never ran. Zero files in
 * the tree change classification under this pattern (verified); it closes the shapes, not a
 * present-day violation.
 *
 * KNOWN RESIDUAL (smaller, opposite direction): `PRUNED_DIRS` prunes `build`, `coverage`,
 * `.turbo` and `.svelte-kit`, none of which are in Vitest's default `exclude`. A test file under
 * `packages/x/coverage/` is run by Vitest and invisible here. Left as-is — pruning is what keeps
 * this walk cheap enough to sit in front of every `yarn test:unit` — but recorded rather than
 * implied away.
 */
const TEST_FILE_PATTERN = /\.(test|spec)\.(c|m)?[jt]sx?$/;

/**
 * A declared `test:unit` value must actually invoke this repo's test runner (D-12: bare
 * `vitest run`). Phase 141 review CR-02: without this, NEITHER check ever looks at what the
 * script DOES. Check 1 asserted key presence; Check 2 asserted only that turbo's `command` is not
 * the `<NONEXISTENT>` sentinel — and `""`, `"true"` or `"echo skipping for now"` all satisfy both,
 * while inflating the reassuring "N workspace(s) executed" census. A one-token edit to
 * `packages/core/package.json` therefore reproduced the original incident with a fully green
 * guard and a green CI, and nothing in the tree distinguished it from the wired state.
 *
 * Word-boundary-ish rather than an exact-string match, so legitimate flag variations pass without
 * this constant becoming a roster of blessed command strings that has to be edited for every flag.
 *
 * This asserts the runner is INVOKED, not that it has anything to RUN — those are different
 * properties, and the second one is deliberately NOT enforced here. It is enforced by vitest
 * itself: no workspace declares `--passWithNoTests` any more, so a package that loses its last
 * test file exits 1 from its own `test:unit` and turns the composed `yarn test:unit` red. That
 * closes what the phase 141 review recorded as CR-02 scenario 2 (previously green in that state,
 * because Check 1 stops applying with no test files and Check 2 only sees a declaration that is
 * executed). D-13 had left five carriers of the flag in place; four were vestigial and were
 * stripped, and `@openvaa/docs` — the one where it was load-bearing, vitest config but zero test
 * files — was unwired instead, so Check 1's missing-declaration arm now covers it.
 *
 * DO NOT reintroduce `--passWithNoTests` to make a red build green. It re-opens that hole
 * silently: the guard cannot tell "legitimately zero tests" from "the tests were deleted", which
 * is why the property lives in the runner and not here. A workspace that genuinely has no tests
 * belongs in the unwired census (no `test:unit` key at all), not in a declaration that runs
 * nothing and reports success.
 */
const TEST_RUNNER = /(^|[\s&|;])vitest(\s|$)/;

/**
 * Directory names the walk never descends into. Excluding `node_modules` is D-09's explicit
 * requirement — a dependency's own test files are not this repository's coverage — and the rest
 * are build outputs whose contents are copies of sources already scanned. Pruning is also what
 * keeps the walk cheap enough to sit in front of EVERY `yarn test:unit`.
 */
const PRUNED_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.turbo', '.svelte-kit']);

/**
 * The string turbo writes into a task's `command` field when the workspace declares no such
 * script. Hoisted so the discriminator Check 2 turns on has exactly one place to look, and so a
 * future turbo that changes it can be accommodated in one edit. Observed at turbo 2.8.17.
 */
const TURBO_NONEXISTENT = '<NONEXISTENT>';

/** How much of a failed/unparseable turbo capture to quote back, so a failure is diagnosable. */
const OUTPUT_HEAD = 400;

// ---------------------------------------------------------------------------
// Enumeration
// ---------------------------------------------------------------------------

/**
 * A named precondition failure, thrown rather than exited on (phase 141 review WR-03).
 *
 * `process.exit()` terminates without flushing queued writes, and `process.stdout`/`stderr` writes
 * are ASYNCHRONOUS when the target is a pipe — which is every real invocation of this guard, under
 * `yarn test:unit` and under GitHub Actions alike. Exiting immediately after `console.error` could
 * therefore silently truncate or drop the guard's error text, which is its entire product, exactly
 * on the runs where it matters and in proportion to how much there was to say.
 *
 * A thrown sentinel preserves the other property `process.exit()` was carrying: `fail()` must not
 * RETURN, or e.g. `readTurboTasks` would continue into `JSON.parse(raw)` with `raw` undefined.
 */
class GuardFailure extends Error {
  constructor(message) {
    super(message);
    this.name = 'GuardFailure';
  }
}

/** Abort with a named failure. Never a raw stack trace: this family fails BY NAME. */
function fail(message) {
  throw new GuardFailure(message);
}

/**
 * `readdirSync` with the filesystem errors routed through `fail()` (phase 141 review WR-06).
 *
 * `fail()` promises the guard's failures are BY NAME, never a raw stack trace, but the two
 * directory walks bypassed it entirely: `EACCES`, `EPERM`, `ELOOP`, or an `ENOENT` from a
 * directory removed mid-walk (plausible with a watcher or a parallel `yarn build` running) threw
 * straight out as `Error: EACCES: permission denied, scandir '…'` plus a stack. Those paths always
 * exited non-zero, so the guard failed CLOSED — what was broken was the diagnosability, and the
 * promise this file makes about itself.
 */
function readDirEntries(dir, why) {
  try {
    return readdirSync(fromRepoRoot(dir), { withFileTypes: true });
  } catch (error) {
    fail(
      `could not read directory '${dir}' (${error.message}), so ${why}. A directory this guard ` +
        `cannot read is coverage it cannot verify, and an unreadable tree is never read as ` +
        `"everything is accounted for" — this fails closed. Check the path's permissions, and ` +
        `that nothing is deleting or rewriting it while the guard runs.`
    );
  }
}

/** Quote the head of a captured stream, so a broken subprocess is diagnosable from the message. */
function head(text) {
  const flat = String(text ?? '').trim();
  if (flat.length === 0) return '(no output captured)';
  return flat.length > OUTPUT_HEAD ? `${flat.slice(0, OUTPUT_HEAD)}…` : flat;
}

/**
 * The only glob shape this guard's depth-1 enumeration can faithfully reproduce: `<root>/*`, one
 * path segment then a single terminal star. `packages/*` and `apps/*` are both of this shape.
 * Anything else — a nested two-star glob, a `tools` double-star glob, a bare directory name —
 * would make WORKSPACE_ROOTS an incomplete restatement of the globs, so it is refused rather
 * than approximated.
 */
const SUPPORTED_WORKSPACE_GLOB = /^[^*/]+\/\*$/;

/**
 * Assert WORKSPACE_ROOTS is EXACTLY the set of roots the root `package.json` "workspaces" globs
 * cover — in both directions (phase 141 review CR-01).
 *
 * The pre-existing docblock claimed the drift was handled, but only the "listed here, not covered
 * there" direction was: that one surfaces through Check 2's `notExecuted`. The opposite direction
 * had no reporter at all, because every list the two checks iterate is derived from this guard's
 * own enumeration — a workspace it never enumerated cannot appear in any of them, and a workspace
 * with no `test:unit` script is filtered into `unwired`, which is counted and discarded. Deriving
 * the comparison from the manifest is what makes the two lists unable to drift apart silently.
 */
function assertWorkspaceRootsMatchManifest() {
  const manifestPath = 'package.json';
  let rootManifest;
  try {
    rootManifest = JSON.parse(readFileSync(fromRepoRoot(manifestPath), 'utf8'));
  } catch (error) {
    fail(
      `could not read or parse the root '${manifestPath}' (${error.message}), so the scanned set ` +
        `cannot be cross-checked against the "workspaces" globs. A guard that cannot confirm WHAT ` +
        `it is supposed to scan cannot report that it scanned everything — this fails closed.`
    );
  }

  const declared = rootManifest.workspaces;
  // Both yarn shapes: the bare array, and the `{ "packages": [...] }` object form.
  const globs = Array.isArray(declared) ? declared : Array.isArray(declared?.packages) ? declared.packages : null;
  if (globs === null || globs.length === 0) {
    fail(
      `the root '${manifestPath}' declares no non-empty "workspaces" array, so the set of roots ` +
        `this guard must scan cannot be derived and WORKSPACE_ROOTS in ${SELF} cannot be ` +
        `confirmed to cover it. An unconfirmable scanned set is never read as "everything is ` +
        `accounted for" — this fails closed.`
    );
  }

  const unsupported = globs.filter((glob) => typeof glob !== 'string' || !SUPPORTED_WORKSPACE_GLOB.test(glob));
  if (unsupported.length > 0) {
    fail(
      `the root '${manifestPath}' "workspaces" contains glob(s) this guard cannot enumerate: ` +
        `${unsupported.map((glob) => JSON.stringify(glob)).join(', ')}. Only the depth-1 ` +
        `\`<root>/*\` shape is supported. Extend the enumeration in ${SELF} before trusting a ` +
        `green run — a workspace this guard never enumerates is invisible to BOTH checks, so its ` +
        `tests can sit unexecuted while the summary reads 0 violations.`
    );
  }

  const derived = new Set(globs.map((glob) => glob.slice(0, -2)));
  const coveredButNotScanned = [...derived].filter((root) => !WORKSPACE_ROOTS.includes(root)).sort();
  const scannedButNotCovered = WORKSPACE_ROOTS.filter((root) => !derived.has(root)).sort();

  if (coveredButNotScanned.length > 0 || scannedButNotCovered.length > 0) {
    fail(
      `WORKSPACE_ROOTS in ${SELF} has drifted from the root '${manifestPath}' "workspaces" globs, ` +
        `so the two disagree about which workspaces exist:\n` +
        (coveredButNotScanned.length > 0
          ? `  - covered by the globs but NOT scanned by this guard: ${coveredButNotScanned.join(', ')}\n` +
            `    (workspaces under these roots are invisible to BOTH checks — a test-bearing one ` +
            `with no \`test:unit\` script would run no tests while this guard reported 0 violations)\n`
          : '') +
        (scannedButNotCovered.length > 0
          ? `  - scanned by this guard but NOT covered by the globs: ${scannedButNotCovered.join(', ')}\n` +
            `    (turbo never sees these workspaces, so nothing it reports about them can be trusted)\n`
          : '') +
        `Bring the two into agreement: add the root to the "workspaces" globs, or add/remove it ` +
        `in WORKSPACE_ROOTS.`
    );
  }
}

/**
 * Depth-1 scan of each workspace root, returning one record per workspace plus the anomaly lists.
 *
 * Three accumulators — the matched set, the out-of-scope set AND the defect set — mirroring the
 * teardown-prefix guard at `tests/playwright.config.ts:191-205`: a thing this guard cannot
 * classify is REPORTED, never quietly discarded, because silent discarding is the
 * enumeration-drift failure mode the whole guard family is named after.
 *
 * `anomalies` is ACCUMULATED, not exited on (phase 141 review IN-02). `main()` promises that both
 * checks report in full before the single exit — "a developer with three unwired workspaces and a
 * drifted root should learn all of it from one invocation, not discover it one run at a time" —
 * but a `fail()` here on the first unparseable or nameless manifest broke exactly that promise,
 * and did it during enumeration, before either check had run. A malformed manifest is still a
 * violation and still exits 1; it is just no longer allowed to hide the rest of the report.
 */
function enumerateWorkspaces() {
  const workspaces = [];
  const skipped = [];
  const anomalies = [];

  for (const root of WORKSPACE_ROOTS) {
    // see phase 140 review IN-01: named precondition, mirroring the ORPHAN-PROBE and
    // TEARDOWN-PREFIX guards' `existsSync` checks. Without it a missing or renamed root would die
    // on a raw readdirSync ENOENT — the opposite of the "fails immediately and by name" property
    // this guard claims for itself.
    if (!existsSync(fromRepoRoot(root))) {
      fail(
        `workspace root '${root}' does not exist under ${REPO_ROOT}, so its workspaces cannot be ` +
          `enumerated and the coverage invariant cannot be checked for any of them. Update ` +
          `WORKSPACE_ROOTS in ${SELF} to match the root package.json "workspaces" globs. ` +
          `(This is NOT a "wrong working directory" failure: every path here is resolved against ` +
          `this file's own location, so the guard behaves identically from any CWD.)`
      );
    }

    for (const dirent of readDirEntries(root, `the workspaces under '${root}' cannot be enumerated`)) {
      // `readdirSync` uses lstat semantics, so `isDirectory()` is FALSE for a symlink even when it
      // points at a real workspace — the shape some vendoring and monorepo-linking setups produce.
      // Dropping it on the bare `isDirectory()` test discarded it silently, in flat contradiction
      // of this function's own two-accumulator rationale (phase 141 review WR-05). Classified and
      // reported instead: not followed, but never invisible.
      if (dirent.isSymbolicLink()) {
        skipped.push(`${path.join(root, dirent.name)} (symlink — not followed)`);
        continue;
      }
      // Plain files directly under a workspace root are genuinely out of scope, not an anomaly.
      if (!dirent.isDirectory()) continue;
      const dir = path.join(root, dirent.name);
      const manifestPath = path.join(dir, 'package.json');

      if (!existsSync(fromRepoRoot(manifestPath))) {
        // Counted, not dropped. A directory under a workspace root carrying no manifest is not a
        // workspace and is correctly out of scope, but it is named in the summary so the reader
        // can see WHAT was excluded rather than trusting that nothing was.
        skipped.push(dir);
        continue;
      }

      // Read and parse are separated so the message names which one failed (phase 141 review
      // WR-06): an unreadable manifest (EACCES, a broken symlink) and an unparseable one are
      // different defects with different fixes, and reporting a permissions error as "could not
      // parse" sends the reader to the JSON.
      let source;
      try {
        source = readFileSync(fromRepoRoot(manifestPath), 'utf8');
      } catch (error) {
        anomalies.push(
          `${manifestPath} — could not be READ (${error.message}). Check the file's permissions, ` +
            `or remove the directory from the scanned roots.`
        );
        continue;
      }

      let manifest;
      try {
        manifest = JSON.parse(source);
      } catch (error) {
        anomalies.push(`${manifestPath} — is not parseable JSON (${error.message}). Fix the JSON.`);
        continue;
      }

      if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
        anomalies.push(
          `${manifestPath} — declares no string "name" field. Check 2 matches workspaces against ` +
            `turbo's task graph by package NAME (turbo reports names such as ` +
            `"@openvaa/question-info", never directory names), so a nameless workspace cannot be ` +
            `cross-checked.`
        );
        continue;
      }

      const scripts = manifest.scripts !== null && typeof manifest.scripts === 'object' ? manifest.scripts : {};
      workspaces.push({ name: manifest.name, dir, scripts });
    }
  }

  // turbo's task ordering is not a specified contract and readdirSync's is platform-dependent, so
  // every list this guard compares or prints is sorted by package name first.
  // Names must be UNIQUE, because Check 2 keys `declaredBy` by name (phase 141 review IN-03).
  // `new Map(workspaces.map((w) => [w.name, w]))` keeps the LAST entry when two directories
  // declare the same `name` — the shape produced by copying `packages/foo` to `packages/foo-old`
  // without renaming — so `unexpectedlyExecuted` would then read the wrong workspace's `scripts`
  // and reach a conclusion about a directory it never looked at. Yarn and turbo would usually
  // error on this first (which fails the guard closed through the `readTurboTasks` catch), but
  // "usually, via someone else's error message" is not the same as detected, and the collapse
  // itself was silent. Accumulated rather than exited on, per IN-02.
  const seen = new Map();
  for (const workspace of workspaces) {
    if (seen.has(workspace.name)) {
      anomalies.push(
        `${workspace.dir}/package.json — declares the name "${workspace.name}", which is already ` +
          `declared by ${seen.get(workspace.name)}/package.json. Check 2 matches workspaces to ` +
          `turbo's task graph by name, so a duplicate silently collapses to one entry and the ` +
          `other directory is checked against the wrong manifest. Rename one of them.`
      );
      continue;
    }
    seen.set(workspace.name, workspace.dir);
  }

  workspaces.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  skipped.sort();
  anomalies.sort();
  return { workspaces, skipped, anomalies };
}

/**
 * Report accumulated manifest defects as violations, in the same report as everything else.
 *
 * Every one of these means a workspace fell OUT of the enumeration, so it is not merely untidy:
 * an unenumerated workspace is invisible to both checks, which is the same hole CR-01 closes from
 * the other end.
 */
function reportManifestAnomalies(anomalies) {
  if (anomalies.length > 0) {
    console.error(
      `[ERROR] Enumeration: ${anomalies.length} workspace manifest(s) could not be classified, so ` +
        `those workspaces were NOT checked by either half of the invariant:\n` +
        anomalies.map((anomaly) => `  - ${anomaly}`).join('\n') +
        `\nA package.json this guard cannot read is a workspace it cannot check, and skipping it ` +
        `silently would hide exactly the coverage hole the guard exists to find.\n`
    );
  }

  return anomalies.length;
}

/**
 * True as soon as ONE test file is found beneath `dir`. The early return is deliberate: the
 * question Check 1 asks is "at least one", so building a full inventory would be wasted work in
 * front of every `yarn test:unit`.
 *
 * SYMLINKS ARE NOT FOLLOWED, stated rather than left to be inferred (phase 141 review WR-05):
 * `readdirSync` uses lstat semantics, so `isDirectory()` is false for a symlinked subdirectory and
 * the walk never descends into it. Tests behind such a link are therefore invisible to Check 1.
 * Following them would need an explicit visited-set to bound cycles; not followed is the cheaper
 * and safer choice for a walk that runs in front of every `yarn test:unit`, and no such link
 * exists under any workspace in this tree today.
 */
function hasTestFile(dir) {
  for (const dirent of readDirEntries(dir, 'it cannot be searched for test files (Check 1)')) {
    if (dirent.isDirectory()) {
      if (PRUNED_DIRS.has(dirent.name)) continue;
      if (hasTestFile(path.join(dir, dirent.name))) return true;
      continue;
    }
    if (TEST_FILE_PATTERN.test(dirent.name)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Check 1 — declared coverage
// ---------------------------------------------------------------------------

/**
 * A workspace containing test files MUST declare a `test:unit` script (UNIT-04 / D-09), AND that
 * script must actually invoke the test runner (phase 141 review CR-02).
 */
function checkDeclaredCoverage(workspaces) {
  const missingDeclaration = [];
  const noOpDeclarations = [];

  for (const workspace of workspaces) {
    // see phase 141 UNIT-04: EXACT-KEY equality only — no alias, no prefix match, no case-folding
    // and no Unicode normalisation. `test`, `test:watch` and `test:unit:watch` do NOT satisfy
    // this, and that strictness is the point: three of the five packages this phase wired already
    // carried a bare `test` script holding the identical `vitest run` command, and were still
    // invisible to CI, because `turbo run test:unit` fans out to the `test:unit` key and to
    // nothing else. Accepting a near-name here would re-open the hole it closes.
    if (Object.hasOwn(workspace.scripts, 'test:unit')) {
      // The key exists. Presence was the whole of the old assertion, and presence is not
      // execution any more than a task-graph entry was: a declaration that runs no runner is the
      // same empty claim this guard exists to reject, one shape over. Checked for EVERY declaring
      // workspace, not just the test-bearing ones — a no-op declaration is a defect in its own
      // right, and it is what makes the "N workspace(s) executed" census a lie.
      const command = workspace.scripts['test:unit'];
      if (typeof command !== 'string' || !TEST_RUNNER.test(command)) {
        noOpDeclarations.push({ ...workspace, command });
      }
      continue;
    }
    if (hasTestFile(workspace.dir)) missingDeclaration.push(workspace);
  }

  if (missingDeclaration.length > 0) {
    console.error(
      `[ERROR] Check 1 — declared coverage: ${missingDeclaration.length} workspace(s) contain ` +
        `test files but declare NO \`test:unit\` script, so \`turbo run test:unit\` runs nothing ` +
        `for them and their tests execute from NO command:\n` +
        missingDeclaration.map((w) => `  - ${w.name}  (${w.dir})`).join('\n') +
        `\nAdd \`"test:unit": "vitest run"\` to each package.json, or delete the test files. ` +
        `Leaving them in place implies coverage that does not exist: five workspaces sat in ` +
        `exactly this state holding 18 test files and 140 tests that no CI command executed ` +
        `(phase 141, requirement UNIT-04).\n`
    );
  }

  if (noOpDeclarations.length > 0) {
    console.error(
      `[ERROR] Check 1 — declared coverage: ${noOpDeclarations.length} workspace(s) declare a ` +
        `\`test:unit\` script that does NOT invoke the test runner, so turbo executes the task, ` +
        `reports success, and runs no tests:\n` +
        noOpDeclarations
          .map((w) => `  - ${w.name}  (${w.dir})  — declares \`test:unit\` = ${JSON.stringify(w.command)}`)
          .join('\n') +
        `\nA declaration that executes nothing is the empty claim this guard exists to reject: it ` +
        `passes a key-presence check, it passes turbo's non-\`${TURBO_NONEXISTENT}\` check, and it ` +
        `counts toward the reassuring "N workspace(s) executed" census while the workspace's ` +
        `tests never run. Set the script to \`"vitest run"\` (D-12), or delete it and let Check 1 ` +
        `report the missing declaration honestly (phase 141, requirement UNIT-04).\n`
    );
  }

  return missingDeclaration.length + noOpDeclarations.length;
}

// ---------------------------------------------------------------------------
// Check 2 — turbo execution
// ---------------------------------------------------------------------------

/** Capture and parse turbo's dry-run task graph, failing closed and by name on any problem. */
function readTurboTasks() {
  // The REPO-PINNED binary, not `npx turbo` (phase 141 review WR-04 / IN-05).
  //
  // `turbo` is a root devDependency pinned at ^2.8.17, and the `<NONEXISTENT>` sentinel this
  // entire check turns on is a contract observed at that version. `npx` prefers the local binary,
  // but when `node_modules` is absent or half-installed — a fresh clone, a failed `yarn install`,
  // a cache-restore miss in CI — it FETCHES a package from the registry instead: an unpinned
  // execution whose sentinel contract may differ, and a network/supply-chain surface in a script
  // whose stated input surface is the repository tree plus one read-only dry run and nothing else.
  // Depending on the npm version that fallback either errors or installs silently, and the silent
  // branch is the dangerous one. Naming the binary makes a broken install a named precondition
  // failure instead of an implicit install. It also fixes Windows, where `npx` is `npx.cmd` and
  // `execFileSync` without `shell: true` cannot spawn it at all since the Node 18.20/20.12
  // `.cmd`-spawn hardening.
  const turboBin = path.join('node_modules', '.bin', process.platform === 'win32' ? 'turbo.cmd' : 'turbo');
  if (!existsSync(fromRepoRoot(turboBin))) {
    fail(
      `Check 2 — turbo execution: '${turboBin}' is missing, so the execution half of the ` +
        `invariant cannot be checked. Run \`yarn install\`. A dry run that cannot be obtained is ` +
        `never read as "everything is accounted for" — this fails closed rather than falling ` +
        `back to fetching an unpinned turbo from the registry, whose \`${TURBO_NONEXISTENT}\` ` +
        `sentinel contract this check depends on.`
    );
  }

  let raw;
  try {
    // `cwd: REPO_ROOT` moves with the path resolution above (phase 141 review IN-04): turbo
    // discovers the workspace graph from its working directory, so pinning the binary path
    // without pinning the CWD would leave the half of Check 2 that matters still depending on
    // where the process was launched.
    raw = execFileSync(fromRepoRoot(turboBin), ['run', 'test:unit', '--dry=json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024
    });
  } catch (error) {
    fail(
      `Check 2 — turbo execution: \`${turboBin} run test:unit --dry=json\` FAILED, so the ` +
        'execution half of the invariant could not be checked. A dry run that cannot be obtained ' +
        'is never read as "everything is accounted for" — this fails closed. Check that the ' +
        `\`test:unit\` task is still defined in turbo.json. Captured output:\n${head(
          `${error.stdout ?? ''}${error.stderr ?? ''}` || error.message
        )}`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(
      `Check 2 — turbo execution: the output of \`${turboBin} run test:unit --dry=json\` is NOT ` +
        `parseable JSON (${error.message}), so the execution half of the invariant could not be ` +
        'checked. Unreadable input is never read as "everything is accounted for" — this fails ' +
        `closed. Captured output:\n${head(raw)}`
    );
  }

  // `parsed === null || typeof parsed !== 'object'` FIRST (phase 141 review WR-06): a payload of
  // `null` — or of any scalar — made `parsed.tasks` throw a raw `TypeError: Cannot read properties
  // of null` BEFORE reaching the `Array.isArray` guard written to catch exactly this class, so the
  // check meant to name the problem was stepped over by it.
  if (parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.tasks)) {
    fail(
      'Check 2 — turbo execution: the parsed `--dry=json` payload has no array `tasks` field, so ' +
        'the execution half of the invariant could not be checked. The payload shape turbo emits ' +
        `has changed; update this check in ${SELF} before trusting a green run. Captured ` +
        `output:\n${head(raw)}`
    );
  }

  return parsed.tasks.filter((task) => task && task.task === 'test:unit');
}

/** A workspace declaring `test:unit` MUST be executed by turbo (UNIT-02 / D-17). */
function checkTurboExecution(workspaces) {
  const tasks = readTurboTasks();

  // see phase 141 D-17 / research Pitfall 1: THIS FILTER IS THE CHECK.
  //
  // `--dry=json` emits turbo's POTENTIAL task graph. Every workspace gets a `test:unit` entry
  // whether or not the script exists, and a workspace with no such script surfaces as
  // `"command": "<NONEXISTENT>"` rather than as an ABSENT entry. So the obvious implementation —
  // "is this package present in tasks[]?" — is GREEN on a completely unwired tree. That is not a
  // hypothetical: measured at HEAD before any of this phase's work landed, the naive predicate
  // reported "0 unaccounted" while five test-bearing workspaces ran no tests at all, and it
  // reported BYTE-IDENTICALLY after the wiring landed and 140 tests started executing
  // (141-NEGATIVE-CONTROL.md rows 3 and 6). Its output is independent of the very property
  // UNIT-02 asks it to measure.
  //
  // Presence is not execution. The `command` field is the only thing in the payload that carries
  // the distinction, so the comparison against TURBO_NONEXISTENT is what makes this check able to
  // fail at all.
  //
  // Which is exactly why its TYPE is asserted first (phase 141 review WR-02): `undefined !==
  // '<NONEXISTENT>'` is TRUE, so a turbo that renames or drops `command` would drop EVERY task
  // into `executed` and turn this check silently green. The A4 backwards-read below is not a
  // sufficient backstop for that — it only fires while some enumerated workspace declares no
  // `test:unit`, which is a property of today's tree (`dev-tools`, `shared-config`,
  // `supabase-types`), not of this code. The moment those three gain the script or leave, the
  // mitigation degrades to a no-op. A payload whose discriminator is missing cannot be checked at
  // all, so it fails closed here rather than being read as "everything is accounted for".
  const missingCommand = tasks.filter((task) => typeof task.command !== 'string');
  if (missingCommand.length > 0) {
    fail(
      `Check 2 — turbo execution: ${missingCommand.length} \`test:unit\` task entr(ies) carry no ` +
        `string \`command\` field (e.g. ${missingCommand[0].taskId ?? '(no taskId)'}). That field ` +
        `is the ONLY discriminator between an executed task and an unwired one, so a payload ` +
        `without it cannot be checked — this fails closed rather than counting every task as ` +
        `executed. The payload shape turbo emits has changed: update TURBO_NONEXISTENT and this ` +
        `parser in ${SELF} before trusting a green run (research assumption A4).`
    );
  }

  const executed = tasks
    .filter((task) => task.command !== TURBO_NONEXISTENT)
    .map((task) => task.package)
    .sort();
  const unwired = tasks
    .filter((task) => task.command === TURBO_NONEXISTENT)
    .map((task) => task.package)
    .sort();

  if (executed.length === 0) {
    fail(
      "Check 2 — turbo execution: turbo's dry run reports ZERO executed `test:unit` tasks. An " +
        'empty executed set is never read as "everything is accounted for" — with nothing ' +
        'running, every declaration in the tree is unverified, which is the failure this guard ' +
        `exists to surface. ${tasks.length} \`test:unit\` task entr(ies) were seen in total.`
    );
  }

  const executedSet = new Set(executed);
  const declaring = workspaces.filter((workspace) => Object.hasOwn(workspace.scripts, 'test:unit'));

  // Matching is on the package `name` field with exact string equality — never the directory
  // name — because turbo's graph reports package names (`@openvaa/question-info`, whose directory
  // is `packages/question-info`).
  const notExecuted = declaring.filter((workspace) => !executedSet.has(workspace.name));

  // The A4 mitigation: the same equality read backwards. If a future turbo stops using the
  // `<NONEXISTENT>` sentinel, unwired workspaces would be misread as executed and the filter above
  // would go quietly green — but they would then appear here, as packages turbo claims to run a
  // `test:unit` for while declaring no such script. The sentinel contract is therefore not trusted
  // silently; a change to it turns this guard RED rather than blind.
  const declaredBy = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const unexpectedlyExecuted = executed.filter(
    (name) => !declaredBy.has(name) || !Object.hasOwn(declaredBy.get(name).scripts, 'test:unit')
  );

  let violations = 0;

  if (notExecuted.length > 0) {
    violations += notExecuted.length;
    console.error(
      `[ERROR] Check 2 — turbo execution: ${notExecuted.length} workspace(s) declare a ` +
        `\`test:unit\` script that \`turbo run test:unit\` does NOT execute, so their tests run ` +
        `from NO command even though their package.json says otherwise:\n` +
        notExecuted
          .map(
            (w) =>
              `  - ${w.name}  (${w.dir})  — ${
                tasks.some((task) => task.package === w.name)
                  ? `turbo reports command "${TURBO_NONEXISTENT}"`
                  : "absent from turbo's task graph entirely"
              }`
          )
          .join('\n') +
        `\nThe likely cause is drift between the two lists that must agree: a root named in ` +
        `WORKSPACE_ROOTS (${SELF}) that the root package.json "workspaces" globs do not cover, so ` +
        `this guard scans the workspace and turbo never sees it. Either add the root to those ` +
        `globs, or remove it from WORKSPACE_ROOTS. Leaving it implies coverage that does not ` +
        `exist (phase 141, requirement UNIT-02 / D-17).\n`
    );
  }

  if (unexpectedlyExecuted.length > 0) {
    violations += unexpectedlyExecuted.length;
    console.error(
      `[ERROR] Check 2 — turbo execution: turbo reports a runnable \`test:unit\` command for ` +
        `${unexpectedlyExecuted.length} workspace(s) that declare no such script:\n` +
        unexpectedlyExecuted.map((name) => `  - ${name}`).join('\n') +
        `\nThis should be impossible while turbo marks a missing script with the ` +
        `"${TURBO_NONEXISTENT}" sentinel this check discriminates on (observed at turbo 2.8.17). ` +
        `If it fires, that contract has changed and the filter can no longer tell an executed ` +
        `task from an unwired one — update TURBO_NONEXISTENT in ${SELF} before trusting a green ` +
        `run (research assumption A4).\n`
    );
  }

  // `unwired` travels out BY NAME, not as an integer (phase 141 review IN-01). The A4 mitigation
  // recorded in 141-NEGATIVE-CONTROL.md row 8 leans on this list as its drift signal, and a count
  // with no names cannot be acted on: a reader watching it go 3 → 4 has no way to learn WHICH
  // workspace turbo stopped running. It is also the same standard the `skipped` list already
  // holds itself to — see WHAT was excluded, rather than trust that nothing was.
  return { violations, executedCount: executed.length, unwired };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Before anything is scanned: confirm the set this guard is ABOUT to scan is the set that
  // actually exists. Every list both checks iterate is derived from the enumeration below, so a
  // root missing from it is a hole no later check can see (phase 141 review CR-01).
  assertWorkspaceRootsMatchManifest();

  const { workspaces, skipped, anomalies } = enumerateWorkspaces();

  // Enumeration defects and BOTH checks report in full before the single exit: a developer with
  // one bad manifest, three unwired workspaces and a drifted root should learn all of it from one
  // invocation, not discover it one run at a time (phase 141 review IN-02).
  const enumerationViolations = reportManifestAnomalies(anomalies);
  const check1Violations = checkDeclaredCoverage(workspaces);
  const check2 = checkTurboExecution(workspaces);
  const errorCount = enumerationViolations + check1Violations + check2.violations;

  console.log(
    `Unit-test coverage guard (phase 141: UNIT-04, UNIT-02) — ` +
      `Enumeration: ${enumerationViolations} unclassifiable manifest(s); ` +
      `Check 1 (declared coverage): ${check1Violations} violation(s); ` +
      `Check 2 (turbo execution): ${check2.violations} violation(s), ` +
      `${check2.executedCount} workspace(s) executed, ${check2.unwired.length} unwired` +
      `${check2.unwired.length > 0 ? `: ${check2.unwired.join(', ')}` : ''}. ` +
      `Scanned ${workspaces.length} workspace(s) under ${WORKSPACE_ROOTS.join(', ')}; ` +
      `${skipped.length} non-workspace entr(ies) skipped` +
      `${skipped.length > 0 ? `: ${skipped.join(', ')}` : ''}. ` +
      `Total: ${errorCount} violation(s).`
  );

  // One severity. There is no warning tier and no severity switch to demote a failure with,
  // because an opt-in-severity escape hatch is exactly the class phase 140 removed.
  //
  // `process.exitCode` rather than `process.exit()`: the latter would terminate before the queued
  // pipe writes above drained, truncating the violation lists this guard exists to print (phase
  // 141 review WR-03). Setting the code and letting the event loop run out exits with the same
  // status and the whole message.
  process.exitCode = errorCount > 0 ? 1 : 0;
}

try {
  main();
} catch (error) {
  // Named precondition failures print here, once, and set the status the same way a violation
  // does. Anything else is a genuine defect in this guard and is allowed to surface as-is rather
  // than be dressed up as an invariant violation.
  if (!(error instanceof GuardFailure)) throw error;
  console.error(`\nUnit-test coverage guard: ${error.message}\n`);
  process.exitCode = 1;
}
