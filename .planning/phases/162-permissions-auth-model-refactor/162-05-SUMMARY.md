---
phase: 162-permissions-auth-model-refactor
plan: 05
subsystem: database
tags: [postgres, rls, jwt, pgtap, supabase, authorization, shim, migration]

requires:
  - phase: 162-01
    provides: 162-SPEC.md, the phase's normative reference
  - phase: 162-02b
    provides: the folded 00001_initial_schema.sql and the byte-comparison parity guard with --write
  - phase: 162-03
    provides: grant_scope_type / grant_role_type / grant_permission and the public.grants table
  - phase: 162-04
    provides: user_can, is_child_nominee, grant_role_permissions, entity_project_id, and the converted projects SELECT policy
provides:
  - "public.can_access_project rewritten as a thin shim over user_can('project', X, 'project.edit_project_settings'), exact translation, signature unchanged"
  - "public.has_role rewritten as a thin shim over user_can, one translation per role literal, enum signature and both DEFAULT NULL parameters unchanged"
  - "public.can_access_project_legacy_claim and public.has_role_legacy_claim — today's bodies moved verbatim, digest-identical to the base SHA, behind an EXCLUSIVE claim dispatch"
  - "a pgTAP biconditional tying the fallback's existence to custom_access_token_hook emitting no grants key, so the fallback cannot outlive 162-06"
  - "test_grants_from_user_roles — D-07's user-type-to-grant-row mapping written down once in the test estate"
  - "test_rls_digest — a SECURITY INVOKER, catalogue-derived row-set digest helper that waves 3, 4 and 5 reuse"
  - "13-shim-parity.test.sql — 324 assertions: two function-level grids and a policy-level row-set differential"
affects: [162-06, 162-08, 162-09, 162-10, 162-12, 162-15, 162-17, waves 3/4/5]

actuals:
  tokens: 85744
  tasks: 6
  commits: 4
  plan_head_before: 55e92aeed4275d6abf2f0fd02278e98baaa9bc56

tech-stack:
  added: []
  patterns:
    - "Exclusive claim dispatch: a transitional predicate answers from exactly one authority model per token, never the union of two"
    - "Moved-not-rewritten legacy bodies, proven by md5(prosrc) against a recorded base SHA"
    - "Expiry tripwire written against the mechanism that closes the window (the auth hook), not against a date or a plan number"
    - "Independent-oracle deviation bounding: the widening set asserted equal in BOTH directions to a set derived by plain joins that never calls the function under test"
    - "Catalogue-derived, SECURITY INVOKER row-set digest as a policy-level behaviour-neutrality instrument"

key-files:
  created:
    - apps/supabase/supabase/tests/database/13-shim-parity.test.sql
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - packages/supabase-types/src/database.ts

key-decisions:
  - "Q1 = window resolution approved, 162-06 obligation recorded (162-CHECKPOINT-DECISIONS.md section 3, A-4)"
  - "Q2 = A — the characterised upward widening of has_role is accepted, asserted as an EXACT SET of 7 cells of 45 (A-5)"
  - "Q3 = raise approved — has_role(R, NULL, NULL) for R other than super_admin raises a named exception (A-6)"
  - "The plan's Task 3 negative control could not redden its own floor; repaired into a two-literal sweep plus a project-editor identity that makes the two probe permissions distinguishable at all"
  - "Six broken verify instruments in the plan text were replaced with stronger ones rather than worked around"

patterns-established:
  - "Probe-permission discrimination: a permission literal is only provably correct if the fixture contains an identity that holds a neighbouring literal and not the chosen one"
  - "Negative controls are swept across several neighbouring literals, with the per-literal reddened count recorded, not a single swap"

requirements-completed: [PRESHIP-02]

coverage:
  - id: D1
    description: "can_access_project answers through user_can for every fixture identity at both projects, exactly as the legacy body did, with 76 call sites unedited"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/13-shim-parity.test.sql#sections 1-9 (assertions 1-64)"
        status: pass
    human_judgment: false
  - id: D2
    description: "has_role answers through user_can with zero revocations and a widening set equal in both directions to an independent oracle's — 7 cells of 45"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/13-shim-parity.test.sql#sections 10-17 (assertions 65-125)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Policy-level behaviour neutrality: every fixture identity sees the same rows of every row-level-security table through user_can as through user_roles"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/13-shim-parity.test.sql#sections 18-20 (assertions 126-322)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The transitional fallback cannot outlive its window: a biconditional ties the two *_legacy_claim functions to the hook emitting no grants key"
    requirement: PRESHIP-02
    verification:
      - kind: integration
        ref: "apps/supabase/supabase/tests/database/13-shim-parity.test.sql#section 21 (assertions 323-324)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Wave-2 boundary gate: typecheck, lint:check, unit, pgTAP, db:lint:sql and the full E2E suite green"
    requirement: PRESHIP-02
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/162-05-wave2 --no-db-reset"
        status: pass
      - kind: integration
        ref: "yarn workspace @openvaa/supabase test:db"
        status: pass
    human_judgment: false

duration: ~2h15m
completed: 2026-09-16
status: complete
---

# Phase 162 Plan 05: Shim `has_role` and `can_access_project` over `user_can` Summary

**88 policy call sites moved onto `user_can` without a single policy being edited, with the move proven neutral by a 180-cell row-set differential that was observed reddening under a planted mistranslation before it was believed.**

## Performance

- **Duration:** ~2h15m
- **Tasks:** 6 of 6
- **Commits:** 4 (measured: `git rev-list --count 55e92aeed..HEAD`)

## The obligation handed to 162-06

**162-06 must delete `has_role_legacy_claim`, `can_access_project_legacy_claim` and both dispatch branches in the same commit as the hook change.**

That sentence is the quotable line 162-06's Task 1 reads back. It is enforced mechanically rather than by this note: `13-shim-parity.test.sql` assertion 324 asserts a **biconditional** — the two `*_legacy_claim` functions exist **if and only if** `custom_access_token_hook` returns claims carrying no `grants` key. Both sides hold today. The moment 162-06 makes the hook emit `grants`, that assertion goes red unless the same commit deletes the fallback. Assertion 323 first asserts the hook returned a non-null claims object, so a NULL return cannot make the right-hand side vacuously true.

`test_grants_from_user_roles` in `00-helpers.test.sql` is the one written-down form of D-07's user-type-to-grant-row mapping. 162-06 should **diff its data migration against that helper** rather than re-derive the mapping: a disagreement across that boundary is a silent total denial, not an error.

## Task 2 — the ratified answers

Answered by the operator on 2026-09-16 in `162-CHECKPOINT-DECISIONS.md` § 3, items A-4, A-5, A-6. Not re-asked.

| Question | Answer |
|---|---|
| **Q1** — the transitional window | **window resolution approved, 162-06 obligation recorded.** Exclusive dispatch on the presence of the `grants` claim; today's bodies moved verbatim; the biconditional ties the fallback's lifetime to the hook. Option (C) rejected by measurement, not argument. |
| **Q2** — the deviation posture | **A.** The characterised upward widening IS accepted, asserted as an **exact set**. Not (B) exact complement shims, not (C) leaving `has_role` on the legacy claim, which looks smallest and produces an outage. |
| **Q3** — the untranslatable shape | **raise approved.** `has_role(R, NULL, NULL)` for `R` other than `super_admin` raises a named exception in `011-validation-functions.sql`'s style. |

**The direction split Q2 turns on**, recorded so waves 3–5 and 162-15 inherit it rather than re-deriving it:

- The **outage** direction — the shim answering `false` where the legacy answered `true` — carries its own assertion and is measured at **zero** cells.
- The **privilege** direction — answering `true` where the legacy answered `false` — is asserted as an exact set against an independent oracle, in both directions, so it cannot quietly grow.
- **(B) remains available** at any point in waves 2–5 at the stated cost (a complement term per translation plus an entity-to-project hop per row on two hot SELECT policies). **The widening ends at 162-15**, which demolishes the shims.

## The measured figures

### Task 1 — the census this plan's resolution rests on

| Measurement | Value |
|---|---|
| `302-rls.sql` executable call sites (comments stripped) | **66** `can_access_project`, **12** `has_role` |
| `400-storage.sql` executable call sites | **10** `can_access_project`, **0** `has_role` |
| Combined | **76** `can_access_project`, **12** `has_role` |
| Distinct executable `has_role` shapes | **3** — `super_admin` unscoped, `account_admin/account/<target>`, `organization/organization/<target>`. No executable call names `project_admin` or `candidate`; no unscoped non-`super_admin` form exists, so the raising branch is unreachable from any policy. |
| pgTAP declared assertions at the base SHA (the control group a grants-only shim would deny) | **438** |
| Authenticated E2E spec files (the second denied population) | **12** |
| Authenticated runtime readers of `public.projects` | **0** (service-role readers: 3) |
| `pg_policies` across `public` and `storage` | **99**, unchanged end to end |

Both denied populations are far from zero, which is the measurement that rejects candidate resolution (c) — that no real authenticated caller reaches the affected policies — by evidence rather than by argument.

### The `has_role` grid

| | |
|---|---|
| Cells compared | **45** (nine identities × five executable call cells) |
| **Revocation count** | **0** |
| **Deviation cardinality** | **7** |
| **Equal to the 7 cells this plan predicted at planning time?** | **Yes — cell for cell** |
| Equal to the independent oracle's set, in both directions? | **Yes** (`cmp` byte-identical) |
| Agreeing cells | **38** |
| `super_admin` call shape deviations | **0** — the translation claimed exact is measured exact |

The seven cells, all upward:

| Call cell | Identities where the legacy denies and the shim allows |
|---|---|
| `has_role('super_admin')` | — |
| `has_role('account_admin','account', account_a)` | `super_admin` |
| `has_role('account_admin','account', account_b)` | `super_admin` |
| `has_role('organization','organization', org_a)` | `super_admin`, `account_admin_a`, `admin_a` |
| `has_role('organization','organization', org_b)` | `super_admin`, `admin_b` |
| `can_access_project` (both projects) | — (the exact translation) |

### The policy-level differential

| | |
|---|---|
| Cells compared | **180** (9 identities × 20 tables, `public.projects` asserted separately) |
| **Cells that differed** | **0** |
| Tables covered | **21** — 20 `public` row-level-security tables plus `storage.objects`, asserted equal to the catalogue's set in both directions |
| Non-empty digests | **143** of 189, so the instrument is not measuring nothing |
| `public.projects` | 162-04's declared exception, **asserted rather than excluded**: zero rows for all nine identities under a `user_roles`-only claim; non-empty for the global admin and for a project admin under `grants` |

### Negative controls — this plan's rows in the phase's ledger (F4(a), collected by 162-17)

| Control | Reddened |
|---|---|
| Task 3, `can_access_project` probe → `project.edit_app_settings` (the plan's named neighbour) | **1** |
| Task 3, `can_access_project` probe → `project.read_structure` | **8** |
| Task 3 sweep total | **9** |
| Task 4, `has_role` returning `false` unconditionally | **17** |
| Task 4, `has_role` returning `true` unconditionally | **40** |
| Task 5, planted organization-branch mistranslation (`entity.edit_answers` → `account.manage_admins`) | **5** — none of them a differential assertion |
| Task 5, planted `can_access_project` mistranslation (`edit_project_settings` → `read_structure`) | **27**, of which **19** are row-set differential assertions |

**Restored-green confirmed** after every plant: the plants were applied to the applied database only and never to the tree; `git status --porcelain -- apps/supabase/supabase/schema` is empty and the tree's probe literals are the correct four.

### Assertion totals

| | |
|---|---|
| `13-shim-parity.test.sql` declared plan | **324** |
| Estate | **770** assertions across **14** files (was 438 declared / 13 files) |
| Pre-existing pgTAP files edited | **0**. The only edit to `00-helpers.test.sql` is additive: **81 insertions, 0 deletions**. |

### Cost

| | µs/call |
|---|---|
| `can_access_project_legacy_claim` | 6.67 / 7.25 / 6.86 / 7.09 |
| `can_access_project` (the shim) | 18.21 / 19.34 / 18.50 / 19.05 |
| **Ratio** | **2.73 / 2.67 / 2.70 / 2.69** — budget **3.0**, **within**, no rewrite forced |

Beside 162-04's recorded ratios for `user_can` itself (**2.12 / 2.00 / 1.91 / 1.98**): the shim adds one claim-key read and one delegation on top of that, which is what the extra ~0.7× is.

### The wave-2 boundary gate

| Gate | Result |
|---|---|
| `yarn typecheck` | **0** — 23 tasks |
| `yarn lint:check` | **0** (includes `assert:schema-migration-parity`) |
| `yarn test:unit` | **0** — 25 tasks |
| `yarn workspace @openvaa/supabase test:db` | **0** — 14 files, 770 tests, PASS |
| `yarn db:lint:sql` | **0** — 0 errors, 2 pre-existing warnings (see Deferred) |
| **Full E2E suite** | **155 passed / 0 failed / 0 did-not-run**, 10.8m |
| E2E run directory | `tests/e2e-runs/162-05-wave2` |

The E2E run is the second, independent proof that the transitional window is closed: every identity the suite creates authenticates through `custom_access_token_hook`, receives a `user_roles` claim and no `grants` claim, and is therefore answered by the moved legacy bodies. The first proof is those bodies' byte-identity against the base SHA.

## Accomplishments

- **`can_access_project` is a shim and the translation is exact.** Asserted for all nine fixture identities at both projects with no declared exception, plus eight absolute-value assertions so a translation that is wrong in the same direction as the legacy body still reddens.
- **`has_role` is a shim and its deviation is characterised, bounded and asserted as an exact set**, by an oracle that derives containment from `public.grants`, `accounts`, `projects` and `organizations` by plain joins and never calls `user_can` or `grant_role_permissions`.
- **Not one policy was edited.** `302-rls.sql` and `400-storage.sql` are byte-identical to the base SHA (`git diff --numstat` reports no entry for either) and `pg_policies` holds 99 rows before and after.
- **The dispatch is exclusive, demonstrated where the two models disagree.** A token carrying a `project_admin` `user_roles` claim *and* an empty `grants` array is denied by the shim while the legacy body allows it — a pair that cannot pass by both answering the same thing.
- **The untranslatable shape raises**, asserted by `throws_ok` against the exact message, and is proven unreachable from any policy by Task 1's census.
- **One migration file, regenerated in the same commit as each `schema/` edit** (D-14, D-17); `packages/supabase-types/` regenerated and naming both `*_legacy_claim` functions (D-18).

## Deviations from Plan

Six verify instruments in the plan text could not do what they claimed. Each was replaced with a stronger one rather than worked around, and each replacement is recorded here.

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1's `has_role` shape census could not produce three shapes**

- **Found during:** Task 1
- **Issue:** The verify normalised only whitespace and quotes, so `has_role(account_admin,account,account_id)` and `has_role(account_admin,account,id)` counted as two distinct shapes. It produced **5**, against an asserted floor of exactly 3, and halted the plan on its first gate. M2 defines a shape with the target expression collapsed (`has_role('account_admin','account',<uuid>)`); the instrument did not collapse it.
- **Fix:** normalise the third argument to `<target>` before `sort -u`. Result: exactly 3 shapes, role literals `super_admin`, `account_admin`, `organization`, as M2 predicted.

**2. [Rule 3 - Blocking] Task 1's unscoped-form guard could never pass**

- **Found during:** Task 1
- **Issue:** the guard `grep -qE '^has_role\((account_admin|organization),'` is meant to catch the *unscoped* `has_role('account_admin')` form, but the trailing comma makes it match every **three-argument** `account_admin` and `organization` call in the schema. It matched four lines and would have aborted the plan claiming the raising branch was reachable from a policy.
- **Fix:** anchor to a closing parenthesis immediately after the role literal — `^has_role\((account_admin|organization|project_admin|candidate)\)$` — which is the shape actually being excluded. Zero matches, as designed.

**3. [Rule 3 - Blocking] `prosecdef` was compared against `t`/`f`, but string concatenation renders `true`/`false`**

- **Found during:** Tasks 3 and 4
- **Issue:** the plan compares `p.proname || '|' || p.prosecdef` against `test_rls_digest|f` and `has_role|t|search_path=`. PostgreSQL's boolean **column** output is `t`/`f`, but boolean **cast to text** is `true`/`false`. Both gates were unpassable. A third error compounded it: `proconfig` renders as `search_path=""`, not `search_path=`.
- **Fix:** compare against `true` and match `search_path=` as a prefix rather than a whole field — asserting SECURITY DEFINER and a pinned search_path without over-specifying PostgreSQL's quoting. All four functions verified `true` + `search_path=""`.

**4. [Rule 3 - Blocking] Task 3's negative control could not reach its own floor — and the reason was a real gap in the test file**

- **Found during:** Task 3
- **Issue:** the plan requires ≥6 assertions to redden against a shim probing `project.edit_app_settings`, chosen because it "differs from the correct literal only in that ProjEditor also holds it". But **no fixture identity is a project editor** — `user_role_type` has no such member, so `test_grants_from_user_roles` cannot produce one. Measured against the nine identities the swap reddens **0**. The gate was unreachable, and the reason was that the estate genuinely could not tell the two literals apart.
- **Fix:** two changes, both strengthening. (a) A tenth identity `proj_editor_a` holding a `project`/`editor` grant, in a dedicated four-assertion discrimination block — a positive control that it holds `project.edit_app_settings`, a paired one that it does not hold `project.edit_project_settings`, and the two denial assertions. (b) The single swap became a **sweep** over two neighbouring literals with per-literal counts recorded. Measured: `edit_app_settings` **1**, `read_structure` **8**, total **9**. Without (a) the plan's named neighbour would still redden 0 — so the repair closed a real hole rather than relabelling a number.
- **Scope note:** `proj_editor_a` is deliberately kept **out of** the `can_access_project` grid and **out of** the 45-cell `has_role` grid. Including it would add an eighth deviation cell (it holds `entity.edit_answers` and reaches `org_a` through `project_a`) and silently redefine the ratified "7 cells of 45".

**5. [Rule 1 - Bug] Task 5's benchmark measured nothing — the baseline read `0.00`**

- **Found during:** Task 5
- **Issue:** two defects. (a) `psql -Atc` returns the `set_config(...)` result row *and* the timing row, so `cut -d' ' -f1` on the captured output read `{"sub"` from the claims JSON, not a number. (b) With that fixed the baseline still read `0.00`: the benchmark takes its three `clock_timestamp()` readings in CTEs whose evaluation order PostgreSQL does not guarantee, so `t1 - t0` could be taken before any work ran. The plan's own `fails_when` names the `0.00` symptom without supplying the cure.
- **Fix:** replaced with a sequenced `plpgsql` timer — explicit `FOR` loops with `clock_timestamp()` captured between phases, plus a 50-iteration warm-up so neither phase pays first-call plan compilation. Produces stable, plausible per-call costs across four runs (ratio 2.67–2.73).

**6. [Rule 3 - Blocking] Two Task 4 / Task 5 gates contradicted their own tasks**

- **Found during:** Tasks 4 and 5
- **Issue:** (a) Task 4's gate aborts if `grep -q 'super_admin'` matches the deviation listing, intending to catch the `has_role('super_admin')` *call shape*. But `super_admin` is also an *identity*, and it legitimately appears in four of the seven deviation cells, so the guard could never pass. (b) Task 5's gate asserts `git status --porcelain -- apps/supabase` is empty to prove the planted mistranslation was restored — but Task 5's own `<files>` list modifies `13-shim-parity.test.sql`, so it could never be empty at the moment it runs.
- **Fix:** (a) match the call shape `super_admin/global` rather than the bare identity name — measured 0, the translation claimed exact is exact. (b) scope the restoration check to `apps/supabase/supabase/schema` and add a direct assertion on the four probe literals at HEAD. The plants were applied to the applied database only and never entered the tree, which is a stronger guarantee than the original check would have given.

### Additional finding, recorded rather than fixed

**pgTAP ships its own `has_role()` and it shadows ours in the test estate.** pgTAP's `has_role(name)` / `has_role(name, description)` asserts that a *database role* exists and returns `text`. With `search_path = public, extensions` — which every file in the estate sets — an unqualified one-argument `has_role('super_admin')` resolves to pgTAP's, producing `function ok(text, unknown) does not exist` rather than a failed assertion. Every call in `13-shim-parity.test.sql` is therefore schema-qualified as `public.has_role(...)`. This does not affect the policy estate, where `search_path` does not include pgTAP's schema, and it does not affect the pre-existing pgTAP files, which call `has_role` zero times directly (M2). Waves 3–5 will hit it the moment they write an unqualified one-argument call.

### Instrument repairs deliberately NOT filed to `.planning/WINDOWS.md`

All six above are **repairs that landed**, not open defects: each gate now runs and passes on a stronger instrument. The ledger blocks `/gsd-ship` on open entries, and filing closed repairs there would be noise. The one genuinely open item — two pre-existing `db:lint:sql` FK-without-index warnings, already recorded by 162-04 — is re-confirmed in `deferred-items.md` rather than re-filed.

## Deferred Issues

See `.planning/phases/162-permissions-auth-model-refactor/deferred-items.md`:

- The two `db:lint:sql` FK-without-index WARNINGs are **still pre-existing** — `git diff --numstat` against the base SHA reports zero changed lines in `200-indexes.sql`, and `db:lint:sql` exits 0. Out of scope: an index change riding inside a behaviour-neutrality proof would be indistinguishable, in the differential, from a shim that changed behaviour.
- `.claude/skills/database/` documentation drift has moved again — measured now at **99 policies / 25 schema files / 14 pgTAP files / 770 assertions**. Belongs to 162-16/17's documentation close, which should **re-derive** rather than copy, since the figure has changed twice.

## Known Stubs

None. No hardcoded empty value, placeholder string, TODO or FIXME was introduced; no test is skipped; every `<verify>` block in the plan was run, six of them on repaired instruments.

## Threat Flags

None. This plan adds no network endpoint, no auth path, no file-access pattern and no schema change at a trust boundary. It installs nothing: `git diff` against the base SHA shows no `dependencies` or `devDependencies` line moved in any `package.json` (T-162-05-SC).

## Scope proof

`git diff --name-only 55e92aeed` lists exactly:

```
apps/supabase/supabase/migrations/00001_initial_schema.sql
apps/supabase/supabase/schema/301-auth-functions.sql
apps/supabase/supabase/tests/database/00-helpers.test.sql
apps/supabase/supabase/tests/database/13-shim-parity.test.sql
packages/supabase-types/src/database.ts
```

plus `.planning/`. Nothing under `packages/dev-seed/`, `apps/supabase/supabase/seed.sql`, `tests/`, `302-rls.sql` or `400-storage.sql`. `apps/supabase/supabase/migrations/` holds exactly one `.sql` file. `md5(prosrc)` of `custom_access_token_hook` (`a90786774c…`) and `is_candidate_self` (`bddc28708a…`) on the applied database still equal their base-SHA values — both belong to 162-06 and 162-10.

## Code review checklist

Checked against this plan's diff (`.agents/code-review-checklist.md`). The Supabase Backend section is the applicable one; the Supabase Adapter, Edge Functions, Svelte and accessibility sections do not apply — no frontend file, no Edge Function and no adapter file was touched.

- **New SECURITY DEFINER functions set `search_path = ''` and use schema-qualified calls** — both new functions and both rewritten shims carry `SET search_path = ''` and call `public.`-qualified functions. Asserted from `pg_proc.proconfig` across the whole schema: **15** SECURITY DEFINER functions examined, **0** with an unpinned search_path.
- **RLS policies use `(SELECT auth.jwt())` scalar subqueries** — no policy was edited; the shims keep the existing single-evaluation `(SELECT auth.jwt() -> '…')` form.
- **pgTAP tests follow the BEGIN/ROLLBACK pattern and use `create_test_data()`** — `13-shim-parity.test.sql` opens `BEGIN`, drops `__tcache__`, declares an explicit numeric `plan(324)`, calls `create_test_data()`, and closes `reset_role()` / `finish()` / `ROLLBACK`. Every grant row and storage object it writes is rolled back with it.
- **pgTAP assertions use correct patterns** — `ok()` for positives, `is()`/`isnt()` for value comparisons, `is_empty()` for the both-direction set equalities, `throws_ok()` for the untranslatable shape, `has_function()` for signatures.
- **No new content table, index, trigger or column** — this plan adds none, so those items are not applicable.
- **Documentation** — all four functions carry block comments naming their translation, their probe permission, their deletion plan and the reason the widening is structural. The two helpers document why one is not, and the other must not be, `SECURITY DEFINER`.
- **No `any`; errors handled and logged** — no TypeScript was written; the only generated `.ts` change is `packages/supabase-types/src/database.ts`. The one error path added raises a named, attributable exception rather than returning a silent `false`.
- **Commit history clean and linear** — four commits, one per task that changed a tracked file, conventional-commit format.

## Self-Check: PASSED

Files verified present:

- `apps/supabase/supabase/tests/database/13-shim-parity.test.sql` — FOUND
- `apps/supabase/supabase/schema/301-auth-functions.sql` — FOUND
- `apps/supabase/supabase/tests/database/00-helpers.test.sql` — FOUND
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — FOUND
- `packages/supabase-types/src/database.ts` — FOUND

Commits verified present: `5224279b5`, `883ce4bd8`, `43a830e1e`, plus this documentation commit.
