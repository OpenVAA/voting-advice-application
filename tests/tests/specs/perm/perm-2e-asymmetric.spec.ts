/**
 * Topology: EL-1=CG-1×co-1a; EL-2=CG-2(co-2a,co-2b) ALSO bound to CG-1.
 *
 * Rigidity contract: every assertion is HARD.
 */

import { expect, test } from '@playwright/test';
import {
  bypassIntroAndExpectElectionSelector,
  expectConstituencySelector,
  expectQuestion,
  selectConstituencyAndAdvance,
  selectElectionAndAdvance
} from '../../utils/voterIntro';

test.describe('perm-2e-asymmetric', () => {
  test('user selects both elections: constituency selector shows active CG-2 picker (CG-1 auto-implied)', async ({
    page
  }) => {
    await bypassIntroAndExpectElectionSelector(page);
    // Both elections selected via set-only semantics + bracketed symbols.
    await selectElectionAndAdvance(page, { optionText: /\[EL1\]|\[EL2\]/i });
    const constList = await expectConstituencySelector(page);
    // CG-1 has a single CO (co-1a) auto-implied; CG-2 has 2 COs requiring picker.
    // Expect at least one combobox (the CG-2 picker); the CG-1 picker may be visually disabled / not rendered as an active combobox.
    await expect(constList.getByRole('combobox').first()).toBeVisible();
    // Pick CG-2's CO-2A — matches the bracketed CG2 symbol.
    await selectConstituencyAndAdvance(page, {
      selectorText: /\[CG2\]/i,
      optionText: /\[CO2A\]/i
    });
    await expectQuestion(page);
  });
});
