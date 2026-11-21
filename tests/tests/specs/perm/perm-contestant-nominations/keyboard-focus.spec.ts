/**
 * @file keyboard-focus.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `keys:` is the parent group under the keyboard. `focus:` is where focus is after a navigation inside the editor.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  candidateToOpenCard,
  LISTED_PARTIES,
  NEW_LIST_CARD,
  NEW_OPEN_CARD,
  OPEN_PARTY_OPTIONS,
  OTHER_PARTY_OPTION
} from './helpers';
import {
  clearWrittenNominations,
  expect,
  startFrom,
  test
} from '../../../fixtures/contestant/perm-contestant-nominations';
import {
  LIST_ELECTION_NAME,
  NEW_CANDIDATE_EDITOR,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_NAME
} from '../../../utils/permContestantNominationsData';

/** The arrow presses that lead from the first option of a candidate's card in the open election, a listed party, to "Other". */
const ARROWS_FROM_FIRST_PARTY_TO_OTHER = OPEN_PARTY_OPTIONS.slice(
  1,
  OPEN_PARTY_OPTIONS.indexOf(OTHER_PARTY_OPTION) + 1
).map(() => 'ArrowDown');

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: the parent group under the keyboard, and focus after a navigation', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_EDITOR.storageStatePath });

    test(
      'keys: the parent group is one tab stop, the arrow keys move and choose, and Other chosen by arrow leaves focus on its radio',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const [firstParty, secondParty] = LISTED_PARTIES;
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        await candidateToOpenCard(contestantNominationEditor);
        await contestantNominationEditor.expectParentGroup(openCard, {
          shown: true,
          required: true,
          chosen: null,
          options: OPEN_PARTY_OPTIONS
        });

        // With nothing chosen the Tab key stops on one radio of the group, in either direction, and chooses nothing.
        expect(await contestantNominationEditor.parentTabStops(openCard)).toEqual({ forward: 1, backward: 1 });
        expect(await contestantNominationEditor.parentByKeyboard(openCard, [])).toEqual({
          chosen: null,
          focused: firstParty
        });

        // An arrow key moves to the next option and chooses it, and the opposite arrow moves back and chooses that one.
        expect(await contestantNominationEditor.parentByKeyboard(openCard, ['ArrowDown'])).toEqual({
          chosen: secondParty,
          focused: secondParty
        });
        expect(await contestantNominationEditor.parentByKeyboard(openCard, ['ArrowUp'])).toEqual({
          chosen: firstParty,
          focused: firstParty
        });

        // "Other" is reached with the arrow keys: it is chosen, its name field is shown, and focus is still on its radio.
        expect(await contestantNominationEditor.parentByKeyboard(openCard, ARROWS_FROM_FIRST_PARTY_TO_OTHER)).toEqual({
          chosen: OTHER_PARTY_OPTION,
          focused: OTHER_PARTY_OPTION
        });
        await contestantNominationEditor.expectOtherName(openCard, '');

        // The group is one tab stop with an option chosen too, and the name field is the stop after it.
        expect(await contestantNominationEditor.parentTabStops(openCard)).toEqual({ forward: 1, backward: 1 });
        expect(await contestantNominationEditor.parentByKeyboard(openCard, ['Tab'])).toEqual({
          chosen: OTHER_PARTY_OPTION,
          focused: 'otherName'
        });
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      "focus: the heading of each step takes focus after the navigation that opens it, a skip included, and the nominations view's after Cancel",
      { tag: '@nomination-definition' },
      async ({
        contestantEntityHomePage,
        contestantEntityPages,
        contestantNominationEditor,
        contestantNominationsPage
      }) => {
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');

        // From the home through every step: each navigation inside the application leaves focus on the heading of the step it opens.
        await contestantEntityPages.openHome(NEW_CANDIDATE_EDITOR.grant);
        await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
        expect(await contestantEntityHomePage.followNominationTask()).toBe('nominationElections');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });
        await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
        await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
        await contestantNominationEditor.continueFromElections();
        await contestantNominationEditor.expectStep('constituencies');
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });
        await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
        await contestantNominationEditor.continueFromConstituencies();
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([NEW_LIST_CARD, NEW_OPEN_CARD]);
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });

        // Cancel leads to the nominations view, with focus on its heading.
        await contestantNominationEditor.cancel();
        await contestantNominationsPage.expectShown(NEW_CANDIDATE_EDITOR.grant);
        await contestantNominationsPage.expectHeadingFocused();

        // From the home again, with the open election alone: it is held in one constituency, so Continue passes over the constituency step and focus is on the heading of the details step.
        await contestantEntityPages.openHome(NEW_CANDIDATE_EDITOR.grant);
        await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
        expect(await contestantEntityHomePage.followNominationTask()).toBe('nominationElections');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });
        await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
        await contestantNominationEditor.continueFromElections();
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([NEW_OPEN_CARD]);
        await contestantNominationEditor.expectFocusOn({ on: 'heading' });
        await contestantNominationEditor.expectNoDialog();
      }
    );
  });
});
