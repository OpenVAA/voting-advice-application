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
import { testIds } from '../../utils/testIds';

test.describe(
  'SETTINGS-03 — candidate-side required-info enforcement',
  { tag: ['@candidate', '@variant', '@settings-03'] },
  () => {
    test('SETTINGS-03 unanswered required info question disables profile-dependent CTAs on CandAppHome', async ({
      page
    }) => {
      // Navigate to CandAppHome. The variant-hidden-required-candidate
      // project supplies STORAGE_STATE (logged in as Alpha), so we land on
      // the protected home directly (no /login redirect).
      await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));

      // Confirm we are on the protected home (NOT redirected to /login).
      await expect(page).not.toHaveURL(/\/login/);

      // The Questions Button at routes/candidate/(protected)/+page.svelte:125-139
      // carries `data-testid="candidate-home-questions"` AND
      // `disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0}`
      // (line 129). With Alpha's test-question-displayname answer deleted by
      // the variant overlay AND customData.required:true flipped on that
      // question, the derivation evaluates to length ≥ 1 → the button must
      // render disabled.
      const questionsButton = page.getByTestId(testIds.candidate.home.questions);
      await expect(questionsButton).toBeVisible();
      await expect(questionsButton).toBeDisabled();

      // The Preview Button (line 140-146) has the SAME disabled binding.
      // No central testId map entry for it — locate by data-testid attribute
      // directly (matches the in-component attribute at line 146).
      // reason: candidate-home-preview is not in the testIds central map but
      // is a documented data-testid on +page.svelte:146; structural locator
      // matches the file-level convention.
      const previewButton = page.locator('[data-testid="candidate-home-preview"]');
      await expect(previewButton).toBeVisible();
      await expect(previewButton).toBeDisabled();

      // Positive control: the Profile Button (line 113-124) is NOT
      // gated by unansweredRequiredInfoQuestions — it's the candidate's
      // navigation path to FIX the missing answer, so it MUST remain
      // enabled even when profileComplete is false.
      // reason: candidate-home-profile is the un-gated CTA per +page.svelte:118;
      // assertion proves the gate is selective (only Questions+Preview
      // disabled), not a generic "all CTAs off" state.
      const profileButton = page.locator('[data-testid="candidate-home-profile"]');
      await expect(profileButton).toBeVisible();
      await expect(profileButton).toBeEnabled();
    });
  }
);
