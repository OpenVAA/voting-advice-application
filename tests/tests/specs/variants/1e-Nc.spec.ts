/**
 * 1e × Nc selector matrix variant E2E test (E2E-04 cell 2).
 *
 * Covers the matrix contract for cell 2 of the selector matrix:
 *   - 1 election → election selection page BYPASSED (auto-implied)
 *   - N=3 constituencies under that election → constituency selection page SHOWN
 *   - constituency dropdown lists exactly 3 options
 *
 * Uses the `variant-1e-Nc` Playwright project which depends on
 * `data-setup-1e-Nc` (loads the 1e-Nc overlay: test-cg-1e-Nc with
 * test-const-1e-Nc-{a,b,c} on test-election-1).
 *
 * The constituency selector is rendered via the custom DaisyUI `<Select>`
 * component in autocomplete=on mode (3 constituencies → not auto-implied),
 * which uses the ARIA combobox + listbox pattern (NOT a native <select>).
 *
 * Locator strategy (Open Question 2 resolution):
 *   - The `constituency-selector` testId from ConstituencySelector.svelte:177
 *     is OVERWRITTEN by the parent's `voter-constituencies-list` testId due
 *     to {...concatClass(restProps, ...)} spread on the same <div>. We thus
 *     anchor to `testIds.voter.constituencies.list` (the outer container),
 *     then locate the inner `getByRole('combobox', { name: /Constituencies/ })`
 *     (the constituency-group name from the 1e-Nc template is
 *     "1e-Nc Constituencies"). Clicking the combobox opens the
 *     `<ul role="listbox">` (only rendered when isOptionListOpen).
 */

import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

// Ensure unauthenticated voter context (mirror multi-election.spec.ts:34).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('1e × Nc selector matrix (E2E-04 cell 2)', { tag: ['@variant', '@matrix'] }, () => {
  test('1e × Nc — election selection bypassed; constituency selector shown with 3 options', async ({ page }) => {
    test.setTimeout(30000);

    // Navigate Home → Start → Intro
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();

    const introStart = page.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible', timeout: 10000 });
    await introStart.click();

    // (1) Election selection page is BYPASSED — 1 election auto-implies the
    // electionId in (located)/+layout.ts:38-43, redirecting straight to
    // /constituencies. The voter-elections-list testId must be HIDDEN.
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();

    // (2) Constituency selection page is SHOWN — N=3 constituencies; not
    // auto-implied; (located)/+layout.ts:55-67 redirects to /constituencies.
    const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // (3) The dropdown lists exactly 3 options (test-const-1e-Nc-a/b/c).
    // The constituency-selector renders as a DaisyUI <Select> in
    // autocomplete=on mode (SingleGroupConstituencySelector.svelte:74 —
    // `group.singleConstituency ? 'off' : 'on'`; 3 constituencies → 'on').
    // The combobox is the inner <input role="combobox">; the listbox <ul
    // role="listbox"> only renders while `isOptionListOpen` (Select.svelte:285).
    //
    // reason: ConstituencySelector.svelte:177 sets data-testid="constituency-selector"
    // on the same <div> that the parent's `data-testid="voter-constituencies-list"`
    // is spread onto via {...concatClass(restProps, ...)}, so the inner testId is
    // OVERWRITTEN at the DOM level. We locate the combobox via its
    // accessible name (from the constituency-group name) instead.
    // The constituency-group name in variant-1e-Nc.ts is "1e-Nc Constituencies".
    const combobox = constituenciesList.getByRole('combobox', { name: /1e-Nc Constituencies|Constituencies/ });
    await expect(combobox).toBeVisible();

    // Click the combobox to open the listbox (Select.svelte:177-200 — focus
    // sets isOptionListOpen=true; the listbox <ul role="listbox"> mounts).
    await combobox.click();

    const listbox = page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });

    // Exactly 3 options correspond to the 3 new constituencies.
    await expect(listbox.getByRole('option')).toHaveCount(3);

    // (4) Continuing with a selection reaches questions/intro — proves the
    // matrix contract is end-to-end consistent (selection completes the
    // location-gate).
    await listbox.getByRole('option', { name: /1e-Nc Constituency A/ }).click();

    const continueButton = page.getByTestId(testIds.voter.constituencies.continue);
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    // After continue, the voter is on /questions (or an interstitial)
    // — proves the constituency selection terminated the location-gate.
    await expect(page).toHaveURL(/\/questions/, { timeout: 10000 });
  });
});
