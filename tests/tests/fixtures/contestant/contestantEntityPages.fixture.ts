/**
 * @file contestantEntityPages fixture.
 *
 * Function-fixture for the pages of one entity of the Contestant App as they are reached by their URL: the profile, the questions and the preview, under the entity and in the form that names no entity, and the entity's home.
 *
 * Every `open…` step is a full page load, so the server decides what the browser is shown from the rows it reads in that request. A step that asserts where the browser ended names the entity: two entities of one type differ in the URL by their id alone.
 *
 * Surface:
 *  - open(entity, entityPage)       — load the URL of that page under the entity.
 *  - openWithoutEntity(entityPage)  — load the URL of that page in the form that names no entity.
 *  - openHome(entity)               — load the entity's home.
 *  - expectOnHome(entity)           — the URL is that entity's home and the home's status message is shown.
 *  - expectOnProfile(entity)        — the URL is that entity's profile and its identity section is shown.
 *  - expectOnQuestions(entity)      — the URL is that entity's questions list and the list's intro is shown.
 *  - expectOnQuestion(entity, questionExternalId) — the URL is the page of that question under that entity.
 *  - expectOnPreview(entity)        — the URL is that entity's preview and the preview's container is shown.
 *  - clickHomeProfileEntry()        — click the home's profile entry, a navigation inside the application.
 *  - clickHomePreviewEntry()        — click the home's preview entry, a navigation inside the application.
 *  - expectHomeHeadingFocused()     — the first-level heading has focus.
 *
 * The entity's id is read with the service role by the entity's external id, and so is a question's.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { buildEntityLessRoute, contestantHomeUrlRe, contestantUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
import type { Route } from '../../../../apps/frontend/src/lib/routes/route';
import type { EntityGrantTarget, SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/** A page of an entity that this fixture opens by its URL. */
export type ContestantEntityPage = 'profile' | 'questions' | 'preview';

/** The route of each page the fixture opens. */
const ROUTE_OF: Readonly<Record<ContestantEntityPage, Route>> = Object.freeze({
  profile: 'ContestantAppProfile',
  questions: 'ContestantAppQuestions',
  preview: 'ContestantAppPreview'
});

/**
 * Create the fixture for the pages of an entity as they are reached by their URL.
 *
 * @param page - The page the fixture drives.
 * @param admin - A service-role client of the suite's project, used to read an entity's id by its external id.
 * @returns The fixture's steps: `open`, `openWithoutEntity`, `openHome`, `expectOnHome`, `expectOnProfile`, `expectOnQuestions`, `expectOnQuestion`, `expectOnPreview`, `clickHomeProfileEntry`, `clickHomePreviewEntry` and `expectHomeHeadingFocused`.
 */
export function createContestantEntityPages(page: Page, admin: SupabaseAdminClient) {
  /**
   * Assert that the URL is `pattern` and that its path names `entity` by type and id.
   */
  async function expectUrlOfEntity(entity: EntityGrantTarget, pattern: RegExp, pageName: string): Promise<void> {
    await expect(page).toHaveURL(pattern, { timeout: TIMEOUTS.slowPage });
    const entityId = await admin.entityId(entity);
    expect(
      new URL(page.url()).pathname,
      `the ${pageName} shown is that of the ${entity.entityType} ${entity.externalId}`
    ).toContain(`/${entity.entityType}/${entityId}`);
  }

  return {
    /**
     * Load the URL of `entityPage` under `entity`, as a new document.
     */
    async open(entity: EntityGrantTarget, entityPage: ContestantEntityPage): Promise<void> {
      const entityId = await admin.entityId(entity);
      await page.goto(
        buildRoute({
          route: ROUTE_OF[entityPage],
          locale: 'en',
          params: { entityType: entity.entityType, entityId }
        })
      );
    },

    /**
     * Load the URL of `entityPage` in the form that names no entity, as a new document. The application resolves it to the one entity the session's user edits.
     */
    async openWithoutEntity(entityPage: ContestantEntityPage): Promise<void> {
      await page.goto(buildEntityLessRoute({ route: ROUTE_OF[entityPage], locale: 'en' }));
    },

    /**
     * Load the home of `entity`, as a new document.
     */
    async openHome(entity: EntityGrantTarget): Promise<void> {
      const entityId = await admin.entityId(entity);
      await page.goto(
        buildRoute({
          route: 'ContestantAppEntityHome',
          locale: 'en',
          params: { entityType: entity.entityType, entityId }
        })
      );
    },

    /**
     * Assert that the browser ended on the home of `entity`: the URL is an entity home that carries the entity's type and id, and the home's status message is shown.
     */
    async expectOnHome(entity: EntityGrantTarget): Promise<void> {
      await expectUrlOfEntity(entity, contestantHomeUrlRe(), 'home');
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert that the browser ended on the profile of `entity`: the URL is a profile URL that carries the entity's type and id, and the profile's identity section is shown.
     */
    async expectOnProfile(entity: EntityGrantTarget): Promise<void> {
      await expectUrlOfEntity(entity, contestantUrlRe('/profile'), 'profile');
      await expect(page.getByTestId(testIds.contestant.profile.identity)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert that the browser ended on the questions list of `entity`: the URL is a questions-list URL that carries the entity's type and id, and the list's intro is shown.
     */
    async expectOnQuestions(entity: EntityGrantTarget): Promise<void> {
      await expectUrlOfEntity(entity, contestantUrlRe('/questions'), 'questions list');
      await expect(page.getByTestId(testIds.contestant.questions.intro)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert that the browser ended on the page of one question of `entity`: the URL is the page of the question whose external id is `questionExternalId`, and it carries the entity's type and id. The questions list and the page of any other question do not match.
     *
     * @throws If no question of the suite's project has that external id.
     */
    async expectOnQuestion(entity: EntityGrantTarget, questionExternalId: string): Promise<void> {
      const found = await admin.findData('questions', { external_id: { $eq: questionExternalId } });
      const questionId = found.data?.[0]?.id;
      if (found.type !== 'success' || typeof questionId !== 'string') {
        throw new Error(`expectOnQuestion: the question ${questionExternalId} was not found`);
      }
      await expectUrlOfEntity(
        entity,
        contestantUrlRe(`/questions/${questionId}`),
        `page of the question ${questionExternalId}`
      );
    },

    /**
     * Assert that the browser ended on the preview of `entity`: the URL is a preview URL that carries the entity's type and id, and the preview's container is shown.
     */
    async expectOnPreview(entity: EntityGrantTarget): Promise<void> {
      await expectUrlOfEntity(entity, contestantUrlRe('/preview'), 'preview');
      await expect(page.getByTestId(testIds.contestant.preview.container)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Click the home's profile entry. The click is a navigation inside the application and loads no new document.
     */
    async clickHomeProfileEntry(): Promise<void> {
      await page.getByTestId(testIds.contestant.home.profile).click({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Click the home's preview entry. The click is a navigation inside the application and loads no new document.
     */
    async clickHomePreviewEntry(): Promise<void> {
      await page.getByTestId(testIds.contestant.home.preview).click({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the page's first-level heading has focus.
     */
    async expectHomeHeadingFocused(): Promise<void> {
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused({ timeout: TIMEOUTS.page });
    }
  };
}

/** The steps of the fixture that opens an entity's pages by URL. */
export type ContestantEntityPagesFixture = ReturnType<typeof createContestantEntityPages>;
