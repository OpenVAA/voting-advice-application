---
phase: 166-retire-auth-user-id-entity-identity-from-grants
verified: 2026-10-02T06:00:00Z
status: passed
score: 8/8 must-haves verified
covered_files:
  - ".claude/skills/database/SKILL.md"
  - ".claude/skills/database/extension-patterns.md"
  - ".claude/skills/database/rls-policy-map.md"
  - ".claude/skills/database/schema-reference.md"
  - ".planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-01-PLAN.md"
  - ".planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-01-SUMMARY.md"
  - ".planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-02-PLAN.md"
  - ".planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-02-SUMMARY.md"
  - ".planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-03-PLAN.md"
  - ".planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-03-SUMMARY.md"
  - ".planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-04-PLAN.md"
  - ".planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-04-SUMMARY.md"
  - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts"
  - "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts"
  - "apps/supabase/supabase/functions/identity-callback/candidateRecord.ts"
  - "apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts"
  - "apps/supabase/supabase/functions/identity-callback/entityGrant.ts"
  - "apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts"
  - "apps/supabase/supabase/functions/identity-callback/index.ts"
  - "apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts"
  - "apps/supabase/supabase/functions/invite-candidate/entityGrant.ts"
  - "apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts"
  - "apps/supabase/supabase/functions/invite-candidate/index.ts"
  - "apps/supabase/supabase/schema/102-entities.sql"
  - "apps/supabase/supabase/schema/200-indexes.sql"
  - "apps/supabase/supabase/schema/300-auth-tables.sql"
  - "apps/supabase/supabase/schema/301-auth-functions.sql"
  - "apps/supabase/supabase/schema/302-rls.sql"
  - "apps/supabase/supabase/schema/303-column-grants.sql"
  - "apps/supabase/supabase/schema/502-email-helpers.sql"
  - "apps/supabase/supabase/schema/503-entity-rpcs.sql"
  - "apps/supabase/supabase/seed.sql"
  - "apps/supabase/supabase/tests/database/00-helpers.test.sql"
  - "apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql"
  - "apps/supabase/supabase/tests/database/03-anon-read.test.sql"
  - "apps/supabase/supabase/tests/database/05-organization-admin.test.sql"
  - "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql"
  - "apps/supabase/supabase/tests/database/12-user-can.test.sql"
  - "apps/supabase/supabase/tests/database/14-grants-migration.test.sql"
  - "apps/supabase/supabase/tests/database/20-storage-authority.test.sql"
  - "apps/supabase/supabase/tests/database/21-entity-organization.test.sql"
  - "apps/supabase/supabase/tests/database/36-entity-identity.test.sql"
  - "packages/dev-seed/src/generators/OrganizationsGenerator.ts"
  - "packages/dev-seed/src/template/permittedKeys.ts"
  - "packages/dev-seed/src/templates/e2e/base.ts"
  - "packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts"
  - "packages/supabase-types/src/column-map.ts"
  - "packages/supabase-types/src/database.ts"
  - "tests/tests/setup/admin/admin-access.teardown.ts"
  - "tests/tests/setup/admin/admin-auth.setup.ts"
  - "tests/tests/setup/candidate/bank-auth-journey.teardown.ts"
  - "tests/tests/setup/shared/auth.setup.ts"
  - "tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts"
  - "tests/tests/specs/candidate/candidate-bank-auth.spec.ts"
  - "tests/tests/specs/candidate/candidate-journey.spec.ts"
  - "tests/tests/utils/adminCredentials.ts"
  - "tests/tests/utils/candidateJourneyConstants.ts"
  - "tests/tests/utils/supabaseAdminClient.ts"
  - "tests/tests/utils/testCredentials.ts"
covered_digest: "v2:sha256:46006c4954fde848ae2ce833bbf0eb6ca9c8e2926682f8c02c492f45b1914ea4"
behavior_unverified: 0
overrides_applied: 0
re_verification: false
---

# Phase 166: Retire `auth_user_id` — Entity Identity from Grants — Verification Report

**Phase Goal:** The grant is the only link between an auth user and an entity. "Which entity am I" is answered from the entity-scope grant. The invite and identity-callback flows write one link instead of two. No public row exposes an auth user id, except the one exemption D-02 names: `nominations.created_by`.
**Verified:** 2026-10-02
**Status:** passed
**Re-verification:** No — initial verification
**Tree:** HEAD `ef74645b8` in the `-gsd` worktree (source tree identical to `6e0e2d968`, the tree the gates ran on; `git status` shows only an unrelated untracked `.planning/quick/261001-n8y-.../gate-evidence/`).

## Goal Achievement

### Observable Truths (ROADMAP success criteria SC1-SC8)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | `get_candidate_user_data` resolves the caller's entity from an `(entity, <type>, editor)` grant held by `auth.uid()`, joined to the entity table and filtered by project, not through `user_can`; SECURITY DEFINER lookup; more than one match is an error | VERIFIED | `schema/301-auth-functions.sql` `private.caller_entity_ids(p_project_id, p_entity_type)`: `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''`, reads `public.grants` where `user_id = auth.uid()`, `scope='entity'`, `role='editor'`, `target_type = p_entity_type`, plus a per-type `EXISTS` on the entity table's `project_id`. No `user_can` call. `schema/503-entity-rpcs.sql` `get_candidate_user_data` is plpgsql INVOKER, calls the helper in both arms, `RAISE ... ERRCODE 'P0001', HINT 'ERR_ENTITY_IDENTITY_AMBIGUOUS'` when `cardinality > 1`; no `LIMIT 1`. Live DB: `caller_entity_ids` prosecdef = t (private), `get_candidate_user_data` prosecdef = f (public). pgTAP `36-entity-identity` passes in my own run (zero / one / two grants, two projects, project admin, entity-admin holder, anon, both arms, token-staleness, throws_ok P0001 + hint). |
| SC2 | `identity-callback`'s `findExistingCandidate` looks up by grant; `createCandidate` no longer writes the column | VERIFIED | `functions/identity-callback/candidateRecord.ts`: two service-role queries (grants by `user_id`/entity/candidate/editor, then `candidates` with `.eq('project_id')` `.in('id', ids)` `.maybeSingle()`), both errors thrown as `ERR_CANDIDATE_LOOKUP_FAILED`. `createCandidate` insert row is `first_name, last_name, project_id, confirmed` only. `index.ts` wraps `writeEntityGrant` in try/catch and calls `deleteCandidate` (logged on failure) on the create branch before rethrow (D-09). Vitest (supabase workspace) 15 files / 205 tests pass in my run. |
| SC3 | `invite-candidate` writes the grant only; step 7 and its rollback arm removed | VERIFIED | `functions/invite-candidate/index.ts`: steps 1-7 are parse, authorise, admin client, candidate insert, invite email, grant write (with `rollbackInvite`), response. No `.update({ auth_user_id` and no "Failed to link" text. `flowConformance.test.ts` asserts `await rollbackInvite(supabaseAdmin` count is 1. |
| SC4 | Explicit decision on users per entity | VERIFIED | `schema/300-auth-tables.sql` `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id) WHERE scope='entity' AND target_type='candidate' AND role='editor'`; present in live DB. Organizations unindexed (multi-editor). Both `entityGrant.ts` copies are byte-identical (`diff` empty) and treat 23505 as success only when `error.message` includes `grants_user_scope_target_role_key`. pgTAP section "One editor per candidate" passes (second user refused naming the index; exact duplicate names the table key; third org editor admitted). |
| SC5 | Column gone from `candidates` and `organizations` with indexes, column-grant entries, seed, dev-seed keys, types, pgTAP fixtures/guards, E2E admin client | VERIFIED | `git grep -i auth_user_id -- . ':!.planning'` leaves only `36-entity-identity.test.sql` (the census's behavioural check). `authUserId` hits are variable/parameter names for a user id, not the column. Live DB: `information_schema.columns` has no column matching `%auth_user%`; no `idx_*auth_user*` index. `migrations/00001_initial_schema.sql` regenerated (`yarn assert:schema-migration-parity` exit 0: 26 schema files, 6372 lines, 1 migration file, generated copy current). `packages/supabase-types/src/{database,column-map}.ts` and `permittedKeys.ts` carry no entry. `tests/tests/utils/supabaseAdminClient.ts` has `candidateIdsForUser` / `userIdForCandidate` (public methods, not private as D-18 worded; the journey spec calls one directly) used by `forceRegister`, `sendEmail`, `unregisterCandidate`, `deleteBankAuthCandidateBySub`, `deleteAllTestUsers`; ordering trap respected (ids read, ToU reset by id, then grants deleted). |
| SC6 | `anon` can read no auth user id (narrowed by D-02 to everything but `nominations.created_by`), asserted by pgTAP, observed failing first | VERIFIED | `36-entity-identity.test.sql` section 1: catalog census of every FK-to-`auth.users` column anon can SELECT equals `['public.nominations.created_by']`, plus `throws_ok` 42703 on `SELECT auth_user_id FROM public.candidates` as anon. `166-NEGATIVE-CONTROLS.md` NC-4 records the un-wrapped RED run on the tree with the column present and the closing run after the drop. Passes in my own pgTAP run. Residue filed: `.planning/todos/pending/2026-10-01-nominations-created-by-readable-by-anon.md`. |
| SC7 | Every touched comment passes hygiene; no comment narrates the retirement | VERIFIED | `node scripts/assert-comment-hygiene.mjs` exit 0 (1762 files, 0 violations). `166-hygiene-scan.sh` over the 43 non-markdown touched files: exit 0, "CLEAN: no planning-reference form in 47 file(s)". Grep over added lines for retire/used to/formerly/previously/no longer/old column/auth link found nothing narrating the column; the seed, helper, candidateRecord and RPC comments read as if the grant had always been the link. |
| SC8 | Gates: pgTAP, unit, candidate and bank-auth E2E (3x), then full suite under the cardinal rule | VERIFIED | `166-04-gate-evidence/GATES.md` plus independent checks below. Run directories exist and their `results.json` agree: candidate-journey 5/5, candidate-a11y 17/17, bank-auth x3 8/8, bank-auth-journey x3 131/131, full 171/171, each with 0 unexpected, 0 flaky, 0 skipped. |

**Score:** 8/8 truths verified. No behavior-dependent truth is left presence-only: the state and error invariants (ambiguity raises, token-staleness independence, rollback after a failed grant write) are exercised by pgTAP and vitest tests that pass.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `schema/301-auth-functions.sql` `private.caller_entity_ids` | grant-table lookup helper | VERIFIED | substantive, SECURITY DEFINER, empty search_path, called from 503, EXECUTE granted by the private-schema statement (pgTAP asserts placement) |
| `schema/503-entity-rpcs.sql` `get_candidate_user_data` | plpgsql INVOKER, ambiguity raise | VERIFIED | both arms use the helper; signature `(uuid, entity_type)` unchanged, so types and RPC-nullability stay put |
| `schema/300-auth-tables.sql` `idx_grants_one_candidate_editor` | partial unique index | VERIFIED | in schema, migration and live DB |
| `functions/identity-callback/{candidateRecord,index,entityGrant}.ts` | grant lookup, compensating delete, named idempotent key | VERIFIED | see SC2, SC4 |
| `functions/invite-candidate/{index,entityGrant}.ts` | single link | VERIFIED | see SC3 |
| `tests/database/36-entity-identity.test.sql` | census + behavioural + identity + index tests | VERIFIED | in suite, passes |
| `tests/tests/utils/supabaseAdminClient.ts` | grant-based helpers | VERIFIED | see SC5 |
| `.claude/skills/database/*.md` (4 files) | grant-only description | VERIFIED | `caller_entity_ids`, `idx_grants_one_candidate_editor`, `ERR_ENTITY_IDENTITY_AMBIGUOUS` named in SKILL.md and schema-reference.md; the four files changed in `c7a906e18` |
| Todos | two residues filed, saved-answers todo annotated | VERIFIED | `2026-10-01-nominations-created-by-readable-by-anon.md`, `2026-10-01-identity-callback-compensating-delete-failure.md` exist; saved-answers todo cites `private.caller_entity_ids` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `get_candidate_user_data` | `private.caller_entity_ids` | `ARRAY(SELECT private.caller_entity_ids(...))` | WIRED | 503 line in the function body |
| `identity-callback/index.ts` | `findExistingCandidate` / `createCandidate` / `deleteCandidate` / `writeEntityGrant` | imports + try/catch | WIRED | step 7 of the flow |
| `invite-candidate/index.ts` | `writeEntityGrant` + `rollbackInvite` | grant failure arm | WIRED | one `rollbackInvite` call |
| `supabaseDataWriter.ts` | RPC | `p_project_id`, `p_entity_type: 'candidate'` | WIRED | only a comment changed; signature stable; layout `.catch` surfaces the P0001 |
| E2E specs/teardowns | admin client helpers | `candidateIdsForUser` etc. | WIRED | no remaining column reads |

### Data-Flow Trace (Level 4)

The identity chain ends in real tables: `grants` rows written by `writeEntityGrant` (both functions) and by `seed.sql` are the rows `caller_entity_ids` reads; no static fallback. FLOWING.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| pgTAP, full suite on the live local stack | `yarn workspace @openvaa/supabase test:db` (exit read unpiped) | exit 0, `Files=36, Tests=1335`, `Result: PASS`, 0 `not ok`; `36-entity-identity.test.sql ... ok` | PASS |
| Column and index absent from the live DB | `psql` on `supabase_db_openvaa-local`, `information_schema.columns` / `pg_indexes` | no `%auth_user%` column or index; `idx_grants_one_candidate_editor` present; `caller_entity_ids` definer, `get_candidate_user_data` invoker | PASS |
| Schema-migration parity | `yarn assert:schema-migration-parity` | exit 0, generated copy current, 1 migration file | PASS |
| Comment hygiene guard | `node scripts/assert-comment-hygiene.mjs` | exit 0, 0 violations | PASS |
| Supabase Edge Function vitest | `yarn test:unit` in `apps/supabase` | 15 files / 205 tests pass | PASS |
| dev-seed vitest | `yarn test:unit` in `packages/dev-seed` | 66 files / 897 tests pass | PASS |
| E2E evidence | read each `tests/e2e-runs/166-04-*/results.json` stats | all 9 runs expected == total, 0 unexpected / flaky / skipped | PASS (read, not re-run, per instruction) |

### Probe Execution

No `probe-*.sh` declared by the phase plans. SKIPPED.

### Requirements Coverage

Every AUTHID ID is claimed by at least one plan's `requirements:` frontmatter and is marked `[x]` / Complete in REQUIREMENTS.md; no orphans (REQUIREMENTS.md maps only AUTHID-01..09 to Phase 166).

| Requirement | Source Plan(s) | Status | Evidence |
|-------------|---------------|--------|----------|
| AUTHID-01 | 166-01 | SATISFIED | SC1 |
| AUTHID-02 | 166-02 | SATISFIED | SC2 |
| AUTHID-03 | 166-02 | SATISFIED | SC3 |
| AUTHID-04 | 166-01 | SATISFIED | SC4 |
| AUTHID-05 | 166-02, 166-03 | SATISFIED | SC5 |
| AUTHID-06 | 166-01, 166-03 | SATISFIED | SC6 |
| AUTHID-07 | 166-01, 166-02, 166-03 | SATISFIED | SC7 |
| AUTHID-08 | 166-04 | SATISFIED | SC8 |
| AUTHID-09 | 166-04 | SATISFIED | artifacts table (skills, todos) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (phase files) | - | TBD/FIXME/XXX debt markers | none found | Hygiene guard and phase scan clean; census shows no `# TODO` wrapper left in pgTAP (GATES: 0 `# TODO`) |
| `tests/tests/utils/supabaseAdminClient.ts` | 320, 352 | D-18 called the helpers "private"; they are public methods | Info | The journey spec calls `candidateIdsForUser` directly, so public is needed; no behavioral effect |
| `00-helpers.test.sql` | n/a | one comment explains a drop of an old function signature "left by an earlier run of this file" | Info | Borderline historical flavour, but it states a live technical constraint, not the retirement of the column; not a gap |

### Deferred / Known Residues (not gaps)

- `nominations.created_by` readable by `anon`: the D-02 named exemption, pinned by the census and filed as a todo. Not a SC6 failure under the narrowed criterion.
- Failed compensating delete in `identity-callback`: the one named residue (D-09), logged and filed as a todo.
- `deferred-items.md`: `03-anon-read` future-terms-of-use control passes for a second reason (unconfirmed nomination). Pre-existing, unrelated to the auth link, UNCONFIRMED; recorded for a later phase.

### Human Verification Required

None. The phase is database, Edge Function and test-harness work with no visual or real-time behavior of its own, and every behavioral invariant has an executed test.

### Gaps Summary

No gaps. The grant is the sole user-to-entity link in the code and in the live database; both readers (`get_candidate_user_data`, `findExistingCandidate`) and both writers (`invite-candidate`, `createCandidate`/seed) moved off the column before it was dropped; the one-user-per-candidate decision is enforced by an index that is named in the idempotency check; `anon` exposure is pinned by a census that was observed red before the drop. I did not re-run any E2E suite (per instruction); the E2E claims rest on the gate evidence file, cross-checked against the preserved run directories' `results.json`.

---

_Verified: 2026-10-02_
_Verifier: Claude (gsd-verifier)_
