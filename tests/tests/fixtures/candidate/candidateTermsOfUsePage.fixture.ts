/**
 * @file candidateTermsOfUsePage fixture — Phase 89 Plan 02 (TIR4:69-70 + D-89-02).
 *
 * Function-fixture for the candidate Terms-of-Use acceptance form
 * (rendered by `apps/frontend/src/routes/candidate/(protected)/+layout.svelte`
 * when `candidate.termsOfUseAccepted == null`).
 *
 * Surface (TIR4:69-70):
 *  - accept()                — toggle the terms-checkbox (no submit click).
 *  - getSubmit(): Locator    — return the terms-of-use-submit Locator.
 *  - acceptAndAdvance()      — composed: accept() + getSubmit().click().
 *
 * Spec flow at the call site asserts the disabled-state transition:
 *   expect(termsPage.getSubmit()).toBeDisabled()
 *   await termsPage.accept()
 *   await expect(termsPage.getSubmit()).toBeEnabled()
 *   await termsPage.getSubmit().click()
 *
 * `acceptAndAdvance()` is for specs that don't need the disabled-state
 * transition check.
 *
 * SIBLING (not replacement) to the legacy fixture surface — there is no
 * dedicated PageObject class for ToU in the legacy tree.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export function createCandidateTermsOfUsePage(page: Page) {
  return {
    /**
     * Toggle the terms-checkbox. Does NOT click submit — the spec must
     * follow this with `getSubmit().click()` (or call `acceptAndAdvance`
     * for the composed shortcut).
     */
    async accept(): Promise<void> {
      await page.getByTestId(testIds.candidate.terms.checkbox).click();
    },

    /**
     * Return the terms-of-use-submit Locator. Spec callers use this for
     * disabled-state assertions and for the click itself.
     */
    getSubmit(): Locator {
      return page.getByTestId(testIds.candidate.terms.submit);
    },

    /**
     * Composed convenience: tick the checkbox + click the submit button.
     * Use only when the spec does not need to assert the disabled→enabled
     * state transition.
     */
    async acceptAndAdvance(): Promise<void> {
      await this.accept();
      await this.getSubmit().click();
    }
  };
}

export type CandidateTermsOfUsePageFixture = ReturnType<typeof createCandidateTermsOfUsePage>;
