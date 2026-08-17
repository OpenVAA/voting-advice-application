/**
 * Topology: 2 elections, 1 shared CG/CO, 1 candidate, 1 candidate nomination
 * in el-1 only. The voter selects both elections → the missing-nominations
 * modal surfaces the 'some' variant with el-2 marked (no nominations for
 * this election).
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch
 * wrapping expect(), no .catch fallbacks.
 *
 * Navigation shape: the voter app's election-selector page auto-populates
 * `selected` with every election in the dataset via a `$effect` (see
 * `apps/frontend/src/routes/(voters)/elections/+page.svelte:63-65`) — so a
 * single click on `voter-elections-continue` advances with BOTH el-1 and
 * el-2 selected. With one shared CG carrying one CO, the constituency
 * selector either auto-advances (single-CG/single-CO collapse) or accepts
 * a single continue click. The missing-nominations modal opens on FIRST
 * entry to `/results` per the layout's `modalShownForKey` debounce (no
 * in-and-out bouncing).
 */

import { expect, test } from '../../fixtures/voter/views';
import { testIds } from '../../utils/testIds';

test.describe('perm-missing-nominations', () => {
  test('voter selects both elections → missing-nominations modal shows el-2 as not-available', async ({
    page,
    voterHomePage
  }) => {
    // 1. Voter home and intro — click start to enter the election-selector route.
    await voterHomePage.goToPage('en');
    await page.getByTestId(testIds.voter.home.startButton).click();
    await page.getByTestId(testIds.voter.intro.startButton).click();

    // 2. Election selector — both elections are auto-selected by the page's
    //    $effect (line 63-65 in elections/+page.svelte). Single click on the
    //    canonical continue testId submits the selection.
    await expect(page.getByTestId(testIds.voter.elections.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.elections.continue).click();

    // 3. Modal assertion — 'some' variant (1 of 2 elections has nominations).
    const modal = page.getByTestId(testIds.voter.missingNominationsModal);
    await expect(modal).toBeVisible();

    // 4. Stable-ID assertions: assert on the seeded
    //    `[EL1]` / `[EL2]` prefixes in election names rendered inside the
    //    modal's per-election rows (apps/frontend/src/routes/(voters)/
    //    (located)/+layout.svelte:200-209).
    await expect(modal).toContainText(/\[EL1\]/);
    await expect(modal).toContainText(/\[EL2\]/);

    // 5. Localised "no nominations for this election" marker — verbatim text
    //    from apps/frontend/src/lib/i18n/translations/en/results.json
    //    `missingNominations.noNominationsForElection` = "not available".
    //    Asserted on the modal scope to bound the substring match.
    await expect(modal).toContainText(/not available/);
  });
});
