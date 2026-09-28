# Phase 162 — Consolidated Discussion Points

**Phase:** 162 — Permissions & Auth Model Refactor
**Requirement:** PRESHIP-02 · **Depends on:** Phases 156 (schema) and 161 (project scoping) — **both closed**
**The source document marks this phase _blocking ship_.** That mark is not overruled here.
**Purpose:** Pre-resolve every gray area K1–K4 left open, in one pass, so `/gsd-plan-phase 162` and
`/gsd-execute-phase 162` run without a per-area back-and-forth.

**How to read / fill:**

- Every decision lists its options as checkboxes. **Exactly one option per decision is marked `★ RECOMMENDED`.**
- **Leaving every box in a decision unchecked = choosing the `★ RECOMMENDED` option.** It is identical to
  checking that box. You never have to tick anything to accept a recommendation.
- **To overrule, tick a different option.** One box per decision; a ticked non-recommended box wins over the `★`.
- Add `**EDIT:**` / `**NOTE:**` lines under any option to qualify it, or write in a fresh option of your own —
  free text under a decision beats every box.
- **⚠ DECIDE** marks decisions that change the _shape_ of the work rather than an implementation detail. Skim
  for these first — there are **10**: A1, A2, A4, B1, B5, C3, D1, E1, F2, G1.

**Already locked — do not re-ask.** `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § K closed four
questions on 2026-08-29. They are carried forward as constraints on everything below:

| Ruling | What is locked |
|---|---|
| **K1 (a)** | **One rewrite with shims.** Introduce `grants` + `user_can(scope, uuid, verb)`; reimplement `has_role` and `can_access_project` as thin shims over it; migrate all 97 policies; **delete the shims before the phase closes.** Parallel-build-then-cutover and table-by-table are both rejected. |
| **K2 (a) + operator amendment** | Storage inherits `user_can` rather than getting a parallel mechanism. The deliverable is the **paired assertion**, and it is **per-verb**: storage policies must **honour the `verb` argument** so read can be granted while write is denied. One undifferentiated access assertion does not satisfy criterion 6. |
| **K3 (a)** | Per-project settings live as **typed enum-backed columns on `projects`**. JSONB blob and a separate `project_settings` table are both rejected. |
| **K4 (a)** | **Level-1 = editor minus editor-management**, defined in this phase's SPEC, then the candidate-registration and nomination-confirmation flows are checked against the matrix. |

**Grounding.** Every file below re-read this session at HEAD `440a7780f`, branch
`integration/ship-12-squash`, 2026-09-14. Citations are **content anchors** (policy names, function names,
column names) rather than line numbers, because the roadmap's own line citations have already gone stale —
see fact 2.

`.planning/ROADMAP.md` § Phase 162 · `.planning/REQUIREMENTS.md` PRESHIP-02 ·
`.planning/v2.15-DISCUSSION-POINTS.md` § K · `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § K ·
`PRE-SHIP-REFACTORING.md` § Permissions refactoring · `apps/supabase/README.md` (the dual-schema rule) ·
`apps/supabase/supabase/schema/{000-enums,100-tenancy,102-entities,104-nominations,300-auth-tables,301-auth-functions,302-rls,303-column-grants,400-storage,900-test-helpers}.sql` ·
`apps/supabase/supabase/migrations/00001…00008` · `apps/supabase/supabase/seed.sql` ·
`apps/supabase/supabase/tests/database/*.sql` · `apps/supabase/supabase/functions/invite-candidate/index.ts` ·
`apps/frontend/src/lib/auth/roles.ts` · `apps/frontend/src/lib/server/admin/requireAdminIdentity.ts` ·
`apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` · `.github/workflows/main.yaml`.

---

## 0. What is actually on the tree right now

Re-verified this session. **Facts 2, 3, 4, 5, 6, 7 and 11 are not in the roadmap entry, and four of them
contradict it.** They change the work.

| # | Fact | Evidence |
|---|---|---|
| 1 | **97 policies confirmed**, and the split is exactly as PRESHIP-02 states | `grep -c "CREATE POLICY"` → `302-rls.sql` **80**, `400-storage.sql` **15**, `300-auth-tables.sql` **2** = 97 |
| 2 | **`can_access_project` is called at 10 storage sites, not 11** — and every line number PRESHIP-02 cites (`:116,143,180,…`) is stale; Phase 156/163 reformatted the file | `grep -c "can_access_project *("` on `400-storage.sql` → **10**. The requirement lists 10 line numbers under the word "11". |
| 3 | **⚠ Criterion 6's premise is only half true. 7 of the 15 storage policies do NOT call `can_access_project`** — the whole `candidate_*` family re-derives ownership inline instead | `candidate_insert_public_assets`, `candidate_insert_private_assets`, `candidate_update_public_assets`, `candidate_update_private_assets`, `candidate_delete_public_assets`, `candidate_delete_private_assets` each carry `EXISTS (SELECT 1 FROM public.candidates c WHERE … c.auth_user_id = (SELECT auth.uid()))`; `anon_select_public_assets` is the eighth non-caller (legitimately — it reads `published`). So storage "follows table access by construction" for the **admin/select** half only. |
| 4 | **⚠ `is_candidate_self` is declared and NEVER CALLED.** Zero call sites anywhere. Every self-ownership check is inlined instead | `301-auth-functions.sql` defines it; the only other occurrences are doc comments in `302-rls.sql` / `301-auth-functions.sql` and the generated `packages/supabase-types/src/database.ts`. Inline re-derivations of `auth_user_id = (SELECT auth.uid())`: **6 in `302-rls.sql`** (`organizations` select/update, `candidates` select, `candidate_update_own` USING + WITH CHECK), **12 in `400-storage.sql`**. This is precisely the "scattered policies that each re-derive the rule" the phase exists to end, and it is not in the roadmap. |
| 5 | **⚠ `projects` has no `published` column.** Criterion 5's "a published project is readable by anyone" has nothing to read | `100-tenancy.sql` `CREATE TABLE public.projects` → `id, account_id, name, default_locale, created_at, updated_at`. `300-auth-tables.sql` adds `published` to **10 content tables** (elections, candidates, organizations, questions, question_categories, nominations, constituencies, constituency_groups, factions, alliances) — **not** to `projects` and not to `accounts`. |
| 6 | **⚠ `factions` and `alliances` have no `auth_user_id`.** Only `organizations` and `candidates` do. There is no way today to link a user to a faction or an alliance | `102-entities.sql` — `auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL` appears on `organizations` and `candidates` only. Criterion 1's entity scopes therefore include two entity types that have no existing user linkage at all. |
| 7 | **⚠ No suggestion / approval store exists.** Criterion 4's "suggest for approval" branch has nowhere to put a suggestion | The 19 tables in `schema/` are accounts, projects, elections, constituency_groups, constituencies, constituency_group_constituencies, election_constituency_groups, organizations, candidates, factions, alliances, nominations, question_categories, questions, app_settings, admin_jobs, feedback, user_roles, storage_config (+ `private.feedback_rate_limits`). `nominations.unconfirmed boolean` exists but is a **read filter** consumed by `get_nominations(p_include_unconfirmed)`, not an approval workflow. |
| 8 | **`grants`, `can_edit_project`, `user_can`, `is_child_nominee`: zero references each**, across `apps/` and `packages/` | Confirms the roadmap's fact 30. The phase starts from nothing on all four. |
| 9 | **The read/write collapse is live and is on `public.projects`** | `authenticated_select_projects` USING `can_access_project(id) OR has_role('account_admin','account',account_id) OR has_role('super_admin')`; `admin_update_projects` USING **and** WITH CHECK `can_access_project(id)`. The same predicate gates read and write. `can_edit_project` does not exist. |
| 10 | **The schema is stored twice and a gate enforces agreement** | `apps/supabase/README.md`: `migrations/` is applied, `schema/` is a read-only mirror (`config.toml` sets `schema_paths = []`). `yarn assert:schema-migration-parity` (link 12 of `yarn lint:check`) compares `cat schema/*.sql` against `migrations/00001_initial_schema.sql`. **Every change must land in both, in the same commit.** Migrations at HEAD: `00001`–`00008`. |
| 11 | **The JWT claim is `user_roles` and ~~four~~ **five** modules read it** (corrected 2026-09-16 — see `162-CONTEXT.md` D-25), two of them Deno Edge Functions | `custom_access_token_hook` writes `claims.user_roles`. Readers: `apps/frontend/src/lib/auth/roles.ts` (`readUserRoles`, `ADMIN_ROLES`, `CANDIDATE_ROLES`, `type UserRole = Enums<'user_role_type'>`), `…/dataWriter/supabaseDataWriter.ts`, `…/server/admin/requireAdminIdentity.ts`, `functions/invite-candidate/index.ts` (authorises on `super_admin` / `account_admin` / `project_admin`, then **inserts a `user_roles` row** with `role: 'candidate'`), and — **omitted from the original census** — `functions/send-email/index.ts`, which reads `payload.user_roles` straight from the JWT payload and gates **bulk send** on the same three roles. The fifth is an authorisation gate, not a display read: once the claim changes shape it reads `[]` and denies every admin. |
| 12 | **Column grants are global per-role and cannot be per-project** | `303-column-grants.sql` does `REVOKE UPDATE … FROM authenticated` then `GRANT UPDATE (…cols…) … TO authenticated`. A per-project self-edit switch (criterion 4) therefore **cannot** be expressed here — it has to live in RLS `USING`/`WITH CHECK`, with column grants staying as the coarse outer bound. |
| 13 | **No admin UI exists for entity data or for editor management** | The admin app is `argument-condensation`, `question-info`, `jobs` and `login` only (`apps/frontend/src/routes/admin/`). "Owner can manage editors" has no surface to be built on. |
| 14 | **Test estate:** pgTAP 12 files / 7169 lines, run in CI; E2E 43 spec files | `apps/supabase/supabase/tests/database/00…11`, `.github/workflows/main.yaml` step "Run pgTAP tests" → `supabase test db`. `find tests -name "*.spec.ts"` → 43. The **E2E cardinal rule** applies to every commit of this phase. |
| 15 | **RPCs are almost all `SECURITY INVOKER`**, so RLS is genuinely the boundary | `bulk_import`, `bulk_delete`, `_bulk_upsert_record`, `resolve_external_ref`, `merge_question_custom_data`, `merge_jsonb_column`, `get_nominations`, `get_questions`, `get_candidate_user_data`, `upsert_answers` — all INVOKER. Only the two `502-email-helpers.sql` functions are `SECURITY DEFINER`. |

### 0.1 — Is this table the phase's factual baseline?

- [ ] **(a) Accept all 15 facts; the planner works from them, and CONTEXT.md restates facts 2–7 and 11–13**
      — ★ RECOMMENDED — facts 3, 4, 5, 6 and 7 each invalidate or extend a stated criterion, and if they are
      not carried into CONTEXT.md the planner will re-derive the roadmap's wrong premises instead.
- [ ] **(b) Accept, but a fact is wrong or incomplete** — annotate it below and I re-verify before planning.

### 0.2 — Correct the ROADMAP / REQUIREMENTS entries for facts 2, 3, 5, 6 and 7?

PRESHIP-02 and the ROADMAP entry both assert "11 sites" (fact 2), assert storage already follows table
access (fact 3, half-wrong), and presuppose a published project, a faction/alliance user link and a
suggestion store that do not exist (facts 5, 6, 7).

- [ ] **(a) Correct both entries in-phase, in the phase's first commit, with a dated "Corrected 2026-09-14"
      note in the house style** — ★ RECOMMENDED — matches how 155/156/161/163 corrected their own entries;
      leaving a measured-false premise in a **blocking-ship** requirement is how the wrong thing gets built.
- [ ] **(b) Leave the entries; record the corrections in CONTEXT.md only** — smaller diff; the requirement
      keeps asserting things the tree disproves, and the next reader of PRESHIP-02 is misled.

---

## A. Scope boundary

### A1 ⚠ DECIDE — Is Phase 162 database-only, or does it also build UI?

Fact 13: there is **no** admin UI for entity data or editor management. Criterion 1's "owner manages
editors" and criterion 4's "suggest for approval" both imply a surface that does not exist. Every one of
the seven success criteria is, as written, satisfiable at the database + test layer.

- [ ] **(a) Database-only: schema, RLS, predicates, per-project settings, pgTAP, plus the SPEC flow-check.
      No new Svelte routes or components.** — ★ RECOMMENDED — all seven criteria are DB-shaped; the admin
      app has no data-editing surface to extend, so any UI here would be greenfield work on a phase that is
      already a 97-policy rewrite. UI lands when an admin data app is built.
- [ ] **(b) Database + a minimal editor-management UI under `/admin`** — makes criterion 1 exercisable by a
      human; adds a greenfield admin surface (routes, forms, server actions, E2E) to the largest security
      refactor in the milestone.
- [ ] **(c) Database + the candidate-side "suggest an edit" UI** — makes criterion 4's middle branch visible
      to a candidate; same objection, and it presumes C3 resolves toward building the suggestion store.

### A2 ⚠ DECIDE — Does the rewrite reach the JWT claim and its four readers?

Fact 11: `custom_access_token_hook` writes `claims.user_roles`, shaped `{role, scope_type, scope_id}`.
Four modules read it, and `roles.ts` derives `type UserRole = Enums<'user_role_type'>` so a vocabulary
change is a **compile error** there rather than a silent mismatch. `invite-candidate` both reads the claim
and writes a `user_roles` row.

- [ ] **(a) Yes — the hook emits `grants` (shaped `{role, scope, target_type, target_id}`), and all four
      readers plus `invite-candidate`'s write are updated in the same phase** — ★ RECOMMENDED — K1 forbids
      ending the phase with two mechanisms, and a `user_roles` claim outliving the `user_roles` table is
      exactly that. The `satisfies ReadonlyArray<UserRole>` in `roles.ts` turns the vocabulary change into
      a compile error, so the blast radius is bounded and visible.
- [ ] **(b) Keep the claim named and shaped `user_roles`, populated from `grants`** — zero frontend diff and
      no Edge Function change; leaves a permanent translation layer between the table and the claim, which
      is the "each re-derives the rule" defect one level up.
- [ ] **(c) Claim carries both keys for the phase's duration, `user_roles` dropped at the end** — safest
      intermediate states; a third shim to remember to delete, on top of K1's two.

### A3 — Fold the 18 inline `auth_user_id = auth.uid()` re-derivations into `user_can`, and delete `is_candidate_self`?

Fact 4: 6 inline sites in `302-rls.sql`, 12 in `400-storage.sql`, and the helper that exists to replace
them has never been called.

- [ ] **(a) Yes — every self-ownership check routes through `user_can('entity', <entity_id>, verb)`, and
      `is_candidate_self` is dropped (not shimmed — it has no callers to keep green)** — ★ RECOMMENDED —
      this is the phase's own thesis applied to the case that most obviously violates it, and it is the
      only way criterion 1's `owner`/`editor` distinction can reach a candidate's own row at all.
- [ ] **(b) Route `302-rls.sql`'s 6 sites; leave storage's 12 to A4** — smaller; splits one rule across two
      decisions and risks storage keeping the inline form if A4 goes the other way.
- [ ] **(c) Keep `is_candidate_self`, implemented over `grants`, and call it from all 18 sites** — a smaller
      conceptual change; keeps a second predicate whose job `user_can` already does, which K1 rules against.

### A4 ⚠ DECIDE — Criterion 6's premise is wrong for the 7 `candidate_*` storage policies. Widen it?

Fact 3. K2 assumed storage already follows table access by construction and that only the **assertion** was
missing. That holds for `admin_*` and `authenticated_select_*`; it is false for the `candidate_*` family,
which is a parallel implementation in exactly the sense criterion 6 forbids.

- [x] **(a) Widen criterion 6: all 15 storage policies route through `user_can(scope, uuid, verb)`, the 7
      `candidate_*` policies included** — ★ RECOMMENDED — K2's amendment already requires storage to honour
      `verb`, and a policy that inlines `auth_user_id = auth.uid()` cannot honour a verb at all. Leaving
      them means the per-verb paired assertion passes on the 8 policies that were never the problem.
- [ ] **(b) Keep criterion 6 literal — assertion only, on the sites that already call the predicate** —
      matches K2 as written and is much smaller; ships a phase whose stated goal ("one mechanism, not a
      parallel implementation") is measurably unmet in `400-storage.sql`.
- [ ] **(c) Widen, but route the 7 through the shimmed `is_candidate_self` instead** — a smaller diff than
      (a); contradicts A3 and leaves a predicate K1 wants deleted.

**NOTE**: Also generalise the coverage so that there is a public bucket for each entity type and write access is paired with "can edit answers( entity_type, entity_id)". This kind of generalisation should be applied as widely as possible.

### A5 — Explicitly out of scope

Named so the planner does not absorb them:

- [ ] **(a) Out: any new admin/candidate UI (subject to A1); `packages/data` model changes; the
      `argument-condensation` and `question-info` job surfaces; the bank-auth / OIDC identity path;
      anything in `PRE-SHIP-REFACTORING.md` outside § Permissions refactoring** — ★ RECOMMENDED.
- [ ] **(b) Something in that list belongs in 162** — name it below.

---

## B. The grants model

### B1 ⚠ DECIDE — Does `grants` replace `user_roles`, or sit alongside it?

Fact 8 (`grants` does not exist) + K1 ("delete the shims before the phase closes"). `user_roles` is read by
the access-token hook, written by `invite-candidate` and `seed.sql`, and is `REVOKE`d from `authenticated`
with two policies of its own (2 of the 97).

- [ ] **(a) `grants` replaces it. `user_roles` rows are migrated, its 2 policies are re-expressed on
      `grants`, and the table is DROPPED before the phase closes** — ★ RECOMMENDED — K1's ruling is about
      ending in one mechanism, and a surviving `user_roles` table is a second one regardless of whether
      anything reads it. The drop is what makes the 97 → N policy count honest.
- [ ] **(b) `grants` is added; `user_roles` becomes a view over it** — every existing reader keeps working
      untouched; a view is a permanent shim, which is the state K1 rejects.
- [ ] **(c) `grants` is added; `user_roles` is left in place, unused and marked deprecated** — smallest
      migration risk; leaves a live, `service_role`-writable permissions table nothing governs. On a
      blocking-ship security surface this is the worst of the three.

### B2 — Role and scope vocabulary

Today: `user_role_type` = `candidate | organization | project_admin | account_admin | super_admin`;
`role_scope_type` = `candidate | organization | project | account | global`. PRE-SHIP specifies roles
`admin | owner | editor` and scopes `global | account | project | entity`. `entity_type` already exists as
`candidate | organization | faction | alliance`.

- [ ] **(a) New enums `grant_role_type` (`admin`,`owner`,`editor`) and `grant_scope_type`
      (`global`,`account`,`project`,`entity`); reuse the existing `entity_type` for the target
      discriminator; drop `user_role_type` and `role_scope_type` with `user_roles`** — ★ RECOMMENDED — new
      names make every stale reference a hard error rather than a quietly-wrong enum member, `entity_type`
      is already the vocabulary the nominations table generates, and `roles.ts` picks the change up through
      `Enums<…>` at compile time.
- [ ] **(b) Redefine the existing `user_role_type` / `role_scope_type` in place with the new members** —
      no generated-type churn beyond the members; an in-place enum rewrite on a type used by a live table is
      a fiddlier migration than creating two new types, and stale spellings fail silently where they are
      compared as text.
- [ ] **(c) Keep the five current roles and add scope columns around them** — smallest diff; abandons the
      admin/owner/editor matrix criterion 1 requires.

### B3 — One `entity` scope with a discriminator, or four entity scopes?

PRE-SHIP nests alliance / faction / organization / candidate under "entities" with identical
`owner`/`editor` roles.

- [ ] **(a) One `entity` scope, plus a `target_type entity_type` column, NULL for non-entity scopes; the
      key is `(user_id, scope, target_type, target_id, role)`** — ★ RECOMMENDED — the four behave
      identically, `entity_type` already exists, and `user_can('entity', id, verb)` stays a single call
      shape. A CHECK constraint ties `target_type IS NOT NULL` to `scope = 'entity'`.
- [ ] **(b) Four separate scope members (`alliance`,`faction`,`organization`,`candidate`)** — reads closer
      to the PRE-SHIP outline and needs no discriminator column; every caller and every policy has to know
      which of the four it is looking at, and `is_child_nominee` spans them anyway.

### B4 — What are the verbs of `user_can(scope, uuid, verb)`?

Criterion 1 needs owner-vs-editor (editor management). Criterion 2 needs read-vs-edit. K2's amendment needs
storage to separate read from write.

- [ ] **(a) An enum `grant_verb` with three members: `read`, `edit`, `manage_editors`** — ★ RECOMMENDED —
      three verbs cover all three requirements exactly, `manage_editors` is what distinguishes `owner` from
      `editor` by definition, and a typed enum keeps a misspelled verb from silently returning false.
- [ ] **(b) Two verbs, `read` and `write`; editor management is a separate predicate** — simpler signature;
      splits criterion 1's one distinction back out into a second mechanism.
- [ ] **(c) Four verbs, adding `delete`** — finer control over destructive operations; nothing in the seven
      criteria distinguishes delete from edit, so it is untested surface.

**NOTE**: Overriden in implementation plan.

### B5 ⚠ DECIDE — Does `user_can` read the JWT claim, or query the `grants` table?

Today's `has_role` and `can_access_project` both read `auth.jwt() -> 'user_roles'` and never touch a table
(except `can_access_project`'s one `projects` lookup for the account hop). A grant revoked mid-session is
therefore invisible until the token refreshes. The hierarchy predicates (`is_child_nominee`, "admin does
anything to the object **and its descendants**", criterion 5's "entities … and their parents") require
table lookups regardless.

- [ ] **(a) Hybrid: the grant set comes from the JWT claim (as today); hierarchy and descendant resolution
      query `nominations` / `projects`. The staleness window is documented and is unchanged from today.**
      — ★ RECOMMENDED — preserves the current performance profile across all 97 policies, changes no
      security property that is true today, and puts table reads only where a claim cannot answer the
      question anyway.
- [ ] **(b) Always query `grants`** — a revocation takes effect immediately and the claim stops being a
      cache that can disagree with the table; adds an indexed lookup to every policy evaluation on the
      hottest path, and the access-token hook then has no reason to exist.
- [ ] **(c) Claim-only, with hierarchy denormalised into the claim** — fastest; the claim grows with the
      nomination tree and goes stale on every nomination edit, not just on grant changes.

### B6 — Migration mapping from `user_roles` to `grants`

Proposed, for the seed's two rows and any real data:

| `user_roles` | → `grants` |
|---|---|
| `super_admin` / `global` / NULL | `(global, NULL, NULL, admin)` |
| `account_admin` / `account` / `<account_id>` | `(account, NULL, <account_id>, admin)` |
| `project_admin` / `project` / `<project_id>` | `(project, NULL, <project_id>, admin)` |
| `candidate` / `candidate` / `<candidate_id>` | `(entity, candidate, <candidate_id>, owner)` |
| `organization` / `organization` / `<org_id>` | `(entity, organization, <org_id>, owner)` |

Plus: **backfill from `auth_user_id`** — every `candidates.auth_user_id IS NOT NULL` and
`organizations.auth_user_id IS NOT NULL` row that has no matching `user_roles` row gets an `owner` grant,
so fact 4's inline checks lose nothing when A3 removes them.

- [ ] **(a) Accept the mapping and the `auth_user_id` backfill** — ★ RECOMMENDED — without the backfill,
      folding the 18 inline checks into `user_can` silently revokes access from any self-editing entity
      whose grant was only ever implied by the FK column.
- [ ] **(b) Mapping only, no backfill** — relies on `user_roles` being complete; fact 4 shows the inline
      checks never consulted it, so completeness has never been enforced.
- [ ] **(c) A row differs from the table above** — correct it below.

### B7 — Does `auth_user_id` survive on `candidates` / `organizations`?

Once grants carry the linkage, the FK column's only remaining job is identity lookup at
registration/invite time.

- [ ] **(a) Keep both columns; `grants` becomes the authorisation source and `auth_user_id` stays as the
      identity link the invite and identity-callback flows write** — ★ RECOMMENDED — `invite-candidate` and
      `identity-callback` both write it, and removing a column two Edge Functions depend on is scope this
      phase does not need. It stops being read by any **policy**, which is the part that matters.
- [ ] **(b) Drop `auth_user_id` after the backfill; the flows write a grant instead** — one linkage, not
      two; touches both Edge Functions and the candidate registration path on a blocking-ship phase.
- [ ] **(c) Keep it and add matching columns to `factions` / `alliances` (fact 6)** — symmetry; adds
      columns nothing reads, since grants supply that linkage.

---

## C. Per-project settings (K3 locked: typed enum columns on `projects`)

### C1 — Which columns, and which members?

Derived from PRE-SHIP § Intro "Special permissions TBA". Proposed:

| Column | Enum | Members |
|---|---|---|
| `candidate_self_edit` | `self_edit_mode` | `free` · `suggest` · `none` |
| `candidate_nomination_edit` | `nomination_edit_mode` | `free` · `suggest` · `none` |
| `organization_nomination_edit` | `nomination_edit_mode` | `free` · `suggest` · `none` |
| `alliance_nomination_edit` | `nomination_edit_mode` | `free` · `suggest` · `none` |
| `parent_approval_required` | `boolean` | change naming a parent entity needs the parent's approval |
| `child_approval_required` | `boolean` | change naming a child entity needs the child's approval |
| `invite_by_email_enabled` | `boolean` | an organization/alliance owner may invite a new entity by e-mail |

- [ ] **(a) Accept these 7 columns and 2 enums** — ★ RECOMMENDED — one column per branch PRE-SHIP names,
      each individually testable, and the three `*_nomination_edit` columns share one enum so the three
      actor types cannot drift apart.
- [ ] **(b) Collapse the three `*_nomination_edit` columns into one project-wide `nomination_edit`** —
      three fewer columns; PRE-SHIP distinguishes candidate, organization and alliance behaviour explicitly,
      so this under-expresses the requirement.
- [ ] **(c) A different column set** — write it below.

**Overiden in implementation plan. The approvals path is dropped completely.**

### C2 — Defaults for existing projects

The seeded project and every E2E project must keep behaving exactly as they do today, or the 43-spec suite
and the pgTAP estate both move under this phase. Today: `candidate_update_own` lets a candidate update
their own row freely; nothing lets a candidate edit nominations.

- [ ] **(a) Column defaults reproduce today's behaviour: `candidate_self_edit = 'free'`, all three
      `*_nomination_edit = 'none'`, all three booleans `false`; the migration backfills existing rows to the
      same values** — ★ RECOMMENDED — the phase then changes *what is expressible*, not *what happens*, so
      any E2E or pgTAP movement is a genuine regression rather than a settings change.
- [ ] **(b) Default to the most restrictive setting everywhere (`none` / `false`)** — safest posture for a
      new deployment; flips candidate self-edit off and takes `02-candidate-self-edit.test.sql` and the
      candidate E2E specs red for a reason unrelated to the refactor.
- [ ] **(c) NOT NULL with no default; every project must state its policy** — forces an explicit choice;
      breaks `bulk_import` and every project-creating path, including the E2E per-project creation Phase 161
      just built.

### C3 ⚠ DECIDE — The `suggest` branch has no store (fact 7). What does 162 build?

PRESHIP-02 requires **each branch exercised by a test**, and the phase is blocking ship. `free` and `none`
are expressible in RLS today. `suggest` is not — there is nowhere to put a pending change.

- [ ] **(a) Build the store and the routing in-phase, no UI: a `change_suggestions` table (target table +
      row id + proposed JSONB patch + submitter + status + approver), its RLS, and `approve`/`reject` RPCs.
      Each of the three branches is then exercised by pgTAP.** — ★ RECOMMENDED — it is the smallest thing
      that makes criterion 4 true as written, it stays inside A1(a)'s database-only boundary, and
      `merge_jsonb_column` / `jsonb_recursive_merge` (`900-test-helpers.sql`) already supply the patch-apply
      mechanism, so this is a table plus policies rather than a new subsystem.
- [ ] **(b) Ship the settings columns including the `suggest` member, but implement `suggest` as `none`
      (deny) for now, with the store deferred to a follow-up phase** — much smaller; leaves a blocking-ship
      criterion partially unmet and an enum member that lies about what the database does.
- [x] **(c) Narrow criterion 4 to the two expressible branches and drop `suggest` from the enums** —
      honest about what ships and leaves no lying member; overrules a requirement the source document marks
      blocking ship, so it needs an explicit operator ruling recorded against PRESHIP-02.
- [ ] **(d) Build the store AND the candidate-side UI** — the feature is actually usable end to end; this
      is A1(c) and adds greenfield frontend to the largest refactor in the milestone.

### C4 — Where do the settings get read?

- [ ] **(a) Inside the RLS policies' `USING` / `WITH CHECK`, via a `SECURITY DEFINER` helper
      `project_setting(<project_id>, <setting>)` so the policy text stays readable and the lookup is
      declared once** — ★ RECOMMENDED — K3 chose typed columns precisely so policies can read them;
      a single named helper keeps the 97 policies from each embedding the same sub-select.
- [ ] **(b) Read the columns directly in each policy** — no extra function; re-derives the same join in
      every policy that needs it, which is the defect the phase exists to remove.

---

## D. Read grants (criterion 5)

### D1 ⚠ DECIDE — "A published project is readable by anyone" — but `projects.published` does not exist (fact 5).

Today's anon reads are per-row: `anon_select_elections USING (published = true)` and nine siblings.

- [ ] **(a) Add `projects.published boolean NOT NULL DEFAULT false`, migrate existing rows to `true`, and
      make it the outer gate the ten per-row `published` flags sit inside** — ★ RECOMMENDED — criterion 5 is
      stated at project granularity and there is no project-level flag to read; deriving one turns every
      anon policy into a join. Backfilling existing rows to `true` is what keeps the seeded project and the
      E2E projects readable (see D2).
- [ ] **(b) Define "published project" as derived — a project with at least one published election** — adds
      no column; puts an `EXISTS` sub-select inside every anon policy on the hottest read path in the app,
      and makes publication an emergent property nobody can set directly.
- [ ] **(c) Treat the existing per-row `published` flags as already satisfying criterion 5** — zero work;
      criterion 5 then means something different from what it says, and the unpublished-project half of it
      has no anchor at all.

### D2 — Backfill value for `projects.published`

- [ ] **(a) `DEFAULT false` for new projects, but the migration sets **all existing rows** to `true`** —
      ★ RECOMMENDED — a new project should not be world-readable the moment it is created, while every
      project that exists today is already being read anonymously and must keep being read. Phase 161's
      E2E per-project creation path must set it explicitly — that is a one-line change in the seeding
      helper, and leaving it out takes the whole voter suite red in a way that names the cause.
- [ ] **(b) `DEFAULT true`** — nothing anywhere needs changing; every project ever created is public by
      default, which is the wrong default for a security refactor.
- [ ] **(c) `DEFAULT false` and set the seed + E2E projects explicitly, no blanket backfill** — most
      explicit; any real project in a deployed database silently goes dark on migration.


**No backfills for any data**

### D3 — The unpublished-project read rule

PRE-SHIP: "a non-published project's non-entities are readable by any user with a grant in it; entities are
readable by the grantees themselves and their parents." "Parents" is `is_child_nominee`.

- [ ] **(a) Implement exactly as written: non-entity tables gate on "any grant in this project"; the four
      entity tables gate on "own grant OR `is_child_nominee(<my entity>, <row entity>)`"** —
      ★ RECOMMENDED — it is the documented rule, and it makes `is_child_nominee` load-bearing for reads
      rather than only for writes, which is what criterion 3's "used wherever policy allows that control"
      asks for.
- [ ] **(b) Any grant in the project reads everything in it, entities included** — far simpler and much
      cheaper; discards the entity-level read restriction the source document states.

### D4 — `is_child_nominee` semantics

PRE-SHIP: "if `p_child_entity` is in any nominations where `p_parent_entity` is the parent". `nominations`
has `parent_nomination_id` and four entity FK columns.

- [ ] **(a) Direct parent only — one hop through `parent_nomination_id`** — ★ RECOMMENDED — it is what the
      source defines, it matches the trigger-enforced hierarchy in `104-nominations.sql`
      (alliance → organization → faction → candidate), and a recursive form on a table with no depth bound
      inside 97 policies is a performance hazard nothing has asked for.
- [ ] **(b) Transitive — an alliance is a "parent" of a candidate two hops down** — matches "admin does
      anything to the object **and its descendants**"; needs a recursive CTE inside a policy predicate.
- [ ] **(c) Direct by default, with a separate transitive predicate used only where criterion 1's descendant
      rule requires it** — expresses both; two predicates where the source names one.

---

## E. Migration mechanics

### E1 ⚠ DECIDE — One migration, or a sequence?

Fact 10: every change lands in **both** `schema/*.sql` and a new `migrations/000NN`, with
`yarn assert:schema-migration-parity` gating agreement. HEAD is at `00008`. K1 mandates a shim lifecycle
(introduce → shim → migrate 97 policies → delete shims), and the **E2E cardinal rule** means every commit
must be green.

- [ ] **(a) A sequence of ~6 migrations mirroring the shim lifecycle — `00009` grants table + enums +
      `user_can`; `00010` shims over `has_role`/`can_access_project` + data migration + backfill; `00011`
      the 80 `302-rls.sql` policies; `00012` the 15 storage policies; `00013` per-project settings (+ the
      suggestion store, subject to C3); `00014` delete the shims, drop `user_roles`. Each carries its
      `-- Applies to schema files:` header and re-baselines parity in the same commit.** —
      ★ RECOMMENDED — it is the only shape under which each of K1's stages is independently green and
      revertible, each migration is reviewable on its own, and a failure localises to one stage instead of
      to a 2000-line file.
- [ ] **(b) One migration `00009` containing the whole rewrite** — a single atomic cutover with no
      intermediate state to reason about; unreviewable, unrevertible in parts, and incompatible with K1's
      "keeps every intermediate commit green".
- [x] **(c) Rewrite `00001_initial_schema.sql` in place** — the cleanest end state; destroys the applied
      history every deployed database has run, which the README's dual-schema contract forbids.

### E2 — Parity gate re-baselining

`apps/supabase/scripts/schema-migration-parity.expected.txt` holds the reviewed signature.

- [ ] **(a) Re-baseline in the same commit as each migration, with the fixture diff read and summarised in
      that commit's message** — ★ RECOMMENDED — the README says to read the diff before committing; a
      six-migration phase that re-baselines once at the end cannot attribute a drift to a stage.
- [ ] **(b) Re-baseline once at the end of the phase** — one fixture diff to review; the gate is
      effectively off for the duration of the largest schema change in the repo's history.

### E3 — `yarn db:types` regeneration

- [ ] **(a) Regenerate `packages/supabase-types/` after each migration that changes a type or table, in the
      same commit** — ★ RECOMMENDED — `roles.ts` derives `UserRole` from the generated enum, so the
      compile error that A2 relies on only appears once the types are regenerated.
- [ ] **(b) Regenerate once at the end** — fewer generated-file diffs; the frontend compiles against a
      stale enum for most of the phase, hiding exactly the errors A2 wants surfaced early.

---

## F. Tests, gates and evidence

### F1 — Which layer proves what?

- [ ] **(a) pgTAP is the primary proof for every policy-level criterion (1, 2, 3, 5, 6); the existing
      43-spec E2E suite is the regression gate that must stay green; unit tests cover the frontend claim
      readers under A2** — ★ RECOMMENDED — policy semantics are only observable at the database, pgTAP
      already runs in CI (`supabase test db`), and the E2E suite is the cardinal-rule instrument.
- [ ] **(b) Drive the criteria from E2E** — proves it end to end through the real client; E2E cannot
      distinguish "denied by RLS" from "not rendered", which is the exact distinction criterion 2 rests on.

### F2 ⚠ DECIDE — How is criterion 2's "fails if the two collapse back into one predicate" mechanised?

Fact 9 locates the live collapse on `public.projects` (`authenticated_select_projects` vs
`admin_update_projects`). Note that criterion 2's illustrative sentence — "a candidate can read the
project's elections and cannot edit them" — is **already true today by accident**, because a candidate holds
no project-scoped role at all; a behavioural test on a candidate would therefore pass against the current,
collapsed schema. The test has to be run as a **project-scoped `editor`** to have any force.

- [ ] **(a) Both halves: (i) a behavioural pgTAP test run as a project-scoped `editor` — reads elections,
      is denied UPDATE — and (ii) a structural guard in `apps/supabase/scripts/lint-schema.mjs` asserting
      `can_edit_project` exists and is not definitionally equal to `can_access_project`, plus that no
      policy pair on one table uses the identical predicate for SELECT and UPDATE** — ★ RECOMMENDED — the
      behavioural half proves the semantics, the structural half is what actually "fails if they collapse
      back", and `lint:schema` is already wired into `yarn db:lint:sql` in CI.
- [ ] **(b) Behavioural pgTAP only** — simpler and closer to the criterion's wording; a future refactor can
      re-collapse the predicates and still pass, because `read` and `edit` happen to agree for the roles the
      test uses.
- [ ] **(c) Structural guard only** — cheap and directly enforces non-collapse; proves nothing about what a
      real principal can actually do.

### F3 — The per-verb storage paired assertion (K2's amendment)

- [ ] **(a) Two separate observations in `06-storage-rls.test.sql`: a principal denied SELECT on an entity's
      row is denied `storage.objects` SELECT for that entity's folder; a principal denied UPDATE on the row
      is denied storage INSERT/UPDATE/DELETE for that folder — **and** a principal granted read-but-not-write
      is observed reading the object and failing to write it** — ★ RECOMMENDED — the third case is the one
      that fails if `verb` is accepted and then discarded, which is precisely what the amendment guards.
- [ ] **(b) The two denial observations only** — matches the amendment's literal text; both pass on a
      storage policy that ignores `verb` and denies everything to a non-grantee.

### F4 — Negative-control ledger

The milestone's standing rule (F-140-01, and 161's practice) is that a new guard must be **observed
failing**, not merely observed passing.

- [ ] **(a) A `162-NEGATIVE-CONTROL-LEDGER.md` with one row per new guard — the structural
      `can_edit_project` guard, the per-verb storage assertions, each of the three C1 settings branches,
      `is_child_nominee`, and the read-grant rules — each showing the planted violation, the observed red,
      and the restored-tree proof** — ★ RECOMMENDED — it is the milestone's established acceptance standard
      and this is its highest-stakes application.
- [ ] **(b) Ledger for the structural guard and the storage assertions only** — covers the two genuinely
      new mechanisms; leaves the settings branches asserted only in the passing direction.
- [ ] **(c) No ledger; the pgTAP suite is the evidence** — least overhead; breaks with the standard every
      phase since 140 has met.

### F5 — The E2E cardinal rule during a 97-policy rewrite

- [ ] **(a) Full-suite `tests/scripts/e2e-run.sh` at each of E1's migration boundaries (≈6 runs), plus a
      closing run at phase close; pgTAP `supabase test db` on every commit** — ★ RECOMMENDED — the rule
      forbids proceeding past a red suite, and six boundaries is where a regression can still be localised
      to one stage. Disk: `tests/e2e-runs/` must not be deleted (the ENOSPC record), so check headroom first.
- [ ] **(b) Full suite only at phase close** — far less wall-clock; a regression found at the end is a
      regression to bisect across a 97-policy rewrite.
- [ ] **(c) Full suite after every commit** — maximal safety; the run cost dominates the phase.

---

## G. Flows and the SPEC (criterion 7)

### G1 ⚠ DECIDE — Does 162 produce a `162-SPEC.md`?

K4 (a) says level-1 is "defined in this phase's SPEC". No SPEC exists for 162, and `/gsd-spec-phase` has
never been run for it.

- [ ] **(a) Yes — write `162-SPEC.md` first, before planning: the full grants matrix (scope × role × verb),
      the level-1 definition, the read-grant rules, and the per-project settings semantics. `/gsd-plan-phase
      162` then reads it as locked requirements.** — ★ RECOMMENDED — K4 explicitly names the SPEC as the
      home for the level-1 definition, and criterion 7's "checked against the matrix" needs a written matrix
      to check against. Nineteen plans in Phase 161 went astray partly for want of one fixed reference.
- [ ] **(b) Put the matrix in `162-CONTEXT.md` instead** — one fewer document and no extra command;
      CONTEXT.md is a decisions record that downstream agents read selectively, not a normative spec, and
      K4 names the SPEC.
- [ ] **(c) Put the matrix in the schema as SQL comments** — lives next to the code it governs; not
      reviewable before the code exists, and criterion 7 needs it beforehand.

### G2 — Candidate registration flow

`invite-candidate` authorises off the claim, creates the candidate row, and inserts a `user_roles` row with
`role: 'candidate'` — and **swallows the failure** of that insert (`console.error`, no abort).

- [x] **(a) In scope: the function writes an `(entity, candidate, <id>, owner)` grant instead, and the
      swallowed-failure branch becomes a hard failure that aborts the invite** — ★ RECOMMENDED — B1(a)
      drops `user_roles`, so the function must change regardless; leaving the swallow means a
      successfully-invited candidate with no grant, which under the new model means no access at all.
- [ ] **(b) Rewrite the grant write; leave the error handling as it is** — smaller diff, stays literal to
      criterion 7's "checked, not rebuilt"; preserves a known silent failure on the path that creates
      permissions.
- [ ] **(c) Out of scope; file the swallow as a follow-up** — smallest; the function writes to a table
      B1(a) drops, so it cannot actually be left alone.

**Extend to cover all entity types, i.e. organization manager etc.**

### G3 — Nomination confirmation flow

`nominations.unconfirmed` exists and is read by `get_nominations(p_include_unconfirmed)`. Nothing writes or
approves it.

- [ ] **(a) Define the flow in the SPEC and check it against the matrix; wire `unconfirmed` to the C1
      approval-routing settings so a confirmation is a grant-checked write, without building new UI** —
      ★ RECOMMENDED — this is criterion 7's literal ask (define, then check) and it reuses the column that
      already exists rather than inventing a second confirmation concept.
- [ ] **(b) Define and check only; leave `unconfirmed` unwired** — smallest; the settings in C1 that route
      nomination approval then govern nothing observable.
- [ ] **(c) Build the full confirmation workflow including notification e-mails** — the feature actually
      works end to end; pulls `send-email` and a notification model into a permissions phase.

**The flow is simplified to just a restricted grant (editors/admins). Also, flip the polarity globally with no historical traces from unconfirmed to confirmed for less confusion.**

---

## H. Sequencing and risk

### H1 — Phase 162 is the last unshipped phase of v2.15. Does it ship alone?

`.planning/ROADMAP.md` shows 137–164 all `[x]` except 162. STATE.md's body prose is stale (it still says
"ready to plan Phase 161"), but 161's verification is `status: passed`, `recommendation: CLOSE`, operator
`ACCEPTED_RESIDUAL` 2026-09-13.

- [ ] **(a) 162 is planned and executed now as the milestone's closing phase; STATE.md's stale prose is
      corrected in the phase's first commit** — ★ RECOMMENDED — nothing else is outstanding, and the stale
      `current_phase`/`stopped_at` text will otherwise mislead the next `/gsd-progress --next`.
- [ ] **(b) Correct STATE.md first as a separate `/gsd-quick`, then plan 162** — cleaner separation; an
      extra round trip for a two-line edit.

### H2 — Estimate shape

For calibration, not for approval: this is ~97 policies rewritten, 1 new table (+1 more under C3(a)),
4–6 new enums, 3 new predicates, 7 new columns, 2 dropped types, 1 dropped table, ~6 migrations with paired
`schema/` edits, a widened pgTAP estate, 4 frontend modules and 1 Edge Function.

- [ ] **(a) Expect 12–18 plans across 5–7 waves, with wave boundaries at E1's migration boundaries** —
      ★ RECOMMENDED — it matches the 17-plan shape of Phase 158 (the last comparably cross-cutting phase)
      and gives the E2E gate in F5(a) a natural place to run.
- [ ] **(b) Fewer, larger plans** — less orchestration overhead; larger blast radius per plan on a
      security surface.

### H3 — Known environment preconditions

Carried from the milestone's record so the planner does not rediscover them:

- `PUBLIC_PROJECT_ID` must be set in `.env` or the Supabase adapter throws at construction.
- E2E needs one fresh dev server on the suite's port; the preflight aborts on a project-id mismatch.
- `tests/e2e-runs/` must not be deleted; check disk headroom before F5's runs (the ENOSPC record).
- CI runs only on `main`; use the `ci-evidence/**` channel if an observed Actions run is needed.
- Commits in this worktree need no `--no-verify` (the worktree-local `core.hooksPath` override is set).

- [ ] **(a) Accept; CONTEXT.md carries these forward** — ★ RECOMMENDED.
- [ ] **(b) One of these is out of date** — say which.

---

## Fill status

| Section | Decisions | ⚠ DECIDE |
|---|---|---|
| 0 — Factual baseline | 2 | 0 |
| A — Scope boundary | 5 | 3 (A1, A2, A4) |
| B — The grants model | 7 | 2 (B1, B5) |
| C — Per-project settings | 4 | 1 (C3) |
| D — Read grants | 4 | 1 (D1) |
| E — Migration mechanics | 3 | 1 (E1) |
| F — Tests and evidence | 5 | 1 (F2) |
| G — Flows and the SPEC | 3 | 1 (G1) |
| H — Sequencing and risk | 3 | 0 |
| **Total** | **36** | **10** |

**Locked upstream, not re-asked here:** K1 (one rewrite with shims), K2 (+ per-verb amendment), K3 (typed
enum columns on `projects`), K4 (level-1 = editor minus editor-management).

**If you change nothing:** every decision resolves to its `★ RECOMMENDED` option. That yields a
database-only phase that replaces `user_roles` with `grants`, renames the JWT claim and updates its four
readers, folds all 18 inline ownership checks and all 15 storage policies through
`user_can(scope, uuid, verb)` with three verbs, adds `projects.published` plus 7 settings columns, builds a
`change_suggestions` store with no UI, lands as ~6 sequenced migrations with paired `schema/` edits, and
proves itself with pgTAP, a structural non-collapse guard in `lint-schema.mjs`, a negative-control ledger
and six full E2E runs — preceded by a `162-SPEC.md` carrying the grants matrix.
