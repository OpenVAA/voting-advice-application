/**
 * perm-startfromcg — Phase 88 Plan 03 (test catalog audit).
 *
 * Topology: EL-1=CG-1(2 parent COs); EL-2=CG-2(5 COs with parent refs to CG-1
 * + 1 orphan); `elections.startFromConstituencyGroup: CG-2` set at runtime.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:158-167
 * Memo: .planning/phases/88-.../88-03-SCOPE.md (HIGH-3 runtime-set
 * resolution).
 *
 * HIGH-3 mechanism: template OMITS elections.startFromConstituencyGroup;
 * this spec's beforeAll resolves CG-2 UUID via SupabaseAdminClient +
 * client.updateAppSettings — mirror variant-startfromcg.setup.ts:18-23 +
 * startfromcg.spec.ts:158-185.
 *
 * Rigidity contract: every assertion HARD.
 */

import { expect, test } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import {
  bypassIntroAndExpectConstituencySelector,
  expectElectionSelector,
  expectQuestion,
  selectConstituencyAndAdvance
} from '../../utils/voterIntro';

test.describe('perm-startfromcg', () => {
  test.describe.configure({ mode: 'serial' });

  let client: SupabaseAdminClient;
  let priorStartFromCg: string | null | undefined;

  test.beforeAll(async () => {
    client = new SupabaseAdminClient();
    const findResult = await client.findData('constituencyGroups', {
      externalId: { $eq: 'test-perm-startfromcg-cg-2' }
    });
    expect(
      findResult.type,
      'perm-startfromcg requires test-perm-startfromcg-cg-2 to be present in the seed'
    ).toBe('success');
    const cgDocumentId = findResult.data?.[0]?.documentId as string | undefined;
    expect(cgDocumentId, 'perm-startfromcg requires a discoverable CG-2 UUID').toBeTruthy();

    const persisted = await client.getAppSettings();
    priorStartFromCg =
      (persisted?.elections as { startFromConstituencyGroup?: string | null } | undefined)
        ?.startFromConstituencyGroup ?? null;

    await client.updateAppSettings({
      elections: { startFromConstituencyGroup: cgDocumentId }
    });
  });

  test.afterAll(async () => {
    if (client) {
      await client.updateAppSettings({
        elections: { startFromConstituencyGroup: priorStartFromCg ?? null }
      });
    }
  });

  test('selecting CO-1A1 (CG-2 leaf with parent CO-1A): election selector SHOWN', async ({ page }) => {
    await bypassIntroAndExpectConstituencySelector(page);
    // startFromConstituencyGroup: CG-2 means the user starts with CG-2 picker.
    await selectConstituencyAndAdvance(page, {
      selectorText: /\[CG2\]/i,
      optionText: /\[CO1A1\]/i
    });
    // After selecting CO-1A1 (parent: CO-1A which is EL-1's CG-1 constituency),
    // BOTH EL-1 and EL-2 apply → election selector shown with 2 options.
    const electionList = await expectElectionSelector(page);
    await expect(electionList.getByTestId(testIds.voter.elections.option)).toHaveCount(2);
  });

  test('selecting CO-1C (CG-2 orphan, no parent): election selector NOT shown', async ({ page }) => {
    await bypassIntroAndExpectConstituencySelector(page);
    await selectConstituencyAndAdvance(page, {
      selectorText: /\[CG2\]/i,
      optionText: /\[CO1C\]/i
    });
    // CO-1C has no parent → only EL-2 applies → election selector skipped.
    await expectQuestion(page);
    await expect(page.getByTestId(testIds.voter.elections.list)).toBeHidden();
  });
});
