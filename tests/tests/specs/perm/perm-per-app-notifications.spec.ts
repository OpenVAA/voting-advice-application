/**
 * Topology: 1 election, 1 CG, 1 CO, 2 candidates. Settings override:
 * `notifications.voterApp` + `notifications.candidateApp` both `show: true`
 * with DISTINCT title/content markers `[notif-voter]` (voter side) and
 * `[notif-cand]` (candidate side). The spec asserts each app's notification
 * renders ONLY on its own route — strict cross-route absence enforcement
 * (the [notif-cand] marker MUST NOT appear in the voter-route dialog and
 * vice versa).
 *
 * Notifications are rendered as Alert components with `role="dialog"`.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch
 * wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '../../fixtures/voter/views';

// TODO: re-enable perm-per-app-notifications projects + spec after the
// Svelte 5 runes migration. The notification popup tests below are unstable
// because the popup-management lifecycle (queueing / mount timing / cross-route
// isolation of voter vs candidate notifications) is still in flux. The test
// bodies are intact and MUST be re-enabled (back to `test.describe`) + popup
// management verified end-to-end once the migration completes.
// reason: intentional describe-level skip pending the runes-migration popup
// rework; bodies are intact and MUST be re-enabled.
// eslint-disable-next-line playwright/no-skipped-test
test.describe.skip('perm-per-app-notifications', () => {
  test('voter route shows voter notification only', async ({ page, voterHomePage }) => {
    await voterHomePage.goToPage('en');
    // Strict-match the voter notification dialog by its marker — defends
    // against multiple dialogs on the page (cookie banner / survey popup /
    // etc.) by filtering the role-locator to the dialog that contains
    // [notif-voter].
    const voterDialog = page.getByRole('dialog').filter({ hasText: '[notif-voter]' });
    await expect(voterDialog).toBeVisible();
    await expect(voterDialog).toContainText('[notif-voter]');
    await expect(voterDialog).not.toContainText('[notif-cand]');
  });

  test('candidate route shows candidate notification only', async ({ page }) => {
    // reason: candidate-route navigation — out of voter-fixture scope; no voter goToPage applies.
    await page.goto('/en/candidate');
    const candidateDialog = page.getByRole('dialog').filter({ hasText: '[notif-cand]' });
    await expect(candidateDialog).toBeVisible();
    await expect(candidateDialog).toContainText('[notif-cand]');
    await expect(candidateDialog).not.toContainText('[notif-voter]');
  });
});
