#!/usr/bin/env node
// 173-verdict.mjs — the Phase 173 verdicts, each read from evidence files and the committed tree.
//
// Usage:
//   node 173-verdict.mjs gates <label> [--rows <comma-separated row names>]
//   node 173-verdict.mjs e2e <label> [--allow-slice] [--min-total-of <label2>]
//                            [--same-projects-as <label2> [--except <project>=<delta>]...] [--expect-project <name>]...
//   node 173-verdict.mjs greps
//   node 173-verdict.mjs exemptions
//
// A <label> resolves to its directory, or to its newest re-run <label>-rN when one exists.
//
//   gates       every name in rows-expected.txt is in summary.tsv with status 0, and the run is not stale (its
//               recorded head is tree-equal to HEAD outside .planning/). Without --rows the run must hold all
//               twelve rows, so a subset run is never read as the full gate set; with --rows the run's
//               rows-expected.txt must hold exactly the named rows.
//   e2e         summary.json has failed, flaky and didNotRun at 0 and total and passed above 0; the run's `exit`
//               file (the wrapper's status) is 0; one preflight success or more and no preflight failure; the
//               run is not stale; without --allow-slice the recorded command names no --project.
//               --min-total-of: counts.total is not below the other run's (a drop means tests vanished).
//               --expect-project: that project is in byProject, total above 0, every test passed.
//               --same-projects-as: for every project of this run and of the other run, this run's byProject
//               total equals the other run's, a project absent from a run counting as 0 there.
//               --except <project>=<integer>: this run's total for it equals the other run's plus the integer.
//               --except <project>=+: this run's total for it is above the other run's. An --except naming a
//               project in neither run changes nothing and is printed as unused. With --allow-slice the
//               comparison covers only the projects present in this run. One line is printed per project.
//   greps       the four closing searches, over the committed tree with .planning/ and CAND-APP-PLAN.md
//               excluded. Each must print nothing and exit 1; any other status fails, and every hit is listed.
//   exemptions  the EXEMPT array of scripts/assert-no-candidate-app-names.mjs, at HEAD, holds exactly the
//               entries of EXPECTED_EXEMPT and none that names the deleted user-data function.
//
// Both run verdicts print the host's Sleep entries recorded inside the run window (power.txt). A run that
// overlaps one is VOID, not red: it is made again under a new label.
//
// Exit codes: 0 pass; 1 fail; 2 usage error (including a run directory that does not exist).

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The four literals of the closing searches: the deleted function, its error hint, the fixed draft key, the retired login-error code. */
const LITERALS = [
  'get_candidate_user_data',
  'ERR_ENTITY_IDENTITY_AMBIGUOUS',
  'ContestantContext-contestantUserDataStore-editedAnswers',
  'userNoCandidate'
];

/** What the exemption list holds once the function's line is deleted: one marker per entry. See 173-NAME-MAP.md. */
const EXPECTED_EXEMPT = ['invite-candidate', 'Candidate and party app'];
const DELETED_EXEMPT = 'get_candidate_user_data';

const ALL_ROWS = [
  'typecheck',
  'lint',
  'types-regen',
  'types-clean',
  'sql-lint',
  'pgtap',
  'unit',
  'check-frontend',
  'build',
  'format',
  'docs-links',
  'name-gate-self-test'
];
const GATES_ROOT = 'tests/e2e-runs/173-gates';
const E2E_ROOT = 'tests/e2e-runs/173-e2e';
const NAME_GATE = 'scripts/assert-no-candidate-app-names.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.resolve(HERE, '..', '..', '..'));

const failures = [];
const fail = (m) => failures.push(m);
const note = (m) => console.log(m);

function usage(message) {
  if (message) console.error(`173-verdict.mjs: ${message}`);
  console.error(
    'usage: node 173-verdict.mjs gates <label> [--rows <names>] | e2e <label> [--allow-slice] [--min-total-of <label2>] [--same-projects-as <label2> [--except <project>=<delta>]...] [--expect-project <name>]... | greps | exemptions'
  );
  process.exit(2);
}

const read = (file) => readFileSync(file, 'utf8').trim();
const readOr = (file, fallback) => (existsSync(file) ? read(file) : fallback);

/** `<root>/<label>`, or its newest re-run `<label>-rN`. Exits 2 when neither exists. */
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

/** The run was made on a tree equal to HEAD outside .planning/. */
function assertNotStale(dir) {
  const headFile = path.join(dir, 'head');
  if (!existsSync(headFile)) return fail(`${dir}/head is missing`);
  const head = read(headFile);
  const r = spawnSync('git', ['diff', '--quiet', head, 'HEAD', '--', '.', ':(exclude).planning']);
  if (r.status !== 0) fail(`${dir} is stale: its head ${head.slice(0, 9)} differs from HEAD outside .planning/`);
  else note(`not stale: head ${head.slice(0, 9)} is tree-equal to HEAD outside .planning/`);
}

/** Prints what the run recorded about the host's power state. Informative: it changes no verdict. */
function reportPower(dir) {
  const m = /^sleep_entries_in_window: (\d+)$/m.exec(readOr(path.join(dir, 'power.txt'), ''));
  if (!m) return note('power: no record in this run directory');
  if (m[1] === '0') return note('power: no Sleep entry inside the run window');
  note(`power: ${m[1]} Sleep entr${m[1] === '1' ? 'y' : 'ies'} inside the run window — the host was suspended; a red run here is VOID, not red (see ${dir}/power.txt)`);
}

function finish(what) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.log(failures.length ? `173-verdict ${what}: FAIL (${failures.length})` : `173-verdict ${what}: PASS`);
  process.exit(failures.length ? 1 : 0);
}

const [command, ...rest] = process.argv.slice(2);

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
  const dir = resolveRun(GATES_ROOT, label);
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
  let minTotalOf = '';
  let sameProjectsAs = '';
  const excepts = new Map();
  const expectProjects = [];
  for (let i = 1; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === '--allow-slice') {
      allowSlice = true;
      continue;
    }
    const value = rest[i + 1];
    if (a === '--min-total-of') minTotalOf = value ?? usage('--min-total-of requires a label');
    else if (a === '--same-projects-as') sameProjectsAs = value ?? usage('--same-projects-as requires a label');
    else if (a === '--expect-project') expectProjects.push(value ?? usage('--expect-project requires a name'));
    else if (a === '--except') {
      const m = /^([^=]+)=(\+|[+-]?\d+)$/.exec(value ?? '');
      if (!m) usage('--except requires <project>=<integer> or <project>=+');
      excepts.set(m[1], m[2] === '+' ? '+' : Number(m[2]));
    } else usage(`unexpected argument '${a}'`);
    i += 1;
  }
  if (excepts.size && !sameProjectsAs) usage('--except needs --same-projects-as');

  const dir = resolveRun(E2E_ROOT, label);
  note(`run: ${dir}`);
  const summaryFile = path.join(dir, 'summary.json');
  if (!existsSync(summaryFile)) {
    fail(`${summaryFile} is missing`);
    reportPower(dir);
    finish(`e2e ${path.basename(dir)}`);
  }
  const summary = JSON.parse(read(summaryFile));
  const c = summary.counts;
  const byProject = summary.byProject ?? {};
  note(`counts: total ${c.total}, passed ${c.passed}, failed ${c.failed}, flaky ${c.flaky}, skipped ${c.skipped}, didNotRun ${c.didNotRun}; ${Object.keys(byProject).length} project(s)`);
  if (c.failed !== 0) fail(`failed is ${c.failed}`);
  if (c.flaky !== 0) fail(`flaky is ${c.flaky}`);
  if (c.didNotRun !== 0) fail(`didNotRun is ${c.didNotRun}`);
  if (!(c.total > 0)) fail('total is 0');
  if (!(c.passed > 0)) fail('passed is 0');
  const exit = readOr(path.join(dir, 'exit'), null);
  if (exit === null) fail(`${dir}/exit is missing`);
  else if (exit !== '0') fail(`the run's exit file holds ${exit}`);
  const preflightOk = Number(readOr(path.join(dir, 'preflight-successes'), '0'));
  const preflightFail = Number(readOr(path.join(dir, 'preflight-failures'), '0'));
  if (preflightOk < 1) fail('no preflight success is recorded');
  if (preflightFail > 0) fail(`${preflightFail} preflight failure(s) are recorded`);
  const commandLine = readOr(path.join(dir, 'command'), '');
  const slice = /--project/.test(commandLine);
  note(`scope: ${commandLine ? (slice ? 'a project slice' : 'the full default suite') : 'unknown (no command recorded)'}`);
  if (!allowSlice && !commandLine) fail('no command is recorded, so the run cannot be shown to be the full suite');
  if (!allowSlice && slice) fail('the recorded command names --project: a slice, judged without --allow-slice');
  assertNotStale(dir);
  reportPower(dir);

  const otherSummary = (otherLabel) => {
    const otherDir = resolveRun(E2E_ROOT, otherLabel);
    const otherFile = path.join(otherDir, 'summary.json');
    if (!existsSync(otherFile)) usage(`${otherFile} is missing`);
    return { name: path.basename(otherDir), summary: JSON.parse(read(otherFile)) };
  };

  if (minTotalOf) {
    const other = otherSummary(minTotalOf);
    if (c.total < other.summary.counts.total) fail(`total ${c.total} is below ${other.name}'s total ${other.summary.counts.total}: tests vanished from the run`);
    else note(`total ${c.total} is not below ${other.name}'s total ${other.summary.counts.total}`);
  }

  for (const name of expectProjects) {
    const p = byProject[name];
    if (!p) fail(`project '${name}' is absent from byProject`);
    else if (!(p.total > 0)) fail(`project '${name}' has total 0`);
    else if (p.passed !== p.total) fail(`project '${name}' passed ${p.passed} of ${p.total}`);
    else note(`project ${name}: ${p.passed}/${p.total} passed`);
  }

  if (sameProjectsAs) {
    const other = otherSummary(sameProjectsAs);
    const otherBy = other.summary.byProject ?? {};
    const names = allowSlice ? Object.keys(byProject) : [...new Set([...Object.keys(byProject), ...Object.keys(otherBy)])];
    names.sort((a, b) => a.localeCompare(b));
    note(`per project against ${other.name}${allowSlice ? ' (only the projects of this slice)' : ''}: name, this run, ${other.name}, expected, verdict`);
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
        fail(`project '${name}' has total ${mine}; expected ${expected} (${other.name} has ${theirs})`);
      }
    }
    for (const name of excepts.keys()) {
      if (!(name in byProject) && !(name in otherBy)) note(`  --except ${name}: unused, the project is in neither run`);
      else if (allowSlice && !(name in byProject)) note(`  --except ${name}: unused, the project is not in this slice`);
    }
    note(`per project: ${names.length} compared, ${differing} not as expected`);
  }
  finish(`e2e ${path.basename(dir)}`);
}

// ── greps ────────────────────────────────────────────────────────────────────────────────────────
if (command === 'greps') {
  if (rest.length) usage('greps takes no argument');
  for (const literal of LITERALS) {
    const r = spawnSync('git', ['grep', '-n', '-I', '-F', '-e', literal, 'HEAD', '--', '.', ':(exclude).planning', ':(exclude)CAND-APP-PLAN.md'], {
      encoding: 'utf8',
      maxBuffer: 1 << 28
    });
    const hits = r.stdout.split('\n').filter(Boolean);
    if (r.status === 1 && hits.length === 0) {
      note(`'${literal}': no hit (exit 1)`);
      continue;
    }
    if (r.status === 0) {
      fail(`'${literal}': ${hits.length} hit(s) on the committed tree`);
      note(`'${literal}': ${hits.length} hit(s) in ${new Set(hits.map((h) => h.split(':')[1])).size} file(s)`);
      for (const h of hits) note(`  ${h.replace(/^HEAD:/, '').slice(0, 200)}`);
    } else {
      fail(`'${literal}': git grep exited ${r.status}: ${r.stderr.trim()}`);
    }
  }
  finish('greps');
}

// ── exemptions ───────────────────────────────────────────────────────────────────────────────────
if (command === 'exemptions') {
  if (rest.length) usage('exemptions takes no argument');
  const r = spawnSync('git', ['show', `HEAD:${NAME_GATE}`], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    fail(`${NAME_GATE} is not readable at HEAD: ${r.stderr.trim()}`);
    finish('exemptions');
  }
  const block = /const EXEMPT = \[\n([\s\S]*?)\n\];/.exec(r.stdout);
  if (!block) {
    fail(`no 'const EXEMPT = [ … ];' block found in ${NAME_GATE}`);
    finish('exemptions');
  }
  const entries = block[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('/'));
  note(`EXEMPT holds ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}:`);
  for (const e of entries) note(`  ${e}`);
  if (entries.length !== EXPECTED_EXEMPT.length) fail(`EXEMPT holds ${entries.length} entries, expected exactly ${EXPECTED_EXEMPT.length}`);
  for (const marker of EXPECTED_EXEMPT) {
    if (entries.filter((e) => e.includes(marker)).length !== 1) fail(`EXEMPT does not hold exactly one entry naming '${marker}'`);
  }
  if (entries.some((e) => e.includes(DELETED_EXEMPT))) fail(`EXEMPT still names '${DELETED_EXEMPT}'`);
  finish('exemptions');
}

usage(command ? `unknown subcommand '${command}'` : 'a subcommand is required');
