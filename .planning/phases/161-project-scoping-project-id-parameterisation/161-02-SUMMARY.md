---
phase: 161-project-scoping-project-id-parameterisation
plan: 02
subsystem: database
tags: [supabase, postgrest, pgtap, migration, multi-tenancy, rpc, static-guard]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: 'the scopedFrom facade, the constructor-resolved projectId and the project-scoped query guard landed by plan 161-01'
  - phase: 157-question-rpcs
    provides: 'the get_questions RPC and the p_election_round parameter on get_nominations, both of which changed the shapes this plan was written against'
provides:
  - 'public.get_nominations takes a REQUIRED p_project_id uuid first parameter with no DEFAULT'
  - 'migrations/00005_get_nominations_project_scope.sql, an additive migration that drops and re-creates the granted signature'
  - 'supabaseDataProvider.ts issues zero bare this.supabase.from( calls and passes p_project_id on every get_nominations call'
  - 'the app_settings limit(1) singleton assumption is gone from the read path'
  - 'dataProvider/supabaseDataProvider.ts is a member of the guard GUARDED_SOURCES'
  - 'seven pgTAP assertions proving cross-project isolation, with a recorded red half'
  - 'a corrected, written disposition for get_questions: UNSCOPED, plus a filed follow-up'
affects: [161-04, 161-05, 161-07, 162-permissions-and-auth-model-refactor]

actuals:
  tokens: 87250
  tasks: 4
  commits: 5

tech-stack:
  added: []
  patterns:
    - 'A required project parameter with no DEFAULT: a forgotten argument becomes an undefined-function error rather than a silent cross-project read'
    - 'Publish the second tenant before asserting its exclusion, so a cross-tenant zero is a measurement rather than an artefact of row-level security'
    - 'An UNSCOPED disposition value in the rpc register, so a guard never overstates a function scoping it cannot see inside'

key-files:
  created:
    - apps/supabase/supabase/migrations/00005_get_nominations_project_scope.sql
    - .planning/phases/161-project-scoping-project-id-parameterisation/161-02-DECISION.md
    - .planning/todos/pending/2026-09-04-get-questions-returns-every-projects-questions.md
  modified:
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/package.json
    - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
    - apps/supabase/supabase/tests/database/11-question-rpcs.test.sql
    - apps/supabase/scripts/schema-migration-parity.expected.txt
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts
    - scripts/assert-project-scoped-queries.mjs
    - packages/supabase-types/src/database.ts
    - packages/supabase-types/RPC-NULLABILITY.md
    - packages/dev-seed/tests/integration/default-template.integration.test.ts

key-decisions:
  - 'p_project_id is REQUIRED on get_nominations and carries no DEFAULT, delivered by an additive migration that drops and re-creates the granted signature (operator answer: required-parameter)'
  - 'The delivered signature is FIVE arguments, not the four the plan cites: p_election_round was added by phase 157 after the plan was written, and the grant is (uuid, uuid, uuid, boolean, integer)'
  - 'The migration is 00005, not the 00004 the plan names, because 00004 is taken'
  - 'get_questions is dispositioned UNSCOPED rather than fixed: closing it is a second one-way change to a second granted anon signature, which the operator was not asked about'
  - 'ScopedTableAccess.select is typed as the builder own method type rather than rebuilt from Parameters and ReturnType, because those erase the column-projection generic and make every scoped read return an empty row'
  - 'The pgTAP proof publishes project B rather than seeding a third project, so the project predicate is the only separator and the cross-project zero is not an artefact of row-level security'

patterns-established:
  - 'A cross-tenant exclusion assertion ships two positive controls, one per tenant, so neither zero can come from an empty instrument'
  - 'A red half taken against the LIVE database by a scratch CREATE OR REPLACE, never committed, with the restored definition proven byte-identical by a function-definition hash'

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: 'public.get_nominations takes a required p_project_id uuid first parameter with no DEFAULT, filters n.project_id = p_project_id, and its EXECUTE grant to anon and authenticated is re-issued for the new arity'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "psql: SELECT pg_get_function_arguments(...) -> 'p_project_id uuid, p_election_id uuid DEFAULT NULL::uuid, ...'; exactly 1 overload; routine_privileges shows anon and authenticated"
        status: pass
      - kind: integration
        ref: 'apps/supabase/supabase/tests/database/07-rpc-security.test.sql#get_nominations with no arguments raises undefined_function'
        status: pass
      - kind: other
        ref: "grep -v '^\\s*--' 00005_get_nominations_project_scope.sql | grep -c 'p_project_id uuid DEFAULT' -> 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Calling get_nominations with project A's id returns zero rows belonging to project B, proven by pgTAP over two anon-visible projects, including an external_id collision"
    requirement: PRESHIP-01
    verification:
      - kind: integration
        ref: 'apps/supabase/supabase/tests/database/07-rpc-security.test.sql#Section 8 (7 assertions, plan raised 9 -> 16)'
        status: pass
      - kind: other
        ref: 'red half: scratch CREATE OR REPLACE without the project conjunct -> assertions 12-15 fail, controls 10, 11 and 16 still pass; restore -> 386/386 green'
        status: pass
    human_judgment: false
  - id: D3
    description: 'Every project-scoped query site in supabaseDataProvider.ts is scoped: six table accesses through scopedFrom and the get_nominations call through p_project_id'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts#project scoping (9 cases)'
        status: pass
      - kind: other
        ref: "comment-filtered grep: this.supabase.from( -> 0, scopedFrom( -> 6, p_project_id -> 1, limit(1) -> 0"
        status: pass
    human_judgment: false
  - id: D4
    description: '_getAppSettings and _getAppCustomization select the app_settings row by project rather than by limit(1)'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'supabaseDataProvider.test.ts#getAppSettings selects the app_settings row by project and never by limit(1) (and the customization twin)'
        status: pass
    human_judgment: false
  - id: D5
    description: 'dataProvider/supabaseDataProvider.ts is a member of GUARDED_SOURCES and no longer appears in DEFERRED_SOURCES'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: 'node scripts/assert-project-scoped-queries.mjs -> exit 0, 3 guarded / 2 deferred / 2 raw calls examined; --self-test exit 0'
        status: pass
      - kind: other
        ref: "red/green flip on the newly promoted file: injected bare this.supabase.from('elections') -> exit 1 naming :225; restored -> exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: 'The live local database carries the new signature and the regenerated types match it, applied once by yarn db:reset'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: 'yarn db:reset exit 0 (00005 applied), yarn db:types produced p_project_id: string (required), TURBO_FORCE=true yarn typecheck exit 0'
        status: pass
      - kind: other
        ref: 'convergence: fresh-reset definition hash 38b902fb… equals the hash produced by rebuilding the four-argument pre-state and applying 00005 alone'
        status: pass
    human_judgment: false
  - id: D7
    description: 'The running voter app reads only its own project through the converted provider'
    verification: []
    human_judgment: true
    rationale: 'Every static and unit-level link is proven, and the SQL half is proven against the live database. What is NOT proven here is the end-to-end runtime hop through a served application, which needs a dev server and an E2E dataset this plan does not provision. The phase batches that into plan 161-07, whose twice-in-a-row proof is the designed place for it, and workflow.human_verify_mode is end-of-phase.'
  - id: D8
    description: 'get_questions carries a written, re-derived disposition instead of the false one it shipped with'
    verification:
      - kind: other
        ref: "grep get_questions scripts/assert-project-scoped-queries.mjs -> 'UNSCOPED: no project term in its body; returns every project's questions'"
        status: pass
      - kind: other
        ref: 'ls .planning/todos/pending/2026-09-04-get-questions-returns-every-projects-questions.md'
        status: pass
    human_judgment: false

duration: 21min
completed: 2026-09-04
status: complete
---

# Phase 161 Plan 02: get_nominations project scope Summary

**`public.get_nominations` now takes a required `p_project_id` first parameter with no `DEFAULT`, delivered by additive migration `00005`; the read-path adapter issues no unscoped query; the `app_settings` `limit(1)` singleton is gone; and cross-project isolation is proven by seven pgTAP assertions with a recorded red half.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-09-04T09:18:18Z
- **Completed:** 2026-09-04T09:39:29Z
- **Tasks:** 4
- **Files modified:** 17 (3 created, 14 modified across 5 commits)

## Accomplishments

- The app's largest unscoped read is closed at the one layer a source guard cannot reach. `get_nominations` with every filter NULL — the shape the voter app sends before an election is chosen — used to return every project's nominations; it now cannot be called at all without naming a project.
- The parameter is REQUIRED. A caller that forgets it gets `undefined_function`, asserted by `throws_ok`, rather than a quietly wider result set.
- All seven remaining query sites in `supabaseDataProvider.ts` are scoped, and the file was promoted into the guard's `GUARDED_SOURCES` with the promotion proven by a red/green flip against the real file.
- The `app_settings` `limit(1)` with no `order` is deleted; the row is selected by the `UNIQUE(project_id)` filter.
- `get_questions` was found to carry the SAME defect and a FALSE disposition. The disposition is corrected to the measured truth and the fix is filed rather than taken unasked.

## Task 1 — the operator's answers, recorded verbatim

Recorded on disk first at `161-02-DECISION.md`, committed as `53df3b06c` **before any file under `apps/supabase` was modified**. The task's `<verify>` returned `0` and the instrument was proven in both directions: appending a newline to `apps/supabase/package.json` made `git status --porcelain apps/supabase | wc -l` return `1`, and `git checkout --` returned it to `0`.

### Answer 1 — `required-parameter`

> "This is the phase's central deliverable: criterion 2 says every project-scoped query is parameterised, and get_nominations is the largest unscoped read in the app. Making it REQUIRED rather than defaulting NULL is what makes a missing parameter a hard error instead of a silent cross-project read."

**Constraint 1 — re-derive the current parameter list.** Done, and the plan's is stale. At HEAD the function took FOUR arguments, not three: `p_election_round integer DEFAULT NULL` was added by `migrations/00004_question_rpcs_and_nomination_election_round.sql`, which phase 157 plan 03 landed after this plan was written. The delivered signature is therefore **five** arguments and the grant is `(uuid, uuid, uuid, boolean, integer)`. The plan's `lines 1-95` anchor was equally stale.

**Constraint 2 — no positional caller may be silently reordered.** Every caller was found and every one passes by name:

| Caller | Shape |
| --- | --- |
| `supabaseDataProvider.ts:330` | `rpc('get_nominations', { … })`, PostgREST named keys |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts:429` | `rpc('get_nominations', {})`, empty named object |
| `11-question-rpcs.test.sql`, 9 sites | `get_nominations ()` and `get_nominations (p_election_round => 1)`, `=>` notation |
| `scripts/fixtures/project-scoped-queries/clean.fixture.ts:44` | already `{ p_project_id }` |

Zero positional callers, so the placement reorders nothing. The placement is also not a preference: PostgreSQL forbids a required parameter after a defaulted one.

**Constraint 3 — grant re-issued, and the two application paths converge.** `information_schema.routine_privileges` shows `anon` and `authenticated` with `EXECUTE` after the reset. Convergence was measured rather than assumed:

```
fresh yarn db:reset          -> md5(regprocedure || pg_get_functiondef) = 38b902fb1854ab9d556279f6ce94177b
rebuild the 4-arg pre-state,
then apply 00005 alone       -> 38b902fb1854ab9d556279f6ce94177b
```

The pre-state was verified to really be the old function (`get_nominations(uuid,uuid,boolean,integer)`) before `00005` ran, so the equality is a convergence proof and not a tautology.

### Answer 2 — DR-9 corrected in place

Both wrong rows were corrected in `161-02-PLAN.md` itself, with cause and date, so the stale claims cannot propagate into Phase 162's planning.

**Correction A.** `merge_custom_data` does not exist. The adapter calls `merge_question_custom_data` (`adminWriter/supabaseAdminWriter.ts:62`). Plan `161-01` had already measured this from the other side and seeded the shipped guard from the real call sites, so only the prose was stale.

**Correction B — the important one.** DR-9 asserted "Phase 157's `get_questions` RPC does not exist yet — verified this session". It exists, in `schema/505-question-rpcs.sql`, in `migrations/00004`, and at `supabaseDataProvider.ts:559`. Phase 157 plan 03 shipped it after the plan was written.

**Its disposition, re-derived from the body rather than assumed:**

`get_questions(p_election_id uuid DEFAULT NULL, p_constituency_id uuid DEFAULT NULL, p_election_round integer DEFAULT NULL)` selects from `question_categories` and `questions`. Both carry `project_id NOT NULL REFERENCES public.projects(id)`. Its `WHERE` clauses test only `election_ids`, `constituency_ids` and `election_rounds`, each under an `IS NULL OR jsonb_array_length(...) = 0 OR ... @> ...` predicate. **There is no `project_id` term anywhere in the function.**

So `get_questions` with all three parameters NULL returns every project's questions and categories. It is the same defect as the one this plan just closed, one function over.

The disposition the shipped guard carried — `scoped-by-identity: election id + RLS` — is **false on both halves**: the election id is optional and defaults NULL, and row-level security cannot scope by project for an `anon` caller with no project identity. It is corrected to `UNSCOPED: no project term in its body; returns every project's questions`, and the guard's docblock now explains why an overstated disposition is worse than none.

**It is recorded, not fixed.** Closing it means a required parameter on a SECOND granted `anon`-executable signature — a second one-way decision the operator was not asked about. Filed at `.planning/todos/pending/2026-09-04-get-questions-returns-every-projects-questions.md` with the exact migration recipe, the caller list and the verification. **This is the single most important thing for the next reader of this phase: criterion 2 is not fully true of the question read path, and this SUMMARY says so rather than letting the guard's silence imply otherwise.**

## Task Commits

1. **Task 1: record the operator's decisions and correct DR-9** — `53df3b06c` (docs)
2. **Task 2: the required p_project_id, applied to the live database** — `709b0ea17` (feat)
3. **Task 3 RED: failing project-scoping cases** — `0e9ee7fb6` (test)
4. **Task 3 GREEN: convert every site, promote into the guard** — `3322344eb` (feat)
5. **Task 4: pgTAP cross-project proof** — `d3104a13d` (test)

**Nothing was pushed.** Every push to the public repository remains the orchestrator's.

## The red halves, recorded

### The SQL half (task 4)

The project conjunct was removed from the LIVE definition by a scratch `CREATE OR REPLACE` (never committed, deleted afterwards):

```
# Looks like you failed 4 tests of 16
Failed test 12: "get_nominations for project A returns no nomination belonging to project B"
Failed test 13: "get_nominations for project B returns no nomination belonging to project A"
Failed test 14: "the two project-scoped counts partition the anon-visible confirmed nominations rather than merely filtering them"
Failed test 15: "an external_id shared by two projects yields exactly one row for project A, not both projects rows"
```

Exactly the four cross-project assertions failed. Assertions 10 and 11 — the two "returns at least one row" controls — and 16, the required-parameter `throws_ok`, all still passed, which is what shows the controls are measuring something other than the predicate under test. Re-applying `00005` restored a **byte-identical** definition (same md5) and the suite returned to `386/386` green.

### The guard half (task 3)

```
[ERROR] scripts/assert-project-scoped-queries.mjs: …/dataProvider/supabaseDataProvider.ts:225: bare `this.supabase.from('elections')`. …
Project-scoped query guard — 3 guarded source(s), 2 deferred, 5 adapter source(s) on disk, 3 raw client call(s) examined, 1 violation(s).
exit 1
```

Restoring the file returned it to `0 violation(s)`, exit 0, and the restored file was proven byte-identical by `diff`. The promotion is therefore live, not declarative.

### Why the pgTAP zeros are not vacuous

The shared fixture ships project B's organization and candidate `published = false` and its nominations unpublished with them, so an `anon` caller cannot see them **at all**. A cross-project zero measured in that state would hold with or without a project predicate — a textbook zero from an empty instrument. The new section therefore publishes everything project B owns first, which leaves the project predicate as the only separator, and asserts that **both** projects return at least one row before asserting that neither returns the other's. The red half above confirms the arrangement: with the predicate gone, the exclusions fail while the controls stay green.

## The schema application, and why it does not weaken criterion 3

`yarn db:reset` was run **once**, during execution, after the migration file was written and before every verification that depends on the new signature. It applied `00001` through `00005` plus `seed.sql`, then `yarn db:types` regenerated `packages/supabase-types` and `TURBO_FORCE=true yarn typecheck` was run against it.

This is a **one-time development-time schema application**. It is **not** a per-run precondition of `yarn test:e2e`. Criterion 3 says the E2E suite must no longer require `yarn db:reset` before a run; nothing in this plan adds a reset to the E2E run path, and plan `161-07`'s Run B takes its proof with `--no-db-reset` long after this reset happened.

The expected red between task 2 and task 3 was recorded as evidence that the type regeneration reached the call site:

```
supabaseDataProvider.ts:330:46
Error: Property 'p_project_id' is missing in type '{ p_election_id … }' but required in type '{ … p_project_id: string; }'
```

## Files Created/Modified

- `apps/supabase/supabase/migrations/00005_get_nominations_project_scope.sql` — drops the four-argument signature, re-creates a five-argument one with `p_project_id` first and no `DEFAULT`, adds `WHERE n.project_id = p_project_id` as an unconditional equality rather than the `IS NULL OR` shape the other filters use, re-issues the grant. Follows `00002`/`00004`'s shape exactly: header block, "Applies to schema files:" list, `BEGIN;` … `COMMIT;`.
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` — the same change in the readable mirror, with a header note saying why the project parameter is required and why it comes first. `00001_initial_schema.sql` is untouched (verified: `git diff --name-only` over the plan's whole commit range is empty for it).
- `apps/supabase/package.json` — a `test:db` script, `supabase test db`, beside `test:unit`.
- `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` — Section 8, seven assertions, `plan (9)` raised to `plan (16)`.
- `apps/supabase/supabase/tests/database/11-question-rpcs.test.sql` — nine call sites gained `p_project_id => test_id('project_a')`; the signature assertion updated from four arguments to five.
- `apps/supabase/scripts/schema-migration-parity.expected.txt` — re-baselined (29 hunks to 32) and the fixture diff reviewed before committing.
- `packages/supabase-types/src/database.ts` — regenerated; `p_project_id: string`, required, with no `?`.
- `packages/supabase-types/RPC-NULLABILITY.md` — the DERIVED region regenerated for the shifted declaration lines.
- `packages/dev-seed/tests/integration/default-template.integration.test.ts` — the anon `get_nominations` call now passes `TEST_PROJECT_ID`, and its comment rewritten because the no-argument rationale it stated is no longer true.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — seven sites converted.
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` and `supabaseAdapter.ts` — `ScopedTableAccess.select` retyped so the column-projection generic survives.
- `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts` — its stub client gained `eq`.
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` — a chain recorder plus nine new cases; four pre-existing exact-argument rpc assertions and one constituency assertion updated.
- `scripts/assert-project-scoped-queries.mjs` — the provider promoted, `get_questions` re-dispositioned, the docblock's "both guarded sources" claim corrected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The plan's cited `get_nominations` signature is stale; the function takes four arguments, not three**

- **Found during:** Task 1, discharging the operator's re-derive constraint.
- **Issue:** DR-6, task 2, task 4 and the must-haves all describe a three-argument function becoming four. At HEAD it is four, becoming five: `p_election_round integer DEFAULT NULL` was added by phase 157's `migrations/00004`. The plan's `lines 1-95` anchor is stale for the same reason.
- **Fix:** The migration drops `(uuid, uuid, boolean, integer)` and grants `(uuid, uuid, uuid, boolean, integer)`. Every "four-argument" phrasing in the plan reads as five, stated in the amended DR-9 block and in the decision record.
- **Verification:** `psql` reports one overload, `get_nominations(uuid,uuid,uuid,boolean,integer)`, argument list beginning `p_project_id uuid`.
- **Committed in:** `53df3b06c` (the amendment), `709b0ea17` (the migration)

**2. [Rule 3 - Blocking] The plan's migration filename is taken**

- **Found during:** Task 2.
- **Issue:** The plan names `00004_get_nominations_project_scope.sql`. `00004_question_rpcs_and_nomination_election_round.sql` already occupies that number.
- **Fix:** The file is `00005_get_nominations_project_scope.sql`.
- **Committed in:** `709b0ea17`

**3. [Rule 1 - Bug] DR-9 names an RPC that does not exist**

- **Found during:** Task 1.
- **Issue:** DR-9's fourth row is `merge_custom_data`. The adapter calls `merge_question_custom_data`.
- **Fix:** Renamed in DR-9 with the cause and date. The shipped guard already carried the correct name, because plan `161-01` seeded it from measured call sites.
- **Committed in:** `53df3b06c`

**4. [Rule 1 - Bug] DR-9's `get_questions` claim is false, and the guard's disposition for it was false too**

- **Found during:** Task 1, re-deriving the disposition from the body.
- **Issue:** DR-9 says `get_questions` does not exist. It does. Worse, the guard dispositioned it `scoped-by-identity: election id + RLS`, which is false on both halves — the election id defaults NULL and RLS cannot scope by project for `anon`. The body carries no project term at all.
- **Fix:** DR-9 rewritten with the measured disposition, the guard's string corrected to `UNSCOPED: …`, an `UNSCOPED` disposition class documented in the guard's docblock, and a follow-up todo filed with the migration recipe. The RPC itself is NOT changed: that is a second one-way decision.
- **Committed in:** `53df3b06c`, `3322344eb`

**5. [Rule 3 - Blocking] The plan's "nine query sites" is eight, and two of the named sites no longer exist**

- **Found during:** Task 3.
- **Issue:** The plan lists a `question_categories` read and a `let qQuery = this.supabase.from('questions')…` builder. Phase 157 plan 03 replaced both with the `get_questions` RPC before this plan ran. The file has six table sites and two rpc calls.
- **Fix:** Six sites converted to `scopedFrom`, one rpc given `p_project_id`. The acceptance criterion "at least 8 `scopedFrom(`" is therefore **unsatisfiable as written** and reads 6; the criterion it stands for — zero bare `this.supabase.from(` — is met exactly, and is the one the guard enforces.
- **Verification:** comment-filtered greps: `this.supabase.from(` 0, `scopedFrom(` 6, `p_project_id` 1, `limit(1)` 0.
- **Committed in:** `3322344eb`

**6. [Rule 1 - Bug] The scoped facade's `select` erased the column-projection generic, typing every scoped read as an empty row**

- **Found during:** Task 3, from `TURBO_FORCE=true yarn typecheck` — 20 errors, all of the form `Property 'settings' does not exist on type '{}'` and `'row' is of type 'unknown'`.
- **Issue:** `ScopedTableAccess.select` was declared `(...args: Parameters<QueryBuilderFor<T>['select']>) => ReturnType<QueryBuilderFor<T>['select']>`. PostgREST's `select` is GENERIC over the projection string and that generic decides the result row type; `Parameters` and `ReturnType` each instantiate the method at its constraint first, so the projection is erased. Plan `161-01` never hit it because its only converted call was an `insert`.
- **Fix:** `select` is declared as the builder's own method type, `QueryBuilderFor<TTable>['select']`, and the implementation carries one narrow cast, documented beside the two casts already in that method.
- **Verification:** `TURBO_FORCE=true yarn typecheck` exit 0; the joined `select('*, election_constituency_groups(constituency_group_id)')` row shape is back.
- **Committed in:** `3322344eb`

**7. [Rule 3 - Blocking] The concurrency stub client had no `eq`**

- **Found during:** Task 3, from the full frontend suite — 2 failures, `TypeError: builderToScope.eq is not a function`.
- **Issue:** `supabaseAdapter.concurrency.test.ts` builds a fake client for the chain `.from().select().limit().single()`. The converted `_getAppSettings` issues `.eq()` instead of `.limit()`.
- **Fix:** `eq: vi.fn().mockReturnThis()` added and the stub's docstring corrected, since it named a chain that is no longer issued.
- **Committed in:** `3322344eb`

**8. [Rule 1 - Bug] Lockstep callers the required parameter breaks**

- **Found during:** Tasks 2 and 3.
- **Issue:** A required parameter breaks every existing call. Nine pgTAP sites raised `function get_nominations() does not exist`; the dev-seed anon integration call passed `{}`; four pre-existing provider tests asserted exact rpc argument objects; one constituency test asserted the second read had NO `eq` at all, which the project filter now makes false.
- **Fix:** All updated. The constituency assertion was rewritten to preserve its INTENT — that the caller's id filter is not applied to the second read — by asserting the absence of an `id` filter specifically rather than the absence of any filter.
- **Verification:** pgTAP 386/386; frontend 1621/1621; whole workspace unit suite green.
- **Committed in:** `709b0ea17`, `3322344eb`

**9. [Rule 3 - Blocking] Two guards needed re-baselining after the schema edit**

- **Found during:** Task 2.
- **Issue:** `assert:schema-migration-parity` went red (29 recorded hunks, 32 observed) because `schema/503-entity-rpcs.sql` legitimately gained a later-migration change. The `RPC-NULLABILITY.md` DERIVED region cites declaration line numbers, which shifted.
- **Fix:** `yarn assert:schema-migration-parity:update` with the fixture diff reviewed, and `assert-rpc-return-nullability.mjs --write`. Both then green.
- **Verification:** **`assert:rpc-nullability` still harvests 3 RETURNS TABLE RPCs, not 0** — `resolve_email_variables 4, get_nominations 32, get_candidate_user_data 15`, 0 violations. The guard was not inertly zeroed by the signature change.
- **Committed in:** `709b0ea17`

### Recorded refusals — plan text measured and NOT followed

- **"Seed a second project inside the test transaction" was not taken literally.** `create_test_data()` already seeds two projects with elections, constituencies, candidates, organizations and nominations. A third would have added fixture without adding evidence. What was missing was not a project but VISIBILITY: project B's rows are unpublished, so its exclusion would have been guaranteed by RLS rather than by the predicate. The section publishes project B instead, which is the change that makes the zero mean something.
- **`get_questions` was NOT fixed**, though it carries the same defect. See Answer 2 above. Recorded, dispositioned and filed rather than taken unasked.
- **The E2E suite was not run here.** See "Outstanding verification" below.

---

**Total deviations:** 9 auto-fixed (4 bugs, 5 blocking) plus 3 recorded refusals.
**Impact on plan:** every deviation was forced by a plan premise false at HEAD, or by a lockstep consequence of the signature change the plan asked for. No stated behaviour was dropped. One acceptance criterion (`scopedFrom(` at least 8) is unsatisfiable as written and is reported as 6 rather than bent.

## Warning for plan `161-04` — it carries the same false premises

`161-04` is written against the same two API shapes that do not exist, both already recorded by `161-01` and both re-confirmed here:

1. **There is no `supabaseAdapterMixin.init()`.** Resolution happens in the CONSTRUCTOR.
2. **`PostgrestQueryBuilder` has no `.eq()`.** `scopedFrom` is a FOUR-OPERATION FACADE (`select` / `insert` / `update` / `delete`), not a filtered builder. A `.eq()`-shaped design will not compile.

And a third, discovered here and NEW to `161-04`:

3. **`ScopedTableAccess.update` and `.delete` are still declared with the `Parameters`/`ReturnType` shape that erased `select`'s generic** (deviation 6 fixed `select` only, because that is the operation this plan's converted sites use). `161-04` converts `supabaseDataWriter.ts` and `supabaseAdminWriter.ts`, which are write paths. If a converted `update` or `delete` call loses its row type the same way, the fix is the same: name the builder's own method type instead of rebuilding it.

`161-04` should also expect **two** `DEFERRED_SOURCES` entries now, not three.

## Issues Encountered

- **The plan's `<verify>` and acceptance criteria were written against a four-argument function that had become five.** Re-deriving cost one measurement and prevented a migration that would have created a second overload — which `11-question-rpcs.test.sql` asserts against directly, so it would have failed loudly rather than silently. The assertion did its job.
- **A `limit(1)` on `app_settings` was the only thing selecting a row.** Deleting it is correct because `app_settings.project_id` is `UNIQUE`, but any future code path assuming `.single()` tolerance should note that a project with no `app_settings` row still takes the `PGRST116` branch, which is preserved.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired component was introduced.

## Broken-windows ledger

`.planning/WINDOWS.md` currently refuses `gsd-tools windows append` — its rendered table disagrees with its own fenced JSON, a pre-existing condition this plan did not touch and did not hand-edit. The entries it would have carried are therefore recorded here:

| Kind | File | Description |
| --- | --- | --- |
| `deviation` | `scripts/assert-project-scoped-queries.mjs` | `get_questions` returns every project's questions. Dispositioned `UNSCOPED` rather than fixed, because closing it is a second one-way change to a second granted `anon` signature. Filed at `.planning/todos/pending/2026-09-04-get-questions-returns-every-projects-questions.md`. |
| `unrun-verify` | `tests/` | The E2E suite was not run for this plan. See "Outstanding verification". |
| `deviation` | `packages/supabase-types/RPC-NULLABILITY.md` | Its HAND-WRITTEN disposition tables cite `503-entity-rpcs.sql` line numbers that were ALREADY stale before this plan (the `NULL::text` evidence cites `:128`, measured at `:119` pre-change and `:124` now). Only the machine-generated DERIVED region tracks. Pre-existing and out of scope; the guard does not check these citations. |

## Outstanding verification (batched for end-of-phase UAT)

Deliverable **D7** is the only unproven item, and it is the runtime hop:

> With the local stack up and `PUBLIC_PROJECT_ID` set, load the voter app and confirm elections, constituencies, questions, candidates and nominations still render — the whole read path now filters on the configured project, and the `get_nominations` call fails outright rather than degrading if the project id is wrong.

It is not run here for the same reason `161-01`'s equivalent was not: it needs a served application and an E2E dataset this plan does not provision, `workflow.human_verify_mode` is `end-of-phase`, and plan `161-07` owns the E2E proof by design (its Run B carries `--no-db-reset`). The root `.env` is not readable from this execution context, so the `PUBLIC_PROJECT_ID` precondition for a dev server could not even be confirmed here.

**This is the plan's largest residual risk and it should be discharged early in `161-07`,** because this is the change that puts a filter on every read the voter app performs. Everything below it is proven: the SQL against the live database, the adapter against 1621 unit tests, and the wiring against a red/green flip.

## User Setup Required

None new. `PUBLIC_PROJECT_ID` was documented by plan `161-01`; an existing checkout still needs that line in its own `.env` or the app throws, naming the variable and the file.

## Next Phase Readiness

- **`161-04` is unblocked**, with the three warnings above. It inherits two `DEFERRED_SOURCES` entries, each reason-stringed `conversion pending`; moving a file into `GUARDED_SOURCES` and deleting its entry is the completion signal.
- **`161-07`** should take the runtime/E2E verification for this plan as well as its own.
- **A follow-up is filed for `get_questions`** and should be scheduled before the milestone ships: criterion 2 is not fully true of the question read path until it lands.
- **Nothing was pushed.**

---

_Phase: 161-project-scoping-project-id-parameterisation_
_Completed: 2026-09-04_

## Self-Check: PASSED

- All 3 created files verified present on disk with `[ -f ]`.
- All 5 commit hashes verified reachable with `git log --oneline --all`.
- `git diff --diff-filter=D --name-only 53df3b06c~1..HEAD` is empty: no file was deleted.
- Final gates, each run AFTER the last edit and with its exit status read directly, never through a pipe: `TURBO_FORCE=true yarn lint:check` exit 0 (17 links, all guard summary lines observed), `yarn build` exit 0, `yarn test:unit` exit 0 across the workspace, `yarn workspace @openvaa/supabase test:db` exit 0 (386 assertions), `node scripts/assert-project-scoped-queries.mjs` exit 0 and `--self-test` exit 0.
