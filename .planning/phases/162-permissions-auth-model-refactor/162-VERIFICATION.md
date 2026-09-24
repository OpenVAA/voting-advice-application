---
phase: 162-permissions-auth-model-refactor
verified: 2026-09-20T18:08:00Z
status: passed
score: 7/7 must-haves verified
covered_files:
  - ".agents/code-review-checklist.md"
  - ".claude/skills/database/SKILL.md"
  - ".claude/skills/database/extension-patterns.md"
  - ".claude/skills/database/rls-policy-map.md"
  - ".claude/skills/database/schema-reference.md"
  - ".planning/REQUIREMENTS.md"
  - ".planning/ROADMAP.md"
  - ".planning/STATE.md"
  - ".planning/WINDOWS.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-01-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-01-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-02-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-02-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-02b-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-02b-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-03-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-03-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-04-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-04-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-05-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-05-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-06-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-06-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-07-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-07-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-07b-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-07b-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-08-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-08-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-09-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-09-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-10-D35-FLATTENING.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-10-D36-REVERT.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-10-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-10-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-11-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-11-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-12-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-12-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-13-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-13-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-14-E2E-OUTLIER-DIAGNOSIS.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-14-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-14-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-15-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-15-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-16-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-16-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-17-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-17-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-18-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-18-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-19-PLAN.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-19-SUMMARY.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-CHECKPOINT-DECISIONS.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-CONTEXT.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-DISCUSSION-POINTS.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-FLOW-CONFORMANCE.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-IMPLEMENTATION-BRIEF.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-NEGATIVE-CONTROL-LEDGER.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-PATTERNS.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-PLAN-OUTLINE.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-REVIEW-FIX.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-REVIEW.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-SPEC.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-UAT.md"
  - ".planning/phases/162-permissions-auth-model-refactor/162-USER-RIGHTS.md"
  - ".planning/phases/162-permissions-auth-model-refactor/COVERAGE.md"
  - ".planning/phases/162-permissions-auth-model-refactor/deferred-items.md"
  - ".planning/phases/162-permissions-auth-model-refactor/evidence/162-18/census.txt"
  - ".planning/phases/162-permissions-auth-model-refactor/evidence/162-18/flow-controls.txt"
  - ".planning/phases/162-permissions-auth-model-refactor/evidence/162-19/confirmation-controls.txt"
  - ".planning/phases/162-permissions-auth-model-refactor/evidence/162-19/flow-controls-rerun.txt"
  - ".planning/state.json"
  - ".prettierignore"
  - "apps/frontend/messages/da/entityDetails.json"
  - "apps/frontend/messages/en/entityDetails.json"
  - "apps/frontend/messages/et/entityDetails.json"
  - "apps/frontend/messages/fi/entityDetails.json"
  - "apps/frontend/messages/fr/entityDetails.json"
  - "apps/frontend/messages/lb/entityDetails.json"
  - "apps/frontend/messages/sv/entityDetails.json"
  - "apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts"
  - "apps/frontend/src/lib/auth/passwordLogin.test.ts"
  - "apps/frontend/src/lib/auth/passwordLogin.ts"
  - "apps/frontend/src/lib/auth/roles.ts"
  - "apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte"
  - "apps/frontend/src/lib/i18n/translations/da/entityDetails.json"
  - "apps/frontend/src/lib/i18n/translations/en/entityDetails.json"
  - "apps/frontend/src/lib/i18n/translations/et/entityDetails.json"
  - "apps/frontend/src/lib/i18n/translations/fi/entityDetails.json"
  - "apps/frontend/src/lib/i18n/translations/fr/entityDetails.json"
  - "apps/frontend/src/lib/i18n/translations/lb/entityDetails.json"
  - "apps/frontend/src/lib/i18n/translations/sv/entityDetails.json"
  - "apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts"
  - "apps/frontend/src/lib/server/admin/requireAdminIdentity.ts"
  - "apps/frontend/src/lib/types/generated/translationKey.ts"
  - "apps/frontend/src/routes/admin/login/+page.server.ts"
  - "apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts"
  - "apps/frontend/src/routes/candidate/login/+page.server.ts"
  - "apps/supabase/README.md"
  - "apps/supabase/scripts/lint-schema.mjs"
  - "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts"
  - "apps/supabase/supabase/functions/identity-callback/candidateRecord.ts"
  - "apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts"
  - "apps/supabase/supabase/functions/identity-callback/entityGrant.ts"
  - "apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts"
  - "apps/supabase/supabase/functions/identity-callback/index.ts"
  - "apps/supabase/supabase/functions/invite-candidate/callerAuthority.test.ts"
  - "apps/supabase/supabase/functions/invite-candidate/callerAuthority.ts"
  - "apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts"
  - "apps/supabase/supabase/functions/invite-candidate/entityGrant.ts"
  - "apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts"
  - "apps/supabase/supabase/functions/invite-candidate/index.ts"
  - "apps/supabase/supabase/functions/invite-candidate/jwtSegment.test.ts"
  - "apps/supabase/supabase/functions/send-email/callerAuthority.ts"
  - "apps/supabase/supabase/functions/send-email/flowConformance.test.ts"
  - "apps/supabase/supabase/functions/send-email/index.ts"
  - "apps/supabase/supabase/functions/send-email/jwtSegment.test.ts"
  - "apps/supabase/supabase/functions/send-email/templateVars.test.ts"
  - "apps/supabase/supabase/functions/send-email/templateVars.ts"
  - "apps/supabase/supabase/migrations/00001_initial_schema.sql"
  - "apps/supabase/supabase/schema/000-enums.sql"
  - "apps/supabase/supabase/schema/011-validation-functions.sql"
  - "apps/supabase/supabase/schema/100-tenancy.sql"
  - "apps/supabase/supabase/schema/101-elections.sql"
  - "apps/supabase/supabase/schema/102-entities.sql"
  - "apps/supabase/supabase/schema/103-questions.sql"
  - "apps/supabase/supabase/schema/104-nominations.sql"
  - "apps/supabase/supabase/schema/105-answers.sql"
  - "apps/supabase/supabase/schema/106-app-settings.sql"
  - "apps/supabase/supabase/schema/107-feedback.sql"
  - "apps/supabase/supabase/schema/200-indexes.sql"
  - "apps/supabase/supabase/schema/300-auth-tables.sql"
  - "apps/supabase/supabase/schema/301-auth-functions.sql"
  - "apps/supabase/supabase/schema/302-rls.sql"
  - "apps/supabase/supabase/schema/303-column-grants.sql"
  - "apps/supabase/supabase/schema/400-storage.sql"
  - "apps/supabase/supabase/schema/500-external-id.sql"
  - "apps/supabase/supabase/schema/501-bulk-operations.sql"
  - "apps/supabase/supabase/schema/502-email-helpers.sql"
  - "apps/supabase/supabase/schema/503-entity-rpcs.sql"
  - "apps/supabase/supabase/schema/504-admin-rpcs.sql"
  - "apps/supabase/supabase/seed.sql"
  - "apps/supabase/supabase/tests/database/00-helpers.test.sql"
  - "apps/supabase/supabase/tests/database/01-tenant-isolation.test.sql"
  - "apps/supabase/supabase/tests/database/02-candidate-self-edit.test.sql"
  - "apps/supabase/supabase/tests/database/03-anon-read.test.sql"
  - "apps/supabase/supabase/tests/database/04-admin-crud.test.sql"
  - "apps/supabase/supabase/tests/database/05-organization-admin.test.sql"
  - "apps/supabase/supabase/tests/database/06-storage-rls.test.sql"
  - "apps/supabase/supabase/tests/database/07-rpc-security.test.sql"
  - "apps/supabase/supabase/tests/database/08-triggers.test.sql"
  - "apps/supabase/supabase/tests/database/09-column-restrictions.test.sql"
  - "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql"
  - "apps/supabase/supabase/tests/database/11-question-rpcs.test.sql"
  - "apps/supabase/supabase/tests/database/12-user-can.test.sql"
  - "apps/supabase/supabase/tests/database/14-grants-migration.test.sql"
  - "apps/supabase/supabase/tests/database/15-visibility-flags.test.sql"
  - "apps/supabase/supabase/tests/database/16-anon-visibility.test.sql"
  - "apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql"
  - "apps/supabase/supabase/tests/database/18-entity-policies.test.sql"
  - "apps/supabase/supabase/tests/database/19-entity-immutability.test.sql"
  - "apps/supabase/supabase/tests/database/20-storage-authority.test.sql"
  - "apps/supabase/supabase/tests/database/21-entity-organization.test.sql"
  - "apps/supabase/supabase/tests/database/22-content-policies.test.sql"
  - "apps/supabase/supabase/tests/database/23-nominations-write.test.sql"
  - "apps/supabase/supabase/tests/database/24-legacy-removal.test.sql"
  - "apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql"
  - "apps/supabase/supabase/tests/database/26-uniqueness-keys.test.sql"
  - "apps/supabase/supabase/tests/database/27-parent-nomination-queue.test.sql"
  - "apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql"
  - "apps/supabase/supabase/tests/database/32-level1-confirmation-flow.test.sql"
  - "package.json"
  - "packages/dev-seed/src/generators/CandidatesGenerator.ts"
  - "packages/dev-seed/src/generators/ElectionsGenerator.ts"
  - "packages/dev-seed/src/generators/FactionsGenerator.ts"
  - "packages/dev-seed/src/generators/NominationsGenerator.ts"
  - "packages/dev-seed/src/supabaseAdminClient.ts"
  - "packages/dev-seed/src/template/permittedKeys.ts"
  - "packages/dev-seed/src/templates/_helpers/buildMinimal.ts"
  - "packages/dev-seed/src/templates/default.ts"
  - "packages/dev-seed/src/templates/defaults/candidates-override.ts"
  - "packages/dev-seed/src/templates/e2e/base.ts"
  - "packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts"
  - "packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts"
  - "packages/dev-seed/tests/fixtures/negctl-questions-answers.ts"
  - "packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts"
  - "packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts"
  - "packages/dev-seed/tests/generators/CandidatesGenerator.test.ts"
  - "packages/dev-seed/tests/generators/FactionsGenerator.test.ts"
  - "packages/dev-seed/tests/generators/NominationsGenerator.test.ts"
  - "packages/dev-seed/tests/template/permittedKeys.test.ts"
  - "packages/dev-seed/tests/templates/default.test.ts"
  - "packages/supabase-types/RPC-NULLABILITY.md"
  - "packages/supabase-types/src/column-map.ts"
  - "packages/supabase-types/src/database.overrides.ts"
  - "packages/supabase-types/src/database.ts"
  - "scripts/assert-edge-env-defaults.mjs"
  - "scripts/assert-grant-permission-enum.mjs"
  - "scripts/assert-project-scoped-queries.mjs"
  - "scripts/assert-rpc-return-nullability.mjs"
  - "scripts/assert-schema-migration-parity.mjs"
  - "scripts/fixtures/grant-permission-enum/enums.ok.sql"
  - "scripts/fixtures/grant-permission-enum/enums.violations.sql"
  - "scripts/fixtures/grant-permission-enum/expected.violations"
  - "tests/scripts/e2e-run.sh"
  - "tests/tests/setup/admin/admin-access.teardown.ts"
  - "tests/tests/setup/admin/admin-auth.setup.ts"
  - "tests/tests/setup/candidate/bank-auth-journey.setup.ts"
  - "tests/tests/setup/candidate/bank-auth-journey.teardown.ts"
  - "tests/tests/setup/candidate/candidate-journey.setup.ts"
  - "tests/tests/specs/admin/admin-access.spec.ts"
  - "tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts"
  - "tests/tests/specs/candidate/candidate-bank-auth.spec.ts"
  - "tests/tests/utils/adminCredentials.ts"
  - "tests/tests/utils/bankAuthJourneyConstants.ts"
  - "tests/tests/utils/supabaseAdminClient.ts"
covered_digest: "v1:sha256:befc1547c6b705bc7ab7146126d4fb8dbc5dca79d7b79953dc0983eaf9d4959a"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 7/7
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 162: Permissions & Auth Model Refactor Verification Report

**Phase Goal:** Who may do what to which object is answered by one grants matrix and one set of predicates, rather than by scattered RLS policies that each re-derive the rule.
**Verified:** 2026-09-20
**Status:** passed
**Re-verification:** Yes — narrow pass against HEAD `77e70d62b`, superseding the prior `human_needed` report at `d7b105139`

## Re-verification Summary

**Scope check, performed first, as instructed.** `git diff --name-only d7b105139..HEAD -- . ':!.planning'` returns exactly two files:

- `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts`
- `apps/supabase/supabase/functions/send-email/flowConformance.test.ts`

`d7b105139` is the commit of the previous `162-VERIFICATION.md` itself ("docs(162): re-verify after gap closure (human_needed, 7/7) + scoped gap review"), so this range is exactly the delta this re-verification pass needs to account for. Per-commit file lists for the nine intervening fix commits (`0784e5f2d` CR-01 through `d34f7826b` WR-06) were also checked individually (`git log --name-only … -- . ':!.planning'`) and confirm the same two files, and no others, appear anywhere in the range outside `.planning`. **This confirms the "narrow" framing holds — no widening was required.** No schema file, RLS policy, Edge Function `index.ts`/`callerAuthority.ts`/`entityGrant.ts`, or frontend runtime source moved.

**What changed inside `.planning`:** `162-REVIEW.md` (a new scoped code review), `162-REVIEW-FIX.md` (rewritten to document this fix run — the file at `d7b105139` was a different, superseded review-fix and was preserved as `162-REVIEW-FIX-full-scope.md` per its own § *Residues and follow-ups* item 5), `162-FLOW-CONFORMANCE.md` (counts and control table updated for CR-03/WR-03's new assertions), `162-UAT.md` (new — records the WR-04 ruling), plus routine state/roadmap bookkeeping. None of these are source; they are exactly the artifacts a scoped code-review-and-fix round produces.

**Criterion 7 re-derived, not carried.** Both changed test files were read in full (305 and 170 lines respectively) and both were re-run directly in this pass:

```
$ npx vitest run supabase/functions/invite-candidate/flowConformance.test.ts supabase/functions/send-email/flowConformance.test.ts
 ✓ supabase/functions/send-email/flowConformance.test.ts (16 tests)
 ✓ supabase/functions/invite-candidate/flowConformance.test.ts (19 tests)
 Test Files  2 passed (2)
      Tests  35 passed (35)
```

and, to reconcile `162-FLOW-CONFORMANCE.md`'s own stated four-file total:

```
$ npx vitest run <the same two> identity-callback/flowConformance.test.ts invite-candidate/callerAuthority.test.ts
 Test Files  4 passed (4)
      Tests  58 passed (58)   # 19 + 16 + 13 + 10, matching the document's header exactly
```

Reading both diffs against `162-REVIEW-FIX.md`'s own account (CR-01..CR-03, WR-01..WR-06) confirms every change is a **strengthening**, not a substitution: the 403 refusal is now matched as one contiguous returned block rather than five ordered `indexOf` hits (CR-01); the whole gate-assignment statement is bound, with the assignment count pinned at exactly one, closing the `|| body.debugBypass` bypass hole the prefix-only match missed (CR-02); a call-site test was *added* for `invite-candidate`'s own `writeEntityGrant` call, where none existed before (CR-03); the three retired-claim-key assertions moved from one access-form to the bare key (WR-01); the permission-literal guards now run over a comment-stripped `CODE_ONLY` view so a comment can no longer satisfy them (WR-02); `GRANT_SCOPES`/`GRANT_ROLES` are now derived from `000-enums.sql` at run time instead of hand-transcribed arrays (WR-03); the RPC-binding test now asserts the three argument *values*, not just their key set and an "any of four" scope check (WR-04); the vocabulary-parse guard is now a `beforeAll` that aborts the describe on failure, making "before" true rather than aspirational (WR-05); and the sender-binding assertion now pins the positive call shape (`from: senderAddress,`) with an exact count of one, rather than a single historical negative spelling (WR-06). No assertion was removed or weakened; every new assertion is a superset of what was checked at `d7b105139`. Criterion 7 is confirmed **still ✓ VERIFIED, made stronger, no gap.**

**Criteria 1–6 spot-confirmed unchanged, not re-derived.** Each depends on schema (`301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`, `011-validation-functions.sql`, `400-storage.sql`, `503-entity-rpcs.sql`) or migration source, none of which appears in the two-file diff above. No regression is possible there and the prior pass's findings stand as recorded.

**The WR-04 human item is now ruled — the reason the prior status was `human_needed`.** `162-UAT.md` records an operator pass on 2026-09-20: the current app-entry routing stands as-is, with no code change following. This was verified against source, not taken on the UAT's word: `apps/frontend/src/lib/auth/roles.ts` (`ADMIN_GRANTS` holds exactly the three admin rows — `global`, `account`, `project` — and no `entity` row, so a ProjectEditor's `(project, editor)` grant is not a member) and `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (`_getBasicUserData` checks `CANDIDATE_GRANTS` before `ADMIN_GRANTS`, so a dual-grant identity routes to the Candidate App first) both match the ruling verbatim, and neither file appears in the `d7b105139..HEAD` diff — confirming "no code change follows" is true of the tree, not just asserted. With this item ruled, no human-verification item remains open.

**Score:** 7/7 truths verified, 0 present-but-behavior-unverified. **Status is now `passed`** — the sole blocker keeping the prior pass at `human_needed` (an open, un-ruled product decision) is resolved, and this pass found no new gap.

## Goal Achievement

### Observable Truths

| # | Truth (amended criterion) | Status | Evidence |
|---|---------|------------|-------------|
| 1 | `grants` table keyed `user_id × scope × target_id × role`, 2 role levels (`admin`/`editor`), admin does anything to the object and its descendants | ✓ VERIFIED | Spot-confirmed unchanged — `303-column-grants.sql` outside the `d7b105139..HEAD` diff; carried from prior pass, no regression possible |
| 2 | Read authority separated from write authority, asked of one predicate (`user_can`), read/write collapse ended permanently via lint check 9001 | ✓ VERIFIED | Spot-confirmed unchanged — `301-auth-functions.sql`, `302-rls.sql`, `lint-schema.mjs` outside the diff |
| 3 | `is_child_nominee`/`nomination.read` hop: parent reads child's nomination and basic data, never that child's answers | ✓ VERIFIED | Spot-confirmed unchanged — `302-rls.sql`, `503-entity-rpcs.sql` outside the diff |
| 4 | Per-project settings for candidate self-edit / nomination changes, each surviving branch tested | ✓ VERIFIED | Spot-confirmed unchanged — `011-validation-functions.sql`, `501-bulk-operations.sql` outside the diff |
| 5 | Read grants: public row conjunction; authenticated reads project structure; entity grantee reads own entity + child's basic data only | ✓ VERIFIED | Spot-confirmed unchanged — same files as criterion 3 |
| 6 | All fifteen storage policies route through one mechanism, denial parity per verb | ✓ VERIFIED | Spot-confirmed unchanged — `400-storage.sql` outside the diff |
| 7 | Level-1 permissions defined; candidate registration and nomination confirmation flows checked against the matrix rather than assumed compatible with it | ✓ VERIFIED | **Re-derived this pass.** Both changed test files read in full; re-run directly (`35 passed (35)` for the two changed files, `58 passed (58)` for the four-file conformance set — matches `162-FLOW-CONFORMANCE.md`'s stated header exactly). Every CR/WR fix (CR-01..CR-03, WR-01..WR-06) confirmed a strengthening of an existing assertion or the addition of a missing one — none is a substitution or weakening. No production source (`index.ts`, `callerAuthority.ts`, `entityGrant.ts`) is in the diff, so the gate behavior these tests describe is unchanged from the prior `passed`-worthy derivation; only the tests' ability to catch a regression improved. |

**Score:** 7/7 truths verified. 0 present-but-behavior-unverified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `invite-candidate/flowConformance.test.ts` | Source-level conformance gate over the invite flow's authority decisions | ✓ VERIFIED | 305 lines, read in full; 19 tests, all pass standalone |
| `send-email/flowConformance.test.ts` | Same, for bulk send | ✓ VERIFIED | 170 lines, read in full; 16 tests, all pass standalone |
| `162-FLOW-CONFORMANCE.md` | Registration/confirmation flows checked against matrix, describing the CURRENT gate, counts reconciled | ✓ VERIFIED | Header states 58 tests across 4 files (19+16+13+10), independently reconciled by direct vitest run; "56 until the 162-REVIEW fix run added invite-candidate's missing call-site assertion (CR-03) and its derived grant-vocabulary guard (WR-03)" — confirmed consistent with the fix report |
| `162-UAT.md` | Records the WR-04 operator ruling | ✓ VERIFIED | `status: complete`, 1/1 passed, 0 issues; ruling text matches source at `roles.ts`/`supabaseDataWriter.ts` verbatim |
| `apps/frontend/src/lib/auth/roles.ts` | `ADMIN_GRANTS` unchanged, matching the WR-04 ruling | ✓ VERIFIED | Three admin rows only (`global`, `account`, `project`); no `entity` row; not in the `d7b105139..HEAD` diff |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | `_getBasicUserData` candidate-first routing unchanged | ✓ VERIFIED | `CANDIDATE_GRANTS` checked before `ADMIN_GRANTS`; not in the diff |
| `162-REVIEW-FIX.md` | Documents the CR/WR fix run: 3 files touched, no production source | ✓ VERIFIED | States "Files modified — three, and no production source" and `git diff --stat bad8fa857..HEAD` is exactly those three; cross-checked against the actual `d7b105139..HEAD` diff (the two test files plus the doc itself) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `invite-candidate/flowConformance.test.ts` | `invite-candidate/index.ts`, `callerAuthority.ts` | reads source as text, asserts call shapes | ✓ WIRED | Test passes; re-run this pass |
| `send-email/flowConformance.test.ts` | `send-email/index.ts` | reads source as text, asserts call shapes | ✓ WIRED | Test passes; re-run this pass |
| WR-04 ruling (`162-UAT.md`) | `roles.ts` / `supabaseDataWriter.ts` | ruling text names both files' current behavior | ✓ WIRED | Both files' cited line ranges (`roles.ts:53-57`, `supabaseDataWriter.ts:181-186`) confirmed by direct read to match the ruling's description |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| The two changed flow-conformance files pass, standalone | `npx vitest run` on the two named files, from `apps/supabase` | `2 passed (2)`, `35 passed (35)` — 19 + 16 | ✓ PASS |
| Four-file conformance total reconciles to `162-FLOW-CONFORMANCE.md`'s header | `npx vitest run` on all four named files | `4 passed (4)`, `58 passed (58)` — 19 + 16 + 13 + 10 | ✓ PASS |
| `ADMIN_GRANTS` matches the WR-04 ruling (no `entity` row) | `sed -n` on `roles.ts` | three rows: `global`/`admin`, `account`/`admin`, `project`/`admin` | ✓ PASS |
| `_getBasicUserData` checks candidate grants before admin grants | `sed -n` on `supabaseDataWriter.ts` | `CANDIDATE_GRANTS` branch precedes `ADMIN_GRANTS` branch | ✓ PASS |
| Non-`.planning` diff since `d7b105139` is exactly two files | `git diff --name-only d7b105139..HEAD -- . ':!.planning'` | 2 files, both test files, matches the task's own stated premise | ✓ PASS |
| No debt markers in the two changed files | `grep -nE "TBD\|FIXME\|XXX"` over both | no matches | ✓ PASS |

### E2E Carry-Over Assessment (CLAUDE.md E2E Hard Rule)

The prior pass's carry-over reasoning is re-checked, not merely repeated, and it holds — more strongly than before. The two files changed in this range are unit-level (vitest) test files under `apps/supabase/supabase/functions/`; they are not `.svelte` files, not routes, not adapters, and not Edge Function `index.ts`/`callerAuthority.ts`/`entityGrant.ts` source. No Playwright spec imports or loads either file — the E2E suite drives the *served application and Edge Functions*, not this repository's own vitest unit-test files, so a change confined to those files cannot alter any code path the suite exercises. `git diff --quiet d7b105139..HEAD -- apps/supabase/supabase/functions/*/index.ts apps/supabase/supabase/functions/*/callerAuthority.ts apps/supabase/supabase/functions/*/entityGrant.ts apps/frontend/src` (checked) confirms byte-identity of every runtime surface the E2E suite could touch. The last recorded full E2E run remains valid evidence; re-running it here would exercise zero new code paths, consistent with the CLAUDE.md hard rule being about no failing test existing, not about re-running on every commit regardless of what changed. No E2E run was executed in this pass, per the task's explicit constraint.

### Anti-Patterns Found

No `TBD`/`FIXME`/`XXX` debt markers found in the two files this round changed (`grep -nE "TBD|FIXME|XXX"` over both — no matches). No stub patterns, no hardcoded empty returns, no console.log-only implementations — both files are pure vitest assertion suites with no runtime code path of their own.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | none found | — | — |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|--------------|--------|----------|
| PRESHIP-02 | all 19 plans (162-01 through 162-19, 02b, 07b) plus gap-closure plans 162-18, 162-19, and the CR-01..CR-03/WR-01..WR-06 fix commits | Grants matrix + one-predicate authority model, blocking ship | Implemented, box deliberately UNTICKED | `.planning/REQUIREMENTS.md` line 168 continues to record the box as unticked pending operator sign-off ("Implemented — 19 plans across 7 waves; the box stays unticked and the tick is the operator's"). This verification leaves it untouched, per instruction — both prior passes recorded the same and this pass does not tick it. No requirement ID other than PRESHIP-02 maps to Phase 162 in REQUIREMENTS.md; no orphaned requirement found. |

### Human Verification Required

None. The sole open item from the prior pass — the WR-04 product-decision ruling — is now recorded in `162-UAT.md` (operator pass, 2026-09-20) and independently confirmed against source (`roles.ts`, `supabaseDataWriter.ts`) in this pass.

### Gaps Summary

**No gaps.** This was a narrow re-verification: the diff since the previous `162-VERIFICATION.md` (`d7b105139..HEAD`) touches exactly two test files, both of which the code-review fix round (CR-01..CR-03, WR-01..WR-06) strengthened rather than altered in kind. Criterion 7 was independently re-derived against the current tree (both files read in full, both re-run directly, the four-file total reconciled) and remains ✓ VERIFIED — stronger than the prior pass's version, not merely carried forward. Criteria 1–6 are confirmed untouched by the diff and are spot-confirmed rather than re-derived. The one item that kept the previous pass at `human_needed` — the WR-04 multi-role-routing product decision — is now ruled at UAT (2026-09-20), and both files the ruling names were independently confirmed unchanged and consistent with it. With that item resolved and no new gap found, status moves from `human_needed` to `passed`.

`.planning/REQUIREMENTS.md` continues to record PRESHIP-02 as deliberately unticked pending the operator's own review — this verification does not tick it, per instruction from both prior passes.

**No deferred items.**

---

_Verified: 2026-09-20_
_Verifier: Claude (gsd-verifier)_
