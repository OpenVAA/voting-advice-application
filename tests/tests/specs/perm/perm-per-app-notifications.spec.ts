/**
 * Topology: 1 election, 1 CG, 1 CO, 2 candidates. Settings override: `notifications.voterApp` + `notifications.contestantApp` both `show: true` with DISTINCT title/content markers `[notif-voter]` (voter side) and `[notif-contestant]` (candidate side). The spec asserts each app's notification renders ONLY on its own route — strict cross-route absence enforcement: once a route's own dialog is shown, no dialog on the page carries the other app's marker.
 *
 * Notifications are rendered as Alert components with `role="dialog"`.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '../../fixtures/voter/views';

test.describe('perm-per-app-notifications', () => {
  test('voter route shows voter notification only', async ({ page, voterHomePage }) => {
    await voterHomePage.goToPage('en');
    // Strict-match the voter notification dialog by its marker — defends against multiple dialogs on the page (cookie banner / survey popup / etc.) by filtering the role-locator to the dialog that contains [notif-voter].
    const voterDialog = page.getByRole('dialog').filter({ hasText: '[notif-voter]' });
    await expect(voterDialog).toBeVisible();
    await expect(voterDialog).toContainText('[notif-voter]');
    await expect(voterDialog).not.toContainText('[notif-contestant]');
    await expect(page.getByRole('dialog').filter({ hasText: '[notif-contestant]' })).toHaveCount(0);
  });

  test('candidate route shows candidate notification only', async ({ page }) => {
    // reason: candidate-route navigation — out of voter-fixture scope; no voter goToPage applies.
    await page.goto('/en/contestant');
    const candidateDialog = page.getByRole('dialog').filter({ hasText: '[notif-contestant]' });
    await expect(candidateDialog).toBeVisible();
    await expect(candidateDialog).toContainText('[notif-contestant]');
    await expect(candidateDialog).not.toContainText('[notif-voter]');
    await expect(page.getByRole('dialog').filter({ hasText: '[notif-voter]' })).toHaveCount(0);
  });
});
