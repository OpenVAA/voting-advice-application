---
phase: 170-contestant-app-rename-symbols-routes
reviewed: 2026-10-22T19:59:10Z
depth: standard
files_reviewed: 226
files_reviewed_list:
  - .claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.expected.ts
  - .claude/skills/ship-review-stack/sources/fixtures/hygiene-codemod.input.ts
  - .claude/skills/spike-findings-voting-advice-application-gsd/sources/004-matchstore-integration/runes-test-page.svelte
  - .claude/skills/spike-findings-voting-advice-application-gsd/sources/005-candidate-answer-store-rune/candidateAnswerRuneStore.svelte.ts
  - .claude/skills/spike-findings-voting-advice-application-gsd/sources/009-store-codemod-feasibility/spike-009-store-codemod.mjs
  - apps/docs/scripts/docs-scripts.config.ts
  - apps/docs/scripts/generate-component-docs.ts
  - apps/docs/src/lib/navigation.config.ts
  - "apps/docs/src/routes/(content)/developers-guide/candidate-user-management/creating-a-new-candidate/+page.ts"
  - "apps/docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.ts"
  - "apps/docs/src/routes/(content)/developers-guide/candidate-user-management/registration-process-in-strapi/+page.ts"
  - "apps/docs/src/routes/(content)/developers-guide/candidate-user-management/resetting-the-password/+page.ts"
  - apps/frontend/eslint.config.mjs
  - apps/frontend/scripts/store-to-state-codemod.mjs
  - apps/frontend/src/app.d.ts
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts
  - apps/frontend/src/lib/_guards/eslint-adapter-singleton-guard.test.ts
  - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/parseStoredCustomization.test.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/frontend/src/lib/api/base/universalApiRoutes.ts
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
  - apps/frontend/src/lib/api/dataProvider.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/oidcFailure.ts
  - apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts
  - apps/frontend/src/lib/auth/getUserData.ts
  - apps/frontend/src/lib/auth/passwordLogin.test.ts
  - apps/frontend/src/lib/auth/roles.ts
  - apps/frontend/src/lib/components/input/Input.svelte.test.ts
  - apps/frontend/src/lib/components/modal/drawerHost/DrawerHost.svelte
  - apps/frontend/src/lib/components/modal/drawerHost/drawerHostState.svelte.ts
  - apps/frontend/src/lib/components/questions/NumberScaleInput.svelte
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte
  - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
  - apps/frontend/src/lib/contestant/components/logoutButton/index.ts
  - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte
  - apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.type.ts
  - apps/frontend/src/lib/contestant/components/passwordField/index.ts
  - apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte
  - apps/frontend/src/lib/contestant/components/passwordField/PasswordField.type.ts
  - apps/frontend/src/lib/contestant/components/passwordSetter/index.ts
  - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte
  - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.type.ts
  - apps/frontend/src/lib/contestant/components/passwordValidator/index.ts
  - apps/frontend/src/lib/contestant/components/passwordValidator/PasswordValidator.svelte
  - apps/frontend/src/lib/contestant/components/passwordValidator/PasswordValidator.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/passwordValidator/PasswordValidator.type.ts
  - apps/frontend/src/lib/contestant/components/termsOfUse/index.ts
  - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUse.svelte
  - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseForm.svelte
  - apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseForm.type.ts
  - apps/frontend/src/lib/contestant/utils/loginError.ts
  - apps/frontend/src/lib/contestant/utils/oidcError.test.ts
  - apps/frontend/src/lib/contestant/utils/oidcError.ts
  - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
  - apps/frontend/src/lib/contexts/admin/jobStates.svelte.ts
  - apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/app/appContext.type.ts
  - apps/frontend/src/lib/contexts/app/appCustomization.type.ts
  - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
  - apps/frontend/src/lib/contexts/auth/authContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/auth/authContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
  - apps/frontend/src/lib/contexts/contestant/index.ts
  - apps/frontend/src/lib/contexts/utils/inheritContextMembers.ts
  - apps/frontend/src/lib/contexts/utils/questionRollup.test.ts
  - apps/frontend/src/lib/contexts/utils/questionRollup.ts
  - apps/frontend/src/lib/dynamic-components/entityCard/tests/hoverShadedRule.test.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
  - apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.type.ts
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/index.ts
  - apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts
  - apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte
  - apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
  - apps/frontend/src/lib/layouts/main/Banner.svelte
  - apps/frontend/src/lib/layouts/main/Layout.svelte
  - apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts
  - apps/frontend/src/lib/layouts/main/Layout.type.ts
  - apps/frontend/src/lib/routes/appGates.test.ts
  - apps/frontend/src/lib/routes/appGates.ts
  - apps/frontend/src/lib/routes/buildRoute.redirects.test.ts
  - apps/frontend/src/lib/routes/loginRedirectTarget.test.ts
  - apps/frontend/src/lib/routes/loginRedirectTarget.ts
  - apps/frontend/src/lib/routes/route.test.ts
  - apps/frontend/src/lib/routes/route.ts
  - apps/frontend/src/lib/routes/routeConsistency.test.ts
  - apps/frontend/src/lib/routes/voterAppPath.test.ts
  - apps/frontend/src/lib/supabase/anon.ts
  - apps/frontend/src/lib/utils/password-validation/passwordValidation.test.ts
  - apps/frontend/src/lib/utils/password-validation/passwordValidation.ts
  - apps/frontend/src/lib/utils/settings.test.ts
  - apps/frontend/src/routes/+layout.server.ts
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/+layout.ts
  - apps/frontend/src/routes/admin/+layout.server.ts
  - apps/frontend/src/routes/admin/layout.server.test.ts
  - apps/frontend/src/routes/admin/login/+page.svelte
  - apps/frontend/src/routes/api/auth/callback/+server.ts
  - apps/frontend/src/routes/api/auth/logout/+server.ts
  - apps/frontend/src/routes/api/auth/logout/server.test.ts
  - apps/frontend/src/routes/api/oidc/callback/+server.ts
  - "apps/frontend/src/routes/contestant/(protected)/+layout.server.ts"
  - "apps/frontend/src/routes/contestant/(protected)/+layout.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/+page.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts"
  - apps/frontend/src/routes/contestant/+layout.server.ts
  - apps/frontend/src/routes/contestant/+layout.svelte
  - apps/frontend/src/routes/contestant/forgot-password/+page.svelte
  - apps/frontend/src/routes/contestant/help/+page.svelte
  - apps/frontend/src/routes/contestant/login/+page.svelte
  - apps/frontend/src/routes/contestant/password-reset/+page.svelte
  - apps/frontend/src/routes/contestant/privacy/+page.svelte
  - apps/frontend/src/routes/contestant/register/+page.svelte
  - apps/frontend/svelte.config.js
  - apps/frontend/vitest.config.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/106-app-settings.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/seed.sql
  - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
  - apps/supabase/supabase/tests/database/22-content-policies.test.sql
  - packages/app-shared/src/data/customData.type.ts
  - packages/app-shared/src/data/schemas/storedAnswers.schema.ts
  - packages/app-shared/src/data/schemas/storedCustomization.schema.test.ts
  - packages/app-shared/src/data/schemas/storedCustomization.schema.ts
  - packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
  - packages/app-shared/src/data/schemas/storedSettings.schema.ts
  - packages/app-shared/src/logging/logger.test.ts
  - packages/app-shared/src/settings/dynamicSettings.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - packages/app-shared/src/settings/staticSettings.ts
  - packages/app-shared/src/settings/staticSettings.type.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-access-disable.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-answers-locked.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-closed-project.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-allow-open.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-contestant-app.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-voter-app.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-hide-hero.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-per-app-notifications.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
  - packages/dev-seed/src/templates/e2e/perm/shared.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/tests/templates/base-app-settings.test.ts
  - scripts/assert-a11y-scan-wiring.mjs
  - scripts/assert-i18n-catalog-namespaces.mjs
  - scripts/assert-no-candidate-app-names.mjs
  - scripts/assert-no-session-in-loads.mjs
  - scripts/fixtures/assert-no-candidate-app-names.input.ts
  - tests/eslint.config.mjs
  - tests/playwright.config.ts
  - tests/tests/fixtures/contestant/contestant-journey.ts
  - tests/tests/fixtures/contestant/contestantForgotPasswordPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantLogoutButton.fixture.ts
  - tests/tests/fixtures/contestant/contestantPasswordSetter.fixture.ts
  - tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
  - tests/tests/fixtures/contestant/perm-l10n.ts
  - tests/tests/fixtures/shared/emailBucket.fixture.ts
  - tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts
  - tests/tests/setup/admin/admin-auth.setup.ts
  - tests/tests/setup/contestant/contestant-journey.setup.ts
  - tests/tests/setup/contestant/contestant-journey.teardown.ts
  - tests/tests/setup/perm/perm-access-disable.setup.ts
  - tests/tests/setup/perm/perm-answers-locked.setup.ts
  - tests/tests/setup/perm/perm-disable-allow-open.setup.ts
  - tests/tests/setup/perm/perm-hide-hero.setup.ts
  - tests/tests/setup/perm/perm-localisation-positive.setup.ts
  - tests/tests/setup/perm/perm-localisation-positive.teardown.ts
  - tests/tests/setup/perm/perm-missing-nominations.setup.ts
  - tests/tests/setup/perm/perm-per-app-notifications.setup.ts
  - tests/tests/setup/perm/perm-question-video.setup.ts
  - tests/tests/setup/shared/assertTeardown.ts
  - tests/tests/setup/shared/auth.setup.ts
  - tests/tests/setup/shared/base.teardown.ts
  - tests/tests/specs/a11y/a11y-smoke.spec.ts
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
  - tests/tests/specs/contestant/contestant-bank-auth.spec.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - tests/tests/specs/perm/perm-access-disable.spec.ts
  - tests/tests/specs/perm/perm-answers-locked.spec.ts
  - tests/tests/specs/perm/perm-closed-project.spec.ts
  - tests/tests/specs/perm/perm-disable-allow-open.spec.ts
  - tests/tests/specs/perm/perm-hide-hero.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
  - tests/tests/specs/perm/perm-per-app-notifications.spec.ts
  - tests/tests/specs/perm/perm-question-video.spec.ts
  - tests/tests/specs/visual/visual-regression.spec.ts
  - tests/tests/specs/voter/cold-entry-dataroot.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/specs/voter/voter-results-redraw.spec.ts
  - tests/tests/utils/axeScan.ts
  - tests/tests/utils/buildTestIdToken.ts
  - tests/tests/utils/contestantJourneyConstants.ts
  - tests/tests/utils/multiChoice.ts
  - tests/tests/utils/rawKeyScan.ts
  - tests/tests/utils/supabaseAdminClient.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 1
  info: 5
  total: 6
status: issues_found
---

# Phase 170: Code Review Report

**Reviewed:** 2026-10-22T19:59:10Z
**Depth:** standard
**Files Reviewed:** 226
**Status:** issues_found

## Summary

This is a retroactive review of the contestant-app rename (base `990f0d662`, phase commits `(170-01)`–`(170-04)`, close `b88b7f4c9`), read against HEAD. Most of the 226 files carry later changes from phases 171–179. The review looked hardest at the ways a rename can break behaviour without failing a type check: string-keyed coupling (route ids and URL literals, message keys, settings and customization JSONB keys, storage keys, test ids, Playwright project names, template keys, auth redirect URLs) and the one deliberate behaviour change, the merge of the two logout endpoints.

Every check of a rename-induced break came back negative:

- **Route ids and URLs.** No `/candidate`, `candidate/<page>`, `api/candidate` or escaped-slash `\/candidate` URL literal is left in `apps/`, `packages/`, `tests/`, the deploy configs or the docs, except where `candidate` is the entity segment (`/contestant/candidate/<id>`, voter results).
- **Message keys.** Every literal `t('contestantApp.…')` / `t('dynamic.contestantApp….')` key in `apps/frontend/src` resolves in `messages/en`. The only four that do not resolve sit in `@component` usage examples, not in live code, and they were missing before the rename too.
- **Settings JSONB keys.** The keys (`access.contestantApp`, `notifications.contestantApp`, root `contestantApp`, `contestantPoster`, `contestantAppFAQ`) are consistent across the strict zod schemas, `dynamicSettings`, `seed.sql`, the SQL readers in `106-app-settings.sql` / `301-auth-functions.sql`, the `identity-callback` registration matrix and every dev-seed template.
- **Test ids.** Every string in `tests/tests/utils/testIds.ts` (334 values), and every literal `getByTestId` in the specs except one generated `tab-N` id, exists in `apps/frontend/src`. So no renamed negative assertion is vacuous because of a dangling id.
- **AppType.** The `'contestant'` value of `AppType` is a closed union, so a stale `'candidate'` comparison would fail the type check.
- **Logout merge.** Both the Admin App and the Contestant App reach `SupabaseDataWriter._logout`, which posts to `ROUTE.AuthLogout`. The global-scope `/api/auth/logout` handler the merge replaced was reachable only through `UniversalDataWriter.logout`, which the Supabase writer overrides. The "admin logout moves from global to local scope" risk noted in verification therefore never applied.

One robustness defect remains on the logout path the phase rewrote: the server endpoint reports success even when sign-out fails, and the client never reads that answer (WR-01). The remaining items are Info: tooling and agent-reference text the rename's codemod rewrote into names that never existed, a mis-cited type plus a prototype-key lookup on the admin login page that the rename touched, a weak cross-route absence assertion in a renamed spec, a fail-open read in the new search gate, and a stale "retained because consumers resolve them" claim on two template keys the rename changed.

Not re-reported: the findings in `177.1-REVIEW.md` and `179-REVIEW.md`, the operator-accepted items in `170-VERIFICATION.md` (the deliberate absence of redirects for old app and docs URLs, the `voter-results-redraw` fix, and the residual "candidate context" prose of deferred row 8), and deferred row 9 (the gate has no wiring test).

## Warnings

### WR-01: The logout endpoint answers success when the sign-out failed, and its caller ignores the answer, so the httpOnly session cookies can survive a "logout"

**File:** `apps/frontend/src/routes/api/auth/logout/+server.ts:14-17`, `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:407-417`, `apps/frontend/src/routes/api/auth/logout/server.test.ts:21-33`

**Issue:** The merged handler discards the `{ error }` that `signOut` returns and always answers `{ ok: true, type: 'success' }`:

```ts
await locals.supabase.auth.signOut({ scope: 'local' });
return json({ ok: true, type: 'success' } as DataApiActionResult);
```

With `scope: 'local'`, supabase-js still calls the auth server's `/logout`. On any failure except a 401, 403 or 404 auth API error (a 5xx or a network error, for example), it returns `{ error }` without removing the session, so `setAll` never clears the httpOnly cookies. The handler then reports success anyway. Its caller does not look at the response either: `_logout` runs `await fetch(ROUTE.AuthLogout, { method: 'POST' })` and goes straight on to the browser-side `signOut`.

The browser then treats the user as signed out, but the next SSR request still carries a valid session cookie. `hooks.server.ts` then sends the "logged-out" user from the login page back to the Contestant App home (`whenAuthenticatedOnLogin`). On a shared device, a logout that silently did nothing leaves the account open.

This endpoint is the one place the phase knowingly changed behaviour. Its new test covers only the success path, and it fixes the always-success response shape in place.

**Fix:** Propagate the failure on both sides, and add a failure-path test:

```ts
// +server.ts
export async function POST({ locals }: RequestEvent): Promise<Response> {
  const { error } = await locals.supabase.auth.signOut({ scope: 'local' });
  if (error) {
    log.error(`[auth/logout] sign-out failed: ${error.name}`);
    return json({ ok: false, type: 'failure' } as DataApiActionResult, { status: 502 });
  }
  return json({ ok: true, type: 'success' } as DataApiActionResult);
}

// supabaseDataWriter.ts _logout
if (typeof window !== 'undefined') {
  const response = await fetch(ROUTE.AuthLogout, { method: 'POST' });
  if (!response.ok) throw new Error(`logout endpoint answered ${response.status}`);
}
```

In `server.test.ts`, add a case where `signOut` resolves `{ error: … }` and assert that the response is not 200 and does not report success.

## Info

### IN-01: The rename codemod rewrote a historical codemod's mapping table and the agent spike sources into names that never existed

**File:** `apps/frontend/scripts/store-to-state-codemod.mjs:14,41-43`, `.claude/skills/spike-findings-voting-advice-application-gsd/sources/005-candidate-answer-store-rune/candidateAnswerRuneStore.svelte.ts:2,4,57`

**Issue:** `store-to-state-codemod.mjs` records a finished `*Store` → `*State` transformation. Its `RENAMES` table now maps `ContestantUserDataStore*` / `contestantUserDataStore`, but no identifier of that name ever existed, because the store was renamed to `…State` before the app was renamed. Re-run against the history it was written for, the codemod would now do nothing for that cluster.

Its exclusion comment also names a localStorage key, `'ContestantContext-contestantUserDataStore-…'`, that never existed. That misleads anyone searching for persisted keys.

The spike-005 source likewise cites a production file, `apps/frontend/src/lib/contexts/contestant/contestantUserDataStore.svelte.ts`, that has never existed. These are records of past transformations and past paths, which a mechanical identifier rename should not touch.

**Fix:** Restore the pre-rename spellings in these historical records (`CandidateUserDataStore*`, `'CandidateContext-candidateUserDataStore-…'`, `contexts/candidate/candidateUserDataStore.svelte.ts`), and add the files to the codemod's skip list. They are exempt from the search gate only if they are added to it as structural records. Alternatively, mark each one as historical in a single line.

### IN-02: The admin login page's error parameter is documented as `ContestantLoginError` and is looked up with `in`

**File:** `apps/frontend/src/routes/admin/login/+page.svelte:12,46,56-57`, `apps/frontend/src/lib/admin/utils/loginError.ts:7`

**Issue:** The rename turned the doc line from `CandidateLoginError` into `ContestantLoginError`. The page actually uses the admin `LoginError` (`'loginFailed' | 'userNotAuthorized'`) from `$lib/admin/utils/loginError`. `ContestantLoginError` is now `'loginFailed' | 'authError' | 'emailTaken'`, so the doc names the wrong set of values.

Separately, the admin `getErrorTranslationKey` still tests `error in LOGIN_ERROR`. `?errorMessage=constructor` therefore returns the inherited `Object` function as a "translation key". `t()` finds no message for it and echoes the key back, so the login page renders the function's source text (`function Object() { [native code] }`) as an inline error. The contestant twin was hardened with `Object.hasOwn`, but the admin copy was not.

**Fix:** Change the doc line to `` `LoginError` (`$lib/admin/utils/loginError`) ``, and use `Object.hasOwn(LOGIN_ERROR, error)` in the admin helper, as `contestant/utils/loginError.ts:26` already does.

### IN-03: The per-app notification spec's "strict cross-route absence" checks only the dialog already filtered to the route's own marker

**File:** `tests/tests/specs/perm/perm-per-app-notifications.spec.ts:15-17,22-25`

**Issue:** `page.getByRole('dialog').filter({ hasText: '[notif-voter]' })` selects the voter dialog. `not.toContainText('[notif-contestant]')` then asserts only that this one dialog lacks the other marker. A second dialog carrying `[notif-contestant]` on the voter route, which is exactly the leak the header claims to enforce against, would pass. The contestant case has the mirror-image gap. The rename touched both markers and both assertions.

**Fix:** Assert page-wide absence of the other app's marker once the route's own dialog is visible:

```ts
await expect(voterDialog).toBeVisible();
await expect(page.getByRole('dialog').filter({ hasText: '[notif-contestant]' })).toHaveCount(0);
```

### IN-04: The app-name search gate skips a tracked file it cannot read, without saying so

**File:** `scripts/assert-no-candidate-app-names.mjs:274-279`

**Issue:** `readFileSync` failures fall into `catch { continue; }`, so the file's contents are never scanned and the summary line still counts it as scanned (`scanned += 1` runs first). A tracked symlink to a directory, or any file that cannot be read, gets a pass with no output, which makes the gate fail open. The path itself is still matched.

**Fix:** Count and report the unreadable files on stderr, and fail in gate mode unless the error is `EISDIR` for a tracked symlink:

```js
} catch (e) {
  if (e?.code !== 'EISDIR') { console.error(`${SELF}: cannot read ${file}: ${e?.code}`); unreadable += 1; }
  continue;
}
// ...
process.exitCode = (findings > 0 || unreadable > 0) && !report ? 1 : 0;
```

### IN-05: The rename changed a public template key, and the comment justifying its retention names consumers that do not exist

**File:** `packages/dev-seed/src/templates/index.ts:67-68,101`

**Issue:** The template key `perm-disable-candidate-app` became `perm-disable-contestant-app`. It is a `yarn db:seed --template <name>` value, so any script or habit that used the old name now fails with an unknown-template error. The comment at line 101 says both legacy keys are "RETAINED above because setup consumers still resolve them". No setup, spec or script in the tree resolves either key (`git grep` finds only the template files, the index and one docs mention of `perm-disable-voter-app`). The rename kept a claim that was already false.

**Fix:** Either remove the two superseded templates and their exports, since `perm-access-disable` covers both modes, or correct the comment to say they are kept only as CLI conveniences, with no in-tree consumer.

---

_Reviewed: 2026-10-22T19:59:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
