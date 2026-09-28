#!/usr/bin/env node

/**
 * DEPENDENCY-VULNERABILITY GATE (phase 163, requirement CIGATE-03, locked decision D-L3(a)).
 *
 * The incident this file exists for: Dependabot is already enabled on this repository and has been
 * for some time -- it opens PRs, it maintains an alert list, and it has never once failed a build.
 * Roadmap criterion 4 asks for something Dependabot structurally cannot give: a job that runs on
 * every build and FAILS above a chosen severity threshold, with today's findings recorded as an
 * accepted baseline carrying severities. An alert nobody has to act on is not a gate. This script
 * is the gate.
 *
 * FOUR properties, each a distinct way the gate could go quietly wrong:
 *
 *   1 (D-L3(a)) -- The threshold is read from the baseline file, not hard-coded here, so the file
 *     that DOCUMENTS the gate and the value the gate RUNS AT cannot disagree. A baseline claiming
 *     `high` while the script ran at `moderate` would describe a gate that is not the gate running.
 *
 *   2 (D-L3(a)) -- The subtraction is keyed on the ADVISORY ID and on nothing else. Never on the
 *     package name, never on a glob. Silencing `tar` by name would also silence every future `tar`
 *     advisory, which is exactly the class of finding this gate exists to surface, and nine of the
 *     baseline's rows are already `tar` advisories against an ever-widening range.
 *
 *   3 -- The ACCEPTED set is printed alongside the NEW set. This is not decoration. It is what makes
 *     a red diagnosable from the Actions log alone, without a developer re-running the audit locally
 *     to work out which of the findings were already known.
 *
 *   4 -- An empty instrument is not a clean tree. `yarn npm audit` producing no findings while the
 *     baseline lists N accepted advisories means either the audit did not really run or every
 *     accepted advisory vanished at once; both are reportable events, and neither is a green.
 *     Without this check a network failure that yields empty output reads exactly like a clean bill
 *     of health, which is the silent-green failure shape this whole phase was written against.
 *
 * WHY THE SUBTRACTION IS IN THIS SCRIPT RATHER THAN IN THE AUDIT COMMAND'S OWN FLAGS. Yarn offers an
 * advisory-suppression flag and a matching `.yarnrc.yml` setting, and both were considered and
 * rejected. They carry bare IDs with no severity, no date and no rationale, which is the specific
 * thing D-L3(a) says does not satisfy the criterion; the config form additionally applies to every
 * LOCAL `yarn npm audit` too, so a developer running the command by hand would silently see a
 * filtered world. RESEARCH also measured two ways the CLI path goes wrong in a shell: a
 * space-joined list is rejected outright, and a read loop drops the final ID when its input has no
 * trailing newline -- shipping 67 suppressions out of 68 and looking exactly like a tool bug.
 *
 * WHY THE AUDIT COMMAND'S EXIT CODE IS NOT THE GATE. `yarn npm audit` exits non-zero whenever ANY
 * report is found, regardless of `--severity` and regardless of the baseline. Its exit code answers
 * "did you find anything at all", which is always yes here. This script decides instead.
 *
 * Usage:
 *   node scripts/assert-dependency-audit.mjs                     # the gate
 *   node scripts/assert-dependency-audit.mjs --update-baseline   # REVIEWED action, see below
 *
 * `--update-baseline` re-emits security/audit-baseline.json from the current findings with a fresh
 * `recorded` date and `recordedAtHead`, preserving the rationale already written for any advisory
 * ID that is already listed. USING IT IS A REVIEWED ACTION, NOT A WAY TO CLEAR A RED. It writes
 * newly-discovered advisories with a `REVIEW REQUIRED` rationale rather than inventing a reason to
 * accept them, and `packages/dev-seed/tests/auditBaselineShape.test.ts` fails while any such marker
 * is present -- so running it on a red tree moves the finding from this gate into the unit suite
 * and the tree stays red until a human writes down why the advisory is accepted.
 *
 * Exit codes:
 *   0 - No advisories at or above the threshold outside the accepted baseline.
 *   1 - At least one NEW advisory at or above the threshold. The gate's red.
 *   2 - The gate could not run: the baseline is missing or malformed, or the audit produced no
 *       findings at all while the baseline is non-empty. Never reported as a pass.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
        `the accepted-advisory baseline ${BASELINE_LABEL} row ${row.id} carries severity ${JSON.stringify(row.severity)}. D-L3(a) requires a severity on every row.`
      );
    }
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// The audit
// ---------------------------------------------------------------------------

/**
 * Run the audit and return its NDJSON findings. The non-zero exit is EXPECTED and swallowed on purpose: see the docblock, `yarn npm audit` exits non-zero whenever any report is found, so treating its status as the verdict would make the gate red forever from the first commit.
 */
function runAudit(threshold) {
  const args = ['npm', 'audit', '--all', '--recursive', '--severity', threshold, '--json'];
  let stdout;
  try {
    stdout = execFileSync('yarn', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'inherit']
    });
  } catch (error) {
    if (typeof error.stdout !== 'string') {
      cannotRun(`\`yarn ${args.join(' ')}\` could not be run (${error.message}).`);
    }
    stdout = error.stdout;
  }

  const findings = [];
  for (const line of stdout.split('\n')) {
    if (line.trim().length === 0) continue;
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

  if (findings.length === 0 && baseline.accepted.length > 0) {
    cannotRun(
      `\`yarn npm audit\` reported 0 findings at ${threshold}+ while ${BASELINE_LABEL} lists ${baseline.accepted.length} accepted advisory(ies). Either the audit did not really run, or every accepted advisory is gone at once. An empty instrument reads exactly like a clean tree, so this is reported rather than passed. If the tree really is clean, regenerate the baseline with --update-baseline.`
    );
  }

  const acceptedIds = new Set(baseline.accepted.map((row) => row.id));
  const accepted = findings.filter((finding) => acceptedIds.has(finding.id));
  const fresh = findings.filter((finding) => !acceptedIds.has(finding.id));

  console.log(`=== Dependency audit (threshold ${threshold}+, D-L3(a)) ===\n`);
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
