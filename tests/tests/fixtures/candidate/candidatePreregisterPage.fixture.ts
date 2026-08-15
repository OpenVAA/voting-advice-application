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
 *  - submitElection(label)         — select the election whose label carries
 *                                    `label` (identity, NOT position), then
 *                                    click preregister-elections-submit.
 *                                    Tolerates the single-election auto-select
 *                                    case (checkbox disabled + pre-checked).
 *  - submitConstituency(prefix)    — select the constituency labelled with
 *                                    `prefix` in EACH constituency-selector
 *                                    section (native <select> or autocomplete
 *                                    combobox — both rendered by the shared
 *                                    Select component), then click
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
 * Select a constituency-selector option BY LABEL, handling both rendered
 * shapes the shared `Select` component produces:
 *  - native `<select>` (autocomplete off): resolve the matching `<option>`'s
 *    value in-page, then `selectOption` it.
 *  - autocomplete combobox (`role="combobox"` input + `role="option"` list):
 *    open the listbox, then click the matching option.
 *
 * Both shapes carry the implicit/explicit ARIA role `combobox`; the tag name
 * disambiguates which interaction to use.
 *
 * Selection is by label, never by position (Phase 140 review iter-3 CR-01):
 * the provider orders constituencies with no guaranteed tiebreak across
 * datasets, so an index-based pick silently lands on a foreign constituency
 * whenever another dataset shares the DB.
 */
async function selectConstituencyOptionByLabel(
  combobox: Locator,
  optionScope: Locator,
  labelPrefix: string
): Promise<void> {
  const tagName = await combobox.evaluate((el) => el.tagName.toLowerCase());
  if (tagName === 'select') {
    // Native <select>: resolve the first enabled, non-placeholder option whose
    // visible text carries the dataset's label prefix, then select it by value.
    const value = await combobox.evaluate(
      (el, prefix) =>
        Array.from((el as HTMLSelectElement).options).find(
          (option) => !option.disabled && (option.textContent ?? '').trim().startsWith(prefix)
        )?.value ?? null,
      labelPrefix
    );
    expect(value, `no constituency option labelled '${labelPrefix}…' is offered`).not.toBeNull();
    await combobox.selectOption(value as string);
    return;
  }
  // Autocomplete combobox: open the listbox, then click the matching option.
  await combobox.click();
  const option = optionScope.getByRole('option').filter({ hasText: labelPrefix }).first();
  await expect(option, `no constituency option labelled '${labelPrefix}…' is offered`).toBeVisible();
  await option.click();
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
     * Select the election whose label carries `labelSubstring`, then advance.
     *
     * Selection is BY IDENTITY, never positional (Phase 140 review iter-3
     * CR-01). `supabaseDataProvider` orders elections by `sort_order` with no
     * secondary key, and separate datasets routinely both use `sort_order: 0`,
     * so Postgres returns tied rows in plan-dependent order. A `.first()` pick
     * therefore lands on a foreign election whenever another dataset shares the
     * DB — silently, because the preregister path writes no nomination row and
     * so raises no FK error. The `toHaveCount(1)` assertion below also
     * subsumes the presence check the caller would otherwise make: an absent
     * or ambiguous dataset fails here rather than being walked past.
     *
     * With exactly one election the ElectionSelector auto-selects + disables
     * it, so a manual check is a no-op; we guard on `isDisabled` to avoid
     * clicking a disabled control.
     */
    async submitElection(labelSubstring: string): Promise<void> {
      const list = page.getByTestId(testIds.candidate.preregister.electionsList);
      const option = list
        .getByTestId(testIds.candidate.preregister.electionLabel)
        .filter({ hasText: labelSubstring })
        .getByTestId(testIds.candidate.preregister.electionOption);
      await expect(
        option,
        `expected exactly one election labelled '${labelSubstring}' to be offered — a different ` +
          'count means the DB carries another dataset and this walk is not exercising its own'
      ).toHaveCount(1);
      if (!(await option.isDisabled())) {
        await option.check();
      }
      await page.getByTestId(testIds.candidate.preregister.electionsSubmit).click();
    },

    /**
     * Select the constituency labelled with `labelPrefix` in every selector
     * section, then advance. Multiple selected elections produce multiple
     * sections; each must be satisfied before the submit button enables.
     *
     * Like `submitElection`, selection is by label rather than by index, so a
     * foreign dataset sharing the DB fails the walk loudly instead of being
     * silently preregistered into (Phase 140 review iter-3 CR-01).
     */
    async submitConstituency(labelPrefix: string): Promise<void> {
      const list = page.getByTestId(testIds.candidate.preregister.constituenciesList);
      await expect(list).toBeVisible();
      // Each selector section renders one combobox (native <select> or
      // autocomplete input). Satisfy every section before submitting.
      const comboboxes = list.getByRole('combobox');
      const count = await comboboxes.count();
      expect(count, 'expected at least one constituency combobox to render').toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await selectConstituencyOptionByLabel(comboboxes.nth(i), list, labelPrefix);
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
