/**
 * perm-missing-nominations — Phase 90 Plan 02 (TIR5:15-26).
 *
 * Topology: 2 elections, 1 shared CG/CO, 1 candidate, 1 candidate nomination
 * in el-1 only. The voter selects both elections → the missing-nominations
 * modal surfaces the 'some' variant with el-2 marked (no nominations for
 * this election).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-5.md:15-26.
 *
 * Rigidity contract (TIR5:5-13 + Phase 88 lineage): every assertion HARD —
 * no expect.soft, no try/catch wrapping expect(), no .catch fallbacks.
 *
 * Navigation shape: the voter app's election-selector page auto-populates
 * `selected` with every election in the dataset via a `$effect` (see
 * `apps/frontend/src/routes/(voters)/elections/+page.svelte:63-65`) — so a
 * single click on `voter-elections-continue` advances with BOTH el-1 and
 * el-2 selected. With one shared CG carrying one CO, the constituency
 * selector either auto-advances (single-CG/single-CO collapse) or accepts
 * a single continue click. The missing-nominations modal opens on FIRST
 * entry to `/results` per the layout's `modalShownForKey` debounce (Pitfall
 * 7 — no in-and-out bouncing).
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-missing-nominations', () => {
  test('voter selects both elections → missing-nominations modal shows el-2 as not-available', async ({
    page
  }) => {
    // 1. Voter home — click start to enter the election-selector route.
    await page.goto('/en');
    await page.getByTestId(testIds.voter.home.startButton).click();

    // 2. Election selector — both elections are auto-selected by the page's
    //    $effect (line 63-65 in elections/+page.svelte). Single click on the
    //    canonical continue testId submits the selection.
    await expect(page.getByTestId(testIds.voter.elections.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.elections.continue).click();

    // 3. Constituency selector — 1 CG with 1 CO renders the selector page
    //    with a single auto-checked option. Click the canonical continue
    //    button to advance into the (located) layout. The voter-not-located-
    //    redirect spec at tests/tests/specs/voter/voter-not-located-redirect
    //    .spec.ts:152-155 documents this as the unconditional canonical path.
    await expect(page.getByTestId(testIds.voter.constituencies.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // 4. Land on /results — explicit goto ensures we hit the (located) layout
    //    whose $effect opens the missing-nominations modal on FIRST entry
    //    (Pitfall 7 — no in-and-out bouncing across the same key).
    await page.goto('/en/results');

    // 5. Modal assertion — 'some' variant (1 of 2 elections has nominations).
    const modal = page.getByTestId(testIds.voter.missingNominationsModal);
    await expect(modal).toBeVisible();

    // 6. Stable-ID assertions per D-90-03 + D-90-06: assert on the seeded
    //    `[EL1]` / `[EL2]` prefixes in election names rendered inside the
    //    modal's per-election rows (apps/frontend/src/routes/(voters)/
    //    (located)/+layout.svelte:200-209).
    await expect(modal).toContainText(/\[EL1\]/);
    await expect(modal).toContainText(/\[EL2\]/);

    // 7. Localised "no nominations for this election" marker — verbatim text
    //    from apps/frontend/src/lib/i18n/translations/en/results.json
    //    `missingNominations.noNominationsForElection` = "not available".
    //    Asserted on the modal scope to bound the substring match.
    await expect(modal).toContainText(/not available/);
  });
});
