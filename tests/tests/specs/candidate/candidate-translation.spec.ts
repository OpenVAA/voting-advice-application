/**
 * Candidate translation surface E2E test (E2E-01).
 *
 * Asserts the multilocale candidate translation Button render contract at
 * Input.svelte:641-647 — Button renders when `multilingual && locales.length > 1`,
 * expands to per-locale inputs on click, and the authored value survives reload.
 * The candidate-question "Open answer" comment is rendered as `textarea-multilingual`
 * when `customData.allowOpen === true` (per +page.svelte:294-305); test-question-1
 * carries that flag in `packages/dev-seed/src/templates/e2e.ts:294-303`.
 *
 * Single-locale absence path DEFERRED per Phase 74 CONTEXT D-04 — `supportedLocales`
 * is hardcoded with no runtime-override mechanism. This spec asserts MULTILOCALE only.
 * Runs under the `candidate-app` Playwright project (pre-authenticated storageState).
 */

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';

test.describe('candidate translation surface (E2E-01)', { tag: ['@candidate'] }, () => {
  test.beforeEach(async ({ page, candidateQuestionsPage }) => {
    // Navigate to the candidate questions list and expand all category Expanders
    // so question cards are present in the DOM (matches candidate-questions.spec.ts:19-25).
    await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }));
    await candidateQuestionsPage.expandAllCategories();
  });

  test('multilocale candidate authors a translation and the value persists across reload', async ({
    page,
    candidateQuestionsPage,
    questionPage
  }) => {
    // Step 1: Navigate to test-question-1 (index 0 — first opinion question with
    // `customData.allowOpen = true`, so the textarea-multilingual comment input renders).
    await candidateQuestionsPage.navigateToQuestion(0);
    await expect(questionPage.answerInput).toBeVisible();

    // Step 2: Locate the Translations toggle Button (Input.svelte:641-647).
    // The Button renders only when `multilingual && locales.length > 1`. The default
    // staticSettings.supportedLocales has 4 entries (en/fi/sv/da), so the Button is
    // present on the comment textarea-multilingual input. Per Phase 74 PATTERNS Pitfall 2,
    // the surface is a Button (NOT a tab/dialog) — locate via role='button'.
    const translationsBtn = page.getByRole('button', { name: /^Translations$/i });
    await expect(translationsBtn).toBeVisible();
    await translationsBtn.click();

    // Step 3: After expansion, per-non-default-locale labeled textareas appear.
    // Each textarea has aria-labelledby="{id}-label {id}-label-{locale}", which
    // concatenates the OUTER label (the openAnswerPrompt) with the per-locale label.
    // The per-locale label is rendered via t(`lang.${locale}`) (Input.svelte:392, 417);
    // the lang.* keys are presently UNWIRED (see ./deferred-items.md Plan 01 entry 1),
    // so the rendered locale-label is the literal string "lang.fi" — that is the
    // accessible-name suffix the textbox exposes today. The spec asserts the textbox
    // is reachable, fillable, and persists across reload — the surface contract.
    // (The wired-label fix is a separate i18n change tracked in deferred-items.md.)
    const fiInput = page.getByRole('textbox', { name: /lang\.fi$/i });
    await expect(fiInput).toBeVisible();
    await fiInput.fill('persistence test text in fi');

    // Step 4: Save the answer + translated comment.
    // saveAnswer requires a primary answer choice to be selected (CAND-04 invariant).
    const choices = page.getByRole('radio');
    await expect(choices.first()).toBeVisible();
    await choices.nth(3).click();
    await questionPage.saveAnswer();

    // Step 5: Navigate back to the questions list, then reload to verify
    // server-side persistence. saveAnswer() navigates away (to the next question
    // or the list); explicit re-navigation gives a stable post-reload landing.
    await page.goto(buildRoute({ route: 'CandAppQuestions', locale: 'en' }));
    await page.reload();

    // Step 6: Re-expand categories and re-enter the same question.
    await candidateQuestionsPage.expandAllCategories();
    await candidateQuestionsPage.navigateToQuestion(0);
    await expect(questionPage.answerInput).toBeVisible();

    const translationsBtnAfter = page.getByRole('button', { name: /^Translations$/i });
    await expect(translationsBtnAfter).toBeVisible();
    await translationsBtnAfter.click();

    // Step 7: Assert the Finnish-locale translation persisted across reload.
    await expect(page.getByRole('textbox', { name: /lang\.fi$/i })).toHaveValue(
      'persistence test text in fi'
    );
  });
});
