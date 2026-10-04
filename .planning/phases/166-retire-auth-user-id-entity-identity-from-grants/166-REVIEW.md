---
phase: 166-retire-auth-user-id-entity-identity-from-grants
reviewed: 2026-10-02T00:00:00Z
depth: standard
files_reviewed: 52
files_reviewed_list:
  - .claude/skills/database/SKILL.md
  - .claude/skills/database/extension-patterns.md
  - .claude/skills/database/rls-policy-map.md
  - .claude/skills/database/schema-reference.md
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts
  - apps/supabase/supabase/functions/identity-callback/candidateRecord.ts
  - apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts
  - apps/supabase/supabase/functions/identity-callback/entityGrant.ts
  - apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts
  - apps/supabase/supabase/functions/invite-candidate/entityGrant.ts
  - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
  - apps/supabase/supabase/functions/invite-candidate/index.ts
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/102-entities.sql
  - apps/supabase/supabase/schema/200-indexes.sql
  - apps/supabase/supabase/schema/300-auth-tables.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/schema/303-column-grants.sql
  - apps/supabase/supabase/schema/502-email-helpers.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/seed.sql
  - apps/supabase/supabase/tests/database/00-helpers.test.sql
  - apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql
  - apps/supabase/supabase/tests/database/03-anon-read.test.sql
  - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
  - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
  - apps/supabase/supabase/tests/database/12-user-can.test.sql
  - apps/supabase/supabase/tests/database/14-grants-migration.test.sql
  - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
  - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
  - apps/supabase/supabase/tests/database/36-entity-identity.test.sql
  - packages/dev-seed/src/generators/OrganizationsGenerator.ts
  - packages/dev-seed/src/template/permittedKeys.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts
  - packages/supabase-types/src/column-map.ts
  - packages/supabase-types/src/database.ts
  - tests/tests/setup/admin/admin-access.teardown.ts
  - tests/tests/setup/admin/admin-auth.setup.ts
  - tests/tests/setup/candidate/bank-auth-journey.teardown.ts
  - tests/tests/setup/shared/auth.setup.ts
  - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/utils/adminCredentials.ts
  - tests/tests/utils/candidateJourneyConstants.ts
  - tests/tests/utils/supabaseAdminClient.ts
  - tests/tests/utils/testCredentials.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 166: Code Review Report

**Reviewed:** 2026-10-02
**Depth:** standard
**Files Reviewed:** 52
**Status:** issues_found

## Summary

The phase moves "which entity am I" from `candidates.auth_user_id` / `organizations.auth_user_id` to the `(entity, <type>, <id>, editor)` grant, and drops both columns. I read the schema sources, both Edge Functions, both `entityGrant.ts` copies, the E2E admin client, and every pgTAP file touched, and I diffed them against `cb276b0d2`. I also ran `yarn assert:schema-migration-parity`, which passes (26 schema files, 6372 lines, one migration file, generated copy current). The `database.ts` and migration changes are mechanical and match the schema edits.

Authorization and SECURITY DEFINER exposure hold up:

- `private.caller_entity_ids` is `SECURITY DEFINER` with `search_path = ''` and schema-qualified names. It filters on `auth.uid()` only, so it can reveal only the caller's own grants. `private` is not in `config.toml [api] schemas`, so PostgREST does not publish it.
- The public RPC stays `SECURITY INVOKER`, so the 07 census is undisturbed.
- Only `editor` confers identity, and `user_can` is never called, so a project or account admin resolves to no row (SC1).
- `public.grants` is still `REVOKE ALL` from `anon`, `authenticated` and `public`.
- The `anon` census in `36-entity-identity.test.sql` is a real catalog query. It is not a name check, so it will also catch a re-added column.
- `get_candidate_user_data`'s plpgsql rewrite qualifies every column, so there is no OUT-variable shadowing.
- No planning references or narrative survived in the touched files. My grep for phase, plan and decision IDs returned nothing, so the D-19 sweep was done.

No blockers. Two warnings concern robustness of the new write-side rule and the new lookup under concurrency. Three info items cover minor inconsistencies.

## Warnings

### WR-01: `writeEntityGrant` idempotency depends on which unique index PostgreSQL checks first

**File:** `apps/supabase/supabase/functions/identity-callback/entityGrant.ts:81` (byte-identical copy at `apps/supabase/supabase/functions/invite-candidate/entityGrant.ts:81`); rationale at `apps/supabase/supabase/schema/300-auth-tables.sql:33`

**Issue:** The new partial unique index `idx_grants_one_candidate_editor` is a second unique constraint that an exact-duplicate grant also violates. `writeEntityGrant` now treats a 23505 as success only when the message contains `grants_user_scope_target_role_key`. The schema comment states that this key "is checked first". That ordering is not a documented guarantee. PostgreSQL probes unique indexes in `RelationGetIndexList` order, which is by index OID, so the claim holds only while the table's own constraint index has the smaller OID. That is true after a fresh `db reset`, and also in a `pg_dump` restore because pg_dump sorts same-priority objects by name and `grants_user_...` sorts before `idx_grants_...`. It is still an implementation detail. If the order ever flips (OID wraparound, a rebuild such as `REINDEX` or `DROP`/`CREATE` of the constraint, or a restore path that creates the partial index first), a duplicate grant is reported as `idx_grants_one_candidate_editor`.

The consequence is not confined to a new registration. `identity-callback` writes the grant on every login, including the existing-candidate branch where the grant already exists. Every returning candidate would then hit `ERR_GRANT_WRITE_FAILED` and get a 500, a total login outage. The test suite pins the message-matching logic against hand-written error strings and the ordering only on a freshly reset database, so a flipped order would go unnoticed.

**Fix:** Stop relying on which violation PostgreSQL reports. Use an arbiter-scoped insert so an exact duplicate never raises and only a genuine second-editor conflict does:
```ts
const { error } = await client
  .from('grants')
  .upsert(
    { user_id: userId, scope: 'entity', target_type: entityType, target_id: entityId, role: 'editor' },
    { onConflict: 'user_id,scope,target_type,target_id,role', ignoreDuplicates: true }
  );
if (error) throw Object.assign(new Error(`Grant write failed: ${error.message}`), { code: 'ERR_GRANT_WRITE_FAILED' });
```
With `ON CONFLICT (…) DO NOTHING` on the grant key, a duplicate is skipped before the other index is probed, and a violation of `idx_grants_one_candidate_editor` still raises. The `GrantWriteClient` interface and its tests then need `upsert`. If keeping `insert` is preferred, resolve the ambiguity with a follow-up read on a 23505. If the row `(user, entity, type, id, editor)` exists, the grant is idempotent. Otherwise it is a refusal.

### WR-02: A concurrent first login can create two candidates for one identity, and both lookups then fail permanently with no repair path

**File:** `apps/supabase/supabase/functions/identity-callback/index.ts:263-287`; `apps/supabase/supabase/functions/identity-callback/candidateRecord.ts:78-96`; `apps/supabase/supabase/schema/503-entity-rpcs.sql:204-208`

**Issue:** The find-then-create sequence is not atomic. Two simultaneous callbacks for a new identity (a double-submitted redirect, or a browser retry after a slow response) both see "no candidate" and each insert a candidate. Each then writes its own grant `(user, candidate, id_N, editor)`. The new partial index is keyed on `target_id` alone, so it does not stop one user holding editor grants on two different candidates. D-12 deliberately defers a write-time constraint.

What changed is what the user then sees. Both `findExistingCandidate` (`maybeSingle()` errors on two rows, so every later login throws `ERR_CANDIDATE_LOOKUP_FAILED`) and `get_candidate_user_data` (P0001 `ERR_ENTITY_IDENTITY_AMBIGUOUS`) fail on every subsequent request. The candidate is locked out and nothing repairs it, because the self-repair path used `auth_user_id` and no longer exists. The compensating delete only covers a failed grant write, not this case. The window is narrow, but each failure is permanent for that user until an operator deletes a candidate by hand.

**Fix:** Either close the window or make the ambiguity self-healing. Cheapest options:
- Serialise per identity: an advisory lock keyed on the user id (via a service-role RPC), or a database-side find-or-create.
- After writing the grant on the create branch, re-run `findExistingCandidate`. If it now reports more than one granted candidate in the project, delete the one this request created. Keep the oldest, which makes the later request the loser.
- Document the manual recovery (delete one candidate; the `cleanup_grants_on_delete` trigger removes its grant) in the runbook, since the error text names no id by design.

## Info

### IN-01: `get_candidate_user_data` raises the ambiguity error for entity types it never returns rows for

**File:** `apps/supabase/supabase/schema/503-entity-rpcs.sql:204-208`

**Issue:** The `cardinality(v_entity_ids) > 1` check runs before the type arms. `private.caller_entity_ids` accepts all four entity types, but the function only has `candidate` and `organization` arms. A caller passing `p_entity_type => 'faction'` or `'alliance'` with two editor grants in the project gets P0001, where before the same call returned zero rows. Nothing in the codebase makes that call (the frontend always passes `'candidate'`), so this is latent. It also makes the documented contract ("the caller's own entity row of one type") raise for types that cannot match.

**Fix:** Skip the lookup for types without an arm. For example, add `IF p_entity_type NOT IN ('candidate', 'organization') THEN RETURN; END IF;` before the `ARRAY(...)` call, or restrict the ambiguity raise to those two types.

### IN-02: `forceRegister` now fails when a candidate already has another user's editor grant, where it used to overwrite the link

**File:** `tests/tests/utils/supabaseAdminClient.ts:420-428`

**Issue:** The old step 4 (`UPDATE candidates SET auth_user_id = <new user>`) silently replaced a stale link. The new grant insert is refused by `idx_grants_one_candidate_editor` if any other user still holds the editor grant. That is the correct invariant, but a setup that registers the same candidate under a different email without an `unregisterCandidate(<old email>)` first now dies with a bare "duplicate key value" and then rolls the new user back. The suite passed (171/171), so no current path trips it. The failure message does not say which user holds the grant.

**Fix:** In the catch for the grant insert, add the existing holder to the message using `userIdForCandidate(candidate.id)` ("candidate already has an editor: <user id>; call unregisterCandidate first"). Alternatively, have `forceRegister` read `userIdForCandidate` first and fail fast with that message.

### IN-03: `testCredentials.ts` still calls CA-AA-1 the "perfect-match candidate" while `base.ts` now says it is generic

**File:** `tests/tests/utils/testCredentials.ts:12`; `packages/dev-seed/src/templates/e2e/base.ts:916`

**Issue:** The sweep rewrote the comment above `test-e2e-base-ca-aa-1` from "the perfect-match candidate (POLAR_MAX …)" to "a generic candidate (GENERIC answers)". The code is consistent with the new text (`withInfoAnswers(GENERIC)`), but `testCredentials.ts` still reads "CA-AA-1, the base dataset's perfect-match candidate". The two now contradict each other, and one of them is wrong. That is the kind of residue D-19's whole-file sweep was meant to prevent.

**Fix:** Change `testCredentials.ts` line 12 to describe CA-AA-1 as the base dataset's registered test candidate, keeping the ToU and answer-set rationale that follows.

---

_Reviewed: 2026-10-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
