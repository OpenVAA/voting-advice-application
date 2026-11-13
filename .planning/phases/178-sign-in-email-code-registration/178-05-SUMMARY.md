---
phase: 178-sign-in-email-code-registration
plan: 05
subsystem: database
tags: [supabase, postgres, pgtap, invitations, registration-modes, security-definer, truth-table, parity-test]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-01: the gate driver, the E2E driver and the verdict script; plan 178-03: the base dataset's matrix widened to email and code for both types; plan 178-04: the placement of functions defined after the blanket grant in 301-auth-functions.sql, and the schema and adapter this plan's full run is the first over"
provides:
  - "private.registration_mode_allowed_in (jsonb, text, text) RETURNS boolean: the registration-mode rule over stored settings, IMMUTABLE, reads no table, executable by no API role; in 301-auth-functions.sql"
  - "private.registration_mode_allowed (uuid, text, text) RETURNS boolean: the rule over one project's settings row, STABLE SECURITY DEFINER, false for a project with no row, executable by no API role; in 301-auth-functions.sql"
  - "private.invitation_mode_allowed (public.invitations) RETURNS boolean: the condition for one invitation row, STABLE, runs as its caller, executable by no API role; in 506-invitation-rpcs.sql"
  - "The condition in invitation_code_status (one arm), invitation_link_request (one arm and one conjunct) and claim_invitations (one conjunct), asked of open rows only"
  - "pgTAP: 45-registration-mode-matrix.test.sql (32 assertions titled MATRIX) and Section 22 of 39-invitations.test.sql (34 assertions titled MODE); the estate is 2394 assertions in 45 files"
  - "packages/dev-seed/tests/registrationModeMatrixParity.test.ts: the same 32 rows asserted against isRegistrationModeAllowed"
  - "The full run 178-05-close: 444 of 444 in 116 projects, the first over the schema and adapter of plan 178-04"
affects: [178-06, 178-07, 178-12, 178-14, 178-16, 178-17, 178-18, 178-21, 178-23, 178-24]

actuals:
  tokens: 19798
  tasks: 3
  commits: 2
plan_head_before: f794dbb389bee4c7429d4f9a2bcaa02364023a13
plan_head_after: 9c0f926167e6219b44dd0bc010410662328742e0

tech-stack:
  added: []
  patterns:
    - "A rule stated in SQL and in TypeScript is held together by one table of rows written once, in the pgTAP file: pgTAP asserts the SQL function against it and a unit test parses the same rows as text and asserts the accessor"
    - "A condition on a table row is one function that takes the row type, asked by every function that reads such a row"
    - "A red pgTAP run over a function that does not exist yet is made with a stub that answers NULL, created for the run and dropped after it, so every row fails on its expectation instead of the file raising"

key-files:
  created:
    - apps/supabase/supabase/tests/database/45-registration-mode-matrix.test.sql
    - packages/dev-seed/tests/registrationModeMatrixParity.test.ts
  modified:
    - apps/supabase/supabase/tests/database/39-invitations.test.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/506-invitation-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/app-shared/src/settings/contestantAppConfig.ts

key-decisions:
  - "Items J3a to J3d were read by the operator on 2026-10-11 and stand at their recommended options: open rows only, faction and alliance targets not judged, a disallowed row absent from the claim's answer, the base dataset widened (done in plan 178-03)"
  - "Item PL-28 stands at its recommended option: the code check asks the condition only of an open, unexpired row, so such a row costs one read of its project's settings row that a code naming nothing does not; the function's header says so and no assertion covers a timing"
  - "The truth table's row for an unknown mode stores that mode in the row it is asked of, so the vocabulary guard is what answers; the plan placed it on the tenth shape, which stores no unknown mode"
  - "The truth-table file's red run was made over a stub of the function that answers NULL, created for the run and dropped after it"

patterns-established:
  - "A matrix that allows every mode is written into a pgTAP file's own projects in its own setup; 00-helpers.test.sql stays as it is"
  - "Every refusal asserted with a mode off is followed by the same call with the mode on again"

requirements-completed: [REG-09, REG-10]

coverage:
  - id: D1
    description: "An open candidate or organization invitation whose registration mode is switched off is treated as absent in the code check, the link request and the claim, with no answer, slot, pending address or skip reason of its own"
    requirement: REG-10
    verification:
      - kind: other
        ref: "apps/supabase/supabase/tests/database/39-invitations.test.sql, Section 22, the assertions titled MODE — 21 of 34 red at head f794dbb38 with the tests in the working tree (tests/e2e-runs/178-unit/178-05-pgtap-red.log), 34 of 34 green in tests/e2e-runs/178-gates/178-05-db row pgtap at head 9c0f92616"
        status: pass
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-05-t2-verify.sh (Task 2's automated block, byte for byte) — exit 0 at head 9c0f92616"
        status: pass
    human_judgment: false
  - id: D2
    description: "A finished registration is untouched by the matrix: a claimed code answers used with the mode on, off and on again, and its claimant is still answered their own address with the mode off; a user who holds a grant in the project is answered under a matrix that allows nothing"
    requirement: REG-09
    verification:
      - kind: other
        ref: "39-invitations.test.sql — 'MODE: a claimed candidate code still answers used with the code mode off', 'MODE: the same code checked twice gives the same answer both times…', 'MODE: a link request with the claimed code still answers its claimant''s own address with the code mode off', 'MODE: under a matrix that allows nothing, a user who holds a grant in the project is answered their own address'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Rows the matrix cannot name are not judged: a project-scope promise, a faction's invitation and an alliance's invitation are answered and claimed under a matrix that allows nothing"
    requirement: REG-10
    verification:
      - kind: other
        ref: "39-invitations.test.sql — 'MODE: under that matrix the address of a project-scope promise, of a faction''s invitation and of an alliance''s invitation is each answered' and the three claim assertions after it"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rule has one statement in SQL, proved against the table the TypeScript accessor is proved against: 32 rows over 15 stored shapes"
    requirement: REG-10
    verification:
      - kind: other
        ref: "apps/supabase/supabase/tests/database/45-registration-mode-matrix.test.sql — 32 of 32 red over a stub that answers NULL, 32 of 32 green in 178-05-db row pgtap"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/registrationModeMatrixParity.test.ts#answers every row as the table states — green from the moment it was written; one row flipped by hand was named by it and restored"
        status: pass
    human_judgment: false
  - id: D5
    description: "None of the three functions is reachable by an API role: each is in private, revoked from PUBLIC, anon and authenticated, with an empty search_path"
    verification:
      - kind: other
        ref: "39-invitations.test.sql — the four catalogue assertions at the end of Section 22; proacl read from pg_proc on the reset database: postgres alone on each"
        status: pass
    human_judgment: false
  - id: D6
    description: "The committed E2E suite is green with the server enforcing the matrix, on the predecessor's projects and totals, and over plan 178-04's schema and adapter for the first time"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-05-close — 444 passed of 444; node 178-verdict.mjs e2e 178-05-close --same-projects-as 178-03-close: PASS, 116 projects compared, 0 not as expected"
        status: pass
    human_judgment: false
  - id: D7
    description: "The timing of the code check does not tell an open invitation whose mode is off from a code that names nothing"
    verification: []
    human_judgment: true
    rationale: "Not built and not asserted, by the plan's ruling 7 (item PL-28, threat T-178-156, accepted): the condition is asked only of an open, unexpired row, which costs one primary-key read more. A timing assertion would be a fixed-window test."

duration: 33min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 05: The Registration-Mode Matrix Decides What the Server Honours — One Rule in SQL Proved Against the Table the TypeScript Accessor Is Proved Against, and the Condition Asked in the Code Check, the Link Request and the Claim — Summary

**An open invitation of a candidate or an organization is now honoured only while its project allows the row's mode for that type — `code` for a row bound to a code, `email` for one bound to an address — and is otherwise answered exactly as an invitation that does not exist, in `invitation_code_status`, `invitation_link_request` and `claim_invitations`; the rule is `private.registration_mode_allowed_in`, proved on 32 rows that `isRegistrationModeAllowed` is proved on too; 2394 pgTAP assertions green on a freshly reset database and 444 of 444 E2E tests green on the same 116 projects as before.**

## Read this first

- **Everything is green and nothing was retried.** Two commits, three verify blocks at exit 0, eleven gate rows at 0, one full run: 444 passed, 0 failed, flaky, skipped or did not run, not void. No dataset needed correcting in Task 3.
- **The first full run over plan 178-04's schema and adapter found nothing of 178-04's.** No `loginFailed` in the dev-server log, no test red.
- **The question plan 178-03 left open is settled, with no change needed** (section *The three perm datasets that state `organization: []`*): no committed spec invites an organization in those datasets, and their editors are registered by a direct grant and a password, never through an invitation.
- **A consequence an operator should know: a project that stores no matrix now honours no candidate's and no organization's invitation.** The shipped default allows nothing, and `seed.sql` creates the default project with `{}`. This is the decision as written (D-05), asserted for a project with no settings row and for one whose row stores no matrix. The publishers' guide still says the opposite — see *For later plans*.
- **Items J3a to J3d and PL-28 were read by the operator on 2026-10-11 and stand at their recommended options**; all five are built so.
- **Two departures worth a look** (section *Deviations*): the truth table's row for an unknown mode stores that mode, which the plan's wording of the row did not; and the truth-table file's red run was made over a stub function that answers NULL, so that its 32 failures are expectations and not one raised error.

## Performance

- **Duration:** about 33 min
- **Started:** 2026-10-12T17:24:33Z
- **Completed:** 2026-10-12T17:57Z
- **Tasks:** 3
- **Files modified:** 7 (two created, five modified; the generated types have no diff)

## Task Commits

1. **Task 1: The truth table, its unit twin and the condition's assertions, committed before the schema** — `52beb7a00` (test)
2. **Task 2: The matrix readers and the condition in the three invitation functions, applied to the local database** — `9c0f92616` (feat, `[db]`)
3. **Task 3: The gate rows and the full E2E run over the first two schema plans** — no commit of its own: runs and their evidence, and this summary

## Each task's verify command, with its real exit status

Each script is the plan's `<automated>` block byte for byte, written by `tests/e2e-runs/178-unit/178-05-extract-verify.mjs` and run with `bash`; its `.log`, `.exit` and `.head` are beside it. This was the first run of all three blocks and none has a defect.

| Task | Script | Head it ran at | Exit |
|---|---|---|---|
| 1 | `178-05-t1-verify.sh` | `52beb7a00` | **0** |
| 2 | `178-05-t2-verify.sh` | `9c0f92616` | **0** |
| 3 | `178-05-t3-verify.sh` | `9c0f92616` | **0** |

Task 1's block was not run again at the final head. Its stage `git diff --quiet HEAD -- … tests/database packages/dev-seed/tests` and its searches hold there by construction — Task 2 changed no test file — but that is inferred, not run.

## The three perm datasets that state `organization: []`

What was read, before the condition landed:

| Caller | Dataset its project runs on | What it invites | The matrix there | Outcome under the condition |
|---|---|---|---|---|
| `invitation-contract.spec.ts` (`seedEmailInvitation('candidate')`, `seedCodeInvitation('organization')`, `seedEmailInvitation('organization')` three times, `inviteAndAskForLink('organization')`) | `e2e/base` (depends on `data-setup-base`) | a candidate by email; an organization by code and by email | both types served, `email` and `code` for each | honoured |
| `invitation-landing.spec.ts` (`seedProjectInvitation`, three times) | `e2e/base` | project-scope promises | — | not judged |
| `contestant-journey.spec.ts` (`client.inviteByEmail` for `JOURNEY_CANDIDATE`) | `e2e/base`, through `data-setup-contestant-journey`, which writes no settings | a candidate by email | as above | honoured |
| `perm-localisation-positive.spec.ts` (`client.inviteByEmail`, `entityType: 'candidate'`) | `perm-localisation-positive`, on the family's shared settings | a candidate by email | candidates alone served, `email` and `code` | honoured |
| `invitationFlow.fixture.ts` | — | the steps the specs above call; `inviteAndAskForLink` has the one caller named in the first row | — | — |

The three datasets — `perm-organization-editing`, `perm-no-nomination`, `perm-contestant-nominations` — each store `candidate: ['email', 'code'], organization: []` with both types served. **No spec and no setup seeds an invitation in any of them**: `grep` for the seeding steps, `inviteByEmail`, the link request and the claim in the three specs finds nothing. Their editors — organization editors included — are registered by `registerAndStoreSession`, which calls `forceRegisterUser`: an auth user created with a password by the admin API, the grant rows written directly, then a sign-in through the login form with that password. No invitation exists, no link is asked for and the claim has nothing to match. So enforcing the matrix changes nothing those datasets' specs can observe, and an open organization invitation there, were one seeded, would rightly read as absent.

`perm-closed-project.spec.ts` writes matrices with modes switched off; it registers through `forceRegister` and seeds no invitation either. No file under `tests/tests` both writes app settings and seeds an invitation, other than the admin client that defines both methods.

One thing read and not shown by reading alone: the suite's datasets are seeded one after the other into the one project the suite owns, each replacing the settings row. Whether a perm dataset with `organization: []` could be in place while the contract spec invites an organization depends on the order of the projects, which I did not trace. The full run is the observation: the project `invitation-contract` passed 15 of 15.

## The truth table — file 45, and the rows as written

The new pgTAP file is **`45-registration-mode-matrix.test.sql`** (the directory's last was 44). `plan (32)`, 32 calls of the function, 32 titles beginning `MATRIX`. It calls no fixture: the function reads no table.

**No row was corrected by the accessor.** The unit test was green on its first run. To see that it can fail, I flipped the stated answer of one row by hand; the test named that row by its title, and the file was restored byte for byte before anything was staged.

The fourteen shapes of the plan, with what each stores beside the member the shape is about — chosen so that only that member decides between the two entity types' answers:

| Shape | Stored | candidate, email | organization, email |
|---|---|---|---|
| nothing stored | `{}` | false | false |
| a null root | `contestantApp: null` | false | false |
| entity types a string | `"organization"`, both rows `["email"]` | true | false |
| an empty list | `[]`, both rows `["email"]` | true | false |
| only an unknown member | `["faction"]`, both rows `["email"]` | true | false |
| a type listed twice | `["candidate","candidate"]`, both rows `["email"]` | true | false |
| no list of entity types | both rows `["email"]` | true | false |
| candidates alone served | both rows `["email"]` | true | false |
| organizations alone served | both rows `["email"]` | false | true |
| a matrix that is a string | both served, `"email"` | false | false |
| no matrix | both served | false | false |
| rows a string and an object | both served, `"email"` and `{"email": true}` | false | false |
| candidate `email`, `code`; organization empty | both served | true | false |
| candidate empty; organization `email`, `code` | both served | false | true |

The four further rows: candidate with `code` on the thirteenth row's shape (true); candidate with `identity_provider` there (false); organization with `code` on the fourteenth's (true); and candidate with `sms` (false) on a fifteenth shape — the thirteenth with `sms` added to the candidate's stored row. See *Deviations*.

The string row stores `"organization"` and the string-and-object row stores the text `email` in both, on purpose: `'"email"'::jsonb ? 'email'` and `'{"email": true}'::jsonb ? 'email'` are both true in PostgreSQL, so a reader without the check of the JSON type would answer true where the accessor answers false.

## The reader as written, beside the research's sketch

`private.registration_mode_allowed_in` implements the sketch's rule and differs from it in form only: the two stored members are read once, in a one-row subselect, and the type's row is read from the matrix with `->` instead of a second path expression. The order of the conjuncts differs. The sketch had not been run; this function passes all 32 rows.

`private.registration_mode_allowed` is the rule over `(SELECT settings FROM public.app_settings WHERE project_id = …)`, coalesced to false for a project with no row. `private.invitation_mode_allowed` is a `CASE`: true for a scope that is not `entity`, true for a target type outside `candidate` and `organization`, else the reader's answer for the row's project, its target type as text, and `code` where `code_hash` is set, else `email`. An entity-scope row with a null target type, which a CHECK forbids, would fall to the reader and read false.

Read from `pg_proc` on the reset database:

| Function | Arguments | Volatility | Definer | `proconfig` | `proacl` |
|---|---|---|---|---|---|
| `private.registration_mode_allowed_in` | 3 | immutable | no | `search_path=""` | `postgres=X` |
| `private.registration_mode_allowed` | 3 | stable | yes | `search_path=""` | `postgres=X` |
| `private.invitation_mode_allowed` | 1 | stable | no | `search_path=""` | `postgres=X` |

Where the condition is asked: `invitation_code_status` — one `WHEN NOT … THEN 'unknown'` arm after the claimed and the expired arms; `invitation_link_request` — one `ELSIF NOT … THEN RETURN NULL` after the expiry arm and before the arm for a missing address, and one conjunct in the test for an open invitation for the address; `claim_invitations` — one conjunct in the `WHERE` of the loop's query. The arm for a claimed code and the arm for a user who holds a grant are unchanged. Each function's header says what a switched-off mode does there; the code check's header also states the one settings read an open row costs and a code naming nothing does not.

`contract.ts` and `invitationAccess.ts` are untouched: the code statuses are still `valid`, `used`, `unknown` and the skip reasons still `candidate_has_editor`, `target_not_in_project` (Task 2's verify reads both).

## File 39: its plan, its setup and its new section

**`plan (259)` → `plan (293)`.** No existing section needed more than the setup's matrix: after the schema landed, all 259 earlier assertions were green with one `UPDATE app_settings` in the setup that merges, into the settings of projects A and B, both types served and `identity_provider`, `email` and `code` allowed for each. The file's third project, C, holds one project-scope promise and is deleted; it needs no matrix.

Section 22, "the registration-mode condition", has its own entities, seven users, six invitations in project A and two in a new project D. Its 34 assertions, each title beginning `MODE: `:

- **Seeding is not judged** (1): `create_invitations` writes a candidate's code row and an organization's email row in a project with no settings row.
- **The code mode, for candidates** (15): bound and claimed with every mode on (3, the control for a claimed row); with the mode off — the open code answers `unknown`, the claimed one `used`, each the same when asked twice, the link request answers null, binds nothing, writes no throttle key, and the claimed code still answers its claimant's address (7); on again — `valid` and `used`, and a link request in the same minute answers the address, so the refused request left the slot free (2); off again with the code now bound — the user whose address is the row's pending address claims nothing, the answer being `{"claimed":[],"skipped":[],"password_set":false}` whole, the row still open with its pending address and no grant written (2); on again — the same user claims the same row (1).
- **The email mode, for organizations** (6): off — null, no throttle key, nothing claimed, the row open and no grant; on again — the address answered in the same minute and the row claimed.
- **A matrix that allows nothing** (5): a user who holds a grant is answered; a project-scope promise, a faction's row and an alliance's row are each answered and each claimed.
- **No matrix** (3): a project with no settings row, then with a row that stores no matrix, honours neither a candidate's open code nor an organization's open email invitation; with a matrix it honours both.
- **Structure** (4): one signature each, the rule immutable, the reader a stable definer function, the condition stable and running as its caller; an empty `search_path` on each; none executable by `anon` or `authenticated`; none a public function.

Beyond the plan's list: the assertion on seeding, the project with no settings row, the empty `search_path`, "none is a public function", and `used` while the mode is on.

## Red before green

| Run | Head | Result |
|---|---|---|
| `yarn workspace @openvaa/supabase test:db`, tests in the working tree, schema unchanged, the rule's function stood in for by a stub that answers NULL — `178-05-pgtap-red.{log,exit,head}` | `f794dbb38` | exit **1**: file 39 failed 21 of 293 (264, 266–269, 272–281, 287–292), file 45 failed 32 of 32; **no other file**; `Wstat: 0` on both, every failure a `have`/`want` pair; 45 files, 2394 tests |
| the same command after `yarn db:reset` on the uncommitted schema — `178-05-t2-pgtap-green.log` | `52beb7a00` + schema | exit **0**: 45 files, 2394 tests |

Thirteen of the section's 34 assertions were green before the schema and still test something: they are the controls (the mode on) and the state that must not change (a claimed code answers `used`, a grant holder is answered, the unjudged rows are honoured, none of the three is public). The red run was made on a database reset and seeded with the default dataset, with no E2E run since, so the known finding on test 238 did not appear.

## The regenerated migration's diff

`00001_initial_schema.sql`: 134 lines changed, 8846 lines, byte-identical to the 29 schema files in order (`yarn assert:schema-migration-parity` 0). It holds what the two schema files hold and nothing else: in the `301` part two entries in the header's function list and, at the end, the two readers with their headers and `REVOKE`s; in the `506` part one entry in the function list, one more name in the dependency line, the condition's function with its header and `REVOKE` above `invitation_code_status`, the changed header sentences of the three functions, and the four lines of the condition. `packages/supabase-types/src/database.ts` was regenerated from the reset database and came out **byte-identical**: all three functions are in `private`. The schema commit therefore holds four files, not the five the plan lists.

## The gate rows

**`tests/e2e-runs/178-gates/178-05-db`, head `9c0f92616`** — `178-verdict.mjs gates … --rows db-reset,types-regen,types-clean,pgtap,sql-lint,integration`: **PASS**, six expected and six recorded, not stale, no Sleep entry in the window.

| Row | Status | Seconds |
|---|---|---|
| db-reset | 0 | 29 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 6 |
| sql-lint | 0 | 3 |
| integration | 0 | 5 |

**`tests/e2e-runs/178-gates/178-05-close`, head `9c0f92616`** — `… --rows typecheck,lint,unit,build,format`: **PASS**, five expected and five recorded, not stale, no Sleep entry in the window.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 48 |
| unit | 0 | 38 |
| build | 0 | 18 |
| format | 0 | 20 |

The unit row took 38 s against 77 s and 84 s in the two plans before; turbo reports 25 tasks, 0 cached, and the new spec's name is in its log. I did not look for why it was faster.

## The full run — `tests/e2e-runs/178-e2e/178-05-close`, head `9c0f92616`

- total 444, passed 444, failed 0, flaky 0, skipped 0, did not run 0; 116 projects
- wrapper status 0; no void marker; one preflight success, no failure; no Sleep, Wake or DarkWake entry in the window
- started 2026-10-12 19:42:46 local, ended 19:55:09 (12 min 23 s)
- Docker VM free space before it: **15.84 GiB** (the driver's reading after its own builder prune; the guard is 13.8)
- power: AC throughout, 99 % at the start and 100 % at the end
- `node 178-verdict.mjs e2e 178-05-close --same-projects-as 178-03-close`: **PASS** — **116 projects compared, 0 not as expected**; every project's total equals its predecessor's
- the dev-server log holds the same kinds of entries as `178-03-close`'s, in like numbers: the standing `TypeError … (reading 'map')` of `Input.svelte` once, the file watcher's rescan errors, the placeholder media 404s. No `loginFailed`. None is this plan's.

No axe finding and no overflow: no surface changed.

## Decisions Made

- **J3a to J3d and PL-28** as above. Recorded, not chosen.
- **The condition's function is not a definer function.** It reads nothing itself; the reader it calls is the definer. Its three callers are definer functions, so it runs as their owner.
- **The three functions are revoked from `PUBLIC`, `anon` and `authenticated` and granted to nobody**, so the service role holds nothing on them either. It never calls them directly: it calls the three public functions, which run as their owner.
- **The matrix written into file 39's projects allows all three modes**, `identity_provider` included, as the plan words it; nothing in the file reads that mode.

## Deviations from Plan

### Auto-fixed Issues

None. No bug, missing piece or blocker was met.

### Other departures, none of them a fix

1. **The truth table's `sms` row is on a fifteenth shape.** The plan puts "candidate with the mode `sms` (false)" on the tenth shape, whose candidate row is `["email", "code"]`. There the answer is false whatever the function does with an unknown mode, so the check that a mode is one of the three is tested by no row; and the plan's own must-have lists "an unknown mode" among the stored shapes. The row as written stores `["email", "code", "sms"]`, so a reader without that check would answer true where the accessor answers false. The count stays 32.
2. **The truth-table file's red run was made over a stub.** Calling a function that does not exist raises, and the file errors instead of failing — the trap plan 178-04 named for catalogue assertions, here met by the truth table itself, whose form (a literal call) is fixed by the plan. `178-05-pgtap-red.sh` created `private.registration_mode_allowed_in` as a one-line function returning `NULL::boolean` directly in the local database, ran the suite, and dropped it; it checked before that none of the three functions existed and after that none was left. The stub was never in a file of the tree. The catalogue assertions of file 39 read `pg_proc` by name and were red over the stub too (volatile, executable by `PUBLIC`).
3. **`yarn db:reset`, `yarn db:types` and pgTAP were each run once directly**, on the uncommitted schema, as Task 2 step 5 lays out and the gate driver cannot do; the in-flight check was made first by `178-05-inflight-check.sh` (450 `started` markers, each with an `ended`; nothing on 5273; 15.94 GiB).
4. **The schema commit holds four files, not five**: the regenerated types have no diff.
5. **The truth-table file does not call `create_test_data()`.** The checklist's pgTAP item expects it; the function under test reads no table, and the plan says the file holds only the truth table. It has the `BEGIN` … `ROLLBACK` boundary.
6. **Assertions beyond the plan's list** in file 39 (five, named above), and in the parity spec one case beyond it (every row has a title of its own) and one further expectation (every call of the function in the file is parsed as a row).
7. **`.planning/WINDOWS.md` was not written to.** No stub, no skipped test, no verify that was not run.
8. **The reading named in the plan's `<context>` was kept to the sketch.** Of `178-RESEARCH.md` I read the two code examples; of `178-PATTERNS.md` nothing. The plan's own text carried what the tasks needed, and the reading budget is the dispatch's rule.

## Issues Encountered

- **The parity spec failed the import-order lint rule as first written.** `yarn eslint` named it before the commit; `--fix` reordered three imports. It was not in a committed state.
- Nothing else. No gate set was running while a file of the tree was edited: every marker was waited for.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves the issue | yes: a switched-off mode is closed on the server in the three places an open invitation is read |
| OWASP top 10 | A01: the matrix is enforced where the promise is honoured, not only where a screen offers it; the three functions are executable by no API role, asserted. A04: no fourth answer, slot, pending address or skip reason tells a caller that an invitation exists with its mode off, asserted; the timing of the code check is the accepted residual (T-178-156) |
| Code style guide | followed |
| No `any` | none added; the parity spec casts the parsed strings to the accessor's parameter types |
| No repeated code | the rule exists twice by design, once in SQL and once in TypeScript, held together by the truth table. The condition is one function with four call sites |
| New entities documented | SQL headers on the three functions; the changed sentences in the three callers' headers; the docblock above `REGISTRATION_MODE`; TSDoc in the parity spec |
| Repo documentation updated | **no — see "For later plans"**: the publishers' guide states the opposite of the new behaviour, and the database skill has no row for the three functions; none is in this plan's files |
| Tracking events | not applicable |
| Svelte component guidelines | not applicable: no component |
| Errors handled and logged | a refusal is an answer, not an error: `unknown`, null, or an absent row |
| Failing checks | none at the close |
| Dependents not unduly affected | the full run is green on the predecessor's tests; the writer's integration test, which seeds a project-scope code row in the default project, is green (project scope is not judged) |
| WCAG, keyboard, screen reader | not applicable: nothing rendered changed |
| Developers' and Publishers' guides | as "Repo documentation updated" |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit, with the new files staged; every touched comment read; no id of a decision, plan or item in a comment or a title |
| Commit history | two commits, one per task with files, neither a fix of the other |
| Formatting separate | no formatting-only change; the formatter touched only lines these commits wrote |
| `[db]` tag | on `9c0f92616` |
| Supabase backend: definer functions pin `search_path = ''` and qualify calls | yes, all three functions, asserted |
| Supabase backend: pgTAP in `BEGIN`/`ROLLBACK` over `create_test_data()` | file 39 yes; file 45 has the boundary and no fixture (departure 5) |
| Supabase backend: assertion patterns | `is` throughout: every assertion compares an answer or a catalogue reading with a literal |
| Supabase adapter, Edge Functions | not touched |

## Observed, and inferred

- **Observed:** the red run and what each failure was; pgTAP green on a reset database twice, once directly and once in the driver; the three functions' catalogue rows; the unit spec naming a row flipped by hand; all eleven gate rows; the full run and its comparison; no Sleep entry in any window.
- **Observed at the database, not through the Edge Function:** every refusal. `account-access` calls the two service-role functions and its source is unchanged, so its answers for a switched-off mode are inferred from theirs. No E2E test switches a mode off and asks the function; plan 178-17's spec is where one could.
- **Inferred, not observed:** that no perm dataset's settings are in place while the contract spec invites an organization. The run passing is consistent with it and does not prove the order.
- **Not measured:** the size of the timing difference of the code check (item PL-28).

## Not done, or not verified

- Nothing of the plan is undone.
- **The `stack` row was not run**; neither gate set includes it. The Edge Function's source and the auth configuration are unchanged by this plan.
- **Documentation was not updated** (below).
- **`check-frontend` was not run**: the plan's closing rows do not include it and no frontend file changed.

## The state the local stack is left in

Up; not restarted. The database was reset twice by this plan (once directly, once by the driver), seeded with the default dataset, then used by the full run, which created and removed its own project's rows: 2 auth users, 0 invitations, 3 projects, 13 rows in `private.invitation_link_witness`. Because a full run has touched it, **pgTAP test 238 of `39-invitations.test.sql` is red on this database until the next reset** — the known finding. The stub function of the red run is gone (dropped, and two resets since). Nothing listens on the E2E port 5273 and no `started` without an `ended` is under `tests/e2e-runs/` (451 read). Docker VM free space: 15.76 GiB at the last reading.

## For later plans

- **Predecessor label for the next full run: `178-05-close`** — 444 tests, 116 projects, head `9c0f92616`.
- **Every plan that seeds a candidate's or an organization's invitation: the project's stored matrix must allow the row's mode for that type, or the invitation reads as absent** — `unknown` from the code check, a `not-sent` witness from the link request, an empty claim. The base dataset allows `email` and `code` for both types; the perm family's shared settings serve candidates alone; `perm-organization-editing`, `perm-no-nomination` and `perm-contestant-nominations` allow nothing for organizations. A project-scope promise, a faction's row and an alliance's row are never judged.
- **178-06 — a recovery request is not an invitation and nothing here judges it.** `recovery_link_request` reads accounts; if it also reads open invitations for the address, `private.invitation_mode_allowed (i)` is the conjunct to ask, as the link request does.
- **178-06, 178-20 — a pgTAP file that seeds entity invitations in a project of its own** writes a matrix into that project's settings in its own setup; file 39's `UPDATE app_settings` near its top is the form. A project made by `INSERT INTO public.projects` has no settings row at all, and then nothing is allowed.
- **178-06 — a new `private` function in `506` needs its own `REVOKE … FROM PUBLIC, anon, authenticated`**; the blanket grant of `301` does not reach it and PostgreSQL gives `PUBLIC` EXECUTE on every new function.
- **Any plan that writes a red pgTAP assertion calling a function that does not exist yet:** the file raises instead of failing. Either read the catalogue by name, or make the red run over a stub that answers NULL and drop it after (`tests/e2e-runs/178-unit/178-05-pgtap-red.sh` is the form).
- **178-12, 178-17 — the settings read the code check makes is per row, not per call**: a spec that switches a mode off through the admin client and asks at once is answered under the new matrix; nothing is cached.
- **178-16, 178-18 — the screens and the server now read the same rule.** A screen that offers a mode the stored matrix does not allow would lead to an invitation the server treats as absent; `listedRegistrationModes` should stay a reading of `getEffectiveRegistrationModes`, which the truth table pins.
- **178-23 — documentation this plan made out of date, none of it edited:**
  - `apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md`, the sentence "An invitation created by an administrator works whatever is set here: an invitation is not a registration mode." It is now false for a candidate's and an organization's invitation: with nothing declared, neither is honoured.
  - `.claude/skills/database/SKILL.md` § 10 (invitations): nothing on the condition; the pgTAP counts (now 45 files, 2394 assertions; file 39 is `plan (293)`).
  - `.claude/skills/database/schema-reference.md`: no row for `private.registration_mode_allowed_in`, `private.registration_mode_allowed` or `private.invitation_mode_allowed`; the rows of the three callers.
  - The `apps/docs` pages that describe the three functions: `developers-guide/backend/authentication`, `backend/edge-functions`, `contestant-app/pre-registration-and-invitation`.
  - `apps/supabase/README.md`, if it describes what the code check answers `unknown` for.
- **Timing on this host today:** the red pgTAP run 7 s, the six database rows 45 s, the five closing rows 2 min 24 s, the full run 12 min 23 s.

## Prohibitions

| Id | Statement | Held | How |
|---|---|---|---|
| PROH-178-13 | no answer of the server says why an invitation was not honoured | yes | a refused row answers `unknown`, null, or is absent from both lists of the claim, each asserted as the whole answer; no throttle key and no pending address is written, asserted; `contract.ts` and `invitationAccess.ts` unchanged, read by Task 2's verify. The code check's timing is the accepted residual |
| PROH-178-14 | the defaults of the matrix are not written a second time by hand in SQL | yes | the SQL holds no default matrix: a matrix that is not an object allows nothing. The one default it states, candidates alone served, is the rule's own and is pinned by four shapes of the table against the accessor (a list that is a string, an empty one, one holding only an unknown member, and none) |
| PROH-178-15 | a switched-off mode never revokes what a finished registration holds | yes | only open rows are asked: the claimed arm of the code check and of the link request come before the condition, and the claim's query already excludes claimed rows; asserted for the code check, the claimant's link request and a grant holder |

## Threat Flags

None. The plan's register covers what was built: three functions in `private`, no endpoint, no table, no new path for an API role.

## Known Stubs

None.

## Next Phase Readiness

Ready for plan 178-06. The matrix is enforced where an open invitation is read, the rule has one statement in SQL pinned to the TypeScript accessor, the committed tree is green on eleven gate rows and a full run, and the first full run over plan 178-04's schema and adapter found nothing.

## Self-Check: PASSED

- Commits `52beb7a00` and `9c0f92616` are ancestors of HEAD; `git rev-list --count f794dbb38..HEAD` was 2 before this file's commit.
- Found on disk: `45-registration-mode-matrix.test.sql`, `registrationModeMatrixParity.test.ts`, both gate runs' `summary.tsv`, the full run's `summary.json`, the red log.
- Each `must_haves.artifacts` string is in its file (Task 2's verify searches for the two SQL ones; `isRegistrationModeAllowed` is in the parity spec, Task 1's verify).
- `git status --short` before this file was written: `?? CAND-APP-PLAN.md` and nothing else.
