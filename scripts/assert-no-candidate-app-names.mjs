#!/usr/bin/env node

/**
 * NO-CANDIDATE-APP-NAMES GUARD.
 *
 * What it forbids: the generic names that say WHICH APP by spelling it `candidate`, the forms a contributor might still reach for. The app for candidates and organizations is the Contestant app, and its identifiers, contexts, route trees, the `AppType` value and the prose phrase are spelled `contestant`. A name that says which ENTITY TYPE is not this guard's business and is never reported: the `candidates` table, `ENTITY_TYPE.Candidate`, `CandidateCard`, the voter results route's entity segment, the `'candidate'` member of `UserRole`.
 *
 * Paths are scanned as well as contents, so a file left under an old name is a finding even when nothing refers to it. The file set is `git ls-files`, so an untracked file is never a finding.
 *
 * THREE pattern groups, selected with `--only`:
 *   symbols — `CandidateApp` and `candidateApp`, `CandidateContext` and `candidateContext`, and the `AppType` value `'candidate'`.
 *   urls    — the page route tree `routes/candidate` and the API route tree `api/candidate`.
 *   prose   — the spaced phrase. It carries two path scopes: it is not matched under `apps/frontend/messages/` (message values are user-facing text) nor under a `publishers-guide` directory (that guide's naming of the app is not decided by this guard).
 *
 * EXEMPTIONS: exactly one entry, masked before matching rather than skipped by path, so an app-level name planted beside it is still reported. It is the three names the app shows for itself, and only where one of them is a whole quoted string. See `EXEMPT`.
 *
 * NOT SCANNED, and none of it an exemption of a name: `.planning/` (the planning record); `.yarn/` (the vendored package-manager release, third-party code). Structural self-exclusion: the guard skips its own source and its own fixtures and masks its own script name wherever that name is cited, because a text guard cannot avoid spelling what it forbids.
 *
 * The self-test also runs in every gate and --report invocation, after the scan and before the verdict: no unit test runs this guard's fixture, and a guard whose fixture runs in no unit test runs it in its own gate. A gate whose self-test fails is not trusted.
 *
 * Usage:
 *   node scripts/assert-no-candidate-app-names.mjs                       # gate: exit 1 on any finding
 *   node scripts/assert-no-candidate-app-names.mjs --report              # print findings, exit 0
 *   node scripts/assert-no-candidate-app-names.mjs --only symbols,urls   # restrict to groups (with or without --report)
 *   node scripts/assert-no-candidate-app-names.mjs --self-test           # scan the fixture, compare with its .violations file
 *
 * Output: one finding per line on stdout, as `<path>:<line>: <pattern-name>` for contents or `<path>: path matches <pattern-name>` for a path. A tracked file whose contents cannot be read is named on stderr with its error code, except a tracked symbolic link to a directory and a tracked path deleted from the working tree, neither of which has contents. The closing summary line, which counts the unreadable files, and on a finding the line saying what to rename to, go to stderr, so stdout holds findings and nothing else.
 *
 * In the fixture a line `// @as <path>` makes the scanner treat the lines after it as if they sat in that path, which is how the path-scoped patterns are exercised.
 *
 * Exit codes:
 *   0 - no finding, no unreadable file and the self-test passed; or --report; or --self-test passed
 *   1 - at least one finding, a tracked file whose contents could not be read, or a failed self-test (gate mode); or --self-test found a difference
 *   2 - usage error
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareWithExpected, fixtureLines, scanLines, trackedFiles } from './lib/text-guard.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-no-candidate-app-names.mjs';
const GUARD_NAME = 'No-candidate-app-names guard';
const FIXTURE_INPUT = 'scripts/fixtures/assert-no-candidate-app-names.input.ts';
const FIXTURE_EXPECTED = 'scripts/fixtures/assert-no-candidate-app-names.expected.ts.violations';

/** Structural, not an exemption: the guard's own source and fixtures spell every forbidden name. */
const SELF_PATHS = [SELF, 'scripts/fixtures/assert-no-candidate-app-names.'];
/** Structural, not an exemption: the guard's script name, as a file name or as a package script key. */
const SELF_NAME = /assert[-:]no-candidate-app-names/g;
const SKIP = (file) =>
  file.startsWith('.planning/') || file.startsWith('.yarn/') || SELF_PATHS.some((p) => file.startsWith(p));

/** The exemption list. Exactly one entry; it is masked before matching. */
const EXEMPT = [
  /(?<=['"])(?:Candidate app|Party app|Candidate and party app)(?=['"])/g // the three shown names of the app, as whole quoted strings — see phase 171
];

const NOT_MESSAGES = (file) => !file.startsWith('apps/frontend/messages/');
const NOT_PUBLISHERS_GUIDE = (file) => !file.includes('/publishers-guide/');

const GROUPS = ['symbols', 'urls', 'prose'];

/** What a failing run tells the reader to do instead. */
const REMEDY = `${GUARD_NAME} — the app is the Contestant app: rename to contestant; a name for the candidate entity type is not reported, see the docblock.`;

/** Each pattern: its group, the name a finding prints, the expression, and an optional path scope. */
const PATTERNS = [
  // ── symbols ──
  { group: 'symbols', name: 'CandidateApp', re: /CandidateApp/ },
  { group: 'symbols', name: 'candidateApp', re: /candidateApp/ },
  { group: 'symbols', name: 'CandidateContext', re: /CandidateContext/ },
  { group: 'symbols', name: 'candidateContext', re: /candidateContext/ },
  { group: 'symbols', name: "appType 'candidate'", re: /appType[^\n]{0,40}['"]candidate['"]/ },
  { group: 'symbols', name: "AppType union 'candidate'", re: /'admin' \| 'candidate' \| 'voter'/ },

  // ── urls ──
  { group: 'urls', name: 'api/candidate', re: /api\/candidate\b/ },
  { group: 'urls', name: 'routes/candidate', re: /routes\/candidate\b/ },

  // ── prose ──
  {
    group: 'prose',
    name: 'candidate app (phrase)',
    re: /\b[Cc]andidate [Aa]pp(?:lication)?s?(?![A-Za-z])/,
    only: (file) => NOT_MESSAGES(file) && NOT_PUBLISHERS_GUIDE(file)
  }
];

/** Every pattern above contains this spelling, so a line without it cannot match. */
const ANY_FORM = /cand/i;

function fail(message) {
  console.error(`${SELF}: ${message}`);
  console.error(
    `usage: node ${SELF} [--report] [--only <group>[,<group>]] [--self-test]   (groups: ${GROUPS.join(', ')})`
  );
  process.exit(2);
}

// ── Arguments ──
const argv = process.argv.slice(2);
let report = false;
let selfTest = false;
let only = null;
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--report') report = true;
  else if (a === '--self-test') selfTest = true;
  else if (a === '--only') {
    const value = argv[(i += 1)];
    if (!value) fail('--only requires a group list');
    only = value.split(',');
    for (const g of only) if (!GROUPS.includes(g)) fail(`unknown group '${g}'`);
  } else fail(`unexpected argument '${a}'`);
}
if (selfTest && (report || only)) fail('--self-test takes no other flag');

process.chdir(REPO_ROOT);

// ── Self-test: the fixture against its committed findings ──
function runSelfTest() {
  const observed = [];
  for (const { line, lineNumber, asPath } of fixtureLines(FIXTURE_INPUT, /^\/\/ @as (\S+)\s*$/))
    for (const name of matchNames(line, asPath, PATTERNS)) observed.push(`${FIXTURE_INPUT}:${lineNumber}: ${name}`);
  return compareWithExpected(GUARD_NAME, observed, FIXTURE_EXPECTED);
}

if (selfTest) process.exitCode = runSelfTest() ? 0 : 1;
else scan();

// ── The scan ──
// The exit status is set rather than forced: writes to a pipe are asynchronous, and an immediate exit would drop findings that are still queued.
function scan() {
  const patterns = only ? PATTERNS.filter((p) => only.includes(p.group)) : PATTERNS;
  const groupOf = new Map(PATTERNS.map((p) => [p.name, p.group]));
  const files = trackedFiles({ skip: SKIP });

  const perGroup = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  let findings = 0;
  const emit = (line, name) => {
    console.log(line);
    findings += 1;
    perGroup[groupOf.get(name)] += 1;
  };

  for (const file of files)
    for (const name of matchNames(file, file, patterns)) emit(`${file}: path matches ${name}`, name);
  const { unreadable } = scanLines(
    files,
    (file, line, lineNumber) => {
      for (const name of matchNames(line, file, patterns)) emit(`${file}:${lineNumber}: ${name}`, name);
    },
    { label: SELF }
  );

  const groupSummary = (only ?? GROUPS).map((g) => `${g} ${perGroup[g]}`).join(', ');
  console.error(
    `${GUARD_NAME} — ${files.length} tracked file(s) scanned, ${unreadable} unreadable; ${findings} finding(s) (${groupSummary}).`
  );
  const selfTestPassed = runSelfTest();
  if (!selfTestPassed)
    console.error(
      `${SELF}: the self-test did not match its committed expectations (printed above), so the result over the tracked tree cannot be trusted.`
    );
  if (findings > 0) console.error(REMEDY);
  process.exitCode = (findings > 0 || unreadable > 0 || !selfTestPassed) && !report ? 1 : 0;
}

// ── Matching ──
/** The names of the selected patterns that match `text`, for a file at `file`. Used for paths and for content lines alike. */
function matchNames(text, file, patterns) {
  if (!ANY_FORM.test(text)) return [];
  const masked = mask(text);
  const names = [];
  for (const p of patterns) {
    if (p.only && !p.only(file)) continue;
    if (p.re.test(masked)) names.push(p.name);
  }
  return names;
}

/** Blank out the exempt names and the guard's own script name, keeping every column where it was. */
function mask(text) {
  let out = text;
  for (const re of [...EXEMPT, SELF_NAME]) out = out.replace(re, (m) => ' '.repeat(m.length));
  return out;
}
