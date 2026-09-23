---
phase: 162-permissions-auth-model-refactor
plan: 11
subsystem: supabase-rls
status: complete
tags: [rls, permissions, user_can, app-settings, feedback, admin-jobs, pgtap]
requires:
  - '162-04 public.user_can(scope, target_id, permission)'
  - '162-08 public.project_open_for_voters(uuid)'
  - '162-09 admin_update_projects gated on project.edit_project_settings (the other half of § 11.1)'
  - '162-10 the entity tier, and the schema/ artefact this plan regenerates after'
provides:
  - 'seventeen converted policies on questions, question_categories, app_settings, feedback, admin_jobs'
  - 'the § 11.1 four-cell grid spanning app_settings and projects'
  - 'the synthetic project-editor identity, minted inside 22-content-policies.test.sql'
  - 'the structural policy-to-permission map over all seventeen'
  - 'feedback.project_id nullable + ON DELETE SET NULL, with the orphan reachable by the global-scope admin'
  - 'the admin_jobs -> project.edit_questions mapping (Q1 = a), for 162-17 and 162-SPEC.md'
affects:
  - '162-16 (D-11b: the published term is already gone from these predicates)'
  - '162-17 (the admin_ naming convention; .claude/skills/database/rls-policy-map.md; consolidating the synthetic editor)'
tech-stack:
  added: []
  patterns:
    - 'read predicate = user_can(project.read_structure) OR project_open_for_voters(project_id)'
    - 'write predicate = one user_can call at project scope naming the verb § 3.3 assigns'
    - 'orphan disjunct = project_id IS NULL AND user_can(global, NULL, <same verb>)'
key-files:
  created:
    - apps/supabase/supabase/tests/database/22-content-policies.test.sql
  modified:
    - apps/supabase/supabase/schema/302-rls.sql
    - apps/supabase/supabase/schema/107-feedback.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/tests/database/01-tenant-isolation.test.sql
    - apps/supabase/supabase/tests/database/04-admin-crud.test.sql
    - packages/supabase-types/src/database.ts
decisions:
  - 'Q1 = (a): all three admin_jobs policies take project.edit_questions (S-4, ticked 2026-09-16)'
  - 'Q2 = (a): both feedback INSERT policies stay ungated; the unbounded project id is accepted and recorded'
  - 'ASSUMPTION (overrulable): an orphaned feedback row is reachable by the global-scope admin and by nobody else'
metrics:
  duration: ~2h40m
  completed: 2026-09-17
actuals:
  tokens: 19646
  tasks: 7
  commits: 5
plan_head_before: 3d5d0870268f5500c7653e902806653d4f40f06b
---

# Phase 162 Plan 11: Content, Configuration, Feedback and Job Policies Summary

Seventeen policies on `questions`, `question_categories`, `app_settings`, `feedback` and `admin_jobs`
routed through `user_can`, and § 11.1's settings split turned from a sentence into a measured difference
between two identities across two tables — by minting the project editor that exists nowhere else in the
tree and watching its allow-case redden against the coextension that would have made the split a rename.

## The policy partition

Derived from `pg_policies` on a freshly reset database at Task 1 and again at Task 6. **It did not move.**

| Set | Size | Members |
|---|---|---|
| 162-08's `TO anon` SELECT policies, byte-identical | **3** | `anon_select_questions`, `anon_select_question_categories`, `anon_select_app_settings` |
| Converted here | **17** | 3 `authenticated_select_*`, 8 question/category/settings write policies, `admin_update_app_settings`, `admin_select_feedback`, `admin_delete_feedback`, 3 `admin_*_admin_jobs` |
| Deliberately ungated (Q2 = a) | **2** | `anon_insert_feedback`, `authenticated_insert_feedback` |
| **Sum** | **22** | equals the derived total, no policy unassigned |

`public` carries **86** policies in total (the plan's M-fact said 82; 86 is what the database holds).

## The collapse, before and after

| Figure | Before | After |
|---|---|---|
| distinct rules on the five tables (table qualifier normalised away) | **4** | **7** |
| largest single rule | **14 of 22** | **9 of 22** |
| distinct permission literals across the converted set | — | **5** |
| SELECT expression equal to an UPDATE/DELETE expression on the same table, over the FOUR tables the must_haves truth names | — | **0** |
| the same census over all FIVE tables | — | **1** |

**The one remaining pair is named and is ratified, not residue.** `admin_select_admin_jobs` equals
`admin_delete_admin_jobs`, because Q1 = (a) puts all three `admin_jobs` policies on
`project.edit_questions`. The enum has no read-shaped member whose holder set fits — the only one,
`project.read_structure`, is ✓ in all four entity columns and would disclose the operator's address and
the LLM prompt to every candidate in the project. The plan's own design section says so under *"Why
`admin_jobs` takes one verb for all three commands"*, and its `must_haves` truth names only `questions`,
`question_categories`, `app_settings` and `feedback`. Only the Task-6 gate overreached to five; it was
narrowed to the four and **both numbers are reported** rather than one of them quietly dropped.

## Task 2's answers

| Question | Answer | What followed |
|---|---|---|
| **Q1** — which § 3.2 member governs `admin_jobs` | **(a)**, ticked | `project.edit_questions` on all three policies. Holder set Root / Account / ProjAdmin / ProjEditor, ✗ in all four entity columns. One project editor wider than today; **no entity user gains read of `author`, `input`, `output` or `messages`.** The `acknowledged` line was not required — that is demanded only under Q1 = b. |
| **Q2** — the two `feedback` INSERT policies | **(a)**, unticked = recommended | Both stay `WITH CHECK (true)`, byte-identical. **Disposition recorded:** the unbounded project id is **accepted** (T-162-11-09), bounded in practice by `107-feedback.sql`'s per-IP rate-limit trigger and by the read policy being gated, so content is never publicly readable. |

Source: `162-CHECKPOINT-DECISIONS.md` § 1 item S-4 (ticked) and § 5 item P-4 (unticked), 2026-09-16.

## Task 2b — the operator's P-4 NOTE, and what the check found

> *Check that feedback has on delete set null for project_id instead of delete.*

Measured, this was **a change and not a confirmation**: `107-feedback.sql` declared
`project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE`. It needed **two**
statements, because `ON DELETE SET NULL` cannot fire into a `NOT NULL` column — the project delete would
raise rather than orphan the row.

**Shipped declaration:**

```sql
project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
```

**The red-first observation, taken before the schema was touched.** The retention assertions were run
against the pre-change cascade and observed **2 of 3 red**:

```
ok     1 - the feedback row exists before its project is deleted          <- the non-vacuity control
not ok 2 - the feedback row SURVIVES the deletion of its project          have: 0   want: 1
not ok 3 - and the surviving row carries a NULL project_id                (test result was NULL)
```

The control passing is what says the two failures were the cascade and not an empty instrument. After
the change, all three are green.

**⚠ ASSUMPTION, open to overrule in one edit.** Both surviving policies on `feedback` gate on
`project_id`, so a NULL makes each predicate NULL — which is not `true` — and an orphaned row would be
readable and deletable by **nobody**: invisible, undeletable ballast. Each predicate therefore carries a
second disjunct admitting the **global-scope admin** when `project_id IS NULL`:

```sql
(SELECT user_can ('project', project_id, 'feedback.read'))
OR (project_id IS NULL AND (SELECT user_can ('global', NULL::uuid, 'feedback.read')))
```

The note asks for retention and does not settle who may then read it. The global-scope admin is the
narrowest disposition that keeps the row reachable, introduces no enum member, and is one disjunct in
each of two predicates. **It is an assumption, not a ruling.** Asserted from both sides in § 12 of the
new test file: a project-scope grantee sees 0, the global-scope admin sees 1.

## The nine planted variants, every count measured estate-wide from raw TAP

`supabase test db` emits only a prove summary, so every count below comes from running the estate's files
through `psql` and counting `not ok` lines directly.

| Variant | Reddened | What it proves |
|---|---|---|
| Task 2b: the pre-change `ON DELETE CASCADE` | **2 of 3** | the retention assertion measures retention |
| `app_settings` UPDATE = `true` | **4** | the tracer grid measures denial |
| `app_settings` UPDATE = `false` | **6** | the tracer grid measures permission |
| **`project.edit_app_settings` → `project.edit_project_settings`** | **2** | **§ 11.1's split is load-bearing, not a rename** |
| read predicates: authority call only, no disjunct | **5** | the project-open arm is independently load-bearing |
| read predicates: disjunct only, no authority call | **4** | the authority arm is independently load-bearing |
| all thirteen write expressions = `true` | **28** | the write grid measures denial, in bulk |
| all thirteen write expressions = `false` | **19** | the write grid measures permission, in bulk |
| **`feedback.read` ↔ `feedback.manage` exchanged** | **behavioural 0 / structural 1** | **M6 measured, not argued** |

**The coextension swap reddened exactly two assertions** — the editor's allow-case on `app_settings` and
the structural one — against four for an always-true predicate. Every project-admin and candidate cell
stayed green, which is precisely the point: every identity `create_test_data()` carries answers
identically to both literals, and only the synthetic editor separates them.

**The two one-armed read variants redden DISJOINT cells** — cell 3 (non-grantee of an open project) for
the first, cell 4 (grantee of a *closed* project, criterion 5's second clause) for the second. That is
the strongest available statement that neither arm is doing the other's job.

**The feedback zero is the plan's most useful number.** Out of **920** behavioural assertions in the
estate — including the four written for exactly those two policies — **not one** can distinguish
`feedback.read` from `feedback.manage`. § 3.3 grants both to the same four roles and to none of the four
entity columns, so no identity in the matrix holds one and not the other. The structural map is the only
instrument that sees the difference, and the zero measures where the behavioural one stops.

## The new pgTAP file

`apps/supabase/supabase/tests/database/22-content-policies.test.sql`, declared **`plan (68)`**.

The ordinal was derived, not transcribed: 22 is the lowest two-digit prefix free of every existing file
**and** of every ordinal a sibling plan in this phase names for a file of its own, and it agrees with this
plan's frontmatter.

Estate: **921 assertions across 21 files**, up from 853 across 20. No existing assertion, description
string or declared `plan()` count changed anywhere.

## The runtime-caller finding

**E2E specs whose `feedback` read/delete or `admin_jobs` access is evaluated by row-level security: 0.**

One E2E file matches a text search — `tests/tests/utils/supabaseAdminClient.ts` — and it is a
**service-role** teardown client, which bypasses RLS entirely. So both tables' converted policies are
carried by the pgTAP pairs alone, which is why every one of them has a paired deny half whose caller is
`candidate_a`, an entity grantee of the *same* project.

The three readable tables are the opposite case and the E2E suite is a real instrument on them:
`get_questions` (`505-question-rpcs.sql`) is `SECURITY INVOKER`, and `_getAppSettings` reads
`app_settings` with `.single()`, so a predicate one term too narrow is a thrown error rather than an
empty render. `admin_update_questions` also has a live non-test caller: `merge_question_custom_data` is
`SECURITY INVOKER` and both admin job features reach it under the initiating admin's own bearer token.

## The E2E triple

```
155 passed (10.8m)
0 failed
0 did-not-run
e2e-run.sh: playwright exit 0
e2e-run.sh: preflight failures 0, successes 1
```

Run directory: `tests/e2e-runs/162-11-content-policies`. Headroom before the run: 69 GiB.

## Gates

`typecheck 0 | lint:check 0 | test:unit 0 | pgTAP 0 | db:lint:sql 0` — each read from its own exit status,
never through a pipe. `yarn assert:schema-migration-parity` green;
`apps/supabase/supabase/migrations/` holds exactly one `.sql` file; `prettier --check` green on every SQL
file touched. `301-auth-functions.sql`, `400-storage.sql`, `300-auth-tables.sql`, `00-helpers.test.sql`
and `10-schema-migrations.test.sql` are **byte-identical to the base SHA** `3d5d0870`. No dependency line
moved.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 — blocking] The fixture-polarity gate compared against the wrong rendering.**
- **Found during:** Task 1
- **Issue:** the gate asserted `project_a=t project_b=f`, but a boolean concatenated into text with `||`
  renders `true`/`false`; `t`/`f` is the *column* rendering under `psql -At`. The gate could never pass.
- **Fix:** accept either rendering. The measured polarity is `project_a=true project_b=false` — exactly
  what M8's three existing assertions need.
- **Commit:** none (Task 1 modifies no tracked file)

**2. [Rule 3 — blocking] The pgTAP ordinal derivation would have collided with a sibling plan.**
- **Found during:** Task 1
- **Issue:** "the lowest free two-digit prefix" over existing files alone returns **19**, which 162-10's
  plan names and 162-14 neighbours at 20 — and it contradicts this plan's own frontmatter
  (`22-content-policies.test.sql`).
- **Fix:** derive the lowest prefix free of existing files **and** of every ordinal named by another
  plan in this phase. That measures **22**, and the derivation is asserted equal to the frontmatter
  rather than the number being transcribed.

**3. [Rule 3 — blocking] Task 3's scope gate counted `CREATE POLICY` lines in the diff.**
- **Found during:** Task 3
- **Issue:** converting a predicate never touches the `CREATE POLICY` line, so the gate read **0** — and
  would read 0 for one conversion and for seventeen alike. `test "$TOUCHED" -le 1` cannot fail.
- **Fix:** count policies whose **expression** in `pg_policies` differs from the Task-1 census. Measured
  **1** at Task 3 and **4** at Task 4 (the tracer plus three reads), each asserted exactly.

**4. [Rule 3 — blocking] Task 3's `<behavior>` assigned four tests to variants that cannot reach them.**
- **Found during:** Task 3
- **Issue:** tests 1, 2, 5 and 7 are function-level asks of `user_can` and cross-table reads of
  `admin_update_projects`. A planted variant of the **`app_settings`** UPDATE policy cannot move them, so
  the stated `RT ≥ 4` / `RF ≥ 4` thresholds were unreachable from this file alone (3 and 3).
- **Fix:** measure the reddened count **estate-wide** rather than per-file. That is the better instrument
  and it is honest: the always-true run reddens `10-schema-migrations`' own `admin_b` control alongside
  this file's cells, reaching 4 and 6 legitimately.

**5. [Rule 1 — bug, found by the planted variant itself] Question INSERTs were missing `choices`.**
- **Found during:** Task 5
- **Issue:** `validate_question_choices` is a BEFORE trigger that raises `P0001` for a choice-type
  question with no `choices` array — **ahead of** the RLS `42501` the deny assertions are written
  against. Both the allow and the deny halves were measuring the wrong mechanism.
- **Fix:** every `INSERT INTO questions` in the file now carries the choices array `create_test_data()`
  uses.
- **Commit:** `98b7ca7ee`

**6. [Rule 1 — bug, found by the planted variant itself] Deny-side DELETEs aimed at referenced rows.**
- **Found during:** Task 5
- **Issue:** `candidate_a`'s delete of `question_category_a` was refused by RLS under the real predicate
  and by `questions_category_id_fkey` under an always-true one — **aborting the whole transaction** and
  truncating the variant run at 11 reds. The assertion passed under the real predicate for the right
  reason and would have passed under a wide-open one for the wrong one.
- **Fix:** every deny-side DELETE now targets its own unreferenced synthetic row (`efefefef-` prefix),
  which is the estate's own stated ordering rule. The `app_settings` tenancy cell moved from DELETE to
  UPDATE for the same class of reason: a DELETE there was observed to pass **from an empty table** once
  a preceding deny assertion had removed its target, and an INSERT would be answered by the `UNIQUE`
  constraint instead of the policy.
- **Commit:** `98b7ca7ee`

**7. [Rule 3 — blocking] D-18's "generated types unchanged" premise was invalidated by Task 2b.**
- **Found during:** Task 2b / Task 6
- **Issue:** the truth reads *"a **policy-only** change must not move a generated type"*. Task 2b — the
  operator's own addition — changes a column's nullability, so the plan is not policy-only. Asserting
  byte-identity would have blocked the instruction that produced it.
- **Fix:** the gate is **narrowed, not dropped**: the only changed lines in
  `packages/supabase-types/src/database.ts` must be `feedback.project_id`'s Row/Insert/Update
  nullability. **Measured: 3 changed lines, 0 of them anything else.**
- **Commit:** `b5910f211`

**8. [Rule 3 — blocking] Task 6's collapse census overreached past the ratified Q1 = (a).**
- **Found during:** Task 6
- **Issue:** the gate demanded zero SELECT-equals-UPDATE/DELETE pairs across **all five** tables. Q1 = (a)
  deliberately puts all three `admin_jobs` policies on one verb, so that gate and that ratified answer
  cannot both hold.
- **Fix:** the plan's own `must_haves` truth names only four tables and the design section states the
  `admin_jobs` exception explicitly — so the gate, not the answer, is what was too wide. Narrowed to the
  four, with **both** numbers reported (1 over five, 0 over four) and the surviving pair named.

**9. [Rule 3 — blocking, environment] `yarn db:reset` wedged twice on a storage 502.**
- **Found during:** Task 6
- **Issue:** the reset applied migrations and seeded but failed at `Restarting containers…` with
  `Error status 502`, leaving `storage.buckets` empty. Known local-stack flake, not a code defect.
- **Fix:** re-ran once the storage container reported healthy; both buckets created, reset exit 0. No
  source change.

### Deferred, by name

Nothing was fixed outside this plan's scope.

## Two named handoffs for 162-17

1. **The `admin_` prefix is now inaccurate on the `app_settings` block**, and on `admin_select_feedback` /
   `admin_delete_feedback`, because a project **editor** holds all three verbs. No policy was renamed: a
   naming convention over 80 policies is a phase-level decision, sibling plans are converting the rest
   against the names they have, and a unilateral rename would leave one file carrying two conventions.
2. **`.claude/skills/database/rls-policy-map.md` is staler by seventeen policies** and is deliberately not
   swept here — 162-12 through 162-16 each make it staler still, so sweeping it eight times is churn.

Also for 162-17: **the synthetic project editor now exists in two test files** — `cccccccc-…-0000000000a1`
in `17-project-structure-authority.test.sql` (162-09) and `cccccccc-…-0000000000e1` here — for the same
stated reason in both, that 162-06's reverse-completeness assertion forbids putting it in
`create_test_data()`. Consolidating it means amending that assertion in the same commit.

## `07-rpc-security.test.sql` § 10 — nothing to hand back to 162-08

M9 flagged § 10 as a possible unswept twin of § 9. **It was not red.** The estate was green at Task 1
(853 assertions, 20 files, exit 0) and stayed green through every task. No finding for 162-08.

## The inherited open item, stated rather than absorbed

162-10 left the entity-SELECT read cost at **6.37× anon / 7.31× authenticated** against a 2.0 budget,
caused by nested `SECURITY DEFINER` calls; it is recorded open in `WINDOWS.md` and is with the operator.
**No gate in this plan measures read cost**, so this plan neither improved nor worsened the recorded
figure, and it did not fail silently on it. The three read predicates written here add a second
`SECURITY DEFINER` call (`project_open_for_voters`) alongside `user_can` on the same disjunction pattern
162-09 already committed on the structure tables, so the same cost shape now covers three more tables —
worth naming for whoever picks that item up.

## Known Stubs

None. No stub, placeholder, skipped test or unrun `<verify>` was left behind.

## Threat Flags

None. No file created or modified here introduces security-relevant surface outside the plan's
`<threat_model>`. The one disposition that changed is recorded above under Task 2b: `feedback` rows now
survive their project, and the identity that may then read them is a stated assumption rather than a
ruling.

## Self-Check: PASSED

- `apps/supabase/supabase/tests/database/22-content-policies.test.sql` — FOUND
- `apps/supabase/supabase/schema/302-rls.sql` — FOUND
- `apps/supabase/supabase/schema/107-feedback.sql` — FOUND
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — FOUND
- commit `b5910f211` — FOUND
- commit `4d298662f` — FOUND
- commit `28359ef82` — FOUND
- commit `98b7ca7ee` — FOUND
- `git rev-list --count 3d5d0870..HEAD` — **5**: the four task commits listed above plus this
  SUMMARY's own `docs(162-11)` commit, which is the span 162-10 recorded the same way
