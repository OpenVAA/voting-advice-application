/**
 * Classify one finished `yarn npm audit --json` run.
 *
 * Node built-ins only, no build step: `scripts/assert-dependency-audit.mjs` imports it before anything is built,
 * and `packages/dev-seed/tests/auditBaselineShape.test.ts` unit-tests it.
 */

/**
 * Decide what one `yarn npm audit --json` run says, from its exit status AND its stdout.
 *
 * Stdout alone cannot tell a clean audit from one that never ran: both print nothing. The audit exits 0 when it
 * found nothing, and non-zero (or with no status at all, when a signal killed it) when it could not reach the
 * registry. Findings arrive one JSON object per line, and the audit exits non-zero whenever it prints any, so
 * non-blank output is findings whatever the status. The three outcomes:
 *
 * - `findings` -- at least one non-blank line; `lines` holds them, blank lines dropped.
 * - `clean` -- no output and exit status 0.
 * - `did-not-run` -- no output and any other status, `null` included. Never a pass.
 *
 * @param {{ status: number | null, stdout: string }} run - The audit's exit status (`null` when killed by a signal) and its stdout.
 * @returns {{ kind: 'clean' } | { kind: 'did-not-run', status: number | null } | { kind: 'findings', lines: Array<string> }}
 */
export function classifyAuditRun({ status, stdout }) {
  const lines = stdout.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length > 0) return { kind: 'findings', lines };
  if (status === 0) return { kind: 'clean' };
  return { kind: 'did-not-run', status };
}
