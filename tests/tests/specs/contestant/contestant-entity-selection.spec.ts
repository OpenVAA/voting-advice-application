/**
 * Entity selection: a user who edits several entities chooses one, switches between them without signing out, and saves to the selected entity only; a user who edits one never sees the selection; a user who edits none is told so; every one of them reaches the one settings page.
 *
 * Runs under the `contestant-entity-selection` project, whose stored session is that of a user who edits two candidates and one organization of the base dataset (`MULTI_ENTITY_STORAGE_STATE`, written by `data-setup-entity-selection`). Two groups swap the session: one loads the base candidate's, one starts signed out.
 *
 * Eight groups:
 *   1. Choosing — the root lists the three entities, candidates first and in alphabetical order, under two group headings; a card leads to that entity's home and the menu names the entity.
 *   2. Never the previous one's — an unsaved answer is kept per entity through a reload, is absent on the other entity, and a save changes the selected entity's row alone.
 *   3. Switching — the menu's switch item returns to the selection; the organization's home names it; the second candidate's pages show the second candidate's answer; Switch profile on the home returns to the selection too.
 *   4. The prompt — switching from the editor with an unsaved edit raises the page's one native confirm; Cancel keeps the page and the edit.
 *   5. Refusals — a URL naming an entity the user does not edit, or the user's own entity under the other type, lands on the selection with nothing added to it.
 *   6. One entity — a user who edits a single entity is redirected from the root to its home, which offers no Switch profile, and has no switch item.
 *   7. Nothing to edit — a user whose only grant is removed sees the view with their email and logs out from it without a confirmation modal.
 *   8. The settings page — a user who edits nothing reaches it from the "nothing to edit" view, a user who edits several opens it at the app's root, and the settings address under an entity leads to it.
 *
 * No stored session is signed out here: the one case that logs out signs a user of its own in through the login form first. The spec writes to one row, the first selection candidate, which is unconfirmed and so read by no voter query.
 *
 * State is carried between the steps of one test and never between tests: each test starts from the stored session, whose browser storage holds no draft.
 *
 * The suite runs these cases at the desktop viewport of its project and never passes the terms-of-use view: every identity has accepted the terms at registration.
 *
 * **Rigidity contract:** hard assertions only, every locator behind a fixture, no branch in a test body.
 */

import { STORAGE_STATE } from '../../../playwright.config';
import { entityGroupTitle, expect, SELECTION_TEXT, test } from '../../fixtures/contestant/contestant-entity-selection';
import {
  NO_ENTITY_STORAGE_STATE,
  TEST_CANDIDATE_PASSWORD,
  TEST_LOGOUT_ENTITY_EMAIL,
  TEST_MULTI_ENTITY_EMAIL,
  TEST_NO_ENTITY_EMAIL,
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
