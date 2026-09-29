#!/usr/bin/env node
/**
 * e2e-verdict.mjs -- the CLAUDE.md E2E hard rule as an exit status, read from one run directory.
 *
 * `tests/scripts/e2e-run.sh --run-dir <dir>` leaves `<dir>/exit` (the wrapper's own exit code) and
 * `<dir>/results.json` (Playwright's JSON report). A run passes only when all of these hold:
 *   - `exit` is `0`
 *   - stats.unexpected is 0  (failed)
 *   - stats.flaky is 0       (passed only on retry; the project admits no flaky test)
 *   - stats.skipped is 0     (a did-not-run test is counted here, and CLAUDE.md counts it as a failure)
 *   - stats.expected >= the minimum (a run that silently lost specs is not a green run)
 *
 * Usage:
 *   node e2e-verdict.mjs <run-dir> [--min-expected N]
 *
 *   --min-expected N   Default 165: the expected count of the last green full run on this host,
 *                      tests/e2e-runs/260922-dd8.
 *
 * Prints one line: `exit=<e> expected=<n> unexpected=<n> flaky=<n> skipped=<n>`, then the verdict.
 *
 * Exit codes:
 *   0  the run is green under every condition above
 *   1  any condition fails (each failing condition is named)
 *   2  usage error, or `exit` / `results.json` is missing or unreadable
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

function usageError(message) {
  console.error(`e2e-verdict.mjs: ${message}`);
  console.error('usage: node e2e-verdict.mjs <run-dir> [--min-expected N]');
  process.exit(2);
}

const argv = process.argv.slice(2);
let minExpected = 165;
const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--min-expected') {
    const v = argv[i + 1];
    if (v === undefined || !/^\d+$/.test(v)) usageError('--min-expected needs a non-negative integer');
    minExpected = Number(v);
    i++;
  } else if (argv[i].startsWith('--')) usageError(`unknown flag: ${argv[i]}`);
  else positional.push(argv[i]);
}
if (positional.length !== 1) usageError('need exactly one <run-dir>');

const dir = resolve(positional[0]);
const exitPath = join(dir, 'exit');
const resultsPath = join(dir, 'results.json');
for (const p of [exitPath, resultsPath]) {
  if (!existsSync(p)) {
    console.error(`e2e-verdict.mjs: missing ${p}`);
    process.exit(2);
  }
}

const exitText = readFileSync(exitPath, 'utf-8').trim();
let stats;
try {
  stats = JSON.parse(readFileSync(resultsPath, 'utf-8')).stats;
} catch (error) {
  console.error(`e2e-verdict.mjs: cannot parse ${resultsPath} (${error.message})`);
  process.exit(2);
}
if (!stats || typeof stats !== 'object') {
  console.error(`e2e-verdict.mjs: ${resultsPath} carries no stats object`);
  process.exit(2);
}
for (const key of ['expected', 'unexpected', 'flaky', 'skipped']) {
  if (!Number.isInteger(stats[key])) {
    console.error(`e2e-verdict.mjs: stats.${key} is not an integer in ${resultsPath}`);
    process.exit(2);
  }
}

console.log(
  `exit=${exitText} expected=${stats.expected} unexpected=${stats.unexpected} flaky=${stats.flaky} skipped=${stats.skipped}`
);

const failures = [];
if (exitText !== '0') failures.push(`wrapper exit is ${exitText}, not 0`);
if (stats.unexpected !== 0) failures.push(`${stats.unexpected} failed`);
if (stats.flaky !== 0) failures.push(`${stats.flaky} flaky`);
if (stats.skipped !== 0) failures.push(`${stats.skipped} skipped or did not run`);
if (stats.expected < minExpected) failures.push(`expected ${stats.expected} is below the minimum ${minExpected}`);

if (failures.length > 0) {
  console.log(`VERDICT: RED -- ${failures.join('; ')}`);
  process.exit(1);
}
console.log(`VERDICT: GREEN (expected ${stats.expected} >= ${minExpected}, 0 failed, 0 flaky, 0 did-not-run)`);
process.exit(0);
