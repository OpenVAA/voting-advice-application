---
phase: 162-permissions-auth-model-refactor
plan: 04
subsystem: supabase-auth
tags: [rls, permissions, grants, user_can, pgtap, tracer]
status: complete

requires:
  - '162-01 (162-SPEC.md, the normative enum and matrix)'
  - '162-03 (grant_scope_type, grant_role_type, grant_permission, public.grants)'
  - '162-02b (declarative schema/ + byte-comparison parity guard + schema:regenerate)'
provides:
  - 'public.user_can(grant_scope_type, uuid, grant_permission) -> boolean — the predicate 97 policies will call'
  - 'public.is_child_nominee(entity_type, uuid, uuid) -> boolean — direct parent only (D4(a))'
  - 'public.grant_role_permissions(grant_scope_type, grant_role_type, entity_type) -> grant_permission[] — section 3.3, encoded once'
  - 'public.entity_project_id(uuid) -> uuid — the entity-to-project hop'
  - 'test_grants_claim(uuid) / set_test_grants(uuid) — the table-to-claim projection 162-06 must reproduce'
affects:
  - '162-05 (can_access_project becomes a shim over user_can)'
  - '162-06 (the access-token hook must emit exactly test_grants_claim''s shape)'
  - '162-08, 162-12 (inherit Q2 = D and call is_child_nominee)'
  - '162-09 (converts admin_update_projects, the other half of criterion 2)'
  - '162-17 (structural non-collapse guard: the matrix is in one function body)'

tech-stack:
  added: []
  patterns:
    - 'The matrix is a separate IMMUTABLE function so "encoded once" is machine-checkable'
    - 'Claim fields compared as text against enum literals, never cast — an unrecognised entry is skipped, not raised'
    - 'Reach is downward-or-equal plus two branches that name their permission as a literal'
    - 'Negative controls: every deny assertion observed RED against an over-permissive stub before the body was accepted'

key-files:
  created:
    - apps/supabase/supabase/tests/database/12-user-can.test.sql
  modified:
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/00-helpers.test.sql
    - apps/supabase/supabase/tests/database/04-admin-crud.test.sql
    - packages/supabase-types/src/database.ts

decisions:
  - 'Q1 = signature approved: user_can(p_scope, p_target_id, p_permission) and is_child_nominee(p_parent_type, p_parent_id, p_child_id), exactly as printed'
  - 'Q2 = D: is_child_nominee gates nomination.read for ANY entity grant, NOT entity.read_answers'
  - 'Q3 = matrix-only approved: row state is a conjunct of the calling policies, not a member of the matrix'
  - 'grant_role_permissions is a second function; "encoded once" is a claim about the matrix, not the function count'
  - 'A global grant reaches everything that EXISTS: at entity scope it still resolves entity_project_id, so a uuid in no entity table denies for the root admin too'

metrics:
  duration: ~3h
  completed: 2026-09-16

actuals:
  tokens: 20471
  tasks: 6
  commits: 3
  plan_head_before: e0f590d3d42568480c97848c26d50187876aafa9
---

# Phase 162 Plan 04: `user_can` Summary

The role x permission matrix of `162-IMPLEMENTATION-BRIEF.md` § 3.3 now exists in exactly one
function body, `user_can` answers reach x verb over it for all 23 permissions, and one RLS policy —
`authenticated_select_projects` — has been converted to a single call of it, breaking ROADMAP
criterion 2's read/write collapse on `projects` and proving the break both structurally and
behaviourally.

## The named figures

| Figure | Value |
|---|---|
| **Task 2 Q2 answer** | **option (D)** — `is_child_nominee` gates `nomination.read`, for any entity grant |
| Stub run 1: assertions reddened by a `user_can` returning **true** unconditionally | **31 of 45** (floor: 20) |
| Stub run 2: assertions reddened by a `user_can` returning **false** unconditionally | **17 of 45** (floor: 10) |
| pgTAP estate | **13 files, 446 assertions, exit 0** (baseline 12 / 401) |
| `12-user-can.test.sql` declared plan | **45** (floor: 35) |
| `can_access_project` mean per call | **6.633 / 9.306 / 8.513 / 7.204 µs** across four runs |
| `user_can('project', …, 'project.read_structure')` mean per call | **14.083 / 18.640 / 16.298 / 14.285 µs** |
| **Ratio** | **2.12 / 2.00 / 1.91 / 1.98** — budget 3.0, **within**, no rewrite forced |
| `user_can` at entity scope (exercises `entity_project_id`) | 20.194 µs/call |
| E2E suite | **155 passed / 0 failed / 0 did-not-run**, 10.8m, exit 0 |
| E2E run directory | `tests/e2e-runs/162-04-wave1` |
| RLS policy count | 99 before, **99** after — a predicate was converted, no policy created |

## Q2 = D, and the authority behind it

**`is_child_nominee` gates `nomination.read`, for any entity grant. It does NOT gate
`entity.read_answers`.**

Answered by the operator on 2026-09-16 in `162-CHECKPOINT-DECISIONS.md` § 3 item **A-2**, selecting
the ★ RECOMMENDED option by leaving the box unticked. The authority is two sources that agree with
each other and disagree with the permissive reading this plan was dispatched with:

- **`162-IMPLEMENTATION-BRIEF.md` § 3.4, third row:** *"Entity grantee — Own entity's answers and own
  nominations; via `is_child_nominee`, a related entity's **basic data only** (not answers unless
  public)."*
- **`162-USER-RIGHTS.md` § "Grants, atomic rights", Nomination group:** *"read contents and related
  entities basic (not answers unless public) data."*

So the child hop grants the parent the child's **nomination and basic data, never the child's
answers**, and § 3.3's `entity.read_answers` cells stay literally `own` as the table prints them.
§ 3.3's legend — *"`own` = only for the granted target and, where noted, its `is_child_nominee`
children"* — is read as pointing at a Nomination-group cell, not an Entity-group one.

**162-08, 162-12 and 162-17 inherit this.** It is one `IF` branch in `user_can`, written with the
permission as a literal so the hop can never widen to another verb, and it is asserted in both
directions by test 44 (`Q2(D): an organization grantee is allowed nomination.read on its child
nominee`) and test 45 (`Q2(D) paired opposite: that grantee is denied entity.read_answers on the
same child`).

The other two ratifications: **Q1 = signature approved** (both argument lists exactly as printed,
no alternative offered) and **Q3 = matrix-only approved** — `lock_nominations`, `open_for_voters`
and the confirmation flags are conjuncts of the calling policies (162-08, 162-12), not members of
the matrix. Q3 was also forced in wave 1: none of those columns exists until 162-07, so a lock
conjunct inside the function could not have been written at all.

## What shipped

**Four functions** in `apps/supabase/supabase/schema/301-auth-functions.sql`. The three pre-existing
functions and the access-token hook are byte-identical.

| Function | `prosecdef` | `proconfig` | Reads a table |
|---|---|---|---|
| `grant_role_permissions(grant_scope_type, grant_role_type, entity_type) -> grant_permission[]` | `false` | `search_path=""` | no (IMMUTABLE) |
| `entity_project_id(uuid) -> uuid` | `true` | `search_path=""` | four entity tables, by primary key |
| `is_child_nominee(entity_type, uuid, uuid) -> boolean` | `true` | `search_path=""` | `nominations`, one hop |
| `user_can(grant_scope_type, uuid, grant_permission) -> boolean` | `true` | `search_path=""` | only through the two above |

Measured column sizes of the matrix, against the design table's prediction of 23, 23, 20, 17, 6, 6,
6, 6 — **exactly that**, in that order — and `0, 0, 0` for `global+editor`, `account+editor` and
`entity+admin`, the three shapes 162-03's CHECK constraints admit and § 3.1 does not map.

**One converted policy.** `authenticated_select_projects`, whose `USING` is now
`(SELECT user_can('project', id, 'project.read_structure'))` and contains no `can_access_project`,
no `has_role` and no `uid()`. `admin_update_projects` is byte-identical to its base-SHA text and
stays on `can_access_project` until 162-09 — that pair is criterion 2's assertion.

**Two additive test helpers** in `00-helpers.test.sql`: `test_grants_claim(uuid)` (the table-to-claim
projection 162-06's hook must reproduce, key for key) and `set_test_grants(uuid)`, which raises if
no claims are set. `set_test_user` still has exactly one overload and still takes three arguments.

**`12-user-can.test.sql`**, 45 assertions: the tracer ten, the eight ordered matrix vectors, the
three unmapped shapes, the three fail-open classes, six degenerate inputs, the union pair and its
reverse-order twin, four project-read-branch cases, five `is_child_nominee` cases and the Q2 cell
with its paired opposite.

**One added line-group** in `04-admin-crud.test.sql`: a grant row plus a `set_test_grants` call so
`'account_admin can SELECT projects in own account'` keeps the meaning it had before the conversion.
No existing assertion was deleted, weakened or renamed.

## The evidence that is not a green run

Both stub runs were taken **before the real body was accepted**, on the complete file:

- Against `user_can` returning **true** unconditionally: **31 of 45 reddened**. That number is the
  count of ways a fail-open would now be caught.
- Against `user_can` returning **false** unconditionally: **17 of 45 reddened** — the allow half is
  thick enough to notice a function that denies everything.

On the tracer slice alone (task 3, 10 assertions) the counts were **7 of 10** and **2 of 10**.

## Deviations from Plan

### `[Rule 1 — Bug] Task 1's pgTAP census instrument contradicted its own acceptance criterion`

- **Found during:** Task 1.
- **Issue:** the verify block counted every `FROM projects` in the pgTAP estate role-agnostically and
  required the answer 2; it measured **3** and exited 1. The acceptance criterion it was meant to
  assert is narrower — *"pgTAP assertions selecting `FROM projects` **under a non-postgres role**"*.
- **Diagnosis:** the third site is `00-helpers.test.sql:417` (`'Project A created'`), a fixture
  sanity assertion that runs as **postgres** — it sits before that file's first `set_test_user` call
  at `:439`, so it bypasses RLS entirely and is outside the blast radius by construction. M4 named
  only two sites and M4 was right; the instrument was wrong.
- **Fix:** replaced with a role-aware census that tracks the session role line by line. It reports
  `00-helpers:417 role=postgres`, `03-anon-read:458 role=anon`, `04-admin-crud:423 role=authenticated`
  — **2 non-postgres sites**, the criterion satisfied exactly. Written to
  `${TMPDIR}/162-04/pgtap-from-projects.txt`.
- **Files modified:** none (measurement only).

### `[Rule 1 — Bug] Task 3's and Task 4's hardening greps assert a string PostgreSQL does not emit`

- **Found during:** Task 3.
- **Issue:** both verify blocks `grep -qx '<name>|t|search_path='` over a `pg_proc` projection. On
  this tree PostgreSQL reports `proconfig` as **`search_path=""`** (with the quotes) and a
  `boolean || text` concatenation yields **`true`**, not `t`. The literal match can never succeed.
- **Fix:** asserted the substantive properties directly —
  `user_can|…|true|search_path=""`, `entity_project_id|…|true|search_path=""`,
  `grant_role_permissions|…|false|search_path=""`, `is_child_nominee|…|true|search_path=""`. Task 5's
  own instrument uses the correct `LIKE 'search_path=%'` prefix form and passed as written.
- **Files modified:** none.

### `[Rule 1 — Bug] Task 3's one-hunk gate cannot express "one policy's comment plus its predicate"`

- **Found during:** Task 3.
- **Issue:** `git diff --unified=0` reports **2** hunks for `302-rls.sql`, not 1. The policy's
  explanatory comment lives six unchanged lines above the predicate, so correcting it — it asserted
  `can_access_project OR account_admin OR super_admin`, a predicate that no longer exists — cannot be
  contiguous with the predicate change. Leaving a comment that describes deleted code in a security
  file was judged worse than missing the hunk count.
- **Fix:** substituted a **strictly stronger** measurement — parse both revisions into
  `CREATE POLICY` statements and compare them. Result: **80 statements before, 80 after; none added,
  none removed; exactly one changed (`authenticated_select_projects`); `admin_update_projects`
  byte-identical to base.** That is what the hunk count was proxying for, asserted directly.
- **Files modified:** none.

### `[Rule 3 — Blocking] 249 comment-hygiene violations blocked lint:check`

- **Found during:** Task 6.
- **Issue:** `yarn lint:check` failed on rule 2 (D-A4) of `scripts/assert-comment-hygiene.mjs`: a
  comment line ending without terminal punctuation whose next line continues the same span at the
  same indent must be one line. All 249 were in this plan's own five files (86 in
  `301-auth-functions.sql`, 86 in its regenerated mirror, 61 in `12-user-can.test.sql`, 12 in
  `00-helpers.test.sql`, 4 in `04-admin-crud.test.sql`); the rest of the tree was already at zero.
- **Fix:** joined with the sanctioned phase-152 instrument
  (`unwrap-comment-paragraphs.mjs --apply`) rather than by hand, because the standing guard's
  predicate is lifted verbatim from it and the two must not diverge. Its queue named only these five
  files, so nothing else in the tree moved. `00001_initial_schema.sql` was then **regenerated from
  `schema/`** rather than carrying the instrument's direct edit.
- **Files modified:** the five listed above. **Commit:** `ce9c79103`.

### `[Narration] The plan predicted the wrong seven tracer assertions would redden`

Not a defect, recorded so a later reader does not think the instrument moved. The plan's `<behavior>`
block names tests 2, 3, 4, 5, 7, 8 and 9 as the deny half that must redden against the
over-permissive stub. The measured set is **2, 3, 4, 5, 6, 7, 8** — the same **count (7)**, different
membership. Test 9 is structurally insensitive to `user_can`: it exercises `admin_update_projects`,
which still gates on `can_access_project`, so no `user_can` stub can move it. Test 6 carries the deny
direction through cardinality (`sees exactly their own project row`) and therefore reddens under
both stubs. The acceptance criterion — *"exactly the seven deny tests fail"* — holds as measured.

## Known Stubs

None. `grant_role_permissions` shipped as a deliberate one-permission subset inside task 3 (the
tracer's declared data incompleteness) and was completed in task 4, in this same plan; no stub
remains at plan close.

## Deferred Issues

Logged to `.planning/phases/162-permissions-auth-model-refactor/deferred-items.md`:

- Two pre-existing Splinter advisor **WARNINGs** from `yarn db:lint:sql` —
  `constituency_group_constituencies.constituency_id` and
  `election_constituency_groups.constituency_group_id` are foreign keys without indexes. Both are on
  join tables this plan does not touch; out of scope under the executor scope boundary.
  `db:lint:sql` exits **0** with `0 error(s), 2 warning(s)`.
- `.claude/skills/database/` still says "97 RLS policies", "24 schema files" and "11 pgTAP files /
  264 assertions". The real figures after this plan are **99 / 25 / 13 / 446**. Not corrected here
  because this plan's scope gate asserts that only its seven declared paths changed; it belongs to
  162-16/17's documentation close.

**⚠ Neither could be filed into `.planning/WINDOWS.md`.** `gsd-tools windows append` refuses both
entries with *"Ledger table … disagrees with the fenced JSON entries (the sole source of truth) in
its header or separator row (no data row differs from the expected rendering)"*. The corruption is
**pre-existing** — this plan never touched the file — and is confined to the rendered table's header
or separator, not to any data row. The tool's own guidance is to edit the fenced JSON directly or
discard the table edit and let it regenerate; hand-editing the rendered table is explicitly
forbidden, and repairing a cross-phase ledger that other phases write to is outside this plan's
scope gate. Ledger population is best-effort and does not block execution, so both items are
recorded here and in `deferred-items.md` instead. **Someone should repair `WINDOWS.md`'s header row
before `/gsd-ship`, because the ship gate reads that ledger.**

## Threat Flags

None. No new network endpoint, no new auth path, no new file access and no schema change at a trust
boundary beyond the four functions the `<threat_model>` already registers. `T-162-04-SC` is
discharged by measurement: no `package.json` dependency or devDependency line moved against the base
SHA.

## Verification

| Gate | Result |
|---|---|
| `yarn typecheck` | exit 0 — 23/23 tasks |
| `yarn lint:check` | exit 0 — parity current, grant enum guard 23/23/23, comment hygiene 0 violations |
| `yarn test:unit` | exit 0 — 25/25 tasks, 2,674+ assertions |
| `yarn workspace @openvaa/supabase test:db` | exit 0 — 13 files, 446 assertions, `Result: PASS` |
| `yarn db:lint:sql` | exit 0 — `0 error(s), 2 warning(s)` (both pre-existing, deferred above) |
| `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/162-04-wave1 --no-db-reset` | exit 0 — **155 passed, 0 failed, 0 did-not-run** |
| `SECURITY DEFINER` functions in `public` with an unpinned `search_path` | **NONE**, over 12 examined on the shipped schema and 13 including the test helper |
| `apps/supabase/supabase/migrations/*.sql` | **1** file |
| Diff vs base SHA `e0f590d3d` | exactly the 7 declared paths; nothing under `packages/dev-seed/`, `apps/supabase/supabase/seed.sql` or `tests/` |

**Code-review checklist** (`.agents/code-review-checklist.md`) checked against this diff:

- *General* — the changes solve PRESHIP-02's wave-1 slice; the OWASP item that bites here is A01
  broken access control, which is the whole subject and is mitigated by paired assertions plus two
  observed negative controls; A03 injection does not arise because no dynamic SQL is built from claim
  values and every cast is guarded by a literal-membership or regex test; no `any` (the only
  TypeScript is generated); the matrix appears once in source, and its duplicate in the test file is
  deliberate, since a test that re-derived it from the implementation would assert nothing; all four
  functions carry docblocks; no user-facing function, so no tracking events; `user_can` deliberately
  never raises and the docblock says why; no failing check; commit history linear (3 commits).
- *Supabase Backend* — no new content table, so the common-column, 5-policy, index and trigger items
  do not arise; the policy uses the `(SELECT fn(...))` scalar-subquery form and names
  `TO authenticated`; `user_can` reads `(SELECT auth.jwt() -> 'grants')`, one evaluation per query;
  all new `SECURITY DEFINER` functions set `search_path = ''` and call schema-qualified; the pgTAP
  file uses BEGIN/ROLLBACK and `create_test_data()`. `is_child_nominee`'s lookups are covered by the
  existing `idx_nominations_{candidate,organization,faction,alliance}_id` and
  `idx_nominations_parent_nomination_id` — checked, no index work needed.
- *One noted departure* — test 9 asserts the silent RLS denial with a bare `UPDATE` followed by
  `reset_role()` + `is()`, rather than the documented `lives_ok()` + `is()` pair, so that the
  read/write split is one assertion rather than two. The denial is still asserted by effect.
- *Not applicable* — Supabase Adapter, Edge Functions, Svelte components, WCAG and keyboard
  navigation: this plan changes no frontend or function code.

## The transitional window, measured rather than assumed

Between this plan and 162-06 **no real JWT carries a `grants` claim**, so the converted policy denies
every real authenticated caller of `public.projects`. Task 1 censused that population before touching
anything: **0** tracked-source readers on an authenticated Supabase client, **6** `from('projects')`
call sites across 3 files in `packages/dev-seed`, all on `supabaseAdminClient`, which uses the
`service_role` key and bypasses RLS entirely. The full E2E suite at task 6 is the second measurement
and it is green. The window closes in 162-06.

## Self-Check: PASSED

All created and modified files exist on disk; all three commit hashes resolve in `git log`.
