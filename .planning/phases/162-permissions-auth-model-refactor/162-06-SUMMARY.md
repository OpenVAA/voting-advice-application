---
phase: 162-permissions-auth-model-refactor
plan: 06
subsystem: database
tags: [postgres, rls, jwt, pgtap, supabase, authorization, migration, edge-functions, e2e]

requires:
  - phase: 162-01
    provides: 162-SPEC.md, the phase's normative reference
  - phase: 162-02b
    provides: the folded 00001_initial_schema.sql, schema:regenerate and the byte-comparison parity guard
  - phase: 162-03
    provides: grant_scope_type / grant_role_type / grant_permission, public.grants and grants_user_scope_target_role_key (UNIQUE NULLS NOT DISTINCT)
  - phase: 162-04
    provides: user_can, grant_role_permissions, entity_project_id, is_child_nominee, test_grants_claim, the converted projects SELECT policy
  - phase: 162-05
    provides: has_role and can_access_project as shims over user_can, the two *_legacy_claim fallbacks behind an exclusive claim dispatch, the expiry biconditional, and test_grants_from_user_roles
provides:
  - "public.custom_access_token_hook rewritten to project public.grants into a `grants` JWT claim, emitting no retired key"
  - "public.backfill_grants_from_user_roles() RETURNS integer — D-07's mapping plus the auth_user_id rule, encoded once, arbitrated on grants_user_scope_target_role_key"
  - "DELETED: public.has_role_legacy_claim, public.can_access_project_legacy_claim and both dispatch branches, in the same commit as the hook change"
  - "seed.sql and set_test_user call the backfill, so a yarn db:reset stack and the whole pgTAP estate run on a table-to-claim path"
  - "set_test_retired_claim — the one place a retired-shaped token is constructed, for the assertions that it confers nothing"
  - "14-grants-migration.test.sql — 50 assertions: projection equality, mapping oracle, completeness in both directions, the constructed auth_user_id cases, idempotency, seed parity, the expiry tripwire"
  - "13-shim-parity.test.sql rewritten into its post-window form, 324 -> 105, with the retired-claim grid replacing the differential"
  - "roles.ts re-expressed over grant SHAPE PAIRS: readGrants, hasAnyGrant, GrantClaim, ADMIN_GRANTS, CANDIDATE_GRANTS"
  - "entityGrant.ts in both writing Edge Functions — the entity-type-parameterised grant write, with D-20's abort observable in yarn test:unit"
  - "send-email's bulk-send gate re-expressed as project.edit_entities on the TARGET project, closing 161-13's open residual"
affects: [162-07, 162-08, 162-09, 162-10, 162-11, 162-12, 162-13, 162-14, 162-15, 162-16, 162-17, brief 6.1]

actuals:
  tokens: 68965
  tasks: 6
  commits: 4
  plan_head_before: 535ffc838c60176563a0ac758fde8bfa956f4ccf

tech-stack:
  added: []
  patterns:
    - "Declarative-schema backfill: a function plus its call sites, never a numbered migration, because there is no deployed database to transform"
    - "Idempotence as a property of a NAMED conflict arbiter, with the insert count returned so the second run is an assertion rather than an inference"
    - "Expiry tripwire chained forward: the backfill exists if and only if the table it reads does, handing 162-15 a red test in its own commit"
    - "Retired-claim inertness asserted as an EQUALITY WITH THE NO-AUTHORITY VIEW of the same `sub`, never as a claim about zero rows"
    - "App-entry gates matched on a (scope, role) PAIR, so a shape the CHECK constraints admit and the matrix maps to nothing opens nothing by construction"
    - "Closed vocabularies declared once as a whitespace-separated string, with the union type derived from it, so the runtime check and the compile-time type cannot drift"

key-files:
  created:
    - apps/supabase/supabase/tests/database/14-grants-migration.test.sql
    - apps/supabase/supabase/functions/invite-candidate/entityGrant.ts
    - apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts
    - apps/supabase/supabase/functions/identity-callback/entityGrant.ts
    - apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts
  modified:
    - apps/supabase/supabase/schema/300-auth-tables.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/seed.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/04-admin-crud.test.sql
    - apps/supabase/supabase/tests/database/13-shim-parity.test.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts
    - apps/frontend/src/lib/auth/roles.ts
    - apps/frontend/src/lib/auth/passwordLogin.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
    - apps/frontend/src/routes/admin/login/+page.server.ts
    - apps/frontend/src/routes/candidate/login/+page.server.ts
    - apps/supabase/supabase/functions/invite-candidate/index.ts
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/send-email/index.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/utils/adminCredentials.ts

key-decisions:
  - "Q1 = retirement approved, 162-05's obligation discharged here (162-CHECKPOINT-DECISIONS.md § 2, O-2, option A)"
  - "Q2 = A — shape pairs: admin door {global, account, project} x admin; candidate door entity x editor (§ 3, A-9)"
  - "Q3 = A — the grant write is entity-type parameterised; entity creation stays candidate-only (§ 3, A-10)"
  - "D-25's bulk-send gate = project.edit_entities on the target project (§ 1, S-3 NOTE); closes 161-13's residual; no enum widened"
  - "create_test_data() does NOT call the backfill; set_test_user does, gated on a non-empty role array — the only design that leaves 12-user-can.test.sql untouched and green"

patterns-established:
  - "A fixture flip must be measured against every pre-existing file that writes the same table, with a MULTI-LINE-AWARE search: the formatter puts the table name on its own line, so a single-line grep for `INSERT INTO grants` finds nothing and reports a clean sweep"
  - "A verify that reports green on a query that errored is worse than one that fails: assert the measurement's SHAPE before reading its fields"

requirements-completed: [PRESHIP-02]

coverage:
  - id: D1
    description: "custom_access_token_hook emits a `grants` claim, no retired key, set-equal to test_grants_claim in both directions with equal cardinality, for an identity holding a grant and for one holding none"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/14-grants-migration.test.sql#sections 5-7 (assertions 13-21)"
        status: pass
    human_judgment: false
  - id: D2
    description: "162-05's obligation discharged: both *_legacy_claim functions and both dispatch branches deleted in the commit that changed the hook; the biconditional passes with both sides false"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/14-grants-migration.test.sql#sections 8-9 (assertions 22-28); 13-shim-parity.test.sql#section 21 (104-105)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The backfill's image equals 162-05's independently written oracle in both directions; completeness is two empty set differences plus a cardinality equality; a second call inserts zero"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/14-grants-migration.test.sql#sections 2-4, 12 (assertions 4-12, 32-34)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The auth_user_id case with no witness anywhere in the repository is constructed for candidates and organizations and asserted through user_can before and after, with two negative twins and nothing left behind"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/14-grants-migration.test.sql#section 13 (assertions 35-46)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A token of the retired claim shape confers nothing: identical to the no-authority view of the same sub on every catalogue-derived row-level-security table, and can_access_project false at both projects for all nine identities"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/13-shim-parity.test.sql#sections 18-19 (assertions 83-103)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Every production reader of the retired claim converted (4 -> 0); the two app-entry gates and the three Edge Function gates read grant shape pairs; the entity-scope admin shape opens neither door"
    requirement: PRESHIP-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/auth/passwordLogin.test.ts"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts#getBasicUserData"
        status: pass
    human_judgment: false
  - id: D7
    description: "D-20's abort observed rather than inferred: the entity-type-parameterised grant write throws on insert failure and on an undeclared type, and the invite rolls back and returns 500"
    requirement: PRESHIP-02
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/{invite-candidate,identity-callback}/entityGrant.test.ts"
        status: pass
    human_judgment: false
  - id: D8
    description: "Wave-2 boundary gate: typecheck, lint:check, test:unit, typecheck:tests, pgTAP, db:lint:sql and the full E2E suite green with zero failed and zero did-not-run"
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/162-06-wave2 --no-db-reset"
        status: pass
      - kind: integration
        ref: "yarn workspace @openvaa/supabase test:db"
        status: pass
    requirement: PRESHIP-02
    human_judgment: false

duration: ~1h10m
completed: 2026-09-16
status: complete
---

# Phase 162 Plan 06: Retire the `user_roles` claim Summary

**The access-token hook now projects `public.grants`, the transitional fallback that made the previous wave survivable was deleted in the same commit, and every one of the four production readers, three Edge Function gates, two app-entry gates, the seed, the pgTAP fixture and the E2E identity harness moved across with it — proven neutral by a 200-cell count vector that did not move by one row.**

## Performance

- **Duration:** ~1h10m
- **Tasks:** 6 of 6
- **Commits:** 4 (measured: `git rev-list --count 535ffc838..HEAD`)

## Task 2 — the ratified answers

Answered by the operator on 2026-09-16 in `162-CHECKPOINT-DECISIONS.md`. All three boxes were left unticked, selecting each item's ★ RECOMMENDED option. Not re-asked.

| Question | Answer |
|---|---|
| **Q1** — the retirement (§ 2, **O-2**) | **retirement approved, 162-05's obligation discharged here.** From the commit that lands the new hook, every issued token carries `grants` and no retired key, and both `*_legacy_claim` functions plus both dispatch branches are deleted in **that same commit**. Option (B) — emitting both keys — is A2(c), contradicts K1, and is not taken. |
| **Q2** — the two app-entry gates (§ 3, **A-9**) | **A.** Shape pairs. Admin door = `{global, account, project}` × `admin`; candidate door = `entity` × `editor`. Not (B), which is fail-open in one direction (an entity-scope admin grant would open the admin app for a principal the matrix gives nothing to) and wrong in the other (a project editor, holding seventeen permissions, would be routed to the *candidate* app). Not (C), a second copy of § 3.3 in the browser. |
| **Q3** — the entity-type generalisation's reach (§ 3, **A-10**) | **A.** The grant write IS entity-type parameterised — an extracted module taking `(entityType, entityId)`, with a hand-built fake asserting the written shape for each of the four types **and the throw on failure**. **Entity creation stays candidate-only.** |

**D-25's bulk-send disposition** (§ 1 item **S-3**, the NOTE): the `send-email` bulk-send gate becomes **`project.edit_entities` on the target project** — an existing member of the ratified 23, so **no enum is widened** and S-3(A) stands. **This closes the residual 161-13 left open for this phase** — *"`send-email` accepts any admin role without comparing `scope_id` to the project"* — because the new gate is project-targeted by construction where the old role check was not: the project-scope arms compare `g.target_id` to the `project_id` the request names.

### The obligation 162-06 inherited, quoted from `162-05-SUMMARY.md`

> **162-06 must delete `has_role_legacy_claim`, `can_access_project_legacy_claim` and both dispatch branches in the same commit as the hook change.**

Discharged in commit `6261a8bf6`. It was not the note that enforced it: assertion 324 of `13-shim-parity.test.sql` is a **biconditional** — the two functions exist **if and only if** the hook emits no `grants` key — and it now passes with both sides **false**, having passed with both sides true before. `pg_proc` holds **0** rows for either name, and neither shim's `prosrc` mentions either.

### The obligation 162-06 hands 162-15, in the same shape

> **`backfill_grants_from_user_roles` reads `public.user_roles`. 162-15 must delete the function, its call in `seed.sql` and its call in `set_test_user` in the same commit that drops the table.**

Enforced by assertion 50 of `14-grants-migration.test.sql`: *the function exists if and only if `to_regclass('public.user_roles')` is non-null.* Both sides are true today. Note that 162-15 inherits **three** call sites, not two: the fixture call moved from `create_test_data()` to `set_test_user` for the measured reason below.

## The measured figures

### The derived consumer census (Task 1, re-derived at Task 5)

| | Before | After |
|---|---|---|
| Production reads of the retired claim key | **4** | **0** |
| Transitive consumers converted | **3** | — |

The four, derived from the tree rather than transcribed:

- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:181`
- `apps/frontend/src/lib/auth/roles.ts:26`
- `apps/supabase/supabase/functions/invite-candidate/index.ts:84`
- `apps/supabase/supabase/functions/send-email/index.ts:117`

The count is right in the canonical documents and **the membership is not**: `requireAdminIdentity.ts` reads the *normalised* role rather than the claim, `routes/api/admin/jobs/adminJobsAuthorization.ts` **does not exist** as a production module, and the two the documents omit — `send-email` and `invite-candidate` — are both authorisation gates. `send-email` appears in no canonical document for this phase at all.

The three transitive consumers: `lib/auth/passwordLogin.ts`, `routes/admin/login/+page.server.ts`, `routes/candidate/login/+page.server.ts`.

### The `auth_user_id` backfill-only population

| Where | `auth_user_id`-bearing entity rows | Of those, with no role row |
|---|---|---|
| Reset database | 1 | **0** |
| pgTAP fixture | 5 | **0** |

**Zero in both**, exactly as M7 predicted. The branch B6(a) exists for has **no natural witness anywhere in this repository**, and would have shipped unexecuted. Task 4 constructs it for `candidates` and for `organizations` and asserts the *consequence* through `user_can` — false before the backfill, true after — not merely the row.

### The migration figures

| | Role rows | Grant rows |
|---|---|---|
| Seed-only reset (`yarn db:reset`, no fixture) | 2 | **2** — `project/-/admin` for the seeded admin, `entity/candidate/editor` for the seeded candidate |
| The eight shared-fixture identities | 8 | **8** |
| Whole transaction (seed + fixture) | 10 | **10** |

| | |
|---|---|
| Forward difference (role rows with no grant) | **0** |
| Reverse difference (grants accounted for by neither a role row nor the `auth_user_id` rule) | **0** |
| Second-run insert count | **0** |
| Row count across the re-run | unchanged |

Both differences and the cardinality are **three separate assertions**, so a missing row and a spurious one cannot cancel inside one count comparison.

### The negative-control ledger — this plan's rows (F4(a), collected by 162-17)

| Control | Reddened |
|---|---|
| Task 3, hook emitting BOTH claim keys (applied database only) | **1** pgTAP assertion |
| Task 3, role-only reader — Q2's option (B), the fail-open reading the operator rejected | **4** frontend assertions |
| Task 3, reader accepting any grant regardless of shape | **19** frontend assertions |
| **Task 3 named control (both-keys hook + shape-blind reader), total** | **20** |
| Task 4, planted `target_type` mistranslation in `14-grants-migration.test.sql` | **6** |
| Task 4, the same plant against `13-shim-parity.test.sql` | **0** — see below |

The six from the plant: assertions 4, 5, 6 (the oracle comparison in both directions and its cardinality), 10 (*every entity grant points at the entity class its role row named*), 34 (the completeness cardinality) and 48 (the seeded candidate's grant shape).

**`13-shim-parity.test.sql` reddens 0 under that plant, and that is recorded rather than smoothed over.** Its `has_role` oracle derives containment from `public.grants` by plain joins and never reads `target_type`, so a mistranslated discriminator moves both sides of that grid together. It is a real insensitivity in that instrument, and it is precisely why assertion 10 of the new file exists. **Restored-green confirmed:** the plant was applied to the applied database only and never entered the tree (`git status --porcelain -- apps/supabase/supabase/schema` empty), and the full estate passes at 602/602 afterwards.

The frontend deny half was run twice, at two strengths, because the first was the weaker one: a role-only reader is exactly what Q2 option (B) would have shipped, and it reddens **4** — the two shapes the pair exists to separate, plus their two unit-level twins. A reader that accepts any grant at all reddens **19**.

### The neutrality vector

| | |
|---|---|
| Cells compared (10 callers × 20 tables, `public.projects` excluded by name) | **200** |
| **Cells that differed** | **0** |
| Callers | 8 fixture identities + an authenticated caller with no authority claim + `anon` |
| Tables | 21 catalogue-derived (20 `public` row-level-security tables + `storage.objects`), derived not listed |
| `public.projects` totals | baseline **0**, after **10** |
| `public.projects` under the two no-authority callers, after | **0** |

`public.projects` is 162-04's declared exception and it moved **only in the permitted direction**: identities holding a grant that reaches a project now read it (1 each, 3 for the global admin), and identities holding none still read nothing. The baseline was zero for all ten because the legacy path could not answer that converted policy at all.

**What this instrument cannot see, stated plainly:** it is a COUNT vector, so one row swapped for another of equal cardinality would pass. That weakness is real and it is not patched by inventing a second content-level instrument — 162-05's in-transaction, per-identity, per-table *digest* differential is the finer-grained half, it is committed, and it is cited rather than repeated. The argument is the composition: mapping complete (both differences empty) + projection exact (set-equal to `test_grants_claim` both ways) + 162-05's content differential ⇒ no identity's view moved.

### `13-shim-parity.test.sql` — the disposition of all six 162-05 assertion classes

**Declared plan: 324 → 105.**

| 162-05 class | Sections | Count | Disposition |
|---|---|---|---|
| `can_access_project` vs `can_access_project_legacy_claim`, nine identities × two projects | 1 | 18 | **RETIRED.** The function it compares against is gone. Preserving that body as a test-only oracle was considered and rejected: a legacy authority predicate sitting in `public` on any database that has run the estate is a second authority model with no expiry date. What it proved on the untouched estate remains 162-05's committed evidence and is cited. |
| the `has_role` revocation and deviation grid against its independent oracle | 10–14 | 45 + 1 + 2 + 2 + 1 | **KEPT.** The oracle derives from `public.grants` by plain joins and calls neither shim, so it needed no legacy function. Where 162-05 read the moved body's own answer, it now reads `oracle_legacy` — the reconstruction that plan asserted equal to the body in **both directions** before deleting it. **One assertion ADDED** to keep the class from collapsing into a consequence of section 10: the widening set's cardinality is now pinned independently to the **7 cells of 45** the operator ratified in A-5, and it measures **7**, cell for cell. |
| the dispatch-exclusivity assertions | 6, 16 | 3 | **REPLACED** by the retired-claim grid. There is no dispatch left to be exclusive about; the property that matters now is that the retired shape adds nothing. |
| `md5(prosrc)` byte-identity of the two moved bodies | 8, 17 | 3 | **RETIRED**, subsumed by the biconditional, which asserts the functions do not exist at all. The instrument was turned to the pair that still matters at this boundary: the hook's digest must DIFFER from its base-SHA value (`a90786774c…` → `e8fda3da66…`) and `is_candidate_self`'s must not have moved (`bddc28708a…`, unchanged). |
| the fallback-expiry biconditional | 21 | 2 | **KEPT VERBATIM.** Both sides now false. It is the assertion that would have gone red had the hook changed and the deletion not. |
| the row-set differential across identities × tables | 18–20 | 197 | **REPLACED** by the retired-claim grid (3 assertions over a 189-cell equality plus a non-vacuity floor) and by the eighteen `can_access_project` denials under a retired-shape token. Its content-level half is 162-05's committed evidence. |

Classes untouched by the deletion and kept as-is: section 2 (grid non-vacuity, re-read over the surviving column), section 4 (the eight absolute answers), section 5 (the claimless token, 2 of its 4 kept), section 7 (probe-permission discrimination, 3 of 4 kept), section 9 (the shim's shape), section 15 (the untranslatable shape raises), section 17's five signature assertions.

**No assertion was deleted without a named replacement or a recorded retirement reason.**

### The derived set of pgTAP files inserting grant rows, and what was done with each

Derived at run time with a **multi-line-aware** search (see Deviations — the plan's single-line grep finds none of them):

| File | Rows | Disposition |
|---|---|---|
| `00-helpers.test.sql` | the `test_grants_from_user_roles` body | **LEFT.** It is 162-05's oracle — the comparison term, not a fixture row. |
| `04-admin-crud.test.sql` | 1 | **REMOVED.** 162-04 wrote that row by hand; the fixture now produces it from the same identity's role row, and re-inserting it violates `grants_user_scope_target_role_key`. The assertion keeps its meaning: the claim still arrives, through the production projection rather than beside it. |
| `12-user-can.test.sql` | 13 | **LEFT, and the plan's design changed to make that possible.** See Deviations. |
| `13-shim-parity.test.sql` | 1 | **LEFT.** The synthetic project-editor identity, a shape no `user_role_type` member can produce. |

### Assertion totals

| | |
|---|---|
| `14-grants-migration.test.sql` declared plan | **50** |
| `13-shim-parity.test.sql` declared plan | **105** (was 324) |
| Estate | **602** assertions across **15** files (was 770 across 14) |
| Pre-existing pgTAP files edited | **2** — `00-helpers.test.sql` and `04-admin-crud.test.sql`. Every one of the other twelve is byte-identical and green, and each carries the declared plan recorded at Task 1. |

The estate total went **down**, and the reason is the disposition table above: 197 + 18 + 3 assertions whose second authority model this commit-chain deleted were replaced by 21 that ask the post-switch question.

### Cost

| | µs/call |
|---|---|
| The base-SHA hook body (recreated under another name, timed in the same transaction) | 6.633 / 6.067 / 6.099 |
| `custom_access_token_hook` after the rewrite | 7.460 / 7.203 / 7.197 |
| **Ratio** | **1.12 / 1.19 / 1.18** — budget **3.0**, well within |

Beside the two ratios already on record: `user_can` itself cost **2.12 / 2.00 / 1.91 / 1.98** (162-04) and the `can_access_project` shim **2.73 / 2.67 / 2.70 / 2.69** (162-05). The hook is the cheapest of the three moves because it swaps one indexed single-user aggregate for another; it runs on every token issue, so that is the figure that would have been a login-latency regression for every user.

### The wave-2 boundary gate

| Gate | Result |
|---|---|
| `yarn typecheck` | **0** |
| `yarn lint:check` | **0** (includes `typecheck:tests` and `assert:schema-migration-parity`) |
| `yarn test:unit` | **0** — 25 tasks |
| `yarn typecheck:tests` | **0** |
| `yarn workspace @openvaa/supabase test:db` | **0** — 15 files, **602** tests, PASS |
| `yarn db:lint:sql` | **0** — 0 errors, 2 pre-existing warnings |
| `SECURITY DEFINER` functions with an unpinned `search_path` | **NONE**, over **14** examined |
| **Full E2E suite** | **155 passed / 0 failed / 0 did-not-run**, 10.6m |
| E2E run directory | `tests/e2e-runs/162-06-wave2` |
| Preflight | 0 failures, 1 success — the run is confirmed, not merely exited-zero |

`results.json`: `expected: 155, unexpected: 0, flaky: 0, skipped: 0`.

The E2E run is the only place in this plan where the claim switch is exercised by a real browser against a real token issued by the real hook: every identity the suite mints is created with a grant row, authenticates through the rewritten hook, receives a `grants` claim, and is admitted or refused by the re-expressed gates and by 96 policies still reading through the shims. Stored Playwright session state was removed before the run, because a token minted before this commit carries the retired claim and its denials look exactly like flakes.

## Accomplishments

- **One vocabulary reaches the database and one reaches the applications.** The hook emits `grants` and no retired key; `pg_proc` holds neither `*_legacy_claim` function; neither shim's body mentions either; both shims keep their recorded argument strings, including `has_role`'s two `DEFAULT NULL` parameters, and `has_role` still has exactly one overload.
- **The claim each identity receives is provably the projection of that identity's grant rows** — asserted set-equal to `test_grants_claim` in both directions with equal cardinality, for an identity holding a grant and for one holding none, against the helper 162-04 installed for exactly this comparison rather than against a description of it.
- **The migration is complete in both directions and re-runnable.** Two empty set differences, a separate cardinality equality, and a second call that inserts zero — which works only because D-24 made the key `UNIQUE NULLS NOT DISTINCT`.
- **The class of identity this repository contains no example of is exercised anyway**, for both entity types, asserted through `user_can` in the before and the after direction, with two negative twins and no rows left behind.
- **The retired claim is proven to confer nothing**, by equality with the view of the **same `sub`** carrying an explicitly empty grants array — not by an assertion about zero rows, which would have been false on the tables that admit published rows to any authenticated caller and would then have been "fixed" by excluding them.
- **Not one policy was edited.** `302-rls.sql` and `400-storage.sql` are byte-identical to the base SHA and `pg_policies` holds **99** rows before and after.
- **D-20's swallowed failure is an abort, and the abort is observed** in `yarn test:unit` against a hand-built fake, not inferred from source text.
- **One migration file**, regenerated in the same commit as each `schema/` edit (D-14, D-17); types regenerated and naming the backfill and neither retired function (D-18).

## Deviations from Plan

Seven. Two are design changes forced by measurement; five are broken verify instruments replaced with stronger ones, in the pattern every plan in this phase has had to apply.

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `create_test_data()` cannot call the backfill — it would error `12-user-can.test.sql`, a file this plan must not edit**

- **Found during:** Task 3, before the first schema edit.
- **Issue:** the plan's design is *"`create_test_data()` calls the backfill"* plus *"`set_test_user` builds its claim through `test_grants_claim`"*. Measured against the tree, that errors a pre-existing file. `12-user-can.test.sql` calls `create_test_data()` and then builds its **own** thirteen-row grant fixture, and **five of those rows are byte-identical** to rows the backfill produces from the shared fixture's role rows (`super_admin` global/admin, `account_admin_a` account/admin, `admin_a` project/admin, `candidate_a` entity/candidate/editor, `organization_a` entity/organization/editor). Its plain `INSERT` carries no `ON CONFLICT`, so it violates `grants_user_scope_target_role_key` and the file aborts. Three more of its rows would have gained a **second** grant from the backfill — `admin_b` (its ProjectEditor), `candidate_a2` (its FactionEditor) and `candidate_b` (its AllianceEditor) — silently redefining the three identities those rows were chosen to represent. The plan's own prohibition says a twelfth file needing an edit *"is a finding about the fixture flip and it is reported rather than absorbed by editing the file."*
- **Fix:** the call site moved rather than the file. `create_test_data()` does **not** call the backfill; `set_test_user` calls it, **gated on a non-empty role array**. Every `set_test_user` call in `12-user-can.test.sql` passes `'[]'::jsonb` — deliberately, because its authority comes from `public.grants` and from nowhere else — so the backfill never fires inside its transaction and its fixture is exactly what it was. Every other file passes `test_user_roles(N)` for one of the eight fixture identities, so the backfill fires on the first authenticated call and inserts nothing on the rest. **Measured: all thirteen pre-existing files 00–12 pass unedited on the new claim path**, and `04-admin-crud.test.sql`'s collision is the single one the plan predicted.
- **Consequence recorded for 162-15:** it inherits **three** call sites, not the two the plan names — `seed.sql`, `set_test_user`, and the function itself.

**2. [Rule 2 - Missing critical validation] `send-email`'s gate compared an unvalidated `project_id`**

- **Found during:** Task 5.
- **Issue:** the request body's `project_id` is validated roughly twenty lines **below** the authorisation gate. A request omitting it would reach the gate as `undefined`, and a claim entry whose own `target_id` were absent would compare `undefined === undefined` — **true**. Two missing values agreeing is a fail-open on the one line that closes 161-13's residual.
- **Fix:** `project_id` is narrowed to a string **before** the comparison (`typeof project_id === 'string' && project_id.trim() !== '' ? project_id : null`); a `null` never equals a uuid.

### Broken verify instruments, replaced

**3. [Rule 3 - Blocking] The plan's grant-insert sweep finds nothing, in a repository with four such files**

- **Found during:** Task 3.
- **Issue:** the plan sweeps with `grep -rn "INTO public.grants\|INTO grants"`. The SQL formatter puts the table name on the line **after** `INSERT INTO`, so that pattern matches **zero** of the four files that insert grant rows — and would have reported a clean sweep while `04-admin-crud.test.sql` and `12-user-can.test.sql` both sat there waiting to error. The plan's own instruction was *"Do not assume the set is one file."*
- **Fix:** a multi-line-aware search (`perl -0777` over `INSERT\s+INTO\s+(?:public\.)?grants\b`). It finds four files; the disposition of each is in the table above.

**4. [Rule 3 - Blocking] `prosecdef` compared against `t`/`search_path=` again**

- **Found during:** Task 3.
- **Issue:** the plan's `SCHEMA-SHAPE-OK` gate greps for `backfill_grants_from_user_roles|t|search_path=`. PostgreSQL renders a boolean **cast to text** as `true`, not `t`, and renders `proconfig` as `search_path=""`. Exactly the defect 162-05 recorded as its deviation 3 — reintroduced verbatim into this plan's text.
- **Fix:** compare against `true` and match `search_path=` as a prefix. Measured: `backfill_grants_from_user_roles|true|search_path=""`.

**5. [Rule 1 - Bug] `FIRST -eq 8` is arithmetically unreachable on a seeded database**

- **Found during:** Task 3.
- **Issue:** the plan asserts *"On a database that has run `create_test_data()`, `public.grants` holds exactly 8 rows."* The database is seeded: `seed.sql` carries two role rows of its own, and the backfill maps those too, so an unscoped count is **10** under any design. The ratified figure is about the fixture's eight identities.
- **Fix:** the figure is kept and the instrument confined — the count is scoped to the eight fixture user ids. Measured **8**, and the same eight are asserted inside `14-grants-migration.test.sql` (assertion 8) with the reason written into the description string.

**6. [Rule 1 - Bug] A verify that printed `COMPLETENESS-GREEN` on a query that had errored**

- **Found during:** Task 4, and it is the worst of the five.
- **Issue:** the plan's completeness verify runs `BEGIN; SELECT create_test_data(); …` in a transaction, but its own preceding gate runs `yarn db:reset`, which removes the pgTAP helper functions. The query failed with `function create_test_data() does not exist`, `DIFFS` came back empty, and the `;`-separated guard chain let the block run to completion and **print `COMPLETENESS-GREEN`**. A gate that reports green on a measurement that did not happen is worse than one that fails.
- **Fix:** the estate is run before the transaction so the helpers exist, the block uses `set -e`, and the measurement's **shape** is asserted before any field is read (`case "$DIFFS" in [0-9]*\|[0-9]*\|[0-9]*\|[0-9]*`), with an explicit failure message naming the condition. Measured `10|10|0|0`.

**7. [Rule 3 - Blocking] Two Task 4/5 gates could not fail, one of them for the second time in this phase**

- **Found during:** Tasks 4 and 5.
- **Issue:** (a) Task 4 asserts `git status --porcelain -- apps/supabase` is empty to prove the planted mistranslation was restored — but Task 4's own `<files>` modifies `apps/supabase/supabase/seed.sql` and two files under `apps/supabase/supabase/tests/`, so it could never be empty at the moment it runs. **This is 162-05's deviation 6(b), reintroduced.** (b) Task 5's swallow check greps `sed -n '/grant/,/}/p' index.ts` for `console.error`; the first line containing `grant` is the `import { writeEntityGrant }` line and the first `}` is on that same line, so the range is **one line** and the check is vacuous.
- **Fix:** (a) scoped to `apps/supabase/supabase/schema`, where the plant lived — the same repair 162-05 made. (b) replaced with a 25-line window after the grant write, plus two positive assertions that the failure path **deletes the candidate row it created** and **returns a non-success response**. All three now measure what they claim.

### Additional finding, recorded rather than fixed

**`12-user-can.test.sql` carries two descriptions that the claim switch made inaccurate, and both assertions still pass.** Its assertion *"a caller whose JWT carries no grants key is denied `project.read_structure`"* now runs against a token that carries `grants: []` — `set_test_user` always sets the key — and is still denied, for the right reason. Its comment at the `admin_update_projects` block says the UPDATE affects no row because `can_access_project` *"reads the legacy `user_roles` claim this session does not carry"*; after the switch it affects no row because the session's only grant is a project **editor** grant, which does not hold `project.edit_project_settings`. The file is one this plan must not edit and both assertions are green, so the prose is reported here rather than corrected.

## Deferred Issues

See `.planning/phases/162-permissions-auth-model-refactor/deferred-items.md`:

- The two `db:lint:sql` FK-without-index WARNINGs are **still pre-existing**; `yarn db:lint:sql` exits 0 and no file under `schema/` other than the two this plan edits changed.
- `.claude/skills/database/` documentation drift has moved a third time — now **99 policies / 25 schema files / 15 pgTAP files / 602 assertions**, with the assertion total having gone *down*. 162-16/17 must re-derive rather than copy.
- `tests/tests/setup/admin/admin-auth.setup.ts` still describes the E2E admin identity in the retired vocabulary. Outside this plan's declared file list; filed to `.planning/WINDOWS.md` so it is visible at ship time.
- `send-email`'s **account-scope arm** accepts an account admin without resolving which account contains the named project — the same posture the role check it replaced had. The project-scope arms do compare the target, which is the half that closes 161-13's residual. Filed to `.planning/WINDOWS.md`.

## Known Stubs

None. No hardcoded empty value, placeholder string, TODO or FIXME was introduced; no test is skipped; every `<verify>` block in the plan was run, five of them on repaired instruments.

**One stated residual, ratified rather than hidden:** `entityGrant.ts` accepts four entity types and **only one has a caller**. Three of its four branches are exercised by its own test and by nothing else, until brief § 6.1 adds the second call site. This is the accepted cost the operator ratified as A-10(A) and it is recorded here, in `deferred-items.md` and in the module's own header so 162-10, 162-12 and 162-14 inherit the posture through D-21 rather than re-deriving it.

## Threat Flags

None. The trust boundaries this plan touches are the ones its own threat register names; it adds no new network endpoint and no new file-access pattern. Two boundary notes worth carrying forward:

- The `grants` claim is readable by its bearer, as the retired claim was. T-162-06-11, accepted, unchanged by this plan.
- A forged `grants` claim is bounded by the JWT signature and by `getUser()` before every Edge Function decode. T-162-06-12, transferred to Supabase Auth.

It installs nothing: `git diff` against the base SHA moves no `dependencies` or `devDependencies` line in any `package.json` (T-162-06-SC).

## Scope proof

`git diff --name-only 535ffc838` lists exactly **30** paths, every one of them in this plan's declared `files_modified`, plus `.planning/`. Nothing under `packages/dev-seed/`, `apps/supabase/supabase/schema/302-rls.sql` or `apps/supabase/supabase/schema/400-storage.sql`. `apps/supabase/supabase/migrations/` holds exactly one `.sql` file and `yarn assert:schema-migration-parity` reports the generated copy current at 25 schema files → 4517 lines. `md5(prosrc)` of `is_candidate_self` on the applied database still equals its base-SHA value `bddc28708aad3ca6c97a16d9e1fd1d16` — it belongs to 162-10.

## Code review checklist

Checked against this plan's diff (`.agents/code-review-checklist.md`). The Supabase Backend and Edge Functions sections are the applicable ones; the Supabase Adapter section applies to one file, and the Svelte-component and accessibility sections do not apply — no `.svelte` file was touched and no user-visible surface changed.

- **New SECURITY DEFINER functions set `search_path = ''` and use schema-qualified calls** — `backfill_grants_from_user_roles` carries both, and every table and function it names is `public.`-qualified. Asserted from `pg_proc.proconfig` across the whole schema: **14** SECURITY DEFINER functions examined, **0** with an unpinned search_path.
- **RLS policies use `(SELECT auth.jwt())` scalar subqueries; policies specify a role target** — no policy was edited; `pg_policies` holds 99 rows before and after.
- **No new content table, index, trigger or column** — this plan adds none.
- **pgTAP tests follow the BEGIN/ROLLBACK pattern and use `create_test_data()`** — `14-grants-migration.test.sql` opens `BEGIN`, drops its temp tables, declares an explicit numeric `plan(50)`, calls `create_test_data()`, and closes `reset_role()` / `finish()` / `ROLLBACK`. Every row it constructs is deleted inside the file and asserted deleted, and the transaction rolls back on top of that.
- **pgTAP assertions use correct patterns** — `ok()` for positives, `is()`/`isnt()` for values, `is_empty()` for both-direction set equalities, `cmp_ok()` for floors, `throws_ok()` for the fixture tripwire.
- **Edge Functions verify the caller is admin via JWT claims before privileged work; use `service_role` for privileged operations; error responses carry status codes and descriptive messages** — all three gates run after `getUser()` and before any write; the grant write runs on the service-role client; the new failure path returns `500` with a message naming the condition and not the configuration.
- **Avoid `any`** — none introduced. The one cast is `as unknown as GrantWriteClient` in the hand-built fake, the same form `candidateRecord.test.ts` uses.
- **No repeated code** — `entityGrant.ts` is duplicated between two Edge Function directories deliberately and byte-identically, for the reason `jwtSegment.ts` already is: Supabase treats each function directory as its own deployment unit. Both copies were compared with `cmp` and are identical.
- **Errors handled and logged** — the one swallow this plan found was removed; nothing new swallows.
- **All new entities documented** — every new function, type and constant carries a block comment naming what it is for, what it must not become, and which plan deletes it.
- **Repo documentation updated where touched** — the two prose sites describing an identity in the retired vocabulary inside this plan's file list were corrected; the one outside it is filed as deferred.
- **Commit history clean and linear** — four commits, one per task that changed a tracked file, conventional-commit format.

## Self-Check: PASSED

Files verified present:

- `apps/supabase/supabase/tests/database/14-grants-migration.test.sql` — FOUND
- `apps/supabase/supabase/functions/invite-candidate/entityGrant.ts` — FOUND
- `apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts` — FOUND
- `apps/supabase/supabase/functions/identity-callback/entityGrant.ts` — FOUND
- `apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts` — FOUND
- `apps/supabase/supabase/schema/300-auth-tables.sql` — FOUND
- `apps/supabase/supabase/schema/301-auth-functions.sql` — FOUND
- `apps/supabase/supabase/seed.sql` — FOUND
- `apps/frontend/src/lib/auth/roles.ts` — FOUND

Commits verified present: `6261a8bf6`, `4b05999f7`, `d28180e49`, plus this documentation commit.
