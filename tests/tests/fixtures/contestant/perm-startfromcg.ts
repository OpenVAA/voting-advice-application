/**
 * @file Composition root for the contestant tests of the start-from-constituency spec.
 *
 * Consumed by the contestant describe of `specs/perm/perm-startfromcg.spec.ts`: the editor of a candidate meeting the nomination editor's steps while a constituency group is chosen first, on the `perm-startfromcg` dataset. The voter tests of that file take nothing from here.
 *
 * Surface:
 *   - `test`   — Playwright test extended with the page fixtures the contestant tests speak in.
 *   - `expect` — re-exported from @playwright/test.
 *   - `chooseConstituencyGroupFirst`, `restoreConstituencyGroupFirst`, `removeCandidateNominations`, `clearWrittenNominations`, `setNominationShape` — the state steps.
 *
 * A contestant test's body holds no locator: a step it needs is a method of a fixture registered here.
 *
 * The state steps stand in for the administrator: each writes with the service role, past the rules that bind an entity's own editor, and writes only what it is given. They are plain functions and not fixtures, so that a hook and a teardown can call them. Each names the rows it writes by the dataset's own external ids, and each throws under its own name when a read or a write fails.
 *
 * A page that is already open does not follow a state step: the entity's nominations, the elections and the settings are read when a page is loaded, so the step after a state step is a full page load.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createContestantEntityHomePage } from './contestantEntityHomePage.fixture';
import { createContestantNominationEditor } from './contestantNominationEditor.fixture';
import { createContestantNominationsPage } from './contestantNominationsPage.fixture';
import {
  CANDIDATE_EDITOR,
  CANDIDATE_EXTERNAL_ID,
  FIRST_GROUP_EXTERNAL_ID,
  SEEDED_NOMINATION_SHAPES
} from '../../utils/permStartFromCgData';
import {
  attempt,
  clearWrittenNominations as clearWrittenNominationsOfEntities,
  deleteNominationsWithDescendants,
  readRows,
  setNominationShape as setElectionNominationShape
} from '../../utils/permStateSteps';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import type { Enums } from '@openvaa/supabase-types';
import type { Row } from '../../utils/permStateSteps';
import type { ContestantEntityHomePageFixture } from './contestantEntityHomePage.fixture';
import type { ContestantNominationEditorFixture } from './contestantNominationEditor.fixture';
import type { ContestantNominationsPageFixture } from './contestantNominationsPage.fixture';

type StartFromCgContestantFixtures = {
  /** The home of the entity the stored session's user edits. */
  contestantEntityHomePage: ContestantEntityHomePageFixture;
  /** The nomination editor of an entity: its election step, its constituency step and its details step. */
  contestantNominationEditor: ContestantNominationEditorFixture;
  /** The nominations view of an entity, opened by its URL. */
  contestantNominationsPage: ContestantNominationsPageFixture;
};

/** Playwright's `test`, extended with the page fixtures of the contestant tests of the start-from-constituency spec. */
export const test = base.extend<StartFromCgContestantFixtures>({
  contestantEntityHomePage: async ({ page }, use) => {
    await use(createContestantEntityHomePage(page, new SupabaseAdminClient()));
  },
  contestantNominationEditor: async ({ page }, use) => {
    await use(createContestantNominationEditor(page, new SupabaseAdminClient()));
  },
  contestantNominationsPage: async ({ page }, use) => {
    await use(createContestantNominationsPage(page, new SupabaseAdminClient()));
  }
});

export { expect };

/**
 * Name the dataset's group of municipalities in `elections.startFromConstituencyGroup`, as an administrator would, so that a constituency of that group is chosen before an election. No other setting is written.
 *
 * The setting is the project's and every later test reads it: the caller hands what this step returns to `restoreConstituencyGroupFirst` when its tests have run. The step after a flip is a full page load.
 *
 * @returns The id the setting held before, or `null` when it named no group.
 * @throws If the group is not found, or if a read or the write fails.
 */
export async function chooseConstituencyGroupFirst(): Promise<string | null> {
  const step = 'chooseConstituencyGroupFirst';
  const admin = new SupabaseAdminClient();
  const groups = await readRows(admin, step, 'constituency_groups', { external_id: { $eq: FIRST_GROUP_EXTERNAL_ID } });
  const groupId = groups[0]?.id;
  if (groups.length !== 1 || typeof groupId !== 'string') {
    throw new Error(`${step}: the constituency group ${FIRST_GROUP_EXTERNAL_ID} was not found`);
  }
  const settings = await attempt(step, 'reading the settings', () => admin.getAppSettings());
  const prior = (settings?.elections as { startFromConstituencyGroup?: unknown } | undefined)
    ?.startFromConstituencyGroup;
  await attempt(step, 'writing the setting', () =>
    admin.updateAppSettings({ elections: { startFromConstituencyGroup: groupId } })
  );
  return typeof prior === 'string' ? prior : null;
}

/**
 * Put `elections.startFromConstituencyGroup` back to what it held, as an administrator would. No other setting is written.
 *
 * @param prior - What `chooseConstituencyGroupFirst` returned.
 * @throws If the write fails.
 */
export async function restoreConstituencyGroupFirst(prior: string | null): Promise<void> {
  await attempt('restoreConstituencyGroupFirst', 'writing the setting', () =>
    new SupabaseAdminClient().updateAppSettings({ elections: { startFromConstituencyGroup: prior } })
  );
}

/**
 * Give the dataset's candidate no nomination, as an administrator would: every nomination of the candidate is deleted, the one the template seeds among them. Nothing writes the seeded one again, so the step is for tests that run after everything else that reads the dataset.
 *
 * @throws If a read or the delete fails.
 */
export async function removeCandidateNominations(): Promise<void> {
  const step = 'removeCandidateNominations';
  const admin = new SupabaseAdminClient();
  const rows = await candidateNominationRows(admin, step);
  if (rows.length) {
    await deleteNominationsWithDescendants(
      admin,
      step,
      rows.map((row) => String(row.id))
    );
  }
}

/**
 * Delete every nomination the application wrote for the dataset's candidate: its rows that carry no external id, which a delete by the dataset's prefix does not name.
 *
 * A candidate that is no longer in the database has no row to delete, so the step also passes once the dataset itself is gone.
 *
 * @throws If a read or the delete fails.
 */
export async function clearWrittenNominations(): Promise<void> {
  await clearWrittenNominationsOfEntities([CANDIDATE_EDITOR.grant]);
}

/**
 * Change the nomination shape of an election of the dataset, as an administrator would. Nothing else of the election is changed.
 *
 * A nomination stored under the old shape is not checked again: it stays as it is, and only a later write of it is judged by the new shape. The caller puts the seeded shape back in a `finally`, because every later test reads it, and the step after a flip is a full page load.
 *
 * @param electionExternalId - The `external_id` of an election of the dataset.
 * @param shape - The nomination shape the election is given.
 * @throws If the election is not of the dataset, or if a read or the write fails.
 */
export async function setNominationShape(electionExternalId: string, shape: Enums<'nomination_shape'>): Promise<void> {
  await setElectionNominationShape(electionExternalId, shape, Object.keys(SEEDED_NOMINATION_SHAPES));
}

/**
 * The nomination rows of the dataset's candidate. A candidate that is no longer in the database has none.
 * @throws If a read fails.
 */
async function candidateNominationRows(admin: SupabaseAdminClient, step: string): Promise<Array<Row>> {
  const candidates = await readRows(admin, step, 'candidates', { external_id: { $eq: CANDIDATE_EXTERNAL_ID } });
  if (!candidates.length) return [];
  return readRows(admin, step, 'nominations', { candidate_id: { $eq: String(candidates[0].id) } });
}
