---
phase: 181-deployability-and-migration-model
reviewed: 2026-10-21T07:07:45Z
depth: standard
files_reviewed: 96
files_reviewed_list:
  - .dockerignore
  - .env.example
  - .gitattributes
  - .prettierignore
  - apps/frontend/Dockerfile
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/lib/i18n/tests/__mocks__/env-dynamic-private.ts
  - apps/frontend/src/lib/server/startup/requiredEnv.test.ts
  - apps/frontend/src/lib/server/startup/requiredEnv.ts
  - apps/frontend/src/routes/api/diagnostics/+server.ts
  - apps/frontend/src/routes/api/diagnostics/server.test.ts
  - apps/frontend/src/routes/api/health/+server.ts
  - apps/frontend/src/routes/api/health/server.test.ts
  - apps/frontend/svelte.config.js
  - apps/frontend/svelte.config.test.ts
  - apps/frontend/turbo.json
  - apps/frontend/vitest.config.ts
  - apps/supabase/scripts/check-schema-equivalence.sh
  - apps/supabase/scripts/isolated-instance.sh
  - apps/supabase/supabase/config.toml
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/100-tenancy.sql
  - apps/supabase/supabase/schema/107-feedback.sql
  - apps/supabase/supabase/schema/400-storage.sql
  - docker-compose.dev.yml
  - infra/local/check-proxy-topology.sh
  - infra/local/docker-compose.proxy.yml
  - infra/local/nginx.conf
  - infra/scripts/bootstrap.sql
  - infra/scripts/check-drift.sh
  - infra/scripts/check-seed.sql
  - package.json
  - packages/dev-seed/tests/cli/allowedTeardownTables.test.ts
  - packages/dev-seed/tests/deploymentChecksWiring.test.ts
  - packages/dev-seed/tests/deploymentTemplates.test.ts
  - packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts
  - packages/dev-seed/tests/template/permittedKeys.test.ts
  - render.example.yaml
  - scripts/assert-comment-hygiene.mjs
  - scripts/assert-schema-migration-parity.mjs
  - scripts/fixtures/schema-migration-freeze/bad-baseline-commit/expected.violations
  - scripts/fixtures/schema-migration-freeze/bad-baseline-commit/manifest.json
  - scripts/fixtures/schema-migration-freeze/bad-baseline-commit/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/bad-name/expected.violations
  - scripts/fixtures/schema-migration-freeze/bad-name/manifest.json
  - scripts/fixtures/schema-migration-freeze/bad-name/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/bad-name/migrations/20261012120000_add_note.sql
  - scripts/fixtures/schema-migration-freeze/baseline-not-first/expected.violations
  - scripts/fixtures/schema-migration-freeze/baseline-not-first/manifest.json
  - scripts/fixtures/schema-migration-freeze/baseline-not-first/migrations/00001_other.sql
  - scripts/fixtures/schema-migration-freeze/baseline-without-table/expected.violations
  - scripts/fixtures/schema-migration-freeze/baseline-without-table/manifest.json
  - scripts/fixtures/schema-migration-freeze/baseline-without-table/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/duplicate-version/expected.violations
  - scripts/fixtures/schema-migration-freeze/duplicate-version/manifest.json
  - scripts/fixtures/schema-migration-freeze/duplicate-version/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/duplicate-version/migrations/00002_a.sql
  - scripts/fixtures/schema-migration-freeze/duplicate-version/migrations/00002_b.sql
  - scripts/fixtures/schema-migration-freeze/edited-file/expected.violations
  - scripts/fixtures/schema-migration-freeze/edited-file/manifest.json
  - scripts/fixtures/schema-migration-freeze/edited-file/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/edited-file/migrations/00002_add_note.sql
  - scripts/fixtures/schema-migration-freeze/empty-baseline/expected.violations
  - scripts/fixtures/schema-migration-freeze/empty-baseline/manifest.json
  - scripts/fixtures/schema-migration-freeze/empty-baseline/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/empty-migrations/expected.violations
  - scripts/fixtures/schema-migration-freeze/empty-migrations/manifest.json
  - scripts/fixtures/schema-migration-freeze/empty-migrations/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/malformed-manifest/expected.violations
  - scripts/fixtures/schema-migration-freeze/malformed-manifest/manifest.json
  - scripts/fixtures/schema-migration-freeze/malformed-manifest/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/missing-baseline-member/expected.violations
  - scripts/fixtures/schema-migration-freeze/missing-baseline-member/manifest.json
  - scripts/fixtures/schema-migration-freeze/missing-baseline-member/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/missing-file/expected.violations
  - scripts/fixtures/schema-migration-freeze/missing-file/manifest.json
  - scripts/fixtures/schema-migration-freeze/missing-file/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/missing-manifest/expected.violations
  - scripts/fixtures/schema-migration-freeze/missing-manifest/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/non-increasing-version/expected.violations
  - scripts/fixtures/schema-migration-freeze/non-increasing-version/manifest.json
  - scripts/fixtures/schema-migration-freeze/non-increasing-version/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/non-increasing-version/migrations/00002_b.sql
  - scripts/fixtures/schema-migration-freeze/non-increasing-version/migrations/00003_a.sql
  - scripts/fixtures/schema-migration-freeze/ok/expected.violations
  - scripts/fixtures/schema-migration-freeze/ok/manifest.json
  - scripts/fixtures/schema-migration-freeze/ok/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/ok/migrations/00002_add_note.sql
  - scripts/fixtures/schema-migration-freeze/unlisted-file/expected.violations
  - scripts/fixtures/schema-migration-freeze/unlisted-file/manifest.json
  - scripts/fixtures/schema-migration-freeze/unlisted-file/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/unlisted-file/migrations/00002_add_note.sql
  - scripts/fixtures/schema-migration-freeze/version-gap/expected.violations
  - scripts/fixtures/schema-migration-freeze/version-gap/manifest.json
  - scripts/fixtures/schema-migration-freeze/version-gap/migrations/00001_initial_schema.sql
  - scripts/fixtures/schema-migration-freeze/version-gap/migrations/00003_add_note.sql
findings:
  critical: 0
  warning: 5
  info: 8
  total: 13
status: issues_found
---

# Phase 181: Code Review Report

**Reviewed:** 2026-10-21T07:07:45Z
**Depth:** standard
**Files Reviewed:** 96
**Status:** issues_found

## Summary

**Scope.** The scope is every non-`.planning` file that a commit with `(181-` in its subject changed in `619008394..fd731f7cc`: 96 files, 56 of them fixtures of the freeze checker. The range also holds commits from phases 182, 183 and 189, plus two untagged `[db]` commits (`12c98aa5c` freezes the baseline behind the manifest, `58cf7a564` updates the docs). Those commits are out of scope. In files that phase 181 shares with them (`hooks.server.ts`, `requiredEnv.ts`, `docker-compose.dev.yml`, `render.example.yaml`, `.env.example`), I reviewed only the lines phase 181 wrote. Two out-of-scope files were read as context only, to check the code under review: `apps/supabase/supabase/migrations.manifest.json` (input of the checker) and `supabaseAdapter.ts` (the project-id resolver). I ran no E2E suite and started, stopped or reset no stack. I ran the freeze checker only against scratch fixtures.

**Assessment.** There is no security vulnerability and nothing that has to be fixed before shipping. Several things hold up:

- `/api/diagnostics` is off by default, echoes only an allow-listed set of headers and logs nothing.
- `/api/health` touches neither `locals` nor the client address.
- `.dockerignore` now keeps environment files out of the build context.
- The `init` start-up refusal was measured to exit 1 (evidence 181-09).
- The bootstrap passes the service-role key as a bound parameter, and an empty key is reported by name (evidence 181-11).
- The freeze checker is self-testing and its fixtures cover every rule.

**Main concerns:**

1. The start-up check only tests that each required variable is present. A server with a malformed `PUBLIC_PROJECT_ID` starts, reports healthy, and fails every page.
2. Since the freeze, no automatic gate compares `schema/` with `migrations/`, and the TypeScript parity tests now read `schema/`, which the database never applies.
3. The CLI-output redactor in `isolated-instance.sh` is case-sensitive, while the copy in `check-drift.sh` is not.
4. The SIGTERM leg of the proxy check can report a verdict on a stale image.
5. The published deployment guide now contradicts the code.

Comment Hygiene: no violation in the comments phase 181 added under `apps/`, `packages/` or `tests/`. The historical wording in the parity guard sits in root `scripts/`, which the hygiene rule exempts; it is listed as IN-08 for completeness.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The start-up check passes a malformed required value, and `/api/health` then reports a server that fails every page as healthy

**File:** `apps/frontend/src/lib/server/startup/requiredEnv.ts:41-54`, `apps/frontend/src/hooks.server.ts:134-139`, `apps/frontend/src/routes/api/health/+server.ts:11-13`
**Issue:** `unsetRequiredEnv` / `isUnset` check only that a value is present and not blank. The Supabase adapter rejects any `PUBLIC_PROJECT_ID` that is not a canonical 8-4-4-4-12 uuid (`supabaseAdapter.ts:30-38`), but it does so per request, at adapter construction. So with a typo'd id, or a template placeholder left in (`render.example.yaml` marks the value `sync: false`, so it is typed in by hand):

- `init` lets the server start;
- `/api/health` answers `{status:'ok'}`, so the load balancer sends traffic to the instance;
- every data-loading page then fails.

The same applies to an `ORIGIN` that is not an absolute origin (`render.example.yaml:51` ships it as the literal `https://<INSTANCE_DOMAIN>`). The phase's goal is that the server refuses to start rather than serve broken pages. A presence-only check leaves this class of misconfiguration to be discovered by users.

**Fix:** Let `StartupRule` validate shape as well as presence, and keep reporting names only, never values:
```ts
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function malformedRequiredEnv(env: StartupEnv): Array<string> {
  const bad: Array<string> = [];
  const id = env.PUBLIC_PROJECT_ID?.trim().toLowerCase();
  if (id && !CANONICAL_UUID.test(id)) bad.push('PUBLIC_PROJECT_ID');
  for (const name of ['ORIGIN', 'PUBLIC_SUPABASE_URL']) {
    const v = env[name]?.trim();
    if (v && !URL.canParse(v)) bad.push(name);
  }
  return bad;
}
export const STARTUP_RULES = [unsetRequiredEnv, malformedRequiredEnv, analyticsStartupProblems];
```
Share `CANONICAL_UUID` with `supabaseAdapter.ts` rather than copying it. Adjust the thrown message in `hooks.server.ts:138` to read "not set or malformed".

### WR-02: Since the freeze, no automatic gate keeps `schema/` and `migrations/` in step, and the TypeScript parity tests now read the file the database never applies

**File:** `packages/dev-seed/tests/template/permittedKeys.test.ts:39`, `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts:20`, `packages/dev-seed/tests/deploymentChecksWiring.test.ts:78-83`, `package.json:44`
**Issue:** Before phase 181, the parity guard asserted that the migration was byte-identical to `cat schema/*.sql`, and `permittedKeys.test.ts` also compared the CASE block of the migration with the one in `schema/`. Phase 181 changed three things:

- 181-07 deleted that comparison.
- 181-07 pointed both tests at `schema/501-bulk-operations.sql`.
- 181-15 pinned `check:schema-equivalence` outside `lint:check`.

`.github/workflows/main.yaml` runs it nowhere. The guard's own header says so (`scripts/assert-schema-migration-parity.mjs:41-44`): a `schema/` edit without its migration, or the reverse, passes every automatic gate. The result is a gap between what the tests check and what the database runs:

- pgTAP and E2E exercise the database built from `migrations/`.
- The unit tests that pin `ALLOWED_TEARDOWN_TABLES`, `RELATIONSHIP_REFS` and `skip_columns` read `schema/`.

So an appended migration that changes `bulk_delete` or `_bulk_upsert_record` can leave those tests green against SQL the database does not run. The opposite case also passes: a `schema/` edit with no migration turns those tests green while the database still has the old function.

**Fix:** Run `yarn check:schema-equivalence` in CI. The workflow's `db:lint:sql` job (`main.yaml:235-294`) already has Docker and a pinned CLI, so the check can be a step there or in a sibling job. Make it required on every PR that touches `apps/supabase/supabase/schema/**` or `apps/supabase/supabase/migrations/**`. Until then, record in the two test docblocks that they check `schema/`, not the applied SQL.

### WR-03: `isolated-instance.sh` redacts secrets case-sensitively, unlike the copy of the same helper in `check-drift.sh`

**File:** `apps/supabase/scripts/isolated-instance.sh:260-266` (compare `infra/scripts/check-drift.sh:138-145`)
**Issue:** On failure, `print_redacted` in `isolated-instance.sh` drops any line matching `/SECRET|_KEY/`, which is case-sensitive. The copy in `check-drift.sh` uses `[Ss][Ee][Cc][Rr][Ee][Tt]`, the case-insensitive form. I fed the two filters synthetic lines in human-readable label styles: `JWT secret: …`, `S3 Secret Key: …` and the table form `| Secret Key | … |`. The `check-drift.sh` filter removes all three; the `isolated-instance.sh` filter prints all three in full. The only line it removes is the env-style `JWT_SECRET=…`.

The 181-02 summary says the CLI's status line carries the JWT secret and the S3 secret. I did not establish the exact casing CLI 2.118.0 uses there, because reading the CLI's output strings was refused. So whether a real failure would leak depends on a format nobody has pinned. The exposure is limited: the instance is throwaway and local, and this runs on the failure path only. But the header promise ("with key-shaped strings removed") rests on the narrower pattern, and the two copies have already diverged. The helpers (`usage`, `fatal`, `require_value`, `resolve_path`, `toml_value`, `port_has_listener`, `print_redacted`) are copy-pasted across four scripts, which is how one copy drifted (see IN-07).

**Fix:** Use the case-insensitive pattern in both places, and add `access key`:
```sh
print_redacted() {
  sed -E \
    -e '/[Ss][Ee][Cc][Rr][Ee][Tt]|[Kk][Ee][Yy]/s/.*/<a line naming a key or a secret was removed>/' \
    -e 's/eyJ[A-Za-z0-9_-]{10,}(\.[A-Za-z0-9_-]+)*/<redacted>/g' \
    -e 's/sb_(secret|publishable)_[A-Za-z0-9_-]+/<redacted>/g' \
    "$1"
}
```
Better still, move the shared helpers into one sourced file, so the two redactors cannot diverge again.

### WR-04: The `--sigterm` leg of the proxy check reuses whatever image carries the name, so its verdict may describe another commit

**File:** `infra/local/check-proxy-topology.sh:463-469` (header line 20)
**Issue:** `run_sigterm_leg` builds only when no `openvaa-proxy-check-frontend` image exists. If an earlier run, or an earlier commit, left one behind, the leg tests that image. It records the image's `BUILD_SHA` and, separately, the CMD of the checkout's Dockerfile (line 474). It never compares either one with the checkout under test. So the leg can report `sigterm.pid1 … PASS` for an image built from a different Dockerfile, or fail for the same reason. It still exits 0 or 1 as if the verdict described the working tree. The rest of the script takes care that a verdict always describes the stated subject: a control licenses each observation, and an unreachable state means "could not run". This leg breaks that pattern.

**Fix:** After reading `image_sha`, refuse with status 3 when it differs from `$SHA`. Alternatively, always rebuild under `--sigterm`, since the layer cache makes a rebuild of an unchanged tree cheap:
```sh
if [ "${image_sha:-}" != "$SHA" ]; then
  could_not_run "the frontend image present was built from BUILD_SHA '${image_sha:-<empty>}', not $SHA; remove it or rebuild"
fi
```

### WR-05: The deployment guide now contradicts the shipped code

**File:** `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:18, 19, 26-28, 48` (out of the phase's file set; the drift comes from 181-04/05/08/11)
**Issue:** After phase 181, the published deployer instructions are wrong in four places:

- Line 18 says the migrations "are generated from the files in `schema/`". They are frozen now, and new migrations are appended.
- Line 19 tells the deployer to create both buckets by hand, saying "The migrations create the bucket policies, not the buckets". The migration now inserts the buckets.
- Lines 26-28 give manual SQL-editor steps for the account, project, `storage_config` and `behind_cloudflare`, where `infra/scripts/bootstrap.sql` now does this.
- Line 48 says "Also add `PUBLIC_PROJECT_ID`, which the template does not list". The template lists it now.

Neither the deployment guide nor the environment-variables page mentions `ORIGIN`. Since 181-03, a production server without `ORIGIN` refuses to start. So a deployer who follows the guide and does not start from `render.example.yaml` will get a container that exits 1 at start. `deferred-items.md` assigns the rewrite to phase 189 for buckets and `behind_cloudflare`, but `ORIGIN` and the "template does not list" line are not recorded there.

**Fix:** Add the `ORIGIN` / `ADDRESS_HEADER` / `XFF_DEPTH` entries and the outdated line-48 sentence to the phase-189 scope in `deferred-items.md`. Or, at minimum, add `ORIGIN` to the environment-variables page now, since its absence is fatal at start.

## Info

### IN-01: The freeze checker accepts a baseline whose version is not `00001`

**File:** `scripts/assert-schema-migration-parity.mjs:327`
**Issue:** The header (lines 25-28) promises versions "counting up from the baseline's `00001`". But `baselineVersion` is whatever version the baseline file carries. A scratch manifest whose only entry is `00007_initial_schema.sql` returns no finding. The real manifest is pinned by the gate test (`schemaMigrationFreezeGate.test.ts:166`), so this is a gap in the rule set, not a live fault.
**Fix:** Add a `baseline-version` rule with a fixture: `MIGRATION_NAME_RE.exec(baseline.file)?.[1] !== '00001'` gives `BAD NAME`, or a new kind.

### IN-02: The checker never validates the shape of `sha256`

**File:** `scripts/assert-schema-migration-parity.mjs:249, 383`
**Issue:** The documented shape is 64 lower-case hex characters (line 177), but only `typeof === 'string'` is checked. A hash pasted in upper case (some `shasum` front-ends print it that way) or truncated is reported as `EDITED FROZEN MIGRATION` with the remedy "Restore the file from git". That sends the developer to the wrong fix.
**Fix:** In the `migrations-array` rule, require `/^[0-9a-f]{64}$/` and report it as `MALFORMED MANIFEST`.

### IN-03: No supported deployment path supplies `BUILD_SHA`

**File:** `apps/frontend/Dockerfile:50-52`, `render.example.yaml`, `.github/workflows/main.yaml:199`
**Issue:** CI's `docker build` passes no `--build-arg BUILD_SHA`, and the Render blueprint declares none. So `/api/health` `build` and `/_app/version.json` hold a timestamp in every real deployment. The commit id appears only in the proxy check.
**Fix:** In CI, pass `--build-arg BUILD_SHA=${{ github.sha }}`. In the Render blueprint, document a `BUILD_SHA` env var, which Render exposes as a build argument.

### IN-04: `check-seed.sql` gives the same exit status for "seed data found" and "the check could not run"

**File:** `infra/scripts/check-seed.sql:15-18`
**Issue:** Status 3 covers both a finding and any other SQL error, for example missing privilege on `auth.users`. The sibling shell checks all promise that "the caller must be able to branch on the status alone". The check fails closed, so this is safe, but a pipeline step in phase 187 cannot tell the two apart without parsing stderr.
**Fix:** Document the `check-seed:` message prefix as the discriminator in the wrapper, or wrap the check in a shell script that maps the two outcomes to distinct statuses.

### IN-05: `DEPLOYMENT_DIAGNOSTICS` is in no template

**File:** `.env.example`, `render.example.yaml`, `docker-compose.dev.yml`
**Issue:** The switch appears only in `infra/local/docker-compose.proxy.yml` and the route's TSDoc. A deployer checking a proxy setup has no way to find it.
**Fix:** Add a commented `# DEPLOYMENT_DIAGNOSTICS=true` line, with a one-line warning to switch it off again, in the reverse-proxy section of `.env.example`.

### IN-06: In the Render blueprint, `ORIGIN` names the custom domain while the frontend URLs name the `onrender.com` host

**File:** `render.example.yaml:45-51`
**Issue:** With `ORIGIN=https://<INSTANCE_DOMAIN>`, every form post that arrives through the still-reachable `<INSTANCE_NAME>-frontend.onrender.com` host is refused 403 by kit's CSRF check. The two `PUBLIC_*_FRONTEND_URL` lines just above name that host. Nothing in the template says that the `onrender.com` host stops accepting logins.
**Fix:** Add a comment on the `ORIGIN` entry: the custom domain is then the only origin that accepts form posts. Otherwise, align the two placeholders.

### IN-07: Shell helpers duplicated across the four new scripts

**File:** `apps/supabase/scripts/isolated-instance.sh:79-101, 135-160, 244-266`, `apps/supabase/scripts/check-schema-equivalence.sh:103-136`, `infra/scripts/check-drift.sh:80-145`, `infra/local/check-proxy-topology.sh:106-128, 191-195`
**Issue:** `usage`, `fatal`, `usage_error`, `require_value`, `resolve_path`, `toml_value`, `port_has_listener` and `print_redacted` are copy-pasted, against the checklist's "no repeated code". WR-03 shows the drift this has already caused.
**Fix:** Move them into one sourced `infra/scripts/lib/common.sh`, or `apps/supabase/scripts/lib.sh`.

### IN-08: Historical wording in the parity guard

**File:** `scripts/assert-schema-migration-parity.mjs:607, 612`
**Issue:** The docblock says "Prints why `--write` no longer writes", and the user-facing message says "`--write` … no longer rewrites a migration". This describes past behaviour. Root `scripts/` is exempt from the Comment Hygiene gate, so this is not a violation, but the message reads as a changelog.
**Fix:** "`--write` (`yarn schema:regenerate`) never rewrites a migration: the baseline is frozen."

---

_Reviewed: 2026-10-21T07:07:45Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
