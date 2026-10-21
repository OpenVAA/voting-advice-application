import type { Id } from '@openvaa/core';
import type { DataRoot, Election } from '@openvaa/data';

/**
 * Try to imply the `electionIds` in cases when they need not to be selected.
 * @param selectedConstituencyIds - If specified, only elections applicable to these constituencies will be considered.
 * @param elections - The elections to consider, each an election of `dataRoot`. Every election of `dataRoot` when absent.
 * @param honourDisallowSelection - Whether `appSettings.elections.disallowSelection` implies every election considered. `true` when absent; when `false`, only a single election is implied.
 * @returns An array of `Id`s if they can be implied, `undefined` otherwise.
 */
export function getImpliedElectionIds({
  appSettings,
  dataRoot,
  selectedConstituencyIds,
  elections = dataRoot.elections,
  honourDisallowSelection = true
}: {
  appSettings: AppSettings;
  dataRoot: DataRoot;
  selectedConstituencyIds?: Array<Id>;
  elections?: Array<Election>;
  honourDisallowSelection?: boolean;
}): Array<Id> | undefined {
  // Filter to applicable elections.
  // `getApplicableConstituency` throws when more than one of the passed constituencies match the election's groups, e.g. a municipality and its parent region for an election whose groups include both regions and municipalities. Such an election matches something in the selection, so the throw is treated as "applicable".
  if (selectedConstituencyIds?.length) {
    const constituencies = selectedConstituencyIds.map((id) => dataRoot.getConstituency(id));
    elections = elections.filter((e) => {
      try {
        return !!e.getApplicableConstituency(constituencies);
      } catch {
        return true;
      }
    });
  }
  // Elections can be implied if there is only one election or if the app settings disallow selection and the caller honours that setting
  if (elections.length === 1 || (honourDisallowSelection && appSettings.elections?.disallowSelection))
    return elections.map((e) => e.id);
  return undefined;
}

/**
 * Try to imply the `constituencyIds` in cases when they need not to be selected.
 * @param selectedElectionIds - If specified, only these elections will be considered.
 * @returns An array of `Id`s if they can be implied, `undefined` otherwise.
 */
export function getImpliedConstituencyIds({
  dataRoot,
  selectedElectionIds
}: {
  dataRoot: DataRoot;
  selectedElectionIds?: Array<Id>;
}): Array<Id> | undefined {
  const ids = new Array<Id>();
  const elections = selectedElectionIds?.length
    ? selectedElectionIds.map((id) => dataRoot.getElection(id))
    : dataRoot.elections;
  // To imply the constituencyIds, all elections must have a single constituency
  for (const election of elections) {
    const constituency = election.singleConstituency;
    if (!constituency) return undefined; // A non-single constituency election is included, so we cannot imply constituencyIds
    ids.push(constituency.id);
  }
  return ids;
}
