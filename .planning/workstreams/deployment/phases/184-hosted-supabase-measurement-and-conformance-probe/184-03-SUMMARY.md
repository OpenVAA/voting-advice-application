---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 03
subsystem: infra
tags: [supabase, conformance-probe, public-api, anon-key, psql, catalog, check-seed, vitest]

requires:
  - phase: 184-01
    provides: "probe entry, readExpected/ProbeInputError, collect/SourceError, CHECKS/runChecks/pasteSafe"
  - phase: 184-02
    provides: "the thirteen management checks, getJson options, correctResponses()/batchedBreak() spec fixtures"
provides:
  - "The public source (SUPABASE_ANON_KEY only; refuses sb_secret_ and service_role JWTs before any request)"
  - "The catalog source (PG* target guard before psql, one catalog query, rolbypassrls refusal, check-seed.sql subprocess)"
  - "Management read of /storage/buckets (bucket source ruled management-api)"
  - "Nine checks: auth.public-settings, rows.read-whole, functions.served, functions.identity-callback-unverified, storage.buckets, db.hook-functions, db.anon-timeout, db.postgres-major, no-seed (22 in all)"
  - "readExpected: publicProjectId, projectUrl, buckets, anonTimeout, postgresMajor, hookFunctions"
  - "Spec: public-API stub under PROBE_PROJECT_URL, a fake psql, the twenty-two-check batched break"
affects: [184-09, 184-17, 184-18, 184-19, 184-23]

tech-stack:
  added: []
  patterns:
    - "A function's answer is kept as its status and a body kind (method-not-allowed, internal-server-error, status-object, other, not-json); no body of the public source is kept"
    - "Catalog connection only through the PG* environment; SUPABASE_* variables are not passed on to psql"
    - "A source's preflight may cache its answer in the context for its read (the catalog query)"
    - "Spec repositories are built by withRepo(files, body) from copies of the tracked inputs"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/184-03-SUMMARY.md
  modified:
    - infra/scripts/probe-hosted.mjs
    - infra/scripts/probe/expected.mjs
    - infra/scripts/probe/sources.mjs
    - infra/scripts/probe/checks.mjs
    - infra/scripts/probe-hosted.test.ts

key-decisions:
  - "Bucket source: management-api (GET /v1/projects/{ref}/storage/buckets), ruled by the operator 2026-10-26"
  - "A root without public_project_id reads as null; the public source then refuses to run (COULD NOT RUN public) instead of failing readExpected, so the staging root still reads for the other checks"
  - "PROBE_PROJECT_URL is applied in the public source, like PROBE_MANAGEMENT_API_URL, so readExpected stays file-only"
  - "The catalog preflight is the catalog query itself; a role that is neither superuser nor rolbypassrls is exit 2"
  - "The catalog guard also refuses PGHOSTADDR and PGSERVICE, as check-drift.sh does"

patterns-established:
  - "Twenty-two checks in registry order: 13 management, 4 public, storage.buckets (management), 4 catalog"

requirements-completed: []

coverage:
  - id: D1
    description: "The public source refuses an unset key, an sb_secret_ key, a service_role JWT and a JWT whose payload cannot be read, with exit 2 and no request to any source"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#exits 2 with COULD NOT RUN public and no request when SUPABASE_ANON_KEY is a service-role JWT, a secret key or an unreadable JWT"
        status: pass
    human_judgment: false
  - id: D2
    description: "rows.read-whole passes only for a whole read of more than 1000 rows; 0-499/1510 is a truncation naming 500 and 1510, */0 says the project may be closed, 900 rows says more than 1000 are needed"
    requirement: "OBS-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#the public-API checks and the bucket check"
        status: pass
    human_judgment: false
  - id: D3
    description: "functions.served and functions.identity-callback-unverified tell the function's own bodies from a gateway's answer"
    requirement: "SUPA-06"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#fails only functions.identity-callback-unverified when both calls answer 401"
        status: pass
    human_judgment: false
  - id: D4
    description: "storage.buckets compares the served bucket ids and public flags with the config.toml tables"
    requirement: "SUPA-04"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#fails only storage.buckets naming private-assets when it is absent"
        status: pass
    human_judgment: false
  - id: D5
    description: "The catalog source refuses PGPORT 6543, another ref's host, a pooler user of another ref, PGHOSTADDR and PGSERVICE before psql runs, and a role without row-level-security bypass after the catalog query"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#exits 2 before psql is called or any request is made when the PG* variables name another connection"
        status: pass
    human_judgment: false
  - id: D6
    description: "no-seed runs check-seed.sql as a subprocess; exit 3 fails only no-seed naming the classes, with no address or URL in the output; exit 2 is COULD NOT RUN catalog"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#exits 1 with only no-seed failing when check-seed reports a seed user, printing no address or URL"
        status: pass
    human_judgment: false
  - id: D7
    description: "The batched break fails all twenty-two checks through the spawned entry, each with its marker, no COULD NOT RUN line, every line paste-safe"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#runs the batched break to exit 1 with one FAIL line per check, no COULD NOT RUN and every line paste-safe"
        status: pass
    human_judgment: false

actuals:
  tokens: 23400
  tasks: 3
  commits: 4
plan_head_before: 23ea70c8410aed1d1368192d8936a375423226e8
plan_head_after: 972093e8404c2a4be69323f86e0284777acc8721

duration: 14min
completed: 2026-10-26
status: complete
---

# Phase 184 Plan 03: Public-API and catalog sources of the conformance probe Summary

**The probe now has twenty-two checks over three sources, which covers every item of D-15:**

- the Management API (thirteen checks, plus `storage.buckets`);
- the public API, read with the anon key only; a secret key or a `service_role` JWT is refused before any request;
- the catalog, read over psql through the PG* variables. A connection to another project, to port 6543, or as a role without row-level-security bypass is refused.

`no-seed` runs `infra/scripts/check-seed.sql` as a subprocess and keeps only its finding classes. A batched fixture fails all twenty-two checks, each by its own planted cause.

## Task 1 ruling

- **Bucket source: `management-api`.** The buckets are read with `GET /v1/projects/{ref}/storage/buckets`. Ruled by the operator on 2026-10-26 (via the orchestrator), so no checkpoint was returned.
- The endpoint's body shape was not read during research. The reader keeps `id` (or `name` when an entry has no `id`) and `public`. The first green run on the throwaway (184-17) confirms the shape.

## The twenty-two checks in registry order (for the runbook, 184-09, and the live runs)

| # | Check | Source | Planted value (batched break) | Marker the finding holds |
|---|-------|--------|-------------------------------|--------------------------|
| 1 | `api.max-rows` | management | `max_rows` 500 | `500` |
| 2 | `auth.access-token-hook` | management | `hook_custom_access_token_enabled` false | `hook_custom_access_token_enabled is false` |
| 3 | `auth.send-email-hook` | management | `hook_send_email_enabled` false | `hook_send_email_enabled is false` |
| 4 | `auth.site-url` | management | `site_url` `https://planted.invalid` | `planted.invalid` |
| 5 | `auth.redirects` | management | `uri_allow_list` with only the first entry | `1 entry` |
| 6 | `auth.signup-closed` | management | `disable_signup` false | `disable_signup is false` |
| 7 | `auth.email-confirm` | management | `mailer_autoconfirm` true | `mailer_autoconfirm is true` |
| 8 | `auth.smtp` | management | `smtp_port` "2465" | `2465` |
| 9 | `auth.oauth-server` | management | both oauth flags true | `oauth_server_enabled is true` |
| 10 | `auth.other-settings` | management | `password_min_length` 12 | `password_min_length is 12` |
| 11 | `api.schemas` | management | `db_schema` "public" | `db_schema is "public"` |
| 12 | `functions.deployed` | management | `send-email` deleted | `send-email` |
| 13 | `functions.verify-jwt` | management | `identity-callback` with `verify_jwt` true | `identity-callback` |
| 14 | `auth.public-settings` | public | anon `/auth/v1/settings`: `disable_signup` false, `mailer_autoconfirm` true (the same settings fault) | `disable_signup is false` |
| 15 | `rows.read-whole` | public | the `max_rows` 500 fault: `Content-Range 0-499/1510`, 500 rows | `0-499/1510` |
| 16 | `functions.served` | public | `send-email` deleted: the gateway answers 404 | `send-email answered 404` |
| 17 | `functions.identity-callback-unverified` | public | `verify_jwt` true: the gateway answers 401 to both calls | `answered 401` |
| 18 | `storage.buckets` | management | `private-assets` deleted | `private-assets` |
| 19 | `db.hook-functions` | catalog | `public.custom_access_token_hook(jsonb)` renamed | `public.custom_access_token_hook(jsonb)` |
| 20 | `db.anon-timeout` | catalog | `ALTER ROLE anon SET statement_timeout = '3s'` | `3s` |
| 21 | `db.postgres-major` | catalog | server 16 in the fixture. On a live project this cannot be planted; the red run overrides `[db] major_version` on the expected side, uncommitted | `16` |
| 22 | `no-seed` | catalog | a user `planted@openvaa.test` (check-seed exit 3) | `seed user` |

Example finding forms:

- `the nominations read returned rows 0-499 of 1510 (Content-Range 0-499/1510): 500 of 1510 rows, truncated by a page limit`
- `no nominations of the root's public_project_id are readable with the anon key (Content-Range */0): the project may be closed for voters, or hold no nominations`
- `send-email answered 404 with another body than the function writes, expected 405 with its own method-not-allowed body`
- `not served: private-assets`
- `the anon role's statement_timeout is "3s", expected "8s" from the last ALTER ROLE anon of the migrations`
- `check-seed reported 1 finding(s) of the local seed: seed user`

## Environment variables the probe reads

| Variable | Source | Role |
|----------|--------|------|
| `SUPABASE_ACCESS_TOKEN` | management | Management API bearer token. Never printed. |
| `SUPABASE_ANON_KEY` | public | Anon key, sent as `apikey`, and also as `Authorization: Bearer` except to `identity-callback`. A value beginning `sb_secret_`, a JWT with role `service_role`, or a JWT whose payload cannot be read is refused. |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, `PGPASSWORD` or a password file | catalog | Read by psql alone. The probe checks `PGHOST`/`PGUSER`/`PGPORT` against the root's ref and refuses `PGHOSTADDR`/`PGSERVICE`. `PGCONNECT_TIMEOUT` defaults to 15. |
| `PROBE_MANAGEMENT_API_URL` | management | Test seam. Default `https://api.supabase.com`. |
| `PROBE_PROJECT_URL` | public | Test seam. Default `https://<ref>.supabase.co`. |
| `PROBE_PSQL` | catalog | Test seam. Default `psql` on PATH. |

The root's `terraform.tfvars` must set `public_project_id`. Without it the public source cannot run.

## Task Commits

1. **Task 1: Where the probe reads the buckets.** Ruled `management-api` (operator, 2026-10-26). No commit; the decision is recorded here.
2. **Task 2: The public source and its checks, and the bucket check**
   - RED `257c4a26c` (test)
   - GREEN `8feaa101e` (feat)
3. **Task 3: The catalog source, its checks, the seed check, and the full batched break**
   - RED `42ef7c726` (test)
   - GREEN `972093e84` (feat)

## TDD Gate Compliance

- **Task 2 RED**
  - Command: `node_modules/.bin/vitest run --config infra/vitest.config.ts --reporter=tap-flat -t "reads the root.s public project id"`, exit 1.
  - Target: `readExpected > reads the root's public project id, the project's own address and the buckets of config.toml`.
  - Classifier: `RED_EVIDENCE_OK` (`target_test_failed`).
  - Semantic assessment: the target ran and failed on `expected undefined to be '00000000-0000-0000-0000-000000000001'`. That is the planned missing `publicProjectId`, not a load or fixture fault. Committed before any production edit.
- **Task 3 RED**
  - Command: `... -t "reads the anon timeout, the Postgres major"`, exit 1.
  - Target: `readExpected > reads the anon timeout, the Postgres major and the hook functions' signatures`.
  - Classifier: `RED_EVIDENCE_OK`.
  - Semantic assessment: it failed on `expected undefined to be '8s'`, the planned missing `anonTimeout`. Committed before any production edit.
- The RED records are in the session scratchpad and are not committed.
- No REFACTOR commits were needed.

## Decisions Made

- **Bucket source.** Read through the Management API, as ruled (see "Task 1 ruling").
- **A root without `public_project_id`.**
  - `readExpected` records it as null and refuses only a malformed value. The public source then stops with `COULD NOT RUN public: the root's terraform.tfvars sets no public_project_id, ...` before any request.
  - So the staging root, which does not yet set the variable, still reads for the spec cases that use it. A live staging run is exit 2 until the variable is set.
- **`PROBE_PROJECT_URL`.** The override is applied in the public source, as `PROBE_MANAGEMENT_API_URL` is in the management source. `readExpected` carries only `https://<ref>.supabase.co` and stays file-only.
- **Function answers.** Each answer is reduced to its status and a body kind, so no function or gateway body is kept.
- **The catalog preflight is the catalog query itself.** Its answer is cached for the read.
  - The bypass test is `rolsuper OR rolbypassrls`, because a superuser also bypasses row-level security.
  - The query string contains `rolbypassrls`, which the grep gate looks for.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The catalog guard also refuses `PGHOSTADDR` and `PGSERVICE`**
- **Found during:** Task 3
- **Issue:** Either variable can send psql to another address than `PGHOST`. That would defeat the ref check (T-184-08). `check-drift.sh` refuses both for the same reason.
- **Fix:** Both are refused in setup, before psql runs. Spec cases were added.
- **Commit:** `972093e84`

**2. [Rule 2 - Missing critical] Further hardening**
- **Found during:** Tasks 2 and 3
- **Changes:**
  - psql gets `PGCONNECT_TIMEOUT` 15 by default and a 120 s run limit, so a silent host cannot hang the probe.
  - The `SUPABASE_*` variables are not passed to psql.
  - A JWT-shaped anon key whose payload cannot be decoded is refused, because its role cannot be checked.
  - The catalog query re-validates each hook signature before writing it into SQL. This adds to the T-184-10 check in `readExpected`.
- **Commits:** `8feaa101e`, `972093e84`

**3. [Rule 3 - Blocking] `public_project_id` is optional in `readExpected`**
- **Found during:** Task 2
- **Issue:** The staging root does not yet set `public_project_id`; a later plan adds it. Requiring it in `readExpected` would have broken every spec case that reads the staging root.
- **Fix:** Null when absent; the public source refuses to run (see Decisions Made).
- **Commit:** `8feaa101e`

**4. [Rule 3 - Blocking] The spec's temporary repositories carry the new inputs**
- **Issue:** `readExpected` now also reads the migrations directory and `[db]`/`[storage.buckets.*]` from config.toml, so the two hand-built test repositories could no longer be read.
- **Fix:** A `withRepo(files, body)` helper copies the tracked inputs and applies the overrides. The `verify_jwt` case's handwritten config gained `[db] major_version` and a bucket table.
- **Commits:** `8feaa101e`, `42ef7c726`

**5. [Rule 1 - Bug] A `*/0` inside a block comment**
- **Issue:** Writing the literal `*/0` in the entry header would have ended the comment early.
- **Fix:** The header was reworded before commit. The literal stays only in a string.
- **Commit:** `8feaa101e`

**Total deviations:** 5 auto-fixed (2 missing critical, 2 blocking, 1 bug).
**Impact on plan:** None on the named interfaces. The changes are additive guards and fixture plumbing.

## Deferred to orchestrator (stack busy)

- Full `yarn test:unit` was not run, under the shared-stack rule. The plan's gates are the infra Vitest suite and the registry check, and both are green. This plan touches only `infra/scripts/probe*`, which `yarn test:unit` reaches through `test:unit:infra`.

## Live-run notes (184-17 to 184-19, 184-23)

- **Staging root.** It must set `public_project_id` (ruled `canonical`, `00000000-0000-0000-0000-000000000001`) before a probe run, or the run is `COULD NOT RUN public`.
- **Content of the bucket list.** The body shape of `/storage/buckets` is unverified. The first green run confirms it, or gives `COULD NOT RUN management: GET .../storage/buckets answered 200 without public` (or `without id or name`).
- **`functions.served` and the key format.** `send-email` is called with `Authorization: Bearer <anon key>` (the frontend's shape) while it keeps `verify_jwt = true`. If the operator's anon key is a publishable key (`sb_publishable_`) and the gateway refuses it as a bearer token, that check fails with a 401. That is OBS-03/D-09's measurement, not a probe fault.
- **Catalog role.** It must bypass row-level security, or the run is exit 2 naming row-level security. Which role is ruled in 184-17.
- **Red control for `db.postgres-major`.** It needs the uncommitted `[db] major_version = 16` override on the expected side (RESEARCH Open Question 4).

## Verification

- `node_modules/.bin/vitest run --config infra/vitest.config.ts`: exit 0, 96 passed (57 before this plan).
- Registry check (`node --input-type=module -e "... CHECKS ..."`): exit 0. The registry holds 22 distinct names, and no name ends in a secret word.
- `eslint` over `infra/scripts/probe`, `probe-hosted.mjs` and `probe-hosted.test.ts`: exit 0.
- `prettier --check` over the same files: clean.
- Acceptance greps:
  - public/bucket check names in `checks.mjs`: 5;
  - `sb_secret_` in `sources.mjs`: 3;
  - `count=exact` in `sources.mjs`: 2;
  - catalog check names in `checks.mjs`: 4;
  - `6543` in `sources.mjs`: 4;
  - `rolbypassrls` in `sources.mjs`: 2;
  - `PROBE_PSQL` in `sources.mjs`: 2;
  - `check-seed.sql` in `sources.mjs`: 2;
  - `statement_timeout` in `expected.mjs`: 5;
  - `PROBE_PROJECT_URL` in the spec: 3.
- The spec's batched-break case asserts 22 FAIL lines and exit 1, each line holding its marker, and no `COULD NOT RUN` line.
- Comment-hygiene scan of the added lines: no planning references and no history narrative.

## Known Stubs

None.

## Threat Flags

None. The new surface (two POSTs to Edge Functions, a psql subprocess) is the plan's own and is covered by T-184-07 to T-184-11.

## User Setup Required

None now. The live runs need the operator's `SUPABASE_ANON_KEY` and PG* connection; those are later plans.

---
*Phase: 184-hosted-supabase-measurement-and-conformance-probe*
*Completed: 2026-10-26*

## Self-Check: PASSED

All five modified files and this SUMMARY exist; commits 257c4a26c, 8feaa101e, 42ef7c726 and 972093e84 are ancestors of HEAD. requirements-completed is empty, as in 184-01 and 184-02: SUPA-04, SUPA-06 and OBS-07 are proven by the live runs, not by this plan.
