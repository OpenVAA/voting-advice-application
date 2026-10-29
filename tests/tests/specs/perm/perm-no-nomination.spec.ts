/**
 * @file perm-no-nomination.spec.ts — perm-chain spec.
 *
 * The editor of a candidate and of an organization on their own entity's pages of the Contestant App, with and without a nomination, against the `perm-no-nomination` dataset (seeded by the data-setup-perm-no-nomination project): a candidate and an organization with no nomination row, and a candidate with one.
 *
 * Sessions: the file runs under three stored sessions, each selected by a describe — the editor of the unnominated candidate, of the unnominated organization and of the nominated candidate. All three sessions are this dataset's own: its setup writes them and nothing else reads them, so a test may edit and save under them. No test reads a session of the base dataset. A test that logs out signs in first, in a browser with no stored session: logging out ends the session the button is pressed in, and a stored session is every other test's.
 *
 * Order and state: the tests run in file order in one worker, and no test depends on a test before it. Every test begins with a state step that writes, with the service role as an administrator would, the state it reads: whether the entity has a nomination and whether it is confirmed, the entity's answers, the nominations lock. A page is opened only after its state steps, because the entity's nominations and the settings are read when a page is loaded.
 *
 * Titles carry the prefix of the surface they are about. `dataset:` is the dataset and its identities; `gate:` is a URL that leads to the entity's home while the entity has no nomination; `holds:` is a page that opens; `questions:` is the questions of an entity that has a nomination, whatever its profile holds; `preview:` is the preview of an entity that has a nomination, which leads to the entity's home while a required info question or an opinion question is unanswered; `nominations:` is the nominations view, which opens for an entity with and without a nomination; `profile:` is the profile, which shows nothing of the entity's nominations; `home:` is the home, which lists the entity's tasks: `home: with` for an entity that has a nomination, and the others for one that has none; `menu:` is the navigation menu, which offers the nominations view and closes, with the reason, the items whose pages the entity cannot open; `continue:` is the save of the last unanswered opinion question, which leads to what is next for the entity. The two tests of the logout button are `holds:` tests, and so are the three of where the profile's save, an answer saved while questions remain and an edit of an answered question lead. `phone:` is a page at the width of a phone, where what is asserted is that the page fits the viewport and that a card, the note and the open menu hold what they show. The scans carry the titles the scan helper gives them, `axe accessibility scan — <entry>` and its dark twin.
 *
 * Scans: six states of the home, the nominations view and the open menu of the candidate that is seeded with no nomination, each in the light and the dark theme, declared through `declareScans` of `tests/tests/utils/contestantAxeScan.ts` and so through the one shared gate. They are here and not in the scan project because only this dataset holds an entity with no nomination, and because two of the states need nominations locked for the whole project. Each entry's `reach` sets its state through the state steps, opens the page afresh and asserts the state through the fixtures' steps, before the reach proof and the scan. The organization's home, menu and nominations view are the candidate's markup with other sentences, asserted by the tests above them and not scanned a second time.
 *
 * Widths: the `phone:` tests run at 320 and at 390 pixels wide, in English. A page's width is measured against its viewport, and a box against the box that must hold it, through the steps of `fixtures/shared/pageGeometry.fixture.ts`: an accessibility scan reports neither.
 *
 * Rigidity contract: every assertion is hard, with no soft assertion, no try/catch around an assertion and no fallback on an assertion-bearing locator. Every locator sits behind a fixture: a test body speaks in the steps of `fixtures/contestant/perm-no-nomination.ts` and holds none of its own.
 */

import {
  noNominationPagesOf,
  setAnswers,
  setNominationsLocked,
  setNominationState,
  setOrganizationName,
  test
} from '../../fixtures/contestant/perm-no-nomination';
import { declareScans } from '../../utils/contestantAxeScan';
import {
  CONSTITUENCY_NAME,
  ELECTION_NAME,
  NO_NOMINATION_PASSWORD,
  NOMINATED_CANDIDATE_GRANT,
  NOMINATED_CANDIDATE_STORAGE_STATE,
  OPINION_QUESTION_EXTERNAL_IDS,
  OPINION_QUESTION_LABELS,
  REQUIRED_INFO_QUESTION_LABEL,
  SEEDED_NOMINATION_ELECTION_SYMBOL,
  UNNOMINATED_CANDIDATE_EDITOR_EMAIL,
  UNNOMINATED_CANDIDATE_GRANT,
  UNNOMINATED_CANDIDATE_NAME,
  UNNOMINATED_CANDIDATE_STORAGE_STATE,
  UNNOMINATED_ORGANIZATION_GRANT,
  UNNOMINATED_ORGANIZATION_NAME,
  UNNOMINATED_ORGANIZATION_STORAGE_STATE,
  WRITTEN_NOMINATION_ELECTION_SYMBOL
} from '../../utils/permNoNominationData';
import { PHONE_VIEWPORTS, phoneUse } from '../../utils/phoneViewports';
import { testIds } from '../../utils/testIds';
import type { ContestantEntityPage } from '../../fixtures/contestant/contestantEntityPages.fixture';
import type { ContestantAxeRoute } from '../../utils/contestantAxeScan';

/** The pages of an entity that open only while the entity has a nomination. */
const NOMINATION_PAGES: ReadonlyArray<ContestantEntityPage> = ['profile', 'questions', 'preview'];

/** The sentence the nominations view shows an entity with no nomination while nominations cannot be edited, by entity type, in the locale the pages are opened in. */
const NO_NOMINATION_SENTENCE = Object.freeze({
  candidate: 'No nomination has been defined for you yet. Please contact support to have one added.',
  organization: 'No nomination has been defined for your party yet. Please contact support to have one added.'
});

/** The sentence the view shows an entity with no nomination that can define one, by entity type, in the same locale. */
const DEFINE_NOMINATION_SENTENCE = Object.freeze({
  candidate:
    'You have not defined a nomination yet. A nomination says which election and constituency you are standing in.',
  organization:
    'No nomination has been defined for your party yet. A nomination says which election and constituency it is standing in.'
});

/** The card of the nomination a state step writes for the unnominated candidate, while no administrator has confirmed it. */
const WRITTEN_PENDING_CARD = Object.freeze({
  election: ELECTION_NAME.en,
  constituency: CONSTITUENCY_NAME.en,
  symbol: WRITTEN_NOMINATION_ELECTION_SYMBOL,
  parent: null,
  confirmed: false
});

/** A name of the organization too long for one line of a phone, as an administrator stores it. */
const LONG_ORGANIZATION_NAME =
  '[OR-N] The Unnominated Party of the No-Nomination Dataset and of Every Constituency It Hopes to Stand In';

test.describe('perm-no-nomination: the dataset and its identities', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE });

    test("dataset: the editor of a candidate with no nomination stays signed in and lands on that candidate's home", async ({
      contestantEntityHomePage
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(UNNOMINATED_CANDIDATE_GRANT);
    });
  });

  test.describe("as the unnominated organization's editor", () => {
    test.use({ storageState: UNNOMINATED_ORGANIZATION_STORAGE_STATE });

    test("dataset: the editor of an organization with no nomination stays signed in and lands on that organization's home", async ({
      contestantEntityHomePage
    }) => {
      await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'none');
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(UNNOMINATED_ORGANIZATION_GRANT);
    });
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test("dataset: the editor of a candidate with a confirmed nomination lands on that candidate's home", async ({
      contestantEntityHomePage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(NOMINATED_CANDIDATE_GRANT);
    });
  });
});

test.describe('perm-no-nomination: the pages an entity needs a nomination for', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE });

    test('gate: a candidate with no nomination is led to its home from its profile, its questions and its preview', async ({
      contestantEntityPages
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      for (const entityPage of NOMINATION_PAGES) {
        await contestantEntityPages.open(UNNOMINATED_CANDIDATE_GRANT, entityPage);
        await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      }
      for (const entityPage of NOMINATION_PAGES) {
        await contestantEntityPages.openWithoutEntity(entityPage);
        await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      }
    });

    test('gate: an entry the browser still shows open is redirected to home, with focus on its heading', async ({
      contestantEntityPages
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'pending');
      await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantEntityPages.clickHomeProfileEntry();
      // The click moved focus to the entry, and a heading has focus again only once the click's navigation has ended: the URL is read after that, so it says where the navigation led.
      await contestantEntityPages.expectHomeHeadingFocused();
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
    });

    test('gate: a nomination the administrator adds opens the profile at the next full load, for a candidate', async ({
      contestantEntityPages
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantEntityPages.open(UNNOMINATED_CANDIDATE_GRANT, 'profile');
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'pending');
      await contestantEntityPages.open(UNNOMINATED_CANDIDATE_GRANT, 'profile');
      await contestantEntityPages.expectOnProfile(UNNOMINATED_CANDIDATE_GRANT);
    });
  });

  test.describe("as the unnominated organization's editor", () => {
    test.use({ storageState: UNNOMINATED_ORGANIZATION_STORAGE_STATE });

    test('gate: a party with no nomination is led to its home from its profile, its questions and its preview', async ({
      contestantEntityPages
    }) => {
      await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'none');
      for (const entityPage of NOMINATION_PAGES) {
        await contestantEntityPages.open(UNNOMINATED_ORGANIZATION_GRANT, entityPage);
        await contestantEntityPages.expectOnHome(UNNOMINATED_ORGANIZATION_GRANT);
      }
      for (const entityPage of NOMINATION_PAGES) {
        await contestantEntityPages.openWithoutEntity(entityPage);
        await contestantEntityPages.expectOnHome(UNNOMINATED_ORGANIZATION_GRANT);
      }
    });

    test('gate: a nomination the administrator adds opens the profile at the next full load, for a party', async ({
      contestantEntityPages
    }) => {
      await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'none');
      await contestantEntityPages.open(UNNOMINATED_ORGANIZATION_GRANT, 'profile');
      await contestantEntityPages.expectOnHome(UNNOMINATED_ORGANIZATION_GRANT);
      await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'pending');
      await contestantEntityPages.open(UNNOMINATED_ORGANIZATION_GRANT, 'profile');
      await contestantEntityPages.expectOnProfile(UNNOMINATED_ORGANIZATION_GRANT);
    });
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('holds: a candidate with a nomination opens its profile', async ({ contestantEntityPages }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await contestantEntityPages.open(NOMINATED_CANDIDATE_GRANT, 'profile');
      await contestantEntityPages.expectOnProfile(NOMINATED_CANDIDATE_GRANT);
    });
  });
});

test.describe('perm-no-nomination: the questions of an entity that has a nomination', () => {
  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('questions: a candidate with a nomination and required info missing opens its questions', async ({
      contestantEntityPages
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await contestantEntityPages.open(NOMINATED_CANDIDATE_GRANT, 'questions');
      await contestantEntityPages.expectOnQuestions(NOMINATED_CANDIDATE_GRANT);
    });
  });

  test.describe("as the unnominated organization's editor", () => {
    test.use({ storageState: UNNOMINATED_ORGANIZATION_STORAGE_STATE });

    test('questions: a party that has just been given a nomination opens its questions without filling in its profile', async ({
      contestantEntityPages
    }) => {
      await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'pending');
      await setAnswers(UNNOMINATED_ORGANIZATION_GRANT, { requiredInfo: false, opinions: 'none' });
      await contestantEntityPages.open(UNNOMINATED_ORGANIZATION_GRANT, 'questions');
      await contestantEntityPages.expectOnQuestions(UNNOMINATED_ORGANIZATION_GRANT);
    });
  });
});

test.describe('perm-no-nomination: the preview of an entity that has a nomination', () => {
  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('preview: stays closed while required info or an opinion question is unanswered', async ({
      contestantEntityPages
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'allButLast' });
      await contestantEntityPages.open(NOMINATED_CANDIDATE_GRANT, 'preview');
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);

      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'all' });
      await contestantEntityPages.open(NOMINATED_CANDIDATE_GRANT, 'preview');
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
    });

    test('preview: a browser that still shows the entry open is sent home by the server', async ({
      contestantEntityPages
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'all' });
      await contestantEntityPages.openHome(NOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);

      // No page is loaded from here on: an answer is removed behind the loaded home, whose preview entry stays as it was.
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'allButLast' });
      await contestantEntityPages.clickHomePreviewEntry();
      // The click moved focus to the entry, and a heading has focus again only once the click's navigation has ended: the URL is read after that, so it says where the navigation led.
      await contestantEntityPages.expectHomeHeadingFocused();
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
    });

    test('holds: the preview opens on the click that follows the last answer saved in the browser', async ({
      contestantEntityPages,
      contestantQuestionPage,
      contestantQuestionsOverviewPage,
      navMenu
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'allButLast' });
      await contestantQuestionsOverviewPage.goToPage();
      await contestantQuestionsOverviewPage.expectContinuePrompt();
      await contestantQuestionsOverviewPage.clickContinuePrompt();
      await contestantQuestionPage.selectChoice(0);
      await contestantQuestionPage.expectContinueEnabled();
      await contestantQuestionPage.saveAndLeave();

      // No page is loaded from here on: the two steps to the preview are navigations inside the application.
      await navMenu.goHome();
      await contestantEntityPages.clickHomePreviewEntry();
      await contestantEntityPages.expectOnPreview(NOMINATED_CANDIDATE_GRANT);
    });

    test('holds: a candidate with everything answered opens its preview by URL', async ({ contestantEntityPages }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'all' });
      await contestantEntityPages.open(NOMINATED_CANDIDATE_GRANT, 'preview');
      await contestantEntityPages.expectOnPreview(NOMINATED_CANDIDATE_GRANT);
    });
  });
});

test.describe('perm-no-nomination: the nominations view', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE });

    test('nominations: a candidate with no nomination sees the sentence that one can be defined, no support button and a button that leads into the editor', async ({
      contestantNominationEditor,
      contestantNominationsPage,
      notEditableNote
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await setNominationsLocked(false);
      await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectShown(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
      await contestantNominationsPage.expectCardCount(0);
      await contestantNominationsPage.expectEmptySentence(DEFINE_NOMINATION_SENTENCE.candidate, 'define');
      await notEditableNote.expectSupportButtons(0);
      await contestantNominationsPage.expectLockedNote(false);
      await contestantNominationsPage.expectButton('define');
      // The dataset holds one election in one constituency, so the editor has nothing to ask before the details of the one nomination.
      await contestantNominationsPage.pressButton();
      await contestantNominationEditor.expectStep('details');
    });

    test('nominations: with nominations locked, the empty view shows the note above the sentence that says whom to ask, and one support button', async ({
      contestantNominationsPage,
      notEditableNote
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await setNominationsLocked(true);
      try {
        // A full page load: the lock is a setting, read when a page is loaded.
        await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
        await contestantNominationsPage.expectState({ state: 'empty', locked: true });
        await contestantNominationsPage.expectLockedNote(true);
        await contestantNominationsPage.expectEmptySentence(NO_NOMINATION_SENTENCE.candidate);
        await notEditableNote.expectSupportButtons(1);
        await contestantNominationsPage.expectButton('return');
      } finally {
        await setNominationsLocked(false);
      }
    });

    test('nominations: a nomination the administrator adds is listed as pending, and as confirmed once it is confirmed', async ({
      contestantNominationsPage
    }) => {
      const card = {
        election: ELECTION_NAME.en,
        constituency: CONSTITUENCY_NAME.en,
        symbol: WRITTEN_NOMINATION_ELECTION_SYMBOL,
        parent: null
      };
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'pending');
      await setNominationsLocked(false);
      await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'listed', locked: false });
      await contestantNominationsPage.expectCardCount(1);
      await contestantNominationsPage.expectCard(0, { ...card, confirmed: false });
      await contestantNominationsPage.expectPendingNote(0, true);

      // A full page load: an entity's nominations are read when a page is loaded.
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'confirmed');
      await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectCardCount(1);
      await contestantNominationsPage.expectCard(0, { ...card, confirmed: true });
      await contestantNominationsPage.expectPendingNote(0, false);
    });

    test("nominations: the address without an entity leads to the entity's own view", async ({
      contestantNominationsPage
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await setNominationsLocked(false);
      await contestantNominationsPage.openWithoutEntity();
      await contestantNominationsPage.expectShown(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'empty', locked: false });
    });

    test('nominations: a user who reads the view in Finnish is shown the election and the constituency by their Finnish names', async ({
      contestantNominationsPage
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'pending');
      await setNominationsLocked(false);
      await contestantNominationsPage.openInLocale(UNNOMINATED_CANDIDATE_GRANT, 'fi');
      await contestantNominationsPage.expectShown(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'listed', locked: false });
      await contestantNominationsPage.expectCardCount(1);
      await contestantNominationsPage.expectCard(0, {
        ...WRITTEN_PENDING_CARD,
        election: ELECTION_NAME.fi,
        constituency: CONSTITUENCY_NAME.fi
      });
    });
  });

  test.describe("as the unnominated organization's editor", () => {
    test.use({ storageState: UNNOMINATED_ORGANIZATION_STORAGE_STATE });

    test('nominations: a party with no nomination sees the same view in its own words', async ({
      contestantNominationEditor,
      contestantNominationsPage,
      notEditableNote
    }) => {
      await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'none');
      await setNominationsLocked(false);
      await contestantNominationsPage.open(UNNOMINATED_ORGANIZATION_GRANT);
      await contestantNominationsPage.expectShown(UNNOMINATED_ORGANIZATION_GRANT);
      await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
      await contestantNominationsPage.expectCardCount(0);
      await contestantNominationsPage.expectEmptySentence(DEFINE_NOMINATION_SENTENCE.organization, 'define');
      await notEditableNote.expectSupportButtons(0);
      await contestantNominationsPage.expectLockedNote(false);
      await contestantNominationsPage.expectButton('define');
      await contestantNominationsPage.pressButton();
      await contestantNominationEditor.expectStep('details');
    });
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('nominations: with nominations locked, a listed nomination is shown under the note, with nothing to edit', async ({
      contestantNominationsPage,
      notEditableNote
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setNominationsLocked(true);
      try {
        // A full page load: the lock is a setting, read when a page is loaded.
        await contestantNominationsPage.open(NOMINATED_CANDIDATE_GRANT);
        await contestantNominationsPage.expectState({ state: 'listed', locked: true });
        await contestantNominationsPage.expectLockedNote(true);
        await contestantNominationsPage.expectCardCount(1);
        await contestantNominationsPage.expectCard(0, {
          election: ELECTION_NAME.en,
          constituency: CONSTITUENCY_NAME.en,
          symbol: SEEDED_NOMINATION_ELECTION_SYMBOL,
          parent: null,
          confirmed: true
        });
        await notEditableNote.expectSupportButtons(1);
        await contestantNominationsPage.expectNoEditAction();
      } finally {
        await setNominationsLocked(false);
      }
    });

    test("nominations: the view's button continues to what is next, and returns home when nothing is", async ({
      contestantEntityPages,
      contestantNominationsPage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setNominationsLocked(false);
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await contestantNominationsPage.open(NOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'listed', locked: false });
      await contestantNominationsPage.expectButton('continue');
      await contestantNominationsPage.pressButton();
      await contestantEntityPages.expectOnProfile(NOMINATED_CANDIDATE_GRANT);

      // A full page load: an entity's answers are read when a page is loaded.
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'all' });
      await contestantNominationsPage.open(NOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'listed', locked: false });
      await contestantNominationsPage.expectButton('return');
      await contestantNominationsPage.pressButton();
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
    });
  });
});

test.describe('perm-no-nomination: the profile of an entity that has a nomination', () => {
  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('profile: the profile of an entity with a nomination has no nominations section', async ({
      contestantEntityPages,
      contestantProfilePage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await contestantEntityPages.open(NOMINATED_CANDIDATE_GRANT, 'profile');
      await contestantEntityPages.expectOnProfile(NOMINATED_CANDIDATE_GRANT);
      await contestantProfilePage.expectNoNominationsSection();
    });
  });
});

test.describe('perm-no-nomination: the home of an entity with no nomination', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE });

    test('home: a candidate with no nomination sees the nomination to define and the rest closed, with the reason', async ({
      contestantEntityPages,
      contestantHomePage,
      contestantNominationEditor
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantHomePage.expectTaskList({ nomination: 'incomplete', profile: 'blocked', questions: 'blocked' });
      await contestantHomePage.expectTaskCount('profile', null);
      await contestantHomePage.expectTaskCount('questions', null);
      await contestantHomePage.expectPreview('closed');
      await contestantHomePage.expectReason('noNomination');
      await contestantHomePage.expectNextStep('nomination');
      await contestantHomePage.expectClosedEntryDescribed('profile');
      // The main action leads into the editor. The dataset holds one election in one constituency, so the editor has nothing to ask before the details of the one nomination.
      await contestantHomePage.clickContinue();
      await contestantNominationEditor.expectStep('details');
    });
  });

  test.describe("as the unnominated organization's editor", () => {
    test.use({ storageState: UNNOMINATED_ORGANIZATION_STORAGE_STATE });

    test('home: a party with no nomination sees the same list under its own name', async ({
      contestantEntityPages,
      contestantHomePage,
      contestantNominationEditor
    }) => {
      await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'none');
      await contestantEntityPages.openHome(UNNOMINATED_ORGANIZATION_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_ORGANIZATION_GRANT);
      await contestantHomePage.expectGreeting(UNNOMINATED_ORGANIZATION_NAME.en);
      await contestantHomePage.expectTaskList({ nomination: 'incomplete', profile: 'blocked', questions: 'blocked' });
      await contestantHomePage.expectTaskCount('profile', null);
      await contestantHomePage.expectTaskCount('questions', null);
      await contestantHomePage.expectPreview('closed');
      await contestantHomePage.expectReason('noNomination');
      await contestantHomePage.expectNextStep('nomination');
      await contestantHomePage.expectClosedEntryDescribed('profile');
      await contestantHomePage.clickContinue();
      await contestantNominationEditor.expectStep('details');
    });
  });

  test.describe("as the unnominated candidate's editor, in a browser that runs no script", () => {
    // With scripts off the browser shows the markup the server sent and nothing else.
    test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE, javaScriptEnabled: false });

    test('home: the no-nomination home is complete before any script runs', async ({
      contestantEntityPages,
      contestantHomePage
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantHomePage.expectGreeting(UNNOMINATED_CANDIDATE_NAME.firstName);
      await contestantHomePage.expectTaskList({ nomination: 'incomplete', profile: 'blocked', questions: 'blocked' });
      await contestantHomePage.expectReason('noNomination');
      await contestantHomePage.expectNextStep('nomination');
    });
  });
});

test.describe('perm-no-nomination: the home of an entity that has a nomination', () => {
  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('home: with a nomination and nothing filled in, the questions are open and the preview is not', async ({
      contestantEntityPages,
      contestantHomePage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await contestantEntityPages.openHome(NOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
      await contestantHomePage.expectTaskList({
        nomination: 'complete',
        profile: 'incomplete',
        questions: 'incomplete'
      });
      await contestantHomePage.expectTaskCount('nomination', null);
      await contestantHomePage.expectTaskCount('profile', 1);
      await contestantHomePage.expectTaskCount('questions', 2);
      await contestantHomePage.expectPreview('closed');
      await contestantHomePage.expectReason('previewNotReady');
      await contestantHomePage.expectClosedEntryDescribed('preview');
      await contestantHomePage.expectNextStep('profile');
      await contestantHomePage.clickContinue();
      await contestantEntityPages.expectOnProfile(NOMINATED_CANDIDATE_GRANT);
    });

    test('home: with the profile filled in, the main action leads to the questions list', async ({
      contestantEntityPages,
      contestantHomePage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'none' });
      await contestantEntityPages.openHome(NOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
      await contestantHomePage.expectTaskList({ nomination: 'complete', profile: 'complete', questions: 'incomplete' });
      await contestantHomePage.expectTaskCount('profile', null);
      await contestantHomePage.expectTaskCount('questions', 2);
      await contestantHomePage.expectPreview('closed');
      await contestantHomePage.expectReason('previewNotReady');
      await contestantHomePage.expectNextStep('questions');
      await contestantHomePage.clickContinue();
      await contestantEntityPages.expectOnQuestions(NOMINATED_CANDIDATE_GRANT);
    });

    test('home: with everything answered every task is complete and the main action is the preview', async ({
      contestantEntityPages,
      contestantHomePage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'all' });
      await contestantEntityPages.openHome(NOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
      await contestantHomePage.expectTaskList({ nomination: 'complete', profile: 'complete', questions: 'complete' });
      await contestantHomePage.expectTaskCount('nomination', null);
      await contestantHomePage.expectTaskCount('profile', null);
      await contestantHomePage.expectTaskCount('questions', null);
      await contestantHomePage.expectPreview('open');
      await contestantHomePage.expectReason(null);
      await contestantHomePage.expectNextStep('preview');
      await contestantHomePage.clickContinue();
      await contestantEntityPages.expectOnPreview(NOMINATED_CANDIDATE_GRANT);
    });
  });
});

test.describe('perm-no-nomination: the navigation menu', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE });

    test('menu: a candidate with no nomination finds its profile, its questions and its preview closed, with the reason', async ({
      contestantEntityPages,
      navMenu
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await navMenu.openMobileNav();
      await navMenu.expectNominationsItem();
      await navMenu.expectClosedItems(['profile', 'questions', 'preview']);
      await navMenu.expectQuestionsBadge(null);
      await navMenu.expectNoReasonShown();
      await navMenu.expectClosedItemReason('profile', 'noNomination');
      await navMenu.expectClosedItemReason('questions', 'noNomination');
      await navMenu.expectClosedItemReason('preview', 'noNomination');
    });

    test('menu: the nominations item leads to the nominations view', async ({
      contestantEntityPages,
      contestantNominationsPage,
      navMenu
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await navMenu.openMobileNav();
      await navMenu.expectNominationsItem();
      // No page is loaded from here on: the item is a navigation inside the application, which leaves focus on the heading of the view it opens.
      await navMenu.openNominations();
      await contestantNominationsPage.expectShown(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectHeadingFocused();
    });
  });

  test.describe("as the unnominated organization's editor", () => {
    test.use({ storageState: UNNOMINATED_ORGANIZATION_STORAGE_STATE });

    test('menu: a party with no nomination finds the same', async ({ contestantEntityPages, navMenu }) => {
      await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'none');
      await contestantEntityPages.openHome(UNNOMINATED_ORGANIZATION_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_ORGANIZATION_GRANT);
      await navMenu.openMobileNav();
      await navMenu.expectNominationsItem();
      await navMenu.expectClosedItems(['profile', 'questions', 'preview']);
      await navMenu.expectQuestionsBadge(null);
      await navMenu.expectNoReasonShown();
      await navMenu.expectClosedItemReason('profile', 'noNomination');
      await navMenu.expectClosedItemReason('questions', 'noNomination');
      await navMenu.expectClosedItemReason('preview', 'noNomination');
    });
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('menu: with a nomination and required info missing the questions are open and the preview is closed', async ({
      contestantEntityPages,
      navMenu
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await contestantEntityPages.openHome(NOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
      await navMenu.openMobileNav();
      await navMenu.expectNominationsItem();
      await navMenu.expectClosedItems(['preview']);
      await navMenu.expectQuestionsBadge(2);
      await navMenu.expectNoReasonShown();
      await navMenu.expectClosedItemReason('preview', 'previewNotReady');
    });

    test('menu: with everything answered nothing is closed', async ({ contestantEntityPages, navMenu }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'all' });
      await contestantEntityPages.openHome(NOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
      await navMenu.openMobileNav();
      await navMenu.expectNominationsItem();
      await navMenu.expectClosedItems([]);
      await navMenu.expectQuestionsBadge(null);
      await navMenu.expectNoReasonShown();
    });
  });
});

test.describe('perm-no-nomination: where a save leads', () => {
  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('continue: the last answer leads to the profile while required info is missing', async ({
      contestantEntityPages,
      contestantQuestionPage,
      contestantQuestionsOverviewPage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'allButLast' });
      await contestantQuestionsOverviewPage.goToPage();
      await contestantQuestionsOverviewPage.clickContinuePrompt();
      await contestantEntityPages.expectOnQuestion(NOMINATED_CANDIDATE_GRANT, OPINION_QUESTION_EXTERNAL_IDS[1]);
      await contestantQuestionPage.selectChoice(0);
      await contestantQuestionPage.expectContinueEnabled();
      await contestantQuestionPage.expectSaveLabel('continue');
      await contestantQuestionPage.clickContinue();
      await contestantEntityPages.expectOnProfile(NOMINATED_CANDIDATE_GRANT);
    });

    test('continue: the last answer leads home once the profile is complete', async ({
      contestantEntityPages,
      contestantQuestionPage,
      contestantQuestionsOverviewPage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'allButLast' });
      await contestantQuestionsOverviewPage.goToPage();
      await contestantQuestionsOverviewPage.clickContinuePrompt();
      await contestantEntityPages.expectOnQuestion(NOMINATED_CANDIDATE_GRANT, OPINION_QUESTION_EXTERNAL_IDS[1]);
      await contestantQuestionPage.selectChoice(0);
      await contestantQuestionPage.expectContinueEnabled();
      await contestantQuestionPage.expectSaveLabel('continue');
      await contestantQuestionPage.clickContinue();
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
    });

    test("holds: the profile's save leads to the questions list once the required info is filled in", async ({
      contestantEntityPages,
      contestantProfilePage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await contestantProfilePage.open();
      await contestantProfilePage.commitQuestion(REQUIRED_INFO_QUESTION_LABEL, 'An answer the browser wrote.');
      await contestantProfilePage.expectSubmitLabel('continue');
      await contestantProfilePage.submit();
      await contestantEntityPages.expectOnQuestions(NOMINATED_CANDIDATE_GRANT);
    });

    test('holds: an answer saved while required info is missing leads to the next question', async ({
      contestantEntityPages,
      contestantQuestionPage,
      contestantQuestionsOverviewPage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await contestantQuestionsOverviewPage.goToPage();
      await contestantQuestionsOverviewPage.clickStart();
      await contestantEntityPages.expectOnQuestion(NOMINATED_CANDIDATE_GRANT, OPINION_QUESTION_EXTERNAL_IDS[0]);
      await contestantQuestionPage.selectChoice(0);
      await contestantQuestionPage.expectContinueEnabled();
      await contestantQuestionPage.clickContinue();
      await contestantEntityPages.expectOnQuestion(NOMINATED_CANDIDATE_GRANT, OPINION_QUESTION_EXTERNAL_IDS[1]);
    });

    test('holds: saving an edit of an answered question returns to the questions list', async ({
      contestantEntityPages,
      contestantQuestionPage,
      contestantQuestionsOverviewPage
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: true, opinions: 'all' });
      await contestantQuestionsOverviewPage.goToPage();
      await contestantQuestionsOverviewPage.goToQuestion(OPINION_QUESTION_LABELS[0]);
      await contestantEntityPages.expectOnQuestion(NOMINATED_CANDIDATE_GRANT, OPINION_QUESTION_EXTERNAL_IDS[0]);
      // The stored answer is the middle step of the scale; the edit is made once the page shows it.
      await contestantQuestionPage.expectSelectedChoice(2);
      await contestantQuestionPage.selectChoice(0);
      await contestantQuestionPage.expectSaveLabel('return');
      await contestantQuestionPage.clickContinue();
      await contestantEntityPages.expectOnQuestions(NOMINATED_CANDIDATE_GRANT);
    });
  });
});

/**
 * The states of the unnominated candidate's pages that are scanned while nominations are not locked. Every entry's `reach` writes the state it reads and then loads its page as a new document.
 */
const UNLOCKED_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The home of a candidate with no nomination: the nomination to define, the profile and the questions blocked, the preview closed, and the sentence that says why.
    // Anchor on the explanation, which the home renders only once the entity's tasks are known.
    // Marker: the reason sentence, whose reason the reach reads: the home of an entity with a nomination and something left carries the other reason, and a home with nothing left has no such sentence.
    name: 'no-nomination-home',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.home.statusMessage,
    postLoginTestId: testIds.contestant.home.closedReason,
    reach: async (page) => {
      const { contestantEntityPages, contestantHomePage } = noNominationPagesOf(page);
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await setNominationsLocked(false);
      await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantHomePage.expectTaskList({ nomination: 'incomplete', profile: 'blocked', questions: 'blocked' });
      await contestantHomePage.expectPreview('closed');
      await contestantHomePage.expectReason('noNomination');
      await contestantHomePage.expectNextStep('nomination');
    }
  },
  {
    // The nominations view of a candidate with no nomination that can define one: the sentence that says so and a button that leads into the editor.
    // Anchor and marker: the empty sentence, which the view renders only for a list the server returned empty. The reach reads from the view's container that nominations are not locked and that an entry to the editor is offered, and from the sentence that it is the one of that state.
    name: 'no-nomination-nominations-empty',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominations.empty,
    postLoginTestId: testIds.contestant.nominations.empty,
    reach: async (page) => {
      const { contestantNominationsPage } = noNominationPagesOf(page);
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await setNominationsLocked(false);
      await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectShown(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
      await contestantNominationsPage.expectEmptySentence(DEFINE_NOMINATION_SENTENCE.candidate, 'define');
      await contestantNominationsPage.expectLockedNote(false);
      await contestantNominationsPage.expectButton('define');
    }
  },
  {
    // The open menu of a candidate with no nomination, over the home: the nominations item, and the profile, the questions and the preview closed, none of them showing its reason.
    // Anchor on a menu item, which exists only once the drawer is open.
    // Marker: the profile item, which the menu renders only on an entity's pages; the reach reads that it is closed.
    name: 'no-nomination-menu',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.shared.navigation.menuItem,
    postLoginTestId: testIds.contestant.nav.profile,
    reach: async (page) => {
      const { contestantEntityPages, navMenu } = noNominationPagesOf(page);
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await setNominationsLocked(false);
      await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await navMenu.openMobileNav();
      await navMenu.expectNominationsItem();
      await navMenu.expectClosedItems(['profile', 'questions', 'preview']);
      await navMenu.expectNoReasonShown();
    }
  },
  {
    // The home of a candidate with a nomination and nothing answered: the nomination complete, the profile and the questions each with a count, the preview closed with its own reason.
    // Anchor on the explanation; marker: the reason sentence, whose reason the reach reads.
    name: 'nominated-home',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.home.statusMessage,
    postLoginTestId: testIds.contestant.home.closedReason,
    reach: async (page) => {
      const { contestantEntityPages, contestantHomePage } = noNominationPagesOf(page);
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'pending');
      await setAnswers(UNNOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await setNominationsLocked(false);
      await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantHomePage.expectTaskList({
        nomination: 'complete',
        profile: 'incomplete',
        questions: 'incomplete'
      });
      await contestantHomePage.expectTaskCount('profile', 1);
      await contestantHomePage.expectTaskCount('questions', OPINION_QUESTION_EXTERNAL_IDS.length);
      await contestantHomePage.expectPreview('closed');
      await contestantHomePage.expectReason('previewNotReady');
    }
  }
];

/**
 * The states of the unnominated candidate's nominations view that are scanned while nominations are locked for the whole project. The describe that declares them unlocks the nominations after each scan.
 */
const LOCKED_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The view of a candidate with no nomination while nominations are locked: the note with its one support button, above the sentence that says there is no nomination.
    // Anchor on the empty sentence; marker: the note, which the view renders only while nominations are locked.
    name: 'no-nomination-nominations-locked',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominations.empty,
    postLoginTestId: testIds.contestant.nominations.lockedNote,
    reach: async (page) => {
      const { contestantNominationsPage } = noNominationPagesOf(page);
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await setNominationsLocked(true);
      // A full page load: the lock is a setting, read when a page is loaded.
      await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectShown(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'empty', locked: true });
      await contestantNominationsPage.expectLockedNote(true);
      await contestantNominationsPage.expectEmptySentence(NO_NOMINATION_SENTENCE.candidate);
      await contestantNominationsPage.expectButton('return');
    }
  },
  {
    // The view while nominations are locked, listing a nomination no administrator has confirmed: the note above a card that says it is pending, with the line that says what that means.
    // Anchor on the card; marker: the card's pending line. The reach reads from the view's container that nominations are locked.
    name: 'nominated-nominations-pending-locked',
    fixture: 'raw',
    routeId: 'ContestantAppNominations',
    contentTestId: testIds.contestant.nominations.card,
    postLoginTestId: testIds.contestant.nominations.pendingNote,
    reach: async (page) => {
      const { contestantNominationsPage } = noNominationPagesOf(page);
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'pending');
      await setAnswers(UNNOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await setNominationsLocked(true);
      // A full page load: the lock is a setting, read when a page is loaded.
      await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectShown(UNNOMINATED_CANDIDATE_GRANT);
      await contestantNominationsPage.expectState({ state: 'listed', locked: true });
      await contestantNominationsPage.expectLockedNote(true);
      await contestantNominationsPage.expectCardCount(1);
      await contestantNominationsPage.expectCard(0, WRITTEN_PENDING_CARD);
      await contestantNominationsPage.expectPendingNote(0, true);
      // The button says what it does only once the entity's tasks are known in the browser, which is also when the view's shaded background is in place.
      await contestantNominationsPage.expectButton('continue');
    }
  }
];

test.describe('perm-no-nomination: the accessibility scans', () => {
  test.describe("as the unnominated candidate's editor", () => {
    test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE });

    // The lock is the one settings row of the suite's project: it is taken off whether or not a scan passed, after the scans that never turn it on as well.
    test.afterEach(async () => {
      await setNominationsLocked(false);
    });

    for (const entry of UNLOCKED_SCANS) {
      declareScans(entry);
    }

    for (const entry of LOCKED_SCANS) {
      declareScans(entry);
    }
  });
});

for (const viewport of PHONE_VIEWPORTS) {
  test.describe(`perm-no-nomination: at ${viewport.width}px wide`, () => {
    test.use(phoneUse(viewport));

    test.describe("as the unnominated candidate's editor", () => {
      test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE });

      test('phone: the home of a candidate with no nomination fits the viewport', async ({
        contestantEntityPages,
        contestantHomePage
      }) => {
        await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
        await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
        await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
        await contestantHomePage.expectTaskList({ nomination: 'incomplete', profile: 'blocked', questions: 'blocked' });
        await contestantHomePage.expectReason('noNomination');
        await contestantHomePage.expectFitsViewport();
      });

      test('phone: the home of a candidate with a pending nomination and nothing answered fits the viewport', async ({
        contestantEntityPages,
        contestantHomePage
      }) => {
        await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'pending');
        await setAnswers(UNNOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
        await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
        await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
        await contestantHomePage.expectTaskList({
          nomination: 'complete',
          profile: 'incomplete',
          questions: 'incomplete'
        });
        await contestantHomePage.expectReason('previewNotReady');
        await contestantHomePage.expectFitsViewport();
      });

      test('phone: the empty nominations view fits the viewport', async ({ contestantNominationsPage }) => {
        await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
        await setNominationsLocked(false);
        await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
        await contestantNominationsPage.expectState({ state: 'empty', locked: false, editable: true });
        await contestantNominationsPage.expectEmptySentence(DEFINE_NOMINATION_SENTENCE.candidate, 'define');
        await contestantNominationsPage.expectButton('define');
        await contestantNominationsPage.expectFitsViewport();
      });

      test('phone: the empty nominations view under the lock fits the viewport, and its note holds the support button', async ({
        contestantNominationsPage,
        notEditableNote
      }) => {
        await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
        await setNominationsLocked(true);
        try {
          // A full page load: the lock is a setting, read when a page is loaded.
          await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'empty', locked: true });
          await contestantNominationsPage.expectLockedNote(true);
          await contestantNominationsPage.expectFitsViewport();
          await notEditableNote.expectSupportButtonInsideNote();
        } finally {
          await setNominationsLocked(false);
        }
      });

      test('phone: a pending card under the lock fits the viewport, the card holds its values and the note its support button', async ({
        contestantNominationsPage,
        notEditableNote
      }) => {
        await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'pending');
        await setNominationsLocked(true);
        try {
          // A full page load: the lock is a setting, read when a page is loaded.
          await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
          await contestantNominationsPage.expectState({ state: 'listed', locked: true });
          await contestantNominationsPage.expectLockedNote(true);
          await contestantNominationsPage.expectCard(0, WRITTEN_PENDING_CARD);
          await contestantNominationsPage.expectPendingNote(0, true);
          await contestantNominationsPage.expectFitsViewport();
          await contestantNominationsPage.expectCardValuesInsideCard(0);
          await notEditableNote.expectSupportButtonInsideNote();
        } finally {
          await setNominationsLocked(false);
        }
      });

      test('phone: the open menu of a candidate with no nomination holds its closed items and the reasons they show inside the drawer', async ({
        contestantEntityPages,
        navMenu,
        pageGeometry
      }) => {
        await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
        await contestantEntityPages.openHome(UNNOMINATED_CANDIDATE_GRANT);
        await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
        await navMenu.openMobileNav();
        await navMenu.expectClosedItems(['profile', 'questions', 'preview']);
        await navMenu.expectNoReasonShown();
        await navMenu.expectClosedPartsInsideDrawer();
        await pageGeometry.expectNoHorizontalOverflow();
      });
    });

    test.describe("as the unnominated organization's editor", () => {
      test.use({ storageState: UNNOMINATED_ORGANIZATION_STORAGE_STATE });

      // The test stores a long name on the organization: its seeded name is put back whether or not the test passed.
      test.afterEach(async () => {
        await setOrganizationName(UNNOMINATED_ORGANIZATION_GRANT, UNNOMINATED_ORGANIZATION_NAME);
      });

      test('phone: the home of a party with a long name fits the viewport, and its greeting is shown whole', async ({
        contestantEntityPages,
        contestantHomePage
      }) => {
        await setNominationState(UNNOMINATED_ORGANIZATION_GRANT, 'none');
        await setOrganizationName(UNNOMINATED_ORGANIZATION_GRANT, {
          ...UNNOMINATED_ORGANIZATION_NAME,
          en: LONG_ORGANIZATION_NAME
        });
        await contestantEntityPages.openHome(UNNOMINATED_ORGANIZATION_GRANT);
        await contestantEntityPages.expectOnHome(UNNOMINATED_ORGANIZATION_GRANT);
        await contestantHomePage.expectGreeting(LONG_ORGANIZATION_NAME);
        await contestantHomePage.expectReason('noNomination');
        await contestantHomePage.expectFitsViewport();
        await contestantHomePage.expectGreetingFits();
      });
    });
  });
}

test.describe('perm-no-nomination: logging out', () => {
  test.describe("as the unnominated candidate's editor, signed in for the test alone", () => {
    // No stored session: the test signs in itself, and the session it logs out of is its own.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('holds: a user whose entity has no nomination is logged out at once', async ({
      contestantEntityPages,
      contestantLoginPage,
      contestantLogoutButton
    }) => {
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantLoginPage.goToPage();
      await contestantLoginPage.login(UNNOMINATED_CANDIDATE_EDITOR_EMAIL, NO_NOMINATION_PASSWORD);
      await contestantEntityPages.expectOnHome(UNNOMINATED_CANDIDATE_GRANT);
      await contestantLogoutButton.clickWithoutDialog();
    });
  });

  test.describe("as the nominated candidate's editor", () => {
    test.use({ storageState: NOMINATED_CANDIDATE_STORAGE_STATE });

    test('holds: a user with unanswered questions is asked before logging out', async ({
      contestantEntityPages,
      contestantLogoutButton
    }) => {
      await setNominationState(NOMINATED_CANDIDATE_GRANT, 'confirmed');
      await setAnswers(NOMINATED_CANDIDATE_GRANT, { requiredInfo: false, opinions: 'none' });
      await contestantEntityPages.openHome(NOMINATED_CANDIDATE_GRANT);
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
      // The dialog is dismissed, so the stored session is still signed in for the tests that follow.
      await contestantLogoutButton.clickAndStay();
      await contestantEntityPages.expectOnHome(NOMINATED_CANDIDATE_GRANT);
    });
  });
});
