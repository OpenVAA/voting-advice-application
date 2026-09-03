/**
 * Topology: 2 elections share 1 CG with 1 CO; `disallowSelection: true`.
 *
 * Rigidity contract: every assertion is HARD.
 */

import { expect, test } from '@playwright/test';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { testIds } from '../../utils/testIds';
import { bypassIntroAndExpectQuestion } from '../../utils/voterIntro';

// the conditional voter nav-menu items — "Select an election" (elections.title) and "Select your constituency" (constituencies.title) — are OMITTED on this disallowSelection + single-shared-CO seed, where neither elections nor constituencies are selectable. VoterNav.svelte gates these NavItems on `electionsSelectable` / `constituenciesSelectable`. Labels (en) derived at build from the rendered drawer.
const SELECT_ELECTION_LABEL = /^Select an election$/;
const SELECT_CONSTITUENCY_LABEL = /^Select your constituency$/;

test.describe('perm-disable-election-1co', () => {
  test('disallowSelection + 1 shared CO: no election OR constituency selector', async ({ page }) => {
    await bypassIntroAndExpectQuestion(page);
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();

    // conditional voter nav item omitted (not-selectable seed).
    const navMenu = createNavMenu(page);
    await navMenu.openMobileNav();
    // The drawer is open and its items resolved (the always-present leading "Close menu" affordance) — so the absence checks below are a genuine omission of a rendered menu, not an unopened/empty drawer.
    await expect(navMenu.items().first()).toHaveAccessibleName(/close menu/i);
    await expect(navMenu.items().filter({ hasText: SELECT_ELECTION_LABEL })).toHaveCount(0);
    await expect(navMenu.items().filter({ hasText: SELECT_CONSTITUENCY_LABEL })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });
});
