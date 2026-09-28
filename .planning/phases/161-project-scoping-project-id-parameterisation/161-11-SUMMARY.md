---
phase: 161-project-scoping-project-id-parameterisation
plan: 11
subsystem: database
tags: [postgres, plpgsql, supabase, edge-functions, pgtap, multi-tenant, project-scoping]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: the required-p_project_id migration shape (00005/00006/00007), the parity gate, and the guard docblock ruling that no UNSCOPED disposition may exist
provides:
  - "`resolve_email_variables` with a required, undefaulted `p_project_id` that qualifies all four of its entity lookups"
  - "migration 00008, which drops the three-argument form and re-issues both grants against the four-argument type list"
  - "a `send-email` Edge Function that requires a `project_id` body term and refuses one naming a project other than the deployment's"
  - "a `send-email` invocation carrying the project the adapter itself resolved, under the key `project_id`"
  - "three pgTAP assertions pinning the cross-project boundary plus one pinning that the parameter is genuinely required"
affects: [161-12 project-scoped query guard, 162 grants matrix and scope-aware authorization]

actuals:
  tokens: 35438
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A body-supplied project term is a CLAIM, honoured only when it names the configured project — the same treatment `identity-callback` already gives its own body claim"
    - "The claim check sits after the caller's admin verification, so the difference between a right and a wrong project is not an answer an unauthenticated caller can read off the endpoint"

key-files:
  created:
    - apps/supabase/supabase/migrations/00008_resolve_email_variables_project_scope.sql
  modified:
    - apps/supabase/supabase/schema/502-email-helpers.sql
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/scripts/schema-migration-parity.expected.txt
    - apps/supabase/supabase/functions/send-email/index.ts
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts
    - packages/supabase-types/src/database.ts

key-decisions:
  - "DR-31 honoured: `send-email` is FIXED rather than allow-listed, so the disposition 161-12 writes (`requires a project term`) is a true statement about the call site"
  - "The body project term is REQUIRED, not optional: supplying the configured project on behalf of a caller that named none would let a caller who has not thought about scoping keep sending"
  - "The project-term refusal was placed AFTER the admin check rather than beside the top-of-file body validation, so an unauthenticated caller cannot distinguish a wrong project from a right one (deviation Rule 2)"
  - "auth.users is deliberately left unscoped: a recipient is a person, not a tenant row, so a cross-project call still returns the recipient with an empty variables object rather than dropping them"
  - "The nomination's arbitrary `LIMIT 1` pick is left exactly as found (flagged assumption row 4): narrowing by project does not make it deterministic, and making it deterministic is a separate product question"

patterns-established:
  - "Generate database types after `yarn db:reset`, never after a pgTAP run: `00-helpers.test.sql` commits its fixture helpers into the local database and they surface in `yarn db:types` output as six phantom RPC entries"

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: "`resolve_email_variables` cannot resolve a candidate name, an organization name, or a nomination's constituency and election from a project other than the one it was asked for"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/07-rpc-security.test.sql#resolve_email_variables asked for project B resolves no entity variable for a user whose candidate row belongs to project A"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/07-rpc-security.test.sql#resolve_email_variables asked for project A resolves the candidate variables of project A's own candidate (control for the project B zero below)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The project parameter is genuinely required — a caller that omits it gets an undefined_function error rather than every project's rows"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/07-rpc-security.test.sql#resolve_email_variables with the user ids alone raises undefined_function, so p_project_id carries no DEFAULT"
        status: pass
    human_judgment: false
  - id: D3
    description: "The `send-email` invocation carries a project term, and the Edge Function refuses an invocation whose project term does not name the project the deployment serves"
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts#invokes send-email Edge Function and returns result"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts#passes from and dryRun options"
        status: pass
    human_judgment: true
    rationale: "The adapter half is pinned by the two unit expectations above, but the Edge Function's refusal arm has no automated exercise in this repository — the Deno function is not invoked by any unit or E2E test, so the mismatch and absent-term branches are proven by reading rather than by running."
  - id: D4
    description: "The schema mirror and the migration set say the same thing about this function, held there by the parity gate rather than by a reviewer"
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "yarn assert:schema-migration-parity"
        status: pass
    human_judgment: false

duration: 20 min
completed: 2026-09-05
status: complete
---

# Phase 161 Plan 11: send-email project scoping Summary

**`resolve_email_variables` now takes a required `p_project_id` that qualifies all four of its entity lookups, and the whole `send-email` path — adapter payload, Edge Function claim check, rpc argument — carries the project the adapter resolved.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-05T18:27:00Z
- **Completed:** 2026-09-05T18:47:00Z
- **Tasks:** 3
- **Files modified:** 8 (7 modified, 1 created)

## Accomplishments

- Migration `00008` drops the three-argument `resolve_email_variables` and recreates it with `p_project_id uuid` first and undefaulted, with `AND …project_id = p_project_id` on the candidate lookup, the candidate's organization lookup, the nomination lookup and the organization-role organization lookup, and both `GRANT EXECUTE` statements re-issued against `(uuid, uuid[], text, text)`.
- The schema mirror `502-email-helpers.sql` was rewritten from the migration body so the two copies are word-for-word the same, and the parity signature was re-baselined only after they agreed.
- Four new pgTAP assertions (plan count 27 → 31): the same fixture user resolves `candidate.first_name` when asked for its own project, still returns a row when asked for the other project, resolves **none** of the four entity keys for that other project, and the user-ids-only call raises `42883`.
- `send-email` requires a `project_id` body term, compares it case-insensitively with `requireEnv('PUBLIC_PROJECT_ID', …)`, refuses a mismatch with the fixed literal `Invalid project_id`, and forwards the configured project as `p_project_id`.
- The adapter's `sendEmail` sends `project_id: this.projectId`, pinned by both `toHaveBeenCalledWith('send-email', …)` expectations.

## Task Commits

1. **Task 1: resolve_email_variables cannot cross a project boundary, and its only caller names the project** — `2d1993266` (feat)
2. **Task 2: The adapter's sendEmail sends the project the adapter resolved** — `179a7417b` (feat)
3. **Task 3: Run the wired gates and record the send-email disposition** — no source change; its output is the record below and the gate results. Committed with this SUMMARY.

## Files Created/Modified

- `apps/supabase/supabase/migrations/00008_resolve_email_variables_project_scope.sql` — new migration: DROP of the three-argument form, CREATE of the four-argument form, both grants re-issued
- `apps/supabase/supabase/schema/502-email-helpers.sql` — the readable mirror, identical in parameter list, predicates and grants
- `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` — new section 8 (existing sections 8 and 9 renumbered to 9 and 10), section 7's positional call moved to the new signature, plan count 27 → 31
- `apps/supabase/scripts/schema-migration-parity.expected.txt` — re-baselined signature: 32 → 44 hunks, every added line a `resolve_email_variables` line
- `apps/supabase/supabase/functions/send-email/index.ts` — `project_id` on the request interface, the configured-project comparison, `p_project_id` in the rpc argument object
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` — `project_id: this.projectId` in the invoke body
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` — both invoke expectations demand the key
- `packages/supabase-types/src/database.ts` — `resolve_email_variables.Args` gains `p_project_id: string`; `database.overrides.ts` untouched, as the plan required

## The record 161-12 needs

Stated here so the disposition 161-12 writes for `send-email` can be checked against the real spelling rather than an assumed one:

- **The payload key is `project_id`** — snake_case, beside `recipient_user_ids` and `dry_run`, in `supabaseAdminWriter.ts`'s `sendEmail` invoke body. Its value is `this.projectId`, the id the adapter mixin resolved through `resolveProjectId(config.projectId)`. (`invite-candidate` remains camelCase `projectId`; per DR-33 the disposition must accept both spellings.)
- **The refusal lives in `apps/supabase/supabase/functions/send-email/index.ts`**, in section 3, immediately after the admin-role verification and immediately before the `resolve_email_variables` call. It answers `400 {"error":"Invalid project_id"}` — a fixed literal echoing neither the submitted nor the configured value — when the term is absent, is not a string, is empty, or does not match `PUBLIC_PROJECT_ID` case-insensitively after trimming.
- **`resolve_email_variables` requires `p_project_id`**, introduced by `apps/supabase/supabase/migrations/00008_resolve_email_variables_project_scope.sql`. It is the first parameter and carries no `DEFAULT`.
- **pgTAP run:** `yarn db:reset && yarn workspace @openvaa/supabase test:db` exited 0. `Files=12, Tests=401 … Result: PASS`; **`not ok` count: 0**; plan line `plan (31)` for `07-rpc-security.test.sql`, with no `# Looks like you planned N tests but ran M`.
- **Residual, NOT closed here (T-161-11-03):** `send-email` still accepts any caller holding `super_admin`, `account_admin` or `project_admin` without comparing that role's `scope_id` to the project. That is Phase 162's grants matrix and `can_access_project` / `can_edit_project` split (PRESHIP-02, criteria 1 and 2). This plan bounds the DATA the function can reach regardless of which admin calls; it does not bound WHICH admin may call.

## Decisions Made

- **The refusal was placed after the admin check** rather than in the top-of-file body validation where the plan's prose ("the 400 shape the file already uses for a bad payload") might have put it. In that earlier position an unauthenticated caller could distinguish a wrong project (400) from a right one (401 at the next step) and enumerate project ids. See the deviation below.
- **The `project_id` body term is required, not optional.** `identity-callback` treats absent/null/empty as "no claim" and falls back to the configured project, because self-registration has a meaningful default. `send-email` has none: the rpc needs a project, and defaulting for a caller that named none would silently re-admit the very "caller who forgot" case the undefaulted parameter exists to catch.
- **`auth.users` and `user_roles` are deliberately left unfiltered**, and both carry an in-code comment saying so. `auth.users` has no project column and a recipient is a person; `user_roles` has no project column either, and the scoping happens on the entity rows its `scope_id` points at.
- **The nomination's `LIMIT 1` pick is untouched** (flagged assumption row 4). The project predicate narrows the candidate set; which nomination supplies the constituency and election names is still arbitrary, exactly as before.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Moved the project-term refusal behind the admin check**
- **Found during:** Task 1 (the caller edit)
- **Issue:** Placing the refusal in the body-validation block at the top of the file — where the file's other 400s live — makes the endpoint an unauthenticated project-id oracle: a wrong project answers 400 `Invalid project_id`, a right one falls through to the 401 `Missing Authorization header` arm, so the two are distinguishable without any credential.
- **Fix:** The `requireEnv` read and the comparison were placed in section 3, after the admin-role verification and immediately before the rpc that consumes the value. A two-sentence comment at the site records why the position is load-bearing.
- **Files modified:** `apps/supabase/supabase/functions/send-email/index.ts`
- **Verification:** `yarn lint:check` exit 0 (includes `assert:edge-env-defaults`, 0 violations); the ordering is a read-level property with no automated exercise, and is recorded as `human_judgment: true` on coverage entry D3.
- **Committed in:** `2d1993266` (Task 1 commit)

**2. [Rule 3 - Blocking] Joined four comment pairs to satisfy the comment-hygiene guard**
- **Found during:** Task 1 (after writing the migration and mirror)
- **Issue:** `yarn assert:comment-hygiene` returned 4 rule-2 violations: each new explanatory sentence sat directly beneath a pre-existing short comment at the same indent, which the guard reads as one span broken across lines.
- **Fix:** The four pairs were joined into single lines in **both** the migration and the mirror, keeping the two copies identical, and the parity signature was re-baselined afterwards.
- **Files modified:** `apps/supabase/supabase/migrations/00008_resolve_email_variables_project_scope.sql`, `apps/supabase/supabase/schema/502-email-helpers.sql`, `apps/supabase/scripts/schema-migration-parity.expected.txt`
- **Verification:** `yarn assert:comment-hygiene` — 1662 files scanned, 0 violations.
- **Committed in:** `2d1993266` (Task 1 commit)

**3. [Rule 1 - Bug] Regenerated the types from a reset database rather than a post-pgTAP one**
- **Found during:** Task 2 (`yarn db:types`)
- **Issue:** The first `yarn db:types` diff carried the expected `p_project_id` addition **plus six unrelated entries** — `create_test_data`, `reset_role`, `set_test_user`, `test_id`, `test_user_id`, `test_user_roles`. The plan states that a diff touching unrelated entries is a finding rather than a diff to accept. The cause: `00-helpers.test.sql` commits its fixture helper functions into the local database (later test files depend on them), so a `yarn db:types` run after a pgTAP run describes state the migration set does not.
- **Fix:** The contaminated file was discarded with `git checkout --`, the database reset with `yarn db:reset`, and the types regenerated. The second diff is one added line and nothing else.
- **Files modified:** `packages/supabase-types/src/database.ts`
- **Verification:** `git diff packages/supabase-types/` shows exactly `+ p_project_id: string;` inside `resolve_email_variables.Args`; `yarn typecheck` exit 0.
- **Committed in:** `179a7417b` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 missing critical, 1 blocking, 1 bug)
**Impact on plan:** No scope creep. Deviation 1 hardens the mechanism the plan asked for rather than widening it — it does not touch the `isAdmin` check, which stays Phase 162's. Deviations 2 and 3 are gate and tooling mechanics.

## Issues Encountered

- The pgTAP RED run failed the whole file at compile time (`function resolve_email_variables(uuid, uuid[]) does not exist`, 8 of 31 planned tests run), which is the expected shape of a signature-change RED: a positional call to a changed signature is a parse failure of the file, not a skipped assertion. Green after the migration: 401 tests across 12 files, 0 `not ok`.
- The parity gate was re-baselined twice — once after the mirror edit, once after the comment join — and both diffs were read line by line before acceptance. Every added signature line is a `resolve_email_variables` line; nothing unrelated moved.

## Gate results (task 3)

Each exit code was read directly from the command, never through a pipe.

| Gate | Exit | Evidence |
|---|---|---|
| `yarn db:reset && yarn workspace @openvaa/supabase test:db` | 0 | `Files=12, Tests=401 … Result: PASS`; 0 `not ok`; no plan-count mismatch |
| `yarn assert:schema-migration-parity` | 0 | census: 25 schema files → 4087 lines; 00001 → 4008 lines; 44 hunks, 171 signature lines (non-zero) |
| `yarn lint:check` | 0 | 0 `[ERROR]` lines; every `assert-*` guard reported 0 violations |
| `yarn test:unit` | 0 | Turbo: 25 successful, 25 total; frontend 1630 passed, 0 failed, 0 skipped |
| `yarn typecheck` | 0 | 23 tasks successful; svelte-check 0 errors, 0 warnings |
| `grep -c p_project_id …/502-email-helpers.sql` | 0 | prints `6` (≥ 5: the parameter, four predicates, one header line) |
| `grep -c project_id …/supabaseAdminWriter.ts` | 0 | prints `1` (non-zero) |

**E2E not run.** No E2E spec reaches `send-email`: the suite's own `sendEmail` helper uses `auth.admin.inviteUserByEmail` and never touches this Edge Function (DR-31 records this, and a repository-wide grep confirms it — the only `send-email` references outside the adapter and its test are a prior run's log file). The plan's `<verification>` block does not include the E2E suite for the same reason.

## User Setup Required

None — no external service configuration required. `PUBLIC_PROJECT_ID` was already required by this deployment and is already documented in `.env.example`; `send-email` now reads it too, and the local edge runtime resolves it from the process environment rather than the root `.env`, as `CLAUDE.md` already records for `identity-callback`.

## Next Phase Readiness

- 161-12 can now write `requires a project term` for `send-email` as a true statement, against the real key spelling `project_id`, and per DR-33 its check should accept `projectId` too so `invite-candidate` is not forced to change convention.
- Phase 162 inherits the scope-blind admin check (T-161-11-03) unchanged and unclosed; this plan neither fixed nor obscured it.

---
*Phase: 161-project-scoping-project-id-parameterisation*
*Completed: 2026-09-05*

## Self-Check: PASSED

- `apps/supabase/supabase/migrations/00008_resolve_email_variables_project_scope.sql` exists on disk.
- `.planning/phases/161-project-scoping-project-id-parameterisation/161-11-SUMMARY.md` exists on disk.
- Commits `2d1993266`, `179a7417b` and `ad6309d89` are present in `git log`.
