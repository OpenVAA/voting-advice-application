import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  // Raw locators for assertions
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId(testIds.candidate.login.email);
    this.passwordInput = page.getByTestId(testIds.candidate.login.password);
    this.submitButton = page.getByTestId(testIds.candidate.login.submit);
    this.errorMessage = page.getByTestId(testIds.candidate.login.errorMessage);
  }

  // High-level action methods
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginError(): Promise<void> {
    await this.errorMessage.waitFor({ state: 'visible' });
  }
}
