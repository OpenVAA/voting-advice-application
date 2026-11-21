// 179.1-prod.mts -- the production build's two readings for Phase 179.1. Run from the repository root.
//
//   npx tsx PD/179.1-prod.mts manifest [--expect-missing <key,key>]
//   npx tsx PD/179.1-prod.mts judge <label> (--green | --red <title substring>...) [--expect <title substring>...] [--not-at <text>...]
//
// manifest  reads the one client file apps/frontend/build/client/_app/immutable/entry/app.*.js, whose dictionary is what
//           a production client decides from: a leaf with a server load is a negative number, the ones' complement the
//           framework writes (or begins `~`, unminified). For every key of every row's entryRoutes in APP_GATES it prints
//           the row, the key, the route id and whether the leaf has a server load. The population is the gate's own.
//           Exit 0 when all have one, 1 when any does not, 2 when it cannot look: no build, not exactly one such file,
//           no entry route at all, or an id with no entry in the dictionary.
//           --expect-missing: exit 0 only when the keys without one are exactly those named, otherwise 1.
//
// judge     reads tests/e2e-runs/179.1-prod/<label>/results.json, written by 179.1-prod-drive.sh.
//           --red: each substring names at least one test, whose status is `unexpected` and whose first error does not
//           begin with the test's timeout; every other test is `expected`. --not-at, repeatable: no red test's first
//           error holds the text, so a red at a wait is refused. Each red test's title, first error line and location
//           are printed.
//           --green: every test is `expected`, and each --expect substring names at least one.
//           Exit 0 pass, 1 fail, 2 usage, or a file that is missing or holds no test.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_GATES } from '../../../apps/frontend/src/lib/routes/appGates.ts';
import { ROUTE } from '../../../apps/frontend/src/lib/routes/route.ts';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const ENTRY_DIR = path.join(REPO_ROOT, 'apps/frontend/build/client/_app/immutable/entry');
const RUNS_DIR = path.join(REPO_ROOT, 'tests/e2e-runs/179.1-prod');
const CLIENT_FILE = /^app\.[^.]+\.js$/;
const TEST_TIMEOUT = /^Test timeout of /;
// Built from its code point so this file holds no raw control character.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[A-Za-z]`, 'g');

function refuse(message: string): never {
  console.error(`179.1-prod.mts: ${message}`);
  process.exit(2);
}

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function manifest(args: Array<string>): number {
  let expectMissing: Array<string> | undefined;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--expect-missing' && args[i + 1] !== undefined) {
      expectMissing = args[i + 1].split(',').filter(Boolean);
      i += 1;
    } else refuse(`manifest: unexpected argument '${args[i]}'`);
  }

  if (!existsSync(ENTRY_DIR)) refuse(`no build: ${ENTRY_DIR} does not exist`);
  const files = readdirSync(ENTRY_DIR).filter((name) => CLIENT_FILE.test(name));
  if (files.length !== 1) refuse(`expected exactly one app.*.js under ${ENTRY_DIR}, found ${files.length}`);
  const client = readFileSync(path.join(ENTRY_DIR, files[0]), 'utf8');

  const rows = APP_GATES.flatMap((gate) => gate.entryRoutes.map((key) => ({ gate: gate.name, key, id: ROUTE[key] })));
  if (rows.length === 0) refuse('APP_GATES lists no entry route');

  const missing: Array<string> = [];
  for (const { gate, key, id } of rows) {
    const entry = new RegExp(`"${escapeForRegExp(id)}"\\s*:\\s*\\[\\s*([-~]?)\\d+`).exec(client);
    if (!entry) refuse(`the route id ${id} (${key}) has no entry in ${files[0]}`);
    const hasServerLoad = entry[1] !== '';
    if (!hasServerLoad) missing.push(key);
    console.log(`${gate}\t${key}\t${id}\thas_server_load=${hasServerLoad}`);
  }

  if (expectMissing !== undefined) {
    const same =
      missing.length === expectMissing.length && [...missing].sort().join() === [...expectMissing].sort().join();
    console.log(`without a server load: ${missing.join(', ') || 'none'}; expected: ${expectMissing.join(', ') || 'none'}`);
    return same ? 0 : 1;
  }
  console.log(`without a server load: ${missing.join(', ') || 'none'}`);
  return missing.length === 0 ? 0 : 1;
}

type ReportError = { message?: string; location?: { file: string; line: number; column: number } };
type ReportResult = { errors?: Array<ReportError> };
type ReportTest = { projectName: string; status: string; results?: Array<ReportResult> };
type ReportSpec = { title: string; tests?: Array<ReportTest> };
type ReportSuite = { title: string; specs?: Array<ReportSpec>; suites?: Array<ReportSuite> };
type FlatTest = { title: string; project: string; status: string; firstError: ReportError | undefined };

function flatten(suite: ReportSuite, into: Array<FlatTest>): void {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      into.push({
        title: spec.title,
        project: test.projectName,
        status: test.status,
        firstError: test.results?.flatMap((result) => result.errors ?? [])[0]
      });
    }
  }
  for (const child of suite.suites ?? []) flatten(child, into);
}

function judge(args: Array<string>): number {
  const label = args[0];
  if (!label || label.startsWith('-')) refuse('judge: a label is required');
  let green = false;
  const red: Array<string> = [];
  const expected: Array<string> = [];
  const notAt: Array<string> = [];
  for (let i = 1; i < args.length; i += 1) {
    const flag = args[i];
    if (flag === '--green') {
      green = true;
      continue;
    }
    const value = args[i + 1];
    if (value === undefined) refuse(`judge: ${flag} needs a value`);
    if (flag === '--red') red.push(value);
    else if (flag === '--expect') expected.push(value);
    else if (flag === '--not-at') notAt.push(value);
    else refuse(`judge: unexpected argument '${flag}'`);
    i += 1;
  }
  if (green === (red.length > 0)) refuse('judge: exactly one of --green and --red is required');

  const file = path.join(RUNS_DIR, label, 'results.json');
  if (!existsSync(file)) refuse(`no results at ${file}`);
  const report = JSON.parse(readFileSync(file, 'utf8')) as { suites?: Array<ReportSuite> };
  const tests: Array<FlatTest> = [];
  for (const suite of report.suites ?? []) flatten(suite, tests);
  if (tests.length === 0) refuse(`${file} holds no test`);

  const problems: Array<string> = [];
  const named = (substring: string) => tests.filter((test) => test.title.includes(substring));
  const firstLine = (test: FlatTest) => (test.firstError?.message ?? '').replace(ANSI, '').trim().split('\n')[0];

  for (const substring of [...red, ...expected]) {
    if (named(substring).length === 0) problems.push(`no test's title holds: ${substring}`);
  }

  const redTests = tests.filter((test) => red.some((substring) => test.title.includes(substring)));
  for (const test of tests) {
    const isNamedRed = redTests.includes(test);
    if (isNamedRed) {
      const message = (test.firstError?.message ?? '').replace(ANSI, '').trim();
      const where = test.firstError?.location;
      console.log(`RED [${test.project}] ${test.title}`);
      console.log(`    ${firstLine(test)}`);
      console.log(`    ${where ? `${path.relative(REPO_ROOT, where.file)}:${where.line}` : '(no location)'}`);
      if (test.status !== 'unexpected') problems.push(`status ${test.status}, not unexpected: ${test.title}`);
      if (message === '') problems.push(`no error recorded: ${test.title}`);
      if (TEST_TIMEOUT.test(message)) problems.push(`ended on the test's timeout: ${test.title}`);
      for (const text of notAt) {
        if (message.includes(text)) problems.push(`first error holds '${text}': ${test.title}`);
      }
    } else if (test.status !== 'expected') {
      problems.push(`status ${test.status}, not expected: [${test.project}] ${test.title}: ${firstLine(test)}`);
    }
  }

  console.log(`tests: ${tests.length}; named red: ${redTests.length}`);
  for (const problem of problems) console.log(`FAIL ${problem}`);
  console.log(problems.length === 0 ? 'PASS' : 'FAIL');
  return problems.length === 0 ? 0 : 1;
}

const [subcommand, ...rest] = process.argv.slice(2);
if (subcommand === 'manifest') process.exit(manifest(rest));
if (subcommand === 'judge') process.exit(judge(rest));
refuse('usage: 179.1-prod.mts manifest [--expect-missing <key,key>] | judge <label> (--green | --red <substring>...) [--expect <substring>...] [--not-at <text>...]');
