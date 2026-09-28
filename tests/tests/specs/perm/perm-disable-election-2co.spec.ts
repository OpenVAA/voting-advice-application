/**
 * Topology: 2 elections share 1 CG with 2 COs; `disallowSelection: true`.
 *
 * Rigidity contract: every assertion is HARD.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import {
  bypassIntroThen,
  expectConstituencySelector,
  expectQuestion,
  selectConstituencyAndAdvance
} from '../../utils/voterIntro';

test.describe('perm-disable-election-2co', () => {
  test('disallowSelection + 2 COs: no election selector, constituency selector shown', async ({ page }) => {
    // Intro → directly to constituency selector (election step skipped).
    await bypassIntroThen(page, async () => {
      await expectConstituencySelector(page);
    });
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();
    // Pick co-1a via bracketed CG/CO symbols.
    await selectConstituencyAndAdvance(page, {
      selectorText: /\[CG1\]/i,
      optionText: /\[CO1A\]/i
    });
    await expectQuestion(page);
  });
});
