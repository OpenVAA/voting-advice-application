import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId(testIds.candidate.forgotPassword.email);
    this.submitButton = page.getByTestId(testIds.candidate.forgotPassword.submit);
  }

  /**
   * Submit a password reset request by filling in the email and clicking submit.
   *
   * @param email - The email address to request a reset for
   */
  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
