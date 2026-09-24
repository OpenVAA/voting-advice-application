---
phase: 156-supabase-schema-corrections-naming-constraints-grants
plan: 07
subsystem: database
tags: [postgres, supabase, pgtap, column-grants, privileges, postgrest, rls, audit-fields]

requires:
  - phase: 156-06
    provides: the green pgTAP baseline (Files=11, Tests=302, Result PASS) and the unmoved schema/migration parity signature this plan built on
  - phase: 156-01
    provides: the candidates GRANT list already reduced by `name`, which is why the pre-change count is 13 and not the pre-phase 14
provides:
  - "authenticated holds UPDATE on exactly 10 columns of public.candidates and 8 of public.organizations — sort_order, created_at and updated_at revoked on BOTH tables"
  - "Six observed SQLSTATE 42501 denials — three columns x two tables — each proven to raise from aclcheck_error (the column-privilege path), not from an RLS WITH CHECK that shares the same SQLSTATE"
  - "A trigger-still-fires control: a permitted self-edit succeeds and set_updated_at advances updated_at although the caller holds no privilege on that column"
  - "Two information_schema.column_privileges count assertions that catch a column silently left granted AND a column accidentally revoked"
  - "10 new pgTAP assertions: planned suite total 294 -> 304; harness total 302 -> 312"
affects: [156-10, 162-permissions-refactor, 157-adapter-boundary]

actuals:
  tokens: 36840
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Prove a privilege denial by its ERROR LOCATION, not just its SQLSTATE: 42501 is shared by the ACL path (aclcheck_error) and the RLS WITH CHECK path, so the SQLSTATE alone cannot tell a real column-grant denial from a policy rejection"
    - "Flip-test a revoke: re-GRANT the removed columns inside a rolled-back transaction and show the same statements then succeed, which converts 'it failed' into 'it failed BECAUSE of this change'"
    - "Assert a narrowed privilege set by COUNT from information_schema.column_privileges, with the arithmetic spelled out in the assertion description so a future reader reconciles rather than guesses"
    - "When now() is frozen for the transaction, backdate the row as postgres before the permitted update — otherwise the trigger's write is indistinguishable from the fixture's insert value and the control proves nothing"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/schema/303-column-grants.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql

key-decisions:
  - "The trigger control needed TWO assertions (lives_ok + ok), not one, so plan(15) went to plan(23) after Task 2 and plan(25) after Task 3 — not the plan's nominal plan(22). The plan explicitly permits this with the count recorded."
  - "Backdated updated_at to 'epoch' as postgres before the control update. now() is fixed for the whole transaction and the fixture inserts updated_at at that same now(), so without the backdate the trigger's write would be byte-identical to the pre-existing value and the assertion would pass for no reason at all."
  - "Did not contort the backdate's syntax to keep a whole-file grep at 6. Writing code to satisfy a metric rather than for clarity is the defect, not the count."
  - "Proved the six denials by their ERROR LOCATION (aclcheck_error) rather than accepting SQLSTATE 42501 at face value, because an RLS WITH CHECK rejection raises the same SQLSTATE and would have made a half-broken revoke look proven."

patterns-established:
  - "A revoke is proven in two directions: the denial fires (six throws_ok) and nothing adjacent moved (two catalogue counts). Neither check alone is sufficient."
  - "A safety claim carried in a plan ('the trigger survives the revoke') is discharged by an assertion in the same file, never by restating the plan's confidence"

requirements-completed: [REVIEW-DB-05]

coverage:
  - id: D1
    description: "An authenticated principal cannot write sort_order, created_at or updated_at on public.candidates — three tamper attempts, each observed to fail with SQLSTATE 42501"
    requirement: REVIEW-DB-05
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#Candidate cannot update sort_order on own record"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#Candidate cannot update created_at on own record"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#Candidate cannot update updated_at on own record"
        status: pass
      - kind: other
        ref: "psql \\set VERBOSITY verbose savepoint probe — all three report `42501: permission denied for table candidates` at LOCATION aclcheck_error, aclchk.c:3650 (the ACL path, not the RLS WITH CHECK path)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The same three columns are equally closed on public.organizations — the criterion names columns but not tables, and a half-fixed surface would make the proof meaningless"
    requirement: REVIEW-DB-05
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#Organization admin cannot update sort_order on own organization"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#Organization admin cannot update created_at on own organization"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#Organization admin cannot update updated_at on own organization"
        status: pass
      - kind: other
        ref: "psql savepoint probe — all three report `42501: permission denied for table organizations` at LOCATION aclcheck_error"
        status: pass
    human_judgment: false
  - id: D3
    description: "The six denials are caused by this revoke and not by anything pre-existing — re-granting the three columns in a rolled-back transaction makes all six statements succeed"
    requirement: REVIEW-DB-05
    verification:
      - kind: other
        ref: "psql flip-test: GRANT UPDATE (sort_order, created_at, updated_at) on both tables inside BEGIN/ROLLBACK -> the six previously-denied statements each return `UPDATE 1`"
        status: pass
    human_judgment: false
  - id: D4
    description: "An authenticated UPDATE naming only permitted columns still succeeds, and set_updated_at still advances updated_at even though the caller has no privilege on it"
    requirement: REVIEW-DB-05
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#Candidate can still update a permitted column while holding no privilege on updated_at"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#The set_updated_at trigger advanced updated_at although the caller cannot name that column"
        status: pass
      - kind: other
        ref: "psql probe: as authenticated, `UPDATE candidates SET short_name = ...` returns UPDATE 1 and updated_at moves from 'epoch' to 2026-08-30 09:05:45.213352+00"
        status: pass
    human_judgment: false
  - id: D5
    description: "After the revoke, authenticated retains UPDATE on exactly the remaining columns of each table — ten on candidates, eight on organizations — proven by enumeration, not by assuming the revoke hit only what was named"
    requirement: REVIEW-DB-05
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#authenticated holds UPDATE on exactly 10 columns of candidates"
        status: pass
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql#authenticated holds UPDATE on exactly 8 columns of organizations"
        status: pass
      - kind: other
        ref: "psql string_agg over information_schema.column_privileges — the two surviving sets enumerated in full and matched against the GRANT lists"
        status: pass
    human_judgment: false
  - id: D6
    description: "The hand-maintained `-- Allowed columns` comment above each GRANT lists exactly the same column set as the GRANT it documents — set equality, order-independent, on both tables and in both SQL copies"
    requirement: REVIEW-DB-05
    verification:
      - kind: other
        ref: "bash: extract comment list and GRANT list, strip whitespace, sort, diff — empty for all four (2 tables x 2 copies)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Both SQL copies agree after the edit — the schema/migration parity signature is unmoved"
    verification:
      - kind: other
        ref: "yarn assert:schema-migration-parity — exit 0, 24 schema files -> 3317 lines, 00001 -> 3309 lines, 4 hunks / 11 signature lines, matches the golden fixture"
        status: pass
    human_judgment: false
  - id: D8
    description: "A candidate can still save their own profile from the candidate app after the grant narrowing"
    verification: []
    human_judgment: true
    rationale: "The pgTAP control proves the database mechanism — a permitted-column update succeeds and the trigger fires — but not the user-visible save flow through PostgREST and the frontend writer. The plan's own `<verification>` files this as the end-of-phase human check; plan 10's E2E suite is the corroboration."

duration: 8 min
completed: 2026-08-30
status: complete
---

# Phase 156 Plan 07: Column Grants — Audit and Ordering Columns Summary

**`authenticated` UPDATE narrowed from 13 to 10 columns on `candidates` and 11 to 8 on `organizations`, with six tamper attempts observed to fail at `aclcheck_error` (not merely at SQLSTATE 42501), flip-tested against a restored grant, and the surviving privilege set enumerated from the catalogue — 10 new pgTAP assertions, suite 302 -> 312, `Result: PASS`.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-08-30T09:01:08Z
- **Completed:** 2026-08-30T09:08:44Z
- **Tasks:** 3
- **Files modified:** 3

## pgTAP: the Files / Tests / Result triple, before and after

Asserted as the conjunction WINDOWS 184 + 186 require — `Result: PASS` **and** a non-zero `Files=` **and** `Tests=` at or above the expected floor. `Tests=` alone is the PLANNED count and reads identically on pass and fail, so it is never asserted on its own. A separate `grep -cE "^not ok|# Looks like"` over the run returns **0**, which is the independent failure check.

| Point | Files | Tests | Result | `not ok` count |
|---|---|---|---|---|
| Baseline at 156-06 HEAD (`b63d9d517`) | 11 | 302 | PASS | — |
| After Task 2 (+8) | 11 | 310 | PASS | 0 |
| After Task 3 (+2), final | 11 | **312** | **PASS** | **0** |

**Floor computation, from the `plan(N)` literals actually changed:** `09-column-restrictions.test.sql` 15 -> 23 -> **25**. The sum of `plan(N)` literals across `apps/supabase/supabase/tests/database/*.test.sql` moved **294 -> 304** (verified by `grep -h 'SELECT plan(' … | awk`). `00-helpers.test.sql` runs under `no_plan()` and contributes a further 8, so the harness line reads 8 higher: **312**.

Per-file `plan(N)` at final HEAD: `01` 26, `02` 15, `03` 59, `04` 30, `05` 14, `06` 15, `07` 9, `08` 32, **`09` 25**, `10` 79 — sum **304**.

## The two sorted column lists, proving each comment mirror matches its GRANT

Extracted mechanically from each file (comment list and GRANT list separately, whitespace stripped, sorted, `diff`ed). **The diff is empty for all four combinations** — two tables x two SQL copies.

**`public.candidates` — 10 columns:**

```
answers, color, custom_data, first_name, image, info, last_name, short_name, subtype, terms_of_use_accepted
```

**`public.organizations` — 8 columns:**

```
answers, color, custom_data, image, info, name, short_name, subtype
```

`name` stays on organizations and is absent from candidates, exactly as plan 01 left it — confirmed region-scoped (`grep -cE '(^|[( ])name,'` returns `1` in the organizations window and `0` in the candidates window).

## The observed per-table counts, reconciled

Read live from `information_schema.column_privileges` for grantee `authenticated`, privilege type `UPDATE`, schema `public`.

| Table | Pre-phase (RESEARCH) | At plan-07 start (measured) | After this plan (measured) | Arithmetic |
|---|---:|---:|---:|---|
| `public.candidates` | 14 | **13** | **10** | 14 less `name` (plan 01) less `sort_order`, `created_at`, `updated_at` |
| `public.organizations` | 11 | **11** | **8** | 11 less `sort_order`, `created_at`, `updated_at` |
| **Total** | **25** | **24** | **18** | |

The 13 at start (not 14) is the only divergence from the plan's stated baseline, and it is not a discrepancy: plan 01 of this same phase already removed `name` from the candidates grant, which the plan's own Task 1 text anticipates. Both figures were measured directly against the running database, before and after.

**The surviving sets enumerated in full**, not merely counted, so the count assertions are anchored to a known membership:

```
candidates:    answers, color, custom_data, first_name, image, info, last_name, short_name, subtype, terms_of_use_accepted
organizations: answers, color, custom_data, image, info, name, short_name, subtype
```

These are byte-identical to the GRANT lists and to the comment mirrors above.

## The six denials, observed rather than inferred

Each of the six was run by hand in a savepoint-isolated `psql` session with `\set VERBOSITY verbose` **before** trusting the pgTAP result, because SQLSTATE 42501 alone is not sufficient evidence.

```
psql:/tmp/probe2.sql:9:  ERROR:  42501: permission denied for table candidates
LOCATION:  aclcheck_error, aclchk.c:3650
psql:/tmp/probe2.sql:10: ERROR:  42501: permission denied for table candidates
LOCATION:  aclcheck_error, aclchk.c:3650
psql:/tmp/probe2.sql:11: ERROR:  42501: permission denied for table candidates
LOCATION:  aclcheck_error, aclchk.c:3650
psql:/tmp/probe2.sql:13: ERROR:  42501: permission denied for table organizations
LOCATION:  aclcheck_error, aclchk.c:3650
psql:/tmp/probe2.sql:14: ERROR:  42501: permission denied for table organizations
LOCATION:  aclcheck_error, aclchk.c:3650
psql:/tmp/probe2.sql:15: ERROR:  42501: permission denied for table organizations
LOCATION:  aclcheck_error, aclchk.c:3650
```

**Why the LOCATION matters and the SQLSTATE alone does not.** PostgreSQL raises `42501` from two distinct places: `aclcheck_error` (a table/column privilege denial — the thing this criterion is about) and the row-level-security WITH CHECK path (`new row violates row-level security policy`). Had the RLS policy been what rejected these statements, six `throws_ok('42501')` assertions would have gone green against a grant that was never actually narrowed. All six report `aclcheck_error`, so the denial is a privilege denial.

**Flip-test — the denial is caused by THIS change.** Inside a `BEGIN … ROLLBACK`, the three columns were re-granted on both tables and the same six statements re-run:

```
GRANT
GRANT
UPDATE 1
UPDATE 1
UPDATE 1
UPDATE 1
UPDATE 1
UPDATE 1
```

Six successes with the grant, six `aclcheck_error` denials without it. That is the difference the revoke makes, measured rather than assumed.

## The trigger control, and why it needed a backdate

The reviewer's objection — *revoking `updated_at` will break candidate self-edit* — is answered by assertion, not by restating the plan's confidence:

```
UPDATE 1                                    <- authenticated updates short_name (a permitted column)
 updated_at_after_permitted_update
 2026-08-30 09:05:45.213352+00              <- moved from 'epoch', written by set_updated_at
```

**The backdate is load-bearing and is why this is two assertions rather than one.** `update_updated_at()` assigns `NEW.updated_at = now()`, and `now()` is the **transaction** timestamp, fixed for the whole pgTAP file. The fixture inserts its rows in that same transaction, so their `updated_at` already equals what the trigger would write. Without first backdating the row as `postgres`, a `>` comparison would have compared a value to itself — the assertion would have failed, and a `>=` would have passed regardless of whether the trigger fired at all. Backdating to `'epoch'` makes the trigger's write the only thing that can produce the observed value.

## Task Commits

1. **Task 1: narrow both GRANT lists and correct both comment mirrors** — `fe52726d1` (feat)
2. **Task 2: six 42501 denials plus the trigger-still-fires control** — `b1d23e94b` (test)
3. **Task 3: catalogue assertions on the surviving privilege set** — `b86fe9c0c` (test)

## Gate results

| Gate | Result |
|---|---|
| `cd apps/supabase && npx supabase test db` | **Files=11, Tests=312, Result: PASS**, `not ok` count 0 |
| `yarn assert:schema-migration-parity` | **exit 0** — 24 schema files -> 3317 lines, `00001` -> 3309 lines, 4 hunks / 11 signature lines, golden fixture unmoved |
| `yarn lint:check` (twelve-link chain) | **exit 0** — 22/22 turbo tasks, svelte-check 0 errors 0 warnings, all seven assert-guards clean |
| `yarn assert:comment-hygiene` | **0 violations** (1584 files, 2 of 2 rules live) |
| `yarn test:unit` | **exit 0** — 25/25 tasks, 1826 tests passed across 174 test files |
| `yarn db:reset-with-data` | green, 752 rows seeded |
| `yarn db:lint:sql` | **exit 1 — PRE-EXISTING**, see below |
| `yarn test:e2e` | **not run — deliberately.** See "E2E was not run" below |

## `yarn db:lint:sql` exits 1 — a plan claim falsified, not downgraded

**This FALSIFIES the plan's Task 3 acceptance criterion "`yarn db:lint:sql` … exit 0" and its `<verification>` item 5, as written.** The criterion was unsatisfiable before this plan started and is stated plainly rather than softened into a tick.

Exit code captured directly (`yarn db:lint:sql > /tmp/dblint.txt 2>&1; echo $?` -> `1`). The advisory set, extracted verbatim:

| Function | Message | Level |
|---|---|---|
| `public.is_localized_string` | `never read variable "p_key"` | warning extra |
| `public._bulk_upsert_record` | `unused variable "rel_key"` | warning |
| `public.resolve_email_variables` | `unused parameter "p_template_body"` | warning extra |
| `public.resolve_email_variables` | `unused parameter "p_template_subject"` | warning extra |

Four findings across three functions — **the same four, in the same order, that plan 06 recorded**, byte-identical to their state at `225edaed3`. `fail-on` is set to `warning`, hence the non-zero exit.

**Zero new advisories from this plan.** Rather than read the exit code (which cannot distinguish new from pre-existing), the advisory set was diffed against plan 06's recorded set — identical — and `grep -cE 'candidates|organizations|column|grant|303'` over the full advisor output returns **0**. Nothing this plan touched appears anywhere in the output. This is also structurally expected: `supabase db lint` inspects PL/pgSQL function bodies, and this plan changed no function.

Already open on the ledger three times — **WINDOWS 17** (phase 151, `deviation`), **WINDOWS 115** (phase 152, `unrun-verify`), **WINDOWS 125** (phase 152, `unmet-truth`). **Not filed a fourth time**, per the carried instruction. It needs an operator decision, not another plan quietly noting it.

## Acceptance criteria, measured

**Task 1 — all pass**

| Criterion | Measured |
|---|---|
| candidates window in `303-column-grants.sql`: `sort_order\|created_at\|updated_at` count | **0** |
| organizations window, same file | **0** |
| Both windows in `00001_initial_schema.sql` | **0**, **0** |
| candidates window column count | **10** |
| organizations window column count | **8** |
| Comment mirror = GRANT list (sorted diff) | **empty**, all four combinations |
| `name` region-scoped: organizations / candidates | **1** / **0** |
| `yarn assert:schema-migration-parity` | **exit 0** |

**Task 2 — five pass, two falsified as written (both stated below, neither softened)**

| Criterion | Expected | Measured | Verdict |
|---|---|---|---|
| `grep -c "'42501'"` | 21 | **15** | **FALSIFIED — see below** |
| `grep -cE "SET (sort_order\|created_at\|updated_at) ="` | 6 | **7** whole-file / **6** scoped to `$$UPDATE` payloads | **FALSIFIED — see below** |
| `grep -c 'UPDATE candidates SET sort_order'` | 1 | **1** | pass |
| `grep -c 'UPDATE organizations SET sort_order'` | 1 | **1** | pass |
| `SELECT plan(N);` | 22 or recorded | **`plan(23)`** at end of Task 2 | pass (recorded, as the criterion permits) |
| `grep -c '013-auth-rls.sql'` | 0 | **0** | pass |
| `grep -c '303-column-grants.sql'` | >= 1 | **1** | pass |
| header lines 1-12 `sort_order` | 2 | **2** | pass |
| `db:reset-with-data && supabase test db` | exit 0 | **PASS**, 0 failures | pass |

**Falsification 1 — the `'42501'` count is 15, not 21.** The criterion's own parenthetical explains the error: *"the 15 pre-existing plus the six added"*. There were **9** pre-existing `'42501'` occurrences in this file, not 15 — five in Section 1 and four in Section 3. The figure 15 is the file's `plan(15)` literal, which the criterion conflated with the SQLSTATE count; the file's other six pre-change assertions are `lives_ok`, which carry no SQLSTATE. **9 + 6 = 15**, and the substantive claim (six denial assertions added) is correct and independently confirmed by the `SET`-column grep, by the six named test descriptions, and by the +8 movement in the harness `Tests=` line. The criterion's arithmetic was wrong; the criterion's intent was met.

**Falsification 2 — the `SET <col> =` count is 7 whole-file, not 6.** Six are the denial payloads; the seventh is `UPDATE candidates SET updated_at = 'epoch'::timestamptz`, run as `postgres`, which is the backdate the plan's own Task 2 action requires ("assert in the same breath that … `updated_at` is greater than it was before"). Scoped to the `format($$UPDATE …$$)` denial payloads the count is exactly **6**:

```
grep -E '\$\$UPDATE' 09-column-restrictions.test.sql | grep -cE "SET (sort_order|created_at|updated_at) ="   ->  6
```

The backdate could have been written in an obscure equivalent syntax (`SET (updated_at) = ROW(...)`) that dodges the grep. It was not: contorting code to satisfy a metric rather than for clarity is the defect, not the count.

**Task 3 — five pass, one falsified (the `db:lint:sql` item, above)**

| Criterion | Expected | Measured | Verdict |
|---|---|---|---|
| `grep -c 'column_privileges'` | 2 | **2** | pass |
| Descriptions name `10` and `8` literally | yes | **2** matches of `exactly (10\|8) columns` | pass |
| `supabase test db` across 11 files, zero failures | exit 0 | **Files=11, PASS, 0 `not ok`** | pass |
| Sum of `plan(N)` = 294 + this plan's additions | 304 | **304** | pass |
| `yarn assert:schema-migration-parity` | exit 0 | **exit 0** | pass |
| `yarn lint:check` | exit 0 | **exit 0** | pass |
| `yarn test:unit` | exit 0 | **exit 0** | pass |
| `yarn db:lint:sql` | exit 0 | **exit 1** | **FALSIFIED — pre-existing, see above** |

## The plan's `must_haves`, discharged

| Truth | Status |
|---|---|
| Six tamper attempts, each observed to fail with SQLSTATE 42501 | **Met**, and strengthened: each proven to raise from `aclcheck_error` rather than from the RLS path that shares the SQLSTATE |
| Ten surviving columns on candidates, eight on organizations, none of the three on either | **Met** — asserted from the catalogue in the suite and enumerated by hand |
| A permitted UPDATE still succeeds and `set_updated_at` still advances `updated_at` | **Met** — `UPDATE 1` as authenticated, timestamp moved from `'epoch'` |
| Comment mirrors equal their GRANT lists, set equality, both tables | **Met** — empty diff on all four combinations (2 tables x 2 SQL copies) |
| Both tables narrowed, not one | **Met** — the six denials split 3/3 across the two tables, and both catalogue counts assert |

One `must_haves` field is itself inconsistent with the plan body and is recorded here rather than silently reconciled: the artifacts block asserts `09-column-restrictions.test.sql` *contains* `SELECT plan(21);`, while Task 2's action says `plan(22)` and Task 3 adds two more. The file ends at **`plan(25)`**. `21` appears to be the (also incorrect) `'42501'` count carried into the wrong field.

**Prohibitions, both discharged:**

- *MUST NOT leave `updated_at` or `created_at` in either grant list out of caution.* Neither was left. The caution is answered by measurement (the trigger control), not by keeping the columns.
- *MUST NOT narrow one table and call the criterion met.* Both narrowed in one commit; the proof is six assertions and two catalogue counts, covering each table symmetrically.

## Files Created/Modified

- `apps/supabase/supabase/schema/303-column-grants.sql` — both GRANT lists narrowed, both `-- Allowed columns` mirrors rewritten, the three removed columns promoted into both `-- Protected (admin-only) columns` blocks with a stated reason each (`sort_order` presentation order admin-controlled; the two timestamps audit fields, `updated_at` naming the `set_updated_at` trigger)
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — the twin of all four edits, at the corresponding positions, so the parity signature is unmoved
- `apps/supabase/supabase/tests/database/09-column-restrictions.test.sql` — six denials appended to Sections 1 and 3, new Section 6 (trigger control) and Section 7 (catalogue counts), header protected-column lists extended, stale `013-auth-rls.sql` cross-reference corrected to `303-column-grants.sql`, `plan(15)` -> `plan(25)`

## Decisions Made

1. **The trigger control is two assertions, not one, and `plan()` reflects that.** A single `lives_ok` proves the update did not raise but says nothing about the timestamp — which is the half of the claim the reviewer actually doubted. `lives_ok` + `ok` gives `plan(23)` after Task 2 and `plan(25)` after Task 3.
2. **Backdate before the control update.** Explained above; without it the assertion is vacuous.
3. **Denials verified by ERROR LOCATION, not SQLSTATE alone.** `42501` is shared by the ACL path and the RLS WITH CHECK path. Six green `throws_ok` assertions against a grant that was never narrowed would have looked identical.
4. **Flip-tested the revoke.** Re-granting inside a rolled-back transaction is what turns "the statement failed" into "the statement failed because of this change".
5. **The six org denials went into Section 3 and the candidate denials into Section 1**, reusing each section's existing `set_test_user` stanza as the plan directs, with the new material introduced by a one-line sub-banner. The genuinely new material — the control and the catalogue counts — got its own numbered section banner each.

## Deviations from Plan

None requiring a code fix. No deviation rule 1-4 was triggered: no bug, no missing critical functionality, no blocker, no architectural question. The three departures from the plan text are all recorded above under "Acceptance criteria, measured" and are documentation defects in the plan, not changes to the work:

1. The `'42501'` count criterion (21) is arithmetically wrong; the correct value is 15.
2. The `SET <col> =` count criterion (6) does not account for the backdate the plan's own action text requires; whole-file it is 7, denial-scoped it is 6.
3. `yarn db:lint:sql` exits 1 for four pre-existing PL/pgSQL advisories, so that criterion is unsatisfiable and was before this plan began.

**`packages/dev-seed/src/template/permittedKeys.ts` needed NO edit — checked, not assumed** (carried warning 2). The file does list `sort_order`, `created_at` and `updated_at` for every entity table, but it enumerates columns that EXIST for the dev-seed, which writes as `service_role` and bypasses column grants entirely. This plan drops and renames no column; it only revokes a privilege. Independently confirmed by `yarn lint:check` exit 0, whose chain runs `typecheck` across all 22 workspaces.

**Line maps were stale again, as carried warning 1 predicted.** `156-PATTERNS.md` cites `303-column-grants.sql:31-36` / `:52-56` for the two GRANT blocks and `00001:1829-1834` / `:1850-1854` for their twins; the actual positions are `:20-25` / `:36-40` in the schema copy and `:1816-1821` / `:1832-1836` in the migration. The PATTERNS quote of the file also still shows the pre-Phase-152 multi-line comment layout and the pre-plan-01 `name` in the candidates list. **Every edit in this plan was located by exact source text, never by seeking to a line number, and in every case the file won.** The cited *content* was substantively correct once the stale `name` is accounted for.

## Issues Encountered

**`yarn db:lint:sql` exits 1.** Recorded in full above, with the advisory table and the evidence that this plan adds nothing to it. Not filed to WINDOWS a fourth time.

**A near-miss the verification discipline caught.** The first pass at the six denials passed pgTAP immediately. Accepting that would have been a mistake: `throws_ok('42501')` cannot distinguish a column-privilege denial from an RLS WITH CHECK rejection, and this file's assertions run under RLS. The savepoint probe (`\set VERBOSITY verbose`) and the flip-test were run *after* the suite was already green, specifically to rule that out. Both confirmed the denials are genuine privilege denials.

**E2E was not run — deliberately, per the plan.** Task 3's action states it explicitly: plan 10 is the phase gate, criterion 6 has not landed, and a full-suite run against an intermediate state costs disk headroom this checkout cannot spare (the ENOSPC risk is a standing project hazard). This is not a skipped gate silently claimed as passing: the user-visible candidate-save flow is filed as deliverable **D8** with `human_judgment: true` for end-of-phase harvest, and it is the plan's own stated human check.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Ready for the next plan in phase 156.** Suite green at Files=11 / Tests=312 / `Result: PASS` with 0 `not ok`; `yarn lint:check`, `yarn test:unit` and `yarn assert:schema-migration-parity` all exit 0; the golden parity signature is unmoved at 4 hunks / 11 signature lines.
- **New floor for the next plan:** the sum of `plan(N)` literals is **304** and the harness prints **312**. Assert the conjunction — `Result: PASS` **and** non-zero `Files=` **and** `Tests= >= 312` **and** zero `not ok` — never `Tests=` alone (WINDOWS 184 + 186).
- **Contract C4 is now satisfied and concrete for Phase 162.** `303-column-grants.sql` grants `authenticated` UPDATE on exactly ten candidate columns and eight organization columns; 162's criterion 6 ("storage permission checks go through the same helpers as table access") is asserted against *this* set. The two catalogue count assertions will fail loudly if 162 widens it without intent.
- **Carried forward, unresolved:** `yarn db:lint:sql` remains red on four pre-existing PL/pgSQL advisories (WINDOWS 17 / 115 / 125). Needs an operator decision.
- **Carried forward for the phase gate:** D8 — a candidate saving their own profile end to end — is unproven by any assertion in this plan and is queued for the end-of-phase human check and plan 10's E2E run.

## Self-Check: PASSED

- Files claimed modified: all 3 present on disk (`[ -f ]` for each).
- Commits claimed: `fe52726d1`, `b1d23e94b`, `b86fe9c0c` all present in `git log --oneline --all`.
- Acceptance criteria: all re-run at final HEAD and tabulated above. Two Task-2 criteria and one Task-3 criterion are FALSIFIED as written, each recorded with its measurement and its cause rather than downgraded to a tick.
- Plan-level `<verification>` items 1-4 re-run and pass; item 5 splits — `assert:schema-migration-parity`, `lint:check` and `test:unit` exit 0, `db:lint:sql` exits 1 **pre-existing** with zero new advisories.

---
*Phase: 156-supabase-schema-corrections-naming-constraints-grants*
*Completed: 2026-08-30*
