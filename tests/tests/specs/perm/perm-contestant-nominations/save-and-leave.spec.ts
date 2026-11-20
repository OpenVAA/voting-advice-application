/**
 * @file save-and-leave.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `button:` is what the main button of the details step says and where a press of it leads. `refused:` is a save the database did not store, and what the page shows of it. `leave:` is leaving the details step with changes that are not saved. `stale:` is a save from an editor that was opened before nominations were locked. `closing:` is a save made after answers were locked. `saved:` is where a stored save leads, and where the user stays when reading the data again has moved them to another step.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  CHANGED_SYMBOL,
  continueToDetails,
  EDIT_CANDIDATE_LIST_CARD,
  EDIT_CANDIDATE_SEEDED_NOMINATION,
  EDIT_ORGANIZATION_LIST_CARD,
  EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
  EDIT_ORGANIZATION_LIST_VIEW_CARD,
  EDIT_ORGANIZATION_OPEN_CARD,
  EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION,
  EDIT_ORGANIZATION_OPEN_VIEW_CARD,
  EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID,
  REMOVED_NOTES,
  SOUTH_NOMINATION_SYMBOL
} from './helpers';
import {
  addNomination,
  clearWrittenNominations,
  expect,
  nominationsOf,
  setAnswers,
  setAnswersLocked,
  setNominations,
  setNominationsLocked,
  startFrom,
  test
} from '../../../fixtures/contestant/perm-contestant-nominations';
import {
  CHILD_CANDIDATE,
  EDIT_CANDIDATE_EDITOR,
  EDIT_CANDIDATE_ELECTION_SYMBOL,
  EDIT_ORGANIZATION_EDITOR,
  GREEN_ORGANIZATION_NAME,
  LIST_ELECTION_NAME,
  LIST_SOUTH_CONTEST,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_NAME,
  OPINION_QUESTION_EXTERNAL_IDS,
  SOUTH_CONSTITUENCY_NAME
} from '../../../utils/permContestantNominationsData';

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: the main button, a refused save and leaving', () => {
  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_EDITOR.storageStatePath });

    test(
      'button: an untouched set reads Continue, a change Save and Continue, and every card removed Save and Return',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });

        // Nothing is changed and the profile is still to do: the button continues, and saves nothing.
        await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
        await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
        await contestantNominationEditor.expectSubmit('continue', 'continue');

        // A changed symbol is something to save; the stored symbol typed back is not.
        await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
        await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
        await contestantNominationEditor.typeSymbol(listCard, EDIT_CANDIDATE_ELECTION_SYMBOL);
        await contestantNominationEditor.expectSubmit('continue', 'continue');

        // With its one card removed the entity would be left with no nomination, so the button returns.
        await contestantNominationEditor.remove(listCard);
        await contestantNominationEditor.expectSubmit('return', 'saveAndReturn');

        // Cancel leaves without asking and saves nothing.
        await contestantNominationEditor.cancel();
        await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
        expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'button: with no task left an untouched set reads Return, and a saved change returns to the home',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: true, opinions: OPINION_QUESTION_EXTERNAL_IDS });
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
          await contestantNominationEditor.expectSubmit('return', 'return');
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
          await contestantNominationEditor.expectSubmit('return', 'saveAndReturn');

          // The change is stored, and the press leads to the nominations view, whose main button returns to the entity's home with nothing left to do.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_EDITOR.grant);
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([
            { ...EDIT_CANDIDATE_SEEDED_NOMINATION, electionSymbol: CHANGED_SYMBOL, confirmed: false }
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
          await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        }
      }
    );

    test(
      'refused: nominations removed elsewhere are shown as they now are and the draft is dropped',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);

          // While the editor is open, an administrator removes the nomination the card was built on.
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'none');
          await contestantNominationEditor.submit();

          // Nothing was stored. The page says the nominations have changed and shows them as they now are: none, so the chosen election and constituency have a new card, with nothing of what was typed.
          await contestantNominationEditor.expectSaveMessage('changed');
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            { ...EDIT_CANDIDATE_LIST_CARD, state: 'new', confirmed: false }
          ]);
          await contestantNominationEditor.expectSymbol(listCard, '');
          await contestantNominationEditor.expectFocusOn({ on: 'submit' });
          await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'stale: a nominations lock that came on while the editor was open refuses the save and leads to the nominations view and its note',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);

          // While the editor is open, an administrator locks the nominations. The page still shows the editor.
          await setNominationsLocked(true);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.submit();

          // The database refuses the save, and the user is on the nominations view, which says why. Nothing was stored.
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectState({ state: 'listed', locked: true });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsLocked');
          await contestantNominationsPage.expectHeadingFocused();
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: true
          });
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominationsLocked(false);
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'closing: an answers lock that came on while the editor was open refuses the save and leads to the nominations view and its note',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);

          // While the editor is open, an administrator locks the answers. The page still shows the editor.
          await setAnswersLocked(true);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.submit();

          // The database refuses the save, and the user is on the nominations view, which says why and goes on to no task from there. Nothing was stored.
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: true
          });
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setAnswersLocked(false);
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );
  });

  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_EDITOR.storageStatePath });

    test(
      'refused: a nomination with candidates listed under it cannot be removed, and the card stays as it was',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const removedListCard = { ...EDIT_ORGANIZATION_LIST_CARD, state: 'removed' as const };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, { requiredInfo: false, opinions: [] });
        // A candidate is listed under the party's nomination in the closed-list election.
        await setNominations(CHILD_CANDIDATE, 'seeded');

        await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.remove(listCard);
        await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
        await contestantNominationEditor.submit();

        // The database refuses the removal. The page says why, the card is still about to be removed, and the button reads as it did.
        await contestantNominationEditor.expectSaveMessage('hasCandidates');
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([removedListCard, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.expectNotes(listCard, REMOVED_NOTES);
        await contestantNominationEditor.expectFocusOn({ on: 'submit' });
        await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
        expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
          EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
          EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
        ]);

        // Keep is still there and puts the card back. Nothing was stored: the view lists both nominations, confirmed.
        await contestantNominationEditor.keep(listCard);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.cancel();
        await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationsPage.expectCardCount(2);
        await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
        await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_OPEN_VIEW_CARD);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'leave: leaving with unsaved changes asks first, staying keeps the draft, and Cancel leaves without asking',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');

        await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.typeSymbol(openCard, CHANGED_SYMBOL);

        // The link back to the selection asks first. Answered with "stay", the step is still shown with what was typed.
        await contestantNominationEditor.leaveByChangingSelection('stay');
        await contestantNominationEditor.expectLeavePrompts(1);
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectSymbol(openCard, CHANGED_SYMBOL);

        // Cancel discards the change without asking.
        await contestantNominationEditor.cancel();
        await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationEditor.expectLeavePrompts(1);
        expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
          EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
          EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
        ]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'saved: a save that removes one of several nominations in an election leads on to the next task',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const southCard = { election: LIST_ELECTION_NAME.en, constituency: SOUTH_CONSTITUENCY_NAME.en };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, { requiredInfo: false, opinions: [] });
        await addNomination(EDIT_ORGANIZATION_EDITOR.grant, LIST_SOUTH_CONTEST, {
          externalId: EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID,
          electionSymbol: SOUTH_NOMINATION_SYMBOL
        });
        try {
          // The election with two nominations has no constituency to choose, so Continue leads straight to the cards and the address names no constituency for it.
          await contestantNominationEditor.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            EDIT_ORGANIZATION_LIST_CARD,
            { ...EDIT_ORGANIZATION_LIST_CARD, constituency: SOUTH_CONSTITUENCY_NAME.en, confirmed: false },
            EDIT_ORGANIZATION_OPEN_CARD
          ]);

          // With one of the two removed the election holds one nomination, and the address the save was made from no longer says where it is. The save is stored all the same, and leads on to the profile.
          await contestantNominationEditor.remove(southCard);
          await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_EDITOR.grant);
          expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        }
      }
    );
  });
});
