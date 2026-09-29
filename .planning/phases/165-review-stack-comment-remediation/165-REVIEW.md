---
phase: 165-review-stack-comment-remediation
reviewed: 2026-09-28T23:30:00Z
depth: standard
files_reviewed: 194
files_reviewed_list:
  - .github/workflows/main.yaml
  - apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts
  - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
  - apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts
  - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
  - apps/supabase/supabase/functions/invite-candidate/index.ts
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/schema/101-elections.sql
  - apps/supabase/supabase/schema/102-entities.sql
  - apps/supabase/supabase/schema/103-questions.sql
  - apps/supabase/supabase/schema/104-nominations.sql
  - apps/supabase/supabase/schema/107-feedback.sql
  - apps/supabase/supabase/schema/300-auth-tables.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/schema/400-storage.sql
  - apps/supabase/supabase/schema/502-email-helpers.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
  - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
  - apps/supabase/supabase/tests/database/12-user-can.test.sql
  - apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql
  - apps/supabase/supabase/tests/database/18-entity-policies.test.sql
  - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
  - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
  - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
  - apps/supabase/supabase/tests/database/22-content-policies.test.sql
  - apps/supabase/supabase/tests/database/24-legacy-removal.test.sql
  - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
  - apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql
  - apps/supabase/supabase/tests/database/29-authenticated-disjunct-order.test.sql
  - apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql
  - apps/supabase/supabase/tests/database/34-feedback-project-guard.test.sql
  - packages/dev-seed/src/assertKnownRowProps.ts
  - packages/dev-seed/src/generators/AlliancesGenerator.ts
  - packages/dev-seed/src/generators/CandidatesGenerator.ts
  - packages/dev-seed/src/generators/ConstituenciesGenerator.ts
  - packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts
  - packages/dev-seed/src/generators/ElectionsGenerator.ts
  - packages/dev-seed/src/generators/FactionsGenerator.ts
  - packages/dev-seed/src/generators/OrganizationsGenerator.ts
  - packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts
  - packages/dev-seed/src/generators/QuestionsGenerator.ts
  - packages/dev-seed/src/template/permittedKeys.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/defaults/alliances-override.ts
  - packages/dev-seed/src/templates/defaults/candidates-override.ts
  - packages/dev-seed/src/templates/defaults/questions-override.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts
  - packages/dev-seed/src/templates/e2e/perm/shared.ts
  - packages/dev-seed/tests/assertKnownRowProps.test.ts
  - packages/dev-seed/tests/edgeFunctionEnvGate.test.ts
  - packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts
  - packages/dev-seed/tests/fixtures/negctl-questions-answers.ts
  - packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts
  - packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts
  - packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts
  - packages/dev-seed/tests/locales.test.ts
  - packages/dev-seed/tests/templates/default.test.ts
  - packages/supabase-types/src/column-map.ts
  - scripts/assert-edge-function-env.mjs
  - scripts/assert-project-scoped-queries.mjs
  - apps/frontend/src/app.d.ts
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/bySortOrderThenId.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/bySortOrderThenId.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/parseFailureMessages.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/parseStoredCustomization.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/parseStoredCustomization.ts
  - apps/frontend/src/lib/api/dataProvider.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts
  - apps/frontend/src/lib/api/utils/auth/oidcFailure.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
  - apps/frontend/src/lib/api/utils/auth/providers/index.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
  - apps/frontend/src/lib/api/utils/auth/providers/types.ts
  - apps/frontend/src/lib/auth/roles.ts
  - apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte
  - apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.type.ts
  - apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte
  - apps/frontend/src/lib/components/alert/Alert.svelte
  - apps/frontend/src/lib/components/button/Button.svelte
  - apps/frontend/src/lib/components/expander/Expander.svelte
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/lib/components/input/InputGroup.svelte
  - apps/frontend/src/lib/components/input/parts/ImagePart.svelte
  - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
  - apps/frontend/src/lib/components/questions/NumberScaleInput.svelte
  - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
  - apps/frontend/src/lib/components/questions/QuestionChoices.svelte.test.ts
  - apps/frontend/src/lib/components/questions/QuestionOpenAnswer.svelte
  - apps/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte
  - apps/frontend/src/lib/components/toggle/Toggle.svelte
  - apps/frontend/src/lib/contexts/utils/sameRefs.test.ts
  - apps/frontend/src/lib/contexts/utils/sameRefs.ts
  - apps/frontend/src/lib/contexts/voter/filters/filterRelevance.test.ts
  - apps/frontend/src/lib/contexts/voter/matchState.svelte.test.ts
  - apps/frontend/src/lib/contexts/voter/matchState.svelte.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
  - apps/frontend/src/lib/dynamic-components/entityCard/tests/hoverShadedRule.test.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte
  - apps/frontend/src/lib/layouts/main/Banner.svelte
  - apps/frontend/src/lib/layouts/main/Header.svelte
  - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
  - apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.test.ts
  - apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts
  - apps/frontend/src/lib/supabase/anon.ts
  - apps/frontend/src/lib/supabase/browser.ts
  - apps/frontend/src/lib/supabase/job.ts
  - apps/frontend/src/lib/supabase/safeGetSession.test.ts
  - apps/frontend/src/lib/supabase/safeGetSession.ts
  - apps/frontend/src/lib/supabase/server.ts
  - apps/frontend/src/lib/supabase/universal.ts
  - apps/frontend/src/lib/utils/components.test.ts
  - apps/frontend/src/lib/utils/components.ts
  - apps/frontend/src/lib/utils/constants.ts
  - apps/frontend/src/lib/utils/focusNavigationTarget.test.ts
  - apps/frontend/src/lib/utils/focusNavigationTarget.ts
  - apps/frontend/src/lib/utils/logLevel.test.ts
  - apps/frontend/src/lib/utils/password-validation/passwordValidation.test.ts
  - apps/frontend/src/lib/utils/password-validation/passwordValidation.ts
  - apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts
  - apps/frontend/src/routes/(voters)/privacy/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
  - apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte
  - apps/frontend/src/routes/candidate/preregister/+page.svelte
  - apps/frontend/vite.projectIdEnv.test.ts
  - apps/frontend/vite.projectIdEnv.ts
  - apps/docs/src/lib/components/Header.svelte
  - apps/docs/src/lib/components/NavigationItem.svelte
  - apps/docs/src/lib/components/PeerNavigation.svelte
  - apps/docs/src/lib/components/TableOfContents.svelte
  - apps/docs/src/lib/layouts/MdLayout.svelte
  - packages/app-shared/src/data/getLocalized.test.ts
  - packages/app-shared/src/data/getLocalized.ts
  - packages/app-shared/src/data/schemas/sendEmailResult.schema.test.ts
  - packages/app-shared/src/data/schemas/sendEmailResult.schema.ts
  - packages/app-shared/src/index.ts
  - packages/argument-condensation/src/core/condensation/condenser.ts
  - packages/argument-condensation/tests/condensation/condenseQuestions.test.ts
  - packages/question-info/tests/questionTypes.test.ts
  - tests/scripts/determinism-batch.sh
  - tests/scripts/visual-container.sh
  - tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts
  - tests/tests/fixtures/voter/entityDetails.fixture.ts
  - tests/tests/fixtures/voter/resultsPage.fixture.ts
  - tests/tests/fixtures/voter/voter-journey.fixture.ts
  - tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
  - tests/tests/helpers/timeouts.ts
  - tests/tests/setup/perm/perm-closed-project.teardown.ts
  - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts
  - tests/tests/specs/perm/perm-org-matching.spec.ts
  - tests/tests/specs/voter/cold-entry-dataroot.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/utils/missingNominations.ts
  - tests/tests/utils/testIds.ts
  - tests/tests/utils/voterNavigation.ts
findings:
  critical: 0
  warning: 15
  info: 25
  total: 40
status: issues_found
---
# Phase 165: Code Review (merged)

Three `gsd-code-reviewer` passes at standard depth, run in parallel, over the 194 files whose code changed on `ship/v2.15-13-review-fixes` relative to `ship/v2.15-12-planning`. A further 57 changed files are comment-only (proven by `code-identity.mjs`) and were not reviewed. Finding ids carry their part prefix (A-, B- or C-).

| Part | Scope | Files | Critical | Warning | Info |
|---|---|---|---|---|---|
| A | database, Edge Functions, scripts, CI, dev-seed | 79 | 0 | 4 | 10 |
| B | frontend app | 84 | 0 | 4 | 8 |
| C | shared packages, docs site, E2E harness | 31 | 0 | 7 | 7 |
| **Total** | | **194** | **0** | **15** | **25** |

# Part A: database, Edge Functions, scripts, CI, dev-seed

Source: `165-REVIEW-partA.md`


# Phase 165: Code Review Report (Part A: backend, CI, scripts, dev-seed, supabase-types)

**Reviewed:** 2026-09-28T20:43:06Z
**Depth:** standard
**Files Reviewed:** 79
**Status:** issues_found

## [A] Summary

Scope: the diff `ship/v2.15-12-planning...HEAD` for area A. That covers the typed-authority rework (`user_can` with `p_target_type`, the typed `private.entity_project_id` and `private.is_child_nominee`, and typed `get_entity_basic_data` and `upsert_answers`), the `enforce_feedback_project` trigger, the `is_generated` removal and the candidates column reorder, the identity-callback `*-ftn` rename with `resolveProviderConfig`, the CI workflow changes, the two guard scripts, the dev-seed cleanup and the two new pgTAP suites.

**Typed authority:** traced and correct. Every one of the 21 entity-scope `user_can` call sites passes a type:
- 16 in `302-rls.sql`
- 2 in `enforce_entity_immutability`
- 1 in `storage_path_can`
- 1 in `get_entity_basic_data`
- 1 in `caller_nominated_in_contest`

Details:
- Each type is the table's own type or the nominations row's generated `entity_type`.
- A NULL type denies at entity scope (301:470).
- `entity_project_id` returns NULL for a NULL type, and every call site treats NULL as a denial.
- Every SECURITY DEFINER function in scope pins `search_path = ''`.
- `left(TG_TABLE_NAME, -1)::public.entity_type` maps all four entity tables correctly and raises for any other table.
- `cleanup_grants_on_delete` and `resolve_email_variables` are also typed.
- No remaining type-blind hop was found. The only untyped id lookups left are the `n.candidate_id = p OR n.organization_id = p ...` disjunctions in `entity_has_confirmed_nomination` and `nomination_exists_in_contest`. Both are typed by an `n.entity_type = p_entity_type` conjunct, but no test pins that conjunct (WR-02).

**`upsert_answers`:** writes only the named table, and it raises on a NULL, faction or alliance type.

**`enforce_feedback_project`:**
- Correctly scoped to INSERT. An UPDATE guard would also fire on the foreign key's own `ON DELETE SET NULL` update, which is itself an UPDATE, and so break orphaning.
- 34 exercises that interaction.
- The guard has no bypass path for an API role.

**`is_generated` and column order:**
- No `is_generated` remains in the schema, the migration, supabase-types, `COLUMN_MAP` or any dev-seed template.
- `TABLE_COLUMNS` is type-checked against the generated types in both directions.
- `_bulk_upsert_record` builds its column list from JSON keys, so column order is irrelevant to bulk import.

**Guard scripts:**
- `assert-project-scoped-queries.mjs` passes locally (exit 0, 16 of 16 adapter sources guarded).
- The `assert-edge-function-env` family fix is real: `{ slash, blockC, template }` matched no key the classifier reads, so nothing was blanked. The new test would catch a revert.

No BLOCKER-level defect was proven. The warnings are gate and test weaknesses:
- a CI guard silently lost when the E2E run moved to the wrapper;
- two pgTAP assertions that cannot see the regression they were written for;
- a new, unmeasured load source in the CI E2E run.

## [A] Warnings

### A-WR-01: CI E2E runs lost Playwright's `forbidOnly` guard, because the wrapper unsets `CI`

**File:** `.github/workflows/main.yaml:568`, `.github/workflows/main.yaml:662` (with `tests/scripts/e2e-run.sh:193` and `tests/playwright.config.ts:1233`)

**Issue:** Both E2E jobs now run `tests/scripts/e2e-run.sh`, and the wrapper runs `unset CI` before it invokes Playwright. The config reads `forbidOnly: !!process.env.CI`, so the flag is now `false` in CI.

Before this change, `yarn test:e2e` ran with `CI=true`, and a committed `test.only` / `test.describe.only` failed the run. Now such a run executes only the focused test and reports green, which is the exact gate bypass the cardinal E2E rule forbids.

The per-test timeout was already re-keyed to `GITHUB_ACTIONS` for this same reason (`tests/tests/helpers/timeouts.ts:19`), but `forbidOnly` was missed.

The `playwright/no-focused-test` ESLint rule in `yarn lint:check` still catches the common case. It is a separate job and can be bypassed with an eslint-disable, so this is lost defence in depth rather than an open hole.

**Fix:**
```ts
// tests/playwright.config.ts
const ON_CI = !!process.env.CI || process.env.GITHUB_ACTIONS === 'true';
// ...
forbidOnly: ON_CI,
```
Keep `retries`/`workers` on `process.env.CI` as they are, since the wrapper unsets it on purpose for those two.

### A-WR-02: 33-entity-type-collision never builds a same-project collision, so the `entity_type` conjunct in the two visibility/contest helpers is unpinned

**File:** `apps/supabase/supabase/schema/301-auth-functions.sql:354` and `:634`; `apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql:58-101`

**Issue:** `entity_has_confirmed_nomination` and `nomination_exists_in_contest` match the id against all four FK columns with `OR`. Only `n.entity_type = p_entity_type` makes them type-correct.

Both collisions in 33 put the colliding candidate in project B. `entity_has_confirmed_nomination` also filters `n.project_id = p_project_id`, so with the conjunct deleted, every assertion in 33 (and in 16 and 23) still passes.

The live hazard is a same-project collision. A project admin chooses `id` on insert, as 33 §1 itself proves, so project A can hold a candidate that shares `org_a`'s id. If the conjunct regresses, `org_a`'s confirmed nomination publishes that candidate through `anon_select_candidates` with no nomination of its own. It would also make guard 3 of `entity_insert_parent_nominations` refuse on another type's nomination.

The file's header claims to keep "the two entities apart" across every hop, but these two hops are not exercised. `storage_path_can` and the nomination policies are not exercised under the collision either.

**Fix:** Add a same-project case to 33:
1. As postgres, insert a confirmed, ToU-accepted candidate in `project_a` with `id = test_id('org_a')` and no nomination.
2. Assert `private.entity_has_confirmed_nomination('candidate', test_id('org_a'), test_id('project_a'))` is `false`, paired with `('organization', ...)` being `true`.
3. Assert, as anon, that `SELECT count(*) FROM candidates WHERE id = test_id('org_a')` is 0.
4. Add a `nomination_exists_in_contest('candidate', test_id('org_a'), <org_a's contest>)` = false pair.

### A-WR-03: 18-entity-policies SELECT-family normaliser maps all four type literals to one placeholder, so a policy naming another table's type still passes

**File:** `apps/supabase/supabase/tests/database/18-entity-policies.test.sql:1311-1341`

**Issue:** The SELECT-family assertion replaces `'candidate'`, `'organization'`, `'faction'` and `'alliance'` with the same `ENT` token, whichever table the policy is on. Suppose `authenticated_select_candidates` passed `'organization'::public.entity_type` to `user_can` or to `entity_has_confirmed_nomination`, which is the exact type-confusion this change set exists to prevent. The four expressions would still normalise to one string, and the assertion would stay green.

The self-update family in the same file already does this correctly: it replaces only `left(tablename, -1)` with `OWN_TYPE` (lines 1473-1481), and its comment states that a foreign type must stay a distinct expression. The SELECT family needs the same treatment.

**Fix:** Replace only the policy's own type:
```sql
replace(
  replace(
    replace(COALESCE(qual, '-') || '~' || COALESCE(with_check, '-'),
            ' AND (terms_of_use_accepted IS NOT NULL) AND (terms_of_use_accepted < now())', ''),
    tablename || '.', 'TBL.'),
  '''' || left(tablename, -1) || '''::entity_type', '''OWN_TYPE''::entity_type'
) AS normalised
```
Add a companion assertion that no entity SELECT policy contains another table's type literal.

### A-WR-04: CI E2E now runs the whole-monorepo package watcher alongside the dev server (UNCONFIRMED impact)

**File:** `.github/workflows/main.yaml:568`, `.github/workflows/main.yaml:662` (via `tests/scripts/e2e-run.sh:307` and `package.json:9-10`)

**Issue:** The removed step started only `yarn workspace @openvaa/frontend dev`. The wrapper runs root `yarn dev`, which is:
1. `yarn db:start`
2. `yarn dev:clean`
3. `concurrently --kill-others-on-fail "turbo watch build --filter='./packages/*'" "vite dev"`

So every CI E2E run now also carries `turbo watch` over every package, on the 4-CPU runner, for the whole suite. Two effects follow:
- **Extra load.** It adds CPU contention to the runner whose timing failures D-14/D-15/D-16 addressed by raising budgets.
- **Mid-run failure modes.** A watcher rebuild or cache restore rewrites package `dist/` files that Vite resolves through `preserveSymlinks`, which can cause mid-run reloads (compare the project memory note on Vite HMR staleness). And `--kill-others-on-fail` kills the dev server if the watcher exits non-zero, which surfaces as a wall of unrelated failures.

Nothing in the CI evidence isolates this. The claim is unconfirmed, but its cost has not been measured either.

**Fix:** Give the wrapper a mode that starts only the frontend dev server, and use it in CI. The packages are already built by the preceding `yarn build` step, so nothing needs watching. For example, `E2E_DEV_CMD="yarn workspace @openvaa/frontend dev"` in the spawn line, defaulted to `yarn dev` locally. Alternatively, record a before/after CI wall-time comparison as evidence that the watcher costs nothing.

## [A] Info

### A-IN-01: The comments overstate the trigger's reach: a privileged UPDATE can also null `project_id`

**File:** `apps/supabase/supabase/schema/107-feedback.sql:10`, `:109`

**Issue:** "A NULL project arises only through ON DELETE SET NULL" is true for the API roles, which have no feedback UPDATE policy. It is false for `service_role` and the owner, whose `UPDATE feedback SET project_id = NULL` the INSERT-only trigger does not see. The INSERT-only scope is correct, because a BEFORE UPDATE guard would also fire on the RI action's UPDATE. Only the wording is wrong.

**Fix:** "...so for the API roles a NULL project arises only through ON DELETE SET NULL; the service role and owner can still write one by UPDATE."

### A-IN-02: Key masking is inconsistent across jobs and largely cosmetic

**File:** `.github/workflows/main.yaml:404-416` vs `:540-558`, `:639-657`

**Issue:** The two E2E jobs `::add-mask::` the anon and service-role keys. `dev-seed-integration` exports the same values to `$GITHUB_ENV` without masking. These are the CLI's deterministic local-stack keys, so nothing secret leaks. Still, the comments ("never echoed") imply a guarantee that one job does not keep.

**Fix:** Mask in `dev-seed-integration` too, or state once that the values are the public local demo keys and drop the masking.

### A-IN-03: The duplicated key-writing step (16 identical lines in two jobs)

**File:** `.github/workflows/main.yaml:540-558`, `:639-657`

**Issue:** The script is copied byte-for-byte into both jobs. A fix to one, such as adding a new key or changing the placeholder test, will drift from the other.

**Fix:** Move it to a composite action or to `tests/scripts/ci-write-local-keys.sh` and call it from both jobs.

### A-IN-04: The `setup-cli` version is hard-coded six times, with nothing tying it to the `supabase` catalog version

**File:** `.github/workflows/main.yaml:196, 247, 362, 458, 510, 609`

**Issue:** D-16 pinned CI to the local CLI version, 2.83.0, which currently matches `node_modules/supabase`. A catalog bump updates local runs but not CI, which reintroduces the local/CI divergence the pin exists to remove. `supabase-types-drift` then compares output from two CLIs: the pinned one started the stack, and the workspace one generated the types.

**Fix:** Add an assertion, for example in `packages/dev-seed/tests/rpcNullabilityGate.test.ts`, that every `supabase/setup-cli` `version:` in the workflow equals the resolved `supabase` catalog version.

### A-IN-05: The Paraglide compile flags duplicate `vite.config.ts` by hand

**File:** `.github/workflows/main.yaml:384-386`

**Issue:** `--project ./project.inlang --outdir ./src/lib/paraglide --strategy url cookie baseLocale` is a transcription of `apps/frontend/vite.config.ts:21-25`. If the strategy changes in Vite, the CI-compiled output silently differs from what the app ships, and the gate measures the wrong artefact.

**Fix:** Expose the options from one module that both `vite.config.ts` and a small `paraglide:compile` script import, and call that script from CI.

### A-IN-06: A planning requirement id survives in a changed file

**File:** `.github/workflows/main.yaml:421`

**Issue:** The step name "Run dev-seed tests (incl. the NF-01 operation budget)" carries `NF-01`, a planning requirement id. D-04 applies the hygiene rules to every changed file, and this file changed.

**Fix:** Rename the step to "Run dev-seed tests (incl. the operation budget)".

### A-IN-07: The identity-callback 500 echoes the configured provider keyword to an unauthenticated caller

**File:** `apps/supabase/supabase/functions/identity-callback/index.ts:160`

**Issue:** The endpoint is `--no-verify-jwt`. The outer handler deliberately returns a fixed literal, so that nothing about the deployment's configuration reaches an unauthenticated caller (index.ts:382). The unknown-provider arm returns `Unknown identity provider type: ${providerType}`, which is the configured value itself. After the `*-ftn` rename, every deployment still configured with `signicat` or `idura` hits this arm on every login. The disclosure is low-value (a provider keyword), but it is inconsistent with the stated posture.

**Fix:** Log the value with `console.error` and return a fixed message such as `{ error: 'Identity provider is not configured' }`.

### A-IN-08: `PROVIDER_CONFIGS` is typed `Record<string, ...>`, so the keyword set has no type

**File:** `apps/supabase/supabase/functions/identity-callback/claimConfig.ts:36`

**Issue:** `PROVIDER_CONFIGS['signicat']` still type-checks as a `ProviderClaimConfig`. A stale keyword in code is therefore invisible to the compiler, and only `resolveProviderConfig` protects the runtime.

**Fix:**
```ts
export type ProviderKeyword = 'signicat-ftn' | 'idura-ftn';
export const PROVIDER_CONFIGS = { ... } as const satisfies Record<ProviderKeyword, ProviderClaimConfig>;
```

### A-IN-09: The optional `p_target_type` makes an untyped entity-scope RPC call compile

**File:** `apps/supabase/supabase/schema/301-auth-functions.sql:449` (surfaced as `p_target_type?` in `packages/supabase-types/src/database.ts`)

**Issue:** `DEFAULT NULL` keeps the project-scope callers working with three arguments. The cost is that a future TypeScript caller asking `p_scope: 'entity'` without a type compiles, and it is silently denied at runtime. That fails closed, so it is safe, but it is hard to diagnose. No current TypeScript caller asks at entity scope.

**Fix:** Add a typed helper next to `callerMayOnProject`, such as `callerMayOnEntity(type, id, permission)`, that makes the type mandatory, and route every future entity-scope RPC through it.

### A-IN-10: The skill reference is stale on file numbers and on two signatures

**File:** `.claude/skills/database/schema-reference.md:245-263`

**Issue:** This file changed in this diff and is in the required reading, so its errors mislead reviewers.
- The "file" column cites `012`, `014`, `016` and `017` for functions that live in `301-`, `400-`, `501-` and `502-*.sql`.
- It lists `grant_role_permissions(grant_role_type, grant_scope_type)`. The actual signature is `(grant_scope_type, grant_role_type, entity_type)`.
- It lists `resolve_email_variables(uuid[], text, text)`. The actual signature is `(uuid, uuid[], text, text)`.
- `entity_has_confirmed_nomination` and the other hops appear without their `private.` schema.

**Fix:** Correct the four points above.

---

_Reviewed: 2026-09-28T20:43:06Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

# Part B: frontend app

Source: `165-REVIEW-partB.md`


# Phase 165: Code Review Report (Part B: apps/frontend)

**Reviewed:** 2026-09-28T20:42:55Z
**Depth:** standard
**Files Reviewed:** 84
**Status:** issues_found

## [B] Summary

Scope: the 84 `apps/frontend` files changed between `ship/v2.15-12-planning` and `HEAD`, read against `git diff ship/v2.15-12-planning...HEAD`. The vitest suites for every changed test file were run: 40 files, 482 tests, all passing.

What holds up under adversarial tracing:

- **Session memo.** The request-scoped closure, the fresh `getSession()` on every call (password login in the same request works), not caching a null or thrown verification, and there being no cross-request leak. `createSafeGetSession` is built once per request in `supabaseHandle` and nowhere else.
- **Env bridge.** Empty-shell handling is correct, and `process.env` is restored in `finally`.
- **Grant vocabulary.** `roles.ts` and the parity test compare runtime values and types in both directions. The boundary scan passes.
- **Data provider split.** The helper extraction from `supabaseDataProvider.ts` is a pure move. The typed `upsert_answers` call matches the SQL signature `(p_entity_type, p_entity_id, p_answers, p_overwrite)`. The `send-email` template shape `{subject, body}` now matches the function's validator.
- **Provider keywords.** `getActiveProvider` fails closed on the unsuffixed keywords.
- **`matchState` `'none'`.** It returns parents unscored through the same shape as the below-minimum-answers path. No context value is destructured.
- **`focusNavigationTarget` pointer cancel.** The listener is capture, passive and once. Removal matches on `capture`. A pointer press never has its default prevented.
- **Password validation move.** A verbatim move; the app-shared copy and its export are deleted.
- **LogoutButton.** The duplicate `goto` is gone, and the context's `logout` still navigates.

**Style inlining.** Every inlined class string was run through the project's `cn` (tailwind-merge 3.7.0 with the repo's config). The only tokens it drops are deliberate overrides: `min-h-0`→`min-h-[40vh]`, `ease-out`→`ease-in`, `max-h-[8rem]`→`max-h-(--full-height)`, the unpicked-dot sizes, and `hover:bg-base-200`→`hover:bg-transparent`.

The generated CSS was then checked in the current build (`build/client/_app/immutable/assets/0.*.css`):

- The arbitrary variants are emitted as intended.
- Vendor pseudo-elements are emitted as separate rules and never merged into one invalid selector list.
- DaisyUI sits in `utilities.daisyui.*` sublayers, so the inlined utilities still win.

Tailwind v4's default `dark:` is `prefers-color-scheme`, so ScoreGauge's move from a media query to `dark:` changes nothing. No `group`/`peer` variant binds to the wrong ancestor or sibling.

The findings are one security-hardening gap in the session memo and three behavioural or parity gaps. The rest are Info.

## [B] Narrative Findings (AI reviewer)

## [B] Warnings

### B-WR-01: The session memo is keyed on one token but verifies whatever token the client holds when `getUser()` runs

**File:** `apps/frontend/src/lib/supabase/safeGetSession.ts:26`
**Issue:** `verify(accessToken)` calls `supabase.auth.getUser()` with **no argument**. supabase-js then re-reads the session from storage and verifies that token, refreshing it first if it is near expiry. It does not verify the token read by the preceding `getSession()`. The memo stores the result under `session.access_token`, and the helper returns that `session` paired with the `user` from the other token.

Close to expiry, `getSession()` can return token A while `getUser()` refreshes and verifies token B. The helper then hands back `{ session: A, user: B }`, and the memo records A as verified. Token A's claims were never checked by Auth.

This matters because `readGrants(session.access_token)` (`roles.ts`) decodes the returned session's token without checking its signature, and its doc justifies that by `safeGetSession` having verified that token. The race predates the memo. The memo makes it worse: the unverified pairing is now reused for every later call in the request, including the gate and every loader.
**Fix:** Verify exactly the token being keyed and returned:
```ts
const verification = supabase.auth
  .getUser(accessToken)
  .then(({ data: { user }, error }) => (error ? null : user));
```

### B-WR-02: `organizationMatching: 'none'` is now also the silent fallback, so a stored `matching` object without the key switches off party matching

**File:** `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:200` (with `apps/frontend/src/lib/contexts/voter/matchState.svelte.ts:69-78`)
**Issue:** `#parentMatchingMethod = $derived(this.#appSettings.matching?.organizationMatching || 'none')`.

`mergeAppSettings` (`lib/utils/settings.ts`) replaces settings **by root key**. A stored `app_settings.settings.matching` that carries only `minimumAnswers` therefore drops the shipped `organizationMatching: 'impute'`. The same happens with a stored `''`, which `StoredSettingsSchema` accepts as `z.string().optional()`.

Before this branch, the `'none'` fallback shared the `answersOnly` path, so parties were still scored. After the D-15 change, `'none'` means no party scores. The same stored row now silently removes every party's match score, with no log line. Separately, any other string, such as a typo, reaches the `default: throw` inside the `$derived.by`, which takes down the whole match tree.
**Fix:** Fall back to the shipped default instead of a literal, and narrow the value to the vocabulary:
```ts
const METHODS = ['none', 'answersOnly', 'impute'] as const;
#parentMatchingMethod = $derived.by(() => {
  const v = this.#appSettings.matching?.organizationMatching;
  return (METHODS as ReadonlyArray<string>).includes(v ?? '') ? v! : dynamicSettings.matching.organizationMatching;
});
```
Log once when the stored value is out of vocabulary. The root-key merge of `matching` is the underlying defect (the `TODO` in `settings.ts`).

### B-WR-03: The local adapter answers an empty filter array where the Supabase adapter throws, so the two adapters disagree

**File:** `apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts:86,112,169-175`
**Issue:** The new `appliesTo` is documented as matching the semantics of the `get_questions` RPC. The Supabase adapter routes every id filter through `convertFilterValue`, which **throws** on `[]`: "filter by nothing" is an unanswerable request.

The local adapter treats `[]` as truthy in both places. `getQuestionData` enters the filter, and `appliesTo(listed, [])` keeps every unscoped row and drops every scoped one, returning a silently partial question set. `getNominationData` hands `[]` to `filterData`, which matches nothing, and returns an empty result.

That is the blank-app, no-error failure the `convertFilterValue` throw exists to prevent. It is reachable from any caller other than the `(located)` layout guard.
**Fix:** Reject empty arrays the same way at the top of both methods, for example by reusing the shared contract:
```ts
function assertNonEmpty(value: unknown, name: string): void {
  if (Array.isArray(value) && value.length === 0)
    throw new Error(`LocalServerDataProvider: an empty ${name} array requests nothing and cannot be answered; pass undefined to omit the filter.`);
}
```
Add a test case per method.

### B-WR-04: The preregister page keeps a second, untyped copy of the provider keyword; an unknown keyword fails silently in the UI

**File:** `apps/frontend/src/routes/candidate/preregister/+page.svelte:82-115`
**Issue:** `redirectToIdentityProvider` compares `constants.PUBLIC_IDENTITY_PROVIDER_TYPE === 'idura-ftn'` as a raw string, and **every other value** takes the Signicat branch. That includes an old `idura` keyword, `''` and a typo. The keyword vocabulary now lives in `getActiveProvider` and in this page, and TypeScript cannot catch drift because `constants` is `string`.

With the old keyword, the server-side `/api/oidc/authorize` throws in `getActiveProvider` and answers 500. The page then only calls `console.error('Failed to get authorization URL')` and returns. So the fail-closed guarantee holds, but the user clicks "Identify yourself" and nothing happens: the silent same-page outcome that `authorize-fail-closed.test.ts` was written to eliminate.
**Fix:** Type the comparison against `ProviderType`, and branch on a known value rather than falling through:
```ts
const providerType = constants.PUBLIC_IDENTITY_PROVIDER_TYPE as ProviderType;
if (providerType !== 'idura-ftn' && providerType !== 'signicat-ftn') { /* show error, log */ return; }
```
Surface a visible error when `!response.ok`, not only a `console.error`.

## [B] Info

### B-IN-01: The local nomination round filter treats NULL as round 1; the SQL does not

**File:** `apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts:89-92`
**Issue:** `(nomination.electionRound ?? 1) === electionRound` keeps a round-less nomination for round 1. `get_nominations` filters with `n.election_round = p_election_round`, and `nominations.election_round` is `integer DEFAULT 1` but nullable (`104-nominations.sql:54`), so an explicit NULL row is excluded there. The two agree only while no row stores NULL.
**Fix:** Either add `NOT NULL` to the column (Part A), or document the divergence in the local adapter.

### B-IN-02: `vite.projectIdEnv.ts` treats a whitespace-only shell value as set, and its key comment overstates what `loadEnv` does

**File:** `apps/frontend/vite.projectIdEnv.ts:4-6,32,48-49`
**Issue:**
- Only `=== ''` counts as empty. `PUBLIC_PROJECT_ID=' '` in the shell wins over the file value, and the adapter's `.trim()` then throws, which contradicts the "shell left it empty" intent.
- The comment says the keys are "named literally rather than matched by a prefix". But `loadEnv`'s third argument is a prefix list, so `loaded`, the return value, also carries any `PUBLIC_PROJECT_ID*`/`E2E_PROJECT_ID*` key. Only the write loop is literal.

**Fix:** Test `value.trim() === ''` in both places, and correct the comment to say the writes are literal.

### B-IN-03: A disabled NavItem is visually identical to an enabled one

**File:** `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:41-48`
**Issue:** The inlining dropped the old `!text-secondary` for disabled items. That preserves the rendered result, because the old unlayered `!important` lost to the layered `!text-neutral` and so never applied. The designed disabled colour is now gone from the code as well, and nothing but `pointer-events-none` distinguishes the state.
**Fix:** If a disabled cue is wanted, put it in `cn` so that it replaces the base colour, e.g. `disabled && '!text-secondary pointer-events-none hover:bg-transparent'`, and check its contrast.

### B-IN-04: A closed Alert stays in the accessibility tree and its buttons stay focusable (pre-existing, preserved)

**File:** `apps/frontend/src/lib/components/alert/Alert.svelte:89-104`
**Issue:** `!isOpen` only adds `translate-y-full opacity-0`. The `role="alert"`/`dialog` element and its close buttons remain in the tab order and exposed to screen readers while invisible. This is a WCAG 2.4.7/2.4.3 hazard, carried over unchanged from the old `.vaa-alert-hidden` class.
**Fix:** Add `invisible` (`visibility: hidden` also removes the element from focus and the a11y tree) with a delayed transition, or set `inert={!isOpen}`.

### B-IN-05: Expander keeps classes that never have an effect

**File:** `apps/frontend/src/lib/components/expander/Expander.svelte:123,129,149-151`
**Issue:**
- The content div renders only inside `{#if expanded}`, when the checkbox is always checked, so `peer-checked:` is always true.
- `peer-checked:py-md` repeats the `p-md` already on the element.
- Its `padding-block`, at (0,2,0), also overrides the `category` variant's `pt-lg`, so `pt-lg` is dead. It was dead before the inlining too.

**Fix:** Drop `peer`/`peer-checked:*` and decide whether `category` should get `pt-lg`. If so, keep `p-md` without the `peer-checked` padding.

### B-IN-06: The supabase-types boundary scan covers only `.ts`/`.svelte` under `src/`

**File:** `apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts:42-50`
**Issue:** `sourceFiles` skips `.js` files and everything outside `src/`: `vite.config.ts`, `svelte.config.js`, `vite.projectIdEnv.ts` and `apps/frontend/tests`. An import added there would not fail the boundary.
**Fix:** Root the scan at the workspace, skipping `node_modules`/`build`/`.svelte-kit`, and include `.js`/`.mjs`.

### B-IN-07: `validatePassword` is exported but used only by its test, and the rules run client-side only

**File:** `apps/frontend/src/lib/utils/password-validation/passwordValidation.ts:121`
**Issue:** After the move, no production code imports `validatePassword`; `PasswordValidator` uses `validatePasswordDetails`. Nothing server-side re-applies the rules, so a direct `updateUser` call bypasses them. This predates the move.
**Fix:** Either drop the export or use it where the password is submitted. Record that Supabase Auth's own password policy is the server-side enforcement.

### B-IN-08: The memo lives as long as `locals`, not as long as the request

**File:** `apps/frontend/src/lib/supabase/safeGetSession.ts:9,17`
**Issue:** The doc says "the memo must not outlive the request". But the closure hangs off `event.locals`, which the admin job features (`condenseArguments.ts`, `generateQuestionInfo.ts`) carry past the response. Those callers read the session once today. A later call from a long-running job would get a cached verification for a token revoked in the meantime.
**Fix:** State in the doc that `locals.safeGetSession` must not be called after the response, or clear the map once `resolve(event)` settles in `supabaseHandle`.

---

_Reviewed: 2026-09-28T20:42:55Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

# Part C: shared packages, docs site, E2E harness

Source: `165-REVIEW-partC.md`


# Phase 165: Code Review Report (Part C — shared packages, docs site, E2E harness)

**Reviewed:** 2026-09-28T23:30:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## [C] Summary

Scope: the diff `ship/v2.15-12-planning...HEAD` for area C. That covers `packages/app-shared` (`getLocalized`, `SendEmailResultSchema`, the password-validation removal), the `Condenser.run()` flat-result change, question-info tests, the docs-site Tailwind inlining, and the Playwright harness. The harness part is the new state-driven stage walk, the CI-only 180 s ceiling, the portrait, cold-entry and results waits, the closed-project teardown and the two orchestration shell scripts.

These parts are sound:
- **`getLocalized` string-only semantics.** Every caller (`localizeRow` over `name`/`short_name`/`info`, translation overrides, notifications, FAQ, keywords, choice labels) localizes string-valued fields only. No caller loses data.
- **`SendEmailResultSchema`.** Making `success` and `dry_run` required matches all three `send-email` return literals.
- **The `Condenser.run()` flatten.** It fixes a real product bug: `condenseArguments.ts:188` was mapping `{ id, text }` off nested arrays. The tests now assert flatness instead of papering over it.
- **The docs inlining.** I checked it against the built CSS. The utilities sort after `.prose :where(h2)` inside `@layer utilities`, and daisyUI's `menu-active` sits in a nested sub-layer, so the inlined classes win as the scoped styles did. The `--spacing: 1rem/16` theme makes `p-16`/`mb-4` pixel-equal to the removed rules.
- **The shell scripts.** The `determinism-batch.sh` step prefix matches the renamed step title. `visual-container.sh --ci-literal` matches CI's `e2e-run.sh --project visual-regression` invocation and the config's unset-CI defaults.

The defects are in the harness:
- The new stage walk can spin until the test ceiling with no progress check. When it stops, the timeout it hits hides its own diagnostic.
- Its "href resolved" guard accepts the app's `__first__` placeholder.
- The answer loop still has one fixed-window branch, which can silently skip a question. The D-14 ruling banned that pattern.
- The CI ceiling raise does not reach several hard-coded `setTimeout` sites.
- The closed-project teardown's `try/finally` can skip the dataset delete and mask the original error.

None of these is a BLOCKER at the tip, because CI run 36476589852 is green. But each is a latent flake or a mis-attributed failure, which the E2E Hard Rule treats as a real defect.

## [C] Warnings

### C-WR-01: `walkVoterStages` has no progress check, so a stage that never advances spins silently until the test ceiling

**File:** `tests/tests/utils/voterNavigation.ts:217-226` (loop), `:22-36` (`advanceClick`), `:198-203` (`leaveStage` catch)

**Issue:** The loop is `for (;;) { resolve; if (until) return; leaveStage }`. `leaveStage` swallows every timeout, and `advanceClick` swallows **every** click error with a bare `catch {}`, including strict-mode violations and "element is not enabled". So a stage whose action never takes effect is re-resolved and re-clicked until the test's own timeout ends the run. That timeout is 90 s locally, 180 s on CI and 240 s in the journey tests.

Here is a concrete case on the `e2e/base` seed, which has `questionsIntro.allowCategorySelection: true`. The questions-intro Start button renders `disabled={!canSubmit}` (`questions/+page.svelte:152`). A visible but disabled button satisfies `resolveVoterStage('questions-intro')`. The 3 s click then times out, gets swallowed, and the walk loops. If `canSubmit` never turns true (a real app defect: no categories selected, or `selectedQuestionBlocks` empty), the failure reads "Test timeout of 180000ms exceeded". It does not say "stuck on questions-intro; Start never enabled". The same happens when the missing-nominations modal intercepts the click.

This is the mis-attribution hazard that `requireNavigation` (fixture `:69-94`) was written to prevent. The walk reintroduces it one layer up.

**Fix:** Count consecutive resolutions of the same stage on the same URL, and fail at the fault site. Narrow `advanceClick`'s catch to timeouts:

```ts
export async function walkVoterStages(page: Page, until: ReadonlyArray<VoterStage>): Promise<VoterStage> {
  let last = '';
  let repeats = 0;
  for (;;) {
    const stage = await resolveVoterStage(page);
    if (until.includes(stage)) return stage;
    if (stage === 'question') throw new Error(/* unchanged */);
    const key = `${stage}@${new URL(page.url()).pathname}`;
    repeats = key === last ? repeats + 1 : 0;
    last = key;
    if (repeats >= 5) {
      throw new Error(`voter walk: the ${stage} action did not take effect after ${repeats + 1} attempts at ${page.url()}`);
    }
    await leaveStage(page, stage);
  }
}
// advanceClick:
} catch (error) {
  if (!isTimeout(error)) throw error;
}
```

### C-WR-02: `STAGE_BUDGET = TIMEOUTS.testMax` makes the walk's own failure message unreachable

**File:** `tests/tests/utils/voterNavigation.ts:82`, `:122-134`, `:169`

**Issue:** `resolveVoterStage`'s `toPass` builds a precise message: "the voter flow shows none of [...] at <url>". But its budget equals the per-test ceiling, and the test's timer started earlier (fixtures, `goto`, the preceding stages). Under the default timeout the test timeout always fires first, so that message never reaches the report.

`continueFromCategoryIntro`'s `toHaveAttribute` has the same problem. There is a second quirk: its failure text ("Timed out … waiting for expect(locator)…") does not match `isTimeout`'s `/Timeout .* exceeded/`. So the one case where it does fire first (a 240 s journey test) rethrows instead of retrying, which is inconsistent with the docstring at `:175`.

The docstring at `:80` acknowledges that the test timeout ends a stuck walk. The cost is diagnosis: the report names neither the stage set nor the URL.

**Fix:** Wrap each resolution in a named step, so the timeout report names the pending wait:

```ts
return test.step(`resolve voter stage [${stages.join(', ')}]`, async () => { /* existing toPass */ return found as VoterStage; });
```

Also make `isTimeout` recognise assertion timeouts: `/Timeout .* exceeded|Timed out \d+ms waiting/`. Together with WR-01's attempt counter, a stuck walk then fails with its own message.

### C-WR-03: The "href resolved" guard on the category-intro start link accepts the `__first__` placeholder, so it guards nothing

**File:** `tests/tests/utils/voterNavigation.ts:169`, `tests/tests/fixtures/voter/voter-journey.fixture.ts:58-67,172`

**Issue:** The category page renders `href={getRoute.current({ route: 'Question', questionId })}`, with `questionId = $derived(block?.block[0]?.id)` (`questions/category/[categoryId]/+page.svelte:52,113`). While `block` is unresolved, `DEFAULT_PARAMS.Question` (`lib/routes/route.ts:124`) fills in `FIRST_QUESTION_ID`. The href is then `/en/questions/__first__`.

Neither guard rejects it:
- `/\/questions\/(?!category\/)[^/]+/` in `voterNavigation.ts` does not.
- `/\/questions\//` in the fixture does not either. It would even accept a `/questions/category/…` href.

So both helpers can `page.goto` the app's **first** question rather than this category's. In the answer loop, that re-enters an already-answered question:
- A radio that is already checked fires no `change`, so there is no auto-advance, and `requireNavigation` throws a mis-attributed "did not advance".
- A checkbox toggles and silently rewrites the answer set that the visual baseline and the exact org scores are captured from.

The two helpers are also duplicate implementations of one operation, with divergent patterns. That breaks the checklist's "no repeated code" item.

**Fix:** Keep one exported helper in `voterNavigation.ts`, have the fixture reuse it, and exclude the placeholder:

```ts
import { FIRST_QUESTION_ID } from '../../../apps/frontend/src/lib/routes/route';
const RESOLVED_QUESTION_HREF = new RegExp(`/questions/(?!category/|${FIRST_QUESTION_ID}(?:[/?#]|$))[^/?#]+`);
```

### C-WR-04: The post-slider branch keeps a swallowed fixed window whose expiry silently skips a question

**File:** `tests/tests/fixtures/voter/voter-journey.fixture.ts:204-208`, `:216`, `:227-232`

**Issue:** D-14 ruled out fixed-window branching. The non-slider wait at `:210` was converted to a hard `testMax` wait, but the `sliderJustAnswered` branch still does `currentChoices.first().waitFor({ timeout: slowPage }).catch(() => null)`. When that 10 s window expires, which is plausible on the runner measured at 4-5× slower (`timeouts.ts:33`):
1. `choiceCount` is `0`.
2. `waitForVisible(slider, TIMEOUTS.page)` gets another fixed 5 s window.
3. If that also misses, the "Skip" fallback clicks Next.

The question is left **unanswered**, with no failure. That changes the match results and the visual baseline, and the downstream assertion that eventually reds is far from the cause. That is exactly the failure mode the `requireNavigation` docstring describes.

The "text rendering" case that justifies the Skip fallback has no seeded instance. No `e2e/*` opinion question renders neither choices nor a slider.

**Fix:** Replace the silent Skip with a loud failure, and make the post-slider wait hard. It should end on either the scoped choices or a slider that is not the one just answered:

```ts
// before clicking Next on a slider question:
const answeredSlider = await slider.elementHandle();
// ...
// next iteration, when sliderJustAnswered:
await expect
  .poll(async () => (await currentChoices.count()) > 0 || !(await answeredSlider?.evaluate((el) => el.isConnected)), {
    timeout: TIMEOUTS.testMax
  })
  .toBe(true);
// and at :227-232:
throw new Error(`voter-journey: question ${questionId} rendered neither choices nor a number slider at ${page.url()}`);
```

### C-WR-05: The results landing still uses fixed windows beside the one converted to the test budget

**File:** `tests/tests/fixtures/voter/voter-journey.fixture.ts:269`, `:272`, `:280`; `:83` (`requireNavigation`)

**Issue:** The picker-or-list race at `:269` now waits `TIMEOUTS.testMax`. But on the multi-election path the same heavy render is then held to fixed windows:
- `options.first().waitFor(slowPage)` at `:272`;
- `resultsList.waitFor(15_000)` at `:280`, a local measurement;
- the final hop to `/results` inside `requireNavigation`, at `slowPage` (10 s).

That hop is where SvelteKit updates the URL only after the `/results` loads resolve. D-16's own evidence says the located `/en/results` election picker missed a 10 s wait on CI. These are the same page and the same render class, on the same runner.

**Fix:** Give the post-selection list wait (`:280`) and the picker-option wait (`:272`) the same budget as `:269` (`TIMEOUTS.testMax`), and drop the stale 15 s `// reason:`. Also consider a larger, named budget for the last-question → `/results` navigation in `requireNavigation`. It must stay loud.

### C-WR-06: The CI-only 180 s ceiling is silently lowered back by hard-coded `setTimeout` sites

**File:** `tests/tests/helpers/timeouts.ts:11,35`. Affected callers are outside this diff:
- `tests/tests/setup/shared/auth.setup.ts:53`
- `tests/tests/setup/admin/admin-auth.setup.ts:22`
- `tests/tests/setup/perm/perm-answers-locked.setup.ts:47`
- `tests/tests/setup/perm/perm-question-video.setup.ts:43`
- `tests/tests/setup/perm/perm-hide-hero.setup.ts:43`
- `tests/tests/setup/perm/perm-disable-allow-open.setup.ts:41` (all 90 000 above)
- `tests/tests/specs/perm/perm-not-located-2e2cg.spec.ts:50,71,86,103,125` (45 000)
- `tests/tests/specs/perf/performance-budget.spec.ts:86` (90 000)

**Issue:** `testMax` becomes 180 s on GitHub Actions because the runner is 4-5× slower. But every `test.setTimeout(<literal>)` overrides the config default, so on CI these setups and specs keep their local-sized budgets on the same slow runner. For example, `perm-not-located-2e2cg` runs 45 s tests where the rest of the suite gets 180 s.

The header's worked example is also now wrong on CI. It says `perm-localisation-positive` 180 s is a budget "ABOVE this value", but on CI that 180 s equals `testMax`.

**Fix:** Express each literal relative to the bucket, e.g. `setup.setTimeout(TIMEOUTS.testMax)`, or scale it with the same `ON_GITHUB_ACTIONS` factor (export it from `timeouts.ts`). Also correct the header example.

### C-WR-07: The closed-project teardown's `try/finally` skips the dataset delete on an auth failure and masks the original error

**File:** `tests/tests/setup/perm/perm-closed-project.teardown.ts:19-27`

**Issue:** `unregisterCandidate` throws on three paths (`supabaseAdminClient.ts:550,554,558`). When it throws, `runTeardownAsserted(PREFIX)` never runs, so the seeded `e2e-perm-closed-project-*` rows persist while the project is reopened.

Also, if `ensureProject()` throws inside `finally`, JavaScript discards the in-flight error. The report then names the reopen failure, and the cleanup failure that caused it disappears.

The header says "A throw from either delete step still fails the teardown after the project is reopened". That is true only for the step that threw first.

**Fix:** Run the three steps independently and report every failure:

```ts
const errors: unknown[] = [];
for (const step of [
  () => client.unregisterCandidate(CANDIDATE_EMAIL),
  () => runTeardownAsserted(PREFIX, client),
  () => client.ensureProject()
]) {
  try {
    await step();
  } catch (e) {
    errors.push(e);
  }
}
if (errors.length) throw new AggregateError(errors, 'perm-closed-project teardown failed');
```

## [C] Info

### C-IN-01: `expectNoOrgMatchScore` is a one-shot negative count with no positive sync point

**File:** `tests/tests/fixtures/voter/resultsPage.fixture.ts:194-203`

**Issue:** It asserts the card is visible, then takes a single `.count()` snapshot of the callouts. If a regression made `none` score organisations but the callout mounted a beat after the card, this passes. A negative assertion needs a positive "rendering is done" anchor first.

**Fix:** Before counting, wait for a signal that matching has rendered, for example `await expect(card.getByTestId(testIds.voter.results.cardSubcard).getByTestId(testIds.voter.results.matchScore).first()).toBeVisible()`. The member subcards keep their scores under `none`.

### C-IN-02: `SendEmailResultSchema` documents a 500 branch that can never reach it

**File:** `packages/app-shared/src/data/schemas/sendEmailResult.schema.ts:26,31`; consumer `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts:143`

**Issue:** `functions.invoke` turns every non-2xx into `{ data: null, error: FunctionsHttpError }` (`@supabase/functions-js` `FunctionsClient.js:136-137`). So the all-failed 500 payload is never parsed. `sendEmail` throws `send-email: <message>`, and the per-recipient failure list is lost.

**Fix:** Either drop the 500 branch from the schema docs, or have the adapter read `await error.context.json()` on `FunctionsHttpError` and parse it with this schema.

### C-IN-03: Stale descriptions of the old walk, and of the 90 s ceiling

**Files:**
- `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts:6-7,37`: says the walk is a "hard-wait `walkUntilQuestionsIntro`" and that the start click is "guarded with `isVisible`".
- `tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts:4` and `perm-disable-allow-open.spec.ts:4`: say `answeredVoterPage` "hard-waits … and would time out".
- `tests/playwright.config.ts:1225-1227`: "Single source of the 90s ceiling".
- In changed files: `voterNavigation.ts:25` ("full 90s test ceiling") and `voter-journey.fixture.ts:53,170,187` ("the 90s ceiling", "→ 90s timeout").

**Fix:** Reword each to describe the current behaviour. The ceiling is `TIMEOUTS.testMax`, which is environment-dependent.

### C-IN-04: Dead code

**Files:**
- `tests/tests/utils/voterNavigation.ts:228-244`: `advanceVoterFlow` is module-private and only ever called with `'first-question'`, so the `'questions-intro'`/`'category-intro'` members of `StopAt` are unreachable.
- `tests/tests/utils/missingNominations.ts:21,64`: neither export has a caller anywhere under `tests/tests`, yet this diff edited it. `tests/README.md:305` still prescribes both helpers, and `:66` keeps the "builds without the testId" `getByRole('dialog')` fallback whose twin the diff deleted at `:20`.

**Fix:** Inline `walkVoterStages(page, ['question'])` into `navigateToFirstQuestion` and delete `StopAt`/`advanceVoterFlow`. Delete `missingNominations.ts` and its README entry, or wire it into the specs that need it.

### C-IN-05: Unscoped `inputError` wait in the candidate profile step

**File:** `tests/tests/specs/candidate/candidate-journey.spec.ts:556`

**Issue:** `page.getByTestId(testIds.shared.inputError)` is page-wide. Any other field's error, such as the still-empty required `qu-info-text`, would make `toBeHidden` a strict-mode violation or wait on the wrong element.

**Fix:** Scope it to the field just cleared, e.g. `candidateProfilePage.questionField(/\[qu-info-text-link\]/).getByTestId(testIds.shared.inputError)`.

### C-IN-06: `--ci-literal` does not reproduce CI's timeout posture

**File:** `tests/scripts/visual-container.sh:30`, `:272-274`, `:488-493`

**Issue:** The mode claims to reproduce CI's invocation exactly. But the container is not given `GITHUB_ACTIONS=true`, so `TIMEOUTS.testMax` is 90 s in the container and 180 s in CI.

**Fix:** Add `DOCKER_ARGS+=(-e GITHUB_ACTIONS=true)` under `--ci-literal`, or state the difference in the flag's help text.

### C-IN-07: Two widened budgets now apply locally too (maintainer rulings; noted, not contested)

**Files:** `tests/tests/specs/voter/voter-journey.spec.ts:24` (`JOURNEY_TEST_MAX = 240_000` for every environment, where the measured local cost is 42-45 s), and `tests/tests/specs/voter/cold-entry-dataroot.spec.ts:40,51,70,86` (first data wait at `testMax`).

**Issue:** The CI-motivated widenings also loosen the local regression signal. A local journey slowdown to about 200 s, or a cold render that takes 80 s, now passes.

**Fix (optional):** Key `JOURNEY_TEST_MAX` off the same `ON_GITHUB_ACTIONS` flag as `testMax`, e.g. 120 s locally and 240 s on CI.

---

_Reviewed: 2026-09-28T23:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
