/**
 * @file candidateLogoutButton fixture.
 *
 * Function-fixture for the candidate LogoutButton widget (`apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte`).
 *
 * LogoutButton has two modes depending on candidate state:
 *  - With dialog: when there are unanswered required-info or opinion questions, clicking opens a `TimedModal` confirmation dialog. The candidate must click the in-modal logout button to confirm.
 *  - Without dialog: when all answers are complete (or answers are locked), clicking logs out directly.
 *
 * Surface:
 *  - clickWithDialog()    — click logout, wait for the role="dialog" modal, click the in-modal confirm button.
 *  - clickWithoutDialog() — click logout and assert direct logout (no modal, URL changes away from the candidate-protected area).
 *
 * Two SEPARATE methods (NOT a single method with a boolean param) — keeps the rigidity contract clean and the spec call-sites self-documenting.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createCandidateLogoutButton(page: Page) {
  return {
    /**
     * Click the logout button, wait for the TimedModal `role="dialog"` confirmation modal, and click the in-modal logout button to confirm.
     *
     * Used when the candidate has unanswered questions (the early-flow logout case).
     */
    async clickWithDialog(): Promise<void> {
      await page.getByTestId(testIds.candidate.home.logout).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      // The TimedModal's actions snippet renders two buttons: the primary "continue editing" (variant=main) and the secondary "Logout" (color=warning). Click the warning-colored Logout to confirm.
      await dialog.getByRole('button', { name: /log ?out/i }).click();
    },

    /**
     * Click the logout button and assert direct logout (no confirmation dialog). Used when all required answers are complete OR answers are locked (the final-logout case).
     */
    async clickWithoutDialog(): Promise<void> {
      await page.getByTestId(testIds.candidate.home.logout).click();
      // No dialog is opened in this branch: triggerLogout dispatches straight to logout() per LogoutButton.svelte:58-64.
      await expect(page.getByRole('dialog')).toHaveCount(0);
      // The post-logout navigation routes to /candidate/login per LogoutButton.svelte:71-73. Assert URL changes away from the protected area as the canonical "logged out" signal.
      await expect(page).toHaveURL(/\/candidate\/login/);
    }
  };
}

export type CandidateLogoutButtonFixture = ReturnType<typeof createCandidateLogoutButton>;
