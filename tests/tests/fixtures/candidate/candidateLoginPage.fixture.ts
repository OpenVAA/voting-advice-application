/**
 * @file candidateLoginPage fixture — Phase 89 Plan 02 (TIR4:64-68 + D-89-02).
 *
 * Function-fixture for the candidate /login page. Sibling to other
 * candidate-fixtures; composed in `candidate-journey.ts`.
 *
 * Surface (TIR4:64-68):
 *  - enterEmail(email)             — fill the login-email field.
 *  - enterPassword(password)       — fill the password-field input.
 *  - submit()                      — click the login-submit button.
 *  - login(email, password)        — composed convenience.
 *  - getSubmitButton(): Locator    — return the login-submit Locator for
 *                                    spec-side disabled-state assertions.
 *  - expectErrorMessage(text?)     — assert the login-errorMessage testid is
 *                                    visible; optional `text` matches content.
 *
 * Disabled-state assertions are performed at the SPEC site via
 * `expect(loginPage.getSubmitButton()).toBeDisabled()` — the fixture does
 * NOT expose a state-baked `expectSubmitDisabled()`.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export function createCandidateLoginPage(page: Page) {
  return {
    async enterEmail(email: string): Promise<void> {
      await page.getByTestId(testIds.candidate.login.email).fill(email);
    },

    async enterPassword(password: string): Promise<void> {
      await page.getByTestId(testIds.candidate.password.field).fill(password);
    },

    async submit(): Promise<void> {
      await page.getByTestId(testIds.candidate.login.submit).click();
    },

    async login(email: string, password: string): Promise<void> {
      await this.enterEmail(email);
      await this.enterPassword(password);
      await this.submit();
    },

    /**
     * Return the login-submit button Locator. Spec callers use this for
     * disabled-state assertions (e.g. `await expect(loginPage.getSubmitButton()).toBeDisabled()`).
     */
    getSubmitButton(): Locator {
      return page.getByTestId(testIds.candidate.login.submit);
    },

    /**
     * Assert the login-errorMessage testid is visible. When `text` is
     * supplied, additionally assert the rendered content matches.
     */
    async expectErrorMessage(text?: string | RegExp): Promise<void> {
      const err = page.getByTestId(testIds.candidate.login.errorMessage);
      await expect(err).toBeVisible();
      if (text !== undefined) {
        await expect(err).toContainText(text);
      }
    }
  };
}

export type CandidateLoginPageFixture = ReturnType<typeof createCandidateLoginPage>;
