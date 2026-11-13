/**
 * @file Composition root for the no-nomination spec.
 *
 * Consumed by `specs/perm/perm-no-nomination.spec.ts`: the editor of a candidate and of an organization on their own entity's pages, with and without a nomination.
 *
 * Surface:
 *   - `test`   — Playwright test extended with the page fixtures the spec speaks in.
 *   - `expect` — re-exported from @playwright/test.
 *   - `setNominationState`, `setAnswers`, `setNominationsLocked`, `setOrganizationName`, `clearWrittenNominations` — the state steps a test begins with, and the one the dataset's teardown ends with.
 *   - `noNominationPagesOf(page)` — the home, nomination-editor, nominations, entity-pages and menu fixtures over a page, for code that is handed a page alone, as a scan entry's `reach` is.
 *
 * The spec's body holds no locator: a step it needs is a method of a fixture registered here.
 *
 * The state steps stand in for the administrator: each writes with the service role, past the rules that bind an entity's own editor, and writes only what it is given. Every test calls the step for each row or setting it reads before it opens a page, so that it passes when it is run again and when it is run alone. They are plain functions and not fixtures, so that code which is handed a page and nothing else can call them too. Each accepts the three entities of the dataset and no other, and names the rows it writes by the dataset's own external ids, so that nothing outside the dataset's prefix is written or removed.
 *
 * A page that is already open does not follow a state step: the entity's nominations and the settings are read when a page is loaded, so the step after a state step is a full page load.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createContestantEntityHomePage } from './contestantEntityHomePage.fixture';
import { createContestantEntityPages } from './contestantEntityPages.fixture';
import { createContestantHomePage } from './contestantHomePage.fixture';
import { createContestantLoginPage } from './contestantLoginPage.fixture';
import { createContestantLogoutButton } from './contestantLogoutButton.fixture';
import { createContestantNominationEditor } from './contestantNominationEditor.fixture';
import { createContestantNominationsPage } from './contestantNominationsPage.fixture';
import { createContestantPreviewPage } from './contestantPreviewPage.fixture';
import { createContestantProfilePage } from './contestantProfilePage.fixture';
import { createContestantQuestionPage } from './contestantQuestionPage.fixture';
import { createContestantQuestionsOverviewPage } from './contestantQuestionsOverviewPage.fixture';
import { createNotEditableNote } from './notEditableNote.fixture';
import { deleteNominationsWithDescendants } from './perm-contestant-nominations';
import {
  CONSTITUENCY_EXTERNAL_ID,
  ELECTION_EXTERNAL_ID,
  NOMINATED_CANDIDATE_EXTERNAL_ID,
  NOMINATED_CANDIDATE_NOMINATION_EXTERNAL_ID,
  NOMINATION_ELECTION_ROUND,
  OPINION_QUESTION_EXTERNAL_IDS,
  REQUIRED_INFO_QUESTION_EXTERNAL_ID,
  SEEDED_NOMINATION_ELECTION_SYMBOL,
  UNNOMINATED_CANDIDATE_EXTERNAL_ID,
  UNNOMINATED_CANDIDATE_NOMINATION_EXTERNAL_ID,
  UNNOMINATED_ORGANIZATION_EXTERNAL_ID,
  UNNOMINATED_ORGANIZATION_NOMINATION_EXTERNAL_ID,
  WRITTEN_NOMINATION_ELECTION_SYMBOL
} from '../../utils/permNoNominationData';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { createNavMenu } from '../shared/navMenu.fixture';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import type { Page } from '@playwright/test';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';
import type { NavMenuFixture } from '../shared/navMenu.fixture';
import type { PageGeometryFixture } from '../shared/pageGeometry.fixture';
import type { ContestantEntityHomePageFixture } from './contestantEntityHomePage.fixture';
import type { ContestantEntityPagesFixture } from './contestantEntityPages.fixture';
import type { ContestantHomePageFixture } from './contestantHomePage.fixture';
import type { ContestantLoginPageFixture } from './contestantLoginPage.fixture';
import type { ContestantLogoutButtonFixture } from './contestantLogoutButton.fixture';
import type { ContestantNominationEditorFixture } from './contestantNominationEditor.fixture';
import type { ContestantNominationsPageFixture } from './contestantNominationsPage.fixture';
import type { ContestantPreviewPageFixture } from './contestantPreviewPage.fixture';
import type { ContestantProfilePageFixture } from './contestantProfilePage.fixture';
import type { ContestantQuestionPageFixture } from './contestantQuestionPage.fixture';
import type { ContestantQuestionsOverviewPageFixture } from './contestantQuestionsOverviewPage.fixture';
import type { NotEditableNoteFixture } from './notEditableNote.fixture';

type NoNominationFixtures = {
  /** The home of the entity the stored session's user edits. */
  contestantEntityHomePage: ContestantEntityHomePageFixture;
  /** The profile, the questions, the preview and the home of an entity, opened by their URL. */
  contestantEntityPages: ContestantEntityPagesFixture;
  /** The home of an entity as its task list: the status of each task, the preview entry, the reason an entry is closed and the main action. */
  contestantHomePage: ContestantHomePageFixture;
  /** The login page, for a test that signs in with a session of its own. */
  contestantLoginPage: ContestantLoginPageFixture;
  /** The logout button of the entity's home, and the dialog it may open. */
  contestantLogoutButton: ContestantLogoutButtonFixture;
  /** The nomination editor of an entity: its election step, its constituency step and its details step. */
  contestantNominationEditor: ContestantNominationEditorFixture;
  /** The nominations view of an entity, opened by its URL. */
  contestantNominationsPage: ContestantNominationsPageFixture;
  /** The preview of the entity the stored session's user edits. */
  contestantPreviewPage: ContestantPreviewPageFixture;
  /** The profile of the entity the stored session's user edits. */
  contestantProfilePage: ContestantProfilePageFixture;
  /** The page of one opinion question of that entity. */
  contestantQuestionPage: ContestantQuestionPageFixture;
  /** The questions list of the entity the stored session's user edits. */
  contestantQuestionsOverviewPage: ContestantQuestionsOverviewPageFixture;
  /** The navigation menu, whose entity group is titled with the entity's name. */
  navMenu: NavMenuFixture;
  /** The note a page shows when something on it cannot be edited, and the Contact support buttons of the page that is open. */
  notEditableNote: NotEditableNoteFixture;
  /** The width of the page that is open, against its viewport. */
  pageGeometry: PageGeometryFixture;
};

/** Playwright's `test`, extended with the page fixtures of the no-nomination spec. */
export const test = base.extend<NoNominationFixtures>({
  contestantEntityHomePage: async ({ page }, use) => {
    await use(createContestantEntityHomePage(page, new SupabaseAdminClient()));
  },
  contestantEntityPages: async ({ page }, use) => {
    await use(createContestantEntityPages(page, new SupabaseAdminClient()));
  },
  contestantHomePage: async ({ page }, use) => {
    await use(createContestantHomePage(page));
  },
  contestantLoginPage: async ({ page }, use) => {
    await use(createContestantLoginPage(page));
  },
  contestantLogoutButton: async ({ page }, use) => {
    await use(createContestantLogoutButton(page));
  },
  contestantNominationEditor: async ({ page }, use) => {
    await use(createContestantNominationEditor(page, new SupabaseAdminClient()));
  },
  contestantNominationsPage: async ({ page }, use) => {
    await use(createContestantNominationsPage(page, new SupabaseAdminClient()));
  },
  contestantPreviewPage: async ({ page }, use) => {
    await use(createContestantPreviewPage(page));
  },
  contestantProfilePage: async ({ page }, use) => {
    await use(createContestantProfilePage(page));
  },
  contestantQuestionPage: async ({ page }, use) => {
    await use(createContestantQuestionPage(page));
  },
  contestantQuestionsOverviewPage: async ({ page }, use) => {
    await use(createContestantQuestionsOverviewPage(page));
  },
  navMenu: async ({ page }, use) => {
    await use(createNavMenu(page));
  },
  notEditableNote: async ({ page }, use) => {
    await use(createNotEditableNote(page));
  },
  pageGeometry: async ({ page }, use) => {
    await use(createPageGeometry(page));
  }
});

export { expect };

/**
 * The page fixtures a scan entry's `reach` speaks in, built over the page it is handed. They are the fixtures the `test` object offers under the same names.
 * @param page - The page of the scan, already opened under the session the entry's describe sets.
 * @returns The entity-pages, home, nomination-editor, nominations and menu fixtures of that page.
 */
export function noNominationPagesOf(page: Page): {
  contestantEntityPages: ContestantEntityPagesFixture;
  contestantHomePage: ContestantHomePageFixture;
  contestantNominationEditor: ContestantNominationEditorFixture;
  contestantNominationsPage: ContestantNominationsPageFixture;
  navMenu: NavMenuFixture;
} {
  let editor: ContestantNominationEditorFixture | undefined;
  return {
    contestantEntityPages: createContestantEntityPages(page, new SupabaseAdminClient()),
    contestantHomePage: createContestantHomePage(page),
    // Created when it is first read, and once: creating it registers a listener for browser dialogs on the page.
    get contestantNominationEditor(): ContestantNominationEditorFixture {
      editor ??= createContestantNominationEditor(page, new SupabaseAdminClient());
      return editor;
    },
    contestantNominationsPage: createContestantNominationsPage(page, new SupabaseAdminClient()),
    navMenu: createNavMenu(page)
  };
}

/** Whether an entity has a nomination, and whether an administrator has confirmed it. */
export type NominationState = 'none' | 'pending' | 'confirmed';

/** Which of the dataset's questions an entity's stored answers hold. */
export interface AnswersState {
  /** Whether the required info question is answered. */
  requiredInfo: boolean;
  /** The opinion questions answered: none of them, every one but the last, or all of them. */
  opinions: 'none' | 'allButLast' | 'all';
}

/** The one nomination row of each entity of the dataset: its external id and its election symbol. */
const NOMINATION_OF: Readonly<Record<string, Readonly<{ externalId: string; electionSymbol: string }>>> = Object.freeze(
  {
    [UNNOMINATED_CANDIDATE_EXTERNAL_ID]: {
      externalId: UNNOMINATED_CANDIDATE_NOMINATION_EXTERNAL_ID,
      electionSymbol: WRITTEN_NOMINATION_ELECTION_SYMBOL
    },
    [UNNOMINATED_ORGANIZATION_EXTERNAL_ID]: {
      externalId: UNNOMINATED_ORGANIZATION_NOMINATION_EXTERNAL_ID,
      electionSymbol: WRITTEN_NOMINATION_ELECTION_SYMBOL
    },
    [NOMINATED_CANDIDATE_EXTERNAL_ID]: {
      externalId: NOMINATED_CANDIDATE_NOMINATION_EXTERNAL_ID,
      electionSymbol: SEEDED_NOMINATION_ELECTION_SYMBOL
    }
  }
);

/** The external ids of the dataset's three entities, by entity type. */
const ENTITY_EXTERNAL_IDS = Object.freeze({
  candidate: [UNNOMINATED_CANDIDATE_EXTERNAL_ID, NOMINATED_CANDIDATE_EXTERNAL_ID],
  organization: [UNNOMINATED_ORGANIZATION_EXTERNAL_ID]
});

/** The table of an entity type and the column of `nominations` that refers to it. */
const TABLES = Object.freeze({
  candidate: { table: 'candidates', nominationColumn: 'candidate_id' },
  organization: { table: 'organizations', nominationColumn: 'organization_id' }
});

/**
 * The one nomination row of an entity of the dataset.
 * @throws If the entity is not one of the dataset's three.
 */
function nominationOf(
  step: string,
  entity: EntityGrantTarget
): Readonly<{ externalId: string; electionSymbol: string }> {
  if (!Object.hasOwn(NOMINATION_OF, entity.externalId)) {
    throw new Error(`${step}: ${entity.externalId} is not an entity of the no-nomination dataset`);
  }
  return NOMINATION_OF[entity.externalId];
}

/**
 * The table of an entity and the column of `nominations` that refers to it.
 * @throws If the entity's type is neither a candidate nor an organization.
 */
function tablesOf(step: string, entity: EntityGrantTarget): Readonly<{ table: string; nominationColumn: string }> {
  if (entity.entityType !== 'candidate' && entity.entityType !== 'organization') {
    throw new Error(`${step}: the dataset holds no entity of type ${entity.entityType}`);
  }
  return TABLES[entity.entityType];
}

/**
 * Give an entity of the dataset no nomination, an unconfirmed one or a confirmed one, as an administrator would.
 *
 * `none` removes the entity's one nomination row, by its exact external id. `pending` and `confirmed` make sure the entity has exactly that one row, in the dataset's one election and constituency, with `confirmed` false or true: a missing row is written, and an existing one has its `confirmed` value alone changed. For the nominated candidate the row is the seeded one. No other row is written or removed.
 *
 * @param entity - One of the dataset's three entities.
 * @param state - The state the entity's nomination is put into.
 * @throws If the entity is not of the dataset, if it holds a nomination that is not the dataset's own row for it, or if a read or a write fails.
 */
export async function setNominationState(entity: EntityGrantTarget, state: NominationState): Promise<void> {
  const step = 'setNominationState';
  const nomination = nominationOf(step, entity);
  const { table, nominationColumn } = tablesOf(step, entity);
  const admin = new SupabaseAdminClient();
  const entityId = await admin.entityId(entity);

  const found = await admin.findData('nominations', { [nominationColumn]: { $eq: entityId } });
  if (found.type !== 'success') throw new Error(`${step}: reading the nominations failed: ${found.cause}`);
  const rows = found.data ?? [];
  const foreign = rows.filter((row) => row.external_id !== nomination.externalId);
  if (foreign.length) {
    throw new Error(
      `${step}: ${entity.externalId} holds ${foreign.length} nomination(s) that are not ${nomination.externalId}`
    );
  }
  const existing = rows[0];

  if (state === 'none') {
    if (existing) await admin.bulkDelete({ nominations: { external_ids: [nomination.externalId] } });
    return;
  }

  const confirmed = state === 'confirmed';
  if (existing) {
    if (existing.confirmed !== confirmed) await admin.update('nominations', String(existing.id), { confirmed });
    return;
  }

  // The row is written into the project the entity itself is in.
  const owner = await admin.findData(table, { id: { $eq: entityId } });
  const projectId = owner.data?.[0]?.project_id;
  if (owner.type !== 'success' || typeof projectId !== 'string') {
    throw new Error(`${step}: the ${entity.entityType} ${entity.externalId} could not be read`);
  }
  await admin.bulkImport({
    nominations: [
      {
        external_id: nomination.externalId,
        project_id: projectId,
        [entity.entityType]: { external_id: entity.externalId },
        election: { external_id: ELECTION_EXTERNAL_ID },
        constituency: { external_id: CONSTITUENCY_EXTERNAL_ID },
        election_round: NOMINATION_ELECTION_ROUND,
        election_symbol: nomination.electionSymbol,
        confirmed
      }
    ]
  });
}

/**
 * Delete every nomination the application wrote for an entity of the dataset: the rows of the dataset's three entities that carry no external id, which a delete by the dataset's prefix does not name.
 *
 * A nomination that stands under one of them is deleted first, whatever it carries, since it cannot outlive the row it stands under. An entity that is no longer in the database has no row to delete, so the step also passes once the dataset itself is gone.
 *
 * @throws If a read or a delete fails.
 */
export async function clearWrittenNominations(): Promise<void> {
  const step = 'clearWrittenNominations';
  const admin = new SupabaseAdminClient();
  const written: Array<string> = [];

  for (const entityType of ['candidate', 'organization'] as const) {
    const { table, nominationColumn } = TABLES[entityType];
    const entities = await admin.findData(table, { external_id: { $in: ENTITY_EXTERNAL_IDS[entityType] } });
    if (entities.type !== 'success') throw new Error(`${step}: reading ${table} failed: ${entities.cause}`);
    const entityIds = (entities.data ?? []).map((entity) => String(entity.id));
    if (!entityIds.length) continue;
    const rows = await admin.findData('nominations', { [nominationColumn]: { $in: entityIds } });
    if (rows.type !== 'success') throw new Error(`${step}: reading the nominations failed: ${rows.cause}`);
    written.push(...(rows.data ?? []).filter((row) => row.external_id == null).map((row) => String(row.id)));
  }

  if (written.length) await deleteNominationsWithDescendants(admin, step, written);
}

/**
 * Replace the stored answers of an entity of the dataset whole, as an administrator would: afterwards the entity holds exactly the answers `answers` names, and none to any other question.
 *
 * The required info question is answered with a text in the default locale. An opinion question is answered with the middle step of its scale and no open comment.
 *
 * @param entity - One of the dataset's three entities.
 * @param answers - Which of the dataset's questions are answered.
 * @throws If the entity is not of the dataset, if one of the dataset's questions is not found, or if the write fails.
 */
export async function setAnswers(entity: EntityGrantTarget, answers: AnswersState): Promise<void> {
  const step = 'setAnswers';
  nominationOf(step, entity);
  const { table } = tablesOf(step, entity);
  const admin = new SupabaseAdminClient();
  const entityId = await admin.entityId(entity);

  const answeredOpinions =
    answers.opinions === 'all'
      ? OPINION_QUESTION_EXTERNAL_IDS
      : answers.opinions === 'allButLast'
        ? OPINION_QUESTION_EXTERNAL_IDS.slice(0, -1)
        : [];
  const stored: Record<string, { value: unknown }> = {};
  if (answers.requiredInfo) {
    stored[await questionId(admin, REQUIRED_INFO_QUESTION_EXTERNAL_ID)] = {
      value: { en: 'An answer the test wrote.' }
    };
  }
  for (const externalId of answeredOpinions) stored[await questionId(admin, externalId)] = { value: '3' };

  await admin.update(table, entityId, { answers: stored });
}

/**
 * Lock or unlock the nominations of every entity of the suite's project, as an administrator would: the one setting `access.nominationsLocked` is written and no other.
 *
 * A test that locks the nominations unlocks them in a `finally`, because the setting is the project's and every later test reads it.
 *
 * @param on - Whether nominations are locked.
 */
export async function setNominationsLocked(on: boolean): Promise<void> {
  await new SupabaseAdminClient().updateAppSettings({ access: { nominationsLocked: on } });
}

/**
 * Store a name on the dataset's organization, as an administrator would: the name is written whole, one entry for each locale given, and nothing else of the row is changed.
 *
 * A test that stores a name other than the seeded one puts the seeded one back whether or not it passed, because every later test of the organization reads it.
 *
 * @param entity - The dataset's organization.
 * @param name - The name to store, by locale.
 * @throws If the entity is not the dataset's organization, or if the write fails.
 */
export async function setOrganizationName(
  entity: EntityGrantTarget,
  name: Readonly<Record<string, string>>
): Promise<void> {
  const step = 'setOrganizationName';
  if (entity.entityType !== 'organization' || entity.externalId !== UNNOMINATED_ORGANIZATION_EXTERNAL_ID) {
    throw new Error(`${step}: ${entity.externalId} is not the organization of the no-nomination dataset`);
  }
  const admin = new SupabaseAdminClient();
  await admin.update(TABLES.organization.table, await admin.entityId(entity), { name: { ...name } });
}

/**
 * The id of a question of the suite's project, by its external id.
 * @throws If the question is not found.
 */
async function questionId(admin: SupabaseAdminClient, externalId: string): Promise<string> {
  const found = await admin.findData('questions', { external_id: { $eq: externalId } });
  const id = found.data?.[0]?.id;
  if (found.type !== 'success' || typeof id !== 'string') {
    throw new Error(`setAnswers: the question ${externalId} was not found`);
  }
  return id;
}
