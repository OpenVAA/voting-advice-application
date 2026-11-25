/**
 * @file define.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `define:` is the editor for an entity with no nomination, from its entry address to the nominations the database then holds; `order:` and `saved:` are the order the editor keeps and where the save of a defined nomination leads.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  candidateToOpenCard,
  LISTED_PARTIES,
  NO_PARTY_OPTION,
  NOTHING_ANSWERED,
  OPEN_PARTY_OPTIONS,
  OTHER_PARTY_OPTION
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
  CANDIDATE_ONLY_ELECTION_NAME,
  GREEN_ORGANIZATION,
  GREEN_ORGANIZATION_NAME,
  LIST_ELECTION_NAME,
  LIST_NORTH_CONTEST,
  LIST_SOUTH_CONTEST,
  LONG_ORGANIZATION,
  LONG_ORGANIZATION_NAME,
  NATION_CONSTITUENCY_NAME,
  NEW_CANDIDATE_EDITOR,
  NEW_ORGANIZATION_NAME,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_NAME,
  OPEN_NATION_CONTEST,
  SOUTH_CONSTITUENCY_NAME
} from '../../../utils/permContestantNominationsData';

/** An election symbol as a user may type it, and as it is stored. */
const TYPED_SYMBOL = '  77  ';
const STORED_SYMBOL = '77';

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: defining nominations from none', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_EDITOR.storageStatePath });

    test(
      'define: a candidate with no nomination chooses its elections and a constituency, names a party and independence, and continues to the profile',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        await setAnswers(NEW_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          // The entry address, as a new document: every election that admits a candidate, none of them chosen.
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

          // Two elections are chosen. One of them has two constituencies, so the constituency step asks for that one alone.
          await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
          await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
          await contestantNominationEditor.expectElectionsHint(false);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.expectConstituenciesContinue(false);
          await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.continueFromConstituencies();

          // One new card for each pair, in the elections' order.
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            },
            {
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);
          await contestantNominationEditor.expectNotes(listCard, {
            confirmed: false,
            new: true,
            removed: false,
            previousConstituency: null
          });
          await contestantNominationEditor.expectStatus(listCard, null);
          await contestantNominationEditor.expectParentGroup(listCard, {
            shown: true,
            required: true,
            chosen: null,
            options: [...LISTED_PARTIES, OTHER_PARTY_OPTION]
          });
          await contestantNominationEditor.expectParentGroup(openCard, {
            shown: true,
            required: true,
            chosen: null,
            options: OPEN_PARTY_OPTIONS
          });
          await contestantNominationEditor.expectParentHint(listCard, GREEN_ORGANIZATION_NAME.en, false);
          await contestantNominationEditor.expectParentHint(listCard, NEW_ORGANIZATION_NAME.en, true);
          await contestantNominationEditor.expectSubmit('continue', 'saveAndContinue');

          // Continue with no party chosen where one is required: nothing is written, and the first group in error has focus.
          await contestantNominationEditor.submit();
          await contestantNominationEditor.expectSaveMessage('invalid');
          await contestantNominationEditor.expectError(listCard, 'parent');
          await contestantNominationEditor.expectFocusOn({ on: 'firstParentOption', card: listCard });
          await contestantNominationEditor.expectStep('details');
          expect(await nominationsOf(NEW_CANDIDATE_EDITOR.grant)).toEqual([]);

          // A listed party that is nominated at the pair, independence in the other election, and a symbol typed with spaces around it.
          await contestantNominationEditor.chooseParent(listCard, 'entity', GREEN_ORGANIZATION_NAME.en);
          await contestantNominationEditor.chooseParent(openCard, 'none');
          await contestantNominationEditor.typeSymbol(openCard, TYPED_SYMBOL);

          // Continue stores both and leads to the nominations view, whose Continue leads on to the next task, which is the profile.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_EDITOR.grant);
          expect(await nominationsOf(NEW_CANDIDATE_EDITOR.grant)).toEqual([
            {
              externalId: null,
              contest: LIST_NORTH_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: GREEN_ORGANIZATION.externalId,
              requestedParent: null
            },
            {
              externalId: null,
              contest: OPEN_NATION_CONTEST,
              electionSymbol: STORED_SYMBOL,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: null
            }
          ]);

          // The nominations view, as a new document, lists what was stored. The two rows state no order, so each card is named by its election.
          await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false });
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: false
          });
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: STORED_SYMBOL,
            parent: null,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(NEW_CANDIDATE_EDITOR.grant, 'none');
        }
      }
    );

    test(
      "define: a candidate names a party that is not nominated at its pair, and the party's nomination is added",
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        await setAnswers(NEW_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          // The closed-list election in its southern region, where no party is nominated.
          await contestantNominationEditor.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.chooseConstituency(SOUTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: SOUTH_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);

          // The party says under its name that it is not nominated there. Choosing it and continuing stores the candidate's nomination and adds the party's.
          await contestantNominationEditor.expectParentHint(listCard, LONG_ORGANIZATION_NAME.en, true);
          await contestantNominationEditor.chooseParent(listCard, 'entity', LONG_ORGANIZATION_NAME.en);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_EDITOR.grant);
          expect(await nominationsOf(NEW_CANDIDATE_EDITOR.grant)).toEqual([
            {
              externalId: null,
              contest: LIST_SOUTH_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: LONG_ORGANIZATION.externalId,
              requestedParent: null
            }
          ]);
          expect(await nominationsOf(LONG_ORGANIZATION)).toEqual([
            {
              externalId: null,
              contest: LIST_SOUTH_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: null
            }
          ]);

          // The nominations view, as a new document, names the party as the list.
          await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false });
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: SOUTH_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: LONG_ORGANIZATION_NAME.en,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await clearWrittenNominations();
          await setNominations(NEW_CANDIDATE_EDITOR.grant, 'none');
        }
      }
    );

    test(
      'order: the party options of a card end with Other and then No party',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        await candidateToOpenCard(contestantNominationEditor);

        // In an election in which a candidate may stand under no party, the listed parties come first, then "Other", and the option of no party last.
        expect(await contestantNominationEditor.parentOptionKinds(openCard)).toEqual([
          ...LISTED_PARTIES.map((party) => party.kind),
          OTHER_PARTY_OPTION.kind,
          NO_PARTY_OPTION.kind
        ]);

        // The card asks for the party first and for the election symbol after it.
        await contestantNominationEditor.expectSymbolAfterParentGroup(openCard);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'saved: a nomination added is shown on the nominations view, whose Continue leads on and whose Return leads home',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        await setAnswers(NEW_CANDIDATE_EDITOR.grant, NOTHING_ANSWERED);
        try {
          await candidateToOpenCard(contestantNominationEditor);
          await contestantNominationEditor.chooseParent(openCard, 'none');
          await contestantNominationEditor.typeSymbol(openCard, TYPED_SYMBOL);

          // The save leads to the nominations view, which lists the nomination just stored.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: STORED_SYMBOL,
            parent: null,
            confirmed: false
          });

          // Continue leads on to the next task, the profile; Return, beside it, leads to the home.
          await contestantNominationsPage.expectReturnAction();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.pressReturn();
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(NEW_CANDIDATE_EDITOR.grant, 'none');
        }
      }
    );
  });
});
