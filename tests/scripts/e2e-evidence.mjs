#!/usr/bin/env node
/**
 * e2e-evidence.mjs -- derive the two AUDITABLE verdict artifacts, `summary.json` and `provenance.txt`, from the raw files `e2e-run.sh` leaves in a run directory.
 *
 * Usage: node tests/scripts/e2e-evidence.mjs <run-dir> [--note "<free text>"]
 *
 * WHY THIS EXISTS: `e2e-run.sh` writes the RAW evidence (`results.json`, `head`, `worktree-status.txt`, `started`, `ended`, `exit`, `preflight-failures`, `preflight-successes`, `env-posture.txt`) but no rolled-up verdict. The phase-147-era runs under `tests/e2e-runs/` carry a `summary.json` and a `provenance.txt` produced by tooling that no longer exists, and every later plan's acceptance instrument still reads those two names. This script closes that gap MECHANICALLY: every number it emits is computed from `results.json` or copied verbatim from a file the wrapper wrote, so the rolled-up verdict is derived evidence rather than a second, hand-maintained claim.
 *
 * It is deliberately a SEPARATE, after-the-fact step rather than a block inside `e2e-run.sh`: it can be re-run against any historical run directory without re-running the suite, and a bug here can never change a run's outcome.
 *
 * DID-NOT-RUN IS NOT A SKIP. Playwright reports both as `status: "skipped"`. The discriminator is `results.length`: a test the runner never executed -- because a project it depends on failed -- carries an EMPTY results array and no annotation, while a declaratively skipped test carries a `skip`/`fixme` annotation or a recorded skipped result. Under this project's cardinal E2E rule a did-not-run test counts as a FAILURE, so the ambiguous case (empty results, no annotation) is classified as `didNotRun`, never as `skipped`.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let runDir = '';
let note = '';
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--note') {
    if (i + 1 >= args.length) {
      console.error('e2e-evidence.mjs: --note requires a value');
      process.exit(2);
    }
    note = args[i + 1];
    i += 1;
  } else if (runDir === '') {
    runDir = args[i];
  } else {
    console.error(`e2e-evidence.mjs: unexpected argument '${args[i]}'`);
    process.exit(2);
  }
}
if (runDir === '') {
  console.error('e2e-evidence.mjs: <run-dir> is required');
  process.exit(2);
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const dir = path.isAbsolute(runDir) ? runDir : path.join(repoRoot, runDir);

/** Read a wrapper-written file, trimmed. Returns `fallback` when the file is absent, so a partial run still produces a readable record rather than a crash. */
function readOr(name, fallback) {
  try {
    return fs.readFileSync(path.join(dir, name), 'utf8').trim();
  } catch {
    return fallback;
  }
}

const resultsPath = path.join(dir, 'results.json');
if (!fs.existsSync(resultsPath)) {
  console.error(`e2e-evidence.mjs: ${resultsPath} is missing -- there is no run to summarise`);
  process.exit(3);
}
const report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

/** A zero-filled tally, used for the run total and for each per-project bucket. */
function blank() {
  return { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, didNotRun: 0, durationMs: 0 };
}
const counts = blank();
const byProject = {};

/** Walk the report's recursive suite tree and classify every test entry exactly once. */
function walk(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const project = test.projectName || '(no project)';
        byProject[project] = byProject[project] ?? blank();
        const bucket = byProject[project];
        const results = test.results ?? [];
        const annotations = (test.annotations ?? []).map((a) => a.type);
        const declarativeSkip = annotations.includes('skip') || annotations.includes('fixme');
        const durationMs = results.reduce((sum, r) => sum + (r.duration ?? 0), 0);
        let kind;
        if (test.status === 'skipped') {
          kind = results.length === 0 && !declarativeSkip ? 'didNotRun' : 'skipped';
        } else if (test.status === 'expected') {
          kind = 'passed';
        } else if (test.status === 'flaky') {
          kind = 'flaky';
        } else {
          kind = 'failed';
        }
        counts.total += 1;
        counts[kind] += 1;
        counts.durationMs += durationMs;
        bucket.total += 1;
        bucket[kind] += 1;
        bucket.durationMs += durationMs;
      }
    }
    walk(suite.suites);
  }
}
walk(report.suites);
delete counts.durationMs;

const stats = report.stats ?? {};
const wallClockMs = Math.round(stats.duration ?? 0);
const summary = {
  runDir: path.relative(repoRoot, dir),
  counts,
  playwrightStats: {
    expected: stats.expected ?? 0,
    unexpected: stats.unexpected ?? 0,
    flaky: stats.flaky ?? 0,
    skipped: stats.skipped ?? 0,
    durationMs: stats.duration ?? 0,
    startTime: stats.startTime ?? ''
  },
  wallClockMs,
  wallClockHuman: `${(wallClockMs / 60000).toFixed(1)} min`,
  byProject: Object.fromEntries(Object.entries(byProject).sort(([a], [b]) => a.localeCompare(b)))
};
fs.writeFileSync(path.join(dir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

const head = readOr('head', '');
const worktreeStatus = readOr('worktree-status.txt', '');
const posture = readOr('env-posture.txt', '');
const dbResetLine = /^db_reset=(\S+)/m.exec(posture);
// The Playwright argument line is what proves a run was the FULL gate suite rather than a `--project` or `--grep` slice, so it is load-bearing evidence rather than decoration. `e2e-run.sh` echoes it on its OWN stdout, which the run directory does not capture -- `stdout.log` is a tee of the Playwright subshell alone -- so the caller is expected to drop that line into a `command` file in the run directory. Falling back to a scan of `stdout.log` keeps a run directory produced by some other wrapper readable.
const stdout = readOr('stdout.log', '');
const commandFile = readOr('command', '');
const commandLine = commandFile || (/^e2e-run\.sh: (npx playwright .*)$/m.exec(stdout)?.[1] ?? '');
const branchFile = readOr('branch', '');

const provenance = [
  `run-dir:        ${dir}`,
  `note:           ${note || '(none)'}`,
  `started-utc:    ${readOr('started', '(not recorded)')}`,
  `head:           ${head || '(not recorded)'}`,
  `head-short:     ${head ? head.slice(0, 9) : '(not recorded)'}`,
  `branch:         ${branchFile || '(not recorded by the wrapper)'}`,
  `project:        ${/--project/.test(commandLine) ? 'restricted' : '<full default suite>'}`,
  `db-reset:       ${dbResetLine ? (dbResetLine[1] === 'true' ? 'yes' : 'no') : '(not recorded)'}`,
  '--- git status --porcelain (tracked working tree at run start) ---',
  worktreeStatus,
  '--- end git status ---',
  `command:        ${commandLine || '(not recorded)'}`,
  `playwright-exit: ${readOr('exit', '(not recorded)')}`,
  `ended-utc:      ${readOr('ended', '(not recorded)')}`,
  `preflight-ok:   ${readOr('preflight-successes', '(not recorded)')}`,
  `preflight-fail: ${readOr('preflight-failures', '(not recorded)')}`
].join('\n');
fs.writeFileSync(path.join(dir, 'provenance.txt'), `${provenance}\n`);

console.info(
  `e2e-evidence.mjs: ${summary.runDir} -- total ${counts.total}, passed ${counts.passed}, failed ${counts.failed}, flaky ${counts.flaky}, skipped ${counts.skipped}, didNotRun ${counts.didNotRun}`
);
