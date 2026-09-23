---
phase: 156-supabase-schema-corrections-naming-constraints-grants
plan: 08
subsystem: database
tags: [postgres, supabase, pgtap, rpc, plpgsql, rls, security-invoker, jsonb, typescript, codegen]

requires:
  - phase: 156-07
    provides: the green pgTAP baseline (Files=11, Tests=312, Result PASS) and the narrowed column grants that still carry `answers` on organizations, which is what lets the new organization branch write at all
  - phase: 156-01
    provides: 156-DISPOSITIONS.md entry 6, which published `merge_question_custom_data` as the target name before Phase 157 was planned
provides:
  - "public.upsert_answers writes both answer-bearing tables — candidates first, organizations only when the candidate update matched no row; one call never writes both"
  - "public.merge_custom_data renamed to public.merge_question_custom_data at every naming site in SQL, pgTAP, the two adapter call sites, the adapter doc blocks and the unit test's title and expectation"
  - "5 new pgTAP assertions: planned suite total 304 -> 309; harness total 312 -> 317"
  - "packages/supabase-types/src/database.ts regenerated — the rename plus is_image and validate_image, two functions plan 06 added to the schema without regenerating"
  - "A measured hazard for every later plan: 00-helpers.test.sql installs six fixture functions permanently into public, so db:types after a suite run captures them"
affects: [156-09, 156-10, 157-adapter-boundary, 161-project-scoping]

actuals:
  tokens: 61969
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Widen a SECURITY INVOKER writer by an explicit fall-through, never by two unconditional updates: plpgsql FOUND is not reset by an IF statement, so `UPDATE a; IF NOT FOUND THEN UPDATE b; END IF;` leaves the trailing not-found tail reading the last DML that actually ran"
    - "Prove adjacency by snapshotting the OTHER table before the write and counting rows that moved — 'it wrote the right row' and 'it wrote only that row' are different claims and only the second rules out a double write"
    - "Read a function's security setting from pg_proc.prosecdef, not from the DDL text: the catalogue is what Postgres enforces, the DDL is what someone typed"
    - "Regenerate typed RPC maps FIRST and let typecheck enumerate the stale call sites BEFORE renaming them — the compiler's list is the ground truth a grep can only approximate"
    - "An assertion that a name is ABSENT must name it, so a 'the old name appears nowhere' grep criterion is unsatisfiable by construction once that assertion exists; record the residual rather than encoding the name obliquely to dodge the grep"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/503-entity-rpcs.sql
    - apps/supabase/supabase/schema/504-admin-rpcs.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - packages/supabase-types/src/database.ts

key-decisions:
  - "The widening is an explicit fall-through, not two unconditional updates. plpgsql FOUND survives an IF statement, so the candidate attempt's outcome is what gates the organization attempt and the shared not-found tail still reads the last DML that ran."
  - "SECURITY INVOKER was verified from pg_proc.prosecdef for BOTH RPCs (f, i.e. invoker) rather than by reading the DDL, because the catalogue is what Postgres enforces."
  - "Adjacency was proven by snapshotting the opposite table and counting changed rows on each of two writes — 0 and 0 — rather than by arguing from the source that the branches are exclusive."
  - "The pgTAP assertion proving the old RPC name is gone uses hasnt_function and therefore NAMES the old name. The plan's 'zero matches under apps/supabase' criterion is unsatisfiable once that assertion exists; the residual (2) is recorded rather than dodged by constructing the name dynamically."
  - "packages/supabase-types/src/database.ts was regenerated from a freshly RESET database, not from the post-suite one. Regenerating after `supabase test db` writes six pgTAP fixture functions into the shipped types — measured, and reverted."

patterns-established:
  - "A rename is carried into the generated type map first, so the compiler enumerates the call sites; the rename is then applied to exactly that list and typecheck re-run to zero."
  - "A criterion whose arithmetic or premise is wrong is measured, reported with the true number, and marked falsified — the code is not contorted to satisfy the grep."

requirements-completed: [REVIEW-DB-06]

coverage:
  - id: D1
    description: "public.upsert_answers writes answers for an organization — the capability that did not exist before, since both branches previously wrote public.candidates unconditionally"
    requirement: REVIEW-DB-06
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#an organization admin can store its own organization answers through upsert_answers"
        status: pass
      - kind: other
        ref: "psql probe: upsert_answers(<org id>, {q: {value:true}}, false) returned the stored object and the organizations row carries it"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fall-through is exclusive: candidates are tried first, organizations only when the candidate update matched no row, and one call never writes both tables"
    requirement: REVIEW-DB-06
    verification:
      - kind: other
        ref: "psql probe: snapshot candidates -> write an organization -> 0 candidate rows changed; snapshot organizations -> write a candidate -> 0 organization rows changed"
        status: pass
      - kind: other
        ref: "grep over the function window: 2 x `UPDATE public.candidates`, 2 x `UPDATE public.organizations`, exactly 1 `RAISE EXCEPTION` (a single shared tail, not one per table)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Neither matching raises the existing not-found message with the interpolated entity id, unchanged by the widening"
    requirement: REVIEW-DB-06
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#an id matching neither candidates nor organizations raises the existing not-found exception"
        status: pass
      - kind: other
        ref: "psql probe: ERROR: Entity not found or access denied: 11111111-2222-3333-4444-555555555555, from PL/pgSQL function upsert_answers(uuid,jsonb,boolean) line 52 at RAISE"
        status: pass
    human_judgment: false
  - id: D4
    description: "An empty answers object under merge semantics leaves the stored answers unchanged and returns them; the renamed custom-data RPC with an empty patch returns the existing data unchanged"
    requirement: REVIEW-DB-06
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#upsert_answers with merge semantics and an empty answers object leaves the stored organization answers unchanged and returns them"
        status: pass
      - kind: other
        ref: "psql probe: merge_question_custom_data(qid, '{}') returned the pre-existing custom_data byte-for-byte"
        status: pass
    human_judgment: false
  - id: D5
    description: "The pre-existing candidate answer path is unregressed by the widening"
    requirement: REVIEW-DB-06
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#a candidate call still stores answers on the candidate row after the widening"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#merge mode (overwrite=false) preserves existing answers (pre-existing assertion, still green)"
        status: pass
    human_judgment: false
  - id: D6
    description: "upsert_answers kept its name, its three parameters and SECURITY INVOKER, and its GRANT EXECUTE argument list is untouched, so the widening grants no principal authority its own RLS policies would refuse"
    requirement: REVIEW-DB-06
    verification:
      - kind: other
        ref: "pg_proc: proname=upsert_answers, prosecdef=f, pronargs=3, identity args `p_entity_id uuid, p_answers jsonb, p_overwrite boolean`"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#upsert_answers is SECURITY INVOKER (not DEFINER) (pre-existing assertion, still green)"
        status: pass
      - kind: other
        ref: "grep: `GRANT EXECUTE ON FUNCTION public.upsert_answers(uuid, jsonb, boolean) TO authenticated;` = 1 in both SQL copies; `SECURITY DEFINER` = 0 in 503-entity-rpcs.sql; `SECURITY INVOKER` count unchanged at 5"
        status: pass
    human_judgment: false
  - id: D7
    description: "The custom-data RPC is renamed to merge_question_custom_data at every site that names it — the definition, its grant, both adapter call sites, the adapter JSDoc and class doc block, the unit-test expectation and its title, and every pgTAP call and description"
    requirement: REVIEW-DB-06
    verification:
      - kind: other
        ref: "grep counts: 504-admin-rpcs.sql 4, 00001_initial_schema.sql 4, supabaseAdminWriter.ts 3, supabaseDataWriter.ts 1, supabaseAdminWriter.test.ts 2, database.ts 1"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts#calls merge_question_custom_data RPC and returns success"
        status: pass
      - kind: other
        ref: "yarn typecheck exit 0 after the rename; before the rename it flagged exactly supabaseDataWriter.ts:372 and supabaseAdminWriter.ts:25"
        status: pass
    human_judgment: false
  - id: D8
    description: "No definition survives under the old name in the catalogue — the one failure mode no source-tree grep can detect"
    requirement: REVIEW-DB-06
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql#no function named merge_custom_data survives in public (the pre-rename name of merge_question_custom_data)"
        status: pass
      - kind: other
        ref: "psql: SELECT count(*) FROM pg_proc JOIN pg_namespace ... WHERE nspname='public' AND proname='merge_custom_data' -> 0"
        status: pass
    human_judgment: false
  - id: D9
    description: "Merge precedence and shallowness are unchanged by the rename: on a duplicate top-level key the patch wins, and a nested object is replaced rather than merged"
    requirement: REVIEW-DB-06
    verification:
      - kind: other
        ref: "psql probe: custom_data {keep:me, dup:OLD, nested:{a:1,b:2}} patched with {dup:NEW, nested:{a:99}} -> {dup:NEW, keep:me, nested:{a:99}} — patch wins, and `b` is gone, so the merge is shallow"
        status: pass
    human_judgment: false
    rationale: "Measured, but NOT covered by any durable assertion — the suite only asserts that the merge PRESERVES existing keys, which a deep merge would also satisfy. Filed as WINDOWS 187 so the gap does not vanish with this SUMMARY."
  - id: D10
    description: "An admin can still edit a question's custom data and a candidate can still save answers, end to end in the running app"
    verification: []
    human_judgment: true
    rationale: "Both paths go through an RPC this plan renamed or rewrote. pgTAP proves the database mechanism and the unit tests prove the adapter passes the right name, but neither exercises PostgREST plus the frontend writer. The plan files this as the end-of-phase human check; plan 10's E2E suite is the corroboration."

duration: 15 min
completed: 2026-08-30
status: complete
---

# Phase 156 Plan 08: Entity-Generic Answer Writer and the Question Custom-Data Rename Summary

**`upsert_answers` now writes candidates and organizations through an exclusive fall-through — proven by zero rows moving in the opposite table on each of two writes — while `merge_custom_data` became `merge_question_custom_data` at all ten naming sites across two SQL copies, pgTAP, two adapter call sites, two doc blocks, a test title and the regenerated type map; 5 new assertions, suite 312 -> 317, `Result: PASS`.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-08-30T09:16:03Z
- **Completed:** 2026-08-30T09:31:20Z
- **Tasks:** 3
- **Files modified:** 8

## pgTAP: the Files / Tests / Result triple, before and after

Asserted as the conjunction WINDOWS 184 + 186 require — `Result: PASS` **and** a non-zero `Files=`
**and** `Tests=` at or above the expected floor. `Tests=` alone is the PLANNED count and reads
identically on pass and fail, so it is never asserted on its own. `grep -cE '^not ok'` over each run
is the independent failure check and returned **0** every time.

| Point | Files | Tests | Result | `not ok` |
|---|---|---|---|---|
| Baseline at 156-07 HEAD (`ce5a9b246`) | 11 | 312 | PASS | 0 |
| After Task 1 (+4) | 11 | 316 | PASS | 0 |
| After Task 2 (+1) | 11 | 317 | PASS | 0 |
| Final, after Task 3 | 11 | **317** | **PASS** | **0** |

**Floor computation.** The one file this plan touched, `10-schema-migrations.test.sql`, went
`plan(79)` -> `plan(83)` (Task 1) -> `plan(84)` (Task 2). The sum of `plan(N)` literals across
`apps/supabase/supabase/tests/database/*.test.sql` moved **304 -> 309**. `00-helpers.test.sql` runs
under `no_plan()` and contributes a further 8, so the harness line reads 8 higher: **317**.

**Per-file `plan(N)` at final HEAD**, read from the files rather than from the previous SUMMARY:

| File | plan(N) |
|---|---:|
| `00-helpers.test.sql` | `no_plan()` (contributes 8) |
| `01-tenant-isolation.test.sql` | 26 |
| `02-candidate-self-edit.test.sql` | 15 |
| `03-anon-read.test.sql` | 59 |
| `04-admin-crud.test.sql` | 30 |
| `05-organization-admin.test.sql` | 14 |
| `06-storage-rls.test.sql` | 15 |
| `07-rpc-security.test.sql` | 9 |
| `08-triggers.test.sql` | 32 |
| `09-column-restrictions.test.sql` | 25 |
| **`10-schema-migrations.test.sql`** | **84** |
| **Sum** | **309** |

The five new assertions were also observed green individually by running the file directly:

```
ok 41 - an organization admin can store its own organization answers through upsert_answers
ok 42 - upsert_answers with merge semantics and an empty answers object leaves the stored organization answers unchanged and returns them
ok 43 - a candidate call still stores answers on the candidate row after the widening
ok 44 - an id matching neither candidates nor organizations raises the existing not-found exception
ok 70 - no function named merge_custom_data survives in public (the pre-rename name of merge_question_custom_data)
```

## The widening, measured rather than argued

### The fall-through, and the plpgsql fact it rests on

Each branch now runs `UPDATE public.candidates … ; IF NOT FOUND THEN UPDATE public.organizations … ; END IF;`.
This works because **an `IF` statement does not reset `FOUND`**: `FOUND` is set by DML, `SELECT INTO`,
`PERFORM`, `FETCH`, `MOVE` and `FOR` loops, and by nothing else. So when the candidate update matches,
`FOUND` stays true through the skipped inner `IF` and the shared not-found tail correctly does nothing;
when it does not match, the organizations update runs and `FOUND` then reflects *that* statement. One
shared `RAISE EXCEPTION` still fires only when **both** attempts matched nothing.

### Adjacency proven by what did NOT move

Arguing that the branches are exclusive because the id spaces are disjoint is a source-reading, not a
measurement. Both directions were measured against the seeded database inside a rolled-back
transaction, by snapshotting the *other* table first:

```
org_write_returned                            {"66987624-…": {"value": true}}
candidate_rows_changed_by_org_write            0

cand_write_returned                           {"66987624-…": {"value": false}}
organization_rows_changed_by_candidate_write   0
```

One call wrote one table and moved nothing in the other, in both directions.

### The empty merge, and the not-found tail

```
empty_merge_returns_unchanged                 {"66987624-…": {"value": true}}
org_answers_after_empty_merge                 {"66987624-…": {"value": true}}

ERROR:  Entity not found or access denied: 11111111-2222-3333-4444-555555555555
CONTEXT:  PL/pgSQL function upsert_answers(uuid,jsonb,boolean) line 52 at RAISE
```

The message and its interpolated id are the pre-existing ones, verbatim.

### Nothing widened except which tables the function reaches

Read from the catalogue, not from the DDL — `prosecdef` is what Postgres enforces:

```
    proname     | is_security_definer | pronargs |                          args
----------------+---------------------+----------+--------------------------------------------------------
 upsert_answers | f                   |        3 | p_entity_id uuid, p_answers jsonb, p_overwrite boolean
```

`f` is `SECURITY INVOKER`. The organizations branch is therefore gated by
`organization_update_own_organizations` / `admin_update_organizations` exactly as the candidates branch
is gated by the candidates policies, and by `303-column-grants.sql`, which still carries `answers` in
the organizations GRANT after plan 07's narrowing (checked — it is one of the surviving eight columns).
No principal gained anything its own RLS would refuse.

## The rename, and the ten sites it moved through

| Where | Sites | Count after |
|---|---|---:|
| `schema/504-admin-rpcs.sql` | file-header function list, banner doc line, `CREATE OR REPLACE FUNCTION`, `GRANT EXECUTE` | 4 |
| `migrations/00001_initial_schema.sql` | the four twins | 4 |
| `adminWriter/supabaseAdminWriter.ts` | class doc block (`:10`), method JSDoc (`:19`), `rpc()` call (`:25`) | 3 |
| `dataWriter/supabaseDataWriter.ts` | `rpc()` call (`:372`) | 1 |
| `adminWriter/supabaseAdminWriter.test.ts` | `it(...)` title (`:64`), `toHaveBeenCalledWith` literal (`:73`) | 2 |
| `packages/supabase-types/src/database.ts` | regenerated `Functions` entry | 1 |
| `tests/database/10-schema-migrations.test.sql` | header line, section banner, `has_function`, `pg_proc` security lookup, five calls, seven descriptions | 19 |

**The `SECURITY INVOKER:` rationale survived verbatim** — it still names `admin_update_questions` and
`can_access_project()`, and that policy is unchanged by a rename. **No dynamic SQL was introduced**:
`EXECUTE format` / `EXECUTE ` / `quote_ident` count **0** inside the function body, and
`SECURITY DEFINER` count **0** in the file.

**Merge precedence and shallowness are unchanged**, measured directly because the rename is a pure
token substitution and the suite does not assert either property:

```
custom_data before   {"keep": "me", "dup": "OLD", "nested": {"a": 1, "b": 2}}
patch                {"dup": "NEW", "nested": {"a": 99}}
merged               {"dup": "NEW", "keep": "me", "nested": {"a": 99}}
empty patch returns  {"dup": "NEW", "keep": "me", "nested": {"a": 99}}
```

The patch wins on the duplicate key `dup`, and `nested.b` is **gone** — the `||` merge is shallow, it
replaces the nested object rather than merging into it.

## `yarn typecheck` as the detector — what it caught, and what it did not

The plan asks explicitly whether typecheck caught a call site the grep had missed. **It did not — but
that is only knowable because the order was inverted deliberately.** The types were regenerated
*before* any TypeScript was renamed, and `yarn typecheck` was run against the stale call sites:

```
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:372:47
Error: Argument of type '"merge_custom_data"' is not assignable to parameter of type '"_bulk_upsert_record" | … | "validate_image"'.

apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:25:47
Error: Argument of type '"merge_custom_data"' is not assignable to parameter of type '"_bulk_upsert_record" | … | "validate_image"'.
```

**Exactly two errors, exactly the two `rpc()` call sites the grep had already found.** The compiler's
list and the grep's list agreed, which is the useful result: the grep was complete. After the rename,
`yarn typecheck` exits **0**, and `git diff apps/frontend/src | grep -cE '^\+.*(as any|: any)'` returns
**0** — nothing was absorbed by a cast.

## Two things the type regeneration surfaced that were not this plan's doing

**1. The suite contaminates the database, and `db:types` will ship the contamination.** The first
regeneration ran immediately after `supabase test db` and wrote **six pgTAP fixture functions** into
`packages/supabase-types/src/database.ts`: `create_test_data`, `reset_role`, `set_test_user`,
`test_id`, `test_user_id`, `test_user_roles`. Cause, measured: `00-helpers.test.sql` defines them at
lines 68-261, **outside** its `BEGIN;` (line 393) / `ROLLBACK;` (line 455) block, so they persist in
`public` after every suite run. The generated file was reverted, the database reset, and the types
regenerated from the clean state. **Recorded in STATE.md as a standing hazard**: always
`yarn db:reset-with-data` immediately before `yarn db:types`, and read the diff.

**2. `is_image` and `validate_image` were missing from the generated types.** Plan 06 added both to
the schema and never regenerated `database.ts`. They are in this plan's regeneration diff. This is
correct output, not scope creep — hand-trimming a generated file to keep a diff small is exactly the
failure `yarn db:types` exists to prevent — but it means the generated types were stale for two plans,
and any typecheck in that window could not have caught a call to either.

The final regeneration diff is therefore three semantic changes: the rename, `is_image`, and
`validate_image`. Nothing else.

## Gate results

| Gate | Result |
|---|---|
| `cd apps/supabase && npx supabase test db` | **Files=11, Tests=317, Result: PASS**, `not ok` = 0 |
| `yarn assert:schema-migration-parity` | **exit 0** — 24 schema files -> 3345 lines, `00001` -> 3337 lines, 4 hunks / 11 signature lines, golden fixture unmoved |
| `yarn build` | **exit 0** |
| `yarn typecheck` | **exit 0** (22/22 turbo tasks) |
| `yarn lint:check` | **exit 0** — twelve-link chain, all guards clean |
| `yarn test:unit` | **exit 0** — 25/25 tasks, **1903 tests across 182 files**, all passed |
| `yarn db:reset-with-data` | green, 752 rows seeded |
| `yarn db:types` | **exit 0**, regenerated from a reset database |
| `yarn db:lint:sql` | **exit 1 — PRE-EXISTING**, see below |
| `yarn test:e2e` | **not run — deliberately, per the plan.** Plan 10 owns the phase gate |

**A note on the unit-test figure.** 156-07's SUMMARY records `1826 tests across 174 test files`; this
run measures **1903 across 182**, from eleven per-workspace totals read line by line (`@openvaa/data`
244/47, `@openvaa/frontend` 816/54, `@openvaa/dev-seed` 603/53, and eight smaller). No double-count:
each workspace prints exactly one pair. This plan adds no test file and renames one string inside one
existing test, so it cannot account for +77. **The discrepancy is unexplained and is reported rather
than reconciled away** — the figure above is what was measured at this HEAD.

## `yarn db:lint:sql` exits 1 — not a criterion of this plan, and pre-existing regardless

This plan's acceptance criteria do **not** include `db:lint:sql`, so nothing here is falsified by it.
It was run anyway for continuity with plans 06 and 07. Exit **1**, on the same four advisories:

| Function | Message | Level |
|---|---|---|
| `public.is_localized_string` | `never read variable "p_key"` | warning |
| `public._bulk_upsert_record` | `unused variable "rel_key"` | warning |
| `public.resolve_email_variables` | `unused parameter "p_template_body"` | warning extra |
| `public.resolve_email_variables` | `unused parameter "p_template_subject"` | warning extra |

Byte-identical to the set plans 06 and 07 recorded. **Zero new advisories from this plan**, established
by diffing the advisory set rather than by reading the exit code, and corroborated structurally:
`grep -cE 'merge_question_custom_data|upsert_answers|organizations'` over the full advisor output
returns **0**. Already on the ledger three times (**WINDOWS 17 / 115 / 125**) — **not filed a fourth
time**, per the carried instruction. It needs an operator decision.

## Acceptance criteria, measured

### Task 1 — all eight pass

| Criterion | Expected | Measured | Verdict |
|---|---|---|---|
| `UPDATE public.organizations` in the function window (503) | 2 | **2** | pass |
| `UPDATE public.candidates` in the same window | 2 | **2** | pass |
| `RAISE EXCEPTION` in the same window | 1 | **1** | pass |
| `SECURITY INVOKER` in 503 unchanged from pre-task | 5 | **5** (git HEAD: 5) | pass |
| `SECURITY DEFINER` in 503 | 0 | **0** | pass |
| `GRANT EXECUTE ON FUNCTION public.upsert_answers(uuid, jsonb, boolean) TO authenticated;` | 1 | **1** | pass |
| All five counts hold identically in `00001_initial_schema.sql` | yes | **2 / 2 / 1 / grant 1**, and the two function blocks `diff` to **empty** (75 lines) | pass |
| `git diff --exit-code` on `supabaseDataWriter.ts` for this task | clean | **clean** | pass |
| `db:reset-with-data && supabase test db` with the four new assertions passing | exit 0 | **Files=11, Tests=316, PASS**, all four observed `ok` | pass |

### Task 2 — six pass, one FALSIFIED as written

| Criterion | Expected | Measured | Verdict |
|---|---|---|---|
| old name absent from `schema/`, `migrations/`, `tests/` (word-boundary) | 0 | **2** | **FALSIFIED — see below** |
| `merge_question_custom_data` in `504-admin-rpcs.sql` | >= 4 | **4** | pass |
| same in `00001_initial_schema.sql` | >= 4 | **4** | pass |
| `GRANT EXECUTE ON FUNCTION public.merge_question_custom_data(uuid, jsonb) TO authenticated;` | 1 | **1** (and 1 in `00001`) | pass |
| `admin_update_questions` inside the `SECURITY INVOKER:` rationale block | 1 | **1** | pass |
| dynamic-SQL constructs inside the function body | 0 | **0** | pass |
| new old-name-absence assertion present; `plan(N)` rose by exactly one | yes | **`hasnt_function` present; `plan(83)` -> `plan(84)`** | pass |
| `db:reset-with-data && supabase test db` | exit 0 | **Files=11, Tests=317, PASS** | pass |

**Falsification — the old name still appears twice, and it must.** Task 2's own action text requires
"one assertion … that the OLD name no longer exists as a function in `public`". Any such assertion has
to *name* the old name — pgTAP's `hasnt_function('public', 'merge_custom_data', …)` takes it as an
argument, and the description repeats it so a failure report is legible. Both residual occurrences are
lines 648-649 of `10-schema-migrations.test.sql`, inside that one assertion. **The criterion and the
action are mutually unsatisfiable**, and the criterion is the half that is wrong: the name could only
be kept out of the source by constructing it dynamically (`'merge_' || 'custom_data'`), which is
writing code to satisfy a metric rather than for clarity — the precise defect plan 07 refused to
commit. Everywhere the old name was a *live reference* it is gone; it survives only in the assertion
that proves it is gone. **Independently confirmed where it actually matters:** the catalogue query
returns **0** definitions under the old name, and the `apps packages tests --include='*.ts'` search
returns **zero**.

### Task 3 — all eight pass

| Criterion | Expected | Measured | Verdict |
|---|---|---|---|
| old name in `apps packages tests` (`*.ts`, `*.svelte`, word-boundary) | 0 | **0** | pass |
| `merge_question_custom_data` in `supabaseAdminWriter.ts` | 3 | **3** | pass |
| same in `supabaseDataWriter.ts` | 1 | **1** | pass |
| same in `supabaseAdminWriter.test.ts` | 2 | **2** | pass |
| same in `packages/supabase-types/src/database.ts` | >= 1 | **1** | pass |
| `yarn typecheck` exit 0 and no `as any` / `: any` added | 0 / 0 | **exit 0**, **0** | pass |
| `yarn build`, `yarn lint:check`, `yarn test:unit`, `yarn assert:schema-migration-parity` | exit 0 | **all exit 0** | pass |
| `supabase test db` exit 0, total recorded | exit 0 | **Files=11, Tests=317, PASS** | pass |

## The plan's `must_haves`, discharged

| Truth | Status |
|---|---|
| `upsert_answers` writes every entity type carrying an answers column — exactly candidates and organizations | **Met**. `105-answers.sql:10-11` adds the column to those two tables and no other; both are now written |
| Candidates first, organizations only on no-match; neither matching raises the existing message; one call never writes both | **Met**, and proven by what did NOT move: 0 candidate rows changed by an organization write, 0 organization rows by a candidate write |
| Empty answers under merge leaves the stored answers unchanged and returns them; the renamed RPC with an empty patch returns existing data unchanged | **Met** — both measured directly, and the first is a pgTAP assertion |
| Merge precedence unchanged: patch wins on a duplicate top-level key, and the merge is shallow | **Met by measurement, NOT by any durable assertion.** See the gap below and WINDOWS 187 |
| `upsert_answers` keeps its name, three parameters and `SECURITY INVOKER` | **Met**, verified from `pg_proc.prosecdef` (`f`) and `pronargs` (3), not from the DDL |
| The custom-data RPC is renamed everywhere it is named and the old name exists nowhere in the repository | **Met in substance, FALSIFIED as literally stated.** Every live reference is renamed and the catalogue holds no old-name definition; two occurrences survive inside the assertion that proves absence, and historical `.planning/` records are untouched by design |

**Prohibitions, all three discharged:**

- *MUST NOT widen `upsert_answers` via `SECURITY DEFINER`, a new grant, or any route letting it write a
  row the caller's RLS would refuse.* Not done. `prosecdef` is still `f`, `SECURITY DEFINER` count is 0,
  and the `GRANT EXECUTE` argument list is byte-identical.
- *MUST NOT introduce a table discriminator and dynamic SQL into the rename.* Not done. The parameter
  list is unchanged and `EXECUTE format` / `EXECUTE ` / `quote_ident` count 0 in the function body.
- *MUST NOT create a `get_questions` RPC in this phase.* Not done. `grep -c 'get_questions'` over
  `apps/supabase/supabase/` returns 0.

## The gap this plan leaves, recorded rather than closed

Task 2's action states that merge precedence and shallowness are "behaviour this rename must not
change; **task 3's pgTAP assertions check it**". Task 3 is the TypeScript task and adds **no** pgTAP
assertions, and the plan's own artifact list budgets exactly five new assertions, none about
precedence. The suite's nearest assertion is
`merge_question_custom_data preserves existing keys (arguments still present after adding terms)` —
which a *deep* merge would satisfy just as well, so it does not pin shallowness.

Both properties were proven by direct measurement (above) and **no assertion was added**, because
adding one would have falsified Task 2's own `plan(N) rose by exactly one` criterion and quietly
inflated a budget the plan states explicitly. The gap is instead filed as **WINDOWS 187**
(`unmet-truth`), so a future edit to the `||` expression meets a recorded expectation rather than
silence.

## Two downstream plans now carry a stale grep — filed as WINDOWS 188

The rename this plan implements is the one `156-DISPOSITIONS.md` entry 6 published *specifically* so
Phase 157 could be planned against it, and `157-CONTEXT.md:431` anticipates it. But two already-written
PLAN files were authored against the old literal and were not updated:

- `.planning/phases/157-adapter-boundary-typing/157-12-PLAN.md` — criterion
  ``grep -rc "rpc('merge_custom_data'" apps/frontend/src/lib/api`` **returns 1**. It now returns **0**.
- `.planning/phases/161-project-scoping-project-id-parameterisation/161-04-PLAN.md` — two criteria
  naming the same literal, stale the same way.

Their executors must substitute `merge_question_custom_data`, or the criteria fail against correct
code. **These plan files were not edited by this plan** — rewriting another phase's PLAN is out of
scope and would erase the evidence of the drift; **WINDOWS 188** carries it instead.

## Files Created/Modified

- `apps/supabase/supabase/schema/503-entity-rpcs.sql` — `upsert_answers` restructured into two
  fall-through branches; doc block extended with the two-table coverage and the adjacency rule, in the
  file's banner style, describing behaviour and citing nothing outside the tree (D-N1)
- `apps/supabase/supabase/schema/504-admin-rpcs.sql` — four naming sites renamed; the `SECURITY INVOKER`
  rationale, the parameter list, the merge expression and the error message all untouched
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — the twins of both changes, at the
  corresponding positions; the `upsert_answers` block `diff`s to empty against its schema counterpart
- `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` — new
  `upsert_answers covers every entity carrying an answers column` section (assertions 41-44), the
  old-name-absence assertion (70), 19 occurrences renamed including every assertion description, and
  `plan(79)` -> `plan(84)`
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` — the `rpc()` call,
  the method JSDoc and the class doc block
- `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` — the
  `toHaveBeenCalledWith` literal and the `it(...)` title, so the test name stops describing a function
  that does not exist
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — the sibling `rpc()`
  call (its `upsert_answers` call site is untouched: the widening is source-compatible)
- `packages/supabase-types/src/database.ts` — regenerated from a reset database

## Decisions Made

1. **The widening is an explicit fall-through, not two unconditional updates.** The plan requires the
   adjacency rule to be expressed structurally; `IF NOT FOUND THEN UPDATE …` does that, and it works
   because plpgsql's `FOUND` is not disturbed by an `IF` statement, so the shared not-found tail still
   reads the last DML that actually ran.
2. **Security verified from the catalogue.** `pg_proc.prosecdef = f` for both RPCs. The DDL is what
   someone typed; the catalogue is what Postgres enforces, and a widened writer is exactly where the
   difference would matter.
3. **Adjacency proven by absence.** Snapshot the other table, write, count rows that moved. "It wrote
   the right row" and "it wrote only that row" are different claims.
4. **Types regenerated before the TypeScript rename, deliberately**, so the compiler enumerated the
   stale call sites rather than the grep asserting completeness about itself. Both lists agreed at two.
5. **The contaminated regeneration was reverted, not shipped.** Six pgTAP fixture functions had leaked
   into `database.ts`; the fix is a reset before `db:types`, now recorded in STATE.md.
6. **The old name survives only in the assertion proving it is gone**, and that is reported as a
   falsified criterion rather than dodged by constructing the name dynamically.
7. **No precedence/shallowness assertion added**, to keep Task 2's `plan(N) + 1` criterion meaningful;
   the gap is filed as WINDOWS 187 instead of being silently absorbed.

## Deviations from Plan

No deviation rule 1-4 was triggered: no bug, no missing critical functionality, no blocker, no
architectural question. The departures below are all defects in the **plan text**, measured and
recorded, not changes to the work.

**1. [Documentation defect] `supabaseDataWriter.test.ts` has no mirror expectation.** Task 3's action
item 6 and the plan's `files_modified` list both name it as carrying "the mirror expectation and its
title". Measured: `grep -c 'merge_custom_data'` on that file returns **0**; the only unit-test site is
`adminWriter/supabaseAdminWriter.test.ts`. `156-DISPOSITIONS.md` entry 6 already records this correctly
("One test site also asserts the RPC name"), and Task 3's *acceptance criteria* are consistent with
reality — they enumerate counts for `supabaseAdminWriter.ts` (3), `supabaseDataWriter.ts` (1) and
`supabaseAdminWriter.test.ts` (2) and never mention `supabaseDataWriter.test.ts`. **The file was
therefore not modified.**

**2. [Documentation defect] Task 2's "task 3's pgTAP assertions check it".** No such assertions exist
or were budgeted. Handled as described above; WINDOWS 187.

**3. [Criterion arithmetic] Task 2's zero-old-name-under-`apps/supabase` criterion is unsatisfiable**
alongside Task 2's own required assertion. Recorded as falsified with the residual count of 2 and its
exact location.

**4. [Out-of-scope generated drift, absorbed correctly] `is_image` and `validate_image`.** Plan 06 left
`database.ts` stale; regenerating brought them in. Hand-trimming a generated file to keep a diff narrow
is the failure the codegen exists to prevent, so they were kept.

---

**Total deviations:** 0 requiring a code fix; 4 plan-text defects recorded.
**Impact on plan:** none on the work. All three tasks executed as specified; every criterion whose
premise held is green, and the two whose premise did not are stated with their measurements.

**`packages/dev-seed/src/template/permittedKeys.ts` needed NO edit — checked, not assumed** (carried
warning 2). It is a literal **column-name** array; this plan renames an **RPC** and drops or renames no
column, so nothing in it could be invalidated. Verified twice: `grep -nE 'merge_custom_data|merge_question_custom_data|upsert_answers'`
returns nothing, `git diff --exit-code` on the file is clean, and `yarn lint:check` exit 0 runs
`typecheck` across all 22 workspaces.

**Line maps were stale again, as carried warning 1 predicted, and the files won every time.**
`156-PATTERNS.md` places `merge_custom_data` at `504-admin-rpcs.sql:12` (it is at `:11`), the pgTAP
assertions at `:488-490, 495-496, 507-508, 526-527, 539, 544` (they are at `:474-568` pre-rename), the
adapter `rpc()` call at `supabaseAdminWriter.ts:26` (it is at `:25`) and `supabaseDataWriter.ts:388`
(it is at `:372`); the plan's own `read_first` cites `503-entity-rpcs.sql:141-189` (the function runs
`:134-181`) and `10-schema-migrations.test.sql:480-580` (the section is `:470-570`). **Every edit was
located by exact source text or symbol name; no line number was used as a seek target.** The cited
*content* was correct in every case.

## Issues Encountered

**The generated types were contaminated by the pgTAP suite.** Described in full above. Caught by
reading the regeneration diff rather than by any gate — nothing in `lint:check` or `typecheck` would
have objected to six extra typed functions. Reverted, reset, regenerated, and the hazard written into
STATE.md so the next plan does not repeat it.

**A near-miss the verification discipline caught.** The pgTAP suite went green on the first run of the
widened function. Accepting that would have been insufficient: a green suite proves each branch writes
*something*, not that a single call writes *only one table*. The two-direction snapshot probe was run
afterwards specifically to rule out a double write, and the `prosecdef` lookup afterwards to rule out
the security setting having been changed by the restructure. Both confirmed.

**E2E was not run — deliberately, per the plan.** Task 3's action states it: plan 10 owns the phase
gate, and a full-suite run against an intermediate state costs disk headroom this checkout cannot spare
(a standing ENOSPC hazard). This is not a skipped gate claimed as passing — the user-visible paths are
filed as deliverable **D10** with `human_judgment: true` for end-of-phase harvest, and that is the
plan's own stated human check.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for 156-09.** Suite green at `Files=11 / Tests=317 / Result: PASS` with 0 `not ok`;
  `yarn build`, `yarn typecheck`, `yarn lint:check`, `yarn test:unit` and
  `yarn assert:schema-migration-parity` all exit 0; the golden parity signature is unmoved at 4 hunks /
  11 signature lines.
- **New floor for the next plan:** the sum of `plan(N)` literals is **309** and the harness prints
  **317**. Assert the conjunction — `Result: PASS` **and** non-zero `Files=` **and** `Tests= >= 317`
  **and** zero `not ok` — never `Tests=` alone (WINDOWS 184 + 186).
- **New standing hazard:** `yarn db:types` must be preceded by `yarn db:reset-with-data`, or six pgTAP
  fixture functions land in the shipped types. Recorded in STATE.md.
- **Contract C3 is now concrete for Phase 157.** `merge_question_custom_data(uuid, jsonb)` exists,
  granted to `authenticated`, `SECURITY INVOKER`, parameter list unchanged; `upsert_answers(uuid, jsonb,
  boolean)` is source-compatible and now covers organizations. **157's and 161's PLAN files still grep
  for the old literal — WINDOWS 188.**
- **Carried forward, unresolved:** `yarn db:lint:sql` remains red on four pre-existing PL/pgSQL
  advisories (WINDOWS 17 / 115 / 125). Needs an operator decision.
- **Carried forward for the phase gate:** D10 — an admin editing question custom data and a candidate
  saving answers, end to end — is unproven by any assertion here and is queued for the end-of-phase
  human check and plan 10's E2E run.
- **New for the phase gate:** merge precedence and shallowness have no durable assertion (WINDOWS 187).

## Self-Check: PASSED

- Files claimed modified: all 8 present on disk (`[ -f ]` for each).
- Commits claimed: `8a76380eb`, `1509b3dee`, `4c3bbb683` all present in `git log --oneline --all`.
- Acceptance criteria: all 25 re-run at final HEAD and tabulated above. One Task-2 criterion is
  FALSIFIED as written, recorded with its measurement, its cause and its residual count rather than
  downgraded to a tick.
- Plan-level `<verification>` items 1-4 re-run and all pass; the human check (item 5, the running-app
  confirmation) is filed as D10 for end-of-phase harvest.
- `must_haves`: five of six met outright; the sixth (old name "nowhere in the repository") met in
  substance and falsified as literally stated, with the residual enumerated.

---
*Phase: 156-supabase-schema-corrections-naming-constraints-grants*
*Completed: 2026-08-30*
