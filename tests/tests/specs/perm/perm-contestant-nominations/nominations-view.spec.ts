/**
 * @file nominations-view.spec.ts — perm-chain spec, one surface of the `perm-contestant-nominations` project.
 *
 * `nominations-view:` is the nominations view: what it says and offers in each of its states, and that every address of the editor leads to it while nominations cannot be edited. `entry:` is the way from the home into the editor. `holds:` is where the home's nomination task leads when it does not lead into the editor. `follow:` is the home, the nominations view and the questions after a save, with no new document loaded in between.
 *
 * The dataset, the sessions, the order of the tests and the rigidity contract every spec of this folder keeps are described in `helpers.ts`.
 */

import {
  DEFINE_NOMINATION_LABEL,
  EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID,
  EDIT_CANDIDATE_LIST_CARD,
  EDIT_CANDIDATE_OPEN_NOMINATION_EXTERNAL_ID,
  EDIT_CANDIDATE_SEEDED_NOMINATION,
  EDIT_CANDIDATE_TYPED_PARTY_NOMINATION_EXTERNAL_ID,
  EDIT_ORGANIZATION_LIST_CARD,
  EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
  EDIT_ORGANIZATION_LIST_VIEW_CARD,
  EDIT_ORGANIZATION_OPEN_CARD,
  EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION,
  ELECTIONS_THAT_ADMIT_A_PARTY,
  NOTHING_ANSWERED,
  TYPED_PARTY_NAME,
  VIEW_SENTENCE
} from './helpers';
import {
  addNomination,
  clearWrittenNominations,
  expect,
  nominationsOf,
  setAnswers,
  setContestantEditing,
  setNominations,
  setNominationShape,
  startFrom,
  test
} from '../../../fixtures/contestant/perm-contestant-nominations';
import {
  CANDIDATE_ONLY_NATION_CONTEST,
  EDIT_CANDIDATE_EDITOR,
  EDIT_CANDIDATE_ELECTION_SYMBOL,
  EDIT_ORGANIZATION_EDITOR,
  GREEN_ORGANIZATION_NAME,
  LIST_ELECTION_EXTERNAL_ID,
  LIST_ELECTION_NAME,
  LIST_OPINION_QUESTION_LABEL,
  NATION_CONSTITUENCY_NAME,
  NEW_CANDIDATE_EDITOR,
  NEW_ORGANIZATION_EDITOR,
  NORTH_CONSTITUENCY_EXTERNAL_ID,
  NORTH_CONSTITUENCY_NAME,
  OPEN_ELECTION_NAME,
  OPEN_NATION_CONTEST,
  OPEN_OPINION_QUESTION_LABEL,
  OPINION_QUESTION_EXTERNAL_IDS,
  SEEDED_NOMINATION_SHAPES,
  SHARED_OPINION_QUESTION_LABEL
} from '../../../utils/permContestantNominationsData';

/** The selection the address of a later step of the editor carries for the nominated candidate's seeded nomination. */
const EDIT_CANDIDATE_SELECTION = Object.freeze({
  elections: [LIST_ELECTION_EXTERNAL_ID],
  constituencies: [NORTH_CONSTITUENCY_EXTERNAL_ID]
});

/** The three addresses of the editor. */
const EDITOR_STEPS = ['elections', 'constituencies', 'details'] as const;

test.afterAll(async () => {
  await clearWrittenNominations();
});

test.describe('contestant-nominations: the nominations view, the way into the editor, and what follows a save', () => {
  test.describe("as the nominated party's editor", () => {
    test.use({ storageState: EDIT_ORGANIZATION_EDITOR.storageStatePath });

    test(
      'nominations-view: listed and editable — the sentence that they can be changed, Return under the main button, and no support button',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationsPage }) => {
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, NOTHING_ANSWERED);

        await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
        await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
        await contestantNominationsPage.expectLockedNote(false);
        await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listedEditable.organization);
        await contestantNominationsPage.expectCardCount(2);
        await contestantNominationsPage.expectSupportButtons(0);

        // The main button continues to the party's next task, and Return, after it, leads to the party's home.
        await contestantNominationsPage.expectButton('continue');
        await contestantNominationsPage.expectReturnAction();
        await contestantNominationsPage.pressReturn();
        await contestantEntityPages.expectOnHome(EDIT_ORGANIZATION_EDITOR.grant);
      }
    );

    test(
      'nominations-view: a nomination deleted from its card, after its confirmation, leaves the view',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_ORGANIZATION_EDITOR.grant, NOTHING_ANSWERED);
        try {
          await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardActions(LIST_ELECTION_NAME.en, true);
          await contestantNominationsPage.expectCardActions(OPEN_ELECTION_NAME.en, true);

          // Edit leads to the details step with both nominations kept, and Cancel back to the view.
          await contestantNominationsPage.pressCardEdit(OPEN_ELECTION_NAME.en);
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([EDIT_ORGANIZATION_LIST_CARD, EDIT_ORGANIZATION_OPEN_CARD]);
          await contestantNominationEditor.cancel();
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);

          // Delete asks in the card, and Cancel takes the question back: nothing is written.
          await contestantNominationsPage.pressCardDelete(OPEN_ELECTION_NAME.en);
          await contestantNominationsPage.cancelDelete(OPEN_ELECTION_NAME.en);
          await contestantNominationsPage.expectCardCount(2);
          expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION,
            EDIT_ORGANIZATION_OPEN_SEEDED_NOMINATION
          ]);

          // Confirmed, the delete removes that nomination alone, and the view lists the other one.
          await contestantNominationsPage.pressCardDelete(OPEN_ELECTION_NAME.en);
          await contestantNominationsPage.confirmDelete(OPEN_ELECTION_NAME.en);
          await contestantNominationsPage.expectDeleted();
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf(EDIT_ORGANIZATION_LIST_VIEW_CARD);
          expect(await nominationsOf(EDIT_ORGANIZATION_EDITOR.grant)).toEqual([
            EDIT_ORGANIZATION_LIST_SEEDED_NOMINATION
          ]);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'nominations-view: nominations listed but no election admissible — no Edit',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(EDIT_ORGANIZATION_EDITOR.grant, 'seeded');
        try {
          for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setNominationShape(election, 'candidate_only');

          // A full page load after the types changed: the party's nominations are listed, and nothing leads to the editor.
          await contestantNominationsPage.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: false });
          await contestantNominationsPage.expectLockedNote(false);
          await contestantNominationsPage.expectDescription(VIEW_SENTENCE.listed.organization);
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectSupportButtons(0);
          await contestantNominationsPage.expectNoEditAction();

          // The editor's entry address, as a new document, leads back to the view.
          await contestantNominationEditor.open(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectShown(EDIT_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
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
      'nominations-view: under the nominations lock every editor address leads here, with the note and no Edit',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        try {
          await setContestantEditing('nominationsLocked');

          // Each address of the editor, as a new document after the lock came on.
          for (const step of EDITOR_STEPS) {
            await contestantNominationEditor.openStep(EDIT_CANDIDATE_EDITOR.grant, step, EDIT_CANDIDATE_SELECTION);
            await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
            await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
            await contestantNominationEditor.expectNoStep();
            await contestantNominationsPage.expectLockedNote(true, 'nominationsLocked');
            await contestantNominationsPage.expectSupportButtons(1);
            await contestantNominationsPage.expectNoEditAction();
            await contestantNominationsPage.expectCardCount(1);
          }
        } finally {
          await setContestantEditing('open');
        }
      }
    );

    test(
      "nominations-view: under the answers lock alone every editor address leads here, and the note gives that lock's reason",
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        try {
          await setContestantEditing('locked');

          // Each address of the editor, as a new document after the lock came on.
          for (const step of EDITOR_STEPS) {
            await contestantNominationEditor.openStep(EDIT_CANDIDATE_EDITOR.grant, step, EDIT_CANDIDATE_SELECTION);
            await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
            await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
            await contestantNominationEditor.expectNoStep();
            await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
            await contestantNominationsPage.expectSupportButtons(1);
            await contestantNominationsPage.expectNoEditAction();
            await contestantNominationsPage.expectCardCount(1);
          }
        } finally {
          await setContestantEditing('open');
        }
      }
    );

    test(
      "nominations-view: under the nominations lock alone the note gives the nominations lock's reason",
      { tag: '@nomination-definition' },
      async ({ contestantNominationsPage }) => {
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        try {
          await setContestantEditing('nominationsLocked');

          // A full page load after the nominations were locked: one note, and one support button, which is the note's.
          await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'listed', locked: true, editable: false });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsLocked');
          await contestantNominationsPage.expectSupportButtons(1);
          await contestantNominationsPage.expectNoEditAction();
        } finally {
          await setContestantEditing('open');
        }
      }
    );

    test(
      'nominations-view: a typed party is shown on its row with the line that it was requested',
      { tag: '@nomination-definition' },
      async ({ contestantNominationsPage }) => {
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await addNomination(EDIT_CANDIDATE_EDITOR.grant, OPEN_NATION_CONTEST, {
          externalId: EDIT_CANDIDATE_TYPED_PARTY_NOMINATION_EXTERNAL_ID,
          parent: { kind: 'other', name: TYPED_PARTY_NAME }
        });
        try {
          await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectCardCount(2);

          // The nomination with a typed party shows the name on its parent row and says it is a request; the other shows its party as before.
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: false,
            requestedParent: TYPED_PARTY_NAME
          });
          await contestantNominationsPage.expectCardOf({
            election: LIST_ELECTION_NAME.en,
            constituency: NORTH_CONSTITUENCY_NAME.en,
            symbol: EDIT_CANDIDATE_ELECTION_SYMBOL,
            parent: GREEN_ORGANIZATION_NAME.en,
            confirmed: true
          });
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      'nominations-view: Add a nomination is offered below the cards while another can be added',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, NOTHING_ANSWERED);
        try {
          // Nominated in the closed-list election alone, the candidate can stand in two more: Add leads to the editor's entry, with its election chosen.
          await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectAddAction(true);
          await contestantNominationsPage.pressAdd();
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en]);

          // Nominated in every election that admits a candidate, the candidate is offered no Add, and its cards keep Edit and Delete.
          await addNomination(EDIT_CANDIDATE_EDITOR.grant, OPEN_NATION_CONTEST, {
            externalId: EDIT_CANDIDATE_OPEN_NOMINATION_EXTERNAL_ID,
            confirmed: true
          });
          await addNomination(EDIT_CANDIDATE_EDITOR.grant, CANDIDATE_ONLY_NATION_CONTEST, {
            externalId: EDIT_CANDIDATE_CLOSED_ELECTION_NOMINATION_EXTERNAL_ID,
            confirmed: true
          });
          await contestantNominationsPage.open(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectCardCount(3);
          await contestantNominationsPage.expectAddAction(false);
          await contestantNominationsPage.expectCardActions(LIST_ELECTION_NAME.en, true);
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        }
      }
    );

    test(
      "holds: with a nomination the home's nomination row leads to the nominations view",
      { tag: '@nomination-definition' },
      async ({ contestantEntityHomePage, contestantEntityPages, contestantHomePage, contestantNominationsPage }) => {
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');

        await contestantEntityPages.openHome(EDIT_CANDIDATE_EDITOR.grant);
        await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_EDITOR.grant);
        await contestantHomePage.expectTaskList({
          nomination: 'complete',
          profile: 'incomplete',
          questions: 'incomplete'
        });
        expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
        await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
        await contestantNominationsPage.expectCardCount(1);
      }
    );

    test(
      'follow: a question that no longer applies is neither asked nor counted, and its answer returns with the nomination',
      { tag: '@nomination-definition' },
      async ({
        contestantEntityHomePage,
        contestantEntityPages,
        contestantHomePage,
        contestantNominationEditor,
        contestantNominationsPage,
        contestantQuestionsOverviewPage,
        navMenu
      }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        const everyTaskComplete = { nomination: 'complete', profile: 'complete', questions: 'complete' } as const;
        await startFrom(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
        await addNomination(EDIT_CANDIDATE_EDITOR.grant, OPEN_NATION_CONTEST, {
          externalId: EDIT_CANDIDATE_OPEN_NOMINATION_EXTERNAL_ID,
          confirmed: true
        });
        await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: true, opinions: OPINION_QUESTION_EXTERNAL_IDS });
        try {
          // The one full page load of the test. Nominated in both elections, the candidate is asked all three questions and has answered them.
          await contestantEntityPages.openHome(EDIT_CANDIDATE_EDITOR.grant);
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.markDocument();
          await contestantHomePage.expectTaskList(everyTaskComplete);
          await contestantHomePage.clickTask('opinions');
          await contestantEntityPages.expectOnQuestions(EDIT_CANDIDATE_EDITOR.grant);
          await contestantQuestionsOverviewPage.expectQuestionsListed([
            SHARED_OPINION_QUESTION_LABEL,
            LIST_OPINION_QUESTION_LABEL,
            OPEN_OPINION_QUESTION_LABEL
          ]);
          await contestantQuestionsOverviewPage.expectProgress({ answered: 3, total: 3 });

          // Through the view's Add, the national election is unchecked and its nomination removed by the save.
          await navMenu.goHome();
          expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectAddAction(true);
          await contestantNominationsPage.pressAdd();
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
          await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, false);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            EDIT_CANDIDATE_LIST_CARD,
            {
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              state: 'removed',
              confirmed: true,
              moved: false
            }
          ]);
          await contestantNominationEditor.submit();

          // The save leads to the nominations view, which returns home with every task still complete: the national election's question is no longer asked, so two are listed and both are answered.
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_EDITOR.grant);
          await contestantHomePage.expectTaskList(everyTaskComplete);
          await contestantHomePage.expectTaskCount('questions', null);
          expect(await nominationsOf(EDIT_CANDIDATE_EDITOR.grant)).toEqual([EDIT_CANDIDATE_SEEDED_NOMINATION]);
          await contestantHomePage.clickTask('opinions');
          await contestantEntityPages.expectOnQuestions(EDIT_CANDIDATE_EDITOR.grant);
          await contestantQuestionsOverviewPage.expectQuestionsListed([
            SHARED_OPINION_QUESTION_LABEL,
            LIST_OPINION_QUESTION_LABEL
          ]);
          await contestantQuestionsOverviewPage.expectProgress({ answered: 2, total: 2 });

          // Through Add again, the national election is checked and the candidate stands in it with no party.
          await navMenu.goHome();
          expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.pressAdd();
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.expectChecked([LIST_ELECTION_NAME.en]);
          await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectCards([
            EDIT_CANDIDATE_LIST_CARD,
            {
              election: OPEN_ELECTION_NAME.en,
              constituency: NATION_CONSTITUENCY_NAME.en,
              state: 'new',
              confirmed: false,
              moved: false
            }
          ]);
          await contestantNominationEditor.chooseParent(openCard, 'none');
          await contestantNominationEditor.submit();

          // The save leads to the nominations view, which returns home with every task complete: the question is asked again, and the answer stored before is its answer, so three are listed and all three are answered.
          await contestantNominationsPage.expectShown(EDIT_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(EDIT_CANDIDATE_EDITOR.grant);
          await contestantHomePage.expectTaskList(everyTaskComplete);
          await contestantHomePage.expectTaskCount('questions', null);
          await contestantHomePage.clickTask('opinions');
          await contestantEntityPages.expectOnQuestions(EDIT_CANDIDATE_EDITOR.grant);
          await contestantQuestionsOverviewPage.expectQuestionsListed([
            SHARED_OPINION_QUESTION_LABEL,
            LIST_OPINION_QUESTION_LABEL,
            OPEN_OPINION_QUESTION_LABEL
          ]);
          await contestantQuestionsOverviewPage.expectProgress({ answered: 3, total: 3 });

          // The view lists the new nomination as not confirmed yet. The document is the one that was loaded at the start.
          await navMenu.goHome();
          expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
          await contestantNominationsPage.expectCardCount(2);
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: false
          });
          await contestantNominationEditor.expectSameDocument();
          await contestantNominationEditor.expectNoDialog();
        } finally {
          await setNominations(EDIT_CANDIDATE_EDITOR.grant, 'seeded');
          await setAnswers(EDIT_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        }
      }
    );
  });

  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: NEW_CANDIDATE_EDITOR.storageStatePath });

    test(
      "nominations-view: no nomination and editable — the sentence, no support button, and a button in the home's words that opens the editor",
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');

        await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
        await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
        await contestantNominationsPage.expectLockedNote(false);
        await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyEditable.candidate, 'define');
        await contestantNominationsPage.expectCardCount(0);
        await contestantNominationsPage.expectSupportButtons(0);
        await contestantNominationsPage.expectNoEditAction();

        // The main button reads what the home's nomination row reads, and leads to the election step with nothing chosen.
        await contestantNominationsPage.expectButton('define');
        await contestantNominationsPage.expectButtonText(DEFINE_NOMINATION_LABEL);
        await contestantNominationsPage.pressButton('define');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'nominations-view: no nomination under either lock — the note, the earlier sentence and Return',
      { tag: '@nomination-definition' },
      async ({ contestantEntityPages, contestantNominationsPage }) => {
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        try {
          // A full page load after the nominations lock came on.
          await setContestantEditing('nominationsLocked');
          await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'empty', locked: true, editable: false });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsLocked');
          await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyLocked.candidate, 'locked');
          await contestantNominationsPage.expectSupportButtons(1);
          await contestantNominationsPage.expectNoEditAction();
          await contestantNominationsPage.expectButton('return');

          // A full page load after the nominations lock went off and the answers lock came on.
          await setContestantEditing('locked');
          await contestantNominationsPage.open(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'empty', locked: true, editable: false });
          await contestantNominationsPage.expectLockedNote(true, 'nominationsAnswersLocked');
          await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyLocked.candidate, 'locked');
          await contestantNominationsPage.expectSupportButtons(1);
          await contestantNominationsPage.expectNoEditAction();
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
        } finally {
          await setContestantEditing('open');
        }
      }
    );

    test(
      "entry: with no nomination and nothing locked, the home's first task and its main action lead to the editor",
      { tag: '@nomination-definition' },
      async ({ contestantEntityHomePage, contestantEntityPages, contestantHomePage, contestantNominationEditor }) => {
        const noNomination = { nomination: 'incomplete', profile: 'blocked', questions: 'blocked' } as const;
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');

        // The home says what it said of an entity with no nomination, and its main action leads to the election step with nothing chosen.
        await contestantEntityPages.openHome(NEW_CANDIDATE_EDITOR.grant);
        await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
        await contestantHomePage.expectTaskList(noNomination);
        await contestantHomePage.expectNextStep('nomination');
        await contestantHomePage.expectPreview('closed');
        await contestantHomePage.expectReason('noNomination');
        expect(await contestantEntityHomePage.followMainAction()).toBe('nominationElections');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectChecked([]);

        // The nomination row of the task list, from the home as a new document, leads to the same step.
        await contestantEntityPages.openHome(NEW_CANDIDATE_EDITOR.grant);
        await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
        await contestantHomePage.expectTaskList(noNomination);
        expect(await contestantEntityHomePage.followNominationTask()).toBe('nominationElections');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      "holds: with no nomination under either lock the home's first task leads to the nominations view",
      { tag: '@nomination-definition' },
      async ({ contestantEntityHomePage, contestantEntityPages, contestantHomePage, contestantNominationsPage }) => {
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        try {
          // The home as a new document after the nominations lock came on.
          await setContestantEditing('nominationsLocked');
          await contestantEntityPages.openHome(NEW_CANDIDATE_EDITOR.grant);
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
          await contestantHomePage.expectNextStep('nomination');
          expect(await contestantEntityHomePage.followMainAction()).toBe('nominations');
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_EDITOR.grant);

          // The home as a new document after the nominations lock went off and the answers lock came on.
          await setContestantEditing('locked');
          await contestantEntityPages.openHome(NEW_CANDIDATE_EDITOR.grant);
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
          await contestantHomePage.expectNextStep('nomination');
          expect(await contestantEntityHomePage.followMainAction()).toBe('nominations');
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_EDITOR.grant);
        } finally {
          await setContestantEditing('open');
        }
      }
    );

    test(
      'follow: after a first save the home, the nominations view and the questions follow without a full page load',
      { tag: '@nomination-definition' },
      async ({
        contestantEntityHomePage,
        contestantEntityPages,
        contestantHomePage,
        contestantNominationEditor,
        contestantNominationsPage,
        navMenu
      }) => {
        const openCard = { election: OPEN_ELECTION_NAME.en };
        await startFrom(NEW_CANDIDATE_EDITOR.grant, 'none');
        await setAnswers(NEW_CANDIDATE_EDITOR.grant, { requiredInfo: false, opinions: [] });
        try {
          // The one full page load of the test: the home, whose main action leads into the editor.
          await contestantEntityPages.openHome(NEW_CANDIDATE_EDITOR.grant);
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.markDocument();
          await contestantHomePage.expectTaskList({
            nomination: 'incomplete',
            profile: 'blocked',
            questions: 'blocked'
          });
          expect(await contestantEntityHomePage.followMainAction()).toBe('nominationElections');

          // The national election alone, which is held in one constituency, with no party.
          await contestantNominationEditor.setElection(OPEN_ELECTION_NAME.en, true);
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.chooseParent(openCard, 'none');
          await contestantNominationEditor.submit();
          await contestantNominationsPage.expectShown(NEW_CANDIDATE_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_EDITOR.grant);

          // By the menu to the home: the nomination task is complete, the profile and the questions are open, and two questions are counted — the one asked in every election and the national election's, and not the regional election's.
          await navMenu.goHome();
          await contestantEntityPages.expectOnHome(NEW_CANDIDATE_EDITOR.grant);
          await contestantHomePage.expectTaskList({
            nomination: 'complete',
            profile: 'incomplete',
            questions: 'incomplete'
          });
          await contestantHomePage.expectTaskCount('nomination', null);
          await contestantHomePage.expectTaskCount('profile', 1);
          await contestantHomePage.expectTaskCount('questions', 2);
          await contestantHomePage.expectNextStep('profile');

          // The nomination row now leads to the view, which lists the stored nomination as not confirmed yet and continues to the profile.
          expect(await contestantEntityHomePage.followNominationTask()).toBe('nominations');
          await contestantNominationsPage.expectState({ state: 'listed', locked: false, editable: true });
          await contestantNominationsPage.expectCardCount(1);
          await contestantNominationsPage.expectCardOf({
            election: OPEN_ELECTION_NAME.en,
            constituency: NATION_CONSTITUENCY_NAME.en,
            symbol: null,
            parent: null,
            confirmed: false
          });
          await contestantNominationsPage.pressButton('continue');
          await contestantEntityPages.expectOnProfile(NEW_CANDIDATE_EDITOR.grant);

          // The document is the one that was loaded at the start.
          await contestantNominationEditor.expectSameDocument();
          await contestantNominationEditor.expectNoDialog();
          expect(await nominationsOf(NEW_CANDIDATE_EDITOR.grant)).toEqual([
            {
              externalId: null,
              contest: OPEN_NATION_CONTEST,
              electionSymbol: null,
              confirmed: false,
              parentEntityExternalId: null,
              requestedParent: null
            }
          ]);
        } finally {
          await setNominations(NEW_CANDIDATE_EDITOR.grant, 'none');
        }
      }
    );
  });

  test.describe("as the unnominated party's editor", () => {
    test.use({ storageState: NEW_ORGANIZATION_EDITOR.storageStatePath });

    test(
      'nominations-view: a party with no nomination reads the same in its own words',
      { tag: '@nomination-definition' },
      async ({ contestantNominationEditor, contestantNominationsPage }) => {
        await startFrom(NEW_ORGANIZATION_EDITOR.grant, 'none');

        await contestantNominationsPage.open(NEW_ORGANIZATION_EDITOR.grant);
        await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
        await contestantNominationsPage.expectLockedNote(false);
        await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyEditable.organization, 'define');
        await contestantNominationsPage.expectSupportButtons(0);
        await contestantNominationsPage.expectNoEditAction();

        // The main button leads to the election step, which lists the elections a party can stand in with none chosen.
        await contestantNominationsPage.expectButtonText(DEFINE_NOMINATION_LABEL);
        await contestantNominationsPage.pressButton('define');
        await contestantNominationEditor.expectStep('elections');
        await contestantNominationEditor.expectElections([LIST_ELECTION_NAME.en, OPEN_ELECTION_NAME.en]);
        await contestantNominationEditor.expectChecked([]);
        await contestantNominationEditor.expectNoDialog();
      }
    );

    test(
      'nominations-view: no election the party can stand in — the sentence, one support button, Return, and no way into the editor',
      { tag: '@nomination-definition' },
      async ({
        contestantEntityHomePage,
        contestantEntityPages,
        contestantNominationEditor,
        contestantNominationsPage
      }) => {
        await startFrom(NEW_ORGANIZATION_EDITOR.grant, 'none');
        try {
          for (const election of ELECTIONS_THAT_ADMIT_A_PARTY) await setNominationShape(election, 'candidate_only');

          // A full page load after the types changed: no election admits a party.
          await contestantNominationsPage.open(NEW_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: false });
          await contestantNominationsPage.expectLockedNote(false);
          await contestantNominationsPage.expectEmptySentence(VIEW_SENTENCE.emptyNoElection.organization, 'noElection');
          await contestantNominationsPage.expectSupportButtons(1);
          await contestantNominationsPage.expectNoEditAction();
          await contestantNominationsPage.expectButton('return');

          // The editor's entry address, as a new document, leads back to the view.
          await contestantNominationEditor.open(NEW_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectShown(NEW_ORGANIZATION_EDITOR.grant);
          await contestantNominationEditor.expectNoStep();
          await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: false });

          // Return leads home, and the home's main action leads to the view again and not round into the editor.
          await contestantNominationsPage.pressButton('return');
          await contestantEntityPages.expectOnHome(NEW_ORGANIZATION_EDITOR.grant);
          expect(await contestantEntityHomePage.followMainAction()).toBe('nominations');
          await contestantNominationsPage.expectShown(NEW_ORGANIZATION_EDITOR.grant);
          await contestantNominationsPage.expectButton('return');
        } finally {
          for (const election of ELECTIONS_THAT_ADMIT_A_PARTY)
            await setNominationShape(election, SEEDED_NOMINATION_SHAPES[election]);
        }
      }
    );
  });
});
