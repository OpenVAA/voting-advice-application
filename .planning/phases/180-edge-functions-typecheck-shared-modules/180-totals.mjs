#!/usr/bin/env node
/**
 * 180-totals.mjs -- compare the per-project test totals of an E2E run with the last full run plus this phase's recorded deltas.
 *
 * Usage: node 180-totals.mjs <run-dir> --slice|--full [--baseline <dir>] [--deltas <file>]
 *
 * Defaults: --baseline tests/e2e-runs/179.2/179.2-final-4, --deltas <this file's directory>/180-E2E-DELTAS.md.
 *
 * Reads `<run-dir>/summary.json` and `<baseline>/summary.json` (both written by tests/scripts/e2e-evidence.mjs) and the deltas table, whose rows are shaped `| 180-NN | <project> | +N | <titles> |` (NN a plan number, or `RF` for the code-review fixes); the deltas are summed per project.
 *
 * Exits 0 only when:
 *   - the run is not void, its wrapper exit is 0, its total is above 0 and every test passed;
 *   - every project of the run has the baseline's total for it (0 when the baseline has none) plus its summed delta;
 *   - with --full, every project of the baseline and of the deltas table is present in the run.
 * Every mismatch is printed on its own line. Any other outcome exits 1; an unreadable or unparsable file exits 2. It writes nothing.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASELINE = 'tests/e2e-runs/179.2/179.2-final-4';
const DEFAULT_DELTAS = path.join(HERE, '180-E2E-DELTAS.md');
const DELTA_ROW = /^\|\s*180-(?:\d+|RF)\s*\|\s*([^|]+?)\s*\|\s*([+-]?\d+)\s*\|/;

function usage(message) {
  console.error(`180-totals.mjs: ${message}`);
  console.error('usage: node 180-totals.mjs <run-dir> --slice|--full [--baseline <dir>] [--deltas <file>]');
  process.exit(2);
}

function parseArgs(argv) {
  const options = { runDir: '', mode: '', baseline: DEFAULT_BASELINE, deltas: DEFAULT_DELTAS };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--slice' || arg === '--full') {
      if (options.mode !== '') usage('give one of --slice and --full');
      options.mode = arg.slice(2);
    } else if (arg === '--baseline' || arg === '--deltas') {
      if (i + 1 >= argv.length) usage(`${arg} requires a value`);
      options[arg.slice(2)] = argv[i + 1];
      i += 1;
    } else if (options.runDir === '') {
      options.runDir = arg;
    } else {
      usage(`unexpected argument '${arg}'`);
    }
  }
  if (options.runDir === '') usage('<run-dir> is required');
  if (options.mode === '') usage('one of --slice and --full is required');
  return options;
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`180-totals.mjs: cannot read ${file}: ${error.message}`);
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
    console.error(`180-totals.mjs: cannot parse ${file}: ${error.message}`);
    process.exit(2);
  }
}

function readDeltas(file) {
  const sums = new Map();
  for (const line of readText(file).split('\n')) {
    const match = DELTA_ROW.exec(line);
    if (!match) continue;
    const project = match[1];
    sums.set(project, (sums.get(project) ?? 0) + Number.parseInt(match[2], 10));
  }
  return sums;
}

const options = parseArgs(process.argv.slice(2));
const run = readSummary(options.runDir);
const baseline = readSummary(options.baseline);
const deltas = readDeltas(options.deltas);

const mismatches = [];

if (run.void !== null && run.void !== undefined) mismatches.push(`run: void (${JSON.stringify(run.void)})`);
if (run.wrapperExit !== 0) mismatches.push(`run: wrapperExit is ${JSON.stringify(run.wrapperExit)}, not 0`);
const total = run.counts?.total;
const passed = run.counts?.passed;
if (!(typeof total === 'number' && total > 0)) mismatches.push(`run: counts.total is ${JSON.stringify(total)}`);
if (passed !== total) mismatches.push(`run: counts.passed ${JSON.stringify(passed)} != counts.total ${JSON.stringify(total)}`);

const totalOf = (summary, project) => summary.byProject[project]?.total ?? 0;

for (const project of Object.keys(run.byProject).sort()) {
  const expected = totalOf(baseline, project) + (deltas.get(project) ?? 0);
  const actual = totalOf(run, project);
  if (actual !== expected) {
    mismatches.push(
      `project ${project}: total ${actual}, expected ${expected} (baseline ${totalOf(baseline, project)}, delta ${deltas.get(project) ?? 0})`
    );
  }
}

if (options.mode === 'full') {
  const required = new Set([...Object.keys(baseline.byProject), ...deltas.keys()]);
  for (const project of [...required].sort()) {
    if (!(project in run.byProject)) mismatches.push(`project ${project}: absent from the run`);
  }
}

for (const line of mismatches) console.log(line);
console.log(
  `180-totals: ${mismatches.length === 0 ? 'OK' : 'MISMATCH'} (${options.mode}, ${Object.keys(run.byProject).length} projects, ${total ?? '?'} tests)`
);
process.exit(mismatches.length === 0 ? 0 : 1);
