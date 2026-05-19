/**
 * Ne × Nc selector matrix variant E2E test (E2E-04 cell 4).
 *
 * Covers the STRONGEST matrix contract — the cross-bleed-free guarantee:
 *   - 2 elections → election selection page SHOWN with 2 options
 *   - 3 constituencies per election → constituency selection page SHOWN
 *   - When Election-1 is selected, the constituency dropdown lists ONLY
 *     Election-1's 3 constituencies; when Election-2 is selected, ONLY
 *     Election-2's 3 constituencies. NO option from E1 appears in E2's
 *     dropdown (and vice versa).
 *
 * Uses the `variant-Ne-Nc` Playwright project which depends on
 * `data-setup-Ne-Nc` (loads the Ne-Nc overlay: test-cg-Ne-Nc-e1 with
 * test-const-Ne-Nc-e1-{a,b,c} on test-election-1; test-cg-Ne-Nc-e2 with
 * test-const-Ne-Nc-e2-{a,b,c} on test-election-2; 18 nominations).
 *
 * Locator strategy (Open Question 2 resolution):
 *   - Same as 1e-Nc.spec.ts: the inner `constituency-selector` testId is
 *     overwritten by the parent's `voter-constituencies-list` via the
 *     {...concatClass(restProps, ...)} spread. We anchor to the outer
 *     `voter-constituencies-list` container and locate the inner
 *     `getByRole('combobox')` by accessible name. Click opens the listbox.
 *   - Cross-bleed assertion compares the option text contents collected
 *     across two passes (E1 selected, then E2 selected).
 *
 * Election-pre-check note: ElectionSelector.svelte:42-46 + +page.svelte:62-64
 * pre-check ALL elections by default. The cross-bleed test deliberately
 * UNCHECKS one election per pass so that only the target election's CG is
 * surfaced in the constituency selector.
 */

import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

// Ensure unauthenticated voter context.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Ne × Nc selector matrix (E2E-04 cell 4)', { tag: ['@variant', '@matrix'] }, () => {
  test('Ne × Nc — both selectors shown; constituency dropdown filters by selected election (no cross-bleed)', async ({
    page
  }) => {
    test.setTimeout(60000);

    // Navigate Home → Start → Intro
    await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
    await page.getByTestId(testIds.voter.home.startButton).click();

    const introStart = page.getByTestId(testIds.voter.intro.startButton);
    await introStart.waitFor({ state: 'visible', timeout: 10000 });
    await introStart.click();

    // (1) Election selector visible — 2 elections (not auto-implied).
    const electionsList = page.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible({ timeout: 10000 });
    const electionCards = page.getByTestId(testIds.voter.elections.card);
    await expect(electionCards).toHaveCount(2);

    // Both elections are pre-checked by default (ElectionSelector.svelte:42-46
    // + elections/+page.svelte:62-64).
    await expect(electionCards.nth(0)).toBeChecked();
    await expect(electionCards.nth(1)).toBeChecked();

    // === PASS 1: select ONLY Election 1, capture its constituency options ===

    // Uncheck Election 2; Election 1 remains checked.
    await electionCards.nth(1).uncheck();
    await expect(electionCards.nth(0)).toBeChecked();
    await expect(electionCards.nth(1)).not.toBeChecked();

    await page.getByTestId(testIds.voter.elections.continue).click();

    // Constituency selection page must appear — 3 constituencies on E1.
    const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // reason: ConstituencySelector.svelte:177 sets data-testid="constituency-selector"
    // on the same <div> that the parent's `data-testid="voter-constituencies-list"`
    // is spread onto via {...concatClass(restProps, ...)}, so the inner testId is
    // overwritten at the DOM level. We locate the combobox via its accessible
    // name (constituency-group name "Election 1 Constituencies (Ne×Nc)").
    const e1Combobox = constituenciesList.getByRole('combobox', { name: /Election 1 Constituencies/ });
    await expect(e1Combobox).toBeVisible({ timeout: 10000 });

    // Click combobox to open the listbox; Select.svelte:177-200 → autocomplete='on'
    // opens isOptionListOpen=true; <ul role="listbox"> mounts (Select.svelte:285).
    await e1Combobox.click();
    const e1Listbox = page.getByRole('listbox');
    await e1Listbox.waitFor({ state: 'visible', timeout: 5000 });

    const election1Options = await e1Listbox.getByRole('option').allTextContents();
    expect(election1Options).toHaveLength(3);
    // Trim whitespace from the captured option labels (the rendered <span>
    // children may include surrounding whitespace from the <li> template).
    const election1Trimmed = election1Options.map((s) => s.trim());

    // === PASS 2: navigate back, select ONLY Election 2, capture E2's options ===

    await page.goBack();
    await expect(electionsList).toBeVisible({ timeout: 10000 });

    // After going back, the `selected = voterCtx.selectedElections.map(...)`
    // effect (elections/+page.svelte:62-64) restores the prior selection
    // (only Election 1). We need to invert it to select only Election 2.
    // Re-check Election 2 first, then uncheck Election 1.
    await electionCards.nth(1).check();
    await electionCards.nth(0).uncheck();
    await expect(electionCards.nth(0)).not.toBeChecked();
    await expect(electionCards.nth(1)).toBeChecked();

    await page.getByTestId(testIds.voter.elections.continue).click();

    await expect(constituenciesList).toBeVisible({ timeout: 10000 });

    // For Election 2, the constituency-group name is "Election 2 Constituencies (Ne×Nc)".
    const e2Combobox = constituenciesList.getByRole('combobox', { name: /Election 2 Constituencies/ });
    await expect(e2Combobox).toBeVisible({ timeout: 10000 });

    await e2Combobox.click();
    const e2Listbox = page.getByRole('listbox');
    await e2Listbox.waitFor({ state: 'visible', timeout: 5000 });

    const election2Options = await e2Listbox.getByRole('option').allTextContents();
    expect(election2Options).toHaveLength(3);
    const election2Trimmed = election2Options.map((s) => s.trim());

    // === CROSS-BLEED NEGATIVE ASSERTION (the matrix contract) ===
    //
    // No Election-1 option text appears in the Election-2 dropdown. The
    // for-of loop is allowed under `playwright/no-conditional-in-test`
    // because it is NOT a conditional — it is iteration that issues a
    // single `expect(...).not.toContain(...)` per element.
    for (const e1Option of election1Trimmed) {
      expect(election2Trimmed).not.toContain(e1Option);
    }
    // Symmetric check (defense-in-depth — guarantees the inversion holds).
    for (const e2Option of election2Trimmed) {
      expect(election1Trimmed).not.toContain(e2Option);
    }
  });
});
