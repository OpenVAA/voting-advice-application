/**
 * @file contestantHelpPage fixture.
 *
 * Function-fixture for the Contestant App's help page (`apps/frontend/src/routes/contestant/help/+page.svelte`): the questions and answers, the support block and the Home button. The page needs no session.
 *
 * Surface:
 *  - open() — navigate to the page and wait for its Home button and for the page to settle.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { settleNetworkIdle, TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createContestantHelpPage(page: Page) {
  return {
    /**
     * Navigate to the help page and wait until its Home button is visible and the network has settled.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppHelp', locale: 'en' }));
      await expect(page.getByTestId(testIds.contestant.help.home)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });
    }
  };
}

export type ContestantHelpPageFixture = ReturnType<typeof createContestantHelpPage>;
