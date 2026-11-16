/**
 * Entity selection: a user who edits several entities chooses one, switches between them without signing out, and saves to the selected entity only; a user who edits one never sees the selection; a user who edits none is told so; every one of them reaches the one settings page.
 *
 * Runs under the `contestant-entity-selection` project, whose stored session is that of a user who edits two candidates and one organization of the base dataset (`MULTI_ENTITY_STORAGE_STATE`, written by `data-setup-entity-selection`). Three groups swap the session: one loads the base candidate's, two start signed out.
 *
 * Ten groups:
 *   1. Choosing — the root lists the three entities, candidates first and in alphabetical order, under two group headings; a card leads to that entity's home and the menu names the entity.
 *   2. Never the previous one's — an unsaved answer is kept per entity through a reload, is absent on the other entity, and a save changes the selected entity's row alone.
 *   3. Switching — the menu's switch item returns to the selection; the organization's home names it; the second candidate's pages show the second candidate's answer; Switch profile on the home returns to the selection too.
 *   4. The prompt — switching from the editor with an unsaved edit raises the page's one native confirm; Cancel keeps the page and the edit.
 *   5. Refusals — a URL naming an entity the user does not edit, or the user's own entity under the other type, lands on the selection with nothing added to it.
 *   6. The header's Log out — a signed-in user has it and signs out with it at once where no entity is loaded, and while a slow sign-out runs there it is disabled and shows a spinner; a Back pressed while a sign-out there runs and then fails is followed as a Back, and Forward returns to the page; the signed-out header has none; on an entity's page it opens the modal, which a navigation closes before its count can sign the user out; Back from a question with an unsaved answer, agreed at the native question, shows the list with the modal closed, and the count ends nothing; on the profile, on a question and on the nomination details with something unsaved it opens the modal, which says the changes will be lost, and no native question is raised in the whole test: Continue, and on the profile a close the platform makes, leave the session, the page and the edit as they were and stop the count, while the modal's Log out and the end of its count end signed out, with the draft gone; with tasks left the modal says both what is unsaved and what is left, with nothing to count it says the first alone, and with nothing unsaved its count ends the session too; the end of a count leaves a login screen that says why; over an unsaved edit the browser names the dialog by the sentence saying it will be lost, and computes a description for it from what else it says and the count's full length, which holds while the visible number runs; a sign-out that fails, from the modal's Log out or at its count's end, shows a message named apart from Log out, with one Close, and leaves the page, the edit and its draft as they were, and pressing again ends signed out, also after a failure whose answer has cleared the cookies; after such a failure a link that reaches the gate ends on the login screen with no message, and after a failure with the session alive the message stays across links until a later press ends signed out; with a live session Back to the entry screens ends on the home with the message still there, writes no history and goes on out of the app past them; after a failure that cleared the cookies Back to the sign-in screen shows no message and signing in again shows none; after Back to the login screen with a live session a sign-out that fails says so; a user who is no administrator, on a link into the Admin App, is signed out with no draft left, and when the sign-out fails ends on the error page with no request to the Admin App's login page, and when that failed sign-out has cleared the cookies ends on the Admin App's login page with no draft left; and with the session ended elsewhere and no signal to the tab, a link to a page whose load makes a request reaches the login screen; and a sign-out in another tab sends a tab holding an unsaved answer at once to a login screen that says why, with its draft gone; and a count left in a tab that closes ends the session at the browser's next request, on a login screen that says why, with no draft left, and a count whose timer did not run signs out when the tab is shown again; Continue, the modal's Log out, the count's own sign-out and a failed sign-out at its end each leave no deadline, and a reload of the tab during the count removes it and keeps the session; once such a count has signed out a tab that was already open, a sign-in in that tab, with no new document, keeps its session, and no draft and no deadline are left; a Log out in another tab, made at once after the count's tab has closed, withdraws that count, so a sign-in after it keeps its session once the deadline would have passed; once the session has ended with no Log out after the count's tab has closed, a sign-in withdraws that count and keeps its session once the deadline would have passed; a sign-out the server makes with no signal to any tab, after the count's tab has closed, removes that count at once; with the page's clock five minutes behind the server's, a request made while the modal counts keeps the session; and a page opened in another tab during the count leaves it, so that tab meets the sign-out at its next request once the count's tab has closed.
 *   7. A closed entry — on the home, in both colour schemes, a closed entry's lock has the colour of its label and an open row's icon does not.
 *   8. One entity — a user who edits a single entity is redirected from the root to its home, which offers no Switch profile, and has no switch item.
 *   9. Nothing to edit — a user whose only grant is removed sees the view with their email and logs out from it without a confirmation modal.
 *  10. The settings page — a user who edits nothing reaches it from the "nothing to edit" view, a user who edits several opens it at the app's root, and the settings address under an entity leads to it.
 *
 * No stored session is signed out here: the cases that log out sign in through the login form first, in a session of their own, and a sign-out ends that session alone. The spec writes to one row, the first selection candidate, which is unconfirmed and so read by no voter query.
 *
 * State is carried between the steps of one test and never between tests: each test starts from the stored session, whose browser storage holds no draft.
 *
 * The suite runs these cases at the desktop viewport of its project and never passes the terms-of-use view: every identity has accepted the terms at registration.
 *
 * **Rigidity contract:** hard assertions only, every locator behind a fixture, no branch in a test body.
 */

import { STORAGE_STATE } from '../../../playwright.config';
import { createAdminLoginPage } from '../../fixtures/admin/adminLoginPage.fixture';
import {
  createContestantEntityPages,
  entityGroupTitle,
  expect,
  SELECTION_TEXT,
  test
} from '../../fixtures/contestant/contestant-entity-selection';
import { createContestantEntitySelectionPage } from '../../fixtures/contestant/contestantEntitySelectionPage.fixture';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { createContestantQuestionPage } from '../../fixtures/contestant/contestantQuestionPage.fixture';
import { createContestantSettingsPage } from '../../fixtures/contestant/contestantSettingsPage.fixture';
import { createHeaderLogout } from '../../fixtures/shared/headerLogout.fixture';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import {
  NO_ENTITY_STORAGE_STATE,
  TEST_CANDIDATE_PASSWORD,
  TEST_LOGOUT_ENTITY_EMAIL,
  TEST_MULTI_ENTITY_EMAIL,
  TEST_NO_ENTITY_EMAIL,
  TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID,
  TEST_SELECTION_ORGANIZATION_EXTERNAL_ID
} from '../../utils/testCredentials';

/** The answers the base dataset seeds for the two selection candidates on the question they differ on, and the position of each among the question's five choices. */
const SEEDED_ANSWER_A = '3';
const SEEDED_ANSWER_B = '5';
const SEEDED_CHOICE_INDEX_A = 2;
const SEEDED_CHOICE_INDEX_B = 4;

/** The answer the spec saves for the first candidate: the question's first choice. */
const SAVED_CHOICE_INDEX = 0;
const SAVED_ANSWER = '1';

/** A choice neither seeded nor saved for the first candidate, so selecting it is an unsaved edit whatever ran before. */
const UNSAVED_CHOICE_INDEX = 1;

/** The last name the base dataset seeds for the second candidate. */
const SEEDED_LAST_NAME_B = 'Entity Two';

/** A first name typed and never saved. */
const UNSAVED_FIRST_NAME = 'Unsaved';

/** An organization name typed and never saved. */
const UNSAVED_ORGANIZATION_NAME = 'Unsaved party name';

/** A last name typed after the question was refused, and never saved. */
const FURTHER_LAST_NAME = 'Further';

/** A symbol typed and never saved. */
const UNSAVED_SYMBOL = '77';

/** The election whose card of the second candidate the nomination details show. */
const REGIONAL_ELECTION_NAME = '[el-reg] Regional Election';

test.describe('contestant entity selection', () => {
  test(
    'choosing: the root lists the entities by type and name, and a card opens that entity',
    { tag: '@entity-selection' },
    async ({ contestantEntityPages, contestantEntitySelectionPage, navMenu, selectionEntities }) => {
      const { candidateA, candidateB, organization } = selectionEntities;

      await test.step('the root shows three cards, candidates before the organization, under two headings', async () => {
        await contestantEntitySelectionPage.open();
        expect(await contestantEntitySelectionPage.readView()).toEqual({
          heading: SELECTION_TEXT.title,
          groups: [
            {
              entityType: 'candidate',
              heading: SELECTION_TEXT.groupHeading.candidate,
              cards: [
                { title: candidateA.name, typeLabel: SELECTION_TEXT.typeLabel.candidate },
                { title: candidateB.name, typeLabel: SELECTION_TEXT.typeLabel.candidate }
              ]
            },
            {
              entityType: 'organization',
              heading: SELECTION_TEXT.groupHeading.organization,
              cards: [{ title: organization.name, typeLabel: SELECTION_TEXT.typeLabel.organization }]
            }
          ],
          alertCount: 0
        });
      });

      await test.step('each card links to the home of its own entity', async () => {
        for (const entity of [candidateA, candidateB, organization]) {
          await contestantEntitySelectionPage.expectCardLinksTo(entity.name, contestantEntityPages.homePath(entity));
        }
      });

      await test.step('picking the first candidate lands on its home, and the menu names it', async () => {
        await contestantEntitySelectionPage.pick(candidateA.name);
        await contestantEntityPages.expectOnHome(candidateA);
        await contestantEntitySelectionPage.expectAbsent();
        await navMenu.openMobileNav();
        await navMenu.expectEntityGroupTitle(entityGroupTitle(candidateA));
        await navMenu.expectSwitchEntityItem();
        await navMenu.closeNav();
      });
    }
  );

  test(
    "never the previous one's: a draft and a save belong to the selected entity",
    { tag: '@entity-selection' },
    async ({ contestantEntityPages, contestantQuestionPage, nativeDialogs, selectionEntities }) => {
      const { candidateA, candidateB, differingQuestionId } = selectionEntities;

      await test.step('both candidates start from their seeded answers', async () => {
        expect(await selectionEntities.savedAnswerValue(candidateA, differingQuestionId)).toBe(SEEDED_ANSWER_A);
        expect(await selectionEntities.savedAnswerValue(candidateB, differingQuestionId)).toBe(SEEDED_ANSWER_B);
      });

      await test.step('an unsaved answer of the first candidate survives a reload', async () => {
        await contestantEntityPages.openQuestion(candidateA, differingQuestionId);
        await contestantQuestionPage.expectSelectedChoice(SEEDED_CHOICE_INDEX_A);
        await contestantQuestionPage.selectChoice(SAVED_CHOICE_INDEX);
        await contestantQuestionPage.expectSelectedChoice(SAVED_CHOICE_INDEX);
        expect(await contestantEntityPages.draftQuestionIds(candidateA)).toEqual([differingQuestionId]);

        await contestantEntityPages.reload();
        await contestantEntityPages.expectOnQuestion(candidateA, differingQuestionId);
        await contestantQuestionPage.expectSelectedChoice(SAVED_CHOICE_INDEX);
        expect(await contestantEntityPages.draftQuestionIds(candidateA)).toEqual([differingQuestionId]);
        // Unsaved: the page shows the edit while the row still holds the seeded answer.
        expect(await selectionEntities.savedAnswerValue(candidateA, differingQuestionId)).toBe(SEEDED_ANSWER_A);
      });

      await test.step('the second candidate shows its own saved answer and has no draft', async () => {
        await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
        await contestantQuestionPage.expectSelectedChoice(SEEDED_CHOICE_INDEX_B);
        expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([]);
        expect(await contestantEntityPages.draftQuestionIds(candidateA)).toEqual([differingQuestionId]);
      });

      await test.step("back on the first candidate the edit is still there, and saving it changes that candidate's row alone", async () => {
        await contestantEntityPages.openQuestion(candidateA, differingQuestionId);
        await contestantQuestionPage.expectSelectedChoice(SAVED_CHOICE_INDEX);
        await contestantQuestionPage.expectContinueEnabled();
        nativeDialogs.clear();
        await contestantQuestionPage.clickContinue();
        await contestantEntityPages.expectOnQuestionsOverview(candidateA);
        expect(nativeDialogs.types()).toEqual([]);

        expect(await selectionEntities.savedAnswerValue(candidateA, differingQuestionId)).toBe(SAVED_ANSWER);
        expect(await selectionEntities.savedAnswerValue(candidateB, differingQuestionId)).toBe(SEEDED_ANSWER_B);
        expect(await contestantEntityPages.draftQuestionIds(candidateA)).toEqual([]);
      });
    }
  );

  test(
    "switching: the menu returns to the selection, and the next entity's pages show that entity",
    { tag: '@entity-selection' },
    async ({
      contestantEntityPages,
      contestantEntitySelectionPage,
      contestantHomePage,
      contestantQuestionPage,
      contestantQuestionsOverviewPage,
      navMenu,
      selectionEntities
    }) => {
      const { candidateA, candidateB, organization, differingQuestionId, differingQuestionLabel } = selectionEntities;

      await test.step("from the first candidate's home the switch item leads to the selection", async () => {
        await contestantEntityPages.openHome(candidateA);
        await navMenu.openMobileNav();
        await navMenu.switchEntity();
        await contestantEntitySelectionPage.expectShown();
        await contestantEntitySelectionPage.expectHeadingFocused();
      });

      await test.step('picking the organization lands on a home that names it, as does the menu', async () => {
        await contestantEntitySelectionPage.pick(organization.name);
        await contestantEntityPages.expectOnHome(organization);
        await contestantEntityPages.expectHomeHeadingNames(organization);
        await navMenu.openMobileNav();
        await navMenu.expectEntityGroupTitle(entityGroupTitle(organization));
        await navMenu.expectSwitchEntityItem();
      });

      await test.step("switching again to the second candidate shows that candidate's saved answer", async () => {
        await navMenu.switchEntity();
        await contestantEntitySelectionPage.expectShown();
        await contestantEntitySelectionPage.pick(candidateB.name);
        await contestantEntityPages.expectOnHome(candidateB);
        await navMenu.openMobileNav();
        await navMenu.expectEntityGroupTitle(entityGroupTitle(candidateB));
        await navMenu.closeNav();

        // Reached by links inside the application, so the store that held the first candidate and then the organization is the one that must now hold the second candidate.
        await contestantHomePage.clickTask('opinions');
        await contestantEntityPages.expectOnQuestionsOverview(candidateB);
        await contestantQuestionsOverviewPage.goToQuestion(differingQuestionLabel);
        await contestantEntityPages.expectOnQuestion(candidateB, differingQuestionId);
        await contestantQuestionPage.expectSelectedChoice(SEEDED_CHOICE_INDEX_B);
      });
    }
  );

  test(
    'a user with several profiles switches profile from the home',
    { tag: '@entity-selection' },
    async ({ contestantEntityPages, contestantEntitySelectionPage, contestantHomePage, selectionEntities }) => {
      const { candidateA, organization } = selectionEntities;

      await test.step("the first candidate's home offers Switch profile, which leads to the selection", async () => {
        await contestantEntityPages.openHome(candidateA);
        await contestantHomePage.switchProfile();
        await contestantEntitySelectionPage.expectShown();
        await contestantEntitySelectionPage.expectHeadingFocused();
      });

      await test.step("the organization's home, picked there, offers it too", async () => {
        await contestantEntitySelectionPage.pick(organization.name);
        await contestantEntityPages.expectOnHome(organization);
        await contestantHomePage.expectSwitchProfile();
      });
    }
  );

  test(
    'the prompt: switching from the editor with an unsaved edit raises one native confirm, and Cancel keeps the edit',
    { tag: '@entity-selection' },
    async ({ contestantEntityPages, contestantQuestionPage, nativeDialogs, navMenu, selectionEntities }) => {
      const { candidateA, differingQuestionId } = selectionEntities;

      await test.step('an unsaved edit on the question editor', async () => {
        await contestantEntityPages.openQuestion(candidateA, differingQuestionId);
        await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
        await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
        expect(await contestantEntityPages.draftQuestionIds(candidateA)).toEqual([differingQuestionId]);
      });

      await test.step('the switch item raises exactly one confirm; dismissed, the editor and the edit remain', async () => {
        nativeDialogs.answerConfirmWith('dismiss');
        nativeDialogs.clear();
        await navMenu.openMobileNav();
        await navMenu.switchEntity();
        await expect.poll(() => nativeDialogs.types()).toEqual(['confirm']);
        await contestantEntityPages.expectOnQuestion(candidateA, differingQuestionId);
        await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
        expect(await contestantEntityPages.draftQuestionIds(candidateA)).toEqual([differingQuestionId]);
        expect(nativeDialogs.types()).toEqual(['confirm']);
      });

      await test.step("the page's own Cancel discards the edit without a prompt", async () => {
        nativeDialogs.clear();
        await contestantQuestionPage.clickCancel();
        await contestantEntityPages.expectOnQuestionsOverview(candidateA);
        expect(nativeDialogs.types()).toEqual([]);
        expect(await contestantEntityPages.draftQuestionIds(candidateA)).toEqual([]);
      });
    }
  );

  test(
    'refusals: an entity URL the user may not open lands on the selection, unchanged',
    { tag: '@entity-selection' },
    async ({ contestantEntityPages, contestantEntitySelectionPage, selectionEntities }) => {
      const { baseCandidate, candidateA } = selectionEntities;

      await contestantEntitySelectionPage.open();
      const plainVisit = await contestantEntitySelectionPage.readView();
      expect(plainVisit.groups.flatMap((group) => group.cards)).toHaveLength(3);

      await test.step('the URL of a candidate the user does not edit', async () => {
        await contestantEntityPages.requestHome(baseCandidate);
        await contestantEntitySelectionPage.expectShown();
        expect(await contestantEntitySelectionPage.readView()).toEqual(plainVisit);
      });

      await test.step("the user's own candidate under the organization type", async () => {
        await contestantEntityPages.requestHome({ entityType: 'organization', id: candidateA.id });
        await contestantEntitySelectionPage.expectShown();
        expect(await contestantEntitySelectionPage.readView()).toEqual(plainVisit);
      });
    }
  );

  test.describe('the header’s Log out', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    /** The second candidate answers every question it is asked, so its tasks count nothing, and the modal speaks of an unsaved edit alone. */
    async function signInAndOpenSecondCandidate({
      contestantEntityPages,
      contestantEntitySelectionPage,
      contestantLoginPage,
      selectionEntities
    }: Pick<
      Parameters<Parameters<typeof test>[2]>[0],
      'contestantEntityPages' | 'contestantEntitySelectionPage' | 'contestantLoginPage' | 'selectionEntities'
    >): Promise<void> {
      await contestantLoginPage.goToPage();
      await contestantLoginPage.login(TEST_MULTI_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
      await contestantEntitySelectionPage.expectShown();
      await contestantEntitySelectionPage.pick(selectionEntities.candidateB.name);
      await contestantEntityPages.expectOnHome(selectionEntities.candidateB);
    }

    /** The user who is no administrator signs in, leaves an unsaved answer on the organization's question and loads its home again, with the answer stored as a draft. The native question the browser asks on leaving the question is confirmed, and the record of native questions starts empty on the home. */
    async function signInWithADraftOnTheOrganization({
      contestantEntityPages,
      contestantLoginPage,
      contestantQuestionPage,
      nativeDialogs,
      selectionEntities
    }: Pick<
      Parameters<Parameters<typeof test>[2]>[0],
      'contestantEntityPages' | 'contestantLoginPage' | 'contestantQuestionPage' | 'nativeDialogs' | 'selectionEntities'
    >): Promise<void> {
      const { differingQuestionId, organization } = selectionEntities;
      await contestantLoginPage.goToPage();
      await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
      await contestantEntityPages.expectOnHome(organization);
      await contestantEntityPages.openQuestion(organization, differingQuestionId);
      await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
      await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
      expect(await contestantEntityPages.draftQuestionIds(organization)).toEqual([differingQuestionId]);
      await contestantEntityPages.openHome(organization);
      expect(await contestantEntityPages.draftQuestionIds(organization)).toEqual([differingQuestionId]);
      nativeDialogs.clear();
    }

    test(
      "the header's Log out signs a user out at once where no entity is loaded, and the signed-out header has none",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantLoginPage,
        contestantSettingsPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        await test.step('a user signs in through the login form and opens the settings page', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(selectionEntities.organization);
          await contestantSettingsPage.open();
        });

        await test.step('pressing Log out ends on the login screen, whose header has none', async () => {
          await headerLogout.expectShown();
          await headerLogout.press();
          await contestantLoginPage.expectEndedOnEntry();
          await headerLogout.expectAbsent();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out where it signs out at once shows that a slow sign-out is under way, and ends on the login screen",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantLoginPage,
        contestantSettingsPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        await test.step('a user signs in through the login form and opens the settings page', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(selectionEntities.organization);
          await contestantSettingsPage.open();
        });

        await test.step('while the sign-out is held, Log out is disabled and shows a spinner', async () => {
          await headerLogout.expectShown();
          await headerLogout.holdSignOut();
          await headerLogout.press();
          await headerLogout.expectInProgress();
        });

        await test.step('once the sign-out goes on, the user ends on the login screen with no native question', async () => {
          await headerLogout.releaseSignOut();
          await contestantLoginPage.expectEndedOnEntry();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out when the sign-out fails: a Back pressed while it runs is followed as a Back, and Forward returns to the page",
      { tag: '@entity-selection' },
      async ({
        page,
        contestantEntityPages,
        contestantLoginPage,
        contestantSettingsPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { organization } = selectionEntities;

        await test.step('a user signs in through the login form, and goes from the home to the settings page by a link', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await contestantEntityPages.followLinkInsideTheApp(
            buildRoute({ route: 'ContestantAppSettings', locale: 'en' })
          );
          await contestantSettingsPage.expectShown();
        });

        await test.step('while the sign-out is held, a Back waits on the settings page', async () => {
          await headerLogout.expectShown();
          await headerLogout.holdSignOut();
          await headerLogout.press();
          await headerLogout.expectInProgress();
          await headerLogout.goBackFromThePage();
          await contestantSettingsPage.expectShown();
        });

        await test.step('once the sign-out fails, the Back is followed to the home, and Forward returns to the settings page', async () => {
          await headerLogout.releaseSignOutAsFailure();
          await headerLogout.expectFailureMessage();
          await contestantEntityPages.expectOnHome(organization);
          await page.goForward();
          await contestantSettingsPage.expectShown();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out opens the modal on an entity's page, and a navigation closes it and leaves the user signed in",
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, nativeDialogs, selectionEntities }) => {
        const { organization } = selectionEntities;

        await test.step('a user signs in, and goes from the home to the profile inside the application', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.installClock();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
        });

        await test.step('Log out opens the modal, and browser Back shows the home with the modal closed', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.goBack();
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.expectDialogClosed();
        });

        await test.step('past the count, the user is still signed in on that page', async () => {
          await headerLogout.advancePastModalCount();
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.expectShown();
          await headerLogout.expectStillSignedIn();
          await headerLogout.expectNoSignOutRequest();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on the profile with an unsaved edit: Stay keeps the session and the edit, and the count stops",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantProfilePage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in, opens the profile and edits a name', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await headerLogout.installClock();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.fillFirstName(UNSAVED_FIRST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
        });

        await test.step('Log out opens the modal, which says the edit will be lost, and its description holds while the count runs', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectModalSaysUnsavedAlone();
          await headerLogout.expectModalNamesUnsavedAndDescribesCount();
          await headerLogout.expectModalDescriptionHoldsWhileCounting();
        });

        await test.step('after Stay, past the count nothing was ended', async () => {
          await headerLogout.stay();
          await headerLogout.advancePastModalCount();
          await headerLogout.expectStillSignedIn();
          await headerLogout.expectNoSignOutRequest();
        });

        await test.step('the page has not moved, the edit is there and a further edit is taken', async () => {
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
          await contestantProfilePage.fillLastName(FURTHER_LAST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, FURTHER_LAST_NAME);
          await headerLogout.expectShown();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on the profile with an unsaved edit: a close the platform makes keeps the session and the edit, and the count stops",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantProfilePage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in, opens the profile and edits a name', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await headerLogout.installClock();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.fillFirstName(UNSAVED_FIRST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
        });

        await test.step('Log out opens the modal, the platform closes it, and past the count nothing was ended', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.closeAsThePlatformDoes();
          await headerLogout.advancePastModalCount();
          await headerLogout.expectStillSignedIn();
          await headerLogout.expectNoSignOutRequest();
        });

        await test.step('the page has not moved, the edit is there and a further edit is taken', async () => {
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
          await contestantProfilePage.fillLastName(FURTHER_LAST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, FURTHER_LAST_NAME);
          await headerLogout.expectShown();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on the profile with an unsaved edit: the modal's Log out ends signed out, with no native question",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantProfilePage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in, opens the profile and edits a name', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.fillFirstName(UNSAVED_FIRST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
        });

        await test.step('Log out opens the modal, and its Log out is pressed', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
        });

        await test.step('the user ends on the login screen, signed out on the server', async () => {
          await contestantLoginPage.expectEndedOnEntry();
          await headerLogout.expectAbsent();
          await headerLogout.expectSignedOut();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on the profile with an unsaved edit: while the modal's sign-out runs, the ✕ and Escape keep the modal open, and it ends signed out",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantProfilePage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in, opens the profile and edits a name', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.fillFirstName(UNSAVED_FIRST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
        });

        await test.step("with the sign-out held, the modal's Log out is pressed, and the ✕ and three Escapes leave the modal open", async () => {
          await headerLogout.holdSignOut();
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await headerLogout.pressModalClose();
          await headerLogout.pressEscape();
          await headerLogout.pressEscape();
          await headerLogout.pressEscape();
          await headerLogout.expectDialogOpen();
        });

        await test.step('once the sign-out goes on, the user ends on the login screen with no native question', async () => {
          await headerLogout.releaseSignOut();
          await contestantLoginPage.expectEndedOnEntry();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on a question with an unsaved answer: Stay keeps the session and the answer, and the modal's Log out ends signed out with the draft gone",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;

        await test.step('a user signs in, opens a question and selects another answer', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step('after Stay, nothing was ended and the answer and its draft are there', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.stay();
          await headerLogout.expectNoLogoutDeadline();
          await headerLogout.expectStillSignedIn();
          await headerLogout.expectNoSignOutRequest();
          await contestantEntityPages.expectOnQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step("after the modal's Log out, the user ends signed out and the draft is gone", async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await contestantLoginPage.expectEndedOnEntry();
          await headerLogout.expectAbsent();
          await headerLogout.expectSignedOut();
          await headerLogout.expectNoLogoutDeadline();
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([]);
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on a question with an unsaved answer: a count left in a tab that closes ends the session at the browser's next request, on a login screen that says why, with no draft left",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        page,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;

        await test.step('a user signs in, opens a question and selects another answer, which is stored as a draft', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step("Log out opens the modal, the count's deadline is stored, and the tab closes during the count", async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectLogoutDeadlineSet();
          await page.close();
          await headerLogout.passLogoutDeadline();
        });

        await test.step("past the deadline, a new tab opening the entity's home ends on the login screen, which says why, signed out, with no draft left", async () => {
          const newTab = await page.context().newPage();
          const newTabPages = createContestantEntityPages(newTab);
          const newTabLogin = createContestantLoginPage(newTab);
          const newTabLogout = createHeaderLogout(newTab);
          await newTabPages.requestHome(candidateB);
          await newTabLogin.expectOnEntry();
          await newTabLogin.expectNotice('loggedOutAutomatically');
          await newTabLogin.expectHeadingDescribedByNotice('loggedOutAutomatically');
          await newTabLogout.expectSignedOut();
          await expect.poll(() => newTabPages.draftQuestionIds(candidateB), { timeout: TIMEOUTS.slowPage }).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out: once a count left in a closed tab has signed out a tab that was already open, a sign-in there keeps the session, with no draft and no deadline left",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        headerLogout,
        page,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;
        const otherTab = await page.context().newPage();
        const otherTabPages = createContestantEntityPages(otherTab);
        const otherTabQuestion = createContestantQuestionPage(otherTab);
        const otherTabLogout = createHeaderLogout(otherTab);

        await test.step("a user signs in and opens the entity's home", async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
        });

        await test.step('a second tab leaves an unsaved answer, opens the modal and closes during the count, whose deadline then passes', async () => {
          await otherTabPages.openQuestion(candidateB, differingQuestionId);
          await otherTabQuestion.selectChoice(UNSAVED_CHOICE_INDEX);
          await otherTabQuestion.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await otherTabPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
          await otherTabLogout.pressExpectingDialog();
          await otherTabLogout.expectLogoutDeadlineSet();
          await otherTab.close();
          await otherTabLogout.passLogoutDeadline();
        });

        await test.step('in the first tab, a link whose page makes a request ends on the login screen', async () => {
          await contestantEntityPages.followLinkInsideTheApp(
            buildRoute({ route: 'ContestantAppSettings', locale: 'en' })
          );
          await contestantLoginPage.expectOnEntry();
        });

        await test.step('in the same tab, with no new document, a sign-in leads on to the settings page the link asked for', async () => {
          await contestantLoginPage.followSignInInsideTheApp();
          await contestantLoginPage.expectSignInShown();
          await contestantLoginPage.login(TEST_MULTI_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantLoginPage.expectLedToSettings();
        });

        await test.step('the session stays, and no draft and no deadline are left', async () => {
          await headerLogout.expectStillSignedIn();
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([]);
          await headerLogout.expectNoLogoutDeadline();
        });
      }
    );

    test(
      "the header's Log out on a question with an unsaved answer: a page opened in another tab during the count leaves it, and the count's tab, closed, still ends the session at the browser's next request",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        page,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;
        const otherTab = await page.context().newPage();
        const otherTabPages = createContestantEntityPages(otherTab);
        const otherTabLogin = createContestantLoginPage(otherTab);
        const otherTabLogout = createHeaderLogout(otherTab);

        await test.step('a user signs in, opens a question and selects another answer, which is stored as a draft', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step("Log out opens the modal, and the count's deadline is stored", async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectLogoutDeadlineSet();
        });

        await test.step("a second tab opens the entity's home during the count, and the count is still stored", async () => {
          await otherTabPages.openHome(candidateB);
          await otherTabLogout.expectShown();
          await otherTabLogout.expectLogoutDeadlineSet();
        });

        await test.step("the count's tab closes, and its deadline passes", async () => {
          await page.close();
          await otherTabLogout.passLogoutDeadline();
        });

        await test.step('in the second tab, a link whose page makes a request ends on the login screen, signed out, with no draft and no deadline left', async () => {
          await otherTabPages.followLinkInsideTheApp(buildRoute({ route: 'ContestantAppSettings', locale: 'en' }));
          await otherTabLogin.expectOnEntry();
          await otherTabLogout.expectSignedOut();
          await expect
            .poll(() => otherTabPages.draftQuestionIds(candidateB), { timeout: TIMEOUTS.slowPage })
            .toEqual([]);
          await otherTabLogout.expectNoLogoutDeadline();
        });
      }
    );

    test(
      'a sign-out in another tab sends this tab at once to a login screen that says why, and its draft is not stored again',
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        headerLogout,
        page,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;
        const otherTab = await page.context().newPage();
        const otherTabPages = createContestantEntityPages(otherTab);
        const otherTabQuestion = createContestantQuestionPage(otherTab);
        const otherTabLogin = createContestantLoginPage(otherTab);

        await test.step("a user signs in and opens the entity's home", async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
        });

        await test.step('a second tab opens a question and selects another answer, which is stored as a draft', async () => {
          await otherTabPages.openQuestion(candidateB, differingQuestionId);
          await otherTabQuestion.selectChoice(UNSAVED_CHOICE_INDEX);
          await otherTabQuestion.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await otherTabPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step("the first tab's Log out, with nothing to ask about there, ends signed out at once", async () => {
          await headerLogout.press();
          await contestantLoginPage.expectEndedOnEntry();
        });

        await test.step('the second tab is on a login screen that says why, and the draft is not in storage', async () => {
          await otherTabLogin.expectOnEntry();
          await otherTabLogin.expectNotice('loggedOutElsewhere');
          expect(await otherTabPages.draftQuestionIds(candidateB)).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on a question with an unsaved answer: Back, agreed at the native question, shows the list with the modal closed, and the count ends nothing",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantHomePage,
        contestantLoginPage,
        contestantQuestionPage,
        contestantQuestionsOverviewPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId, differingQuestionLabel } = selectionEntities;

        await test.step('a user signs in, goes by links to a question and selects another answer', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await headerLogout.installClock();
          await contestantHomePage.clickTask('opinions');
          await contestantEntityPages.expectOnQuestionsOverview(candidateB);
          await contestantQuestionsOverviewPage.goToQuestion(differingQuestionLabel);
          await contestantEntityPages.expectOnQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
        });

        await test.step('Log out opens the modal, and Back, agreed at the native question, shows the list with the modal closed', async () => {
          await headerLogout.pressExpectingDialog();
          nativeDialogs.answerConfirmWith('accept');
          await headerLogout.goBack();
          await contestantEntityPages.expectOnQuestionsOverview(candidateB);
          await headerLogout.expectDialogClosed();
        });

        await test.step('past the count, the user is still signed in on the list', async () => {
          await headerLogout.advancePastModalCount();
          await contestantEntityPages.expectOnQuestionsOverview(candidateB);
          await headerLogout.expectShown();
          await headerLogout.expectStillSignedIn();
          await headerLogout.expectNoSignOutRequest();
          expect(nativeDialogs.types()).toEqual(['confirm']);
        });
      }
    );

    test(
      "the header's Log out on the nomination details with an unsaved change: Stay keeps the session and the change, and the modal's Log out ends signed out",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantNominationEditor,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const card = { election: REGIONAL_ELECTION_NAME };

        await test.step('a user signs in, walks to the nomination details and changes a symbol', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantNominationEditor.open({
            entityType: 'candidate',
            externalId: TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID
          });
          await contestantNominationEditor.expectStep('elections');
          await contestantNominationEditor.continueFromElections();
          await contestantNominationEditor.expectStep('constituencies');
          await contestantNominationEditor.continueFromConstituencies();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.typeSymbol(card, UNSAVED_SYMBOL);
          await contestantNominationEditor.expectSymbol(card, UNSAVED_SYMBOL);
        });

        await test.step('after Stay, nothing was ended and the change is there', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.stay();
          await headerLogout.expectStillSignedIn();
          await headerLogout.expectNoSignOutRequest();
          await contestantNominationEditor.expectStep('details');
          await contestantNominationEditor.expectSymbol(card, UNSAVED_SYMBOL);
        });

        await test.step("after the modal's Log out, the user ends signed out", async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await contestantLoginPage.expectEndedOnEntry();
          await headerLogout.expectAbsent();
          await headerLogout.expectSignedOut();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out with an unsaved edit and tasks left: the modal says both, and its count ends the session",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantLoginPage,
        contestantProfilePage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { organization } = selectionEntities;

        await test.step('a user with tasks left signs in, opens the profile and edits the name', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.installClock();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
          await contestantProfilePage.fillName('en', UNSAVED_ORGANIZATION_NAME);
          await contestantProfilePage.expectName('en', UNSAVED_ORGANIZATION_NAME);
        });

        await test.step('Log out opens the modal, which says what is unsaved and what is left', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectModalSaysUnsavedAndWhatIsLeft();
          await headerLogout.expectModalNamesUnsavedAndDescribesCount();
        });

        await test.step('past the count the user ends signed out on a login screen that says why, with no native question', async () => {
          await headerLogout.advancePastModalCount();
          await contestantLoginPage.expectOnEntry();
          await contestantLoginPage.expectNotice('loggedOutAutomatically');
          await headerLogout.expectAbsent();
          await headerLogout.expectSignedOut();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on a question with an unsaved answer and nothing left to count: the modal opens, and its count ends the session with the draft gone",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;

        await test.step('a user with nothing to count signs in, opens a question and selects another answer', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await headerLogout.installClock();
          await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step('Log out opens the modal, which speaks of the answer alone', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectModalSaysUnsavedAlone();
        });

        await test.step('past the count the user ends signed out on a login screen that says why, the draft is gone, with no native question', async () => {
          await headerLogout.advancePastModalCount();
          await contestantLoginPage.expectOnEntry();
          await contestantLoginPage.expectNotice('loggedOutAutomatically');
          await headerLogout.expectAbsent();
          await headerLogout.expectSignedOut();
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([]);
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out on a question with an unsaved answer and nothing left to count: a Log out in another tab withdraws the count of a closed tab, so a sign-in after it keeps the session",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        page,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;
        const otherTab = await page.context().newPage();
        const otherTabPages = createContestantEntityPages(otherTab);
        const otherTabLogin = createContestantLoginPage(otherTab);
        const otherTabLogout = createHeaderLogout(otherTab);
        const otherTabSelection = createContestantEntitySelectionPage(otherTab);
        const otherTabSettings = createContestantSettingsPage(otherTab);

        await test.step('a user with nothing to count signs in, opens a question and selects another answer', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step("Log out opens the modal, which speaks of the answer alone, and the count's deadline is stored", async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectModalSaysUnsavedAlone();
          await headerLogout.expectLogoutDeadlineSet();
        });

        await test.step("a second tab opens the entity's home, where Log out is shown, and the count is still stored", async () => {
          await otherTabPages.openHome(candidateB);
          await otherTabLogout.expectShown();
          await otherTabLogout.expectLogoutDeadlineSet();
        });

        await test.step("the count's tab closes, and in the second tab Log out ends on the login screen at once, with no count left", async () => {
          await page.close();
          await otherTabLogout.press();
          await otherTabLogin.expectEndedOnEntry();
          await otherTabLogout.expectDialogClosed();
          await otherTabLogout.expectNoLogoutDeadline();
        });

        await test.step('a sign-in through the login form in the second tab, and the deadline passes', async () => {
          await otherTabLogin.followSignInInsideTheApp();
          await otherTabLogin.expectSignInShown();
          await otherTabLogin.login(TEST_MULTI_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await otherTabSelection.expectShown();
          await otherTabLogout.dropLogoutDeadline();
        });

        await test.step('a link whose page makes a request reaches that page, and the session stays', async () => {
          await otherTabPages.followLinkInsideTheApp(buildRoute({ route: 'ContestantAppSettings', locale: 'en' }));
          await otherTabSettings.expectShown();
          await otherTabLogout.expectStillSignedIn();
        });
      }
    );

    test(
      "the header's Log out on a question with an unsaved answer and nothing left to count: once the session has ended with no Log out, a sign-in withdraws the count of a closed tab and keeps the session",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        page,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;
        const otherTab = await page.context().newPage();
        const otherTabPages = createContestantEntityPages(otherTab);
        const otherTabLogin = createContestantLoginPage(otherTab);
        const otherTabLogout = createHeaderLogout(otherTab);
        const otherTabSelection = createContestantEntitySelectionPage(otherTab);
        const otherTabSettings = createContestantSettingsPage(otherTab);

        await test.step('a user with nothing to count signs in, opens a question and selects another answer', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step("Log out opens the modal, which speaks of the answer alone, and the count's deadline is stored", async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectModalSaysUnsavedAlone();
          await headerLogout.expectLogoutDeadlineSet();
        });

        await test.step("a second tab opens the entity's home, where Log out is shown, and the count is still stored", async () => {
          await otherTabPages.openHome(candidateB);
          await otherTabLogout.expectShown();
          await otherTabLogout.expectLogoutDeadlineSet();
        });

        await test.step("the count's tab closes and the browser no longer holds the session, with the count still stored", async () => {
          await page.close();
          await otherTabLogout.dropSessionCookies();
        });

        await test.step('in the second tab a link whose page makes a request reaches the login screen', async () => {
          await otherTabPages.followLinkInsideTheApp(buildRoute({ route: 'ContestantAppSettings', locale: 'en' }));
          await otherTabLogin.expectOnEntry();
        });

        await test.step('a sign-in through the login form withdraws the count, and the deadline passes', async () => {
          await otherTabLogin.followSignInInsideTheApp();
          await otherTabLogin.expectSignInShown();
          await otherTabLogin.login(TEST_MULTI_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await otherTabSettings.expectShown();
          await otherTabLogout.expectNoLogoutDeadline();
          await otherTabLogout.dropLogoutDeadline();
        });

        await test.step('a link whose page makes a request reaches that page, and the session stays', async () => {
          await otherTabPages.followLinkInsideTheApp(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
          await otherTabSelection.expectShown();
          await otherTabLogout.expectStillSignedIn();
        });
      }
    );

    test(
      "the header's Log out on a question with an unsaved answer and nothing left to count: a sign-out the server makes removes the count of a closed tab at once",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        page,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;
        const otherTab = await page.context().newPage();
        const otherTabPages = createContestantEntityPages(otherTab);
        const otherTabLogout = createHeaderLogout(otherTab);

        await test.step('a user with nothing to count signs in, opens a question and selects another answer', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step("Log out opens the modal, which speaks of the answer alone, and the count's deadline is stored", async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectModalSaysUnsavedAlone();
          await headerLogout.expectLogoutDeadlineSet();
        });

        await test.step("a second tab opens the entity's home, where Log out is shown, and the count is still stored", async () => {
          await otherTabPages.openHome(candidateB);
          await otherTabLogout.expectShown();
          await otherTabLogout.expectLogoutDeadlineSet();
        });

        await test.step("the count's tab closes, and a sign-out the server makes with no tab told of it leaves no count", async () => {
          await page.close();
          await otherTabLogout.endSessionWithNoSignal();
          await otherTabLogout.expectNoLogoutDeadline();
        });
      }
    );

    test(
      "the header's Log out when the sign-out fails: the message is shown, the session and the edit stay, and pressing again ends signed out",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantProfilePage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in, opens the profile and edits a name', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.fillFirstName(UNSAVED_FIRST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
        });

        await test.step("with the sign-out failing, the modal's Log out shows the message and closes the modal", async () => {
          await headerLogout.failSignOut();
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await headerLogout.expectFailureMessage();
          await headerLogout.expectDialogClosed();
        });

        await test.step('the page has not moved, the edit is there, a further edit is taken and the session is alive', async () => {
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
          await contestantProfilePage.fillLastName(FURTHER_LAST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, FURTHER_LAST_NAME);
          await headerLogout.expectStillSignedIn();
          await headerLogout.expectShown();
        });

        await test.step("with the sign-out working, the modal's Log out ends signed out and the message is gone", async () => {
          await headerLogout.restoreSignOut();
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await contestantLoginPage.expectEndedOnEntry();
          await headerLogout.expectAbsent();
          await headerLogout.expectNoFailureMessage();
          await headerLogout.expectSignedOut();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out when the sign-out fails: the message is named apart from Log out and has one Close",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantProfilePage,
        headerLogout,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in, opens the profile and edits a name', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.fillFirstName(UNSAVED_FIRST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
        });

        await test.step("with the sign-out failing, the modal's Log out shows the message under a title of its own, with one Close", async () => {
          await headerLogout.failSignOut();
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await headerLogout.expectFailureMessage();
          await headerLogout.expectFailureMessageNamedOnce();
        });
      }
    );

    test(
      "the header's Log out when the sign-out fails at the count's end: the message is shown, and the answer and its draft stay",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB, differingQuestionId } = selectionEntities;

        await test.step('a user signs in, opens a question and selects another answer', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await headerLogout.installClock();
          await contestantEntityPages.openQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.selectChoice(UNSAVED_CHOICE_INDEX);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
        });

        await test.step('with the sign-out failing, past the count the message is shown and the modal has closed', async () => {
          await headerLogout.failSignOut();
          await headerLogout.pressExpectingDialog();
          await headerLogout.advancePastModalCount();
          await headerLogout.expectFailureMessage();
          await headerLogout.expectDialogClosed();
        });

        await test.step('the page has not moved, the answer and its draft are there, no deadline is left and the session is alive', async () => {
          await contestantEntityPages.expectOnQuestion(candidateB, differingQuestionId);
          await contestantQuestionPage.expectSelectedChoice(UNSAVED_CHOICE_INDEX);
          expect(await contestantEntityPages.draftQuestionIds(candidateB)).toEqual([differingQuestionId]);
          await headerLogout.expectNoLogoutDeadline();
          await headerLogout.expectStillSignedIn();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out when the sign-out answers with a failure after clearing the cookies: the message is shown, and pressing again ends on the login screen",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        contestantProfilePage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in, opens the profile and edits a name', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.fillFirstName(UNSAVED_FIRST_NAME);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
        });

        await test.step("the modal's Log out shows the message, with the page as it was and the session over on the server", async () => {
          await headerLogout.failSignOutAfterClearingCookies();
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await headerLogout.expectFailureMessage();
          await contestantEntityPages.expectOnProfile(candidateB);
          await contestantProfilePage.expectPersonNames(UNSAVED_FIRST_NAME, SEEDED_LAST_NAME_B);
          await headerLogout.expectSignedOut();
        });

        await test.step("with the sign-out working, the modal's Log out ends on the login screen and the message is gone", async () => {
          await headerLogout.restoreSignOut();
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await contestantLoginPage.expectEndedOnEntry();
          await headerLogout.expectAbsent();
          await headerLogout.expectNoFailureMessage();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out when the sign-out answers with a failure and the cookies are gone: a link finds the session gone, and the login screen shows no message",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in and opens the profile', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
        });

        await test.step('Log out shows the message, with the session over on the server', async () => {
          await headerLogout.failSignOutAfterClearingCookies();
          await headerLogout.press();
          await headerLogout.expectFailureMessage();
          await headerLogout.expectSignedOut();
        });

        await test.step('Back to the home reads nothing from the server, and the message is still there', async () => {
          await headerLogout.goBack();
          await contestantEntityPages.expectOnHome(candidateB);
          await headerLogout.expectFailureMessage();
        });

        await test.step('a link that reaches the gate ends on the login screen, with no message and no native question', async () => {
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantLoginPage.expectOnEntry();
          await headerLogout.expectNoFailureMessage();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out when the sign-out fails with nothing to answer: the message stays across links while the user is signed in, and a later press ends signed out",
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantLoginPage,
        headerLogout,
        nativeDialogs,
        selectionEntities
      }) => {
        const { candidateB } = selectionEntities;

        await test.step('a user signs in and opens the profile', async () => {
          await signInAndOpenSecondCandidate({
            contestantEntityPages,
            contestantEntitySelectionPage,
            contestantLoginPage,
            selectionEntities
          });
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
        });

        await test.step('with the sign-out failing, Log out shows the message', async () => {
          await headerLogout.failSignOut();
          await headerLogout.press();
          await headerLogout.expectFailureMessage();
        });

        await test.step('the message is there at each link, and the session is alive on the server', async () => {
          await headerLogout.goBack();
          await contestantEntityPages.expectOnHome(candidateB);
          await headerLogout.expectFailureMessage();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(candidateB);
          await headerLogout.expectFailureMessage();
          await headerLogout.expectStillSignedIn();
        });

        await test.step('with the sign-out working, Log out ends on the login screen, signed out, with no message and no native question', async () => {
          await headerLogout.restoreSignOut();
          await headerLogout.press();
          await contestantLoginPage.expectEndedOnEntry();
          await headerLogout.expectAbsent();
          await headerLogout.expectNoFailureMessage();
          await headerLogout.expectSignedOut();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out when the sign-out fails with the session alive: Back to the entry screens ends on the home, with the message still there, and Back goes on past them",
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, nativeDialogs, selectionEntities }) => {
        const { organization } = selectionEntities;
        let historyLength = 0;

        await test.step('a user goes from the login screen through the sign-in screen and the home to the profile, inside the application', async () => {
          await contestantLoginPage.openEntryDirectly();
          await contestantLoginPage.expectEntryShown();
          await contestantLoginPage.followSignInInsideTheApp();
          await contestantLoginPage.expectSignInShown();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
        });

        await test.step("with the sign-out failing, the modal's Log out shows the message", async () => {
          await headerLogout.failSignOut();
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await headerLogout.expectFailureMessage();
          historyLength = await headerLogout.historyLength();
        });

        await test.step('Back to the home keeps the message', async () => {
          await headerLogout.goBackAndSettle();
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.expectFailureMessage();
        });

        await test.step('Back to the sign-in screen shows the home with the message, and writes no history', async () => {
          await headerLogout.goBackAndSettle();
          await contestantEntityPages.expectHomeShownAtAnyAddress();
          await contestantLoginPage.expectSignInNotShown();
          await headerLogout.expectFailureMessage();
          expect(await headerLogout.historyLength()).toBe(historyLength);
        });

        await test.step('Back to the login screen shows the home with the message, writes no history, and the session is alive', async () => {
          await headerLogout.goBackAndSettle();
          await contestantEntityPages.expectHomeShownAtAnyAddress();
          await contestantLoginPage.expectEntryNotShown();
          await headerLogout.expectFailureMessage();
          expect(await headerLogout.historyLength()).toBe(historyLength);
          await headerLogout.expectStillSignedIn();
        });

        await test.step('one more Back leaves the application, with no native question', async () => {
          await headerLogout.goBack();
          await headerLogout.expectLeftTheApp();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out when the sign-out answers with a failure and the cookies are gone: Back to the sign-in screen shows no message, and signing in again shows none",
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, nativeDialogs, selectionEntities }) => {
        const { organization } = selectionEntities;

        await test.step('a user signs in on a page whose script has loaded, and opens the profile', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.signInScriptLoaded();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
        });

        await test.step("the modal's Log out shows the message, with the session over on the server", async () => {
          await headerLogout.failSignOutAfterClearingCookies();
          await headerLogout.pressExpectingDialog();
          await headerLogout.logOutInModal();
          await headerLogout.expectFailureMessage();
          await headerLogout.expectSignedOut();
        });

        await test.step('Back to the home reads nothing from the server, and the message is still there', async () => {
          await headerLogout.goBackAndSettle();
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.expectFailureMessage();
        });

        await test.step('Back to the sign-in screen shows the screen, with no message', async () => {
          await headerLogout.goBackAndSettle();
          await contestantLoginPage.expectSignInShown();
          await headerLogout.expectNoFailureMessage();
        });

        await test.step('signing in again shows no message, and no native question was raised', async () => {
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.expectNoFailureMessage();
          await headerLogout.expectStillSignedIn();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out after Back to the login screen with a live session: the session cannot stand there, so a sign-out that fails says so",
      { tag: '@entity-selection' },
      async ({ contestantEntitySelectionPage, contestantLoginPage, headerLogout, nativeDialogs }) => {
        await test.step('a user who edits several entities goes from the login screen through the sign-in screen to the selection, inside the application', async () => {
          await contestantLoginPage.openEntryDirectly();
          await contestantLoginPage.expectEntryShown();
          await contestantLoginPage.followSignInInsideTheApp();
          await contestantLoginPage.expectSignInShown();
          await contestantLoginPage.login(TEST_MULTI_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntitySelectionPage.expectShown();
        });

        await test.step('Back twice, to the two entry screens', async () => {
          await headerLogout.goBackAndSettle();
          await headerLogout.goBackAndSettle();
        });

        await test.step('with the sign-out failing, a press shows the message on the selection, with the session alive', async () => {
          await headerLogout.failSignOut();
          await headerLogout.press();
          await headerLogout.expectFailureMessage();
          await contestantLoginPage.expectEntryNotShown();
          await contestantEntitySelectionPage.expectShownAtAnyAddress();
          await headerLogout.expectStillSignedIn();
        });

        await test.step('with the sign-out working, a press ends on the login screen, with no message and no native question', async () => {
          await headerLogout.restoreSignOut();
          await headerLogout.press();
          await contestantLoginPage.expectEndedOnEntry();
          await headerLogout.expectAbsent();
          await headerLogout.expectNoFailureMessage();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out with nothing unsaved and tasks left: the modal asks no native question, and the end of its count leaves a login screen that says why",
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, nativeDialogs, selectionEntities }) => {
        const { organization } = selectionEntities;

        await test.step('a user with tasks left signs in and opens the profile', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.installClock();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
        });

        await test.step('Log out opens the modal, and past its count the user ends signed out on a login screen that says why, with no native question', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectModalDescribesCount();
          await headerLogout.advancePastModalCount();
          await contestantLoginPage.expectOnEntry();
          await contestantLoginPage.expectNotice('loggedOutAutomatically');
          await headerLogout.expectAbsent();
          await headerLogout.expectSignedOut();
          await headerLogout.expectNoLogoutDeadline();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      "the header's Log out with tasks left: a count whose timer did not run signs out when the tab is shown again",
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, selectionEntities }) => {
        const { organization } = selectionEntities;

        await test.step('a user with tasks left signs in and opens the profile', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.installClock();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
        });

        await test.step('with the wall clock past the count and no timer fired, the tab shown again signs out to a login screen that says why', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.moveWallClockPastTheCount();
          await headerLogout.showTabAgain();
          await headerLogout.expectSignOutRequested();
          await contestantLoginPage.expectOnEntry();
          await contestantLoginPage.expectNotice('loggedOutAutomatically');
        });
      }
    );

    test(
      "the header's Log out with tasks left: with the page's clock five minutes behind the server's, a request made while the modal counts keeps the session",
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, selectionEntities }) => {
        const { organization } = selectionEntities;

        await test.step("a user with tasks left signs in and opens the profile, with the page's clock five minutes behind the server's", async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.installClockBehindTheServer();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
        });

        await test.step('Log out opens the modal, and a request made while it counts keeps the session', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectStillSignedIn();
          await headerLogout.expectLogoutDeadlineSet();
        });

        await test.step('Continue closes the modal, no deadline is left and the session is alive', async () => {
          await headerLogout.stay();
          await headerLogout.expectNoLogoutDeadline();
          await headerLogout.expectStillSignedIn();
        });
      }
    );

    test(
      "the header's Log out with tasks left: a reload of the tab during the count removes the deadline, and the session stays",
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, selectionEntities }) => {
        const { organization } = selectionEntities;

        await test.step('a user with tasks left signs in and opens the profile', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
        });

        await test.step('Log out opens the modal, and its count is kept in the deadline', async () => {
          await headerLogout.pressExpectingDialog();
          await headerLogout.expectLogoutDeadlineSet();
        });

        await test.step('after a reload the profile is shown again, no deadline is left and the session is alive', async () => {
          await headerLogout.reloadTab();
          await contestantEntityPages.expectOnProfile(organization);
          await headerLogout.expectNoLogoutDeadline();
          await headerLogout.expectStillSignedIn();
        });
      }
    );

    test(
      "the header's Log out with tasks left: while the count's sign-out runs, the modal stays open and a link waits without a question",
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, nativeDialogs, selectionEntities }) => {
        const { organization } = selectionEntities;

        await test.step('a user with tasks left signs in and opens the profile', async () => {
          await contestantLoginPage.goToPage();
          await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
          await contestantEntityPages.expectOnHome(organization);
          await headerLogout.installClock();
          await contestantEntityPages.clickHomeProfileEntry();
          await contestantEntityPages.expectOnProfile(organization);
        });

        await test.step("with the sign-out held, past the modal's count the modal stays open, and a link asks no native question", async () => {
          await headerLogout.holdSignOut();
          await headerLogout.pressExpectingDialog();
          await headerLogout.advancePastModalCount();
          await headerLogout.expectDialogOpen();
          await contestantEntityPages.followLinkInsideTheApp(
            buildRoute({ route: 'ContestantAppSettings', locale: 'en' })
          );
          expect(nativeDialogs.types()).toEqual([]);
        });

        await test.step('once the sign-out goes on, the user ends on a login screen that says why', async () => {
          await headerLogout.releaseSignOut();
          await contestantLoginPage.expectOnEntry();
          await contestantLoginPage.expectNotice('loggedOutAutomatically');
        });
      }
    );

    test(
      'a user who is no administrator, on a link into the Admin App, is signed out with no draft left',
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        nativeDialogs,
        page,
        selectionEntities
      }) => {
        const adminLoginPage = createAdminLoginPage(page);

        await test.step('the user signs in and leaves an unsaved answer, stored as a draft', async () => {
          await signInWithADraftOnTheOrganization({
            contestantEntityPages,
            contestantLoginPage,
            contestantQuestionPage,
            nativeDialogs,
            selectionEntities
          });
        });

        await test.step('a link into the Admin App ends on its login page, signed out, with no draft left and no native question', async () => {
          await adminLoginPage.followLinkInsideTheApp(buildRoute({ route: 'AdminAppHome', locale: 'en' }));
          await adminLoginPage.expectOnLoginPage();
          await adminLoginPage.expectLoginAddressSaysNotAuthorized();
          await headerLogout.expectNoContestantDraft();
          expect(nativeDialogs.types()).toEqual([]);
        });
      }
    );

    test(
      'a user who is no administrator and whose sign-out fails, on a link into the Admin App, ends on the error page',
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, page, selectionEntities }) => {
        const adminLoginPage = createAdminLoginPage(page);

        await contestantLoginPage.goToPage();
        await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
        await contestantEntityPages.expectOnHome(selectionEntities.organization);

        await headerLogout.failSignOut();
        await adminLoginPage.followLinkInsideTheApp(buildRoute({ route: 'AdminAppHome', locale: 'en' }));
        await adminLoginPage.expectErrorPageSays('403');
        await adminLoginPage.expectNoLoginPageRequest();
      }
    );

    test(
      'a user who is no administrator and whose sign-out fails after clearing the cookies, on a link into the Admin App, ends on the login page, with no draft left',
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantLoginPage,
        contestantQuestionPage,
        headerLogout,
        nativeDialogs,
        page,
        selectionEntities
      }) => {
        const adminLoginPage = createAdminLoginPage(page);

        await signInWithADraftOnTheOrganization({
          contestantEntityPages,
          contestantLoginPage,
          contestantQuestionPage,
          nativeDialogs,
          selectionEntities
        });

        await headerLogout.failSignOutAfterClearingCookies();
        await adminLoginPage.followLinkInsideTheApp(buildRoute({ route: 'AdminAppHome', locale: 'en' }));
        await adminLoginPage.expectOnLoginPage();
        await adminLoginPage.expectLoginAddressSaysNotAuthorized();
        await headerLogout.expectNoContestantDraft();
        expect(nativeDialogs.types()).toEqual([]);
      }
    );

    test(
      'a session ended elsewhere with no signal to this tab: a link in the Contestant App whose page makes a request reaches the login page',
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantLoginPage, headerLogout, selectionEntities }) => {
        await contestantLoginPage.goToPage();
        await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
        await contestantEntityPages.expectOnHome(selectionEntities.organization);

        await headerLogout.endSessionWithNoSignal();
        await contestantEntityPages.followLinkInsideTheApp(
          buildRoute({ route: 'ContestantAppSettings', locale: 'en' })
        );
        await contestantLoginPage.expectOnEntry();
      }
    );
  });

  test(
    'a closed entry of the home draws its lock in the colour of its label',
    { tag: '@entity-selection' },
    async ({ contestantEntityPages, contestantHomePage, selectionEntities }) => {
      await contestantEntityPages.openHome(selectionEntities.organization);
      await contestantHomePage.expectPreview('closed');
      await contestantHomePage.expectClosedEntryIconDimmed('preview');
      await contestantHomePage.expectOpenEntryIconNotDimmed('nomination', 'preview');
    }
  );

  test.describe('one entity', () => {
    test.use({ storageState: STORAGE_STATE });

    test(
      'a user who edits one entity is sent from the root to its home and has no switch item',
      { tag: '@entity-selection' },
      async ({
        contestantEntityPages,
        contestantEntitySelectionPage,
        contestantHomePage,
        navMenu,
        selectionEntities
      }) => {
        await contestantEntitySelectionPage.requestAppRootExpectingRedirect();
        await contestantEntityPages.expectOnHome(selectionEntities.baseCandidate);
        await contestantEntitySelectionPage.expectAbsent();
        await contestantHomePage.expectNoSwitchProfile();
        await navMenu.openMobileNav();
        await navMenu.expectNoSwitchEntityItem();
        await navMenu.closeNav();
      }
    );
  });

  test.describe('nothing to edit', () => {
    test.describe('signed in through the login form', () => {
      test.use({ storageState: { cookies: [], origins: [] } });

      test(
        'a user whose only grant is removed sees the view and logs out from it without a modal',
        { tag: '@entity-selection' },
        async ({
          adminClient,
          contestantEntityPages,
          contestantLoginPage,
          contestantNothingToEditPage,
          nativeDialogs,
          selectionEntities
        }) => {
          const { organization } = selectionEntities;

          await test.step("an editor of one organization signs in and lands on the organization's home", async () => {
            await contestantLoginPage.goToPage();
            await contestantLoginPage.login(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD);
            await contestantEntityPages.expectOnHome(organization);
            await contestantEntityPages.expectHomeHeadingNames(organization);
          });

          await test.step('with the grant removed, the root shows the view with the signed-in email', async () => {
            await adminClient.revokeEntityGrant(TEST_LOGOUT_ENTITY_EMAIL, {
              entityType: 'organization',
              externalId: TEST_SELECTION_ORGANIZATION_EXTERNAL_ID
            });
            await contestantNothingToEditPage.open();
            await contestantNothingToEditPage.expectSignedInEmail(TEST_LOGOUT_ENTITY_EMAIL);
            await contestantNothingToEditPage.expectSupportButton();
          });

          await test.step('Logout opens no dialog of any kind and ends on the login page', async () => {
            nativeDialogs.clear();
            await contestantNothingToEditPage.logoutWithoutDialog();
            expect(nativeDialogs.types()).toEqual([]);
          });
        }
      );
    });

    test.describe('under the stored session of a user with no entity', () => {
      test.use({ storageState: NO_ENTITY_STORAGE_STATE });

      test(
        'the root shows the view, and an entity URL leads back to it',
        { tag: '@entity-selection' },
        async ({ contestantEntityPages, contestantNothingToEditPage, selectionEntities }) => {
          await contestantNothingToEditPage.open();
          await contestantNothingToEditPage.expectSignedInEmail(TEST_NO_ENTITY_EMAIL);
          await contestantNothingToEditPage.expectSupportButton();

          // The token of this session still names the organization; the grant row does not.
          await contestantEntityPages.requestHome(selectionEntities.organization);
          await contestantNothingToEditPage.expectShown();
        }
      );
    });
  });

  test.describe('the settings page', () => {
    test.describe('under the stored session of a user with no entity', () => {
      test.use({ storageState: NO_ENTITY_STORAGE_STATE });

      test(
        'a user with nothing to edit reaches the settings page from the nothing-to-edit view',
        { tag: '@entity-selection' },
        async ({ contestantNothingToEditPage, contestantSettingsPage }) => {
          await contestantNothingToEditPage.open();
          await contestantNothingToEditPage.followSettingsLink();
          await contestantSettingsPage.expectShown();
          await contestantSettingsPage.expectAddress(TEST_NO_ENTITY_EMAIL);
        }
      );
    });

    test(
      'a user with several entities opens the settings page at the app root',
      { tag: '@entity-selection' },
      async ({ contestantSettingsPage }) => {
        await contestantSettingsPage.open();
        await contestantSettingsPage.expectAddress(TEST_MULTI_ENTITY_EMAIL);
      }
    );

    test(
      'the entity-scoped settings address leads to the settings page',
      { tag: '@entity-selection' },
      async ({ contestantEntityPages, contestantSettingsPage, selectionEntities }) => {
        await contestantEntityPages.requestEntitySettings(selectionEntities.candidateA);
        await contestantSettingsPage.expectShown();
        await contestantSettingsPage.expectAddress(TEST_MULTI_ENTITY_EMAIL);
      }
    );
  });
});
