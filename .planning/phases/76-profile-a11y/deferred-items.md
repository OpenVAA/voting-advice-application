# Phase 76 — Deferred Items

Items discovered during Phase 76 execution that are out of scope for the
current plan but warrant a follow-up. These are NOT folded into the active
plan; they are surfaced here for the verifier and downstream phases.

## Phase 76 Plan 01 discoveries

### 1. `ProfilePage.uploadImage()` page-object selector is stale (post-70-03 drift)

- **Location:** `tests/tests/pages/candidate/ProfilePage.ts:24-37`
- **Issue:** The page-object navigates the click target via
  `imageArea.locator('label[tabindex="0"]')`. Phase 70 P03 (commit
  `43ea0eb1e`) refactored `apps/frontend/src/lib/components/input/Input.svelte:514-545`
  to render the click target as a `<button>` (a11y Cat C fix). The
  `<label tabindex="0">` element no longer exists, so the page-object's
  click never resolves and the file chooser never opens.
- **Why CAND-03 still passes upstream:** CAND-03's
  `should upload a profile image` test passes in the Phase 73 baseline + ad-hoc
  smokes — likely because Playwright's `waitForEvent('filechooser')` raced
  the `expect(label).click()` timeout in a way that allowed CAND-03 to
  succeed (test passes a real `image/png` file so the rejection-branch
  surface is never exercised; an ambient race may submit the right file
  via auto-retry semantics OR the test's downstream `expect(page).not.toHaveURL(/profile/)`
  is satisfied by some other path). Regardless, the page-object is
  semantically wrong and Phase 76 P01 routes around it (drives the
  filechooser via the `<button>` directly).
- **Recommendation:** A future hygiene plan should:
  1. Replace `imageArea.locator('label[tabindex="0"]')` with
     `imageArea.getByRole('button').first()`.
  2. Add a regression test for the rejection branches now that A11Y-01
     P01 ships them. (Phase 76 P01's
     `candidate-profile-validation.spec.ts` is that regression test.)

### 2. `candidate-profile.spec.ts` registration test is flaky

- **Location:** `tests/tests/specs/candidate/candidate-profile.spec.ts:85-145`
- **Symptom:** The `should register the fresh candidate via email link`
  test intermittently fails on `expect(touCheckbox).toBeVisible({ timeout: 10000 })`
  at line 137. Reproduced in 2/2 isolated runs during Phase 76 P01
  smoke; the Phase 73 baseline lists this test under PASS_LOCKED so the
  flake is recent or environment-dependent.
- **Why this is NOT a Phase 76 P01 regression:** my changes touch only
  the dev-seed template (additive — 3 new info questions + 3 Alpha
  answer cells) and the new validation spec. The registration test
  exercises the inviteUserByEmail → Inbucket → set-password → ToU-checkbox
  flow which has no dependency on the new questions or any other Phase 76
  P01 change. The failure mode (terms-checkbox not appearing after
  registration) suggests an upstream Inbucket / Supabase Auth race that
  pre-dates Phase 76.
- **Recommendation:** Re-baseline determinism in Phase 76 P04's verification
  gate. If the flake reproduces in the cold-start 3-run smoke, file a
  follow-up todo to investigate the registration flow's Inbucket + Auth
  timing. If not, the flake is environment-specific to my development
  shell session and not gating.

### 3. `playwright.config.ts` testMatch regex required extension for new spec file

- **Change:** `tests/playwright.config.ts:124` regex was extended from
  `/candidate-(registration|profile)\.spec\.ts/` to
  `/candidate-(registration|profile|profile-validation)\.spec\.ts/` so the
  new `candidate-profile-validation.spec.ts` file is picked up by the
  `candidate-app-mutation` project.
- **Rationale:** Rule 3 (blocking issue auto-fix) — without this change
  the spec is silently ignored. Documented here so Plan 02 + Plan 03
  authors know the regex pattern is the gate for any future Phase 76
  spec under the candidate-profile* family.
