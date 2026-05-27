/**
 * perm-2e-shared — Phase 88 Plan 03 (test catalog audit).
 *
 * Topology: 2 elections sharing 1 CG with 1 CO.
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:142-145
 * Memo: .planning/phases/88-.../88-03-SCOPE.md (operator amendments A1 + A2).
 *
 * Rigidity contract (88-03-SCOPE.md:66-73): NO expect.soft, NO try/catch
 * around expect, NO best-effort .catch on assertion-bearing locators, NO
 * [xxx-followup] markers — every assertion is HARD.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import { bypassIntroAndExpectElectionSelector, expectQuestion, selectElectionAndAdvance } from '../../utils/voterIntro';

test.describe('perm-2e-shared', () => {
  test('user selects EL1 only: no constituency selection, lands on questions', async ({ page }) => {
    await bypassIntroAndExpectElectionSelector(page);
    // Set-only semantics (A1) + bracketed-symbol matching (A2): only [EL1]
    // ends checked, [EL2] ends unchecked, regardless of default-selection state.
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
