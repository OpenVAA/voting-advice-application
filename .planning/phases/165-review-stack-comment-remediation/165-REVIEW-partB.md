---
phase: 165-review-stack-comment-remediation
reviewed: 2026-09-28T20:42:55Z
depth: standard
files_reviewed: 84
files_reviewed_list:
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
findings:
  critical: 0
  warning: 4
  info: 8
  total: 12
status: issues_found
---

# Phase 165: Code Review Report (Part B: apps/frontend)

**Reviewed:** 2026-09-28T20:42:55Z
**Depth:** standard
**Files Reviewed:** 84
**Status:** issues_found

## Summary

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

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The session memo is keyed on one token but verifies whatever token the client holds when `getUser()` runs

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

### WR-02: `organizationMatching: 'none'` is now also the silent fallback, so a stored `matching` object without the key switches off party matching

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

### WR-03: The local adapter answers an empty filter array where the Supabase adapter throws, so the two adapters disagree

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

### WR-04: The preregister page keeps a second, untyped copy of the provider keyword; an unknown keyword fails silently in the UI

**File:** `apps/frontend/src/routes/candidate/preregister/+page.svelte:82-115`
**Issue:** `redirectToIdentityProvider` compares `constants.PUBLIC_IDENTITY_PROVIDER_TYPE === 'idura-ftn'` as a raw string, and **every other value** takes the Signicat branch. That includes an old `idura` keyword, `''` and a typo. The keyword vocabulary now lives in `getActiveProvider` and in this page, and TypeScript cannot catch drift because `constants` is `string`.

With the old keyword, the server-side `/api/oidc/authorize` throws in `getActiveProvider` and answers 500. The page then only calls `console.error('Failed to get authorization URL')` and returns. So the fail-closed guarantee holds, but the user clicks "Identify yourself" and nothing happens: the silent same-page outcome that `authorize-fail-closed.test.ts` was written to eliminate.
**Fix:** Type the comparison against `ProviderType`, and branch on a known value rather than falling through:
```ts
const providerType = constants.PUBLIC_IDENTITY_PROVIDER_TYPE as ProviderType;
if (providerType !== 'idura-ftn' && providerType !== 'signicat-ftn') { /* show error, log */ return; }
```
Surface a visible error when `!response.ok`, not only a `console.error`.

## Info

### IN-01: The local nomination round filter treats NULL as round 1; the SQL does not

**File:** `apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts:89-92`
**Issue:** `(nomination.electionRound ?? 1) === electionRound` keeps a round-less nomination for round 1. `get_nominations` filters with `n.election_round = p_election_round`, and `nominations.election_round` is `integer DEFAULT 1` but nullable (`104-nominations.sql:54`), so an explicit NULL row is excluded there. The two agree only while no row stores NULL.
**Fix:** Either add `NOT NULL` to the column (Part A), or document the divergence in the local adapter.

### IN-02: `vite.projectIdEnv.ts` treats a whitespace-only shell value as set, and its key comment overstates what `loadEnv` does

**File:** `apps/frontend/vite.projectIdEnv.ts:4-6,32,48-49`
**Issue:**
- Only `=== ''` counts as empty. `PUBLIC_PROJECT_ID=' '` in the shell wins over the file value, and the adapter's `.trim()` then throws, which contradicts the "shell left it empty" intent.
- The comment says the keys are "named literally rather than matched by a prefix". But `loadEnv`'s third argument is a prefix list, so `loaded`, the return value, also carries any `PUBLIC_PROJECT_ID*`/`E2E_PROJECT_ID*` key. Only the write loop is literal.

**Fix:** Test `value.trim() === ''` in both places, and correct the comment to say the writes are literal.

### IN-03: A disabled NavItem is visually identical to an enabled one

**File:** `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:41-48`
**Issue:** The inlining dropped the old `!text-secondary` for disabled items. That preserves the rendered result, because the old unlayered `!important` lost to the layered `!text-neutral` and so never applied. The designed disabled colour is now gone from the code as well, and nothing but `pointer-events-none` distinguishes the state.
**Fix:** If a disabled cue is wanted, put it in `cn` so that it replaces the base colour, e.g. `disabled && '!text-secondary pointer-events-none hover:bg-transparent'`, and check its contrast.

### IN-04: A closed Alert stays in the accessibility tree and its buttons stay focusable (pre-existing, preserved)

**File:** `apps/frontend/src/lib/components/alert/Alert.svelte:89-104`
**Issue:** `!isOpen` only adds `translate-y-full opacity-0`. The `role="alert"`/`dialog` element and its close buttons remain in the tab order and exposed to screen readers while invisible. This is a WCAG 2.4.7/2.4.3 hazard, carried over unchanged from the old `.vaa-alert-hidden` class.
**Fix:** Add `invisible` (`visibility: hidden` also removes the element from focus and the a11y tree) with a delayed transition, or set `inert={!isOpen}`.

### IN-05: Expander keeps classes that never have an effect

**File:** `apps/frontend/src/lib/components/expander/Expander.svelte:123,129,149-151`
**Issue:**
- The content div renders only inside `{#if expanded}`, when the checkbox is always checked, so `peer-checked:` is always true.
- `peer-checked:py-md` repeats the `p-md` already on the element.
- Its `padding-block`, at (0,2,0), also overrides the `category` variant's `pt-lg`, so `pt-lg` is dead. It was dead before the inlining too.

**Fix:** Drop `peer`/`peer-checked:*` and decide whether `category` should get `pt-lg`. If so, keep `p-md` without the `peer-checked` padding.

### IN-06: The supabase-types boundary scan covers only `.ts`/`.svelte` under `src/`

**File:** `apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts:42-50`
**Issue:** `sourceFiles` skips `.js` files and everything outside `src/`: `vite.config.ts`, `svelte.config.js`, `vite.projectIdEnv.ts` and `apps/frontend/tests`. An import added there would not fail the boundary.
**Fix:** Root the scan at the workspace, skipping `node_modules`/`build`/`.svelte-kit`, and include `.js`/`.mjs`.

### IN-07: `validatePassword` is exported but used only by its test, and the rules run client-side only

**File:** `apps/frontend/src/lib/utils/password-validation/passwordValidation.ts:121`
**Issue:** After the move, no production code imports `validatePassword`; `PasswordValidator` uses `validatePasswordDetails`. Nothing server-side re-applies the rules, so a direct `updateUser` call bypasses them. This predates the move.
**Fix:** Either drop the export or use it where the password is submitted. Record that Supabase Auth's own password policy is the server-side enforcement.

### IN-08: The memo lives as long as `locals`, not as long as the request

**File:** `apps/frontend/src/lib/supabase/safeGetSession.ts:9,17`
**Issue:** The doc says "the memo must not outlive the request". But the closure hangs off `event.locals`, which the admin job features (`condenseArguments.ts`, `generateQuestionInfo.ts`) carry past the response. Those callers read the session once today. A later call from a long-running job would get a cached verification for a token revoked in the meantime.
**Fix:** State in the doc that `locals.safeGetSession` must not be called after the response, or clear the map once `resolve(event)` settles in `supabaseHandle`.

---

_Reviewed: 2026-09-28T20:42:55Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
