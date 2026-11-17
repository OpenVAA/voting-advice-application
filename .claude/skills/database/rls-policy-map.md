# RLS Policy Map

**Derived from the applied database on 2026-09-17**, at the close of phase 162, by querying `pg_policies`,
`pg_enum`, `pg_proc` and `information_schema` — not transcribed from any schema file and not edited from a
previous author's reading. Every policy named below exists in `pg_policies`, and every policy in
`pg_policies` for `public` and `storage` is named below; that set equality is asserted in **both**
directions by `162-17-PLAN.md` Task 8, because a document that invents a policy misleads as badly as one
that omits one.

**108 policies: 93 in `public`, 15 in `storage`** (measured 2026-10-11; `select schemaname, count(*) from pg_policies where schemaname in ('public','storage') group by 1`). Declared in
`apps/supabase/supabase/schema/302-rls.sql`, `300-auth-tables.sql`, `303-column-grants.sql`,
`304-terms-of-use-acceptances.sql`, `305-invitations.sql` and `400-storage.sql`. The CLI applies `migrations/`, never `schema/`
(`config.toml` sets `[db.migrations] schema_paths = []`), so the applied database is the authority and this
file describes it.

**Re-derived in part on 2026-10-06**, at the close of phase 172, from the same catalogue views: the two
policy counts above, the `terms_of_use_acceptances` row and section, the eight entity SELECT assemblies,
the `candidates` row of the column grants and the size of check 9001's exemption list. Everything else
stands as derived on the date in the first paragraph.

**Re-derived in part on 2026-10-07**, at the close of phase 174, from the same catalogue views
(`select schemaname, count(*) from pg_policies where schemaname in ('public','storage') group by 1`):
the two policy counts above, the `invitations` row and its section, the paragraph on the permission
members no policy reads, the same-permission section, and the invitation rows of the two tables at the
end. Everything else stands as derived on the earlier dates.

> **What phase 162 replaced.** The predecessor of this document described five named role levels
> (`candidate`, `organization`, `project_admin`, `account_admin`, `super_admin`), a `user_roles` table, a
> `can_access_project(project_id)` predicate and a per-row `published` visibility flag. **None of those
> exists.** They are named here once, in this paragraph, so a reader arriving with the old vocabulary can
> orient — and nowhere else in this file.

---

## The authority model in one paragraph

A **grant** is a row of `public.grants`: `(user_id, scope, target_type, target_id, role)`. Every authority
question in the database is asked of exactly one function, `public.user_can(scope, target_id, permission,
target_type)`, which reads the caller's rows of `public.grants` for `(SELECT auth.uid())` -- never the token's
claim, so a deleted grant is denied at once, for the next read and the next write of a session whose token
still carries it -- resolves them against the 23-member `grant_permission` enum and reaches **downward** — a grant at
`global` answers for every account, a grant at `account` for every project it owns, a grant at `project`
for every entity in it, and a grant at `entity` for that entity and, through `is_child_nominee`, for its
child nominees. The Access Token Hook still projects a caller's grants into the `grants` claim of their
access token, for the frontend's app-entry gates alone; no policy and no function reached from one reads it.

**An entity is named by its type and id together.** The four entity tables have independent primary keys,
and a project admin chooses the `id` of an entity it inserts, so one uuid can name a candidate in one
project and an organization in another. At `entity` scope `user_can` therefore takes the entity type as its
fourth argument: a NULL type denies, an entity grant reaches only the entity of its own `target_type`, and
every hop resolves the pair — `private.entity_project_id(entity_type, uuid)` reads the one table the type
names, and `private.is_child_nominee(parent_type, parent_id, child_type, child_id)` matches both sides by
type. The entity policies pass their table's literal (`'candidate'::public.entity_type`, …), the
nomination policies and `caller_nominated_in_contest` the row's generated `entity_type`,
`enforce_entity_immutability` the type derived from `TG_TABLE_NAME`, and `storage_path_can` the type its
path segment names. At every other scope `target_type` defaults to NULL and is ignored, so project- and
account-scope callers, the Edge Functions' `callerMayOnProject` included, pass three arguments.
`33-entity-type-collision.test.sql` asserts a shared id across two tables and two projects.

The child-nominee reach (`nomination.read`) is **basic data only** (SPEC § 7). A row policy cannot express
"basic data" — it returns every column, `answers` included — so the four entity SELECT policies do **not**
carry a `nomination.read` disjunct. The parent's reach to a child entity is the SECURITY DEFINER RPC
`get_entity_basic_data(p_entity_type, p_entity_id)` (`503-entity-rpcs.sql`), gated on that same `user_can` call,
probing only the table the type names, and returning an
allow-listed column projection (162-REVIEW CR-02). The `nominations` SELECT policy keeps its
`nomination.read` disjunct, because a nomination row carries no answers.

The opposite reach, a child to the parent it stands under, is the SECURITY DEFINER RPC
`get_entity_nominations(p_project_id, p_entity_type, p_entity_id)` (`503-entity-rpcs.sql`). A parent's
nomination and its entity row are refused to the child's editor by the SELECT policies while the
parent is unconfirmed, and always in a project that is not open for voters, so the function returns
the parent as an allow-list of `entity_type`, `entity_id`, `name` and `short_name` and nothing else of it. Its gate
is the caller's own editor grant on the named candidate or organization, read through
`private.caller_entity_ids` before any row is read; `user_can` is not asked, because it answers yes
for admins and, through the child-nominee hop, for the editor of a parent organization. It answers
`NULL` for every caller without that grant and an empty array for an entity with no nomination, and it
is executable by `authenticated` only.

The entities a child may name as its parent are a third definer read,
`get_nomination_parent_options(p_project_id, p_entity_type, p_entity_id, p_contests)`
(`503-entity-rpcs.sql`): for a candidate every confirmed organization of the project, for an
organization every alliance, each as an allow-list of `id`, `entity_type`, `name`, `short_name`, `color`,
`image` and `nominated`. An entity's editor cannot read those rows through its own SELECT policies in a
project that is not open for voters, and a policy that admitted them would return every column. Its gate
is the same `private.caller_entity_ids` lookup, on the named entity; `user_can` is not asked, so a
project admin is answered `NULL`. `44-nomination-parent-options.test.sql` holds it.

**The write side has no definer function.** `set_entity_nominations(p_entity_type, p_entity_id,
p_nominations, p_expected_reach)` is SECURITY INVOKER: every statement of it runs under the policies below, the column
grants and the triggers, so a direct write of the same rows meets the same refusals. It asks `user_can`
once, for `nomination.edit` on the entity, before it reads anything, and it raises `42501` when an UPDATE
or a DELETE affected fewer rows than it named, because row-level security refuses those two verbs by
hiding the row and not by an error. `43-set-entity-nominations.test.sql` holds it. Its shared rules are
SECURITY INVOKER functions of `private` that `create_invitations` asks too:
`private.nomination_list_checked` (at most 1000 objects), `private.nomination_object_checked` (the shape
of one object) and `private.parent_nomination_resolved`, which refuses a parent that is no entity of the
nomination's project and then finds the parent's nomination at the contest or inserts its bare row as
the caller, so `entity_insert_parent_nominations` or `admin_insert_nominations` decides that insert.
`create_invitations` writes an invited entity's nominations the same way, as its caller, so the admin
policies, the column grants and the triggers decide them; it deletes none.
`46-nomination-write-helpers.test.sql` holds the three functions and the cross-project refusal through
both writers.

**One table stands outside this model.** `public.terms_of_use_acceptances` records a statement a user makes
about themself, so its two policies ask who the caller is and never `user_can`. It is the single exception,
and nothing that decides authority or visibility reads it: see § _The one table outside the grant model_.

## Scopes and roles

| Enum | Members |
|---|---|
| `grant_scope_type` | `global` · `account` · `project` · `entity` |
| `grant_role_type` | `admin` · `editor` — **two levels, deliberately not three** (`000-enums.sql:28`) |
| `entity_type` | `candidate` · `organization` · `faction` · `alliance` |
| `storage_verb` | `read` · `write` |

### The eight user types, as grant rows

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

**An entity-scope grant carrying the `admin` role is a shape the table's CHECK constraints admit, the
user-type mapping never produces, and the permission matrix gives the EMPTY set.** It must open nothing.
Any gate matching on a role NAME without a scope beside it lets that shape through, which is why every gate
in this codebase matches `(scope, role)` pairs.

---

## Role-capability matrix

The canonical matrix is `162-IMPLEMENTATION-BRIEF.md` § 3.3 and it is encoded **once**, in
`public.grant_role_permissions`. It is asserted as the policies enforce it by
`apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql`, one nine-element outcome vector per
permission member.

`✓` = granted · `—` = not granted · `own` = only for the granted target and, where the hop applies, its
`is_child_nominee` children.

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
| `entity.edit_answers` | ✓ | ✓ | ✓ | ✓ | own, unless locked | own, unless locked | own, unless locked |
| `entity.read_answers` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `entity.edit_immutable` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `entity.invite_children` | ✓ | ✓ | ✓ | ✓ | — | own (org→cand) | — |
| `entity.confirm` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `nomination.edit` | ✓ | ✓ | ✓ | ✓ | own, unless locked | own, unless locked | own, unless locked |
| `nomination.read` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `nomination.confirm` | ✓ | ✓ | ✓ | — | — | — | — |
| `nomination.create_parent` | ✓ | ✓ | ✓ | ✓ | own, unless locked | own, unless locked | own, unless locked |

**Four of the 23 members are read by no policy**, and that is a ratified list rather than a gap:
`entity.invite_children`, `entity.edit_immutable`, `entity.confirm` and `nomination.confirm`.
`entity.invite_children` is grant administration at entity scope: `public.grants` carries no user-facing
policy at all — only `auth_admin_read_grants` (`TO supabase_auth_admin`) and `service_role_manage_grants`
(`TO service_role`) — and no policy of `public.invitations` asks it. `entity.edit_immutable`
and `entity.confirm` are enforced by the `enforce_entity_immutability` trigger and `nomination.confirm` by
`enforce_nomination_confirmation`, because all three compare OLD against NEW and a row predicate cannot see
OLD. The list is `m17_unenforced_ratified`, asserted two-directionally in `25-matrix-conformance.test.sql`.

**"Unless locked" is a stored setting, not a member of the matrix.** There are two locks, both app
settings in the project's row of `public.app_settings`, and both bind an entity's own users only:

- **The nominations lock**, `access.nominationsLocked`, read by `private.project_nominations_locked(project_id)`.
  Four policies ask it: `entity_insert_nominations`, `entity_insert_parent_nominations`,
  `entity_update_nominations` and `entity_delete_nominations`.
- **The answers lock**, `access.answersLocked`, read by `private.project_answers_locked(project_id)`. While
  it holds, an entity's own editor writes nothing of the entity. It is a conjunct of the four self-update
  policies `entity_update_own_candidates`, `_organizations`, `_factions` and `_alliances` (USING and WITH
  CHECK) and of the same four nomination policies, beside the nominations lock; `storage_path_can` refuses
  an entity-scope write (the six `entity_*_assets` write policies) and reads the key inline, so no second
  definer call is nested in it; and `upsert_answers` and `set_entity_nominations` refuse a caller without
  `project.edit_entities` / `project.edit_nominations` on the project with `42501` and
  `<function>: answers are locked in this project`, so the app can tell the lock from a row it may not write.

The admin and project-scope policies, which ask `project.edit_entities` / `project.edit_nominations`, read
neither lock, and the project-scope storage write does not either: **a project editor and a project admin
write answers, profiles, nominations and files while either lock holds.** Only the JSON boolean `true`
locks; a project with no settings row, or a row without the key, is unlocked, and an id that names no
project is locked. The row is written under `project.edit_app_settings`, so **every holder of that member
sets either lock, ProjEditor included**. `23-nominations-write.test.sql` holds the nominations lock's
cells, `55-answers-lock.test.sql` the answers lock's on every site and both sides, and
`22-content-policies.test.sql` who may write the key.

**The other two grant-administration members ARE enforced by policies**: `project.manage_editors` and
`account.manage_admins` are read by the three policies of `public.invitations`, as the authority to
promise a project editor's and a project admin's grant. See § _Invitations: the authority map_ below.

---

## Policy listing by table — `public` (93)

Every row derived from `pg_policies`.

| Table | Policies |
|---|---|
| `accounts` | `authenticated_select_accounts` [SELECT TO authenticated] · `admin_insert_accounts` [INSERT TO authenticated] · `admin_update_accounts` [UPDATE TO authenticated] · `admin_delete_accounts` [DELETE TO authenticated] |
| `admin_jobs` | `admin_select_admin_jobs` [SELECT TO authenticated] · `admin_insert_admin_jobs` [INSERT TO authenticated] · `admin_delete_admin_jobs` [DELETE TO authenticated] |
| `alliances` | `anon_select_alliances` [SELECT TO anon] · `authenticated_select_alliances` [SELECT TO authenticated] · `admin_insert_alliances` [INSERT TO authenticated] · `admin_update_alliances` [UPDATE TO authenticated] · `entity_update_own_alliances` [UPDATE TO authenticated] · `admin_delete_alliances` [DELETE TO authenticated] |
| `app_settings` | `anon_select_app_settings` [SELECT TO anon] · `authenticated_select_app_settings` [SELECT TO authenticated] · `admin_insert_app_settings` [INSERT TO authenticated] · `admin_update_app_settings` [UPDATE TO authenticated] · `admin_delete_app_settings` [DELETE TO authenticated] |
| `candidates` | `anon_select_candidates` [SELECT TO anon] · `authenticated_select_candidates` [SELECT TO authenticated] · `admin_insert_candidates` [INSERT TO authenticated] · `admin_update_candidates` [UPDATE TO authenticated] · `entity_update_own_candidates` [UPDATE TO authenticated] · `admin_delete_candidates` [DELETE TO authenticated] |
| `constituencies` | `anon_select_constituencies` [SELECT TO anon] · `authenticated_select_constituencies` [SELECT TO authenticated] · `admin_insert_constituencies` [INSERT TO authenticated] · `admin_update_constituencies` [UPDATE TO authenticated] · `admin_delete_constituencies` [DELETE TO authenticated] |
| `constituency_group_constituencies` | `anon_select_constituency_group_constituencies` [SELECT TO anon] · `authenticated_select_constituency_group_constituencies` [SELECT TO authenticated] · `admin_insert_constituency_group_constituencies` [INSERT TO authenticated] · `admin_delete_constituency_group_constituencies` [DELETE TO authenticated] |
| `constituency_groups` | `anon_select_constituency_groups` [SELECT TO anon] · `authenticated_select_constituency_groups` [SELECT TO authenticated] · `admin_insert_constituency_groups` [INSERT TO authenticated] · `admin_update_constituency_groups` [UPDATE TO authenticated] · `admin_delete_constituency_groups` [DELETE TO authenticated] |
| `election_constituency_groups` | `anon_select_election_constituency_groups` [SELECT TO anon] · `authenticated_select_election_constituency_groups` [SELECT TO authenticated] · `admin_insert_election_constituency_groups` [INSERT TO authenticated] · `admin_delete_election_constituency_groups` [DELETE TO authenticated] |
| `elections` | `anon_select_elections` [SELECT TO anon] · `authenticated_select_elections` [SELECT TO authenticated] · `admin_insert_elections` [INSERT TO authenticated] · `admin_update_elections` [UPDATE TO authenticated] · `admin_delete_elections` [DELETE TO authenticated] |
| `factions` | `anon_select_factions` [SELECT TO anon] · `authenticated_select_factions` [SELECT TO authenticated] · `admin_insert_factions` [INSERT TO authenticated] · `admin_update_factions` [UPDATE TO authenticated] · `entity_update_own_factions` [UPDATE TO authenticated] · `admin_delete_factions` [DELETE TO authenticated] |
| `feedback` | `admin_select_feedback` [SELECT TO authenticated] · `anon_insert_feedback` [INSERT TO anon] · `authenticated_insert_feedback` [INSERT TO authenticated] · `admin_delete_feedback` [DELETE TO authenticated] |
| `grants` | `auth_admin_read_grants` [SELECT TO supabase_auth_admin] · `service_role_manage_grants` [ALL TO service_role] |
| `invitations` | `admin_select_invitations` [SELECT TO authenticated] · `admin_insert_invitations` [INSERT TO authenticated] · `admin_delete_invitations` [DELETE TO authenticated] |
| `nominations` | `anon_select_nominations` [SELECT TO anon] · `authenticated_select_nominations` [SELECT TO authenticated] · `admin_insert_nominations` [INSERT TO authenticated] · `entity_insert_nominations` [INSERT TO authenticated] · `entity_insert_parent_nominations` [INSERT TO authenticated] · `admin_update_nominations` [UPDATE TO authenticated] · `entity_update_nominations` [UPDATE TO authenticated] · `admin_delete_nominations` [DELETE TO authenticated] · `entity_delete_nominations` [DELETE TO authenticated] |
| `organizations` | `anon_select_organizations` [SELECT TO anon] · `authenticated_select_organizations` [SELECT TO authenticated] · `admin_insert_organizations` [INSERT TO authenticated] · `admin_update_organizations` [UPDATE TO authenticated] · `entity_update_own_organizations` [UPDATE TO authenticated] · `admin_delete_organizations` [DELETE TO authenticated] |
| `projects` | `authenticated_select_projects` [SELECT TO authenticated] · `admin_insert_projects` [INSERT TO authenticated] · `admin_update_projects` [UPDATE TO authenticated] · `admin_delete_projects` [DELETE TO authenticated] |
| `question_categories` | `anon_select_question_categories` [SELECT TO anon] · `authenticated_select_question_categories` [SELECT TO authenticated] · `admin_insert_question_categories` [INSERT TO authenticated] · `admin_update_question_categories` [UPDATE TO authenticated] · `admin_delete_question_categories` [DELETE TO authenticated] |
| `questions` | `anon_select_questions` [SELECT TO anon] · `authenticated_select_questions` [SELECT TO authenticated] · `admin_insert_questions` [INSERT TO authenticated] · `admin_update_questions` [UPDATE TO authenticated] · `admin_delete_questions` [DELETE TO authenticated] |
| `terms_of_use_acceptances` | `authenticated_select_terms_of_use_acceptances` [SELECT TO authenticated] · `authenticated_insert_terms_of_use_acceptances` [INSERT TO authenticated] |

### The two legitimate same-permission tables

`admin_jobs` and `invitations` are the only tables whose read-permission set and write-permission set
intersect. Check **9001** in `apps/supabase/scripts/lint-schema.mjs` carries three same-permission
exemptions in `SAME_PERMISSION_ALLOW`, each with its reason inline:

- `admin_jobs` on `project.edit_questions`. § 3.2 enumerates no separate admin-jobs read member, and the
  operator ticked `project.edit_questions` for all three of its policies. The job queue's read and its
  write are ONE capability.
- `invitations` on `project.manage_editors` and on `account.manage_admins`. Whoever may promise a grant
  may read the promises: the matrix names no separate read member for grant administration, so the
  SELECT, the INSERT and the DELETE policy ask the same member in the project-editor arm and in the
  project-admin arm. The entity arm is NOT an exemption: it keeps its read member
  (`project.read_entities`) apart from its write member (`project.edit_entities`).

`accounts` is **not** an exemption and must never become one: `authenticated_select_accounts` routes
through `public.user_has_account_grant(uuid)`, a grant-EXISTENCE predicate, while `admin_update_accounts`
asks `account.edit_settings`. Its read-permission set is empty, so the two no longer name the same thing.

### Invitations: the authority map

`invitations` (`305-invitations.sql`) holds one row per promised grant. **The expression of its three
policies IS the authority map** of who may promise which grant, written inline in one policy per command
because check 9001 and the enforcement census of `25-matrix-conformance.test.sql` read the permission
literals out of the policy text; a helper holding the map would hide them from both.

| Arm (the row's shape) | Condition on the row | `admin_insert_invitations` WITH CHECK asks | `admin_select_invitations` USING asks |
|---|---|---|---|
| `scope = 'entity'`, `role = 'editor'` | `private.entity_project_id(target_type, target_id) = project_id` | `user_can('project', project_id, 'project.edit_entities')` | `user_can('project', project_id, 'project.read_entities')` |
| `scope = 'project'`, `role = 'editor'` | `target_id = project_id` | `user_can('project', project_id, 'project.manage_editors')` | the same |
| `scope = 'project'`, `role = 'admin'` | `target_id = project_id` | `user_can('account', private.project_account_id(project_id), 'account.manage_admins')` | the same |

- `admin_delete_invitations` USING is `claimed_at IS NULL` AND the INSERT map: an unclaimed row is deleted
  by whoever could create it, and a claimed row is kept.
- **There is no UPDATE policy and no UPDATE privilege.** A promise, its address and its code cannot be
  changed; an invitation is changed by deleting an unclaimed row and creating another.
- **Any other shape matches no arm and is refused.** The service role bypasses the policies, and three
  CHECK constraints (`invitations_scope_check`, `invitations_project_target_check`,
  `invitations_role_confers_check`) refuse the same shapes for it.
- **A caller cannot promise the level they hold.** A project editor holds neither
  `project.manage_editors` nor `account.manage_admins`; a project admin holds the first and not the
  second.
- **The map is the INSERT policy, so a direct insert meets the same refusals as `create_invitations`**,
  which is SECURITY INVOKER and holds no authority rule. The function's `INSERT … RETURNING id` must
  also pass the SELECT policy, so a negative control of the INSERT policy alone uses the direct insert.
- **`anon` holds no privilege and no policy**: the table holds invitees' addresses. Entity editors read
  nothing.
- **The map is asked when the row is written and not again.** `claim_invitations` honours a row whose
  creator has since lost the authority; a promise is withdrawn by deleting the unclaimed row.
- **`claim_invitations` is the one function that writes `public.grants` for a user.** It is SECURITY
  DEFINER, executable by `authenticated` only, and trusts the caller's own confirmed address in the
  auth schema's users table and nothing the caller passes. It reads no address for an account whose
  `raw_app_meta_data ->> 'identity_provider'` is set, so an account the identity provider created
  claims nothing.
- **Three definer functions sit beside the invitation functions without reaching a policy.**
  `address_confirmation_request` and `address_confirmation_release` (`506-invitation-rpcs.sql`,
  `service_role` only) take and give back the slots `account-access`'s `confirm-address` spends, neither
  of them per project and taken only for a project the account's `registered_entities` record names, and `private.caller_pending_email_taken()`
  (`301-auth-functions.sql`, `authenticated` only) answers for `auth.uid()` alone whether the caller's
  pending address is another account's; `get_user_entities` returns it as `pending_email_taken`.

### The one table outside the grant model

`terms_of_use_acceptances` (`304-terms-of-use-acceptances.sql`) holds one row per user and project: the
row's presence says that the user has accepted the terms of use of that project. Acceptance belongs to the
user and the project and to no entity. It is a statement a user makes about themself, so no grant decides
it, and its two policies ask who the caller is and nothing else:

| Policy | Command | Role | Expression |
|---|---|---|---|
| `authenticated_select_terms_of_use_acceptances` | SELECT | authenticated | USING `user_id = (SELECT auth.uid())` |
| `authenticated_insert_terms_of_use_acceptances` | INSERT | authenticated | WITH CHECK `user_id = (SELECT auth.uid())` |

- **They are the only two policies in `public` and `storage` keyed on `auth.uid()`**, and the only two that
  serve users without asking the grant model. Both are in `REACHES_NEITHER_ALLOW`, the exemption list of
  check 9001 in `apps/supabase/scripts/lint-schema.mjs`, with their reason written beside them. A further
  self-row table needs its own entries and its own reason there.
- **`anon` holds nothing**: no privilege on the table and no policy.
- **`authenticated` holds SELECT on the table and INSERT on `project_id` alone**, a column-level grant. The
  database supplies the rest (`user_id` defaults to `auth.uid()`, `accepted_at` to `now()`), and an insert
  that states either is refused with `42501` before any policy is consulted.
- **A user has no path to change or withdraw an acceptance**: there is no UPDATE or DELETE policy and no
  such privilege. A row leaves only with its auth user or its project, by cascade. An upsert must be the
  ignore-duplicates (`ON CONFLICT DO NOTHING`) form, because the `DO UPDATE` form needs the UPDATE
  privilege.
- **The INSERT policy checks who and not which project**, so a user can record an acceptance for any
  existing project. That opens nothing, because nothing in the schema reads the table.
- **Nothing may start reading it unnoticed.** Section 7 of `37-terms-of-use-acceptances.test.sql` is a
  standing census over the applied catalogue: it goes red, naming the offender, when a policy in `public`
  or `storage`, a function in `public` or `private`, or a column in `public` contains `terms_of_use`, the
  table's own name included. A policy or function with a reason to read the table is exempted in that
  assertion by name, with the reason beside it.

### The eight entity SELECT assemblies

`candidates`, `organizations`, `factions` and `alliances` each carry one `TO anon` and one
`TO authenticated` SELECT policy. Each calls `project_open_for_voters` and
`entity_has_confirmed_nomination` **directly**, at depth 1 — there is no composition wrapper, because
nesting `SECURITY DEFINER` calls cost 271.9 ms anon / 351.9 ms authenticated against 39.4 / 30.0 for the
direct form. The two helpers remain the single definition of each sub-rule; what repeats is the
**assembly**.

**The public rule is three conditions, the same for all four entity types:** the project is open for voters
(`project_open_for_voters`), the entity is `confirmed`, and a confirmed nomination links it into that
project (`entity_has_confirmed_nomination`). The four anon policies are one expression apart from the table
name and the entity-type literal, and so are the four authenticated ones; no table carries a condition of
its own. `confirmed` is therefore the single entity-side lever: a confirmed, nominated entity of an open
project is public whether or not anyone has registered for it, signed in or accepted the terms of use.
`private.nomination_entities_confirmed` and `public.storage_path_is_public` restate the same three
conditions for a nomination row and for a file in `public-assets`, so a row, its files and its
`get_nominations` row become public together.

That duplication is guarded mechanically, not by convention: `25-matrix-conformance.test.sql` § 5 derives
the eight from `pg_policies` — so a ninth cannot appear un-guarded — and asserts them BOTH **relatively**
(the four anon agree, the four authenticated agree, and each authenticated assembly carries its own table's
anon assembly verbatim as its public disjunct) and **absolutely** (each contains `confirmed`,
`project_open_for_voters` and `entity_has_confirmed_nomination` by name). The absolute half exists because a
uniform change to all eight is invisible to any relative check. `05-organization-admin.test.sql` and
`18-entity-policies.test.sql` hold the same identity, and all three compare the expressions as they are,
with no clause normalised away for any table.

The five authenticated entity/nomination SELECT policies (`authenticated_select_candidates`,
`_organizations`, `_factions`, `_alliances`, `_nominations`) also hold an **evaluation order**: project
authority (`user_can ('project', …, 'project.read_entities')`) first, then the public assembly, then entity
authority (the `user_can ('entity', …, <type>)` disjuncts). PostgreSQL stops an OR at the first TRUE, so the order
changes cost and never the answer: an admin exits on the first call, and a publicly visible row never pays the
entity `user_can` calls (162.1 D-01, spike 028: a signed-in candidate's whole-municipal read 7.15 s → 4.65 s,
admins unchanged at 1.30 s, proved row-identical). `29-authenticated-disjunct-order.test.sql` guards it: it
derives the population from `pg_policies`, pins it to the five tables, and fails on any other order.

---

## Storage policies (15)

| Policy | Command | Role |
|---|---|---|
| `anon_select_public_assets` | SELECT | anon |
| `authenticated_select_private_assets` | SELECT | authenticated |
| `authenticated_select_public_assets` | SELECT | authenticated |
| `entity_insert_private_assets` | INSERT | authenticated |
| `entity_insert_public_assets` | INSERT | authenticated |
| `project_insert_private_assets` | INSERT | authenticated |
| `project_insert_public_assets` | INSERT | authenticated |
| `entity_update_private_assets` | UPDATE | authenticated |
| `entity_update_public_assets` | UPDATE | authenticated |
| `project_update_private_assets` | UPDATE | authenticated |
| `project_update_public_assets` | UPDATE | authenticated |
| `entity_delete_private_assets` | DELETE | authenticated |
| `entity_delete_public_assets` | DELETE | authenticated |
| `project_delete_private_assets` | DELETE | authenticated |
| `project_delete_public_assets` | DELETE | authenticated |

**Two buckets**: `public-assets` and `private-assets`. **Object paths are
`<project id>/<type segment>/<entity id>/<file>`**, and the type segment is the table name.

**Two mechanisms, one per question, and the partition is exact.** Fourteen policies reach the AUTHORITY
mechanism — `public.storage_path_can(scope, project, type, id, verb)`, which maps the type segment and the
verb to a permission and hands it to `user_can`. One, `anon_select_public_assets`, reaches the VISIBILITY
mechanism, `public.storage_path_is_public`, instead: anon has no `auth.uid()` and so holds no grant row,
which `user_can` denies by construction, so routing the public-read policy through the authority mechanism would make every
public asset unfetchable. **None reaches neither.** `28-storage-table-parity.test.sql` asserts all four
figures and names the visibility-only member.

⚠ **No storage policy names `user_can` in its own `pg_policies` expression.** The reach is through
`storage_path_can`. A text search for `user_can` over storage policy expressions returns **zero** — anything
measuring that partition must compute reach TRANSITIVELY over `pg_proc`.

**The eleven-segment mapping** `storage_path_can` implements, cell for cell the pair that segment's own
table policy asks:

| Type segment | entity read | entity write | project read | project write |
|---|---|---|---|---|
| `candidates` · `organizations` · `factions` · `alliances` | `entity.read_answers` | `entity.edit_answers`, refused while the project's answers are locked | `project.read_entities` | `project.edit_entities` |
| `elections` · `constituencies` · `constituency_groups` | deny | deny | `project.read_structure` | `project.edit_structure` |
| `questions` · `question_categories` | deny | deny | `project.read_structure` | `project.edit_questions` |
| `nominations` | deny | deny | `project.read_entities` | `project.edit_nominations` |
| `project` | deny | deny | `project.read_structure` | `project.edit_app_settings` |
| anything else | deny | deny | deny | deny |

---

## The `SECURITY DEFINER` helpers a policy may reach

| Function | Answers |
|---|---|
| `user_can(grant_scope_type, uuid, grant_permission, entity_type DEFAULT NULL)` | the whole authority question; § 3.3's matrix, encoded once. The entity type is required at entity scope and ignored elsewhere |
| `user_has_account_grant(uuid)` | "does this caller hold ANY grant on this account or on a project it owns?" — grant EXISTENCE, which `user_can` cannot express because `user_can` takes a permission |
| `is_child_nominee(entity_type, uuid, entity_type, uuid)` | the one-hop parent→child nomination reach, the single mechanism for it; parent and child each matched by type and id |
| `project_open_for_voters(uuid)` | the project-level anon visibility sub-rule |
| `contestant_app_public_config(uuid)` | **no policy reaches it**; listed here because it is the other anon-executable definer function over a project id. The frontend adapter calls it when the caller can read no `app_settings` row of a closed project, and it answers five stored values (`access.contestantApp`, `access.answersLocked`, `contestantApp.entityTypes`, `contestantApp.registrationModes`, `analytics.trackEvents`), each as stored when its shape is one the frontend's parse accepts and otherwise as the string `"invalid"`, so nothing stored under a refused value is returned, and never the row |
| `entity_has_confirmed_nomination(entity_type, uuid, uuid)` | the nomination-level anon visibility sub-rule |
| `nomination_entities_confirmed(uuid)` | both sub-rules asked of a nomination row |
| `storage_path_can(grant_scope_type, text, text, text, storage_verb)` | the storage authority question, over the eleven-segment mapping |
| `storage_path_is_public(text, text, text)` | § 3.4's public-read question asked of a path |
| `project_nominations_locked(uuid)` · `project_answers_locked(uuid)` · `nomination_exists_in_contest(...)` · `caller_nominated_in_contest(election, constituency, round, permission, caller types)` · `caller_unconfirmed_originated_count()` | the nomination write guards; `project_answers_locked` guards the four entity self-update policies too. The fifth argument of `caller_nominated_in_contest` is what pairs a parent's row with the caller that may create it: `entity_insert_parent_nominations` passes `{candidate, faction}` for an organization's row and `{organization}` for an alliance's, so holding `nomination.create_parent` on an entity of another type nominated at the contest does not answer yes. A faction's nomination always stands under its own organization's, so the organization's row a faction's editor can create is another organization's. The count behind the cap is by user (`created_by`) and includes the rows the caller inserted for an organization or an alliance it edits itself |
| `nomination_id_in_contest(entity_type, uuid, uuid, uuid, integer)` | not asked by a policy: `private.parent_nomination_resolved` asks it, for both nomination writers, for the id of a parent's nomination the caller cannot read. No parent first, then the oldest, then the lowest id |
| `entity_project_id(entity_type, uuid)` · `election_project_id(uuid)` · `constituency_group_project_id(uuid)` | the project a row belongs to, for policies whose table carries no `project_id` |
| `private.project_account_id(uuid)` | the account a project belongs to; the project-admin arm of the three `invitations` policies passes it to `user_can` at account scope. Definer because `projects` has row-level security and an inline read would also ask whether the caller sees the project; `authenticated` alone holds EXECUTE |

---

## Column-level restrictions

Source: `303-column-grants.sql`. **Pattern:** REVOKE table-level UPDATE, then GRANT UPDATE on named columns
only — PostgreSQL column-level REVOKE is ineffective while table-level UPDATE exists.

Derived from `information_schema.column_privileges` for `authenticated`:

| Table | Columns `authenticated` may UPDATE |
|---|---|
| `candidates` | `answers`, `color`, `confirmed`, `custom_data`, `first_name`, `image`, `info`, `last_name`, `short_name`, `subtype` |
| `organizations` | `answers`, `color`, `confirmed`, `custom_data`, `image`, `info`, `name`, `short_name`, `subtype` |
| `factions` · `alliances` | `color`, `confirmed`, `custom_data`, `image`, `info`, `name`, `short_name`, `subtype` |
| `nominations` | `confirmed`, `constituency_id`, `custom_data`, `election_id`, `election_round`, `parent_nomination_id` |

`candidates` carries no `name` column — a candidate's display name is `first_name` + `last_name`. Note that
`sort_order`, `created_at`, `updated_at`, `project_id`, `external_id` and `id` are **not**
in any entity table's list: ordering is admin-controlled, and a record owner who can rewrite when their row
was created or last touched can repudiate their own edit history. `updated_at` is maintained by the
`set_updated_at` trigger, which keeps working without the caller holding a privilege on that column —
column privileges are checked against the statement's target list, not against what a BEFORE UPDATE trigger
assigns.

`confirmed` appears in the grant list and is nonetheless guarded, by the `enforce_entity_immutability` and
`enforce_nomination_confirmation` triggers: a column grant cannot express an OLD-to-NEW transition rule.
The name columns and `short_name` are in the grant lists and guarded the same way: once the row is
confirmed, `enforce_entity_immutability` refuses a change to `first_name`, `last_name` or `short_name` on
`candidates`, and to `name` or `short_name` on `organizations`, `factions` and `alliances`, unless the
caller holds `entity.edit_immutable` on the entity. On an unconfirmed row the entity's editor may set them.
The trigger binds the `authenticated` role alone. `19-entity-immutability.test.sql` asserts each protected
column on each table. `color` is in every entity table's list and is held to a hex-colour shape for every
writer by `validate_entity_color` (`41-entity-color.test.sql`).
`external_id` is additionally frozen by `enforce_external_id_immutability()` regardless of grants.

Admin operations needing a protected column go through the service-role client (the Edge Functions), which
bypasses column-level grants entirely.

---

## Policy naming convention

Pattern `{actor}_{operation}_{object}`, where the **actor segment is the SCOPE the predicate asks at**, not
a role name:

- **actor**: `anon`, `authenticated`, `admin` (project-scope authority or wider), `entity` (entity-scope
  authority), `project` (project-scope authority, in storage), the `entity_update_own_*` family (the self-edit pair)
- **operation**: `select`, `insert`, `update`, `delete`
- **object**: the plural table name, or the bucket for storage

Examples: `anon_select_elections`, `admin_insert_elections`, `entity_update_own_candidates`,
`entity_insert_parent_nominations`, `project_update_private_assets`.

**Exceptions:** the two `public.grants` policies name a database ROLE rather than an actor scope, because
they serve system roles and not users: `auth_admin_read_grants` (`TO supabase_auth_admin`) and
`service_role_manage_grants` (`TO service_role`).

---

## Policy implementation rules

These apply to every policy in the schema.

1. **Scalar subqueries for optimizer caching.** Always `(SELECT auth.uid())`, `(SELECT auth.jwt())`,
   `(SELECT user_can(...))` — never the bare call. The scalar subquery is evaluated once per query rather
   than once per row.
2. **Explicit role target.** Always `TO anon` or `TO authenticated`; never omit it.
3. **Operation clause rules.** SELECT uses USING only. INSERT uses WITH CHECK only. UPDATE uses USING +
   WITH CHECK. DELETE uses USING only.
4. **RLS enable required.** `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY` before policies take effect.
5. **One mechanism per question.** A policy asks its authority question through `user_can` (or, in storage,
   through `storage_path_can`) and its visibility question through the named visibility helpers. A policy
   whose predicate reaches NEITHER is an ERROR in check 9001 of `lint-schema.mjs` unless it is on that
   check's ratified exemption list, which today holds ten policies: the four join-table SELECTs that
   delegate to their parent row, the two open feedback INSERTs, the two `public.grants` system-role
   policies, and the two self-row policies of `terms_of_use_acceptances`.
6. **Never re-derive a rule a helper already owns.** No policy may inline the parent→child nomination hop,
   the open-for-voters lookup or the confirmed-nomination lookup; each has exactly one definition.
7. **`public.grants` isolation.** The grant table carries no policy for an API role: `user_can` and
   `user_has_account_grant` read it as SECURITY DEFINER, keyed on `(SELECT auth.uid())`, and a policy on
   the table that asked them would be circular. Only `supabase_auth_admin` and `service_role` reach it
   directly.
8. **Nothing nests a `SECURITY DEFINER` call inside another.** A `SECURITY DEFINER` function can never be
   inlined by the planner, so a composition that calls two of them pays the per-row cost twice at depth 2.
   Measured at 6.9× the direct arrangement on the entity SELECT path.

---

## Where the assertions live

| Property | File |
|---|---|
| `user_can`'s own eight answer vectors, 23 cells each | `12-user-can.test.sql` |
| § 3.3 as the policies enforce it, and the eight-assembly guard | `25-matrix-conformance.test.sql` |
| anon visibility, one conjunct at a time | `16-anon-visibility.test.sql` |
| the entity policies and the hierarchy disjunct | `18-entity-policies.test.sql` |
| the authenticated entity reads' disjunct order | `29-authenticated-disjunct-order.test.sql` |
| a project that is not open for voters: `get_nominations`/`get_questions` to anon before and after closing, anon and authenticated EXECUTE on `project_open_for_voters`, and grant holders' reads that make the preview possible | `30-closed-project.test.sql` |
| `contestant_app_public_config`: both EXECUTE rights, the definer shape, the five values as stored when their shape is accepted and as `"invalid"` otherwise, the exact key set at every level of the answer, the one all-null answer, and `anon_select_app_settings` left unwidened | `38-contestant-app-public-config.test.sql` |
| `terms_of_use_acceptances`: what the catalogue declares, the self-row read and insert, the `42501` refusals, another user and anon, project scope, the user cascade, a confirmed candidate public with the table empty, and the census that nothing in the schema names terms of use | `37-terms-of-use-acceptances.test.sql` |
| `invitations`: what the catalogue declares, the authority map through the function and through the table, no rewrite, duplicates, the code, seeding confirming a named entity when the call says so, who reads and deletes a row, the claim (exactly the promised grants, nobody else, each row by itself), the used code, who may be mailed, the limits, the slot given back, the witness, and what each function exposes | `39-invitations.test.sql` |
| project-structure authority | `17-project-structure-authority.test.sql` |
| content policies (`questions`, `app_settings`, `feedback`, `admin_jobs`) | `22-content-policies.test.sql` |
| storage authority, and the table/storage pairing | `20-storage-authority.test.sql`, `28-storage-table-parity.test.sql` |
| storage cleanup: the enqueued single-object DELETEs and the D-20 limits (pgTAP), and the objects' disappearance in committed state (Playwright) | `31-storage-cleanup.test.sql`, `tests/tests/specs/storage/storage-cleanup.spec.ts` |
| both uniqueness keys, by name and in both directions | `26-uniqueness-keys.test.sql` |
| the requested-parent admin queue and its confirmation guard | `27-parent-nomination-queue.test.sql` |
| level-1 (ProjectEditor) through the nomination and entity confirmation flows: edits unconfirm, confirmation refused without `nomination.confirm`, `entity.confirm` held | `32-level1-confirmation-flow.test.sql` |
| the nominations lock as an app setting: the entity policies refused while it is on and admitted while it is off, and who may write the key | `23-nominations-write.test.sql`, `22-content-policies.test.sql` |
| the answers lock: the stored values that lock, each entity's own editor refused on the four self-update policies, the four nomination policies, the storage write in both buckets, `upsert_answers` and `set_entity_nominations` while it is on and admitted while it is off, a project editor and a project admin admitted while it is on, and a read unaffected | `55-answers-lock.test.sql` |
| a confirmed entity's protected columns, each on each of the four entity tables, and the confirmation gate | `19-entity-immutability.test.sql` |
| the entity type list of `questions` and `question_categories`, per table and per verb, and through `bulk_import` | `40-entity-type-list.test.sql` |
| the stored colour of the four entity tables, each refused value beside an accepted one | `41-entity-color.test.sql` |
| `get_entity_nominations`: the answer for a candidate and for an organization, the parent resolved where the caller's own policies refuse it, the exact key set, `NULL` for every caller without the entity's editor grant (another editor, the parent's editor, a faction's editor, project and global admins, a wrong type or project, an id that does not exist), and `anon` refused by privilege | `42-entity-nominations.test.sql` |
| `set_entity_nominations`: the argument's refusals, a caller without `nomination.edit`, each parent kind, a row that did not change left unwritten, the reach of a delete, a move, the nominations lock raised as `42501`, a refused call storing nothing, the cap met through the function, the end-of-transaction rule raised inside the call and deferred again after it, and `anon` refused by privilege | `43-set-entity-nominations.test.sql` |
| the three private functions of a nomination write (their catalogue shape and EXECUTE, the bound of 1000, each shape refusal and the normalised answer, a parent's nomination found or created bare as the owner, an admin and an entity's editor), and a parent or an invited entity that is no entity of the nomination's project refused through both writers with nothing written | `46-nomination-write-helpers.test.sql` |
| `create_invitations`' stated confirmation (no default, `NULL` refused, `true` and `false`, never an unconfirmation) and the `nominations` key: new nominations and their parents, created bare and unconfirmed, updates by `id`, nothing deleted, the shape refusals under the invitation's label, the bound, the caller's own authority, the parent rule raised inside the call, and the answer's keys | `47-invitation-nominations.test.sql` |
| `get_nomination_parent_options`: the options for a candidate and for an organization, the exact key set, `nominated` for the asked contests, `NULL` for every caller without the entity's editor grant and for a malformed argument, and `anon` refused by privilege | `44-nomination-parent-options.test.sql` |
| the election-type rule cell by cell, and the end-of-transaction rule for a candidate that needs a parent | `08-triggers.test.sql` |
| `entity_delete_nominations` conjunct by conjunct, the widened parent policy with its pairing by caller type, and the order of `private.nomination_id_in_contest` | `23-nominations-write.test.sql` |
| the retired model is GONE | `24-legacy-removal.test.sql` |
| read/write non-collapse, permanently, on every build | `apps/supabase/scripts/lint-schema.mjs` check 9001 |
