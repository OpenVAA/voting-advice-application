/**
 * What the loads of an entity's nominations tree decide from, and the facts the nominations view and the nomination editor both rest on.
 *
 * Both functions take values a load has already read and neither makes a request. The data root built here is temporary: it serves the decision of the load that asked and is handed to no page, which reads the context's data root instead.
 *
 * Tested in `layout.test.ts`, through the load that calls both, and whether another nomination can be added in `nominationFacts.test.ts`.
 */

import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { admissibleElectionsOf, inReachNominationsOf, nominationsEditableOf } from '$lib/contestant/nominations';
import { mergeInitialAppSettings } from '$lib/utils/settings';
import type { DynamicSettings } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';
import type { DPDataType } from '$lib/api/base/dataTypes';
import type { EntityNomination } from '$lib/api/base/dataWriter.type';

/** What is known of an entity's nominations before any page of the nominations tree renders. */
export type NominationFacts = {
  /** Whether the entity's nominations may be edited: neither the nominations lock nor the answers lock is on. */
  editable: boolean;
  /** The ids of the elections that admit the entity's type, in the order the application lists elections. */
  admissibleElectionIds: Array<Id>;
  /** The ids of the entity's nominations the editor manages: those at their election's current round, in an election that admits the entity's type. */
  inReachNominationIds: Array<Id>;
  /** Whether another nomination can be added: the nominations may be edited, and an election that admits the entity's type holds no nomination of it that the editor manages. The editor chooses one constituency in each election, so an election the entity already stands in leaves nothing to add in it. */
  canAddAnother: boolean;
};

/** The members of the root load's data the selection is decided from. Each is the error itself when its read failed. */
export type RootSelectionData = {
  appSettingsData: DynamicSettings | Error;
  electionData: DPDataType['elections'] | Error;
  constituencyData: DPDataType['constituencies'] | Error;
};

/** The settings and the elections a load of the nominations tree decides from. */
export type SelectionData = {
  /** The settings the application context holds: the root load's settings merged over the build-time ones. */
  appSettings: AppSettings;
  /** A data root of the load's own, holding the root load's elections and constituencies. */
  dataRoot: DataRoot;
};

/**
 * The settings and a temporary data root, built from the root load's data.
 * @param rootData - The root load's settings, elections and constituencies.
 * @returns The two, or `undefined` when one of the three reads failed.
 */
export function selectionDataOf({
  appSettingsData,
  electionData,
  constituencyData
}: RootSelectionData): SelectionData | undefined {
  if (appSettingsData instanceof Error || electionData instanceof Error || constituencyData instanceof Error)
    return undefined;
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(electionData);
  dataRoot.provideConstituencyData(constituencyData);
  return { appSettings: mergeInitialAppSettings(staticSettings, dynamicSettings, appSettingsData), dataRoot };
}

/**
 * The facts of one entity's nominations.
 * @param selectionData - The settings and the data root that holds the elections.
 * @param entityType - The type of the entity.
 * @param nominations - The entity's nominations, as the entity-level load read them.
 * @returns A fresh object.
 */
export function nominationFactsOf({
  selectionData: { appSettings, dataRoot },
  entityType,
  nominations
}: {
  selectionData: SelectionData;
  entityType: EntityType;
  nominations: ReadonlyArray<EntityNomination>;
}): NominationFacts {
  const elections = dataRoot.elections;
  const editable = nominationsEditableOf({
    nominationsLocked: !!appSettings.access?.nominationsLocked,
    answersLocked: !!appSettings.access?.answersLocked
  });
  const admissibleElectionIds = admissibleElectionsOf(elections, entityType).map((election) => election.id);
  const inReach = inReachNominationsOf({ nominations, elections, entityType });
  const heldElectionIds = new Set(inReach.map((nomination) => nomination.electionId));
  return {
    editable,
    admissibleElectionIds,
    inReachNominationIds: inReach.map((nomination) => nomination.id),
    canAddAnother: editable && admissibleElectionIds.some((electionId) => !heldElectionIds.has(electionId))
  };
}
