/**
 * perm-answers-locked — Phase 91 Plan 02 (TIR6:3-14, A1).
 *
 * FULL 3-SURFACE COVERAGE per 91-CONTEXT.md Group A item 1 + RESEARCH
 * §Open Questions Q2 RESOLVED:
 *   Surface 1 (UNAUTHENTICATED): /en/candidate login page renders the
 *     read-only login info via the login-answers-locked-info testid.
 *   Surface 2 (AUTHENTICATED via real forceRegister + UI login,
 *     D-91-PD-06 revised — Phase 91-05 CR-01 closure):
 *     /en/candidate/profile renders the candidate-answers-locked-warning
 *     Warning + every visible <input>/<textarea>/<select> is disabled.
 *   Surface 3 (AUTHENTICATED): /en/candidate/questions/[questionId]
 *     renders the same warning + the question-choices radios are
 *     disabled (OpinionQuestionInput display-mode → mode !== 'answer').
 *
 * Rigidity contract (88-04 / 89-02 / 90-D-90-06): every assertion HARD —
 * no soft assertions, no try/catch around assertion calls, no `.catch`
 * fallbacks on assertion-bearing locators.
 *
 * Selector discipline (Pitfall 3): testid-driven only. NO `t('...')`
 * locale-text matching.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:3-14.
 */

import { expect, test } from '@playwright/test';
import path from 'path';
import { createCandidateQuestionsOverviewPage } from '../../fixtures/candidate/candidateQuestionsOverviewPage.fixture';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';

const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');

test.describe('perm-answers-locked (surface 1 — unauthenticated)', () => {
  test('login: answersLocked surfaces login-answers-locked-info on /en/candidate', async ({ page }) => {
    await page.goto('/en/candidate');
    await expect(page.getByTestId(testIds.candidate.login.answersLockedInfo)).toBeVisible();
  });
});

test.describe('perm-answers-locked (surfaces 2 + 3 — authenticated)', () => {
  test.use({ storageState: STORAGE_STATE_PATH });

  test('profile: candidate-answers-locked-warning visible + every visible input disabled', async ({ page }) => {
    await page.goto('/en/candidate/profile');
    await expect(page.getByTestId(testIds.candidate.common.answersLockedWarning)).toBeVisible();

    // Every interactive form control on the profile page must be disabled
    // when answersLocked=true. Build a role union (textbox covers text/email
    // inputs + textareas; combobox covers selects; spinbutton covers number
    // inputs; checkbox/radio cover QuestionInput choices) — getByRole only
    // matches accessibility-tree (i.e. visible) elements, so no `:visible`
    // filter is needed. Iterate and assert .toBeDisabled() on each.
    const inputs = page
      .getByRole('textbox')
      .or(page.getByRole('combobox'))
      .or(page.getByRole('spinbutton'))
      .or(page.getByRole('checkbox'))
      .or(page.getByRole('radio'));
    const count = await inputs.count();
    expect(count, 'profile page must render at least one visible input').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toBeDisabled();
    }
  });

  test('opinion question: answersLockedWarning visible + every question-choices radio disabled', async ({ page }) => {
    // The per-question URL is keyed on the INTERNAL question id, not the seed
    // external_id, so `page.goto('/en/candidate/questions/<external_id>')` is
    // impossible. Click through the overview instead: goToQuestion expands
    // every category, clicks the matching card's action, and awaits navigation
    // onto the per-question route. Match by the question's displayed label
    // (`[QU-OPIN-L5-1]`), seeded by buildMinimal.
    const questionsOverview = createCandidateQuestionsOverviewPage(page);
    await questionsOverview.goToPage();
    await questionsOverview.goToQuestion(/\[QU-OPIN-L5-1\]/);

    await expect(page.getByTestId(testIds.candidate.common.answersLockedWarning)).toBeVisible();

    // The candidate question page tags its OpinionQuestionInput with
    // `candidate-questions-answer` (testIds.candidate.questions.answerInput).
    // That prop flows through restProps onto the inner QuestionChoices
    // <fieldset> and OVERRIDES its own `question-choices` testid (the spread
    // sits after it). So on the candidate page the radio container is
    // `candidate-questions-answer`, NOT `question-choices` (the latter is the
    // voter-app fieldset testid). Scope to the registered container constant —
    // same pattern as candidateQuestionPage.fixture's selectChoice.
    const answerContainer = page.getByTestId(testIds.candidate.questions.answerInput);
    const radios = answerContainer.getByRole('radio');
    const count = await radios.count();
    expect(count, 'candidate-questions-answer must render at least one radio').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(radios.nth(i)).toBeDisabled();
    }
  });
});
