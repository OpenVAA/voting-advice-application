/**
 * perm-disjoint-1co — Phase 88 Plan 03 (test catalog audit).
 *
 * Topology: 2 elections with disjoint CGs (CG-1 → co-1a, CG-2 → co-2a).
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:171-181
 * Memo: .planning/phases/88-.../88-03-SCOPE.md (operator amendments A1 + A2;
 * MED-6 iterateSelectOptions semantics).
 *
 * Rigidity contract: every assertion HARD.
 */

import { expect, test } from '@playwright/test';
import { iterateSelectOptions } from '../../helpers';
import { testIds } from '../../utils/testIds';
import {
  bypassIntroAndExpectElectionSelector,
  expectConstituencySelector,
  selectElectionAndAdvance
} from '../../utils/voterIntro';

test.describe('perm-disjoint-1co', () => {
  test('user selects only EL-1: constituency selector shows only CG-1', async ({ page }) => {
    await bypassIntroAndExpectElectionSelector(page);
    // Set-only (A1): ensure ONLY [EL1] ends checked.
    await selectElectionAndAdvance(page, { optionText: /\[EL1\]/i });
    const constList = await expectConstituencySelector(page);
    await expect(constList.getByRole('combobox')).toHaveCount(1);
  });

  test('user selects both elections: two pickers, continue disabled until both filled', async ({ page }) => {
    await bypassIntroAndExpectElectionSelector(page);
    // Multi-option set-only (A1+A2): both [EL1] AND [EL2] end checked.
    await selectElectionAndAdvance(page, { optionText: /\[EL1\]|\[EL2\]/i });
    const constList = await expectConstituencySelector(page);
    await expect(constList.getByRole('combobox')).toHaveCount(2);
    const cont = page.getByTestId(testIds.voter.constituencies.continue);
    await expect(cont).toBeDisabled();
    // Fill ONE combobox — MED-6: `.nth(0)` matches a SINGLE combobox so the
    // loop runs once and picks option 0 of THAT combobox.
    await iterateSelectOptions(page, constList.getByRole('combobox').nth(0));
    await expect(cont).toBeDisabled();
    // Fill second combobox — now enabled.
    await iterateSelectOptions(page, constList.getByRole('combobox').nth(1));
    await expect(cont).toBeEnabled();
  });
});
