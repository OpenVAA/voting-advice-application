/**
 * @file phone.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `phone 320:` and `phone 390:` are a page of the editor, or the nominations view, at that width.
 *
 * Widths: the tests run at that width, in English. A page's width is measured against its viewport, and a box against the box that must hold it, through the steps of `fixtures/shared/pageGeometry.fixture.ts`: an accessibility scan reports neither. A fixture hands over the boxes; the test names what must lie inside what. A phone test of a later step loads that step's own address, so that it measures its own step and reads nothing of the steps before it; the election step's test also checks an election and reads that Continue can then be pressed.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  ALLIANCE_OPTIONS,
  CHANGED_SYMBOL,
  continueToDetails,
  DEFINE_NOMINATION_LABEL,
  EDIT_CANDIDATE_LIST_CARD,
  EDIT_ORGANIZATION_LIST_CARD,
  EDIT_ORGANIZATION_OPEN_CARD,
  ELECTIONS_THAT_ADMIT_A_CANDIDATE,
  ELECTIONS_THAT_ADMIT_A_PARTY,
  LIST_PARTY_OPTIONS,
  NEW_LIST_CARD,
  NEW_OPEN_CARD,
  NOTHING_ANSWERED,
  OPEN_PARTY_OPTIONS,
  REMOVED_NOTES,
  VIEW_SENTENCE
} from './helpers';
import {
  clearWrittenNominations,
  expect,
  nominationsOf,
  setAnswers,
  setAnswersLocked,
  setNominations,
  setNominationShape,
  startFrom,
  test
} from '../../../fixtures/contestant/perm-contestant-nominations';
import {
  CHILD_CANDIDATE,
  EDIT_CANDIDATE_EDITOR,
  EDIT_ORGANIZATION_EDITOR,
  LIST_ELECTION_EXTERNAL_ID,
  LIST_ELECTION_NAME,
  LONG_ORGANIZATION_NAME,
  NATION_CONSTITUENCY_NAME,
  NEW_CANDIDATE_EDITOR,
  NEW_ORGANIZATION_EDITOR,
  NORTH_CONSTITUENCY_EXTERNAL_ID,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_EXTERNAL_ID,
  OPEN_ELECTION_NAME,
  OPEN_NATION_CONTEST,
  SEEDED_NOMINATION_SHAPES
} from '../../../utils/permContestantNominationsData';
import { PHONE_VIEWPORTS, phoneUse } from '../../../utils/phoneViewports';
import type { EditorCardBoxes } from '../../../fixtures/contestant/contestantNominationEditor.fixture';
import type { PageGeometryFixture } from '../../../fixtures/shared/pageGeometry.fixture';

/** The selections the addresses of the later steps carry for those cards: both elections for the constituency step, both with the northern region for the details step, and the open election alone, whose one constituency no address needs to name. */
const NEW_CARDS_ELECTIONS = Object.freeze({ elections: [LIST_ELECTION_EXTERNAL_ID, OPEN_ELECTION_EXTERNAL_ID] });
const NEW_CARDS_SELECTION = Object.freeze({
  elections: [LIST_ELECTION_EXTERNAL_ID, OPEN_ELECTION_EXTERNAL_ID],
  constituencies: [NORTH_CONSTITUENCY_EXTERNAL_ID]
});
const OPEN_CARD_SELECTION = Object.freeze({ elections: [OPEN_ELECTION_EXTERNAL_ID] });

/** The most characters the symbol field and the name field of "Other" take. */
const SYMBOL_LIMIT = 50;
const OTHER_NAME_LIMIT = 100;

/** A symbol and a party name longer than their fields take, neither with a place to break a line at; and what each field holds of them. */
const OVERLONG_SYMBOL = '0123456789'.repeat(6);
const OVERLONG_PARTY_NAME = 'AbcdefghiJ'.repeat(12);
const SYMBOL_AT_LIMIT = OVERLONG_SYMBOL.slice(0, SYMBOL_LIMIT);
const PARTY_NAME_AT_LIMIT = OVERLONG_PARTY_NAME.slice(0, OTHER_NAME_LIMIT);

/**
 * A part of a card that the card must render, for a geometry step.
 * @param part - The part as the editor's fixture hands it over.
 * @param what - What the part is, for the failure message.
 * @throws If the card does not render the part.
 */
function rendered<TPart>(part: TPart | null, what: string): TPart {
  if (part === null) throw new Error(`contestant-nominations: the card renders no ${what}`);
  return part;
}

/**
 * Assert that a card holds every one of its option rows and its symbol field inside its own box.
 * @param pageGeometry - The geometry steps of the page.
 * @param boxes - The card and its parts, as the editor's fixture hands them over.
 * @param card - What the card is, for the failure messages.
 * @param optionCount - How many option rows the card holds.
 */
async function expectPartsInsideCard(
  pageGeometry: PageGeometryFixture,
  boxes: EditorCardBoxes,
  card: string,
  optionCount: number
): Promise<void> {
  expect(boxes.optionRows, `the option rows of ${card}`).toHaveLength(optionCount);
  for (const [index, row] of boxes.optionRows.entries())
    await pageGeometry.expectInside(row, boxes.card, `option ${index + 1} of ${card}`);
  await pageGeometry.expectInside(rendered(boxes.symbol, 'symbol field'), boxes.card, `the symbol field of ${card}`);
}

test.afterAll(async () => {
  await clearWrittenNominations();
});

for (const viewport of PHONE_VIEWPORTS) {
  test.describe(`contestant-nominations: at ${viewport.width}px wide`, () => {
    test.use(phoneUse(viewport));

    test.describe("as the unnominated candidate's editor", () => {
      test.use({ storageState: NEW_CANDIDATE_EDITOR.storageStatePath });

      test(
        `phone ${viewport.width}: the election step fits the viewport with a long election name`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
          await contestantNominationEditor.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectElections(ELECTIONS_THAT_ADMIT_A_CANDIDATE);
          await contestantNominationEditor.expectElectionsHint(true);
          await pageGeometry.expectNoHorizontalOverflow();

          // The page's own width does not show a name that a clipping container holds beyond the viewport's edge: the label's box does.
          const longNamed = await contestantNominationEditor.electionLabelBoxOf(LIST_ELECTION_NAME.en);
          await pageGeometry.expectWithinViewportWidth(longNamed, 'the label of the long-named election');
          await pageGeometry.expectShowsWholeText(longNamed, 'the label of the long-named election');

          // The checkbox beside the long name can be reached and checked, and Continue can then be pressed.
          await contestantNominationEditor.setElection(LIST_ELECTION_NAME.en, true);
          await contestantNominationEditor.expectElectionsHint(false);
          await contestantNominationEditor.expectElectionsContinue(true);
          await pageGeometry.expectNoHorizontalOverflow();
        }
      );

      test(
        `phone ${viewport.width}: the constituency step fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');

          // The step's own address, as a new document, with both elections chosen.
          await contestantNominationEditor.openStep(NEW_CANDIDATE_EDITOR.grant, 'constituencies', NEW_CARDS_ELECTIONS);
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.expectConstituencyPickers([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.expectConstituenciesContinue(false);
          await pageGeometry.expectNoHorizontalOverflow();

          // With a constituency chosen the picker shows its name, and Continue can be pressed.
          await contestantNominationEditor.chooseConstituency(NORTH_CONSTITUENCY_NAME.en);
          await contestantNominationEditor.expectConstituenciesContinue(true);
          await pageGeometry.expectNoHorizontalOverflow();
        }
      );

      test(
        `phone ${viewport.width}: new cards fit the viewport, and each option row, the name field and the symbol field lie inside their card`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          const listCard = { election: LIST_ELECTION_NAME.en };
          const openCard = { election: OPEN_ELECTION_NAME.en };
          await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');

          // The step's own address, as a new document, with both elections and the northern region chosen.
          await contestantNominationEditor.openStep(NEW_CANDIDATE_EDITOR.grant, 'details', NEW_CARDS_SELECTION);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([NEW_LIST_CARD, NEW_OPEN_CARD]);
          await contestantNominationEditor.expectParentHint(listCard, LONG_ORGANIZATION_NAME.en, true);
          await contestantNominationEditor.chooseParent(listCard, 'other');
          await contestantNominationEditor.expectOtherName(listCard, '');

          // The card with "Other" chosen: every option row, the name field and the symbol field lie inside it, and the long-named party is shown whole.
          const list = await contestantNominationEditor.boxesOf(listCard);
          await expectPartsInsideCard(pageGeometry, list, 'the closed-list card', LIST_PARTY_OPTIONS.length);
          await pageGeometry.expectInside(
            rendered(list.otherName, 'name field'),
            list.card,
            'the name field of the closed-list card'
          );
          const longNamed = await contestantNominationEditor.parentNameBoxOf(listCard, LONG_ORGANIZATION_NAME.en);
          await pageGeometry.expectShowsWholeText(longNamed, 'the name of the long-named party');
          await pageGeometry.expectInside(longNamed, list.card, 'the name of the long-named party');

          // The card with nothing chosen.
          const open = await contestantNominationEditor.boxesOf(openCard);
          await expectPartsInsideCard(pageGeometry, open, 'the open card', OPEN_PARTY_OPTIONS.length);
          await pageGeometry.expectNoHorizontalOverflow();

          // After a failed check both cards are in error and the page says so above its main button.
          await contestantNominationEditor.submit();
          await contestantNominationEditor.expectSaveMessage('invalid');
          await contestantNominationEditor.expectError(listCard, 'otherName');
          await contestantNominationEditor.expectError(openCard, 'parent');
          const listInError = await contestantNominationEditor.boxesOf(listCard);
          await pageGeometry.expectInside(
            rendered(listInError.otherName, 'name field'),
            listInError.card,
            'the name field in error'
          );
          await pageGeometry.expectNoHorizontalOverflow();
          await contestantNominationEditor.expectNoDialog();
        }
      );

      test(
        `phone ${viewport.width}: the nominations view with "Define your nomination" fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage }) => {
          await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
          await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
          await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyEditable.candidate, 'define');
          await contestantNominationsPage.expectButton('define');
          await contestantNominationsPage.expectButtonText(DEFINE_NOMINATION_LABEL);
          await contestantNominationsPage.expectFitsViewport();
        }
      );

      test(
        `phone ${viewport.width}: a symbol and a typed name at their limits are stored whole and shown in full on the nominations view`,
        { tag: '@nomination-definition' },
        async ({ contestantEntityPages, contestantNominationEditor, contestantNominationsPage, pageGeometry }) => {
          const openCard = { election: OPEN_ELECTION_NAME.en };
          await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
          await setAnswers(NEW_CANDIDATE_EDITOR.grant, NOTHING_ANSWERED);
          try {
            // The step's own address, as a new document, with the open election chosen.
            await contestantNominationEditor.openStep(NEW_CANDIDATE_EDITOR.grant, 'details', OPEN_CARD_SELECTION);
            await contestantNominationEditor.expectStep('details');
            await contestantNominationEditor.expectCards([NEW_OPEN_CARD]);
            await contestantNominationEditor.chooseParent(openCard, 'other');

            // More is typed than either field takes: each holds its limit and no more, and lies inside the card with it.
            await contestantNominationEditor.keyOtherName(openCard, OVERLONG_PARTY_NAME);
            await contestantNominationEditor.expectOtherName(openCard, PARTY_NAME_AT_LIMIT);
            await contestantNominationEditor.keySymbol(openCard, OVERLONG_SYMBOL);
            await contestantNominationEditor.expectSymbol(openCard, SYMBOL_AT_LIMIT);
            const filled = await contestantNominationEditor.boxesOf(openCard);
            await pageGeometry.expectInside(
              rendered(filled.symbol, 'symbol field'),
              filled.card,
              'the symbol field at its limit'
            );
            await pageGeometry.expectInside(
              rendered(filled.otherName, 'name field'),
              filled.card,
              'the name field at its limit'
            );
            await pageGeometry.expectNoHorizontalOverflow();

            // Continue stores both as the fields held them.
            await contestantNominationEditor.submit();
            await contestantNominationsPage.expectShown(NEW_CANDIDATE_EDITOR.grant);
            await contestantNominationEditor.expectNoStep();
            await contestantNominationsPage.pressButton('continue');
            await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_EDITOR.grant);
            expect(await nominationsOf(NEW_CANDIDATE_EDITOR.grant)).toEqual([
              {
                externalId: null,
                contest: OPEN_NATION_CONTEST,
                electionSymbol: SYMBOL_AT_LIMIT,
                confirmed: false,
                parentEntityExternalId: null,
                requestedParent: PARTY_NAME_AT_LIMIT
              }
            ]);

            // The nominations view, as a new document, shows both whole: neither has a place to break a line at, and each stays inside its card.
            await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
            await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
            await contestantNominationsPage.expectCardCount(1);
            await contestantNominationsPage.expectCardOf({
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              symbol: SYMBOL_AT_LIMIT,
              parent: null,
              confirmed: false,
              requestedParent: PARTY_NAME_AT_LIMIT
            });
            await contestantNominationsPage.expectCardValuesInsideCard(0);
            await contestantNominationsPage.expectFitsViewport();
            await contestantNominationEditor.expectNoDialog();
          } finally {
            await clearWrittenNominations();
            await setNominations(NEW_CANDIDATE_EDITOR.grant, 'none');
          }
        }
      );
    });

    test.describe("as the nominated party's editor", () => {
      test.use({ storageState: EDIT_ORGANIZATION_EDITOR.storageStatePath });

      test(
        `phone ${viewport.width}: an existing card and a removed card fit the viewport, with Remove and Keep inside their card, and so does the message of a refused removal`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          const listCard = { election: LIST_ELECTION_NAME.en };
          const openCard = { election: OPEN_ELECTION_NAME.en };
          await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
          await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, NOTHING_ANSWERED);
          // A candidate is listed under the party's nomination in the closed-list election.
          await setNominations(CHILD_CANDIDATE, 'seeded');
          await continueToDetails(contestantNominationEditor, EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.expectChangeSelection(true);

          // A kept card: its option rows, its filled symbol field and Remove lie inside it.
          const kept = await contestantNominationEditor.boxesOf(openCard);
          await expectPartsInsideCard(pageGeometry, kept, 'the kept card', ALLIANCE_OPTIONS.length);
          await pageGeometry.expectInside(rendered(kept.remove, 'Remove'), kept.card, 'Remove of the kept card');
          await pageGeometry.expectNoHorizontalOverflow();

          // A removed card: Keep lies inside it, under the line that says the nomination will be removed.
          await contestantNominationEditor.remove(listCard);
          await contestantNominationEditor.expectNotes(listCard, REMOVED_NOTES);
          const removed = await contestantNominationEditor.boxesOf(listCard);
          await pageGeometry.expectInside(rendered(removed.keep, 'Keep'), removed.card, 'Keep of the removed card');
          await pageGeometry.expectNoHorizontalOverflow();

          // The database refuses the removal, and the page says why above its main button.
          await contestantNominationEditor.submit();
          await contestantNominationEditor.expectSaveMessage('hasCandidates');
          await contestantNominationEditor.expectStep('details');
          await pageGeometry.expectNoHorizontalOverflow();
          await contestantNominationEditor.expectNoDialog();
        }
      );

      test(
        `phone ${viewport.width}: the nominations view with Return fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage }) => {
          await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
          await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, NOTHING_ANSWERED);
          await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listedEditable.organization);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectReturnAction();
          await contestantNominationsPage.expectCardValuesInsideCard(0);
          await contestantNominationsPage.expectCardValuesInsideCard(1);
          await contestantNominationsPage.expectFitsViewport();
        }
      );

      test(
        `phone ${viewport.width}: nominations listed while no election admits a party fit the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage }) => {
          await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
          try {
            for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setNominationShape(election, 'candidate_only');

            // A full page load after the types changed.
            await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
            await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: false });
            await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listed.organization);
            await contestantNominationsPage.expectCardCount(2);
            await contestantNominationsPage.expectNoEditAction();
            await contestantNominationsPage.expectFitsViewport();
          } finally {
            for (const election of ELECTIONS_THAT_ADMIT_A_PARTY)
              await setNominationShape(election, SEEDED_NOMINATION_SHAPES[election]);
          }
        }
      );
    });

    test.describe("as the nominated candidate's editor", () => {
      test.use({ storageState: EDIT_CANDIDATE_EDITOR.storageStatePath });

      test(
        `phone ${viewport.width}: the nominations view under the answers lock fits the viewport, and its note holds the support button`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage, notEditableNote }) => {
          await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
          try {
            await setAnswersLocked(true);

            // A full page load: the lock is a setting, read when a page is loaded.
            await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
            await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
            await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
            await contestantNominationsPage.expectCardCount(1);
            await contestantNominationsPage.expectCardValuesInsideCard(0);
            await notEditableNote.expectSupportButtonInsideNote();
            await contestantNominationsPage.expectFitsViewport();
          } finally {
            await setAnswersLocked(false);
          }
        }
      );

      test(
        `phone ${viewport.width}: the message that the nominations were changed elsewhere fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationEditor, pageGeometry }) => {
          const listCard = { election: LIST_ELECTION_NAME.en };
          await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
          await setAnswers(EDIT_CANDIDATE_EDITOR.grant, NOTHING_ANSWERED);
          try {
            await continueToDetails(contestantNominationEditor, EDIT_CANDIDATE_EDITOR.grant);
            await contestantNominationEditor.expectCards([EDIT_CANDIDATE_LIST_CARD]);

            // A kept card of a candidate: its party's row is the chosen one, and every row lies inside the card.
            const kept = await contestantNominationEditor.boxesOf(listCard);
            await expectPartsInsideCard(pageGeometry, kept, "the candidate's kept card", LIST_PARTY_OPTIONS.length);
            await pageGeometry.expectNoHorizontalOverflow();

            // While the editor is open, an administrator removes the nomination the card was built on. The save is not stored, and the page says so above its main button.
            await contestantNominationEditor.typeSymbol(listCard, CHANGED_SYMBOL);
            await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'none');
            await contestantNominationEditor.submit();
            await contestantNominationEditor.expectSaveMessage('changed');
            await contestantNominationEditor.expectCards([
              { ...EDIT_CANDIDATE_LIST_CARD, state: 'new', confirmed: false }
            ]);
            await pageGeometry.expectNoHorizontalOverflow();
            await contestantNominationEditor.expectNoDialog();
          } finally {
            await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
          }
        }
      );
    });

    test.describe("as the unnominated party's editor", () => {
      test.use({ storageState: NEW_ORGANIZATION_EDITOR.storageStatePath });

      test(
        `phone ${viewport.width}: the nominations view with no election to stand in fits the viewport`,
        { tag: '@nomination-definition' },
        async ({ contestantNominationsPage }) => {
          await startFrom(NEW_ORGANIZATION_EDITOR.grant, 'none');
          try {
            for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setNominationShape(election, 'candidate_only');

            // A full page load after the types changed.
            await contestantNominationsPage.open(NEW_ORGANIZATION_EDITOR.grant);
            await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: false });
            await contestantNominationsPage.expectEmptySentence(
              VIEW_SENTENCE.emptyNoElection.organization,
              'noElection'
            );
            await contestantNominationsPage.expectSupportButtons(1);
            await contestantNominationsPage.expectFitsViewport();
          } finally {
            for (const election of ELECTIONS_THAT_ADMIT_A_PARTY)
              await setNominationShape(election, SEEDED_NOMINATION_SHAPES[election]);
          }
        }
      );
    });
  });
}
