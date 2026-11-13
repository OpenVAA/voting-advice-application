/**
 * The order of the election and constituency selection: which step an address leads to, which elections follow a chosen constituency, whether one constituency group is picked alone, and which of the chosen constituencies an election takes.
 *
 * WHO MAY CALL IT: the loads and pages of a selection of elections and constituencies — the Voter App's and the Contestant App's. Both ask the same functions and differ only in the values they hand over (see `SelectionInput`), so neither holds a rule of its own.
 *
 * CALLER CONTRACT: every function is handed a data root and values, never a context. Inside a reactive scope the caller reads the context's accessors in its own tracking scope and hands the values over. Every function is pure and returns fresh objects.
 *
 * What follows the selection is the caller's. An outcome names a step of the selection or says that nothing is left to choose; the caller maps it to its own routes and parameter names, and carries along whatever else its address holds.
 *
 * An id from the caller's address counts only when it names something: an election id that is not among the elections on offer, and a constituency id the data root does not hold, are left out, and a list that is then empty is no choice.
 *
 * Tested in `selectionOrder.test.ts`.
 */

import { getImpliedConstituencyIds, getImpliedElectionIds } from './impliedParams';
import type { Id } from '@openvaa/core';
import type { Constituency, ConstituencyGroup, DataRoot, Election } from '@openvaa/data';

/** A step of the selection. */
export type SelectionStep = 'elections' | 'constituencies';

/**
 * What the address of a step does.
 *
 * - `show`: the step is shown.
 * - `goto`: the other step is to be chosen first. `electionIds` holds the elections implied on the way, when there are any, for the caller to pass on.
 * - `done`: nothing is left to choose. `electionIds` and `constituencyIds` hold the selection as chosen or implied, each id once. A caller whose address already holds the selection may leave them unread.
 */
export type SelectionOutcome =
  | { action: 'show' }
  | { action: 'goto'; step: SelectionStep; electionIds?: Array<Id> }
  | { action: 'done'; electionIds?: Array<Id>; constituencyIds?: Array<Id> };

/**
 * What an outcome is decided from.
 *
 * The Voter App asks with `elections` absent, `honourDisallowSelection: true`, `implyWithinChosenConstituencies: false` and `skipWhenFullyImplied: false`. The Contestant App asks with the elections the entity may stand in, `false`, `true` and `true`.
 */
export type SelectionInput = {
  /** The data root that holds the elections and the constituencies. */
  dataRoot: DataRoot;
  /** The elections on offer, each an election of `dataRoot`. Every election of `dataRoot` when absent. */
  elections?: Array<Election>;
  /** The application settings. `elections.startFromConstituencyGroup` and `elections.disallowSelection` are read. */
  appSettings: AppSettings;
  /** Whether `elections.disallowSelection` implies every election on offer. When `false`, only a single election is implied. */
  honourDisallowSelection: boolean;
  /** Whether, while a constituency group comes first, a single election held in the chosen constituencies counts as implied. When `false`, the election step is shown for it. */
  implyWithinChosenConstituencies: boolean;
  /** Whether a single election on offer that has a single constituency is done at once, before `elections.startFromConstituencyGroup` is read. */
  skipWhenFullyImplied: boolean;
  /** The election ids the caller's address holds. */
  electionIds?: Array<Id>;
  /** The constituency ids the caller's address holds. */
  constituencyIds?: Array<Id>;
};

/**
 * What the address of the election step does.
 *
 * When `skipWhenFullyImplied` is set and the one election on offer has one constituency: `done` with that pair. Otherwise:
 *
 * | `startFromConstituencyGroup` | Election    | Constituency | Outcome                                               |
 * | ---------------------------- | ----------- | ------------ | ----------------------------------------------------- |
 * | Set                          | Implied     | Chosen       | `done`, with the implied elections                    |
 * | Set                          | Not implied | Chosen       | `show`                                                |
 * | Set                          | Any         | Not chosen   | `goto` the constituencies                             |
 * | Not set                      | Implied     | Any          | `goto` the constituencies, with the implied elections |
 * | Not set                      | Not implied | Any          | `show`                                                |
 *
 * An election is implied when it is the only one considered, or when `honourDisallowSelection` is set and the settings disallow the selection, which implies every election considered. The elections considered are those on offer; while a constituency group comes first and `implyWithinChosenConstituencies` is set, they are those of them held in the chosen constituencies. The election ids of the address are not read: an election chosen earlier is shown as chosen by the caller's page.
 *
 * @param input - The data root, the settings, the caller's three choices and the ids of its address.
 * @returns The outcome.
 */
export function electionsStepOutcome(input: SelectionInput): SelectionOutcome {
  const { appSettings, dataRoot, honourDisallowSelection } = input;
  const elections = electionsOnOffer(input);

  const impliedPair = input.skipWhenFullyImplied ? fullyImpliedPair(elections) : undefined;
  if (impliedPair) return { action: 'done', ...impliedPair };

  if (appSettings.elections?.startFromConstituencyGroup) {
    const constituencies = chosenConstituencies(input);
    if (!constituencies.length) return { action: 'goto', step: 'constituencies' };
    const electionIds = getImpliedElectionIds({
      appSettings,
      dataRoot,
      elections: input.implyWithinChosenConstituencies ? electionsHeldIn({ elections, constituencies }) : elections,
      honourDisallowSelection
    });
    return electionIds
      ? { action: 'done', electionIds, constituencyIds: constituencies.map((c) => c.id) }
      : { action: 'show' };
  }

  const electionIds = getImpliedElectionIds({ appSettings, dataRoot, elections, honourDisallowSelection });
  return electionIds ? { action: 'goto', step: 'constituencies', electionIds } : { action: 'show' };
}

/**
 * What the address of the constituency step does.
 *
 * When `skipWhenFullyImplied` is set and the one election on offer has one constituency: `done` with that pair. Otherwise:
 *
 * | `startFromConstituencyGroup` | Election               | Constituency | Outcome              |
 * | ---------------------------- | ---------------------- | ------------ | -------------------- |
 * | Set                          | Any                    | Any          | `show`               |
 * | Not set                      | Not chosen nor implied | Any          | `goto` the elections |
 * | Not set                      | Chosen or implied      | Implied      | `done`               |
 * | Not set                      | Chosen or implied      | Not implied  | `show`               |
 *
 * An election is implied when it is the only one on offer, or when `honourDisallowSelection` is set and the settings disallow the selection, which implies every election on offer. The constituencies are implied when each of the chosen or implied elections has a single constituency. The constituency ids of the address are not read: a constituency chosen earlier is shown as chosen by the caller's page.
 *
 * @param input - The data root, the settings, the caller's three choices and the ids of its address.
 * @returns The outcome.
 */
export function constituenciesStepOutcome(input: SelectionInput): SelectionOutcome {
  const { appSettings, dataRoot, honourDisallowSelection } = input;
  const elections = electionsOnOffer(input);

  const impliedPair = input.skipWhenFullyImplied ? fullyImpliedPair(elections) : undefined;
  if (impliedPair) return { action: 'done', ...impliedPair };

  if (appSettings.elections?.startFromConstituencyGroup) return { action: 'show' };

  const chosen = chosenElectionIds(input, elections);
  const electionIds = chosen.length
    ? chosen
    : getImpliedElectionIds({ appSettings, dataRoot, elections, honourDisallowSelection });
  if (!electionIds) return { action: 'goto', step: 'elections' };

  const constituencyIds = getImpliedConstituencyIds({ dataRoot, selectedElectionIds: electionIds });
  return constituencyIds
    ? { action: 'done', electionIds, constituencyIds: [...new Set(constituencyIds)] }
    : { action: 'show' };
}

/**
 * The elections held in the constituencies given: those with an applicable constituency among them. This is the list of the election step while a constituency group comes first.
 *
 * `Election.getApplicableConstituency` throws when more than one of the constituencies matches the election's groups, e.g. a municipality and its parent region for an election whose groups include both regions and municipalities. Such an election matches something in the selection, so it counts as held.
 *
 * @param elections - The elections to choose among.
 * @param constituencies - The chosen constituencies.
 * @returns The elections held there, in the order given.
 */
export function electionsHeldIn({
  elections,
  constituencies
}: {
  elections: Array<Election>;
  constituencies: Array<Constituency>;
}): Array<Election> {
  return elections.filter((election) => {
    try {
      return !!election.getApplicableConstituency(constituencies);
    } catch {
      return true;
    }
  });
}

/**
 * The constituency group that is picked alone, as one selector for every election, instead of one selector per election: the group `elections.startFromConstituencyGroup` names.
 *
 * The group is searched for among those given and not fetched by id from a data root, which throws for an id it does not hold: before the constituency data is provided the answer is `undefined`, and a reactive caller gets the group when it asks again.
 *
 * @param appSettings - The application settings.
 * @param constituencyGroups - The constituency groups of the data root.
 * @returns The group, or `undefined` when the settings name none or the group is not among those given.
 */
export function usesSingleConstituencyGroup({
  appSettings,
  constituencyGroups
}: {
  appSettings: AppSettings;
  constituencyGroups: Array<ConstituencyGroup>;
}): ConstituencyGroup | undefined {
  const id = appSettings.elections?.startFromConstituencyGroup;
  if (!id) return undefined;
  return constituencyGroups.find((group) => group.id === id);
}

/**
 * The one constituency an election takes from those given: among the constituencies that are in one of the election's groups, the one whose group has the fewest constituencies, and the first of them when several groups are of that size. A caller prefills an election's selector with it.
 *
 * Unlike `Election.getApplicableConstituency`, it does not throw when several of the constituencies are in the election's groups, as when two elections share a group and a different member was chosen for each, or when a constituency is given together with its parent.
 *
 * @param election - The election.
 * @param constituencies - The chosen constituencies.
 * @returns The constituency, or `undefined` when none of those given is in the election's groups.
 */
export function mostSpecificConstituency({
  election,
  constituencies
}: {
  election: Election;
  constituencies: Array<Constituency>;
}): Constituency | undefined {
  const groups = election.constituencyGroups;
  let best: { constituency: Constituency; groupSize: number } | undefined;
  for (const constituency of constituencies) {
    const group = groups.find((g) => g.data.constituencyIds.includes(constituency.id));
    if (!group) continue;
    const groupSize = group.constituencies.length;
    if (!best || groupSize < best.groupSize) best = { constituency, groupSize };
  }
  return best?.constituency;
}

/**
 * The elections an outcome is decided over.
 */
function electionsOnOffer({ dataRoot, elections }: Pick<SelectionInput, 'dataRoot' | 'elections'>): Array<Election> {
  return elections ?? dataRoot.elections;
}

/**
 * The election ids of the address that name an election on offer, each once, in the order of the address.
 */
function chosenElectionIds(
  { electionIds }: Pick<SelectionInput, 'electionIds'>,
  elections: Array<Election>
): Array<Id> {
  const onOffer = new Set(elections.map((e) => e.id));
  return [...new Set(electionIds ?? [])].filter((id) => onOffer.has(id));
}

/**
 * The constituencies of the data root that the address names, each once, in the order of the address.
 */
function chosenConstituencies({
  dataRoot,
  constituencyIds
}: Pick<SelectionInput, 'dataRoot' | 'constituencyIds'>): Array<Constituency> {
  if (!constituencyIds?.length) return [];
  const held = new Map(dataRoot.constituencies.map((c) => [c.id, c]));
  return [...new Set(constituencyIds)].map((id) => held.get(id)).filter((c): c is Constituency => c !== undefined);
}

/**
 * The one election and its one constituency, when a single election is given and it has a single constituency.
 */
function fullyImpliedPair(
  elections: Array<Election>
): { electionIds: Array<Id>; constituencyIds: Array<Id> } | undefined {
  if (elections.length !== 1) return undefined;
  const constituency = elections[0].singleConstituency;
  return constituency ? { electionIds: [elections[0].id], constituencyIds: [constituency.id] } : undefined;
}
