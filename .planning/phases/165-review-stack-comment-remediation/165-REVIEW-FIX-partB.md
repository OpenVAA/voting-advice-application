---
phase: 165-review-stack-comment-remediation
fixed_at: 2026-09-29T06:06:59Z
review_path: .planning/phases/165-review-stack-comment-remediation/165-REVIEW.md
scope: Part B only (B-WR-01..04, B-IN-01..08), fix_scope all
iteration: 1
findings_in_scope: 12
fixed: 11
skipped: 0
no_change_needed: 1
status: all_fixed
---

# Phase 165: Code Review Fix Report (Part B)

**Fixed at:** 2026-09-29T06:06:59Z
**Source review:** `165-REVIEW.md`, Part B (detail in `165-REVIEW-partB.md`)
**Iteration:** 1
**Branch:** `ship/v2.15-13-review-fixes`, main working tree. `workflow.use_worktrees` is `false`, so no worktree was created. Every gate below ran in the main checkout, and the numbers can be reproduced from this tree.

**Summary:**
- Findings in scope: 12 (4 warnings, 8 info)
- Fixed: 11, in 11 commits from `ee3e923e6` to `a12f727f9`, one per finding
- No change needed: 1 (B-IN-03, which restates a maintainer ruling)
- Skipped: 0

Four fixes change logic or behaviour that the unit tests cover only in part, so they are marked **requires human verification**: B-WR-01, B-WR-02, B-WR-04 and B-IN-08. B-IN-05's rendering parity rests on a cascade argument checked against the built CSS, not on a measured before/after comparison.

## Fixed Issues

### B-WR-01: The session memo is keyed on one token but verifies whatever token the client holds when `getUser()` runs

**Status:** fixed: requires human verification (security-sensitive; the login journeys are covered by the orchestrator's E2E re-gate)
**Files modified:** `apps/frontend/src/lib/supabase/safeGetSession.ts`, `apps/frontend/src/lib/supabase/safeGetSession.test.ts`, `apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts` (comment only)
**Commit:** `ee3e923e6`

**Verification of the race (done first, as instructed).** I read the installed `@supabase/auth-js` 2.99.3, `node_modules/@supabase/auth-js/src/GoTrueClient.ts`:
- `getUser(jwt)` returns `_getUser(jwt)` straight away. That path sends exactly `jwt` to `GET /user` and never touches storage on success.
- `getUser()` with no argument takes the storage lock, then `_getUser()` → `_useSession()` → `__loadSession()`. That **re-reads storage**. If the stored session is inside `EXPIRY_MARGIN_MS` (3 ticks × 30 s = **90 s**, `lib/constants.ts`), it calls `_callRefreshToken()` and verifies the **new** access token. On success it sets `suppressGetSessionWarning = true`.
- `getSession()` runs the same `__loadSession()`.

So when the stored token crosses into the 90 s margin between the helper's `getSession()` and its `getUser()`, `getUser()` refreshes, verifies token B and returns B's user. The old helper returned `{ session: A, user }` and memoised A as verified. The cookie is attacker-controlled, and `expires_at` in the stored session JSON is set independently of the JWT. An attacker can therefore aim at that window with a forged A paired with a valid refresh token. `readGrants(session.access_token)` in `roles.ts` would then decode an unverified A without checking its signature. **The race is real.** It is narrow, but it can be aimed at.

**Also found:** 165-19 kept the no-argument call for three reasons. One of them, "passing the token would skip the revoked-session cleanup inside `_getUser()`", is not true of 2.99.3. The `try/catch` that calls `_removeSession()` on `AuthSessionMissingError` wraps the `jwt` path too, and `lib/fetch.ts` maps `session_not_found` to that error. The other two reasons (the lock, and the warning suppression) hold.

**Applied fix.** The fix keeps the no-argument `getUser()`, so the lock, the warning suppression and the cleanup all stay. It re-keys on the token that was actually verified:
- After a successful `getUser()`, `verifyStored` calls `getSession()` again. The user is paired only when storage still holds the token the memo was keyed on. A refresh always rotates the access token, so a matching token means `getUser()` verified that token.
- On a mismatch the verification resolves to a private `REPLACED` sentinel, which is evicted from the memo. `safeGetSession` then starts over with the new session. After a refresh the new token has a full lifetime, so a second attempt matches. `MAX_ATTEMPTS = 2`: a second replacement in one call returns nulls.

This costs one extra `getSession()` per verification: a cookie read under the lock, and a network call only if that read itself refreshes. A per-call memo hit adds nothing.

**Tests.** The fake client became storage-backed. Two new cases:
- `pairs the user only with the token getUser() verified when it refreshes the session mid-verification`: `getUser` rotates storage to token-b. The helper must return token-b, and a second call hits the memo on token-b.
- `returns nulls when every verification replaces the token it was asked to verify`.

**RED** against the old helper: 3 failed / 6 passed. The race case received `{ session: token-a, user }`. The rotation case received a paired session. The call-count case expected 3 `getSession` reads and saw 2. **GREEN**: 9/9. The `requireAdminIdentity.test.ts` note that lists what its hand-copied `safeGetSession` omits now also names the re-read.

### B-WR-02: `organizationMatching: 'none'` is now also the silent fallback

**Status:** fixed: requires human verification (a logic change in the voter matching path)
**Files modified:** `apps/frontend/src/lib/utils/organizationMatching.ts` (new), `apps/frontend/src/lib/utils/organizationMatching.test.ts` (new), `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`, `apps/frontend/src/routes/(voters)/about/+page.svelte`
**Commit:** `2b6ee8afb`
**Applied fix:**
- `resolveOrganizationMatching(value)` keeps `'none'`, `'answersOnly'` and `'impute'`. An explicit `'none'` still means no party scores, per D-15.
- A missing, `null` or `''` value falls back to `dynamicSettings.matching.organizationMatching`, the shipped default (`'impute'`), silently.
- Any other value falls back as well, and is logged once per distinct value with `log.warn`.
- `#parentMatchingMethod` in `voterContext.svelte.ts` now derives from the resolver instead of `|| 'none'`.

The About page's organization-matching disclosure read the raw setting. It now reads the same resolved method, so the text describes the method the matcher actually uses. It still hides when the method is explicitly `'none'`, which the `perm-org-matching` spec's `none` mode relies on.

The resolver is in `$lib/utils`, not in app-shared, so no package rebuild is needed. The underlying root-key merge defect (`mergeAppSettings` TODO) is untouched. Tests: 3 cases (the vocabulary kept; the default, not `'none'`, for missing/null/empty with no warning; one warning for a repeated unknown value).

### B-WR-03: The local adapter answers an empty filter array where the Supabase adapter throws

**Files modified:** `apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts`, `…/localServerDataProvider.test.ts`
**Commit:** `ef8f372b7`
**Applied fix:**
- A module-level `assertNonEmpty` rejects an empty `electionId` or `constituencyId` array at the top of `getNominationData` and `getQuestionData`. Its message has the same shape as `convertFilterValue`'s.
- `getQuestionData` became `async`, so the rejection is a rejected promise, as in `getNominationData`.
- The Supabase adapter's helper was not imported, because the adapter-boundary rule keeps the local adapter off `adapters/supabase`.

One test per method. RED: both failed. GREEN: 12/12.

### B-WR-04: The preregister page keeps a second, untyped copy of the provider keyword

**Status:** fixed: requires human verification (the error path is not exercised by any automated test; the happy paths are in `candidate-bank-auth-journey.spec.ts`)
**Files modified:** `apps/frontend/src/routes/candidate/preregister/+page.svelte`
**Commit:** `3976d46a4`
**Applied fix:**
- The keyword is cast to `ProviderType`, as a type-only import from `$lib/api/utils/auth/providers/types`, and handled in a `switch` with `'idura-ftn'` and `'signicat-ftn'` cases. Renaming a union member now fails type checking at the `case`.
- `default` (an unknown keyword), a non-OK authorize response and a thrown error all set `providerError`. The page then renders an inline `ErrorMessage` with `role="alert"` and `data-testid="preregister-errorMessage"`, showing the localised `error.default` text.
- `ErrorMessage` logs the detail through `log.error`, which replaces the bare `console.error`.
- The two duplicated `fetch('/api/oidc/authorize')` blocks became one `fetchAuthorizeUrl` helper.

### B-IN-01: The local nomination round filter treats NULL as round 1; the SQL does not

**Files modified:** `apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts` (comment only)
**Commit:** `7c37dbeb4`
**Applied fix:** I took the fix's second option, documenting the divergence. The first option, `NOT NULL` on the column, is a schema change owned by Part A. The comment claimed that the local adapter's default matched "the column's default". It now states the single row shape where the two differ. I confirmed at the tip:
- `nominations.election_round integer DEFAULT 1` is nullable (`104-nominations.sql`).
- `get_nominations` filters with `n.election_round = p_election_round` (`503-entity-rpcs.sql`).

### B-IN-02: `vite.projectIdEnv.ts` treats a whitespace-only shell value as set

**Files modified:** `apps/frontend/vite.projectIdEnv.ts`, `apps/frontend/vite.projectIdEnv.test.ts`
**Commit:** `de3a76c1c`
**Applied fix:**
- `isBlank(value)`, which is undefined or `trim() === ''`, is now the emptiness test in the write loop and in `loadWithoutEmptyShellValues`.
- A blank shell value is removed around `loadEnv` and restored exactly as it was: `' '` is restored as `' '`, not as `''`.
- The key comment now says that `loadEnv` matches the keys as prefixes, so its return value can carry `PUBLIC_PROJECT_ID_*`, and that only the writes are literal.

Two new cases: a whitespace shell value, and a whitespace target value. RED: 2 failed. GREEN: 10/10. `tsc -p apps/frontend/tsconfig.json` reports nothing for the file, which is type-checked through `vite.config.ts`.

### B-IN-04: A closed Alert stays in the accessibility tree and its buttons stay focusable

**Files modified:** `apps/frontend/src/lib/components/alert/Alert.svelte`
**Commit:** `30a080876`
**Applied fix:** `inert={!isOpen}` on the alert root, placed before the rest-props spread. The closing slide and fade still play, and the closed element leaves the tab order and the accessibility tree. The `@component` doc's `isOpen` line states this. The generated component listing in `apps/docs` is not regenerated; `yarn workspace @openvaa/docs generate:docs` will pick up the new doc line.

### B-IN-05: Expander keeps classes that never have an effect

**Status:** fixed. Rendering parity is argued from the built CSS, not measured with Playwright.
**Files modified:** `apps/frontend/src/lib/components/expander/Expander.svelte`
**Commit:** `0a8e4f2e0`
**Applied fix:** dropped `peer` from the checkbox, and `peer-checked:py-md` and `peer-checked:transition-[padding]` from the content. I also dropped the `category` variant's `pt-lg`, which never took effect.

The decision the finding asked for: keep the rendered result, as 165-33 did for NavItem. In the built CSS (`build/client/_app/immutable/assets/0.*.css`):
- `.peer-checked\:py-md:is(:where(.peer):checked~*)` has specificity (0,2,0) and always applied while the content is mounted. It set `padding-block: var(--spacing-md)`, which beat `.pt-lg` at (0,1,0).
- So every variant rendered `md` padding on all sides, which is what `p-md` alone renders now. daisyUI's checked `padding-bottom: 1rem` rule meets `p-md` in the same layer position as before.
- Without `transition-[padding]`, daisyUI's own `.collapse-content` transition applies. The content is mounted already checked and unmounted on collapse, so its padding never changes while mounted and nothing animates.

No caller passes a `peer-*` class through `titleClass`/`contentClass` (grep).

### B-IN-06: The supabase-types boundary scan covers only `.ts`/`.svelte` under `src/`

**Files modified:** `apps/frontend/src/lib/api/adapters/supabase/supabaseTypes.parity.test.ts`
**Commit:** `84ab88974`
**Applied fix:**
- The scan now walks the workspace root (`apps/frontend`), skipping `node_modules`, `build`, `.svelte-kit`, `.turbo` and `.vite`.
- It reads `.js`/`.ts`/`.mjs`/`.mts`/`.cjs`/`.cts`/`.svelte` files and also matches `require()`.
- It asserts that `vite.config.ts` and `svelte.config.js` are in the scanned set, so a mis-rooted walk fails instead of passing vacuously.

Proof: a scratch `tools/zz-scratch-boundary.mjs` importing `@openvaa/supabase-types` failed the test, naming the file. The scratch file was then deleted, and `git status tools` is clean. GREEN: 4/4.

### B-IN-07: `validatePassword` is exported but used only by its test, and the rules run client-side only

**Files modified:** `apps/frontend/src/lib/utils/password-validation/passwordValidation.ts`, `…/passwordValidation.test.ts`, `apps/docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.md`
**Commit:** `73cbe87ab`
**Applied fix:**
- The unused export was dropped. Its tests now assert `validatePasswordDetails(...).status` through a local `isValidPassword` helper, and all 7 cases are kept.
- The developer guide lists only the remaining exports. It already stated that Supabase Auth's policy is the server-side enforcement.
- `validatePasswordDetails`'s doc now says so too, naming `minimum_password_length`/`password_requirements` in `config.toml` and the hosted project's Auth settings.

Note, not changed: the local `config.toml` has `minimum_password_length = 6` against the frontend's 8. The guide's rule is that the server should be no stricter than the frontend, so this is consistent. A direct `updateUser` call can still set a 6-character password.

### B-IN-08: The memo lives as long as `locals`, not as long as the request

**Status:** fixed: requires human verification (it changes the hook's control flow)
**Files modified:** `apps/frontend/src/lib/supabase/safeGetSession.ts`, `apps/frontend/src/lib/supabase/safeGetSession.test.ts`, `apps/frontend/src/hooks.server.ts`
**Commit:** `a12f727f9`
**Applied fix:** I took the finding's second option, which enforces the lifetime instead of only documenting it.
- `createSafeGetSession` now returns `{ safeGetSession, endRequest }`, typed as the exported `SafeGetSessionHandle`.
- `supabaseHandle` wraps `resolve(event)` in `try { return await … } finally { endRequest(); }`. A redirect or error thrown by `resolve` still propagates.
- `endRequest` clears the memo and stops memoising. Any later call, from an admin job holding `locals` or a streamed load, verifies afresh.

New test: `verifies afresh on every call once the request has ended`. GREEN: 10/10. The "call it once per request" doc sentence now names `endRequest`.

## No Change Needed

### B-IN-03: A disabled NavItem is visually identical to an enabled one

**File:** `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte:41-48`
**Reason:** `no_change_needed`. This restates a maintainer ruling. The orchestrator's brief records that the maintainer kept the disabled-NavItem colour as rendered. That matches 165-33's key decision ("Rendering parity wins over a never-applied declaration"): the scoped `!text-secondary` never won against the layered `!text-neutral`, so disabled items always rendered neutral. The finding's fix is conditional ("If a disabled cue is wanted"), and the maintainer chose not to add one.
**Original issue:** The inlining dropped the never-applied `!text-secondary`, so only `pointer-events-none` distinguishes a disabled item.

## Verification (main checkout)

Each fix was checked when it was committed:
- The changed section was re-read.
- `prettier --check` on the changed files; for the docs page, run from inside `apps/docs`.
- `eslint --flag v10_config_lookup_from_file` from `apps/frontend`, which applies the workspace config and its adapter-boundary rule.
- `yarn workspace @openvaa/frontend check`: 0 errors and 0 warnings after every commit.
- The targeted vitest files.
- `hygiene-changed-files.sh --files <the fix's files>`: VERDICT CLEAN.

One hygiene hit was fixed before its commit: the phrase "no longer" in the first B-IN-04 doc wording, a layer-3 narrative hit.

Final gates at `a12f727f9`, each exit status read directly:

| Command | Result |
|---|---|
| `yarn workspace @openvaa/frontend test:unit` | exit 0, 110 files, 1900 tests passed |
| `yarn lint:check` | exit 0 |
| `yarn workspace @openvaa/frontend check` | exit 0, 2198 files, 0 errors, 0 warnings |
| `yarn build --filter=@openvaa/frontend` | exit 0 |
| `yarn assert:no-session-in-loads` | exit 0 |
| `bash scripts/tip-proofs.sh` | exit 0, all PASS |
| `hygiene-changed-files.sh --files <all 19 Part B files>` | VERDICT: CLEAN, 0 items |
| `prettier --check <all Part B files>` | clean |

Not run: the full E2E suite, which the orchestrator re-gates. No `hygiene-reads/*.tsv` read records were written for the 19 files, so a `--check-reads` gate run will need them recorded. The maintainer's `MainContent.svelte` edit and `.planning/milestone.lock` were never staged, and are still modified or untracked as before.

---

_Fixed: 2026-09-29T06:06:59Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
