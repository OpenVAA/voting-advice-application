/**
 * @file adminLoginPage fixture.
 *
 * Function-fixture for the Admin App's login page and for what proves that a login landed in the Admin App.
 *
 * Surface:
 *  - goToPage()              — navigate to the login page and wait for its form.
 *  - login(email, password)  — fill the form and submit it.
 *  - expectAdminHome()       — the address is the Admin App's home and its post-gate content is visible.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createAdminLoginPage(page: Page) {
  const adminHome = buildRoute({ route: 'AdminAppHome', locale: 'en' });
  const adminLogin = buildRoute({ route: 'AdminAppLogin', locale: 'en' });

  // reason: the admin login page declares no test id on its email input or its submit button. `#email` is the id the markup itself declares and `button[type="submit"]` is a type attribute; neither reads a translated string, so neither breaks on a locale change. The password field is addressed through the shared test id its component carries.
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const emailInput = page.locator('#email');
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const submitButton = page.locator('form button[type="submit"]');

  return {
    /**
     * Navigate to the login page and wait for its form.
     */
    async goToPage(): Promise<void> {
      await page.goto(adminLogin, { waitUntil: 'domcontentloaded' });
      await expect(emailInput).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Fill the login form and submit it.
     */
    async login(email: string, password: string): Promise<void> {
      await emailInput.fill(email);
      await page.getByTestId(testIds.contestant.password.field).fill(password);
      await submitButton.click();
    },

    /**
     * Assert that the browser is in the Admin App: the address is its home, not its login page, and the content behind its gate is visible.
     *
     * A redirect is followed silently, so the address alone cannot tell a landing from a bounce that came back; the content is what a refused login never shows.
     */
    async expectAdminHome(): Promise<void> {
      await expect(page).toHaveURL(new RegExp(`${adminHome}$`), { timeout: TIMEOUTS.slowPage });
      await expect(page).not.toHaveURL(new RegExp(`${adminLogin}(\\?|$)`));
      await expect(page.getByRole('button', { name: 'Jobs Monitoring' })).toBeVisible({ timeout: TIMEOUTS.slowPage });
    }
  };
}

export type AdminLoginPageFixture = ReturnType<typeof createAdminLoginPage>;
