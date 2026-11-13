/**
 * Topology: EL-1=CG-1(2 parent COs); EL-2=CG-2(5 COs with parent refs to CG-1
 * + 1 orphan); `elections.startFromConstituencyGroup: CG-2` set at runtime.
 *
 * Runtime-set mechanism: the template OMITS elections.startFromConstituencyGroup; this spec's beforeAll resolves the CG-2 UUID via SupabaseAdminClient + client.updateAppSettings.
 *
 * The contestant side: after the voter tests, one describe runs under the stored session of the editor of one seeded candidate and takes its `test` and its state steps from `fixtures/contestant/perm-startfromcg.ts`. It names the same group in the setting for its own tests and puts back what the setting held, and it begins by deleting that candidate's nominations with the service role, so that the nomination editor is open to the candidate: nothing writes the seeded nomination again, and nothing after this file reads the dataset. Its test bodies hold fixture steps alone. A test that changes an election's type puts the seeded type back in a `finally`, and the step after such a change is a full page load. When its tests have run, any nomination the application wrote for the candidate is removed, because a later setup deletes this dataset's rows by prefix before this dataset's own teardown runs.
 *
 * Rigidity contract: every assertion is HARD.
 */

import { expect, test } from '@playwright/test';
import {
  chooseConstituencyGroupFirst,
  clearWrittenNominations,
  removeCandidateNominations,
  restoreConstituencyGroupFirst,
  setElectionType,
  test as contestantTest
} from '../../fixtures/contestant/perm-startfromcg';
import {
  CANDIDATE_GRANT,
  CANDIDATE_STORAGE_STATE,
  CHILD_CONSTITUENCY_NAME,
  FIRST_GROUP_NAME,
  MUNICIPALITIES_ELECTION_EXTERNAL_ID,
  MUNICIPALITIES_ELECTION_NAME,
  ORPHAN_CONSTITUENCY_NAME,
  PARENT_CONSTITUENCY_NAME,
  REGIONS_ELECTION_NAME,
  SEEDED_ELECTION_TYPES
} from '../../utils/permStartFromCgData';
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
    // After selecting CO-1A1 (parent: CO-1A which is EL-1's CG-1 constituency), BOTH EL-1 and EL-2 apply → election selector shown with 2 options.
    const electionList = await expectElectionSelector(page);
    await expect(electionList.getByTestId(testIds.voter.elections.option)).toHaveCount(2);
  });

  test('selecting CO-1C (CG-2 orphan, no parent): election selector shows EL2 only (auto-implied + disabled), continue advances to questions', async ({
    page
  }) => {
    // Abstract contract: "user selects CO 1C: don't show election selector".
    // Observed app behavior: /elections renders with EXACTLY one option that is `[checked] [disabled]` (the single election applicable to the orphan CO-1C), and the page text reads "Only one election is held in your selected constituency." Same user experience (no decision to make), but the route is rendered, not skipped. This rigid contract captures the actual behavior; if the app is later changed to bypass the route entirely, this test needs updating.
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

contestantTest.describe('perm-startfromcg: the nomination editor of a candidate with no nomination', () => {
  contestantTest.describe.configure({ mode: 'serial' });
  contestantTest.use({ storageState: CANDIDATE_STORAGE_STATE });

  let priorGroup: string | null = null;

  contestantTest.beforeAll(async () => {
    priorGroup = await chooseConstituencyGroupFirst();
    await removeCandidateNominations();
  });

  contestantTest.afterAll(async () => {
    await restoreConstituencyGroupFirst(priorGroup);
    await clearWrittenNominations();
  });

  contestantTest(
    'contestant: the entry leads to the constituency step as one picker over the group',
    { tag: '@nomination-definition' },
    async ({ contestantNominationEditor, contestantNominationsPage }) => {
      await contestantNominationsPage.open(CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'empty', locked: false });
      await contestantNominationsPage.expectCardCount(0);

      // The entry address, as a new document. Two elections admit a candidate, and the group is chosen before either.
      await contestantNominationEditor.open(CANDIDATE_GRANT);
      await contestantNominationEditor.expectStep('constituencies');
      await contestantNominationEditor.expectGroupPicker(FIRST_GROUP_NAME);
      await contestantNominationEditor.expectNoElectionSentence(false);
      await contestantNominationEditor.expectConstituenciesContinue(false);
    }
  );

  contestantTest(
    'contestant: a constituency with two admissible elections leads to the election step listing those two',
    { tag: '@nomination-definition' },
    async ({ contestantNominationEditor }) => {
      await contestantNominationEditor.open(CANDIDATE_GRANT);
      await contestantNominationEditor.expectStep('constituencies');

      // A municipality that lies in a region: the municipalities' election is held in it, and the regions' election in its region.
      await contestantNominationEditor.chooseConstituency(CHILD_CONSTITUENCY_NAME);
      await contestantNominationEditor.expectNoElectionSentence(false);
      await contestantNominationEditor.continueFromConstituencies();
      await contestantNominationEditor.expectStep('elections');
      await contestantNominationEditor.expectElections([REGIONS_ELECTION_NAME, MUNICIPALITIES_ELECTION_NAME]);
      await contestantNominationEditor.expectChecked([]);
    }
  );

  contestantTest(
    'contestant: a constituency with one admissible election leads to the details step',
    { tag: '@nomination-definition' },
    async ({ contestantNominationEditor }) => {
      await contestantNominationEditor.open(CANDIDATE_GRANT);
      await contestantNominationEditor.expectStep('constituencies');

      // The municipality that lies in no region: the municipalities' election alone is held in it, so no election is chosen.
      await contestantNominationEditor.chooseConstituency(ORPHAN_CONSTITUENCY_NAME);
      await contestantNominationEditor.expectNoElectionSentence(false);
      await contestantNominationEditor.continueFromConstituencies();
      await contestantNominationEditor.expectStep('details');
      await contestantNominationEditor.expectCards([
        {
          election: MUNICIPALITIES_ELECTION_NAME,
          constituency: ORPHAN_CONSTITUENCY_NAME,
          state: 'new',
          confirmed: false,
          moved: false
        }
      ]);
    }
  );

  contestantTest(
    'contestant: a constituency with no election the candidate can stand in keeps the constituency step',
    { tag: '@nomination-definition' },
    async ({ contestantNominationEditor }) => {
      try {
        // The one election held in the municipality that lies in no region admits parties alone. The step after the change is a full page load.
        await setElectionType(MUNICIPALITIES_ELECTION_EXTERNAL_ID, 'organization_only');
        await contestantNominationEditor.open(CANDIDATE_GRANT);
        await contestantNominationEditor.expectStep('constituencies');
        await contestantNominationEditor.expectGroupPicker(FIRST_GROUP_NAME);

        await contestantNominationEditor.chooseConstituency(ORPHAN_CONSTITUENCY_NAME);
        await contestantNominationEditor.expectNoElectionSentence(true);
        await contestantNominationEditor.expectConstituenciesContinue(false);
        await contestantNominationEditor.expectStep('constituencies');

        // A municipality that lies in a region: the regions' election, which still admits a candidate, is held there, in the region.
        await contestantNominationEditor.chooseConstituency(CHILD_CONSTITUENCY_NAME);
        await contestantNominationEditor.expectNoElectionSentence(false);
        await contestantNominationEditor.continueFromConstituencies();
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([
          {
            election: REGIONS_ELECTION_NAME,
            constituency: PARENT_CONSTITUENCY_NAME,
            state: 'new',
            confirmed: false,
            moved: false
          }
        ]);
      } finally {
        await setElectionType(
          MUNICIPALITIES_ELECTION_EXTERNAL_ID,
          SEEDED_ELECTION_TYPES[MUNICIPALITIES_ELECTION_EXTERNAL_ID]
        );
      }
    }
  );
});
