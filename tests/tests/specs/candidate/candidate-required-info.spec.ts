/**
 * Candidate required-info E2E tests — Phase 77 SETTINGS-03 candidate-required
 * cell.
 *
 * --- Surface under test ---
 *
 * `candidateContext.svelte.ts:347-368` derives:
 *   - `requiredInfoQuestions` — info questions where `customData.required` is
 *     truthy AND `customData.locked` is falsy
 *   - `unansweredRequiredInfoQuestions` — the subset where the candidate's
 *     saved answer's `value` is empty (`isEmptyValue`)
 *   - `profileComplete = unansweredRequiredInfoQuestions.length === 0 &&
 *      unansweredOpinionQuestions.length === 0`
 *
 * The CandAppHome page at `apps/frontend/src/routes/candidate/(protected)/+page.svelte`
 * branches on these:
 *   - line 121: `<InfoBadge text={String(candCtx.unansweredRequiredInfoQuestions.length)} />`
 *     renders next to the `candidate-home-profile` Button when there are
 *     unanswered required info questions.
 *   - line 129: `<Button data-testid="candidate-home-questions"
 *     disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0} ...>`
 *   - line 144: `<Button data-testid="candidate-home-preview"
 *     disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0} ...>`
 *
 * --- Variant + auth layout ---
 *
 * This spec runs under the `variant-hidden-required-candidate` Playwright
 * project (per RESEARCH OQ-3 resolution, option B). The variant overlay:
 *   - flips `customData.required: true` on `test-question-displayname`
 *     (Phase 76 P01 info question; preserves the existing
 *     `custom_data.maxlength: 50` anchor),
 *   - DELETES Alpha's `test-question-displayname` answer in the
 *     `candidates.fixed[]` overlay,
 *   - app_settings overlay disables `entities.hideIfMissingAnswers.candidate`
 *     so the LogoutButton warning (and the analogous +page.svelte:89,100
 *     warning) isolates on the required-info clause.
 *
 * Auth: the project reuses STORAGE_STATE from `auth-setup` (Alpha's
 * pre-registered credentials). Per the data-setup contract, the auth schema
 * is NOT touched by the dataset teardown/reset (`runTeardown('test-',
 * client)` filters by external_id prefix on the candidates table only), so
 * Alpha's auth row remains valid against the variant's candidate row.
 *
 * --- LANDMINE-3 reframing ---
 *
 * Only the candidate side is asserted here. Voter-side required-info-question
 * gating is PRODUCT-GAP (no `unansweredRequiredInfoQuestions` analog on
 * voterContext); captured as follow-up todo at
 * `.planning/todos/pending/2026-05-12-settings-03-voter-required-product-gap.md`.
 *
 * --- LANDMINE-D mitigation ---
 *
 * Placement inside the variant project's testDir filter sidesteps the
 * candidate-app-mutation testMatch regex (LANDMINE-E) AND the upstream
 * candidate-profile.spec.ts:87 registration race (LANDMINE-D). The variant
 * project chains through data-setup-hidden-required only — no auth-mutating
 * dependency.
 */

import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// The variant-hidden-required.setup.ts re-runs forceRegister AFTER the
// dataset reseed (mirrors data.setup.ts step 4), which issues a NEW auth.user
// row. The cached STORAGE_STATE token from auth-setup (which ran before this
// variant chain) is bound to the PREVIOUS auth.user.id and is therefore
// stale — Alpha's new auth.user.id no longer matches the token's `sub` claim,
// so navigating to /candidate falls through to /login.
//
// Use the canonical fresh-login pattern from candidate-profile-validation
// spec — clear the STORAGE_STATE for this spec and login via the form with
// the stable test credentials (email+password are tests/-only constants in
// testCredentials.ts; the variant's forceRegister uses the same credentials
// so the form login succeeds against the new auth.user row).
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Module-level helper: log in as Test Candidate Alpha.
 *
 * Mirrors `candidate-profile-validation.spec.ts:67-74`. Hoisted out of the
 * test body to keep playwright/no-conditional-in-test compliant.
 */
async function loginAsCandidate(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
  // Home redirects unauthenticated traffic to /login; fill credentials there.
  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.login.password).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
}

test.describe(
  'SETTINGS-03 — candidate-side required-info enforcement',
  { tag: ['@candidate', '@variant', '@settings-03'] },
  () => {
    test('SETTINGS-03 unanswered required info question disables profile-dependent CTAs on CandAppHome', async ({
      page
    }) => {
      // Login via the form — see top-of-file comment for why STORAGE_STATE
      // is cleared and a fresh login is used here.
      await loginAsCandidate(page);

      // After login Alpha lands on /candidate (CandAppHome) directly. Confirm
      // we are NOT on /login.
      await expect(page).not.toHaveURL(/\/login/);

      // The Questions Button at routes/candidate/(protected)/+page.svelte:125-139
      // carries `data-testid="candidate-home-questions"` AND
      // `disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0}`
      // (line 129). With Alpha's test-question-displayname answer deleted by
      // the variant overlay AND customData.required:true flipped on that
      // question, the derivation evaluates to length ≥ 1 → the button must
      // render disabled.
      //
      // NB: the shared Button component (`Button.svelte:178-185`) renders the
      // button as `<a role="button" disabled="true" tabindex="-1">` when
      // disabled — `<a>` does NOT natively support the `disabled` attribute,
      // so Playwright's `toBeDisabled` matcher does NOT recognize this
      // as disabled (it checks native form-element `disabled`/`ariaDisabled`).
      // The custom `disabled="true"` attribute IS observable; assert via
      // `toHaveAttribute` + tabindex="-1" (the keyboard-navigation guard).
      // reason: Button.svelte renders disabled state as `disabled="true"` on
      // `<a>` (not a native form element) — Playwright's toBeDisabled matcher
      // is form-element-only per
      // https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-disabled
      const questionsButton = page.getByTestId(testIds.candidate.home.questions);
      await expect(questionsButton).toBeVisible();
      await expect(questionsButton).toHaveAttribute('disabled', 'true');
      await expect(questionsButton).toHaveAttribute('tabindex', '-1');

      // The Preview Button (line 140-146) has the SAME disabled binding.
      // No central testId map entry for it — locate by data-testid attribute
      // directly (matches the in-component attribute at line 146).
      // reason: candidate-home-preview is not in the testIds central map but
      // is a documented data-testid on +page.svelte:146; structural locator
      // matches the file-level convention.
      const previewButton = page.locator('[data-testid="candidate-home-preview"]');
      await expect(previewButton).toBeVisible();
      await expect(previewButton).toHaveAttribute('disabled', 'true');
      await expect(previewButton).toHaveAttribute('tabindex', '-1');

      // Positive control: the Profile Button (line 113-124) is NOT
      // gated by unansweredRequiredInfoQuestions — it's the candidate's
      // navigation path to FIX the missing answer, so it MUST remain
      // enabled even when profileComplete is false.
      // reason: candidate-home-profile is the un-gated CTA per +page.svelte:118;
      // assertion proves the gate is selective (only Questions+Preview
      // disabled), not a generic "all CTAs off" state.
      const profileButton = page.locator('[data-testid="candidate-home-profile"]');
      await expect(profileButton).toBeVisible();
      // Same Button-component caveat as above; assert the ABSENCE of the
      // disabled attribute on the Profile button (it should be in its
      // enabled, navigable state with tabindex="0" + no `disabled` attr).
      await expect(profileButton).not.toHaveAttribute('disabled', 'true');
      await expect(profileButton).toHaveAttribute('tabindex', '0');
    });
  }
);
