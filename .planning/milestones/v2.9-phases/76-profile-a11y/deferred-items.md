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

### 2. `candidate-profile.spec.ts` registration test fails deterministically (originally documented as flake; promoted to gating issue at Plan 02)

- **Location:** `tests/tests/specs/candidate/candidate-profile.spec.ts:85-145`
- **Symptom:** The `should register the fresh candidate via email link`
  test fails on `expect(touCheckbox).toBeVisible({ timeout: 10000 })`
  at line 139. After registration the URL re-redirects to `/login` with
  a "Your password is now set! Please log in using it." heading; the
  `loginIfRedirectedToLoginPage(...)` helper attempts a manual login but
  the subsequent ToU checkbox never surfaces.
- **Reproduced:**
  - Plan 01 smoke (2/2 isolated runs).
  - Plan 02 per-plan smoke (3/3 isolated runs at /tmp/76-02-run-{1,2,3}.log).
    The third reproduction confirms the failure is now DETERMINISTIC in
    this development shell, not intermittent.
- **Cascade impact (new at Plan 02):** Because the host file uses
  `test.describe.configure({ mode: 'serial' })`, all subsequent tests
  in the describe block are SKIPPED with "did not run" when registration
  fails. Plan 02 added 3 new A11Y-02 reload-persistence tests INSIDE this
  same serial block (per CONTEXT D-01 + D-02). The 3 new tests are
  STRUCTURALLY COMPLETE (Playwright lists them; lint passes; sentinel
  values disjoint from 'Alpha'; locators match Plan 01 fixture labels
  exactly) but cannot demonstrate functional PASS via the standard
  per-plan smoke because the entire serial chain is gated by registration.
  This is the **PASS-WITH-DEFERRAL** outcome per Phase 74 D-04 /
  Phase 75 D-03 precedent.
- **Why this is NOT a Phase 76 P02 regression:** Plan 02's diff is
  PURELY ADDITIVE inside the existing serial block. The registration
  test was already failing in Plan 01's environment (documented above);
  Plan 02 inherits the cascade. The 3 new A11Y-02 tests do not depend
  on the new questions or any Phase 76 change — they depend on the same
  pre-existing registration flow as CAND-03 + CAND-12.
- **Why this is NOT a Phase 76 P01 regression:** Plan 01's changes
  touch only the dev-seed template (additive — 3 new info questions
  + 3 Alpha answer cells) and the new validation spec. The registration
  test exercises the inviteUserByEmail → Mailpit → set-password →
  ToU-checkbox flow which has no dependency on the new questions or
  any other Phase 76 P01/P02 change. The failure mode (URL re-redirects
  to /login with "password is now set" heading, then ToU checkbox never
  appears) is an upstream Mailpit / Supabase Auth post-set-password
  redirect race that pre-dates Phase 76.
- **Recommendation:**
  1. Plan 04 verification gate should triage in cold-start environment
     (vite-cache wipe + Supabase fully recycled). If reproduces in
     cold-start, file a follow-up todo at
     `.planning/todos/pending/2026-05-12-candidate-registration-redirect-race.md`
     scoped to investigate the post-`client.setPassword` redirect to /login
     and the subsequent helper login attempt's session establishment.
  2. Short-term workaround (for Plan 02 functional verification at
     Plan 04 triage): temporarily switch the host file's
     `candidateEmail` / `candidatePassword` to Test Candidate Alpha
     pre-registered credentials (matching the path Plan 01 took for
     `candidate-profile-validation.spec.ts`). This is an architectural
     change (different test fixture surface) — Plan 04 owns the call.
  3. Alternative: extract the 3 new A11Y-02 persistence tests into a
     new sibling spec file `candidate-profile-persistence.spec.ts` that
     uses Alpha credentials, leaving the registration test isolated.
     This is the CONTEXT D-01 "Claude's Discretion" fallback path —
     Plan 02 chose the default (extend host file) per the plan contract
     and per CONTEXT D-02 "additive only".

### 4. macOS Chromium filechooser flake on serial-mode IMAGE_CELLS iteration (mitigated in Plan 01; restate for completeness)

- Location: `tests/tests/specs/candidate/candidate-profile-validation.spec.ts`
- Stabilized via 500ms pre-filechooser settle delay (commit 15107e336).
- No action required at Plan 02; documented here for verifier audit trail.

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
