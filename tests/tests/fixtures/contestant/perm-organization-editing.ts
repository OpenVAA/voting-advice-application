/**
 * @file Composition root for the organization-editing spec.
 *
 * Consumed by `specs/perm/perm-organization-editing.spec.ts`: an organization's editor and a candidate's editor on their own entity's pages, and an anonymous voter on what those pages publish.
 *
 * Surface:
 *   - `test`   — Playwright test extended with the page fixtures the spec speaks in.
 *   - `expect` — re-exported from @playwright/test.
 *   - `setOrganizationState`, `setCandidateState`, `setAnswersLocked` — the state steps a test begins with.
 *   - `completeAnswers(target)` — the state step that answers what an entity's preview waits for.
 *   - `groupTitleNaming(name)` — a pattern for the menu's group title of an entity with that name.
 *   - `organizationEditingPagesOf(page)` — the profile, preview and no-questions page fixtures over a page, for code that is handed a page alone, as a scan entry's `reach` is.
 *
 * The spec's body holds no locator: a step it needs is a method of a fixture registered here.
 *
 * The state steps stand in for the administrator: each writes with the service role, past the rules that bind an entity's own editor, and writes only the members it is given. A test that reads a row or a setting some test changes calls the step for it first, so that it passes when it is run again and when it is run alone. They are plain functions and not fixtures, so that code which is handed a page and nothing else can call them too.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createContestantEntityHomePage } from './contestantEntityHomePage.fixture';
import { createContestantNoQuestionsPage } from './contestantNoQuestionsPage.fixture';
import { createContestantPreviewPage } from './contestantPreviewPage.fixture';
import { createContestantProfilePage } from './contestantProfilePage.fixture';
import { createContestantQuestionPage } from './contestantQuestionPage.fixture';
import { createContestantQuestionsOverviewPage } from './contestantQuestionsOverviewPage.fixture';
import {
  CANDIDATE_INFO_QUESTION_EXTERNAL_ID,
  OPINION_QUESTION_EXTERNAL_IDS,
  ORGANIZATION_INFO_QUESTION_EXTERNAL_ID,
  ORGANIZATION_LOCKED_INFO_QUESTION_EXTERNAL_ID
} from '../../utils/permOrganizationEditingData';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { createNavMenu } from '../shared/navMenu.fixture';
import { createOrganizationDetail } from '../voter/organizationDetail.fixture';
import type { Page } from '@playwright/test';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';
import type { NavMenuFixture } from '../shared/navMenu.fixture';
import type { OrganizationDetailFixture } from '../voter/organizationDetail.fixture';
import type { ContestantEntityHomePageFixture } from './contestantEntityHomePage.fixture';
import type { ContestantNoQuestionsPageFixture } from './contestantNoQuestionsPage.fixture';
import type { ContestantPreviewPageFixture } from './contestantPreviewPage.fixture';
import type { ContestantProfilePageFixture } from './contestantProfilePage.fixture';
import type { ContestantQuestionPageFixture } from './contestantQuestionPage.fixture';
import type { ContestantQuestionsOverviewPageFixture } from './contestantQuestionsOverviewPage.fixture';

type OrganizationEditingFixtures = {
  /** The home of the entity the stored session's user edits. */
  contestantEntityHomePage: ContestantEntityHomePageFixture;
  /** The page the questions URL shows for an entity with no opinion question to answer. */
  contestantNoQuestionsPage: ContestantNoQuestionsPageFixture;
  /** The preview of the entity the stored session's user edits. */
  contestantPreviewPage: ContestantPreviewPageFixture;
  /** The profile page of the entity the stored session's user edits. */
  contestantProfilePage: ContestantProfilePageFixture;
  /** The page of one opinion question of that entity. */
  contestantQuestionPage: ContestantQuestionPageFixture;
  /** The list of that entity's opinion questions. */
  contestantQuestionsOverviewPage: ContestantQuestionsOverviewPageFixture;
  /** The navigation menu, whose entity group is titled with the entity's name. */
  navMenu: NavMenuFixture;
  /** An organization as an anonymous voter finds it in the results. */
  organizationDetail: OrganizationDetailFixture;
  /** The same, on a page of a second browser context that carries no session, for a test whose own page is an editor's: one test then drives the editor and the voter. */
  voterOrganizationDetail: OrganizationDetailFixture;
};

/** Playwright's `test`, extended with the page fixtures of the organization-editing spec. */
export const test = base.extend<OrganizationEditingFixtures>({
  contestantEntityHomePage: async ({ page }, use) => {
    await use(createContestantEntityHomePage(page, new SupabaseAdminClient()));
  },
  contestantNoQuestionsPage: async ({ page }, use) => {
    await use(createContestantNoQuestionsPage(page, new SupabaseAdminClient()));
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
  organizationDetail: async ({ page }, use) => {
    await use(createOrganizationDetail(page));
  },
  voterOrganizationDetail: async ({ browser, baseURL }, use) => {
    // The context states an empty storage state, so that it carries no session whatever the describe's own `storageState` is.
    const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
    try {
      await use(createOrganizationDetail(await context.newPage()));
    } finally {
      await context.close();
    }
  }
});

export { expect };

/**
 * The page fixtures a scan entry's `reach` speaks in, built over the page it is handed. They are the fixtures the `test` object offers under the same names.
 * @param page - The page of the scan, already opened under the session the entry's describe sets.
 * @returns The profile, the preview and the no-questions page fixtures of that page.
 */
export function organizationEditingPagesOf(page: Page): {
  contestantNoQuestionsPage: ContestantNoQuestionsPageFixture;
  contestantPreviewPage: ContestantPreviewPageFixture;
  contestantProfilePage: ContestantProfilePageFixture;
} {
  return {
    contestantNoQuestionsPage: createContestantNoQuestionsPage(page, new SupabaseAdminClient()),
    contestantPreviewPage: createContestantPreviewPage(page),
    contestantProfilePage: createContestantProfilePage(page)
  };
}

/**
 * A pattern for the menu's group title of an entity with the given name: the title names the entity's type and then its name.
 */
export function groupTitleNaming(name: string): RegExp {
  return new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

/** A name or a short name as it is stored: one entry for each locale. */
type StoredLocalizedName = Readonly<Record<string, string>>;

/**
 * The members of an organization's row a state step can write. A member that is left out is not written.
 */
export interface OrganizationState {
  /** Whether an administrator has confirmed the organization. Its nomination is confirmed as seeded, so `true` alone makes the organization visible to voters. */
  confirmed?: boolean;
  /** The name by locale. */
  name?: StoredLocalizedName;
  /** The short name by locale, or `null` for none. */
  shortName?: StoredLocalizedName | null;
  /** The colour as it is stored, or `null` for none. */
  color?: Readonly<{ normal: string; dark?: string }> | null;
  /** `null` removes the logo. A logo is stored by uploading one on the profile page. */
  image?: null;
  /** The `external_id`s of the questions whose answers are removed from the organization's stored answers. */
  clearAnswers?: ReadonlyArray<string>;
}

/**
 * The members of a candidate's row a state step can write. A member that is left out is not written.
 */
export interface CandidateState {
  /** Whether an administrator has confirmed the candidate. Its nomination is confirmed as seeded, so `true` alone makes the candidate visible to voters. */
  confirmed?: boolean;
  firstName?: string;
  lastName?: string;
}

/**
 * Put an organization of the dataset into a known state, as an administrator would: the row is written with the service role, which the freeze of a confirmed entity's names does not bind.
 * @param externalId - The organization's `external_id`.
 * @param state - The members to write. Nothing else of the row changes.
 * @throws If the organization or a question named in `clearAnswers` is not found, or a write fails.
 */
export async function setOrganizationState(externalId: string, state: OrganizationState): Promise<void> {
  const admin = new SupabaseAdminClient();
  const id = await admin.entityId({ entityType: 'organization', externalId });
  const row: Record<string, unknown> = {};
  if (state.confirmed !== undefined) row.confirmed = state.confirmed;
  if (state.name !== undefined) row.name = state.name;
  if (state.shortName !== undefined) row.short_name = state.shortName;
  if (state.color !== undefined) row.color = state.color;
  if (state.image !== undefined) row.image = state.image;
  if (state.clearAnswers?.length) row.answers = await answersWithout(admin, id, state.clearAnswers);
  if (Object.keys(row).length) await admin.update('organizations', id, row);
}

/**
 * Put the candidate of the dataset into a known state, as an administrator would: the row is written with the service role.
 * @param externalId - The candidate's `external_id`.
 * @param state - The members to write. Nothing else of the row changes.
 * @throws If the candidate is not found or the write fails.
 */
export async function setCandidateState(externalId: string, state: CandidateState): Promise<void> {
  const admin = new SupabaseAdminClient();
  const id = await admin.entityId({ entityType: 'candidate', externalId });
  const row: Record<string, unknown> = {};
  if (state.confirmed !== undefined) row.confirmed = state.confirmed;
  if (state.firstName !== undefined) row.first_name = state.firstName;
  if (state.lastName !== undefined) row.last_name = state.lastName;
  if (Object.keys(row).length) await admin.update('candidates', id, row);
}

/**
 * Lock or unlock the answers of every entity of the suite's project, as an administrator would: the one setting `access.answersLocked` is written and no other.
 * @param on - Whether answers are locked.
 */
export async function setAnswersLocked(on: boolean): Promise<void> {
  await new SupabaseAdminClient().updateAppSettings({ access: { answersLocked: on } });
}

/** The table that holds the rows of each entity type a state step writes. */
const ENTITY_TABLE: Readonly<Record<EntityGrantTarget['entityType'], string>> = Object.freeze({
  candidate: 'candidates',
  organization: 'organizations'
});

/** The dataset's info questions. Its opinion questions are `OPINION_QUESTION_EXTERNAL_IDS`. */
const INFO_QUESTION_EXTERNAL_IDS: ReadonlyArray<string> = Object.freeze([
  ORGANIZATION_INFO_QUESTION_EXTERNAL_ID,
  ORGANIZATION_LOCKED_INFO_QUESTION_EXTERNAL_ID,
  CANDIDATE_INFO_QUESTION_EXTERNAL_ID
]);

/**
 * Give an entity of the dataset an answer to every question its preview waits for, as an administrator would: every opinion question, and every required info question that is not locked, that is asked of the entity's type and that the entity has not answered. Every other stored answer is left as it is, and nothing is written for an entity with nothing left to answer.
 * @param target - The entity, by its type and `external_id`.
 * @throws If the entity or one of the dataset's questions is not found, a question has a type the step holds no answer for, or the write fails.
 */
export async function completeAnswers(target: EntityGrantTarget): Promise<void> {
  const admin = new SupabaseAdminClient();
  const table = ENTITY_TABLE[target.entityType];
  const id = await admin.entityId(target);
  const entity = await admin.findData(table, { id: { $eq: id } });
  const row = entity.data?.[0];
  if (entity.type !== 'success' || !row) {
    throw new Error(`completeAnswers: the ${target.entityType} ${target.externalId} could not be read`);
  }
  const externalIds = [...OPINION_QUESTION_EXTERNAL_IDS, ...INFO_QUESTION_EXTERNAL_IDS];
  const questions = await admin.findData('questions', { external_id: { $in: externalIds } });
  if (questions.type !== 'success' || questions.data?.length !== externalIds.length) {
    throw new Error(`completeAnswers: not every question of ${externalIds.join(', ')} was found`);
  }
  const answers = { ...((row.answers ?? {}) as Record<string, { value?: unknown } | null>) };
  let written = 0;
  for (const question of questions.data) {
    const askedOf = question.entity_type as ReadonlyArray<string> | null;
    if (askedOf && !askedOf.includes(target.entityType)) continue;
    const isOpinion = OPINION_QUESTION_EXTERNAL_IDS.includes(String(question.external_id));
    const locked = (question.custom_data as { locked?: boolean } | null)?.locked === true;
    if (!isOpinion && (question.required !== true || locked)) continue;
    const stored = answers[String(question.id)]?.value;
    if (stored !== undefined && stored !== null && stored !== '') continue;
    answers[String(question.id)] = { value: answerTo(question) };
    written++;
  }
  if (written) await admin.update(table, id, { answers });
}

/**
 * A value that answers a question of the dataset: the first of its own choices for a choice question, a text in the default locale for a text question.
 * @throws If the question has another type, or a choice question has no choice.
 */
function answerTo(question: Record<string, unknown>): unknown {
  if (question.type === 'text') return { en: 'An answer the test wrote.' };
  if (question.type === 'singleChoiceOrdinal') {
    const choice = (question.choices as ReadonlyArray<{ id?: unknown }> | null)?.[0]?.id;
    if (typeof choice !== 'string') throw new Error(`completeAnswers: ${question.external_id} has no choice`);
    return choice;
  }
  throw new Error(`completeAnswers: no answer for a question of type ${question.type}`);
}

/**
 * The stored answers of an organization without those to the named questions.
 * @throws If the organization's row or one of the questions cannot be read.
 */
async function answersWithout(
  admin: SupabaseAdminClient,
  organizationId: string,
  questionExternalIds: ReadonlyArray<string>
): Promise<Record<string, unknown>> {
  const organization = await admin.findData('organizations', { id: { $eq: organizationId } });
  const row = organization.data?.[0];
  if (organization.type !== 'success' || !row) {
    throw new Error(`setOrganizationState: the organization ${organizationId} could not be read`);
  }
  const questions = await admin.findData('questions', { external_id: { $in: [...questionExternalIds] } });
  if (questions.type !== 'success' || questions.data?.length !== questionExternalIds.length) {
    throw new Error(`setOrganizationState: not every question of ${questionExternalIds.join(', ')} was found`);
  }
  const answers = { ...((row.answers ?? {}) as Record<string, unknown>) };
  for (const question of questions.data) delete answers[String(question.id)];
  return answers;
}
