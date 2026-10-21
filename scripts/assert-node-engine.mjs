#!/usr/bin/env node

/**
 * NODE-ENGINE GUARD (phase 153, requirement REVIEW-CFG-02).
 *
 * The incident this file exists for: the root manifest and `apps/frontend/package.json` both
 * declared the field as `engine` — singular — for as long as anyone had looked. Nothing read it,
 * so nothing said so. `engines` is the name every tool in the ecosystem resolves; `engine` is
 * inert JSON. The repository therefore carried a Node version constraint that constrained
 * nothing, and looked exactly like a repository that carried one.
 *
 * Correcting the spelling on its own would not have changed that. The field would have been
 * spelled the way tools read, and still nothing in this repository would have read it. That is
 * the whole point of the requirement's word BINDS: the constraint has to be OBSERVED to reject
 * an out-of-range Node, not merely to be spelled in a way that would let something reject one.
 *
 * WHY A HAND-ROLLED CHECK, when the obvious answer is "the package manager already does this".
 * It does not, and that was measured three independent ways against the pinned Yarn release this
 * repository runs:
 *
 *   1. The release bundle contains zero occurrences of `engineStrict`, `enableEngineChecks`,
 *      `engine-strict` or `checkEngines`. What it does contain is Yarn's own deprecation
 *      message: "The --ignore-engines option is deprecated; engine checking isn't a core feature
 *      anymore".
 *   2. `yarn config --json` emits 101 settings, none of them engine-related. The single case
 *      insensitive `/engine/` match is `enableMessageNames`, whose description happens to
 *      contain the words "search engines".
 *   3. A scratch project declaring `engines: { node: ">=99" }` installs cleanly, with neither an
 *      error nor a warning, under a Node that cannot possibly satisfy it.
 *
 * So the decision that had been taken — "let the package manager error on a mismatch" — rested
 * on a capability the package manager removed. Its rejection of a repository-owned check rested
 * on the same false premise, and was reversed on the record once the premise was measured.
 *
 * THE OTHER CANDIDATE, and why it is not enough on its own. `actions/setup-node` can read a
 * version from `node-version-file: package.json`. Read at the tag this repository pins, its
 * resolver returns `null` when neither `volta.node` nor `engines.node` is present, and its
 * caller responds to `null` with `core.warning('Could not determine node version from …. Falling
 * back')` and an empty version — which its own caller then skips on, installing no Node at all
 * and proceeding on whatever the runner image already had. A warning annotation is not a
 * failure. Under that mechanism alone, re-misspelling the field produces a yellow annotation in
 * an otherwise green run: a false green of precisely the shape this work exists to abolish. The
 * measurement is recorded in full beside the plan that made it.
 *
 * WIRED TWICE, DELIBERATELY, because each wiring closes a hole the other leaves open:
 *
 *   `preinstall` — the install-time half. A root `preinstall` IS run by this Yarn release
 *     (measured: marker files for `preinstall`, `install` and `postinstall` all appear after a
 *     root `yarn install`), and a non-zero exit from it DOES fail the install (measured: exit
 *     code 1, reported as YN0009 "couldn't be built successfully"). This is the half that
 *     literally rejects an out-of-range Node, on a developer machine and in CI alike, before a
 *     single dependency is linked.
 *
 *     Its limit, measured rather than assumed: Yarn treats the root workspace's lifecycle
 *     scripts as a BUILD, and caches the result. A second `yarn install` over an unchanged tree
 *     does not re-run them ("must be built because it never has been before or the last one
 *     failed" is the condition). So the install-time half fires on a fresh clone, in CI, and
 *     after any previous failure — but not on a no-op repeat install by a developer who changed
 *     Node runtimes since.
 *
 *   `lint:check` — the every-run half, which is what closes that gap. It is uncached, it is what
 *     CI runs on every job, and it is the chain this repository already uses for its standing
 *     guards.
 *
 * DEPENDENCIES: NONE, AND THAT IS A CONSTRAINT RATHER THAN A PREFERENCE. `preinstall` runs
 * BEFORE `node_modules` exists. On a fresh clone there is nothing to import — a guard that
 * reached for a range-parsing library would crash with an unresolvable import at exactly the
 * moment it is most needed, and would do so with a message about a missing module rather than
 * about the Node version. Node built-ins only, no build step, no install step.
 *
 * WHICH IS WHY THE ACCEPTED RANGE GRAMMAR IS NARROW, AND FAILS CLOSED. Writing a general range
 * parser from scratch would be the wrong trade: the subtleties are exactly where a hand-rolled
 * implementation goes quietly wrong, and a comparator that is quietly wrong is worse than no
 * comparator at all. So this file implements only the fragment it can implement CORRECTLY, and
 * REFUSES — by name, non-zero — anything outside it, rather than guessing:
 *
 *   accepted: `||` between alternatives; whitespace-separated comparators within an alternative;
 *             operators `>=`, `>`, `<`, `<=`, `=` and bare (an exact version).
 *   accepted partial (`22`, `22.4`): with `>=` and `<` ONLY, where zero-padding is exactly what
 *             the ecosystem's range semantics mean.
 *   refused:  a partial version under `>`, `<=`, `=` or bare — because there `22` does NOT mean
 *             `22.0.0`; the ecosystem reads those as x-ranges (`>22` means `>=23.0.0`,
 *             `<=22` means `<23.0.0`). Rather than reimplement that correctly-but-surprisingly,
 *             this guard declines and says so.
 *   refused:  `^`, `~`, hyphen ranges, `x`/`*` wildcards, prerelease qualifiers in the range.
 *
 * A refusal is a FAILURE, not a skip. If someone widens the declared range to a form this file
 * does not accept, the guard goes red and names the form, and the fix is to extend this file
 * deliberately — reviewed as the decision it is. It is never to let an unparsed range pass,
 * because a guard that cannot read its own input and reports green is the defect it was built to
 * prevent.
 *
 * NO OPT-OUT, BY CONSTRUCTION: no flag, no environment variable, no ignore file, no warn-only
 * tier. `--self-test` runs the comparator against a table of cases including negative ones, and
 * checks nothing about the repository; it does not skip the real check when the real check is
 * asked for.
 *
 * Usage:
 *   node scripts/assert-node-engine.mjs
 *   node scripts/assert-node-engine.mjs --self-test
 *
 * Exit codes:
 *   0 - the running Node satisfies the declared `engines.node` range
 *   1 - it does not, or a named precondition failed: the manifest is unreadable, the `engines`
 *       key is missing (including the case where a misspelled `engine` key is present instead),
 *       `engines.node` is missing or empty, or the declared range is outside the accepted
 *       grammar above
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `scripts` → repo root. */
const REPO_ROOT = resolve(HERE, '..');
const MANIFEST = resolve(REPO_ROOT, 'package.json');

/** The one true spelling, and the one that has actually been in the tree. */
const FIELD = 'engines';
const MISSPELLING = 'engine';

const COMPARATOR_RE = /^(>=|<=|>|<|=)?v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;
/** Zero-padding a partial version is only faithful to range semantics under these two. */
const PARTIAL_OK = new Set(['>=', '<']);

function fail(message) {
  console.error(`assert-node-engine: ${message}`);
  process.exit(1);
}

/**
 * Parse a single comparator into `{ op, triple }`, or throw with a message naming what was
 * refused and why. Throwing rather than returning null keeps the refusal reasons specific.
 */
function parseComparator(raw) {
  const match = COMPARATOR_RE.exec(raw);
  if (!match) {
    throw new Error(
      `cannot read the comparator "${raw}". Accepted: >=, >, <, <=, = or bare, followed by a ` +
        `version. Caret, tilde, hyphen ranges, wildcards and prerelease qualifiers are refused ` +
        `rather than guessed at — extend scripts/assert-node-engine.mjs if the range must widen.`
    );
  }
  const [, operator, major, minor, patch] = match;
  const op = operator ?? '=';
  const partial = minor === undefined || patch === undefined;
  if (partial && !PARTIAL_OK.has(op)) {
    throw new Error(
      `refusing the partial version in "${raw}": under "${op}" a partial version is an x-range ` +
        `(">22" means ">=23.0.0", "<=22" means "<23.0.0"), which this guard does not implement. ` +
        `Write the version in full, or use ">=" / "<".`
    );
  }
  return { op, triple: [Number(major), Number(minor ?? 0), Number(patch ?? 0)] };
}

/** Lexicographic comparison of two `[major, minor, patch]` triples. */
function compareTriples(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

function holds({ op, triple }, actual) {
  const cmp = compareTriples(actual, triple);
  switch (op) {
    case '>=':
      return cmp >= 0;
    case '>':
      return cmp > 0;
    case '<=':
      return cmp <= 0;
    case '<':
      return cmp < 0;
    default:
      return cmp === 0;
  }
}

/**
 * Does `actual` (a `[major, minor, patch]` triple) satisfy `range`? Throws on a range outside the
 * accepted grammar; never returns a value for an input it could not read.
 */
export function satisfies(actual, range) {
  const alternatives = range
    .split('||')
    .map((alternative) => alternative.trim())
    .filter((alternative) => alternative.length > 0);
  if (alternatives.length === 0) throw new Error('the declared range is empty');

  return alternatives.some((alternative) => {
    const comparators = alternative.split(/\s+/).filter((token) => token.length > 0);
    return comparators.map(parseComparator).every((comparator) => holds(comparator, actual));
  });
}

/** `v24.14.1` / `24.14.1-nightly…` → `[24, 14, 1]`. */
function parseRunningVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) throw new Error(`cannot read the running Node version "${version}"`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

const SELF_TEST_CASES = [
  // The declared range, against versions either side of its boundary.
  { range: '>=22', version: 'v24.14.1', expected: true },
  { range: '>=22', version: 'v22.0.0', expected: true },
  { range: '>=22', version: 'v21.7.3', expected: false },
  { range: '>=22', version: 'v20.19.0', expected: false },
  // Full triples under every operator.
  { range: '>=22.11.0', version: 'v22.10.9', expected: false },
  { range: '<22.0.0', version: 'v21.7.3', expected: true },
  { range: '<=22.11.0', version: 'v22.11.0', expected: true },
  { range: '>22.11.0', version: 'v22.11.0', expected: false },
  { range: '22.11.0', version: 'v22.11.0', expected: true },
  { range: '22.11.0', version: 'v22.11.1', expected: false },
  // Conjunction and alternation.
  { range: '>=22 <24.0.0', version: 'v23.5.0', expected: true },
  { range: '>=22 <24.0.0', version: 'v24.0.0', expected: false },
  { range: '>=20.9.0 <21.0.0 || >=22', version: 'v20.10.0', expected: true },
  { range: '>=20.9.0 <21.0.0 || >=22', version: 'v21.5.0', expected: false },
  // Forms this guard refuses rather than guesses at. `expected: 'refuse'` asserts it throws.
  { range: '^22.0.0', version: 'v22.1.0', expected: 'refuse' },
  { range: '~22.1', version: 'v22.1.0', expected: 'refuse' },
  { range: '22.x', version: 'v22.1.0', expected: 'refuse' },
  { range: '*', version: 'v22.1.0', expected: 'refuse' },
  { range: '20 - 22', version: 'v21.0.0', expected: 'refuse' },
  { range: '>22', version: 'v23.0.0', expected: 'refuse' },
  { range: '<=22', version: 'v22.0.0', expected: 'refuse' },
  { range: '22', version: 'v22.0.0', expected: 'refuse' },
  { range: '', version: 'v22.0.0', expected: 'refuse' }
];

function selfTest() {
  const failures = [];
  for (const { range, version, expected } of SELF_TEST_CASES) {
    let actual;
    try {
      actual = satisfies(parseRunningVersion(version), range);
    } catch {
      actual = 'refuse';
    }
    if (actual !== expected) {
      failures.push(`  ${JSON.stringify(range)} vs ${version}: expected ${expected}, got ${actual}`);
    }
  }
  if (failures.length > 0) {
    console.error(`assert-node-engine --self-test: ${failures.length} case(s) wrong\n${failures.join('\n')}`);
    process.exit(1);
  }
  console.info(`assert-node-engine --self-test: ${SELF_TEST_CASES.length} cases OK`);
  process.exit(0);
}

function main() {
  if (process.argv.includes('--self-test')) selfTest();

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch (error) {
    fail(`could not read or parse ${MANIFEST} (${error.message})`);
  }

  const engines = manifest[FIELD];
  if (engines === undefined) {
    // The original defect, caught by name rather than as a generic absence.
    const hint =
      manifest[MISSPELLING] === undefined
        ? ''
        : ` An "${MISSPELLING}" key IS present — that is the misspelling this guard exists for; no tool reads it. Rename it to "${FIELD}".`;
    fail(`the root manifest declares no "${FIELD}" key, so there is no Node range to enforce.${hint}`);
  }

  const range = typeof engines === 'object' && engines !== null ? engines.node : undefined;
  if (typeof range !== 'string' || range.trim().length === 0) {
    fail(`"${FIELD}.node" is missing or empty in the root manifest, so there is no Node range to enforce.`);
  }

  const running = parseRunningVersion(process.version);

  let ok;
  try {
    ok = satisfies(running, range);
  } catch (error) {
    fail(`the declared range "${range}" is outside the grammar this guard accepts: ${error.message}`);
  }

  if (!ok) {
    fail(
      `this Node is ${process.version}, and the root manifest declares "${FIELD}.node": "${range}". ` +
        `Switch to a Node satisfying that range, or change the declared range deliberately.`
    );
  }

  console.info(`assert-node-engine: ${process.version} satisfies "${FIELD}.node": "${range}" — OK`);
}

main();
