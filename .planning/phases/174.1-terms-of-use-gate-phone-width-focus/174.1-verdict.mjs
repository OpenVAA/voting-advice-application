#!/usr/bin/env node
// 174.1-verdict.mjs — the Phase 174.1 verdicts, each read from evidence files and the committed tree.
//
// Usage:
//   node 174.1-verdict.mjs control <label>
//   node 174.1-verdict.mjs schedule <label>
//   node 174.1-verdict.mjs scope [--complete]
//
// A <label> resolves as `resolveRun` in 174-verdict.mjs resolves it: to tests/e2e-runs/174-e2e/<label>, or to
// its newest re-run <label>-rN that holds a `head` file, and to no directory of another name.
//
// A run the wrapper ended as VOID (the host was suspended: VOID-host-suspend.txt in the run directory, or 8 in
// its `exit` file) is given no verdict by `control` or `schedule`: the script prints VOID and exits 3.
//
//   control   passes only for a one-project run of the phone-width spec that is red for the stated reason:
//             (a) `exit` holds 1, one preflight success or more and no preflight failure;
//             (b) the recorded `command` names the project contestant-terms-gate-phone;
//             (c) at the commit in the run's `head` file the spec exists and TermsOfUseForm.svelte does not
//                 hold the wrap class, so the tree the run was made on lacks the fix;
//             (d) in results.json every test of data-setup-base and of auth-setup passed, and the project
//                 holds at least one test, every one of which ended `failed`, with a non-empty results array
//                 and with no result skipped, timed out or interrupted;
//             (e) each such failure's text, with ANSI sequences removed, is the overflow expectation: it holds
//                 the matcher's name or its `Expected: <= 0` line, and a `Received:` value that parses as a
//                 number above 0.
//             One line is printed per test: its title and the received value. It reads the run's own head, so
//             it holds whatever was committed since.
//   schedule  for a full run (`command` names no --project; `exit` holds 0). From results.json it derives, for
//             each of auth-setup, contestant-terms-gate-phone and data-setup-perm-1e1cg1co, the interval from
//             the earliest start to the latest end of its tests. It passes when all three are present, the
//             phone project starts no earlier than auth-setup ends and ends no later than the permutation head
//             starts, and the tests of contestant-a11y-scan whose title names contestant-terms-gate number at
//             least one and all passed. It prints the three intervals.
//   scope     lists the paths that differ between the last full run before the phase (the `head` file of
//             174-10-final-r3) and HEAD, outside .planning/, and fails on any path that is not in PHASE_PATHS.
//             With --complete it also fails unless every path of MUST_CHANGE has changed.
//
// Exit codes: 0 pass; 1 fail; 2 usage error (including a run directory that does not exist); 3 the run is VOID.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E_ROOT = 'tests/e2e-runs/174-e2e';
/** The last full default run before the phase; its `head` is the base of the phase's diff. */
const BASELINE_RUN = '174-10-final-r3';
/** What tests/scripts/e2e-run.sh leaves behind when it ends a run as void: the marker file, and its exit status. */
const VOID_MARKER = 'VOID-host-suspend.txt';
const WRAPPER_EXIT_VOID = '8';

const PHONE_PROJECT = 'contestant-terms-gate-phone';
const PERM_HEAD = 'data-setup-perm-1e1cg1co';
const SCAN_PROJECT = 'contestant-a11y-scan';
const SCAN_TITLE = 'contestant-terms-gate';

const SPEC = 'tests/tests/specs/contestant/contestant-terms-gate-phone.spec.ts';
const COMPOSITION_ROOT = 'tests/tests/fixtures/contestant/contestant-terms-gate-phone.ts';
const PAGE_FIXTURE = 'tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts';
const CONFIG = 'tests/playwright.config.ts';
const README = 'tests/README.md';
const CREDENTIALS = 'tests/tests/utils/testCredentials.ts';
const COMPONENT = 'apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseForm.svelte';
const LAYOUT = 'apps/frontend/src/routes/contestant/(protected)/+layout.svelte';
const FOCUS_TEST = 'apps/frontend/src/routes/contestant/(protected)/gateFocus.svelte.test.ts';
const APP_STATE_STUB = 'apps/frontend/src/lib/i18n/tests/__mocks__/app-state.ts';
/** The class the fix puts on the consent label. */
const WRAP_CLASS = 'whitespace-normal';

/** Every path outside .planning/ the phase may change. */
const PHASE_PATHS = [
  PAGE_FIXTURE,
  COMPOSITION_ROOT,
  SPEC,
  CONFIG,
  README,
  CREDENTIALS,
  COMPONENT,
  LAYOUT,
  FOCUS_TEST,
  APP_STATE_STUB
];
/** The paths that must have changed once the phase's edits are complete. */
const MUST_CHANGE = [COMPONENT, LAYOUT, FOCUS_TEST, PAGE_FIXTURE, COMPOSITION_ROOT, SPEC, CONFIG, CREDENTIALS, README];

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
process.chdir(REPO_ROOT);

const failures = [];
const fail = (m) => failures.push(m);
const note = (m) => console.log(m);

function usage(message) {
  if (message) console.error(`174.1-verdict.mjs: ${message}`);
  console.error('usage: node 174.1-verdict.mjs control <label> | schedule <label> | scope [--complete]');
  process.exit(2);
}

const read = (file) => readFileSync(file, 'utf8').trim();
const readOr = (file, fallback) => (existsSync(file) ? read(file) : fallback);

/** `<root>/<label>`, or its newest re-run `<label>-rN` that holds a `head` file. Exits 2 when neither exists. */
function resolveRun(root, label) {
  if (!label || label.startsWith('--')) usage('a <label> is required');
  let best = null;
  let bestN = 0;
  if (existsSync(root)) {
    const pattern = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-r(\\d+)$`);
    for (const name of readdirSync(root)) {
      const m = pattern.exec(name);
      if (m && Number(m[1]) > bestN && existsSync(path.join(root, name, 'head'))) {
        bestN = Number(m[1]);
        best = path.join(root, name);
      }
    }
  }
  const dir = best ?? path.join(root, label);
  if (!existsSync(dir)) usage(`run directory ${dir} does not exist`);
  return dir;
}

/** Prints VOID and exits 3 when the wrapper ended the run because the host was suspended. */
function exitIfVoid(dir, what) {
  const marker = path.join(dir, VOID_MARKER);
  if (!existsSync(marker) && readOr(path.join(dir, 'exit'), '') !== WRAPPER_EXIT_VOID) return;
  console.log(
    `174.1-verdict ${what} ${path.basename(dir)}: VOID — the host was suspended during the run. It is neither a pass nor a red tree: make the run again under the next -rN suffix of the same label (see ${marker}).`
  );
  process.exit(3);
}

function finish(what) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.log(failures.length ? `174.1-verdict ${what}: FAIL (${failures.length})` : `174.1-verdict ${what}: PASS`);
  process.exit(failures.length ? 1 : 0);
}

const git = (...args) => spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** Every test of a Playwright JSON report, flattened: its project, title, file and results. */
function testsOf(dir) {
  const file = path.join(dir, 'results.json');
  if (!existsSync(file)) return null;
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  const walk = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        out.push({
          project: test.projectName,
          title: [...titles, spec.title].join(' › '),
          file: spec.file,
          results: test.results ?? []
        });
      }
    }
    for (const child of suite.suites ?? []) walk(child, child.file === child.title ? titles : [...titles, child.title]);
  };
  for (const top of report.suites ?? []) walk(top, []);
  return out;
}

const allPassed = (test) => test.results.length > 0 && test.results.every((r) => r.status === 'passed');

/** The whole failure text of a result, with ANSI sequences removed. */
function failureText(result) {
  const parts = [];
  for (const e of [result.error, ...(result.errors ?? [])]) {
    if (!e) continue;
    if (e.message) parts.push(e.message);
    if (e.stack) parts.push(e.stack);
  }
  // eslint-disable-next-line no-control-regex
  return parts.join('\n').replace(/\u001b\[[0-9;]*[A-Za-z]/g, '');
}

const [command, ...rest] = process.argv.slice(2);

// ── control ──────────────────────────────────────────────────────────────────────────────────────
if (command === 'control') {
  if (rest.length !== 1) usage('control takes exactly one <label>');
  const dir = resolveRun(E2E_ROOT, rest[0]);
  const what = `control ${path.basename(dir)}`;
  note(`run: ${dir}`);
  exitIfVoid(dir, 'control');

  // (a) red by Playwright's own status, on a server the preflight confirmed.
  const exit = readOr(path.join(dir, 'exit'), null);
  if (exit === null) fail(`(a) ${dir}/exit is missing`);
  else if (exit !== '1') fail(`(a) the run's exit file holds ${exit}, not 1`);
  const preflightOk = Number(readOr(path.join(dir, 'preflight-successes'), '0'));
  const preflightFail = Number(readOr(path.join(dir, 'preflight-failures'), '0'));
  if (preflightOk < 1) fail('(a) no preflight success is recorded');
  if (preflightFail > 0) fail(`(a) ${preflightFail} preflight failure(s) are recorded`);

  // (b) the one project.
  const commandLine = readOr(path.join(dir, 'command'), '');
  if (!new RegExp(`--project[= ]${PHONE_PROJECT}(\\s|$)`).test(commandLine)) {
    fail(`(b) the recorded command does not name the project ${PHONE_PROJECT}: '${commandLine}'`);
  }

  // (c) the tree the run was made on holds the spec and lacks the fix.
  const headFile = path.join(dir, 'head');
  if (!existsSync(headFile)) {
    fail(`(c) ${headFile} is missing`);
  } else {
    const head = read(headFile);
    note(`head: ${head}`);
    if (git('cat-file', '-e', `${head}:${SPEC}`).status !== 0) fail(`(c) ${SPEC} does not exist at ${head.slice(0, 9)}`);
    const component = git('show', `${head}:${COMPONENT}`);
    if (component.status !== 0) fail(`(c) ${COMPONENT} cannot be read at ${head.slice(0, 9)}`);
    else if (component.stdout.includes(WRAP_CLASS)) fail(`(c) ${COMPONENT} holds ${WRAP_CLASS} at ${head.slice(0, 9)}: the run was made on a tree that has the fix`);
    else note(`tree: the spec exists and the component does not hold ${WRAP_CLASS} at ${head.slice(0, 9)}`);
  }

  // (d) the setups passed and every test of the project failed.
  const tests = testsOf(dir);
  if (tests === null) {
    fail(`(d) ${dir}/results.json is missing`);
    finish(what);
  }
  for (const setup of ['data-setup-base', 'auth-setup']) {
    const own = tests.filter((t) => t.project === setup);
    if (own.length === 0) fail(`(d) the run holds no test of ${setup}`);
    for (const t of own) if (!allPassed(t)) fail(`(d) ${setup} › ${t.title} did not pass (${t.results.map((r) => r.status).join(', ') || 'no result'})`);
  }
  const phone = tests.filter((t) => t.project === PHONE_PROJECT);
  if (phone.length === 0) fail(`(d) the run holds no test of ${PHONE_PROJECT}`);
  for (const t of phone) {
    if (t.results.length === 0) {
      fail(`(d) ${t.title}: no result — the test did not run`);
      continue;
    }
    const statuses = t.results.map((r) => r.status);
    if (!statuses.every((s) => s === 'failed')) {
      fail(`(d) ${t.title}: ended ${statuses.join(', ')}, not failed`);
      continue;
    }
    // (e) the failure is the overflow expectation, with a received overflow above zero.
    const text = failureText(t.results[t.results.length - 1]);
    const namesMatcher = /toBeLessThanOrEqual/.test(text) || /Expected:\s*<=\s*0\b/.test(text);
    const received = /Received:\s*(-?\d+(?:\.\d+)?)/.exec(text);
    if (!namesMatcher) fail(`(e) ${t.title}: the failure is not the overflow expectation: ${text.split('\n')[0]}`);
    else if (!received) fail(`(e) ${t.title}: the failure holds no numeric Received value`);
    else if (!(Number(received[1]) > 0)) fail(`(e) ${t.title}: received ${received[1]}, which is not above 0`);
    else note(`red: ${t.title} — received overflow ${received[1]}`);
  }
  finish(what);
}

// ── schedule ─────────────────────────────────────────────────────────────────────────────────────
if (command === 'schedule') {
  if (rest.length !== 1) usage('schedule takes exactly one <label>');
  const dir = resolveRun(E2E_ROOT, rest[0]);
  const what = `schedule ${path.basename(dir)}`;
  note(`run: ${dir}`);
  exitIfVoid(dir, 'schedule');

  const commandLine = readOr(path.join(dir, 'command'), '');
  if (!commandLine) fail('no command is recorded, so the run cannot be shown to be the full suite');
  else if (/--project/.test(commandLine)) fail('the recorded command names --project: a slice, not the full suite');
  const exit = readOr(path.join(dir, 'exit'), null);
  if (exit === null) fail(`${dir}/exit is missing`);
  else if (exit !== '0') fail(`the run's exit file holds ${exit}, not 0`);

  const tests = testsOf(dir);
  if (tests === null) {
    fail(`${dir}/results.json is missing`);
    finish(what);
  }
  const interval = (project) => {
    let start = Infinity;
    let end = -Infinity;
    let count = 0;
    for (const t of tests) {
      if (t.project !== project) continue;
      for (const r of t.results) {
        const s = Date.parse(r.startTime);
        if (Number.isNaN(s)) continue;
        count += 1;
        start = Math.min(start, s);
        end = Math.max(end, s + (r.duration ?? 0));
      }
    }
    return count ? { start, end } : null;
  };
  const iso = (ms) => new Date(ms).toISOString();
  const spans = {};
  for (const project of ['auth-setup', PHONE_PROJECT, PERM_HEAD]) {
    spans[project] = interval(project);
    if (!spans[project]) fail(`the run holds no timed test of ${project}`);
    else note(`${project}: ${iso(spans[project].start)} → ${iso(spans[project].end)}`);
  }
  const auth = spans['auth-setup'];
  const phone = spans[PHONE_PROJECT];
  const perm = spans[PERM_HEAD];
  if (auth && phone && phone.start < auth.end) fail(`${PHONE_PROJECT} starts before auth-setup ends`);
  if (phone && perm && phone.end > perm.start) fail(`${PHONE_PROJECT} ends after ${PERM_HEAD} starts`);
  for (const t of tests.filter((x) => x.project === PHONE_PROJECT)) if (!allPassed(t)) fail(`${PHONE_PROJECT} › ${t.title} did not pass`);

  const scans = tests.filter((t) => t.project === SCAN_PROJECT && t.title.includes(SCAN_TITLE));
  if (scans.length === 0) fail(`${SCAN_PROJECT} holds no test whose title names ${SCAN_TITLE}`);
  for (const t of scans) if (!allPassed(t)) fail(`${SCAN_PROJECT} › ${t.title} did not pass`);
  if (scans.length && scans.every(allPassed)) note(`${SCAN_PROJECT}: ${scans.length} test(s) naming ${SCAN_TITLE}, all passed`);
  finish(what);
}

// ── scope ────────────────────────────────────────────────────────────────────────────────────────
if (command === 'scope') {
  let complete = false;
  for (const a of rest) {
    if (a === '--complete') complete = true;
    else usage(`unexpected argument '${a}'`);
  }
  const baseFile = path.join(E2E_ROOT, BASELINE_RUN, 'head');
  if (!existsSync(baseFile)) usage(`${baseFile} is missing`);
  const base = read(baseFile);
  const diff = git('diff', '--name-only', base, 'HEAD', '--', '.', ':(exclude).planning');
  if (diff.status !== 0) usage(`git diff against ${base.slice(0, 9)} failed: ${diff.stderr.trim()}`);
  const changed = diff.stdout.split('\n').filter(Boolean);
  note(`base: ${base.slice(0, 9)} (the head of ${BASELINE_RUN}); ${changed.length} path(s) changed outside .planning/`);
  for (const p of changed) {
    const listed = PHASE_PATHS.includes(p);
    note(`${listed ? '  ' : '! '}${p}`);
    if (!listed) fail(`${p} is changed and is not a path of the phase`);
  }
  if (complete) {
    for (const p of MUST_CHANGE) if (!changed.includes(p)) fail(`${p} is unchanged, and the phase is not complete without it`);
  }
  finish(complete ? 'scope --complete' : 'scope');
}

usage(command ? `unknown subcommand '${command}'` : 'a subcommand is required');
