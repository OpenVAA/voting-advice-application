/**
 * @file steps.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `steps:` is which of the editor's steps an entity with no nomination meets, and in which order.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  clearWrittenNominations,
  setElectionSelectionDisallowed,
  setNominationShape,
  startFrom,
  test
} from '../../../fixtures/contestant/perm-contestant-nominations';
import {
  CANDIDATE_ONLY_ELECTION_NAME,
  LIST_ELECTION_EXTERNAL_ID,
  LIST_ELECTION_NAME,
  NATION_CONSTITUENCY_NAME,
  NEW_CANDIDATE_EDITOR,
  NEW_ORGANIZATION_EDITOR,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_EXTERNAL_ID,
  OPEN_ELECTION_NAME,
  SEEDED_NOMINATION_SHAPES
} from '../../../utils/permContestantNominationsData';

/** Two ids in the form of a row's id that name no row: no election and no constituency. */
const UNKNOWN_ELECTION_ID = '0d1e2f30-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
const UNKNOWN_CONSTITUENCY_ID = '1f2e3d4c-5b6a-4978-8695-a4b3c2d1e0f9';

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: the steps an entity with no nomination meets', () => {
  test.describe("as the unnominated party's editor", () => {
    test.use({ storageState: NEW_ORGANIZATION_EDITOR.storageStatePath });

    test(
      'steps: a party meets the election step with only the elections a party can stand in',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await startFrom(NEW_ORGANIZATION_EDITOR.grant, 'none');
        await contestantNominationEditor.open(NEW_ORGANIZATION_EDITOR.grant);
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectElections([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectElectionsHint(true);
        await contestantNominationEditor.expectElectionsContinue(false);
      }
    );

    test(
      'steps: one admissible election with one constituency leads straight to the cards',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await startFrom(NEW_ORGANIZATION_EDITOR.grant, 'none');
        try {
          // The closed-list election admits candidates alone, so one election admits a party, and it has one constituency. The step after the change is a full page load.
          await setNominationShape(LIST_ELECTION_EXTERNAL_ID, 'candidate_only');
          await contestantNominationEditor.open(NEW_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);
        } finally {
          await setNominationShape(LIST_ELECTION_EXTERNAL_ID, SEEDED_NOMINATION_SHAPES[LIST_ELECTION_EXTERNAL_ID]);
        }
      }
    );

    test(
      'steps: one admissible election with several constituencies shows the constituency step alone',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await startFrom(NEW_ORGANIZATION_EDITOR.grant, 'none');
        try {
          // The open election admits candidates alone, so one election admits a party, and it has two constituencies. The step after the change is a full page load.
          await setNominationShape(OPEN_ELECTION_EXTERNAL_ID, 'candidate_only');
          await contestantNominationEditor.open(NEW_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.expectNoElectionSentence(false);
          await contestantNominationEditor.expectConstituenciesContinue(false);
          await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);
        } finally {
          await setNominationShape(OPEN_ELECTION_EXTERNAL_ID, SEEDED_NOMINATION_SHAPES[OPEN_ELECTION_EXTERNAL_ID]);
        }
      }
    );

    test(
      'steps: with no admissible election every editor address leads to the nominations view',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(NEW_ORGANIZATION_EDITOR.grant, 'none');
        try {
          // No election admits a party. Each step after the change is a full page load.
          await setNominationShape(LIST_ELECTION_EXTERNAL_ID, 'candidate_only');
          await setNominationShape(OPEN_ELECTION_EXTERNAL_ID, 'candidate_only');
          for (const step of ['elections', 'constituencies', 'details'] as const) {
            await contestantNominationEditor.openStep(NEW_ORGANIZATION_EDITOR.grant, step);
            await contestantNominationsPage.expectShown(NEW_ORGANIZATION_EDITOR.grant);
            await contestantNominationEditor.expectNoStep();
          }
        } finally {
          await setNominationShape(LIST_ELECTION_EXTERNAL_ID, SEEDED_NOMINATION_SHAPES[LIST_ELECTION_EXTERNAL_ID]);
          await setNominationShape(OPEN_ELECTION_EXTERNAL_ID, SEEDED_NOMINATION_SHAPES[OPEN_ELECTION_EXTERNAL_ID]);
        }
      }
    );
  });

  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_EDITOR.storageStatePath });

    test(
      'steps: an address that names an unknown election or constituency leads back to the entry',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        await contestantNominationEditor.openStep(NEW_CANDIDATE_EDITOR.grant, 'details', {
          electionIds: [UNKNOWN_ELECTION_ID],
          constituencyIds: [UNKNOWN_CONSTITUENCY_ID]
        });
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectElections([
          LIST_ELECTION_NAME.en,
          OPEN_ELECTION_NAME.en,
          CANDIDATE_ONLY_ELECTION_NAME.en
        ]);
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectNoTextOnPage(UNKNOWN_ELECTION_ID);
        await contestantNominationEditor.expectNoTextOnPage(UNKNOWN_CONSTITUENCY_ID);
      }
    );

    test(
      "steps: disallowing election selection does not choose an entity's elections",
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        try {
          // The setting implies every election for a voter. The step after the change is a full page load.
          await setElectionSelectionDisallowed(true);
          await contestantNominationEditor.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectElections([
            LIST_ELECTION_NAME.en,
            OPEN_ELECTION_NAME.en,
            CANDIDATE_ONLY_ELECTION_NAME.en
          ]);
          await contestantNominationEditor.expectChecked([]);
          await contestantNominationEditor.expectElectionsHint(true);
          await contestantNominationEditor.expectElectionsContinue(false);
        } finally {
          await setElectionSelectionDisallowed(false);
        }
      }
    );
  });
});
