/**
 * Topology: 2 elections sharing 1 CG with 1 CO.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch around expect, no best-effort .catch on assertion-bearing locators.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { bypassIntroAndExpectElectionSelector, expectQuestion, selectElectionAndAdvance } from '../../utils/voterIntro';

test.describe('perm-2e-shared', () => {
  test('user selects EL1 only: no constituency selection, lands on questions', async ({ page }) => {
    await bypassIntroAndExpectElectionSelector(page);
    // Set-only semantics + bracketed-symbol matching: only [EL1] ends checked, [EL2] ends unchecked, regardless of default-selection state.
    await selectElectionAndAdvance(page, { optionText: /\[EL1\]/i });
    await expectQuestion(page);
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();
  });

  test('user selects both elections: no constituency selection, lands on questions', async ({ page }) => {
    await bypassIntroAndExpectElectionSelector(page);
    // Multi-option set-only: both [EL1] AND [EL2] end checked.
    await selectElectionAndAdvance(page, { optionText: /\[EL1\]|\[EL2\]/i });
    await expectQuestion(page);
    await expect(page.getByTestId(testIds.voter.constituencies.list)).toBeHidden();
  });
});
