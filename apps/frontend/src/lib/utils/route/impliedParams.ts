import type { Id } from '@openvaa/core';
import type { DataRoot } from '@openvaa/data';

/**
 * Try to imply the `electionIds` in cases when they need not to be selected.
 * @param selectedConstituencyIds - If specified, only elections applicable to these constituencies will be considered.
 * @returns An array of `Id`s if they can be implied, `undefined` otherwise.
 */
export function getImpliedElectionIds({
  appSettings,
  dataRoot,
  selectedConstituencyIds
}: {
  appSettings: AppSettings;
  dataRoot: DataRoot;
  selectedConstituencyIds?: Array<Id>;
}): Array<Id> | undefined {
  let elections = dataRoot.elections;
  // Filter to applicable elections.
  // `getApplicableConstituency` throws when more than one of the passed
  // constituencies match the election's groups (e.g. a municipality and its
  // parent region both end up in selectedConstituencyIds for an election
  // whose cgs include both Regions and Municipalities). Treat that throw as
  // "applicable" — the election clearly matches *something* in the
  // selection — so that variant-startfromcg's hierarchical implied flow
  // (variant-startfromcg.spec.ts:145) doesn't blow up the implied lookup.
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
  // Elections can be implied if there is only one election or if the app settings disallow selection
  if (elections.length === 1 || appSettings.elections?.disallowSelection) return elections.map((e) => e.id);
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
