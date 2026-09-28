// Phase 86 Plan 04 Task 2 — ad-hoc SHA-256 identity check for Phase 86 runs.
//
// Mirrors `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/sha-identity.mjs`
// verbatim (same `loadRun` + `categorizeStatus` + `flattenReport` + `hashRun`) but compares
// run-2.json + run-3.json directly per operator instruction (run-1 was operator-acknowledged
// mistake — invalid baseline). Verdict applies the "if the last two are identical, mark it pass"
// shortcut the operator authorized.

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
const [r1, r2, r3] = runs;

const all3Match = r1.sha === r2.sha && r2.sha === r3.sha;
const last2Match = r2.sha === r3.sha;

// Operator authorized: "I made a mistake with the 1st one so if the last two are identical, we can mark it a pass."
const verdict = all3Match
  ? 'PASS (strict — all 3 runs identical)'
  : last2Match
  ? 'PASS (operator-approved — run-1 invalid baseline per operator note; run-2 ≡ run-3 SHA-identical)'
  : 'FAIL (runs 2 + 3 diverge — operator should investigate)';

const out = [
  `Phase 86 Plan 04 Task 2 — 3-run SHA-256 identity check.`,
  ``,
  `Format: sha256(sorted("<projectName> :: <specFile> > <specTitle>|<status>")).`,
  `Status normalisation: regen-constants.mjs categorizeStatus → {pass, cascade, fail}.`,
  ``,
  `${r1.path.split('/').pop()}: ${r1.sha}  (${r1.count} entries)  [OPERATOR FLAGGED INVALID — mistake during execution]`,
  `${r2.path.split('/').pop()}: ${r2.sha}  (${r2.count} entries)`,
  `${r3.path.split('/').pop()}: ${r3.sha}  (${r3.count} entries)`,
  ``,
  `Verdict: ${verdict}`,
  all3Match
    ? `All 3 hashes identical — strict D-08 identity gate PASSED.`
    : last2Match
    ? `Run-1 invalidated by operator. Runs 2 + 3 hashes identical — gate PASSED per operator authorization. Phase 86 anchor = run-3 SHA (canonical regen source).`
    : `Runs 2 + 3 hashes differ — D-09 instability protocol triggers.`
].join('\n');

writeFileSync(join(__dirname, 'sha256.txt'), out + '\n');
console.log(out);

if (!all3Match && !last2Match) {
  const b = new Set(r2.lines);
  const c = new Set(r3.lines);
  const onlyB = [...b].filter((x) => !c.has(x)).sort();
  const onlyC = [...c].filter((x) => !b.has(x)).sort();
  console.log('\n--- diff run-2 vs run-3 ---');
  for (const l of onlyB) console.log(`-2 ${l}`);
  for (const l of onlyC) console.log(`+3 ${l}`);
  process.exit(1);
}

process.exit(0);
