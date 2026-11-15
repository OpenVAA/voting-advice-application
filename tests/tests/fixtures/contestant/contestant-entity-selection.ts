/**
 * @file Composition root for the entity-selection spec (`contestant-entity-selection.spec.ts`).
 *
 * Sibling to `contestant-journey.ts`. Composes the page fixtures the spec states its behaviour through, an admin client, and what the spec needs to know about the rows its users edit.
 *
 * Surface:
 *   - `test`   — Playwright test extended with the fixtures below.
 *   - `expect` — re-exported from @playwright/test.
 *   - `SELECTION_TEXT` — the English strings the selection screen and the menu are asserted against, read from the message source.
 *   - `entityGroupTitle(entity)` — the menu's group title for an entity, formatted as the application formats it.
 *
 * Fixtures:
 *   - `contestantEntitySelectionPage`, `contestantNothingToEditPage`, `contestantHomePage`, `contestantQuestionsOverviewPage`, `contestantQuestionPage`, `contestantLoginPage`, `navMenu` — page fixtures.
 *   - `contestantEntityPages` — navigation to, and URL assertions on, the pages of one entity, and the entity's draft in browser storage.
 *   - `nativeDialogs` — records every native dialog the page raises and answers it.
 *   - `adminClient` — the E2E admin client.
 *   - `selectionEntities` — the rows the spec's users edit, looked up by `external_id`, and readers for their saved answers.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { expect, test as base } from '@playwright/test';
import { createContestantEntitySelectionPage } from './contestantEntitySelectionPage.fixture';
import { createContestantHomePage } from './contestantHomePage.fixture';
import { createContestantLoginPage } from './contestantLoginPage.fixture';
import { createContestantNothingToEditPage } from './contestantNothingToEditPage.fixture';
import { createContestantQuestionPage } from './contestantQuestionPage.fixture';
import { createContestantQuestionsOverviewPage } from './contestantQuestionsOverviewPage.fixture';
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import {
  TEST_CANDIDATE_EXTERNAL_ID,
  TEST_SELECTION_CANDIDATE_A_EXTERNAL_ID,
  TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID,
  TEST_SELECTION_ORGANIZATION_EXTERNAL_ID
} from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { createNavMenu } from '../shared/navMenu.fixture';
import type { Page } from '@playwright/test';
import type { NavMenuFixture } from '../shared/navMenu.fixture';
import type { ContestantEntitySelectionPageFixture } from './contestantEntitySelectionPage.fixture';
import type { ContestantHomePageFixture } from './contestantHomePage.fixture';
import type { ContestantLoginPageFixture } from './contestantLoginPage.fixture';
import type { ContestantNothingToEditPageFixture } from './contestantNothingToEditPage.fixture';
import type { ContestantQuestionPageFixture } from './contestantQuestionPage.fixture';
import type { ContestantQuestionsOverviewPageFixture } from './contestantQuestionsOverviewPage.fixture';

/** An entity a contestant edits, as the spec addresses it. */
export interface SelectionEntity {
  /** The entity's type, as the entity segment of its URL spells it. */
  entityType: 'candidate' | 'organization';
  /** The row's id. */
  id: string;
  /** The entity's displayed name, as the base dataset seeds it. */
  name: string;
}

/** The rows the spec's users edit, and what the spec reads of them. */
export interface SelectionEntities {
  /** The first candidate of the user who edits several entities. Sorts before the second. */
  candidateA: SelectionEntity;
  /** The second candidate of the user who edits several entities. */
  candidateB: SelectionEntity;
  /** The organization every entity-selection user is registered on. */
  organization: SelectionEntity;
  /** The base candidate, whom the user who edits several entities does not edit. */
  baseCandidate: SelectionEntity;
  /** The id of the opinion question the two candidates are seeded with different answers to. */
  differingQuestionId: string;
  /** A text the differing question's label holds and no other question's does. */
  differingQuestionLabel: string;
  /** The saved answer value of a candidate to a question, read from the database, or `undefined` when it has none. */
  savedAnswerValue(entity: SelectionEntity, questionId: string): Promise<unknown>;
}

/** What `nativeDialogs` exposes. */
export interface NativeDialogsFixture {
  /** Answer every later `confirm` with OK (`accept`) or Cancel (`dismiss`). The default is `dismiss`. */
  answerConfirmWith(answer: 'accept' | 'dismiss'): void;
  /** The types of the dialogs raised since the last `clear()`, in order. */
  types(): Array<string>;
  /** Forget the dialogs recorded so far. */
  clear(): void;
}

/** The names the three selection rows are seeded with in `e2e/base`, as the application displays them. */
const SELECTION_CANDIDATE_A_NAME = 'Switch-A Entity One';
const SELECTION_CANDIDATE_B_NAME = 'Switch-B Entity Two';
const SELECTION_ORGANIZATION_NAME = '[or-sel] Party Sel';

/** external_id of the opinion question the two selection candidates answer differently in `e2e/base`. */
const DIFFERING_QUESTION_EXTERNAL_ID = 'test-e2e-base-qu-opin-base-1-likert5';

/** The marker the seed puts in that question's text, by which the questions overview finds its card. */
const DIFFERING_QUESTION_LABEL = '[qu-opin-base-1-likert5]';

/**
 * Read one namespace of the English message source.
 * @param file - The file's name under `apps/frontend/messages/en`, without its extension; the namespace is the file's single top-level key.
 */
function readEnglishMessages(file: string): Record<string, unknown> {
  const source = JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en', `${file}.json`), 'utf8')
  ) as Record<string, Record<string, unknown>>;
  return source[file];
}

const ENTITY_SELECTION_MESSAGES = readEnglishMessages('contestantApp.entitySelection') as Record<string, string>;
const COMMON_MESSAGES = readEnglishMessages('common') as Record<string, Record<string, string>>;

/**
 * The English strings the selection screen and the menu show, read from the message source rather than copied.
 */
export const SELECTION_TEXT = Object.freeze({
  /** The selection screen's heading. */
  title: ENTITY_SELECTION_MESSAGES.title,
  /** The type label of each entity type, as a card shows it. */
  typeLabel: Object.freeze({
    candidate: COMMON_MESSAGES.candidate.singular,
    organization: COMMON_MESSAGES.organization.singular
  }),
  /** The heading of each group, which is the type's plural with its first letter in upper case. */
  groupHeading: Object.freeze({
    candidate: upperCaseFirst(COMMON_MESSAGES.candidate.plural),
    organization: upperCaseFirst(COMMON_MESSAGES.organization.plural)
  })
});

function upperCaseFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The title of the menu's entity group for `entity`: the message `contestantApp.entitySelection.current` with the type's singular and the entity's name.
 */
export function entityGroupTitle(entity: SelectionEntity): string {
  return ENTITY_SELECTION_MESSAGES.current
    .replace('{entityType}', SELECTION_TEXT.typeLabel[entity.entityType])
    .replace('{name}', entity.name);
}

/**
 * The key an entity's unsaved answers are stored under in `localStorage`. The same form as `editedAnswersKey` in the application's `contestantUserDataState.svelte.ts`.
 */
function draftKey(entity: SelectionEntity): string {
  return `contestantContext-userData-editedAnswers-${entity.entityType}-${entity.id}`;
}

/** A pattern for a URL whose path is exactly `pathname`, with an optional trailing slash, query or fragment. */
function exactPathRe(pathname: string): RegExp {
  return new RegExp(`${escapeRegExp(pathname)}/?(?=[?#]|$)`);
}

/**
 * Navigation to, and URL assertions on, the pages of one entity, and the entity's draft in browser storage.
 *
 * Every path is built by the tests' route builder from the entity's type and id.
 */
function createContestantEntityPages(page: Page) {
  const entityParams = (entity: Pick<SelectionEntity, 'entityType' | 'id'>) => ({
    entityType: entity.entityType,
    entityId: entity.id
  });
  const homePath = (entity: Pick<SelectionEntity, 'entityType' | 'id'>) =>
    buildRoute({ route: 'ContestantAppEntityHome', locale: 'en', params: entityParams(entity) });
  const questionPath = (entity: SelectionEntity, questionId: string) =>
    buildRoute({ route: 'ContestantAppQuestion', locale: 'en', params: { ...entityParams(entity), questionId } });

  return {
    /** The path of an entity's home. */
    homePath,

    /**
     * Navigate to the home URL of the entity with that type and id, and assert nothing: where the application lands the user is the caller's question.
     */
    async requestHome(entity: Pick<SelectionEntity, 'entityType' | 'id'>): Promise<void> {
      await page.goto(homePath(entity));
    },

    /**
     * Navigate to an entity's home and wait for it.
     */
    async openHome(entity: SelectionEntity): Promise<void> {
      await page.goto(homePath(entity));
      await this.expectOnHome(entity);
    },

    /**
     * Assert the page is that entity's home, and that the home has rendered.
     */
    async expectOnHome(entity: SelectionEntity): Promise<void> {
      await expect(page).toHaveURL(exactPathRe(homePath(entity)));
      await expect(page.getByTestId(testIds.contestant.home.statusMessage)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert the home's heading names the entity.
     */
    async expectHomeHeadingNames(entity: SelectionEntity): Promise<void> {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(entity.name);
    },

    /**
     * Navigate to the editor of one question under an entity's URL and wait for its answer input.
     */
    async openQuestion(entity: SelectionEntity, questionId: string): Promise<void> {
      await page.goto(questionPath(entity, questionId));
      await this.expectOnQuestion(entity, questionId);
    },

    /**
     * Assert the page is that entity's editor of that question, and that the answer input has rendered.
     */
    async expectOnQuestion(entity: SelectionEntity, questionId: string): Promise<void> {
      await expect(page).toHaveURL(exactPathRe(questionPath(entity, questionId)));
      await expect(page.getByTestId(testIds.contestant.questions.answerInput)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert the page is that entity's questions overview, and that its list of questions has rendered.
     */
    async expectOnQuestionsOverview(entity: SelectionEntity): Promise<void> {
      await expect(page).toHaveURL(
        exactPathRe(buildRoute({ route: 'ContestantAppQuestions', locale: 'en', params: entityParams(entity) }))
      );
      await expect(page.getByTestId(testIds.contestant.questions.list)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Reload the page.
     */
    async reload(): Promise<void> {
      await page.reload();
    },

    /**
     * The ids of the questions the entity's draft in `localStorage` holds an unsaved answer to. Empty when the entity has no draft.
     */
    async draftQuestionIds(entity: SelectionEntity): Promise<Array<string>> {
      const stored = await page.evaluate((key) => window.localStorage.getItem(key), draftKey(entity));
      const draft = stored ? (JSON.parse(stored) as { data?: Record<string, unknown> | null }) : null;
      return Object.keys(draft?.data ?? {});
    }
  };
}

export type ContestantEntityPagesFixture = ReturnType<typeof createContestantEntityPages>;

/**
 * The id of the row with that `external_id` in the suite's project.
 * @throws Error if the lookup fails or finds no row.
 */
async function rowId(client: SupabaseAdminClient, collection: string, externalId: string): Promise<string> {
  const result = await client.findData(collection, { externalId: { $eq: externalId } });
  const id: unknown = result.type === 'success' ? result.data?.[0]?.id : undefined;
  if (typeof id !== 'string') {
    throw new Error(`contestant-entity-selection: no ${collection} row with external_id ${externalId} was found.`);
  }
  return id;
}

type ContestantEntitySelectionFixtures = {
  adminClient: SupabaseAdminClient;
  selectionEntities: SelectionEntities;
  nativeDialogs: NativeDialogsFixture;
  navMenu: NavMenuFixture;
  contestantEntitySelectionPage: ContestantEntitySelectionPageFixture;
  contestantNothingToEditPage: ContestantNothingToEditPageFixture;
  contestantEntityPages: ContestantEntityPagesFixture;
  contestantHomePage: ContestantHomePageFixture;
  contestantQuestionsOverviewPage: ContestantQuestionsOverviewPageFixture;
  contestantQuestionPage: ContestantQuestionPageFixture;
  contestantLoginPage: ContestantLoginPageFixture;
};

export const test = base.extend<ContestantEntitySelectionFixtures>({
  adminClient: async ({}, use) => {
    await use(new SupabaseAdminClient());
  },

  selectionEntities: async ({ adminClient }, use) => {
    const candidate = (externalId: string) => rowId(adminClient, 'candidates', externalId);
    await use({
      candidateA: {
        entityType: 'candidate',
        id: await candidate(TEST_SELECTION_CANDIDATE_A_EXTERNAL_ID),
        name: SELECTION_CANDIDATE_A_NAME
      },
      candidateB: {
        entityType: 'candidate',
        id: await candidate(TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID),
        name: SELECTION_CANDIDATE_B_NAME
      },
      organization: {
        entityType: 'organization',
        id: await rowId(adminClient, 'organizations', TEST_SELECTION_ORGANIZATION_EXTERNAL_ID),
        name: SELECTION_ORGANIZATION_NAME
      },
      // The name is not read: the user who edits several entities never reaches this candidate.
      baseCandidate: { entityType: 'candidate', id: await candidate(TEST_CANDIDATE_EXTERNAL_ID), name: '' },
      differingQuestionId: await rowId(adminClient, 'questions', DIFFERING_QUESTION_EXTERNAL_ID),
      differingQuestionLabel: DIFFERING_QUESTION_LABEL,
      async savedAnswerValue(entity: SelectionEntity, questionId: string): Promise<unknown> {
        const result = await adminClient.findData('candidates', { id: { $eq: entity.id } });
        const answers = (result.type === 'success' ? result.data?.[0]?.answers : undefined) as
          Record<string, { value?: unknown } | undefined> | undefined;
        return answers?.[questionId]?.value;
      }
    });
  },

  nativeDialogs: async ({ page }, use) => {
    const seen: Array<string> = [];
    let confirmAnswer: 'accept' | 'dismiss' = 'dismiss';
    page.on('dialog', async (dialog) => {
      seen.push(dialog.type());
      // A `beforeunload` prompt is the browser asking whether to leave a page with unsaved edits on a reload or a typed URL. The test asked for that navigation, so it is always confirmed; only a `confirm` raised by the application is answered as the test chose.
      if (dialog.type() === 'beforeunload' || confirmAnswer === 'accept') await dialog.accept();
      else await dialog.dismiss();
    });
    await use({
      answerConfirmWith(answer) {
        confirmAnswer = answer;
      },
      types: () => [...seen],
      clear() {
        seen.length = 0;
      }
    });
  },

  navMenu: async ({ page }, use) => {
    await use(createNavMenu(page));
  },
  contestantEntitySelectionPage: async ({ page }, use) => {
    await use(createContestantEntitySelectionPage(page));
  },
  contestantNothingToEditPage: async ({ page }, use) => {
    await use(createContestantNothingToEditPage(page));
  },
  contestantEntityPages: async ({ page }, use) => {
    await use(createContestantEntityPages(page));
  },
  contestantHomePage: async ({ page }, use) => {
    await use(createContestantHomePage(page));
  },
  contestantQuestionsOverviewPage: async ({ page }, use) => {
    await use(createContestantQuestionsOverviewPage(page));
  },
  contestantQuestionPage: async ({ page }, use) => {
    await use(createContestantQuestionPage(page));
  },
  contestantLoginPage: async ({ page }, use) => {
    await use(createContestantLoginPage(page));
  }
});

export { expect };
