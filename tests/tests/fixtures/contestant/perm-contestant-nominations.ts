/**
 * @file Composition root for the contestant-nominations spec.
 *
 * Consumed by `specs/perm/contestant-nominations.spec.ts`: the editor of a candidate and of a party defining, changing and removing the entity's nominations, on the `perm-contestant-nominations` dataset.
 *
 * Surface:
 *   - `test`   — Playwright test extended with the page fixtures the spec speaks in.
 *   - `expect` — re-exported from @playwright/test.
 *   - `setNominations`, `addNomination`, `clearWrittenNominations`, `setNominationsLocked`, `setAnswersLocked`, `setElectionSelectionDisallowed`, `setElectionType`, `setEntityConfirmed`, `setAnswers` — the state steps a test begins with.
 *   - `nominationsOf`, `electionTypeOf`, `entityConfirmedOf` — what the database holds, read with the service role, for a test that asserts what a step or a save stored.
 *   - `deleteNominationsWithDescendants` — the delete the steps above remove nominations with, for the state steps of another dataset whose entities the application writes nominations for.
 *   - `contestantNominationsPagesOf(page)` — the entity-pages, home, nomination-editor and nominations fixtures over a page, for code that is handed a page alone, as a scan entry's `reach` is.
 *
 * The spec's body holds no locator: a step it needs is a method of a fixture registered here.
 *
 * The state steps stand in for the administrator: each writes with the service role, past the rules that bind an entity's own editor, and writes only what it is given. Every test calls the step for each row or setting it reads before it opens a page, so that it passes when it is run again and when it is run alone. They are plain functions and not fixtures, so that code which is handed a page and nothing else can call them too. Each accepts the entities, elections and constituencies of the dataset and no other, and each throws under its own name when a read or a write fails.
 *
 * The rule of an election's type binds the service role too: a step that writes a nomination its election's type refuses throws with the database's refusal, and writes nothing.
 *
 * A nomination a step writes carries an external id under the dataset's prefix. A nomination the application writes carries none: `setNominations` removes those of one entity and `clearWrittenNominations` those of every entity of the dataset. A nomination is never removed while another stands under it: the one that stands under it is removed first.
 *
 * A page that is already open does not follow a state step: the entity's nominations, the elections and the settings are read when a page is loaded, so the step after a state step is a full page load.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createContestantEntityHomePage } from './contestantEntityHomePage.fixture';
import { createContestantEntityPages } from './contestantEntityPages.fixture';
import { createContestantHomePage } from './contestantHomePage.fixture';
import { createContestantNominationEditor } from './contestantNominationEditor.fixture';
import { createContestantNominationsPage } from './contestantNominationsPage.fixture';
import { createContestantQuestionsOverviewPage } from './contestantQuestionsOverviewPage.fixture';
import { createNotEditableNote } from './notEditableNote.fixture';
import {
  CONTESTANT_NOMINATIONS_PREFIX,
  NOMINATION_ELECTION_ROUND,
  NOMINATION_ENTITIES,
  OPINION_QUESTION_EXTERNAL_IDS,
  REQUIRED_INFO_QUESTION_EXTERNAL_ID,
  SEEDED_ELECTION_TYPES,
  SEEDED_NOMINATIONS
} from '../../utils/permContestantNominationsData';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { createNavMenu } from '../shared/navMenu.fixture';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import type { Page } from '@playwright/test';
import type {
  ElectionTypeName,
  NominationContestTarget,
  NominationEntityTarget
} from '../../utils/permContestantNominationsData';
import type { NavMenuFixture } from '../shared/navMenu.fixture';
import type { PageGeometryFixture } from '../shared/pageGeometry.fixture';
import type { ContestantEntityHomePageFixture } from './contestantEntityHomePage.fixture';
import type { ContestantEntityPagesFixture } from './contestantEntityPages.fixture';
import type { ContestantHomePageFixture } from './contestantHomePage.fixture';
import type { ContestantNominationEditorFixture } from './contestantNominationEditor.fixture';
import type { ContestantNominationsPageFixture } from './contestantNominationsPage.fixture';
import type { ContestantQuestionsOverviewPageFixture } from './contestantQuestionsOverviewPage.fixture';
import type { NotEditableNoteFixture } from './notEditableNote.fixture';

type ContestantNominationsFixtures = {
  /** The home of the entity the stored session's user edits. */
  contestantEntityHomePage: ContestantEntityHomePageFixture;
  /** The profile, the questions, the preview and the home of an entity, opened by their URL. */
  contestantEntityPages: ContestantEntityPagesFixture;
  /** The home of an entity as its task list: the status of each task, the preview entry, the reason an entry is closed and the main action. */
  contestantHomePage: ContestantHomePageFixture;
  /** The nomination editor of an entity: its election step, its constituency step and its details step. */
  contestantNominationEditor: ContestantNominationEditorFixture;
  /** The nominations view of an entity, opened by its URL. */
  contestantNominationsPage: ContestantNominationsPageFixture;
  /** The list of an entity's opinion questions: which questions it lists and how many of them are answered. */
  contestantQuestionsOverviewPage: ContestantQuestionsOverviewPageFixture;
  /** The navigation menu, with the group of the entity being edited. */
  navMenu: NavMenuFixture;
  /** The note a page shows when something on it cannot be edited, and the Contact support buttons of the page that is open. */
  notEditableNote: NotEditableNoteFixture;
  /** The width of the page that is open, against its viewport. */
  pageGeometry: PageGeometryFixture;
};

/** Playwright's `test`, extended with the page fixtures of the contestant-nominations spec. */
export const test = base.extend<ContestantNominationsFixtures>({
  contestantEntityHomePage: async ({ page }, use) => {
    await use(createContestantEntityHomePage(page, new SupabaseAdminClient()));
  },
  contestantEntityPages: async ({ page }, use) => {
    await use(createContestantEntityPages(page, new SupabaseAdminClient()));
  },
  contestantHomePage: async ({ page }, use) => {
    await use(createContestantHomePage(page));
  },
  contestantNominationEditor: async ({ page }, use) => {
    await use(createContestantNominationEditor(page, new SupabaseAdminClient()));
  },
  contestantNominationsPage: async ({ page }, use) => {
    await use(createContestantNominationsPage(page, new SupabaseAdminClient()));
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
 * @returns The entity-pages, home, nomination-editor and nominations fixtures of that page.
 */
export function contestantNominationsPagesOf(page: Page): {
  contestantEntityPages: ContestantEntityPagesFixture;
  contestantHomePage: ContestantHomePageFixture;
  contestantNominationEditor: ContestantNominationEditorFixture;
  contestantNominationsPage: ContestantNominationsPageFixture;
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
    contestantNominationsPage: createContestantNominationsPage(page, new SupabaseAdminClient())
  };
}

/** What an entity's nominations are put into: none at all, or exactly the rows the template seeds for it. */
export type NominationsState = 'none' | 'seeded';

/** What a nomination a state step adds stands under: another nomination of the dataset, or a party the entity's editor typed the name of. */
export type AddedNominationParent = { kind: 'nomination'; externalId: string } | { kind: 'other'; name: string };

/** A nomination `addNomination` writes. */
export interface AddedNomination {
  /** The row's `external_id`, under the dataset's prefix and not one of the seeded rows'. */
  externalId: string;
  /** Whether an administrator has confirmed it. A nomination with a typed party name cannot be confirmed. */
  confirmed?: boolean;
  /** Its election symbol. */
  electionSymbol?: string;
  /** What it stands under. Without one it stands under nothing. */
  parent?: AddedNominationParent;
  /** The round of the election it is for. Without one it is for the round every nomination of the dataset is seeded for. */
  electionRound?: number;
}

/** Which of the dataset's questions an entity's stored answers hold. */
export interface AnswersState {
  /** Whether the required info question is answered. */
  requiredInfo: boolean;
  /** The opinion questions answered, by `external_id`. */
  opinions: ReadonlyArray<string>;
}

/** A nomination as the database holds it. */
export interface StoredNomination {
  /** The row's `external_id`, or `null` for a row the application wrote. */
  externalId: string | null;
  /** The election and constituency it is in. */
  contest: NominationContestTarget;
  /** Its election symbol, or `null`. */
  electionSymbol: string | null;
  /** Whether an administrator has confirmed it. */
  confirmed: boolean;
  /** The `external_id` of the entity whose nomination it stands under, or `null` when it stands under none. */
  parentEntityExternalId: string | null;
  /** The party name its editor typed, or `null`. */
  requestedParent: string | null;
}

type Row = Record<string, unknown>;

/** The table of an entity type and the column of `nominations` that refers to it. */
const TABLES = Object.freeze({
  candidate: { table: 'candidates', nominationColumn: 'candidate_id' },
  organization: { table: 'organizations', nominationColumn: 'organization_id' },
  alliance: { table: 'alliances', nominationColumn: 'alliance_id' }
});

/** The key of a nomination's custom data that holds a party name its editor typed. */
const REQUESTED_PARENT_KEY = 'requestedParentOrganization';

/** One nomination row in the form the import reads it. */
interface ImportedNomination {
  externalId: string;
  entity: NominationEntityTarget;
  contest: NominationContestTarget;
  confirmed: boolean;
  sortOrder?: number;
  electionSymbol?: string;
  parentExternalId?: string;
  requestedParent?: string;
  electionRound?: number;
}

/**
 * Run a read or a write and name the step in what it throws.
 * @throws With the step's name, what was attempted and the cause.
 */
async function attempt<TResult>(step: string, what: string, action: () => Promise<TResult>): Promise<TResult> {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${step}: ${what} failed: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error
    });
  }
}

/**
 * The rows of a table of the suite's project that match the filters.
 * @throws If the read fails.
 */
async function readRows(
  admin: SupabaseAdminClient,
  step: string,
  table: string,
  filters: Record<string, unknown>
): Promise<Array<Row>> {
  const found = await admin.findData(table, filters);
  if (found.type !== 'success') throw new Error(`${step}: reading ${table} failed: ${found.cause}`);
  return found.data ?? [];
}

/**
 * @throws If the entity is not one of the dataset's.
 */
function assertEntityOfDataset(step: string, entity: NominationEntityTarget): void {
  const known = NOMINATION_ENTITIES.some(
    (candidate) => candidate.entityType === entity.entityType && candidate.externalId === entity.externalId
  );
  if (!known) {
    throw new Error(
      `${step}: the ${entity.entityType} ${entity.externalId} is not an entity of the contestant-nominations dataset`
    );
  }
}

/**
 * @throws If the election is not one of the dataset's.
 */
function assertElectionOfDataset(step: string, electionExternalId: string): void {
  if (!Object.hasOwn(SEEDED_ELECTION_TYPES, electionExternalId)) {
    throw new Error(`${step}: ${electionExternalId} is not an election of the contestant-nominations dataset`);
  }
}

/**
 * The row of an entity of the dataset.
 * @throws If the entity is not of the dataset, or if its row is not found.
 */
async function entityRowOf(admin: SupabaseAdminClient, step: string, entity: NominationEntityTarget): Promise<Row> {
  assertEntityOfDataset(step, entity);
  const rows = await readRows(admin, step, TABLES[entity.entityType].table, {
    external_id: { $eq: entity.externalId }
  });
  if (rows.length !== 1) throw new Error(`${step}: the ${entity.entityType} ${entity.externalId} was not found`);
  return rows[0];
}

/**
 * The row of an election of the dataset.
 * @throws If the election is not of the dataset, or if its row is not found.
 */
async function electionRowOf(admin: SupabaseAdminClient, step: string, electionExternalId: string): Promise<Row> {
  assertElectionOfDataset(step, electionExternalId);
  const rows = await readRows(admin, step, 'elections', { external_id: { $eq: electionExternalId } });
  if (rows.length !== 1) throw new Error(`${step}: the election ${electionExternalId} was not found`);
  return rows[0];
}

/**
 * Every nomination row of an entity.
 */
async function nominationRowsOf(
  admin: SupabaseAdminClient,
  step: string,
  entity: NominationEntityTarget,
  entityId: string
): Promise<Array<Row>> {
  return readRows(admin, step, 'nominations', {
    [TABLES[entity.entityType].nominationColumn]: { $eq: entityId }
  });
}

/**
 * Delete nominations by id, with every nomination that stands under one of them, however deep. A nomination is deleted only once nothing stands under it any more.
 * @param admin - A service-role client of the suite's project.
 * @param step - The name of the state step that deletes, for the message of what it throws.
 * @param nominationIds - The ids of the nominations to delete.
 * @throws If a read or a delete fails, or if a delete removes another number of rows than it named.
 */
export async function deleteNominationsWithDescendants(
  admin: SupabaseAdminClient,
  step: string,
  nominationIds: ReadonlyArray<string>
): Promise<void> {
  // Each nomination to delete, and the nomination it stands under when that one is deleted too.
  const parentOf = new Map<string, string | null>();
  let frontier = [...new Set(nominationIds)];
  while (frontier.length) {
    for (const id of frontier) if (!parentOf.has(id)) parentOf.set(id, null);
    const children = await readRows(admin, step, 'nominations', { parent_nomination_id: { $in: frontier } });
    const next: Array<string> = [];
    for (const child of children) {
      const id = String(child.id);
      if (!parentOf.has(id)) next.push(id);
      parentOf.set(id, String(child.parent_nomination_id));
    }
    frontier = next;
  }

  while (parentOf.size) {
    const stoodUnder = new Set([...parentOf.values()].filter((id) => id !== null));
    const leaves = [...parentOf.keys()].filter((id) => !stoodUnder.has(id));
    if (!leaves.length) throw new Error(`${step}: the nominations to delete stand under one another in a circle`);
    const result = await attempt(step, 'deleting nominations', () =>
      admin.bulkDelete({ nominations: { ids: leaves } })
    );
    const deleted = (result.nominations as { deleted?: number } | undefined)?.deleted;
    if (deleted !== leaves.length) {
      throw new Error(`${step}: ${leaves.length} nomination(s) were to be deleted and ${deleted} were`);
    }
    for (const id of leaves) parentOf.delete(id);
  }
}

/**
 * Write nominations through the import, each whole: a member that is not given is stored as empty.
 * @throws If the import fails, which it does for a row the election's type refuses.
 */
async function importNominations(
  admin: SupabaseAdminClient,
  step: string,
  projectId: unknown,
  nominations: ReadonlyArray<ImportedNomination>
): Promise<void> {
  if (typeof projectId !== 'string') throw new Error(`${step}: the project of the dataset could not be read`);
  await attempt(step, 'importing nominations', () =>
    admin.bulkImport({
      nominations: nominations.map((nomination) => ({
        external_id: nomination.externalId,
        project_id: projectId,
        [nomination.entity.entityType]: { external_id: nomination.entity.externalId },
        election: { external_id: nomination.contest.electionExternalId },
        constituency: { external_id: nomination.contest.constituencyExternalId },
        election_round: nomination.electionRound ?? NOMINATION_ELECTION_ROUND,
        election_symbol: nomination.electionSymbol ?? null,
        parent_nomination: nomination.parentExternalId ? { external_id: nomination.parentExternalId } : null,
        custom_data: nomination.requestedParent ? { [REQUESTED_PARENT_KEY]: nomination.requestedParent } : null,
        sort_order: nomination.sortOrder ?? null,
        confirmed: nomination.confirmed
      }))
    })
  );
}

/**
 * Give an entity of the dataset no nomination, or exactly the nominations the template seeds for it, as an administrator would.
 *
 * `none` deletes every nomination of the entity, and first every nomination that stands under one of them: removing a party's nominations removes those of the candidates listed under it.
 *
 * `seeded` deletes every nomination of the entity that is not one of its seeded rows, with what stands under it, and then writes the seeded rows again whole: each is confirmed, with its seeded symbol, order and parent, and no typed party name. A seeded row that stands under another entity's seeded nomination needs that nomination: it is written as seeded when it is missing and left as it is otherwise. An entity that is seeded with no nomination ends with none.
 *
 * @param entity - An entity of the dataset.
 * @param state - The state the entity's nominations are put into.
 * @throws If the entity is not of the dataset, if a read or a write fails, or if an election's type as it is now refuses a seeded row.
 */
export async function setNominations(entity: NominationEntityTarget, state: NominationsState): Promise<void> {
  const step = 'setNominations';
  const admin = new SupabaseAdminClient();
  const owner = await entityRowOf(admin, step, entity);
  const rows = await nominationRowsOf(admin, step, entity, String(owner.id));

  const seeded =
    state === 'seeded' ? SEEDED_NOMINATIONS.filter((row) => row.entity.externalId === entity.externalId) : [];
  const kept = new Set(seeded.map((row) => row.externalId));
  const removed = rows.filter((row) => typeof row.external_id !== 'string' || !kept.has(row.external_id));
  if (removed.length) {
    await deleteNominationsWithDescendants(
      admin,
      step,
      removed.map((row) => String(row.id))
    );
  }
  if (!seeded.length) return;

  const parentExternalIds = seeded.flatMap((row) => (row.parentExternalId ? [row.parentExternalId] : []));
  const present = parentExternalIds.length
    ? await readRows(admin, step, 'nominations', { external_id: { $in: parentExternalIds } })
    : [];
  const missingParents = SEEDED_NOMINATIONS.filter(
    (row) =>
      parentExternalIds.includes(row.externalId) && !present.some((found) => found.external_id === row.externalId)
  );

  await importNominations(
    admin,
    step,
    owner.project_id,
    [...missingParents, ...seeded].map((row) => ({ ...row, confirmed: true }))
  );
}

/**
 * Give an entity of the dataset one more nomination, as an administrator would: a second nomination in an election, a nomination with a typed party name, an unconfirmed one, one for another round of its election.
 *
 * The row is written through the import under the external id given, so the dataset's teardown removes it, and `setNominations` removes it with the entity's other rows that are not seeded. Written again under the same external id, it is replaced whole.
 *
 * @param entity - An entity of the dataset.
 * @param contest - The election and constituency of the dataset the nomination is in.
 * @param nomination - The row's external id, and its confirmation, symbol, parent and election round when it has them.
 * @throws If the entity, the contest or the external id is not the dataset's, if the external id is a seeded row's, if a nomination with a typed party name is to be confirmed, or if the write fails, which it does for a row the election's type refuses.
 */
export async function addNomination(
  entity: NominationEntityTarget,
  contest: NominationContestTarget,
  nomination: AddedNomination
): Promise<void> {
  const step = 'addNomination';
  const admin = new SupabaseAdminClient();
  const owner = await entityRowOf(admin, step, entity);
  assertElectionOfDataset(step, contest.electionExternalId);
  if (!contest.constituencyExternalId.startsWith(CONTESTANT_NOMINATIONS_PREFIX)) {
    throw new Error(`${step}: ${contest.constituencyExternalId} is not a constituency of the dataset`);
  }
  if (!nomination.externalId.startsWith(CONTESTANT_NOMINATIONS_PREFIX)) {
    throw new Error(`${step}: the external id ${nomination.externalId} is not under the dataset's prefix`);
  }
  if (SEEDED_NOMINATIONS.some((row) => row.externalId === nomination.externalId)) {
    throw new Error(`${step}: ${nomination.externalId} is a seeded nomination, which setNominations writes`);
  }
  const confirmed = nomination.confirmed ?? false;
  if (confirmed && nomination.parent?.kind === 'other') {
    throw new Error(`${step}: a nomination with a typed party name cannot be confirmed`);
  }

  await importNominations(admin, step, owner.project_id, [
    {
      externalId: nomination.externalId,
      entity,
      contest,
      confirmed,
      electionSymbol: nomination.electionSymbol,
      parentExternalId: nomination.parent?.kind === 'nomination' ? nomination.parent.externalId : undefined,
      requestedParent: nomination.parent?.kind === 'other' ? nomination.parent.name : undefined,
      electionRound: nomination.electionRound
    }
  ]);
}

/**
 * Delete every nomination the application wrote for an entity of the dataset: the rows of the dataset's entities that carry no external id, which a delete by the dataset's prefix does not name.
 *
 * A nomination that stands under one of them is deleted first, whatever it carries, since it cannot outlive the row it stands under. An entity that is no longer in the database has no row to delete, so the step also passes once the dataset itself is gone.
 *
 * @throws If a read or a delete fails.
 */
export async function clearWrittenNominations(): Promise<void> {
  const step = 'clearWrittenNominations';
  const admin = new SupabaseAdminClient();
  const written: Array<string> = [];

  for (const entityType of ['candidate', 'organization', 'alliance'] as const) {
    const externalIds = NOMINATION_ENTITIES.filter((entity) => entity.entityType === entityType).map(
      (entity) => entity.externalId
    );
    const entities = await readRows(admin, step, TABLES[entityType].table, { external_id: { $in: externalIds } });
    if (!entities.length) continue;
    const rows = await readRows(admin, step, 'nominations', {
      [TABLES[entityType].nominationColumn]: { $in: entities.map((entity) => String(entity.id)) }
    });
    written.push(...rows.filter((row) => row.external_id == null).map((row) => String(row.id)));
  }

  if (written.length) await deleteNominationsWithDescendants(admin, step, written);
}

/**
 * Lock or unlock the nominations of every entity of the suite's project, as an administrator would: the one setting `access.nominationsLocked` is written and no other.
 *
 * A test that locks the nominations unlocks them in a `finally`, because the setting is the project's and every later test reads it. The step after a flip is a full page load.
 *
 * @param on - Whether nominations are locked.
 * @throws If the write fails.
 */
export async function setNominationsLocked(on: boolean): Promise<void> {
  await attempt('setNominationsLocked', 'writing the setting', () =>
    new SupabaseAdminClient().updateAppSettings({ access: { nominationsLocked: on } })
  );
}

/**
 * Lock or unlock the answers of every entity of the suite's project, as an administrator would: the one setting `access.answersLocked` is written and no other.
 *
 * A test that locks the answers unlocks them in a `finally`, because the setting is the project's and every later test reads it. The step after a flip is a full page load.
 *
 * @param on - Whether answers are locked.
 * @throws If the write fails.
 */
export async function setAnswersLocked(on: boolean): Promise<void> {
  await attempt('setAnswersLocked', 'writing the setting', () =>
    new SupabaseAdminClient().updateAppSettings({ access: { answersLocked: on } })
  );
}

/**
 * Turn the setting that takes the choice of elections away from a voter on or off, as an administrator would: the one setting `elections.disallowSelection` is written and no other.
 *
 * A test that turns it on turns it off in a `finally`, because the setting is the project's and every later test reads it. The step after a flip is a full page load.
 *
 * @param on - Whether the selection of elections is disallowed.
 * @throws If the write fails.
 */
export async function setElectionSelectionDisallowed(on: boolean): Promise<void> {
  await attempt('setElectionSelectionDisallowed', 'writing the setting', () =>
    new SupabaseAdminClient().updateAppSettings({ elections: { disallowSelection: on } })
  );
}

/**
 * Change the type of an election of the dataset, as an administrator would. Nothing else of the election is changed.
 *
 * A nomination stored under the old type is not checked again: it stays as it is, and only a later write of it is judged by the new type. The caller puts the seeded type back in a `finally`, because every later test reads it, and the step after a flip is a full page load.
 *
 * @param electionExternalId - The `external_id` of an election of the dataset.
 * @param type - The type the election is given.
 * @throws If the election is not of the dataset, or if a read or the write fails.
 */
export async function setElectionType(electionExternalId: string, type: ElectionTypeName): Promise<void> {
  const step = 'setElectionType';
  const admin = new SupabaseAdminClient();
  const election = await electionRowOf(admin, step, electionExternalId);
  await attempt(step, 'writing the type', () =>
    admin.update('elections', String(election.id), { election_type: type })
  );
}

/**
 * Confirm a party or an alliance of the dataset, or take its confirmation away, as an administrator would. Nothing else of the entity is changed.
 *
 * A test that changes a confirmation puts the seeded one back in a `finally`, because every later test reads it.
 *
 * @param entity - A party or an alliance of the dataset.
 * @param on - Whether the entity is confirmed.
 * @throws If the entity is not a party or an alliance of the dataset, or if a read or the write fails.
 */
export async function setEntityConfirmed(entity: NominationEntityTarget, on: boolean): Promise<void> {
  const step = 'setEntityConfirmed';
  if (entity.entityType !== 'organization' && entity.entityType !== 'alliance') {
    throw new Error(`${step}: ${entity.externalId} is neither a party nor an alliance`);
  }
  const admin = new SupabaseAdminClient();
  const row = await entityRowOf(admin, step, entity);
  await attempt(step, 'writing the confirmation', () =>
    admin.update(TABLES[entity.entityType].table, String(row.id), { confirmed: on })
  );
}

/**
 * Replace the stored answers of a candidate or a party of the dataset whole, as an administrator would: afterwards the entity holds exactly the answers `answers` names, and none to any other question.
 *
 * The required info question is answered with a text in the default locale. An opinion question is answered with the middle step of its scale and no open comment.
 *
 * @param entity - A candidate or a party of the dataset.
 * @param answers - Which of the dataset's questions are answered.
 * @throws If the entity is not a candidate or a party of the dataset, if an opinion question named is not the dataset's or is not found, or if the write fails.
 */
export async function setAnswers(entity: NominationEntityTarget, answers: AnswersState): Promise<void> {
  const step = 'setAnswers';
  if (entity.entityType !== 'candidate' && entity.entityType !== 'organization') {
    throw new Error(`${step}: ${entity.externalId} is neither a candidate nor a party`);
  }
  const foreign = answers.opinions.filter((externalId) => !OPINION_QUESTION_EXTERNAL_IDS.includes(externalId));
  if (foreign.length) throw new Error(`${step}: ${foreign.join(', ')} is not an opinion question of the dataset`);
  const admin = new SupabaseAdminClient();
  const row = await entityRowOf(admin, step, entity);

  const stored: Record<string, { value: unknown }> = {};
  if (answers.requiredInfo) {
    stored[await questionId(admin, step, REQUIRED_INFO_QUESTION_EXTERNAL_ID)] = {
      value: { en: 'An answer the test wrote.' }
    };
  }
  for (const externalId of answers.opinions) stored[await questionId(admin, step, externalId)] = { value: '3' };

  await attempt(step, 'writing the answers', () =>
    admin.update(TABLES[entity.entityType].table, String(row.id), { answers: stored })
  );
}

/**
 * The nominations the database holds for an entity of the dataset, in the order of their election, constituency and external id.
 *
 * @param entity - An entity of the dataset.
 * @throws If the entity is not of the dataset, or if a read fails.
 */
export async function nominationsOf(entity: NominationEntityTarget): Promise<Array<StoredNomination>> {
  const step = 'nominationsOf';
  const admin = new SupabaseAdminClient();
  const owner = await entityRowOf(admin, step, entity);
  const rows = await nominationRowsOf(admin, step, entity, String(owner.id));
  if (!rows.length) return [];

  const externalIdsById = async (table: string, ids: ReadonlyArray<unknown>): Promise<Map<string, string>> => {
    const wanted = [...new Set(ids.filter((id) => typeof id === 'string'))];
    const found = wanted.length ? await readRows(admin, step, table, { id: { $in: wanted } }) : [];
    return new Map(found.map((row) => [String(row.id), String(row.external_id)]));
  };
  const elections = await externalIdsById(
    'elections',
    rows.map((row) => row.election_id)
  );
  const constituencies = await externalIdsById(
    'constituencies',
    rows.map((row) => row.constituency_id)
  );

  const parentIds = [
    ...new Set(rows.flatMap((row) => (row.parent_nomination_id ? [String(row.parent_nomination_id)] : [])))
  ];
  const parents = parentIds.length ? await readRows(admin, step, 'nominations', { id: { $in: parentIds } }) : [];
  const organizations = await externalIdsById(
    'organizations',
    parents.map((row) => row.organization_id)
  );
  const alliances = await externalIdsById(
    'alliances',
    parents.map((row) => row.alliance_id)
  );
  const parentEntityOf = new Map(
    parents.map((row) => [
      String(row.id),
      organizations.get(String(row.organization_id)) ?? alliances.get(String(row.alliance_id)) ?? null
    ])
  );

  return rows
    .map((row) => {
      const requested = (row.custom_data as Record<string, unknown> | null)?.[REQUESTED_PARENT_KEY];
      return {
        externalId: typeof row.external_id === 'string' ? row.external_id : null,
        contest: {
          electionExternalId: elections.get(String(row.election_id)) ?? '',
          constituencyExternalId: constituencies.get(String(row.constituency_id)) ?? ''
        },
        electionSymbol: typeof row.election_symbol === 'string' ? row.election_symbol : null,
        confirmed: row.confirmed === true,
        parentEntityExternalId: row.parent_nomination_id
          ? (parentEntityOf.get(String(row.parent_nomination_id)) ?? null)
          : null,
        requestedParent: typeof requested === 'string' ? requested : null
      };
    })
    .sort((a, b) => orderKeyOf(a).localeCompare(orderKeyOf(b)));
}

/** What `nominationsOf` orders a nomination by: its election, its constituency and its external id. */
function orderKeyOf(nomination: StoredNomination): string {
  return [
    nomination.contest.electionExternalId,
    nomination.contest.constituencyExternalId,
    nomination.externalId ?? ''
  ].join('\n');
}

/**
 * The type the database holds for an election of the dataset.
 *
 * @param electionExternalId - The `external_id` of an election of the dataset.
 * @throws If the election is not of the dataset, or if the read fails.
 */
export async function electionTypeOf(electionExternalId: string): Promise<string> {
  const election = await electionRowOf(new SupabaseAdminClient(), 'electionTypeOf', electionExternalId);
  return String(election.election_type);
}

/**
 * Whether the database holds an entity of the dataset as confirmed.
 *
 * @param entity - An entity of the dataset.
 * @throws If the entity is not of the dataset, or if the read fails.
 */
export async function entityConfirmedOf(entity: NominationEntityTarget): Promise<boolean> {
  const row = await entityRowOf(new SupabaseAdminClient(), 'entityConfirmedOf', entity);
  return row.confirmed === true;
}

/**
 * The id of a question of the suite's project, by its external id.
 * @throws If the question is not found.
 */
async function questionId(admin: SupabaseAdminClient, step: string, externalId: string): Promise<string> {
  const rows = await readRows(admin, step, 'questions', { external_id: { $eq: externalId } });
  const id = rows[0]?.id;
  if (typeof id !== 'string') throw new Error(`${step}: the question ${externalId} was not found`);
  return id;
}
