#!/usr/bin/env node

/**
 * DEPENDENCY-VULNERABILITY GATE.
 *
 * Runs `yarn npm audit` and fails on any advisory at or above the threshold that is not in the
 * accepted baseline, `security/audit-baseline.json`, where each accepted advisory carries its
 * severity, date and written rationale. Dependabot alerts never fail a build; this does.
 *
 *   - The threshold is read from the baseline, so the file that documents the gate and the value it
 *     runs at cannot disagree.
 *   - Accepted findings are subtracted by advisory id only, never by package name, so a future
 *     advisory against the same package is still reported.
 *   - The accepted set is printed beside the new set, so a red is diagnosable from the CI log.
 *   - An empty result is clean only when the audit exited 0: a network failure also prints nothing.
 *     `scripts/lib/audit-run.mjs` holds that classification for the gate and for `--update-baseline`.
 *
 * The audit's own suppression flag and `.yarnrc.yml` setting are not used: they carry bare ids with
 * no severity or rationale, and the setting would also filter every local audit. The audit's exit
 * code is not the verdict, because it is non-zero whenever anything at all is found.
 *
 * Usage:
 *   node scripts/assert-dependency-audit.mjs                     # the gate
 *   node scripts/assert-dependency-audit.mjs --update-baseline   # reviewed action, see below
 *
 * `--update-baseline` rewrites the baseline from the current findings with a fresh `recorded` date
 * and `recordedAtHead`, keeping the rationale of every advisory already listed. It is a reviewed
 * action, not a way to clear a red: new advisories get a `REVIEW REQUIRED` rationale, and
 * `packages/dev-seed/tests/auditBaselineShape.test.ts` fails while that marker is present.
 *
 * Exit codes:
 *   0 - no advisory at or above the threshold outside the accepted baseline
 *   1 - at least one new advisory at or above the threshold
 *   2 - the gate could not run: the baseline is missing or malformed, or the audit printed no
 *       findings and exited non-zero; in --update-baseline mode the baseline is left untouched
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyAuditRun } from './lib/audit-run.mjs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const HERE = dirname(fileURLToPath(import.meta.url));
/** `<repo>/scripts` → `<repo>`. Resolved off this file rather than off `process.cwd()` so the gate reads the same baseline whichever directory it is invoked from. */
const REPO_ROOT = resolve(HERE, '..');

const BASELINE_PATH = resolve(REPO_ROOT, 'security/audit-baseline.json');
const BASELINE_LABEL = relative(REPO_ROOT, BASELINE_PATH);

const VALID_SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];

/** Kept in step with `REVIEW_MARKER` in `packages/dev-seed/tests/auditBaselineShape.test.ts`. This file writes it; that file forbids it. */
const REVIEW_MARKER = 'REVIEW REQUIRED';
const REVIEW_RATIONALE = `${REVIEW_MARKER} -- no rationale has been written for this advisory yet. Replace this text with the reason the finding is accepted; auditBaselineShape.test.ts fails while this marker is present.`;

const UPDATE_BASELINE = process.argv.includes('--update-baseline');

// ---------------------------------------------------------------------------
// Named failures
// ---------------------------------------------------------------------------

/**
 * Every way this gate can fail to RUN exits through here, with the path named and no stack trace. A gate that dies on an unhandled exception is indistinguishable in an Actions log from a gate that found something, and the two need very different responses.
 */
function cannotRun(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// The baseline
// ---------------------------------------------------------------------------

/**
 * Read and shape-check the accepted baseline. Reading it is deliberately NOT tolerant: a missing or malformed baseline must not degrade to "the accepted set is empty", because that reads as a red for a reason nobody caused, and the natural fix for that red is to widen the baseline.
 */
function readBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    cannotRun(
      `the accepted-advisory baseline ${BASELINE_LABEL} does not exist. This gate cannot run without it, and it will not proceed as though the accepted set were empty. Restore the file from git, or regenerate it with: node scripts/assert-dependency-audit.mjs --update-baseline`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch (error) {
    cannotRun(`the accepted-advisory baseline ${BASELINE_LABEL} is not valid JSON (${error.message}).`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    cannotRun(`the accepted-advisory baseline ${BASELINE_LABEL} is not a JSON object.`);
  }
  if (!VALID_SEVERITIES.includes(parsed.threshold)) {
    cannotRun(
      `the accepted-advisory baseline ${BASELINE_LABEL} declares threshold ${JSON.stringify(parsed.threshold)}, which is not one of ${VALID_SEVERITIES.join(', ')}.`
    );
  }
  if (!Array.isArray(parsed.accepted)) {
    cannotRun(`the accepted-advisory baseline ${BASELINE_LABEL} has no \`accepted\` array.`);
  }
  for (const row of parsed.accepted) {
    if (!row || typeof row.id !== 'number') {
      cannotRun(
        `the accepted-advisory baseline ${BASELINE_LABEL} has a row whose \`id\` is not a number (${JSON.stringify(row)}). The subtraction is keyed on the advisory ID, and a string id silently subtracts nothing.`
      );
    }
    if (!VALID_SEVERITIES.includes(row.severity)) {
      cannotRun(
        `the accepted-advisory baseline ${BASELINE_LABEL} row ${row.id} carries severity ${JSON.stringify(row.severity)}. Every row must carry a severity.`
      );
    }
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// The audit
// ---------------------------------------------------------------------------

/** The registry the audit queries, for the could-not-run message: the environment override when one is set. */
function auditRegistryLabel() {
  return (
    process.env.YARN_NPM_AUDIT_REGISTRY ||
    process.env.YARN_NPM_REGISTRY_SERVER ||
    "Yarn's configured npm registry (npmAuditRegistry / npmRegistryServer)"
  );
}

/**
 * Run the audit and return its NDJSON findings. A non-zero exit WITH findings is expected: see the docblock, `yarn npm audit` exits non-zero whenever any report is found, so its status is not the verdict. The status is kept, though, because it is the only thing that tells an empty clean audit from an empty failed one.
 */
function runAudit(threshold) {
  const args = ['npm', 'audit', '--all', '--recursive', '--severity', threshold, '--json'];
  let stdout;
  let status;
  try {
    stdout = execFileSync('yarn', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'inherit']
    });
    status = 0;
  } catch (error) {
    if (typeof error.stdout !== 'string') {
      cannotRun(`\`yarn ${args.join(' ')}\` could not be run (${error.message}).`);
    }
    stdout = error.stdout;
    status = error.status;
  }

  const run = classifyAuditRun({ status, stdout });
  if (run.kind === 'did-not-run') {
    const how = run.status === null ? 'was killed before it exited' : `exited with status ${run.status}`;
    cannotRun(
      `\`yarn ${args.join(' ')}\` printed no findings and ${how}, so the audit did not run against ${auditRegistryLabel()}. A clean audit prints nothing AND exits 0; this is reported rather than passed, whatever ${BASELINE_LABEL} holds, and no baseline is written from it.`
    );
  }
  if (run.kind === 'clean') return [];

  const findings = [];
  for (const line of run.lines) {
    try {
      const parsed = JSON.parse(line);
      findings.push({
        id: parsed.children.ID,
        package: parsed.value,
        severity: parsed.children.Severity,
        ghsa: String(parsed.children.URL || '').replace('https://github.com/advisories/', ''),
        issue: parsed.children.Issue,
        url: parsed.children.URL,
        dependents: parsed.children.Dependents || []
      });
    } catch (error) {
      cannotRun(`\`yarn ${args.join(' ')}\` emitted a line that is not JSON (${error.message}): ${line.slice(0, 200)}`);
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

/** Yarn descriptors carry virtual hashes and workspace protocols. Reduce them to something a human can read in a log. */
function readableDependent(descriptor) {
  const workspace = /^(.+)@workspace:(.+)$/.exec(descriptor);
  if (workspace) {
    return workspace[1].startsWith('root-workspace') ? 'root workspace' : `${workspace[1]} (workspace)`;
  }
  const virtual = /^(.+)@virtual:[^#]+#npm:(.+)$/.exec(descriptor);
  if (virtual) return `${virtual[1]}@${virtual[2]}`;
  return descriptor.replace('@npm:', '@');
}

/** Criticals first, then highs, then package name, so the worst rows are at the top of a long block. */
function bySeverityThenPackage(a, b) {
  const rank = (severity) => VALID_SEVERITIES.indexOf(severity);
  if (rank(a.severity) !== rank(b.severity)) return rank(b.severity) - rank(a.severity);
  if (a.package !== b.package) return a.package < b.package ? -1 : 1;
  return a.id - b.id;
}

function printBlock(label, rows) {
  console.log(`[${label}] ${rows.length} finding(s)`);
  for (const row of [...rows].sort(bySeverityThenPackage)) {
    console.log(
      `  ${`[${row.severity}]`.padEnd(11)} ${row.package.padEnd(26)} ${String(row.id).padEnd(9)} ${row.ghsa}`
    );
    console.log(`    ${row.issue}`);
    console.log(`    ${row.url}`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// --update-baseline
// ---------------------------------------------------------------------------

/**
 * Re-emit the baseline from the current findings, preserving reviewed rationales. See the docblock: this is a reviewed action. New advisories arrive carrying the review marker rather than an invented reason, so the affordance cannot be used to make a red go away silently.
 */
function updateBaseline(baseline, findings) {
  const existing = new Map(baseline.accepted.map((row) => [row.id, row]));
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();

  const accepted = findings
    .map((finding) => ({
      id: finding.id,
      package: finding.package,
      severity: finding.severity,
      ghsa: finding.ghsa,
      issue: finding.issue,
      via: [...new Set(finding.dependents.map(readableDependent))].join(', '),
      rationale: existing.get(finding.id)?.rationale ?? REVIEW_RATIONALE
    }))
    .sort((a, b) => (a.package === b.package ? a.id - b.id : a.package < b.package ? -1 : 1));

  const updated = {
    recorded: new Date().toISOString().slice(0, 10),
    recordedAtHead: head,
    threshold: baseline.threshold,
    note: baseline.note,
    accepted
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(updated, null, 2)}\n`);

  const unreviewed = accepted.filter((row) => row.rationale.includes(REVIEW_MARKER));
  console.log(`Rewrote ${BASELINE_LABEL}: ${accepted.length} row(s) at HEAD ${head}.`);
  if (unreviewed.length > 0) {
    console.log(
      `${unreviewed.length} row(s) carry the ${REVIEW_MARKER} marker and MUST be given a real rationale before this tree can go green: ${unreviewed.map((row) => `${row.id} (${row.package})`).join(', ')}`
    );
  }
  console.log('Re-run `yarn format:check` and the dev-seed unit suite before committing.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const baseline = readBaseline();
  const threshold = baseline.threshold;
  const findings = runAudit(threshold);

  const acceptedIds = new Set(baseline.accepted.map((row) => row.id));
  const accepted = findings.filter((finding) => acceptedIds.has(finding.id));
  const fresh = findings.filter((finding) => !acceptedIds.has(finding.id));

  console.log(`=== Dependency audit (threshold ${threshold}+) ===\n`);
  console.log(
    `Baseline ${BASELINE_LABEL} recorded ${baseline.recorded} at ${String(baseline.recordedAtHead).slice(0, 9)}, ${baseline.accepted.length} accepted advisory(ies).\n`
  );

  printBlock('ACCEPTED', accepted);
  printBlock('NEW', fresh);

  const stale = [...acceptedIds].filter((id) => !findings.some((finding) => finding.id === id));
  if (stale.length > 0) {
    console.log(
      `Note: ${stale.length} accepted advisory(ies) no longer appear in the audit and could be dropped at the next reviewed baseline update: ${stale.join(', ')}\n`
    );
  }

  console.log(`Summary: ${fresh.length} new advisory(ies) at ${threshold}+, ${accepted.length} accepted`);

  if (fresh.length > 0) {
    console.log(
      `\nA NEW advisory is not a baseline problem. Fix or upgrade the dependency; if the finding must be accepted, add it with a written rationale via a reviewed \`--update-baseline\` run. Never silence it by package name.`
    );
  }

  process.exit(fresh.length > 0 ? 1 : 0);
}

if (UPDATE_BASELINE) {
  const baseline = readBaseline();
  updateBaseline(baseline, runAudit(baseline.threshold));
} else {
  main();
}
