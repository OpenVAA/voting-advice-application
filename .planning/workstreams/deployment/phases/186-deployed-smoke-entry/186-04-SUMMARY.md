---
phase: 186-deployed-smoke-entry
plan: "04"
subsystem: database
tags: [supabase, psql, grants, staging-runbook, keychain, deployed-smoke]
status: complete

requires:
  - phase: 184-hosted-supabase-measurement-and-conformance-probe
    provides: "infra/scripts/grant-project-admin.sql (the skeleton), the isolated-instance driver pattern of 184-09, Steps 15/20/21/23 of the staging runbook"
provides:
  - "infra/scripts/grant-smoke-contestant.sql: the SQL half of the one hosted write (candidate-editor grant on the lowest nominated smoke_ candidate + terms-of-use acceptance), proven on an isolated database"
  - "Step 22 items 3-13 of infra/envs/staging/supabase/README.md: the contestant's creation sitting, and its removal"
  - "evidence/186-04-grant-script.md: every outcome of the SQL, statuses read directly, and the cascade"
affects: [186-05, 186-06, 186-08 hosted sitting, tests/README.md Deployed smoke run]

actuals:
  tokens: 7247
  tasks: 2
  commits: 2
plan_head_before: f943b2a5688468dd3b8a32bf629b62f18c6900be
plan_head_after: 5bc1e32d52b6bd6a5ae0466607fd08fac2d4f89a

tech-stack:
  added: []
  patterns:
    - "Every secret-bearing request header goes into a umask-077 header file in $L and reaches curl as -H @file, so neither the service-role key nor the user's access token is in curl's arguments"
    - "Keychain writes through `security -i` with the command on standard input from the printf builtin; checked on a throwaway service before anything hosted is written"

key-files:
  created:
    - infra/scripts/grant-smoke-contestant.sql
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-04-grant-script.md
  modified:
    - .prettierignore
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "grant-smoke-contestant.sql checks 'the user holds another grant' before 'another user already edits the candidate', so each refusal is seen with its own message; the plan named both without an order"
  - "The chosen candidate row is locked FOR UPDATE until the commit, and the order is COLLATE \"C\" so the choice does not depend on the database's collation"
  - "The runbook's service-role key and contestant token travel in header files (curl -H @file), stricter than Step 21's argv headers; the public anon key stays on the command line as elsewhere in the runbook"
  - "SUPA-09 stays Pending: it is met only by the hosted run of 186-08"

patterns-established:
  - "Contestant sitting records begin s22c_; a refusal at items 3, 4 or 6 stops the sitting with nothing hosted written; after item 8 a stop means removal then a restart at item 3"

requirements-completed: []

coverage:
  - id: D1
    description: "grant-smoke-contestant.sql writes exactly the two rows once and refuses every wrong case with status 3"
    requirement: SUPA-09
    verification:
      - kind: integration
        ref: "tmp/186-04/driver.sh on isolated instance grant186; evidence/186-04-grant-script.md"
        status: pass
  - id: D2
    description: "Step 22 runbook items for the contestant's creation and removal, formatted and wrapped, no address added"
    requirement: SUPA-09
    verification:
      - kind: other
        ref: "prettier --check + the plan's anchor grep and the Step 22 80-column awk check"
        status: pass

duration: 8min
completed: 2026-11-14
---

# Phase 186 Plan 04: The smoke contestant's grant script and runbook item Summary

**A psql grant script that gives one existing user the editor grant on the lowest nominated `smoke_` candidate and the terms-of-use acceptance, idempotent and refusing every wrong case with status 3, proven on an isolated database; and the Step 22 runbook items that create the contestant through the Auth Admin API from the keychain and remove it again.**

## The record (isolated database, 2026-11-14 22:53Z)

```
GRANT_UNSET_EXIT=3
GRANT_UNKNOWN_EXIT=3
GRANT_FIRST_EXIT=0
GRANT_FIRST_CANDIDATE=smoke_cand_0001
GRANT_FIRST_GRANTS=1
GRANT_FIRST_TERMS=1
GRANT_SECOND_EXIT=0
GRANT_CASE_EXIT=0
GRANT_OTHER_EDITOR_EXIT=3
GRANT_OTHER_GRANT_EXIT=3
GRANT_NO_PROJECT_EXIT=3
GRANT_BAD_ID_EXIT=3
GRANT_CASCADE_GRANTS=0
GRANT_CASCADE_TERMS=0
ISO_LIST_AFTER=empty
```

Also seen once each: whitespace-only address (3), `PUBLIC_PROJECT_ID` unset (3), two users whose addresses differ only in case (3), a project whose only `smoke_` candidate has no nomination (3), and B holding no acceptance after its refused run. `smoke_cand_0000` existed without a nomination and `smoke_cand_0001` was granted. No standard error line holds an address.

## Performance

- **Duration:** about 8 min
- **Completed:** 2026-11-14 (UTC)
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `infra/scripts/grant-smoke-contestant.sql` on the skeleton of `grant-project-admin.sql`: env-only inputs (`\unset` then `\getenv`), the address only ever a bound parameter, `log_parameter_max_length_on_error = 0`, one transaction with seven refusals, `ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING` and `ON CONFLICT (user_id, project_id) DO NOTHING`, output `candidate=`/`grants=`/`terms=`.
- The proof on `isolated-instance.sh --name grant186 --port-base 56500`, driver under `tmp/186-04/` with an EXIT trap; the shared stack untouched; instance gone afterwards.
- Step 22 items 3-13 (ref check, credential unset, keychain method check, operator's address entry, address read + `s22c_users_before=0`, password `s22c_password_length=43`, Auth Admin creation, grant, sign-in/claims/sign-out, keychain store, seed check) and a five-item "Removing the contestant" procedure; the flow overview line names the contestant.

## Task Commits

1. **Task 1: The grant SQL, proven on an isolated database** — `31d336713` (feat)
2. **Task 2: The contestant's creation and removal in Step 22** — `5bc1e32d5` (docs)

## Files Created/Modified

- `infra/scripts/grant-smoke-contestant.sql` — the grant script
- `.prettierignore` — names it under "--- psql scripts ---"
- `infra/envs/staging/supabase/README.md` — Step 22 items and the removal; overview line
- `.planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-04-grant-script.md` — the evidence

## Decisions Made

See `key-decisions` above. The ones that reach beyond the plan's text: the refusal order (other grant before other editor), the `FOR UPDATE` lock on the chosen candidate, and the header-file form of the secret-bearing curl headers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Secret headers kept out of curl's arguments**
- **Found during:** Task 2
- **Issue:** The research's creation command and Step 21's pattern pass the service-role key as `-H "apikey: $KEY"`, and the sign-out needs the access token in a header. Both would be in the process list, against T-186-10/T-186-13's intent.
- **Fix:** The runbook writes both into umask-077 header files in `$L` with the `printf`/`jq` builtins-and-files route and calls `curl -H @file`; the token file is deleted right after the sign-out.
- **Files modified:** infra/envs/staging/supabase/README.md
- **Commit:** 5bc1e32d5

**2. [Rule 2] Extra refusals proven**
- **Found during:** Task 1
- **Issue:** The truths list "every one of those outcomes was seen once", which includes the more-than-one-user and no-nominated-candidate refusals that the plan's run list omitted.
- **Fix:** The driver added a twin-address run, a second project with an un-nominated candidate, a whitespace-only run and a project-unset run; recorded as extra lines in the evidence.
- **Commit:** 31d336713

**3. [Rule 1] Refusal order chosen so each message is distinct**
- With "another editor" checked first, the administrator C would have been refused for the wrong reason (A already edits the candidate). "Holds another grant" is checked first.
- **Commit:** 31d336713

Not run (by design): the keychain method check of item 4 touches the operator's login keychain and is the first item of the 186-08 sitting; it was not run here. The psql heredocs of items 6 and removal 1/3 were dry-run read-only against the shared local database (`s22c_users_before=0`, `s22c_rows_after=0,0`), and the `acct` sed against a sample of `security`'s output format.

## Issues Encountered

None.

## Next Phase Readiness

The hosted sitting (186-08) has its committed procedure: Step 22 items 3-13 with `R=staging`, the operator first storing the address under `openvaa-staging-smoke-contestant` (item 5). Expected hosted readback: `s22c_candidate=smoke_cand_0000`, `s22c_grants=1`, `s22c_terms=1`, `s22c_signin_http=200`, `s22c_logout_http=204`. Nothing hosted was written by this plan.

## Self-Check: PASSED

- FOUND: infra/scripts/grant-smoke-contestant.sql
- FOUND: .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-04-grant-script.md
- FOUND: 31d336713, 5bc1e32d5 (ancestors of HEAD)
