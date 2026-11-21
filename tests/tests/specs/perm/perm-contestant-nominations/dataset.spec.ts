/**
 * @file dataset.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `dataset:` is the dataset, its identities and its state steps.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import { clearWrittenNominations, startFrom, test } from '../../../fixtures/contestant/perm-contestant-nominations';
import {
  EDIT_ORGANIZATION_EDITOR,
  EDIT_ORGANIZATION_ELECTION_SYMBOL,
  LIST_ELECTION_NAME,
  NATION_CONSTITUENCY_NAME,
  NEW_CANDIDATE_EDITOR,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_NAME
} from '../../../utils/permContestantNominationsData';

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: the dataset, its identities and its state steps', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_EDITOR.storageStatePath });

    test('dataset: a candidate with no nomination is on its home with the nomination task open', async ({
      contestantEntityHomePage,
      contestantHomePage,
      contestantNominationsPage
    }) => {
      await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(NEW_CANDIDATE_EDITOR.grant);
      await contestantHomePage.expectTaskList({ nomination: 'incomplete', profile: 'blocked', questions: 'blocked' });
      await contestantHomePage.expectNextStep('nomination');
      await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
      await contestantNominationsPage.expectState({ state: 'empty', locked: false });
      await contestantNominationsPage.expectCardCount(0);
    });
  });

  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_EDITOR.storageStatePath });

    test("dataset: a party's seeded nominations are listed as confirmed", async ({ contestantNominationsPage }) => {
      await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
      await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
      await contestantNominationsPage.expectState({ state: 'listed', locked: false });
      await contestantNominationsPage.expectCardCount(2);
      await contestantNominationsPage.expectCard(0, {
        election: LIST_ELECTION_NAME.en,
        constituency: NORTH_CONSTITUENCY_NAME.en,
        symbol: null,
        parent: null,
        confirmed: true
      });
      await contestantNominationsPage.expectCard(1, {
        election: OPEN_ELECTION_NAME.en,
        constituency: NATION_CONSTITUENCY_NAME.en,
        symbol: EDIT_ORGANIZATION_ELECTION_SYMBOL,
        parent: null,
        confirmed: true
      });
    });
  });
});
