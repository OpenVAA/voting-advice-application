/**
 * The facts the nomination editor rests on: whether nominations may be edited, which elections admit an entity, which of an entity's nominations the editor manages, as the database marks them writable, and what the selection of elections and constituencies starts from for an entity that has nominations.
 *
 * CALLER CONTRACT: every function takes values the caller has already read. Inside a reactive scope the caller reads the context's accessors and the data root's elections in its own tracking scope and hands the values over; this module is never given a context or a data root. Every function is pure and returns a list of its own, holding the objects it was given.
 *
 * "Editable" and "admissible" are each stated here once. No page, load or component writes either condition out, and whether an election admits an entity type is asked of the data model's `isNominableInShape` and of nothing else.
 *
 * Tested in `editorFacts.test.ts`.
 */

import { ENTITY_TYPE, isNominableInShape } from '@openvaa/data';
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

/** The member of a nomination that says whether the editor manages it. */
export type NominationWritableFacts = {
  /** Whether a write of the entity's nominations may change the nomination, as the database decides. */
  writable: boolean;
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
  /** The ids of the constituencies the entity is nominated in there, each once, in the order the nominations are given. */
  constituencyIds: Array<Id>;
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
 * The nominations of an entity that the editor manages: those the database marks writable, which are at their election's current round, in an election that admits the entity's type. Every other nomination is shown where nominations are listed, has no card in the editor and is left as it is by a save.
 * @param nominations - The entity's nominations, as the caller has read them.
 * @returns The writable nominations, in the order given.
 */
export function writableNominationsOf<TNomination extends NominationWritableFacts>(
  nominations: ReadonlyArray<TNomination>
): Array<TNomination> {
  return nominations.filter((nomination) => nomination.writable);
}

/**
 * Whether the editor lets an entity of the given type choose several constituencies in one election. An organization does: a party usually stands in many constituencies of one election. A candidate stands in one constituency of an election. The editor offers only the elections that admit the entity's type, so every election in which an organization chooses several admits organizations.
 * @param entityType - The type of the entity.
 * @returns `true` for an organization.
 */
export function choosesSeveralConstituenciesOf(entityType: EntityType): boolean {
  return entityType === ENTITY_TYPE.Organization;
}

/**
 * What the selection of elections and constituencies starts from for an entity that has nominations: each election it is nominated in, once, with the constituencies it is nominated in there.
 * @param nominations - The entity's writable nominations, as the caller has read them. No other nomination is to be handed over: every one given is read.
 * @returns Fresh objects, in the order the elections are first met. Empty for an entity with no nomination.
 */
export function startingSelectionOf(nominations: ReadonlyArray<NominationContestFacts>): Array<StartingElection> {
  const constituencies = new Map<Id, Array<Id>>();
  for (const { electionId, constituencyId } of nominations) {
    const held = constituencies.get(electionId);
    if (!held) constituencies.set(electionId, [constituencyId]);
    else if (!held.includes(constituencyId)) held.push(constituencyId);
  }
  return [...constituencies].map(([electionId, constituencyIds]) => ({ electionId, constituencyIds }));
}

/**
 * Which of the chosen elections constituencies are chosen for. For an entity that chooses one constituency in each election, an election in which it holds several nominations has none to choose: those nominations are kept as they are stored, each in its own constituency. An entity that chooses several constituencies in an election, as `choosesSeveralConstituenciesOf` answers, chooses them in every chosen election, and none is kept.
 * @param chosenElectionIds - The ids of the chosen elections.
 * @param nominations - The entity's writable nominations, as the caller has read them.
 * @param severalConstituencies - Whether the entity chooses several constituencies in one election.
 * @returns A fresh object. Each chosen id is in exactly one of its two lists, once, in the order given; an election that is not chosen is in neither.
 */
export function constituencyChoiceOf({
  chosenElectionIds,
  nominations,
  severalConstituencies
}: {
  chosenElectionIds: ReadonlyArray<Id>;
  nominations: ReadonlyArray<NominationContestFacts>;
  severalConstituencies: boolean;
}): ConstituencyChoice {
  const held = new Map<Id, number>();
  for (const { electionId } of nominations) held.set(electionId, (held.get(electionId) ?? 0) + 1);
  const choice: ConstituencyChoice = { toChoose: [], kept: [] };
  for (const electionId of new Set(chosenElectionIds)) {
    const keptAsStored = !severalConstituencies && (held.get(electionId) ?? 0) > 1;
    (keptAsStored ? choice.kept : choice.toChoose).push(electionId);
  }
  return choice;
}
