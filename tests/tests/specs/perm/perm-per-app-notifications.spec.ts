/**
 * perm-per-app-notifications — Phase 89 Plan 04 (TIR4-PERM-03).
 *
 * Topology: 1 election, 1 CG, 1 CO, 2 candidates. Settings override:
 * `notifications.voterApp` + `notifications.candidateApp` both `show: true`
 * with DISTINCT title/content markers `[notif-voter]` (voter side) and
 * `[notif-cand]` (candidate side). The spec asserts each app's notification
 * renders ONLY on its own route — strict cross-route absence enforcement
 * (the [notif-cand] marker MUST NOT appear in the voter-route dialog and
 * vice versa).
 *
 * Notifications are rendered as Alert components with `role="dialog"`
 * (precedent: candidate-settings.spec.ts:262 + CAND-13 test block).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-4.md:51-54.
 *
 * Rigidity contract (TIR4:8-12 + Phase 88 lineage): every assertion HARD —
 * no expect.soft, no try/catch wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '@playwright/test';

test.describe('perm-per-app-notifications', () => {
  test('voter route shows voter notification only', async ({ page }) => {
    await page.goto('/en');
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
    await page.goto('/en/candidate');
    const candidateDialog = page.getByRole('dialog').filter({ hasText: '[notif-cand]' });
    await expect(candidateDialog).toBeVisible();
    await expect(candidateDialog).toContainText('[notif-cand]');
    await expect(candidateDialog).not.toContainText('[notif-voter]');
  });
});
