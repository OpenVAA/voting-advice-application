/**
 * The facts the nomination editor rests on: whether nominations may be edited, which elections admit an entity, which of an entity's nominations the editor manages, and what the selection of elections and constituencies starts from for an entity that has nominations.
 *
 * CALLER CONTRACT: every function takes values the caller has already read. Inside a reactive scope the caller reads the context's accessors and the data root's elections in its own tracking scope and hands the values over; this module is never given a context or a data root. Every function is pure and returns a list of its own, holding the objects it was given.
 *
 * "Editable" and "admissible" are each stated here once. No page, load or component writes either condition out, and whether an election admits an entity type is asked of the data model's `isNominableInShape` and of nothing else.
 *
 * Tested in `editorFacts.test.ts`.
 */

import { isNominableInShape } from '@openvaa/data';
import type { Id } from '@openvaa/core';
import type { EntityType, NominationShape } from '@openvaa/data';

/** The two locks that stop an entity's nominations from being edited. */
export type NominationLocks = {
  /** Whether nominations are locked: the application setting the database enforces on every write of a nomination. */
  nominationsLocked: boolean;
  /** Whether answers are locked: the application setting that closes all of an entity's editing. */
  answersLocked: boolean;
};

/** The members of an election that say whether it admits an entity type. An `Election` of the data root holds them. */
export type ElectionShapeFacts = {
  /** The election's nomination shape. */
  nominationShape: NominationShape;
};

/** The members of an election that say whether one of its nominations is in the editor's reach. An `Election` of the data root holds them. */
export type ElectionReachFacts = ElectionShapeFacts & {
  /** The election's id. */
  id: Id;
  /** The election's current round. */
  round: number;
};

/** The members of a nomination that say whether it is in the editor's reach. */
export type NominationReachFacts = {
  /** The id of the election the nomination is in. */
  electionId: Id;
  /** The round of the election the nomination is for. */
  electionRound: number;
};

/** The members of a nomination that say where it stands. */
export type NominationContestFacts = {
  /** The id of the election the nomination is in. */
  electionId: Id;
  /** The id of the constituency the nomination is in. */
  constituencyId: Id;
};

/** One election the selection starts from. */
export type StartingElection = {
  /** The id of an election the entity is nominated in. */
  electionId: Id;
  /** The id of the constituency the entity is nominated in there. Left out where the entity holds several nominations in the election. */
  constituencyId?: Id;
};

/** Which of the chosen elections a constituency is chosen for. */
export type ConstituencyChoice = {
  /** The ids of the chosen elections in which a constituency is still to be chosen or implied. */
  toChoose: Array<Id>;
  /** The ids of the chosen elections whose nominations are kept as they are stored: no constituency is chosen for them. */
  kept: Array<Id>;
};

/**
 * Whether an entity's nominations may be edited: neither lock is on.
 * @param locks - The two locks, as the caller has read them from the application settings.
 * @returns `true` only when both are off.
 */
export function nominationsEditableOf({ nominationsLocked, answersLocked }: NominationLocks): boolean {
  return !nominationsLocked && !answersLocked;
}

/**
 * Whether the nomination editor lets an entity in: its nominations may be edited and an election admits its type. Where it does not, the editor's guard turns the entity away to the nominations view.
 * @param locks - The two locks, as the caller has read them from the application settings.
 * @param elections - The elections the caller has read.
 * @param entityType - The type of the entity.
 * @returns `true` only when neither lock is on and at least one election admits the type.
 */
export function nominationEntryOfferedOf({
  locks,
  elections,
  entityType
}: {
  locks: NominationLocks;
  elections: ReadonlyArray<ElectionShapeFacts>;
  entityType: EntityType;
}): boolean {
  return nominationsEditableOf(locks) && admissibleElectionsOf(elections, entityType).length > 0;
}

/**
 * The elections that admit an entity of the given type as a nominee: the elections the editor offers.
 * @param elections - The elections the caller has read, in the order they are to be offered.
 * @param entityType - The type of the entity that would be nominated.
 * @returns The admissible elections, in the order given.
 */
export function admissibleElectionsOf<TElection extends ElectionShapeFacts>(
  elections: ReadonlyArray<TElection>,
  entityType: EntityType
): Array<TElection> {
  return elections.filter((election) => isNominableInShape(election.nominationShape, entityType));
}

/**
 * The nominations of an entity that the editor manages: those at their election's current round, in an election that admits the entity's type. Every other nomination is shown where nominations are listed, has no card in the editor and is left as it is by a save.
 * @param nominations - The entity's nominations, as the caller has read them.
 * @param elections - The elections the caller has read. A nomination in an election that is not among them is not in reach.
 * @param entityType - The type of the entity the nominations are of.
 * @returns The nominations in reach, in the order given.
 */
export function inReachNominationsOf<TNomination extends NominationReachFacts>({
  nominations,
  elections,
  entityType
}: {
  nominations: ReadonlyArray<TNomination>;
  elections: ReadonlyArray<ElectionReachFacts>;
  entityType: EntityType;
}): Array<TNomination> {
  const currentRounds = new Map(
    admissibleElectionsOf(elections, entityType).map((election) => [election.id, election.round])
  );
  return nominations.filter((nomination) => currentRounds.get(nomination.electionId) === nomination.electionRound);
}

/**
 * What the selection of elections and constituencies starts from for an entity that has nominations: each election it is nominated in, once, and the constituency it is nominated in there where it holds exactly one nomination in the election.
 * @param nominations - The entity's nominations in the editor's reach, as the caller has read them. No other nomination is to be handed over: every one given is read.
 * @returns Fresh objects, in the order the elections are first met. Empty for an entity with no nomination.
 */
export function startingSelectionOf(nominations: ReadonlyArray<NominationContestFacts>): Array<StartingElection> {
  const constituencies = new Map<Id, Array<Id>>();
  for (const { electionId, constituencyId } of nominations) {
    const held = constituencies.get(electionId);
    if (held) held.push(constituencyId);
    else constituencies.set(electionId, [constituencyId]);
  }
  return [...constituencies].map(([electionId, held]) =>
    held.length === 1 ? { electionId, constituencyId: held[0] } : { electionId }
  );
}

/**
 * Which of the chosen elections a constituency is chosen for. An election in which the entity holds several nominations has none to choose: those nominations are kept as they are stored, each in its own constituency.
 * @param chosenElectionIds - The ids of the chosen elections.
 * @param nominations - The entity's nominations in the editor's reach, as the caller has read them.
 * @returns A fresh object. Each chosen id is in exactly one of its two lists, once, in the order given; an election that is not chosen is in neither.
 */
export function constituencyChoiceOf({
  chosenElectionIds,
  nominations
}: {
  chosenElectionIds: ReadonlyArray<Id>;
  nominations: ReadonlyArray<NominationContestFacts>;
}): ConstituencyChoice {
  const held = new Map<Id, number>();
  for (const { electionId } of nominations) held.set(electionId, (held.get(electionId) ?? 0) + 1);
  const choice: ConstituencyChoice = { toChoose: [], kept: [] };
  for (const electionId of new Set(chosenElectionIds))
    ((held.get(electionId) ?? 0) > 1 ? choice.kept : choice.toChoose).push(electionId);
  return choice;
}
