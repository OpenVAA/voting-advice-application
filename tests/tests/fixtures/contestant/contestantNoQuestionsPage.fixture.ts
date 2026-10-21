/**
 * @file contestantNoQuestionsPage fixture.
 *
 * Function-fixture for the page the questions URL of an entity shows when that entity has no opinion question to answer (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+layout.svelte`).
 *
 * Surface:
 *  - open(entity)        — navigate straight to the questions URL of `entity`, as a deep link does.
 *  - expectNeutralPage() — the page is shown at the questions URL: a heading, one button and no progress bar.
 *  - expectFitsViewport() — the page is shown and is no wider than its viewport.
 *  - pressReturn()       — activate that button.
 *  - expectOnHome()      — the page is an entity's home.
 *
 * `open` reads the entity's id with the service role, because the URL of an entity's page carries the id of its row.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantHomeUrlRe, contestantUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { createPageGeometry, MIN_TARGET_SIZE } from '../shared/pageGeometry.fixture';
import type { Page } from '@playwright/test';
import type { EntityGrantTarget, SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/**
 * Create the fixture for the page shown at the questions URL of an entity with no opinion question to answer.
 *
 * @param page - The page the fixture drives.
 * @param admin - A service-role client of the suite's project, used to read an entity's id by its external id.
 * @returns The fixture's steps: `open`, `expectNeutralPage`, `expectFitsViewport`, `pressReturn` and `expectOnHome`.
 */
export function createContestantNoQuestionsPage(page: Page, admin: SupabaseAdminClient) {
  const neutralPage = page.getByTestId(testIds.contestant.questions.none);
  const returnButton = page.getByTestId(testIds.contestant.questions.noneReturn);
  const geometry = createPageGeometry(page);

  return {
    /**
     * Navigate to the questions URL of `entity` itself, without passing through any other page of the app.
     */
    async open(entity: EntityGrantTarget): Promise<void> {
      const entityId = await admin.entityId(entity);
      await page.goto(
        buildRoute({
          route: 'ContestantAppQuestions',
          locale: 'en',
          params: { entityType: entity.entityType, entityId }
        })
      );
    },

    /**
     * Assert that the page for an entity with no opinion question is shown, and where: the URL is still the questions URL, so nothing redirected. The page holds its heading and exactly one button, the Return, which is a pointer target of full size, and the header shows no progress bar.
     */
    async expectNeutralPage(): Promise<void> {
      await expect(neutralPage).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page).toHaveURL(contestantUrlRe('/questions'), { timeout: TIMEOUTS.page });
      await expect(neutralPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(returnButton).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(neutralPage.getByRole('button')).toHaveCount(1);
      await expect(page.getByRole('progressbar')).toHaveCount(0);
      await geometry.expectAtLeast(returnButton, MIN_TARGET_SIZE, MIN_TARGET_SIZE, 'the Return button');
    },

    /**
     * Assert that the page for an entity with no opinion question is shown and is no wider than its viewport.
     */
    async expectFitsViewport(): Promise<void> {
      await expect(neutralPage).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await geometry.expectNoHorizontalOverflow();
    },

    /**
     * Activate the page's one button.
     */
    async pressReturn(): Promise<void> {
      await expect(returnButton).toBeVisible({ timeout: TIMEOUTS.page });
      await returnButton.click();
    },

    /**
     * Assert that the page is the home of an entity: the home's status message is shown and the URL is an entity home.
     */
    async expectOnHome(): Promise<void> {
      await expect(page).toHaveURL(contestantHomeUrlRe(), { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.page
      });
    }
  };
}

/** The steps of the no-questions page fixture. */
export type ContestantNoQuestionsPageFixture = ReturnType<typeof createContestantNoQuestionsPage>;
