/**
 * @file contestantPasswordResetPage fixture.
 *
 * Function-fixture for the Contestant App's password-reset page, where a signed-in user sets a new password. A mailed recovery link lands its user there. The page is shown to a signed-in user alone: a visitor with no session is led to the login screen.
 *
 * The screen is shared: the Admin App renders it on its own password-reset page, under its own root test id. `createContestantPasswordResetPage(page, { route, container })` drives that page; both options default to the Contestant App's.
 *
 * The page's form is the password setter every page that sets a password renders, so its two fields and its main button are reached by the setter's ids. A password is a credential: the steps type it and never assert on it.
 *
 * Surface:
 *  - openDirectly()               — go to the page's address and wait for nothing.
 *  - expectShown()                — the page is shown.
 *  - expectAddress(address)       — the page names the account by this address.
 *  - expectUsernameField(address) — the form holds the account's address in a field a password manager reads and a user does not see.
 *  - setPassword(password)        — type the password and the same confirmation, then press the main button.
 *  - expectSaveFailure()          — the page shows the message of a failed save.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { createContestantPasswordSetter } from './contestantPasswordSetter.fixture';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
import type { Route } from '../../../../apps/frontend/src/lib/routes/route';

/** Which app's password-reset page a fixture drives: its route and its root test id. */
export type PasswordResetPageOf = {
  route?: Route;
  container?: string;
};

export function createContestantPasswordResetPage(
  page: Page,
  { route = 'ContestantAppResetPassword', container = testIds.contestant.passwordReset.page }: PasswordResetPageOf = {}
) {
  const ids = { ...testIds.contestant.passwordReset, page: container };
  const setter = createContestantPasswordSetter(page);

  return {
    /**
     * Go to the password-reset page's address, as a visitor does by a link kept from before or a typed address.
     *
     * The step waits for nothing: a visitor with no session is not shown the page, so the caller asserts where they end.
     */
    async openDirectly(): Promise<void> {
      await page.goto(buildRoute({ route, locale: 'en' }));
    },

    /**
     * Assert that the password-reset page is shown. The step opens nothing: it is for the page a mailed link or a navigation has led to.
     */
    async expectShown(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the page names the account by an address, shown as text.
     */
    async expectAddress(address: string): Promise<void> {
      await expect(page.getByTestId(ids.email)).toHaveText(address);
    },

    /**
     * Assert that the form holds the account's address for a password manager: exactly one control named `username` inside a form, holding the address, read-only, and not shown.
     */
    async expectUsernameField(address: string): Promise<void> {
      // reason: the field is not rendered, so no role reaches it, and it carries no test id: a password manager finds it by its name, and so does this step. The name is not a translated string.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const username = page.locator('form input[name="username"]');
      await expect(username).toHaveCount(1);
      await expect(username).toHaveValue(address);
      await expect(username).toHaveAttribute('readonly', '');
      await expect(username).toBeHidden();
    },

    /**
     * Type a password and the same password as its confirmation, then press the main button. The caller asserts where the user ends.
     */
    async setPassword(password: string): Promise<void> {
      await setter.setPassword(password);
    },

    /**
     * Assert that the page shows the message of a failed save.
     */
    async expectSaveFailure(): Promise<void> {
      await expect(page.getByTestId(ids.error)).toBeVisible();
    }
  };
}

export type ContestantPasswordResetPageFixture = ReturnType<typeof createContestantPasswordResetPage>;
