#!/usr/bin/env node
/**
 * 180-run-checks.mjs -- check an E2E run's stack restore record, its identity-callback serve log and, optionally, that every project of a record ran green.
 *
 * Usage: node 180-run-checks.mjs <run-dir> [--projects <record>]
 *
 * The function set is every directory directly under apps/supabase/supabase/functions/ whose index.ts is tracked
 * (`git ls-files`, run at the repository root three levels above this file), no name starting with `_`.
 *
 * Checks:
 *   - restore: `<run-dir>/restore.txt` has a line `restore: ok`, a line `OPTIONS <fn>: 200` for each function of the set,
 *     and no line containing `_shared`;
 *   - serve: the names in the lines of `<run-dir>/idp-functions.log` that end in ` - http…/functions/v1/<name>` equal the
 *     function set, and no line of that log matches /import map|deno\.json/i;
 *   - projects (with --projects): every line `project: <name>` of the record names a project of `<run-dir>/summary.json`
 *     (written by tests/scripts/e2e-evidence.mjs) whose total is above 0 and whose passed equals its total; a record with
 *     no such line is a mismatch.
 * Every mismatch is printed on its own line, then one summary line. Exits 0 when there is none, 1 otherwise, and 2 when a
 * file cannot be read or parsed. It writes nothing.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const FUNCTIONS_DIR = 'apps/supabase/supabase/functions';
const SERVED_LINE = /\s-\shttps?:\/\/\S*\/functions\/v1\/([^\s/]+)\s*$/;
const FORBIDDEN_SERVE = /import map|deno\.json/i;
const PROJECT_LINE = /^project:\s*(\S+)\s*$/;

function usage(message) {
  console.error(`180-run-checks.mjs: ${message}`);
  console.error('usage: node 180-run-checks.mjs <run-dir> [--projects <record>]');
  process.exit(2);
}

function parseArgs(argv) {
  const options = { runDir: '', projects: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--projects') {
      if (i + 1 >= argv.length) usage('--projects requires a value');
      options.projects = argv[i + 1];
      i += 1;
    } else if (options.runDir === '') {
      options.runDir = arg;
    } else {
      usage(`unexpected argument '${arg}'`);
    }
  }
  if (options.runDir === '') usage('<run-dir> is required');
  return options;
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`180-run-checks.mjs: cannot read ${file}: ${error.message}`);
    process.exit(2);
  }
}

function readSummary(dir) {
  const file = path.join(dir, 'summary.json');
  const text = readText(file);
  try {
    const summary = JSON.parse(text);
    if (summary === null || typeof summary !== 'object' || typeof summary.byProject !== 'object') {
      throw new Error('no byProject member');
    }
    return summary;
  } catch (error) {
    console.error(`180-run-checks.mjs: cannot parse ${file}: ${error.message}`);
    process.exit(2);
  }
}

function functionSet() {
  let listing;
  try {
    listing = execFileSync('git', ['ls-files', '--', FUNCTIONS_DIR], { cwd: REPO_ROOT, encoding: 'utf8' });
  } catch (error) {
    console.error(`180-run-checks.mjs: cannot list ${FUNCTIONS_DIR}: ${error.message}`);
    process.exit(2);
  }
  const names = new Set();
  for (const file of listing.split('\n')) {
    const rest = file.startsWith(`${FUNCTIONS_DIR}/`) ? file.slice(FUNCTIONS_DIR.length + 1) : '';
    const parts = rest.split('/');
    if (parts.length === 2 && parts[1] === 'index.ts' && !parts[0].startsWith('_')) names.add(parts[0]);
  }
  if (names.size === 0) {
    console.error(`180-run-checks.mjs: no tracked ${FUNCTIONS_DIR}/<fn>/index.ts found`);
    process.exit(2);
  }
  return [...names].sort();
}

const options = parseArgs(process.argv.slice(2));
const functions = functionSet();
const restoreLines = readText(path.join(options.runDir, 'restore.txt')).split('\n');
const serveLines = readText(path.join(options.runDir, 'idp-functions.log')).split('\n');
const summary = options.projects === '' ? null : readSummary(options.runDir);
const recordLines = options.projects === '' ? [] : readText(options.projects).split('\n');

const mismatches = [];

if (!restoreLines.some((line) => line.trim() === 'restore: ok')) mismatches.push('restore: no line `restore: ok`');
for (const fn of functions) {
  if (!restoreLines.some((line) => line.trim() === `OPTIONS ${fn}: 200`)) {
    mismatches.push(`restore: no line \`OPTIONS ${fn}: 200\``);
  }
}
for (const line of restoreLines) {
  if (line.includes('_shared')) mismatches.push(`restore: a line names _shared: ${line.trim()}`);
}

const served = new Set();
for (const line of serveLines) {
  const match = SERVED_LINE.exec(line);
  if (match) served.add(match[1]);
  if (FORBIDDEN_SERVE.test(line)) mismatches.push(`serve: a line matches import map|deno.json: ${line.trim()}`);
}
for (const fn of functions) {
  if (!served.has(fn)) mismatches.push(`serve: function ${fn} is not served`);
}
for (const name of [...served].sort()) {
  if (!functions.includes(name)) mismatches.push(`serve: ${name} is served but is not in the function set`);
}

if (summary !== null) {
  const projects = recordLines.map((line) => PROJECT_LINE.exec(line.trim())).filter(Boolean).map((match) => match[1]);
  if (projects.length === 0) mismatches.push(`projects: ${options.projects} has no line \`project: <name>\``);
  for (const project of projects) {
    const entry = summary.byProject[project];
    if (entry === undefined) {
      mismatches.push(`project ${project}: absent from the run`);
    } else if (!(typeof entry.total === 'number' && entry.total > 0) || entry.passed !== entry.total) {
      mismatches.push(`project ${project}: passed ${JSON.stringify(entry.passed)} of total ${JSON.stringify(entry.total)}`);
    }
  }
}

for (const line of mismatches) console.log(line);
console.log(
  `180-run-checks: ${mismatches.length === 0 ? 'OK' : 'MISMATCH'} (functions: ${functions.join(', ')}; served: ${[...served].sort().join(', ') || 'none'}${summary === null ? '' : `; ${recordLines.filter((line) => PROJECT_LINE.test(line.trim())).length} projects checked`})`
);
process.exit(mismatches.length === 0 ? 0 : 1);
