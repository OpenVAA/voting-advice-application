#!/usr/bin/env node

/**
 * E2E COVERAGE-TAG CENSUS.
 *
 * What it proves: every registration mode and every surface the contestant app's registration work names has at least one test in the default E2E run. Each is named by a tag the covering tests carry:
 *
 *   @reg-idp                registration with the identity provider
 *   @reg-email              registration by email, through the mailed link
 *   @reg-code               registration by registration code
 *   @org-registration       a party's own registration
 *   @entity-selection       the profile selection of an account with more than one entity
 *   @nomination-definition  the nominations editor
 *
 * How it reads tags: from Playwright's own list of the default run, `playwright test --list --reporter=json` with the selection the root `test:e2e` script makes (`-c ./tests/playwright.config.ts ./tests --grep-invert @probe`). The JSON reporter gives each test its `tags`, which Playwright collects from the test's title, from its `{ tag }` option and from its enclosing describes, so a tag in a title and a tag in the options count alike, and a tag in a comment, or a tag-like word the parser does not take, does not count. A test is counted once per project it runs in. A test tagged `@probe` is never counted, so a list made without the default run's filter still yields the default run's census.
 *
 * What it cannot see: whether a tagged test covers its item. A tag is a claim made by whoever placed it; reading the tests behind each tag is a review's job. Nor does it see whether the run passed: a census is not a run.
 *
 * Usage:
 *   node scripts/assert-e2e-coverage-tags.mjs                 # list the default run with Playwright and take its census
 *   node scripts/assert-e2e-coverage-tags.mjs --input <file>  # take the census of a list Playwright's JSON reporter wrote
 *   node scripts/assert-e2e-coverage-tags.mjs --self-test     # the census of the fixture list, compared with its .violations file
 *
 * Output: one line per tag on stdout, `<tag>: <n> test(s)` for a tag with tests and `<tag>: no test in the default run` for one without. The closing summary line goes to stderr.
 *
 * Exit codes:
 *   0 - every tag has a test; or --self-test passed
 *   1 - at least one tag has no test (each named); or --self-test found a difference
 *   2 - usage error, or the list cannot be produced or read (a Playwright failure, a listing error, unreadable JSON, a list with no test)
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-e2e-coverage-tags.mjs';
const FIXTURE_LIST = 'scripts/fixtures/assert-e2e-coverage-tags.list.json';
const FIXTURE_EXPECTED = 'scripts/fixtures/assert-e2e-coverage-tags.expected.violations';

/** The tags whose presence in the default run this census asserts. */
const REQUIRED_TAGS = [
  '@reg-idp',
  '@reg-email',
  '@reg-code',
  '@org-registration',
  '@entity-selection',
  '@nomination-definition'
];

/** The tag the default run leaves out. */
const EXCLUDED_TAG = '@probe';

/** The default run's selection, as the root `test:e2e` script makes it, listed through the JSON reporter. */
const LIST_ARGS = [
  'test',
  '-c',
  './tests/playwright.config.ts',
  './tests',
  '--grep-invert',
  EXCLUDED_TAG,
  '--list',
  '--reporter=json'
];

/** The JSON reporter writes a tag without its `@`; the census compares the bare name. */
const bare = (tag) => tag.replace(/^@/, '');

function usageError(message) {
  console.error(`${SELF}: ${message}`);
  console.error(`usage: node ${SELF} [--input <file> | --self-test]`);
  process.exit(2);
}

function cannotList(message) {
  console.error(`${SELF}: the test list cannot be produced or read: ${message}`);
  process.exit(2);
}

// ── Arguments ──
const argv = process.argv.slice(2);
let input = null;
let selfTest = false;
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--self-test') selfTest = true;
  else if (a === '--input') {
    if (!argv[i + 1] || argv[i + 1].startsWith('--')) usageError('--input requires a file');
    input = argv[i + 1];
    i += 1;
  } else usageError(`unexpected argument '${a}'`);
}
if (selfTest && input) usageError('--self-test takes no other flag');

const inputPath = input ? path.resolve(process.cwd(), input) : null;
process.chdir(REPO_ROOT);

if (selfTest) runSelfTest();
else runCensus(inputPath ? readList(inputPath) : listDefaultRun());

// ── The list ──

/** Parse a list the JSON reporter wrote. Refuses a file that cannot be read, is not JSON, records a listing error or holds no test. */
function readList(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    cannotList(`${file} cannot be read (${error.code ?? error.message})`);
  }
  let list;
  try {
    list = JSON.parse(text);
  } catch {
    cannotList(`${file} is not JSON`);
  }
  if (!list || !Array.isArray(list.suites)) cannotList(`${file} holds no \`suites\` array`);
  if (Array.isArray(list.errors) && list.errors.length > 0) {
    const first = list.errors[0]?.message ?? JSON.stringify(list.errors[0]);
    cannotList(`the list records ${list.errors.length} error(s); the first: ${String(first).split('\n')[0]}`);
  }
  return list;
}

/** Run Playwright's own listing of the default run, the JSON reporter writing to a file of its own. */
function listDefaultRun() {
  let cli;
  try {
    cli = createRequire(path.join(REPO_ROOT, 'package.json')).resolve('@playwright/test/cli');
  } catch {
    cannotList('@playwright/test is not installed (run `yarn install`)');
  }
  const dir = mkdtempSync(path.join(tmpdir(), 'e2e-coverage-tags-'));
  // On every exit, the refusals' included: they leave through process.exit, which skips a `finally`.
  process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
  const out = path.join(dir, 'list.json');
  const result = spawnSync(process.execPath, [cli, ...LIST_ARGS], {
    cwd: REPO_ROOT,
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: out },
    encoding: 'utf8',
    maxBuffer: 1 << 28
  });
  if (result.error) cannotList(`playwright did not start (${result.error.message})`);
  if (result.status !== 0) {
    const tail = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n').slice(-15).join('\n');
    cannotList(`playwright ${LIST_ARGS.join(' ')} exited ${result.status ?? result.signal}\n${tail}`);
  }
  return readList(out);
}

// ── The census ──

/** Every spec of the list, at any depth of describes. */
function specsOf(list) {
  const specs = [];
  const walk = (suite) => {
    for (const spec of suite.specs ?? []) specs.push(spec);
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of list.suites) walk(suite);
  return specs;
}

/** For each required tag, the number of tests of the default run that carry it; and the number of tests counted. */
function census(list) {
  const counts = new Map(REQUIRED_TAGS.map((tag) => [tag, 0]));
  let tests = 0;
  for (const spec of specsOf(list)) {
    const tags = new Set((spec.tags ?? []).map(bare));
    if (tags.has(bare(EXCLUDED_TAG))) continue;
    const n = (spec.tests ?? []).length;
    tests += n;
    for (const tag of REQUIRED_TAGS) if (tags.has(bare(tag))) counts.set(tag, counts.get(tag) + n);
  }
  return { counts, tests };
}

/** The lines of a census: a count per tag, and the findings, one per tag without a test. */
function linesOf({ counts }) {
  const lines = [];
  const findings = [];
  for (const [tag, n] of counts) {
    if (n === 0) {
      const line = `${tag}: no test in the default run`;
      lines.push(line);
      findings.push(line);
    } else lines.push(`${tag}: ${n} test(s)`);
  }
  return { lines, findings };
}

// The exit status is set rather than forced: writes to a pipe are asynchronous, and an immediate exit would drop lines that are still queued.
function runCensus(list) {
  const result = census(list);
  if (result.tests === 0) cannotList('the list holds no test of the default run');
  const { lines, findings } = linesOf(result);
  for (const line of lines) console.log(line);
  console.error(
    `E2E coverage-tag census — ${result.tests} test(s) in the default run; ${REQUIRED_TAGS.length - findings.length} of ${REQUIRED_TAGS.length} tag(s) have a test${findings.length ? `; no test for ${findings.map((f) => f.split(':')[0]).join(', ')}` : ''}.`
  );
  process.exitCode = findings.length > 0 ? 1 : 0;
}

// ── Self-test: the fixture list against its committed findings ──
function runSelfTest() {
  const { findings: observed } = linesOf(census(readList(FIXTURE_LIST)));
  const expected = readFileSync(FIXTURE_EXPECTED, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.startsWith('#'));
  const missing = expected.filter((l) => !observed.includes(l));
  const unexpected = observed.filter((l) => !expected.includes(l));
  for (const l of missing) console.log(`self-test: expected but not reported: ${l}`);
  for (const l of unexpected) console.log(`self-test: reported but not expected: ${l}`);
  const ok = missing.length === 0 && unexpected.length === 0 && observed.length === expected.length;
  console.error(
    `E2E coverage-tag census — self-test ${ok ? 'passed' : 'FAILED'}: ${observed.length} finding(s) on the fixture, ${expected.length} expected.`
  );
  process.exitCode = ok ? 0 : 1;
}
