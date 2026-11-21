#!/usr/bin/env node

/**
 * NO-CANDIDATE-APP-NAMES GUARD.
 *
 * What it forbids: every name that says WHICH APP by spelling it `candidate`. The app for candidates and organizations is the Contestant app, and its identifiers, contexts, route constants, URLs, message namespaces, settings keys, test names and the prose phrase are all spelled `contestant`. A name that says which ENTITY TYPE is not this guard's business and is never reported: the `candidates` table, `ENTITY_TYPE.Candidate`, `CandidateCard`, the voter results route's entity segment, the `'candidate'` member of `UserRole`.
 *
 * Paths are scanned as well as contents, so a file left under an old name is a finding even when nothing refers to it. The file set is `git ls-files`, so an untracked file is never a finding.
 *
 * FOUR pattern groups, selected with `--only`:
 *   symbols — identifiers, the alias, the three library directories, settings and customization keys, message namespaces, the `AppType` value, and the one name that must never appear (an app-named key for a neutral auth endpoint).
 *   urls    — the page and API route trees, URL literals in their three spellings (leading slash, slashless, percent-encoded), paths assembled from segments, the default login poster.
 *   tests   — test directories, spec and fixture names, Playwright project names, the session tag, test ids, page-object and helper identifiers.
 *   prose   — the hyphenated compound and the spaced phrase. The spaced phrase carries two path scopes: it is not matched under `apps/frontend/messages/` (message values are user-facing text) nor under a `publishers-guide` directory (that guide's naming of the app is not decided by this guard).
 *
 * EXEMPTIONS: exactly one entry, masked before matching rather than skipped by path, so an app-level name planted beside it is still reported. It is the three names the app shows for itself, and only where one of them is a whole quoted string. See `EXEMPT`.
 *
 * AN ENTITY TYPE MAY FOLLOW THE APP'S OWN PREFIX: `/contestant/candidate/<id>/…` is the route of one candidate inside the Contestant app, so `contestant` is one of the words after which `/candidate` is an entity-typed form and is not reported.
 *
 * NOT SCANNED, and none of it an exemption of a name: `.planning/` (the planning record); `.yarn/` (the vendored package-manager release, third-party code). Structural self-exclusion: the guard skips its own source and its own fixtures and masks its own script name wherever that name is cited, because a text guard cannot avoid spelling what it forbids.
 *
 * Usage:
 *   node scripts/assert-no-candidate-app-names.mjs                       # gate: exit 1 on any finding
 *   node scripts/assert-no-candidate-app-names.mjs --report              # print findings, exit 0
 *   node scripts/assert-no-candidate-app-names.mjs --only symbols,urls   # restrict to groups (with or without --report)
 *   node scripts/assert-no-candidate-app-names.mjs --self-test           # scan the fixture, compare with its .violations file
 *
 * Output: one finding per line on stdout, as `<path>:<line>: <pattern-name>` for contents or `<path>: path matches <pattern-name>` for a path. A tracked file whose contents cannot be read is named on stderr with its error code, except a tracked symbolic link to a directory, which has no contents of its own. The closing summary line, which counts the unreadable files, goes to stderr, so stdout holds findings and nothing else.
 *
 * In the fixture a line `// @as <path>` makes the scanner treat the lines after it as if they sat in that path, which is how the path-scoped patterns are exercised.
 *
 * Exit codes:
 *   0 - no finding; or --report; or --self-test passed
 *   1 - at least one finding, or a tracked file whose contents could not be read (gate mode); or --self-test found a difference
 *   2 - usage error
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF = 'scripts/assert-no-candidate-app-names.mjs';
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
const ONLY_ROUTE_TS = (file) => file === 'apps/frontend/src/lib/routes/route.ts';
const ONLY_APP_GATES_TS = (file) => file === 'apps/frontend/src/lib/routes/appGates.ts';

const GROUPS = ['symbols', 'urls', 'tests', 'prose'];

/** Each pattern: its group, the name a finding prints, the expression, and an optional path scope. */
const PATTERNS = [
  // ── symbols ──
  { group: 'symbols', name: 'CandApp', re: /CandApp(?!Auth(?:Callback|Logout))/ },
  { group: 'symbols', name: 'CandidateApp', re: /CandidateApp/ },
  { group: 'symbols', name: 'candidateApp', re: /candidateApp/ },
  { group: 'symbols', name: 'candPoster', re: /candPoster/ },
  { group: 'symbols', name: 'CandidateUserData', re: /CandidateUserData/ },
  { group: 'symbols', name: 'candidateUserData', re: /candidateUserData/ },
  { group: 'symbols', name: 'CandidateContext', re: /CandidateContext/ },
  { group: 'symbols', name: 'candidateContext', re: /candidateContext/ },
  { group: 'symbols', name: 'candCtx', re: /\bcand(?:idate)?Ctx\b/ },
  { group: 'symbols', name: 'CandidateNav', re: /CandidateNav/ },
  { group: 'symbols', name: 'isCandidateRoute', re: /isCandidateRoute/ },
  { group: 'symbols', name: 'CANDIDATE_PROT|GATE', re: /CANDIDATE_(?:PROT|GATE)\b/ },
  { group: 'symbols', name: 'CANDIDATE (route.ts)', re: /\bCANDIDATE\b/, only: ONLY_ROUTE_TS },
  { group: 'symbols', name: '$candidate', re: /\$candidate\b/ },
  { group: 'symbols', name: '(lib|contexts|navigation)/candidate', re: /(?:lib|contexts|navigation)\/candidate\b/ },
  { group: 'symbols', name: 'Candidate(Login|Preregistration)Error', re: /Candidate(?:Login|Preregistration)Error/ },
  {
    group: 'symbols',
    name: 'CANDIDATE_(LOGIN|PREREGISTRATION)_ERROR',
    re: /CANDIDATE_(?:LOGIN|PREREGISTRATION)_ERROR/
  },
  { group: 'symbols', name: 'perm-disable-candidate-app', re: /perm-disable-candidate-app/ },
  { group: 'symbols', name: 'candidate-app-menu', re: /candidate-app-menu/ },
  {
    group: 'symbols',
    name: "name: 'Candidate App' (appGates.ts)",
    re: /name: 'Candidate App'/,
    only: ONLY_APP_GATES_TS
  },
  { group: 'symbols', name: "appType 'candidate'", re: /appType[^\n]{0,40}['"]candidate['"]/ },
  { group: 'symbols', name: "AppType union 'candidate'", re: /'admin' \| 'candidate' \| 'voter'/ },
  { group: 'symbols', name: 'ContestantAppAuth (must never exist)', re: /ContestantAppAuth/ },

  // ── urls ──
  { group: 'urls', name: 'api/candidate', re: /api\/candidate\b/ },
  { group: 'urls', name: 'CandAppAuth', re: /CandAppAuth(?:Callback|Logout)/ },
  { group: 'urls', name: 'routes/candidate', re: /routes\/candidate\b/ },
  {
    group: 'urls',
    name: '/candidate URL',
    re: /(?<!candidates|organizations|alliances|variants|[Vv]oter|party|user|proj|entity|faction|results|candidate|contestant|fixtures|setup|specs|generated)\/candidate(?![\w.-]| lookup failed|\/i\b)/,
    only: NOT_MESSAGES
  },
  {
    group: 'urls',
    name: 'candidate/ URL (slashless)',
    re: /(?<![\w\/.-])candidate\/(?!(?:party|faction|organization|question|voter|candidate)\b)(?=[a-z(])/,
    only: NOT_MESSAGES
  },
  { group: 'urls', name: 'candidate%2F URL (percent-encoded)', re: /(?<![\w\/.-])candidate%2[Ff]/, only: NOT_MESSAGES },
  { group: 'urls', name: 'hero-candidate', re: /hero-candidate/ },
  { group: 'urls', name: "join(… 'candidate' …)", re: /join\([^\n]*['"]candidate['"]/ },
  { group: 'urls', name: "relative import '../candidate'", re: /['"]\.{1,2}\/candidate['"\/]/ },
  { group: 'urls', name: 'candidate-portal', re: /candidate-portal/ },

  // ── tests ──
  { group: 'tests', name: '(fixtures|setup|specs)/candidate', re: /(?:fixtures|setup|specs)\/candidate\b/ },
  { group: 'tests', name: 'candidate-bank-auth', re: /candidate-bank-auth/ },
  { group: 'tests', name: 'cold-entry-dataroot-candidate', re: /cold-entry-dataroot-candidate/ },
  { group: 'tests', name: 'candidate-journey', re: /candidate-journey/ },
  { group: 'tests', name: 'candidate-a11y', re: /candidate-a11y/ },
  { group: 'tests', name: 'candidateJourneyConstants', re: /candidateJourneyConstants/ },
  { group: 'tests', name: 'cand-session', re: /cand-session/ },
  { group: 'tests', name: 'candidate-preview', re: /candidate-preview/ },
  {
    group: 'tests',
    name: 'candidate-<stem> test id',
    re: /(?<![\w-])candidate-(?:answers|help|home|nav|preview|privacy|profile|questions)\b/
  },
  { group: 'tests', name: 'testIds.candidate', re: /testIds\.candidate\b/ },
  {
    group: 'tests',
    name: 'Candidate<Name>Page',
    re: /[Cc]andidate(?:Login|Home|Profile|Preview|Question|QuestionsOverview|TermsOfUse|ForgotPassword|Preregister)Page/
  },
  { group: 'tests', name: 'Candidate(LogoutButton|PasswordSetter)', re: /[Cc]andidate(?:LogoutButton|PasswordSetter)/ },
  { group: 'tests', name: 'CandidateJourney', re: /CandidateJourney/ },
  { group: 'tests', name: 'candidateTest', re: /\bcandidateTest\b/ },
  { group: 'tests', name: 'candidateSession', re: /[Cc]andidateSession/ },
  {
    group: 'tests',
    name: 'CANDIDATE_<test constant>',
    re: /CANDIDATE_(?:APP_URL|LOGIN_URL|AXE_ROUTES|A11Y_SPEC|NAV_LOGGED_(?:IN|OUT)|SIBLING_PREFIX_ROUTE_IDS)/
  },
  { group: 'tests', name: 'CandidateAxeRoute', re: /CandidateAxeRoute/ },
  { group: 'tests', name: 'candidateA11ySrc', re: /candidateA11ySrc/ },
  { group: 'tests', name: 'assertCandidate(Reach|AuthNavPresent)', re: /assertCandidate(?:Reach|AuthNavPresent)/ },
  { group: 'tests', name: 'candidateLoad', re: /\bcandidateLoad\b/ },
  { group: 'tests', name: 'candidateProjectMatch', re: /candidateProjectMatch/ },
  { group: 'tests', name: 'cand-nav-menu', re: /cand-nav-menu/ },
  { group: 'tests', name: 'notif-cand', re: /notif-cand/ },
  { group: 'tests', name: 'candidateHome', re: /[Cc]andidateHome/ },

  // ── prose ──
  { group: 'prose', name: 'candidate-app', re: /[Cc]andidate-app\b/ },
  {
    group: 'prose',
    name: 'candidate app (phrase)',
    re: /\b[Cc]andidate [Aa]pp(?:lication)?s?(?![A-Za-z])/,
    only: (file) => NOT_MESSAGES(file) && NOT_PUBLISHERS_GUIDE(file)
  }
];

/** Every pattern below contains one of these two spellings, so a line without either cannot match. */
const ANY_FORM = /cand|ContestantAppAuth/i;

/** Blank out the exempt names and the guard's own script name, keeping every column where it was. */
function mask(text) {
  let out = text;
  for (const re of [...EXEMPT, SELF_NAME]) out = out.replace(re, (m) => ' '.repeat(m.length));
  return out;
}

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
if (selfTest) {
  const lines = readFileSync(FIXTURE_INPUT, 'utf8').split('\n');
  const observed = [];
  let asPath = FIXTURE_INPUT;
  lines.forEach((line, i) => {
    const directive = /^\/\/ @as (\S+)\s*$/.exec(line);
    if (directive) {
      asPath = directive[1];
      return;
    }
    for (const name of matchNames(line, asPath, PATTERNS)) observed.push(`${FIXTURE_INPUT}:${i + 1}: ${name}`);
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
    `No-candidate-app-names guard — self-test ${ok ? 'passed' : 'FAILED'}: ${observed.length} finding(s) on the fixture, ${expected.length} expected.`
  );
  process.exitCode = ok ? 0 : 1;
} else {
  scan();
}

// ── The scan ──
// The exit status is set rather than forced: writes to a pipe are asynchronous, and an immediate exit would drop findings that are still queued.
function scan() {
  const patterns = only ? PATTERNS.filter((p) => only.includes(p.group)) : PATTERNS;
  const groupOf = new Map(PATTERNS.map((p) => [p.name, p.group]));
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter(Boolean);

  const perGroup = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  let findings = 0;
  let scanned = 0;
  let unreadable = 0;
  const emit = (line, name) => {
    console.log(line);
    findings += 1;
    perGroup[groupOf.get(name)] += 1;
  };

  for (const file of files) {
    if (SKIP(file)) continue;
    scanned += 1;
    for (const name of matchNames(file, file, patterns)) emit(`${file}: path matches ${name}`, name);
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch (e) {
      // A tracked symbolic link to a directory has no contents of its own; any other unreadable file is a file whose names were never seen.
      if (e?.code !== 'EISDIR') {
        console.error(`${SELF}: cannot read ${file}: ${e?.code ?? 'unknown error'}`);
        unreadable += 1;
      }
      continue;
    }
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => {
      for (const name of matchNames(line, file, patterns)) emit(`${file}:${i + 1}: ${name}`, name);
    });
  }

  const groupSummary = (only ?? GROUPS).map((g) => `${g} ${perGroup[g]}`).join(', ');
  console.error(
    `No-candidate-app-names guard — ${scanned} tracked file(s) scanned, ${unreadable} unreadable; ${findings} finding(s) (${groupSummary}).`
  );
  process.exitCode = (findings > 0 || unreadable > 0) && !report ? 1 : 0;
}
