/**
 * perm-1e1cg1co — Phase 88 Plan 03 (test catalog audit).
 *
 * Topology: 1 election → 1 constituency group → 1 constituency.
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:139-144
 * Memo: .planning/phases/88-.../88-03-SCOPE.md (read "Post-plan-check
 * resolutions" lines 8-21 first — they override conflicting prose below).
 *
 * Rigidity contract (88-03-SCOPE.md:66-73): NO expect.soft, NO try/catch
 * around expect, NO best-effort .catch on assertion-bearing locators, NO
 * [xxx-followup] markers — every assertion is HARD.
 *
 * Runs under playwright project `perm-1e1cg1co`, depends on
 * `data-setup-perm-1e1cg1co`. Lives under tests/tests/specs/perm/ (NEW
 * directory per HIGH-1) — outside the voter-app project's testDir
 * (`./tests/specs/voter`) so no testIgnore extension is needed on voter-app.
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
