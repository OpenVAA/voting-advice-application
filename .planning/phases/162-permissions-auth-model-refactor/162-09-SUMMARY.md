---
phase: 162-permissions-auth-model-refactor
plan: 09
subsystem: supabase-rls
status: complete
tags: [rls, authorization, user_can, criterion-2, account-tier, structure-tier, pgtap]
requires:
  - "162-01 (162-SPEC.md)"
  - "162-02b (single-migration regeneration)"
  - "162-04 (user_can, entity_project_id, grant_role_permissions)"
  - "162-05 (shim equivalence: can_access_project == user_can('project', X, 'project.edit_project_settings'))"
  - "162-06 (grants claim, legacy claim retired)"
  - "162-07 / 162-07b (open_for_voters, confirmed, nomination_shape)"
  - "162-08 (project_open_for_voters, the join-table anon delegation, pgTAP ordinal 16)"
provides:
  - "public.election_project_id(uuid) -> uuid"
  - "public.constituency_group_project_id(uuid) -> uuid"
  - "public.user_has_account_grant(uuid) -> boolean"
  - "25 converted RLS predicates across accounts, projects, elections, constituency_groups, constituencies and the two join tables"
  - "ROADMAP criterion 2, finished and asserted in both of its sentences"
  - "apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql (87 assertions)"
affects:
  - "162-10 (inherits Q3=A, the structure read/write predicate shapes and the hop-helper precedent)"
  - "162-11 (inherits Q3=A on its own structure tables)"
  - "162-12 (inherits the hop-helper precedent for nominations)"
  - "162-16 (removes the ten published columns; three authenticated predicates stopped reading them here)"
  - "162-17 (C-11 collapse allow-list LOSES `accounts`; fixture consolidation; rls-policy-map.md sweep)"
tech-stack:
  added: []
  patterns:
    - "row-state questions stay in the POLICY as a disjunct; the matrix stays inside user_can (162-04 Q3)"
    - "join-table READS delegate to the parent's own policy; join-table WRITES take a SECURITY DEFINER hop"
    - "grant-existence predicates are a named, enumerated exception to the user_can routing rule"
key-files:
  created:
    - apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/01-tenant-isolation.test.sql
    - apps/supabase/supabase/tests/database/04-admin-crud.test.sql
    - packages/supabase-types/src/database.ts
decisions:
  - "Q1 (S-3 + operator NOTE): accounts SELECT gates on GRANT EXISTENCE via user_has_account_grant, not a permission literal; enum NOT widened (23/23/23); the criterion-2 exemption for `accounts` is WITHDRAWN"
  - "Q2 (P-1) = A: admin_update_accounts widens, admin_delete_projects narrows; each asserted in both directions"
  - "Q3 (V-5) = A: the three structure SELECTs keep a public disjunct, re-expressed against project_open_for_voters — 162-10 and 162-11 INHERIT this"
  - "Q4 (P-2) = join tables approved: reads delegate to the parent, writes take a hop helper"
  - "THIRD population change, sanctioned by the operator 2026-09-17: a project admin now reads the row of the account its project belongs to"
metrics:
  duration: "~6.5h wall, one operator checkpoint"
  completed: 2026-09-17
actuals:
  tokens: 29482
  tasks: 6
  commits: 6
  plan_head_before: 23bf1916d977a13dc5cdd6d98411b0dfbb09eb9e
---

# Phase 162 Plan 09: The account, project and structure tiers on `user_can` Summary

Twenty-five RLS predicates across seven tables now answer *who may do what to which object* by asking one
predicate one question, ROADMAP criterion 2 is finished and asserted in both of its sentences, and the
operator's S-3 amendment turned the one table the plan meant to exempt into the table that proves the rule.

## Policy population (derived at run time, not transcribed)

| Part | Count |
|---|---|
| Policies on the seven tables | **31** |
| `TO anon … FOR SELECT` (162-08's) | 5 |
| Already converted (162-04's `authenticated_select_projects`) | 1 |
| **This plan's, converted** | **25** |

31 = 5 + 1 + 25, each part counted independently by the database. Matches M1 exactly.

## Structural scans — table-scoped, each printed beside the file-wide residual

| Token | Seven tables (before → after) | File-wide after | Survivors |
|---|---|---|---|
| `can_access_project` | 18 → **0** | 36 | NONE |
| `has_role` | 5 → **0** | 2 | NONE |
| `is_candidate_self` | 0 → **0** | 0 | NONE |
| `published` | 3 → **0** | 7 | NONE |
| `USING (true)` | 2 → **0** | 5 | NONE |

The file-wide residual of 36 is what proves the scans are scoped rather than vacuous: those sites belong
to 162-10, 162-11 and 162-12, and a file-wide absence gate would be unsatisfiable against a sibling's
correct code. Assertion 85 fails if that residual ever reaches zero.

**A measured correction to M2, kept rather than smoothed.** M2's inherited figures (`can_access_project`
22, `has_role` 8) are *occurrence* counts read from the file; every gate in this plan counts *policies* in
`pg_policies`, where an UPDATE policy carrying the token in both `qual` and `with_check` counts once. The
measured inherited state is **18 and 5**. Both numbers are correct measurements of different things; the
plan's arithmetic is not wrong, its units differ from its instrument's.

## Routing completeness

**26** non-anon policies on the seven tables, **23** routing through `user_can`, and the difference is
**3 named exceptions** — asserted as an exact string equality of the sorted list, not as a count:

- `accounts.authenticated_select_accounts` — asks about grant existence, which `user_can` cannot express
- `constituency_group_constituencies.authenticated_select_constituency_group_constituencies` — delegates to the parent
- `election_constituency_groups.authenticated_select_election_constituency_groups` — delegates to the parent

**This is three where the plan predicted two.** The third is a direct consequence of the operator's S-3
amendment and is named in the assertion rather than absorbed into a loosened count.

## Checkpoint answers

- **Q1 = account mapping approved, AS AMENDED by the operator's S-3 NOTE.** Ruling verbatim:
  *"account read = any role on account or its projects"*.
  - `accounts` **SELECT** → `user_has_account_grant(id)`: global-scope admin, **or** a grant whose target
    is this account, **or** a grant whose target is a project belonging to this account.
  - `accounts` **UPDATE** → `user_can('account', id, 'account.edit_settings')`, per § 3.3.
  - The enum is **not** widened — S-3(A) stands, no 24th member. `yarn lint:check`'s enum guard reports
    `grant_permission: 23 / 23 / 23`.
  - **The criterion-2 exemption for `accounts` is WITHDRAWN.** Read and write name different things, so
    the assertion does **not** exempt it — `accounts` is asserted under the rule like every other table.
  - **162-17 inherits this:** `accounts` is **no longer** a known-legitimate member of C-11's collapse
    allow-list. If 162-17 still finds it there it must be justified afresh or removed.
- **Q2 (P-1) = A.** Both population changes taken as the matrix states them.
- **Q3 (V-5) = A.** The three structure SELECTs keep a public disjunct, re-expressed against 162-08's
  `project_open_for_voters`. **162-10 and 162-11 inherit this answer and must not re-derive it.**
- **Q4 (P-2) = join tables approved.** Residual, stated: these tables are read only as PostgREST embedded
  resources, so a denial returns an **empty array rather than an error** — observable as missing
  constituency groups and observable nowhere else. The E2E suite is the instrument that sees it.

## Control runs — five, every one reddened

| Control | Reddened | What it proves |
|---|---|---|
| Write-verb substitution (every converted write answers the read permission) | **22** | the permissive failure a green run never reports |
| Deny-everything | **34** | the allow half is not vacuous |
| Public disjunct dropped from all three structure SELECTs | **12** | all five anon-parity biconditionals measure |
| Account asks moved to global scope (tenancy dropped) | **3** | the account tier's tenancy is load-bearing |
| Pre-change predicates restored on the three changed account/project policies | **12** | the widening, the narrowing and the third change are each caught |

The write-verb run reddens `not ok 16` — criterion 2's structural assertion — which is the collapse
deliberately reintroduced, observed to fail, and then removed again.

## pgTAP

- New file: `apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql`
  (ordinal **17**, derived as the lowest free two-digit prefix at or above 12).
- Declared plan: **87**. Estate: **705 → 792**, `Result: PASS`, exit 0.
- Exactly **one** description string in the pre-existing estate moved — the sanctioned one — out of a
  **784-line** baseline. No declared `plan()` count moved anywhere, including `04-admin-crud` (still 30).

## Anon parity — five biconditionals, all equal, all floored above zero

| Table | anon sees | grant-less authenticated sees |
|---|---|---|
| `elections` | 2 | 2 |
| `constituency_groups` | 2 | 2 |
| `constituencies` | 6 | 6 |
| `constituency_group_constituencies` | 6 | 6 |
| `election_constituency_groups` | 2 | 2 |

Asserted in the file as the sorted multiset of ids compared as a string — set-equality in both directions
with equal cardinality in one assertion — carried across the role switch in a transaction-local GUC,
with a length floor so two empties cannot agree. All five redden when the public disjunct is dropped.

## Criterion 2 — finished

**Structurally,** read from `pg_policies` on the applied database:
`authenticated_select_projects` names `project.read_structure` and **not** `project.edit_project_settings`;
`admin_update_projects` names `project.edit_project_settings` and **not** `project.read_structure`; the two
quals are unequal. **Behaviourally:** `candidate_a` reads the project's elections and cannot edit them, and
a project-scope editor reads the project row and cannot update it — the two callers of each pair differing
in exactly one permission literal.

The rule generalises across `elections`, `constituency_groups` and `constituencies`, asserted as a rule
(the SELECT names the read verb; all three writes name the structure-edit verb and not the read one).
**`accounts` is asserted under the rule too, not exempted from it.**

## Cost — measured and recorded, not gated

| Measurement | Figure | Plan |
|---|---|---|
| `user_can`, 1000 calls | 20.188 ms → **0.0202 ms/call** | — |
| `project_open_for_voters`, 1000 calls | 4.194 ms → **0.0042 ms/call** | — |
| `elections` whole-table read, 500 rows, with grant | 7.692 ms | **Seq Scan** |
| `constituency_groups`, 500 rows, with grant | 6.456 ms | **Seq Scan** |
| `constituencies`, 500 rows, with grant | 6.632 ms | **Seq Scan** |
| `elections`, 500 rows, **no** grant | 4.129 ms | **Seq Scan** |

**The disjunction short-circuits.** With a grant, `EXPLAIN ANALYZE` reports the public term
`never executed`; without one, both run — and the no-grant read is *cheaper*, because `user_can` is the
plpgsql claim loop and the helper is a primary-key probe. No index was added: the prohibition is
deliberate and these plans are the input a later indexing decision needs. `yarn db:lint:sql` exits 0 with
two **pre-existing** warnings (FKs without indexes on `election_constituency_groups.constituency_group_id`
and `constituency_group_constituencies.constituency_id`) — the FK/index topology is declared in schema
files this plan never touched, and one of those columns is now read by the delegation predicate, which is
the reason to record them here rather than silently satisfy them.

## E2E

**155 passed / 0 failed / 0 did-not-run**, 10.8m, `playwright exit 0`, `preflight failures 0, successes 1`.
Run directory: `tests/e2e-runs/162-09-policies`. Disk headroom measured at **69 GiB** before the run.

## Gate chain

`yarn typecheck` 0 · `yarn lint:check` 0 · `yarn test:unit` 0 (2423 tests) · `test:db` 0 (792) ·
`yarn db:lint:sql` 0 · full E2E 0. Every `SECURITY DEFINER` function in `public` pins its `search_path`
(**20** examined, **0** unpinned). One migration file; parity gate green; policy total unchanged at **99**.

## Deviations from Plan

### 1. [Operator decision] The third population change, and the one sanctioned assertion rewrite

**Found during:** Task 5. **Issue:** the S-3 NOTE's second clause — *"or its projects"* — means a **project
admin** now reads the row of the account its project belongs to. `admin_a` holds `(project, project_a,
admin)`; `project_a.account_id = account_a`. That made `04-admin-crud.test.sql`'s assertion 30,
`project_admin cannot SELECT accounts (no access policy)`, false: measured `have: 1, want: 0`.

This is a **third** population change, beyond P-1's two, arising necessarily from the ruling's own words
and shown to no one at ratification time. **The executor halted rather than flip the expectation**, and the
operator sanctioned it on **2026-09-17**, lifting the no-rewrite prohibition for that assertion **and that
assertion alone**.

**Fix:** the assertion was **inverted**, not flipped — `project_admin SELECTs exactly its own account
(grant on a project of that account)`, asserting `count(*) = 1` **and** that the single visible row is
`account_a`, which is strictly stronger than the old negative: a bare count of 1 would pass if the
cross-account boundary broke and it saw one of two for the wrong reason. The paired negative
(`a project admin of project A CANNOT see account B`) lives in file 17.

**Disclosure, for the record:** an `accounts` row is `id, name, created_at, updated_at`, so what widens is
the account's **name**, to a caller who already administers one of that account's projects.

**Files:** `04-admin-crud.test.sql`, `302-rls.sql`, `301-auth-functions.sql`. **Commit:** `3d38fd42f`.

### 2. [Rule 2] The routing-completeness figure moves from two exceptions to three

Truth 2 and Task 5's gate expect `total − 2`. The amendment makes the `accounts` read a grant-existence
predicate, so it is a third exception. It is **named** in the assertion (an exact sorted-string equality),
not counted — so the gate is not loosened, it is restated. **Commit:** `3d38fd42f`.

### 3. [Rule 1] Six defective verify gates in the plan text, repaired in place

The expectation was quantified as D-34; this plan found **six**.

1. **`wc -l` policy census.** `pg_get_expr` renders `EXISTS` quals **multi-line**, so the census file has
   43 lines for 31 policies. Compounded fatally by `MINE=$((TOTAL − ANON − DONE9))`, which makes the
   "three parts sum to the whole" check a **tautology that cannot fail**. Left alone, the plan would have
   recorded a population of 43 and a remainder of 37 and proceeded. Repaired: newlines collapsed in the
   record, and every part counted independently by the database.
2. **The description-string extractor** `'[^']{8,}'\s*\)\s*;` captured **0 strings in 10 of 18 files** —
   including `01-tenant-isolation` and `04-admin-crud`, the two files the plan promises to edit without
   moving a description. Across the estate it caught 28 strings for ~700 assertions. The "byte-identical
   descriptions" gate, cited in Tasks 3, 4 **and** 5, was an empty instrument on exactly the files it
   exists to protect. Repaired to a lone-line matcher, which captures 26 and 30 — each file's declared
   plan count exactly — with a 600-line non-vacuity floor on the baseline.
3. **`git grep -c "$1" -- $2`.** zsh does not word-split unquoted expansions, so `-- "apps packages tests"`
   was one bogus pathspec. Repaired to pass pathspecs as separate arguments.
4. **The caller sweep** searched `from('<table>')`; the frontend spells it `scopedFrom('<table>')`, so
   every frontend call site was invisible and only `packages/dev-seed`'s service-role calls were counted.
   Re-swept under both spellings. (M6's conclusion survives: **0** direct call sites on either join table
   under either spelling, **2** real embedded reads in `supabaseDataProvider.ts` plus one in a type doc.)
5. **The scope-of-diff gate** `grep '^[-+]' … CREATE POLICY … | wc -l` `-le 5` never fires for body-only
   edits — the `CREATE POLICY` line is unchanged context — and `-le` passes at 0. Replaced with a
   block-level predicate diff against the base SHA: **5** changed after Task 3, **19** after Task 4,
   **25** after Task 5, with 80 policies parsed at base and head throughout.
6. **The helper-hardening gate** greps `grep -qx '…|t|search_path='`. `prosecdef` renders as `true` under
   `||` concatenation and `proconfig` renders `search_path=""`. **That gate could never match correct
   code.** Repaired to a boolean check and a `search_path=%` prefix.

### 4. [Rule 1] Three measurements that corrected an expectation rather than the code

- **`admin_b` does see project A's join rows.** The file first asserted it sees none. The delegation
  correctly inherits **both** of the parent's terms, and project A is open for voters, so its groups — and
  their join rows — are readable by every authenticated caller. The code was right; the assertion now
  states what the delegation actually claims, with the cross-tenant half carried by a grant-less caller
  against project B.
- **`super_admin` sees three accounts, not two.** `apps/supabase/supabase/seed.sql` creates an account of
  its own. The assertion was scoped to the two the fixture owns rather than the expectation bent.
- **`'eeeeeeee-eeee-eeee-eeee-0000000000p1'` is not a uuid** — `p` is not a hex digit. Caught as
  `22P02 invalid input syntax`, not as a silent pass.

### 5. [Rule 3] Comment hygiene (D-A4)

`yarn lint:check` named **29** forced line breaks across the two edited pgTAP files. Comments joined into
single lines; the 784-line description baseline re-verified afterwards. **Commit:** `7d69b4f16`.

### 6. Acceptance-criteria figure kept, repair confined

Task 4's acceptance text predicts the remaining `can_access_project` count after the structure tier "is
exactly the account tier's remaining six". Measured: **1** (`projects.admin_delete_projects`) — the other
five account-tier policies carried `has_role`, not the legacy project predicate. The gate (`-le 2`) passes;
the figure is reported as measured.

## The open window this plan did not close

**`WINDOWS.md` row 267 is untouched and still `open`.** 162-07b removed the organization disjunct from
`authenticated_select_candidates`, so an organization-role user cannot see an unconfirmed candidate of its
own organization; **162-10 owns closing it** through the nomination hierarchy. Proved untouched the way
162-08 did: the normalised predicate of `authenticated_select_candidates` md5s to `5b2adcf8b4e7a8bcbb5195c6e0bfc37c`
at both the base SHA and HEAD. `anon_select_candidates` likewise (`99172e23c5765f9d688f0e2c8ad9a1b2`).

All ten prior helpers are byte-identical to the base SHA: `user_can`, `is_child_nominee`,
`entity_project_id`, `grant_role_permissions`, `project_open_for_voters`, `entity_has_confirmed_nomination`,
`nomination_entities_confirmed`, `has_role`, `can_access_project`, `custom_access_token_hook`,
`is_candidate_self`. Three functions were added and none modified.

## Known Stubs

None. No stub, no skipped test, no `<verify>` left unrun.

## Handoffs

- **162-17 — `accounts` leaves the C-11 collapse allow-list.** The account-read enum gap is **closed by
  predicate, not by enum member**: read names grant existence, write names `account.edit_settings`. If
  162-17 still finds `accounts` on the allow-list it is a finding against this implementation, not an
  exemption to grant.
- **162-17 — the project-editor fixture identity.** Created inside file 17's own transaction because
  162-06 pins `create_test_data()` at exactly eight grant rows. 162-10, 162-11 and 162-13 will each need
  it; consolidating it into `00-helpers.test.sql` is a four-way edit worth doing once, in 162-17.
- **162-17 — `.claude/skills/database/rls-policy-map.md` is stale.** Deliberately not swept here, for the
  reason 162-08's SUMMARY gives: 162-10 through 162-16 each rewrite more of the same inventory and
  sweeping it eight times is churn. A phase-level obligation.
- **162-10 and 162-11 — inherit Q3 = A.** The public disjunct stays on structure reads, re-expressed
  against `project_open_for_voters`. Do not re-derive it and do not drop it.
- **162-10 — the other half of ROADMAP criterion 5.** This plan delivers *an unpublished project's
  non-entities are readable by any grantee*; *its entities by the grantees themselves and their parents*
  is 162-10's. **Criterion 5 is not satisfied yet.**
- **162-16 — three authenticated predicates stopped reading `published`.** Seven policies file-wide still
  do; the ten columns are 162-16's to remove.
- **Indexing, unresolved by design.** All three structure reads are Seq Scans with a per-row SubPlan.
  Two of the FKs `db:lint:sql` flags without indexes are now read by the join-table delegation. Recorded
  as the measured input a later decision needs; no index added from a predicate's shape.

## Self-Check: PASSED

All seven files verified present on disk; all four commits verified in `git log`.
