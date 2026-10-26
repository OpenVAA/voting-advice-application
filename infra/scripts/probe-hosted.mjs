#!/usr/bin/env node

/**
 * HOSTED CONFORMANCE PROBE.
 *
 * What it requires: a hosted Supabase project serves the settings the repository declares for it. The expected values
 * are read from tracked files only, the same files the hosted-settings parity guard reads: the target root's
 * `terraform.tfvars` (the project ref), `infra/modules/supabase/hosted-settings.json` and `dataAdapter.pageSize` in
 * `packages/app-shared/src/settings/staticSettings.ts`. The probe holds no table of expected values of its own.
 *
 * What it reads: the probe reads a hosted project through three sources, of which this version has one:
 *
 *   management   The Management API, with the access token from `SUPABASE_ACCESS_TOKEN`. Preflight
 *                `GET /v1/projects/{ref}`; the PostgREST settings give `max_rows`.
 *   public API   (not yet present) The project's own API, with the anon key only.
 *   catalog      (not yet present) The database catalog over psql, as a read-only role.
 *
 * It never takes, reads or prints the service-role key, and it writes nothing to any project: every request is a GET.
 * Of each response body it keeps the named fields it compares and drops the rest at once, so a secret served next to a
 * compared field (the PostgREST settings hold the JWT secret) is never kept or printed.
 *
 * Checks, in the order they run and print:
 *
 *   api.max-rows   The served `max_rows` is a number equal to `api.max_rows` of the JSON and to `pageSize`.
 *
 * Each source answers its preflight before any check that reads it runs. When a source does not answer, or an input
 * file cannot be read, the probe prints one `COULD NOT RUN <source>: <reason>` line, prints no check line and exits 2:
 * a source that is down is never reported as a wall of failing checks, and a probe that checked nothing never passes.
 *
 * Every line on stdout can be pasted into a tracked record: it holds no `=`, no `@`, no run of 32 or more hexadecimal
 * digits and no secret word directly followed by `:` or `=`.
 *
 * Environment:
 *   SUPABASE_ACCESS_TOKEN      the Management API access token, sent as a bearer token and never printed
 *   PROBE_MANAGEMENT_API_URL   test seam: the base address of the Management API (default https://api.supabase.com)
 *
 * Usage:
 *   node infra/scripts/probe-hosted.mjs --root <dir>
 *     <dir> is the target Supabase root, such as infra/envs/staging/supabase; a relative path is resolved against the
 *     repository root
 *   node infra/scripts/probe-hosted.mjs --help
 *
 * Check lines go to stdout as `PASS <name>` or `FAIL <name>: <finding>`; the summary goes to stderr.
 *
 * Exit codes:
 *   0 - every check passed
 *   1 - at least one check failed
 *   2 - the probe could not run (an input file, a source or the environment), or a usage error
 */

import path from 'node:path';
import { CHECKS, pasteSafe, runChecks } from './probe/checks.mjs';
import { ProbeInputError, readExpected, REPO_ROOT } from './probe/expected.mjs';
import { collect, SourceError } from './probe/sources.mjs';

const SELF = 'infra/scripts/probe-hosted.mjs';
const NAME = 'Hosted conformance probe';
const USAGE = `usage: node ${SELF} --root <dir>`;

/** One line on stdout, where only the check lines, the could-not-run line and the help go. */
function out(line) {
  process.stdout.write(`${line}\n`);
}

// Any way out of this process other than a completed run leaves this status.
process.exitCode = 2;

function couldNotRun(source, reason) {
  const line = `COULD NOT RUN ${source}: ${reason}`;
  out(pasteSafe(line) ? line : `COULD NOT RUN ${source}: the reason was withheld because it fails the paste screen`);
  console.error(`${NAME} — could not run, so no check was made and the verdict is withheld.`);
  process.exitCode = 2;
}

function parseArguments(argv) {
  let root = null;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '-h' || a === '--help') return { help: true };
    if (a === '--root') {
      const value = argv[i + 1];
      i += 1;
      if (value === undefined || value === '' || value.startsWith('-')) return { error: '--root requires a directory' };
      if (root !== null) return { error: '--root given twice' };
      root = value;
    } else return { error: `unexpected argument '${a}'` };
  }
  if (root === null) return { error: '--root is required' };
  return { root: path.resolve(REPO_ROOT, root) };
}

async function probe(root) {
  let expected;
  try {
    expected = readExpected({ root });
  } catch (error) {
    if (error instanceof ProbeInputError) return couldNotRun('expected', error.message);
    throw error;
  }

  const sources = [...new Set(CHECKS.map((c) => c.source))];
  let responses;
  try {
    responses = await collect({ sources, expected, env: process.env });
  } catch (error) {
    if (error instanceof SourceError) return couldNotRun(error.source, error.reason);
    throw error;
  }

  const results = runChecks(expected, responses);
  if (results.length === 0) return couldNotRun('probe', 'no check is registered');
  for (const { name, pass, finding } of results) out(pass ? `PASS ${name}` : `FAIL ${name}: ${finding}`);
  const failed = results.filter((r) => !r.pass).length;
  console.error(
    failed === 0
      ? `${NAME} — ${results.length} check(s) passed against project ${expected.ref}.`
      : `${NAME} — ${failed} of ${results.length} check(s) failed against project ${expected.ref}.`
  );
  process.exitCode = failed === 0 ? 0 : 1;
}

const parsed = parseArguments(process.argv.slice(2));
if (parsed.help) {
  out(USAGE);
  process.exitCode = 0;
} else if (parsed.error !== undefined) {
  console.error(`${SELF}: ${parsed.error}`);
  console.error(USAGE);
  process.exitCode = 2;
} else {
  probe(parsed.root).catch((error) => {
    couldNotRun('probe', `an unexpected ${error instanceof Error ? error.name : 'error'} was raised`);
  });
}
