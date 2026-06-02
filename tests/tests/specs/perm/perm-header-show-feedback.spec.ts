/**
 * perm-header-show-feedback — Phase 91 Plan 02 (TIR6:68-77, A3).
 *
 * `header.showFeedback=true` surfaces the feedback Button in Banner.svelte's
 * top-bar action group (gated on
 * `topBarSettings.current.actions.feedback === 'show'`). The voter intro
 * page (/en) renders the Banner top bar — assert the header-feedback testid
 * is visible AND clicking it opens the feedback-form dialog.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:68-77.
 */

import { expect, test } from '../../fixtures/views';
import { testIds } from '../../utils/testIds';

test.describe('perm-header-show-feedback', () => {
  test('header-feedback visible on voter intro; click opens feedback-form', async ({
    page,
    voterHomePage
  }) => {
    await voterHomePage.goToPage('en');
    const feedbackBtn = page.getByTestId(testIds.shared.header.feedback);
    await expect(feedbackBtn).toBeVisible();
    await feedbackBtn.click();
    await expect(page.getByTestId('feedback-form')).toBeVisible();
  });
});
