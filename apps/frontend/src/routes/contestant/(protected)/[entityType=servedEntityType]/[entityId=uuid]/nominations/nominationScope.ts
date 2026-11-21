/**
 * The facts the nominations view and the nomination editor both rest on, decided from the settings and the temporary data root of `selectionDataOf` in `$lib/routes`.
 *
 * The function takes values a load has already read and makes no request.
 *
 * Tested in `layout.test.ts`, through the load that calls it, and whether another nomination can be added in `nominationScope.test.ts`.
 */

import { CONTESTANT_EDITING, getContestantEditing } from '@openvaa/app-shared';
import { admissibleElectionsOf, nominationsEditableOf, writableNominationsOf } from '$lib/contestant/nominations';
import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';
import type { EntityNomination } from '$lib/api/base/dataWriter.type';
import type { SelectionData } from '$lib/routes';

/** What is known of an entity's nominations before any page of the nominations tree renders. */
export type NominationScope = {
  /** Whether the entity's nominations may be edited: neither the nominations lock nor the answers lock is on. */
  editable: boolean;
  /** The ids of the elections that admit the entity's type, in the order the application lists elections. */
  admissibleElectionIds: Array<Id>;
  /** The ids of the entity's nominations the editor manages: those the database marks writable. */
  writableNominationIds: Array<Id>;
  /** Whether another nomination can be added: the nominations may be edited, and an election that admits the entity's type holds no nomination of it that the editor manages. The editor chooses one constituency in each election, so an election the entity already stands in leaves nothing to add in it. */
  canAddAnother: boolean;
};

/**
 * The facts of one entity's nominations.
 * @param selectionData - The settings and the data root that holds the elections.
 * @param entityType - The type of the entity.
 * @param nominations - The entity's nominations, as the entity-level load read them.
 * @returns A fresh object.
 */
export function nominationScopeOf({
  selectionData: { appSettings, dataRoot },
  entityType,
  nominations
}: {
  selectionData: SelectionData;
  entityType: EntityType;
  nominations: ReadonlyArray<EntityNomination>;
}): NominationScope {
  const elections = dataRoot.elections;
  const editable = nominationsEditableOf({
    nominationsLocked: getContestantEditing(appSettings) !== CONTESTANT_EDITING.Open,
    answersLocked: getContestantEditing(appSettings) === CONTESTANT_EDITING.Locked
  });
  const admissibleElectionIds = admissibleElectionsOf(elections, entityType).map((election) => election.id);
  const writable = writableNominationsOf(nominations);
  const heldElectionIds = new Set(writable.map((nomination) => nomination.electionId));
  return {
    editable,
    admissibleElectionIds,
    writableNominationIds: writable.map((nomination) => nomination.id),
    canAddAnother: editable && admissibleElectionIds.some((electionId) => !heldElectionIds.has(electionId))
  };
}
