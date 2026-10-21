/**
 * What the three steps of the nomination editor share: the selection a step's address carries, what the address of a step does with it, what a step starts from for an entity that has nominations, and where a step's Continue leads.
 *
 * The order of the steps is decided by the shared ordering module of `$lib/routes`, asked the Contestant App's way: over the elections that admit the entity's type, never implying an election from `elections.disallowSelection`, taking a single election held in the chosen constituencies as implied, and passing over both steps for a single election with a single constituency. This module maps the module's outcomes to the editor's three addresses and holds no ordering rule of its own.
 *
 * What the entity's nominations change is asked of `startingSelectionOf` and `constituencyChoiceOf` of `$lib/contestant/nominations`, and counted nowhere else: the elections that are chosen on arrival, the constituency that is selected on arrival, and the elections that have no constituency to choose because the entity holds several nominations in them. Such an election is left out of the question the ordering module is asked, and its nominations are kept as they are stored.
 *
 * WHO CALLS IT: the page loads of the three steps, with the temporary data root of `selectionDataOf`, and the pages of the three steps, with the values they read from the context in their own scope. Every function takes values and returns fresh ones.
 *
 * An id of an address counts only when it names an election that admits the entity's type, or a constituency of such an election or of the constituency group that is chosen first. Every other id is dropped before anything is decided, so nothing an address names is used or shown unmatched.
 *
 * Tested in `stepLoads.test.ts`.
 */

import qs from 'qs';
import { constituencyChoiceOf, startingSelectionOf } from '$lib/contestant/nominations';
import {
  buildRoute,
  constituenciesStepOutcome,
  electionsHeldIn,
  electionsStepOutcome,
  mostSpecificConstituency,
  NOMINATION_CONSTITUENCY_PARAM,
  NOMINATION_ELECTION_PARAM,
  usesSingleConstituencyGroup
} from '$lib/routes';
import { selectionDataOf } from '../nominationFacts';
import type { Id } from '@openvaa/core';
import type { Constituency, ConstituencyGroup, DataRoot, Election } from '@openvaa/data';
import type { NominationContest } from '$lib/api/base/dataWriter.type';
import type { NominationContestFacts } from '$lib/contestant/nominations';
import type { Route, SelectionInput } from '$lib/routes';
import type { NominationFacts, RootSelectionData } from '../nominationFacts';

/** A step of the editor. */
export type EditorStep = 'elections' | 'constituencies' | 'details';

/** The route key of each step. The election step's is the editor's entry. */
export const EDITOR_STEP_ROUTE = {
  elections: 'ContestantAppNominationElections',
  constituencies: 'ContestantAppNominationConstituencies',
  details: 'ContestantAppNominationDetails'
} as const satisfies Record<EditorStep, Route>;

/** The elections and constituencies chosen so far, as an address carries them from step to step. */
export type NominationSelection = {
  /** The ids of the chosen elections, each once. */
  electionIds: Array<Id>;
  /** The ids of the chosen constituencies, each once. */
  constituencyIds: Array<Id>;
};

/** A step and the selection its address is to carry. */
export type StepForward = {
  step: EditorStep;
  selection: NominationSelection;
};

/** The values every decision of a step is made from. */
export type StepFacts = {
  /** The application settings. */
  appSettings: AppSettings;
  /** The data root that holds the elections and the constituencies. */
  dataRoot: DataRoot;
  /** The elections that admit the entity's type, each an election of `dataRoot`, in the order they are offered. */
  admissible: Array<Election>;
  /** The selection, holding only ids that name something the entity may choose. */
  selection: NominationSelection;
  /** The entity's nominations in the editor's reach. */
  nominations: ReadonlyArray<NominationContestFacts>;
};

/** A nomination as a list of an entity's nominations holds it: its id and where it stands. */
export type IdentifiedNomination = NominationContestFacts & {
  /** The nomination's id. */
  id: Id;
};

/** What a step's page load reads of its parents' data. */
export type StepParentData = RootSelectionData & {
  /** The user-level gate that is pending, or `null`. */
  gate?: unknown;
  /** The facts of the entity's nominations, when they are known. */
  nominationFacts?: NominationFacts;
  /** The data of the entity the address names, with its nominations as the entity-level load read them. */
  contestantUserData?: { nominations?: ReadonlyArray<IdentifiedNomination> | null } | null;
};

/** What the constituency step is shown with, beside its selection. */
export type ConstituencyStepChoice = {
  /** The ids of the elections the selector is handed, in the order the elections are offered: the chosen elections that have a constituency to choose, and every admissible election while a constituency group is chosen first. */
  toChoose: Array<Id>;
  /** The ids of the chosen elections that have no selector because the entity holds several nominations in them, in the order the elections are offered. Empty while a constituency group is chosen first. */
  kept: Array<Id>;
  /** The id of the constituency to select on arrival, by the id of an election the selector is handed: the one the address names for it, and otherwise that of the entity's one nomination in it. */
  onArrival: Record<Id, Id>;
};

/** What the details step is shown with. */
export type DetailsStepContests = {
  /** One election and constituency for each chosen election that takes a constituency, in the order the elections are offered. */
  contests: Array<NominationContest>;
  /** The ids of the chosen elections whose nominations are kept as they are stored, in the order the elections are offered. */
  keptElectionIds: Array<Id>;
};

/**
 * A selection that holds nothing.
 * @returns A fresh object.
 */
export function emptySelection(): NominationSelection {
  return { electionIds: [], constituencyIds: [] };
}

/**
 * The selection an address carries in the editor's two search params, unmatched: each id once, in the address's order. A repeated param is read in both of its forms, `name=a&name=b` and `name[0]=a&name[1]=b`.
 * @param url - The address.
 * @returns A fresh selection.
 */
export function selectionOfAddress(url: URL): NominationSelection {
  const parsed = qs.parse(url.search.replace(/^\?/, ''));
  return {
    electionIds: idsOf(parsed[NOMINATION_ELECTION_PARAM]),
    constituencyIds: idsOf(parsed[NOMINATION_CONSTITUENCY_PARAM])
  };
}

/**
 * The selection as search params for a route builder: each list under the editor's own name, and no param for an empty list.
 * @param selection - The selection.
 * @returns A fresh object.
 */
export function selectionSearch({ electionIds, constituencyIds }: NominationSelection): Record<string, Array<string>> {
  return {
    ...(electionIds.length ? { [NOMINATION_ELECTION_PARAM]: [...electionIds] } : {}),
    ...(constituencyIds.length ? { [NOMINATION_CONSTITUENCY_PARAM]: [...constituencyIds] } : {})
  };
}

/**
 * The address of a step under an entity, carrying a selection.
 * @param forward - The step and the selection.
 * @param params - The two params that name the entity.
 * @param locale - The locale of the address.
 * @returns The address, built from the step's route key.
 */
export function stepAddress({
  forward: { step, selection },
  params,
  locale
}: {
  forward: StepForward;
  params: { entityType: string; entityId: string };
  locale: string;
}): string {
  return buildRoute({
    route: EDITOR_STEP_ROUTE[step],
    locale,
    entityType: params.entityType,
    entityId: params.entityId,
    ...selectionSearch(selection)
  });
}

/**
 * The nominations of an entity that the editor manages, among those a load read for it: those the facts name.
 * @param nominations - The entity's nominations, as the entity-level load read them.
 * @param facts - The facts of the entity's nominations.
 * @returns A fresh list, in the order given. Empty when either is not known.
 */
export function reachedNominationsOf<TNomination extends { id: Id }>(
  nominations: ReadonlyArray<TNomination> | null | undefined,
  facts: NominationFacts | undefined
): Array<TNomination> {
  if (!nominations || !facts) return [];
  const inReach = new Set(facts.inReachNominationIds);
  return nominations.filter((nomination) => inReach.has(nomination.id));
}

/**
 * The values a step's page load decides from: a temporary data root built from the root load's data, the elections the facts admit, the selection of the address with every id that names nothing admissible dropped, and the entity's nominations in the editor's reach.
 * @param parentData - The data of the step's parent loads.
 * @param url - The step's address.
 * @returns The values, or `undefined` while a gate is pending, while the facts are not known and when the root load's data could not be read: nothing is decided then.
 */
export function stepFactsOf({ parentData, url }: { parentData: StepParentData; url: URL }): StepFacts | undefined {
  if (parentData.gate !== null || !parentData.nominationFacts) return undefined;
  const selectionData = selectionDataOf(parentData);
  if (!selectionData) return undefined;
  const { appSettings, dataRoot } = selectionData;
  const admissibleIds = new Set(parentData.nominationFacts.admissibleElectionIds);
  const admissible = dataRoot.elections.filter((election) => admissibleIds.has(election.id));
  return {
    appSettings,
    dataRoot,
    admissible,
    selection: matchedSelection({ appSettings, dataRoot, admissible, selection: selectionOfAddress(url) }),
    nominations: reachedNominationsOf(parentData.contestantUserData?.nominations, parentData.nominationFacts)
  };
}

/**
 * A selection with every id dropped that names no election among those admissible and no constituency the entity may choose: one of an admissible election's groups, or of the group that is chosen first.
 * @param facts - The settings, the data root, the admissible elections and the selection as an address holds it.
 * @returns A fresh selection.
 */
export function matchedSelection({
  appSettings,
  dataRoot,
  admissible,
  selection
}: Omit<StepFacts, 'nominations'>): NominationSelection {
  const electionIds = new Set(admissible.map((election) => election.id));
  const groups = admissible.flatMap((election) => election.constituencyGroups);
  const first = usesSingleConstituencyGroup({ appSettings, constituencyGroups: dataRoot.constituencyGroups });
  if (first) groups.push(first);
  const constituencyIds = new Set(groups.flatMap((group) => group.constituencies.map((c) => c.id)));
  return {
    electionIds: selection.electionIds.filter((id) => electionIds.has(id)),
    constituencyIds: selection.constituencyIds.filter((id) => constituencyIds.has(id))
  };
}

/**
 * What the address of the election step, which is the editor's entry, does.
 * @param facts - The values the step decides from.
 * @returns The step the address forwards to, or `undefined` when the election step is shown.
 */
export function electionsAddressForward(facts: StepFacts): StepForward | undefined {
  const outcome = electionsStepOutcome(selectionInputOf(facts));
  if (outcome.action === 'show') return undefined;
  if (outcome.action === 'done')
    return {
      step: 'details',
      selection: { electionIds: outcome.electionIds ?? [], constituencyIds: outcome.constituencyIds ?? [] }
    };
  return {
    step: 'constituencies',
    selection: {
      electionIds: outcome.electionIds ?? facts.selection.electionIds,
      constituencyIds: facts.selection.constituencyIds
    }
  };
}

/**
 * The selection the election step is shown with: that of its address, and where the address names no election, the elections of the entity's nominations as the chosen ones. For an entity with no nomination no election is chosen then. The constituencies are those of the address alone: the constituency of a stored nomination is selected on the constituency step, for its own election.
 * @param facts - The values the step decides from.
 * @returns A fresh selection.
 */
export function electionsStepSelection({ selection, nominations }: StepFacts): NominationSelection {
  return {
    electionIds: selection.electionIds.length
      ? [...selection.electionIds]
      : startingSelectionOf(nominations).map((starting) => starting.electionId),
    constituencyIds: [...selection.constituencyIds]
  };
}

/**
 * What the address of the constituency step does.
 *
 * A chosen election in which the entity holds several nominations has no constituency to choose, so the ordering module is asked about the other chosen elections alone. When every chosen election is such a one, nothing is left to choose and the address forwards to the details step. While a constituency group is chosen first the step comes before the elections and is shown whatever is chosen.
 * @param facts - The values the step decides from.
 * @returns The step the address forwards to, or `undefined` when the constituency step is shown.
 */
export function constituenciesAddressForward(facts: StepFacts): StepForward | undefined {
  const { selection } = facts;
  const constituencyFirst = !!facts.appSettings.elections?.startFromConstituencyGroup;
  const { toChoose, kept } = constituencyFirst
    ? { toChoose: selection.electionIds, kept: [] }
    : choiceAmong(facts, constituenciesStepSelection(facts).electionIds);
  if (kept.length && !toChoose.length)
    return { step: 'details', selection: { electionIds: kept, constituencyIds: [...selection.constituencyIds] } };

  const outcome = constituenciesStepOutcome(
    selectionInputOf({ ...facts, selection: { electionIds: toChoose, constituencyIds: selection.constituencyIds } })
  );
  if (outcome.action === 'show') return undefined;
  if (outcome.action === 'done')
    return {
      step: 'details',
      selection: {
        electionIds: [...new Set([...(outcome.electionIds ?? []), ...kept])],
        constituencyIds: outcome.constituencyIds ?? []
      }
    };
  return { step: 'elections', selection };
}

/**
 * The selection the constituency step is shown with: that of its address, with the one admissible election as the chosen one when the address names none. A single admissible election is implied and never chosen, so no address need name it.
 * @param facts - The values the step decides from.
 * @returns A fresh selection.
 */
export function constituenciesStepSelection({ admissible, selection }: StepFacts): NominationSelection {
  const implied = !selection.electionIds.length && admissible.length === 1;
  return {
    electionIds: implied ? [admissible[0].id] : [...selection.electionIds],
    constituencyIds: [...selection.constituencyIds]
  };
}

/**
 * What the constituency step is shown with, beside its selection: the elections its selector is handed, the elections that have a section in a selector's place, and the constituency to select on arrival for each election the selector is handed.
 *
 * The constituency of an election on arrival is the one the address names for it, and otherwise that of the entity's one nomination in it. A stored constituency is looked up for its own election, so two elections that share their constituencies each start from their own. While a constituency group is chosen first the one selector is over that group, and it shows a constituency as selected only where the group holds it.
 * @param facts - The values the step decides from.
 * @returns A fresh object.
 */
export function constituenciesStepChoice(facts: StepFacts): ConstituencyStepChoice {
  const { appSettings, dataRoot, admissible, selection, nominations } = facts;
  const singleGroup = usesSingleConstituencyGroup({ appSettings, constituencyGroups: dataRoot.constituencyGroups });
  const choice = singleGroup
    ? { toChoose: admissible.map((election) => election.id), kept: [] }
    : choiceAmong(facts, constituenciesStepSelection(facts).electionIds);
  const toChoose = admissible.filter(
    (election) => choice.toChoose.includes(election.id) && (singleGroup || !election.singleConstituency)
  );

  const named = constituenciesOf(dataRoot, selection.constituencyIds);
  const starting = startingSelectionOf(nominations);
  const onArrival: Record<Id, Id> = {};
  for (const election of toChoose) {
    const storedId = starting.find(({ electionId }) => electionId === election.id)?.constituencyId;
    const constituency =
      mostSpecificConstituency({ election, constituencies: named }) ??
      mostSpecificConstituency({ election, constituencies: storedId ? constituenciesOf(dataRoot, [storedId]) : [] });
    if (constituency) onArrival[election.id] = constituency.id;
  }

  return {
    toChoose: toChoose.map((election) => election.id),
    kept: admissible.filter((election) => choice.kept.includes(election.id)).map((election) => election.id),
    onArrival
  };
}

/**
 * What the address of the details step does: the contests its cards are for and the elections whose nominations are kept as stored, or the step that collects what the address lacks.
 *
 * An address that names no election is read as the selection the entry implies, when it implies one whole. Otherwise it forwards to the entry. A chosen election needs a constituency, from the address or implied where it has one, unless the entity holds several nominations in it: those are kept as they are stored. An address that lacks a constituency for another election forwards to the constituency step.
 * @param facts - The values the step decides from.
 * @returns The contests and the kept elections, or the step the address forwards to.
 */
export function detailsAddressOutcome(facts: StepFacts): DetailsStepContests | StepForward {
  let selection = facts.selection;
  if (!selection.electionIds.length) {
    const entry = electionsAddressForward(facts);
    if (entry?.step !== 'details') return { step: 'elections', selection };
    selection = entry.selection;
  }
  const { toChoose, kept } = choiceAmong(facts, selection.electionIds);
  const contests = toChoose.length ? contestsOf({ ...facts, selection: { ...selection, electionIds: toChoose } }) : [];
  if (!contests) return { step: 'constituencies', selection };
  return {
    contests,
    keptElectionIds: facts.admissible.filter((election) => kept.includes(election.id)).map((election) => election.id)
  };
}

/**
 * Whether the editor has a step on which something is chosen: it has none when one election admits the entity's type and that election has one constituency.
 * @param facts - The settings, the data root and the admissible elections. The selection is not read.
 * @returns `false` when the editor's entry leads straight to the details step with nothing chosen.
 */
export function hasSelectionStep(facts: Omit<StepFacts, 'selection' | 'nominations'>): boolean {
  return electionsAddressForward({ ...facts, selection: emptySelection(), nominations: [] })?.step !== 'details';
}

/**
 * The contests of a selection: each chosen election, in the order the elections are offered, with its one constituency or the one of the chosen constituencies it takes.
 * @param facts - The data root, the admissible elections and the selection.
 * @returns The contests, or `undefined` when no election is chosen or a chosen election has several constituencies and none of them is chosen.
 */
export function contestsOf({
  dataRoot,
  admissible,
  selection
}: Pick<StepFacts, 'dataRoot' | 'admissible' | 'selection'>): Array<NominationContest> | undefined {
  const chosen = admissible.filter((election) => selection.electionIds.includes(election.id));
  if (!chosen.length) return undefined;
  const constituencies = constituenciesOf(dataRoot, selection.constituencyIds);
  const contests: Array<NominationContest> = [];
  for (const election of chosen) {
    const constituency = election.singleConstituency ?? mostSpecificConstituency({ election, constituencies });
    if (!constituency) return undefined;
    contests.push({ electionId: election.id, constituencyId: constituency.id });
  }
  return contests;
}

/**
 * Where Continue of the election step leads, for the elections chosen on it: the details step when nothing is left to choose, and the constituency step otherwise. An election in which the entity holds several nominations has nothing to choose. While a constituency group is chosen first the constituency step lies behind, and Continue leads to the details step.
 * @param facts - The values the page read, with the elections chosen on it and the constituencies of its address as the selection.
 * @returns The step and the selection its address carries.
 */
export function afterElections(facts: StepFacts): StepForward {
  const { selection } = facts;
  if (facts.appSettings.elections?.startFromConstituencyGroup) return { step: 'details', selection };
  const forward = constituenciesAddressForward(facts);
  return forward?.step === 'details' ? forward : { step: 'constituencies', selection };
}

/**
 * Where Continue of the constituency step leads, for the constituencies chosen on it: the details step. While a constituency group is chosen first it depends on the elections held in the chosen constituencies, each taken with the constituencies it stands for: the details step for one, the election step for several.
 * @param facts - The values the page read, with the elections of its address and the constituencies chosen on it as the selection.
 * @returns The step and the selection its address carries, or `undefined` when a constituency group is chosen first and no admissible election is held in the chosen constituencies: the step is not left. While a constituency group is chosen first, the selection carries the chosen constituencies followed by those they stand for.
 */
export function afterConstituencies(facts: Omit<StepFacts, 'nominations'>): StepForward | undefined {
  const { selection } = facts;
  if (!facts.appSettings.elections?.startFromConstituencyGroup) return { step: 'details', selection };
  const constituencies = constituenciesStoodFor({
    elections: facts.admissible,
    constituencies: constituenciesOf(facts.dataRoot, selection.constituencyIds)
  });
  const held = electionsHeldIn({ elections: facts.admissible, constituencies });
  if (!held.length) return undefined;
  const constituencyIds = [
    ...selection.constituencyIds,
    ...constituencies.map((constituency) => constituency.id).filter((id) => !selection.constituencyIds.includes(id))
  ];
  if (held.length === 1) return { step: 'details', selection: { electionIds: [held[0].id], constituencyIds } };
  const heldIds = new Set(held.map((election) => election.id));
  return {
    step: 'elections',
    selection: { electionIds: selection.electionIds.filter((id) => heldIds.has(id)), constituencyIds }
  };
}

/**
 * The constituencies a choice in the constituency group that is chosen first stands for: those chosen, and for each election that has none of them in its own groups, the constituency of its groups that a chosen one lies in. A municipality chosen for an election that is held by region stands for its region too.
 *
 * The constituency selector adds these itself when it is handed several elections. Handed one election it passes on the constituency chosen in the group as it is, which that election's groups need not hold.
 *
 * @param elections - The elections a constituency is sought for.
 * @param constituencies - The chosen constituencies.
 * @returns A fresh list, each constituency once: those given, in their order, then those they stand for.
 */
export function constituenciesStoodFor({
  elections,
  constituencies
}: {
  elections: Array<Election>;
  constituencies: Array<Constituency>;
}): Array<Constituency> {
  const found = new Map(constituencies.map((constituency) => [constituency.id, constituency]));
  for (const election of elections) {
    const groups = election.constituencyGroups;
    if (groups.some((group) => constituencies.some(({ id }) => group.data.constituencyIds.includes(id)))) continue;
    for (const group of groups) {
      for (const constituency of constituencies) {
        const implied = impliedIn(group, constituency);
        if (implied) found.set(implied.id, implied);
      }
    }
  }
  return [...found.values()];
}

/**
 * The constituencies of a data root that the ids name, in the data root's order. An id the data root does not hold names none.
 * @param dataRoot - The data root.
 * @param ids - The ids.
 * @returns A fresh list.
 */
export function constituenciesOf(dataRoot: DataRoot, ids: ReadonlyArray<Id>): Array<Constituency> {
  return dataRoot.constituencies.filter((constituency) => ids.includes(constituency.id));
}

/** The constituency of a group that a constituency is or lies in. `undefined` when the group holds none, and when it holds several of the constituency's line, which name no single one. */
function impliedIn(group: ConstituencyGroup, constituency: Constituency): Constituency | undefined {
  try {
    return group.getImpliedConstituency(constituency) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Which of the elections given have a constituency to choose, and which hold several of the entity's nominations and are kept as stored. */
function choiceAmong({ nominations }: Pick<StepFacts, 'nominations'>, electionIds: ReadonlyArray<Id>) {
  return constituencyChoiceOf({ chosenElectionIds: electionIds, nominations });
}

/** The values of a search param as a list of ids: every non-empty string, each once. */
function idsOf(value: unknown): Array<Id> {
  const ids = [value].flat().filter((id): id is string => typeof id === 'string' && id !== '');
  return [...new Set(ids)];
}

/** The input of the shared ordering module, asked the Contestant App's way. */
function selectionInputOf({
  appSettings,
  dataRoot,
  admissible,
  selection
}: Omit<StepFacts, 'nominations'>): SelectionInput {
  return {
    dataRoot,
    elections: admissible,
    appSettings,
    honourDisallowSelection: false,
    implyWithinChosenConstituencies: true,
    skipWhenFullyImplied: true,
    electionIds: selection.electionIds,
    constituencyIds: selection.constituencyIds
  };
}
