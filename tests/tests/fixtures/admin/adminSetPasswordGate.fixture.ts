/**
 * @file adminSetPasswordGate fixture.
 *
 * Function-fixture for the set-password view of the Admin App: the view a signed-in admin whose account has no password is shown in place of every protected page of the Admin App, until a password is saved or the admin signs out.
 *
 * The view is the shared set-password view, so its inner controls carry the same ids as the Contestant App's; only its root differs. Its form is the password setter every page that sets a password renders. A password is a credential: the steps type it and never assert on it.
 *
 * Surface:
 *  - expectShown()          — the view is shown.
 *  - expectEmail(address)   — the view names the account by this address.
 *  - setPassword(password)  — type the password and the same confirmation, then press the main button.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createAdminSetPasswordGate(page: Page) {
  const root = page.getByTestId(testIds.admin.setPasswordGate.container);
  const inner = testIds.contestant.setPasswordGate;
  const setterIds = testIds.contestant.passwordSetter;

  return {
    /**
     * Assert that the Admin App's set-password view is shown. The step opens nothing: the view replaces whichever protected page the admin asked for.
     */
    async expectShown(): Promise<void> {
      await expect(root).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the view names the account by an address, shown as text.
     */
    async expectEmail(address: string): Promise<void> {
      await expect(root.getByTestId(inner.email)).toHaveText(address);
    },

    /**
     * Type a password and the same password as its confirmation, then press the main button once the view's script runs. The caller asserts what follows.
     */
    async setPassword(password: string): Promise<void> {
      const field = testIds.contestant.password.field;
      await root.getByTestId(setterIds.password).getByTestId(field).fill(password);
      await root.getByTestId(setterIds.confirm).getByTestId(field).fill(password);
      const submit = root.getByTestId(testIds.contestant.password.submit);
      await expect(submit).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await submit.click();
    }
  };
}

export type AdminSetPasswordGateFixture = ReturnType<typeof createAdminSetPasswordGate>;
