---
phase: 179-identity-provider-registration-coverage-close
reviewed: 2026-10-22T16:10:46Z
depth: standard
files_reviewed: 201
files_reviewed_list:
  - apps/docs/src/lib/navigation.config.ts
  - apps/frontend/eslint.config.mjs
  - apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts
  - apps/frontend/src/lib/analytics/pageviewRoutes.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/frontend/src/lib/api/base/universalApiRoutes.ts
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
  - apps/frontend/src/lib/api/dataProvider.ts
  - apps/frontend/src/lib/api/dataWriter.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
  - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts
  - apps/frontend/src/lib/api/utils/auth/oidcFailure.ts
  - apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts
  - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
  - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
  - apps/frontend/src/lib/api/utils/auth/providers/types.ts
  - apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte
  - apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte
  - apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/emailField/EmailField.type.ts
  - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.svelte
  - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.type.ts
  - apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte
  - apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte.test.ts
  - apps/frontend/src/lib/contestant/gates/gates.test.ts
  - apps/frontend/src/lib/contestant/gates/gates.ts
  - apps/frontend/src/lib/contestant/gates/gateViews.ts
  - apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte
  - apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte.test.ts
  - apps/frontend/src/lib/contestant/utils/identityProviderAccount.test.ts
  - apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts
  - apps/frontend/src/lib/contestant/utils/loginError.test.ts
  - apps/frontend/src/lib/contestant/utils/loginError.ts
  - apps/frontend/src/lib/contestant/utils/oidcError.test.ts
  - apps/frontend/src/lib/contestant/utils/oidcError.ts
  - apps/frontend/src/lib/contestant/utils/pendingAddressResend.svelte.test.ts
  - apps/frontend/src/lib/contestant/utils/pendingAddressResend.svelte.ts
  - apps/frontend/src/lib/contestant/utils/registrationOffer.test.ts
  - apps/frontend/src/lib/contestant/utils/registrationOffer.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
  - apps/frontend/src/lib/cookies/cookies.test.ts
  - apps/frontend/src/lib/cookies/index.ts
  - apps/frontend/src/lib/i18n/tests/translations.test.ts
  - apps/frontend/src/lib/routes/appGates.test.ts
  - apps/frontend/src/lib/routes/appGates.ts
  - apps/frontend/src/lib/routes/route.ts
  - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
  - apps/frontend/src/lib/server/constants.ts
  - apps/frontend/src/lib/server/contestant/identityProviderRegistration.test.ts
  - apps/frontend/src/lib/server/contestant/identityProviderRegistration.ts
  - apps/frontend/src/lib/server/contestant/registrationGuard.test.ts
  - apps/frontend/src/lib/supabase/anon.ts
  - apps/frontend/src/lib/supabase/universal.ts
  - apps/frontend/src/lib/types/generated/translationKey.ts
  - apps/frontend/src/lib/utils/constants.ts
  - apps/frontend/src/lib/utils/leaveFor.ts
  - "apps/frontend/src/routes/(voters)/(located)/+layout.server.ts"
  - apps/frontend/src/routes/+layout.server.ts
  - "apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.server.ts"
  - "apps/frontend/src/routes/admin/(protected)/layout.server.test.ts"
  - "apps/frontend/src/routes/admin/(protected)/question-info/+layout.server.ts"
  - apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts
  - apps/frontend/src/routes/api/auth/callback/+server.ts
  - apps/frontend/src/routes/api/auth/callback/server.test.ts
  - apps/frontend/src/routes/api/contestant/identity-provider/+server.ts
  - apps/frontend/src/routes/api/oidc/authorize/+server.ts
  - apps/frontend/src/routes/api/oidc/callback/+server.ts
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/page.svelte.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/+layout.server.ts"
  - "apps/frontend/src/routes/contestant/(protected)/identityProviderLayout.svelte.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/layout.tracking.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/setPasswordLayout.svelte.test.ts"
  - apps/frontend/src/routes/contestant/login/+page.svelte
  - apps/frontend/src/routes/contestant/login/page.svelte.test.ts
  - apps/frontend/src/routes/contestant/password-reset/+page.server.ts
  - apps/frontend/src/routes/contestant/password-reset/page.server.test.ts
  - apps/frontend/src/routes/contestant/register/+page.svelte
  - apps/frontend/src/routes/contestant/register/identity-provider/error/+page.server.ts
  - apps/frontend/src/routes/contestant/register/identity-provider/error/+page.svelte
  - apps/frontend/src/routes/contestant/register/identity-provider/error/page.server.test.ts
  - apps/frontend/src/routes/contestant/register/identity-provider/error/page.svelte.test.ts
  - apps/frontend/src/routes/contestant/register/page.svelte.test.ts
  - apps/frontend/src/routes/layout.server.test.ts
  - apps/supabase/supabase/functions/account-access/addressConfirmation.test.ts
  - apps/supabase/supabase/functions/account-access/addressConfirmation.ts
  - apps/supabase/supabase/functions/account-access/contract.test.ts
  - apps/supabase/supabase/functions/account-access/contract.ts
  - apps/supabase/supabase/functions/account-access/flowConformance.test.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/account-access/mailTemplates.test.ts
  - apps/supabase/supabase/functions/account-access/mailTemplates.ts
  - apps/supabase/supabase/functions/account-access/placeholderAddress.ts
  - apps/supabase/supabase/functions/account-access/signInLink.test.ts
  - apps/supabase/supabase/functions/account-access/signInLink.ts
  - apps/supabase/supabase/functions/identity-callback/appMetadata.test.ts
  - apps/supabase/supabase/functions/identity-callback/appMetadata.ts
  - apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts
  - apps/supabase/supabase/functions/identity-callback/candidateRecord.ts
  - apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts
  - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
  - apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts
  - apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/identity-callback/organizationRecord.test.ts
  - apps/supabase/supabase/functions/identity-callback/organizationRecord.ts
  - apps/supabase/supabase/functions/identity-callback/ownEntity.test.ts
  - apps/supabase/supabase/functions/identity-callback/ownEntity.ts
  - apps/supabase/supabase/functions/identity-callback/placeholderAddress.test.ts
  - apps/supabase/supabase/functions/identity-callback/placeholderAddress.ts
  - apps/supabase/supabase/functions/identity-callback/registrationMatrix.test.ts
  - apps/supabase/supabase/functions/identity-callback/registrationMatrix.ts
  - apps/supabase/supabase/functions/identity-callback/requestContract.test.ts
  - apps/supabase/supabase/functions/identity-callback/requestContract.ts
  - apps/supabase/supabase/functions/identity-callback/serverCredential.test.ts
  - apps/supabase/supabase/functions/identity-callback/serverCredential.ts
  - apps/supabase/supabase/functions/identity-callback/verificationLogPrivacy.test.ts
  - apps/supabase/supabase/migrations/00002_claim_excludes_identity_provider_accounts.sql
  - apps/supabase/supabase/migrations/00003_address_confirmation_request.sql
  - apps/supabase/supabase/migrations/00004_user_entities_pending_email_taken.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/36-entity-identity.test.sql
  - apps/supabase/supabase/tests/database/39-invitations.test.sql
  - apps/supabase/supabase/tests/database/48-address-confirmation-request.test.sql
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/e2e/perm/identity-provider.ts
  - packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-not-located-2e2cg.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/tests/projectScopingGate.test.ts
  - packages/supabase-types/src/database.ts
  - scripts/assert-a11y-scan-wiring.mjs
  - scripts/assert-e2e-coverage-tags.mjs
  - scripts/assert-no-preregister.mjs
  - scripts/assert-project-scoped-queries.mjs
  - scripts/assert-test-keys-scope.mjs
  - scripts/fixtures/assert-no-preregister.input.ts
  - scripts/fixtures/project-scoped-queries/clean.fixture.ts
  - scripts/fixtures/project-scoped-queries/outside-boundary.clean.fixture.ts
  - tests/global-setup.ts
  - tests/playwright.config.ts
  - tests/scripts/e2e-evidence.mjs
  - tests/scripts/e2e-run.sh
  - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantEntityPages.fixture.ts
  - tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantIdentityProviderError.fixture.ts
  - tests/tests/fixtures/contestant/contestantIdentityProviderGate.fixture.ts
  - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts
  - tests/tests/fixtures/contestant/contestantSettingsPage.fixture.ts
  - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
  - tests/tests/helpers/index.ts
  - tests/tests/helpers/navigation.ts
  - tests/tests/setup/contestant/identity-provider.setup.ts
  - tests/tests/setup/contestant/identity-provider.teardown.ts
  - tests/tests/setup/shared/assertTeardown.ts
  - tests/tests/setup/shared/base.setup.ts
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
  - tests/tests/specs/admin/admin-access.spec.ts
  - tests/tests/specs/contestant/contestant-bank-auth.spec.ts
  - tests/tests/specs/contestant/contestant-code-registration.spec.ts
  - tests/tests/specs/contestant/contestant-email-registration.spec.ts
  - tests/tests/specs/contestant/contestant-entity-selection.spec.ts
  - tests/tests/specs/contestant/contestant-entry-phone.spec.ts
  - tests/tests/specs/contestant/contestant-entry-scan.spec.ts
  - tests/tests/specs/contestant/contestant-identity-provider.spec.ts
  - tests/tests/specs/perm/perm-closed-project.spec.ts
  - tests/tests/support/mockOidcIssuer.ts
  - tests/tests/support/mockOidcIssuerEntry.ts
  - tests/tests/utils/buildTestIdToken.test.ts
  - tests/tests/utils/buildTestIdToken.ts
  - tests/tests/utils/mailedLink.test.ts
  - tests/tests/utils/mailedLink.ts
  - tests/tests/utils/mockOidcIssuer.test.ts
  - tests/tests/utils/privacyAllowlists.test.ts
  - tests/tests/utils/privacyAllowlists.ts
  - tests/tests/utils/supabaseAdminClient.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 1
  warning: 2
  info: 6
  total: 9
status: issues_found
---

# Phase 179: Code Review Report

**Reviewed:** 2026-10-22T16:10:46Z
**Depth:** standard
**Files Reviewed:** 201 in scope (see the coverage note below)
**Status:** issues_found

## Summary

The review covers the code the 130 `(179-NN)` commits changed between `c5e134ecf` and `HEAD`. Each commit's diff was read rather than the whole `c5e134ecf..HEAD` diff, because that range also carries other workstreams' changes.

**Coverage.** These were read in full, and their callees traced:
- the `identity-callback` and `account-access` Edge Functions (`index.ts` and every helper module phase 179 added);
- the three migrations and the schema hunks they mirror;
- the SvelteKit OIDC authorize and callback routes, the auth callback's `email_change` arm, the identity-provider registration endpoint and its handler;
- the data writer's `getBasicUserData` and `requestAddressConfirmation` changes;
- the gate list, the protected layout load, `IdentityProviderGate.svelte`, the pending-address reminder on the home and settings pages, and the error screen's load;
- the E2E wrapper's identity-provider preparation, the identity-provider teardown and the admin-client helper it calls.

The remaining test files, fixtures and guard scripts were only scanned: for test-reliability defects, and for comment-hygiene violations across all of phase 179's added lines.

**Overall.** The server credential, the closed result sets, the no-claims `app_metadata` and the log redaction hold up under tracing. The verdict rests on one finding: the throttle that bounds `confirm-address`, the only operation that mails a caller-typed address, keys on a project id the caller chooses freely. The throttle is therefore void.

**Not re-reported.** The residuals listed in `179-CARRIED-ITEMS.md` (the settings read in four places, `UUID_PATTERN` in four copies, user paging, the uncompared nonce, the fourth verifier copy, the compensating delete, the unenforced verification budget, the accepted auth-service oracle) are not repeated here. WR-01 adds something new about the known simultaneous-first-sign-in race.

## Critical Issues

### CR-01: `confirm-address` throttle is keyed on a caller-chosen `project_id`, so any identity-provider account can mail any address without limit

**File:** `apps/supabase/supabase/functions/account-access/addressConfirmation.ts:144`, `apps/supabase/supabase/migrations/00003_address_confirmation_request.sql:22-35` (same body in `schema/506-invitation-rpcs.sql`), `apps/supabase/supabase/functions/account-access/contract.ts:233-237`

**Issue:** The `confirm-address` operation has two bounds, both documented in `contract.ts` and in the migration's header:
- the caller's slot, `confirm:<project id>:<user id>`, at 10 per 15 minutes;
- the address's slot, `link:<project id>:<hash>`, at 1 per 60 seconds.

Both keys include `p_project_id`, and that value comes straight from the request body (`request.projectId`). The contract checks only that it is a UUID. Nothing asks whether:
- the project exists;
- the caller holds anything in it;
- the account's `registered_entities` names it.

The mail itself does not depend on the project (`renderAddressConfirmationMail(locale, link)`), and the address change it starts is account-wide.

**Effect:** a signed-in identity-provider account that is still on its placeholder can send one request per random UUID and get fresh slots every time. That lifts both bounds entirely:
- **Mail bombing.** Unlimited confirmation mails from the deployment's sender to any victim address.
- **Unbounded `in-use` probing.** Unlimited address-existence probing through the `in-use` answer, which the contract presents as bounded "ten such requests per project per quarter hour" (and the accepted-risk decision leaned on this operation keeping its own guarantee).
- **Shared verification budget.** Each request also spends a `POST /auth/v1/verify` from the edge runtime's address. Where that limit is enforced, one account can starve the budget for every other user's confirmations.
- **Table growth.** Unbounded rows in `private.invitation_throttle`.

**Fix:** key the account's slot on the account alone, and refuse a project the account does not belong to before any slot is taken. Either one closes the bypass; doing both keeps the documented semantics:
```sql
-- 00003 / 506: the caller's slot does not depend on the project
IF NOT private.invitation_throttle_take(
  'confirm:' || p_user_id::text, 10, interval '15 minutes') THEN
  RETURN false;
END IF;
-- and the address's slot, for this operation, likewise project-independent, e.g.
-- 'confirm-addr:' || encode(sha256(convert_to(v_email, 'UTF8')), 'hex')
```
```ts
// addressConfirmation.ts, after mayAsk(account): the account must have registered in the named project
if (!registeredProjectsOf(account.appMetadata).includes(request.projectId)) return 'refused';
```
`callerAccount` already reads `app_metadata`. It would need to return the `registered_entities` keys alongside `identityProvider`. Add a pgTAP case showing that two different project ids for one user share one budget.

## Warnings

### WR-01: `identity-callback`'s `email_exists` branch resets an existing account's record, and compares the placeholder case-sensitively

**File:** `apps/supabase/supabase/functions/identity-callback/index.ts:184-190`, `index.ts:296-319`

**Issue:** When the identity is not found by `identity_match_value`, the function invites the placeholder address. On `email_exists` it falls back to `findUserByPlaceholderAddress`. Two defects sit on that path.

1. **The found account's record is overwritten.** Line 308 always writes `identityAppMetadata({ ..., registeredEntities: {} })`, and line 319 sets `appMetadata = null`, whatever the found account already holds. Suppose two first sign-ins of one identity overlap (the race carried as "nothing serialises them"):
   - Request A has confirmed the account and written its record and grant.
   - Request B reaches `email_exists`, finds A's account, and wipes A's `registered_entities`.
   - B then creates a second entity.

   A's entity keeps a live editor grant, but no record names it. So `resolveOwnEntity` can never return it, and the account now edits two entities. The known item says each request "could create an entity". It does not say the second request also destroys the first one's record.
2. **The comparison is exact on case.** It is `user.email === placeholderAddress`. The auth service stores addresses lower-cased, and the address is built from the provider's `sub` verbatim (`placeholderAddressFor`). For a provider whose `sub` contains upper-case letters, the fallback never matches. That account then fails with `ERR_ACCOUNT_CREATE_FAILED` (answered `unavailable`) on every attempt, and nothing repairs it. `isPlaceholderAddress` in the same modules already normalises case, so the lookup is inconsistent with its own helpers.

**Fix:**
```ts
function findUserByPlaceholderAddress(supabaseAdmin: any, placeholderAddress: string) {
  const wanted = placeholderAddress.trim().toLowerCase();
  return findUser(supabaseAdmin, (user) => user.email?.trim().toLowerCase() === wanted);
}
// ...
account = inviteError ? await findUserByPlaceholderAddress(...) : invited?.user;
if (inviteError && account?.app_metadata?.identity_match_value === matchValue) {
  // Another request already finished creating this account: keep its record.
  appMetadata = account.app_metadata;
} else {
  /* confirm + write the empty record, as now */
}
```
Serialising first sign-ins outright (an advisory lock keyed on the match value, taken through an RPC) would also close the remaining duplicate-entity window.

### WR-02: A verification of the current-address token that completes the change is treated only as a refusal, and the unproved address stays on the account

**File:** `apps/supabase/supabase/functions/account-access/addressConfirmation.ts:160`, `addressConfirmation.ts:229-239`, `apps/supabase/supabase/functions/account-access/index.ts:304-315`

**Issue:** The design relies on the auth service's secure (double) email change, under which verifying the current address's token only records the first confirmation. `isSingleConfirmation` names the other outcome itself: "A session would mean the change of address had completed without the mailed link."

When that happens, `verifyCurrent` throws. `confirmAddress` logs, gives back the slot and answers `refused`. But the auth service has already moved the account to the typed address, and nobody proved that address. Nothing rolls this back. That outcome arises:
- on any deployment where "Secure email change" is turned off: only `config.toml` sets `double_confirm_changes = true`, nothing documents it as required for hosted projects, and no deployment check reads it;
- on any future auth-service behaviour change.

On such a deployment, an identity-provider account can take any unregistered address without proving it. The real owner is then refused (`in-use`) when registering. Sign-in mails for that address (`request-link`, since the squatting account holds a grant in the project) would sign the owner into the squatter's account.

**Fix:** when the verification answers a session, restore the placeholder before refusing, and treat the setting as a required deployment setting:
```ts
async verifyCurrent(tokenHash) {
  // ... as now ...
  if (!isSingleConfirmation(response.status, verified)) {
    if (verified && typeof verified === 'object' && 'access_token' in verified) {
      await admin().auth.admin.updateUserById(userId, { email: placeholderAddress, email_confirm: true });
    }
    throw new Error('The current address was not confirmed alone.');
  }
}
```
Pass the user id and placeholder into the dependency. Also add "Secure email change must be on" to the hosted-settings checklist and the edge-functions page.

## Info

### IN-01: The registration endpoint saves a party's names while answers are locked

**File:** `apps/frontend/src/lib/server/contestant/identityProviderRegistration.ts:145-160`, `:196-198`

**Issue:** The gate asks for the name only while answers are unlocked (`gates.ts:68`, `IdentityProviderGate.svelte:88`). The authorize and OIDC callback endpoints check the lock on the server. This endpoint's `save` intent does not: a direct POST writes the names while answers are locked. The database does not enforce the lock on entity columns either, so this is a consistency gap rather than a privilege escalation.

**Fix:** read `access.answersLocked` through the request's data provider in the route, and answer `failed` for a `name` while it is true.

### IN-02: The `save` intent accepts names of any size and any keys

**File:** `apps/frontend/src/lib/server/contestant/identityProviderRegistration.ts:95-97`, `:110-118`

**Issue:** `isLocalizedString` accepts any object of strings. There is no bound on the number of keys or their length, and keys need not be supported locales. `normalizeLocalizedName` only trims. The email has a bound (`MAX_EMAIL_LENGTH`), so the name could reasonably have one too.

**Fix:** keep only `staticSettings.supportedLocales` keys and bound each entry, for example to 200 characters.

### IN-03: `deleteOrganization`'s docs name only the grant write as its trigger

**File:** `apps/supabase/supabase/functions/identity-callback/organizationRecord.ts:75-77`

**Issue:** The docs say the organization is deleted "when the grant naming it could not be written". `index.ts:361-373` also deletes it when the record write fails, which `candidateRecord.ts:77` describes correctly ("the grant or the record").

**Fix:** align the wording with `deleteCandidate`'s.

### IN-04: Comment-hygiene residue in a phase-179-edited comment

**File:** `tests/playwright.config.ts:1347`

**Issue:** The rewritten comment says the dependency edge exists "for the same reason recorded there by explicit operator decision". The comment it points to (`:285`) no longer records any operator decision, so the reference dangles, and "by explicit operator decision" is decision narrative.

**Fix:** state the reason itself (the `app_settings` singleton needs the serial chain), and drop the provenance.

### IN-05: `IdentityProviderGate`'s Log Out stays in its loading state if `logout()` rejects

**File:** `apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte:237-241`

**Issue:** `loggingOut` is reset only after a successful `await logout()`. A rejection leaves the button spinning, with an unhandled rejection.

**Fix:** `try { await logout(); } finally { loggingOut = false; }`

### IN-06: The OIDC callback leaves the flow cookies in place on the provider-error and missing-code paths

**File:** `apps/frontend/src/routes/api/oidc/callback/+server.ts:57-59`

**Issue:** Only the entity-type cookie is removed before these two early redirects. `oidc_state`, `oidc_nonce` and `oidc_code_verifier` remain until their 600 s expiry. The module's own docs say a rejected callback "cannot be retried against the same flow state", but that clearing (`clearFlowCookies`) is applied only on the binding failures. The risk is low, because a replay still needs a code bound to that state or verifier.

**Fix:** call `clearFlowCookies(cookies)` before both early redirects.

---

_Reviewed: 2026-10-22T16:10:46Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
