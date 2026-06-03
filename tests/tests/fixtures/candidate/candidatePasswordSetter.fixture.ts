/**
 * @file candidatePasswordSetter fixture.
 *
 * Function-fixture for the PasswordSetter widget rendered by the
 * /candidate/register/password route (and the password-reset flow). The
 * widget contains two PasswordField inputs (new + confirm) and is paired
 * with an external submit button.
 *
 * Surface:
 *  - setPassword(password) — fill register-password + register-confirm-password
 *    + click register-password-submit.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`,
 * NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createCandidatePasswordSetter(page: Page) {
  return {
    /**
     * Fill the new + confirm password inputs and click the submit button.
     */
    async setPassword(password: string): Promise<void> {
      await page
        .getByTestId(testIds.candidate.passwordSetter.password)
        .getByTestId(testIds.candidate.password.field)
        .fill(password);
      await page
        .getByTestId(testIds.candidate.passwordSetter.confirm)
        .getByTestId(testIds.candidate.password.field)
        .fill(password);
      await page.getByTestId(testIds.candidate.password.submit).click();
    },
    /**
     * Assert the password setter widget is NOT rendered
     */
    async expectNotVisible(): Promise<void> {
      await expect(page.getByTestId(testIds.candidate.passwordSetter.password)).toHaveCount(0, { timeout: 5_000 });
    }
  };
}

export type CandidatePasswordSetterFixture = ReturnType<typeof createCandidatePasswordSetter>;
