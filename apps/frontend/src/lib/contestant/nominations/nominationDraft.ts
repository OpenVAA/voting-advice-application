/**
 * The draft of the nomination editor's details step, as arithmetic: which cards there are and how each starts, which options a card's parent group holds and which is chosen on arrival, whether there is something to write, what an unfinished card lacks, and the set of nominations handed to the writer.
 *
 * CALLER CONTRACT: every function takes values the caller has already read. Inside a reactive scope the caller reads the context's accessors and the data root in its own tracking scope and hands the values over; this module is never given a context or a data root. Every function is pure and returns fresh objects: `buildCards` gives the cards a page keeps as its state and changes — a card's `state`, `electionSymbol`, `parentChoice` and `otherName` — and every other function reads cards and changes none.
 *
 * The module holds no string a user reads: it answers kinds, ids and flags, and the page words them.
 *
 * Which parent an entity may name in an election, and whether it must name one, is asked of the data model's `allowedParentTypes` and of nothing else. Every comparison of a symbol or of a typed name is made after trimming, as the database stores both.
 *
 * Tested in `nominationDraft.test.ts`.
 */

import { allowedParentTypes, ENTITY_TYPE } from '@openvaa/data';
import { admissibleElectionsOf } from './editorFacts';
import type { Id } from '@openvaa/core';
import type { EntityType, NominationShape } from '@openvaa/data';
import type {
  DesiredNomination,
  EntityNomination,
  NominationContest,
  NominationParentChoice
} from '$lib/api/base/dataWriter.type';

/** The value of the option that names no parent. */
export const NO_PARENT_CHOICE = 'none';

/** The value of the option under which the name of an entity that is not listed is typed. */
export const OTHER_PARENT_CHOICE = 'other';

/** The key of a nomination's custom data that holds a typed parent name. */
const TYPED_NAME_KEY = 'requestedParentOrganization';

/** What a card's election asks of the entity's parent. */
export type ParentRule = {
  /** The entity types the card's parent group lists. Empty where the election asks the entity for no parent: the card then has no parent group. */
  types: ReadonlyArray<EntityType>;
  /** Whether a parent must be named: the group then holds no option that names none. */
  parentRequired: boolean;
  /** Whether the user must choose an option: nothing is then chosen for them on a new card, and a group left untouched is unanswered. */
  choiceRequired: boolean;
};

/** What is stored of an existing card's nomination, for comparison with the draft. */
export type StoredCardValues = {
  /** The stored symbol. Empty when the nomination has none. */
  electionSymbol: string;
  /** The value of the option the stored state chooses: the card's parent choice on arrival. `undefined` where it chooses none. */
  parentChoice: string | undefined;
  /** The stored typed name, trimmed. Empty when none is stored. */
  otherName: string;
  /** The entity the stored nomination stands under. Left out for a nomination with no parent. */
  parent?: {
    /** The parent entity's type. */
    entityType: EntityType;
    /** The parent entity's id. */
    entityId: Id;
  };
};

/** One card of the details step: an existing nomination of the entity, or a nomination that a save would create. */
export type EditorCard = {
  /** A key that stays the same for as long as the card exists: the nomination's id on an existing card. */
  key: string;
  /** The id of the stored nomination. Left out on a new card. */
  nominationId?: Id;
  /** The id of the card's election. */
  electionId: Id;
  /** The id of the card's constituency. On a moved card, the one the nomination is moved to. */
  constituencyId: Id;
  /** On a moved card alone: the id of the constituency the stored nomination is in. */
  previousConstituencyId?: Id;
  /** Whether the stored nomination is confirmed. `false` on a new card. */
  confirmed: boolean;
  /** Whether a save keeps the stored nomination (`kept`), creates the nomination (`new`) or deletes the stored one (`removed`). A moved card is `kept`. */
  state: 'kept' | 'new' | 'removed';
  /** The draft's election symbol, as typed. */
  electionSymbol: string;
  /** The draft's parent choice: the value of an option of the card's parent group, or `undefined` while nothing is chosen. */
  parentChoice: string | undefined;
  /** The draft's typed parent name, as typed. Read only while the typed-name option is chosen. */
  otherName: string;
  /** What the card's election asks of the entity's parent. */
  parentRule: ParentRule;
  /** What is stored of the card's nomination. Left out on a new card. */
  stored?: StoredCardValues;
};

/** The members of an election the cards are built from. An `Election` of the data root holds them. */
export type EditorElection = {
  /** The election's id. */
  id: Id;
  /** The election's nomination shape. */
  nominationShape: NominationShape;
};

/** An entity a parent group may list: one element of the parent options the caller has read. */
export type ListedParent = {
  /** The entity's type. */
  entityType: EntityType;
  /** The entity's id. */
  id: Id;
  /** The entity's name in the page's locale, by which the options are ordered. */
  name: string;
};

/** One option of a card's parent group. */
export type ParentOption =
  | {
      /** `none` names no parent; `other` is the option under which a name is typed. */
      kind: 'none' | 'other';
      /** The value a card's `parentChoice` holds while the option is chosen. */
      value: string;
    }
  | {
      /** `entity` is a listed entity; `unlisted` is the parent the stored nomination has, which is not among the listed ones. */
      kind: 'entity' | 'unlisted';
      /** The value a card's `parentChoice` holds while the option is chosen: the entity's id. */
      value: string;
      /** The entity's type. */
      entityType: EntityType;
      /** The entity's id. */
      entityId: Id;
    };

/** The parent group of one card. */
export type ParentChoices = {
  /** The options, in the group's order. Empty where the election asks the entity for no parent: no group is then shown. */
  options: Array<ParentOption>;
  /** The value of the option chosen on arrival, or `undefined` where none is. */
  selected: string | undefined;
  /** Whether the user must choose an option. */
  required: boolean;
};

/** What an unfinished card lacks: a choice in its parent group, a name under the typed-name option, or a parent that no other card of its election and constituency names. */
export type CardErrorKind = 'parentRequired' | 'otherNameRequired' | 'duplicateParent';

/** One unfinished card. */
export type CardError = {
  /** The card's key. */
  key: string;
  /** What the card lacks. */
  error: CardErrorKind;
};

/** What the label of the details step's main button asks of the draft. */
export type DraftFacts = {
  /** Whether a save would write anything. */
  somethingToWrite: boolean;
  /** Whether at least one card is kept or new: the entity has a nomination after the save. */
  anyKeptOrNew: boolean;
  /** Whether the entity had a nomination before the save. */
  hadNomination: boolean;
};

/**
 * Whether an entity of the given type answers its parent group itself. A candidate does: nothing is chosen for it, since a group it left untouched must never be read as standing without a party. Every other entity type starts at the option that names no parent.
 */
function answersParentGroupItself(entityType: EntityType): boolean {
  return entityType === ENTITY_TYPE.Candidate;
}

/**
 * What an election of the given shape asks of the parent of an entity of the given type. An election whose shape is not known asks for none.
 */
function parentRuleOf(shape: NominationShape | undefined, entityType: EntityType): ParentRule {
  const allowed = shape === undefined ? undefined : allowedParentTypes(shape, entityType);
  if (!allowed || allowed.types.length === 0) return { types: [], parentRequired: false, choiceRequired: false };
  return {
    types: [...allowed.types],
    parentRequired: allowed.required,
    choiceRequired: allowed.required || answersParentGroupItself(entityType)
  };
}

/** The parent choice a new card starts with: nothing where the user must choose or no group is shown, and otherwise the option that names no parent. */
function newCardChoice(rule: ParentRule): string | undefined {
  return rule.types.length === 0 || rule.choiceRequired ? undefined : NO_PARENT_CHOICE;
}

/** Whether a card carries its stored parent: always on a card that stays in its constituency, and on a moved card only where the parent's type is one the election pairs with the entity. */
function carriesStoredParent(rule: ParentRule, parentType: EntityType, moved: boolean): boolean {
  return !moved || rule.types.includes(parentType);
}

/**
 * The name of a parent that a nomination's editor typed, for a party or an alliance the application does not list.
 * @param nomination - A nomination, as the caller has read it.
 * @returns The stored name, trimmed. Empty when the nomination's custom data holds none.
 */
export function typedParentNameOf(nomination: Pick<EntityNomination, 'customData'>): string {
  const value = nomination.customData?.[TYPED_NAME_KEY];
  return typeof value === 'string' ? value.trim() : '';
}

/** Whether a card is a moved one: its nomination is stored in another constituency than the card's. */
function isMoved(card: EditorCard): boolean {
  return card.previousConstituencyId !== undefined;
}

/**
 * The card of a stored nomination.
 * @param movedTo - The constituency the nomination is moved to, on a moved card.
 */
function existingCardOf({
  nomination,
  rule,
  state,
  movedTo
}: {
  nomination: EntityNomination;
  rule: ParentRule;
  state: 'kept' | 'removed';
  movedTo: Id | undefined;
}): EditorCard {
  const otherName = typedParentNameOf(nomination);
  const parent = nomination.parent;
  let parentChoice: string | undefined;
  if (rule.types.length === 0) parentChoice = undefined;
  else if (parent)
    parentChoice = carriesStoredParent(rule, parent.entityType, movedTo !== undefined)
      ? parent.entityId
      : newCardChoice(rule);
  else if (otherName) parentChoice = OTHER_PARENT_CHOICE;
  else parentChoice = rule.parentRequired ? undefined : NO_PARENT_CHOICE;

  const stored: StoredCardValues = { electionSymbol: nomination.electionSymbol, parentChoice, otherName };
  if (parent) stored.parent = { entityType: parent.entityType, entityId: parent.entityId };
  const card: EditorCard = {
    key: nomination.id,
    nominationId: nomination.id,
    electionId: nomination.electionId,
    constituencyId: movedTo ?? nomination.constituencyId,
    confirmed: nomination.confirmed,
    state,
    electionSymbol: nomination.electionSymbol,
    parentChoice,
    otherName,
    parentRule: rule,
    stored
  };
  if (movedTo !== undefined) card.previousConstituencyId = nomination.constituencyId;
  return card;
}

/**
 * The cards of the details step.
 *
 * - Every stored nomination has a card, whatever the selection holds: `kept` when its election is among the chosen ones and `removed` when it is not. A nomination whose election is not among those given has one too, after the others, with no parent group.
 * - A stored nomination that is the only one of its election, in an election chosen with another constituency, is one moved card: `kept`, at the chosen constituency, with the stored one as its previous constituency.
 * - An election with several stored nominations gives a card for each, as stored, and no new card: the selection can start them as removed and do nothing else to them.
 * - A chosen pair in whose election the entity has no nomination gives a `new` card, where the election is among those given and admits the entity's type. Of two pairs that name one election the first is read.
 * - An existing card's draft starts from what is stored; a new card's symbol and typed name are empty. The parent choice on arrival is the one `parentChoicesOf` states.
 * - The cards are ordered by the elections' given order, and within one election as the nominations are given.
 *
 * @param entityType - The type of the entity the nominations are of.
 * @param nominations - The entity's nominations in the editor's reach, as the caller has read them.
 * @param chosen - The chosen elections, each with its constituency.
 * @param elections - The elections the editor offers the entity, in the order the election step lists them.
 * @returns Fresh cards that share no object with the arguments or with each other.
 */
export function buildCards({
  entityType,
  nominations,
  chosen,
  elections
}: {
  entityType: EntityType;
  nominations: ReadonlyArray<EntityNomination>;
  chosen: ReadonlyArray<NominationContest>;
  elections: ReadonlyArray<EditorElection>;
}): Array<EditorCard> {
  const shapes = new Map(elections.map((election) => [election.id, election.nominationShape]));
  const admitting = new Set(admissibleElectionsOf(elections, entityType).map((election) => election.id));

  const chosenConstituencies = new Map<Id, Id>();
  for (const { electionId, constituencyId } of chosen)
    if (!chosenConstituencies.has(electionId)) chosenConstituencies.set(electionId, constituencyId);

  const stored = new Map<Id, Array<EntityNomination>>();
  for (const nomination of nominations) {
    const rows = stored.get(nomination.electionId);
    if (rows) rows.push(nomination);
    else stored.set(nomination.electionId, [nomination]);
  }

  const cards: Array<EditorCard> = [];
  for (const electionId of new Set([...shapes.keys(), ...stored.keys()])) {
    const rows = stored.get(electionId) ?? [];
    const constituencyId = chosenConstituencies.get(electionId);
    if (rows.length === 0) {
      if (constituencyId === undefined || !admitting.has(electionId)) continue;
      const rule = parentRuleOf(shapes.get(electionId), entityType);
      cards.push({
        key: `new:${electionId}:${constituencyId}`,
        electionId,
        constituencyId,
        confirmed: false,
        state: 'new',
        electionSymbol: '',
        parentChoice: newCardChoice(rule),
        otherName: '',
        parentRule: rule
      });
      continue;
    }
    for (const nomination of rows) {
      const movedTo =
        rows.length === 1 && constituencyId !== undefined && constituencyId !== nomination.constituencyId
          ? constituencyId
          : undefined;
      cards.push(
        existingCardOf({
          nomination,
          rule: parentRuleOf(shapes.get(electionId), entityType),
          state: constituencyId === undefined ? 'removed' : 'kept',
          movedTo
        })
      );
    }
  }
  return cards;
}

/**
 * The parent group of one card: its options in order, the option chosen on arrival, and whether the user must choose.
 *
 * - Where the card's election asks the entity for no parent the answer is empty, and no group is shown.
 * - The options are, in order: the stored parent where it is not among the listed entities (`unlisted`); the option that names no parent (`none`), where a parent need not be named; the listed entities of a type the election pairs with the entity (`entity`), by name in the given locale and by id for equal names; and the typed-name option (`other`). An option exists for no entity that is not passed in `listed`, apart from the stored parent, and a faction is never listed.
 * - On a new card nothing is chosen where the user must choose, and the option that names no parent is chosen otherwise.
 * - On an existing card the stored state chooses: the stored parent, listed or not; the typed-name option for a stored typed name; and for a nomination with neither, the option that names no parent where the group holds one and nothing where it does not.
 * - The `unlisted` option follows what is stored and not the draft, so it stays in the group while another option is chosen.
 *
 * @param card - The card, as `buildCards` built it; its draft is not read.
 * @param listed - The entities the caller has read as the card's parent options.
 * @param locale - The page's locale, by which names are ordered.
 * @returns A fresh answer on every call.
 */
export function parentChoicesOf({
  card,
  listed,
  locale
}: {
  card: EditorCard;
  listed: ReadonlyArray<ListedParent>;
  locale: string;
}): ParentChoices {
  const rule = card.parentRule;
  if (rule.types.length === 0) return { options: [], selected: undefined, required: false };

  const collator = new Intl.Collator(locale);
  const listedIds = new Set<Id>();
  const entities = listed
    .filter((entity) => {
      if (!rule.types.includes(entity.entityType) || listedIds.has(entity.id)) return false;
      listedIds.add(entity.id);
      return true;
    })
    .sort((a, b) => collator.compare(a.name, b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const options: Array<ParentOption> = [];

  // A stored parent that is not among the listed entities is an option of its own, so that a save can leave the link as it is. A moved nomination is written anew and cannot say that its parent is kept, so a moved card carries such a parent only where its type is one the election pairs with the entity: the save then names that entity at the new constituency. Under a parent of any other type a moved card starts as a new card does.
  const storedParent = card.stored?.parent;
  if (
    storedParent &&
    !listedIds.has(storedParent.entityId) &&
    carriesStoredParent(rule, storedParent.entityType, isMoved(card))
  )
    options.push({
      kind: 'unlisted',
      value: storedParent.entityId,
      entityType: storedParent.entityType,
      entityId: storedParent.entityId
    });

  if (!rule.parentRequired) options.push({ kind: 'none', value: NO_PARENT_CHOICE });
  for (const entity of entities)
    options.push({ kind: 'entity', value: entity.id, entityType: entity.entityType, entityId: entity.id });
  options.push({ kind: 'other', value: OTHER_PARENT_CHOICE });

  return {
    options,
    selected: card.stored ? card.stored.parentChoice : newCardChoice(rule),
    required: rule.choiceRequired
  };
}

/** Whether a save would write anything for one card. */
function isToBeWritten(card: EditorCard): boolean {
  if (card.state === 'removed') return card.nominationId !== undefined;
  const stored = card.stored;
  if (card.state === 'new' || !stored || isMoved(card)) return true;
  if (card.electionSymbol.trim() !== stored.electionSymbol.trim()) return true;
  if (card.parentChoice !== stored.parentChoice) return true;
  return card.parentChoice === OTHER_PARENT_CHOICE && card.otherName.trim() !== stored.otherName.trim();
}

/**
 * Whether a save would write anything: a new card, a removed card, a moved card, or a kept card whose symbol, parent choice or typed name differs from what is stored. A symbol or a name that differs only by surrounding white space is no difference, and a typed name counts only while the typed-name option is chosen.
 * @param cards - The cards, as the page holds them.
 * @returns `false` for cards as built from stored nominations with every election chosen as stored, and for no card.
 */
export function somethingToWrite(cards: ReadonlyArray<EditorCard>): boolean {
  return cards.some(isToBeWritten);
}

/**
 * What each unfinished card lacks. A removed card is never reported and never counted. Of the cards that are not removed:
 *
 * - `parentRequired`: the card has a parent group and none of its options is chosen. A candidate's untouched group is reported; another entity's group starts at the option that names no parent and is not.
 * - `otherNameRequired`: the typed-name option is chosen and the name is blank after trimming.
 * - `duplicateParent`: an earlier card of the same election and constituency names the same entity. The later card is the one reported.
 *
 * @param cards - The cards, as the page holds them.
 * @param choices - The answer of `parentChoicesOf` for each card, by the card's key. A card with no answer is read as one with no parent group.
 * @returns At most one error for each card, in the cards' order.
 */
export function validateCards(
  cards: ReadonlyArray<EditorCard>,
  choices: ReadonlyMap<string, ParentChoices>
): Array<CardError> {
  const errors: Array<CardError> = [];
  const named = new Set<string>();
  for (const card of cards) {
    if (card.state === 'removed') continue;
    const options = choices.get(card.key)?.options ?? [];
    if (options.length === 0) continue;
    const chosen = options.find((option) => option.value === card.parentChoice);
    if (!chosen) {
      errors.push({ key: card.key, error: 'parentRequired' });
    } else if (chosen.kind === 'other') {
      if (card.otherName.trim() === '') errors.push({ key: card.key, error: 'otherNameRequired' });
    } else if (chosen.kind === 'entity' || chosen.kind === 'unlisted') {
      const parentAtContest = JSON.stringify([
        card.electionId,
        card.constituencyId,
        chosen.entityType,
        chosen.entityId
      ]);
      if (named.has(parentAtContest)) errors.push({ key: card.key, error: 'duplicateParent' });
      else named.add(parentAtContest);
    }
  }
  return errors;
}

/**
 * What one card's nomination is to stand under after the save.
 * @throws For a card that has a parent group with nothing chosen, and for the typed-name option with a blank name.
 */
function desiredParentOf(card: EditorCard): NominationParentChoice {
  const existing = card.nominationId !== undefined;
  const moved = isMoved(card);
  if (card.parentRule.types.length === 0) return existing && !moved ? { kind: 'keep' } : { kind: 'none' };
  if (card.parentChoice === undefined)
    throw new Error('nominationDraft: a card with nothing chosen in its parent group has no desired nomination');
  if (card.parentChoice === NO_PARENT_CHOICE) return { kind: 'none' };
  if (card.parentChoice === OTHER_PARENT_CHOICE) {
    const name = card.otherName.trim();
    if (name === '') throw new Error('nominationDraft: a card with a blank typed name has no desired nomination');
    return { kind: 'other', name };
  }
  const storedParent = card.stored?.parent;
  if (storedParent && storedParent.entityId === card.parentChoice)
    return moved
      ? { kind: 'entity', entityType: storedParent.entityType, entityId: storedParent.entityId }
      : { kind: 'keep' };
  return { kind: 'entity', entityType: card.parentRule.types[0], entityId: card.parentChoice };
}

/**
 * The set of nominations handed to the writer: one for every card that is not removed, in the cards' order. A stored nomination the set leaves out is deleted by the write.
 *
 * - `id` is stated on an existing card and left out on a new one. A moved card states its `id` and the constituency it is moved to.
 * - The symbol is trimmed.
 * - The parent is `none` for the option that names no parent; `other` with the trimmed name for the typed-name option; `entity` for a listed entity; and `keep` where the stored parent is left chosen on a card that stays in its constituency, listed or not, so that the stored link is left exactly as it is. A moved card cannot say `keep` and names the stored parent as an `entity` instead.
 * - A card with no parent group says `keep` when it exists and stays in its constituency, and `none` otherwise.
 *
 * @param cards - The cards, as the page holds them, after `validateCards` has reported none of them.
 * @returns Fresh objects.
 * @throws For a card that has a parent group with nothing chosen, and for the typed-name option with a blank name: neither is ever read as a nomination with no parent.
 */
export function desiredSetOf(cards: ReadonlyArray<EditorCard>): Array<DesiredNomination> {
  return cards
    .filter((card) => card.state !== 'removed')
    .map((card) => {
      const desired: DesiredNomination = {
        electionId: card.electionId,
        constituencyId: card.constituencyId,
        electionSymbol: card.electionSymbol.trim(),
        parent: desiredParentOf(card)
      };
      return card.nominationId === undefined ? desired : { id: card.nominationId, ...desired };
    });
}

/**
 * What the label of the details step's main button asks of the draft.
 * @param cards - The cards, as the page holds them.
 * @param hadNomination - Whether the entity had a nomination when the cards were built.
 * @returns A fresh object.
 */
export function draftFactsOf(cards: ReadonlyArray<EditorCard>, hadNomination: boolean): DraftFacts {
  return {
    somethingToWrite: somethingToWrite(cards),
    anyKeptOrNew: cards.some((card) => card.state !== 'removed'),
    hadNomination
  };
}

/** Whether two values of stored custom data hold the same content, whatever the order of an object's keys. */
function sameContent(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => sameContent(value, b[index]))
    );
  const entriesOfA = Object.entries(a);
  const contentOfB = new Map(Object.entries(b));
  return (
    entriesOfA.length === contentOfB.size &&
    entriesOfA.every(([key, value]) => contentOfB.has(key) && sameContent(value, contentOfB.get(key)))
  );
}

/** Whether two nominations with one id hold the same values. */
function sameValues(a: EntityNomination, b: EntityNomination): boolean {
  return (
    a.electionId === b.electionId &&
    a.constituencyId === b.constituencyId &&
    a.electionRound === b.electionRound &&
    a.electionSymbol === b.electionSymbol &&
    a.confirmed === b.confirmed &&
    a.parent?.entityType === b.parent?.entityType &&
    a.parent?.entityId === b.parent?.entityId &&
    sameContent(a.customData, b.customData)
  );
}

/**
 * Whether two lists of an entity's nominations are the same rows with the same values: the same ids, and for each id the same election, constituency, round, symbol, confirmation, parent entity and custom data. The order of the rows is not compared, nor are the names a nomination is shown with.
 * @param a - One list, as the caller has read it.
 * @param b - The other list.
 * @returns `true` for two empty lists.
 */
export function sameNominations(a: ReadonlyArray<EntityNomination>, b: ReadonlyArray<EntityNomination>): boolean {
  if (a.length !== b.length) return false;
  const rowsOfB = new Map(b.map((nomination) => [nomination.id, nomination]));
  if (rowsOfB.size !== b.length || new Set(a.map((nomination) => nomination.id)).size !== a.length) return false;
  return a.every((nomination) => {
    const other = rowsOfB.get(nomination.id);
    return other !== undefined && sameValues(nomination, other);
  });
}
