// Phase 73 D-08 + D-09 + Pitfall 5 constants regen — one-shot.
// Adapted from .planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs
// (the P64 source — `reportPath` adjusted to point at Phase 73's post-fix anchor capture).
//
// Reads the post-fix JSON (Phase 73 Plan 06 run-3-report.json), partitions tests into PASS_LOCKED /
// DATA_RACE / CASCADE per D-09 rules, emits the 3 arrays formatted for paste into
// tests/scripts/diff-playwright-reports.ts (lines ~53-138).
//
// Source of the IMGPROXY_TIED_TITLES list: .planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md
// lines 11-32 (Phase 63 v2.6 baseline that enumerated the 14 imgproxy-tied tests; CONTEXT D-09 binds
// this list as the DATA_RACE classification target). This list is structural — if any imgproxy-tied
// test is renamed upstream, the regen MUST fail loudly rather than silently miscount.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// __dirname is .planning/phases/73-determinism-baseline/post-fix/ — 3 levels up to repo root.
// Phase 79: D-09 instability protocol promoted run-6.json as the canonical
// regen source (runs 4/5/6 are SHA-identical; runs 1/3 had pre-existing
// voter-app flakes surfaced post-DETERM-04). See sha256.txt for the full audit.
const reportPath = join(__dirname, 'run-6.json');
// Strip optional dotenv banner line (Phase 73 captures via `yarn playwright …` write a
// `[dotenv@…] injecting env …` line ahead of the JSON; the P64 captures did not). Split
// on first '{' rather than first newline so the strip is robust to multi-line banners.
const _raw = readFileSync(reportPath, 'utf8');
const _braceIdx = _raw.indexOf('\n{');
const report = JSON.parse(_braceIdx === -1 ? _raw : _raw.slice(_braceIdx + 1));

function categorizeStatus(raw, err) {
  if (raw === 'passed') return 'pass';
  if (raw === 'skipped') return 'cascade';
  if (/did not run|setup.*failed|dependency.*failed/i.test(err)) return 'cascade';
  return 'fail';
}

function flattenReport(rep) {
  const out = [];
  const walk = (suites) => {
    if (!suites) return;
    for (const suite of suites) {
      const suiteFile = suite.file ?? suite.title ?? '';
      for (const spec of suite.specs ?? []) {
        const specFile = spec.file ?? suiteFile;
        const specTitle = spec.title ?? '';
        for (const t of spec.tests ?? []) {
          const projectName = t.projectName ?? '';
          const firstResult = t.results?.[0] ?? {};
          const raw = firstResult.status ?? t.status ?? 'unknown';
          const err = firstResult.error?.message ?? firstResult.errors?.[0]?.message ?? '';
          const id = `${projectName} :: ${specFile} > ${specTitle}`;
          const status = categorizeStatus(raw, err);
          out.push({ id, status, rawStatus: raw, errorMessage: err });
        }
      }
      walk(suite.suites);
    }
  };
  walk(rep.suites);
  return out;
}

const all = flattenReport(report);

// D-09 binding: imgproxy direct + 13 cascades → DATA_RACE_TESTS.
const IMGPROXY_TIED_TITLES = [
  'should upload a profile image (CAND-03)',
  'should show editable info fields on profile page (CAND-03)',
  'should persist profile image after page reload (CAND-12)',
  'should show read-only warning when answers are locked',
  'should show maintenance page when candidateApp is disabled',
  'should show maintenance page when underMaintenance is true',
  'should display notification popup when enabled',
  'should render help page correctly',
  'should render privacy page correctly',
  'should hide hero when hideHero is enabled',
  'should show hero when hideHero is disabled',
  'should change password and login with new password',
  'should logout and return to login page',
  're-authenticate as candidate'
];
const isImgproxyTied = (id) => IMGPROXY_TIED_TITLES.some((t) => id.endsWith('> ' + t));

// Acceptance gate (Phase 64 review feedback Warning 6): verify every IMGPROXY_TIED_TITLES entry
// matches at least one test in the new JSON.
const titleMatchCounts = IMGPROXY_TIED_TITLES.map((t) => ({
  title: t,
  count: all.filter((x) => x.id.endsWith('> ' + t)).length
}));
const zeroMatches = titleMatchCounts.filter((x) => x.count === 0);
if (zeroMatches.length > 0) {
  console.error('ERROR: IMGPROXY_TIED_TITLES match-count assertion failed.');
  console.error('       The following titles do NOT match any test in the new JSON.');
  console.error('       Source: .planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md lines 11-32 (binding per CONTEXT D-09).');
  console.error('       Either the upstream test was renamed (update the IMGPROXY_TIED_TITLES const) or removed (escalate — D-09 contract changed).');
  for (const z of zeroMatches) console.error('       - ' + z.title);
  process.exit(1);
}
console.error('IMGPROXY_TIED_TITLES match-count assertion: ' + titleMatchCounts.length + ' titles, ' + titleMatchCounts.reduce((s, x) => s + x.count, 0) + ' total matches.');

// Per CONTEXT D-09 binding: imgproxy-tied tests live exclusively in DATA_RACE,
// regardless of whether they passed or failed in the canonical capture (the pool
// is data-race-semantic — "may pass or fail post-swap"). So a passing imgproxy-tied
// test must NOT also appear in PASS_LOCKED — exclude imgproxy-tied from PASS_LOCKED
// to maintain the partition.
const passLocked = all.filter((t) => t.status === 'pass' && !isImgproxyTied(t.id)).map((t) => t.id).sort();
const dataRace = all.filter((t) => isImgproxyTied(t.id) || t.rawStatus === 'flaky').map((t) => t.id).sort();
const cascade = all.filter((t) => t.status === 'cascade' && !isImgproxyTied(t.id)).map((t) => t.id).sort();

const fmt = (xs) => xs.map((s) => `  '${s.replace(/'/g, "\\'")}'`).join(',\n');

const out = `
=== PASS_LOCKED_TESTS (${passLocked.length}) ===
${fmt(passLocked)}

=== DATA_RACE_TESTS (${dataRace.length}) ===
${fmt(dataRace)}

=== CASCADE_TESTS (${cascade.length}) ===
${fmt(cascade)}
`;

writeFileSync(join(__dirname, 'regen-output.txt'), out, 'utf8');
console.log(out);
