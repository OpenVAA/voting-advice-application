# RLS Policy Map

**Derived from the applied database on 2026-09-17**, at the close of phase 162, by querying `pg_policies`,
`pg_enum`, `pg_proc` and `information_schema` — not transcribed from any schema file and not edited from a
previous author's reading. Every policy named below exists in `pg_policies`, and every policy in
`pg_policies` for `public` and `storage` is named below; that set equality is asserted in **both**
directions by `162-17-PLAN.md` Task 8, because a document that invents a policy misleads as badly as one
that omits one.

**102 policies: 87 in `public`, 15 in `storage`.** Declared in
`apps/supabase/supabase/schema/302-rls.sql`, `300-auth-tables.sql`, `303-column-grants.sql` and
`400-storage.sql`. The CLI applies `migrations/`, never `schema/` (`config.toml` sets
`[db.migrations] schema_paths = []`), so the applied database is the authority and this file describes it.

> **What phase 162 replaced.** The predecessor of this document described five named role levels
> (`candidate`, `organization`, `project_admin`, `account_admin`, `super_admin`), a `user_roles` table, a
> `can_access_project(project_id)` predicate and a per-row `published` visibility flag. **None of those
> exists.** They are named here once, in this paragraph, so a reader arriving with the old vocabulary can
> orient — and nowhere else in this file.

---

## The authority model in one paragraph

A **grant** is a row of `public.grants`: `(user_id, scope, target_type, target_id, role)`. The Access Token
Hook projects a caller's grants into the `grants` claim of their access token. Every authority question in
the database is asked of exactly one function, `public.user_can(scope, target_id, permission)`, which
resolves the claim against the 23-member `grant_permission` enum and reaches **downward** — a grant at
`global` answers for every account, a grant at `account` for every project it owns, a grant at `project`
for every entity in it, and a grant at `entity` for that entity and, through `is_child_nominee`, for its
child nominees.

The child-nominee reach (`nomination.read`) is **basic data only** (SPEC § 7). A row policy cannot express
"basic data" — it returns every column, `answers` included — so the four entity SELECT policies do **not**
carry a `nomination.read` disjunct. The parent's reach to a child entity is the SECURITY DEFINER RPC
`get_entity_basic_data(p_entity_id)` (`503-entity-rpcs.sql`), gated on that same `user_can` call and returning an
allow-listed column projection (162-REVIEW CR-02). The `nominations` SELECT policy keeps its
`nomination.read` disjunct, because a nomination row carries no answers.

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
| `entity.edit_answers` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `entity.read_answers` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `entity.edit_immutable` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `entity.invite_children` | ✓ | ✓ | ✓ | ✓ | — | own (org→cand) | — |
| `entity.confirm` | ✓ | ✓ | ✓ | ✓ | — | — | — |
| `nomination.edit` | ✓ | ✓ | ✓ | ✓ | own, unless locked | own, unless locked | own, unless locked |
| `nomination.read` | ✓ | ✓ | ✓ | ✓ | own | own | own |
| `nomination.confirm` | ✓ | ✓ | ✓ | — | — | — | — |
| `nomination.create_parent` | ✓ | ✓ | ✓ | ✓ | own, unless locked | — | own, unless locked |

**Six of the 23 members are enforced by something other than a policy**, and that is a ratified list rather
than a gap. `account.manage_admins`, `project.manage_editors` and `entity.invite_children` govern grant
administration, and `public.grants` carries no user-facing policy at all — only `auth_admin_read_grants`
(`TO supabase_auth_admin`) and `service_role_manage_grants` (`TO service_role`). `entity.edit_immutable`
and `entity.confirm` are enforced by the `enforce_entity_immutability` trigger and `nomination.confirm` by
`enforce_nomination_confirmation`, because all three compare OLD against NEW and a row predicate cannot see
OLD. The list is asserted two-directionally in `25-matrix-conformance.test.sql`.

---

## Policy listing by table — `public` (87)

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
| `nominations` | `anon_select_nominations` [SELECT TO anon] · `authenticated_select_nominations` [SELECT TO authenticated] · `admin_insert_nominations` [INSERT TO authenticated] · `entity_insert_nominations` [INSERT TO authenticated] · `entity_insert_parent_nominations` [INSERT TO authenticated] · `admin_update_nominations` [UPDATE TO authenticated] · `entity_update_nominations` [UPDATE TO authenticated] · `admin_delete_nominations` [DELETE TO authenticated] |
| `organizations` | `anon_select_organizations` [SELECT TO anon] · `authenticated_select_organizations` [SELECT TO authenticated] · `admin_insert_organizations` [INSERT TO authenticated] · `admin_update_organizations` [UPDATE TO authenticated] · `entity_update_own_organizations` [UPDATE TO authenticated] · `admin_delete_organizations` [DELETE TO authenticated] |
| `projects` | `authenticated_select_projects` [SELECT TO authenticated] · `admin_insert_projects` [INSERT TO authenticated] · `admin_update_projects` [UPDATE TO authenticated] · `admin_delete_projects` [DELETE TO authenticated] |
| `question_categories` | `anon_select_question_categories` [SELECT TO anon] · `authenticated_select_question_categories` [SELECT TO authenticated] · `admin_insert_question_categories` [INSERT TO authenticated] · `admin_update_question_categories` [UPDATE TO authenticated] · `admin_delete_question_categories` [DELETE TO authenticated] |
| `questions` | `anon_select_questions` [SELECT TO anon] · `authenticated_select_questions` [SELECT TO authenticated] · `admin_insert_questions` [INSERT TO authenticated] · `admin_update_questions` [UPDATE TO authenticated] · `admin_delete_questions` [DELETE TO authenticated] |

### The one legitimate same-permission table

`admin_jobs` is the single table whose read-permission set and write-permission set intersect, on
`project.edit_questions`. § 3.2 enumerates no separate admin-jobs read member, and the operator ticked
`project.edit_questions` for all three of its policies. The job queue's read and its write are ONE
capability. Check **9001** in `apps/supabase/scripts/lint-schema.mjs` carries that as its only
same-permission exemption, with the reason inline.

`accounts` is **not** an exemption and must never become one: `authenticated_select_accounts` routes
through `public.user_has_account_grant(uuid)`, a grant-EXISTENCE predicate, while `admin_update_accounts`
asks `account.edit_settings`. Its read-permission set is empty, so the two no longer name the same thing.

### The eight entity SELECT assemblies

`candidates`, `organizations`, `factions` and `alliances` each carry one `TO anon` and one
`TO authenticated` SELECT policy. Each calls `project_open_for_voters` and
`entity_has_confirmed_nomination` **directly**, at depth 1 — there is no composition wrapper, because
nesting `SECURITY DEFINER` calls cost 271.9 ms anon / 351.9 ms authenticated against 39.4 / 30.0 for the
direct form. The two helpers remain the single definition of each sub-rule; what repeats is the
**assembly**. `candidates` alone carries two further conjuncts, `terms_of_use_accepted IS NOT NULL` and
`terms_of_use_accepted < now()`.

That duplication is guarded mechanically, not by convention: `25-matrix-conformance.test.sql` § 5 derives
the eight from `pg_policies` — so a ninth cannot appear un-guarded — and asserts them BOTH **relatively**
(the four anon agree, the four authenticated agree, and each authenticated assembly carries its own table's
anon assembly verbatim as its public disjunct) and **absolutely** (each contains `confirmed`,
`project_open_for_voters` and `entity_has_confirmed_nomination` by name). The absolute half exists because a
uniform change to all eight is invisible to any relative check.

The five authenticated entity/nomination SELECT policies (`authenticated_select_candidates`,
`_organizations`, `_factions`, `_alliances`, `_nominations`) also hold an **evaluation order**: project
authority (`user_can ('project', …, 'project.read_entities')`) first, then the public assembly, then entity
authority (the `user_can ('entity', …)` disjuncts). PostgreSQL stops an OR at the first TRUE, so the order
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
mechanism, `public.storage_path_is_public`, instead: anon carries no `grants` claim, which `user_can`
denies by construction, so routing the public-read policy through the authority mechanism would make every
public asset unfetchable. **None reaches neither.** `28-storage-table-parity.test.sql` asserts all four
figures and names the visibility-only member.

⚠ **No storage policy names `user_can` in its own `pg_policies` expression.** The reach is through
`storage_path_can`. A text search for `user_can` over storage policy expressions returns **zero** — anything
measuring that partition must compute reach TRANSITIVELY over `pg_proc`.

**The eleven-segment mapping** `storage_path_can` implements, cell for cell the pair that segment's own
table policy asks:

| Type segment | entity read | entity write | project read | project write |
|---|---|---|---|---|
| `candidates` · `organizations` · `factions` · `alliances` | `entity.read_answers` | `entity.edit_answers` | `project.read_entities` | `project.edit_entities` |
| `elections` · `constituencies` · `constituency_groups` | deny | deny | `project.read_structure` | `project.edit_structure` |
| `questions` · `question_categories` | deny | deny | `project.read_structure` | `project.edit_questions` |
| `nominations` | deny | deny | `project.read_entities` | `project.edit_nominations` |
| `project` | deny | deny | `project.read_structure` | `project.edit_app_settings` |
| anything else | deny | deny | deny | deny |

---

## The `SECURITY DEFINER` helpers a policy may reach

| Function | Answers |
|---|---|
| `user_can(grant_scope_type, uuid, grant_permission)` | the whole authority question; § 3.3's matrix, encoded once |
| `user_has_account_grant(uuid)` | "does this caller hold ANY grant on this account or on a project it owns?" — grant EXISTENCE, which `user_can` cannot express because `user_can` takes a permission |
| `is_child_nominee(entity_type, uuid, uuid)` | the one-hop parent→child nomination reach, the single mechanism for it |
| `project_open_for_voters(uuid)` | the project-level anon visibility sub-rule |
| `entity_has_confirmed_nomination(entity_type, uuid, uuid)` | the nomination-level anon visibility sub-rule |
| `nomination_entities_confirmed(uuid)` | both sub-rules asked of a nomination row |
| `storage_path_can(grant_scope_type, text, text, text, storage_verb)` | the storage authority question, over the eleven-segment mapping |
| `storage_path_is_public(text, text, text)` | § 3.4's public-read question asked of a path |
| `project_nominations_locked(uuid)` · `nomination_exists_in_contest(...)` · `caller_nominated_in_contest(...)` · `caller_unconfirmed_originated_count()` | the nomination write guards |
| `entity_project_id(uuid)` · `election_project_id(uuid)` · `constituency_group_project_id(uuid)` | the project a row belongs to, for policies whose table carries no `project_id` |

---

## Column-level restrictions

Source: `303-column-grants.sql`. **Pattern:** REVOKE table-level UPDATE, then GRANT UPDATE on named columns
only — PostgreSQL column-level REVOKE is ineffective while table-level UPDATE exists.

Derived from `information_schema.column_privileges` for `authenticated`:

| Table | Columns `authenticated` may UPDATE |
|---|---|
| `candidates` | `answers`, `color`, `confirmed`, `custom_data`, `first_name`, `image`, `info`, `last_name`, `short_name`, `subtype`, `terms_of_use_accepted` |
| `organizations` | `answers`, `color`, `confirmed`, `custom_data`, `image`, `info`, `name`, `short_name`, `subtype` |
| `factions` · `alliances` | `color`, `confirmed`, `custom_data`, `image`, `info`, `name`, `short_name`, `subtype` |
| `nominations` | `confirmed`, `constituency_id`, `custom_data`, `election_id`, `election_round`, `parent_nomination_id` |

`candidates` carries no `name` column — a candidate's display name is `first_name` + `last_name`. Note that
`sort_order`, `created_at`, `updated_at`, `project_id`, `auth_user_id`, `external_id` and `id` are **not**
in any entity table's list: ordering is admin-controlled, and a record owner who can rewrite when their row
was created or last touched can repudiate their own edit history. `updated_at` is maintained by the
`set_updated_at` trigger, which keeps working without the caller holding a privilege on that column —
column privileges are checked against the statement's target list, not against what a BEFORE UPDATE trigger
assigns.

`confirmed` appears in the grant list and is nonetheless guarded, by the `enforce_entity_immutability` and
`enforce_nomination_confirmation` triggers: a column grant cannot express an OLD-to-NEW transition rule.
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
   check's ratified exemption list, which today holds eight policies: the four join-table SELECTs that
   delegate to their parent row, the two open feedback INSERTs, and the two `public.grants` system-role
   policies.
6. **Never re-derive a rule a helper already owns.** No policy may inline the parent→child nomination hop,
   the open-for-voters lookup or the confirmed-nomination lookup; each has exactly one definition.
7. **`public.grants` isolation.** The grant table must never carry a policy that reads JWT claims — that is
   a circular dependency with the Access Token Hook, which reads the table to BUILD the claim. Only
   `supabase_auth_admin` and `service_role` reach it.
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
| project-structure authority | `17-project-structure-authority.test.sql` |
| content policies (`questions`, `app_settings`, `feedback`, `admin_jobs`) | `22-content-policies.test.sql` |
| storage authority, and the table/storage pairing | `20-storage-authority.test.sql`, `28-storage-table-parity.test.sql` |
| storage cleanup: the enqueued single-object DELETEs and the D-20 limits (pgTAP), and the objects' disappearance in committed state (Playwright) | `31-storage-cleanup.test.sql`, `tests/tests/specs/storage/storage-cleanup.spec.ts` |
| both uniqueness keys, by name and in both directions | `26-uniqueness-keys.test.sql` |
| the requested-parent admin queue and its confirmation guard | `27-parent-nomination-queue.test.sql` |
| level-1 (ProjectEditor) through the nomination and entity confirmation flows: edits unconfirm, confirmation refused without `nomination.confirm`, `entity.confirm` held | `32-level1-confirmation-flow.test.sql` |
| the retired model is GONE | `24-legacy-removal.test.sql` |
| read/write non-collapse, permanently, on every build | `apps/supabase/scripts/lint-schema.mjs` check 9001 |
