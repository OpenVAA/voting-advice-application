import { Election } from '@openvaa/data';
import type { Id } from '@openvaa/core';
import type { DPDataType } from '$lib/api/base/dataTypes';

/**
 * Try to imply the `electionIds` in cases when they need not to be selected. The function can be called with either `Election` objects or just their data, so that it can be used in SSR as well.
 * @returns An array of `Id`s if they can be implied, `undefined` otherwise.
 */
export function getImpliedElectionIds({
  appSettings,
  elections
}: {
  appSettings: AppSettings;
  elections: Array<Election> | DPDataType['elections'];
}): Array<Id> | undefined {
  if (appSettings.elections?.disallowSelection || elections.length === 1) return elections.map((e) => e.id);
  return undefined;
}

/**
 * Try to imply the `constituencyIds` in cases when they need not to be selected. The function can be called with either just the `Election` objects or their and constituencies’ data, so that it can be used in SSR as well.
 * @returns An array of `Id`s if they can be implied, `undefined` otherwise.
 */
export function getImpliedConstituencyIds({
  elections,
  constituencies
}:
  | {
      elections: Array<Election>;
      constituencies?: never;
    }
  | {
      elections: DPDataType['elections'];
      constituencies: DPDataType['constituencies'];
    }): Array<Id> | undefined {
  const ids = new Array<Id>();
  // To implie the constituencyIds, all elections must have a single constituency
  for (const election of elections) {
    // A proper Election object
    if (election instanceof Election) {
      const constituency = election.singleConstituency;
      if (!constituency) return undefined;
      ids.push(constituency.id);
      // With ElectionData, we need to be more circumspect
    } else {
      if (election.constituencyGroupIds.length !== 1) return undefined;
      const group = constituencies?.groups.find((g) => g.id === election.constituencyGroupIds[0]);
      if (!group) throw new Error(`Constituency group not found: ${election.constituencyGroupIds[0]}`);
      if (group.constituencyIds.length !== 1) return undefined;
      ids.push(group.constituencyIds[0]);
    }
  }
  return ids;
}
