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
 * Output: one finding per line on stdout, as `<path>:<line>: <needle kind>`; the needle itself is never printed. The closing summary line goes to stderr.
 *
 * The fixture names no key: a placeholder `{{kid:<i>}}`, `{{modulus:<i>}}` or `{{issuer}}` is replaced by the needle the guard derived, before the scan. A line `# @as <path>` makes the guard treat the lines after it as if they sat in that path, which is how the path exclusions are exercised.
 *
 * Exit codes:
 *   0 - no finding; or --report; or --self-test passed
 *   1 - at least one finding (gate mode); or --self-test found a difference
 *   2 - usage error, or the needles could not be derived
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-test-keys-scope.mjs';
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

/** Every distinct value of the first capture group of `re` in `text`. */
function distinct(text, re) {
  return [...new Set([...text.matchAll(re)].map((m) => m[1]))];
}

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

/** The kinds of the needles `line` holds, one entry per needle. */
function matchKinds(line, needles) {
  return needles.filter((n) => line.includes(n.value)).map((n) => n.kind);
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

if (selfTest) {
  const lines = readFileSync(FIXTURE_INPUT, 'utf8').split('\n');
  const observed = [];
  let asPath = FIXTURE_INPUT;
  lines.forEach((raw, i) => {
    const directive = /^# @as (\S+)\s*$/.exec(raw);
    if (directive) {
      asPath = directive[1];
      return;
    }
    if (SKIP(asPath) && asPath !== FIXTURE_INPUT) return;
    let line = raw;
    for (const n of needles) line = line.split(n.placeholder).join(n.value);
    for (const kind of matchKinds(line, needles)) observed.push(`${FIXTURE_INPUT}:${i + 1}: ${kind}`);
  });
  const expected = readFileSync(FIXTURE_EXPECTED, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.startsWith('#'));
  const missing = expected.filter((l) => !observed.includes(l));
  const unexpected = observed.filter((l) => !expected.includes(l));
  for (const l of missing) console.log(`self-test: expected but not reported: ${l}`);
  for (const l of unexpected) console.log(`self-test: reported but not expected: ${l}`);
  const ok = missing.length === 0 && unexpected.length === 0 && observed.length === expected.length;
  console.error(
    `Test-keys scope guard — self-test ${ok ? 'passed' : 'FAILED'}: ${observed.length} finding(s) on the fixture, ${expected.length} expected.`
  );
  process.exitCode = ok ? 0 : 1;
} else {
  scan();
}

// ── The scan ──
// The exit status is set rather than forced: writes to a pipe are asynchronous, and an immediate exit would drop findings that are still queued.
function scan() {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter(Boolean);
  let findings = 0;
  let scanned = 0;
  for (const file of files) {
    if (SKIP(file)) continue;
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    scanned += 1;
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => {
      for (const kind of matchKinds(line, needles)) {
        console.log(`${file}:${i + 1}: ${kind}`);
        findings += 1;
      }
    });
  }
  console.error(
    `Test-keys scope guard — ${needles.length} needle(s), ${scanned} tracked file(s) scanned outside the test tree; ${findings} finding(s).`
  );
  process.exitCode = findings > 0 && !report ? 1 : 0;
}
