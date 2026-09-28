/**
 * Topology: 1 election → 1 constituency group → 1 constituency.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch around expect, no best-effort .catch on assertion-bearing locators.
 */

import { expect, test } from '@playwright/test';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { testIds } from '../../utils/testIds';
import { bypassIntroAndExpectQuestion } from '../../utils/voterIntro';

// the conditional voter nav-menu items — "Select an election" (elections.title, gated on electionsSelectable) and "Select your constituency" (constituencies.title, gated on constituenciesSelectable) — are OMITTED when the seed makes neither selectable. VoterNav.svelte renders these NavItems only inside `{#if voterCtx.electionsSelectable}` / `{#if voterCtx.constituenciesSelectable}`, so on this 1e/1cg/1co seed they must be absent. Labels (en) derived at build from the rendered drawer.
const SELECT_ELECTION_LABEL = /^Select an election$/;
const SELECT_CONSTITUENCY_LABEL = /^Select your constituency$/;

test.describe('perm-1e1cg1co', () => {
  test('no election or constituency selector; lands on questions directly', async ({ page }) => {
    await bypassIntroAndExpectQuestion(page);
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();

    // conditional voter nav item omitted (not-selectable seed).
    const navMenu = createNavMenu(page);
    await navMenu.openMobileNav();
    // The drawer is open and its items resolved (the always-present leading "Close menu" affordance) — so the absence checks below are a genuine omission of a rendered menu, not an unopened/empty drawer.
    await expect(navMenu.items().first()).toHaveAccessibleName(/close menu/i);
    // The two conditional selector items are omitted from the voter nav-menu.
    await expect(navMenu.items().filter({ hasText: SELECT_ELECTION_LABEL })).toHaveCount(0);
    await expect(navMenu.items().filter({ hasText: SELECT_CONSTITUENCY_LABEL })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });
});
