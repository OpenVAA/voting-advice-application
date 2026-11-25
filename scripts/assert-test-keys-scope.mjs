#!/usr/bin/env node

/**
 * TEST-KEYS SCOPE GUARD.
 *
 * What it forbids: a tracked file outside the test tree that names the committed test keys of the identity-provider E2E specs, or the issuer of the mock OIDC issuer those specs run against. The key pair is public by being committed, so anyone can mint an ID token it signs; a deployment whose configuration trusts that pair or that issuer accepts such a token. A root or functions environment template, `config.toml`, a workflow, `infra/` or a compose file naming one of them is a finding.
 *
 * The needles are derived when the guard runs, never typed here:
 *   - `test key id`         — every `kid` of `tests/tests/utils/testKeys.ts`;
 *   - `test public modulus` — the first 24 characters of every modulus `n` of the same file, which every serialisation of a key, public or private, carries;
 *   - `mock issuer`         — `MOCK_ISSUER` of `tests/tests/support/mockOidcIssuer.ts`.
 * When fewer than two key ids, fewer than two moduli or no issuer can be read, the guard refuses with exit 2: a guard that cannot see its needles reports nothing, and nothing is not a pass.
 *
 * NOT SCANNED: `tests/` (the test tree, where the keys belong); `.planning/` (the planning record, which is never configuration); `.yarn/` (the vendored package-manager release); the guard's own source and fixtures. The file set is `git ls-files`, so an untracked file -- the developer's own environment files among them -- is never read.
 *
 * Usage:
 *   node scripts/assert-test-keys-scope.mjs               # gate: exit 1 on any finding
 *   node scripts/assert-test-keys-scope.mjs --report      # print findings, exit 0
 *   node scripts/assert-test-keys-scope.mjs --self-test   # scan the fixture, compare with its .violations file
 *
 * Output: one finding per line on stdout, as `<path>:<line>: <needle kind>`; the needle itself is never printed. A tracked file whose contents cannot be read is named on stderr with its error code, except a tracked symbolic link to a directory and a tracked path deleted from the working tree, neither of which has contents. The closing summary line, which counts the unreadable files, and on a finding the line naming where the keys belong, go to stderr.
 *
 * The fixture names no key: a placeholder `{{kid:<i>}}`, `{{modulus:<i>}}` or `{{issuer}}` is replaced by the needle the guard derived, before the scan. A line `# @as <path>` makes the guard treat the lines after it as if they sat in that path, which is how the path exclusions are exercised.
 *
 * The self-test also runs in every gate and --report invocation, after the scan and before the verdict: no unit test runs this guard's fixture, and a guard whose fixture runs in no unit test runs it in its own gate. A gate whose self-test fails is not trusted.
 *
 * Exit codes:
 *   0 - no finding, no unreadable file and the self-test passed; or --report; or --self-test passed
 *   1 - at least one finding, a tracked file whose contents could not be read, or a failed self-test (gate mode); or --self-test found a difference
 *   2 - usage error, or the needles could not be derived
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareWithExpected, fixtureLines, scanLines, trackedFiles } from './lib/text-guard.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-test-keys-scope.mjs';
const GUARD_NAME = 'Test-keys scope guard';
/** What a failing run tells the reader to do instead. */
const REMEDY = `${GUARD_NAME} — the committed test keys and the mock issuer belong under tests/ only; give the deployment its own provider keys and issuer.`;
const FIXTURE_INPUT = 'scripts/fixtures/assert-test-keys-scope.input.txt';
const FIXTURE_EXPECTED = 'scripts/fixtures/assert-test-keys-scope.expected.violations';
const TEST_KEYS = 'tests/tests/utils/testKeys.ts';
const MOCK_ISSUER_SOURCE = 'tests/tests/support/mockOidcIssuer.ts';
const MODULUS_PREFIX_LENGTH = 24;

const SKIP = (file) =>
  file.startsWith('tests/') ||
  file.startsWith('.planning/') ||
  file.startsWith('.yarn/') ||
  file === SELF ||
  file.startsWith('scripts/fixtures/assert-test-keys-scope.');

function fail(message) {
  console.error(`${SELF}: ${message}`);
  console.error(`usage: node ${SELF} [--report] [--self-test]`);
  process.exit(2);
}

function refuse(message) {
  console.error(`${SELF}: ${message}`);
  console.error(`${SELF}: the needles could not be derived, so nothing was scanned.`);
  process.exit(2);
}

// ── Arguments ──
const argv = process.argv.slice(2);
let report = false;
let selfTest = false;
for (const a of argv) {
  if (a === '--report') report = true;
  else if (a === '--self-test') selfTest = true;
  else fail(`unexpected argument '${a}'`);
}
if (selfTest && report) fail('--self-test takes no other flag');

process.chdir(REPO_ROOT);
const needles = deriveNeedles();

/** The fixture's findings compared with its expected file. */
function runSelfTest() {
  const observed = [];
  for (const { line: raw, lineNumber, asPath } of fixtureLines(FIXTURE_INPUT, /^# @as (\S+)\s*$/)) {
    if (SKIP(asPath) && asPath !== FIXTURE_INPUT) continue;
    let line = raw;
    for (const n of needles) line = line.split(n.placeholder).join(n.value);
    for (const kind of matchKinds(line, needles)) observed.push(`${FIXTURE_INPUT}:${lineNumber}: ${kind}`);
  }
  return compareWithExpected(GUARD_NAME, observed, FIXTURE_EXPECTED);
}

if (selfTest) process.exitCode = runSelfTest() ? 0 : 1;
else scan();

// ── The scan ──
// The exit status is set rather than forced: writes to a pipe are asynchronous, and an immediate exit would drop findings that are still queued.
function scan() {
  let findings = 0;
  const { scanned, unreadable } = scanLines(
    trackedFiles({ skip: SKIP }),
    (file, line, lineNumber) => {
      for (const kind of matchKinds(line, needles)) {
        console.log(`${file}:${lineNumber}: ${kind}`);
        findings += 1;
      }
    },
    { label: SELF }
  );
  console.error(
    `${GUARD_NAME} — ${needles.length} needle(s), ${scanned} tracked file(s) scanned outside the test tree, ${unreadable} unreadable; ${findings} finding(s).`
  );
  const selfTestPassed = runSelfTest();
  if (!selfTestPassed)
    console.error(
      `${SELF}: the self-test did not match its committed expectations (printed above), so the result over the tracked tree cannot be trusted.`
    );
  if (findings > 0) console.error(REMEDY);
  process.exitCode = (findings > 0 || unreadable > 0 || !selfTestPassed) && !report ? 1 : 0;
}

// ── The needles ──
/** The needles, each with the kind a finding names and the placeholder the fixture spells it with. */
function deriveNeedles() {
  let keys;
  let issuerSource;
  try {
    keys = readFileSync(TEST_KEYS, 'utf8');
    issuerSource = readFileSync(MOCK_ISSUER_SOURCE, 'utf8');
  } catch (error) {
    refuse(`could not read ${TEST_KEYS} or ${MOCK_ISSUER_SOURCE}: ${error.message}`);
  }
  const kids = distinct(keys, /\bkid: '([^']+)'/g);
  const moduli = distinct(keys, new RegExp(`\\bn: '([A-Za-z0-9_-]{${MODULUS_PREFIX_LENGTH}})`, 'g'));
  const issuers = distinct(issuerSource, /export const MOCK_ISSUER = '([^']+)'/g);
  if (kids.length < 2) refuse(`expected at least two key ids in ${TEST_KEYS}, read ${kids.length}`);
  if (moduli.length < 2) refuse(`expected at least two moduli in ${TEST_KEYS}, read ${moduli.length}`);
  if (issuers.length !== 1) refuse(`expected one MOCK_ISSUER in ${MOCK_ISSUER_SOURCE}, read ${issuers.length}`);
  return [
    ...kids.map((value, i) => ({ kind: 'test key id', placeholder: `{{kid:${i}}}`, value })),
    ...moduli.map((value, i) => ({ kind: 'test public modulus', placeholder: `{{modulus:${i}}}`, value })),
    { kind: 'mock issuer', placeholder: '{{issuer}}', value: issuers[0] }
  ];
}

/** Every distinct value of the first capture group of `re` in `text`. */
function distinct(text, re) {
  return [...new Set([...text.matchAll(re)].map((m) => m[1]))];
}

/** The kinds of the needles `line` holds, one entry per needle. */
function matchKinds(line, needles) {
  return needles.filter((n) => line.includes(n.value)).map((n) => n.kind);
}
