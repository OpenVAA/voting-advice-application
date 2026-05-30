/**
 * perm-answers-locked — Phase 91 Plan 02 (TIR6:3-14, A1).
 *
 * FULL 3-SURFACE COVERAGE per 91-CONTEXT.md Group A item 1 + RESEARCH
 * §Open Questions Q2 RESOLVED:
 *   Surface 1 (UNAUTHENTICATED): /en/candidate login page renders the
 *     read-only login info via the login-answers-locked-info testid.
 *   Surface 2 (AUTHENTICATED via candidateSessionMinter / D-91-PD-06):
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
import { TESTS_DIR } from '../../utils/testsDir';
import { testIds } from '../../utils/testIds';

const PREFIX = 'e2e-perm-answers-locked-';
const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');

test.describe('perm-answers-locked (surface 1 — unauthenticated)', () => {
  test('login: answersLocked surfaces login-answers-locked-info on /en/candidate', async ({
    page
  }) => {
    await page.goto('/en/candidate');
    await expect(page.getByTestId(testIds.candidate.login.answersLockedInfo)).toBeVisible();
  });
});

test.describe('perm-answers-locked (surfaces 2 + 3 — authenticated)', () => {
  test.use({ storageState: STORAGE_STATE_PATH });

  test('profile: candidate-answers-locked-warning visible + every visible input disabled', async ({
    page
  }) => {
    await page.goto('/en/candidate/profile');
    await expect(
      page.getByTestId(testIds.candidate.common.answersLockedWarning)
    ).toBeVisible();

    // Every visible text/textarea/select/checkbox/radio input on the
    // profile page must be disabled when answersLocked=true. Iterate over
    // the locator and assert .toBeDisabled() on each.
    const inputs = page.locator('input:visible, textarea:visible, select:visible');
    const count = await inputs.count();
    expect(count, 'profile page must render at least one visible input').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toBeDisabled();
    }
  });

  test('opinion question: answersLockedWarning visible + every question-choices radio disabled', async ({
    page
  }) => {
    await page.goto(`/en/candidate/questions/${PREFIX}qu-opin-l5-1`);
    await expect(
      page.getByTestId(testIds.candidate.common.answersLockedWarning)
    ).toBeVisible();

    const radios = page.getByTestId('question-choices').locator('input[type="radio"]');
    const count = await radios.count();
    expect(count, 'question-choices must render at least one radio').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(radios.nth(i)).toBeDisabled();
    }
  });
});
