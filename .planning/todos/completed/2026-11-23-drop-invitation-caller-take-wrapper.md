---
created: 2026-11-23
title: Drop the invitation_caller_take wrapper once every deployment runs the renamed functions
area: database
severity: minor
source: phase 189.1 close-out list (operator, 2026-11-22)
owner: a later database phase
files:
  - apps/supabase/supabase/migrations/00004_access_caller_limit.sql
completed: 2026-11-25
status: completed
---

## Problem

Migration `00004_access_caller_limit.sql` adds `public.access_caller_take` and keeps `public.invitation_caller_take` as a wrapper that returns what the new function returns, with the same privilege (the service role alone). The wrapper exists only for an `account-access` function deployed before the rename, which still calls the old name, and for a rollback to such a function. The migration says a later migration drops it.

## Done when

- Every deployment (staging and any other hosted project) runs Edge Functions that call `public.access_caller_take`, which is checked on each project and not assumed. A rollback past that point is no longer supported.
- A new migration drops `public.invitation_caller_take (uuid, text)`, and the pgTAP tests and `yarn db:lint:sql` pass on it.
- No function, test or script under `apps/` and `tests/` names `invitation_caller_take` any more.

## Closed (phase 189.1.1)

Closed by plans 189.1.1-09, 189.1.1-12 and 189.1.1-13, all in `.planning/workstreams/deployment/phases/189.1.1-address-tech-debt-the-consent-prompt-covers-an-answer-choice/`. The evidence files named below are in that phase's `evidence/`. The answers follow the three items of "Done when", in order.

### 1. Every deployment runs functions that call `access_caller_take`

- **Staging is the only hosted deployment,** and its functions were read on the project, not assumed (plan 189.1.1-13, `evidence/189.1.1-13-deploy.md`). Run 45586463676, on commit `be6fc2dd6`, deployed the three functions from the commit after it applied migration `00005`: `functions_deploy_exit=0`, `functions_list_http=200` and `functions_served=account-access identity-callback send-email`, each `ACTIVE`. The commit's `account-access` holds one caller-limit call, `createAdminClient().rpc('access_caller_take', {`, and no occurrence of the former name (`EXPECTED_FUNCTION_CALLS=access_caller_take`).
- **The limit was then seen in force on staging.** In attempt 2 of run 45601966922, on commit `30316b108`, the deployed smoke's caller-limit spec passed against a database without the wrapper: `A2_SMOKE_CALLER_LIMIT=passed`, `A2_caller_limit_admitted=30` and `A2_caller_limit_retry_after=574`. A function still calling the dropped name would have answered 500, not 429.
- **The premise "once every deployment runs the renamed functions" was replaced by a ruling.** Decision D-17 of the phase put the drop and the functions that call the new name in the same deploy, after staging's database was rebuilt from migrations `00001` to `00004` (plan 189.1.1-12, `HOSTED_VERSIONS_AFTER=00001 00002 00003 00004`). The old `account-access` called the dropped name for at most the seven seconds between the push's end and the functions step's. A rollback to a function that calls the former name is no longer supported.

### 2. A new migration drops the wrapper, with pgTAP and the SQL lint green

- **Migration `00005_drop_invitation_caller_take.sql`** drops `public.invitation_caller_take (uuid, text)` (plan 189.1.1-09, commit `4b67b9008`, `evidence/189.1.1-09-drop-wrapper.md`).
- **Locally:** `LOCAL_HISTORY_MAX=00005` and `LOCAL_WRAPPER_COUNT=0`. pgTAP was red before the migration (`PGTAP_RED_EXIT=1`, on the three edited files) and green after it (`PGTAP_EXIT=0`, `Files=65, Tests=3020, Result: PASS`). `DB_LINT_EXIT=0` for `yarn db:lint:sql`, `MIGRATIONS_FROZEN_EXIT=0` and `SCHEMA_EQUIVALENCE_EXIT=0`.
- **On staging:** `push_pending=00005` was the run's only pending line (`PUSH_PENDING_LINES=1`), with `push_status=0` and `drift_status=0` in run 45586463676. Attempt 2 of run 45601966922 found nothing pending and read the history `00001` to `00005` on both sides (`A2_drift_status=0`).

### 3. The references that are left

`git grep -l 'invitation_caller_take' -- apps packages tests infra scripts .github` on 2026-11-25 lists six files, none of them a function, a script or a test that calls the name:

- **The three migrations that are its history:** `00003_invitation_caller_limit.sql` creates it, `00004_access_caller_limit.sql` makes it a wrapper, and `00005_drop_invitation_caller_take.sql` drops it. `00001` to `00004` are frozen.
- **The manifest,** `apps/supabase/supabase/migrations.manifest.json`, which holds the name only inside the file name of migration `00005`.
- **The pgTAP absence check,** case 12 of `apps/supabase/supabase/tests/database/59-access-caller-limit.test.sql`, which asserts that the function does not exist.
- **One runbook row,** the 2026-11-25 Observations row of `infra/envs/staging/supabase/README.md`, which records the drop on staging. It is outside `apps/` and `tests/`, which is where this todo asked for no reference.

Nothing under `tests/` names it.
