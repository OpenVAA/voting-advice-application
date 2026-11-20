/**
 * @file edit.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `edit:` is the editor for an entity that has nominations: what it starts from, what a card shows and what a save stores.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  ALLIANCE_OPTIONS,
  CHANGED_SYMBOL,
  CONFIRMED_KEPT_NOTES,
  continueToDetails,
  EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID,
  EDIT_CANDIDATE_OTHER_ROUND_NOMINATION_EXTERNAL_ID,
  EDIT_CANDIDATE_SAME_CONTEST_NOMINATION_EXTERNAL_ID,
  EDIT_CANDIDATE_SEEDED_NOMINATION,
  EDIT_ORGANIZATION_LIST_CARD,
  EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
  EDIT_ORGANIZATION_LIST_VIEW_CARD,
  EDIT_ORGANIZATION_OPEN_CARD,
  EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION,
  EDIT_ORGANIZATION_OPEN_VIEW_CARD,
  EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID,
  LISTED_PARTIES,
  OTHER_PARTY_OPTION,
  PENDING_KEPT_NOTES,
  SOUTH_NOMINATION_SYMBOL,
  TYPED_PARTY_NAME
} from './helpers';
import {
  addNomination,
  clearWrittenNominations,
  expect,
  nominationsOf,
  setAnswers,
  setEntityConfirmed,
  setNominations,
  setNominationShape,
  startFrom,
  test
} from '../../../fixtures/contestant/perm-contestant-nominations';
import {
  CANDIDATE_ONLY_ELECTION_EXTERNAL_ID,
  CANDIDATE_ONLY_ELECTION_NAME,
  CANDIDATE_ONLY_NATION_CONTEST,
  COAST_ALLIANCE_NAME,
  EDIT_CANDIDATE_EDITOR,
  EDIT_CANDIDATE_ELECTION_SYMBOL,
  EDIT_ORGANIZATION_EDITOR,
  EDIT_ORGANIZATION_ELECTION_SYMBOL,
  EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID,
  GREEN_ORGANIZATION,
  GREEN_ORGANIZATION_NAME,
  INLAND_ALLIANCE,
  INLAND_ALLIANCE_NAME,
  LIST_ELECTION_NAME,
  LIST_NORTH_CONTEST,
  LIST_SOUTH_CONTEST,
  NATION_CONSTITUENCY_NAME,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_NAME,
  OPEN_NATION_CONTEST,
  SEEDED_NOMINATION_SHAPES,
  SOUTH_CONSTITUENCY_NAME
} from '../../../utils/permContestantNominationsData';

/** A round of the open election that is not its current one. */
const OTHER_ELECTION_ROUND = 2;

/** The green party as an option of a candidate's card, and the arrow presses that lead from it to the last option of a group that requires a party. */
const GREEN_PARTY_OPTION = Object.freeze({ kind: 'entity' as const, name: GREEN_ORGANIZATION_NAME.en });
const ARROWS_FROM_GREEN_TO_OTHER = LISTED_PARTIES.slice(
  LISTED_PARTIES.findIndex((party) => party.name === GREEN_ORGANIZATION_NAME.en)
).map(() => 'ArrowDown');

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: editing existing nominations', () => {
  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_EDITOR.storageStatePath });

    test(
      'edit: an entity with nominations starts from them',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const alliances = ALLIANCE_OPTIONS;
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');

        // Both elections the party stands in are checked on arrival, and the constituency it stands in is selected.
        await contestantNominationEditor.open(EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectElections([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.expectElectionsHint(false);
        await contestantNominationEditor.continueFromElections();
        await contestantNominationEditor.expectStep('constituencies');
        await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
        await contestantNominationEditor.expectChosenConstituency(NORTH_CONSTITUENCY_NAME.en);
        await contestantNominationEditor.continueFromConstituencies();

        // One card for each stored nomination, each with what is stored and the note that a change must be confirmed again.
        await contestantNominationEditor.expectStep('details');
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.expectNotes(listCard, CONFIRMED_KEPT_NOTES);
        await contestantNominationEditor.expectNotes(openCard, CONFIRMED_KEPT_NOTES);
        await contestantNominationEditor.expectStatus(listCard, 'confirmed');
        await contestantNominationEditor.expectStatus(openCard, 'confirmed');
        await contestantNominationEditor.expectSymbol(listCard, '');
        await contestantNominationEditor.expectSymbol(openCard, EDIT_ORGANIZATION_ELECTION_SYMBOL);
        await contestantNominationEditor.expectParentGroup(listCard, {
          shown: true,
          required: false,
          chosen: 'none',
          options: alliances
        });
        await contestantNominationEditor.expectParentGroup(openCard, {
          shown: true,
          required: false,
          chosen: 'none',
          options: alliances
        });
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'edit: saving an untouched set writes nothing and leaves a confirmed nomination confirmed',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, { requiredInfo: false, opinions: [] });

        await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
        await contestantNominationEditor.submit();
        await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationEditor.expectNoStep();
        await contestantNominationsPage.pressButton('continue');
        await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_EDITOR.grant);
        expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
          EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
          EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
        ]);

        await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationsPage.expectCardCount(2);
        await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
        await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_OPEN_VIEW_CARD);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'edit: a changed symbol is stored and the nomination waits for confirmation again',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.typeSymbol(openCard, CHANGED_SYMBOL);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_EDITOR.grant);
          expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            { ...EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION, electionSymbol: CHANGED_SYMBOL, confirmed: false }
          ]);

          // The nomination that was changed is pending; the one nobody touched is still confirmed.
          await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
          await contestantNominationsPage.expectCardOf({
            ...EDIT_ORGANIZATION_OPEN_VIEW_CARD,
            symbol: CHANGED_SYMBOL,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'edit: a party names an alliance that has no nomination at its pair',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          // The alliance that is nominated in the open election carries no hint there; the unconfirmed one, which is nominated nowhere, does.
          await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.expectParentHint(openCard, COAST_ALLIANCE_NAME.en, false);
          await contestantNominationEditor.expectParentHint(openCard, INLAND_ALLIANCE_NAME.en, true);
          await contestantNominationEditor.chooseParent(openCard, 'entity', INLAND_ALLIANCE_NAME.en);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_EDITOR.grant);
          expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            {
              ...EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION,
              confirmed: false,
              parentEntityExternalId: INLAND_ALLIANCE.externalId
            }
          ]);
          expect(await nominationsOf(INLAND_ALLIANCE)).toEqual([
            {
              externalId: null,
              contest: OPEN_NATION_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: null
            }
          ]);

          await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardOf({
            ...EDIT_ORGANIZATION_OPEN_VIEW_CARD,
            parent: INLAND_ALLIANCE_NAME.en,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await clearWrittenNominations();
          await setNominations(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'edit: several nominations in one election are kept as they are',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const northCard = { election: LIST_ELECTION_NAME.en, constituency: NORTH_CONSTITUENCY_NAME.en };
        const southCard = { election: LIST_ELECTION_NAME.en, constituency: SOUTH_CONSTITUENCY_NAME.en };
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const southNomination = {
          externalId: EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID,
          contest: LIST_SOUTH_CONTEST,
          electionSymbol: SOUTH_NOMINATION_SYMBOL,
          confirmed: false,
          parentEntityExternalId: null,
          requestedParent: null
        };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, { requiredInfo: false, opinions: [] });
        await addNomination(EDIT_ORGANIZATION_EDITOR.grant, LIST_SOUTH_CONTEST, {
          externalId: EDIT_ORGANIZATION_SOUTH_NOMINATION_EXTERNAL_ID,
          electionSymbol: SOUTH_NOMINATION_SYMBOL
        });
        try {
          // The election with two nominations is checked like the other. It has no constituency to choose, and the other election has one constituency, so Continue leads straight to the cards.
          await contestantNominationEditor.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            EDIT_ORGANIZATION_LIST_CARD,
            {
              election: LIST_ELECTION_NAME.en,
              constituency: SOUTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: false,
              moved: false
            },
            EDIT_ORGANIZATION_OPEN_CARD
          ]);
          await contestantNominationEditor.expectStatus(northCard, 'confirmed');
          await contestantNominationEditor.expectNotes(northCard, CONFIRMED_KEPT_NOTES);
          await contestantNominationEditor.expectSymbol(northCard, '');
          await contestantNominationEditor.expectStatus(southCard, 'pending');
          await contestantNominationEditor.expectNotes(southCard, PENDING_KEPT_NOTES);
          await contestantNominationEditor.expectSymbol(southCard, SOUTH_NOMINATION_SYMBOL);
          await contestantNominationEditor.expectSymbol(openCard, EDIT_ORGANIZATION_ELECTION_SYMBOL);

          // A change to one of the two is stored on that one alone.
          await contestantNominationEditor.typeSymbol(southCard, CHANGED_SYMBOL);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_ORGANIZATION_EDITOR.grant);
          expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            { ...southNomination, electionSymbol: CHANGED_SYMBOL },
            EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        }
      }
    );
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: EDIT_CANDIDATE_EDITOR.storageStatePath });

    test(
      'edit: a candidate replaces its party with a typed name, and later with a listed party',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          // The stored party is chosen on arrival. "Other" is reached with the arrow keys: focus stays on its radio, and the name field is the next tab stop.
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectParentGroup(listCard, {
            shown: true,
            required: true,
            chosen: 'entity',
            options: [...LISTED_PARTIES, OTHER_PARTY_OPTION]
          });
          expect(await contestantNominationEditor.parentByKeyboard(listCard, [])).toEqual({
            chosen: GREEN_PARTY_OPTION,
            focused: GREEN_PARTY_OPTION
          });
          expect(await contestantNominationEditor.parentByKeyboard(listCard, ARROWS_FROM_GREEN_TO_OTHER)).toEqual({
            chosen: OTHER_PARTY_OPTION,
            focused: OTHER_PARTY_OPTION
          });
          expect(await contestantNominationEditor.parentByKeyboard(listCard, ['Tab'])).toEqual({
            chosen: OTHER_PARTY_OPTION,
            focused: 'otherName'
          });
          await contestantNominationEditor.typeOtherName(listCard, TYPED_PARTY_NAME);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_EDITOR.grant);
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([
            {
              ...EDIT_CANDIDATE_SEEDED_NOMINATION,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: TYPED_PARTY_NAME
            }
          ]);

          // Opened again, the card starts from the stored name. A listed party chosen in its place removes the name.
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectParentGroup(listCard, {
            shown: true,
            required: true,
            chosen: 'other',
            options: [...LISTED_PARTIES, OTHER_PARTY_OPTION]
          });
          await contestantNominationEditor.expectOtherName(listCard, TYPED_PARTY_NAME);
          await contestantNominationEditor.expectStatus(listCard, 'pending');
          await contestantNominationEditor.chooseParent(listCard, 'entity', GREEN_ORGANIZATION_NAME.en);
          await contestantNominationEditor.expectOtherName(listCard, null);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_EDITOR.grant);
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([
            { ...EDIT_CANDIDATE_SEEDED_NOMINATION, confirmed: false }
          ]);

          // Opened once more, the listed party is chosen and the card shows no name field.
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          expect(await contestantNominationEditor.parentByKeyboard(listCard, [])).toEqual({
            chosen: GREEN_PARTY_OPTION,
            focused: GREEN_PARTY_OPTION
          });
          await contestantNominationEditor.expectOtherName(listCard, null);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      "edit: the radios of the party group draw their border in both colour schemes, and no row's content lies on its radio",
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectParentRadiosBordered(listCard);
          await contestantNominationEditor.expectParentRowsClear(listCard);
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'edit: a changed constituency moves the nomination and names the previous one',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          // The stored constituency is selected on arrival; the other one is selected in its place.
          await contestantNominationEditor.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.expectChosenConstituency(NORTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.chooseConstituency(SOUTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.continueFromConstituencies();

          // One card, at the new constituency, naming the previous one, with the symbol and the party that are stored. The party is not nominated in the new constituency and says so.
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: SOUTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: true,
              moved: true
            }
          ]);
          await contestantNominationEditor.expectNotes(listCard, {
            confirmed: true,
            new: false,
            removed: false,
            previousConstituency: NORTH_CONSTITUENCY_NAME.en
          });
          await contestantNominationEditor.expectSymbol(listCard, EDIT_CANDIDATE_ELECTION_SYMBOL);
          expect(await contestantNominationEditor.parentByKeyboard(listCard, [])).toEqual({
            chosen: GREEN_PARTY_OPTION,
            focused: GREEN_PARTY_OPTION
          });
          await contestantNominationEditor.expectParentHint(listCard, GREEN_ORGANIZATION_NAME.en, true);

          // The save leaves one nomination, at the new constituency, which waits for confirmation.
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_EDITOR.grant);
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([
            {
              externalId: null,
              contest: LIST_SOUTH_CONTEST,
              electionSymbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
              confirmed: false,
              parentEntityExternalId: GREEN_ORGANIZATION.externalId,
              requestedParent: null
            }
          ]);
          await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: SOUTH_CONSTITUENCY_NAME.en,
            symbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await clearWrittenNominations();
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'edit: a party that is no longer listed stays chosen and is kept by a save',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const listedWithoutGreen = LISTED_PARTIES.filter((party) => party.name !== GREEN_ORGANIZATION_NAME.en);
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          // The candidate's party is no longer confirmed, so a candidate is not offered it. The step after the change is a full page load.
          await setEntityConfirmed(GREEN_ORGANIZATION, false);
          await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectParentGroup(listCard, {
            shown: true,
            required: true,
            chosen: 'unlisted',
            options: [{ kind: 'unlisted', name: GREEN_ORGANIZATION_NAME.en }, ...listedWithoutGreen, OTHER_PARTY_OPTION]
          });
          await contestantNominationEditor.expectParentHint(listCard, GREEN_ORGANIZATION_NAME.en, true);

          // A save that changes the symbol leaves the party as it is.
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_EDITOR.grant);
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([
            { ...EDIT_CANDIDATE_SEEDED_NOMINATION, electionSymbol: CHANGED_SYMBOL, confirmed: false }
          ]);
          await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: CHANGED_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: false
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
          await setEntityConfirmed(GREEN_ORGANIZATION, true);
        }
      }
    );

    test(
      'edit: two nominations at one contest cannot name the same list',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor }) => {
        const secondCard = { election: LIST_ELECTION_NAME.en, nth: 1 };
        const secondNomination = {
          externalId: EDIT_CANDIDATE_SAME_CONTEST_NOMINATION_EXTERNAL_ID,
          contest: LIST_NORTH_CONTEST,
          electionSymbol: null,
          confirmed: false,
          parentEntityExternalId: EDIT_ORGANIZATION_EDITOR.grant.externalId,
          requestedParent: null
        };
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await addNomination(EDIT_CANDIDATE_EDITOR.grant, LIST_NORTH_CONTEST, {
          externalId: EDIT_CANDIDATE_SAME_CONTEST_NOMINATION_EXTERNAL_ID,
          parent: { kind: 'nomination', externalId: EDIT_ORGANIZATION_LIST_NOMINATION_EXTERNAL_ID }
        });
        try {
          // Two nominations in one election leave no constituency to choose, so Continue leads straight to the two cards.
          await contestantNominationEditor.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: true,
              moved: false
            },
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: false,
              moved: false
            }
          ]);

          // The second card is given the party the first one names: the press writes nothing and the second card's group says why.
          await contestantNominationEditor.chooseParent(secondCard, 'entity', GREEN_ORGANIZATION_NAME.en);
          await contestantNominationEditor.submit();
          await contestantNominationEditor.expectSaveMessage('invalid');
          await contestantNominationEditor.expectError(secondCard, 'parent');
          await contestantNominationEditor.expectFocusOn({ on: 'firstParentOption', card: secondCard });
          await contestantNominationEditor.expectStep('details');
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([
            EDIT_CANDIDATE_SEEDED_NOMINATION,
            secondNomination
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      "edit: a nomination outside the editor's reach has no card and survives a save",
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage }) => {
        const listCard = { election: LIST_ELECTION_NAME.en };
        const otherRoundNomination = {
          externalId: EDIT_CANDIDATE_OTHER_ROUND_NOMINATION_EXTERNAL_ID,
          contest: OPEN_NATION_CONTEST,
          electionSymbol: null,
          confirmed: false,
          parentEntityExternalId: null,
          requestedParent: null
        };
        const closedElectionNomination = {
          externalId: EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID,
          contest: CANDIDATE_ONLY_NATION_CONTEST,
          electionSymbol: null,
          confirmed: true,
          parentEntityExternalId: null,
          requestedParent: null
        };
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        await addNomination(EDIT_CANDIDATE_EDITOR.grant, OPEN_NATION_CONTEST, {
          externalId: EDIT_CANDIDATE_OTHER_ROUND_NOMINATION_EXTERNAL_ID,
          electionRound: OTHER_ELECTION_ROUND
        });
        await addNomination(EDIT_CANDIDATE_EDITOR.grant, CANDIDATE_ONLY_NATION_CONTEST, {
          externalId: EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID,
          confirmed: true
        });
        try {
          // The election of the second added nomination no longer admits a candidate. The step after the change is a full page load.
          await setNominationShape(CANDIDATE_ONLY_ELECTION_EXTERNAL_ID, 'organization_only');

          // The election of the other round is offered and not checked; the election that admits no candidate is not offered.
          await contestantNominationEditor.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectElections([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            {
              election: LIST_ELECTION_NAME.en,
              constituency: NORTH_CONSTITUENCY_NAME.en,
              state: 'kept',
              confirmed: true,
              moved: false
            }
          ]);

          // A save that changes the one card leaves both other nominations as they were.
          await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(EDIT_CANDIDATE_EDITOR.grant);
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([
            closedElectionNomination,
            { ...EDIT_CANDIDATE_SEEDED_NOMINATION, electionSymbol: CHANGED_SYMBOL, confirmed: false },
            otherRoundNomination
          ]);
          await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(3);
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: false
          });
          await contestantNominationsPage.expectCardOf({
            election: CANDIDATE_ONLY_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: true
          });
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
          await setNominationShape(
            CANDIDATE_ONLY_ELECTION_EXTERNAL_ID,
            SEEDED_NOMINATION_SHAPES[CANDIDATE_ONLY_ELECTION_EXTERNAL_ID]
          );
        }
      }
    );
  });
});
