/**
 * @file contestantSettingsPage fixture.
 *
 * Function-fixture for the settings page of the Contestant App, the signed-in user's own page at the app's root, as far as the account's address goes: the locked field holding it, and, for an account an identity provider made whose address awaits its confirmation link, "Send again" and the form that gives another address.
 *
 * Another address is typed into the fields of the email-entry component, so they are reached by its ids. An address is typed and never asserted on but as the text a field shows.
 *
 * Surface:
 *  - open()                       — load the settings page's address and wait for the page.
 *  - expectShown()                — the URL is the settings page at the app's root, and the page's button that saves a new password is shown.
 *  - expectAddress(address)       — the locked field holds that address.
 *  - expectEmailPending(address)  — the locked field holds the pending address, with the sentence that it has not been confirmed, and "Send again" is shown.
 *  - expectNoUserName()           — the change-password form holds no user-name field for a password manager.
 *  - pressResend(address)         — give the address confirmation's one-mail-a-minute slot on the server back, then press "Send again"; focus stays on it.
 *  - expectResendRequested()      — "Send again" is unavailable, still focusable and described by its count, and the status region says a new email was requested.
 *  - changeEmail()                — press "Use another email address": the address fields and the save button are shown, with focus on the first field.
 *  - giveEmail(address)           — type an address and the same confirmation into the address fields.
 *  - saveEmail()                  — press the save button. The caller asserts what follows.
 *  - expectEmailInUse()           — the address field says the address belongs to another account, and has focus.
 *  - returnHome()                 — press the page's Return, and assert that the home of the user's one entity follows: Return leads to the app's root, which sends a user who edits one entity to its home.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// Direct import, as `contestantEntityUrl.ts` makes it: the module depends on nothing of the application.
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantHomeUrlRe, contestantSettingsUrlRe } from '../../utils/contestantEntityUrl';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Page } from '@playwright/test';

/**
 * Read one message of the English message source.
 * @param file - The file's name under `apps/frontend/messages/en`, without its extension; the namespace is the file's single top-level key.
 * @param key - The message's key inside the namespace.
 */
function englishMessage(file: string, key: string): string {
  const source = JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en', `${file}.json`), 'utf8')
  ) as Record<string, Record<string, unknown>>;
  return String(source[file][key]);
}

/** The page's sentences that a step asserts, read from the message source rather than copied. */
const MESSAGES = Object.freeze({
  pendingInfo: englishMessage('contestantApp.settings', 'emailPendingInfo'),
  emailInUse: englishMessage('contestantApp.identityProvider', 'emailInUse'),
  requested: englishMessage('contestantApp.emailSent', 'resendRequested')
});

export function createContestantSettingsPage(page: Page) {
  const ids = testIds.contestant.settings;
  const entryIds = testIds.contestant.emailEntry;
  const addressControl = page.getByTestId(ids.email);

  return {
    /**
     * Load the settings page's address and wait for the page.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppSettings', locale: 'en' }));
      await this.expectShown();
    },

    /**
     * Assert that the page is the settings page at the app's root, with no entity in its address, and that its button that saves a new password is shown.
     */
    async expectShown(): Promise<void> {
      await expect(page).toHaveURL(contestantSettingsUrlRe(), { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(ids.updateButton)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the locked address field holds the address.
     *
     * @param address - The address the account signs in with.
     */
    async expectAddress(address: string): Promise<void> {
      await expect(addressControl).toHaveValue(address, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the locked address field holds the pending address and is described by the sentence that it has not been confirmed yet, and that "Send again" is shown.
     *
     * @param address - The pending address.
     */
    async expectEmailPending(address: string): Promise<void> {
      await expect(addressControl).toHaveValue(address, { timeout: TIMEOUTS.slowPage });
      await expect(addressControl).toHaveAccessibleDescription(new RegExp(escapeRegExp(MESSAGES.pendingInfo)));
      await expect(page.getByTestId(ids.emailPendingResend)).toBeVisible();
    },

    /**
     * Assert that the change-password form holds no user-name field, so a password manager is handed no address for the new password.
     */
    async expectNoUserName(): Promise<void> {
      const passwordForm = page.getByTestId(ids.newPassword);
      await expect(passwordForm).toBeVisible({ timeout: TIMEOUTS.slowPage });
      // reason: the field is for a password manager alone and is in no accessibility tree and carries no test id; it is told by its `autocomplete` attribute, which is not a translated string.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      await expect(passwordForm.locator('input[autocomplete="username"]')).toHaveCount(0);
    },

    /**
     * Ask for the link again: give the address confirmation's one-mail-a-minute slot on the server back, then press "Send again", and assert that focus stays on it. Without the slot given back, a press inside the minute of the last mail sends nothing.
     *
     * @param address - The pending address.
     */
    async pressResend(address: string): Promise<void> {
      await new SupabaseAdminClient().releaseConfirmationSlot(address);
      const resend = page.getByTestId(ids.emailPendingResend);
      await resend.click();
      await expect(resend).toBeFocused();
    },

    /**
     * Assert what follows a press of "Send again": the button is marked unavailable and is described by the count of the wait in its label, and the status region says that a new email was requested.
     */
    async expectResendRequested(): Promise<void> {
      const resend = page.getByTestId(ids.emailPendingResend);
      await expect(resend).toHaveAttribute('aria-disabled', 'true', { timeout: TIMEOUTS.slowPage });
      const countdownId = (await page.getByTestId(ids.emailPendingCountdown).getAttribute('id')) ?? '';
      expect(countdownId, 'the id of the count of the wait').not.toBe('');
      await expect(resend).toHaveAttribute('aria-describedby', countdownId);
      await expect(page.getByTestId(ids.emailPendingStatus)).toHaveText(MESSAGES.requested);
    },

    /**
     * Press "Use another email address" and assert that the address fields and the save button are shown in its place, with focus on the address field.
     */
    async changeEmail(): Promise<void> {
      await page.getByTestId(ids.emailPendingChange).click();
      await expect(page.getByTestId(ids.emailSave)).toBeVisible();
      await expect(page.getByTestId(ids.emailPendingChange)).toHaveCount(0);
      await expect(page.getByTestId(entryIds.email)).toBeFocused();
    },

    /**
     * Type an address into the address field and the same address into its confirmation, once the page's script runs: the save button is unavailable until then.
     *
     * @param address - The address to give.
     */
    async giveEmail(address: string): Promise<void> {
      await expect(page.getByTestId(ids.emailSave)).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await page.getByTestId(entryIds.email).fill(address);
      await page.getByTestId(entryIds.confirmation).fill(address);
    },

    /**
     * Press the button that saves the address typed. The caller asserts what follows.
     */
    async saveEmail(): Promise<void> {
      await page.getByTestId(ids.emailSave).click();
    },

    /**
     * Assert that the address field says the address typed belongs to another account: its error carries that reason and says so, and focus is on the field. Nothing else failed.
     */
    async expectEmailInUse(): Promise<void> {
      const error = page.getByTestId(entryIds.emailError);
      await expect(error).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(error).toHaveAttribute('data-reason', 'in-use');
      await expect(error).toContainText(MESSAGES.emailInUse);
      await expect(page.getByTestId(entryIds.email)).toBeFocused();
      await expect(page.getByTestId(ids.emailError)).toHaveCount(0);
    },

    /**
     * Press the page's Return and assert that the home of the user's one entity follows. Return leads to the app's root, which sends a user who edits one entity to its home.
     */
    async returnHome(): Promise<void> {
      await page.getByTestId(ids.return).click();
      await expect(page).toHaveURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
    }
  };
}

export type ContestantSettingsPageFixture = ReturnType<typeof createContestantSettingsPage>;
