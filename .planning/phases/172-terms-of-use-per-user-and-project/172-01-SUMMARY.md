---
phase: 172-terms-of-use-per-user-and-project
plan: 01
subsystem: database
tags: [supabase, postgres, rls, column-grants, pgtap, schema-lint, terms-of-use, gates, e2e, baseline]

requires:
  - phase: 170-contestant-app-rename-symbols-routes
    provides: "The post-rename tree every name of this phase is resolved against, the app-name gate in lint:check, and the gate, E2E and allowlist-probe drivers this phase's helpers are modelled on"
  - phase: 171-project-settings-served-entity-types-registration-mode-matri
    provides: "The schema, migration and generated types this plan regenerates on top of; pgTAP file 38; the 177-test default suite; the finding that generated types must be read from a freshly reset database"
provides:
  - "172-NAMES.md: every name the nine plans use, resolved against the tree with the command that found it, and the phase baseline"
  - "172-gates.sh and 172-e2e.sh: the static gate set and one preflight-confirmed E2E run, each with --status, --judge and --path and a `done` marker per attempt"
  - "public.terms_of_use_acceptances (user_id, project_id, accepted_at) with primary key (user_id, project_id), both foreign keys cascading, and the database supplying who and when"
  - "The self-row access model: two policies for authenticated, SELECT on the table and INSERT on project_id only; no update, no delete, nothing for anon"
  - "37-terms-of-use-acceptances.test.sql: 41 pgTAP assertions over every cell of that model"
  - "A green baseline before the first edit and a green close after the last: nine gate rows at 0 and 177 of 177 E2E tests, both times"
affects: [172-02, 172-03, 172-04, 172-05, 172-06, 172-07, 172-08, 172-09, 173, 174, 178]

actuals:
  tokens: 17340
  tasks: 3
  commits: 3
plan_head_before: 03b8a0524569558b034c72c55c9c1699be9ecf0d
plan_head_after: e3fe7cd4cf9922d4fead2297214fcb82cebcfc4f

tech-stack:
  added: []
  patterns:
    - "A self-row table outside the grant model: identity-only policies, a REVOKE ALL that undoes the default ACL, then a table-level SELECT and a column-level INSERT, so the caller can state which project and neither who nor when"
    - "A gate set that regenerates the types resets the database first: the pgTAP helper file commits functions into public, and a gate set runs pgTAP"
    - "A helper run claims an attempt directory first and writes `done` (its exit status) last, on every exit path; a rerun under a label takes <label>-r2, -r3"
    - "A pgTAP file's negative control: run it inside a transaction that widens the grants and is rolled back, and count the assertions that go red"

key-files:
  created:
    - .planning/phases/172-terms-of-use-per-user-and-project/172-NAMES.md
    - .planning/phases/172-terms-of-use-per-user-and-project/172-gates.sh
    - .planning/phases/172-terms-of-use-per-user-and-project/172-e2e.sh
    - apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql
    - apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql
  modified:
    - apps/supabase/scripts/lint-schema.mjs
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts

key-decisions:
  - "Row 02 of the gate set is `yarn db:reset` followed by `yarn db:types`, not `yarn db:types` alone: on a database where pgTAP has run since the last reset the regenerated types gain 18 lines of test helpers and row 03 is red on a correct tree (measured before the first gate run)"
  - "The gate set refuses to start while an E2E run is in flight, because its reset would destroy the state that run depends on"
  - "Check 9001 reported exactly the two new policies as reaches_neither and nothing else, so exactly two entries with one written reason were added to REACHES_NEITHER_ALLOW"
  - "One full E2E run was made on the final tree although the plan closes on the static gates alone: the schema is applied to the database every E2E run uses"
  - "The pgTAP file asserts seven facts beyond the plan's list, among them that the DO UPDATE form of an upsert is refused and that stating the caller's own user_id is refused"

patterns-established:
  - "172-NAMES.md is read first by every later task; where a plan and the file disagree the file wins and no plan is edited"
  - "Order at a plan's close: the gate set (it resets the database), then the E2E run (it leaves the database as it finds it)"

requirements-completed: [TOU-01]

coverage:
  - id: D1
    description: "Every name the nine plans use is resolved against the tree Phases 170 and 171 left, with the command that found it; no row differs; the phase baseline is recorded"
    verification:
      - kind: other
        ref: "grep -q '^## Resolved names' and grep -q '^base_rev:' on 172-NAMES.md (exit 0); 39 table rows; every existing path in the files_modified lists of plans 02 to 09 is tracked"
        status: pass
    human_judgment: false
  - id: D2
    description: "The tree was green on every static gate and on the full E2E suite before any source edit"
    verification:
      - kind: other
        ref: "bash 172-gates.sh --judge 172-01-baseline (exit 0; nine rows, every status 0; head 03b8a0524)"
        status: pass
      - kind: e2e
        ref: "bash 172-e2e.sh --judge 172-01-baseline (exit 0; 177 total, 177 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; the full default suite)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two helpers exist, are executable and parse; each reports absent, running or done, judges an earlier attempt and never overwrites evidence"
    verification:
      - kind: other
        ref: "bash -n on both scripts (exit 0, 0); the modes exercised on a scratch copy outside the repository: absent, done 1, -r2 after a rerun, judge red on a dropped total, a slice, a did-not-run and a non-zero wrapper status, judge green otherwise"
        status: pass
    human_judgment: false
  - id: D4
    description: "public.terms_of_use_acceptances exists with primary key (user_id, project_id), both foreign keys ON DELETE CASCADE, user_id defaulting to auth.uid() and accepted_at NOT NULL defaulting to now()"
    requirement: TOU-01
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql#assertions 1 to 6 (table, key, the two cascades, exactly two foreign keys, the three columns with their defaults)"
        status: pass
      - kind: other
        ref: "yarn assert:schema-migration-parity (exit 0; 27 schema files, 6466 lines, one migration file)"
        status: pass
    human_judgment: false
  - id: D5
    description: "authenticated holds SELECT on the table and INSERT on project_id only, no UPDATE and no DELETE; anon holds nothing"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "Task 2's verify chain (exit 0): the privilege string reads falsefalsefalsetruefalsefalse; relacl {postgres=arwdDxtm,service_role=arwdDxtm,authenticated=r}; column ACL project_id {authenticated=a}, none on user_id and accepted_at"
        status: pass
      - kind: integration
        ref: "37-terms-of-use-acceptances.test.sql#assertions 7 to 18 (row-level security, the two policies and their predicates, nine privilege cells)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A signed-in user records their own acceptance and repeats it without error; a forged user_id, a forged accepted_at, an UPDATE, a DELETE and any anon statement are each refused with SQLSTATE 42501; another user's row is unreadable; a row for project A is not a row for project B; a row goes with its user"
    requirement: TOU-01
    verification:
      - kind: integration
        ref: "37-terms-of-use-acceptances.test.sql#assertions 19 to 41, inside yarn workspace @openvaa/supabase test:db (exit 0; Files=38, Tests=1392, Result: PASS)"
        status: pass
      - kind: other
        ref: "negative control: the file run inside a rolled-back transaction with GRANT ALL to anon and authenticated and an anon policy: 17 of 41 assertions red; unmutated in the same harness: 41 of 41 green; catalogue unchanged afterwards"
        status: pass
    human_judgment: false
  - id: D7
    description: "No function is added and the definer census in 07-rpc-security.test.sql is unchanged; candidates.terms_of_use_accepted still exists and nothing in this plan reads or removes it"
    verification:
      - kind: other
        ref: "git diff 03b8a0524 HEAD -- apps/supabase/supabase/tests/database/07-rpc-security.test.sql apps/supabase/supabase/schema/102-entities.sql (empty); the column census is 44 files and 159 lines before and after"
        status: pass
    human_judgment: false
  - id: D8
    description: "The plan closes green on one tree: nine static gates at 0 and the full E2E suite at 177 of 177"
    verification:
      - kind: other
        ref: "bash 172-gates.sh --judge 172-01-table (exit 0; nine rows, every status 0; head e3fe7cd4c, clean tree)"
        status: pass
      - kind: e2e
        ref: "bash 172-e2e.sh --judge 172-01-table (exit 0; 177 total, 177 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; head e3fe7cd4c)"
        status: pass
    human_judgment: false
  - id: D9
    description: "Two entries were added to REACHES_NEITHER_ALLOW in lint-schema.mjs, the schema linter's list of policies that ask no authority question"
    verification:
      - kind: other
        ref: "yarn db:lint:sql before the entries (exit 1; exactly the two policies reported as reaches_neither, no other finding) and after (exit 0; Summary: 0 error(s), 3 warning(s))"
        status: pass
    human_judgment: true
    rationale: "The list is a security surface and the plan lists the entries for operator review. That the gate fired on exactly these two policies is measured; whether the written reason is the right one to accept is the operator's call."
  - id: D10
    description: "PROH-172-01: acceptance is never recorded on a user's behalf by the product"
    verification: []
    human_judgment: true
    rationale: "The plan marks the prohibition as verified by judgment. The supporting facts are measured: the only file under apps/supabase/supabase/schema or functions that names the table is the new schema file, it creates no function and no trigger, and no file under apps/frontend, packages/dev-seed or tests names the table yet."

duration: 33min
completed: 2026-10-06
status: complete
---

# Phase 172 Plan 01: Names, Gate Helpers, a Green Baseline and the Acceptance Table Summary

**`public.terms_of_use_acceptances` now exists on the local database, keyed on user and project, with an access model in which a signed-in user can say which project they accept for and can state neither who accepts nor when; 41 pgTAP assertions prove every cell of it; and the phase has its reconciled name map, its two gate helpers and a baseline that was green before the first edit (nine gate rows at 0, 177 of 177) and is green after the last.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-10-05T23:50:40Z
- **Completed:** 2026-10-06T00:24:00Z
- **Tasks:** 3 of 3
- **Files changed:** 8 (3 under `.planning/`, 5 outside)
- **Start revision:** `03b8a0524569558b034c72c55c9c1699be9ecf0d`
- **The tree the closing gates and the closing E2E run describe:** `e3fe7cd4cf9922d4fead2297214fcb82cebcfc4f`

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| Rows marked DIFFERS in `172-NAMES.md` | **None.** All 39 rows resolve under the name the plans use. Four rows carry a note where the tree is more specific than a plan's wording (below) |
| Had Phase 171 executed? | **Yes**, all four plans. Its schema edit was on the tree and regenerated; parity was 0 before the first edit |
| Did check 9001 fire? | **Yes**, on exactly the two new policies, both `reaches_neither`: `authenticated_insert_terms_of_use_acceptances [INSERT]` and `authenticated_select_terms_of_use_acceptances [SELECT]`. No `identical_predicate`, no other finding |
| Entries added | `['public', 'terms_of_use_acceptances', 'authenticated_select_terms_of_use_acceptances']` and `['public', 'terms_of_use_acceptances', 'authenticated_insert_terms_of_use_acceptances']`, under one comment giving the reason. Nothing was added to any other list |
| pgTAP file | `apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql`; 37 was free |
| Its plan count | `plan (41)`, and 41 assertions |
| Schema file | `apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql`; 304 was the next free `30x` number |
| Baseline gates | green: `tests/e2e-runs/172-gates/172-01-baseline`, nine rows, every status 0, head `03b8a0524` |
| Baseline E2E | green: `tests/e2e-runs/172/172-01-baseline`, 177 total, 177 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, the full default suite, head `03b8a0524` |
| pgTAP files changed besides the new one | **None.** No estate census counted the new table; `36-entity-identity` and `16-anon-visibility` pass unchanged |

The four notes in the names file:

- The line `logout: () => Promise<void>;` stands in two type files; the contestant context's own is `contestantContext.type.ts`.
- `dynamic.json` has one top-level key, `dynamic`, and `contestantApp.error.json` has one top-level key, the literal `"contestantApp.error"`. Both message keys exist in all seven locales.
- `tou-save-error` is not in the test-id registry. It is a literal in the protected layout and in its unit test.
- The gate view's own Logout button carries no test id; `testIds.contestant.home.logout` is the home page's.

## Accomplishments

- Resolved 39 roles against the tree and wrote the phase's name map and baseline.
- Wrote the two helpers and proved their modes on a scratch copy before the first real run.
- Recorded a green baseline on the untouched tree: nine gate rows and the full E2E suite.
- Added the table, its index, its two policies, the revoke and the two grants in one schema file; regenerated the migration and the types; applied them to the local database.
- Wrote the pgTAP file and showed with a negative control that its assertions go red when the grants are widened.
- Closed on one tree: nine gate rows at 0, then the full E2E suite at 177 of 177.

## Task Commits

1. **Task 1: names, helpers, baseline** — `1e6900c5b` `chore(172-01): reconcile the phase's names with the tree, add the gate and E2E helpers, record a green baseline`
2. **Task 2: the table, its access model, the linter entries** — `8f5368609` `feat[db](172-01): add the terms-of-use acceptance table with its self-row access model`
3. **Task 3: the pgTAP file** — `e3fe7cd4c` `test[db](172-01): prove the access model of the terms-of-use acceptance table in pgTAP`

`git rev-list --count 03b8a0524..e3fe7cd4c` is 3. The commit that carries this file follows them.

## Gate and E2E Results

Every exit status was read from the command itself or from the attempt's `done` file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Schema parity, before any edit | `yarn assert:schema-migration-parity` | 0 | 26 schema files, 6399 lines |
| Allowlist | `docker exec supabase_auth_openvaa-local printenv GOTRUE_URI_ALLOW_LIST`; `170-allowlist-probe.sh after` | 0 | the neutral callback, no `candidate` path; ten rows OK. The stack was not restarted |
| **Baseline gates** | `172-gates.sh 172-01-baseline` | **0** | **nine rows, all `0`**, head `03b8a0524` |
| **Baseline E2E** | `172-e2e.sh 172-01-baseline` | **0** | **177 / 177 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 100 projects; 4.7 min |
| Regenerate | `yarn schema:regenerate` | 0 | one hunk, 67 added lines, byte-identical to the schema file; no line removed |
| Apply, then types | `yarn db:reset`, `yarn db:types` | 0, 0 | one hunk in `database.ts`: the table, with `user_id` and `accepted_at` optional on Insert |
| Schema lint, before the entries | `yarn db:lint:sql` | **1** | the two `reaches_neither` findings, expected |
| Schema lint, after | `yarn db:lint:sql` | 0 | `policies examined: 104, tables partitioned: 20`; `Summary: 0 error(s), 3 warning(s)` — the same three unindexed foreign keys as before, so the new index covers the new one |
| pgTAP, before the new file | `yarn workspace @openvaa/supabase test:db` | 0 | 37 files, 1351 tests, PASS |
| Task 2 verify chain | parity, lint, types grep, the privilege string | 0 | `falsefalsefalsetruefalsefalse` |
| pgTAP, with the new file | same | 0 | **38 files, 1392 tests, PASS** |
| **Closing gates** | `172-gates.sh 172-01-table` | **0** | **nine rows, all `0`**, head `e3fe7cd4c`, clean tree |
| **Closing E2E** (not asked by the plan) | `172-e2e.sh 172-01-table` | **0** | **177 / 177 / 0 / 0 / 0 / 0**; 100 projects; 4.6 min; not below the baseline total |

The nine rows of `172-01-table`:

| Row | Command | Exit | Seconds | Result |
|---|---|---|---|---|
| 01-lint | `yarn lint:check` | 0 | 43 | every link of the chain |
| 02-types-regen | `yarn db:reset`, then `yarn db:types` | 0 | 31 | |
| 03-types-clean | `git diff --exit-code -- packages/supabase-types/src/database.ts` | 0 | 0 | unchanged |
| 04-sql-lint | `yarn db:lint:sql` | 0 | 3 | 0 errors, 3 warnings |
| 05-pgtap | `yarn workspace @openvaa/supabase test:db` | 0 | 4 | 38 files, 1392 tests |
| 06-unit | `yarn test:unit` | 0 | 54 | 25 tasks; frontend 2140 in 135 files, dev-seed 997 in 67, supabase 206 in 15, app-shared 141 in 10 |
| 07-svelte-check | `yarn workspace @openvaa/frontend check` | 0 | 8 | 2650 files, 0 errors, 0 warnings |
| 08-build | `yarn build` | 0 | 14 | 14 tasks |
| 09-format | `yarn format:check` | 0 | 18 | |

### Every run directory of this plan

| Directory | Head | Counts | Verdict |
|---|---|---|---|
| `tests/e2e-runs/172-gates/172-01-baseline` | `03b8a0524` | nine rows, all `0` | green |
| `tests/e2e-runs/172/172-01-baseline` | `03b8a0524` | 177 of 177 | green |
| `tests/e2e-runs/172-gates/172-01-table` | `e3fe7cd4c` | nine rows, all `0` | **green, the closing gate set** |
| `tests/e2e-runs/172/172-01-table` | `e3fe7cd4c` | 177 of 177 | **green** |

There was no red gate row and no red run, no rerun under a label, and nothing under `tests/e2e-runs/` was deleted.

## The Table as Applied

```
table ACL    {postgres=arwdDxtm/postgres, service_role=arwdDxtm/postgres, authenticated=r/postgres}
column ACL   project_id {authenticated=a/postgres}; user_id and accepted_at none
columns      user_id uuid NOT NULL DEFAULT auth.uid(); project_id uuid NOT NULL; accepted_at timestamptz NOT NULL DEFAULT now()
key          PRIMARY KEY (user_id, project_id)
foreign keys user_id -> auth.users ON DELETE CASCADE; project_id -> public.projects ON DELETE CASCADE
index        idx_terms_of_use_acceptances_project_id (project_id)
policies     authenticated_select_terms_of_use_acceptances  SELECT  {authenticated}  USING (user_id = (SELECT auth.uid()))
             authenticated_insert_terms_of_use_acceptances  INSERT  {authenticated}  WITH CHECK (user_id = (SELECT auth.uid()))
```

This is the model of the plan's `<interfaces>` block, read back from the catalogue. The file holds no function, no trigger, no version column and no boolean, and no policy names `anon` or `service_role`.

## The pgTAP File, Section by Section

| Section | Assertions | What it pins |
|---|---|---|
| 1 — the catalogue | 1 to 18 | the table; the key; each cascade; exactly two foreign keys; the three columns with nullability and defaults as one string; row-level security on; the two policies with command and roles as one string; both predicates; nine privilege cells, among them the six of Task 2's verify string, `anon` holding nothing on any column, and `service_role` keeping SELECT, INSERT and DELETE |
| 2 — a signed-in user | 19 to 30 | the insert stating only `project_id`; `user_id` is the caller; `accepted_at` equals the transaction's `now()`; the repeat with `ON CONFLICT DO NOTHING` lives and leaves one row; a plain repeat is 23505; the `DO UPDATE` upsert, another user's `user_id`, the caller's own `user_id`, a stated `accepted_at`, UPDATE and DELETE are each 42501 |
| 3 — another user and anon | 31 to 36 | `candidate_b` reads none of `candidate_a`'s rows, records their own, and each of the two then reads exactly their own while the table holds two; `anon` SELECT and INSERT are 42501 |
| 4 — project scope | 37 to 40 | `candidate_a` has a row for project A and none for project B ("an acceptance for one project is not an acceptance for another"); a second insert gives project B; a project that does not exist is 23503; two rows, two project ids |
| 5 — the user cascade | 41 | deleting `candidate_b` from `auth.users` removes that user's row and leaves the other's |

The file holds eight `'42501'` expectations. The inverse census and the visibility trio are not in it; they belong to plans 06 and 07 and go after Section 5.

**Negative control.** The file was run with `psql` inside one transaction that first granted ALL on the table to `anon` and `authenticated` and added an `anon` policy, and that the file's own `ROLLBACK` then undid. 17 of the 41 assertions went red, among them the forged `accepted_at`, UPDATE, DELETE and both `anon` statements; the same harness without the mutation gave 41 of 41. Another user's `user_id` stayed refused under the mutation, with 42501 from the INSERT policy's `WITH CHECK`: the second layer behind the column privilege holds on its own. The catalogue was read back unchanged afterwards.

## Decisions Made

Nothing in the plan's decisions was decided differently. The calls the plan does not make are the five under `key-decisions` and the deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The gate set as specified is red on a correct tree from its second run on**
- **Found during:** Task 1, before the helper's first run.
- **Issue:** the plan's row 02 is `yarn db:types` alone, and its row 05 is pgTAP. The suite's first file commits its helper functions into `public`, where they stay until the next reset, so every gate run leaves a database on which the next run's regenerated types differ from the committed file. Measured on the dispatch tree, whose database Phase 171's close had left in that state: `yarn db:types` exit 0, then an 18-line diff, every line a test helper (`create_test_data`, `set_test_user`, `test_id`, …). The file was put back with `git checkout --` on that one path and the diff kept in the scratchpad. Phase 171 found the same defect in its own gate order after this phase's plans were written.
- **Fix:** row 02 is `yarn db:reset` followed by `yarn db:types`, under the same row name, so there are still nine rows. As a consequence rows 04 and 05 judge the schema of the tree and not whatever was applied last.
- **What follows from it:** every gate run destroys local data, the E2E project's rows included. The helper therefore refuses to start (exit 2, `done` written) while a listener holds the wrapper's port or a run directory started within ten minutes and has not ended.
- **Files modified:** `172-gates.sh`. Documented in the script header and in `172-NAMES.md` § *The two helpers*.
- **Committed in:** `1e6900c5b`.

**2. [Rule 2 - Missing critical] Row 03 keeps a drift and does not leave the tree dirty; a failed generation does not leave a truncated file**
- **Found during:** Task 1.
- **Issue:** `yarn db:types` redirects into the generated file, so a failed generation truncates it, and a drift would leave rows 06 to 08 judging an uncommitted file.
- **Fix:** on a drift the diff is kept as `db-types-drift.diff` in the attempt's directory. When the file was unmodified at the start of the run the committed file is then put back; a file that was already modified at the start is left alone. A failed generation restores an unmodified file the same way. This is the form Phase 171's gate ended on.
- **Committed in:** `1e6900c5b`.

**3. [Rule 2 - Missing critical] The E2E verdict also requires the wrapper's own status and a preflight success**
- **Found during:** Task 1.
- **Issue:** the plan's `--judge` reads `summary.json` and `provenance.txt`. A run whose counts are clean but whose wrapper exited non-zero (for example status 6, no positive preflight verdict) would be judged green.
- **Fix:** the helper keeps the wrapper's status as `wrapper-exit` and the verdict is red unless it is 0, with at least one preflight success and no preflight failure. Three smaller additions: the baseline total is read from the newest `172-01-baseline` attempt that holds a `summary.json`, not from the first attempt's path alone; a label ending `-rN` is refused, because it would be read as another label's attempt; and both `--judge` commands print the attempt's recorded head.
- **Committed in:** `1e6900c5b`.

### Beyond the plan's list

- **Seven pgTAP assertions more than the task lists:** exactly two foreign keys; the predicate text of both policies; `anon` holds no privilege on any column; `service_role` keeps SELECT, INSERT and DELETE (the E2E admin client will rely on it); a plain repeated insert is 23505; the `DO UPDATE` upsert is 42501; stating the caller's own `user_id` is 42501; a project that does not exist is 23503. The research measured each through PostgREST; the file now holds them in SQL.
- **One full E2E run more than the plan asks.** The plan closes on the static gates and names 172-03's run as the boundary proof. The schema was applied to the database every later run uses, so the suite was run once on the final tree, `172-01-table`: 177 of 177.
- **A negative control of the pgTAP file**, as above. It changed nothing: the transaction was rolled back.
- **The `default` dataset was seeded again at the end** (`yarn db:seed:default`, exit 0), because the resets removed the one Phase 171's close had left and the dispatch stated it as the database's state.
- **More baseline keys than the plan lists:** `phase_170_executed`, `auth_allowlist`, `unit_counts`, `baseline_e2e_counts`, `database_state_after_baseline`, and a section on the two helpers.

### Acceptance criteria that did not hold as written

- **"`yarn db:lint:sql` exits 0 with `0 error(s)` in its `[9001]` line" (Task 2).** The linter prints the count on its `Summary:` line; the `[9001]` line is the census. Measured: exit 0, `[9001] census: policies examined: 104, …`, `Summary: 0 error(s), 3 warning(s)`.
- **`pgtap_planned_assertions`.** The plan's command sums the declared plans: 1342 over 36 files at the baseline. The runner reported 1351 tests for the same estate. Both numbers are in the names file; neither is a target.

Every other criterion holds as written, and each `<automated>` check was run as one command and exited 0.

### Departures in procedure

- **The six earlier summaries of Phases 170 and 171 were read by section, not whole:** front matter, the names tables, the handover sections and the deviations that bear on schema, gates or names. `170-04-SUMMARY.md` and `171-04-SUMMARY.md` were read whole, as were both phases' helper scripts. Every name was then resolved on the tree itself.
- **The commits sit on `feat/entity-signup-multi-grant` in a linked worktree,** as the run's standing notes direct. The executor protocol's rule that a worktree commit must be on an `agent-*` branch does not describe this tree; the branch is not the default branch and was checked before each commit.
- **Polling.** A standalone `sleep` is blocked in this harness. Each wait was a bounded foreground loop of `--status` calls 45 seconds apart, at most about seven minutes per command; each helper run was started with the tool's background mode.
- **"Node before anything else" and "the attempt directory as the first act".** Both helpers put the pinned Node on `PATH` first, without exiting; a run then claims its attempt directory and only then checks the engines floor, so that refusal too leaves a `done` file.
- **The helpers' modes were proven on a scratch copy** under the session's scratchpad, with fabricated attempts, so that no test directory was left under `tests/e2e-runs/`.
- **A first form of the negative control ran nothing**: the pgTAP extension is not installed between runs, so `plan()` did not exist and every statement was skipped. The second form created the extension inside the same rolled-back transaction.

---

**Total deviations:** 3 auto-fixed (1 bug, 2 missing critical), plus the notes above.
**Impact on plan:** none changes product behaviour. The one that changes what a later plan must expect is the first: a gate run resets the local database.

## Prohibition, Checked

| Prohibition | Evidence |
|---|---|
| PROH-172-01: no definer function, no service-role write path, no trigger and no Edge Function writes the table | `git grep -n -l "terms_of_use_acceptances" -- apps/supabase/supabase/functions apps/supabase/supabase/schema` lists the one schema file; that file matches no `CREATE FUNCTION` and no `CREATE TRIGGER`; outside `.planning/` the table is named in five files: the schema file, the migration, the generated types, the linter list and the pgTAP file. Verified by judgment, as the plan says |

## Threat Model, Each Mitigation

| Threat | Where it is asserted |
|---|---|
| T-172-01 forged `user_id` | pgTAP 14, 26, 27; the negative control shows the `WITH CHECK` refuses another user's id even with the column privilege granted |
| T-172-02 forged `accepted_at` | pgTAP 15, 21, 28 |
| T-172-03 UPDATE or DELETE by the owner | pgTAP 16, 17, 25, 29, 30 |
| T-172-04 `anon` reading auth user ids | pgTAP 8, 10, 11, 35, 36; `36-entity-identity` and `16-anon-visibility` green and unchanged |
| T-172-05 one user reading another's row | pgTAP 31, 33, 34 |
| T-172-06 cross-project acceptance (accepted) | pgTAP 37, 38, 40; the foreign key bound in 39 |
| T-172-07 widening the linter list | two entries, added after the check fired on exactly these two policies; listed for review as coverage item D9 |

No security-relevant surface was added beyond the plan's threat model.

## Changes for the Operator's Eye

- **`REACHES_NEITHER_ALLOW` has two more entries.** These are the first two policies in the estate that ask only who the caller is. The reason is written above them in `lint-schema.mjs`.
- **A gate run of this phase resets the local database** (deviation 1). Phase 171's gate set did the same, as a row of its own.
- **The local database was reset four times in this plan:** by hand before the baseline, by the baseline gate run, to apply the new schema, and by the closing gate run. The `default` dataset was seeded again at the end.
- **The stack was not stopped or restarted.** The other Supabase stack on this host, `my-redis` and the Vite server on port 5199 were not touched.
- **`yarn.lock` and every `package.json` are unchanged.** No package was installed.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.

## Deferred Issues

None fixed, all outside this plan:

1. The database skill and its two reference files do not yet name the new table, and their counts (tables, policies, pgTAP files) are one step further behind. Plan 172-08 or 172-09 owns the docs (D-19).
2. `172-VALIDATION.md` was not touched; its per-task statuses for this plan are in this file.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run. No todo was filed.

## Issues Encountered

None. No gate row and no E2E test was red at any point in this plan.

## Known Stubs

None. Nothing reads or writes the table yet, by design: the plan's purpose is that the record exists and is provably unforgeable before any fixture or code uses it.

## User Setup Required

None - no external service configuration required.

## What the Next Plan and Later Phases Must Know

**Plans 172-02 to 172-09**

- **Read `172-NAMES.md` first.** No name differs from the plans. Mind the note on filtering test files: a pipeline through `grep -v test` drops every path under `contestant/`.
- **Compare against:** gates `172-01-table` (nine rows at 0), E2E `172-01-baseline` and `172-01-table` (177 / 177). Unit: frontend 2140 tests in 135 files, dev-seed 997 in 67, supabase 206 in 15, app-shared 141 in 10. pgTAP: 38 files, 1392 tests. Linter census: 104 policies, 20 tables partitioned, 30 row-level-security tables. Schema: 27 files, a 6466-line migration. Column census of the retired candidate column: 44 files, 159 lines, unchanged by this plan.
- **A gate run resets the database and must not overlap an E2E run.** Commit (or at least stage) regenerated types before a gate run that is meant to be green: row 03 compares with the index. Run the gate set first and the E2E run after it.
- **Outside a gate run, the schema workflow keeps its order:** edit `schema/`, `yarn schema:regenerate`, parity, `yarn db:reset`, `yarn db:types` at once, then pgTAP, then `yarn db:lint:sql`.
- **The write is the ignore-duplicates upsert and nothing else.** pgTAP now pins in SQL what the research measured through PostgREST: `ON CONFLICT DO NOTHING` lives, the `DO UPDATE` form is 42501, a plain repeat is 23505. A writer test must pin `ignoreDuplicates: true`. A duplicate returns no row, so the call must not be `.single()`.
- **Stating `user_id` at all is refused, the caller's own included.** The insert body is `{ project_id }` and nothing more; `scopedFrom` supplies `project_id`, so the adapter's own payload is empty.
- **The table is in neither `PROJECT_SCOPED_TABLES` nor `ProjectScopedTable` yet.** `assert:project-scoped-queries` is green because no adapter source names the table. The plan that adds the read or the write adds the table to both lists in the same commit (research H-2).
- **`service_role` keeps its privileges and bypasses row-level security**, asserted in pgTAP 18. The E2E admin client can insert and delete rows; it must state `user_id` itself, since `auth.uid()` is null for it.
- **A row cascades with its auth user** (pgTAP 41), so a helper that deletes the user need not delete the row.
- **Plans 06 and 07 append to the pgTAP file after Section 5** and raise `plan (41)` by what they add. For the inverse census: the two policies' expressions are `(user_id = ( SELECT auth.uid() AS uid))` and do not contain `terms_of_use`; the table's name does.
- **`candidates.terms_of_use_accepted` and its four conjuncts are untouched.** Visibility is exactly what it was.

**Phase 173**

- The user-data RPC and its exemption line in the app-name gate are untouched by this plan.
- The gate helpers are reusable as models: `--status`, `--judge`, `--path`, attempts as `<label>-rN`, a `done` marker.

**Phases 174 and 178**

- An acceptance row can be written for any existing project by any signed-in user (accepted property, T-172-06). It unlocks nothing today. A later rule that reads the table to grant something must not treat a row as evidence of membership in the project.

**Host state:** the stack is up and healthy on the live allowlist with the default function environment; the three functions answer `OPTIONS` with 200. The new schema is applied. The database holds migrations plus `seed.sql`, the pgTAP helper functions in `public` (left by the closing gate run), what the closing E2E run left in its own project, and the `default` dataset in the default project. `terms_of_use_acceptances` is empty. Nothing listens on 5173 or 5273.

## Self-Check: PASSED

- The five files under `key-files.created` and this file exist; the three paths under `key-files.modified` are in `git diff --name-only 03b8a0524..e3fe7cd4c`.
- The three commits (`1e6900c5b`, `8f5368609`, `e3fe7cd4c`) are ancestors of HEAD; `git rev-list --count 03b8a0524..HEAD` was 3 when this file was written.
- The plan's verification items were re-run on the final tree after the last run: `yarn assert:schema-migration-parity` (0), `yarn db:lint:sql` (0), `yarn workspace @openvaa/supabase test:db` (0; 38 files, 1392 tests), `172-gates.sh --judge 172-01-table` (0), `172-e2e.sh --judge 172-01-baseline` (0) and `172-e2e.sh --judge 172-01-table` (0); the grep over `functions` and `schema` lists the one schema file.
- Every acceptance criterion of the three tasks was checked by command; the two that do not hold as written are listed above with their measured values.
- `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
