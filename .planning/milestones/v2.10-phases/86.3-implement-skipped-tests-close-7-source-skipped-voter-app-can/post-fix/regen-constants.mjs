// Phase 86.3-05 constants regen — verbatim fork of Phase 79's
// regen-constants.mjs (Phase 73 D-08 + D-09 + Pitfall 5 origin) adapted
// for Phase 86.3 anchor capture. `reportPath` points at Phase 86.3's
// post-fix run-N.json (canonical regen source).
//
// Source of the IMGPROXY_TIED_TITLES list: .planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md
// lines 11-32 (Phase 63 v2.6 baseline that enumerated the 14 imgproxy-tied
// tests; CONTEXT D-09 binds this list as the DATA_RACE classification target).

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Allow override via argv[2] for selecting run-1.json / run-2.json / run-3.json
// at script-invoke time. Default = run-3.json (matches Phase 85 / 86 precedent of
// run-3 canonical when 3-run gate is ALMOST-STRICT; for strict 3-run identity
// the choice of canonical run is the same hash so any works).
const argReport = process.argv[2];
const reportPath = argReport ? (argReport.startsWith('/') ? argReport : join(__dirname, argReport)) : join(__dirname, 'run-3.json');
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

const IMGPROXY_TIED_TITLES = [
  'should upload a profile image (CAND-03)',
  'should show editable info fields on profile page (CAND-03)',
  'should persist profile image after page reload (CAND-12)'
];
const isImgproxyTied = (id) => IMGPROXY_TIED_TITLES.some((t) => id.endsWith('> ' + t));

const titleMatchCounts = IMGPROXY_TIED_TITLES.map((t) => ({
  title: t,
  count: all.filter((x) => x.id.endsWith('> ' + t)).length
}));
const zeroMatches = titleMatchCounts.filter((x) => x.count === 0);
if (zeroMatches.length > 0) {
  console.error('ERROR: IMGPROXY_TIED_TITLES match-count assertion failed.');
  for (const z of zeroMatches) console.error('       - ' + z.title);
  process.exit(1);
}
console.error('IMGPROXY_TIED_TITLES match-count assertion: ' + titleMatchCounts.length + ' titles, ' + titleMatchCounts.reduce((s, x) => s + x.count, 0) + ' total matches.');

const passLocked = all.filter((t) => t.status === 'pass' && !isImgproxyTied(t.id)).map((t) => t.id).sort();
const dataRace = all.filter((t) => isImgproxyTied(t.id) || t.rawStatus === 'flaky').map((t) => t.id).sort();
const cascade = all.filter((t) => t.status === 'cascade' && !isImgproxyTied(t.id)).map((t) => t.id).sort();
const fail = all.filter((t) => t.status === 'fail' && !isImgproxyTied(t.id)).map((t) => t.id).sort();

const fmt = (xs) => xs.map((s) => `  '${s.replace(/'/g, "\\'")}'`).join(',\n');

const out = `
=== PASS_LOCKED_TESTS (${passLocked.length}) ===
${fmt(passLocked)}

=== DATA_RACE_TESTS (${dataRace.length}) ===
${fmt(dataRace)}

=== CASCADE_TESTS (${cascade.length}) ===
${fmt(cascade)}

=== FAIL_TESTS (${fail.length}) ===
${fmt(fail)}
`;

writeFileSync(join(__dirname, 'regen-output.txt'), out, 'utf8');
console.log(out);
