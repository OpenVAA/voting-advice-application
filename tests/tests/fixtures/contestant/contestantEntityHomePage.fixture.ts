/**
 * @file contestantEntityHomePage fixture.
 *
 * Function-fixture for the home page of one entity of the Contestant App (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte`), as a user who edits that one entity reaches it.
 *
 * A user who edits one entity is sent from the app's root straight to that entity's home, so the root is where a stored single-entity session is opened: the session decides the entity, and no URL of the fixture names one.
 *
 * Surface:
 *  - open()                 — navigate to the app's root.
 *  - reload()               — load the page again at its own address.
 *  - expectLanded(entity)   — the home's status message is shown and the URL is the home of that entity: its type, and the id of the row that carries its external id.
 *  - expectQuestionsButton(present) — the home offers the questions task, or holds no button for it.
 *  - followMainAction()     — press the home's main action, wait for the page it leads to, and say which page that is.
 *  - followNominationTask() — press the nomination row of the home's task list, wait for the page it leads to, and say which page that is.
 *
 * `expectLanded` reads the entity's id with the service role, because two entities of one type differ in the URL by their id alone: a session stored for the wrong organization lands on an organization's home too.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantHomeUrlRe, contestantUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';
import type { EntityGrantTarget, SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/** A page the home's main action can lead to: a step of the nomination editor, the nominations view, the profile, the questions list or the preview. */
export type ContestantMainActionDestination =
  | 'nominationElections'
  | 'nominationConstituencies'
  | 'nominationDetails'
  | 'nominations'
  | 'profile'
  | 'questions'
  | 'preview';

/** The path of each destination below the entity. */
const DESTINATION_SUB_PATH: Readonly<Record<ContestantMainActionDestination, string>> = Object.freeze({
  nominationElections: '/nominations/elections',
  nominationConstituencies: '/nominations/constituencies',
  nominationDetails: '/nominations/details',
  nominations: '/nominations',
  profile: '/profile',
  questions: '/questions',
  preview: '/preview'
});

/**
 * Create the fixture for the home page of the entity a single-entity session's user edits.
 *
 * @param page - The page the fixture drives.
 * @param admin - A service-role client of the suite's project, used to read an entity's id by its external id.
 * @returns The fixture's steps: `open`, `reload`, `expectLanded`, `expectQuestionsButton`, `followMainAction` and `followNominationTask`.
 */
export function createContestantEntityHomePage(page: Page, admin: SupabaseAdminClient) {
  /** The element each destination is known by: the page's own container, or the part only that page renders. */
  const destinationMarker: Readonly<Record<ContestantMainActionDestination, Locator>> = {
    nominationElections: page.getByTestId(testIds.contestant.nominationEditor.electionsPage),
    nominationConstituencies: page.getByTestId(testIds.contestant.nominationEditor.constituenciesPage),
    nominationDetails: page.getByTestId(testIds.contestant.nominationEditor.detailsPage),
    nominations: page.getByTestId(testIds.contestant.nominations.page),
    profile: page.getByTestId(testIds.contestant.profile.identity),
    questions: page
      .getByTestId(testIds.contestant.questions.intro)
      .or(page.getByTestId(testIds.contestant.questions.none)),
    preview: page.getByTestId(testIds.contestant.preview.container)
  };
  const destinations = Object.keys(destinationMarker) as Array<ContestantMainActionDestination>;

  /**
   * Wait until the browser shows one of the pages the fixture knows by an element of its own, at that page's URL under an entity.
   * @param pressed - What was pressed, for the message of a failure.
   * @returns Which page is shown.
   */
  async function destinationShown(pressed: string): Promise<ContestantMainActionDestination> {
    const anyDestination = destinations
      .map((destination) => destinationMarker[destination])
      .reduce((any, marker) => any.or(marker));
    await expect(anyDestination.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });

    const shown: Array<ContestantMainActionDestination> = [];
    for (const destination of destinations) {
      if (await destinationMarker[destination].first().isVisible()) shown.push(destination);
    }
    expect(shown, `${pressed} led to one page the step knows`).toHaveLength(1);
    await expect(page).toHaveURL(contestantUrlRe(DESTINATION_SUB_PATH[shown[0]]), { timeout: TIMEOUTS.page });
    return shown[0];
  }

  return {
    /**
     * Navigate to the Contestant App's root. A user who edits one entity is sent on to that entity's home.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
    },

    /**
     * Load the page again at the address it has, as a user who reloads the tab does. The caller asserts what is shown then.
     */
    async reload(): Promise<void> {
      await page.reload();
    },

    /**
     * Assert that the page is the home of `entity`: the home's status message is shown, the URL is an entity home, and it carries the entity's type and id.
     *
     * A selection screen, a gate and the login page each fail the first assertion, and another entity's home fails the last.
     */
    async expectLanded(entity: EntityGrantTarget): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
      await expect(page).toHaveURL(contestantHomeUrlRe());
      const entityId = await admin.entityId(entity);
      expect(
        new URL(page.url()).pathname,
        `the home shown is that of the ${entity.entityType} ${entity.externalId}`
      ).toContain(`/${entity.entityType}/${entityId}`);
    },

    /**
     * Assert that the home holds the button that leads to the entity's questions, or that it holds none. The home's status message is awaited first, so that an absent button is not that of a page still loading.
     */
    async expectQuestionsButton(present: boolean): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({ timeout: TIMEOUTS.page });
      const button = page.getByTestId(testIds.contestant.home.questions);
      if (present) await expect(button).toBeVisible({ timeout: TIMEOUTS.page });
      else await expect(button).toHaveCount(0, { timeout: TIMEOUTS.page });
    },

    /**
     * Press the home's main action and wait until the browser shows the page it leads to: one of the pages the step knows by an element of its own, at that page's URL under an entity. The press is a navigation inside the application. The main action says where it leads only once the entity's tasks are known, which is awaited before the press.
     * @returns Which page the action led to.
     */
    async followMainAction(): Promise<ContestantMainActionDestination> {
      const mainAction = page.getByTestId(testIds.contestant.home.continue);
      await expect(mainAction).toHaveAttribute('data-next-step', /.+/, { timeout: TIMEOUTS.slowPage });
      await mainAction.click();
      return destinationShown('the main action');
    },

    /**
     * Press the nomination row of the home's task list and wait until the browser shows the page it leads to. The press is a navigation inside the application. The row leads somewhere in every state of the list, and the list is awaited before the press.
     * @returns Which page the row led to, by the values `followMainAction` returns.
     */
    async followNominationTask(): Promise<ContestantMainActionDestination> {
      await expect(page.getByTestId(testIds.contestant.home.tasks)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await page.getByTestId(testIds.contestant.home.nomination).click({ timeout: TIMEOUTS.slowPage });
      return destinationShown('the nomination row');
    }
  };
}

/** The steps of the entity-home fixture. */
export type ContestantEntityHomePageFixture = ReturnType<typeof createContestantEntityHomePage>;
