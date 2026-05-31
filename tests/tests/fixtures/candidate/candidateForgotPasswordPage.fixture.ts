/**
 * @file candidateForgotPasswordPage fixture — Phase 89 Plan 02 (TIR4:72-73 + D-89-02).
 *
 * Function-fixture for the candidate /forgot-password page.
 *
 * Surface (TIR4:72-73):
 *  - fillEmailAndAdvance(email)  — fill forgot-password-email + click
 *                                   forgot-password-submit + assert the
 *                                   forgot-password-success message is
 *                                   visible.
 *
 * SIBLING (not replacement) to any legacy forgot-password helper. There is
 * no dedicated PageObject class for the forgot-password page in the legacy
 * tree.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export function createCandidateForgotPasswordPage(page: Page) {
  return {
    /**
     * Fill the email field, click submit, and assert the success message
     * appears. Strict — no try/catch / no soft assertions.
     */
    async fillEmailAndAdvance(email: string): Promise<void> {
      const emailInput = page.getByTestId('forgot-password-email');
      const submitBtn = page.getByTestId('forgot-password-submit');
      // Guard the fill+submit race: Svelte 5 `bind:value` can lag a microtask
      // behind Playwright's `fill()` on a freshly mounted form. If submit
      // fires before the bound `email` state catches the value, the form's
      // native `required` validation silently blocks submission and the
      // page stays in status='idle' (no success/error/loading rendered).
      await expect(emailInput).toBeEditable();
      await emailInput.fill(email);
      await expect(emailInput).toHaveValue(email);
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();
      await expect(page.getByTestId('forgot-password-success')).toBeVisible();
    }
  };
}

export type CandidateForgotPasswordPageFixture = ReturnType<typeof createCandidateForgotPasswordPage>;
