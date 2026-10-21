/**
 * @file perm-organization-editing.spec.ts — perm-chain spec.
 *
 * An organization's editor and a candidate's editor on their own entity's pages of the Contestant App, and an anonymous voter on what those pages publish, against the `perm-organization-editing` dataset (seeded by the data-setup-perm-organization-editing project): one confirmed organization, one unconfirmed organization and one unconfirmed candidate.
 *
 * Sessions: the file runs under three stored sessions, each selected by a describe — the editor of the confirmed organization, of the unconfirmed organization and of the unconfirmed candidate — and, for the voter, under none. All three sessions are this dataset's own: its setup writes them and nothing else reads them, so a test may edit and save under them. No test reads a session of the base dataset.
 *
 * Order and state: the tests run in file order in one worker, and no test depends on a test before it. A test that reads a row or a setting some test of the file changes first puts it into the state it needs, through a state step that writes with the service role as an administrator would. The `dataset:` tests come first and read the dataset as it is seeded. A test that confirms the unconfirmed organization makes it unconfirmed again when it ends, passed or failed, so that the organization is published only while a test says so.
 *
 * Titles carry the prefix of the surface they are about. `dataset:` is the dataset and its identities; `profile:` is an entity's profile page; `questions:` is what an entity with no opinion question to answer is shown in their place; `preview:` is an organization's preview of its own profile; `holds:` is a surface that serves the other entity type as well: an organization answering the questions addressed to it, and a candidate's preview; `voter:` is what an organization's editor saved, read where it is shown: on the profile after a fresh load, in the organization's own preview and by an anonymous voter. A `voter:` test drives two browser contexts, the editor's and a voter's without a session. `phone:` is a page at the width of a phone, where what is asserted is that the page fits the viewport and that the rows of its fields hold their controls. The scans carry the titles the scan helper gives them, `axe accessibility scan — <entry>` and its dark twin.
 *
 * Scans: nine states of the organization and candidate surfaces, each in the light and the dark theme, declared through `declareScans` of `tests/tests/utils/contestantAxeScan.ts` and so through the one shared gate. They are here and not in the scan project because only this dataset can produce the states. Each entry's `reach` sets its state through the state steps, opens the page afresh and asserts the state through the fixture's steps, before the reach proof and the scan.
 *
 * Rigidity contract: every assertion is hard, with no soft assertion, no try/catch around an assertion and no fallback on an assertion-bearing locator. Every locator sits behind a fixture: a test body speaks in the steps of `fixtures/contestant/perm-organization-editing.ts` and holds none of its own.
 */

import path from 'path';
import {
  completeAnswers,
  groupTitleNaming,
  organizationEditingPagesOf,
  setAnswersLocked,
  setCandidateState,
  setOrganizationState,
  test
} from '../../fixtures/contestant/perm-organization-editing';
import { declareScans } from '../../utils/contestantAxeScan';
import {
  CONFIRMED_ORGANIZATION_EXTERNAL_ID,
  CONFIRMED_ORGANIZATION_GRANT,
  CONFIRMED_ORGANIZATION_NAME,
  CONFIRMED_ORGANIZATION_SHORT_NAME,
  CONFIRMED_ORGANIZATION_STORAGE_STATE,
  OPINION_QUESTION_EXTERNAL_IDS,
  ORGANIZATION_INFO_QUESTION_EXTERNAL_ID,
  UNCONFIRMED_CANDIDATE_EXTERNAL_ID,
  UNCONFIRMED_CANDIDATE_GRANT,
  UNCONFIRMED_CANDIDATE_NAME,
  UNCONFIRMED_CANDIDATE_STORAGE_STATE,
  UNCONFIRMED_ORGANIZATION_EXTERNAL_ID,
  UNCONFIRMED_ORGANIZATION_GRANT,
  UNCONFIRMED_ORGANIZATION_NAME,
  UNCONFIRMED_ORGANIZATION_STORAGE_STATE
} from '../../utils/permOrganizationEditingData';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { ContestantAxeRoute } from '../../utils/contestantAxeScan';

/** An image file the image field accepts, used as an organization's logo. */
const LOGO_PATH = path.join(TESTS_DIR, 'data/assets/test-poster.jpg');

/** What the unconfirmed organization's editor enters: a name in the default locale and in one other, and a short name. */
const ENTERED_ORGANIZATION = Object.freeze({
  name: { en: '[OR-B] Renamed Party', sv: '[OR-B] Omdöpt parti' },
  shortName: { en: 'ORB' }
});

/** What the candidate's editor enters. */
const ENTERED_CANDIDATE = Object.freeze({ firstName: '[CA-U] Renamed', lastName: 'Person' });

/** A colour as its editor types it, and as the field shows it once it is committed. */
const ENTERED_COLOR = Object.freeze({ typed: '#2546A8', shown: '#2546a8' });

/** A light yellow, as its editor types it and as it is stored. White text on it fails the contrast criterion, so the colour a voter is shown is an adjusted one. */
const LOW_CONTRAST_COLOR = Object.freeze({ typed: '#FFE600', stored: '#ffe600' });

/** The unconfirmed organization as a state step stores it for a test that needs a name in the default locale and a short name already there. */
const STORED_ORGANIZATION = Object.freeze({
  name: { ...UNCONFIRMED_ORGANIZATION_NAME, en: '[OR-B] Stored Party' },
  shortName: { en: 'ORB' }
});

/** A name the unconfirmed organization's editor types and does not get to save. */
const EDITED_NAME = '[OR-B] Edited Party';

/** A name of the confirmed organization too long for one line of a phone, as an administrator stores it. */
const LONG_ORGANIZATION_NAME =
  '[OR-A] The Confirmed Party of the Organization-Editing Dataset and of Every Constituency It Stands In';

/** The two phone sizes a page must fit: the narrowest supported width and a common one. */
const PHONE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 }
];

/** Every name the unconfirmed organization carries in any test begins with this. */
const UNCONFIRMED_ORGANIZATION_ANY_NAME = /\[OR-B\]/;

/** The opinion question the confirmed organization is seeded without an answer to, by the label its pages show: the last of the three. */
const UNANSWERED_OPINION_QUESTION = /\[QU-OPIN-3\]/;

/** The number of opinion questions addressed to organizations. */
const OPINION_QUESTION_COUNT = OPINION_QUESTION_EXTERNAL_IDS.length;

/** The editable info question addressed to organizations, and the one addressed to candidates, by the labels a profile shows. */
const ORGANIZATION_INFO_QUESTION = /\[QU-INFO-ORG\]/;
const CANDIDATE_INFO_QUESTION = /\[QU-INFO-CAND\]/;

/** The info question for organizations that is locked: a row of the identity section, labelled with the question's whole name. */
const LOCKED_ORGANIZATION_INFO_QUESTION = /\[QU-INFO-ORG-LOCKED\]/;

/** What the confirmed organization's editor enters: a choice of the opinion question, by its position and by the label a voter reads, with a comment, and an answer to the info question. */
const ENTERED_ANSWERS = Object.freeze({
  choice: 1,
  choiceLabel: 'Somewhat disagree',
  comment: '[OR-A] Why the party holds this opinion.',
  info: '[OR-A] A party of the organization-editing dataset.'
});

/** The `external_id` of the opinion question the confirmed organization is seeded without an answer to. */
const UNANSWERED_OPINION_QUESTION_EXTERNAL_ID = OPINION_QUESTION_EXTERNAL_IDS[OPINION_QUESTION_COUNT - 1];

test.describe('perm-organization-editing: the dataset and its identities', () => {
  test.describe("as the confirmed organization's editor", () => {
    test.use({ storageState: CONFIRMED_ORGANIZATION_STORAGE_STATE });

    test("dataset: the confirmed organization's editor lands on that organization's home", async ({
      contestantEntityHomePage
    }) => {
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(CONFIRMED_ORGANIZATION_GRANT);
    });
  });

  test.describe("as the unconfirmed organization's editor", () => {
    test.use({ storageState: UNCONFIRMED_ORGANIZATION_STORAGE_STATE });

    test("dataset: the unconfirmed organization's editor lands on that organization's home", async ({
      contestantEntityHomePage
    }) => {
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(UNCONFIRMED_ORGANIZATION_GRANT);
    });
  });

  // The candidate's session holds this one test of the describe.
  test.describe("as the unconfirmed candidate's editor", () => {
    test.use({ storageState: UNCONFIRMED_CANDIDATE_STORAGE_STATE });

    test("dataset: the candidate's editor lands on the candidate's home", async ({ contestantEntityHomePage }) => {
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(UNCONFIRMED_CANDIDATE_GRANT);
    });
  });

  test.describe('as an anonymous voter', () => {
    test('dataset: a voter finds the confirmed organization under its seeded name, and not the unconfirmed one', async ({
      organizationDetail
    }) => {
      await organizationDetail.openFromResults(CONFIRMED_ORGANIZATION_NAME.en);
      await organizationDetail.expectName(CONFIRMED_ORGANIZATION_NAME.en);
      await organizationDetail.expectListed(CONFIRMED_ORGANIZATION_NAME.en);
      await organizationDetail.expectNotListed(UNCONFIRMED_ORGANIZATION_NAME.fi);
    });
  });
});

test.describe('perm-organization-editing: the profile', () => {
  test.describe("as the confirmed organization's editor", () => {
    test.use({ storageState: CONFIRMED_ORGANIZATION_STORAGE_STATE });

    test('profile: a confirmed organization reads its name and short name in every seeded locale, locked', async ({
      contestantProfilePage
    }) => {
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        name: CONFIRMED_ORGANIZATION_NAME,
        shortName: CONFIRMED_ORGANIZATION_SHORT_NAME
      });

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
      await contestantProfilePage.expectNameNote(true);
      await contestantProfilePage.expandNameTranslations();
      await contestantProfilePage.expectName('en', CONFIRMED_ORGANIZATION_NAME.en);
      await contestantProfilePage.expectName('fi', CONFIRMED_ORGANIZATION_NAME.fi);
      await contestantProfilePage.expectShortName('en', CONFIRMED_ORGANIZATION_SHORT_NAME.en);
      await contestantProfilePage.expectShortName('fi', CONFIRMED_ORGANIZATION_SHORT_NAME.fi);
      await contestantProfilePage.expectNamesLocked();
    });

    test('profile: a confirmed organization sets a colour and saves it, its names still locked', async ({
      contestantProfilePage
    }) => {
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, { confirmed: true, color: null });

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
      await contestantProfilePage.expectColor('');
      await contestantProfilePage.setColor(ENTERED_COLOR.typed);
      await contestantProfilePage.expectColor(ENTERED_COLOR.shown);
      await contestantProfilePage.save({ expect: 'navigation' });

      await contestantProfilePage.open();
      await contestantProfilePage.expectColor(ENTERED_COLOR.shown);
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
    });

    test('profile: a confirmed organization removes its colour by emptying the field', async ({
      contestantProfilePage
    }) => {
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        color: { normal: ENTERED_COLOR.shown }
      });

      await contestantProfilePage.open();
      await contestantProfilePage.expectColor(ENTERED_COLOR.shown);
      await contestantProfilePage.clearColor();
      await contestantProfilePage.expectColor('');
      await contestantProfilePage.save({ expect: 'navigation' });

      await contestantProfilePage.open();
      await contestantProfilePage.expectColor('');
    });
  });

  test.describe("as the unconfirmed organization's editor", () => {
    test.use({ storageState: UNCONFIRMED_ORGANIZATION_STORAGE_STATE });

    test('profile: an unconfirmed organization fills in its required name, a short name and a logo, and the menu names it by the saved name', async ({
      contestantProfilePage,
      navMenu
    }) => {
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: false,
        name: UNCONFIRMED_ORGANIZATION_NAME,
        shortName: null,
        image: null,
        color: null
      });

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
      await contestantProfilePage.expectNameNote(true);
      await contestantProfilePage.expectNameRequiredBadge(true);
      await contestantProfilePage.expandNameTranslations();
      await contestantProfilePage.expectNamesEditable();
      await contestantProfilePage.expectName('fi', UNCONFIRMED_ORGANIZATION_NAME.fi);

      await contestantProfilePage.fillName('en', ENTERED_ORGANIZATION.name.en);
      await contestantProfilePage.fillName('sv', ENTERED_ORGANIZATION.name.sv);
      await contestantProfilePage.fillShortName('en', ENTERED_ORGANIZATION.shortName.en);
      await contestantProfilePage.expectNameRequiredBadge(false);
      await contestantProfilePage.uploadLogo(LOGO_PATH);
      await contestantProfilePage.expectLogo();
      await contestantProfilePage.save({ expect: 'navigation' });

      // The menu is read on the page the save led to, before anything reloads the list of the user's entities.
      await navMenu.openMobileNav();
      await navMenu.expectEntityGroupTitle(groupTitleNaming(ENTERED_ORGANIZATION.name.en));
      await navMenu.closeNav();

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
      await contestantProfilePage.expectNameRequiredBadge(false);
      await contestantProfilePage.expandNameTranslations();
      await contestantProfilePage.expectName('en', ENTERED_ORGANIZATION.name.en);
      await contestantProfilePage.expectName('sv', ENTERED_ORGANIZATION.name.sv);
      await contestantProfilePage.expectName('fi', UNCONFIRMED_ORGANIZATION_NAME.fi);
      await contestantProfilePage.expectShortName('en', ENTERED_ORGANIZATION.shortName.en);
      await contestantProfilePage.expectLogo();
    });

    test('profile: leaving with a name and a colour unsaved asks first, and discards them only when the user agrees', async ({
      contestantProfilePage
    }) => {
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: false,
        name: STORED_ORGANIZATION.name,
        color: null
      });

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
      await contestantProfilePage.fillName('en', EDITED_NAME);
      await contestantProfilePage.setColor(ENTERED_COLOR.typed);

      await contestantProfilePage.leaveThroughMenu({ answer: 'stay' });
      await contestantProfilePage.expectName('en', EDITED_NAME);
      await contestantProfilePage.expectColor(ENTERED_COLOR.shown);

      await contestantProfilePage.leaveThroughMenu({ answer: 'leave' });
      await contestantProfilePage.open();
      await contestantProfilePage.expectName('en', STORED_ORGANIZATION.name.en);
      await contestantProfilePage.expectColor('');
    });
  });

  // The candidate's session holds this one test of the describe.
  test.describe("as the unconfirmed candidate's editor", () => {
    test.use({ storageState: UNCONFIRMED_CANDIDATE_STORAGE_STATE });

    test('profile: an unconfirmed candidate changes its first and last name and saves them, and has no colour field', async ({
      contestantProfilePage
    }) => {
      await setCandidateState(UNCONFIRMED_CANDIDATE_EXTERNAL_ID, { confirmed: false, ...UNCONFIRMED_CANDIDATE_NAME });

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'candidate', nameState: 'editable' });
      await contestantProfilePage.expectNameNote(true);
      await contestantProfilePage.expectPersonNames(
        UNCONFIRMED_CANDIDATE_NAME.firstName,
        UNCONFIRMED_CANDIDATE_NAME.lastName
      );
      await contestantProfilePage.expectPersonNamesEditable();
      await contestantProfilePage.expectNoColorField();

      await contestantProfilePage.fillFirstName(ENTERED_CANDIDATE.firstName);
      await contestantProfilePage.fillLastName(ENTERED_CANDIDATE.lastName);
      await contestantProfilePage.save({ expect: 'navigation' });

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'candidate', nameState: 'editable' });
      await contestantProfilePage.expectPersonNames(ENTERED_CANDIDATE.firstName, ENTERED_CANDIDATE.lastName);
    });
  });
});

test.describe('perm-organization-editing: the questions', () => {
  test.describe("as the confirmed organization's editor", () => {
    test.use({ storageState: CONFIRMED_ORGANIZATION_STORAGE_STATE });

    test("holds: a confirmed organization answers the opinion question it has left and an info question, and is not asked a candidate's question", async ({
      contestantEntityHomePage,
      contestantProfilePage,
      contestantQuestionPage,
      contestantQuestionsOverviewPage,
      navMenu
    }) => {
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        clearAnswers: [
          OPINION_QUESTION_EXTERNAL_IDS[OPINION_QUESTION_COUNT - 1],
          ORGANIZATION_INFO_QUESTION_EXTERNAL_ID
        ]
      });

      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(CONFIRMED_ORGANIZATION_GRANT);
      await contestantEntityHomePage.expectQuestionsButton(true);
      await navMenu.openMobileNav();
      await navMenu.expectQuestionsItem(true);
      await navMenu.closeNav();

      await contestantQuestionsOverviewPage.goToPage();
      await contestantQuestionsOverviewPage.expectProgress({
        answered: OPINION_QUESTION_COUNT - 1,
        total: OPINION_QUESTION_COUNT
      });
      await contestantQuestionsOverviewPage.expectContinuePrompt();
      await contestantQuestionsOverviewPage.clickContinuePrompt();
      await contestantQuestionPage.expectQuestionText(UNANSWERED_OPINION_QUESTION);
      await contestantQuestionPage.selectChoice(ENTERED_ANSWERS.choice);
      await contestantQuestionPage.enterInfo(ENTERED_ANSWERS.comment);
      await contestantQuestionPage.expectContinueEnabled();
      await contestantQuestionPage.saveAndLeave();

      await contestantQuestionsOverviewPage.goToPage();
      await contestantQuestionsOverviewPage.expectProgress({
        answered: OPINION_QUESTION_COUNT,
        total: OPINION_QUESTION_COUNT
      });
      await contestantQuestionsOverviewPage.expectCompletionMessage();
      await contestantQuestionsOverviewPage.expectCardText(UNANSWERED_OPINION_QUESTION, ENTERED_ANSWERS.comment);
      await contestantQuestionsOverviewPage.goToQuestion(UNANSWERED_OPINION_QUESTION);
      await contestantQuestionPage.expectSelectedChoice(ENTERED_ANSWERS.choice);

      await contestantProfilePage.open();
      await contestantProfilePage.expectQuestionsVisible([ORGANIZATION_INFO_QUESTION]);
      await contestantProfilePage.expectQuestionNotAsked(CANDIDATE_INFO_QUESTION);
      await contestantProfilePage.fillQuestion(ORGANIZATION_INFO_QUESTION, ENTERED_ANSWERS.info);
      await contestantProfilePage.save({ expect: 'navigation' });

      await contestantProfilePage.open();
      await contestantProfilePage.expectQuestionValue(ORGANIZATION_INFO_QUESTION, ENTERED_ANSWERS.info);
    });
  });

  // The candidate's session holds this one test of the describe.
  test.describe("as the unconfirmed candidate's editor", () => {
    test.use({ storageState: UNCONFIRMED_CANDIDATE_STORAGE_STATE });

    test('questions: a candidate with no opinion question to answer is offered no questions entry, and the questions URL says so', async ({
      contestantEntityHomePage,
      contestantNoQuestionsPage,
      navMenu
    }) => {
      await setCandidateState(UNCONFIRMED_CANDIDATE_EXTERNAL_ID, { confirmed: false });

      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(UNCONFIRMED_CANDIDATE_GRANT);
      await navMenu.openMobileNav();
      await navMenu.expectQuestionsItem(false);
      await navMenu.closeNav();
      await contestantEntityHomePage.expectQuestionsButton(false);

      await contestantNoQuestionsPage.open(UNCONFIRMED_CANDIDATE_GRANT);
      await contestantNoQuestionsPage.expectNeutralPage();
      await contestantNoQuestionsPage.pressReturn();
      await contestantNoQuestionsPage.expectOnHome();
    });
  });
});

test.describe('perm-organization-editing: the preview', () => {
  test.describe("as the confirmed organization's editor", () => {
    test.use({ storageState: CONFIRMED_ORGANIZATION_STORAGE_STATE });

    test('preview: a confirmed organization previews its own name, how it is marked beside its candidates, and its info and opinions tabs alone', async ({
      contestantPreviewPage
    }) => {
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        name: CONFIRMED_ORGANIZATION_NAME,
        shortName: CONFIRMED_ORGANIZATION_SHORT_NAME,
        image: null
      });
      await completeAnswers(CONFIRMED_ORGANIZATION_GRANT);

      await contestantPreviewPage.open();
      await contestantPreviewPage.expectCardName(CONFIRMED_ORGANIZATION_NAME.en);
      await contestantPreviewPage.expectTagLine(CONFIRMED_ORGANIZATION_SHORT_NAME.en);
      await contestantPreviewPage.expectTabs(['info', 'opinions']);
      await contestantPreviewPage.expectNoTab('children');
    });
  });

  // The candidate's session holds this one test of the describe.
  test.describe("as the unconfirmed candidate's editor", () => {
    test.use({ storageState: UNCONFIRMED_CANDIDATE_STORAGE_STATE });

    test("holds: the candidate's preview shows its card and no tag line", async ({ contestantPreviewPage }) => {
      await setCandidateState(UNCONFIRMED_CANDIDATE_EXTERNAL_ID, { confirmed: false, ...UNCONFIRMED_CANDIDATE_NAME });

      await contestantPreviewPage.open();
      await contestantPreviewPage.expectCardName(
        `${UNCONFIRMED_CANDIDATE_NAME.firstName} ${UNCONFIRMED_CANDIDATE_NAME.lastName}`
      );
      await contestantPreviewPage.expectNoTagLine();
    });
  });
});

test.describe('perm-organization-editing: what was saved, where it is shown', () => {
  test.describe("as the confirmed organization's editor", () => {
    test.use({ storageState: CONFIRMED_ORGANIZATION_STORAGE_STATE });

    test('voter: the saved colour and answers of organization A are what a voter sees', async ({
      contestantProfilePage,
      contestantQuestionPage,
      contestantQuestionsOverviewPage,
      voterOrganizationDetail
    }) => {
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        name: CONFIRMED_ORGANIZATION_NAME,
        shortName: CONFIRMED_ORGANIZATION_SHORT_NAME,
        color: null,
        image: null,
        clearAnswers: [UNANSWERED_OPINION_QUESTION_EXTERNAL_ID, ORGANIZATION_INFO_QUESTION_EXTERNAL_ID]
      });

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
      await contestantProfilePage.expectNamesLocked();
      await contestantProfilePage.setColor(LOW_CONTRAST_COLOR.typed);
      await contestantProfilePage.expectColor(LOW_CONTRAST_COLOR.stored);
      await contestantProfilePage.fillQuestion(ORGANIZATION_INFO_QUESTION, ENTERED_ANSWERS.info);
      await contestantProfilePage.save({ expect: 'navigation' });

      await contestantQuestionsOverviewPage.goToPage();
      await contestantQuestionsOverviewPage.expectContinuePrompt();
      await contestantQuestionsOverviewPage.clickContinuePrompt();
      await contestantQuestionPage.expectQuestionText(UNANSWERED_OPINION_QUESTION);
      await contestantQuestionPage.selectChoice(ENTERED_ANSWERS.choice);
      await contestantQuestionPage.enterInfo(ENTERED_ANSWERS.comment);
      await contestantQuestionPage.expectContinueEnabled();
      // The save of the last unanswered opinion question leads to the entity's home: nothing of the profile is left to fill in.
      await contestantQuestionPage.saveAndExpect('home');

      await voterOrganizationDetail.openFromResults(CONFIRMED_ORGANIZATION_NAME.en);
      await voterOrganizationDetail.expectAvatarInitials(CONFIRMED_ORGANIZATION_SHORT_NAME.en);
      await voterOrganizationDetail.expectAvatarColor({ not: LOW_CONTRAST_COLOR.stored });
      await voterOrganizationDetail.expectInfoAnswer(ORGANIZATION_INFO_QUESTION, ENTERED_ANSWERS.info);
      await voterOrganizationDetail.expectOpinionAnswer(UNANSWERED_OPINION_QUESTION, {
        choice: ENTERED_ANSWERS.choiceLabel,
        comment: ENTERED_ANSWERS.comment
      });
    });
  });

  test.describe("as the unconfirmed organization's editor", () => {
    test.use({ storageState: UNCONFIRMED_ORGANIZATION_STORAGE_STATE });

    // The organization is confirmed in the course of a test of this describe, or by its state step.
    test.afterEach(async () => {
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, { confirmed: false });
    });

    test('voter: the saved name and short name of organization B are shown after a reload, in its preview and, once it is confirmed, to a voter', async ({
      contestantPreviewPage,
      contestantProfilePage,
      voterOrganizationDetail
    }) => {
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, { confirmed: true });
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: false,
        name: UNCONFIRMED_ORGANIZATION_NAME,
        shortName: null,
        image: null,
        color: null
      });
      await completeAnswers(UNCONFIRMED_ORGANIZATION_GRANT);

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
      await contestantProfilePage.expandNameTranslations();
      await contestantProfilePage.fillName('en', ENTERED_ORGANIZATION.name.en);
      await contestantProfilePage.fillName('sv', ENTERED_ORGANIZATION.name.sv);
      await contestantProfilePage.fillShortName('en', ENTERED_ORGANIZATION.shortName.en);
      await contestantProfilePage.save({ expect: 'navigation' });

      await contestantProfilePage.open();
      await contestantProfilePage.expandNameTranslations();
      await contestantProfilePage.expectName('en', ENTERED_ORGANIZATION.name.en);
      await contestantProfilePage.expectName('sv', ENTERED_ORGANIZATION.name.sv);
      await contestantProfilePage.expectName('fi', UNCONFIRMED_ORGANIZATION_NAME.fi);
      await contestantProfilePage.expectShortName('en', ENTERED_ORGANIZATION.shortName.en);

      await contestantPreviewPage.open();
      await contestantPreviewPage.expectCardName(ENTERED_ORGANIZATION.name.en);
      await contestantPreviewPage.expectTagLine(ENTERED_ORGANIZATION.shortName.en);

      await voterOrganizationDetail.openList();
      await voterOrganizationDetail.expectNotListed(UNCONFIRMED_ORGANIZATION_ANY_NAME);

      // The administrator confirms the organization while its editor has the profile open.
      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, { confirmed: true });
      await contestantProfilePage.reload();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
      await contestantProfilePage.expectNamesLocked();
      await contestantProfilePage.expandNameTranslations();
      await contestantProfilePage.expectName('en', ENTERED_ORGANIZATION.name.en);
      await contestantProfilePage.expectName('sv', ENTERED_ORGANIZATION.name.sv);
      await contestantProfilePage.expectShortName('en', ENTERED_ORGANIZATION.shortName.en);

      await voterOrganizationDetail.reloadList();
      await voterOrganizationDetail.expectListed(ENTERED_ORGANIZATION.name.en);
      await voterOrganizationDetail.openListed(ENTERED_ORGANIZATION.name.en);
      await voterOrganizationDetail.expectName(ENTERED_ORGANIZATION.name.en);
      await voterOrganizationDetail.expectAvatarInitials(ENTERED_ORGANIZATION.shortName.en);
    });

    test('voter: the saved logo of organization B is the image a voter sees', async ({
      contestantPreviewPage,
      contestantProfilePage,
      voterOrganizationDetail
    }) => {
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        name: STORED_ORGANIZATION.name,
        shortName: STORED_ORGANIZATION.shortName,
        image: null,
        color: null
      });
      await completeAnswers(UNCONFIRMED_ORGANIZATION_GRANT);

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
      await contestantProfilePage.uploadLogo(LOGO_PATH);
      await contestantProfilePage.expectLogo();
      await contestantProfilePage.save({ expect: 'navigation' });

      await contestantProfilePage.open();
      await contestantProfilePage.expectLogo();

      // The organization's own preview shows the logo in the card and, beside it, the line with the short name.
      await contestantPreviewPage.open();
      await contestantPreviewPage.expectPortraitVisible();
      await contestantPreviewPage.expectTagLine(STORED_ORGANIZATION.shortName.en);

      await voterOrganizationDetail.openFromResults(STORED_ORGANIZATION.name.en);
      await voterOrganizationDetail.expectAvatarImage();
    });

    test('profile: a name edited before a confirmation is refused by name', async ({ contestantProfilePage }) => {
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: false,
        name: STORED_ORGANIZATION.name,
        color: null
      });

      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
      await contestantProfilePage.fillName('en', EDITED_NAME);
      await contestantProfilePage.setColor(ENTERED_COLOR.typed);

      // The administrator confirms the organization while its editor's changes are unsaved.
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, { confirmed: true });
      await contestantProfilePage.saveThroughReread();
      await contestantProfilePage.expectSaveMessage('name-refused');
      await contestantProfilePage.expectSaveFocused();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
      await contestantProfilePage.expectNamesLocked();
      await contestantProfilePage.expectName('en', STORED_ORGANIZATION.name.en);

      // The colour changed in the refused save was stored.
      await contestantProfilePage.reload();
      await contestantProfilePage.expectColor(ENTERED_COLOR.shown);
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
    });
  });
});

/**
 * The states of the unconfirmed organization's profile that are scanned as it is seeded: its names editable.
 */
const UNCONFIRMED_ORGANIZATION_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The profile as an unconfirmed organization first meets it: one name field, the required one, empty; no short name, no logo and an empty colour field.
    // Anchor on the hex field, which the page renders for an organization alone.
    // Marker: the name field's container, which exists for an organization alone.
    name: 'org-profile-editable',
    fixture: 'raw',
    routeId: 'ContestantAppProfile',
    contentTestId: testIds.contestant.profile.colorHex,
    postLoginTestId: testIds.contestant.profile.name,
    reach: async (page) => {
      const { contestantProfilePage } = organizationEditingPagesOf(page);
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: false,
        name: UNCONFIRMED_ORGANIZATION_NAME,
        shortName: null,
        image: null,
        color: null
      });
      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
      await contestantProfilePage.expectNamesEditable();
      await contestantProfilePage.expectNameRequiredBadge(true);
      await contestantProfilePage.expectColor('');
    }
  },
  {
    // Every locale's field of the name and of the short name, with the name in the required locale emptied and not saved: the required badge, the line that names the required language and the note above the buttons are on the page.
    // Anchor on the short name's container; marker: the name's. Both exist for an organization alone.
    name: 'org-profile-editable-translations',
    fixture: 'raw',
    routeId: 'ContestantAppProfile',
    contentTestId: testIds.contestant.profile.shortName,
    postLoginTestId: testIds.contestant.profile.name,
    reach: async (page) => {
      const { contestantProfilePage } = organizationEditingPagesOf(page);
      await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: false,
        name: STORED_ORGANIZATION.name,
        shortName: STORED_ORGANIZATION.shortName,
        image: null,
        color: null
      });
      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
      await contestantProfilePage.expectNameRequiredBadge(false);
      await contestantProfilePage.expandNameTranslations();
      await contestantProfilePage.fillName('en', '');
      await contestantProfilePage.expectName('en', '');
      await contestantProfilePage.expectName('fi', STORED_ORGANIZATION.name.fi);
      await contestantProfilePage.expectNameRequiredBadge(true);
    }
  }
];

/**
 * The unconfirmed organization's profile while answers are locked for the whole project. The describe that declares it unlocks them after each scan.
 */
const ANSWERS_LOCKED_SCAN: ContestantAxeRoute = {
  // Every field locked and no sentence about the name: the warning is what explains the page.
  // Anchor on the name field's container; marker: the warning, which the page renders only while answers are locked.
  name: 'org-profile-answers-locked',
  fixture: 'raw',
  routeId: 'ContestantAppProfile',
  contentTestId: testIds.contestant.profile.name,
  postLoginTestId: testIds.contestant.common.answersLockedWarning,
  reach: async (page) => {
    const { contestantProfilePage } = organizationEditingPagesOf(page);
    await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
      confirmed: false,
      name: STORED_ORGANIZATION.name,
      shortName: STORED_ORGANIZATION.shortName,
      image: null,
      color: null
    });
    await setAnswersLocked(true);
    await contestantProfilePage.open();
    await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-answers' });
    await contestantProfilePage.expectNameNote(false);
    await contestantProfilePage.expectNamesLocked();
  }
};

/**
 * The unconfirmed organization's profile after a save whose changed name was refused, because the organization was confirmed while the change was unsaved. The describe that declares it makes the organization unconfirmed again after each scan.
 */
const NAME_REFUSED_SCAN: ContestantAxeRoute = {
  // The message in the region above the buttons, and the names locked.
  // Anchor on the name field's container; marker: the message region, which holds a message only after a save that stayed.
  name: 'org-profile-name-refused',
  fixture: 'raw',
  routeId: 'ContestantAppProfile',
  contentTestId: testIds.contestant.profile.name,
  postLoginTestId: testIds.contestant.profile.saveMessage,
  reach: async (page) => {
    const { contestantProfilePage } = organizationEditingPagesOf(page);
    await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
      confirmed: false,
      name: STORED_ORGANIZATION.name,
      color: null
    });
    await contestantProfilePage.open();
    await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
    await contestantProfilePage.fillName('en', EDITED_NAME);
    await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, { confirmed: true });
    await contestantProfilePage.save({ expect: 'message' });
    await contestantProfilePage.expectSaveMessage('name-refused');
    await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
    await contestantProfilePage.expectNamesLocked();
  }
};

/**
 * The states of the confirmed organization's pages: its names locked, its colour its own to change.
 */
const CONFIRMED_ORGANIZATION_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The names locked by the confirmation, with the sentence that says so, and the colour field editable and holding a colour.
    // Anchor on the hex field; marker: the colour field's container. Both exist for an organization alone.
    name: 'org-profile-locked',
    fixture: 'raw',
    routeId: 'ContestantAppProfile',
    contentTestId: testIds.contestant.profile.colorHex,
    postLoginTestId: testIds.contestant.profile.color,
    reach: async (page) => {
      const { contestantProfilePage } = organizationEditingPagesOf(page);
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        name: CONFIRMED_ORGANIZATION_NAME,
        shortName: CONFIRMED_ORGANIZATION_SHORT_NAME,
        image: null,
        color: { normal: ENTERED_COLOR.shown }
      });
      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
      await contestantProfilePage.expectNameNote(true);
      await contestantProfilePage.expectNamesLocked();
      await contestantProfilePage.expectColor(ENTERED_COLOR.shown);
    }
  },
  {
    // A text that is no colour committed to the hex field: the field keeps it, is marked invalid and shows its error.
    // Anchor on the hex field; marker: the shared error node, which no other field of this page shows.
    name: 'org-profile-colour-invalid',
    fixture: 'raw',
    routeId: 'ContestantAppProfile',
    contentTestId: testIds.contestant.profile.colorHex,
    postLoginTestId: testIds.shared.inputError,
    reach: async (page) => {
      const { contestantProfilePage } = organizationEditingPagesOf(page);
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        name: CONFIRMED_ORGANIZATION_NAME,
        shortName: CONFIRMED_ORGANIZATION_SHORT_NAME,
        image: null,
        color: { normal: ENTERED_COLOR.shown }
      });
      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
      await contestantProfilePage.typeInvalidColor('not a colour');
      await contestantProfilePage.expectColorError();
    }
  },
  {
    // The organization's preview of itself with no logo and a stored colour on which white text fails the contrast criterion: the initials of its avatar and the symbol of its tag line are painted with the colour, so the scan passes only if the page adjusts it.
    // Anchor on the card's details, which render once the entity's data is loaded; marker: the tag line, which the page renders for an organization alone and with the card.
    name: 'org-preview',
    fixture: 'raw',
    routeId: 'ContestantAppPreview',
    contentTestId: testIds.voter.results.entityDetails,
    postLoginTestId: testIds.contestant.preview.tag,
    reach: async (page) => {
      const { contestantPreviewPage } = organizationEditingPagesOf(page);
      await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
        confirmed: true,
        name: CONFIRMED_ORGANIZATION_NAME,
        shortName: CONFIRMED_ORGANIZATION_SHORT_NAME,
        image: null,
        color: { normal: LOW_CONTRAST_COLOR.stored }
      });
      await completeAnswers(CONFIRMED_ORGANIZATION_GRANT);
      await contestantPreviewPage.open();
      await contestantPreviewPage.expectCardName(CONFIRMED_ORGANIZATION_NAME.en);
      await contestantPreviewPage.expectTagLine(CONFIRMED_ORGANIZATION_SHORT_NAME.en);
    }
  }
];

/**
 * The states only the candidate of the dataset can show: an entity with no opinion question to answer, and a candidate whose names are editable. One block with the candidate's describe below.
 */
const UNCONFIRMED_CANDIDATE_SCANS: ReadonlyArray<ContestantAxeRoute> = [
  {
    // The page the questions URL shows an entity with no opinion question to answer.
    // Anchor on its one button; marker: the page itself. Both are rendered only once the entity's questions are known to be none.
    name: 'contestant-questions-none',
    fixture: 'raw',
    routeId: 'ContestantAppQuestions',
    contentTestId: testIds.contestant.questions.noneReturn,
    postLoginTestId: testIds.contestant.questions.none,
    reach: async (page) => {
      const { contestantNoQuestionsPage } = organizationEditingPagesOf(page);
      await setCandidateState(UNCONFIRMED_CANDIDATE_EXTERNAL_ID, { confirmed: false });
      await contestantNoQuestionsPage.open(UNCONFIRMED_CANDIDATE_GRANT);
      await contestantNoQuestionsPage.expectNeutralPage();
    }
  },
  {
    // An unconfirmed candidate's profile: the first and the last name editable and required, and the instructions of an entity with no opinion question.
    // Anchor on the last name's input; marker: the first name's. Both exist for a candidate alone.
    name: 'cand-profile-names-editable',
    fixture: 'raw',
    routeId: 'ContestantAppProfile',
    contentTestId: testIds.contestant.profile.lastName,
    postLoginTestId: testIds.contestant.profile.firstName,
    reach: async (page) => {
      const { contestantProfilePage } = organizationEditingPagesOf(page);
      await setCandidateState(UNCONFIRMED_CANDIDATE_EXTERNAL_ID, { confirmed: false, ...UNCONFIRMED_CANDIDATE_NAME });
      await contestantProfilePage.open();
      await contestantProfilePage.expectIdentity({ entityType: 'candidate', nameState: 'editable' });
      await contestantProfilePage.expectPersonNamesEditable();
    }
  }
];

test.describe('perm-organization-editing: the accessibility scans', () => {
  test.describe("as the unconfirmed organization's editor", () => {
    test.use({ storageState: UNCONFIRMED_ORGANIZATION_STORAGE_STATE });

    for (const entry of UNCONFIRMED_ORGANIZATION_SCANS) {
      declareScans(entry);
    }

    // The lock is the one settings row of the suite's project: it is taken off again whether or not the scan passed.
    test.describe(() => {
      test.afterEach(async () => {
        await setAnswersLocked(false);
      });

      declareScans(ANSWERS_LOCKED_SCAN);
    });

    // The scan's own steps confirm the organization: it is made unconfirmed again whether or not the scan passed.
    test.describe(() => {
      test.afterEach(async () => {
        await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, { confirmed: false });
      });

      declareScans(NAME_REFUSED_SCAN);
    });
  });

  test.describe("as the confirmed organization's editor", () => {
    test.use({ storageState: CONFIRMED_ORGANIZATION_STORAGE_STATE });

    for (const entry of CONFIRMED_ORGANIZATION_SCANS) {
      declareScans(entry);
    }
  });

  // The candidate's session holds these scans of the describe.
  test.describe("as the unconfirmed candidate's editor", () => {
    test.use({ storageState: UNCONFIRMED_CANDIDATE_STORAGE_STATE });

    for (const entry of UNCONFIRMED_CANDIDATE_SCANS) {
      declareScans(entry);
    }
  });
});

for (const viewport of PHONE_VIEWPORTS) {
  test.describe(`perm-organization-editing: at ${viewport.width}px wide`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });

    test.describe("as the unconfirmed organization's editor", () => {
      test.use({ storageState: UNCONFIRMED_ORGANIZATION_STORAGE_STATE });

      test('phone: an editable profile with every translation shown fits the viewport, and its empty colour field and its locked info question fit their rows', async ({
        contestantProfilePage
      }) => {
        await setOrganizationState(UNCONFIRMED_ORGANIZATION_EXTERNAL_ID, {
          confirmed: false,
          name: STORED_ORGANIZATION.name,
          shortName: STORED_ORGANIZATION.shortName,
          image: null,
          color: null
        });

        await contestantProfilePage.open();
        await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'editable' });
        await contestantProfilePage.expandNameTranslations();
        await contestantProfilePage.expectName('fi', STORED_ORGANIZATION.name.fi);
        await contestantProfilePage.expectColor('');
        await contestantProfilePage.expectFitsViewport();
        await contestantProfilePage.expectColorRowFits();
        await contestantProfilePage.expectLockedInfoRowFits(LOCKED_ORGANIZATION_INFO_QUESTION);
      });
    });

    test.describe("as the confirmed organization's editor", () => {
      test.use({ storageState: CONFIRMED_ORGANIZATION_STORAGE_STATE });

      // Both tests store a long name on the organization: its seeded name is put back whether or not they passed.
      test.afterEach(async () => {
        await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, { name: CONFIRMED_ORGANIZATION_NAME });
      });

      test('phone: a locked profile with a long name and a colour fits the viewport, and its colour field and its locked info question fit their rows', async ({
        contestantProfilePage
      }) => {
        await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
          confirmed: true,
          name: { ...CONFIRMED_ORGANIZATION_NAME, en: LONG_ORGANIZATION_NAME },
          shortName: CONFIRMED_ORGANIZATION_SHORT_NAME,
          image: null,
          color: { normal: ENTERED_COLOR.shown }
        });

        await contestantProfilePage.open();
        await contestantProfilePage.expectIdentity({ entityType: 'organization', nameState: 'locked-confirmed' });
        await contestantProfilePage.expectName('en', LONG_ORGANIZATION_NAME);
        await contestantProfilePage.expectColor(ENTERED_COLOR.shown);
        await contestantProfilePage.expectFitsViewport();
        await contestantProfilePage.expectColorRowFits();
        await contestantProfilePage.expectLockedInfoRowFits(LOCKED_ORGANIZATION_INFO_QUESTION);
      });

      test('phone: the preview of an organization with a long name fits the viewport and shows the name in full', async ({
        contestantPreviewPage
      }) => {
        await setOrganizationState(CONFIRMED_ORGANIZATION_EXTERNAL_ID, {
          confirmed: true,
          name: { ...CONFIRMED_ORGANIZATION_NAME, en: LONG_ORGANIZATION_NAME },
          shortName: CONFIRMED_ORGANIZATION_SHORT_NAME,
          image: null,
          color: { normal: LOW_CONTRAST_COLOR.stored }
        });
        await completeAnswers(CONFIRMED_ORGANIZATION_GRANT);

        await contestantPreviewPage.open();
        await contestantPreviewPage.expectCardName(LONG_ORGANIZATION_NAME);
        await contestantPreviewPage.expectTagLine(CONFIRMED_ORGANIZATION_SHORT_NAME.en);
        await contestantPreviewPage.expectFitsViewport();
      });
    });

    // The candidate's session holds these two tests of the describe.
    test.describe("as the unconfirmed candidate's editor", () => {
      test.use({ storageState: UNCONFIRMED_CANDIDATE_STORAGE_STATE });

      test("phone: a candidate's profile fits the viewport, and its name fields fit their rows", async ({
        contestantProfilePage
      }) => {
        await setCandidateState(UNCONFIRMED_CANDIDATE_EXTERNAL_ID, { confirmed: false, ...UNCONFIRMED_CANDIDATE_NAME });

        await contestantProfilePage.open();
        await contestantProfilePage.expectIdentity({ entityType: 'candidate', nameState: 'editable' });
        await contestantProfilePage.expectPersonNames(
          UNCONFIRMED_CANDIDATE_NAME.firstName,
          UNCONFIRMED_CANDIDATE_NAME.lastName
        );
        await contestantProfilePage.expectFitsViewport();
        await contestantProfilePage.expectPersonNameRowsFit();
      });

      test('phone: the page for an entity with no opinion question fits the viewport, and its button is of full size', async ({
        contestantNoQuestionsPage
      }) => {
        await setCandidateState(UNCONFIRMED_CANDIDATE_EXTERNAL_ID, { confirmed: false });

        await contestantNoQuestionsPage.open(UNCONFIRMED_CANDIDATE_GRANT);
        await contestantNoQuestionsPage.expectNeutralPage();
        await contestantNoQuestionsPage.expectFitsViewport();
      });
    });
  });
}
