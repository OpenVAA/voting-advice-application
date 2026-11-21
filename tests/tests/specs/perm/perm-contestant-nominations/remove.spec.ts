/**
 * @file remove.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `remove:` is a card that is to be removed, kept again, or removed by the save.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  CHANGED_SYMBOL,
  CONFIRMED_KEPT_NOTES,
  continueToDetails,
  EDIT_ORGANIZATION_LIST_CARD,
  EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
  EDIT_ORGANIZATION_LIST_VIEW_CARD,
  EDIT_ORGANIZATION_OPEN_CARD,
  EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION,
  REMOVED_NOTES
} from './helpers';
import {
  clearWrittenNominations,
  expect,
  nominationsOf,
  setAnswers,
  setNominations,
  startFrom,
  test
} from '../../../fixtures/contestant/perm-contestant-nominations';
import {
  EDIT_CANDIDATE_EDITOR,
  EDIT_ORGANIZATION_EDITOR,
  EDIT_ORGANIZATION_ELECTION_SYMBOL,
  LIST_ELECTION_NAME,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_NAME
} from '../../../utils/permContestantNominationsData';

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: removing nominations', () => {
  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_EDITOR.storageStatePath });

    test(
      'remove: a removed card says so, can be kept, and is deleted on Continue',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const removedOpenCard = { ...EDIT_ORGANIZATION_OPEN_CARD, state: 'removed' as const };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.typeSymbol(openCard, CHANGED_SYMBOL);

          // Remove writes nothing: the card says it is to be removed, shows no field, and focus is on its Keep.
          await contestantNominationEditor.remove(openCard);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, removedOpenCard]);
          await contestantNominationEditor.expectNotes(openCard, REMOVED_NOTES);
          await contestantNominationEditor.expectParentGroup(openCard, { shown: false });
          await contestantNominationEditor.expectFocusOn({ on: 'keep', card: openCard });
          expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
          ]);

          // Keep restores the card with what was typed, and focus is on its Remove.
          await contestantNominationEditor.keep(openCard);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.expectNotes(openCard, CONFIRMED_KEPT_NOTES);
          await contestantNominationEditor.expectSymbol(openCard, CHANGED_SYMBOL);
          await contestantNominationEditor.expectFocusOn({ on: 'remove', card: openCard });

          // Removed again, the nomination is deleted by Continue.
          await contestantNominationEditor.remove(openCard);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_EDITOR.grant);
          expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION
          ]);
          await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'remove: unchecking an election starts its card as removed',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');

        await contestantNominationEditor.open(EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, false);
        await contestantNominationEditor.continueFromElections();
        await contestantNominationEditor.expectStep('constituencies');
        await contestantNominationEditor.continueFromConstituencies();

        // The nomination of the unchecked election has its card, which says it is to be removed. Nothing has been written, and Keep puts the card back.
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([
          EDIT_ORGANIZATION_LIST_CARD,
          { ...EDIT_ORGANIZATION_OPEN_CARD, state: 'removed' }
        ]);
        await contestantNominationEditor.expectNotes(openCard, REMOVED_NOTES);
        expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
          EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
          EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
        ]);
        await contestantNominationEditor.keep(openCard);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.expectSymbol(openCard, EDIT_ORGANIZATION_ELECTION_SYMBOL);
        await contestantNominationEditor.expectNoDialog();
      }
    );
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_EDITOR.storageStatePath });

    test(
      'remove: removing every nomination returns to the home with the first task open again',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantHomePage, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);

          // The one card is removed, and is still shown.
          await contestantNominationEditor.remove(listCard);
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'removed',
              confirmed: true,
              moved: false
            }
          ]);
          await contestantNominationEditor.expectNotes(listCard, REMOVED_NOTES);

          // Continue removes the nomination and leads to the nominations view, which offers a nomination to define and Return; Return leads to the home, where defining a nomination is the task to do.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectButton('define');
          await contestantNominationsPage.pressReturn();
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_EDITOR.grant);
          await contestantHomePage.expectTaskList({
            nomination: 'incomplete',
            profile: 'blocked',
            questions: 'blocked'
          });
          await contestantHomePage.expectNextStep('nomination');
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );
  });
});
