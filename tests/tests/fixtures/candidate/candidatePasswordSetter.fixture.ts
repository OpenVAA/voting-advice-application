/**
 * @file candidatePasswordSetter fixture — Phase 89 Plan 02 (TIR4:74 + D-89-02).
 *
 * Function-fixture for the PasswordSetter widget rendered by the
 * /candidate/register/password route (and the password-reset flow). The
 * widget contains two PasswordField inputs (new + confirm) and is paired
 * with an external submit button.
 *
 * Surface (TIR4:74):
 *  - setPassword(password) — fill register-password + register-confirm-password
 *                            + click register-password-submit.
 *
 * Implementation note: PasswordSetter wraps each PasswordField in a `<div
 * data-testid={passwordTestId}>` (see
 * `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte:78,82`).
 * The actual `<input>` inside carries `data-testid="password-field"`. We
 * therefore scope each fill to the wrapper testid, then descend to the
 * password-field input.
 *
 * SIBLING (not replacement) to any legacy register-password helper.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createCandidatePasswordSetter(page: Page) {
  return {
    /**
     * Fill the new + confirm password inputs and click the submit button.
     */
    async setPassword(password: string): Promise<void> {
      await page
        .getByTestId(testIds.candidate.register.password)
        .getByTestId('password-field')
        .fill(password);
      await page
        .getByTestId(testIds.candidate.register.confirmPassword)
        .getByTestId('password-field')
        .fill(password);
      await page.getByTestId(testIds.candidate.register.passwordSubmit).click();
    }
  };
}

export type CandidatePasswordSetterFixture = ReturnType<typeof createCandidatePasswordSetter>;
