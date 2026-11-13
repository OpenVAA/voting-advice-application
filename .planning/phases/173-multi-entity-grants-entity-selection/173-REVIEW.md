---
phase: 173-multi-entity-grants-entity-selection
reviewed: 2026-10-22T19:57:41Z
depth: standard
files_reviewed: 143
files_reviewed_list:
  - "apps/docs/src/lib/navigation.config.ts"
  - "apps/frontend/eslint.config.mjs"
  - "apps/frontend/src/app.d.ts"
  - "apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.test.ts"
  - "apps/frontend/src/lib/api/adapters/supabase/utils/userEntities.ts"
  - "apps/frontend/src/lib/api/base/dataWriter.type.ts"
  - "apps/frontend/src/lib/api/base/universalDataWriter.ts"
  - "apps/frontend/src/lib/api/utils/translateLocalizedEntity.ts"
  - "apps/frontend/src/lib/auth/passwordLogin.test.ts"
  - "apps/frontend/src/lib/auth/roles.ts"
  - "apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte"
  - "apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.svelte.test.ts"
  - "apps/frontend/src/lib/contestant/components/contactSupport/ContactSupport.type.ts"
  - "apps/frontend/src/lib/contestant/components/contactSupport/index.ts"
  - "apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte"
  - "apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte.test.ts"
  - "apps/frontend/src/lib/contestant/components/nothingToEdit/index.ts"
  - "apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte"
  - "apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte.test.ts"
  - "apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.type.ts"
  - "apps/frontend/src/lib/contestant/gates/gates.test.ts"
  - "apps/frontend/src/lib/contestant/utils/loginError.ts"
  - "apps/frontend/src/lib/contestant/utils/userEntityDisplayName.test.ts"
  - "apps/frontend/src/lib/contestant/utils/userEntityDisplayName.ts"
  - "apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts"
  - "apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts"
  - "apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts"
  - "apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts"
  - "apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts"
  - "apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts"
  - "apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts"
  - "apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts"
  - "apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte"
  - "apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.type.ts"
  - "apps/frontend/src/lib/dynamic-components/entityCard/tests/EntityCard.svelte.test.ts"
  - "apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte"
  - "apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte.test.ts"
  - "apps/frontend/src/lib/i18n/tests/__mocks__/app-paths.ts"
  - "apps/frontend/src/lib/i18n/tests/translations.test.ts"
  - "apps/frontend/src/lib/layouts/main/Banner.svelte"
  - "apps/frontend/src/lib/routes/contestantHomeRoute.test.ts"
  - "apps/frontend/src/lib/routes/contestantHomeRoute.ts"
  - "apps/frontend/src/lib/routes/index.ts"
  - "apps/frontend/src/lib/routes/loginRedirectTarget.test.ts"
  - "apps/frontend/src/lib/routes/route.test.ts"
  - "apps/frontend/src/lib/routes/route.ts"
  - "apps/frontend/src/lib/routes/routeConsistency.test.ts"
  - "apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts"
  - "apps/frontend/src/lib/server/admin/requireAdminIdentity.ts"
  - "apps/frontend/src/lib/server/contestant/signOutToLogin.test.ts"
  - "apps/frontend/src/lib/server/contestant/signOutToLogin.ts"
  - "apps/frontend/src/params/contestantEntityPage.test.ts"
  - "apps/frontend/src/params/contestantEntityPage.ts"
  - "apps/frontend/src/params/servedEntityType.test.ts"
  - "apps/frontend/src/params/servedEntityType.ts"
  - "apps/frontend/src/params/uuid.test.ts"
  - "apps/frontend/src/params/uuid.ts"
  - "apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts"
  - "apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.server.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.tracking.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.server.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.tracking.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/+layout.server.ts"
  - "apps/frontend/src/routes/contestant/(protected)/+layout.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/+page.server.ts"
  - "apps/frontend/src/routes/contestant/(protected)/+page.svelte"
  - "apps/frontend/src/routes/contestant/(protected)/entitySelection.helpers.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/entitySelection.helpers.ts"
  - "apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/layout.tracking.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/loadTracking.testUtils.ts"
  - "apps/frontend/src/routes/contestant/(protected)/page.server.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/page.svelte.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/page.tracking.test.ts"
  - "apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts"
  - "apps/frontend/src/routes/contestant/help/+page.svelte"
  - "apps/frontend/src/routes/contestant/homeButton.svelte.test.ts"
  - "apps/frontend/src/routes/contestant/privacy/+page.svelte"
  - "apps/supabase/supabase/migrations/00001_initial_schema.sql"
  - "apps/supabase/supabase/schema/300-auth-tables.sql"
  - "apps/supabase/supabase/schema/301-auth-functions.sql"
  - "apps/supabase/supabase/schema/503-entity-rpcs.sql"
  - "apps/supabase/supabase/tests/database/10-schema-migrations.test.sql"
  - "apps/supabase/supabase/tests/database/18-entity-policies.test.sql"
  - "apps/supabase/supabase/tests/database/20-storage-authority.test.sql"
  - "apps/supabase/supabase/tests/database/21-entity-organization.test.sql"
  - "apps/supabase/supabase/tests/database/36-entity-identity.test.sql"
  - "packages/dev-seed/src/templates/e2e/base.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-disable-allow-open.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-hide-hero.ts"
  - "packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts"
  - "packages/dev-seed/tests/templates/base-app-settings.test.ts"
  - "packages/dev-seed/tests/templates/base.test.ts"
  - "packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts"
  - "packages/supabase-types/src/database.overrides.ts"
  - "scripts/assert-a11y-scan-wiring.mjs"
  - "scripts/assert-no-candidate-app-names.mjs"
  - "scripts/assert-project-scoped-queries.mjs"
  - "scripts/fixtures/assert-no-candidate-app-names.input.ts"
  - "tests/playwright.config.ts"
  - "tests/tests/fixtures/contestant/contestant-entity-selection.ts"
  - "tests/tests/fixtures/contestant/contestantEntitySelectionPage.fixture.ts"
  - "tests/tests/fixtures/contestant/contestantHomePage.fixture.ts"
  - "tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts"
  - "tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts"
  - "tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts"
  - "tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts"
  - "tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts"
  - "tests/tests/fixtures/shared/navMenu.fixture.ts"
  - "tests/tests/setup/contestant/entity-selection.setup.ts"
  - "tests/tests/setup/contestant/entity-selection.teardown.ts"
  - "tests/tests/setup/shared/auth.setup.ts"
  - "tests/tests/setup/shared/registerAndStoreSession.ts"
  - "tests/tests/specs/a11y/contestant-a11y.spec.ts"
  - "tests/tests/specs/contestant/contestant-entity-selection.spec.ts"
  - "tests/tests/specs/contestant/contestant-journey.spec.ts"
  - "tests/tests/specs/perm/perm-disable-allow-open.spec.ts"
  - "tests/tests/specs/perm/perm-localisation-positive.spec.ts"
  - "tests/tests/specs/visual/visual-regression.spec.ts"
  - "tests/tests/specs/voter/cold-entry-dataroot.spec.ts"
  - "tests/tests/specs/voter/voter-journey.spec.ts"
  - "tests/tests/utils/axeScan.ts"
  - "tests/tests/utils/buildRoute.test.ts"
  - "tests/tests/utils/buildRoute.ts"
  - "tests/tests/utils/contestantEntityUrl.test.ts"
  - "tests/tests/utils/contestantEntityUrl.ts"
  - "tests/tests/utils/rawKeyScan.ts"
  - "tests/tests/utils/supabaseAdminClient.ts"
  - "tests/tests/utils/testCredentials.ts"
  - "tests/tests/utils/testIds.ts"
  - "tests/vitest.config.ts"
findings:
  critical: 0
  warning: 1
  info: 5
  total: 6
status: issues_found
---

# Phase 173: Code Review Report

**Reviewed:** 2026-10-22T19:57:41Z
**Depth:** standard
**Files Reviewed:** 143
**Status:** issues_found

## Summary

This is a retroactive review of the multi-entity grants and entity selection phase. The code was read as it stands at HEAD, with attention on what the `(173-NN)` commits introduced (diff base `607d471fb`). Findings already recorded in `177.1-REVIEW.md` and `179-REVIEW.md` are not repeated. Test, fixture and E2E-harness files were read only for test reliability. Later phases have since rewritten much of the dataset, playwright config and dev-seed content.

The authorisation chain the phase built holds up under adversarial tracing. The caller controls the `[entityType]/[entityId]` params, and these checks stand between them and the data:

- **Route matchers.** `servedEntityType` and `uuid` are strict allowlist matchers, so an unknown type or a malformed id is a 404 before any load runs.
- **Entity-level load.** It awaits the user-level load and requires the `(type, id)` pair to be in the user's own served list before anything is read. Every refusal is one identical 307 to the app root, so the response does not reveal whether an id exists.
- **The read itself.** `get_entity_user_data` is SECURITY INVOKER. It filters on `project_id = p_project_id` and on `id IN private.caller_entity_ids(...)`. That helper reads `public.grants` for `auth.uid()` alone, editor role only, and checks the entity's project inline. RLS applies on top.
- **Nominations read.** `get_entity_nominations` uses the same editor-grant lookup.
- **Cross-project defence.** The adapter re-checks the row's `project_id`.
- **Writes.** The store targets `#savedData.entity`, which came from the server load, not from the URL. The nomination calls target `selectedEntity`, which is the URL pair intersected with the server list. Both still go through RLS.

No path lets a user with several grants read or write an entity they hold no grant for. Type confusion is also blocked: a uuid shared by a candidate and an organization is always matched on type and id together. There is no cross-project leak on the list or the one-entity read.

The one material defect is in the client-side draft persistence the phase reworked. Per-entity answer drafts in `localStorage` are keyed by entity alone and are swept only by the menu's logout. On a shared device, a later editor of the same organization can therefore have an earlier editor's unsaved answers restored into their editor. The remaining items are informational.

## Warnings

### WR-01: Per-entity answer drafts are not scoped to the user and survive every sign-out except the menu's logout, so one organization editor can inherit and save another's unsaved answers

**File:** `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:27-35, 320-339`. Related: `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts:525-536` and `apps/frontend/src/lib/server/contestant/signOutToLogin.ts:16-32`.

**Issue:** `editedAnswersKey` builds the draft key as `contestantContext-userData-editedAnswers-<type>-<id>`. It contains no user id. `init()` builds a `localStorageState` for that key and restores whatever is stored there. The only code that removes these keys is `reset()`, and its only caller is `ContestantContext.#logout`, i.e. the Log Out button in the menu.

The drafts are not swept in any of these cases:

- Every server-side sign-out goes through `signOutToLogin`: a failed user-data read, a failed entity-list read, or a failed entity read. The client context's `#reset` never runs on that path.
- The session expires.
- The tab or browser is closed while signed in.

`idx_grants_one_candidate_editor` allows one editor per candidate, but an organization admits several editors. Consider two editors of organization X on a shared device such as a party office machine:

1. Editor A types answers for X and leaves without pressing Log Out, or is signed out by the server.
2. Editor B signs in on the same browser and opens X.
3. `init()` restores A's draft. B's editor shows those answers as B's own unsaved edits, and B's next Save writes them under B's session.

The phase made this reachable by design: it introduced multi-editor organizations into the Contestant App and moved drafts to per-entity keys that are deliberately kept across entity switches. RLS is not crossed, because B is a legitimate editor of X. But the data written is not B's, and B gets no indication of that. The same applies to a user whose grant was removed and then re-added.

**Fix:** Scope each draft to the signed-in user, and sweep other users' drafts when a user is seen. For example:

```ts
// contestantUserDataState.svelte.ts
export function editedAnswersKey(
  { type, id }: Pick<LocalizedEntityData, 'type' | 'id'>,
  userId: string
): string {
  return `${EDITED_ANSWERS_KEY_STEM}-${userId}-${type}-${id}`;
}

init = (data: ContestantUserData<true>, userId: string): void => {
  // Drafts another account left in this browser are never restored.
  removeOtherUsersDrafts(userId); // removePersistedByPrefix over the stem, keeping `${STEM}-${userId}-`
  const key = editedAnswersKey(data.entity, userId);
  ...
};
```

In the entity layout, pass `page.data.user.id`, which the protected load already returns as `user`. In addition, or as a smaller first step, sweep `${EDITED_ANSWERS_KEY_STEM}-` when the login screen mounts. That covers every sign-out path, the server-side ones included.

## Info

### IN-01: A revoked editor grant keeps write access from an already-open entity page until the token is reissued

**File:** `apps/supabase/supabase/schema/301-auth-functions.sql:789-806` (`private.caller_entity_ids`) versus the entity-table UPDATE policies that call `user_can`. Pinned by `apps/supabase/supabase/tests/database/36-entity-identity.test.sql` ("a grant removed from the table is not listed although the token still carries it", plus its direct-read control).

**Issue:** The list and the one-entity read come from `public.grants`. Writes (`upsert_answers`, the property UPDATE, Storage uploads) are authorised by the JWT `grants` claim. Suppose a grant is removed while the user has the entity open. The server loads stop serving that entity on the next navigation. But the store already holds the entity, and `save()` keeps succeeding through the browser client until the access token is refreshed.

pgTAP deliberately pins this as the behaviour of the claim-based policy design. It is not a regression of this phase. It is recorded here because the phase made "the list is read from the table" a selling point, and a reader may assume revocation is immediate.

**Fix:** None is required for this phase. If revocation must take effect at once, the write policies would need to consult `public.grants`, as `caller_entity_ids` does. Alternatively, the revoking path could force a token refresh, or revoke the user's sessions.

### IN-02: The `uuid` matcher admits upper-case ids, but entity membership is compared case-sensitively

**File:** `apps/frontend/src/params/uuid.ts:4`, `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts:42`, `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts:139-144`

**Issue:** `CANONICAL_UUID` has the `/i` flag. Postgres renders uuids in lower case, however, and both the load's `listed` lookup and the context's `#selectedEntity` compare `entity.id === entityId` exactly. A hand-typed or upper-cased link to the user's own entity is therefore treated as "not listed" and redirected to the app root. This fails closed, so there is no authorisation impact, only a confusing redirect for a valid link.

**Fix:** Either drop the `i` flag, so that a non-canonical form is a 404, or normalise before comparing, e.g. `entity.id === entityId.toLowerCase()` in both places. Alternatively, redirect to the lower-cased URL.

### IN-03: A signed-in user with no entity has no way to reach account settings

**File:** `apps/frontend/src/lib/routes/route.ts` (`ContestantAppSettings: \`${CONTESTANT_ENTITY}/settings\``), `apps/frontend/src/params/contestantEntityPage.ts:4`, `apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts:54`, `apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte:72-75`

**Issue:** The settings page holds account-level functions: the password change, the pending-address resend, and replacing the address. It is mounted only under an entity URL. `/contestant/settings` resolves through the entity-less route, which redirects to the app root for any user who does not have exactly one entity. The `NothingToEdit` view offers only support and logout. So a user whose grants were all removed, or who is still waiting for one, cannot change their password or fix their pending address from within the app.

**Fix:** If this is intended, document it in the `NothingToEdit` component docs. Otherwise, serve settings outside the entity tree for users with zero or several entities, for example at `${CONTESTANT_PROT}/settings`, and link to it from `NothingToEdit`.

### IN-04: `triggerLogout`'s direct path does not catch a rejected logout

**File:** `apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte:58-72`

**Issue:** `handleLogout` catches and logs a failed `logout()`, but the `else` branch of `triggerLogout` awaits `logout()` bare. The phase widened that branch: it now runs for every page with no loaded entity, which includes the `NothingToEdit` view and the selection screen. A failing sign-out there therefore produces an unhandled rejection with nothing logged. The bare await itself pre-dates the phase.

**Fix:**

```ts
} else {
  await logout().catch((e) => log.error(`Error logging out: ${e?.message}`));
}
```

### IN-05: Comment-hygiene residue in comments the phase edited

**File:**
- `apps/frontend/eslint.config.mjs:32`: a `158-MOSTLY-PERMANENT` planning tag, added in 173-07.
- `apps/frontend/src/lib/server/admin/requireAdminIdentity.ts:30, 32`: "it would also trip the criterion-9 count" and "The vocabulary itself moved in phase 162: ...". 173-05 edited line 30 and left both in place.
- `apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:429-431`: decision ids "decision E1", "decision B3", "decision C4 NOTE 1" and "decision B4(a)". These pre-date the phase, but sit in a block that 173-03 edited.

**Issue:** CLAUDE.md § Comment Hygiene forbids planning references beyond a bare `see phase N`, forbids decision ids, and forbids historical narrative. These lines survive in comments the phase touched.

**Fix:** Restate each comment as the current behaviour, without the plan tags, decision ids or phase history. For example, line 32 becomes "ONE site, a bare `locals.supabase.auth.signOut()` on the request's own cookie-bearing client; every sign-out of the Contestant App's protected loads goes through this helper."

---

_Reviewed: 2026-10-22T19:57:41Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
