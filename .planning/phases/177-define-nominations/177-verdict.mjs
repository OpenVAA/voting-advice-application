#!/usr/bin/env node
// 177-verdict.mjs — the Phase 177 verdicts, each read from evidence files and the committed tree.
//
// Usage:
//   node 177-verdict.mjs dir <gates|e2e|determinism> <label>
//   node 177-verdict.mjs gates <label> [--rows <comma-separated row names>]
//   node 177-verdict.mjs e2e <label> [--allow-slice] [--same-projects-as <label-or-path> [--except <project>=<delta>]...]
//                            [--expect-project <name>]... [--expect-title-count <project>::<substring>=<n>]...
//   node 177-verdict.mjs control <label> --project <name> --setup <project> --dirty-only <path> [--dirty-only <path>]...
//                            (--red <title substring> [--red <substring>]... | --green [--were-red-in <label>])
//   node 177-verdict.mjs determinism <ledger-dir> --project <name> --runs <n>
//   node 177-verdict.mjs scope
//   node 177-verdict.mjs hygiene
//
// A label names its newest attempt. A run that is made again is made under <label>-r2, <label>-r3 and so on,
// and its earlier directories are kept. Wherever a label is taken — as a subcommand's own argument, after
// --same-projects-as or after --were-red-in — the directory read is <label>-rN with the highest N that exists,
// compared as a number, or <label> when there is none. The directory read is printed: `run:` is the first line
// of every verdict that takes a label.
//
//   dir          prints the directory of a label's newest attempt, with a trailing slash and nothing else, under
//                tests/e2e-runs/177-gates/, tests/e2e-runs/177-e2e/ or tests/e2e-runs/177-determinism/. A verify
//                command reads a file of the very run a verdict judged through it. Exits 2 when no attempt exists.
//   gates        every name in rows-expected.txt is in summary.tsv with status 0, and the run is not stale (its
//                recorded head is tree-equal to HEAD outside .planning/). Without --rows the run must hold all
//                fourteen rows, so a subset run is never read as the full gate set; with --rows the run's
//                rows-expected.txt must hold exactly the named rows.
//   e2e          a run of a committed tree, made through 177-e2e.sh. A run the wrapper ended as VOID (the host
//                was suspended: VOID-host-suspend.txt in the run directory, or 8 in its `exit` file) is given no
//                verdict at all: it prints VOID and exits 3. Otherwise: summary.json has failed, flaky and
//                didNotRun at 0 and total and passed above 0; the run's `exit` file (the wrapper's status) is 0;
//                one preflight success or more and no preflight failure; the recorded worktree status holds no
//                path outside .planning/ other than the operator's untracked file; the run is not stale; without
//                --allow-slice the recorded command names no --project.
//                --expect-project: that project is in byProject, total above 0, every test passed.
//                --expect-title-count <project>::<substring>=<n>: in results.json that project holds exactly <n>
//                tests whose title contains the substring, every one passed.
//                --same-projects-as: for every project of this run and of the other run, this run's byProject
//                total equals the other run's, a project absent from a run counting as 0 there. The other run is
//                a label of this phase, or a path that begins tests/e2e-runs/ and is read as it is written.
//                --except <project>=<integer>: this run's total for it equals the other run's plus the integer.
//                --except <project>=+: this run's total for it is above the other run's. An --except naming a
//                project in neither run changes nothing and is printed as unused. With --allow-slice the
//                comparison covers only the projects present in this run. One line is printed per project.
//   control      a run of an UNCOMMITTED tree, made directly through tests/scripts/e2e-run.sh, which is the only
//                route for one: 177-e2e.sh refuses a dirty tree. For both forms: the directory holds the wrapper's
//                own head, exit, results.json and worktree-status.txt; one preflight success or more and no
//                preflight failure; no void marker; the recorded Playwright invocation (the `command` file, or
//                the arguments results.json holds) names --project <name>; the recorded worktree status — lines
//                under .planning/ and the operator's untracked file aside — holds at least one path and no path
//                outside the --dirty-only paths; and the --setup project holds at least one test, every one
//                passed. A --dirty-only path names a file or, where it ends with a slash, a directory and
//                everything under it. The wrapper records `git status --porcelain`, which lists a wholly
//                untracked directory as one line; such a line is inside a --dirty-only directory when the
//                directory it names is, and inside no --dirty-only file.
//                --red: the Playwright status is 1; for each substring at least one test of the project has it
//                in its title; every such test ended `failed` on an expectation, with a non-empty results array
//                and no result skipped, timed out or interrupted; and every other test of the run passed. One
//                line is printed per red test: its title and the first line of its error.
//                --green: the Playwright status is 0; no test of the run failed, was flaky or did not run; the
//                project holds at least one test. --were-red-in <label>: every title the named run lists as
//                failed is in this run, in the same project, and passed.
//                A void run prints VOID and exits 3. A control is never refused for being stale: it describes a
//                working tree, and it is judged on the run's own records.
//   determinism  for a ledger directory tests/scripts/determinism-batch.sh wrote: exactly <n> run-* directories;
//                each with 0 in its `exit` file, no void marker, one preflight success or more and no preflight
//                failure, the project present with at least one test and every one passed, and failed, flaky and
//                didNotRun at 0 over the whole run; all on one head, tree-equal to HEAD outside .planning/. A
//                void run prints VOID and exits 3.
//   scope        lists the paths that differ between the phase's base commit (the one line of 177-BASE beside
//                this file) and HEAD, outside .planning/, and fails on any path under the Edge Functions, on the
//                stack's configuration file, on the server hooks, on any path under the API routes, and on
//                CLAUDE.md. It prints every changed path and names what it refused.
//   hygiene      two scans, each listing the file and the line of every hit; exit 0 only with no hit.
//                (i)  this phase's scripts — every 177-*.sh and 177-*.mjs beside this file — with comment lines
//                     removed;
//                (ii) this phase's plan files: the action of every task that is not a checkpoint, every
//                     automated verify command, and every plan-level verification block.
//                The file forms (a path whose last component is the untracked environment file's bare name; a
//                call of the root script that compares the two local environment files) are hits in (i) and
//                in an action. The container forms (the template field that lists a container's environment;
//                the environment-printing command with no variable name after it; an exec into a container
//                that ends in the bare environment command; a container log read without a filter) are hits
//                in (i), in an automated verify command and in a verification block. A form found in a region
//                where it is not a hit is printed as advisory and changes no verdict.
//                The search patterns are assembled from fragments, so this file never hits itself.
//
// The `gates` and `e2e` verdicts print the host's Sleep entries recorded inside the run window (power.txt).
// The line is informative. Only the wrapper's marker makes an E2E run void.
//
// It reads evidence files and calls `git`, and nothing else.
//
// Exit codes: 0 pass; 1 fail; 2 usage error (including a run directory that does not exist); 3 the run is
// VOID — the wrapper ended it because the host was suspended; it is made again under the next suffix.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ALL_ROWS = [
  'typecheck',
  'lint',
  'db-reset',
  'types-regen',
  'types-clean',
  'pgtap',
  'sql-lint',
  'integration',
  'unit',
  'check-frontend',
  'build',
  'format',
  'docs-links',
  'name-gate-self-test'
];
const RUNS_PREFIX = 'tests/e2e-runs/';
const ROOTS = {
  gates: `${RUNS_PREFIX}177-gates`,
  e2e: `${RUNS_PREFIX}177-e2e`,
  determinism: `${RUNS_PREFIX}177-determinism`
};
/** What tests/scripts/e2e-run.sh leaves behind when it ends a run as void: the marker file, and its exit status. */
const VOID_MARKER = 'VOID-host-suspend.txt';
const WRAPPER_EXIT_VOID = '8';
/** The operator's untracked file at the repository root; a tree that holds it is still a committed tree. */
const OPERATOR_FILE = 'CAND-APP-PLAN.md';
/** What `scope` refuses: a changed path equal to `path`, or under it when it ends with a slash. */
const REFUSED_PATHS = [
  { path: 'apps/supabase/supabase/functions/', what: 'an Edge Function' },
  { path: 'apps/supabase/supabase/config.toml', what: "the stack's configuration, which holds the auth configuration" },
  { path: 'apps/frontend/src/hooks.server.ts', what: 'the server hooks' },
  { path: 'apps/frontend/src/routes/api/', what: 'an API route' },
  { path: 'CLAUDE.md', what: 'the project instructions, which the orchestrator owns' }
];

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
process.chdir(REPO_ROOT);
const PHASE_DIR = path.relative(REPO_ROOT, HERE);
const BASE_FILE = path.join(PHASE_DIR, '177-BASE');

const failures = [];
const fail = (m) => failures.push(m);
const note = (m) => console.log(m);

function usage(message) {
  if (message) console.error(`177-verdict.mjs: ${message}`);
  console.error(
    [
      'usage: node 177-verdict.mjs dir <gates|e2e|determinism> <label>',
      '     | gates <label> [--rows <names>]',
      '     | e2e <label> [--allow-slice] [--same-projects-as <label-or-path> [--except <project>=<delta>]...] [--expect-project <name>]... [--expect-title-count <project>::<substring>=<n>]...',
      '     | control <label> --project <name> --setup <project> --dirty-only <path>... (--red <title substring>... | --green [--were-red-in <label>])',
      '     | determinism <ledger-dir> --project <name> --runs <n>',
      '     | scope',
      '     | hygiene'
    ].join('\n')
  );
  process.exit(2);
}

const read = (file) => readFileSync(file, 'utf8').trim();
const readOr = (file, fallback) => (existsSync(file) ? read(file) : fallback);
const isDirectory = (p) => existsSync(p) && statSync(p).isDirectory();
const git = (...args) => spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** The directory of a label's newest attempt under `root`: `<label>-rN` with the highest N, else `<label>`. Exits 2 when there is none. */
function resolveRun(root, label) {
  if (!label || label.startsWith('-')) usage('a <label> is required');
  if (label.includes('/') || label.startsWith('.')) usage(`'${label}' is not a plain label`);
  let best = null;
  let bestN = 0;
  if (isDirectory(root)) {
    const pattern = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-r(\\d+)$`);
    for (const name of readdirSync(root)) {
      const m = pattern.exec(name);
      if (m && Number(m[1]) > bestN && isDirectory(path.join(root, name))) {
        bestN = Number(m[1]);
        best = path.join(root, name);
      }
    }
  }
  const dir = best ?? path.join(root, label);
  if (!isDirectory(dir)) usage(`run directory ${dir} does not exist`);
  return dir;
}

/** A label of this phase's E2E runs, or a path that begins `tests/e2e-runs/` and is read as it is written. */
function resolveLabelOrPath(value) {
  if (value.startsWith(RUNS_PREFIX)) {
    const dir = path.normalize(value).replace(/\/+$/, '');
    if (!`${dir}/`.startsWith(RUNS_PREFIX) || !isDirectory(dir)) usage(`run directory ${value} does not exist under ${RUNS_PREFIX}`);
    return dir;
  }
  return resolveRun(ROOTS.e2e, value);
}

/** Whether `head` names a tree equal to HEAD outside .planning/. */
function treeEqualToHead(head) {
  return git('diff', '--quiet', head, 'HEAD', '--', '.', ':(exclude).planning').status === 0;
}

/** The run was made on a tree equal to HEAD outside .planning/. */
function assertNotStale(dir) {
  const headFile = path.join(dir, 'head');
  if (!existsSync(headFile)) return fail(`${dir}/head is missing`);
  const head = read(headFile);
  if (!treeEqualToHead(head)) fail(`${dir} is stale: its head ${head.slice(0, 9)} differs from HEAD outside .planning/`);
  else note(`not stale: head ${head.slice(0, 9)} is tree-equal to HEAD outside .planning/`);
}

/** Prints what the run recorded about the host's power state. Informative: it changes no verdict. */
function reportPower(dir) {
  const m = /^sleep_entries_in_window: (\d+)$/m.exec(readOr(path.join(dir, 'power.txt'), ''));
  if (!m) return note('power: no record in this run directory');
  if (m[1] === '0') return note('power: no Sleep entry inside the run window');
  note(`power: ${m[1]} Sleep entr${m[1] === '1' ? 'y' : 'ies'} inside the run window (see ${dir}/power.txt); informative — only the wrapper's marker makes a run void`);
}

/** Whether the wrapper ended the run in `dir` as void. */
function isVoid(dir) {
  return existsSync(path.join(dir, VOID_MARKER)) || readOr(path.join(dir, 'exit'), '') === WRAPPER_EXIT_VOID;
}

/** Prints VOID and exits 3 when the wrapper ended the run because the host was suspended. */
function exitIfVoid(dir, what) {
  if (!isVoid(dir)) return;
  const marker = path.join(dir, VOID_MARKER);
  const gap = /^gap_ms=(\d+)$/m.exec(readOr(marker, ''));
  reportPower(dir);
  console.log(
    `177-verdict ${what}: VOID — the host was suspended during the run${gap ? ` (gap ${gap[1]} ms)` : ''}. It is neither a pass nor a red tree: make it again under the next -rN suffix (see ${marker}).`
  );
  process.exit(3);
}

function finish(what) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.log(failures.length ? `177-verdict ${what}: FAIL (${failures.length})` : `177-verdict ${what}: PASS`);
  process.exit(failures.length ? 1 : 0);
}

/**
 * Every test of a Playwright JSON report, flattened: its project, its title path, its results and its outcome.
 * The outcome is `passed`, `failed`, `flaky`, `skipped` or `didNotRun`, classified as tests/scripts/e2e-evidence.mjs
 * classifies it: a test Playwright reports as skipped with no result and no skip annotation did not run.
 * Returns null when the directory holds no results.json.
 */
function testsOf(dir) {
  const file = path.join(dir, 'results.json');
  if (!existsSync(file)) return null;
  const report = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  const walk = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        const annotations = (test.annotations ?? []).map((a) => a.type);
        const declarativeSkip = annotations.includes('skip') || annotations.includes('fixme');
        let outcome;
        if (test.status === 'skipped') outcome = results.length === 0 && !declarativeSkip ? 'didNotRun' : 'skipped';
        else if (test.status === 'expected') outcome = 'passed';
        else if (test.status === 'flaky') outcome = 'flaky';
        else outcome = 'failed';
        out.push({ project: test.projectName || '(no project)', title: [...titles, spec.title].join(' › '), results, outcome });
      }
    }
    for (const child of suite.suites ?? []) walk(child, child.file === child.title ? titles : [...titles, child.title]);
  };
  for (const top of report.suites ?? []) walk(top, []);
  return { tests: out, argv: report.config?.argv ?? [] };
}

const tally = (tests) => {
  const c = { total: tests.length, passed: 0, failed: 0, flaky: 0, skipped: 0, didNotRun: 0 };
  for (const t of tests) c[t.outcome] += 1;
  return c;
};
const countsLine = (c) => `total ${c.total}, passed ${c.passed}, failed ${c.failed}, flaky ${c.flaky}, skipped ${c.skipped}, didNotRun ${c.didNotRun}`;

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

/** Fails unless the run recorded one preflight success or more and no preflight failure. */
function assertPreflight(dir, where = '') {
  const ok = Number(readOr(path.join(dir, 'preflight-successes'), '0'));
  const bad = Number(readOr(path.join(dir, 'preflight-failures'), '0'));
  if (ok < 1) fail(`${where}no preflight success is recorded`);
  if (bad > 0) fail(`${where}${bad} preflight failure(s) are recorded`);
}

/**
 * The paths of a recorded `git status --porcelain`, lines under .planning/ and the operator's untracked file aside.
 * A rename contributes both of its paths. Returns null when the file is missing.
 */
function dirtyPaths(dir) {
  const file = path.join(dir, 'worktree-status.txt');
  if (!existsSync(file)) return null;
  const unquote = (p) => (p.startsWith('"') && p.endsWith('"') ? p.slice(1, -1).replace(/\\(["\\])/g, '$1') : p);
  const out = [];
  // Not trimmed: the two status characters of the first line may begin with a space.
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (line.length < 4) continue;
    if (line === `?? ${OPERATOR_FILE}`) continue;
    for (const p of line.slice(3).split(' -> ').map(unquote)) {
      if (!p.startsWith('.planning/')) out.push(p);
    }
  }
  return out;
}

const [command, ...rest] = process.argv.slice(2);

// ── dir ──────────────────────────────────────────────────────────────────────────────────────────
if (command === 'dir') {
  if (rest.length !== 2) usage('dir takes <gates|e2e|determinism> <label>');
  const root = Object.hasOwn(ROOTS, rest[0]) ? ROOTS[rest[0]] : usage(`dir: unknown kind '${rest[0]}'`);
  console.log(`${resolveRun(root, rest[1])}/`);
  process.exit(0);
}

// ── gates ────────────────────────────────────────────────────────────────────────────────────────
if (command === 'gates') {
  const label = rest[0];
  let wanted = null;
  for (let i = 1; i < rest.length; i += 2) {
    if (rest[i] !== '--rows') usage(`unexpected argument '${rest[i]}'`);
    if (!rest[i + 1]) usage('--rows requires a value');
    wanted = rest[i + 1].split(',').filter(Boolean);
    for (const name of wanted) if (!ALL_ROWS.includes(name)) usage(`unknown row '${name}'`);
  }
  const dir = resolveRun(ROOTS.gates, label);
  note(`run: ${dir}`);
  const expectedFile = path.join(dir, 'rows-expected.txt');
  const summaryFile = path.join(dir, 'summary.tsv');
  if (!existsSync(expectedFile) || !existsSync(summaryFile)) usage(`${dir} holds no rows-expected.txt or summary.tsv`);
  const expected = read(expectedFile).split('\n').filter(Boolean);
  const rows = new Map(
    read(summaryFile)
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split('\t'))
      .map(([name, status]) => [name, status])
  );
  const required = wanted ? ALL_ROWS.filter((r) => wanted.includes(r)) : ALL_ROWS;
  if (expected.join(' ') !== required.join(' ')) {
    fail(
      wanted
        ? `the run holds the rows '${expected.join(',')}', not exactly the named rows '${required.join(',')}'`
        : `the run holds ${expected.length} row(s) '${expected.join(',')}', not the full gate set of ${ALL_ROWS.length}; a subset run is judged with --rows`
    );
  }
  for (const name of expected) {
    if (!rows.has(name)) fail(`row '${name}' is missing from summary.tsv`);
    else if (rows.get(name) !== '0') fail(`row '${name}' has status ${rows.get(name)}`);
  }
  note(`rows: ${expected.length} expected (${wanted ? 'the named subset' : 'the full gate set'}), ${rows.size} recorded`);
  note([...rows].map(([n, s]) => `${n}=${s}`).join(' '));
  assertNotStale(dir);
  reportPower(dir);
  finish(`gates ${path.basename(dir)}`);
}

// ── e2e ──────────────────────────────────────────────────────────────────────────────────────────
if (command === 'e2e') {
  const label = rest[0];
  let allowSlice = false;
  let sameProjectsAs = '';
  const excepts = new Map();
  const expectProjects = [];
  const titleCounts = [];
  for (let i = 1; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--allow-slice') {
      allowSlice = true;
      continue;
    }
    const value = rest[i + 1];
    if (a === '--same-projects-as') sameProjectsAs = value ?? usage('--same-projects-as requires a label or a path');
    else if (a === '--expect-project') expectProjects.push(value ?? usage('--expect-project requires a name'));
    else if (a === '--except') {
      const m = /^([^=]+)=(\+|[+-]?\d+)$/.exec(value ?? '');
      if (!m) usage('--except requires <project>=<integer> or <project>=+');
      excepts.set(m[1], m[2] === '+' ? '+' : Number(m[2]));
    } else if (a === '--expect-title-count') {
      const m = /^(.+?)::(.+)=(\d+)$/s.exec(value ?? '');
      if (!m) usage('--expect-title-count requires <project>::<substring>=<n>');
      titleCounts.push({ project: m[1], substring: m[2], n: Number(m[3]) });
    } else usage(`unexpected argument '${a}'`);
    i += 1;
  }
  if (excepts.size && !sameProjectsAs) usage('--except needs --same-projects-as');

  const dir = resolveRun(ROOTS.e2e, label);
  const what = `e2e ${path.basename(dir)}`;
  note(`run: ${dir}`);
  // A void run is judged before anything else is read: its counts and its exit file are not evidence about the tree.
  exitIfVoid(dir, what);
  const summaryFile = path.join(dir, 'summary.json');
  if (!existsSync(summaryFile)) {
    fail(`${summaryFile} is missing`);
    reportPower(dir);
    finish(what);
  }
  const summary = JSON.parse(read(summaryFile));
  const c = summary.counts;
  const byProject = summary.byProject ?? {};
  note(`counts: ${countsLine(c)}; ${Object.keys(byProject).length} project(s)`);
  if (c.failed !== 0) fail(`failed is ${c.failed}`);
  if (c.flaky !== 0) fail(`flaky is ${c.flaky}`);
  if (c.didNotRun !== 0) fail(`didNotRun is ${c.didNotRun}`);
  if (!(c.total > 0)) fail('total is 0');
  if (!(c.passed > 0)) fail('passed is 0');
  const exit = readOr(path.join(dir, 'exit'), null);
  if (exit === null) fail(`${dir}/exit is missing`);
  else if (exit !== '0') fail(`the run's exit file holds ${exit}`);
  assertPreflight(dir);
  const dirty = dirtyPaths(dir);
  if (dirty === null) fail(`${dir}/worktree-status.txt is missing, so the run cannot be shown to be of a committed tree`);
  else if (dirty.length) fail(`the run was made on an uncommitted tree (${dirty.join(', ')}): such a run is judged with control, not e2e`);
  const commandLine = readOr(path.join(dir, 'command'), '');
  const slice = /--project/.test(commandLine);
  note(`scope: ${commandLine ? (slice ? 'a project slice' : 'the full default suite') : 'unknown (no command recorded)'}`);
  if (!allowSlice && !commandLine) fail('no command is recorded, so the run cannot be shown to be the full suite');
  if (!allowSlice && slice) fail('the recorded command names --project: a slice, judged without --allow-slice');
  assertNotStale(dir);
  reportPower(dir);

  for (const name of expectProjects) {
    const p = byProject[name];
    if (!p) fail(`project '${name}' is absent from byProject`);
    else if (!(p.total > 0)) fail(`project '${name}' has total 0`);
    else if (p.passed !== p.total) fail(`project '${name}' passed ${p.passed} of ${p.total}`);
    else note(`project ${name}: ${p.passed}/${p.total} passed`);
  }

  if (titleCounts.length) {
    const report = testsOf(dir);
    if (report === null) fail(`${dir}/results.json is missing, so no title can be counted`);
    else {
      for (const { project, substring, n } of titleCounts) {
        const own = report.tests.filter((t) => t.project === project && t.title.includes(substring));
        const passed = own.filter((t) => t.outcome === 'passed').length;
        if (own.length !== n) fail(`project '${project}' holds ${own.length} test(s) whose title contains '${substring}', not ${n}`);
        else if (passed !== n) fail(`project '${project}': ${passed} of the ${n} test(s) whose title contains '${substring}' passed`);
        else note(`project ${project}: ${n} test(s) whose title contains '${substring}', all passed`);
      }
    }
  }

  if (sameProjectsAs) {
    const otherDir = resolveLabelOrPath(sameProjectsAs);
    const otherFile = path.join(otherDir, 'summary.json');
    if (!existsSync(otherFile)) usage(`${otherFile} is missing`);
    note(`compared with: ${otherDir}`);
    const otherName = path.basename(otherDir);
    const otherBy = JSON.parse(read(otherFile)).byProject ?? {};
    const names = allowSlice ? Object.keys(byProject) : [...new Set([...Object.keys(byProject), ...Object.keys(otherBy)])];
    names.sort((a, b) => a.localeCompare(b));
    note(`per project against ${otherName}${allowSlice ? ' (only the projects of this slice)' : ''}: name, this run, ${otherName}, expected, verdict`);
    let differing = 0;
    for (const name of names) {
      const mine = byProject[name]?.total ?? 0;
      const theirs = otherBy[name]?.total ?? 0;
      const rule = excepts.has(name) ? excepts.get(name) : 0;
      const holds = rule === '+' ? mine > theirs : mine === theirs + rule;
      const expected = rule === '+' ? `above ${theirs}` : rule === 0 ? `equal to ${theirs}` : `${theirs}${rule > 0 ? '+' : ''}${rule} = ${theirs + rule}`;
      note(`  ${name}\t${mine}\t${theirs}\t${expected}\t${holds ? 'holds' : 'DOES NOT HOLD'}`);
      if (!holds) {
        differing += 1;
        fail(`project '${name}' has total ${mine}; expected ${expected} (${otherName} has ${theirs})`);
      }
    }
    for (const name of excepts.keys()) {
      if (!(name in byProject) && !(name in otherBy)) note(`  --except ${name}: unused, the project is in neither run`);
      else if (allowSlice && !(name in byProject)) note(`  --except ${name}: unused, the project is not in this slice`);
    }
    note(`per project: ${names.length} compared, ${differing} not as expected`);
  }
  finish(what);
}

// ── control ──────────────────────────────────────────────────────────────────────────────────────
if (command === 'control') {
  const label = rest[0];
  let project = '';
  let setup = '';
  let green = false;
  let wereRedIn = '';
  const dirtyOnly = [];
  const reds = [];
  for (let i = 1; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--green') {
      green = true;
      continue;
    }
    const value = rest[i + 1];
    if (value === undefined || value === '') usage(`${a} requires a value`);
    if (a === '--project') project = value;
    else if (a === '--setup') setup = value;
    else if (a === '--dirty-only') dirtyOnly.push(value);
    else if (a === '--red') reds.push(value);
    else if (a === '--were-red-in') wereRedIn = value;
    else usage(`unexpected argument '${a}'`);
    i += 1;
  }
  if (!project) usage('control requires --project <name>');
  if (!setup) usage('control requires --setup <project>');
  if (!dirtyOnly.length) usage('control requires at least one --dirty-only <path>');
  if (green === reds.length > 0) usage('control takes either --red <title substring>... or --green');
  if (wereRedIn && !green) usage('--were-red-in needs --green');

  const dir = resolveRun(ROOTS.e2e, label);
  const what = `control ${path.basename(dir)} ${green ? '--green' : '--red'}`;
  note(`run: ${dir}`);
  exitIfVoid(dir, what);

  // The wrapper's own records.
  for (const name of ['head', 'exit', 'results.json', 'worktree-status.txt']) {
    if (!existsSync(path.join(dir, name))) fail(`${dir}/${name} is missing`);
  }
  if (existsSync(path.join(dir, 'head'))) note(`head: ${read(path.join(dir, 'head'))}`);
  assertPreflight(dir);

  // The uncommitted paths: at least one, and none outside the named ones.
  const dirty = dirtyPaths(dir);
  if (dirty !== null) {
    const inside = (p) => dirtyOnly.some((allowed) => (allowed.endsWith('/') ? p === allowed || p.startsWith(allowed) : p === allowed));
    if (dirty.length === 0) fail('the recorded worktree status holds no uncommitted path outside .planning/: this is a run of a committed tree, judged with e2e');
    for (const p of dirty) {
      if (inside(p)) note(`uncommitted: ${p}`);
      else fail(`the recorded worktree status holds '${p}', which is outside the --dirty-only paths (${dirtyOnly.join(', ')})`);
    }
  }

  const report = testsOf(dir);
  if (report === null) finish(what);
  const tests = report.tests;
  note(`counts: ${countsLine(tally(tests))}`);

  // The one project, by the recorded invocation.
  const commandLine = readOr(path.join(dir, 'command'), '') || report.argv.join(' ');
  const escaped = project.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`--project[= ]${escaped}(\\s|$)`).test(commandLine)) {
    fail(`the recorded Playwright invocation does not name --project ${project}: '${commandLine}'`);
  }

  // The Playwright status: the wrapper writes it to `exit`; a driver that rewrote `exit` keeps it as `playwright-exit`.
  const status = readOr(path.join(dir, 'playwright-exit'), readOr(path.join(dir, 'exit'), null));
  const wanted = green ? '0' : '1';
  if (status !== null && status !== wanted) fail(`the Playwright status is ${status}, not ${wanted}`);

  const setupTests = tests.filter((t) => t.project === setup);
  if (setupTests.length === 0) fail(`the run holds no test of the setup project ${setup}`);
  for (const t of setupTests) if (t.outcome !== 'passed') fail(`${setup} › ${t.title}: ${t.outcome}, not passed`);
  const own = tests.filter((t) => t.project === project);
  if (own.length === 0) fail(`the run holds no test of ${project}`);

  if (!green) {
    const red = new Set();
    for (const substring of reds) {
      const named = own.filter((t) => t.title.includes(substring));
      if (named.length === 0) fail(`no test of ${project} has '${substring}' in its title`);
      for (const t of named) red.add(t);
    }
    for (const t of red) {
      if (t.results.length === 0) {
        fail(`${t.title}: no result — the test did not run`);
        continue;
      }
      const statuses = t.results.map((r) => r.status);
      if (!statuses.every((s) => s === 'failed')) {
        fail(`${t.title}: ended ${statuses.join(', ')}, not failed`);
        continue;
      }
      const text = failureText(t.results[t.results.length - 1]);
      const firstLine = text.split('\n').find((l) => l.trim()) ?? '(no error text)';
      if (!/\bexpect(?:\.\w+)*\(/.test(text)) fail(`${t.title}: the failure is not an expectation: ${firstLine}`);
      else note(`red: ${t.title} — ${firstLine}`);
    }
    for (const t of tests) {
      if (!red.has(t) && t.outcome !== 'passed') fail(`${t.project} › ${t.title}: ${t.outcome}; every test outside the named ones must pass`);
    }
    note(`red: ${red.size} test(s) named by ${reds.map((s) => `'${s}'`).join(', ')}; ${tests.length - red.size} other test(s)`);
  } else {
    for (const t of tests) {
      if (t.outcome === 'failed' || t.outcome === 'flaky' || t.outcome === 'didNotRun') fail(`${t.project} › ${t.title}: ${t.outcome}`);
    }
    note(`${project}: ${own.length} test(s), ${own.filter((t) => t.outcome === 'passed').length} passed`);
    if (wereRedIn) {
      const redDir = resolveRun(ROOTS.e2e, wereRedIn);
      note(`red control: ${redDir}`);
      const redReport = testsOf(redDir);
      if (redReport === null) fail(`${redDir}/results.json is missing`);
      else {
        const wereRed = redReport.tests.filter((t) => t.outcome === 'failed');
        if (wereRed.length === 0) fail(`${redDir} lists no failed test`);
        for (const r of wereRed) {
          const now = tests.filter((t) => t.project === r.project && t.title === r.title);
          if (now.length === 0) fail(`${r.project} › ${r.title} was red in ${path.basename(redDir)} and is not in this run`);
          else if (!now.every((t) => t.outcome === 'passed')) fail(`${r.project} › ${r.title} was red in ${path.basename(redDir)} and is ${now.map((t) => t.outcome).join(', ')} here`);
          else note(`was red, now passed: ${r.title}`);
        }
      }
    }
  }
  finish(what);
}

// ── determinism ──────────────────────────────────────────────────────────────────────────────────
if (command === 'determinism') {
  const ledgerArg = rest[0];
  let project = '';
  let runs = 0;
  if (!ledgerArg || ledgerArg.startsWith('-')) usage('determinism requires a <ledger-dir>');
  for (let i = 1; i < rest.length; i += 2) {
    const value = rest[i + 1];
    if (value === undefined || value === '') usage(`${rest[i]} requires a value`);
    if (rest[i] === '--project') project = value;
    else if (rest[i] === '--runs') {
      if (!/^[1-9]\d*$/.test(value)) usage('--runs requires a positive integer');
      runs = Number(value);
    } else usage(`unexpected argument '${rest[i]}'`);
  }
  if (!project) usage('determinism requires --project <name>');
  if (!runs) usage('determinism requires --runs <n>');
  const ledger = path.normalize(ledgerArg).replace(/\/+$/, '');
  if (!isDirectory(ledger)) usage(`ledger directory ${ledgerArg} does not exist`);
  const what = `determinism ${path.basename(ledger)}`;
  note(`ledger: ${ledger}`);
  const runDirs = readdirSync(ledger)
    .filter((name) => /^run-/.test(name) && isDirectory(path.join(ledger, name)))
    .sort()
    .map((name) => path.join(ledger, name));
  for (const dir of runDirs) exitIfVoid(dir, `${what} ${path.basename(dir)}`);
  if (runDirs.length !== runs) fail(`the ledger holds ${runDirs.length} run director${runDirs.length === 1 ? 'y' : 'ies'}, not ${runs}`);
  const heads = new Set();
  for (const dir of runDirs) {
    const name = path.basename(dir);
    const exit = readOr(path.join(dir, 'exit'), null);
    if (exit === null) fail(`${name}: exit is missing`);
    else if (exit !== '0') fail(`${name}: its exit file holds ${exit}`);
    assertPreflight(dir, `${name}: `);
    const head = readOr(path.join(dir, 'head'), null);
    if (head === null) fail(`${name}: head is missing`);
    else heads.add(head);
    const report = testsOf(dir);
    if (report === null) {
      fail(`${name}: results.json is missing`);
      continue;
    }
    const c = tally(report.tests);
    const own = report.tests.filter((t) => t.project === project);
    const ownPassed = own.filter((t) => t.outcome === 'passed').length;
    note(`${name}: ${countsLine(c)}; ${project} ${ownPassed}/${own.length} passed; head ${head === null ? '(none)' : head.slice(0, 9)}`);
    if (c.failed !== 0) fail(`${name}: failed is ${c.failed}`);
    if (c.flaky !== 0) fail(`${name}: flaky is ${c.flaky}`);
    if (c.didNotRun !== 0) fail(`${name}: didNotRun is ${c.didNotRun}`);
    if (own.length === 0) fail(`${name}: the run holds no test of ${project}`);
    else if (ownPassed !== own.length) fail(`${name}: ${project} passed ${ownPassed} of ${own.length}`);
  }
  if (heads.size > 1) fail(`the runs are on ${heads.size} heads: ${[...heads].map((h) => h.slice(0, 9)).join(', ')}`);
  for (const head of heads) {
    if (!treeEqualToHead(head)) fail(`the batch is stale: its head ${head.slice(0, 9)} differs from HEAD outside .planning/`);
    else note(`not stale: head ${head.slice(0, 9)} is tree-equal to HEAD outside .planning/`);
  }
  finish(what);
}

// ── scope ────────────────────────────────────────────────────────────────────────────────────────
if (command === 'scope') {
  if (rest.length) usage('scope takes no argument');
  if (!existsSync(BASE_FILE)) usage(`${BASE_FILE} is missing`);
  const base = read(BASE_FILE);
  if (!/^[0-9a-f]{40}$/.test(base) || git('cat-file', '-e', `${base}^{commit}`).status !== 0) usage(`${BASE_FILE} names no commit: '${base}'`);
  const diff = git('diff', '--name-only', base, 'HEAD', '--', '.', ':(exclude).planning');
  if (diff.status !== 0) usage(`git diff against ${base.slice(0, 9)} failed: ${diff.stderr.trim()}`);
  const changed = diff.stdout.split('\n').filter(Boolean);
  note(`base: ${base.slice(0, 9)} (${BASE_FILE}); ${changed.length} path(s) changed outside .planning/`);
  for (const p of changed) {
    const refused = REFUSED_PATHS.find((r) => (r.path.endsWith('/') ? p.startsWith(r.path) : p === r.path));
    note(`${refused ? '! ' : '  '}${p}`);
    if (refused) fail(`${p} is changed: ${refused.what}, which no plan of the phase touches`);
  }
  finish('scope');
}

// ── hygiene ──────────────────────────────────────────────────────────────────────────────────────
if (command === 'hygiene') {
  if (rest.length) usage('hygiene takes no argument');

  const ENV = 'en' + 'v';
  const DOCKER = 'dock' + 'er';
  /** The file forms: hits in a script and in an action. */
  const FILE_FORMS = [
    {
      name: "a path whose last component is the untracked environment file's bare name",
      re: new RegExp('(?:^|[\\s"\'`=(/:,\\[])\\.' + ENV + '(?![\\w.\\-])')
    },
    {
      name: 'a call of the root script that compares the two local environment files',
      re: new RegExp('check:' + ENV + '-local')
    }
  ];
  /** The container forms: hits in a script, in an automated verify command and in a verification block. */
  const CONTAINER_FORMS = [
    {
      name: "the template field that lists a container's environment",
      re: new RegExp('\\.Config' + '\\.E' + 'nv\\b')
    },
    {
      name: 'the environment-printing command with no variable name after it',
      re: new RegExp('\\bprint' + ENV + '\\b(?!\\s+["\']?[A-Za-z_$<{])')
    },
    {
      name: 'an exec into a container that ends in the bare environment command',
      re: new RegExp('\\b' + DOCKER + '\\s+exec\\b[^|;&\\n]*\\s(?:/usr/bin/)?' + ENV + '\\s*(?:$|[|;&)`"\'])')
    },
    {
      name: 'a container log read without a filter',
      re: new RegExp('\\b' + DOCKER + '\\s+logs\\b(?!(?:(?!&&)[^\\n;])*\\|\\s*[ef]?grep\\b)')
    }
  ];

  let hits = 0;
  let advisories = 0;
  /** Scans `lines` (with the 1-based number of the first), reporting `strict` forms as hits and `loose` forms as advisory. */
  function scan(file, where, firstLine, lines, strict, loose) {
    lines.forEach((line, i) => {
      for (const form of strict) {
        if (form.re.test(line)) {
          hits += 1;
          fail(`${file}:${firstLine + i} (${where}): ${form.name}`);
          note(`  HIT ${file}:${firstLine + i} (${where}): ${form.name}: ${line.trim().slice(0, 160)}`);
        }
      }
      for (const form of loose) {
        if (form.re.test(line)) {
          advisories += 1;
          note(`  advisory ${file}:${firstLine + i} (${where}): ${form.name}: ${line.trim().slice(0, 160)}`);
        }
      }
    });
  }

  // (i) the phase's scripts, comment lines removed.
  const scripts = readdirSync(HERE)
    .filter((name) => /^177-.*\.(sh|mjs)$/.test(name))
    .sort()
    .map((name) => path.join(PHASE_DIR, name));
  note(`scan (i): ${scripts.length} script(s), comment lines removed`);
  for (const file of scripts) {
    const isShell = file.endsWith('.sh');
    const lines = readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => ((isShell ? /^\s*#/ : /^\s*(?:\/\/|\/\*|\*)/).test(line) ? '' : line));
    const before = hits;
    scan(file, 'script', 1, lines, [...FILE_FORMS, ...CONTAINER_FORMS], []);
    note(`  ${file}: ${hits - before} hit(s)`);
  }

  // (ii) the phase's plan files.
  const plans = readdirSync(HERE)
    .filter((name) => /^177-\d+-PLAN\.md$/.test(name))
    .sort()
    .map((name) => path.join(PHASE_DIR, name));
  note(`scan (ii): ${plans.length} plan file(s)`);
  const lineOf = (text, index) => text.slice(0, index).split('\n').length;
  for (const file of plans) {
    const text = readFileSync(file, 'utf8');
    const before = hits;
    let actions = 0;
    let verifies = 0;
    let blocks = 0;
    for (const task of text.matchAll(/<task\s+type="([^"]*)"[^>]*>([\s\S]*?)<\/task>/g)) {
      if (task[1].startsWith('checkpoint')) continue;
      const bodyStart = task.index + task[0].indexOf(task[2]);
      for (const action of task[2].matchAll(/<action>([\s\S]*?)<\/action>/g)) {
        actions += 1;
        const start = bodyStart + action.index + '<action>'.length;
        scan(file, 'action', lineOf(text, start), action[1].split('\n'), FILE_FORMS, CONTAINER_FORMS);
      }
    }
    for (const verify of text.matchAll(/<automated>([\s\S]*?)<\/automated>/g)) {
      verifies += 1;
      const start = verify.index + '<automated>'.length;
      scan(file, 'automated verify', lineOf(text, start), verify[1].split('\n'), CONTAINER_FORMS, FILE_FORMS);
    }
    for (const block of text.matchAll(/<verification>([\s\S]*?)<\/verification>/g)) {
      blocks += 1;
      const start = block.index + '<verification>'.length;
      scan(file, 'verification block', lineOf(text, start), block[1].split('\n'), CONTAINER_FORMS, FILE_FORMS);
    }
    note(`  ${file}: ${actions} action(s), ${verifies} automated verify command(s), ${blocks} verification block(s): ${hits - before} hit(s)`);
  }
  note(`hits: ${hits}; advisory lines (no verdict): ${advisories}`);
  finish('hygiene');
}

usage(command ? `unknown subcommand '${command}'` : 'a subcommand is required');
