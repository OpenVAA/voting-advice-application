---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 18
subsystem: infra
tags: [infra, supabase, hosted, throwaway, conformance-probe, fault-injection, account-access, gateway, observations]
status: complete

requires:
  - "184-17: CATALOG_ROLE=postgres and the throwaway's green probe run (22 PASS, exit 0)"
  - "184-16: the request-link call with a witness, the stale-read replan rule, and the fact that function logs are a dashboard read (the Management API logs endpoint answers 410)"
  - "184-07: infra/envs/scratch/supabase/faults.tf (fault_set none|redirect|all)"
provides:
  - "MAJOR_RED=expectation-override (ruled by the operator 2026-11-11): db.postgres-major fails against an expectation of 16 set in the working tree for the run only"
  - "CHECK_KEY=no-key (ruled by the operator 2026-11-11): functions.identity-callback-unverified calls identity-callback with no apikey and no Authorization"
  - "The batched break planted on the throwaway and left in place for 184-19"
  - "Every one of the probe's 22 checks seen failing by its own planted fault: 21 in the red run, and functions.identity-callback-unverified in the rerun with the keyless calls"
  - "OBS-05's two refusing branches of account-access seen on the served function, each with a not-sent witness"
  - "Measured: the hosted gateway enforces a verify_jwt set by the metadata PATCH, and a publishable key in apikey alone passes its JWT check"
  - "Measured: the provider refreshes the module's settings resource from the served values, so a planted value shows as drift of module.supabase.supabase_settings.this"
affects: [184-19, 184-20, 184-22]

actuals:
  tokens: 18200
  tasks: 3
  commits: 4
plan_head_before: d6769ac3b26b8ec861bf8d1fc0b4a442e4c22504
plan_head_after: c62f4d30b1be22044aa73cf41be97f2e0949f173

tech-stack:
  added: []
  patterns:
    - "A tracked-file override for a single run, made and reverted inside one script by an EXIT trap, then checked with git diff --quiet"
    - "Fault-plan rule lines compared as sorted sets; a variant line set is accepted only under a named argument the operator rules on"
    - "A probe check whose red did not appear gets a discriminating measurement in isolation before the check is changed"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-18-throwaway-break-red.md
  modified:
    - infra/scripts/probe/sources.mjs
    - infra/scripts/probe/checks.mjs
    - infra/scripts/probe-hosted.mjs
    - infra/scripts/probe-hosted.test.ts
    - infra/README.md
    - infra/envs/staging/supabase/README.md
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "MAJOR_RED=expectation-override, ruled by the operator on 2026-11-11 via the orchestrator (the plan's recommended option)"
  - "The rule lines of item 2 widened to module-refresh, ruled by the operator on 2026-11-11: exactly the module settings resource and the fault resource updated in place, Plan: 0 to add, 2 to change"
  - "CHECK_KEY=no-key, ruled by the operator on 2026-11-11 after the key discriminator: the identity-callback calls carry no key, as the identity provider's browser redirect does"
  - "SUPA-07 is complete: each check was seen failing once against the deliberately broken throwaway, across the red run and the rerun of the corrected check on the same broken state"
  - "OBS-05 is complete: both refusing branches are seen here and the slot release was seen in 184-16"

requirements-completed: [SUPA-07, OBS-05]

duration: about 2 h 30 min from the Task 2 attempt id (10:20:34Z) to the record; the sitting ran 10:37:10Z to about 11:13Z, the discriminator at 12:33:48Z and the rerun at 12:38:56Z
completed: 2026-11-11
---

# Phase 184 Plan 18: The batched break of the throwaway, the probe's red run and both refusals Summary

**Every one of the probe's 22 checks has been seen failing by its own planted fault on the deliberately broken throwaway, across two runs.**
- **The red run** (11:12:08Z) failed 21 checks. Each finding named its fault, and none was a cascade.
- **The rerun** (12:38:56Z) covered `functions.identity-callback-unverified`, which had passed in the red run. A publishable key in `apikey` passes the gateway's JWT check. After the operator ruled `CHECK_KEY=no-key`, the check calls with no key, and in the rerun it failed with 401 on both calls.
- **The refusals:** both refusals of `account-access` were seen, each with a `not-sent` witness.
- **Requirements:** SUPA-07 and OBS-05 are complete.

**Faults left in place for 184-19 to revert:**
- `supabase_settings.faults[0]` at `fault_set=all`: the site URL and redirect list on `planted.invalid`, both hooks off, sign-up open, autoconfirm on, SMTP port `2465`, the OAuth server on, `password_min_length` 12, `max_rows` 500 and `db_schema` `public`. The module settings resource plans an in-place update.
- The `private-assets` bucket is deleted.
- The `send-email` function is deleted.
- `identity-callback` is listed with `verify_jwt` true.
- `public.custom_access_token_hook(jsonb)` is renamed to `custom_access_token_hook_planted`.
- `anon` has `statement_timeout` `3s`.
- One user in the `openvaa.test` domain exists.

The working tree's `config.toml` is unchanged.

## Performance

- **Sittings:** all on 2026-11-11 (UTC):
  - the break, from 10:37:10Z to about 11:13Z;
  - the key discriminator at 12:33:48Z;
  - the rerun at 12:38:56Z.

  The orchestrator ran each one under the operator's authorisation of 2026-11-10, with credentials from the operator's keychain. The operator did the two dashboard blocks. The executor held no credential.
- **Tasks:** 3 of 3, plus the follow-up for the check that passed.
- **Files modified in the repository:** 9.

## Accomplishments

- **Task 1:** `MAJOR_RED=expectation-override`, ruled by the operator on 2026-11-11.
- **Task 2, the sitting.** Eleven scripts (`184-18/00-start.sh` to `10-cleanup.sh`), all with exit 0:
  - **The redirect fault:**
    - The plan matched the exact rule and was applied.
    - The served site URL read as planted after 20 s, and the auth service refused the function's callback.
    - After a redeploy, a request-link gave `s1_witness=not-sent`, and the operator saw the redirect-allowlist log line.
  - **Every settings fault** was applied under the `module-refresh` rule and read back as planted.
  - **The other plants:** `send-email` deleted; `identity-callback` PATCHed to `verify_jwt` true; the hook function renamed; `anon` at 3 s; the bucket deleted and the user added in the dashboard.
  - **The probe** ran under the override: 21 FAIL and 1 PASS. The trap reverted the override.
  - **The sign-up refusal:** with sign-up open, `s9_witness=not-sent`, and the operator saw the sign-up log line.
- **Task 3:**
  - The reply was stored and `bound`, and the check attempt is `184-18-3`.
  - The evidence was written whole from the attempt files.
  - The runbook gained its Observations rows.
- **The follow-up for `functions.identity-callback-unverified`:**
  - **The discriminator:** the legacy anon key in `apikey` got 401, no header got 401, and the publishable key in `apikey` got 405. That confirms cause 1 in isolation and rules out cause 2.
  - **The ruling:** `CHECK_KEY=no-key`.
  - **The code change:** the two calls carry no key (`sources.mjs`), the spec asserts that, and the finding says "with no key". The offline spec passed 96 of 96, with the access token unset and the proxy on a closed local port. Prettier and ESLint are clean.
  - **The rerun** on the same broken state: `s2_unverified_check=FAIL` with `answered 401` on GET and POST.
  - **Records closed:** the reply is stored under `184-18-4`; the STATE blocker is resolved; WINDOWS entry 290 is marked fixed; the deferred item is marked resolved; the runbook's "Not yet observed" row is now an Observations row.

## Task Commits

1. **Tasks 1 to 3: the rulings, the red run, the refusals and the runbook rows:** `19a2d09e8` (docs)
2. **Plan metadata of the first completion:** `5b29b1187` (docs)
3. **The keyless identity-callback calls, the spec, Step 23 and the guards row:** `3b317c101` (fix)
4. **The finding's wording for the keyless call shape:** `c62f4d30b` (fix)

## Decisions Made

See `key-decisions`. All three rulings came from the operator on 2026-11-11, via the orchestrator.

## Deviations from Plan

**1. [Orchestrator direction] The major-version override was made inside the probe script**
- The plan had the executor edit `config.toml` before the checkpoint.
- Instead, script 08 made the one-line edit, ran the probe and reverted the file by an EXIT trap.
- Task 3's `git checkout` was a no-op check: `git diff --quiet` was 0.

**2. [Rule 3 - Blocking, ruled] The rule lines of item 2**
- After the redirect fault, the replan showed `module.supabase.supabase_settings.this` updated in place. The plan's only allowed line set could not occur.
- A named `module-refresh` rule allowed exactly the two resources updated in place, on the operator's ruling.

**3. [Rule 1 - Bug, ruled] `functions.identity-callback-unverified` could not fail with the ruled key**
- **Found during:** Task 3
- **Issue:** a publishable key in `apikey` passes the gateway's JWT check, so the check passed against a `verify_jwt` function. This was measured in isolation.
- **Fix:** under `CHECK_KEY=no-key`, the two calls carry no key, and the verdict is unchanged. A rerun on the same broken state saw the check fail.
- **Files modified:** `infra/scripts/probe/sources.mjs`, `infra/scripts/probe/checks.mjs`, `infra/scripts/probe-hosted.mjs`, `infra/scripts/probe-hosted.test.ts`, `infra/README.md`, `infra/envs/staging/supabase/README.md`
- **Commits:** `3b317c101`, `c62f4d30b`

**4. The red run's 22-FAIL criterion is met across two runs, not one**
- The plan's Task 3 verify wants 22 FAIL lines in one run.
- The red run had 21 FAIL lines; its one PASS was the defective check.
- The rerun of the corrected check had 21 FAIL lines too, with only `db.postgres-major` passing, because that run had no override.
- Each check is therefore seen failing once against the broken throwaway, which is SUPA-07's wording. No single run shows all 22 at once.

**5. Smaller deviations**
- **Items 3 and 7** were done together in one operator block before the probe.
- **The delete command:** item 4 added `--workdir "$W" --yes`.
- **Waits:** the plants re-read their served values after at least 20 s, and the witnesses were polled instead of a flat 90 s wait.
- **The ruling's name in the attempt file:** the screen refused `answer_check_key=`, so the ruling was stored as `answer_check_shape=no-key`. The evidence names it `CHECK_KEY=no-key`.

## Issues Encountered

- **`auth.redirects` names its fault by count, not by value** ("holds 1 entry, expected the 2 …"). It fails by its own cause, but the marker the plan lists for it, `planted.invalid`, does not appear in its finding.

## Known Stubs

None.

## Threat Flags

None. The faults were planted on the throwaway only. Every script stops unless REF is `begckvkapaopoztbreqc`. The probe change removes a key from two requests and adds no surface. No credential, address or IP is in any record (leak scan clean).

## Next

- 184-19 reverts the break. Its revert should expect the module settings resource to show as drift of the planted values; the documented `-replace=module.supabase.supabase_settings.this` still applies.
- Its green run is the first under the keyless `identity-callback` calls. With `verify_jwt` false restored, the check should pass on the function's own 405 and 500.

## Self-Check: PASSED

- FOUND: `evidence/184-18-throwaway-break-red.md`
- FOUND as ancestors of HEAD: `19a2d09e8`, `5b29b1187`, `3b317c101`, `c62f4d30b`
- `git diff --quiet` on `apps/` and `config.toml`: 0
