# 188-04 local schema evidence

Date: 2026-11-18 (UTC). Local stack only (`supabase_db_openvaa-local`); no hosted project was touched.
Tree: Task 1 commit `de8535729` plus the Task 2 comment-only edits of schema/506 and schema/107.

RESET_EXIT=0
MIGRATIONS_APPLIED=23
PGTAP_EXIT=0
EQUIVALENCE_EXIT=0
DB_TYPES_EXIT=0
DB_LINT_EXIT=0
RPC_NULLABILITY_EXIT=0
GSD_SESSION_MUST_RESET=yes

## How each line was measured

- `RESET_EXIT=0`: `yarn db:reset` exited 0 on each reset this plan made: before the full pgTAP run of Task 1, and again before `yarn db:types` and `yarn db:lint:sql`. The second reset leaves no pgTAP helper functions behind for the type generator to pick up.
- `MIGRATIONS_APPLIED=23`: `select count(*), max(version) from supabase_migrations.schema_migrations` on the local database answered `23|00023`.
- `PGTAP_EXIT=0`: `yarn workspace @openvaa/supabase test:db` on the freshly reset database: `Files=59, Tests=2923`, `Result: PASS`. `59-invitation-caller-limit.test.sql` ran (`plan (25)`, ok). Before the function existed it failed with `function public.invitation_caller_take(uuid, unknown) does not exist` and `planned 25 tests but ran 0`.
- `EQUIVALENCE_EXIT=0`: `yarn check:schema-equivalence` printed `EQUAL -- the database built from the schema files ... is the database built from the migrations` (36 s). Schema census: CREATE TABLE 71 (in public: 21), CREATE POLICY 108, CREATE FUNCTION 150, GRANT 718, CREATE TRIGGER 87.
- `DB_TYPES_EXIT=0`: `yarn db:types` on the freshly reset database. `packages/supabase-types/src/database.ts` gains one line, `invitation_caller_take: { Args: { p_address: string; p_project_id: string }; Returns: number };`, and nothing else.
- `DB_LINT_EXIT=0`: `yarn db:lint:sql`: `Summary: 0 error(s), 3 warning(s)`. The three warnings are foreign keys without indexes on `constituency_group_constituencies`, `election_constituency_groups` and `nominations.created_by`; none is on a table or function this plan touches.
- `RPC_NULLABILITY_EXIT=0`: `yarn assert:rpc-nullability`: 3 RETURNS TABLE RPCs, 0 violations. `invitation_caller_take` returns a scalar and is outside the guard.
- `yarn assert:comment-hygiene`: exit 0, 2333 files scanned, 0 violations.
- `yarn assert:schema-migration-parity`: exit 0, 23 migrations in the manifest, the frozen migrations match it.
- `GSD_SESSION_MUST_RESET=yes`: the -gsd worktree shares this local stack, which now holds migration 00023.
