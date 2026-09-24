---
phase: 162-permissions-auth-model-refactor
plan: 03
subsystem: database
tags: [schema, enums, rls, postgres, authorization, guard, declarative-schema]
status: complete

requires:
  - '162-01 (162-SPEC.md § 4, the second statement of the 23-member list; 162-IMPLEMENTATION-BRIEF.md §§ 3.1-3.3)'
  - '162-02b (yarn schema:regenerate, and a parity gate that fails on a second migration file)'
  - '162-CHECKPOINT-DECISIONS.md § 1 item S-2 (answered 2026-09-16: ratify the 23 as derived)'
provides:
  - 'public.grant_scope_type (4 members), public.grant_role_type (2), public.grant_permission (23) — the vocabulary waves 4 and 5 spell as string literals'
  - 'public.grants: seven columns, a UNIQUE NULLS NOT DISTINCT key, two named CHECKs, one reverse-lookup index, the auth-hook RLS quartet and the blanket REVOKE'
  - 'scripts/assert-grant-permission-enum.mjs — a standing three-channel guard, self-proving, last link of lint:check'
  - 'Enums.grant_permission / grant_role_type / grant_scope_type and the grants Row/Insert/Update triple in packages/supabase-types'
affects:
  - '162-04: user_can reads a row of this shape out of the JWT; its answer for a user with NO grants is undefined here and must be deny-by-default'
  - '162-05: the has_role / can_access_project shims'
  - '162-06: the data migration that populates grants, and the access-token hook that emits it'
  - '162-11, 162-12, 162-13: the policies that consume project.edit_project_settings / edit_app_settings, nomination.create_parent and entity.confirm'
  - '162-17: the pgTAP throws_ok assertions that will name this plan''s three constraints'
  - 'waves 4 and 5: 97 policies encode these 23 member names as literals'

tech-stack:
  added: []
  patterns:
    - 'three-channel enum guard: a committed canon, the schema source text, and the generated types derived from the applied database — the last two distinguish "the declaration is wrong" from "the declaration never reached PostgreSQL"'
    - 'UNIQUE NULLS NOT DISTINCT wherever a key column is NULL on most rows; the plain form is a guarantee that closes nothing'
    - 'total CHECK constraints over non-null booleans — `(a IS NOT NULL) = (b = ''x'')` — so there is no NULL-passes hole'
    - 'the schema-level GRANT USAGE repeated inside each auth-hook table block, so deleting one block cannot take the hook''s schema access with it'

key-files:
  created:
    - scripts/assert-grant-permission-enum.mjs
    - scripts/fixtures/grant-permission-enum/enums.ok.sql
    - scripts/fixtures/grant-permission-enum/enums.violations.sql
    - scripts/fixtures/grant-permission-enum/expected.violations
  modified:
    - apps/supabase/supabase/schema/000-enums.sql
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - package.json

decisions:
  - 'D-08 implemented: grant_permission carries exactly the 23 members of brief § 3.2, in § 3.3 matrix order, ratified by the operator on 2026-09-16'
  - 'D-02 implemented: grant_role_type has exactly two members; a one-line comment states why a third is not added, so a later reader must delete a reason rather than fill a gap'
  - 'D-05 / D-07 implemented: one entity scope with an entity_type discriminator, and two named CHECKs making all eight § 3.1 rows representable and nothing outside them'
  - 'D-14a honoured: every column, constraint and index of grants is declared inside the CREATE TABLE body; the ADD COLUMN count in 300-auth-tables.sql is unchanged at 10'
  - 'grant_scope_type is declared on ONE line, not one member per line: prettier-plugin-sql collapses a four-member enum at this name length and prettier --check is the gate'
  - 'the standing guard reads nothing under .planning/, because planning documents are filtered out of the PR branch a reviewer sees'

metrics:
  duration: ~95 min
  completed: 2026-09-16

actuals:
  tokens: 11990
  tasks: 6
  commits: 3
  plan_head_before: 61c06e6a7f483c9a1943aeeb6f49033d69480ae2

requirements-completed: [PRESHIP-02]
---

# Phase 162 Plan 03: Grant Enums and the grants Table — Summary

`public.grant_permission` now exists in the applied database with 23 members derived from
`162-IMPLEMENTATION-BRIEF.md` § 3.2 rather than transcribed from it, alongside `grant_scope_type`,
`grant_role_type` and the `public.grants` table whose `UNIQUE NULLS NOT DISTINCT` key is the
measured difference between a real constraint and one that admits duplicate grants on three of the
four scopes. A standing guard in `lint:check` keeps the membership equal to its canon for the
remaining sixteen plans of the phase.

## The guard's census line, verbatim

This is the number the enum was fixed at. A later reader who remembers "20 members" or "22
permissions" from a stale draft of the brief's § 5 should read this and then read § 3.2, which is
the authority:

```
Grant enum membership guard — census (canon / schema / generated):
  grant_scope_type: 4 / 4 / 4
  grant_role_type: 2 / 2 / 2
  grant_permission: 23 / 23 / 23
Grant enum membership guard — 0 finding(s); self-test: scripts/fixtures/grant-permission-enum/enums.ok.sql -> 0 finding(s), scripts/fixtures/grant-permission-enum/enums.violations.sql -> 7 finding(s) against 7 expected.
```

## The ratification recorded at Task 2

**Answer: `ratify`. Date: 2026-09-16. Source: `162-CHECKPOINT-DECISIONS.md` § 1, item S-2.**

Both boxes at S-2 were left unticked, which selects the ★ RECOMMENDED option (A) — the 23 as
derived, in § 3.3's matrix order. **No member was renamed**, so no amendment to the brief or the
SPEC was needed and Task 1's derivation was not re-run.

The 23 were read out of `${TMPDIR}/162-03/brief-members.txt` — the file Task 1 produced by machine
from § 3.2 — rather than retyped:

```
feedback.read, feedback.manage, account.edit_settings, account.manage_projects,
account.manage_admins, project.manage_editors, project.edit_project_settings,
project.edit_app_settings, project.edit_structure, project.edit_questions,
project.read_structure, project.edit_entities, project.edit_nominations,
project.read_entities, entity.edit_answers, entity.read_answers, entity.edit_immutable,
entity.invite_children, entity.confirm, nomination.edit, nomination.read,
nomination.confirm, nomination.create_parent
```

Three of these are not among the 20 atomic rights of `162-USER-RIGHTS.md`, and each has an
authority: `project.edit_project_settings` and `project.edit_app_settings` are D-09's split (brief
§ 11.1), `entity.confirm` is D-10 (§ 11.2), `nomination.create_parent` is D-12 (§ 11.5).

## The two inherited assumptions, measured

162-01 handed these forward flagged unverified with this plan named as owner. Both were measured on
this tree's PostgreSQL 15.8 rather than inherited as claims, and **neither survives unqualified**.

### Ordering — HOLDS IN EFFECT, NOT IN PRINCIPLE

> *"Enum declaration order is presentational, and no predicate anywhere may sort by or depend on an
> enum ordinal."*

**Verdict: the second clause is true of the tree as it stands and was verified; the first clause is
false as a statement about PostgreSQL and true only because of the second.**

What was measured:

| Probe | Result |
|---|---|
| `SELECT 'feedback.read'::grant_permission < 'entity.confirm'::grant_permission` | `t` |
| `SELECT 'admin'::grant_role_type < 'editor'::grant_role_type` | `t` |
| `<`, `>`, `<=`, `>=` or `BETWEEN` applied to any enum column across `apps/supabase/supabase/schema/*.sql` | **0 occurrences** |
| `ORDER BY` clauses in `schema/*.sql` | 4; three order by `sort_order`, one orders by an enum column |
| that one: `502-email-helpers.sql:73` | `ORDER BY CASE ur.role WHEN 'candidate' THEN 1 WHEN 'organization' THEN 2 END` — an **explicit map, not the ordinal** |
| consumers of the generated `Constants` enum arrays | **none in the tree** |

So ordinals are fully comparable — a predicate that sorted by one would silently follow declaration
order and nothing would fail — and the estate's single order-sensitive read of an enum column
deliberately routes around them with a CASE map. The assumption is therefore a **discipline the tree
currently keeps**, not a property of the type. Two live consequences a later plan must not misread:

1. **This plan's own gates depend on member order and are supposed to.** The four-channel comparison
   and the standing guard both assert order, precisely so the persisted ordinals keep following
   § 3.3's matrix. "Presentational" does not mean "unchecked".
2. **Statement order within `schema/` is not presentational at all in one respect** — a type must be
   declared before it is used. `000-enums.sql` sorts first among `schema/*.sql`, which is what lets
   `300-auth-tables.sql` reference two of the three new types; `yarn db:reset` exiting 0 is the test,
   and a type used before declaration fails the reset loudly.

**Handoff to 162-04 and later:** do not write a policy or predicate that compares two
`grant_permission` values with a relational operator or orders by one. Nothing stops you, and
nothing will fail.

### Idempotency — SPLIT: TRUE IN ONE SENSE, FALSE IN THE OTHER

> *"Re-granting a right that is already held is a no-op."*

**Verdict: true of the SQL `GRANT` statement, FALSE of a `public.grants` row.** The assumption
conflates two things and was measured separately.

**(a) Repeating a SQL `GRANT` — confirmed no-op.** `GRANT USAGE ON SCHEMA public TO
supabase_auth_admin` issued three times: `has_schema_privilege` reads `t` throughout and
`pg_namespace.nspacl` is byte-identical across repeats. This is the sense the plan relies on, and it
is what makes the deliberately duplicated `GRANT USAGE` inside the `grants` block safe — it is a
no-op today and the surviving statement after 162-15 deletes the `user_roles` block.

**(b) Re-inserting an identical `grants` row — NOT a no-op; it is an error.**

```
ERROR:  duplicate key value violates unique constraint "grants_user_scope_target_role_key"
DETAIL:  Key (user_id, scope, target_type, target_id, role)=(00000000-…-010, project, null, bbbbbbbb-…-002, admin) already exists.
```

Row-level idempotency is *available* but must be **asked for**: the same pair of inserts written
`ON CONFLICT DO NOTHING` leaves exactly 1 row and raises nothing.

**Handoff to 162-06 and `invite-candidate`:** a writer that assumes re-granting is silent will abort
on its second run. This is sharpened by D-20's ruling that the invite's swallowed insert failure
becomes a hard abort — with a hard abort in place, a re-run that re-grants an existing right fails
the whole operation unless the writer chose `ON CONFLICT DO NOTHING` deliberately. That choice is
162-06's to make and to state; it is not made here, because `grants` ships empty.

## Policy counts

| | count |
|---|---|
| baseline, after `yarn db:reset` at Task 1, before any edit | **97** |
| final, after `yarn db:reset` at Task 6 | **99** |
| **difference** | **+2** |

The two additions are exactly `auth_admin_read_grants` and `service_role_manage_grants`, both on
`public.grants`. No policy elsewhere in the estate moved.

## The guard's observed failure message

Task 5's mutation demonstration replaced `'nomination.create_parent'` with
`'nomination.create_parents'` in `000-enums.sql`. The guard exited 1 and printed, verbatim:

```
[ERROR] assert-grant-permission-enum: grant_permission: in the canon, absent from apps/supabase/supabase/schema/000-enums.sql: nomination.create_parent
[ERROR] assert-grant-permission-enum: grant_permission: in apps/supabase/supabase/schema/000-enums.sql, absent from the canon: nomination.create_parents
```

Both directions are printed as separate findings on purpose — a misspelling and a missing member
have identical cardinality, so a single "the sets differ" line would let them cancel out. The file
was restored and `cmp`-verified byte-identical, and the clean run re-confirmed green.

**162-04's executor will see these two lines if they mistype a permission.** The remedy is to fix
the SQL, not the canon — unless the canon is genuinely wrong, in which case the brief and the SPEC
are amended first.

## What was done

**Task 1 — derivation and baseline.** Two independent extractions, from
`162-IMPLEMENTATION-BRIEF.md` § 3.2 and `162-SPEC.md` § 4, produced 23 members each, equal to each
other in order and in both directions, and equal in order to the first column of § 3.3's 23-row
matrix: `brief: 23 spec: 23 matrix: 23`. The result is also byte-identical to the 23 printed under
"The canonical 23" in the plan, so the brief did not move between planning and execution. Baseline
after `yarn db:reset`: 97 policies, `to_regclass('public.grants')` empty, 0 rows in `pg_type` for
the three new names — a baseline that does not already contain what the plan adds. Base SHA
`61c06e6a7`. No tracked file modified.

**Task 2 — ratification, recorded not re-asked.** See above. No schema file was touched before the
decision was recorded; `git diff --numstat` against the base SHA for `000-enums.sql` was empty and
`pg_type` still held 0 rows for `grant_permission`.

**Task 3 — the three enums.** Appended after `role_scope_type`, with the five pre-existing
declarations byte-identical; the only deleted line in the file is the header inventory comment
(`deleted lines in 000-enums.sql: 1`, and no deleted line carries `CREATE TYPE` or a quoted
literal). Membership proved equal across four channels — brief, SPEC, `000-enums.sql`, generated
types — and the applied database's `pg_enum … ORDER BY enumsortorder` output `cmp`-matched the
derived file exactly. `yarn schema:regenerate`, `yarn db:reset` and `yarn db:types` in the same
commit; the `00001` diff is the three declarations and the header line, nothing else.

**Task 4 — the `grants` table.** Columns
`id:NO,user_id:NO,scope:NO,target_type:YES,target_id:YES,role:NO,created_at:NO`, five constraints
(PK, FK, the named UNIQUE with `NULLS NOT DISTINCT` in its `pg_get_constraintdef`, and the two named
CHECKs). Behaviourally: 4 legal shapes inserted in one rolled-back transaction, 5 illegal shapes
each rejected **by the constraint named for it** — a rejection for the wrong reason would have
failed the check — and the table left empty. RLS on; exactly two policies; `has_table_privilege`
triple `false,false,true` for authenticated / anon / `supabase_auth_admin`; exactly three indexes
and none on `user_id` alone. `yarn db:lint:sql`: **0 errors**, 2 pre-existing warnings, and `grants`
absent from the unindexed-FK list — the observable proof that the UNIQUE's leading column covers the
FK.

**Task 5 — the standing guard.** `scripts/assert-grant-permission-enum.mjs`, Node built-ins only,
wired as the last link of `lint:check`. Three channels, both directions, order reported as one fact.
Census printed before any verdict; a zero population or fewer than 20 permissions withholds the
verdict. The self-test runs unconditionally in the plain invocation and is also reachable as
`--self-test`; it reports 0 findings on `enums.ok.sql` and exactly the 7 committed lines of
`expected.violations` on `enums.violations.sql`. Every one of those 7 lines was read and confirmed
to describe a defect actually seeded, and the four seeded defects (`entity.confrim`,
`nomination.create_parent` deleted, `suggestion.review`, `owner`) are each named at least once.

**Task 6 — additivity and the gates.** Policy delta exactly +2; pgTAP estate unedited
(`git diff --numstat` for `apps/supabase/supabase/tests/` empty) and green — **12 files, 401
assertions, `Result: PASS`, zero `not ok`**; `yarn db:lint:sql`, `yarn typecheck`, `yarn test:unit`
and `yarn lint:check` all green, `lint:check` read directly rather than through a pipe; a second
`yarn db:types` over a reset database left no diff; exactly one `.sql` file under `migrations/` and
the parity gate green. **E2E: 155 passed, 0 failed, 0 did-not-run, playwright exit 0, preflight
failures 0 / successes 1**, run through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/162-03
--no-db-reset`. The files changed outside `.planning/` are exactly the nine declared.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — blocking] `grant_scope_type` is declared on one line, not one member per line**

- **Found during:** Task 3
- **Issue:** the plan's action text asks for the four scopes "one per line in the house multi-member
  form", and measured fact M3 asserted the proposed DDL was prettier-stable.
  `node_modules/.bin/prettier --check` disagreed for this one declaration and collapsed it to
  `CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');`. The
  collapsed form is 85 characters; `entity_type`'s collapsed form is 91 and stays expanded, so the
  print width falls between the two and the shorter type name is what tips it.
- **Fix:** accepted prettier's output. The acceptance criterion is that the declaration carries
  exactly the four quoted literals in that order and that `prettier --check` passes; both hold, and
  neither criterion constrains line layout. `grant_role_type` was already single-line by design and
  `grant_permission` stays one member per line.
- **Files modified:** `apps/supabase/supabase/schema/000-enums.sql`
- **Commit:** `e3987089e`

**2. [Rule 1 — bug, in this plan's own new guard] the generated-types parser was anchored on the
wrong `Enums` block**

- **Found during:** Task 5, on the guard's very first run
- **Issue:** `parseGeneratedEnum` located the generated block with
  `indexOf('\n    Enums: {')`. The first such occurrence in `packages/supabase-types/src/database.ts`
  is `graphql_public`'s empty one at line 22, roughly 1,300 lines ahead of the `public` schema's at
  line 1341. Every lookup on that channel returned zero members — against a tree whose generated
  types were correct.
- **Fix:** the lookup now hops through `\n  public: {` first. The defect was caught by the guard's
  own non-vacuity floor, on the first run, reported as
  `the parser found no members in packages/supabase-types/src/database.ts, so nothing was compared`
  with a printed census of `4 / 4 / 0`, `2 / 2 / 0`, `23 / 23 / 0` — which is exactly the failure
  mode the census and the floor exist for, and it is recorded in the function's docblock so a future
  edit cannot quietly reintroduce it.
- **Files modified:** `scripts/assert-grant-permission-enum.mjs`
- **Commit:** `d1eff178a`

### Harvested verify commands corrected (harness defects, not claim failures)

Two of the plan's `<verify>` blocks could not execute as written on this environment. In both cases
the **claim** was verified; the **extraction** was fixed. Recorded because later plans in this phase
will harvest the same commands.

**3. `psql` without `-q` returns the command tag, not the count.** Task 4's behavioural verify reads
the transaction's row count with `… -At -c "BEGIN; INSERT …; SELECT count(*) …; ROLLBACK;" | tail -1`.
With `-At` alone, psql still emits a status line per statement, so `tail -1` is the literal string
`ROLLBACK` and the `test "$N" = "4"` fails on a correct table. Adding `-q` makes the SELECT result
the only output. Re-run with `-q`: `legal shapes accepted: 4`, all five rejections naming their
constraint.

**4. `supabase test db` emits a `prove` summary, not raw TAP.** Task 6's pgTAP verify counts
`^ok ` / `^not ok` lines and requires more than 100 `ok`. The harness aggregates through `prove`, so
stdout carries per-file `... ok` lines and a summary, and the raw-TAP grep reads **0** against a
fully passing suite. Re-derived from the summary the harness does emit:
`Files=12, Tests=401`, `Result: PASS`, and **0** occurrences of `not ok` anywhere in the captured
output — a stronger statement of the same claim.

### A pre-existing ordering hazard, found and worked around

**5. Running `test:db` before `db:types` contaminates the generated types with pgTAP helpers.**
Task 6's action sequence runs the pgTAP estate and then asserts that `yarn db:types` produces no
diff. It produced one:

```
+      create_test_data: { Args: never; Returns: undefined };
+      reset_role: { Args: never; Returns: undefined };
+      set_test_user: { Args: { p_role: string; p_user_id?: string; p_user_roles?: Json }; Returns: undefined };
+      test_id: { Args: { entity_name: string }; Returns: string };
+      test_user_id: { Args: { user_name: string }; Returns: string };
+      test_user_roles: { Args: { user_name: string }; Returns: Json };
```

All six are defined **only** in `apps/supabase/supabase/tests/database/00-helpers.test.sql`, which
COMMITs them outside a transaction so they persist for the later test files; none appears in any
`schema/*.sql`. They are test-run residue, entirely unrelated to this plan's change. The
idempotency claim was re-measured the correct way — discard, `yarn db:reset`, `yarn db:types` — and
produced no diff.

**This is a trap for 162-17**, which widens the pgTAP estate: any plan that runs `test:db` and then
regenerates types will see this diff and may commit it. Reset between the two.

## Known Stubs

None. `public.grants` ships **empty** by design — it has no reader until 162-06 — and that emptiness
is a stated prohibition of this plan (D-19 needs no seed-time value for a table with no readers),
not an unwired stub. No seed row, dev-seed template, E2E fixture or pgTAP test was changed to
populate it, and `git diff --numstat` against the base SHA for `seed.sql`, `packages/dev-seed` and
`apps/supabase/supabase/tests` is empty.

## Threat Flags

None. Every security-relevant surface this plan introduces is already in the plan's
`<threat_model>`: the enum membership (T-162-03-01), `grants` through PostgREST (T-162-03-02),
duplicate rows surviving revocation (T-162-03-03), ill-formed rows reaching `user_can`
(T-162-03-04), the hook's schema access (T-162-03-05). No network endpoint, auth path or file access
pattern was added.

Two accepted findings are carried forward rather than closed, per the register: **T-162-03-06** — a
grant whose `target_type` claims an entity kind its `target_id` is not cannot be checked by any
database constraint, because `target_id` is polymorphic across six tables; the pairing is trusted to
the writer, and 162-06 and `invite-candidate` are where it is actually produced. **T-162-03-08** —
`grants` carries `created_at` but no `granted_by`, so there is no record of who issued a grant;
a candidate for 162-06 rather than something invented here.

## Open items handed to later plans

Restated from the plan's `<flagged_assumptions>` because nothing else carries them forward:

1. **No standing gate covers the `grants` constraints by name until 162-17.** Task 4 proved the two
   CHECKs and the key once, against the applied database. The Task 5 guard is scoped to the *enums*,
   as its name says. A plan in waves 2 to 5 that edited the `grants` block — dropping the
   `NULLS NOT DISTINCT`, renaming a constraint, loosening a CHECK — would not be caught by any gate.
   162-17's `throws_ok` assertions are the seam that closes it, and all three constraints are named
   in source so that test has a stable handle.
2. **`user_can`'s answer for a user with no grants is 162-04's to define, and must be
   deny-by-default.** This plan deliberately leaves the no-grant case representable and unambiguous
   — zero rows for a `user_id`, which is every `anon` request and every authenticated user before
   162-06's migration runs — and nothing in the two CHECKs makes it ambiguous. What that *means* is
   not decided here. `162-PATTERNS.md`'s "deny-by-default security predicate" is the shape.

A third, added by this execution: **the `test:db` → `db:types` contamination in deviation 5 above**,
which 162-17 will meet.

## Blast radius

`git diff --name-only <base> -- . ':!.planning'` names exactly the nine files in this plan's
`files_modified` and nothing else. **Nothing fell outside the declared set**, so there is no finding
for 162-04 to act on here.

## Self-Check: PASSED

All created files exist on disk:

- `scripts/assert-grant-permission-enum.mjs` — FOUND
- `scripts/fixtures/grant-permission-enum/enums.ok.sql` — FOUND
- `scripts/fixtures/grant-permission-enum/enums.violations.sql` — FOUND
- `scripts/fixtures/grant-permission-enum/expected.violations` — FOUND

All commits exist in `git log`:

- `e3987089e` feat(162-03): declare grant_scope_type, grant_role_type and grant_permission — FOUND
- `d41971f68` feat(162-03): declare the grants table with its key, CHECKs, index and auth-hook RLS — FOUND
- `d1eff178a` chore(162-03): add the standing three-channel grant enum guard and wire it into lint:check — FOUND
