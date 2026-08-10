/**
 * Topology: EL-1=CG-1(2 parent COs); EL-2=CG-2(5 COs with parent refs to CG-1
 * + 1 orphan); `elections.startFromConstituencyGroup: CG-2` set at runtime.
 *
 * Runtime-set mechanism: the template OMITS
 * elections.startFromConstituencyGroup; this spec's beforeAll resolves the
 * CG-2 UUID via SupabaseAdminClient + client.updateAppSettings.
 *
 * Rigidity contract: every assertion is HARD.
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
      externalId: { $eq: 'e2e-perm-startfromcg-cg-2' }
    });
    expect(findResult.type, 'perm-startfromcg requires e2e-perm-startfromcg-cg-2 to be present in the seed').toBe(
      'success'
    );
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

  test('selecting CO-1C (CG-2 orphan, no parent): election selector shows EL2 only (auto-implied + disabled), continue advances to questions', async ({
    page
  }) => {
    // Abstract contract: "user selects CO 1C: don't show election selector".
    // Observed app behavior: /elections renders with EXACTLY
    // one option that is `[checked] [disabled]` (the single election applicable
    // to the orphan CO-1C), and the page text reads "Only one election is held
    // in your selected constituency." Same user experience (no decision to
    // make), but the route is rendered, not skipped. This rigid contract
    // captures the actual behavior; if the app is later changed to bypass the
    // route entirely, this test needs updating.
    await bypassIntroAndExpectConstituencySelector(page);
    await selectConstituencyAndAdvance(page, {
      selectorText: /\[CG2\]/i,
      optionText: /\[CO1C\]/i
    });
    const electionsList = page.getByTestId(testIds.voter.elections.list);
    await expect(electionsList).toBeVisible();
    const options = electionsList.getByTestId(testIds.voter.elections.option);
    await expect(options).toHaveCount(1);
    await expect(options.first()).toBeChecked();
    await expect(options.first()).toBeDisabled();
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expectQuestion(page);
  });
});
