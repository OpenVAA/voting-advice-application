/**
 * @file contestantPasswordSetter fixture.
 *
 * Function-fixture for the `PasswordSetter` form, which every page that sets a password renders. The form holds two password fields — the new password and its confirmation — each of which can show an error of its own, and is paired with a submit button its page renders.
 *
 * Surface:
 *  - setPassword(password) — fill the password and its confirmation, then press the page's set-password button.
 *  - expectFieldError(field) — assert that the `'password'` or the `'confirmation'` field shows its error and that its control is marked invalid.
 *  - expectNotVisible() — assert that the form is not rendered.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/** One of the form's two fields. */
export type PasswordSetterField = 'password' | 'confirmation';

/** The test ids of each field's block, which holds its control, and of its error. */
const FIELD_TEST_IDS: Record<PasswordSetterField, { block: string; error: string }> = {
  password: {
    block: testIds.contestant.passwordSetter.password,
    error: testIds.contestant.passwordSetter.passwordError
  },
  confirmation: {
    block: testIds.contestant.passwordSetter.confirm,
    error: testIds.contestant.passwordSetter.confirmationError
  }
};

export function createContestantPasswordSetter(page: Page) {
  return {
    /**
     * Fill the new + confirm password inputs and click the submit button.
     */
    async setPassword(password: string): Promise<void> {
      await page
        .getByTestId(testIds.contestant.passwordSetter.password)
        .getByTestId(testIds.contestant.password.field)
        .fill(password);
      await page
        .getByTestId(testIds.contestant.passwordSetter.confirm)
        .getByTestId(testIds.contestant.password.field)
        .fill(password);
      await page.getByTestId(testIds.contestant.password.submit).click();
    },
    /**
     * Assert that a field shows its error and that its control is marked invalid.
     *
     * @param field - The field the error is expected at.
     */
    async expectFieldError(field: PasswordSetterField): Promise<void> {
      const { block, error } = FIELD_TEST_IDS[field];
      await expect(page.getByTestId(error)).toBeVisible();
      await expect(page.getByTestId(block).getByTestId(testIds.contestant.password.field)).toHaveAttribute(
        'aria-invalid',
        'true'
      );
    },
    /**
     * Assert the password setter widget is NOT rendered
     */
    async expectNotVisible(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.passwordSetter.password)).toHaveCount(0, { timeout: 5_000 });
    }
  };
}

export type ContestantPasswordSetterFixture = ReturnType<typeof createContestantPasswordSetter>;
