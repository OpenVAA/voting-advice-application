/**
 * @file The state steps the perm fixtures share.
 *
 * Consumed by the composition roots under `fixtures/contestant/perm-*.ts`, each of which hands these steps its own dataset's entities and elections and offers the result to its spec.
 *
 * Every step stands in for the administrator: it reads and writes with the service role, past the rules that bind an entity's own editor, and writes only what it is given. Each throws under the name of the step it runs for, so a failure names the step a test called.
 */

import { SupabaseAdminClient } from './supabaseAdminClient';
import type { ContestantEditing } from '@openvaa/app-shared';
import type { Enums } from '@openvaa/supabase-types';
import type { NominationEntityTarget } from './permContestantNominationsData';

/** A row of a table of the suite's project, as the service role reads it. */
export type Row = Record<string, unknown>;

/** The table of an entity type and the column of `nominations` that refers to it. */
export const ENTITY_TABLES = Object.freeze({
  candidate: { table: 'candidates', nominationColumn: 'candidate_id' },
  organization: { table: 'organizations', nominationColumn: 'organization_id' },
  alliance: { table: 'alliances', nominationColumn: 'alliance_id' }
});

/**
 * Run a read or a write and name the step in what it throws.
 * @param step - The name of the state step, for the message of what it throws.
 * @param what - What is attempted, for the same message.
 * @param action - The read or the write.
 * @returns What the action resolves to.
 * @throws With the step's name, what was attempted and the cause.
 */
export async function attempt<TResult>(step: string, what: string, action: () => Promise<TResult>): Promise<TResult> {
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
 * @param admin - A service-role client of the suite's project.
 * @param step - The name of the state step that reads, for the message of what it throws.
 * @param table - The table to read.
 * @param filters - The filters the rows match.
 * @throws If the read fails.
 */
export async function readRows(
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
 * The id of a question of the suite's project, by its external id.
 * @param admin - A service-role client of the suite's project.
 * @param step - The name of the state step that reads, for the message of what it throws.
 * @param externalId - The question's `external_id`.
 * @throws If the read fails or the question is not found.
 */
export async function questionId(admin: SupabaseAdminClient, step: string, externalId: string): Promise<string> {
  const rows = await readRows(admin, step, 'questions', { external_id: { $eq: externalId } });
  const id = rows[0]?.id;
  if (typeof id !== 'string') throw new Error(`${step}: the question ${externalId} was not found`);
  return id;
}

/**
 * Set how far the entities of the suite's project may edit their own data, as an administrator would: the one setting `access.contestantEditing` is written and no other. `'nominationsLocked'` locks the nominations alone, `'locked'` locks the answers, the profile and the nominations.
 *
 * A test that sets anything but `'open'` sets `'open'` again in a `finally`, because the setting is the project's and every later test reads it. The step after a change is a full page load.
 *
 * @param editing - The value written.
 * @throws If the write fails.
 */
export async function setContestantEditing(editing: ContestantEditing): Promise<void> {
  await attempt('setContestantEditing', 'writing the setting', () =>
    new SupabaseAdminClient().updateAppSettings({ access: { contestantEditing: editing } })
  );
}

/**
 * Change the nomination shape of an election of a dataset, as an administrator would. Nothing else of the election is changed.
 *
 * A nomination stored under the old shape is not checked again: it stays as it is, and only a later write of it is judged by the new shape. The caller puts the seeded shape back in a `finally`, because every later test reads it, and the step after a flip is a full page load.
 *
 * @param electionExternalId - The `external_id` of an election of the dataset.
 * @param shape - The nomination shape the election is given.
 * @param knownElections - The `external_id`s of the dataset's elections.
 * @throws If the election is not one of `knownElections`, or if a read or the write fails.
 */
export async function setNominationShape(
  electionExternalId: string,
  shape: Enums<'nomination_shape'>,
  knownElections: ReadonlyArray<string>
): Promise<void> {
  const step = 'setNominationShape';
  if (!knownElections.includes(electionExternalId)) {
    throw new Error(`${step}: ${electionExternalId} is not an election of the dataset`);
  }
  const admin = new SupabaseAdminClient();
  const elections = await readRows(admin, step, 'elections', { external_id: { $eq: electionExternalId } });
  if (elections.length !== 1) throw new Error(`${step}: the election ${electionExternalId} was not found`);
  await attempt(step, 'writing the shape', () =>
    admin.update('elections', String(elections[0].id), { nomination_shape: shape })
  );
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
 * Delete every nomination the application wrote for an entity of a dataset: the rows of the dataset's entities that carry no external id, which a delete by the dataset's prefix does not name.
 *
 * A nomination that stands under one of them is deleted first, whatever it carries, since it cannot outlive the row it stands under. An entity that is no longer in the database has no row to delete, so the step also passes once the dataset itself is gone.
 *
 * @param entities - Every entity of the dataset.
 * @throws If a read or a delete fails.
 */
export async function clearWrittenNominations(entities: ReadonlyArray<NominationEntityTarget>): Promise<void> {
  const step = 'clearWrittenNominations';
  const admin = new SupabaseAdminClient();
  const written: Array<string> = [];

  for (const entityType of ['candidate', 'organization', 'alliance'] as const) {
    const externalIds = entities
      .filter((entity) => entity.entityType === entityType)
      .map((entity) => entity.externalId);
    if (!externalIds.length) continue;
    const { table, nominationColumn } = ENTITY_TABLES[entityType];
    const rows = await readRows(admin, step, table, { external_id: { $in: externalIds } });
    if (!rows.length) continue;
    const nominations = await readRows(admin, step, 'nominations', {
      [nominationColumn]: { $in: rows.map((row) => String(row.id)) }
    });
    written.push(...nominations.filter((row) => row.external_id == null).map((row) => String(row.id)));
  }

  if (written.length) await deleteNominationsWithDescendants(admin, step, written);
}
