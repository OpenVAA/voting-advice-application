#!/usr/bin/env node
// 179.1-rls-cost.mjs — measures the RLS list reads of 179.1-rls-cost.sql and compares two measurements.
//
// Usage:
//   node 179.1-rls-cost.mjs measure <label>
//   node 179.1-rls-cost.mjs compare <before-label> <after-label> --at-most <factor>
// Never in the foreground: start `measure` in the background and poll its marker, as the plans' <long_gates> say.
//
//   measure   hands 179.1-rls-cost.sql beside this file to
//             `docker exec -i supabase_db_openvaa-local psql -U postgres -d postgres -v ON_ERROR_STOP=1 -X -q -t`
//             on standard input. No connection string and no key is used. It reads every `rlscost-read <user> <read>`
//             marker line and the `"Execution Time"` of the plan after it, and writes 179.1-rls-cost-<label>.json
//             beside this file: per user and read, the five times in milliseconds and their median, plus the head,
//             the date, and the rows the first plan of each read returned. It then counts the candidates whose
//             external id begins `rlscost-`; the script's transaction ends in ROLLBACK, so any such row is a defect.
//             Exit 2 when psql fails, when a read has other than five times, when a marker has no plan after it, or
//             when a fixture row is left behind.
//   compare   reads 179.1-rls-cost-<before-label>.json and 179.1-rls-cost-<after-label>.json, prints each read's
//             two medians and their ratio (after / before), and exits 1 when any ratio is above <factor>.
//             Exit 2 when a file cannot be read or the two hold different reads.
//
// It prints user names, read names, times and ratios only; a psql error is reported by its first line with every
// UUID in it masked.
//
// Exit codes: 0 pass; 1 a ratio above the bound; 2 usage, measurement or file error.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
process.chdir(REPO_ROOT);
const SQL_FILE = path.join(HERE, '179.1-rls-cost.sql');
const CONTAINER = 'supabase_db_openvaa-local';
const PSQL = ['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-t'];
const USERS = ['admin', 'editor'];
const READS = ['candidates', 'nominations', 'storage'];
const RUNS_PER_READ = 5;

const resultFile = (label) => path.join(HERE, `179.1-rls-cost-${label}.json`);
const maskUuids = (s) => s.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<uuid>');

function usage(message) {
  if (message) console.error(`179.1-rls-cost.mjs: ${message}`);
  console.error('usage: node 179.1-rls-cost.mjs measure <label>\n     | compare <before-label> <after-label> --at-most <factor>');
  process.exit(2);
}

function stop(message) {
  console.error(`179.1-rls-cost.mjs: ${message}`);
  process.exit(2);
}

function checkLabel(label) {
  if (!label || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(label)) usage(`'${label ?? ''}' is not a plain label`);
}

function median(values) {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function psql(input) {
  return spawnSync('docker', PSQL, { input, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}

const [command, ...rest] = process.argv.slice(2);

if (command === 'measure') {
  if (rest.length !== 1) usage('measure takes one <label>');
  const label = rest[0];
  checkLabel(label);
  if (!existsSync(SQL_FILE)) stop(`${SQL_FILE} is missing`);
  const run = psql(readFileSync(SQL_FILE, 'utf8'));
  if (run.error) stop(`docker could not be run: ${run.error.message}`);
  if (run.status !== 0) {
    const first = (run.stderr || '').split('\n').find((l) => l.trim()) ?? '(no error text)';
    stop(`psql exited ${run.status}: ${maskUuids(first)}`);
  }

  const times = Object.fromEntries(USERS.map((u) => [u, Object.fromEntries(READS.map((r) => [r, []]))]));
  const rows = Object.fromEntries(USERS.map((u) => [u, {}]));
  let current = null;
  let awaitingRows = false;
  for (const line of run.stdout.split('\n')) {
    const marker = /^\s*rlscost-read (\S+) (\S+)\s*$/.exec(line);
    if (marker) {
      if (current) stop(`the marker for ${current.user} ${current.read} has no plan after it`);
      const [, user, read] = marker;
      if (!USERS.includes(user) || !READS.includes(read)) stop(`unknown marker: ${user} ${read}`);
      current = { user, read };
      awaitingRows = times[user][read].length === 0;
      continue;
    }
    const actualRows = /"Actual Rows":\s*(\d+)/.exec(line);
    if (current && awaitingRows && actualRows) {
      rows[current.user][current.read] = Number(actualRows[1]);
      awaitingRows = false;
    }
    const exec = /"Execution Time":\s*([0-9.]+)/.exec(line);
    if (exec) {
      if (!current) stop('a plan has no marker before it');
      times[current.user][current.read].push(Number(exec[1]));
      current = null;
    }
  }
  if (current) stop(`the marker for ${current.user} ${current.read} has no plan after it`);

  const users = {};
  for (const user of USERS) {
    users[user] = {};
    for (const read of READS) {
      const t = times[user][read];
      if (t.length !== RUNS_PER_READ) stop(`${user} ${read}: ${t.length} time(s), not ${RUNS_PER_READ}`);
      users[user][read] = { times: t, median: median(t) };
    }
  }

  const leftover = psql("SELECT count(*) FROM public.candidates WHERE external_id LIKE 'rlscost-%';\n");
  const count = leftover.status === 0 ? Number(leftover.stdout.trim()) : NaN;
  if (!Number.isInteger(count)) stop('the count of rlscost- candidates after the run could not be read');
  if (count !== 0) stop(`${count} rlscost- candidate row(s) remain after the run: the script's transaction did not roll back`);

  const head = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
  const out = {
    label,
    head,
    date: new Date().toISOString(),
    unit: 'ms',
    runsPerRead: RUNS_PER_READ,
    rows,
    users
  };
  writeFileSync(resultFile(label), `${JSON.stringify(out, null, 2)}\n`);
  for (const user of USERS) {
    for (const read of READS) {
      const r = users[user][read];
      console.log(`${user}\t${read}\trows ${rows[user][read] ?? '?'}\tmedian ${r.median.toFixed(3)} ms\ttimes ${r.times.map((x) => x.toFixed(3)).join(' ')}`);
    }
  }
  console.log(`fixture rows left after the run: ${count}`);
  console.log(`written: ${path.relative(REPO_ROOT, resultFile(label))}`);
  process.exit(0);
}

if (command === 'compare') {
  const [before, after, flag, factorText, ...extra] = rest;
  checkLabel(before);
  checkLabel(after);
  if (flag !== '--at-most' || extra.length) usage('compare takes <before-label> <after-label> --at-most <factor>');
  if (!/^\d+(\.\d+)?$/.test(factorText ?? '') || !(Number(factorText) > 0)) usage(`--at-most requires a positive number, not '${factorText ?? ''}'`);
  const factor = Number(factorText);
  const load = (label) => {
    const file = resultFile(label);
    if (!existsSync(file)) stop(`${path.relative(REPO_ROOT, file)} is missing`);
    try {
      return JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
      stop(`${path.relative(REPO_ROOT, file)} is not JSON: ${error.message}`);
    }
  };
  const a = load(before);
  const b = load(after);
  let above = 0;
  console.log(`before ${before} (head ${String(a.head).slice(0, 9)}), after ${after} (head ${String(b.head).slice(0, 9)}), bound ${factor}`);
  console.log('user\tread\tbefore ms\tafter ms\tratio\tverdict');
  for (const user of USERS) {
    for (const read of READS) {
      const x = a.users?.[user]?.[read]?.median;
      const y = b.users?.[user]?.[read]?.median;
      if (typeof x !== 'number' || typeof y !== 'number') stop(`${user} ${read} is missing from one of the two files`);
      const ratio = y / x;
      const holds = ratio <= factor;
      if (!holds) above += 1;
      console.log(`${user}\t${read}\t${x.toFixed(3)}\t${y.toFixed(3)}\t${ratio.toFixed(3)}\t${holds ? 'holds' : 'ABOVE THE BOUND'}`);
    }
  }
  console.log(above ? `179.1-rls-cost compare: FAIL (${above} read(s) above ${factor})` : '179.1-rls-cost compare: PASS');
  process.exit(above ? 1 : 0);
}

usage(command ? `unknown subcommand '${command}'` : 'a subcommand is required');
