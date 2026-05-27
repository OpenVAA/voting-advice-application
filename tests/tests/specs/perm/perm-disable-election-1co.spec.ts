/**
 * perm-disable-election-1co — Phase 88 Plan 03 (test catalog audit).
 *
 * Topology: 2 elections share 1 CG with 1 CO; `disallowSelection: true`.
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:185-188
 *
 * Rigidity contract: every assertion HARD.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { bypassIntroAndExpectQuestion } from '../../utils/voterIntro';

test.describe('perm-disable-election-1co', () => {
  test('disallowSelection + 1 shared CO: no election OR constituency selector', async ({ page }) => {
    await bypassIntroAndExpectQuestion(page);
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();
  });
});
