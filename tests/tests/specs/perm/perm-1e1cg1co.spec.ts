/**
 * Topology: 1 election → 1 constituency group → 1 constituency.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch
 * around expect, no best-effort .catch on assertion-bearing locators.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { bypassIntroAndExpectQuestion } from '../../utils/voterIntro';

test.describe('perm-1e1cg1co', () => {
  test('no election or constituency selector; lands on questions directly', async ({ page }) => {
    await bypassIntroAndExpectQuestion(page);
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();
  });
});
