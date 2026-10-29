/**
 * @file contestantNothingToEditPage fixture.
 *
 * Function-fixture for the view the Contestant App's root shows a signed-in user who edits no entity (`apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte`): the email the user signed in with, a link to the settings page, a support button and a logout button.
 *
 * Surface:
 *  - open()                 — navigate to the app root and wait for the view.
 *  - expectShown()          — the URL is the app root and the view's container is visible.
 *  - expectSignedInEmail(email) — the view names that email.
 *  - expectNoAddress()      — the view names no address and ends by asking the user to tell support how they registered.
 *  - expectSupportButton()  — the view holds the support button.
 *  - followSettingsLink()   — the view holds the link to the settings page; follow it. The caller asserts where it leads.
 *  - logoutWithoutDialog()  — press the view's Logout, and assert that no modal opened and the login page was reached.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantAppRootUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Page } from '@playwright/test';

/** The view's sentences that a step asserts, read from the English message source rather than copied. */
const MESSAGES = (
  JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/contestantApp.nothingToEdit.json'), 'utf8')
  ) as Record<string, Record<'nextStepsNoAddress' | 'signedInAs', string>>
)['contestantApp.nothingToEdit'];

export function createContestantNothingToEditPage(page: Page) {
  const container = page.getByTestId(testIds.contestant.nothingToEdit.container);

  return {
    /**
     * Navigate to the app root and wait for the view.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
      await this.expectShown();
    },

    /**
     * Assert the view is shown at the app root.
     */
    async expectShown(): Promise<void> {
      await expect(page).toHaveURL(contestantAppRootUrlRe());
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert the view names `email` as the signed-in address.
     */
    async expectSignedInEmail(email: string): Promise<void> {
      await expect(container.getByTestId(testIds.contestant.nothingToEdit.email)).toHaveText(email);
    },

    /**
     * Assert that the view names no address: neither the address nor its label is rendered, and the view's last sentence asks the user to tell support that they registered with Bank ID.
     */
    async expectNoAddress(): Promise<void> {
      await expect(container.getByTestId(testIds.contestant.nothingToEdit.email)).toHaveCount(0);
      await expect(container.getByRole('term')).toHaveCount(0);
      await expect(container).not.toContainText(MESSAGES.signedInAs);
      await expect(container).toContainText(MESSAGES.nextStepsNoAddress);
    },

    /**
     * Assert the view holds the support button.
     */
    async expectSupportButton(): Promise<void> {
      await expect(container.getByTestId(testIds.contestant.common.contactSupport)).toBeVisible();
    },

    /**
     * Assert that the view holds the link to the settings page, and follow it. The caller asserts the page it leads to.
     */
    async followSettingsLink(): Promise<void> {
      const link = container.getByTestId(testIds.contestant.nothingToEdit.settingsLink);
      await expect(link).toBeVisible();
      await link.click();
    },

    /**
     * Press the view's Logout. A user with nothing to edit has no missing data to be reminded of, so no confirmation modal opens and the login page follows.
     */
    async logoutWithoutDialog(): Promise<void> {
      await container.getByTestId(testIds.contestant.nothingToEdit.logout).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page).toHaveURL(/\/contestant\/login/);
      await expect(page.getByTestId(testIds.contestant.login.page)).toBeVisible();
    }
  };
}

export type ContestantNothingToEditPageFixture = ReturnType<typeof createContestantNothingToEditPage>;
