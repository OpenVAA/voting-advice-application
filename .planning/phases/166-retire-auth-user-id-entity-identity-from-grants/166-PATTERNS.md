# Phase 166: Retire auth_user_id — Entity Identity from Grants - Pattern Map

**Mapped:** 2026-10-01
**Files analyzed:** ~45 (core 20 + comment-only sweep files)
**Analogs found:** all core files have an in-repo analog. No file lacks one.

Paths are relative to the worktree root. `S` = `apps/supabase/supabase`. Anchor by content, not by line number. Line numbers are as of HEAD and are given only as hints.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `S/schema/301-auth-functions.sql` (+ `private.caller_entity_ids`) | SQL definer helper | request-response (read) | `private.entity_project_id` in the same file | exact |
| `S/schema/503-entity-rpcs.sql` `get_candidate_user_data` → plpgsql INVOKER | RPC | request-response | `check_feedback_rate_limit` RAISE in `S/schema/107-feedback.sql`; the current RPC body | role-match |
| `S/schema/300-auth-tables.sql` (+ partial unique index) | schema/index | n/a | `idx_grants_scope_target` (line ~31) | exact |
| `S/schema/102,200,302,303,502` | schema drop / comments | n/a | itself | — |
| `S/migrations/00001_initial_schema.sql` | generated | — | `yarn schema:regenerate` (do not hand-edit) | — |
| `packages/supabase-types/src/database.ts` | generated | — | `yarn db:types` after `yarn db:reset` | — |
| `S/tests/database/36-entity-identity.test.sql` (new) | pgTAP test | — | `35-feedback-rate-limit-key.test.sql` (frame, throws_ok) + `07-rpc-security.test.sql` (census) | exact |
| `S/tests/database/12-user-can.test.sql` | pgTAP fixture fix | — | itself (retarget the union caller to `test_id('candidate_a2')`) | — |
| `S/tests/database/00,02,03,05,09,14,20,21` | pgTAP fixtures/guards | — | themselves | — |
| `S/functions/identity-callback/candidateRecord.ts` (+ `deleteCandidate`, two-query lookup) | Edge helper | CRUD | `findExistingCandidate` / `createCandidate` in the same file | exact |
| `S/functions/identity-callback/{candidateRecord.test.ts,index.ts,flowConformance.test.ts}` | Edge + source-text tests | — | themselves | — |
| `S/functions/{identity-callback,invite-candidate}/entityGrant.ts` (+ `.test.ts`) | Edge helper | CRUD | itself; the two copies must stay byte-identical | — |
| `S/functions/invite-candidate/{index.ts,flowConformance.test.ts}` | Edge function | request-response | itself (delete step 7) | — |
| `tests/tests/utils/supabaseAdminClient.ts` (+ two lookup helpers) | E2E utility | CRUD | `findData` + existing methods `unregisterCandidate` (~537), `sendEmail` (~574) | exact |
| `tests/tests/specs/candidate/candidate-bank-auth{,-journey}.spec.ts` | E2E spec | — | themselves | — |
| dev-seed `permittedKeys.ts`, `OrganizationsGenerator{,.test}.ts`, `templates/e2e/base.ts`, `column-map.ts`, `S/seed.sql` | config / fixtures | — | themselves | — |

## Pattern Assignments

### `private.caller_entity_ids` in `301-auth-functions.sql` (definer helper)
**Analog:** `private.entity_project_id` (around lines 225–245). Copy all of these from it:
- the `----` banner block with a prose header,
- `LANGUAGE sql STABLE SECURITY DEFINER`,
- `SET search_path = ''`,
- the CASE over the four entity types,
- schema-qualified table names everywhere.
```sql
CREATE OR REPLACE FUNCTION private.entity_project_id (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT CASE p_entity_type
    WHEN 'candidate' THEN (SELECT project_id FROM public.candidates WHERE id = p_entity_id)
    ...
  END;
$$;
```
**Placement:** put it before the grant statement (around line 698):
```sql
GRANT
EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon,
authenticated,
service_role;
```
That grant only reaches functions that already exist when it runs. Do not call `private.entity_project_id` from inside the new helper, because SKILL rule 6b forbids nested definer calls. Inline the EXISTS hop instead. The full body is in RESEARCH Pattern 1. Also update the header comment at line ~24, which says "policy-only SECURITY DEFINER helpers".

### `get_candidate_user_data` (503) as a plpgsql INVOKER RPC that RAISEs with HINT
**RAISE analog:** `S/schema/107-feedback.sql` ~170:
```sql
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.'
      USING ERRCODE = 'P0001';
```
No schema file uses `HINT =` yet, so this is the first one. Extend the clause as `USING ERRCODE = 'P0001', HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS'`. Keep these unchanged, because the RPC-nullability script checks them:
- the `RETURNS TABLE (` block (14 columns),
- the UNION ALL `NULL::` literals,
- the existing `GRANT EXECUTE … TO authenticated`.

Alias-qualify every column, because the OUT variables shadow bare column names. The full body is in RESEARCH Pattern 2.

### Partial unique index in `300-auth-tables.sql`
**Analog:** line ~31 `CREATE INDEX idx_grants_scope_target ON public.grants (scope, target_type, target_id);`. Put the new index directly after it, named `idx_grants_<what>`. Its WHERE clause is `scope = 'entity' AND target_type = 'candidate' AND role = 'editor'`. The table-level key at line ~23 is `grants_user_scope_target_role_key`, and `entityGrant.ts` must name it.

### New pgTAP file `36-entity-identity.test.sql`
**Frame analog:** `35-feedback-rate-limit-key.test.sql`:
```sql
-- 36-…test.sql: <one-line claim>
-- <prose paragraphs>
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id).
BEGIN;
SET search_path = public, extensions;
-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;
SELECT plan(N);  ...  SELECT * FROM finish();  ROLLBACK;
```
**throws_ok form** (35, ~line 135): `throws_ok(format($$…$$, test_id('project_a')), 'P0001', '<message>', '<description>')`.

**Census analog:** `07-rpc-security.test.sql` ~355–378. It is an `is( (SELECT string_agg(p.proname, ',' ORDER BY p.proname) FROM pg_proc p JOIN pg_namespace n … WHERE … AND p.proname NOT LIKE 'test\_%'), '<pinned list>', 'census: …')`.

- Copy that string_agg/ARRAY shape for the auth.users FK census. The query is in RESEARCH Pattern 8.
- Wrap the census and the 42703 behavioural assertion in `SELECT todo_start('the entity tables still carry the auth user link');` … `SELECT todo_end();` in plan 01. Remove the wrapper in plan 03.
- HINT readback: write a `pg_temp` plpgsql function that uses `GET STACKED DIAGNOSTICS v_hint = PG_EXCEPTION_HINT` (RESEARCH Code Examples).
- Do not make the RPC a public definer. The 07 census pins the public set at six names.

### `candidateRecord.ts` (Edge helper, CRUD)
**Analog:** the file itself. Follow these conventions:
- No imports at all. Declare a local narrow client interface instead (`CandidateLookupClient`, `CandidateCreateClient`).
- JSDoc with `@param`, `@returns` and `@throws {Error & { code: string }}`.
- Throw errors with this shape:
```ts
throw Object.assign(new Error(`Candidate lookup failed: ${error.message}`), { code: 'ERR_CANDIDATE_LOOKUP_FAILED' });
```
Changes:
- **Lookup:** add a `grants` query, then a `candidates` query with `.in('id', ids)` plus `.eq('project_id', …)` plus `.maybeSingle()`. The interface must now model a thenable builder with `in` (RESEARCH Pattern 4).
- **New `deleteCandidate(client, { projectId, candidateId })`:** give it its own narrow interface. Its `.from('candidates')` chain must include `project_id`, because `candidateRecord.test.ts` scans every chain for it.
- **`createCandidate`:** remove `auth_user_id: authUserId` and the `authUserId` param.
- **Comment hygiene:** remove the `162`, `D-10` and `162-06` citations from the JSDoc.

### `identity-callback/index.ts`
Wrap the single `await writeEntityGrant(supabaseAdmin, …)` in try/catch. In the catch, call `deleteCandidate` only when `!existingCandidate`, then rethrow (RESEARCH Pattern 5). These source-text anchors must survive:
- `'candidateId = candidate.id;\n    }\n'`
- exactly one `await writeEntityGrant(`
- `'five ERR_ENV_UNCONFIGURED throws'`
- `'Provider-Agnostic Identity Callback Edge Function'`
- `'[identity-callback] token verification failed'`

`index.ts` must contain no `.from('candidates')`.

### `entityGrant.ts` (both copies)
Today the check is `const UNIQUE_VIOLATION = '23505';` (line ~23) and `if (error && error.code !== UNIQUE_VIOLATION)` (line ~79). Add `const GRANT_KEY = 'grants_user_scope_target_role_key'` and require `error.message.includes(GRANT_KEY)`. Do not write the word `'candidate'` in the module, because flowConformance asserts it is absent. Verify the copies stay identical with `diff`. The test fake in `entityGrant.test.ts` already uses the message `duplicate key value violates unique constraint "grants_user_scope_target_role_key"`. Add a case that uses the partial-index name and expects `ERR_GRANT_WRITE_FAILED`.

### `invite-candidate/index.ts` + `flowConformance.test.ts`
- Delete the `// 7. Link auth user to candidate record` block and its `rollbackInvite` arm.
- Renumber step 8 to 7.
- In the test, change `.toBe(2)` to `.toBe(1)`, drop the "Failed to link the invited user…" assertion, and retitle it.

### `tests/tests/utils/supabaseAdminClient.ts`
Model the new helpers on the existing `this.client.from(...)` methods: throw `new Error(\`<method>: ${error.message}\`)` and scope candidates queries with `.eq('project_id', this.projectId)`.
- Add `candidateIdsForUser(userId)` and `userIdForCandidate(candidateId)` (RESEARCH Pattern 7).
- Make them public, not private. `candidate-bank-auth.spec.ts` uses a raw service-role client, so it inlines the grants query anyway.
- In `unregisterCandidate` (~537) and `deleteAllTestUsers` (~669), resolve the ids **before** deleting grants or users, because `grants.user_id` cascades.
- `forceRegister` (~337), `sendEmail` (~574) and `deleteBankAuthCandidateBySub` (~480) change as listed in RESEARCH.

## Shared Patterns

- **search_path on SQL functions:** pin `SET search_path = ''` on every definer function and schema-qualify every name. The 301 header (~line 443) explains why.
- **`private` vs `public`:** a new definer function goes in `private`. If it went in `public`, it would have to be added to the 07 census deliberately.
- **SQL formatting:** run Prettier on edited `schema/*.sql` and `tests/*.sql` **before** `yarn schema:regenerate`. The migration is prettier-ignored and must stay byte-identical (`assert:schema-migration-parity`), and you must never add a `00002_*.sql`.
- **Generated artefacts:** order is `schema:regenerate` → `db:reset` → `db:types` → `test:db`. If pgTAP runs first, its helpers leak into `database.ts`.
- **Edge error contract:** `Object.assign(new Error(msg), { code: 'ERR_*' })`. Messages carry no project id or user id (the function runs with verify_jwt off).
- **Comment hygiene:** no phase, plan or decision IDs in `apps/` or `tests/` comments, and no forced line breaks. When a source-text test anchors on comment prose, update the test in the same commit.

## No Analog Found

None. There are two partial gaps:
- `HINT =` in a RAISE has no schema precedent. Extend the `107-feedback.sql` P0001 form.
- `todo_start`/`todo_end` has no pgTAP precedent in the repo. Its use was probed in RESEARCH Pattern 8.

## Metadata
**Search scope:** `S/schema`, `S/tests/database`, `S/functions/{identity-callback,invite-candidate}`, `tests/tests/utils`
**Tracked-source check:** `git ls-files` confirmed for `301-auth-functions.sql` and `35-feedback-rate-limit-key.test.sql`. All other cited files are tracked source, not mirrors.
