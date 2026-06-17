/**
 * @file candidatePreregisterPage fixture.
 *
 * Function-fixture (page-object) for the candidate-preregister walk rendered
 * by the `candidate/preregister/(authenticated)/{elections,constituencies,email}`
 * routes (entered after the bank-auth identity callback creates the
 * preregistration session). Sibling to `candidatePasswordSetter.fixture.ts`
 * (convention reference) and `candidateProfilePage.fixture.ts` (richer
 * multi-step reference).
 *
 * Consumed by the EFLOW-10b bank-auth journey spec via the
 * `candidate-bank-auth-journey.ts` composition root.
 *
 * Surface:
 *  - clickStart()                  — click the preregister-start CTA on the
 *                                    preregister landing page.
 *  - submitElection()              — select the first selectable election in
 *                                    the election-selector list, then click
 *                                    preregister-elections-submit. Tolerates
 *                                    the single-election auto-select case
 *                                    (the checkbox is disabled + pre-checked).
 *  - submitConstituency()          — select the first real constituency option
 *                                    in EACH constituency-selector section
 *                                    (native <select> or autocomplete combobox
 *                                    — both rendered by the shared Select
 *                                    component), then click
 *                                    preregister-constituencies-submit.
 *  - fillEmailAndAcceptToU(email)  — fill preregister-email-input +
 *                                    preregister-email-confirm with `email`,
 *                                    check the terms-of-use checkbox, then
 *                                    click preregister-email-submit.
 *
 * **Selection mechanism (read from the page sources, not assumed):**
 *  - election-selector list (`preregister-elections-list`) renders one
 *    `election-selector-option` checkbox per election
 *    (ElectionSelector.svelte); a single election auto-selects + disables.
 *  - constituency-selector list (`preregister-constituencies-list`) renders
 *    one SingleGroupConstituencySelector per section, each a shared `Select`
 *    component that is EITHER a native `<select>` (autocomplete off) OR a
 *    `role="combobox"` input + `role="option"` listbox (autocomplete on).
 *    submitConstituency handles both shapes.
 *
 * All locators are testId-based (CLAUDE.md localization rule — the journey
 * runs on `/en`; never assert on localized strings).
 *
 * **Rigidity contract:** no soft assertions, no try/catch wrapping
 * assertions, no swallowed-rejection fallbacks on assertion-bearing locator
 * interactions (mirrors the candidate fixture convention).
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Select the first real option of a single constituency-selector combobox,
 * handling both rendered shapes the shared `Select` component produces:
 *  - native `<select>` (autocomplete off): selectOption by index 1 (index 0
 *    is the disabled placeholder `<option>`).
 *  - autocomplete combobox (`role="combobox"` input + `role="option"` list):
 *    click the input to open the listbox, then click the first option.
 *
 * Both shapes carry the implicit/explicit ARIA role `combobox`; the tag name
 * disambiguates which interaction to use.
 */
async function selectFirstConstituencyOption(combobox: Locator, optionScope: Locator): Promise<void> {
  const tagName = await combobox.evaluate((el) => el.tagName.toLowerCase());
  if (tagName === 'select') {
    // Native <select>: pick the first non-placeholder option by position.
    await combobox.selectOption({ index: 1 });
    return;
  }
  // Autocomplete combobox: open the listbox, then click the first option.
  await combobox.click();
  await optionScope.getByRole('option').first().click();
}

export function createCandidatePreregisterPage(page: Page) {
  return {
    /**
     * Click the preregister-start CTA on the preregister landing page.
     */
    async clickStart(): Promise<void> {
      await page.getByTestId(testIds.candidate.preregister.start).click();
    },

    /**
     * Select the first selectable election then advance. With >1 election the
     * checkboxes are enabled — check the first. With exactly one election the
     * ElectionSelector auto-selects + disables it, so a manual check is a
     * no-op; we guard on `isDisabled` to avoid clicking a disabled control.
     */
    async submitElection(): Promise<void> {
      const list = page.getByTestId(testIds.candidate.preregister.electionsList);
      const firstOption = list.getByTestId('election-selector-option').first();
      await expect(firstOption).toBeVisible();
      if (!(await firstOption.isDisabled())) {
        await firstOption.check();
      }
      await page.getByTestId(testIds.candidate.preregister.electionsSubmit).click();
    },

    /**
     * Select the first real constituency option in every selector section then
     * advance. Multiple selected elections produce multiple sections; each must
     * be satisfied before the submit button enables.
     */
    async submitConstituency(): Promise<void> {
      const list = page.getByTestId(testIds.candidate.preregister.constituenciesList);
      await expect(list).toBeVisible();
      // Each selector section renders one combobox (native <select> or
      // autocomplete input). Satisfy every section before submitting.
      const comboboxes = list.getByRole('combobox');
      const count = await comboboxes.count();
      expect(count, 'expected at least one constituency combobox to render').toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await selectFirstConstituencyOption(comboboxes.nth(i), list);
      }
      await page.getByTestId(testIds.candidate.preregister.constituenciesSubmit).click();
    },

    /**
     * Fill both email inputs with `email`, accept the terms of use, then submit
     * to trigger the preregistration invite email.
     */
    async fillEmailAndAcceptToU(email: string): Promise<void> {
      await page.getByTestId(testIds.candidate.preregister.emailInput).fill(email);
      await page.getByTestId(testIds.candidate.preregister.emailConfirm).fill(email);
      await page.getByTestId(testIds.candidate.terms.checkbox).check();
      await page.getByTestId(testIds.candidate.preregister.emailSubmit).click();
    }
  };
}

export type CandidatePreregisterPageFixture = ReturnType<typeof createCandidatePreregisterPage>;
