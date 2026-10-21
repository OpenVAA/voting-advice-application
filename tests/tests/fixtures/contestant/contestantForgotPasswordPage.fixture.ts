/**
 * @file contestantForgotPasswordPage fixture.
 *
 * Function-fixture for the Contestant App's forgot-password page, where a visitor types an address and asks for a mail with which to set a new password. The page says nothing about what became of the request: whatever the address, it leads to the screen that says an email was sent.
 *
 * Surface:
 *  - open()                        — open the page by its address and wait for its email field.
 *  - submit(address)               — type an address and press the main button. The caller asserts what follows.
 *  - expectLedToEmailSent(address) — the visitor is on the screen that says an email was sent, in its recovery wording, with the address.
 *  - expectShown()                 — the forgot-password page is shown.
 *  - expectEmailError()            — the email field shows its error, is marked invalid and has focus.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createContestantForgotPasswordPage(page: Page) {
  const ids = testIds.contestant.forgotPassword;

  return {
    /**
     * Open the forgot-password page by its address, as a visitor does from the menu or by a typed address, and wait for its email field.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppForgotPassword', locale: 'en' }));
      await expect(page.getByTestId(ids.email)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Type an address into the email field and press the main button. The button is unavailable until the page's script has loaded, and the press waits for it.
     *
     * The caller asserts what follows: the screen that says an email was sent for an address the field accepts, the field's error otherwise.
     *
     * @param address - What is typed. An empty string leaves the field empty.
     */
    async submit(address: string): Promise<void> {
      const email = page.getByTestId(ids.email);
      await expect(email).toBeEditable({ timeout: TIMEOUTS.slowPage });
      await email.fill(address);
      await expect(email).toHaveValue(address);
      await page.getByTestId(ids.submit).click();
    },

    /**
     * Assert that the visitor has been led to the screen that says an email was sent, in the wording of a password recovery and with the address that was typed.
     *
     * The screen is the same for every address, so the step says nothing about whether a mail was sent. That is read from the request's own witness.
     *
     * @param address - The address that was typed.
     */
    async expectLedToEmailSent(address: string): Promise<void> {
      const sent = testIds.contestant.emailSent;
      const screen = page.getByTestId(sent.page);
      await expect(screen).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(screen).toHaveAttribute('data-wording', 'recovery');
      await expect(screen).toHaveAttribute('data-address', 'shown');
      await expect(page.getByTestId(sent.address)).toHaveText(address);
    },

    /**
     * Assert that the forgot-password page is shown. The step opens nothing: it is for the page a navigation has led to.
     */
    async expectShown(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert that the page's email field is in error: its error is shown, the control is marked invalid, and focus is on the control.
     */
    async expectEmailError(): Promise<void> {
      await expect(page.getByTestId(ids.emailError)).toBeVisible();
      const email = page.getByTestId(ids.email);
      await expect(email).toHaveAttribute('aria-invalid', 'true');
      await expect(email).toBeFocused();
    }
  };
}

export type ContestantForgotPasswordPageFixture = ReturnType<typeof createContestantForgotPasswordPage>;
