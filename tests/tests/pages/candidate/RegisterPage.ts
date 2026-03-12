import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.getByTestId(testIds.candidate.register.password);
    this.confirmPasswordInput = page.getByTestId(testIds.candidate.register.confirmPassword);
    this.submitButton = page.getByTestId(testIds.candidate.register.submit);
  }

  /**
   * Set the password during registration by filling both fields and submitting.
   *
   * @param password - The password to set
   * @param confirm - The password confirmation (should match password)
   */
  async setPassword(password: string, confirm: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirm);
    await this.submitButton.click();
  }
}
