#!/usr/bin/env node

/**
 * NO-PREREGISTER GUARD.
 *
 * What it guards: the legacy pre-registration chain stays gone. Registration with the identity provider starts on the one registration tree, `register/`, and the chain that preceded it — its page tree, its API route, the token endpoint, its route constants, its message namespace, its data writer and context members and its notification component — is deleted. Every one of those names carried the stem this guard forbids, so a reintroduced route, member, namespace or file brings the stem back with it and is reported.
 *
 * The rule: `/[Pp]reregist|PREREGIST/`. It matches the stem with a lower- or upper-case first letter followed by `reregist`, or the stem in capitals throughout (`PREREGISTER_ROUTE`), in a path or a line of a tracked file under `apps/`, `packages/` or `tests/`. Zero findings are allowed, and there is no exemption list.
 *
 * WHY NOT CASE-INSENSITIVE. The stored-settings schema test asserts that a stored row carrying the removed setting's key is refused, and that key is spelled `preRegistration`, with a capital R. A case-insensitive rule would report the test that keeps the setting out; this rule does not, so the test stays as it is and no exemption is needed. Another gate's own vocabulary (`scripts/assert-no-candidate-app-names.mjs` and its fixtures spell the stem in their patterns) lives under `scripts/`, outside the scanned trees.
 *
 * WHAT IT CANNOT SEE. A spelling with a hyphen, an underscore or a space after `pre` (`pre-registration`, the folder name of a docs page among them), a name of the chain that does not carry the stem, an untracked file, and anything outside the three scanned trees. A name split or spelled around to pass is a violation of the rule's intent, not a pass.
 *
 * NOT SCANNED: every tracked path outside `apps/`, `packages/` and `tests/`. Structural self-exclusion: the guard's own source and fixtures are under `scripts/`, and its own script name, as a file name or a package script key, is masked wherever it is cited, because a text guard cannot avoid spelling what it forbids.
 *
 * Usage:
 *   node scripts/assert-no-preregister.mjs                # gate: exit 1 on any finding
 *   node scripts/assert-no-preregister.mjs --report       # print findings, exit 0
 *   node scripts/assert-no-preregister.mjs --self-test    # scan the fixture, compare with its .violations file
 *
 * Output: one finding per line on stdout, as `<path>:<line>: <matched text>` for a content line, the matched text being the run of name characters around the stem, or `<path>: path segment <segment>` for a segment of a tracked path. The closing summary line goes to stderr, so stdout holds findings and nothing else.
 *
 * In the fixture a line `// @as <path>` makes the scanner treat the lines after it as if they sat in that path, and a line `// @path <path>` is judged as a tracked path.
 *
 * Exit codes:
 *   0 - no finding; or --report; or --self-test passed
 *   1 - at least one finding (gate mode); or --self-test found a difference
 *   2 - usage error
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-no-preregister.mjs';
const FIXTURE_INPUT = 'scripts/fixtures/assert-no-preregister.input.ts';
const FIXTURE_EXPECTED = 'scripts/fixtures/assert-no-preregister.expected.ts.violations';

/** The trees the rule holds for. */
const SCANNED_TREES = ['apps/', 'packages/', 'tests/'];
/** Structural, not an exemption: the guard's own source and fixtures spell the stem. Both are outside the scanned trees as well. */
const SELF_PATHS = [SELF, 'scripts/fixtures/assert-no-preregister.'];
/** Structural, not an exemption: the guard's script name, as a file name or as a package script key. */
const SELF_NAME = /assert[-:]no-preregister/g;

/** The rule. */
const STEM = /[Pp]reregist|PREREGIST/;
/** A finding's text: the run of name characters around one occurrence of the stem. */
const FINDING_TEXT = /[\w$./+-]*(?:[Pp]reregist|PREREGIST)[\w$./+-]*/g;

const inScope = (file) =>
  SCANNED_TREES.some((tree) => file.startsWith(tree)) && !SELF_PATHS.some((p) => file.startsWith(p));

/** Blank out the guard's own name, keeping every column where it was. */
function mask(text) {
  return text.replace(SELF_NAME, (m) => ' '.repeat(m.length));
}

/** The matched texts of one content line of a file at `file`. */
function lineFindings(line, file) {
  if (!inScope(file)) return [];
  const masked = mask(line);
  if (!STEM.test(masked)) return [];
  return masked.match(FINDING_TEXT) ?? [];
}

/** The segments of a tracked path that hold the stem. */
function pathFindings(file) {
  if (!inScope(file)) return [];
  return mask(file)
    .split('/')
    .filter((segment) => STEM.test(segment));
}

function fail(message) {
  console.error(`${SELF}: ${message}`);
  console.error(`usage: node ${SELF} [--report | --self-test]`);
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

if (selfTest) {
  runSelfTest();
} else {
  scan();
}

// ── Self-test: the fixture against its committed findings ──
function runSelfTest() {
  const lines = readFileSync(FIXTURE_INPUT, 'utf8').split('\n');
  const observed = [];
  let asPath = FIXTURE_INPUT;
  lines.forEach((line, i) => {
    const as = /^\/\/ @as (\S+)\s*$/.exec(line);
    if (as) {
      asPath = as[1];
      return;
    }
    const judged = /^\/\/ @path (\S+)\s*$/.exec(line);
    if (judged) {
      for (const segment of pathFindings(judged[1])) observed.push(`${judged[1]}: path segment ${segment}`);
      return;
    }
    for (const text of lineFindings(line, asPath)) observed.push(`${FIXTURE_INPUT}:${i + 1}: ${text}`);
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
    `No-preregister guard — self-test ${ok ? 'passed' : 'FAILED'}: ${observed.length} finding(s) on the fixture, ${expected.length} expected.`
  );
  process.exitCode = ok ? 0 : 1;
}

// ── The scan ──
// The exit status is set rather than forced: writes to a pipe are asynchronous, and an immediate exit would drop findings that are still queued.
function scan() {
  // A check that cannot list the tracked files refuses: `execFileSync` throws, and the uncaught error exits non-zero.
  const files = execFileSync('git', ['ls-files', '-z', '--', ...SCANNED_TREES], {
    encoding: 'utf8',
    maxBuffer: 1 << 28
  })
    .split('\0')
    .filter(Boolean);

  let findings = 0;
  let scanned = 0;
  for (const file of files) {
    if (!inScope(file)) continue;
    scanned += 1;
    for (const segment of pathFindings(file)) {
      console.log(`${file}: path segment ${segment}`);
      findings += 1;
    }
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => {
      for (const found of lineFindings(line, file)) {
        console.log(`${file}:${i + 1}: ${found}`);
        findings += 1;
      }
    });
  }

  console.error(
    `No-preregister guard — ${scanned} tracked file(s) under apps/, packages/ and tests/ scanned; ${findings} finding(s).`
  );
  process.exitCode = findings > 0 && !report ? 1 : 0;
}
