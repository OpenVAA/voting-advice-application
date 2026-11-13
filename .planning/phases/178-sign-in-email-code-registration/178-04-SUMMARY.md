---
phase: 178-sign-in-email-code-registration
plan: 04
subsystem: database
tags: [supabase, postgres, pgtap, security-definer, get_user_entities, password-fact, public-config, data-writer, zod]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-01: the gate driver and the verdict script; plan 178-02: probe rows P3 and P4; plan 178-03: the dataset the next full run is made on"
provides:
  - "private.caller_password_set () RETURNS boolean: the caller's own password fact, no argument, null where no caller is signed in, executable by authenticated alone, in 301-auth-functions.sql"
  - "private.user_password_set (uuid) moved from 506-invitation-rpcs.sql to 301-auth-functions.sql, body unchanged, executable by no API role"
  - "The key password_set of public.get_user_entities, beside entities; signature, cardinality and SECURITY INVOKER unchanged"
  - "The member access.answersLocked of public.contestant_app_public_config, its fourth value"
  - "BasicUserData.passwordSet: boolean, filled on every call of getBasicUserData(), which takes no argument and rejects when the fact cannot be read"
  - "parseCallerPasswordSet (apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.ts)"
  - "pgTAP: fourteen PWD assertions in 36-entity-identity.test.sql and three LOCK assertions in 38-contestant-app-public-config.test.sql; the estate is 2328 assertions in 44 files"
affects: [178-05, 178-06, 178-14, 178-18, 178-19, 178-22, 178-23, 178-24]

actuals:
  tokens: 19545
  tasks: 3
  commits: 3
plan_head_before: 07a064529b2d2f91490ad2ca64c072e4c57ccc19
plan_head_after: c45fff34c17fcd07dcb854e7523c41850aef81e7

tech-stack:
  added: []
  patterns:
    - "A fact about the caller that lives in auth.users is read through a zero-argument definer function in private, granted to authenticated alone, over a helper that takes an id and is executable by no API role"
    - "A function defined after the blanket grant on the private schema states its own REVOKE and GRANT"
    - "A catalog assertion on a function that may not exist reads pg_proc and compares with a literal, so an absent function is a failed expectation and not a raised error"
    - "A test stub of the Supabase client under the real writer answers its RPCs by name"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/tests/database/36-entity-identity.test.sql
    - apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/schema/506-invitation-rpcs.sql
    - apps/supabase/supabase/schema/106-app-settings.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.test.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
    - apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts
    - apps/frontend/src/lib/contestant/gates/gates.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
    - "apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts"

key-decisions:
  - "Item J1 is built at option (b) by the operator's ruling of 2026-10-11 (decision H1): passwordSet is required on BasicUserData and read on every call"
  - "Item J5 was read by the operator on 2026-10-11 and stands at its recommended option (a): the stored access.answersLocked joins the public configuration; nothing in the frontend copies it yet"
  - "private.caller_password_set answers null, not false, where no caller is signed in: the plan's header sentence for it and the body the research sketched disagree, and the header's contract is the one built and asserted"
  - "The three cast fixtures of BasicUserData the dispatch named hold passwordSet: true although the type check named none of them; the unit suite named two admin test stubs instead, and those were changed"

patterns-established:
  - "Schema plan order: test files committed red and alone, then schema with regenerated migration applied by a reset and pgTAP green before its commit, then the driver's database rows on the committed tree"
  - "No file of the tree is edited while a gate set is running"

requirements-completed: [REG-11, REG-01]

coverage:
  - id: D1
    description: "The database answers, for the caller only, whether the caller's account has a password, as the key password_set of get_user_entities; null and the empty string read false, a hash true, and no caller reads a JSON null"
    requirement: REG-11
    verification:
      - kind: other
        ref: "apps/supabase/supabase/tests/database/36-entity-identity.test.sql, the fourteen assertions titled PWD — red 11 of 75 at head 07a064529 (tests in the working tree), green in tests/e2e-runs/178-gates/178-04-db row pgtap at head 591404682"
        status: pass
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-04-t2-verify.sh (Task 2's automated block, byte for byte) — exit 0 at head 591404682"
        status: pass
    human_judgment: false
  - id: D2
    description: "No function answers for another account: the wrapper takes no argument and is executable by authenticated alone, and the helper that takes an id is executable by none of anon, authenticated and service_role"
    requirement: REG-11
    verification:
      - kind: other
        ref: "36-entity-identity.test.sql — 'PWD: private.caller_password_set has one signature and takes no argument…', '…is executable by authenticated and by neither anon nor service_role', 'PWD: private.user_password_set (uuid)… is executable by none of anon, authenticated and service_role', 'PWD: neither… is a public function'"
        status: pass
    human_judgment: false
  - id: D3
    description: "The public configuration answers access.answersLocked as its fourth value, as stored and null where unset, and no other stored gate"
    requirement: REG-01
    verification:
      - kind: other
        ref: "apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql, three assertions titled LOCK and five restated whole-answer literals — red 8 of 18 before the schema, green in 178-04-db row pgtap"
        status: pass
    human_judgment: false
  - id: D4
    description: "The adapter fills BasicUserData.passwordSet on every call of getBasicUserData with one read of get_user_entities for its project, and rejects on an RPC error or an answer without a boolean"
    requirement: REG-11
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts#getBasicUserData > password fact; apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.test.ts#parseCallerPasswordSet — red 21 of 246, green 246 of 246; yarn workspace @openvaa/frontend test:unit 4251 passed"
        status: pass
      - kind: integration
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts#reads a signed-in editor's user-level data, with the account's password fact as a boolean — passed in tests/e2e-runs/178-gates/178-04-close row integration (31 of 31) at head c45fff34c"
        status: pass
      - kind: other
        ref: "bash tests/e2e-runs/178-unit/178-04-t3-verify.sh (Task 3's automated block, byte for byte) — exit 0 at head c45fff34c"
        status: pass
    human_judgment: false
  - id: D5
    description: "A failed read of the fact gives the Admin App's identity decision no user"
    requirement: REG-11
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts#yields the forbidden verdict for a verified admin when the read of the password fact fails / answers no boolean"
        status: pass
    human_judgment: false
  - id: D6
    description: "Nothing a browser can observe has changed"
    verification: []
    human_judgment: true
    rationale: "This plan makes no E2E run by design: it closes on the database rows and the writer's integration test, and the first full run over this schema and adapter is 178-05-close. Until that run the statement is inferred from the unit suite and from no page, layout or load having been edited."

duration: 21min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 04: The Caller's Password Fact on the User-Data Read, the Answers Lock in the Public Configuration, and the Adapter's Read That Refuses to Guess — Summary

**`get_user_entities` now says, for the caller alone, whether the caller's account has a password — through a zero-argument definer function that `authenticated` alone may execute, over a helper no API role may — the public configuration answers `access.answersLocked` as its fourth value, and `getBasicUserData()` reads the fact on every call and rejects when it cannot: 2328 pgTAP assertions green on a freshly reset database, 4251 frontend unit tests green, and the writer's integration test reading the fact through a real session.**

## Read this first

- **Item J1 is built at option (b), by the operator's ruling of 2026-10-11 (decision H1).** `passwordSet` is a required boolean of `BasicUserData`; `getBasicUserData()` takes no argument and reads it on every call. A failed read fails the whole user-data read for every caller, the Admin App's included, which a unit case now pins.
- **Item J5 was read by the operator on 2026-10-11 and stands at its recommended option (a).** The stored value joins the public configuration; nothing in the frontend copies it yet.
- **One departure from the plan's wording of the SQL, flagged because a later plan could trip on it:** `private.caller_password_set ()` answers **null**, not `false`, where no caller is signed in. See *Deviations*, item 1.
- **The type check named no fixture.** The dispatch expected it to name three; all three use `as BasicUserData` casts, which a missing member does not break. The **unit suite** named two other files, the Admin identity test stubs, which went red in 12 tests until their client stub answered the new read. See *Every producer, mock and typed fixture*.
- **No E2E run was made, by the plan's own ruling 4.** Nothing red, flaky, skipped or void anywhere. No axe finding and no overflow: no surface changed.
- **I edited test files 5 seconds after a gate set finished, without having waited for its marker.** The run was not contaminated — the evidence is under *Issues Encountered* — but it was luck of timing, not care. Every later gate set was waited out before a file was touched.

## Performance

- **Duration:** about 21 min
- **Started:** not recorded at dispatch. The dispatch base `07a064529` was committed at 2026-10-12T17:00:03Z; the first recorded moment of this plan is 17:05:52Z, the red pgTAP run.
- **Completed:** 2026-10-12T17:20:35Z
- **Tasks:** 3
- **Files modified:** 18 (thirteen of the plan's fourteen — the generated types came out byte-identical — and five test files under Task 3's step 5)

## Task Commits

1. **Task 1: The fact and the fourth public value as assertions, committed red** — `200f37c63` (test)
2. **Task 2: The caller's password fact and the fourth public value, applied to the local database** — `591404682` (feat, `[db]`)
3. **Task 3: The adapter reads the fact on every call, and refuses to guess it** — `c45fff34c` (feat)

## Each task's verify command, with its real exit status

Each script is the plan's `<automated>` block byte for byte, extracted from the plan file by a script and run with `bash`; its `.log`, `.exit` and `.head` are beside it under `tests/e2e-runs/178-unit/`. **This was the first run of all three blocks, and none has a defect.**

| Task | Script | Head it ran at | Exit |
|---|---|---|---|
| 1 | `178-04-t1-verify.sh` | `200f37c63` | **0** |
| 2 | `178-04-t2-verify.sh` | `591404682` | **0** |
| 3 | `178-04-t3-verify.sh` | `c45fff34c` | **0** |

Re-run at the final head `c45fff34c`: Task 1's block exits **0**; Task 2's exits **1**, on its last stage alone — `178-verdict.mjs gates 178-04-db` reads the gate run as stale, because Task 3's commit changed files outside `.planning/` after it. That is the block's construction and not a regression: every earlier stage of it passes, and Task 3 changed nothing under `apps/supabase` or `packages/supabase-types` (`git diff --stat 591404682 c45fff34c` names eleven files, all under `apps/frontend/src`).

## Where each function was placed, and the privileges observed

In `apps/supabase/supabase/schema/301-auth-functions.sql`, by character offset: the grant `ON ALL FUNCTIONS IN SCHEMA private` at 47267, `FUNCTION private.user_password_set` at 49014, `FUNCTION private.caller_password_set` at 50369. Both are after the grant and after its `REVOKE` on `private.feedback_client_ip`, the helper first, at the end of the file. `506-invitation-rpcs.sql` defines neither; `claim_invitations` is unchanged and still calls the helper.

Read from `pg_proc` on the reset database:

| Function | Arguments | Definer | `proconfig` | `proacl` | anon | authenticated | service_role |
|---|---|---|---|---|---|---|---|
| `private.caller_password_set` | 0 | yes | `search_path=""` | `postgres=X, authenticated=X` | no | **yes** | no |
| `private.user_password_set` | 1 (`uuid`) | yes | `search_path=""` | `postgres=X` | no | no | no |

`get_user_entities` keeps `(uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER`, its `REVOKE … FROM PUBLIC, anon` and its `GRANT … TO authenticated`. The census of `07-rpc-security.test.sql` did not move: both functions are in `private`.

## The assertions added, and each file's plan

**`36-entity-identity.test.sql` — plan 61 → 75.** Three accounts are created in the file's own fixture: P1 with an empty string, P2 with a null, P3 with a hash, none holding a grant. Fourteen assertions, by title:

1. `PWD: the answer of a caller that edits an entity has exactly the top-level keys entities and password_set`
2. `PWD: password_set is true for a caller whose encrypted_password holds a hash`
3. `PWD: password_set is false for a caller whose encrypted_password is the empty string`
4. `PWD: password_set is false for a caller whose encrypted_password is null`
5. `PWD: the answer of a caller that edits none has exactly the same two top-level keys`
6. `PWD: a caller with no entity still gets exactly one row`
7. `PWD: and that row is one object holding an empty entities array and the caller's password_set`
8. `PWD: accounts read one after the other each get their own password_set, so the account with a hash reads true again after two that read false`
9. `PWD: password_set is a JSON null, neither true nor false, where no caller is signed in`
10. `PWD: private.caller_password_set has one signature and takes no argument, so it can name no account but the caller's`
11. `PWD: private.caller_password_set is SECURITY DEFINER with an empty search_path and no other setting`
12. `PWD: private.caller_password_set is executable by authenticated and by neither anon nor service_role`
13. `PWD: private.user_password_set (uuid), which takes an account's id, is executable by none of anon, authenticated and service_role`
14. `PWD: neither caller_password_set nor user_password_set is a public function, so PostgREST publishes neither`

Three of them are beyond the plan's list: 9 (the null for no caller, see *Deviations*), the `service_role` half of 12, and 14. Three were green before the schema and still test something: 6, 13 and 14 hold the state that must not change.

**`38-contestant-app-public-config.test.sql` — plan 16 → 18.** Two new assertions and one retitled:

- `LOCK: anon reads the stored access.answersLocked of the closed project B, a stored true as true` (new)
- `LOCK: a project that stores no access.answersLocked is answered a JSON null there, as for the other three values` (new)
- `LOCK: the access member has exactly the keys answersLocked and contestantApp, so no other stored gate is reachable` (was "…exactly the key contestantApp…")

Five whole-answer literals of the same file gained `"answersLocked"` — the open project A's (null), the signed-in caller's answer for B (true) and the three all-null answers — and their titles and the file's header say four values.

**Every other pgTAP assertion of the top-level keys of `get_user_entities`:** none exists. `git grep get_user_entities -- apps/supabase/supabase/tests/database` finds file 36 and one assertion in `21-entity-organization.test.sql` about parameter defaults; none stated the key set before this plan. The two assertions of `39-invitations.test.sql` that name `user_password_set` read it by schema and name, not by file, and hold unchanged.

## Red before green

| Run | Head | Result |
|---|---|---|
| `yarn workspace @openvaa/supabase test:db`, tests in the working tree, schema unchanged — `178-04-pgtap-red.{log,exit,head}` | `07a064529` | exit **1**: file 36 failed 11 of 75 (tests 50–54, 56–58, 66–68), file 38 failed 8 of 18 (8, 10, 13–18), each with `have`/`want` lines; **and file 39 failed test 238** |
| the same command after `yarn db:reset` on the uncommitted schema — `178-04-t2-pgtap-green.log` | `200f37c63` + schema | exit **0**: 44 files, 2328 tests |
| the two unit files over a one-line skeleton of the parser (`return false`) and an unchanged adapter — `178-04-adapter-red.{log,exit,head}` | `591404682` | exit **1**: 21 of 246 failed, every one an `AssertionError` |
| the same two files over the implementation | working tree | 246 of 246 |

**File 39's test 238 in the red run is the known finding, not this plan's**: the run was made on the database the full run `178-03-close` had touched, where `private.invitation_link_witness` holds rows no teardown removes. The plan's sentence "red in files 36 and 38 and in no other" is therefore true of this plan's assertions and not of the log as a whole. After the reset the same test is green.

The parser's skeleton existed only for the red run and was never committed: without it the parser's cases would have failed on a missing export, which is not an expectation.

## The regenerated migration's diff

`00001_initial_schema.sql`: 73 insertions, 35 deletions, 8722 lines, byte-identical to the 29 schema files in order (`yarn assert:schema-migration-parity` 0). It holds the four changes and nothing else: in the `106` part the `access` object of `contestant_app_public_config` built from two members instead of one, with three header sentences saying four; in the `301` part one more name in the *Depends on* line, two entries in the header's function list, "four fixed settings values" for "three", and at the end of the part the moved helper with a header of its own and the new wrapper with its `REVOKE` and `GRANT`; in the `503` part the `'password_set', private.caller_password_set()` member with a new header paragraph, a longer entry in the function list and the invoker paragraph now naming two definer calls; in the `506` part the helper's header, body and `REVOKE` removed and the dependency line naming where it now lives. `packages/supabase-types/src/database.ts` was regenerated from the reset database and came out **byte-identical**: both functions are in `private`, which the generator does not read, and `get_user_entities` still returns `Json`. The schema commit therefore holds five files, not six.

## The gate rows

**`tests/e2e-runs/178-gates/178-04-db`, head `591404682`** — `178-verdict.mjs gates … --rows db-reset,types-regen,types-clean,pgtap,sql-lint,integration`: **PASS**, six expected and six recorded, not stale, no Sleep entry in the window.

| Row | Status | Seconds |
|---|---|---|
| db-reset | 0 | 29 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 6 |
| sql-lint | 0 | 3 |
| integration | 0 | 5 (30 tests) |

**`tests/e2e-runs/178-gates/178-04-close`, head `c45fff34c`** — `… --rows typecheck,lint,integration,unit,check-frontend,build,format`: **PASS**, seven expected and seven recorded, not stale, no Sleep entry in the window.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 25 |
| lint | 0 | 51 |
| integration | 0 | 4 (31 tests, the new case among them, passed) |
| unit | 0 | 77 |
| check-frontend | 0 | 10 |
| build | 0 | 16 |
| format | 0 | 20 |

Docker VM free space before the first long step: **15.76 GiB** (the floor is 13.8). Power: on AC throughout, 70 % at dispatch and 89 % at the end.

## Every producer, mock and typed fixture of `BasicUserData`

**What the type check named: nothing.** `yarn workspace @openvaa/frontend check` exited 0 with `passwordSet` required and no fixture touched (2205 files, 0 errors). The one producer is `_getBasicUserData`, which is this task's file.

**What the unit suite named: two files**, 12 tests red in `yarn workspace @openvaa/frontend test:unit` (`178-04-t3-frontend-unit.log`, exit 1) and green after the change (`…-r2.log`, exit 0, 4251 passed). Both run the real writer over a stubbed client whose `rpc` answered every name as `user_can`:

| File | What changed |
|---|---|
| `apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts` | the stub answers `get_user_entities` by name with a password fact, `true` by default; a case that passes its own `rpc` spy now records only the `user_can` calls on it; two new cases pin the forbidden verdict when the read of the fact fails or answers no boolean, with `user_can` never asked |
| `apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts` | the stub answers `get_user_entities` by name; the comment I changed lost its plan reference |

**What I changed without either naming it: three cast fixtures**, each gaining `passwordSet: true`, on the dispatch's instruction and because a cast hides a missing required member:

| File | Fixture |
|---|---|
| `apps/frontend/src/lib/contestant/gates/gates.test.ts` | `userWith` |
| `apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts` | `userWith` |
| `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts` | `USER` |

**Left alone, and still without the member:** six untyped `USER` object literals that stand in for the user in page data — `(protected)/layout.tracking.test.ts`, `(protected)/page.tracking.test.ts`, `[...page=contestantEntityPage]/page.tracking.test.ts`, `[entityType=servedEntityType]/[entityId=uuid]/layout.tracking.test.ts`, `…/(nominated)/layout.tracking.test.ts`, `…/(nominated)/preview/page.tracking.test.ts` — and the `USER` of `gateFocus.svelte.test.ts` and `termsOfUseLayout.svelte.test.ts`. None is typed as `BasicUserData`, nothing reads the member from them today, and neither check names them.

## Decisions Made

- **J1 (b)** and **J5 (a)**, as above. Recorded, not chosen.
- **Null for no caller** (see *Deviations*, item 1).
- **`passwordSet: true` in the three cast fixtures**: the value of a user the future gate lets through, so that plan 178-14's gate leaves the existing cases ungated.
- **The integration case asserts `true`, not merely a boolean.** The editor it reads is created with a password, so the stronger statement is deterministic.
- **The comment in `_setPassword` was brought in line with probe row P4**, because this plan adds a comment to that file: it now says `updateUser({ password })` leaves the access token as it is and that no `refreshSession()` follows. What it does not say: that a browser client was observed. Row P4 used a Node client with its session in memory.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's body for `private.caller_password_set` would have made its own header false**
- **Found during:** Task 1, writing the assertions against what Task 2 was to build
- **Issue:** Task 2 step 1 gives the body as "returns `private.user_password_set` of `(SELECT auth.uid())`" and the header as "it returns null for a caller that is not signed in". The helper coalesces to `false` for an id that names no user, so that body answers **false** for a null `auth.uid()`. The two sentences cannot both hold.
- **Fix:** the body is `SELECT CASE WHEN (SELECT auth.uid()) IS NOT NULL THEN private.user_password_set((SELECT auth.uid())) END;` — the helper's answer for a caller, null for none. The header says so as the plan words it. I chose the header over the sketch because null is the answer the rest of the plan wants for "no fact": the adapter throws on it, where `false` would be a guess.
- **What it does not change:** nothing an API role can observe today. `anon` and the service role cannot execute the function, and `authenticated` has an `auth.uid()`. It is reachable only as `postgres`, which is how the assertion reaches it.
- **Verification:** `PWD: password_set is a JSON null, neither true nor false, where no caller is signed in` — red before the schema (`have: NULL`, the key being absent), green after
- **Committed in:** `200f37c63` (the assertion), `591404682` (the body)

**2. [Rule 1 - Bug] Two Admin identity test files went red: their client stub did not answer the new read**
- **Found during:** Task 3 step 6, the frontend's whole unit suite
- **Issue:** 12 tests of `requireAdminIdentity.test.ts` and `adminJobsAuthorization.test.ts` failed, every "allowed" case reading "forbidden". Both stubs answer every RPC with the `user_can` answer, which is no password fact, so the real writer rejected and the decision had no user. That is the behaviour the plan states for a failed read, met in a test double.
- **Fix:** each stub answers `get_user_entities` by name; two cases added to the first file pin the behaviour itself (see the table above). One type error I introduced on the way — the optional `rpc` spy typed as `ReturnType<typeof vi.fn>` is not callable — was caught by `check` and fixed with a function type before the commit.
- **Files modified:** the two test files
- **Committed in:** `c45fff34c`

---

**Total deviations:** 2 auto-fixed (2 bugs). **Impact:** one SQL body one `CASE` longer than sketched, with an assertion that pins it; two test files beyond the plan's list, both mocks of the kind Task 3's step 5 names.

### Other departures, none of them a fix

- **Three assertions beyond the plan's list** in file 36 (9, the `service_role` half of 12, and 14) and **two unit cases beyond it** in `requireAdminIdentity.test.ts`.
- **`yarn db:reset` and pgTAP were each run once directly, not through the gate driver**, as Task 1 step 3 and Task 2 step 5 lay out and as the driver cannot do: it refuses an uncommitted tree, and the types and pgTAP of a schema must be seen before its commit. The dispatch says both run "only through the gate driver"; the two documents disagree on this and I followed the plan, with the driver's in-flight check made first by a script of my own (`178-04-inflight-check.sh`: 450 `started` markers read, each with an `ended`; nothing on port 5273; the disk floor).
- **The schema commit holds five files, not six**: the regenerated types have no diff.
- **`.planning/WINDOWS.md` was not written to.** No stub, no skipped test, no verify that was not run.
- **`yarn db:seed:default` was run once**, after the `178-04-db` gate set as Task 2 step 7 says. The `178-04-close` set has no reset, so the seed still stands.

## Issues Encountered

- **My first in-flight check refused falsely, and the reset did not run.** I wrote it inline with `for f in $FOUND`, which zsh does not split into words — the very trap the dispatch names. It took the whole list as one path, found no `ended` beside it and exited 9 before the reset. Nothing was harmed: a check that cannot look refused. The check now lives in a script run with `bash`.
- **I edited three test files while a gate set could still have been running.** I launched `178-04-db` in the background and went on to write Task 3's tests without waiting for its marker. By the files' modification times the set's `done` was written at 19:10:24 local and my edits at 19:10:29, and its `integration.json` holds 30 tests, none of them the case I was adding, which would have failed on that tree. So the rows are of the committed tree — observed, but by timing I did not control. The verdict's staleness check compares commits, not the working tree, and would not have caught the other order.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves the issue | yes: the fact exists for the caller alone, the adapter reads it without guessing, the lock is public |
| OWASP top 10 | A01: the helper that takes an id is executable by no API role and the wrapper takes none, both asserted. A09: a failed read throws; it is not logged and defaulted. Error messages name schema paths and the RPC's message, never a stored value (one unit case each) |
| Code style guide | followed; no numeric literal or naming exception |
| No `any` | none added |
| No repeated code | `parseCallerPasswordSet` repeats the three-line issue-path formatting of `parseUserEntities` beside it; not extracted. The protected layout's load now reads `get_user_entities` twice, once in each of two writer methods — the round trip the ruling accepts |
| New entities documented | TSDoc on `parseCallerPasswordSet`, `BasicUserData.passwordSet` and `getBasicUserData`; SQL headers on both functions |
| Repo documentation updated | **no — see "For later plans"**: seven documentation sentences are now out of date and none is in this plan's files |
| Tracking events | not applicable: no user-facing function |
| Svelte component guidelines | not applicable: no component |
| Errors handled and logged | the failure is thrown to callers that already catch it: the Contestant layout signs the user out, `getUserData` answers no user |
| Failing checks | none at the close |
| Dependents not unduly affected | the Admin App's identity decision and two pages make one more read and fail with it, by the ruling; two of their test stubs changed |
| WCAG, keyboard, screen reader | not applicable: nothing rendered changed |
| Developers' and Publishers' guides | as "Repo documentation updated" |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every touched comment read; one plan reference removed from a comment I changed |
| Commit history | three commits, one per task, none a fix of another |
| Formatting separate | no formatting-only change |
| `[db]` tag | on `591404682` |
| Supabase backend: definer functions pin `search_path = ''` and qualify calls | yes, both, asserted for the wrapper |
| Supabase backend: `(SELECT auth.uid())` | yes |
| Supabase backend: pgTAP in `BEGIN`/`ROLLBACK` over `create_test_data()` | yes |
| Supabase adapter | the read goes through the adapter's own client with `p_project_id: this.projectId`; `yarn assert:project-scoped-queries` 0. No column mapping: one boolean, narrowed by a schema |
| Edge Functions | not touched |

## Observed, and inferred

- **Observed:** both red runs and what each failure was; pgTAP green on a reset database twice, once directly and once in the driver; the privileges, from `pg_proc`; the adapter reading `true` for a real signed-in editor on the local stack; the 12 Admin tests red while the stub gave no fact, which is the failed-read path seen end to end in a unit run; all thirteen gate rows; no Sleep entry in either gate window.
- **Inferred, not observed:** that the adapter reads `false` for a real passwordless user on the stack. `false` is observed at the database (pgTAP, two accounts) and at the adapter over a stub (unit), not through a link session; the tracer of plan 178-14 is the first such observation.
- **Inferred, not observed:** that nothing a browser observes changed. No E2E run was made here.
- **Inferred, not observed:** that the Contestant layout signs a user out when the new read fails. `layout.server.test.ts` holds that for a rejected `getBasicUserData`, with the method mocked; no run made the real read fail under the real load.

## Not done, or not verified

- Nothing of the plan is undone.
- **No full E2E run**, by ruling 4. The predecessor label is still `178-03-close`.
- **The `stack` row was not run**; neither gate set includes it.
- **The database rows were not run again on the final head.** They ran at `591404682`; the three commits after and including it differ from the final head only under `apps/frontend/src`.
- **Documentation was not updated** (below).

## The state the local stack is left in

Up; not restarted. The database was reset twice by this plan (once directly, once by the driver), then seeded with the default dataset, then used by the integration row of `178-04-close`, which removes its own rows: 2 auth users, 0 invitations, 2 projects, 328 candidates. No E2E run has touched it since the reset, so pgTAP test 238 of `39-invitations.test.sql` is green on it until the next full run. Nothing listens on the E2E port 5273 and no `started` without an `ended` is under `tests/e2e-runs/`. A Vite dev server of another repository (`…/Kaljarv/harallt/apps/web`) listens on `[::1]:5173`; it is not this project's and was left alone. Docker VM free space: 15.76 GiB at the one reading taken.

## For later plans

- **178-05 — the predecessor label is still `178-03-close`** (444 tests, 116 projects). `178-05-close` is the first full run over this plan's schema **and** adapter: from `c45fff34c` every signed-in load of both apps makes one more read of `get_user_entities` and is rejected when it fails. A wall of sign-outs with `loginFailed`, or Admin pages with no user, in that run points here first (the research's Pitfall 1).
- **178-05, 178-06 — a new `private` function defined after the blanket grant in `301` needs its own `REVOKE` and `GRANT`.** PostgreSQL gives `PUBLIC` EXECUTE on every new function, so "executable by no API role" needs a `REVOKE … FROM PUBLIC, anon, authenticated`; the service role holds nothing on a `private` function unless granted.
- **178-05, 178-06 — a catalog assertion on a function that may not exist yet** must not name it as a `regprocedure` or call it: that raises and the file errors instead of failing. Read `pg_proc` by schema and name and compare with a literal, as the PWD catalog assertions do.
- **Any plan whose test runs the real writer over a stubbed client** (the Admin identity tests are the pattern): `getBasicUserData` now calls `rpc('get_user_entities', { p_project_id })`. A stub that answers every RPC alike gives it no boolean and the read rejects. Answer by name.
- **178-14 — `passwordSet` is always a boolean on a `BasicUserData` the writer returned**, and a load that reaches the gate list has one. The three cast fixtures hold `passwordSet: true`. **Eight other test files hold a user object without the member** (listed under *Left alone*): the moment a gate predicate or a view reads `user.passwordSet` from page data in one of them, it reads `undefined`. Add the member there when the gate lands.
- **178-14 — the protected layout's load makes two reads of `get_user_entities`** for an ungated user: one inside `getBasicUserData`, one inside `getUserEntities`. Its unit test counts calls of the mocked methods, not RPCs, so nothing there moved.
- **178-14, 178-19 — `private.caller_password_set` answers null where there is no caller**, and the adapter throws on null. No signed-in session can meet it.
- **178-14, 178-19, 178-23 — the comment in `_setPassword` now states probe row P4's finding.** If the tracer's test shows a browser client to differ, that comment is the sentence to correct.
- **178-18 — the provider copies three members of a public configuration that now answers four.** `supabaseDataProvider.ts` says "Place the three values `contestant_app_public_config` answers at their storage paths": the count is of what it places, which is still three, but the function answers four. Its *Limitation* paragraph names `access.answersLocked` among what is not honoured for an anonymous visitor of a closed project; that stays true until the provider copies the member. `supabaseDataProvider.test.ts` already feeds it an answer with `answersLocked` and expects it dropped.
- **178-23 — documentation this plan made out of date, none of it edited:**
  - `.claude/skills/database/SKILL.md`: `contestant_app_public_config` "holding exactly `access.contestantApp`, `contestantApp.entityTypes` and `contestantApp.registrationModes`" (now four); § 9's description of `get_user_entities` (no `password_set`); the pgTAP count "2312 assertions… 43 files declare plans summing to 2303" (now 2328 and 2319).
  - `.claude/skills/database/schema-reference.md`: the row of `contestant_app_public_config` ("Three stored…"), the row of `get_user_entities`, the row of `private.user_password_set` (file `506`, now `301`), and no row for `private.caller_password_set`.
  - `.claude/skills/database/rls-policy-map.md`: "the three values as stored" in the row on file 38.
  - `apps/docs/…/developers-guide/backend/authentication/+page.md` and `…/contestant-app/entity-selection/+page.md`: `get_user_entities` described as an object with an `entities` array and nothing else.
  - `apps/docs/…/developers-guide/configuration/app-settings/+page.md`: what an anonymous visitor of a closed project can read.
  - `178-RESEARCH.md` § J1, `178-PATTERNS.md`, `178-CONTEXT.md` and the UI contract's `BasicUserData` row still describe option (a), as the dispatch already says; not edited.
- **Every executor — do not touch the tree while a gate set runs.** I did once and was saved by five seconds. Wait for the `.exit` marker, then edit.
- **Every executor — an inline `for x in $LIST` in the tool's shell does not split.** Put loops in a script run with `bash`.
- **Timing on this host today:** the six database rows 45 s, the seven closing rows 3 min 23 s, a full pgTAP run 5 to 8 s, `yarn db:reset` 29 s.

## Prohibitions

| Id | Statement | Held | How |
|---|---|---|---|
| PROH-178-10 | no function this plan adds or changes answers whether another account has a password; the helper stays executable by no API role | yes | the wrapper has one signature with zero arguments and `get_user_entities` passes it nothing (assertions 10, 12, 13, 14); the helper's privileges read `false` for three roles from `pg_proc` |
| PROH-178-11 | a failed or malformed read is never turned into `false` or `true` by the adapter | yes | the RPC error is rethrown and the parser throws on anything but a boolean: five rejecting cases at the adapter and ten at the parser, each red first; no branch of `_getBasicUserData` assigns a default |
| PROH-178-12 | the generated migration and types are never hand-edited, and `00-helpers.test.sql` is not edited | yes | the migration was written by `yarn schema:regenerate` alone and passes the parity gate; the types by `yarn db:types`; the three accounts are created in file 36's own fixture; `git diff 07a064529 HEAD -- '*00-helpers*'` is empty |

## Threat Flags

None. The plan's register covers what was built: one definer read of `auth.users` for the caller (T-178-17, T-178-18), the adapter's refusal to guess (T-178-19), the reachability of the wrapper (T-178-20), the public configuration's fixed key set (T-178-21) and the accepted extra round trip (T-178-22). No endpoint, auth path or table was added.

## Known Stubs

None.

## Next Phase Readiness

Ready for plan 178-05. The fact the set-password gate will be decided on exists and reaches the adapter; the committed tree is green on all thirteen gate rows this plan names; the database is freshly reset and seeded with the default dataset.

## Self-Check: PASSED

- Commits `200f37c63`, `591404682` and `c45fff34c` are ancestors of HEAD; `git rev-list --count 07a064529..HEAD` is 3.
- Found on disk: the two schema artifacts checked (`301-auth-functions.sql`, `userEntities.ts`), both gate runs' `summary.tsv`, both red logs.
- Each `must_haves.artifacts` string is in its file (Tasks 2 and 3's verify scripts search for four of the five; `FUNCTION private.caller_password_set` is the offset the first of them prints).
- `git status --short` before this file was written: `?? CAND-APP-PLAN.md` and nothing else.
