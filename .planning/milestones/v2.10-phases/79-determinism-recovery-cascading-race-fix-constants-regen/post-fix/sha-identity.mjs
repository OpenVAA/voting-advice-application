// Phase 79 Plan 03 Task 5 — SHA-256 identity check across run-{1,2,3}.json.
//
// Per D-08: sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>\n"))
// per run; all 3 hashes MUST match for regen to proceed (D-09 instability protocol
// triggers otherwise). Status is normalised via the same categorizeStatus() rules
// the archived regen-constants.mjs uses (pass / cascade / fail), so timing-only
// jitter does not break the gate.
//
// Output: writes post-fix/sha256.txt with all 3 hashes + verdict (PASS / FAIL).

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadRun(path) {
  const _raw = readFileSync(path, 'utf8');
  const _braceIdx = _raw.indexOf('\n{');
  return JSON.parse(_braceIdx === -1 ? _raw : _raw.slice(_braceIdx + 1));
}

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
          out.push(`${id}|${status}`);
        }
      }
      walk(suite.suites);
    }
  };
  walk(rep.suites);
  return out;
}

function hashRun(path) {
  const rep = loadRun(path);
  const lines = flattenReport(rep);
  lines.sort();
  const body = lines.join('\n') + '\n';
  const sha = createHash('sha256').update(body).digest('hex');
  return { path, count: lines.length, sha, lines };
}

const runs = ['run-1.json', 'run-2.json', 'run-3.json'].map((f) => hashRun(join(__dirname, f)));

const allMatch = runs[0].sha === runs[1].sha && runs[1].sha === runs[2].sha;
const verdict = allMatch ? 'PASS' : 'FAIL';

const out = [
  `Phase 79 Plan 03 Task 5 — 3-run SHA-256 identity check (D-08).`,
  ``,
  `Format: sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>")).`,
  `Status normalisation: regen-constants.mjs categorizeStatus → {pass, cascade, fail}.`,
  ``,
  ...runs.map((r) => `${r.path}: ${r.sha}  (${r.count} entries)`),
  ``,
  `Verdict: ${verdict}`,
  allMatch ? `All 3 hashes identical — D-08 strict identity gate PASSED. Regen allowed.` : `Hashes differ — D-09 instability protocol triggers (add 3 fresh cold-start runs).`
].join('\n');

writeFileSync(join(__dirname, 'sha256.txt'), out + '\n');

console.log(out);

// Diff summary if FAIL: print which lines differ between run-1 and run-2 / run-2 and run-3
if (!allMatch) {
  const a = new Set(runs[0].lines);
  const b = new Set(runs[1].lines);
  const c = new Set(runs[2].lines);
  const onlyA = [...a].filter((x) => !b.has(x)).sort();
  const onlyB = [...b].filter((x) => !a.has(x)).sort();
  const onlyB2 = [...b].filter((x) => !c.has(x)).sort();
  const onlyC = [...c].filter((x) => !b.has(x)).sort();
  console.log('\n--- diff run-1 vs run-2 ---');
  for (const l of onlyA) console.log(`-1 ${l}`);
  for (const l of onlyB) console.log(`+2 ${l}`);
  console.log('\n--- diff run-2 vs run-3 ---');
  for (const l of onlyB2) console.log(`-2 ${l}`);
  for (const l of onlyC) console.log(`+3 ${l}`);
  process.exit(1);
}

process.exit(0);
