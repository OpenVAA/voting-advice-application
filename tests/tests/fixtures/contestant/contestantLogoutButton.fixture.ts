/**
 * @file contestantLogoutButton fixture.
 *
 * Function-fixture for the candidate LogoutButton widget (`apps/frontend/src/lib/dynamic-components/logoutButton/LogoutButton.svelte`).
 *
 * LogoutButton has two modes depending on candidate state:
 *  - With dialog: when there are unanswered required-info or opinion questions, clicking opens a `TimedModal` confirmation dialog. The candidate must click the in-modal logout button to confirm.
 *  - Without dialog: when all answers are complete (or answers are locked), clicking logs out directly.
 *
 * Surface:
 *  - clickWithDialog()    — click logout, wait for the role="dialog" modal, click the in-modal confirm button.
 *  - clickWithoutDialog() — click logout and assert direct logout (no modal, and the login screen follows).
 *  - clickAndStay()       — click logout, wait for the modal, and dismiss it with its "continue" button: the user stays signed in on the page.
 *  - holdClockStill()     — make the page's clock show one moment, so an open modal's count never ends.
 *  - openDialog()         — click logout and wait for the modal, leaving it open.
 *
 * SEPARATE methods (NOT a single method with a boolean param) — keeps the rigidity contract clean and the spec call-sites self-documenting.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { SIGN_OUT_TIMEOUT } from '../../helpers';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createContestantLogoutButton(page: Page) {
  return {
    /**
     * Click the logout button, wait for the TimedModal `role="dialog"` confirmation modal, and click the in-modal logout button to confirm.
     *
     * Used when the candidate has unanswered questions (the early-flow logout case).
     */
    async clickWithDialog(): Promise<void> {
      await page.getByTestId(testIds.contestant.home.logout).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      // The TimedModal's actions snippet renders two buttons: the primary "continue editing" (variant=main) and the secondary "Logout" (color=warning). Click the warning-colored Logout to confirm.
      await dialog.getByRole('button', { name: /log ?out/i }).click();
    },

    /**
     * Click the logout button and assert direct logout (no confirmation dialog). Used when all required answers are complete OR answers are locked (the final-logout case).
     */
    async clickWithoutDialog(): Promise<void> {
      await page.getByTestId(testIds.contestant.home.logout).click();
      // No dialog is opened in this branch: `triggerLogout` in LogoutButton.svelte opens the modal only while a task is left or a navigation guard is active, and otherwise logs out at once.
      await expect(page.getByRole('dialog')).toHaveCount(0);
      // The logout ends with a navigation to the login screen: its address, and the screen itself.
      await expect(page).toHaveURL(/\/contestant\/login/, { timeout: SIGN_OUT_TIMEOUT });
      await expect(page.getByTestId(testIds.contestant.login.page)).toBeVisible();
    },

    /**
     * Click the logout button, wait for the TimedModal `role="dialog"` confirmation modal, and dismiss it with its primary button. The dialog closes, the URL is the one the button was pressed on, and the logout button is still shown.
     *
     * Used when the user is asked before logging out and chooses to go on entering data.
     */
    async clickAndStay(): Promise<void> {
      const url = page.url();
      await page.getByTestId(testIds.contestant.home.logout).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      // The modal's primary button is the one that keeps the user signed in; the other is the warning-coloured Logout.
      await dialog.getByRole('button', { name: /continue/i }).click();
      await expect(dialog).toBeHidden();
      expect(page.url(), 'dismissing the dialog leaves the user on the page').toBe(url);
      await expect(page.getByTestId(testIds.contestant.home.logout)).toBeVisible();
    },

    /**
     * Make the page's clock show one moment for as long as the page lives, while its timers keep running. The modal's count ends when the clock reaches the count's deadline, so a modal opened after this never logs out by itself, and a test can leave it open without signing out the session it runs in.
     *
     * Call it before {@link openDialog}.
     */
    async holdClockStill(): Promise<void> {
      await page.clock.setFixedTime(new Date());
    },

    /**
     * Click the logout button and wait for the TimedModal `role="dialog"` confirmation modal, leaving it open.
     *
     * Used to read the modal itself, after {@link holdClockStill}.
     */
    async openDialog(): Promise<void> {
      await page.getByTestId(testIds.contestant.home.logout).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
    }
  };
}

export type ContestantLogoutButtonFixture = ReturnType<typeof createContestantLogoutButton>;
