---
phase: 157-adapter-boundary-typing
plan: 04
subsystem: testing
tags: [pgtap, postgres, supabase, rpc, jsonb, postgrest, generated-types, typescript]

requires:
  - phase: 157-adapter-boundary-typing
    plan: 03
    provides: "public.get_questions(uuid, uuid, integer), the 4-argument public.get_nominations, and migration 00004_question_rpcs_and_nomination_election_round.sql — the SQL this plan proves against a live database and regenerates types from"
provides:
  - "apps/supabase/supabase/tests/database/11-question-rpcs.test.sql — 55 pgTAP assertions; the suite goes Files=11/Tests=324 -> Files=12/Tests=379"
  - "the first pgTAP coverage get_nominations has ever had, including its new scalar p_election_round filter"
  - "packages/supabase-types/src/database.ts regenerated: a get_questions Functions entry and p_election_round on get_nominations"
  - "the adapter's compile-time call contract for 157-05 and 157-06, recorded verbatim below"
affects: [157-05, 157-06, 164-nullability-audit, 160-sql-lint]

actuals:
  tokens: 5600
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "pgTAP membership assertions keyed on row id rather than absolute result counts, so a file passes identically on a seeded and an unseeded database"
    - "pgTAP helper functions declared in pg_temp rather than public, so they cannot leak into the generated types the way 00-helpers.test.sql's six fixtures do"
    - "yarn db:reset-with-data immediately before every yarn db:types, never a regen after a pgTAP run"

key-files:
  created:
    - apps/supabase/supabase/tests/database/11-question-rpcs.test.sql
  modified:
    - packages/supabase-types/src/database.ts

key-decisions:
  - "The jsonb_array_length residual 157-03 flagged is PINNED by two assertions rather than hardened or ignored: the SQL is not changed, but the raise-on-non-array behaviour and its exact reachability condition are now facts the suite enforces."
  - "Assertions are membership-by-id, not count-based, because the plan's literal 'count equals the fixture count' wording is only true on an unseeded database and the run in Task 1 happened on a seeded one."
  - "yarn db:lint:sql was NOT run, per the orchestrator's standing instruction that it exits 1 on four pre-existing plpgsql advisories from phase 151. The plan's acceptance criterion asking for exit 0 is therefore unmet by deliberate exclusion, not by failure."
  - "The plan frontmatter's packages/supabase-types/src/database.types.ts does not exist; the generated file is packages/supabase-types/src/database.ts."

patterns-established:
  - "Result-shape coverage for a jsonb-returning RPC: assert key presence, assert jsonb_typeof is array, and assert the empty case returns [] rather than null, because the adapter zod-parses the payload and null is a parse failure while [] is an empty list."
  - "A filter axis is proven on five branches, not three: NULL parameter, NULL column, empty-array column, containment match, containment miss. The match branch is what stops the miss branch from passing vacuously."

requirements-completed: [REVIEW-ADP-02, REVIEW-ADP-03]

coverage:
  - id: D1
    description: "apps/supabase/supabase/tests/database/11-question-rpcs.test.sql exists and runs clean against a database reset from the migrations, taking the suite to 12 files."
    requirement: REVIEW-ADP-03
    verification:
      - kind: integration
        ref: "cd apps/supabase && npx supabase test db — exit 0, Files=12, Tests=379, Result: PASS, 0 'not ok', 12/12 files reporting ok"
        status: pass
    human_judgment: false
  - id: D2
    description: "get_questions returns one jsonb value carrying both a categories key and a questions key, each always a JSON array and each [] rather than null when empty."
    requirement: REVIEW-ADP-03
    verification:
      - kind: integration
        ref: "11-question-rpcs.test.sql sections 3 and 13 — jsonb_exists on both keys, jsonb_typeof = array on both, and both keys equal '[]'::jsonb after the tables are emptied inside the transaction"
        status: pass
    human_judgment: false
  - id: D3
    description: "Each of the three filter axes is proven on five branches for BOTH question_categories and questions: NULL parameter returns all, NULL column included, empty-array column included, containment match included, non-matching value excluded."
    requirement: REVIEW-ADP-03
    verification:
      - kind: integration
        ref: "11-question-rpcs.test.sql sections 4 through 9 — 30 assertions, plus section 10 proving a question is excluded by its OWN election_ids while its category survives"
        status: pass
    human_judgment: false
  - id: D4
    description: "Exactly one overload of each RPC exists in pg_proc, and get_nominations filters on the scalar p_election_round."
    requirement: REVIEW-ADP-02
    verification:
      - kind: integration
        ref: "psql pg_proc count = 1 for each RPC, signatures get_questions(uuid,uuid,integer) and get_nominations(uuid,uuid,boolean,integer), both prosecdef=f and proconfig NULL"
        status: pass
      - kind: integration
        ref: "11-question-rpcs.test.sql section 11 — 9 assertions including round-1-includes, round-1-excludes-round-2, round-2-includes, NULL-returns-all, and a four-named-argument lives_ok"
        status: pass
    human_judgment: false
  - id: D5
    description: "packages/supabase-types exposes get_questions and the 4-argument get_nominations, and the frontend typechecks against them."
    requirement: REVIEW-ADP-02
    verification:
      - kind: integration
        ref: "yarn db:types after yarn db:reset-with-data — git diff is 1 file, 9 insertions, 0 deletions; grep get_questions=1, p_election_round=2, one get_nominations entry"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend typecheck — 2688 files, 0 errors, 0 warnings"
        status: pass
    human_judgment: false
  - id: D6
    description: "The tree's standing gates are green after the change and the generated types are free of pgTAP fixture contamination."
    verification:
      - kind: other
        ref: "yarn lint:check — exit 0, all 12 guards 0 violations, parity census unmoved at 25 schema files -> 3424 lines; 7 hunks, 91 signature lines"
        status: pass
      - kind: other
        ref: "yarn build — 14/14 tasks; yarn test:unit — 25/25 tasks, frontend 807 passed, app-shared 79 passed"
        status: pass
      - kind: other
        ref: "grep for test_id, test_user_id, test_user_roles, set_test_user, reset_role, create_test_data across packages/supabase-types/src/*.ts — 0 in all three files"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-30
status: complete
---

# Phase 157 Plan 04: Prove the SQL and Regenerate the Types Summary

**The two RPCs 157-03 wrote are now proven against a live Postgres by 55 new pgTAP assertions — taking the suite from `Files=11, Tests=324` to `Files=12, Tests=379` with zero `not ok` — and `packages/supabase-types/src/database.ts` carries the regenerated contract in a 9-insertion, 0-deletion diff with zero pgTAP fixture contamination.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-30T16:10:40Z
- **Completed:** 2026-08-30T16:22:02Z (verification), summary written immediately after
- **Tasks:** 3 of 3
- **Files modified:** 2 (1 created, 1 regenerated)

## Accomplishments

- **The phase's `[BLOCKING]` false-positive verification state is closed.** `yarn db:reset` applied `00004_question_rpcs_and_nomination_election_round.sql` **by name**, and the RPCs are now exercised by a suite that runs against the applied database rather than against generated types. Before this plan, `yarn build` was green over SQL that a database need never have seen.
- **`get_nominations` has pgTAP coverage for the first time in its life.** `grep -rn 'get_nominations' apps/supabase/supabase/tests/` returned zero before this plan. It now has 9 assertions covering the default call, the joined entity columns, and all three branches of the new scalar `p_election_round` filter.
- **The filter semantics are pinned on five branches per axis, not three.** The plan asked for three (NULL parameter, NULL-or-empty column, non-matching excluded). Five were written, because a *miss* assertion passes vacuously if the predicate excludes everything — the containment-*match* branch is what makes the miss branch mean something.
- **The contamination hazard was observed, not just avoided.** After the pgTAP gate run, all six `00-helpers.test.sql` fixtures were measured present in `public`; a regen at that moment would have written them into the committed types, as happened in Phase 156. The reset was run first and the absence re-measured before `yarn db:types`.
- **The generated diff is 9 insertions and 0 deletions.** No unrelated generator churn is hiding the contract change from review.

## Task Commits

1. **Task 1: pgTAP coverage for get_questions and get_nominations** — `decbeba72` (test)
2. **Task 2: [BLOCKING] Apply the schema and regenerate the types** — `afde49ff7` (chore)
3. **Task 3: Verify the generated types expose the new RPC contract** — no commit; inspection only, findings recorded below

## Files Created/Modified

- `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` **(created, 430 lines)** — the 12th pgTAP file. 55 assertions across 13 sections: security shape, overload guards, result shape, five branches per filter axis per table, own-column filtering, `get_nominations`, the non-array residual, and the empty-table `[]` contract.
- `packages/supabase-types/src/database.ts` **(regenerated)** — see the verbatim diff below.

## The measured numbers the orchestrator asked for

### pgTAP

Declared plan count in the new file: **`SELECT plan(55);`**, matching 55 assertion statements (`grep -cE '^SELECT (ok|is|lives_ok|throws_ok)\(' = 55`; breakdown 42 `ok`, 10 `is`, 2 `lives_ok`, 1 `throws_ok`).

Verbatim tail of `cd apps/supabase && npx supabase test db`, run against a database freshly reset from the migrations:

```
All tests successful.
Files=12, Tests=379,  1 wallclock secs ( 0.03 usr  0.01 sys +  0.05 cusr  0.02 csys =  0.11 CPU)
Result: PASS
```

Asserted on the composite signal rather than on `Tests=` alone, exactly as instructed — **exit code 0**, **`Result: PASS`**, **`Files=12`** (non-zero, and one above the baseline's 11), **`Tests=379`** (above the 324 floor). Independently: `grep -c 'not ok'` = **0**, and **12 of 12** files report `ok`. 324 + 55 = 379 exactly, so the delta is wholly accounted for by the new file and no existing file's count moved.

### `pg_proc`, verbatim

```
 get_nominations_overloads
---------------------------
                         1

 get_questions_overloads
-------------------------
                       1

                 signature                  | security_definer | proconfig
--------------------------------------------+------------------+-----------
 get_nominations(uuid,uuid,boolean,integer) | f                |
 get_questions(uuid,uuid,integer)           | f                |
(2 rows)
```

Exactly one overload each (the T-157-08 / `PGRST203` mitigation stated as a database fact), both `SECURITY INVOKER`, neither carrying a `SET search_path`.

### The `get_questions` `Args` key list, verbatim — the call contract for 157-06

```ts
      get_questions: {
        Args: {
          p_constituency_id?: string;
          p_election_id?: string;
          p_election_round?: number;
        };
        Returns: Json;
      };
```

All three keys are **optional** (`?`), because all three SQL parameters carry `DEFAULT NULL`. The generator sorts them alphabetically; the SQL positional order is `p_election_id, p_constituency_id, p_election_round`, so **157-06 must call this with named arguments**, not positionally. `Returns: Json` is the expected and correct outcome — `RETURNS jsonb` was chosen in 157-03 precisely so that no new `RETURNS TABLE` column enters Phase 164's nullability audit surface, and it did not.

### The `packages/supabase-types` diff, inspected before staging

`git diff --stat`: **`1 file changed, 9 insertions(+)`** — 0 deletions.

```diff
       get_nominations: {
         Args: {
           p_constituency_id?: string;
           p_election_id?: string;
+          p_election_round?: number;
           p_include_unconfirmed?: boolean;
         };
...
+      get_questions: {
+        Args: {
+          p_constituency_id?: string;
+          p_election_id?: string;
+          p_election_round?: number;
+        };
+        Returns: Json;
+      };
```

That is the **whole** diff. Task 3's three inspection points, each confirmed:

1. `get_questions` is present with all three `Args` keys and `Returns: Json`. ✅
2. `get_nominations.Args` now includes `p_election_round`, and `grep -cE '^      get_nominations: \{'` returns **1** — there is no second entry. ✅
3. **No unrelated churn.** 9 insertions, 0 deletions, both hunks inside the `Functions` map. The `get_nominations` change is a pure insertion rather than a rewrite because the generator sorts `Args` keys alphabetically and `p_election_round` slots between two existing keys.

### Contamination check — clean, and the hazard was observed on the way

The instruction's mandatory ordering was followed: `yarn db:reset-with-data` → `yarn db:types` → read the diff → stage.

The hazard is **real and was measured**, not assumed. Immediately after the pgTAP gate run:

```
LEAKED: create_test_data
LEAKED: reset_role
LEAKED: set_test_user
LEAKED: test_id
LEAKED: test_user_id
LEAKED: test_user_roles
```

All six persist in `public` because `00-helpers.test.sql` defines them outside its `BEGIN;`/`ROLLBACK;`. A regen at that moment reproduces the Phase 156 corruption exactly. After `yarn db:reset-with-data` the same query returned **0**, and only then was `yarn db:types` run.

Post-regen, over all three files in `packages/supabase-types/src/`:

| Identifier | `column-map.ts` | `database.ts` | `index.ts` |
|---|---|---|---|
| `test_id` | 0 | 0 | 0 |
| `test_user_id` | 0 | 0 | 0 |
| `test_user_roles` | 0 | 0 | 0 |
| `set_test_user` | 0 | 0 | 0 |
| `reset_role` | 0 | 0 | 0 |
| `create_test_data` | 0 | 0 | 0 |

The types are handed back in the clean state they were received in.

### Final database state — my last act was NOT a pgTAP run

The ordering was: `db:reset` → pgTAP gate → `pg_proc` queries → **`db:reset-with-data`** → `db:types` → `build` → `lint:check` → `test:unit`. The last database-touching operation was `yarn test:unit`, whose `@openvaa/dev-seed` integration test reseeds. Measured final state:

```
leaked_pgtap_helpers | questions | candidates | nominations
                   0 |        26 |        328 |         377
```

Zero pgTAP fixtures in `public`, dev seed data present. **The orchestrator does not need to reseed before the phase E2E gate on my account** — though a `db:reset-with-data` is still the safe habit, since the dev-seed integration test that ran last is not a controlled seeding step.

## Decisions Made

### The `jsonb_array_length` residual: PIN it, do not harden it and do not ignore it

157-03 flagged this to me by name: `jsonb_array_length` **raises** on a non-array JSONB, the three filter columns carry no `CHECK` constraint, and 157-03 implemented the predicate as specified rather than hardening unilaterally because the TypeScript it transcribes has the same gap.

Three options were available: (a) ignore it, (b) pin the current behaviour with assertions, (c) harden `get_questions` with a `jsonb_typeof` guard or add a `CHECK` constraint.

**Chosen: (b), pin it.** Reasoning:

- **(c) was out of scope and would have been a unilateral contract change.** The SQL belongs to `157-03`'s files and its shape was a recorded decision there. Changing "raises" to "treated as applies-to-all" is a *behaviour* change at a trust boundary, silently altering which questions a voter sees for a malformed row. That is a Rule 4 architectural call, not a Rule 1 bug fix, and it belongs to whichever phase owns the filter-column constraints — not to the phase that writes the tests.
- **(a) was not acceptable** because the instruction explicitly forbade silently ignoring it, and rightly: an untested raise is a landmine that surfaces as a 500 in production.
- **(b) makes the gap a fact the suite enforces.** Two assertions were written, and writing them produced a finding neither 157-03 nor the plan had:

I **measured the exact reachability condition** rather than assuming it. The raise happens **only when a filter parameter is non-NULL**:

| Call | Result with a category whose `election_rounds` is `{"round": 1}` |
|---|---|
| `get_questions(NULL, NULL, 1)` | `ERROR: cannot get array length of a non-array` (SQLSTATE `22023`) |
| `get_questions()` (all parameters NULL) | **returns normally** |

Postgres short-circuits the `p_election_round IS NULL` operand of the `OR`, so `jsonb_array_length` is never evaluated on the all-defaults call. Both branches are now asserted (`throws_ok` on the first with the exact SQLSTATE and message, `lives_ok` on the second). This matters for `157-06`: the adapter is expected to pass a real election and constituency, so it sits on the **reachable** side of that line — the hazard is not theoretical for the caller this phase is building toward.

The two assertions carry an explicit in-file comment stating they pin *current* behaviour and not *desired* behaviour, so that the day someone adds the `CHECK` constraint or the `jsonb_typeof` guard, this file fails loudly and the change is made deliberately instead of discovered in production. **Recommended follow-up for the phase that owns filter-column constraints (Phase 160 or 164): add a `CHECK (jsonb_typeof(election_ids) = 'array')`-shaped constraint on all six columns, then update section 12 of this file.**

### Membership assertions, not count assertions

The plan specified "the category count equals the fixture's category count". That is only true on a database with no dev-seed data. Task 1's verification run happened on the seeded database the orchestrator handed over (26 questions, 4 categories), and Task 2's gate run happened on an unseeded one. A count assertion would have passed in one and failed in the other — the exact environment-dependent flakiness the CLAUDE.md E2E hard rule forbids. Every assertion therefore checks whether a **specific synthetic row id** is present in or absent from the result. The file passes identically in both states, which was verified by running it in both.

### Helpers in `pg_temp`

The one helper this file defines (`result_has`) is created in `pg_temp`, explicitly and with a comment saying why. `00-helpers.test.sql` is the cautionary tale: its six helpers are defined outside its transaction and leak into `public`. A `pg_temp` function could not be captured by `db:types` even if this file's `ROLLBACK` were ever deleted. This is defence in depth against the exact failure mode Phase 156 hit.

## Deviations from Plan

### 1. [Rule 3 — Blocking] The plan's `files_modified` path does not exist

- **Found during:** Task 2, before running `yarn db:types`
- **Issue:** the plan frontmatter, the Task 2 and Task 3 `<files>` elements, and Task 3's `<verify>` and acceptance criteria all name `packages/supabase-types/src/database.types.ts`. `ls packages/supabase-types/src/` returns `column-map.ts`, `database.ts`, `index.ts` — and `ls packages/supabase-types/src/database.types.ts` returns `No such file or directory`. Task 3's automated verify line (`grep -c 'get_questions' packages/supabase-types/src/database.types.ts`) would have exited non-zero on a missing file regardless of whether the regeneration succeeded.
- **Fix:** used the real path, `packages/supabase-types/src/database.ts`. `yarn db:types` confirms it independently — its output line is `src/database.ts 55ms`, and `git status` after the regen shows exactly one modified file, that one.
- **Files modified:** `packages/supabase-types/src/database.ts`
- **Verification:** `grep -c 'get_questions' packages/supabase-types/src/database.ts` = 1; `grep -c 'p_election_round' ...` = 2. Both acceptance thresholds met against the real file.
- **Committed in:** `afde49ff7`

### 2. [Scope exclusion] `yarn db:lint:sql` was not run

- **Found during:** Task 2 step 5
- **Issue:** the plan's Task 2 action, its acceptance criteria and verification step 5 all require `yarn db:lint:sql` to exit 0. The orchestrator's standing instruction is explicit: it has exited 1 since phase 151 on four pre-existing plpgsql advisories (`is_localized_string`, `_bulk_upsert_record`, `resolve_email_variables`) — do not run it, do not fix it. 157-03 recorded the same and skipped it for the same reason.
- **Action taken:** not run. This is a **scope-boundary exclusion**, not an auto-fix: the failure predates this plan, lives in files this plan does not touch, and is Phase 160's surface. Fixing it would have been exactly the out-of-scope drift the executor rules forbid.
- **Status of the criterion:** the plan's `must_haves` marks this statement `verification: backstop`, and it is the only acceptance line in the plan left **unmet**. It is unmet by deliberate exclusion, not by failure of this plan's work. Nothing in this plan's diff can affect it — the diff contains one new `.sql` test file (never linted by that script, which lints `--schema public` on the live database plus `schema/` via `lint-schema.mjs`) and one generated `.ts` file.
- **Also not run, and why it does not matter:** the plan's `<verify>` chains `db:lint:sql` before `yarn build`. `yarn build` was run separately and independently: **14/14 tasks successful**.

### 3. [Enhancement] Five branches per filter axis instead of three, and three sections the plan did not ask for

- **Found during:** Task 1, writing the assertions
- **Issue:** the plan's must-have asks for three branches per axis (NULL parameter, NULL-or-empty column, non-matching excluded). A non-matching-excluded assertion passes vacuously if the predicate is broken in the direction of excluding *everything*, so three branches cannot distinguish "filters correctly" from "returns nothing".
- **Change:** five branches per axis per table (NULL parameter, NULL column, empty-array column, containment **match**, containment miss) = 30 assertions. Plus three sections the plan did not specify: section 10 (a question is excluded by its own `election_ids` while its category survives — the correctness gap 157-03 identified in the TypeScript being replaced), section 12 (the non-array residual, above), and section 13 (empty tables return `[]` not `null`, which is what the adapter's zod parse depends on).
- **Impact:** 55 assertions rather than the ~25 a literal reading would have produced. No SQL was changed; this is test coverage only.

---

**Total deviations:** 1 blocking auto-fix (Rule 3, a wrong path in the plan), 1 scope exclusion (`db:lint:sql`, per standing instruction), 1 coverage enhancement.
**Impact on scope:** none. No source or schema file was modified; the plan's two artifacts were both produced.

## Issues Encountered

**The plan's own `<verify>` ordering would have corrupted the types.** Task 2's automated verify line is `yarn db:reset && ... npx supabase test db && ... yarn db:types && ...` — a `db:types` chained *directly after* a pgTAP run. That is precisely the Phase 156 corruption sequence, and it is baked into the plan as a single shell chain. It was not executed as written; `yarn db:reset-with-data` was interposed between the pgTAP run and the regen. **Any future plan that both runs pgTAP and regenerates types must do the same** until `00-helpers.test.sql` is fixed to define its helpers inside its transaction (which would also require every dependent file to define them itself, so it is a real design change, not a one-line fix — flagging it, not doing it).

**The parity guard was untouched, as predicted.** The prompt warned to stop and report if the schema-migration parity census moved. It did not: `25 schema file(s) -> 3424 line(s); 00001_initial_schema.sql -> 3342 line(s); 7 hunk(s), 91 signature line(s)`, matching the fixture — identical before and after this plan's commits. Expected, since a test file is not a `schema/` file.

**The build-recovery hazard did not fire.** `yarn build` succeeded on the first invocation (14/14 tasks, 12 cached), so `yarn build --force` was not needed.

## Verification Performed

| Gate | Command | Result |
|------|---------|--------|
| pgTAP, freshly reset DB | `cd apps/supabase && npx supabase test db` | **exit 0** — `Files=12, Tests=379, Result: PASS`, 0 `not ok`, 12/12 files ok |
| pgTAP, seeded DB | same, run during Task 1 | **`Files=12, Tests=379, Result: PASS`** — identical, proving the file is seed-independent |
| Migration applied | `yarn db:reset` | **exit 0**, `Applying migration 00004_question_rpcs_and_nomination_election_round.sql...` |
| Overload state | `psql` over `pg_proc` | **1** and **1**; signatures and `prosecdef`/`proconfig` verbatim above |
| Type regeneration | `yarn db:types` | **exit 0**, wrote `src/database.ts`; 9 insertions, 0 deletions |
| Type contamination | grep of 6 fixture names across `packages/supabase-types/src/*.ts` | **0 in all 18 combinations** |
| Frontend typecheck | `yarn workspace @openvaa/frontend typecheck` | **2688 files, 0 errors, 0 warnings** |
| Build | `yarn build` | **14/14 tasks successful** |
| Lint and all 12 guards | `yarn lint:check` | **exit 0**; comment hygiene 1577 files / 0 violations; parity census unmoved |
| Unit tests | `yarn test:unit` | **25/25 tasks**; frontend **807 passed**, app-shared **79 passed** — both at baseline |
| Acceptance greps on the new file | `grep -c` | `__tcache__` = 1 (≥1 ✅), `prosecdef` = 1 (≥1 ✅), `get_nominations` = 24 (≥3 ✅), `sqlfluff` = 0 ✅, `.planning` references = 0 ✅ |
| No accidental deletions | `git diff --diff-filter=D --name-only decbeba72~1 HEAD` | **empty** |

**Not run:** `yarn db:lint:sql` (deviation 2) and the E2E suite (this plan's diff contains no frontend runtime code — one `.sql` test file and one generated types file whose only consumers were typechecked and built clean; the phase E2E gate is the orchestrator's).

## Known Stubs

None. No placeholder values, no TODO or FIXME markers, no unwired path. Every assertion in the new file runs and passes; none is skipped, commented out or marked pending.

The one thing deliberately **not** fixed is documented above rather than stubbed: the non-array `jsonb_array_length` gap is an existing SQL behaviour that this plan pins with passing assertions and refers to a future phase. It is a recorded follow-up, not a stub in this plan's output.

## Threat Flags

None. The plan's `<threat_model>` covers the surface, and each `mitigate` disposition was implemented and verified against the live database:

- **T-157-RPC (elevation of privilege):** `prosecdef = f` and `has_function_privilege` for both `anon` and `authenticated` asserted in pgTAP section 1, and independently confirmed via `pg_proc` (`proconfig` NULL, so no `SET search_path` either).
- **T-157-08 (denial of service, overload ambiguity):** asserted twice, in pgTAP section 2 and as a direct `pg_proc` count, both returning exactly 1 per RPC.
- **T-157-10 (spoofing, a green build over an unapplied migration):** closed. The migration was applied by name and the suite ran against the applied database.
- **T-157-11 (tampering, inverted filter semantics):** 30 assertions across sections 4-9, covering the inclusion direction (NULL column, empty array, containment match) and the exclusion direction on all three axes for both tables.
- **T-157-SC (supply chain):** zero packages installed; `yarn.lock` and every `package.json` are untouched by this plan's diff.

## Self-Check: PASSED

- `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` — FOUND
- `packages/supabase-types/src/database.ts` — FOUND (modified)
- `packages/supabase-types/src/database.types.ts` — **CORRECTLY ABSENT** (the plan frontmatter's path; see deviation 1)
- Commit `decbeba72` — FOUND
- Commit `afde49ff7` — FOUND
- No tracked file deleted across either commit — CONFIRMED
