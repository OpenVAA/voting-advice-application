/**
 * The facts the nominations view and the nomination editor both rest on, decided from the settings and the temporary data root of `selectionDataOf` in `$lib/routes`.
 *
 * The function takes values a load has already read and makes no request.
 *
 * Tested in `layout.test.ts`, through the load that calls it, and whether another nomination can be added in `nominationScope.test.ts`.
 */

import { CONTESTANT_EDITING, getContestantEditing } from '@openvaa/app-shared';
import {
  admissibleElectionsOf,
  choosesSeveralConstituenciesOf,
  nominationsEditableOf,
  writableNominationsOf
} from '$lib/contestant/nominations';
import type { Id } from '@openvaa/core';
import type { Election, EntityType } from '@openvaa/data';
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
  /** Whether the editor lets the entity choose several constituencies in one election, as `choosesSeveralConstituenciesOf` answers for its type. */
  severalConstituencies: boolean;
  /** Whether another nomination can be added: the nominations may be edited, and an election that admits the entity's type has room for one. For an entity that chooses several constituencies in one election, that is an election and constituency in which it holds no nomination the editor manages. For any other entity, which chooses one constituency in each election, it is an election in which it holds none, since an election it already stands in leaves nothing to add in it. */
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
  const admissible = admissibleElectionsOf(elections, entityType);
  const writable = writableNominationsOf(nominations);
  const severalConstituencies = choosesSeveralConstituenciesOf(entityType);
  const hasRoom = severalConstituencies
    ? freeContestIn(writable)
    : (election: Election) => !writable.some((nomination) => nomination.electionId === election.id);
  return {
    editable,
    admissibleElectionIds: admissible.map((election) => election.id),
    writableNominationIds: writable.map((nomination) => nomination.id),
    severalConstituencies,
    canAddAnother: editable && admissible.some(hasRoom)
  };
}

/**
 * Whether an election has a constituency in which the entity holds none of the nominations given.
 * @param nominations - The entity's writable nominations.
 */
function freeContestIn(nominations: ReadonlyArray<EntityNomination>): (election: Election) => boolean {
  const held = new Set(nominations.map(({ electionId, constituencyId }) => `${electionId} ${constituencyId}`));
  return (election) =>
    election.constituencyGroups.some((group) =>
      group.data.constituencyIds.some((constituencyId) => !held.has(`${election.id} ${constituencyId}`))
    );
}
