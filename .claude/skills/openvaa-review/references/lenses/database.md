# Lens: Database · ID prefix `DB`

**Applies when** the PR touches `apps/supabase/supabase/migrations/`, `apps/supabase/supabase/tests/`, RLS policies, RPCs, triggers, storage buckets, the generated `packages/supabase-types/`, or the Supabase adapter in `apps/frontend/src/lib/api/adapters/supabase/`.

## List

All database changes grouped by object: _tables and columns_ (for each new one, the existing table or column closest to it), _RLS policies_, _functions and RPCs_ (with `security invoker|definer` and grantees), _triggers_, _indexes_, _grants and revokes_, _storage buckets and policies_, _adapter methods_. Say in one line what each is for.

## Evaluate (criterion slugs)

- `db-paradigm`: the items of `.agents/code-review-checklist.md` § Supabase Backend — common columns on content tables; RLS enabled with the standard 5-policy pattern; `(SELECT auth.uid())` / `(SELECT auth.jwt())` scalar subqueries, never bare calls; every policy names `TO anon` or `TO authenticated`; SECURITY DEFINER functions set `search_path = ''` and schema-qualify their calls; B-tree indexes on `project_id` and every FK column; triggers named `set_updated_at`, `validate_{thing}`, `enforce_{constraint}`.
- `db-authority`: authority goes through `user_can` and the grants model. A policy that re-derives access inline instead of using the helper is the finding. The grant permission enum stays in sync with its TypeScript twin (`yarn assert:grant-permission-enum`).
- `db-necessity`: a new table or column that existing schema could have carried. For each one, ask in order: is the value already stored or derivable; would it fit an existing column, jsonb bag, or enum gaining a value; is the new table a 1:1 extension of an existing one, or a near-duplicate of a sibling a discriminator column would generalise? Name the existing object and what it would take to use it. Not a finding when the object earns its place visibly (its own RLS, index, FK, cardinality or lifecycle). A per-row publication flag is always `blocking`: voter visibility is the all-of rule (open project, confirmed nomination, every linked entity confirmed).
- `db-reuse`: a new trigger, RPC or policy that duplicates or nearly duplicates an existing one. Could an existing RPC take a parameter instead? Name it.
- `db-generalise`: a new object that is one of several near-identical siblings. Propose the general form.
- `db-rpc-contract`: RPC return nullability is declared (`yarn assert:rpc-nullability`); `yarn db:types` was rerun and the generated types match; the adapter maps rows through `COLUMN_MAP` / `PROPERTY_MAP` with no casts (`yarn assert:adapter-casts`).
- `db-pgtap`: a new policy or function has pgTAP coverage that follows `.agents/code-review-checklist.md` § Supabase Backend: BEGIN/ROLLBACK boundaries, `create_test_data()` fixtures, `ok()` for positives, `lives_ok()` + `is()` for silent RLS denial, `throws_ok()` for expected errors.

### Migration checks (run whenever the PR adds or edits a migration)

- `db-migration-edited`: migrations are append-only once frozen. `apps/supabase/supabase/migrations.manifest.json` lists every frozen migration with its hash, and the freeze gate refuses an edit to any of them, deployed or not. An in-place edit of a listed migration, or of one already on `origin/main`, is a finding. The reverse holds too: a fix option that folds, squashes or rewrites listed migrations proposes an edit the freeze forbids, so it is not a fix option. Propose a new appended migration instead. At a head without the manifest, the older rule applies: editing in place is allowed until the migration reaches `origin/main`.
- `db-schema-parity`: the migrations and the declarative schema in `apps/supabase/supabase/schema/` change together and agree (`yarn assert:schema-migration-parity`, `yarn check:schema-equivalence`), and `yarn db:lint:sql` is clean on the applied database.
- `db-destructive`: drops, type narrowing, constraint validation or backfills without batching. Say what happens to existing rows.
- `db-commit-tag`: the commit containing the migration carries the `[db]` tag (`fix[db]: …`), per § the commit item of the checklist.

## Decide at plan time

Read by the planning workflow, not by review agents. Each line is a decision a phase that touches the database must make, or defer by name, before its context document is written. A line that does not apply is skipped silently.

- **Where the data lives.** New table, new column, or an existing object reused. Name the siblings and why they do not fit. For a file: which storage bucket and which path pattern.
- **What the rows key on.** `project_id` (and through it the account) as every sibling's RLS policies and indexes use it, and whether this object carries it directly or reaches it through a join.
- **What a row points at.** When two objects could each stand for the same state, which one is authoritative and what the other becomes.
- **Who may read and who may write.** Per role (`anon`, `authenticated`, `service_role`): which privileges, through which `user_can` permission, and how the voter-visibility rule applies. Whether any reader or writer runs with the service role, where RLS does not apply and the check must be made in code.
- **The access path.** Which adapter method or RPC reads it and which writes it, mapped through `PROPERTY_MAP`. An existing RPC taking a parameter comes before a new one; a new RPC names its `security invoker|definer`, its grantees and its pgTAP tests.
- **Writes that span more than one row, table or bucket.** The order of the steps, which step makes the change visible, what a failure part-way leaves, and who cleans it up.
- **What happens on delete.** Of the row, its parent and the project: cascade or an explicit step, and what happens to stored files.
- **What is frozen once stored.** A jsonb or file shape becomes a storage contract once data exists: what versions it, and what reads an old version.

## Where to look

`.claude/skills/database/schema-reference.md`, `.claude/skills/database/rls-policy-map.md`, `apps/supabase/supabase/tests/database/` (pgTAP precedent), `apps/supabase/supabase/migrations/00017_user_can_reads_grants.sql`.

## Promote to

`.agents/code-review-checklist.md` § Supabase Backend and § Supabase Adapter; `.claude/skills/database/SKILL.md`.

<!-- skill-link-allow: origin/main -->
