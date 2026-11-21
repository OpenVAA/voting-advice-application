#!/usr/bin/env node
// 174-verdict.mjs — the Phase 174 verdicts, each read from evidence files and the committed tree.
//
// Usage:
//   node 174-verdict.mjs gates <label> [--rows <comma-separated row names>]
//   node 174-verdict.mjs e2e <label> [--allow-slice] [--min-total-of <label2>]
//                            [--same-projects-as <label2> [--except <project>=<delta>]...] [--expect-project <name>]...
//   node 174-verdict.mjs greps [--only <comma-separated positions>]
//   node 174-verdict.mjs exemptions
//   node 174-verdict.mjs hygiene
//
// A <label> resolves to its directory, or to its newest re-run <label>-rN when one exists.
//
//   gates       every name in rows-expected.txt is in summary.tsv with status 0, and the run is not stale (its
//               recorded head is tree-equal to HEAD outside .planning/). Without --rows the run must hold all
//               fifteen rows, so a subset run is never read as the full gate set; with --rows the run's
//               rows-expected.txt must hold exactly the named rows.
//   e2e         a run the wrapper ended as VOID (the host was suspended: VOID-host-suspend.txt in the run
//               directory, or 8 in its `exit` file) is given no verdict at all: it prints VOID and exits 3.
//               Otherwise:
//               summary.json has failed, flaky and didNotRun at 0 and total and passed above 0; the run's `exit`
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
//   greps       the four closing searches of LITERALS, over the committed tree with .planning/,
//               CAND-APP-PLAN.md and CLAUDE.md excluded. Each must print nothing and exit 1; any other status
//               fails, and every hit is listed. --only 1,3 searches the literals at those 1-based positions
//               alone and says which were left out.
//   exemptions  in the EXEMPT array of scripts/assert-no-candidate-app-names.mjs, at HEAD, no entry names the
//               deleted Edge Function or the user-data function Phase 173 deleted, and every sentence of the
//               script that states the number of entries states the number the array holds.
//   hygiene     two scans, each listing the file and the line of every hit; exit 0 only with no hit.
//               (i)  this phase's scripts — every 174-*.sh and 174-*.mjs beside this file, and
//                    scripts/assert-auth-signup-closed.mjs once it exists — with comment lines removed;
//               (ii) this phase's plan files: the action of every task that is not a checkpoint, every
//                    automated verify command, and every plan-level verification block.
//               The file forms (a path whose last component is the untracked environment file's bare name; a
//               call of the root script that compares the two local environment files) are hits in (i) and
//               in an action. The container forms (the template field that lists a container's environment;
//               the environment-printing command with no variable name after it; an exec into a container
//               that ends in the bare environment command; a container log read without a filter) are hits
//               in (i), in an automated verify command and in a verification block. A form found in a region
//               where it is not a hit is printed as advisory and changes no verdict.
//               The search patterns are assembled from fragments, so this file never hits itself.
//
// Both run verdicts print the host's Sleep entries recorded inside the run window (power.txt). A run that
// overlaps one is VOID, not red: it is made again under a new label.
//
// Exit codes: 0 pass; 1 fail; 2 usage error (including a run directory that does not exist); 3 (e2e only) the
// run is VOID — the wrapper ended it because the host was suspended; it is made again under a new label.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The four literals of the closing searches, in the order of 174-RESEARCH.md § R-3: the directory name of the deleted
 * Edge Function, the auth admin call that invites a user by mail, the writer method that reached the deleted function,
 * and the path segment of the registration page that never existed.
 */
const LITERALS = ['invite-candidate', 'inviteUserByEmail', 'preregisterWithApiToken', 'complete-registration'];

/** No entry of the exemption list may name either: the Edge Function this phase deletes, the function Phase 173 deleted. */
const DELETED_EXEMPT = ['invite-candidate', 'get_candidate_user_data'];

const BASE_ROWS = [
  'typecheck',
  'lint',
  'db-reset',
  'types-regen',
  'types-clean',
  'pgtap',
  'sql-lint',
  'unit',
  'check-frontend',
  'build',
  'format',
  'docs-links',
  'name-gate-self-test'
];
const ALL_ROWS = [...BASE_ROWS, 'auth-config', 'stack'];
const GATES_ROOT = 'tests/e2e-runs/174-gates';
const E2E_ROOT = 'tests/e2e-runs/174-e2e';
/** What tests/scripts/e2e-run.sh leaves behind when it ends a run as void: the marker file, and its exit status. */
const VOID_MARKER = 'VOID-host-suspend.txt';
const WRAPPER_EXIT_VOID = '8';
const NAME_GATE = 'scripts/assert-no-candidate-app-names.mjs';
const AUTH_GATE = 'scripts/assert-auth-signup-closed.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
process.chdir(REPO_ROOT);
const PHASE_DIR = path.relative(REPO_ROOT, HERE);

const failures = [];
const fail = (m) => failures.push(m);
const note = (m) => console.log(m);

function usage(message) {
  if (message) console.error(`174-verdict.mjs: ${message}`);
  console.error(
    'usage: node 174-verdict.mjs gates <label> [--rows <names>] | e2e <label> [--allow-slice] [--min-total-of <label2>] [--same-projects-as <label2> [--except <project>=<delta>]...] [--expect-project <name>]... | greps [--only <positions>] | exemptions | hygiene'
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
  console.log(failures.length ? `174-verdict ${what}: FAIL (${failures.length})` : `174-verdict ${what}: PASS`);
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
  // A void run is judged before anything else is read: its counts and its exit file are not evidence about the tree.
  const voidMarker = path.join(dir, VOID_MARKER);
  if (existsSync(voidMarker) || readOr(path.join(dir, 'exit'), '') === WRAPPER_EXIT_VOID) {
    const gap = /^gap_ms=(\d+)$/m.exec(readOr(voidMarker, ''));
    reportPower(dir);
    console.log(
      `174-verdict e2e ${path.basename(dir)}: VOID — the host was suspended during the run${gap ? ` (gap ${gap[1]} ms)` : ''}. It is neither a pass nor a red tree: make the run again under a new label (see ${voidMarker}).`
    );
    process.exit(3);
  }
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
  let positions = LITERALS.map((_, i) => i + 1);
  if (rest.length) {
    if (rest[0] !== '--only' || rest.length !== 2 || !rest[1]) usage('greps takes --only <comma-separated positions> or no argument');
    positions = rest[1].split(',').map((p) => Number(p));
    for (const p of positions) {
      if (!Number.isInteger(p) || p < 1 || p > LITERALS.length) usage(`--only names position '${p}'; the positions are 1 to ${LITERALS.length}`);
    }
    positions = [...new Set(positions)].sort((a, b) => a - b);
  }
  LITERALS.forEach((literal, i) => {
    if (!positions.includes(i + 1)) note(`${i + 1}. '${literal}': left out by --only`);
  });
  for (const position of positions) {
    const literal = LITERALS[position - 1];
    const r = spawnSync(
      'git',
      ['grep', '-n', '-I', '-F', '-e', literal, 'HEAD', '--', '.', ':(exclude).planning', ':(exclude)CAND-APP-PLAN.md', ':(exclude)CLAUDE.md'],
      { encoding: 'utf8', maxBuffer: 1 << 28 }
    );
    const hits = r.stdout.split('\n').filter(Boolean);
    if (r.status === 1 && hits.length === 0) {
      note(`${position}. '${literal}': no hit (exit 1)`);
      continue;
    }
    if (r.status === 0) {
      fail(`'${literal}': ${hits.length} hit(s) on the committed tree`);
      note(`${position}. '${literal}': ${hits.length} hit(s) in ${new Set(hits.map((h) => h.split(':')[1])).size} file(s)`);
      for (const h of hits) note(`  ${h.replace(/^HEAD:/, '').slice(0, 200)}`);
    } else {
      fail(`'${literal}': git grep exited ${r.status}: ${r.stderr.trim()}`);
    }
  }
  finish(positions.length === LITERALS.length ? 'greps' : `greps --only ${positions.join(',')}`);
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
  for (const name of DELETED_EXEMPT) {
    const naming = entries.filter((e) => e.includes(name));
    if (naming.length) fail(`EXEMPT still names '${name}' (${naming.length} entr${naming.length === 1 ? 'y' : 'ies'})`);
    else note(`no entry names '${name}'`);
  }
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  const lines = r.stdout.split('\n');
  let stated = 0;
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/exactly\s+(\w+)\s+entr(?:y|ies)/gi)) {
      stated += 1;
      const word = m[1].toLowerCase();
      const n = /^\d+$/.test(word) ? Number(word) : WORDS.indexOf(word);
      if (n === entries.length) note(`line ${i + 1} states '${m[0]}': agrees with the array`);
      else fail(`${NAME_GATE} line ${i + 1} states '${m[0]}', and the array holds ${entries.length}`);
    }
  });
  if (stated === 0) note('no sentence of the script states a number of entries');
  finish('exemptions');
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
    .filter((name) => /^174-.*\.(sh|mjs)$/.test(name))
    .sort()
    .map((name) => path.join(PHASE_DIR, name));
  if (existsSync(AUTH_GATE)) scripts.push(AUTH_GATE);
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
  if (!existsSync(AUTH_GATE)) note(`  ${AUTH_GATE}: not on the tree yet`);

  // (ii) the phase's plan files.
  const plans = readdirSync(HERE)
    .filter((name) => /^174-\d+-PLAN\.md$/.test(name))
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
