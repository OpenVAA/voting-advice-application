#!/usr/bin/env node
// Phase 86.2 Plan 03 — cold-start verdict parser
// Reads 86.2-03-cold-start.json (Playwright JSON reporter output) and emits:
//   - Total / PASS / FAIL / CASCADE / DID_NOT_RUN / SKIPPED counts
//   - Per-FAIL list with spec + title + first error line + classification
//   - Per-CASCADE list with upstream-failure trace (best-effort)
//   - Verdict line: MATCHES_BASELINE | GAP_DETECTED

import fs from 'node:fs';
import path from 'node:path';

const REPORT = process.argv[2] || '.planning/phases/86.2-e2e-suite-refactor-pass-extract-helpers-dedup-assertions-pro/post-fix/86.2-03-cold-start.json';

const _raw = fs.readFileSync(REPORT, 'utf8');
// Strip leading non-JSON header line if present (yarn output)
const _braceIdx = _raw.indexOf('\n{');
const json = _braceIdx >= 0 ? _raw.slice(_braceIdx + 1) : _raw;
let rep;
try {
  rep = JSON.parse(json);
} catch (e) {
  // try second strategy — find first { and parse from there
  const first = json.indexOf('{');
  rep = JSON.parse(json.slice(first));
}

const failed = [];
const passed = [];
const cascade = [];
const skipped = [];
const did_not_run = [];

function categorize(testOrResult, projectName, specFile, title) {
  // Per-test in Playwright JSON has `results[]`; aggregate by latest result.
  const status = testOrResult.status || testOrResult.outcome;
  const expected = testOrResult.expectedStatus;
  // Playwright surface:
  //   "passed" — pass
  //   "failed" / "timedOut" — fail
  //   "skipped" — could be cascade (dependency failed) or genuine test.skip
  //   "interrupted" / "didNotRun" — cascade/did-not-run
  return { status, expected };
}

function walkSuites(suites, projectName, parents = []) {
  for (const s of suites || []) {
    const newParents = [...parents, s.title].filter(Boolean);
    if (s.suites && s.suites.length) {
      walkSuites(s.suites, projectName, newParents);
    }
    for (const spec of s.specs || []) {
      const specFile = s.file || spec.file || '';
      for (const t of spec.tests || []) {
        const proj = t.projectName || projectName;
        const title = newParents.concat(spec.title).filter(Boolean).join(' > ');
        // Latest result is last
        const last = (t.results || []).slice(-1)[0] || {};
        const status = last.status || t.status || 'unknown';
        const expected = t.expectedStatus || 'passed';
        const errors = (last.errors || []).map(e => (e.message || '').split('\n')[0]).filter(Boolean);
        const errorMsg = errors[0] || (last.error?.message || '').split('\n')[0] || '';
        const entry = { project: proj, spec: specFile, title, status, expected, error: errorMsg };
        if (status === 'passed') passed.push(entry);
        else if (status === 'failed' || status === 'timedOut') failed.push(entry);
        else if (status === 'skipped') {
          // distinguish cascade vs genuine skip via error message
          if (/did not run|setup.*failed|dependency.*failed|interrupted/i.test(errorMsg)) {
            cascade.push(entry);
          } else if (expected === 'skipped') {
            skipped.push(entry);
          } else {
            cascade.push(entry);
          }
        } else if (status === 'interrupted') cascade.push(entry);
        else did_not_run.push(entry);
      }
    }
  }
}

walkSuites(rep.suites, '');

const total = passed.length + failed.length + cascade.length + skipped.length + did_not_run.length;

console.log('## Phase 86.2 Plan 03 — Cold-Start Gate Verdict\n');
console.log(`Total: ${total}`);
console.log(`PASS: ${passed.length}`);
console.log(`FAIL: ${failed.length}`);
console.log(`CASCADE: ${cascade.length}`);
console.log(`DID_NOT_RUN: ${did_not_run.length}`);
console.log(`SKIPPED: ${skipped.length}`);
console.log('');

// Classification per FAIL
function classify(fail) {
  const t = `${fail.spec} ${fail.title}`;
  if (/candidate-profile\.spec\.ts/.test(fail.spec) && /CAND-03|profile image/i.test(fail.title)) {
    return 'PRE-EXISTING (Phase 83 DETERM-06)';
  }
  return 'OTHER (investigate)';
}

if (failed.length) {
  console.log('## FAILS\n');
  for (const f of failed) {
    console.log(`- [${classify(f)}] ${f.project} :: ${f.spec} > ${f.title}`);
    if (f.error) console.log(`  error: ${f.error.slice(0, 200)}`);
  }
  console.log('');
}

if (cascade.length) {
  console.log('## CASCADES (sample of first 20)\n');
  for (const c of cascade.slice(0, 20)) {
    console.log(`- ${c.project} :: ${c.spec} > ${c.title}`);
    if (c.error) console.log(`  error: ${c.error.slice(0, 180)}`);
  }
  if (cascade.length > 20) console.log(`... and ${cascade.length - 20} more`);
  console.log('');
}

if (skipped.length) {
  console.log('## SKIPPED (intentional)\n');
  for (const s of skipped) {
    console.log(`- ${s.project} :: ${s.spec} > ${s.title}`);
  }
  console.log('');
}

if (did_not_run.length) {
  console.log('## DID_NOT_RUN\n');
  for (const d of did_not_run) {
    console.log(`- ${d.project} :: ${d.spec} > ${d.title} (status=${d.status})`);
  }
  console.log('');
}

// Verdict
// Operator directive baseline: 0 FAIL / 0 CASCADE / 8 SKIPPED
const baseline = { fail: 0, cascade: 0, skipped: 8 };
const matches = failed.length === baseline.fail
             && cascade.length === baseline.cascade
             && skipped.length === baseline.skipped
             && did_not_run.length === 0;

console.log(`## Verdict: ${matches ? 'MATCHES_BASELINE' : 'GAP_DETECTED'}\n`);
if (!matches) {
  console.log(`Baseline target: 0 FAIL / 0 CASCADE / 8 SKIPPED / 0 DNR`);
  console.log(`Actual:          ${failed.length} FAIL / ${cascade.length} CASCADE / ${skipped.length} SKIPPED / ${did_not_run.length} DNR`);
}
