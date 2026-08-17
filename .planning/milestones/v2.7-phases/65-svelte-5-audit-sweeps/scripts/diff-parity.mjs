#!/usr/bin/env node
// Phase 65 inline parity diff — reads two playwright-report.json files, counts
// tests by status, and exits 0 if counts match the v2.6 contract within ±1.
// Reusable for v2.7+ parity gates. Anchored on Phase 64's flattenReport pattern
// (regen-constants.mjs:26-50) and Phase 64's PASS verdict in diff.md
// ("Baseline: 67p / 1f / 34c, Post: 67p / 1f / 34c, PARITY GATE: PASS").

import { readFileSync } from 'node:fs';

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
          let status = raw === 'passed' ? 'pass'
            : raw === 'skipped' ? 'cascade'
            : /did not run|setup.*failed|dependency.*failed/i.test(err) ? 'cascade'
            : 'fail';
          out.push({ id, status });
        }
      }
      walk(suite.suites);
    }
  };
  walk(rep.suites);
  return out;
}

function counts(tests) {
  const c = { pass: 0, fail: 0, cascade: 0 };
  for (const t of tests) c[t.status]++;
  return c;
}

const [baselinePath, postPath] = process.argv.slice(2);
if (!baselinePath || !postPath) {
  console.error('Usage: diff-parity.mjs <baseline.json> <post.json>');
  process.exit(2);
}

const baseline = flattenReport(JSON.parse(readFileSync(baselinePath, 'utf8')));
const post = flattenReport(JSON.parse(readFileSync(postPath, 'utf8')));
const b = counts(baseline);
const p = counts(post);

console.log(`Baseline: ${b.pass}p / ${b.fail}f / ${b.cascade}c`);
console.log(`Post:     ${p.pass}p / ${p.fail}f / ${p.cascade}c`);

// Pass IDs for newly-failing detection (regressed pass → fail).
const basePassIds = new Set(baseline.filter((t) => t.status === 'pass').map((t) => t.id));
const postFailIds = new Set(post.filter((t) => t.status === 'fail').map((t) => t.id));
const newlyFailing = [...postFailIds].filter((id) => basePassIds.has(id));

// Phase 65 doesn't change tests, so any total-count drift > 1 is a regression
// signal; passing tests that flipped to fail are an immediate hard fail.
const passDelta = Math.abs(b.pass - p.pass);
const failDelta = Math.abs(b.fail - p.fail);

if (newlyFailing.length > 0) {
  console.error('REGRESSION: tests that passed in baseline now fail in post:');
  for (const id of newlyFailing) console.error('  - ' + id);
  console.error('PARITY GATE: FAIL');
  process.exit(1);
}
if (passDelta > 1 || failDelta > 1) {
  console.error(`REGRESSION: count drift exceeds ±1 (passΔ=${passDelta}, failΔ=${failDelta})`);
  console.error('PARITY GATE: FAIL');
  process.exit(1);
}
console.log('PARITY GATE: PASS');
process.exit(0);
