---
phase: 174-invitations-grants-defined-in-advance
plan: 04
subsystem: database
tags: [postgres, supabase, pgtap, invitations, grants, security-definer, rate-limit, claim]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plan 02: public.invitations, its code functions, policies and create_invitations; plan 03: a local auth service that refuses public sign-up and requires confirmation, with the gate rows auth-config and stack"
  - phase: 173-multi-entity-grants-entity-selection
    provides: "public.grants with grants_user_scope_target_role_key and idx_grants_one_candidate_editor, and private.entity_project_id"
provides:
  - "public.claim_invitations(p_project_id uuid): the one function that turns an invitation into a grant, for auth.uid() and that user's own confirmed address"
  - "the six service-role helpers behind the Edge Function of 174-05: invitation_code_status, invitation_link_request, invitation_link_release, invitation_code_claimant_email, invitation_link_witness_open, invitation_link_witness"
  - "private.invitation_throttle and invitation_throttle_take: one mail per address per 60 seconds, one rebinding per code per 60 seconds, ten claimant look-ups per used code per fifteen minutes"
  - "private.user_password_set(uuid), reusable by Phase 178"
  - "39-invitations.test.sql: 137 more assertions (53 on the claim, 84 on the helpers), 259 in all"
  - "the table 'the server contract in SQL' in 174-NAME-MAP.md"
affects: [174-05, 174-06, 174-08, 174-10, 178, 179]

actuals:
  tokens: 34600
  tasks: 5
  commits: 7
plan_head_before: 91dcf432187c07c13520c28ed67e23c9ff958a5a
plan_head_after: 2e4eb739b5c6cb568920332a2f1c48938390e72a

tech-stack:
  added: []
  patterns:
    - "A definer function that takes no identity argument: the user from auth.uid(), the address from that user's row of auth.users, never from the token"
    - "Per-row claim inside its own exception block, the two unique violations told apart by constraint name"
    - "A windowed counter keyed on what a row already holds (an address hash, a code hash), taken only once the request is known to be eligible"
    - "A completion witness: opened by the service role, completed by UPDATE only, so an anonymous caller can neither create nor read a record"
    - "pgTAP moves time by rewriting a window's start as the fixture role; no test waits"

key-files:
  created: []
  modified:
    - "apps/supabase/supabase/schema/506-invitation-rpcs.sql"
    - "apps/supabase/supabase/migrations/00001_initial_schema.sql"
    - "packages/supabase-types/src/database.ts"
    - "apps/supabase/supabase/tests/database/07-rpc-security.test.sql"
    - "apps/supabase/supabase/tests/database/39-invitations.test.sql"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"

key-decisions:
  - "With a used code, invitation_link_request answers the claimant's own address whatever address was typed, and null only when the claimant is gone or the code's budget is spent; pgTAP pins both halves"
  - "The used-code arm of invitation_link_request calls invitation_code_claimant_email, so a link request and a password attempt share one budget of ten per fifteen minutes per code"
  - "claim_invitations returns the three keys in every case, password_set false when the caller has no user id"
  - "private.invitation_throttle_take is revoked from service_role as well as from PUBLIC, anon and authenticated: only the definer functions call it, as their owner"
  - "The pgTAP section titles carry no requirement or decision id (CLAUDE.md comment hygiene), where the plan names them 'INV-03', 'INV-04' and 'D-19'"

patterns-established:
  - "A negative control after new pgTAP sections: mutate the applied functions, run the suite, read which assertions fail, reset"

requirements-completed: [INV-03, INV-04]

coverage:
  - id: D1
    description: "claim_invitations has one signature (uuid), is SECURITY DEFINER with an empty pinned search_path, and is executable by authenticated only; anon and service_role get 42501"
    requirement: "INV-03"
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/39-invitations.test.sql Section 9 (5 assertions); 07-rpc-security.test.sql Section 8c"
        status: pass
    human_judgment: false
  - id: D2
    description: "After a claim the caller's grants are the grants held before plus exactly one row per claimed invitation, for each of the six admitted shapes; public.grants as a whole holds nothing else new"
    requirement: "INV-03"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Section 10 (14 assertions)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A stranger, an unconfirmed holder of the address, a token whose email claim disagrees with the row, an expired row, a second call and the other project each claim nothing and write nothing"
    requirement: "INV-03"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Section 11 (8 assertions); negative control C4 in 174-NAME-MAP.md"
        status: pass
    human_judgment: false
  - id: D4
    description: "A code row is claimed only by the user whose confirmed address is the row's pending address; each row is claimed or skipped by itself with the two reasons; password_set is stated; a demoted seeder's promise is honoured and a deleted promise grants nothing"
    requirement: "INV-03"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Sections 12 to 15 (26 assertions)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The code check answers exactly valid, used or unknown; a used code stays used after its claimant is deleted, binds to no other address, grants nothing a second time and its row cannot be deleted by an API role"
    requirement: "INV-04"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Section 16 (17 assertions)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Who may be mailed, the three limits, the release, the witness, and that no API role can execute a helper or touch its tables"
    requirement: "INV-04"
    verification:
      - kind: integration
        ref: "39-invitations.test.sql Sections 17 to 21 (67 assertions)"
        status: pass
    human_judgment: false
  - id: D7
    description: "claim_invitations became executable only on a stack whose auth service refuses public sign-up"
    verification:
      - kind: other
        ref: "174-stack-probe.sh after, exit 0 at Task 2's start and end and at the plan's close; gate rows auth-config and stack of 174-04-close"
        status: pass
    human_judgment: true
    rationale: "The probe shows the local stack. A hosted project's dashboard is the operator's, and the function has no guard of its own (T-174-85, accepted)"
  - id: D8
    description: "The plan closes on ten green gate rows and made no E2E run; its boundary proof is the full run that closes 174-06"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-04-close --rows typecheck,lint,db-reset,types-regen,types-clean,pgtap,sql-lint,unit,auth-config,stack — exit 0"
        status: pass
      - kind: e2e
        ref: "the full default suite at the close of 174-06"
        status: unknown
    human_judgment: true
    rationale: "Nothing in the application or the harness calls the new functions yet, so no regression is expected, but that is shown only by a run"

duration: 31min
completed: 2026-10-07
status: complete
---

# Phase 174 Plan 04: The claim and the service-side helpers Summary

**`claim_invitations(p_project_id)` turns the caller's open invitations into grants on the strength of one thing, the caller's own confirmed address read from `auth.users`; six service-role helpers answer the code check, decide who may be mailed, hold the limits in SQL and give a slot back; 137 new pgTAP assertions and a negative control hold all of it.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-10-07T08:58:00Z
- **Completed:** 2026-10-07T09:29:00Z
- **Tasks:** 5 of 5
- **Files modified:** 6 (none created)

## Accomplishments

- The claim takes a project and nothing else. The user is `auth.uid()`, the address is that user's row of `auth.users` where `email_confirmed_at` is set; an address, a user id, an invitation id and the token's `email` claim are not inputs.
- Each row is claimed or skipped by itself: `candidate_has_editor` and `target_not_in_project` leave the row open, an already-held grant marks it claimed, and the caller's other rows are claimed in the same call.
- The four answers the Edge Function needs exist in the database, with the way to give a slot back and the way to learn that one request's background work has ended. No API role can execute any of them.
- The limits are keyed on the address hash and the code hash, never on a header, and no key is written for an address no mail would go to or for a code that names no claimant.
- `claim_invitations` became executable on a stack that refuses public sign-up, probed at the task's start, at its end and at the plan's close.

## Task Commits

1. **Task 1: the service-side helpers** - `8c5938b79` (feat[db])
2. **Task 2: `claim_invitations` with `password_set`, and the census** - `de0cc2808` (feat[db])
3. **Task 3: pgTAP asserts the claim** - `ce1e07eac` (test[db])
4. **Task 4: pgTAP asserts the helpers** - `5c7c48db3` (test[db])
5. **Task 5: close on ten gate rows** - `37dea9256` (test[db], the section titles; see Deviations), `2e4eb739b` (docs, the name map)

**Plan metadata:** the commit that adds this file.

`commits: 7` is `git rev-list --count 91dcf4321..HEAD` when this file was written. Six are this plan's. The seventh is `c1d049136` (`docs(claude-md): add the void run to the E2E hard rule`), the operator's, which landed on the branch at 12:01 local, after the plan started and before its first commit.

## The seven functions

All in `apps/supabase/supabase/schema/506-invitation-rpcs.sql`, in `public`, `SECURITY DEFINER`, `search_path = ''`, one signature each.

| Function | Signature | EXECUTE | Returns |
|---|---|---|---|
| `claim_invitations` | `(p_project_id uuid) RETURNS jsonb` | `authenticated` only; `anon` and `service_role` get `42501` | `{"claimed": [...], "skipped": [...], "password_set": <boolean>}`; each element `{scope, target_type, target_id, role}`, a skipped one also `reason` (`candidate_has_editor` or `target_not_in_project`) |
| `invitation_code_status` | `(p_project_id uuid, p_code text) RETURNS text`, `STABLE` | `service_role` only | `valid`, `used` or `unknown` |
| `invitation_link_request` | `(p_project_id uuid, p_email text DEFAULT NULL, p_code text DEFAULT NULL) RETURNS text` | `service_role` only | the address a mail may go to, or null |
| `invitation_link_release` | `(p_project_id uuid, p_email text, p_code text DEFAULT NULL) RETURNS void` | `service_role` only | nothing |
| `invitation_code_claimant_email` | `(p_project_id uuid, p_code text) RETURNS text` | `service_role` only | the claimant's address of a used code, or null; null from the eleventh answer in fifteen minutes |
| `invitation_link_witness_open` | `() RETURNS uuid` | `service_role` only | the id of a new open record |
| `invitation_link_witness` | `(p_id uuid, p_outcome text DEFAULT NULL) RETURNS text` | `service_role` only | `sent`, `not-sent`, or null; an outcome other than the two words raises `22023` |

Also in the file: `private.user_password_set(uuid) RETURNS boolean` and `private.invitation_throttle_take(text, integer, interval) RETURNS boolean` (no API role holds `EXECUTE` on either); the tables `private.invitation_throttle` and `private.invitation_link_witness` (row-level security enabled, no policy, nothing for `anon`, `authenticated` or `service_role`); the trigger `cleanup_invitation_throttle` (`AFTER DELETE` on `public.invitations`) with `public.cleanup_invitation_throttle_on_delete()`. The fuller table, with the notes for callers, is "the server contract in SQL" in `174-NAME-MAP.md`.

## The census edit

`07-rpc-security.test.sql`, Section 8c, the `authenticated` assertion. One name added to one list, in the list's own order, and the description brought in line:

```
-    'contestant_app_public_config,get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
-    'census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus get_entity_basic_data'
+    'claim_invitations,contestant_app_public_config,get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
+    'census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus claim_invitations and get_entity_basic_data'
```

The `anon` assertion did not move. The file still plans 39.

## What pgTAP and the linter reported beyond the one expected finding

Nothing.

- After Task 1's schema (the helpers, with `07-rpc-security.test.sql` unmodified): 39 files, 1569 tests, PASS. Neither census moved, so every `EXECUTE` revocation is right.
- After Task 2's schema, before the census edit: exactly `Failed test 20`, `have: claim_invitations,contestant_app_public_config,get_entity_basic_data,…`; 1 of 39 in that file, every other file green. No other name appeared in either list.
- `yarn db:lint:sql` exited 0 every time it ran: `No schema errors found`, the census line unchanged at 107 policies over 21 tables, `0 error(s), 3 warning(s)` (the three baseline warnings). `plpgsql_check` reported nothing in a new function.
- The two pgTAP tasks each passed on their first run, so the negative control (C4 in the name map) was made to show the assertions can fail: with nine deliberate mutations applied, 34 of the 259 assertions of `39-invitations` failed, plus the `authenticated` census of file 07, and every mutation was caught by at least one.

## pgTAP `plan(N)` deltas

| File | Before | After |
|---|---|---|
| `39-invitations.test.sql` | `plan (122)` | `plan (259)`: Sections 9 to 15 add 53 (5, 14, 8, 6, 9, 3, 8), Sections 16 to 21 add 84 (17, 16, 12, 9, 9, 21) |
| `07-rpc-security.test.sql` | `plan (39)` | `plan (39)`, unchanged |
| whole suite | 39 files, 1569 tests | 39 files, 1706 tests |

## Gate rows

`174-04-close`, `tests/e2e-runs/174-gates/174-04-close`, first attempt, head `37dea9256`, window 2026-10-07 12:21:32 to 12:24:16 local on AC power under `caffeinate -dimsu`. `power.txt`: `sleep_entries_in_window: 0`. No void marker exists in the directory, and no line of `power.txt` calls the run void.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 45 |
| db-reset | 0 | 30 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 3 |
| unit | 0 | 57 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

`node 174-verdict.mjs gates 174-04-close --rows typecheck,lint,db-reset,types-regen,types-clean,pgtap,sql-lint,unit,auth-config,stack` exits 0, on head `37dea9256` and again on `2e4eb739b`: "rows: 10 expected (the named subset), 10 recorded", "not stale: head 37dea9256 is tree-equal to HEAD outside .planning/", "power: no Sleep entry inside the run window", "PASS". `node 174-verdict.mjs hygiene` exits 0 (0 hits, the same two advisory lines as at the baseline). `bash 174-stack-probe.sh after`, run once more after the gate set, exits 0 with every row OK.

From the rows' logs: pgTAP `Files=39, Tests=1706`, `Result: PASS`; unit test files as at `174-03-close` (frontend 159 passed and 1 skipped, dev-seed 67, supabase functions 15, app-shared 10, data 47); `auth-config` "3 key(s) hold in apps/supabase/supabase/config.toml".

It is a subset and is judged as one: no `check-frontend`, `build`, `format`, `docs-links` or `name-gate-self-test` row. `yarn prettier --check` on the five source files this plan edited or regenerated exits 0, which is what the `format` row would have asked of them.

Each task's own `<automated>` chain was run before its commit, each command's status read directly: Tasks 1 and 2 from `yarn assert:schema-migration-parity` through a fresh `yarn db:reset`, `yarn db:types`, pgTAP, `yarn db:lint:sql` and `yarn typecheck`; Tasks 3 and 4 from the reset through pgTAP.

**No E2E run was made, as the plan directs.** The full run that closes 174-06 is this plan's boundary proof. A failure there would point back here if it is: a teardown that deletes an invitation or an entity and meets the new `AFTER DELETE` trigger on `invitations`; drift of the generated types; or a unit test that counts the functions of the generated types. A failure in a voter or contestant flow would not: nothing in the application or the harness calls any of the new functions.

## Review against the database checklist

Read against `.claude/skills/database/SKILL.md` § _Reviewing Database Changes_ and `.agents/code-review-checklist.md`.

- Holds: each of the ten new functions is `SECURITY DEFINER` with `search_path = ''` (pgTAP asserts it from the catalogue, "each of the ten functions …") and qualifies every name it calls outside `pg_catalog`; schema file and regenerated migration are in one commit under the parity gate, twice; the trigger is named `cleanup_invitation_throttle`; the pgTAP sections follow the transaction boundary and use `create_test_data()`; every commit that holds a database change carries the `[db]` tag.
- Does not apply, by design: the two new tables are in `private`, hold no content and are reached only by definer functions, so they have row-level security enabled with no policy and every API role revoked, as `private.deployment_settings` has. No policy, no common columns, no foreign key.
- Every comment in the schema file and the test file describes the code as it is. The two files hold no decision id, no requirement id and no phase reference (`git grep -P '\bD-\d{2}\b'` and the phase-reference pattern of `hygiene-grep-report.sh` both print nothing for them). `yarn assert:comment-hygiene` exits 0.

## Decisions Made

- **A used code and a typed address.** While the claimant exists, `invitation_link_request` with a used code answers the claimant's own address and ignores what was typed; it binds nothing. After the claimant is deleted it answers null. The plan states the first in Task 1 and tests the second in Task 4; both are pinned ("a used code whose claimant exists answers with the claimant's own address, whatever address was typed", "a link request with the used code and another address answers null").
- **One budget per used code.** The used-code arm of the link request calls `invitation_code_claimant_email` rather than repeating it, so link requests and password attempts with one code draw on the same ten per fifteen minutes. pgTAP pins that an over-budget link request answers null before the address slot is asked.
- **A constant result shape.** `claim_invitations` answers the three keys in every case; with no user id `password_set` is false.
- **Extra cases pinned beyond the plan's list:** an admin of the project's account and an editor of the other project are not eligible for a link; the service role is refused the claim; a record opened more than a day ago is removed by the next open; a demoted seeder can promise nothing more (so the test shows the authority really was lost before the claim honoured the promise).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - CLAUDE.md] The pgTAP section titles carry no requirement or decision id**
- **Found during:** Task 5's review
- **Issue:** the plan names the sections "INV-03, exactly the promised grants", "INV-03, nobody else", "D-19, each row by itself" and "INV-04, the used code", and Tasks 3 and 4 committed them so. `CLAUDE.md` § _Comment Hygiene_ forbids `D-NN` ids in comments under `apps/`, and no other file under `apps/supabase/supabase/tests` or `schema` carries a requirement id.
- **Fix:** the four titles now read "exactly the promised grants", "nobody else", "each row by itself" and "the used code".
- **Files modified:** `apps/supabase/supabase/tests/database/39-invitations.test.sql`
- **Commit:** `37dea9256`. It is a fix of this plan's own two test commits; folding it into them needs a history rewrite, which I did not attempt.

### Differences and additions

- **The new sections follow Section 8** instead of preceding its last assertion. That assertion compares `public.grants` before and after seeding, and it still closes Section 8 unchanged; the claim sections take their own baseline.
- **`private.invitation_throttle_take` is revoked from `service_role` too.** The plan says "from the API roles"; only definer functions call it.
- **`invitation_link_release` leaves an expired row alone** as well as a claimed one: "an open row" is read as unclaimed and unexpired.
- **A negative control was run** (C4 in the name map); the plan does not ask for one.
- **`requirements-completed` lists INV-03 and INV-04 for their database half**: the function, the helpers and their pgTAP proof. The entry points that call the claim and refresh the session are 174-08's.

### Driver statuses against the plan's text

Nothing disagreed. This plan uses `174-gates.sh` and `174-verdict.mjs gates` only; both behaved as the plan's `<long_gates>` block and Task 5's `fails_when` describe. The verdict now also prints a `power:` line. No E2E driver was run, so the wrapper's void status (8) and the drivers' handling of it were not exercised here.

**Total deviations:** 1 auto-fixed (CLAUDE.md comment hygiene), 5 differences noted. No scope creep: `git diff --stat 91dcf4321..HEAD -- apps/frontend tests packages/dev-seed apps/supabase/supabase/functions` prints nothing.

## Issues Encountered

None. No gate, pgTAP run or probe was red on a tree meant to be green, and no run was void or repeated.

## The residual of deviation 2, in the words a todo can take

**No per-caller limit exists on the anonymous invitation paths.** D-15 asks for "a cap per caller" and D-18 for "a coarse per-caller limit for unknown codes"; neither is built, because no caller identity is observable that the caller cannot choose. What stands instead: one sign-in mail per address per 60 seconds, one rebinding per code per 60 seconds, ten claimant look-ups per used code per fifteen minutes. What is therefore unlimited: `invitation_code_status` for any string, and `invitation_link_request` and `invitation_code_claimant_email` for a code that names no claimed row, each costing one indexed look-up and writing nothing. An unknown code is defended by its 60 bits alone. To close it: find an identity for the caller that the caller cannot influence on the hosted deployment (a gateway-set address the Edge Function can trust, or a limit at the gateway itself), then key a coarse limit on it. Do not add a project-wide cap: it would let any visitor deny the answer to everyone.

One more line for the same todo, inferred from the index definitions of `auth.users` and not measured with a plan: the grant-holder arm of `invitation_link_request` compares `lower(btrim(u.email))`, which neither `users_email_partial_key` nor `users_instance_id_email_idx` serves, so each link request without a code that finds no open invitation reads every row of `auth.users`.

## Threat Flags

None. Every surface this plan adds is in the plan's threat model (T-174-25 to T-174-35, T-174-83 to T-174-85).

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## `CLAUDE.md` read against the change

**No sentence was made false.** `CLAUDE.md` names no function of the invitation model, no census and no count of functions or assertions. It was not edited by this plan; the one change to it in the plan's range is the operator's commit `c1d049136`.

One sentence outside `CLAUDE.md` is now false and was not edited, because the skill corpus is 174-10's: `.claude/skills/database/SKILL.md` says "`07-rpc-security.test.sql` § 8c censuses the definer functions left in `public`: six that `anon` can execute (…) and, for `authenticated`, the same six plus `get_entity_basic_data`." The `authenticated` list is now the same six plus `claim_invitations` and `get_entity_basic_data`.

## What 174-05 must know

- The table "the server contract in SQL" in `174-NAME-MAP.md` is the authority for the seven signatures, with notes for callers under it.
- **The generated types say `Returns: string` where the answer can be null** (`invitation_link_request`, `invitation_code_claimant_email`, `invitation_link_witness`). Test for null.
- **With a used code, release with the address the request returned**, which is the claimant's, not the typed one.
- **A null from `invitation_link_request` took no slot and changed no row**, so no release follows it.
- The stack was not restarted by this plan: no function file and no `config.toml` changed. The database was reset by the gate set and re-seeded with `yarn db:seed:default` (exit 0, 752 rows). No dev server is running.

## What 174-06 and 174-08 must know

- **A claimant's address keeps its 60-second slot when a used code's row is deleted** (C7): the trigger deletes the keys of the addresses the row still holds, and the claim cleared the pending one. A test that deletes a claimed code row and asks for a link to the same address within a minute calls `invitation_link_release` first, or uses a fresh address.
- **A row skipped for `candidate_has_editor` is returned in `skipped` on every later call**, because it stays open. "A second call returns an empty `claimed`" is the invariant, not "an empty result".
- **Elements of `claimed` are in the order `created_at, id`.** Rows seeded by one `create_invitations` call share `created_at`, so their order is by id and is not the order of the batch.
- `claim_invitations` is refused to the service role: a harness helper that claims on a user's behalf needs that user's session.

## Next Phase Readiness

- The claim and its helpers are in the applied database, held by ten green gate rows and 259 assertions in the invitation file.
- Nothing calls them yet: the Edge Function is 174-05's, the harness 174-06's, the entry points 174-08's.
- Open for a decision: whether `37dea9256` is folded into the two test commits when the branch is restructured for review.

## Self-Check: PASSED

- Files: the six modified files exist on the tree; `174-04-SUMMARY.md` is this file.
- Commits: `8c5938b79`, `de0cc2808`, `ce1e07eac`, `5c7c48db3`, `37dea9256` and `2e4eb739b` are ancestors of HEAD; `git rev-list --count 91dcf4321..HEAD` printed 7 when this file was written.
- Evidence: `tests/e2e-runs/174-gates/174-04-close` exists, holds no void marker, and its verdict exits 0 on HEAD.
- Working tree: `git status --short` shows only the operator's untracked `CAND-APP-PLAN.md`.
