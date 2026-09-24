# Phase 162 — Implementation Brief (from `162-USER-RIGHTS.md`)

> **Renamed 2026-09-15, from `162-IMPLEMENTATION-PLAN.md`.** GSD globs `*-PLAN.md` inside a phase directory
> as the phase's **executable** plans: under the old name `gsd query phases.list --type plans` returned this
> document as `162`'s plan 1, and `/gsd-execute-phase 162` would have tried to execute a design brief. The
> executable plans this document specifies are `162-01-PLAN.md` … `162-17-PLAN.md`.

**Written:** 2026-09-14 · **Amended:** 2026-09-15 (§ 10, § 11) · **Tree:** HEAD `440a7780f`, branch
`integration/ship-12-squash`
**Inputs:** `162-USER-RIGHTS.md` (operator, 2026-09-14) · `162-DISCUSSION-POINTS.md` (2026-09-14) ·
`.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § K (K1–K4, locked) · `PRE-SHIP-REFACTORING.md`
§ Permissions refactoring · ROADMAP § Phase 162 · REQUIREMENTS PRESHIP-02

**What this document is.** `162-USER-RIGHTS.md` is a materially newer and more specific statement of the
target model than the roadmap entry, PRESHIP-02 or `PRE-SHIP-REFACTORING.md`. It resolves one open
question outright, contradicts three locked or stated premises, and introduces a body of work — sign-up
methods and the entity-app task flow — that is **not** permissions work and does not fit inside Phase 162.

This plan does four things, in order: states the delta, records the facts the tree adds to it, makes the
target model precise enough to build, and partitions it into Phase 162 plus named downstream phases. It is
**not** a substitute for `162-DISCUSSION-POINTS.md` — § 7 lists which of that document's decisions this
supersedes and which still need your answer.

---

## 1. What `162-USER-RIGHTS.md` changes

| # | Change | Effect |
|---|---|---|
| **1.1** | **"For now, let's scope suggested changes from the schema. Users will just have to send a message to the admin."** | **Resolves C3 outright, against the recommendation.** No `change_suggestions` table, no `suggest` enum member. This **amends PRESHIP-02 and criterion 4**, which require the `suggest for approval` branch implemented and tested. Needs recording as an operator amendment, because the requirement is marked blocking ship. |
| **1.2** | Eight named user types, **none of them `owner`** | Criterion 1 and K1 fix the role vocabulary as `admin / owner / editor`. The user-type list is `RootAdmin, AccountAdmin, ProjectAdmin, ProjectEditor, Candidate, OrganizationEditor, FactionEditor, AllianceEditor` — two role levels (`admin`, `editor`), not three. See § 8.1. |
| **1.3** | A **20-permission atomic-rights list**, not a read/edit/manage triple | `162-DISCUSSION-POINTS.md` B4 proposed a 3-member verb enum. That is too coarse: the list separates `edit elections` from `edit questions` from `edit entities` from `edit nominations`, and `confirm` from `edit`. The verb argument of `user_can(scope, uuid, verb)` becomes a ~20-member permission enum. |
| **1.4** | **Read visibility is governed by "project open for voters" + "nomination confirmed"**, not by per-row `published` | "read settings, elections … (anyone when project is open for voters)"; "confirmed nominations and linked entities public when open for voters"; "read answers (public only when/via nomination confirmed)". The 10 `published` columns added by `300-auth-tables.sql` are superseded by **one project-level flag plus the existing nomination confirmation state**. This is larger than D1 assumed — D1 proposed *adding* a project flag alongside the per-row ones. |
| **1.5** | **Entity users create and edit their own nominations** (task flow step 7; "Nomination — edit contents (entity users can do this to their own, unless locked)") | Nominations are **admin-only** for INSERT/UPDATE/DELETE today (fact 19). This is new write capability, not a policy rename. |
| **1.6** | **Immutable entity data** — name is admin-seeded; `edit immutable data (admin/editor only)` | Today `303-column-grants.sql` **grants** `first_name`, `last_name` and `name` to `authenticated`. The immutability rule reverses that for entity users. **Amended 2026-09-15 (§ 11.2): immutability is now *conditional on* `entities.confirmed`, not absolute** — names are writable while an entity is unconfirmed and frozen once it is confirmed. Who the freeze binds is § 8.7. |
| **1.7** | **Four sign-up methods** (`identity_provider`, `email`, `parent_email`, `code`, `open`), configurable **per entity type** | Only `identity_provider` (`identity-callback`) and a partial `email` invite exist. `code` is a dead contract that throws; `open` and `parent_email` do not exist. This is a phase of its own — § 6.1. |
| **1.8** | A 9-step **common user task flow** | Steps 4–9 (confirm email → password → ToU → create nomination → answer → re-answer on nomination change) span the candidate app end to end. Steps 1–6 partly exist across `preregister/` and `register/`; step 7 exists in the UI but **the nominations it collects are discarded** (fact 22). A phase of its own — § 6.2. |
| **1.9** | New settings: `election_type`, `lock_nominations`, and the auth-method × entity-type matrix | `election_type` **collides with an existing column of different meaning** (fact 23). `lock_nominations` is RLS-read and belongs on `projects` per K3. The auth matrix is app-flow config and belongs in `app_settings.settings`. |
| **1.10** | `is_child_nominee`'s role **narrows** | `PRE-SHIP-REFACTORING.md` used it so "an organization's owner may be able to edit the candidates' data". `162-USER-RIGHTS.md` grants an organization only `invite children` and read of "related entities basic data" — **no edit of a child's data**. Criterion 3 stands, but its blast radius shrinks. |

---

## 2. Facts the tree adds (16–27, continuing `162-DISCUSSION-POINTS.md` § 0)

Measured this session at HEAD `440a7780f`.

| # | Fact | Evidence |
|---|---|---|
| 16 | **Entities carry no `email` and no registration code.** Methods 2, 2.1 and 3 all seed an entity with an email or a code; there is no column for either | `102-entities.sql` — no `email`, no `*_code` on `candidates`, `organizations`, `factions`, `alliances`. Grep for `registration_code` / `invite_code` across `schema/` returns nothing. |
| 17 | **The code-based sign-up contract exists and throws.** `checkRegistrationKey` is declared abstract in `universalDataWriter.ts` and the Supabase adapter implements it as `throw new Error('checkRegistrationKey is not supported by the Supabase adapter. Use invite-based registration.')` | `apps/frontend/src/lib/api/base/universalDataWriter.ts` (`_checkRegistrationKey`, `_register`) · `…/supabase/dataWriter/supabaseDataWriter.ts`. Translation keys `candidateApp.login.haveRegistrationCode` and `candidateApp.register.wrongRegistrationCode` ship in `translationKey.ts`, so the UI strings for method 3 already exist. |
| 18 | **⚠ The e-mail invite flow redirects to a route that does not exist.** `invite-candidate` sets `redirectTo = ${siteUrl}/candidate/complete-registration`; no such route is in the tree | `functions/invite-candidate/index.ts` vs `find apps/frontend/src/routes -ipath "*complete*"` → no match; the only occurrence of the string repo-wide is the Edge Function line itself. Method 2 is therefore **broken end to end today**, independently of this phase. |
| 19 | **Nominations are admin-only to write.** `admin_insert_nominations`, `admin_update_nominations`, `admin_delete_nominations` all gate on `can_access_project(project_id)`; no entity-user policy exists | `302-rls.sql`. Task-flow step 7 and the `Nomination — edit contents` right both require new policies, not renamed ones. |
| 20 | **`nominations.unconfirmed` is the inverse of the `confirmed` concept USER-RIGHTS uses**, defaults `false` (i.e. confirmed), and is read-only in practice — only `get_nominations(p_include_unconfirmed)` consults it | `104-nominations.sql` · `503-entity-rpcs.sql`. "when editing, turn confirmed false" means a trigger or policy must **set** it, which nothing does today. Note the polarity: `unconfirmed = false` today means every seeded nomination is already "confirmed". |
| 21 | **`identity-callback` always creates a `candidate`** — there is no entity-type selection | `functions/identity-callback/index.ts` inserts into `candidates` and writes `user_roles` with `role: 'candidate'`, `scope_type: 'candidate'`. Method 1's "Select entity type if election allows multiple" has no implementation and no entry point. |
| 22 | **⚠ Preregistration nominations are collected and then discarded.** The writer contract carries `nominations: Array<{electionId, constituencyId}>` through `preregisterWithIdToken` / `preregisterWithApiToken`, and `_preregister` passes only `firstName`, `lastName`, `email`, `projectId` to `invite-candidate` — which never writes a nomination either | `universalDataWriter.ts` · `supabaseDataWriter.ts` `_preregister` · `functions/invite-candidate/index.ts`. The `preregister/(authenticated)/{elections,constituencies}` pages exist and feed `candCtx.preregistrationNominations`, so the UI half of task-flow step 7 is already built. |
| 23 | **⚠ `election_type` already exists with a different meaning, on a different table.** `elections.election_type text` holds `'general'` / `'local'` across ~20 dev-seed templates | `101-elections.sql` · `packages/dev-seed/src/templates/**` · `permittedKeys.ts`. `162-USER-RIGHTS.md`'s `election_type: organization_only \| candidate_only \| organization_list` is a **name collision**, and it is labelled a *project* setting while the existing column is per-election. See § 8.2. |
| 24 | **Per-project app settings already have a home**: `app_settings.settings jsonb`, one row per project, `anon`-readable, typed in `packages/app-shared/src/settings/dynamicSettings.type.ts` — including `access.voterApp` / `access.candidateApp` and `preRegistration.enabled` | `106-app-settings.sql` · `dynamicSettings.type.ts`. K3 ruled typed columns on `projects` **for settings RLS must read**; settings the app reads have an established home, and putting them on `projects` too would create the drift K3 was avoiding. |
| 25 | **`access.voterApp` is an app-level switch, not an RLS one.** Anon read is gated per row by `published`, with no project-level term at all | `dynamicSettings.type.ts` vs `anon_select_elections USING (published = true)` and nine siblings. "Open for voters" therefore has **no database-level meaning today**. |
| 26 | **The candidate app has 30 route files and a working `preregister` flow** (`+page` → `elections` → `constituencies` → `email` → `status`) plus `register`, `login`, `forgot-password`, `password-reset` | `apps/frontend/src/routes/candidate/**`. Method 1's flow is largely built; methods 2/3/4 have no route of their own. |
| 27 | **Column grants cannot express immutability per project or per role.** `303-column-grants.sql` is a single global `REVOKE`/`GRANT` pair against `authenticated` | Immutable-data enforcement (1.6) must therefore be an RLS `WITH CHECK` comparing old and new values, or a trigger — not a column grant. |

---

## 3. The target model, made precise

### 3.1 User types → grant rows

`grants` keyed `(user_id, scope, target_type, target_id, role)`, per `162-DISCUSSION-POINTS.md` B3(a).

| User type | `scope` | `target_type` | `target_id` | `role` |
|---|---|---|---|---|
| RootAdmin | `global` | — | NULL | `admin` |
| AccountAdmin | `account` | — | account id | `admin` |
| ProjectAdmin | `project` | — | project id | `admin` |
| ProjectEditor | `project` | — | project id | `editor` |
| Candidate | `entity` | `candidate` | candidate id | `editor` |
| OrganizationEditor | `entity` | `organization` | organization id | `editor` |
| FactionEditor | `entity` | `faction` | faction id | `editor` |
| AllianceEditor | `entity` | `alliance` | alliance id | `editor` |

**Two role levels, not three.** See § 8.1 — this needs your ruling, because criterion 1 and K1 say three.

### 3.2 The permission enum (the `verb` of `user_can`)

Transcribed from `162-USER-RIGHTS.md` § "Grants, atomic rights", **amended 2026-09-15 by § 11.1 and
§ 11.2 and § 11.5**. 23 members — the source's 20, with `project.edit_settings` split in two and
`entity.confirm` and `nomination.create_parent` added.

| Group | Permission | Source line |
|---|---|---|
| Feedback | `feedback.read` · `feedback.manage` | "Feedback — read / manage" |
| Account | `account.edit_settings` · `account.manage_projects` · `account.manage_admins` | "edit settings / create, delete projects / manage admins" |
| Project | `project.manage_editors` · **`project.edit_project_settings`** · **`project.edit_app_settings`** · `project.edit_structure` · `project.edit_questions` · `project.read_structure` · `project.edit_entities` · `project.edit_nominations` · `project.read_entities` | "manage editors / edit settings / edit elections, constituency groups and constituencies / edit questions and categories / read settings, elections … / edit entities / edit nominations / read entities and nominations" |
| Entity | `entity.edit_answers` · `entity.read_answers` · `entity.edit_immutable` · `entity.invite_children` · **`entity.confirm`** | "edit answers / read answers / edit immutable data / invite children" — **`entity.confirm` added per § 11.2** |
| Nomination | `nomination.edit` · `nomination.read` · `nomination.confirm` · **`nomination.create_parent`** | "edit contents / read contents and related entities basic data / confirm" — **`nomination.create_parent` added per § 11.5** |

### 3.3 The role × permission matrix

`✓` = granted · `—` = not granted · `own` = only for the granted target and, where noted, its
`is_child_nominee` children. **No `?` cells remain** — the operator resolved all three of § 8.3's directly
in this table on 2026-09-15 (see § 11.9).

| Permission | Root | Account | ProjAdmin | ProjEditor | Candidate | OrgEditor | Faction/Alliance |
|---|---|---|---|---|---|---|---|
| `feedback.read` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `feedback.manage` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `account.edit_settings` | ✓ | ✓ | — | — | — | — | — |
| `account.manage_projects` | ✓ | ✓ | — | — | — | — | — |
| `account.manage_admins` | ✓ | ✓ | — | — | — | — | — |
| `project.manage_editors` | ✓ | ✓ | ✓ | — | — | — | — |
| `project.edit_project_settings` | ✓ | ✓ | ✓ | — | — | — | — |
| `project.edit_app_settings` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.edit_structure` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.edit_questions` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.read_structure` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `project.edit_entities` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.edit_nominations` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `project.read_entities` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `entity.edit_answers` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `entity.read_answers` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `entity.edit_immutable` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `entity.invite_children` | ✓ | ✓ | ✓ | ✓ | — | own (org→cand) | — |
| `entity.confirm` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `nomination.edit` | ✓ | ✓ | ✓ | ✓ | own, unless locked | own, unless locked | own, unless locked |
| `nomination.read` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `nomination.confirm` | ✓ | ✓ | ✓ | — | — | — | — |
| `nomination.create_parent` | ✓ | ✓ | ✓ | ✓ | own, unless locked | — | own, unless locked |

**`ProjectEditor` is K4's "level-1 permissions short of full"** — it is exactly `ProjectAdmin` minus
`manage_editors`, minus `project.edit_project_settings` (§ 11.1), and minus `nomination.confirm`, which
USER-RIGHTS restricts to admins. K4 is therefore satisfied by this row rather than by a separate definition.

**The editor keeps the app's face, the admin keeps the project's shape.** § 11.1's split is what makes that
sentence true rather than approximate: an editor may retheme and re-word the running application
(`app_settings`) without being able to change who may read it or when it opens (`projects`).

### 3.4 Public read, restated

Replaces `162-DISCUSSION-POINTS.md` D1/D3 and fact 1.4 above. **Amended 2026-09-15 by § 11.2** — the
entity-confirmation conjunct is new.

| Reader | May read |
|---|---|
| `anon` | Project structure (settings, elections, constituency groups, constituencies, questions, categories) **when the project is open for voters**; a nomination and its linked entities **only when the project is open for voters AND the nomination is confirmed AND every entity that nomination links carries `confirmed = true`** (§ 11.2); answers **only through such a nomination** |
| Any authenticated user **with any grant in the project** | All project structure, always — "any auth user can always read their project" |
| Entity grantee | Own entity's answers and own nominations; via `is_child_nominee`, a related entity's **basic data only** (not answers unless public) |

**Consequence:** one project-level flag (`projects.open_for_voters`) plus **two** confirmation states —
the nomination's, and the `confirmed` flag on every entity it links (§ 11.2) — carry all public visibility.
Public read is an **all-of** rule, and it is transitive through the nomination: a confirmed nomination whose
candidate is unconfirmed is not public, and neither is that candidate. The **10 per-row `published` columns
are redundant, and § 8.4(b) — operator-ticked 2026-09-15 — drops them inside this phase.** After 162 there
is exactly one way to ask whether a row is public, which is what criterion 2 asks for.
See § 8.4 — dropping them is a bigger change than this phase has to make, and there is a staged option.

### 3.5 Where each new setting goes

| Setting | Home | Why |
|---|---|---|
| `lock_nominations` | typed column on `projects` | RLS reads it in `nomination.edit` — K3 applies |
| `open_for_voters` | typed column on `projects` | RLS reads it in every anon policy — K3 applies |
| Nomination shape (`organization_only` / `candidate_only` / `organization_list`) | typed enum column on **`elections`**, renamed | Fact 23: it is a per-election property and the name `election_type` is taken |
| Auth-method × entity-type matrix | `app_settings.settings` JSONB, typed in `dynamicSettings.type.ts` | Fact 24: app-flow config, never read by RLS; `preRegistration.enabled` already lives there |
| `confirmed` (§ 11.2) | `boolean NOT NULL DEFAULT false` **declared inside each entity table's `CREATE TABLE`**, on all four | RLS reads it in every anon policy — K3 applies. Declared, not `ALTER`-appended, per § 11.4 |

**Every column in this table is declared in its table's `CREATE TABLE` body, not appended by an
`ALTER TABLE … ADD COLUMN`.** § 11.4 is the rule and the reason.

---

## 4. Scope partition

`162-USER-RIGHTS.md` describes three separable bodies of work. Phase 162 is one of them.

| Body of work | Phase | Rationale |
|---|---|---|
| **A. The permissions core** — `grants`, the 22-member permission enum, `user_can`, `is_child_nominee`, the 97-policy rewrite, `open_for_voters`, `lock_nominations`, **`entities.confirmed` with its read rule and conditional immutability (§ 11.2)**, the entity-user nomination write policies, per-verb storage across all 15 storage policies, **the declarativity pass (§ 11.4)**, **the `published` removal (§ 11.6)**, **child-nominee parent creation (§ 11.5)**, pgTAP | **162** (this phase) | It is PRESHIP-02, it is blocking ship, and every item is a database-layer statement of § 3's matrix |
| **B. Sign-up methods** — the auth-method matrix setting, entity `email` + registration code columns, the `code` and `open` flows, `parent_email` org→candidate invites, entity-type selection at the identity entry point, and the broken `complete-registration` route (fact 18) | **new phase (§ 6.1)** | Product capability, not a permissions statement. It *depends on* 162's grants — an org inviting a candidate is `entity.invite_children` — so it cannot precede it |
| **C. Entity-app task flow** — the 9 steps, self-service nomination creation wired to a real write, re-answer on nomination change, ToU and password steps unified across methods | **new phase (§ 6.2)** | Frontend + flow work on top of B's entry points and A's write policies |
| **D. Suggested changes** | **dropped** (1.1) | Operator ruling: users message an admin |

**Recommendation: B and C open a new milestone (v2.16), and v2.15 ships when 162 closes.** 162 is the last
unshipped phase of v2.15 and it is the only one marked blocking ship. Folding two product phases into the
milestone extends a release that is otherwise complete. If you would rather ship all of it together, say so
and I will roadmap B and C into v2.15 instead.

---

## 5. Phase 162 — implementation sequence

Seven waves, ~19 plans. **Rewritten 2026-09-15**: the operator ticked `162-DISCUSSION-POINTS.md`
**E1(c)** — *rewrite `00001_initial_schema.sql` in place* — which overrules E1(a)'s six-migration shim
sequence that the original § 5 was built on. § 11.3 states what that changes and § 11.4 the declarativity
rule that comes with it. The wave *content* below is unchanged; what changed is that no wave creates a
`000NN` file. Each wave edits `schema/*.sql` declaratively, regenerates `00001_initial_schema.sql` from it,
and regenerates `packages/supabase-types/`.

**K1's shim lifecycle survives the change.** It is a sequence of *reviewable commits*, not of migration
files: wave 2 introduces the shims and wave 6 deletes them, and every commit in between is green under
`db:reset`. What is lost is per-stage revertibility *of an applied database* — with no migration history
there is nothing to revert to but a reset, which § 11.3 argues is acceptable only because no deployment
exists yet. **If that premise is wrong, § 11.3 is wrong**, and E1(a) should be restored.

### Wave 0 — SPEC and baseline _(no schema change)_

- **162-01** Write `162-SPEC.md`: § 3's matrix (**23 permissions** — § 3.2 is canonical), the read rules **including § 11.2's
  entity-confirmation conjunct**, the level-1 definition, and the explicit amendments to criterion 1,
  criterion 4 (§ 10.1) and criterion 6 (widened by the operator's A4(a) tick to all 15 storage policies).
  This is K4's stated home and the fixed reference the remaining plans check against.
- **162-02** Correct the ROADMAP entry and PRESHIP-02 against facts 2–7 and 16–27, dated, in house style.
- **162-02b** **The declarativity pass (§ 11.4), landed first and alone.** Merge all 25 `ADD COLUMN` sites in
  `schema/` into their tables' `CREATE TABLE` bodies, regenerate `00001_initial_schema.sql`, fold
  `00002`–`00008`, and collapse `assert-schema-migration-parity.mjs` to the `cmp` its own docblock says the
  fold enables. Behaviour-neutral by construction: the applied database is byte-identical before and after,
  which is the gate for this plan. Doing it before wave 1 means every later wave writes into an
  already-declarative tree instead of adding to the pile.

### Wave 1 — the model _(declarative; regenerates `00001`)_

- **162-03** Enums: `grant_scope_type`, `grant_role_type`, `grant_permission` (**23 members** — § 3.2 is canonical); `grants` table
  with the CHECK tying `target_type IS NOT NULL` to `scope = 'entity'`; indexes.
- **162-04** `user_can(p_scope, p_target_id, p_permission)` encoding § 3.3's matrix in one place, reading the
  JWT grant set with table lookups only for hierarchy (B5(a) hybrid); `is_child_nominee` per D4(a), direct
  parent only.

### Wave 2 — shims and data _(declarative; regenerates `00001`)_

- **162-05** `has_role` and `can_access_project` reimplemented as thin shims over `user_can`; every existing
  policy keeps working untouched. Full E2E + pgTAP run here — this wave must be behaviour-neutral.
- **162-06** Data migration per `162-DISCUSSION-POINTS.md` B6(a), **including the `auth_user_id` backfill**;
  access-token hook emits `grants`; the four frontend claim readers and `invite-candidate` updated (A2(a)).

### Wave 3 — settings and visibility _(declarative; regenerates `00001`)_

- **162-07** `projects.open_for_voters boolean NOT NULL DEFAULT false`, existing rows backfilled `true`
  (D2(a)); `projects.lock_nominations`; **the repurposed `elections.election_type`** carrying the nomination shape (§ 8.2 and `162-CONTEXT.md` D-16, which lists every trace to remove); **and
  `confirmed boolean NOT NULL DEFAULT false` on all four entity tables (§ 11.2)**, declared in the
  `CREATE TABLE` bodies per § 11.4. **Backfill `confirmed = true` for existing rows** — the same
  no-regression argument as `open_for_voters`: every entity visible today must stay visible, and a `false`
  backfill would blank the voter app. Dev-seed templates set it explicitly from then on.
- **162-07b** **`organization_id` moves from `candidates` to `factions` (§ 11.8).** Drop the candidates
  column and sweep its consumers — `200-indexes.sql`, `303-column-grants.sql`, the two `503-entity-rpcs.sql`
  return shapes, `502-email-helpers.sql`, `dev-seed`'s `CandidatesGenerator` and `permittedKeys.ts`, the
  frontend adapter and its tests; add `factions.organization_id uuid NOT NULL REFERENCES organizations(id)
  ON DELETE CASCADE` and give every faction fixture an organization. **Closes RES-7 / T-144-11** (fact 39) —
  the `column-map.ts` collision whose sole cause is the duplicated column name. The nomination-side
  constraint lands in 162-12, after the column exists. A plan of its own because the RPC return-shape change
  touches a contract Phase 164 audited, and because its E2E blast radius differs in kind from the policy
  rewrite around it.
- **162-08** The anon read policies re-expressed against `open_for_voters` + confirmed nominations **+ the
  linked entities' `confirmed` flags** (§ 3.4, § 11.2). **`published` is not retained as a conjunct — § 8.4(b)
  deletes it**, so these policies are written once, in their end state, rather than written with a term that
  162-16 would strip out again. The entity conjunct is the one new *shape* here: an entity's own anon policy
  must ask whether a confirming nomination exists, which is the same `nominations` lookup `is_child_nominee`
  already performs — so it reuses that path rather than adding a second one.

### Wave 4 — the 80 table policies _(declarative; regenerates `00001`)_

- **162-09** `accounts`, `projects`, `elections`, `constituency_groups`, `constituencies` + the two join
  tables → `user_can`.
- **162-10** `organizations`, `candidates`, `factions`, `alliances` → `user_can`; the 6 inline
  `auth_user_id = auth.uid()` re-derivations folded in and `is_candidate_self` dropped (A3(a)).
- **162-11** `questions`, `question_categories`, `app_settings`, `feedback`, `admin_jobs` → `user_can`.
- **162-12** `nominations`: the admin policies converted, **plus the new entity-user INSERT/UPDATE policies**
  (1.5) gated on `nomination.edit` + `NOT lock_nominations`, and the `confirmed → false` transition on edit
  (fact 20). `nomination.confirm` restricted to admins. **Plus all of § 11.5:** the
  `nomination.create_parent` policy and its five guards; the **`GRANT INSERT (…)` column list for
  `nominations`** that makes "unconfirmed" something the candidate cannot override (fact 34); a cap on how
  many unconfirmed parents one candidate may originate (§ 8.9); and a deliberate ruling on
  `parent_nomination_id`'s `ON DELETE CASCADE` (fact 35). **Plus § 11.7's uniqueness constraint** —
  `UNIQUE NULLS NOT DISTINCT` over the operator's eight columns, which is what makes guard 3 a guarantee
  rather than a race, and which **must not** be written as a plain `UNIQUE` (it would enforce nothing).
  **Plus § 11.8's faction rule** in `validate_nomination()`: a faction's parent nomination must be the
  nomination of that faction's own organization. Also flip `nominations.unconfirmed` to
  `nominations.confirmed` while every reader is already open.
- **162-13** Immutable-data enforcement (1.6, fact 27), **now conditional on `confirmed` (§ 11.2)**: the
  protected name columns are writable while `confirmed = false` and frozen once it is true, except to a
  holder of `entity.edit_immutable` (§ 8.7 — ruling needed). A trigger, not a `WITH CHECK`, because the rule
  reads `OLD.confirmed` as well as the column values; `303-column-grants.sql` is reduced to the coarse outer
  bound it can actually express. `entity.confirm` gates writes to `confirmed` itself.

### Wave 5 — storage _(declarative; regenerates `00001`)_

- **162-14** All 15 storage policies routed through `user_can(scope, uuid, permission)`, **including the 7
  `candidate_*` policies** (A4(a) — operator-ticked; **fact 3's census is corrected**: six `candidate_*`
  plus `anon_select_public_assets` = the seven non-callers, against eight callers, with ten real
  `can_access_project` call sites. See `162-CONTEXT.md` D-03) and their 12 inline re-derivations. **Plus the
  operator's A4 note:** one public bucket per entity type, with write access paired to
  `entity.edit_answers(entity_type, entity_id)` — i.e. the bucket policy asks `user_can` the same question
  the table policy asks, parameterised by entity type rather than hardcoded to `candidate`. The note says
  *"this kind of generalisation should be applied as widely as possible"*, so 162-10 and 162-12 carry it too:
  no policy names a single entity type where it could take one as an argument.

### Wave 6 — close _(declarative; regenerates `00001`)_

- **162-15** Delete the shims; drop `user_roles`, `user_role_type`, `role_scope_type` (B1(a), K1). Under
  § 11.3 "drop" means *absent from the declarative schema*, not a `DROP` statement appended to it.
- **162-16** **The `published` removal (§ 8.4(b), § 11.6)**: the 10 columns and their 10 partial indexes out
  of the declarative schema; the `published` term out of every anon policy and out of
  `303-column-grants.sql`'s protected-column comments; `dev-seed` templates, `permittedKeys.ts`, `seed.sql`,
  the bulk-import RPC column lists and the adapter selects updated; and the E2E specs that publish rows to
  make them visible rewritten to set `open_for_voters` and the two confirmation flags instead. Runs after
  162-15 so the suite absorbs one visibility-model change, not two.
- **162-17** Tests and evidence: the pgTAP estate widened across § 3.3's matrix; the structural
  non-collapse guard in `lint-schema.mjs` (F2(a)); the per-verb storage paired assertion (F3(a));
  `162-NEGATIVE-CONTROL-LEDGER.md` (F4(a)); the criterion-7 flow check against § 3's matrix, covering
  `identity-callback` and `invite-candidate` (G2(a), G3(a), parameterised by entity type per the operator's
  G2 note). **Plus § 11.5's two behavioural assertions:** that a nomination carrying
  `requestedParentOrganization` cannot be confirmed until an admin resolves it, and that the admin
  confirmation queue finds such nominations by that key — since nothing in the schema distinguishes them
  from an independent candidate's nomination. **Plus § 11.7's two-directional pair:** a genuine duplicate
  **rejected**, and the same candidate nominated by two different parents **accepted** — asserting the
  constraint by name. Rejection alone would stay green if someone later dropped `parent_nomination_id` from
  the key.

**Gates.** pgTAP on every commit; full E2E at each wave boundary (F5(a)) — check `tests/e2e-runs/` disk
headroom first (ENOSPC has voided full-suite runs in this worktree before). Waves 2 and 6 are the two where
a regression is most likely and least visible. **162-02b adds a third:** it is the only plan whose gate is
*byte-identity of the applied schema*, and it must be proven by dumping the database before and after and
diffing, not by a green test run.

---

## 6. Downstream phases

### 6.1 Sign-up methods and entity onboarding

**Goal:** an entity user can reach an authenticated, grant-bearing session by whichever of the four methods
the project allows for their entity type.

Scope: the auth-method × entity-type matrix in `app_settings.settings` + its `dynamicSettings.type.ts` type;
`email` and `registration_code` columns on the four entity tables (fact 16); the `code` flow wired to the
`checkRegistrationKey` contract that currently throws (fact 17) — the UI strings already ship; the `open`
flow; `parent_email` org→candidate invites through `entity.invite_children`; entity-type selection at the
identity entry point (fact 21); **and the `/candidate/complete-registration` route that fact 18 shows is
missing, which breaks the e-mail invite flow today.**

**Plus the `confirmed` setter § 11.2 defers to it:** 162 ships `entities.confirmed`, its permission and its
read rule, but the "seeded with a name and an email or a code ⇒ confirmed" path cannot be built until the
`email` and `registration_code` columns exist (fact 16). In 162 the only automatic setter is
`identity-callback`; everything else is an admin or editor exercising `entity.confirm`. **6.1 closes that
gap**, and the operator's G2 note — *"extend to cover all entity types, i.e. organization manager etc."* —
means it does so for organizations, factions and alliances, not candidates alone.

Depends on 162 (every invite is a grant write). Fact 18 is a live defect and could be pulled forward as a
standalone fix if you want the e-mail path working sooner.

### 6.2 Entity-app task flow

**Goal:** `162-USER-RIGHTS.md`'s 9 steps run end to end for every allowed method.

Scope: unify steps 1–6 across the four entry points (the `preregister/` and `register/` trees currently
diverge); **wire step 7 to a real nomination write** — fact 22 shows the UI already collects elections and
constituencies and the writer silently drops them; the free-text-party branch for `organization_list`
elections; step 9's question-set change when a nomination changes; ToU and password steps made common.

**And it owns the identity-confirm step** § 11.2's third line names: *"Sign up flow thus includes an
identity confirm step usually paired with confirming nominations."* Two flags with two permissions
(`entity.confirm`, `nomination.confirm`), set together by one UI act. 162 ships both flags; this phase
builds the act.

Depends on 6.1 and 162.

---

## 7. Effect on `162-DISCUSSION-POINTS.md`

**Superseded — do not answer these; § 3 and § 5 above replace them:**

| Decision | Disposition |
|---|---|
| **C3** (suggestion store) | **Resolved by you as (c)** — no store, no `suggest` member. Criterion 4 is amended. |
| **B4** (3 verbs) | Replaced by § 3.2's **22**-member permission enum (§ 11.1, § 11.2). |
| **C1** (7 settings columns) | Replaced by § 3.5. `candidate_self_edit` and the three `*_nomination_edit` columns collapse to `lock_nominations` + the matrix; approval-routing booleans are dropped with C3. |
| **D1 / D3** (read grants) | Replaced by § 3.4. `projects.published` is renamed `open_for_voters` and becomes the *only* project-level visibility term — but **not** the only visibility term: § 11.2 adds `entities.confirmed` alongside the nomination's own confirmation state. |
| **G1** (write a SPEC) | Confirmed as (a) — 162-01. |
| **A1** (DB-only) | Confirmed as (a), and § 4 is why: the UI work is real but it is phases B and C. |

**Answered by the operator on 2026-09-15** (ticks and margin notes in `162-DISCUSSION-POINTS.md`):

| Decision | Tick | Effect here |
|---|---|---|
| **A4** | (a) — the ★ option | Criterion 6 widened to all 15 storage policies. Plus a margin note: **one public bucket per entity type, write access paired to `entity.edit_answers(entity_type, entity_id)`, and "this kind of generalisation applied as widely as possible"** → folded into 162-14, 162-10, 162-12. |
| **C3** | (c) — **overrules the ★** | No suggestion store, criterion 4 narrowed. Already carried by § 1.1 and § 10.1. |
| **E1** | (c) — **overrules the ★** | `00001_initial_schema.sql` rewritten in place; no `000NN` sequence. § 11.3 and § 11.4; § 5 rewritten accordingly. |
| **G2** | (a) — the ★ | `invite-candidate` writes a grant and stops swallowing the failure. Plus a margin note: **"extend to cover all entity types, i.e. organization manager etc."** → the invite path is parameterised by entity type, not candidate-only. This is the same generalisation A4's note asks for, arriving from the other side. |
| **B5** | margin note *"Overriden in implementation plan"* | § 3's model stands; no separate B5 answer needed. |

**Still open — your answers are still needed:** 0.1, 0.2, A2, A3, A5, B1, B3, B6, B7, C4, D2, D4, E2, E3,
F1, F2, F3, F4, F5, G3, H1, H2, H3. In every case the § 5 sequence assumes the `★ RECOMMENDED` option.

**One of those is now load-bearing in a way it was not before: E2.** It re-baselines a parity fixture that
§ 11.3 replaces with a `cmp`. Its ★ option (a) — "re-baseline in the same commit as each migration" — is
written against a migration sequence that no longer exists; under E1(c) the equivalent obligation is *"the
regenerated `00001` is reviewed as a diff in the same commit as the `schema/` edit that caused it."* 162-02b
carries that reading.

---

## 8. Rulings this plan cannot make

### 8.1 ⚠ Two role levels or three?

`162-USER-RIGHTS.md` names eight user types spanning `admin` and `editor` only. Criterion 1 and K1 fix
`admin / owner / editor`, with owner = "can manage editors". In the new model editor-management is a
**project-scope** permission (`project.manage_editors`) and the entity-scope equivalent is
`entity.invite_children` — neither needs a third role.

- [ ] **(a) Two roles, `admin` and `editor`; criterion 1 amended in `162-SPEC.md`** — ★ RECOMMENDED —
      `162-USER-RIGHTS.md` is the newer and more specific statement, and an unused `owner` member in a
      security enum is untested surface the milestone standard rejects.
- [ ] **(b) Keep three; entity grants are `owner` and `owner` carries `entity.invite_children`** — preserves
      criterion 1 and K1 verbatim; adds a level the user-type list does not use, and `OrganizationEditor`
      would then be an `owner` despite its name.

### 8.2 ⚠ `election_type` is already taken (fact 23)

`elections.election_type` holds `'general'` / `'local'` across ~20 dev-seed templates. The new setting is a
different axis — which entity types may be nominated.

- [ ] **(a) New enum column `elections.nomination_shape` (`organization_only` / `candidate_only` /
      `organization_list`); the existing `election_type` is left alone** — ~~★ RECOMMENDED~~
      **NOT CHOSEN — overruled by the operator note below.** The ★ rested on "the two axes stay
      independent because they are independent"; the operator's answer is that the old axis carries no
      information, so there is no second axis to keep.
- [ ] **(b) Rename the existing column to `election_scope` and take `election_type` for the new meaning** —
      matches USER-RIGHTS' wording; touches ~20 seed templates, `permittedKeys.ts`, the generated types and
      any consumer, for a naming preference.
- [ ] **(c) Make it a project setting as USER-RIGHTS labels it** — simplest to read; a project with both a
      party-list and a candidate-only election cannot express that, and `elections` is where the data is.

**Reuse election_type for this because the current general, local is not actually used anywhere. Remove historical traces and be careful when updating the seed files, although most or perhaps all will be of the party list type.**

### 8.3 ~~Three cells in § 3.3 are unstated~~ — **ANSWERED 2026-09-15, in the matrix itself**

The operator resolved all three cells by editing § 3.3 directly rather than by ticking a box here:
`feedback.read` **✓**, `feedback.manage` **✓**, `project.edit_settings` **—**. That combination is none of
(a), (b) or (c) below — it is "an editor runs the feedback queue but does not touch the project's
configuration", which § 11.1 then refines by splitting the settings permission so an editor *can* edit the
app's settings. The options below are kept only as the record of what was asked.

`162-USER-RIGHTS.md` does not say whether **ProjectEditor** gets `feedback.read`, `feedback.manage` or
`project.edit_settings`.

- [ ] **(a) ProjectEditor gets `feedback.read` but not `feedback.manage`, and not `project.edit_settings`** —
      ★ RECOMMENDED — "edit settings" sits directly beside "manage editors" in the source's Project list,
      which reads as the admin pair; read-only feedback matches an editor's content role.
- [ ] **(b) ProjectEditor gets all three** — an editor is then fully operational without an admin present.
- [ ] **(c) ProjectEditor gets none** — the tightest reading of "editor minus editor management".

### 8.4 ~~⚠ What happens to the 10 `published` columns?~~ — **ANSWERED 2026-09-15: (b), they are dropped in 162**

The operator ticked **(b)**, overruling the ★. The 10 columns, their 10 partial indexes and every policy
term that reads them leave the schema inside this phase; `open_for_voters` + the two confirmation states
(§ 11.2) become the whole visibility story. **This is the single largest scope change of the amendments** —
see § 11.6 for what it pulls in and why it is nonetheless cheaper here than in a follow-up.

§ 3.4 makes them redundant: `open_for_voters` plus nomination confirmation carry all public visibility.

- [ ] **(a) Keep them for 162, ANDed with `open_for_voters`; drop them in a follow-up once the E2E and seed
      estates are migrated** — ★ RECOMMENDED — dropping 10 columns touches `dev-seed`, the seed file, the
      bulk-import RPCs, the adapter and a large share of the 43 E2E specs, and it is not what PRESHIP-02
      asks for. Keeping them as a conjunct is strictly more restrictive, so nothing becomes visible that
      is not visible today.
- [x] **(b) Drop them in 162 and let `open_for_voters` + confirmation be the whole story** — the end state
      USER-RIGHTS describes, reached in one move; materially enlarges the phase and puts a large E2E and
      seed migration inside a blocking-ship security refactor.
- [ ] **(c) Keep them indefinitely as a per-row override** — no migration at all; leaves two visibility
      mechanisms, which is the defect class this phase exists to end.

### 8.5 Do B and C open a new milestone?

- [ ] **(a) v2.15 ships when 162 closes; B and C open v2.16** — ★ RECOMMENDED — see § 4.
- [ ] **(b) Roadmap B and C into v2.15** — one release carries the whole model; extends a milestone whose
      other 27 phases are done.

### 8.6 Is a spike warranted before planning?

The one thing § 5 assumes but has not measured is `user_can`'s cost: a 20-member permission enum evaluated
inside ~97 policies, with the grant set read from the JWT and hierarchy read from `nominations`.

- [ ] **(a) No spike; measure inside wave 1 and treat a regression as a wave-1 defect** — ★ RECOMMENDED —
      `can_access_project` already does a table lookup for the account hop and the current policies are
      acceptable, so the shape is not new; wave 2's shim step is itself the behaviour-neutral measurement
      point.
- [ ] **(b) Spike `user_can` + `is_child_nominee` against a seeded project first, comparing p95 on the
      voter app's hottest reads before and after** — buys certainty on the one unmeasured axis; costs a
      day and delays a blocking-ship phase.

---

### 8.7 ⚠ NEW — When `confirmed = true`, is the name frozen for *everyone*?

§ 11.2 says "when true, name(s) cannot be changed (data is treated immutable in that case)". § 1.6 and
§ 3.3's `entity.edit_immutable` row say immutable data is editable by admin/editor. The two readings differ
only for an admin or project editor, and the phrase does not settle which was meant.

- [ ] **(a) Frozen for the entity user; still editable by a holder of `entity.edit_immutable`
      (admin / project editor)** — ★ RECOMMENDED — keeps `entity.edit_immutable` meaningful rather than
      making it a permission nobody can exercise, and leaves an operator able to fix a typo in a confirmed
      candidate's surname without unconfirming them. The immutability the source is protecting is against
      *self*-service renaming after an identity check, which this delivers.
- [ ] **(b) Frozen for everyone; an admin must set `confirmed = false` first, edit, then re-confirm** —
      the literal reading, and a stronger audit story: every name change on a confirmed entity is preceded
      by a visible unconfirmation. Costs a three-step flow for a typo and makes `entity.edit_immutable`
      redundant with `entity.confirm`.
- [ ] **(c) Frozen for everyone, full stop; names are fixed at creation** — simplest predicate; no way to
      correct a seeding error except deleting and recreating the entity, which cascades its nominations.

### 8.8 ~~⚠ NEW — What becomes of migrations `00002`–`00008` under E1(c)?~~ — **ANSWERED 2026-09-15: (a)**

The operator ruled the precondition directly — *"don't care about migrations, no supabase db has been
published yet"* (§ 10.2). (a) stands, and the paragraph below about a staging or production project is
answered: there is none. Kept as the record of what was asked.

The tick says rewrite `00001_initial_schema.sql` in place. It does not say what happens to the seven
migrations that currently apply on top of it, and they cannot simply stay: once `00001` carries the end
state, `00002`–`00008` either re-apply redundantly or conflict outright.

- [ ] **(a) Fold all seven into the regenerated `00001` and delete the files; `db:reset` then applies
      exactly one migration, and the parity gate collapses to `cmp`** — ★ RECOMMENDED — it is the end state
      E1(c) implies, and it removes the parity guard's **larger** documented blind spot: the guard reads only
      `00001`, so an object that a later migration recreates (`get_nominations` lives in all three copies)
      can be correct in `schema/` and `00001` while the applied database carries `00002`'s stale definition.
      One file cannot have that class of bug.
- [ ] **(b) Regenerate `00001` but keep `00002`–`00008` as no-op history** — preserves the file record;
      keeps the blind spot, keeps the signature fixture, and leaves seven files that lie about what they do.
- [ ] **(c) Keep `00001`–`00008` and add `00009`+ as E1(a) proposed** — this is simply E1(a), which the
      operator overruled.

**This ruling has a precondition, not a preference, behind it:** (a) and E1(c) are only safe if **no
deployed database has run these migrations**. The guard's docblock calls deleting migration files "the most
history-destructive act available". If a staging or production Supabase project exists that was built by
`00001`–`00008`, say so and E1(a) must come back.

### 8.9 ⚠ NEW — Which organizations may a candidate create a parent nomination for?

§ 11.5 grants `nomination.create_parent`, but the operator's text does not say *whose* parent. The answer
decides whether this is a narrow convenience or a write channel into the public nomination table.

- [ ] **(a) Only the organization on the candidate's own row (`candidates.organization_id`), which an admin
      or an invite set** — ★ RECOMMENDED — `102-entities.sql` already carries
      `organization_id uuid REFERENCES public.organizations (id)` on `candidates`, so the relationship is
      already modelled and already admin-controlled. The candidate then creates a parent only for the party
      they were already recorded as belonging to, and the guard is one column comparison.
- [x] **(b) Any organization in the project** — matches a self-service flow where the candidate picks their
      party from a list at sign-up; means any authenticated candidate can insert an unconfirmed nomination
      for any party in any constituency, which is a spam surface even though nothing is published until an
      admin confirms it.
- [ ] **(c) Any organization, but only in the (election, constituency, round) the candidate is nominating
      into** — bounds (b) to the candidate's own contest; still lets a candidate attach a rival party to a
      constituency it never entered.

**NB: Let's also remove `candidates.organization_id`. It should not be displayed anywhere and is confusing.**

**ANSWERED 2026-09-15: the operator ticked (b), and § 11.8 makes it the only buildable option** —
`candidates.organization_id` is being **removed**, so (a)'s guard column will not exist. The two rulings
agree, which is the check that matters.

**The rate-limit concern (b) used to carry is largely discharged by § 11.7.** The new uniqueness constraint
means a candidate cannot create a *second* nomination for an organization already nominated at that
(election, constituency, round) — so the reachable row count is bounded by
`organizations × elections × constituencies × rounds` in the project, not by how many times a candidate
presses the button. What remains is that a candidate can create placeholder parents for parties they have
nothing to do with. Nothing is published until an admin confirms (§ 11.2), so this is a **queue-noise**
surface rather than a public-facing one. **162-12 should still cap the number of unconfirmed parent
nominations one candidate may originate**, and the admin queue should show who created each.

## 9. What I need from you

1. **§ 8.1–8.6** — six rulings, same checkbox convention as `162-DISCUSSION-POINTS.md` (unchecked = ★).
2. **The still-open decisions in `162-DISCUSSION-POINTS.md`** listed in § 7 — unchanged, and unchecked is a
   complete answer.
3. ~~**Confirmation that 1.1 is an operator amendment to PRESHIP-02**~~ — **ANSWERED 2026-09-14, see § 10.**

With those, `/gsd-plan-phase 162` has everything it needs and § 5 becomes the plan set.

**As of the 2026-09-15 amendments (§ 11) that list is shorter.** § 8.3 is answered, four `162-DISCUSSION-POINTS.md`
decisions are ticked, and § 9.3 is settled. What remains before planning: § 8.1, 8.2, **8.4** (which 162-02b
is ordered behind), 8.5, 8.6, **8.7** and **8.8** — plus the 23 still-open DISCUSSION-POINTS decisions, where
unticked remains a complete answer. **§ 8.8 first**, per § 11.9.

---

## 10. Operator rulings recorded

### 10.1 § 1.1 is an operator amendment to PRESHIP-02 — ruled 2026-09-14

**Operator ruling:** *"Yes — record it as my amendment."*

Asked as § 9.3: whether dropping the suggested-changes store is an operator amendment to PRESHIP-02, a
requirement marked **blocking ship** whose criterion 4 requires the `suggest for approval` branch
implemented and tested. It is.

**What this settles:**

- **No `change_suggestions` table and no `suggest` member of `grant_permission`.** Users who want a change
  they cannot make message an admin — `162-USER-RIGHTS.md`'s wording, carried unchanged.
- **PRESHIP-02 criterion 4 is amended by the operator**, not by inference and not by a planner's reading.
  The removed obligation is the `suggest for approval` branch and its tests; the rest of PRESHIP-02 stands,
  including its blocking-ship status.
- **`162-DISCUSSION-POINTS.md` C3 is closed as (c)** — already recorded in § 7, now with the amendment
  authority § 9.3 asked for.

**Where 162-01 must carry it:** `162-SPEC.md` states the amendment and quotes this ruling; the PRESHIP-02
row in `.planning/REQUIREMENTS.md` is edited in the same plan, dated, so the requirement text and the
criterion it no longer carries do not disagree. 162-02 makes the matching ROADMAP § Phase 162 correction.

### 10.2 No database has been published — ruled 2026-09-15

**Operator ruling:** *"don't care about migrations, no supabase db has been published yet"*

This is the precondition § 8.8 and § 11.3 were both blocked on, and it **discharges both**. The reasoning
those sections carried — that deleting migration files is safe only if nothing has deployed them — is now
answered from the operator's own knowledge of the deployment estate, which is the only place that answer
could have come from.

**What it settles:**

- **§ 8.8(a) stands**: `00002`–`00008` are folded into a regenerated `00001` and deleted. The parity gate
  collapses to the one-line `cmp` its own docblock says the fold enables, and the guard's **larger**
  documented blind spot — it reads only `00001` — ceases to exist because there is only `00001`.
- **E1(c)'s stated cost is not a cost here.** The option text warns that rewriting `00001` in place
  "destroys the applied history every deployed database has run". There is no such database.
- **The README's dual-schema contract needs rewording, not just obeying** — 162-02b now also updates
  `apps/supabase/README.md`, since the two-copies-that-must-agree framing is what the fold removes.
- **Every later plan inherits it.** No plan in § 5 writes a `DROP COLUMN`, a `DROP POLICY … ; CREATE POLICY`
  pair, or a backfill-for-existing-rows step for the sake of a deployed database. `162-16`'s `published`
  removal and `162-15`'s `user_roles` drop are deletions from a declarative file, nothing more.

**The one thing that does not change:** backfills for the *local* database still matter, because
`yarn db:reset` re-seeds from `seed.sql` and the E2E suite builds its own project. `open_for_voters` and
`entities.confirmed` still need their seed-time values set (§ 11.2, 162-07) — not to protect production
rows, but so a reset local stack is not blank.

### 10.3 Still open

The § 7 decision list is as recorded there. Under the standing convention an unticked box is a complete
answer that selects its ★ RECOMMENDED option.


---

## 11. Amendments of 2026-09-15 (operator)

Four changes, given in the operator's words and expanded here into what the schema and the policies must
say. Each is already carried into §§ 3–8 above — this section is the *reason*, not a second copy of the
rule. Facts 28–31 are new measurements taken this session at HEAD `440a7780f`.

### 11.1 Split `project.edit_settings` into two permissions

> "project.edit_project_settings (project table): admin only
> project.edit_app_settings (app settings table): editors too"

**What it fixes.** § 3.5 already put the two kinds of setting in two different tables — RLS-read flags
(`open_for_voters`, `lock_nominations`) as typed columns on `projects`, app-flow config in
`app_settings.settings` — but § 3.2 still governed both with **one** permission. A single permission over
two tables with different risk profiles is the collapse this phase exists to end: it forces the grant to be
as strong as the more dangerous of the two, which is why `ProjectEditor` was a `?` in the original matrix.

| Permission | Table | Holder | What it can change |
|---|---|---|---|
| `project.edit_project_settings` | `projects` | admin only | `open_for_voters`, `lock_nominations` — the flags **RLS itself reads**. Writing them changes who may read the project |
| `project.edit_app_settings` | `app_settings` | admins **and** project editors | `settings` and `customization` JSONB — theme, copy, the auth-method matrix, `preRegistration.enabled`. Read by the app, **never by a policy** |

**The line between them is exactly "does a policy read this?"** — which is also K3's line, so the split
costs no new concept. An editor can retheme and re-word the running application without being able to open
it to the public or unlock nominations.

**Consequence for `162-13` and the RLS estate:** `app_settings` gets an UPDATE policy on
`project.edit_app_settings`; `projects` gets one on `project.edit_project_settings`. Today both would have
been one predicate.

### 11.2 `entities.confirmed`, default `false`

> "Entity.confirmed default false
> -> use identity provider, use preseeded emails or codes with names => true
> -> editor/admin can change
> -> when true, name(s) cannot be changed (data is treated immutable in that case)
>
> Nominations and entities are publicly readable only if the nominations and their linked entities are
> readable, i.e. all are confirmed
>
> Sign up flow thus includes and identity confirm step usually paired with confirming nominations"

**This is a new column and a new invariant, not a rename.** Fact 28: no entity table has any confirmation
concept today — `102-entities.sql` gives `organizations`, `candidates`, `factions` and `alliances` no such
column, and the only confirmation state anywhere in the schema is `nominations.unconfirmed` (fact 20),
which is about the *nomination*, not the entity.

**The column.** `confirmed boolean NOT NULL DEFAULT false` on all four entity tables, declared inside each
`CREATE TABLE` (§ 11.4), backfilled `true` for existing rows so nothing visible today disappears.

**Note the polarity is opposite to the existing one.** `nominations.unconfirmed` defaults `false`, meaning
*confirmed*; `entities.confirmed` defaults `false`, meaning *unconfirmed*. Two adjacent booleans that read
in opposite directions is a defect waiting to happen. **162-12 should flip `nominations.unconfirmed` to
`nominations.confirmed`** while it is already rewriting those policies — a rename plus a negation, in a
phase that is touching every one of its readers anyway.

**How it becomes true.** Three paths, and they are the four sign-up methods seen from the database side:

| Path | Sets `confirmed` | Why |
|---|---|---|
| Identity-provider sign-up (`identity-callback`) | `true` on creation | A strong identity check already happened; the name came from the IdP, not the user |
| Seeded with a name **and** an email or a registration code | `true` on creation | The operator asserted the identity when they seeded it; the invite proves possession of the channel |
| Anything else (self-service `open` sign-up, admin-created stub) | stays `false` | No identity check has happened yet |
| Admin or project editor toggles it | either way | `entity.confirm`, new in § 3.2 |

The second row **depends on phase B (§ 6.1)** — fact 16 records that entities carry no `email` and no code
column today, so the channel that would justify `confirmed = true` does not yet exist. **162 ships the
column, the permission, the immutability rule and the read rule; 6.1 wires the second row's trigger.** In
162 the only automatic setter is `identity-callback`.

**The read rule is the sharp end.** "Publicly readable only if the nominations and their linked entities
are readable, i.e. all are confirmed" makes public visibility **transitive and conjunctive**: a nomination
is public only if it is confirmed *and* every entity it links is confirmed, and an entity is public only
through such a nomination. A confirmed nomination of an unconfirmed candidate is invisible, and so is the
candidate. § 3.4 now states this; 162-08 implements it.

**Why this is stronger than it looks.** It closes a real hole in the model as it stood this morning: an
admin could seed a candidate with a placeholder name, confirm the nomination, and the placeholder would be
public. Under § 11.2 the entity has to be vouched for *as an identity* before anything about it is
published.

**And it gives the sign-up flow its shape** — the operator's third line. An identity-confirm step
"usually paired with confirming nominations" is what turns both flags true in one act, which is why the two
were conflated in the earlier drafts. They are separate flags with separate permissions
(`entity.confirm`, `nomination.confirm`) that a single UI step will usually set together. § 6.2 owns that
step; 162 owns the two flags it sets.

**One thing the operator's wording does not settle** — whether a confirmed entity's name is frozen for
*everyone* or only for the entity user — is § 8.7.

### 11.3 The migration model, changed by the E1(c) tick

The operator ticked **E1(c)**, *"Rewrite `00001_initial_schema.sql` in place"*, overruling E1(a)'s
six-migration sequence. § 5 is rewritten accordingly. What the tick buys, measured:

**Fact 29 — the parity guard already names this as the better end state, and calls it too destructive to
choose on its own authority.** `scripts/assert-schema-migration-parity.mjs`, in its own docblock:

> *"Folding them into `00001` would collapse this check to a one-line `cmp`, but that deletes migration
> files — the most history-destructive act available — so the non-destructive form is used instead."*

The guard's author declined the fold because it was not theirs to choose. It is the operator's, and the
operator has chosen it.

**Fact 30 — the fold removes the guard's larger self-documented blind spot.** The docblock again:

> *"It reads ONLY `00001`. `00002` and `00003` are never opened. So a change written correctly into BOTH
> `schema/` and `00001`, for an object that a LATER migration recreates, leaves this signature unchanged
> and this check green — while the applied database carries the later migration's stale definition.
> `get_nominations` lives in all three copies … This is the LARGER of the two blind spots."*

A 97-policy rewrite is precisely the change most likely to trip that. Going into wave 4 with one migration
file instead of eight is a risk reduction, not merely a tidy-up.

**What it costs.** Per-stage revertibility of an applied database: with no migration history there is
nothing to roll back to but a reset. That is acceptable only while no deployed database has run
`00001`–`00008` — **and the operator ruled on 2026-09-15 that none has** (§ 10.2). The precondition this
paragraph was blocked on is discharged; the cost is not a cost here.

**What it does not cost.** K1's shim lifecycle, which is a sequence of reviewable commits, not of files.

### 11.4 Schemata fully declarative — merge the `ALTER TABLE … ADD COLUMN` accretion

> "Make sure schemata are fully declarative, merge this kind:
> `ALTER TABLE public.app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb;`"

**Fact 31 — there are 25 such sites in `schema/`, in five files**, and they fall into two classes that
deserve different treatment:

| File | Sites | Class |
|---|---|---|
| `106-app-settings.sql:18` (`customization`) | 1 | **Intra-file.** `CREATE TABLE public.app_settings` begins **thirteen lines above it, in the same file.** There is no ordering constraint of any kind — this is pure accretion, and it is the example the operator quoted |
| `102-entities.sql:47` (`terms_of_use_accepted`) | 1 | Intra-file — `CREATE TABLE public.candidates` is 24 lines above |
| `105-answers.sql` (`answers` on 2 tables) | 2 | **Cross-file** — base tables are in `102-entities.sql` |
| `300-auth-tables.sql` (`published` on 10 tables) | 10 | Cross-file. The file says so: *"Using ALTER TABLE since the base tables are defined in earlier schema files"* |
| `500-external-id.sql` (`external_id` on 11 tables) | 11 | Cross-file |

**The rule.** A column belongs in its table's `CREATE TABLE` body. `ALTER TABLE … ADD COLUMN` in a
declarative schema file is a migration artefact that escaped into the readable copy, and it is how
`app_settings` came to be defined in two places twelve lines apart.

**The two intra-file sites are unconditional** — merge them, there is no argument on the other side.

**The 23 cross-file sites have one**, and it should be stated rather than steamrolled: they exist to keep a
*concern* in one file. All 11 `external_id` columns, their 11 unique indexes and their immutability trigger
read as one thing in `500-external-id.sql`; scattered into eleven `CREATE TABLE` bodies, the columns lose
the header that explains them. **The resolution is to move the column declaration and leave the concern
file owning everything else** — indexes, triggers, grants, and a header comment that now says *which tables
carry the column* instead of adding it. The file stops being a second definition site and becomes what its
name claims: the place the concern is explained and enforced.

**`published` is the exception that proves it, and it is now settled:** § 8.4(b) deletes those 10 columns
inside this phase, so 162-02b **does not merge them** — merging a column that 162-16 removes is wasted work
that shows up twice in the diff. **162-02b therefore merges 15 of the 25 sites**, and leaves
`300-auth-tables.sql`'s 10 exactly as they are, with a one-line comment saying they are scheduled for
deletion by 162-16. The ordering constraint this paragraph used to carry is discharged.

**Why this lands as its own plan (162-02b), first.** It is behaviour-neutral by construction — the applied
database is byte-identical before and after — so it is provable on its own and reviewable as a pure
restructuring. Landing it *before* wave 1 means the 22-member enum, the `grants` table, `open_for_voters`,
`lock_nominations`, the repurposed `election_type` and four `confirmed` columns are all written into an
already-declarative tree, instead of adding eight more `ALTER`s to a pile the next phase has to clear.

### 11.5 A child nominee may create its own unconfirmed parent nomination

> "when a candidate defines their nomination in a party list setting (or similarly for any child nominee),
> they must be able to create an unconfirmed organization nomination as the parent if one does not exist for
> that el+co pair
> exceptions:
>   - the candidate as in independent one, in which case the nomination has no parent
>   - their party is not available as an organization entity yet, they must be able to fill in a free text
>     description of the party name with no actual parent nomination created. This can be saved in
>     nomination.customData.requestedParentOrganization. It will be handled by the admin during nomination
>     confirmation."

**The hierarchy this needs already exists; the permission does not.** Fact 32: `104-nominations.sql` already
has `parent_nomination_id uuid REFERENCES public.nominations (id)`, and `validate_nomination()`
(`011-validation-functions.sql:226`) already enforces exactly the three rules this feature depends on — a
candidate's parent must be an `organization` or `faction` nomination; parent and child must share
`election_id`, `constituency_id` **and** `election_round`; and a candidate with a NULL parent is legal and
returns early. **The independent-candidate exception is therefore already the schema's behaviour** and needs
no work at all. What is missing is only the right to insert the parent row.

#### The three branches, restated as what the database does

| Branch | `parent_nomination_id` | Parent row | `custom_data` |
|---|---|---|---|
| **Party list, parent exists** | the existing organization nomination | untouched | — |
| **Party list, parent missing** | the row the candidate creates | **new, `unconfirmed = true`**, linking an existing `organizations` row at the same (election, constituency, round) | — |
| **Party not an entity yet** | `NULL` | **none created** | `requestedParentOrganization: "<free text>"` |
| **Independent** | `NULL` | none | — |

#### ⚠ Note what rows 3 and 4 have in common

**They are byte-identical in every column.** Both are a candidate nomination with a NULL parent. The *only*
thing distinguishing "I am independent" from "my party is not in the system yet" is the presence of the
`requestedParentOrganization` key in `custom_data`. Three consequences the plan must carry:

1. **The admin confirmation queue keys off that presence**, not off a status column. 162-17's flow check has
   to assert it, because nothing in the schema will.
2. **A nomination carrying `requestedParentOrganization` must not be confirmable** until an admin resolves
   it — otherwise a candidate who asked for a party gets published as an independent, which
   misrepresents them to voters. This is a `nomination.confirm` guard, and it is the one place this feature
   touches the public-read path.
3. Whoever builds § 6.2's UI must ask the candidate to *choose* between the two, never infer it.

#### `nomination.create_parent`, and why it is its own permission

The insert a candidate needs is **not** on their own nomination — it is on an **organization's**. Under
§ 3.3, `nomination.edit` is `own`, and this row is by definition not theirs. Folding the capability into
`nomination.edit` would mean widening "own" to "own, plus any organization nomination I claim to belong to",
which is precisely the re-derivation-inside-a-policy this phase exists to end. A named verb keeps
`user_can` the single place the question is answered, and makes the capability independently revocable and
independently testable.

**Granted to `candidate` and to faction/alliance editors** — the operator's "or similarly for any child
nominee" — and **not** to `OrganizationEditor`, whose parent would be an alliance nomination; nothing in
`162-USER-RIGHTS.md` asks for organizations to self-nominate into alliances, and granting it would let an
organization insert itself under an alliance it has no relationship to.

#### The five guards, because this is a hole in `own` and holes leak

The policy must permit the insert **only** when all five hold. Any one of them missing turns a convenience
into a way for any authenticated candidate to write rows into the public nomination table.

1. **The inserted row is an organization nomination** — `organization_id IS NOT NULL`, every other entity FK
   NULL.
2. **It is created unconfirmed**, and the candidate cannot set that column otherwise (see the column-grant
   finding below).
3. **No nomination already exists** for that `(organization_id, election_id, constituency_id,
   election_round)`. The operator's "if one does not exist for that el+co pair" — extended to include
   `election_round`, because `validate_nomination` already treats the round as part of the identity of a
   parent.
4. **`lock_nominations` is false** — inherited from `nomination.edit`'s "unless locked". A locked project
   must not be writable through a side door.
5. **The candidate is inserting their own child nomination in the same transaction**, or already has one at
   that (election, constituency, round). A candidate must not be able to create parent rows they never
   nominate under.

#### ⚠ Three findings from the tree that this feature depends on

**Fact 33 — there is no uniqueness constraint to make guard 3 enforceable.** `200-indexes.sql` has seven
plain indexes on `nominations` and the only UNIQUE one anywhere is `idx_nominations_external_id`
(`500-external-id.sql:64`). Nothing stops two rows for the same organization in the same election and
constituency. Guard 3 checked only in a policy predicate is a **race**: two candidates of the same party
submitting concurrently both see "no parent exists" and both create one, and the party appears twice on the
public list. **⚠ SUPERSEDED 2026-09-15 by § 11.7.** Do not add the organization-scoped partial index this paragraph
originally proposed. The operator specified a general uniqueness key —
`(candidate_id, faction_id, organization_id, alliance_id, parent_nomination_id, election_id,
constituency_id, election_round)` — which covers this case and the several others like it, and which must
be written `UNIQUE NULLS NOT DISTINCT` or it enforces nothing at all. § 11.7 is the statement of record.
The conclusion this paragraph reached still holds: **let the constraint, not the policy predicate, be the
thing that decides.**

**Fact 34 — `nominations` has no column grants at all.** `303-column-grants.sql` mentions the table **zero**
times; it protects only `candidates` and `organizations`, and only their `UPDATE`. That has been harmless
because nominations were admin-only to write (fact 19). The moment a candidate holds INSERT,
**every column is theirs to set** — including `unconfirmed`, `sort_order`, `election_symbol`, `name` and
`published` while it still exists. Guard 2 is not a policy clause, it is a `GRANT INSERT (…)` column list
that this file must grow. **This is the amendment's sharpest edge**: without it, "create an *unconfirmed*
parent" is a request the database has no way to insist on.

**Fact 35 — `parent_nomination_id` is `ON DELETE CASCADE` (`104-nominations.sql:47`).** When an admin
rejects a candidate-created placeholder by deleting it, **every candidate nomination under it is silently
deleted too** — including candidates who joined the same placeholder later and had nothing to do with
creating it. This is a live hazard the feature introduces, because before it no non-admin could ever create
a parent. 162-12 must decide deliberately: either the admin flow re-points children before deleting, or the
FK becomes `ON DELETE RESTRICT` so the database refuses to orphan them. **Do not leave it as CASCADE by
default** — that is the quiet data-loss path.

#### Where it lands

All of it in **162-12**, which already owns the entity-user nomination policies; § 5 is updated. The free-text
branch needs no policy of its own — `custom_data` is already a column on `nominations`
(`104-nominations.sql:23`) and already writable, so branch 3 is an ordinary self-nomination insert plus a
JSONB key. **162-17** asserts the confirmation-queue behaviour and the "cannot confirm while
`requestedParentOrganization` is set" guard.

**One question the operator's text does not settle** — *which* organizations a candidate may do this for —
is § 8.9.

### 11.6 What § 8.4(b) pulls into the phase

The ★ argument for (a) was never about the migration; it was that dropping the columns touches `dev-seed`,
`seed.sql`, the bulk-import RPCs, the adapter and a large share of the 43 E2E specs. **That cost is real and
it is now inside 162.** Two things make it cheaper here than the ★ assumed:

- **§ 11.3 removed the migration half of it.** Under E1(c) there is no `DROP COLUMN` migration to write and
  re-baseline; the columns simply cease to appear in the declarative schema.
- **§ 11.4 was going to touch all 10 anyway.** They are `300-auth-tables.sql`'s ten `ADD COLUMN` sites —
  the largest single block of the declarativity pass. Deleting them is strictly less work than merging them.

**What remains, and must be a named plan rather than a footnote — `162-16`:** the 10 columns, their 10
partial indexes, `published` in `303-column-grants.sql`'s two protected-column comments, the `published`
term in every anon policy, the dev-seed templates and `permittedKeys.ts`, `seed.sql`, the bulk-import RPCs'
column lists, the adapter's selects, and the E2E specs that publish rows to make them visible — which must
now set `open_for_voters` and the two confirmation flags instead. **It runs in wave 6, after 162-15**, so
the full E2E suite absorbs one visibility-model change rather than two.

### 11.7 The nomination uniqueness constraint

> "make the nominations uniqueness constraint:
> candidate_id, faction_id, organization_id, alliance_id, parent_nomination_id, election_id,
> constituency_id, election_round
> => this means that an entity may be nominated only once in a given el-co-rnd combo unless it's nominated
> by a different parent, i.e., multiple parties nominating the same presidential candidate"

**This supersedes § 11.5's fact-33 proposal**, which was organization-scoped and narrower. The operator's
key is the general statement of the same idea: identity of a nomination is *(who, under whom, where,
when)*. Including `parent_nomination_id` is the substantive choice — it is what admits the
presidential-candidate case, where the same person is nominated in the same contest by three different
parties, and each of those is a genuinely distinct nomination rather than a duplicate.

#### ⚠ A plain `UNIQUE` on these columns does nothing at all

This is the one thing that must not be got wrong. **PostgreSQL's default `UNIQUE` treats NULLs as
distinct**, so two rows never conflict if any keyed column is NULL in either of them. On this table:

- `104-nominations.sql`'s CHECK requires **exactly one** of the four entity FKs to be non-null, so **every
  row has three NULL entity FKs, always**.
- `parent_nomination_id` is NULL for every top-level nomination.

A plain `UNIQUE (candidate_id, faction_id, organization_id, alliance_id, parent_nomination_id, election_id,
constituency_id, election_round)` would therefore **never reject anything** — it would be a constraint that
looks like a guarantee in the schema, reads like one in review, and enforces nothing. That is worse than
having none, because it would retire the § 11.5 guard-3 race without actually closing it.

**The fix is one clause.** `UNIQUE NULLS NOT DISTINCT (…)` makes NULLs comparable and gives the constraint
exactly the semantics the operator stated:

```sql
CONSTRAINT nominations_entity_parent_contest_key
  UNIQUE NULLS NOT DISTINCT (
    candidate_id, faction_id, organization_id, alliance_id,
    parent_nomination_id, election_id, constituency_id, election_round
  )
```

**Fact 36 — `NULLS NOT DISTINCT` is a PostgreSQL 15 feature and this project is on PostgreSQL 15 exactly**
(`supabase/config.toml:39`, `major_version = 15`). It is available, and it is available with no margin:
this becomes the first thing in the schema that pins the floor at 15. Say so in the constraint's comment,
because a future downgrade would silently turn the constraint into the no-op above rather than fail to
apply. The expression-index alternative — unique on
`COALESCE(candidate_id, organization_id, faction_id, alliance_id)` plus a sentinel-COALESCEd parent — works
on any version but is unreadable and needs its own comment explaining the sentinel, so the declarative form
is better as long as the floor is stated.

**Name the constraint explicitly**, per the precedent already set two lines below it in the same file:
`nominations_election_round_check` is named in source because `156-DISPOSITIONS.md` cites it and pgTAP's
`throws_ok` has to match it. The same reasoning applies here — 162-17 will assert this constraint by name.

#### What it changes elsewhere

| Where | Change |
|---|---|
| § 11.5 guard 3 | The policy predicate stays as a fast path and a better error message; **this constraint is the guarantee.** The race is closed by the database, not by a `NOT EXISTS` in a policy |
| § 11.5 fact 33 | Superseded — do **not** add the organization-scoped partial index; this constraint covers that case and more |
| `162-12` | Adds the constraint, with a pgTAP pair: a genuine duplicate rejected, and the multi-party presidential case **accepted** |
| `dev-seed`, `seed.sql`, E2E fixtures | Any fixture that currently emits a true duplicate will now fail at seed time. **Measure this before writing the constraint** — it is the one place the amendment can break a green suite |

**162-17 must assert both directions.** A constraint that rejects duplicates is half the requirement; the
other half is that it *admits* the same candidate nominated by two different parents, which is the case the
operator gave as the reason for the shape. A test suite that only checks rejection would stay green if
someone later "simplified" the key by dropping `parent_nomination_id`.

### 11.8 `organization_id` moves from `candidates` to `factions`

> "I said that organization_id is removed from candidates, but add it to factions as a required column;
> constrain their nominations such that the parent nomination must be that of the same organization"

**Fact 37 — `factions` has no `organization_id` today.** `102-entities.sql`'s `CREATE TABLE public.factions`
carries only the common entity columns; a faction's relationship to its organization exists **solely**
through the nomination hierarchy, where `validate_nomination()` requires a faction's parent to be *an*
organization nomination but has no way to say *which*. That is the gap this closes: today a faction could be
nominated under any organization at all, including one it has no relationship to.

**Fact 38 — `candidates.organization_id` has consumers in three layers**, and removing it is a real sweep
rather than a column drop: `200-indexes.sql:32` (its index), `303-column-grants.sql:14` (listed among the
protected columns), `302-rls.sql:525` (a comment citing it), `503-entity-rpcs.sql:69` and `:117`
(`c.organization_id AS entity_organization_id`, and a second select list), `502-email-helpers.sql:82`,
`packages/dev-seed`'s `CandidatesGenerator.ts` and `permittedKeys.ts`, and the frontend adapter
(`supabaseDataProvider.ts` plus three test files). The RPC return shapes are the sharp edge — dropping a
column from a `RETURNS TABLE` changes a contract Phase 164 has already audited.

#### ✅ This closes a known open defect

**Fact 39 — removing it resolves RES-7 / T-144-11**, open since 2026-08-23 (`WINDOWS.md` row 59).
`packages/supabase-types/src/column-map.ts` maps **both** `organization_id` (the candidates column, line 17)
and `organization_id_nom` (the nominations column, line 32) to the same property `organizationId`;
`PROPERTY_MAP` is a last-wins reversal, so `FIELD_MAP.organizationId` resolves to a column that exists on no
table — measured at 0 hits in `database.ts` and 0 in the SQL schema. **The collision has exactly one cause:
two tables with a column of the same name, one of which is now going away.** Worth naming in the plan, and
worth closing the todo in the same commit rather than leaving it to be rediscovered.

#### The faction column

```sql
organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE
```

**`NOT NULL` is the operator's word ("required"), and it makes the backfill a decision rather than a
default.** Existing faction rows have no organization to point at; under § 10.2 there is no deployed
database, so the answer is that `seed.sql`, the dev-seed faction generator and any E2E fixture must supply
one from the start. **If any built-in template emits a faction without an organization, it stops seeding** —
check before writing the column, same as § 11.7.

**`ON DELETE CASCADE`, not `SET NULL`** — `NOT NULL` forecloses `SET NULL`, and a faction without its
organization is not a meaningful row. The alternative, `RESTRICT`, would block deleting an organization that
has factions; CASCADE matches how `project_id` already behaves on the same table.

#### The nomination constraint

`validate_nomination()` already requires `p_parent_type = 'organization'` for a faction child
(`011-validation-functions.sql`). The amendment tightens *an* organization to **the** organization:

> For a nomination whose `faction_id` is set, the parent nomination's `organization_id` must equal that
> faction's own `organization_id`.

**It belongs in the trigger, beside the check it tightens** — not in a CHECK constraint, which cannot read
another table, and not in a policy, which would leave admin-path writes unguarded. The trigger's existing
`SELECT … INTO` already reads the parent row for `election_id`, `constituency_id` and `election_round`, and
already touches `p.organization_id` inside its entity-type `CASE` — but does not capture it. So the change
is **one more column on a query that already runs, plus one lookup of the faction's own
`organization_id`** — not a new round trip on the hot path.

**The error message matters here.** `validate_nomination` raises named, specific exceptions for every other
hierarchy violation (`'Faction nomination parent must be an organization nomination, got %'`). This one
should follow the pattern and name both organizations, because the failure will otherwise look identical to
the existing parent-type error to anyone reading a seed log.

#### Where it lands

A plan of its own — **`162-07b`**, in wave 3 with the other entity-column work — because it spans the
schema, two RPC return shapes, `dev-seed`, the adapter and `column-map.ts`, and because its E2E blast radius
is different in kind from the permissions rewrite around it. The nomination-trigger half runs in **162-12**
with the other nomination work, after the column exists.

### 11.9 What these amendments closed

**Every § 8 ruling is resolved.** Four by operator tick, one in the matrix, one by a direct operator ruling,
and the rest by the standing convention that an unticked box selects its ★ option:

| Ruling | Resolution | Route |
|---|---|---|
| 8.1 Two roles or three | **Two** — `admin` / `editor`; criterion 1 amended | ★ default |
| 8.2 `election_type` collision | **`election_type` repurposed** — keeps its name, takes the new meaning, the old `'general'`/`'local'` values deleted | **operator free-text note, overrules the ★** |
| 8.3 ProjectEditor's three cells | feedback ✓ ✓, project settings — | **operator, in the matrix** |
| 8.4 The 10 `published` columns | **Dropped inside 162** → plan 162-16 (§ 11.6) | **tick (b), overrules ★** |
| 8.5 B and C as v2.16 | **Yes** — v2.15 ships when 162 closes | ★ default |
| 8.6 Spike `user_can` first | **No** — measure in wave 1 | ★ default |
| 8.7 Confirmed name frozen for whom | **Entity user only**; `entity.edit_immutable` still bites | ★ default |
| 8.8 Migrations `00002`–`00008` | **Folded into `00001` and deleted**; parity gate → `cmp` | **operator ruling, § 10.2** |
| 8.9 Whose parent may a candidate create | **Any organization in the project** — and § 11.8 removes the column (a) depended on, so tick and amendment agree | **tick (b), overrules ★** |

| Was open | Now |
|---|---|
| § 8.3 — three `?` cells for `ProjectEditor` | **Answered** by the operator's matrix edit + § 11.1's split |
| § 7's "still open" list — 26 decisions | **23** — A4, C3, E1, G2 ticked; B5 noted as overridden |
| § 9.3 — PRESHIP-02 amendment authority | **Answered** 2026-09-14 (§ 10.1) |
| § 8, nine rulings | **All resolved** — see above |
| RES-7 / T-144-11, open since 2026-08-23 | **Closed by § 11.8** as a side effect (fact 39) |

**Both preconditions that stood here earlier are discharged.** § 8.8's — that no deployed database exists —
was ruled directly by the operator (§ 10.2). § 8.9's was moot: the column its ★ option depended on is being
removed (§ 11.8). **Nothing in this plan is now blocked on a question only the operator can answer.**

**What replaces them are three measurements to take before writing code** — each capable of breaking a
green suite, none of them a decision:

1. **Does any fixture emit a nomination the § 11.7 key would reject as a duplicate?** `seed.sql`, the 30
   built-in dev-seed templates, the E2E fixtures. Take this before writing the constraint.
2. **Does any fixture emit a faction with no organization?** § 11.8 makes the column `NOT NULL`, so such a
   row stops seeding.
3. **What breaks when `candidates.organization_id` leaves the two `503-entity-rpcs.sql` return shapes?**
   That is a contract Phase 164 audited for nullability; changing its columns is exactly what its guard
   exists to notice.

These belong to 162-07b and 162-12 as their first task, not to a ruling.

**One correctness trap outranks all of it:** § 11.7's constraint **must** be written
`UNIQUE NULLS NOT DISTINCT`. Written as a plain `UNIQUE`, it enforces nothing at all on this table — and it
would look like a guarantee in the schema, in review, and in the diff.
