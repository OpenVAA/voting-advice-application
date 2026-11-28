#!/usr/bin/env node

/**
 * NODE-ENGINE GUARD.
 *
 * Makes the root manifest's `engines.node` range bind. Yarn no longer checks engines, and
 * `actions/setup-node` only warns when it cannot read a version, so without this guard a range that
 * is misspelled (`engine`) or not met passes silently. It runs twice: as the root `preinstall`,
 * which rejects an out-of-range Node before any dependency is linked (Yarn caches that result, so a
 * repeat install does not re-run it), and in `lint:check`, which runs on every CI job.
 *
 * It must have no dependencies: `preinstall` runs before `node_modules` exists. So it accepts only a
 * single `>=MAJOR[.MINOR[.PATCH]]` comparator, zero-padding a partial version, and fails by name on
 * any other range rather than guessing at it; widening the range means extending this file.
 * `--self-test` checks the comparator against a table of cases and nothing in the repository.
 *
 * Usage:
 *   node scripts/assert-node-engine.mjs
 *   node scripts/assert-node-engine.mjs --self-test
 *
 * Exit codes:
 *   0 - the running Node satisfies the declared `engines.node` range
 *   1 - it does not, or the manifest is unreadable, the `engines` key is missing (a misspelled
 *       `engine` key is named), `engines.node` is missing or empty, or the range is not `>=X[.Y[.Z]]`
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `scripts` → repo root. */
const REPO_ROOT = resolve(HERE, '..');
const MANIFEST = resolve(REPO_ROOT, 'package.json');

/** The spelling tools read, and the misspelling no tool reads. */
const FIELD = 'engines';
const MISSPELLING = 'engine';

const RANGE_RE = /^>=\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;

function fail(message) {
  console.error(`assert-node-engine: ${message}`);
  process.exit(1);
}

/**
 * Does `actual` (a `[major, minor, patch]` triple) satisfy `range`? Throws on any range other than
 * `>=X[.Y[.Z]]`; never returns a value for an input it could not read.
 */
export function satisfies(actual, range) {
  const match = RANGE_RE.exec(range.trim());
  if (!match) {
    throw new Error(
      `only ">=X[.Y[.Z]]" is accepted, not "${range}" — extend scripts/assert-node-engine.mjs if the range must change shape`
    );
  }
  const minimum = [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)];
  for (let i = 0; i < 3; i++) {
    if (actual[i] !== minimum[i]) return actual[i] > minimum[i];
  }
  return true;
}

/** `v24.14.1` / `24.14.1-nightly…` → `[24, 14, 1]`. */
function parseRunningVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) throw new Error(`cannot read the running Node version "${version}"`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

const SELF_TEST_CASES = [
  { range: '>=24.15.0', version: 'v24.15.0', expected: true },
  { range: '>=24.15.0', version: 'v24.15.1', expected: true },
  { range: '>=24.15.0', version: 'v25.0.0', expected: true },
  { range: '>=24.15.0', version: 'v24.14.9', expected: false },
  { range: '>=24.15.0', version: 'v23.99.99', expected: false },
  { range: '>=24.15', version: 'v24.15.0', expected: true },
  { range: '>=24.15', version: 'v24.14.1', expected: false },
  { range: '>=24', version: 'v24.0.0', expected: true },
  { range: '>=24', version: 'v23.11.0', expected: false },
  { range: '>= v24.15.0', version: 'v24.15.0', expected: true },
  // Forms this guard refuses rather than guesses at. `expected: 'refuse'` asserts it throws.
  { range: '^24.0.0', version: 'v24.1.0', expected: 'refuse' },
  { range: '24.x', version: 'v24.1.0', expected: 'refuse' },
  { range: '>=22 <26', version: 'v24.0.0', expected: 'refuse' }
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
    // The misspelling is named rather than reported as a generic absence.
    const hint =
      manifest[MISSPELLING] === undefined
        ? ''
        : ` An "${MISSPELLING}" key IS present — no tool reads it. Rename it to "${FIELD}".`;
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
