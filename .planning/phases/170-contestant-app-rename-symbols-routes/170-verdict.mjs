#!/usr/bin/env node
// 170-verdict.mjs — the Phase 170 verdicts, each read from evidence files and committed trees.
//
// Usage:
//   node 170-verdict.mjs gates <label>
//   node 170-verdict.mjs e2e <label> [--same-total-as <label2>] [--expect-project <name>]... [--renamed-project <new>=<old>]...
//   node 170-verdict.mjs visual <label>
//   node 170-verdict.mjs baselines
//   node 170-verdict.mjs exemptions
//
// A <label> resolves to its directory, or to its newest re-run <label>-rN when one exists.
//
//   gates       every row of rows-expected.txt is in summary.tsv with status 0, and the run is not stale
//               (its recorded head is tree-equal to HEAD outside .planning/).
//   e2e         summary.json has failed, flaky and didNotRun at 0 and total and passed above 0; the run's
//               `exit` file is 0; the run is not stale. --same-total-as: total, passed and skipped equal the
//               other run's. --expect-project: that project is in byProject, total above 0, all passed.
//               --renamed-project new=old: the new project's total equals the old project's total in the
//               --same-total-as run, and the old name is absent from this run.
//   visual      the run's `status` is 0; observed.txt has observed_unexpected=0, observed_flaky=0,
//               observed_skipped=0 and observed_expected above 0.
//   baselines   the blob ids of the two preview baselines at the base revision equal the blob ids of the
//               same two files at HEAD under whichever name they carry, and the screenshots directory has
//               no uncommitted or untracked file.
//   exemptions  for each of the two exempt names, the occurrence count, the file count and the path count
//               at the base revision equal those at HEAD, over committed trees, excluding .planning/ and
//               the search gate's own files.
//
// Exit codes: 0 pass; 1 fail; 2 usage error (including a run directory that does not exist).

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
process.chdir(REPO_ROOT);
const PD = path.relative(REPO_ROOT, HERE);

const failures = [];
const fail = (m) => failures.push(m);
const note = (m) => console.log(m);

function usage(message) {
  if (message) console.error(`170-verdict.mjs: ${message}`);
  console.error(
    'usage: node 170-verdict.mjs gates <label> | e2e <label> [--same-total-as <label2>] [--expect-project <name>]... [--renamed-project <new>=<old>]... | visual <label> | baselines | exemptions'
  );
  process.exit(2);
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
const read = (file) => readFileSync(file, 'utf8').trim();

/** `<root>/<label>`, or its newest re-run `<label>-rN`. Exits 2 when neither exists. */
function resolveRun(root, label) {
  if (!label || label.startsWith('--')) usage('a <label> is required');
  let best = null;
  let bestN = 0;
  if (existsSync(root)) {
    for (const name of readdirSync(root)) {
      const m = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-r(\\d+)$`).exec(name);
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

function finish(what) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.log(failures.length ? `170-verdict ${what}: FAIL (${failures.length})` : `170-verdict ${what}: PASS`);
  process.exit(failures.length ? 1 : 0);
}

const [command, ...rest] = process.argv.slice(2);

// ── gates ────────────────────────────────────────────────────────────────────────────────────────
if (command === 'gates') {
  if (rest.length !== 1) usage('gates takes exactly one <label>');
  const dir = resolveRun('tests/e2e-runs/170-gates', rest[0]);
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
  if (expected.length === 0) fail('rows-expected.txt is empty');
  for (const name of expected) {
    if (!rows.has(name)) fail(`row '${name}' is missing from summary.tsv`);
    else if (rows.get(name) !== '0') fail(`row '${name}' has status ${rows.get(name)}`);
  }
  note(`rows: ${expected.length} expected, ${rows.size} recorded`);
  assertNotStale(dir);
  finish(`gates ${path.basename(dir)}`);
}

// ── e2e ──────────────────────────────────────────────────────────────────────────────────────────
if (command === 'e2e') {
  const label = rest[0];
  let sameTotalAs = '';
  const expectProjects = [];
  const renamed = [];
  for (let i = 1; i < rest.length; i += 1) {
    const a = rest[i];
    const value = rest[i + 1];
    if (a === '--same-total-as') sameTotalAs = value ?? usage('--same-total-as requires a label');
    else if (a === '--expect-project') expectProjects.push(value ?? usage('--expect-project requires a name'));
    else if (a === '--renamed-project') {
      const m = /^([^=]+)=([^=]+)$/.exec(value ?? '');
      if (!m) usage('--renamed-project requires <new>=<old>');
      renamed.push([m[1], m[2]]);
    } else usage(`unexpected argument '${a}'`);
    i += 1;
  }
  if (renamed.length && !sameTotalAs) usage('--renamed-project needs --same-total-as');
  const root = 'tests/e2e-runs/170-e2e';
  const dir = resolveRun(root, label);
  note(`run: ${dir}`);
  const summaryFile = path.join(dir, 'summary.json');
  if (!existsSync(summaryFile)) {
    fail(`${summaryFile} is missing`);
    finish(`e2e ${path.basename(dir)}`);
  }
  const summary = JSON.parse(read(summaryFile));
  const c = summary.counts;
  note(`counts: total ${c.total}, passed ${c.passed}, failed ${c.failed}, flaky ${c.flaky}, skipped ${c.skipped}, didNotRun ${c.didNotRun}`);
  if (c.failed !== 0) fail(`failed is ${c.failed}`);
  if (c.flaky !== 0) fail(`flaky is ${c.flaky}`);
  if (c.didNotRun !== 0) fail(`didNotRun is ${c.didNotRun}`);
  if (!(c.total > 0)) fail('total is 0');
  if (!(c.passed > 0)) fail('passed is 0');
  const exitFile = path.join(dir, 'exit');
  if (!existsSync(exitFile)) fail(`${exitFile} is missing`);
  else if (read(exitFile) !== '0') fail(`the run's exit file holds ${read(exitFile)}`);
  assertNotStale(dir);

  let other = null;
  if (sameTotalAs) {
    const otherDir = resolveRun(root, sameTotalAs);
    const otherFile = path.join(otherDir, 'summary.json');
    if (!existsSync(otherFile)) usage(`${otherFile} is missing`);
    other = JSON.parse(read(otherFile));
    for (const k of ['total', 'passed', 'skipped']) {
      if (c[k] !== other.counts[k]) fail(`${k} is ${c[k]}, but ${path.basename(otherDir)} has ${other.counts[k]}`);
    }
    note(`same totals as ${path.basename(otherDir)}: total ${other.counts.total}, passed ${other.counts.passed}, skipped ${other.counts.skipped}`);
  }
  const byProject = summary.byProject ?? {};
  for (const name of expectProjects) {
    const p = byProject[name];
    if (!p) fail(`project '${name}' is absent from byProject`);
    else if (!(p.total > 0)) fail(`project '${name}' has total 0`);
    else if (p.passed !== p.total) fail(`project '${name}' passed ${p.passed} of ${p.total}`);
    else note(`project ${name}: ${p.passed}/${p.total} passed`);
  }
  for (const [next, old] of renamed) {
    const now = byProject[next];
    const before = other.byProject?.[old];
    if (!before) fail(`project '${old}' is absent from the compared run`);
    else if (!now) fail(`project '${next}' is absent from byProject`);
    else if (now.total !== before.total) fail(`project '${next}' has total ${now.total}, but '${old}' had ${before.total}`);
    else note(`project ${next}: total ${now.total}, as ${old} had`);
    if (byProject[old]) fail(`the old project name '${old}' is still present`);
  }
  finish(`e2e ${path.basename(dir)}`);
}

// ── visual ───────────────────────────────────────────────────────────────────────────────────────
if (command === 'visual') {
  if (rest.length !== 1) usage('visual takes exactly one <label>');
  const dir = resolveRunNoHead('tests/e2e-runs/170-e2e', rest[0]);
  note(`run: ${dir}`);
  const statusFile = path.join(dir, 'status');
  const observedFile = path.join(dir, 'observed.txt');
  if (!existsSync(statusFile)) fail(`${statusFile} is missing`);
  else if (read(statusFile) !== '0') fail(`the run's status file holds ${read(statusFile)}`);
  if (!existsSync(observedFile)) fail(`${observedFile} is missing`);
  else {
    const observed = Object.fromEntries(
      read(observedFile)
        .split('\n')
        .map((l) => l.split('='))
        .filter((p) => p.length === 2)
    );
    for (const k of ['observed_unexpected', 'observed_flaky', 'observed_skipped']) {
      if (observed[k] !== '0') fail(`${k} is ${observed[k] ?? 'absent'}`);
    }
    if (!(Number(observed.observed_expected) > 0)) fail(`observed_expected is ${observed.observed_expected ?? 'absent'}`);
    note(`observed: expected ${observed.observed_expected}, unexpected ${observed.observed_unexpected}, flaky ${observed.observed_flaky}, skipped ${observed.observed_skipped}`);
  }
  finish(`visual ${path.basename(dir)}`);
}

/** As resolveRun, for run directories that hold no `head` file (the visual container's). */
function resolveRunNoHead(root, label) {
  if (!label || label.startsWith('--')) usage('a <label> is required');
  let best = null;
  let bestN = 0;
  if (existsSync(root)) {
    for (const name of readdirSync(root)) {
      const m = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-r(\\d+)$`).exec(name);
      if (m && Number(m[1]) > bestN) {
        bestN = Number(m[1]);
        best = path.join(root, name);
      }
    }
  }
  const dir = best ?? path.join(root, label);
  if (!existsSync(dir)) usage(`run directory ${dir} does not exist`);
  return dir;
}

// ── baselines ────────────────────────────────────────────────────────────────────────────────────
if (command === 'baselines') {
  if (rest.length) usage('baselines takes no argument');
  const base = read(path.join(PD, 'evidence', 'base-rev.txt'));
  const shots = 'tests/tests/specs/visual/__screenshots__';
  const blobs = (rev) =>
    new Map(
      git('ls-tree', '-r', rev, '--', shots)
        .split('\n')
        .filter(Boolean)
        .map((l) => /^\d+ blob ([0-9a-f]+)\t(.*)$/.exec(l))
        .filter(Boolean)
        .map((m) => [path.basename(m[2]), m[1]])
    );
  const before = blobs(base);
  const after = blobs('HEAD');
  for (const size of ['desktop', 'mobile']) {
    const old = `candidate-preview-${size}.png`;
    const next = `contestant-preview-${size}.png`;
    const was = before.get(old);
    const now = after.get(next) ?? after.get(old);
    if (!was) fail(`${old} is absent at the base revision`);
    else if (!now) fail(`neither ${next} nor ${old} is tracked at HEAD`);
    else if (was !== now) fail(`${size}: blob ${now.slice(0, 9)} at HEAD, ${was.slice(0, 9)} at the base revision`);
    else note(`${size}: blob ${was.slice(0, 9)} unchanged (${after.has(next) ? next : old})`);
    if (after.has(next) && after.has(old)) fail(`${size}: both the old and the new file name are tracked`);
  }
  const dirty = git('status', '--porcelain', '--', shots).trim();
  if (dirty) fail(`${shots} has uncommitted or untracked files:\n${dirty}`);
  finish('baselines');
}

// ── exemptions ───────────────────────────────────────────────────────────────────────────────────
if (command === 'exemptions') {
  if (rest.length) usage('exemptions takes no argument');
  const base = read(path.join(PD, 'evidence', 'base-rev.txt'));
  const scope = ['--', '.', ':(exclude).planning', ':(exclude)scripts/assert-no-candidate-app-names.mjs', ':(exclude)scripts/fixtures/assert-no-candidate-app-names.*'];
  const measure = (rev, name) => {
    // `git grep` exits 1 when nothing matches; that is a count of zero, not an error.
    const grep = (flag) => {
      const r = spawnSync('git', ['grep', '-I', flag, '-F', '-e', name, rev, ...scope], { encoding: 'utf8', maxBuffer: 1 << 28 });
      if (r.status !== 0 && r.status !== 1) throw new Error(`git grep failed: ${r.stderr}`);
      return r.stdout.split('\n').filter(Boolean).length;
    };
    const paths = git('ls-tree', '-r', '--name-only', rev)
      .split('\n')
      .filter((p) => p.includes(name) && !p.startsWith('.planning/')).length;
    return { occurrences: grep('-o'), files: grep('-l'), paths };
  };
  for (const name of ['get_candidate_user_data', 'invite-candidate']) {
    const before = measure(base, name);
    const after = measure('HEAD', name);
    note(`${name}: base ${before.occurrences} occ / ${before.files} files / ${before.paths} paths; HEAD ${after.occurrences} occ / ${after.files} files / ${after.paths} paths`);
    for (const k of ['occurrences', 'files', 'paths']) {
      if (before[k] !== after[k]) fail(`${name}: ${k} ${before[k]} at the base revision, ${after[k]} at HEAD`);
    }
    if (before.occurrences === 0) fail(`${name}: zero occurrences at the base revision — the instrument sees nothing`);
  }
  finish('exemptions');
}

usage(command ? `unknown subcommand '${command}'` : 'a subcommand is required');
