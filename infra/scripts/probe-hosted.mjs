#!/usr/bin/env node

/**
 * HOSTED CONFORMANCE PROBE.
 *
 * What it requires: a hosted Supabase project serves the settings the repository declares for it. The expected values are read from tracked files only, the same files the hosted-settings parity guard reads: the target root's `terraform.tfvars` (the project ref, the public origin, the two hook switches and the `smtp` object), `infra/modules/supabase/hosted-settings.json`, `dataAdapter.pageSize` in `packages/app-shared/src/settings/staticSettings.ts`, `[auth.oauth_server]` and the `[functions.<slug>]` tables of `apps/supabase/supabase/config.toml`, its `[storage.buckets.<id>]` tables and `[db] major_version`, the last `ALTER ROLE anon SET statement_timeout` of `apps/supabase/supabase/migrations/`, and the function directories under `apps/supabase/supabase/functions/`. The probe holds no table of expected values of its own.
 *
 * What it reads: the probe reads a hosted project through three sources:
 *
 *   management:  The Management API, with the access token from `SUPABASE_ACCESS_TOKEN`. Preflight `GET /v1/projects/{ref}`; the PostgREST settings give `max_rows` and the exposed schemas, the auth settings give the fields the auth checks compare, and the functions list gives each deployed function's slug, status and `verify_jwt`, and the bucket list each bucket's id and `public` flag. It also reads the key model for the note below.
 *   public:      The project's own API at `https://<ref>.supabase.co`, with the key in `SUPABASE_ANON_KEY` only. Preflight `GET /auth/v1/settings`; it reads the public auth settings, every nomination of the root's `public_project_id` in one read with the total asked for, and the answers of the three functions.
 *   catalog:     The database over psql, with the connection in the PG* variables only; no argument carries an address. Before psql is called, PGHOST must be `db.<ref>.supabase.co`, or a session pooler host with PGUSER ending in `.<ref>`, PGPORT must not be 6543 (the transaction pooler), and PGHOSTADDR and PGSERVICE must be unset. Preflight: one catalog query, which also refuses a role that does not bypass row-level security, because the seed check would read no rows under it. It gives the server's major version, the settings of `anon` and whether each hook function exists; then `infra/scripts/check-seed.sql` runs as a subprocess, and of its message only the finding classes are kept, never an address or a URL. The seed check reads the stored service-role key inside the database to test its issuer; the value never leaves the database.
 *
 * It never takes, reads or prints the service-role key: an anon key that is a secret key or a JWT whose role is `service_role` is refused before any request. It writes nothing to any project. Every request is a GET but two POSTs: a `check-code` of a random code to `account-access`, which reads, and an empty object to `identity-callback`, which refuses a request without the frontend server's credential header before it reads its body or its environment.
 * Of each response body it keeps the named fields it compares and drops the rest at once, so a secret served next to a compared field (the PostgREST settings hold the JWT secret, the auth settings the SMTP credentials) is never kept or printed. Of the SMTP user name it keeps only whether one is set, and of each issued key only its type and name.
 *
 * Checks, in the order they run and print:
 *
 *   api.max-rows:                            The served `max_rows` is a number equal to `api.max_rows` of the JSON and to `pageSize`.
 *   auth.access-token-hook:                  With the root's `enable_access_token_hook` on, the hook's enabled flag and URI are the JSON's `auth_hook`; with it off, the flag is false.
 *   auth.send-email-hook:                    The same for the send-email hook, `enable_send_email_hook` and `auth_send_email_hook`.
 *   auth.site-url:                           `site_url` is the root's `public_origin`.
 *   auth.redirects:                          `uri_allow_list` is exactly the string the module builds: the origin followed by each of the JSON's `redirect_callback_paths`, joined by commas, in order and without spaces.
 *   auth.signup-closed:                      `disable_signup` is the JSON's.
 *   auth.email-confirm:                      `mailer_autoconfirm` is the JSON's.
 *   auth.smtp:                               Host, port, sender address and sender name are the root's `smtp` object, and an SMTP user name is set. A root without an `smtp` object fails it.
 *   auth.oauth-server:                       `oauth_server_enabled` and `oauth_server_allow_dynamic_registration` are `enabled` and `allow_dynamic_registration` of `[auth.oauth_server]` in config.toml.
 *   auth.other-settings:                     Every other key of the JSON's `auth` group is served with its JSON value.
 *   api.schemas:                             `db_schema` and `db_extra_search_path` are the JSON's.
 *   functions.deployed:                      The deployed slugs are exactly the function directories of the repository (a directory under apps/supabase/supabase/functions/ holding an index.ts), each one ACTIVE. A slug beyond them, such as a temporary function left behind, fails it. Slugs are compared as sets and named in sorted order.
 *   functions.verify-jwt:                    Each of those functions that is deployed serves the `verify_jwt` its `[functions.<slug>]` table of config.toml declares, `true` when it declares none.
 *   auth.public-settings:                    The anon `/auth/v1/settings` serves `disable_signup` and `mailer_autoconfirm` as the JSON's.
 *   rows.read-whole:                         One anon read of the nominations of the root's `public_project_id` returns them all: `Content-Range` is `0-(N-1)/N`, the body holds N rows, and N is more than 1000, the hosted default page. A range that stops short is a truncation; an unsatisfied range with a total of 0 means no row is readable, so the project may be closed for voters or hold no nominations.
 *   functions.served:                        `account-access` answers a `check-code` with 200 and a status, and `send-email` answers a GET with 405 and its own method-not-allowed body: each function, not the gateway, answered.
 *   functions.identity-callback-unverified:  Called with no `apikey` and no `Authorization`, as the identity provider's browser redirect arrives, `identity-callback` answers a GET with 400 and its own `{"result":"bad_request"}`, so the gateway demands no JWT, and a POST of `{}` without the frontend server's credential header with 401 and its own `{"result":"refused"}`, so an unverified caller is refused with a fixed body and no detail.
 *   storage.buckets:                         The served bucket ids are exactly the `[storage.buckets.<id>]` tables of config.toml, each with its `public` flag. The bucket list is read from the Management API.
 *   db.hook-functions:                       The functions the JSON's two hook URIs name exist, as `<schema>.<name>(jsonb)`.
 *   db.anon-timeout:                         The `statement_timeout` of `anon` is the one the last `ALTER ROLE anon` of the migrations sets.
 *   db.postgres-major:                       The server's major version is `[db] major_version` of config.toml.
 *   no-seed:                                 `infra/scripts/check-seed.sql` exits 0: no seed user, no local address and no demo key. Its finding classes are named; its exit 2, or any status but 0 and 3, is could-not-run.
 *
 * Every comparison is aware of the JSON type: a string served for a boolean or a number is a finding.
 *
 * After the check lines, one line `NOTE key-model: issued <type/name, ...>; legacy keys <enabled|disabled|endpoint gone>` reports the key model: the type and name of each issued key, and whether the legacy keys are enabled, where a 404 from that endpoint means it has been removed. It is not a check, and it never changes the exit status; a read of the key model that fails is reported in it as not read.
 *
 * Each source answers its preflight before any check that reads it runs. When a source does not answer, or an input file cannot be read, the probe prints one `COULD NOT RUN <source>: <reason>` line, prints no check line and exits 2: a source that is down is never reported as a wall of failing checks, and a probe that checked nothing never passes.
 *
 * Every line on stdout can be pasted into a tracked record: it holds no `=`, no `@`, no run of 32 or more hexadecimal digits and no secret word directly followed by `:` or `=`.
 *
 * Environment:
 *
 * - `SUPABASE_ACCESS_TOKEN`: the Management API access token, sent as a bearer token and never printed.
 * - `SUPABASE_ANON_KEY`: the project's anon key, never printed; a secret or service-role key is refused.
 * - `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, and `PGPASSWORD` or a password file: the catalog connection, read by psql alone; the password is never on a command line.
 * - `PROBE_MANAGEMENT_API_URL`: test seam: the base address of the Management API (default https://api.supabase.com).
 * - `PROBE_PROJECT_URL`: test seam: the base address of the project's own API (default https://<ref>.supabase.co).
 * - `PROBE_PSQL`: test seam: the psql binary to run (default psql on PATH).
 *
 * Usage:
 *
 * ```sh
 * node infra/scripts/probe-hosted.mjs --root <dir>
 * node infra/scripts/probe-hosted.mjs --help
 * ```
 *
 * `<dir>` is the target Supabase root, such as infra/envs/staging/supabase; a relative path is resolved against the repository root.
 *
 * Check lines go to stdout as `PASS <name>` or `FAIL <name>: <finding>`, followed by the note; the summary goes to stderr.
 *
 * Exit codes:
 *
 * - 0: every check passed.
 * - 1: at least one check failed.
 * - 2: the probe could not run (an input file, a source or the environment), or a usage error.
 */

import path from 'node:path';
import { CHECKS, keyModelNote, pasteSafe, runChecks } from './probe/checks.mjs';
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
  if (responses.management !== undefined) out(keyModelNote(responses.management.keys));
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
