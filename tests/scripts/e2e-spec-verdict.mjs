#!/usr/bin/env node
/**
 * e2e-spec-verdict.mjs -- decide, by its exit status alone, whether a run directory's Playwright report is the evidence a caller claims it is.
 *
 * Usage: node tests/scripts/e2e-spec-verdict.mjs <run-dir> [--passed <spec file>]... [--passed-test <title part>]... [--failed-test <title part> [--failure-contains <text>]...]... [--no-other-failures] [--no-flaky] [--allow-did-not-run] [--skipped-baseline <file>] [--print-skipped]
 *
 * WHY COUNTS ARE NOT ENOUGH. `e2e-evidence.mjs` rolls `results.json` up into totals. A total cannot say that the spec files a change adds were in the run and passed, that a red control failed in the test it was meant to fail in and for the reason it was meant to fail for, or that the set of declaratively skipped tests is the one recorded before. This script answers exactly those questions, from the report alone, and prints one `VERDICT FAIL:` line for every condition that does not hold, so one run reports all of them.
 *
 * THE CONDITIONS:
 *   --passed <name>          the spec file whose base name equals <name> (exactly; a common ending is not enough) has at least one test in the report, and every one of its tests passed. A declared skip, a flaky test and a test that did not run are not passes. A name that matches two spec files of the report fails; a name holding a path separator is unusable.
 *   --passed-test <part>     at least one test title contains <part>, and every such test passed.
 *   --failed-test <part>     at least one test whose title contains <part> failed. Each --failure-contains <text> directly after it must be found in the error text of one and the same failed test, so a test that failed for another reason (a timeout, say) is not the red control.
 *   --no-other-failures      no test failed whose title matches no --failed-test value.
 *   --no-flaky               no test of the report is flaky.
 *   --skipped-baseline <f>   the sorted declared-skip lines (`project › file › title`) equal the non-blank lines of <f>.
 *   --print-skipped          write the sorted declared-skip lines to standard output, and the verdict lines to standard error instead.
 *   --allow-did-not-run      a test that did not run no longer fails the run by itself.
 *
 * Two rules hold before any flag is looked at, so that no combination of flags can call an empty or truncated run green: a report whose `stats` count more tests than its `suites` tree holds is not a report (status 3), and a report that holds no test fails (status 1). With no condition flag at all the script still fails on a test that did not run, so it doubles as a bare did-not-run check.
 *
 * DID-NOT-RUN IS NOT A SKIP. The classification of a `skipped` test is the rule `e2e-evidence.mjs` uses, written the same way: a test with an empty `results` list and neither a `skip` nor a `fixme` annotation did not run (a project it depends on failed, or the run was cut short); any other skipped test is a declared skip. The two scripts must keep the same rule, or they will disagree about one report.
 *
 * The script only reads: the report in the run directory and the baseline file it is given. It starts no process and writes no file. A relative path is read against the repository root, as `e2e-evidence.mjs` reads its run directory.
 *
 * Exit statuses: 0 every condition holds; 1 at least one condition fails; 2 the arguments are unusable; 3 `results.json` is missing, cannot be parsed, or is cut off.
 */

import fs from 'node:fs';
import path from 'node:path';

const NAME = 'e2e-spec-verdict.mjs';
const SEP = ' › ';

/** Stop on arguments that cannot be used. */
function usage(message) {
  console.error(`${NAME}: ${message}`);
  process.exit(2);
}

const args = process.argv.slice(2);
let runDir = '';
const passedFiles = [];
const passedTests = [];
const failedTests = [];
let noOtherFailures = false;
let noFlaky = false;
let allowDidNotRun = false;
let printSkipped = false;
let baselinePath = '';

/** The value of the flag at index `i`: present, not empty, and not itself a flag. */
function valueOf(i) {
  const value = args[i + 1];
  if (value === undefined || value === '' || value.startsWith('--')) usage(`${args[i]} requires a value`);
  return value;
}

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  switch (arg) {
    case '--passed': {
      const value = valueOf(i);
      if (value.includes('/') || value.includes('\\'))
        usage(`--passed takes the base name of a spec file, not a path: '${value}'`);
      passedFiles.push(value);
      i += 1;
      break;
    }
    case '--passed-test':
      passedTests.push(valueOf(i));
      i += 1;
      break;
    case '--failed-test':
      failedTests.push({ part: valueOf(i), contains: [] });
      i += 1;
      break;
    case '--failure-contains': {
      const previous = i >= 2 ? args[i - 2] : '';
      if (failedTests.length === 0 || (previous !== '--failed-test' && previous !== '--failure-contains')) {
        usage('--failure-contains must directly follow a --failed-test value or another --failure-contains value');
      }
      failedTests[failedTests.length - 1].contains.push(valueOf(i));
      i += 1;
      break;
    }
    case '--skipped-baseline':
      if (baselinePath !== '') usage('--skipped-baseline may be given once');
      baselinePath = valueOf(i);
      i += 1;
      break;
    case '--no-other-failures':
      noOtherFailures = true;
      break;
    case '--no-flaky':
      noFlaky = true;
      break;
    case '--allow-did-not-run':
      allowDidNotRun = true;
      break;
    case '--print-skipped':
      printSkipped = true;
      break;
    default:
      if (arg.startsWith('--')) usage(`unknown flag '${arg}'`);
      if (runDir !== '') usage(`unexpected argument '${arg}'`);
      runDir = arg;
  }
}
if (runDir === '') usage('<run-dir> is required');

const repoRoot = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..', '..');
/** A path as given, or read against the repository root when it is relative. */
function resolve(p) {
  return path.isAbsolute(p) ? p : path.join(repoRoot, p);
}

let baselineLines = null;
if (baselinePath !== '') {
  try {
    baselineLines = fs
      .readFileSync(resolve(baselinePath), 'utf8')
      .split('\n')
      .map((line) => line.replace(/\r$/, ''))
      .filter((line) => line.trim() !== '')
      .sort();
  } catch (error) {
    usage(`--skipped-baseline ${baselinePath} cannot be read: ${error.message}`);
  }
}

/** Stop on a report that is not one. */
function noReport(message) {
  console.error(`${NAME}: ${message}`);
  process.exit(3);
}

const resultsPath = path.join(resolve(runDir), 'results.json');
if (!fs.existsSync(resultsPath)) noReport(`${resultsPath} is missing -- there is no run to judge`);
let report;
try {
  report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
} catch (error) {
  noReport(`${resultsPath} cannot be parsed: ${error.message}`);
}
if (report === null || typeof report !== 'object' || report.stats === null || typeof report.stats !== 'object') {
  noReport(`${resultsPath} is not a Playwright JSON report: it has no stats object`);
}

/** Colour sequences, removed from error text before a --failure-contains text is looked for. */
const COLOUR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, 'g');

/** Every test of the report, classified once. */
const tests = [];

/** Walk the report's recursive suite tree the way `e2e-evidence.mjs` does, carrying the describe titles down so that a test is named by its full title. */
function walk(suites, titles) {
  for (const suite of suites ?? []) {
    const own = suite.title && suite.title !== suite.file ? [...titles, suite.title] : titles;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        const annotations = (test.annotations ?? []).map((a) => a.type);
        const declarativeSkip = annotations.includes('skip') || annotations.includes('fixme');
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
        const messages = results.flatMap((r) => [r.error?.message, ...(r.errors ?? []).map((e) => e?.message)]);
        const file = spec.file ?? suite.file ?? '(no file)';
        const title = [...own, spec.title ?? '(no title)'].join(SEP);
        const project = test.projectName || '(no project)';
        tests.push({
          project,
          file,
          base: path.basename(file.replace(/\\/g, '/')),
          title,
          kind,
          id: [project, file, title].join(SEP),
          errorText: messages
            .filter((m) => typeof m === 'string')
            .join('\n')
            .replace(COLOUR, '')
        });
      }
    }
    walk(suite.suites, own);
  }
}
walk(Array.isArray(report.suites) ? report.suites : [], []);

const stats = report.stats;
const statsTotal = ['expected', 'unexpected', 'flaky', 'skipped'].reduce(
  (sum, key) => sum + (Number.isFinite(stats[key]) ? stats[key] : 0),
  0
);
if (tests.length < statsTotal) {
  noReport(`${resultsPath} is cut off: its stats count ${statsTotal} tests and its suites hold ${tests.length}`);
}

/** Verdict lines go to standard error when standard output carries the declared-skip lines. */
function say(line) {
  if (printSkipped) console.error(line);
  else console.info(line);
}
const failures = [];
function fail(line) {
  failures.push(`VERDICT FAIL: ${line}`);
}
const describeKind = {
  passed: 'passed',
  failed: 'failed',
  flaky: 'flaky',
  skipped: 'skipped (declared)',
  didNotRun: 'did not run'
};

if (tests.length === 0) {
  say('VERDICT FAIL: the report holds no test -- an empty run is never a green run');
  process.exit(1);
}

const declaredSkips = tests
  .filter((t) => t.kind === 'skipped')
  .map((t) => t.id)
  .sort();
if (printSkipped) {
  for (const line of declaredSkips) console.info(line);
}

if (!allowDidNotRun) {
  for (const t of tests.filter((x) => x.kind === 'didNotRun')) fail(`did not run: ${t.id}`);
}

for (const name of passedFiles) {
  const files = [...new Set(tests.filter((t) => t.base === name).map((t) => t.file))].sort();
  if (files.length === 0) {
    fail(`no test of ${name} is in the report`);
  } else if (files.length > 1) {
    fail(`${name} matches more than one spec file of the report: ${files.join(', ')}`);
  } else {
    for (const t of tests.filter((x) => x.file === files[0] && x.kind !== 'passed')) {
      fail(`${name}: ${t.id} is ${describeKind[t.kind]}, not passed`);
    }
  }
}

for (const part of passedTests) {
  const matches = tests.filter((t) => t.title.includes(part));
  if (matches.length === 0) fail(`no test title contains "${part}"`);
  for (const t of matches.filter((x) => x.kind !== 'passed'))
    fail(`--passed-test "${part}": ${t.id} is ${describeKind[t.kind]}, not passed`);
}

for (const { part, contains } of failedTests) {
  const matches = tests.filter((t) => t.title.includes(part));
  const failed = matches.filter((t) => t.kind === 'failed');
  if (matches.length === 0) {
    fail(`no test title contains "${part}"`);
  } else if (failed.length === 0) {
    fail(
      `--failed-test "${part}" did not fail: ${matches.map((t) => `${t.id} is ${describeKind[t.kind]}`).join('; ')}`
    );
  } else if (contains.length > 0 && !failed.some((t) => contains.every((text) => t.errorText.includes(text)))) {
    for (const t of failed) {
      const missing = contains.filter((text) => !t.errorText.includes(text));
      fail(
        `--failed-test "${part}": ${t.id} failed, but its error text lacks ${missing.map((text) => `"${text}"`).join(', ')}`
      );
    }
  }
}

if (noOtherFailures) {
  for (const t of tests.filter((x) => x.kind === 'failed' && !failedTests.some(({ part }) => x.title.includes(part)))) {
    fail(`failed outside the red controls: ${t.id}`);
  }
}

if (noFlaky) {
  for (const t of tests.filter((x) => x.kind === 'flaky')) fail(`flaky: ${t.id}`);
}

/** The lines of `a` not matched one for one by a line of `b`. */
function minus(a, b) {
  const left = [...b];
  return a.filter((line) => {
    const at = left.indexOf(line);
    if (at === -1) return true;
    left.splice(at, 1);
    return false;
  });
}

if (baselineLines !== null) {
  for (const line of minus(declaredSkips, baselineLines)) fail(`skipped only in the report: ${line}`);
  for (const line of minus(baselineLines, declaredSkips)) fail(`skipped only in the baseline: ${line}`);
}

if (failures.length > 0) {
  for (const line of failures) say(line);
  process.exit(1);
}
function count(kind) {
  return tests.filter((t) => t.kind === kind).length;
}
say(
  `VERDICT OK: ${tests.length} tests -- passed ${count('passed')}, failed ${count('failed')}, flaky ${count('flaky')}, skipped ${count('skipped')}, did not run ${count('didNotRun')}`
);
