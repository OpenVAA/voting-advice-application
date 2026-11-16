import { describe, expect, it } from 'vitest';
import {
  buildCards,
  desiredSetOf,
  draftFactsOf,
  parentChoicesOf,
  sameNominations,
  somethingToWrite,
  validateCards
} from './nominationDraft';
import type { EntityType, NominationShape } from '@openvaa/data';
import type { EntityNomination, EntityNominationParent, NominationContest } from '$lib/api/base/dataWriter.type';
import type { EditorCard, ListedParent, ParentChoices } from './nominationDraft';

/**
 * The contract of `nominationDraft.ts`, one group of cases per function: which cards the details step holds and how each starts, which options a card's parent group holds and which is chosen on arrival, whether there is something to write, what an unfinished card lacks, the set handed to the writer, the facts the main button's label asks, and whether two lists of nominations are the same rows.
 *
 * The cards of every case are built by `buildCards` from stored nominations and a selection, and then changed as a page changes them: by assigning a card's state, symbol, parent choice or typed name.
 */

type TestElection = { id: string; nominationShape: NominationShape };

const CLOSED: TestElection = { id: 'closed', nominationShape: 'organization_list' };
const OPEN: TestElection = { id: 'open', nominationShape: 'organization_list_and_independents' };
const CANDIDATES: TestElection = { id: 'candidates', nominationShape: 'candidate_only' };
const ORGANIZATIONS: TestElection = { id: 'organizations', nominationShape: 'organization_only' };
const ELECTIONS = [CLOSED, OPEN, CANDIDATES, ORGANIZATIONS];

const GREEN: ListedParent = { entityType: 'organization', id: 'org-green', name: 'Green Party' };
const BLUE: ListedParent = { entityType: 'organization', id: 'org-blue', name: 'Blue Party' };
const PARTIES = [GREEN, BLUE];
const COAST: ListedParent = { entityType: 'alliance', id: 'all-coast', name: 'Coastal Alliance' };
const HILLS: ListedParent = { entityType: 'alliance', id: 'all-hills', name: 'Alliance of the Hills' };
const ALLIANCES = [COAST, HILLS];
/** Every entity of these tests a card can name, as the page lists them. */
const LISTED = [...PARTIES, ...ALLIANCES];

/** A party the project holds and does not list. */
const UNLISTED_PARTY: ListedParent = { entityType: 'organization', id: 'org-old', name: 'Old Party' };
const FACTION: ListedParent = { entityType: 'faction', id: 'fac-1', name: 'A Faction' };

const LOCALE = 'en';

/** A stored nomination with the given members and none of the optional ones. */
function nomination(
  members: Pick<EntityNomination, 'id' | 'electionId' | 'constituencyId'> & Partial<EntityNomination>
): EntityNomination {
  return {
    electionName: '',
    constituencyName: '',
    electionRound: 1,
    electionSymbol: '',
    confirmed: false,
    customData: null,
    updatedAt: '2026-10-01T12:00:00+00:00',
    ...members
  };
}

/** The parent a nomination is stored with, for an entity of these tests. */
function parentOf(entity: ListedParent): EntityNominationParent {
  return { entityType: entity.entityType, entityId: entity.id, name: entity.name };
}

/** A chosen pair. */
function pair(election: TestElection, constituencyId: string): NominationContest {
  return { electionId: election.id, constituencyId };
}

/** The cards of an entity of the given type over the elections of these tests. */
function cardsOf(
  entityType: EntityType,
  nominations: ReadonlyArray<EntityNomination>,
  chosen: ReadonlyArray<NominationContest>
): Array<EditorCard> {
  return buildCards({ entityType, nominations, chosen, elections: ELECTIONS });
}

/** The one element of a list. */
function only<TItem>(items: ReadonlyArray<TItem>): TItem {
  expect(items).toHaveLength(1);
  return items[0];
}

/** The one new card of an entity of the given type in an election. */
function newCard(entityType: EntityType, election: TestElection): EditorCard {
  return only(cardsOf(entityType, [], [pair(election, 'c1')]));
}

/** The one card of a candidate's stored nomination, with its election chosen at the stored constituency. */
function keptCard(stored: EntityNomination, entityType: EntityType = 'candidate'): EditorCard {
  return only(
    cardsOf(entityType, [stored], [{ electionId: stored.electionId, constituencyId: stored.constituencyId }])
  );
}

/** The one card of a stored nomination whose election is chosen with another constituency. */
function movedCard(stored: EntityNomination, entityType: EntityType = 'candidate'): EditorCard {
  const card = only(cardsOf(entityType, [stored], [{ electionId: stored.electionId, constituencyId: 'c-new' }]));
  expect(card.previousConstituencyId).toBe(stored.constituencyId);
  return card;
}

/** A group's options as one word each: the kind, and for an entity its id. */
function summaryOf(choices: ParentChoices): Array<string> {
  return choices.options.map((option) =>
    option.kind === 'entity' || option.kind === 'unlisted' ? `${option.kind}:${option.entityId}` : option.kind
  );
}

/** The choices of every card over one list of entities, by the card's key. */
function choicesOf(cards: ReadonlyArray<EditorCard>, listed: ReadonlyArray<ListedParent>): Map<string, ParentChoices> {
  return new Map(cards.map((card) => [card.key, parentChoicesOf({ card, listed, locale: LOCALE })]));
}

describe('buildCards', () => {
  it('gives a stored nomination whose election is chosen a kept card that starts from what is stored', () => {
    const stored = nomination({
      id: 'n1',
      electionId: OPEN.id,
      constituencyId: 'c1',
      electionSymbol: '42',
      confirmed: true
    });

    const card = only(cardsOf('candidate', [stored], [pair(OPEN, 'c1')]));

    expect(card.state).toBe('kept');
    expect(card.key).toBe('n1');
    expect(card.nominationId).toBe('n1');
    expect(card.electionId).toBe(OPEN.id);
    expect(card.constituencyId).toBe('c1');
    expect(card.previousConstituencyId).toBeUndefined();
    expect(card.confirmed).toBe(true);
    expect(card.electionSymbol).toBe('42');
    expect(card.stored?.electionSymbol).toBe('42');
  });

  it('gives a stored nomination whose election is not chosen a removed card that still holds what is stored', () => {
    const stored = nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', electionSymbol: '42' });

    const card = only(cardsOf('candidate', [stored], []));

    expect(card.state).toBe('removed');
    expect(card.nominationId).toBe('n1');
    expect(card.constituencyId).toBe('c1');
    expect(card.electionSymbol).toBe('42');
    expect(card.previousConstituencyId).toBeUndefined();
  });

  it('gives a stored nomination whose election is chosen with another constituency one moved card', () => {
    const stored = nomination({
      id: 'n1',
      electionId: OPEN.id,
      constituencyId: 'c1',
      electionSymbol: '42',
      confirmed: true
    });

    const card = only(cardsOf('candidate', [stored], [pair(OPEN, 'c2')]));

    expect(card.state).toBe('kept');
    expect(card.key).toBe('n1');
    expect(card.nominationId).toBe('n1');
    expect(card.constituencyId).toBe('c2');
    expect(card.previousConstituencyId).toBe('c1');
    expect(card.confirmed).toBe(true);
    expect(card.electionSymbol).toBe('42');
  });

  it('gives a chosen pair in whose election the entity has no nomination a new card', () => {
    const card = only(cardsOf('candidate', [], [pair(CLOSED, 'c1')]));

    expect(card.state).toBe('new');
    expect(card.nominationId).toBeUndefined();
    expect(card.stored).toBeUndefined();
    expect(card.electionId).toBe(CLOSED.id);
    expect(card.constituencyId).toBe('c1');
    expect(card.previousConstituencyId).toBeUndefined();
    expect(card.confirmed).toBe(false);
    expect(card.electionSymbol).toBe('');
    expect(card.otherName).toBe('');
  });

  it.each([
    ['chosen', [pair(OPEN, 'c3')], 'kept'],
    ['not chosen', [], 'removed']
  ] as const)(
    'gives several stored nominations of one election a card each, as stored, and no new card (%s)',
    (_, chosen, state) => {
      const stored = [
        nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1' }),
        nomination({ id: 'n2', electionId: OPEN.id, constituencyId: 'c2' })
      ];

      const cards = cardsOf('organization', stored, chosen);

      expect(cards).toHaveLength(2);
      expect(cards.map((card) => card.nominationId)).toEqual(['n1', 'n2']);
      expect(cards.map((card) => card.constituencyId)).toEqual(['c1', 'c2']);
      expect(cards.map((card) => card.state)).toEqual([state, state]);
      expect(cards.map((card) => card.previousConstituencyId)).toEqual([undefined, undefined]);
    }
  );

  it('orders the cards by the elections’ given order, then as stored', () => {
    const stored = [
      nomination({ id: 'in-candidates', electionId: CANDIDATES.id, constituencyId: 'c1' }),
      nomination({ id: 'in-open-2', electionId: OPEN.id, constituencyId: 'c2' }),
      nomination({ id: 'in-open-1', electionId: OPEN.id, constituencyId: 'c1' })
    ];

    const cards = cardsOf('candidate', stored, [pair(CANDIDATES, 'c1'), pair(CLOSED, 'c1')]);

    expect(cards.map((card) => `${card.electionId}/${card.nominationId ?? 'new'}/${card.state}`)).toEqual([
      'closed/new/new',
      'open/in-open-2/removed',
      'open/in-open-1/removed',
      'candidates/in-candidates/kept'
    ]);
  });

  it('gives every stored nomination a card, whatever the selection holds', () => {
    const stored = [
      nomination({ id: 'n1', electionId: CLOSED.id, constituencyId: 'c1' }),
      nomination({ id: 'n2', electionId: OPEN.id, constituencyId: 'c1' }),
      nomination({ id: 'n3', electionId: CANDIDATES.id, constituencyId: 'c1' })
    ];

    for (const chosen of [[], [pair(OPEN, 'c1')], [pair(OPEN, 'c7')], [pair(CLOSED, 'c1'), pair(CANDIDATES, 'c1')]]) {
      const cards = cardsOf('candidate', stored, chosen);
      expect(cards.map((card) => card.nominationId).sort()).toEqual(['n1', 'n2', 'n3']);
    }
  });

  it('gives a nomination whose election is not among those given a card too, after the others', () => {
    const stored = [
      nomination({ id: 'elsewhere', electionId: 'not-given', constituencyId: 'c1' }),
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1' })
    ];

    const cards = cardsOf('candidate', stored, [pair(OPEN, 'c1')]);

    expect(cards.map((card) => `${card.nominationId}/${card.state}`)).toEqual(['n1/kept', 'elsewhere/removed']);
    expect(cards[1].parentRule.types).toEqual([]);
  });

  it('gives a chosen pair whose election is not among those given no card', () => {
    const cards = cardsOf('candidate', [], [pair(OPEN, 'c1'), { electionId: 'not-given', constituencyId: 'c1' }]);

    expect(cards.map((card) => card.electionId)).toEqual([OPEN.id]);
  });

  it('gives a chosen pair in an election that does not admit the entity no card', () => {
    const cards = cardsOf('organization', [], [pair(CANDIDATES, 'c1'), pair(ORGANIZATIONS, 'c1')]);

    expect(cards.map((card) => `${card.electionId}/${card.state}`)).toEqual(['organizations/new']);
  });

  it('reads the first of two chosen pairs that name one election', () => {
    const card = only(cardsOf('candidate', [], [pair(OPEN, 'c1'), pair(OPEN, 'c2')]));

    expect(card.constituencyId).toBe('c1');
  });

  it('gives every card a key of its own', () => {
    const stored = [
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1' }),
      nomination({ id: 'n2', electionId: OPEN.id, constituencyId: 'c2' })
    ];

    const cards = cardsOf('candidate', stored, [pair(CLOSED, 'c1'), pair(CANDIDATES, 'c1')]);

    expect(cards).toHaveLength(4);
    expect(new Set(cards.map((card) => card.key)).size).toBe(4);
  });

  it('returns fresh cards that share nothing with the nominations they were built from', () => {
    const stored = [nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', parent: parentOf(GREEN) })];

    const first = only(cardsOf('candidate', stored, [pair(OPEN, 'c1')]));
    const second = only(cardsOf('candidate', stored, [pair(OPEN, 'c1')]));
    first.electionSymbol = 'changed';
    first.stored!.parent!.entityId = 'changed';

    expect(second).not.toBe(first);
    expect(second.electionSymbol).toBe('');
    expect(second.stored?.parent?.entityId).toBe(GREEN.id);
    expect(stored[0].parent?.entityId).toBe(GREEN.id);
  });

  it.each([
    ['a candidate in a closed list', 'candidate', CLOSED, ['organization'], undefined],
    ['a candidate with lists and independents', 'candidate', OPEN, ['organization'], undefined],
    ['a candidate in a candidates-only election', 'candidate', CANDIDATES, [], undefined],
    ['a party in a closed list', 'organization', CLOSED, ['alliance'], 'none'],
    ['a party with lists and independents', 'organization', OPEN, ['alliance'], 'none'],
    ['a party in an organizations-only election', 'organization', ORGANIZATIONS, ['alliance'], 'none']
  ] as const)('starts the parent choice of a new card of %s', (_, entityType, election, types, choice) => {
    const card = newCard(entityType, election);

    expect(card.parentRule.types).toEqual(types);
    expect(card.parentChoice).toBe(choice);
  });
});

describe('parentChoicesOf — a new card', () => {
  it.each([
    [
      'a candidate in a closed list',
      'candidate',
      CLOSED,
      PARTIES,
      ['entity:org-blue', 'entity:org-green', 'other'],
      true,
      undefined
    ],
    [
      'a candidate with lists and independents',
      'candidate',
      OPEN,
      PARTIES,
      ['entity:org-blue', 'entity:org-green', 'other', 'none'],
      true,
      undefined
    ],
    ['a candidate in a candidates-only election', 'candidate', CANDIDATES, PARTIES, [], false, undefined],
    [
      'a party in a closed list',
      'organization',
      CLOSED,
      ALLIANCES,
      ['entity:all-hills', 'entity:all-coast', 'other', 'none'],
      false,
      'none'
    ],
    [
      'a party with lists and independents',
      'organization',
      OPEN,
      ALLIANCES,
      ['entity:all-hills', 'entity:all-coast', 'other', 'none'],
      false,
      'none'
    ],
    [
      'a party in an organizations-only election',
      'organization',
      ORGANIZATIONS,
      ALLIANCES,
      ['entity:all-hills', 'entity:all-coast', 'other', 'none'],
      false,
      'none'
    ]
  ] as const)('holds the options of %s', (_, entityType, election, listed, options, required, selected) => {
    const card = newCard(entityType, election);

    const choices = parentChoicesOf({ card, listed, locale: LOCALE });

    expect(summaryOf(choices)).toEqual(options);
    expect(choices.required).toBe(required);
    expect(choices.selected).toBe(selected);
    expect(card.parentChoice).toBe(selected);
  });

  it('states an entity option’s value, type and id, and a plain option’s value', () => {
    const choices = parentChoicesOf({ card: newCard('candidate', OPEN), listed: [GREEN], locale: LOCALE });

    expect(choices.options).toEqual([
      { kind: 'entity', value: GREEN.id, entityType: 'organization', entityId: GREEN.id },
      { kind: 'other', value: 'other' },
      { kind: 'none', value: 'none' }
    ]);
  });

  it.each([
    ['a candidate with lists and independents', 'candidate', OPEN, PARTIES],
    ['a party', 'organization', OPEN, ALLIANCES]
  ] as const)(
    'ends with the typed-name option and then the option that names no parent, where a parent need not be named (%s)',
    (_, entityType, election, listed) => {
      const kinds = parentChoicesOf({ card: newCard(entityType, election), listed, locale: LOCALE }).options.map(
        (option) => option.kind
      );

      expect(kinds.length).toBeGreaterThan(2);
      expect(kinds.slice(-2)).toEqual(['other', 'none']);
      expect(kinds.slice(0, -2).every((kind) => kind === 'entity')).toBe(true);
    }
  );

  it('holds an option for no entity it was not given', () => {
    const choices = parentChoicesOf({ card: newCard('candidate', CLOSED), listed: [], locale: LOCALE });

    expect(summaryOf(choices)).toEqual(['other']);
    expect(choices.required).toBe(true);
  });

  it('never holds a faction, nor an entity of another type than the election pairs with the entity', () => {
    const listed = [FACTION, COAST, GREEN];

    expect(summaryOf(parentChoicesOf({ card: newCard('candidate', OPEN), listed, locale: LOCALE }))).toEqual([
      'entity:org-green',
      'other',
      'none'
    ]);
    expect(summaryOf(parentChoicesOf({ card: newCard('organization', OPEN), listed, locale: LOCALE }))).toEqual([
      'entity:all-coast',
      'other',
      'none'
    ]);
  });

  it('holds an entity that is listed twice once', () => {
    const choices = parentChoicesOf({
      card: newCard('candidate', CLOSED),
      listed: [GREEN, BLUE, GREEN],
      locale: LOCALE
    });

    expect(summaryOf(choices)).toEqual(['entity:org-blue', 'entity:org-green', 'other']);
  });

  it('orders the listed entities by name in the given locale', () => {
    const listed: Array<ListedParent> = [
      { entityType: 'organization', id: 'z', name: 'Zebra' },
      { entityType: 'organization', id: 'a-umlaut', name: 'Äpple' },
      { entityType: 'organization', id: 'a', name: 'apple' }
    ];
    const card = newCard('candidate', CLOSED);

    expect(summaryOf(parentChoicesOf({ card, listed, locale: 'sv' }))).toEqual([
      'entity:a',
      'entity:z',
      'entity:a-umlaut',
      'other'
    ]);
    expect(summaryOf(parentChoicesOf({ card, listed, locale: 'de' }))).toEqual([
      'entity:a',
      'entity:a-umlaut',
      'entity:z',
      'other'
    ]);
  });

  it('orders entities of one name by id', () => {
    const listed: Array<ListedParent> = [
      { entityType: 'organization', id: 'id-3', name: 'Same Name' },
      { entityType: 'organization', id: 'id-1', name: 'Same Name' },
      { entityType: 'organization', id: 'id-2', name: 'Same Name' }
    ];

    const choices = parentChoicesOf({ card: newCard('candidate', CLOSED), listed, locale: LOCALE });

    expect(summaryOf(choices)).toEqual(['entity:id-1', 'entity:id-2', 'entity:id-3', 'other']);
  });

  it('returns a fresh answer on every call and leaves the list it was given as it is', () => {
    const listed = [GREEN, BLUE];
    const card = newCard('candidate', CLOSED);

    const first = parentChoicesOf({ card, listed, locale: LOCALE });
    const second = parentChoicesOf({ card, listed, locale: LOCALE });

    expect(first.options).toHaveLength(3);
    expect(first).not.toBe(second);
    expect(first.options).not.toBe(second.options);
    expect(first.options[0]).not.toBe(second.options[0]);
    expect(listed).toEqual([GREEN, BLUE]);
  });
});

describe('parentChoicesOf — an existing card', () => {
  it('chooses a stored parent that is listed', () => {
    const card = keptCard(
      nomination({ id: 'n1', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(GREEN) })
    );

    const choices = parentChoicesOf({ card, listed: PARTIES, locale: LOCALE });

    expect(summaryOf(choices)).toEqual(['entity:org-blue', 'entity:org-green', 'other']);
    expect(choices.selected).toBe(GREEN.id);
    expect(card.parentChoice).toBe(GREEN.id);
    expect(choices.required).toBe(true);
  });

  it('chooses the typed-name option for a stored typed name, with the name', () => {
    const card = keptCard(
      nomination({
        id: 'n1',
        electionId: CLOSED.id,
        constituencyId: 'c1',
        customData: { requestedParentOrganization: '  A New Party ' }
      })
    );

    const choices = parentChoicesOf({ card, listed: PARTIES, locale: LOCALE });

    expect(choices.selected).toBe('other');
    expect(card.parentChoice).toBe('other');
    expect(card.otherName).toBe('A New Party');
    expect(card.stored?.otherName).toBe('A New Party');
  });

  it.each([
    ['a candidate with lists and independents', 'candidate', OPEN, 'none'],
    ['a party', 'organization', OPEN, 'none'],
    ['a candidate in a closed list', 'candidate', CLOSED, undefined]
  ] as const)(
    'chooses the option that names no parent for a stored nomination with neither, where there is one (%s)',
    (_, entityType, election, selected) => {
      const card = keptCard(nomination({ id: 'n1', electionId: election.id, constituencyId: 'c1' }), entityType);

      const choices = parentChoicesOf({ card, listed: [...PARTIES, ...ALLIANCES], locale: LOCALE });

      expect(choices.options.length).toBeGreaterThan(0);
      expect(choices.selected).toBe(selected);
      expect(card.parentChoice).toBe(selected);
      expect(card.otherName).toBe('');
    }
  );

  it.each([
    ['a blank string', { requestedParentOrganization: '   ' }],
    ['not a string', { requestedParentOrganization: 7 }],
    ['another key', { somethingElse: 'A New Party' }]
  ])('reads no typed name from custom data that holds %s', (_, customData) => {
    const card = keptCard(nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', customData }));

    expect(card.parentRule.types).toEqual(['organization']);
    expect(card.parentChoice).toBe('none');
    expect(card.otherName).toBe('');
  });

  it('adds a stored parent that is not listed as the first option, and chooses it', () => {
    const card = keptCard(
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', parent: parentOf(UNLISTED_PARTY) })
    );

    const choices = parentChoicesOf({ card, listed: PARTIES, locale: LOCALE });

    expect(summaryOf(choices)).toEqual(['unlisted:org-old', 'entity:org-blue', 'entity:org-green', 'other', 'none']);
    expect(choices.options[0]).toEqual({
      kind: 'unlisted',
      value: UNLISTED_PARTY.id,
      entityType: 'organization',
      entityId: UNLISTED_PARTY.id
    });
    expect(choices.selected).toBe(UNLISTED_PARTY.id);
    expect(card.parentChoice).toBe(UNLISTED_PARTY.id);
  });

  it('adds a stored parent of a type that is never listed, such as a faction, in the same way', () => {
    const card = keptCard(
      nomination({ id: 'n1', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(FACTION) })
    );

    const choices = parentChoicesOf({ card, listed: PARTIES, locale: LOCALE });

    expect(summaryOf(choices)).toEqual(['unlisted:fac-1', 'entity:org-blue', 'entity:org-green', 'other']);
    expect(choices.selected).toBe(FACTION.id);
  });

  it('keeps the unlisted option in the group while another option is chosen', () => {
    const card = keptCard(
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', parent: parentOf(UNLISTED_PARTY) })
    );
    card.parentChoice = GREEN.id;

    const choices = parentChoicesOf({ card, listed: PARTIES, locale: LOCALE });

    expect(summaryOf(choices)[0]).toBe('unlisted:org-old');
    expect(choices.selected).toBe(UNLISTED_PARTY.id);
  });

  it('holds no group for an existing card in an election that asks for no parent', () => {
    const card = keptCard(
      nomination({ id: 'n1', electionId: CANDIDATES.id, constituencyId: 'c1', parent: parentOf(GREEN) })
    );

    const choices = parentChoicesOf({ card, listed: PARTIES, locale: LOCALE });

    expect(card.state).toBe('kept');
    expect(choices).toEqual({ options: [], selected: undefined, required: false });
  });
});

describe('parentChoicesOf — a moved card', () => {
  it('chooses a stored parent that is listed', () => {
    const card = movedCard(
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', parent: parentOf(GREEN) })
    );

    const choices = parentChoicesOf({ card, listed: PARTIES, locale: LOCALE });

    expect(summaryOf(choices)).toEqual(['entity:org-blue', 'entity:org-green', 'other', 'none']);
    expect(choices.selected).toBe(GREEN.id);
  });

  it('keeps a stored parent that is not listed where its type is the one the election pairs with the entity', () => {
    const card = movedCard(
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', parent: parentOf(UNLISTED_PARTY) })
    );

    const choices = parentChoicesOf({ card, listed: PARTIES, locale: LOCALE });

    expect(summaryOf(choices)).toEqual(['unlisted:org-old', 'entity:org-blue', 'entity:org-green', 'other', 'none']);
    expect(choices.selected).toBe(UNLISTED_PARTY.id);
    expect(card.parentChoice).toBe(UNLISTED_PARTY.id);
  });

  it.each([
    [
      'a candidate under a faction, in a closed list',
      'candidate',
      CLOSED,
      FACTION,
      ['entity:org-blue', 'entity:org-green', 'other'],
      undefined
    ],
    [
      'a party under an organization',
      'organization',
      OPEN,
      GREEN,
      ['entity:all-hills', 'entity:all-coast', 'other', 'none'],
      'none'
    ]
  ] as const)(
    'starts as a new card does where the stored parent is of another type (%s)',
    (_, entityType, election, parent, options, selected) => {
      const card = movedCard(
        nomination({ id: 'n1', electionId: election.id, constituencyId: 'c1', parent: parentOf(parent) }),
        entityType
      );

      const choices = parentChoicesOf({ card, listed: [...PARTIES, ...ALLIANCES], locale: LOCALE });

      expect(summaryOf(choices)).toEqual(options);
      expect(choices.selected).toBe(selected);
      expect(card.parentChoice).toBe(selected);
    }
  );

  it('chooses the typed-name option for a stored typed name, with the name', () => {
    const card = movedCard(
      nomination({
        id: 'n1',
        electionId: CLOSED.id,
        constituencyId: 'c1',
        customData: { requestedParentOrganization: 'A New Party' }
      })
    );

    expect(parentChoicesOf({ card, listed: PARTIES, locale: LOCALE }).selected).toBe('other');
    expect(card.otherName).toBe('A New Party');
  });
});

describe('somethingToWrite', () => {
  /** Three stored nominations of a candidate, each chosen at its stored constituency. */
  function storedCards(): Array<EditorCard> {
    const stored = [
      nomination({
        id: 'n1',
        electionId: CLOSED.id,
        constituencyId: 'c1',
        electionSymbol: '7',
        parent: parentOf(GREEN)
      }),
      nomination({
        id: 'n2',
        electionId: OPEN.id,
        constituencyId: 'c1',
        customData: { requestedParentOrganization: 'A New Party' }
      }),
      nomination({ id: 'n3', electionId: CANDIDATES.id, constituencyId: 'c1', electionSymbol: '9' })
    ];
    const cards = cardsOf('candidate', stored, [pair(CLOSED, 'c1'), pair(OPEN, 'c1'), pair(CANDIDATES, 'c1')]);
    expect(cards.map((card) => card.state)).toEqual(['kept', 'kept', 'kept']);
    return cards;
  }

  it('is false for cards as built from stored nominations', () => {
    expect(somethingToWrite(storedCards())).toBe(false);
  });

  it('is false for no card', () => {
    expect(storedCards()).toHaveLength(3);
    expect(somethingToWrite([])).toBe(false);
  });

  it('is true for a new card', () => {
    expect(somethingToWrite(cardsOf('candidate', [], [pair(OPEN, 'c1')]))).toBe(true);
  });

  it('is true for a removed card', () => {
    const cards = storedCards();
    cards[2].state = 'removed';

    expect(somethingToWrite(cards)).toBe(true);
  });

  it('is true for a moved card', () => {
    const cards = [movedCard(nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1' }))];

    expect(somethingToWrite(cards)).toBe(true);
  });

  it.each([
    ['a changed symbol', (cards: Array<EditorCard>) => (cards[0].electionSymbol = '8')],
    ['a symbol where none is stored', (cards: Array<EditorCard>) => (cards[1].electionSymbol = '1')],
    ['a removed symbol', (cards: Array<EditorCard>) => (cards[0].electionSymbol = '')],
    ['a changed choice', (cards: Array<EditorCard>) => (cards[0].parentChoice = BLUE.id)],
    ['a choice changed to the typed name', (cards: Array<EditorCard>) => (cards[0].parentChoice = 'other')],
    ['a changed typed name', (cards: Array<EditorCard>) => (cards[1].otherName = 'Another Party')]
  ])('is true for a kept card with %s', (_, change) => {
    const cards = storedCards();
    change(cards);

    expect(somethingToWrite(cards)).toBe(true);
  });

  it.each([
    [
      'a symbol that differs by surrounding white space',
      (cards: Array<EditorCard>) => (cards[0].electionSymbol = '  7 ')
    ],
    [
      'a typed name that differs by surrounding white space',
      (cards: Array<EditorCard>) => (cards[1].otherName = ' A New Party  ')
    ],
    [
      'a typed name while another option is chosen',
      (cards: Array<EditorCard>) => (cards[0].otherName = 'Typed and left')
    ]
  ])('is false for a kept card with %s', (_, change) => {
    const cards = storedCards();
    change(cards);

    expect(cards).toHaveLength(3);
    expect(somethingToWrite(cards)).toBe(false);
  });
});

describe('validateCards', () => {
  it.each([
    ['a closed list', CLOSED],
    ['lists and independents', OPEN]
  ] as const)('reports a candidate’s group with nothing chosen (%s)', (_, election) => {
    const cards = cardsOf('candidate', [], [pair(election, 'c1')]);

    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([
      { key: only(cards).key, error: 'parentRequired' }
    ]);
  });

  it('reports a chosen value that is no option of the group as nothing chosen', () => {
    const cards = cardsOf('candidate', [], [pair(OPEN, 'c1')]);
    only(cards).parentChoice = 'org-gone';

    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([{ key: cards[0].key, error: 'parentRequired' }]);
  });

  it.each([
    ['a listed party', GREEN.id],
    ['the option that names no parent', 'none']
  ])('reports nothing once a candidate has chosen %s', (_, choice) => {
    const cards = cardsOf('candidate', [], [pair(OPEN, 'c1')]);
    only(cards).parentChoice = choice;

    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([]);
  });

  it('reports nothing for a party’s untouched group', () => {
    const cards = cardsOf('organization', [], [pair(OPEN, 'c1'), pair(ORGANIZATIONS, 'c1')]);

    expect(cards.map((card) => card.parentChoice)).toEqual(['none', 'none']);
    expect(validateCards(cards, choicesOf(cards, ALLIANCES))).toEqual([]);
  });

  it('reports nothing for a card with no parent group', () => {
    const cards = cardsOf('candidate', [], [pair(CANDIDATES, 'c1')]);

    expect(only(cards).parentChoice).toBeUndefined();
    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([]);
  });

  it.each([
    ['empty', ''],
    ['white space alone', '   ']
  ])('reports the typed-name option with a name that is %s', (_, name) => {
    const cards = cardsOf('organization', [], [pair(OPEN, 'c1')]);
    only(cards).parentChoice = 'other';
    cards[0].otherName = name;

    expect(validateCards(cards, choicesOf(cards, ALLIANCES))).toEqual([
      { key: cards[0].key, error: 'otherNameRequired' }
    ]);
  });

  it('reports nothing for the typed-name option with a name', () => {
    const cards = cardsOf('candidate', [], [pair(CLOSED, 'c1')]);
    only(cards).parentChoice = 'other';
    cards[0].otherName = ' A New Party ';

    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([]);
  });

  /** Two stored nominations of a candidate at one election and constituency, under two parties. */
  function twoAtOneContest(): Array<EditorCard> {
    const stored = [
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', parent: parentOf(GREEN) }),
      nomination({ id: 'n2', electionId: OPEN.id, constituencyId: 'c1', parent: parentOf(BLUE) })
    ];
    const cards = cardsOf('candidate', stored, [pair(OPEN, 'c1')]);
    expect(cards.map((card) => card.parentChoice)).toEqual([GREEN.id, BLUE.id]);
    return cards;
  }

  it('reports the second of two cards of one election and constituency that name the same listed parent', () => {
    const cards = twoAtOneContest();
    cards[1].parentChoice = GREEN.id;

    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([{ key: 'n2', error: 'duplicateParent' }]);
  });

  it('reports nothing for two cards of one election and constituency that name different parents', () => {
    const cards = twoAtOneContest();

    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([]);
  });

  it('reports nothing for two cards of one election in different constituencies that name the same parent', () => {
    const stored = [
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', parent: parentOf(GREEN) }),
      nomination({ id: 'n2', electionId: OPEN.id, constituencyId: 'c2', parent: parentOf(GREEN) })
    ];
    const cards = cardsOf('candidate', stored, [pair(OPEN, 'c1')]);

    expect(cards.map((card) => card.parentChoice)).toEqual([GREEN.id, GREEN.id]);
    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([]);
  });

  it('reports nothing for two cards of one election and constituency that both name no parent', () => {
    const cards = twoAtOneContest();
    cards[0].parentChoice = 'none';
    cards[1].parentChoice = 'none';

    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([]);
  });

  it('reports each unfinished card, in the cards’ order', () => {
    const cards = cardsOf('candidate', [], [pair(OPEN, 'c1'), pair(CLOSED, 'c1'), pair(CANDIDATES, 'c1')]);
    expect(cards.map((card) => card.electionId)).toEqual([CLOSED.id, OPEN.id, CANDIDATES.id]);
    cards[1].parentChoice = 'other';

    expect(validateCards(cards, choicesOf(cards, PARTIES))).toEqual([
      { key: cards[0].key, error: 'parentRequired' },
      { key: cards[1].key, error: 'otherNameRequired' }
    ]);
  });

  it('never reports a removed card, and never counts one as a duplicate', () => {
    const cards = twoAtOneContest();
    cards[0].state = 'removed';
    cards[1].parentChoice = GREEN.id;
    const unfinished = keptCard(nomination({ id: 'n3', electionId: CLOSED.id, constituencyId: 'c1' }));
    expect(unfinished.parentChoice).toBeUndefined();
    unfinished.state = 'removed';
    const all = [...cards, unfinished];

    expect(validateCards(all, choicesOf(all, PARTIES))).toEqual([]);
  });
});

describe('desiredSetOf', () => {
  it('names a new card without an id, with its trimmed symbol and its chosen parent', () => {
    const card = newCard('candidate', OPEN);
    card.electionSymbol = '  42 ';
    card.parentChoice = GREEN.id;

    expect(desiredSetOf([card], LISTED)).toStrictEqual([
      {
        electionId: OPEN.id,
        constituencyId: 'c1',
        electionSymbol: '42',
        parent: { kind: 'entity', entityType: 'organization', entityId: GREEN.id }
      }
    ]);
  });

  it('names an alliance as the parent of a party', () => {
    const card = newCard('organization', ORGANIZATIONS);
    card.parentChoice = COAST.id;

    expect(only(desiredSetOf([card], LISTED)).parent).toStrictEqual({
      kind: 'entity',
      entityType: 'alliance',
      entityId: COAST.id
    });
  });

  it.each([
    ['a candidate who chose it', 'candidate'],
    ['a party that left it chosen', 'organization']
  ] as const)('says no parent for the option that names none (%s)', (_, entityType) => {
    const card = newCard(entityType, OPEN);
    card.parentChoice = 'none';

    expect(only(desiredSetOf([card], LISTED)).parent).toStrictEqual({ kind: 'none' });
  });

  it('says the trimmed name for the typed-name option', () => {
    const card = newCard('candidate', CLOSED);
    card.parentChoice = 'other';
    card.otherName = '  A New Party ';

    expect(only(desiredSetOf([card], LISTED)).parent).toStrictEqual({ kind: 'other', name: 'A New Party' });
  });

  it('says no parent for a new card in an election that asks for none', () => {
    const card = newCard('candidate', CANDIDATES);

    expect(desiredSetOf([card], LISTED)).toStrictEqual([
      { electionId: CANDIDATES.id, constituencyId: 'c1', electionSymbol: '', parent: { kind: 'none' } }
    ]);
  });

  it('names an existing card with its id', () => {
    const card = keptCard(nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', electionSymbol: '7' }));
    card.electionSymbol = ' 8 ';

    expect(desiredSetOf([card], LISTED)).toStrictEqual([
      { id: 'n1', electionId: OPEN.id, constituencyId: 'c1', electionSymbol: '8', parent: { kind: 'none' } }
    ]);
  });

  it('says that the parent is kept for an unlisted option left chosen', () => {
    const card = keptCard(
      nomination({ id: 'n1', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(UNLISTED_PARTY) })
    );

    expect(only(desiredSetOf([card], LISTED)).parent).toStrictEqual({ kind: 'keep' });
  });

  it('says that the parent is kept for a stored listed parent left chosen', () => {
    const card = keptCard(
      nomination({ id: 'n1', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(GREEN) })
    );
    card.electionSymbol = '5';

    expect(desiredSetOf([card], LISTED)).toStrictEqual([
      { id: 'n1', electionId: CLOSED.id, constituencyId: 'c1', electionSymbol: '5', parent: { kind: 'keep' } }
    ]);
  });

  it('names another listed entity once the choice is changed from the stored parent', () => {
    const card = keptCard(
      nomination({ id: 'n1', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(GREEN) })
    );
    card.parentChoice = BLUE.id;

    expect(only(desiredSetOf([card], LISTED)).parent).toStrictEqual({
      kind: 'entity',
      entityType: 'organization',
      entityId: BLUE.id
    });
  });

  it('says that the parent is kept for an existing card in an election that asks for none', () => {
    const card = keptCard(nomination({ id: 'n1', electionId: CANDIDATES.id, constituencyId: 'c1' }));

    expect(only(desiredSetOf([card], LISTED)).parent).toStrictEqual({ kind: 'keep' });
  });

  it('names a moved card with its id and the new constituency, and never says keep for it', () => {
    const listedParent = movedCard(
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1', electionSymbol: '7', parent: parentOf(GREEN) })
    );
    const unlistedParent = movedCard(
      nomination({ id: 'n2', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(UNLISTED_PARTY) })
    );
    const noGroup = movedCard(nomination({ id: 'n3', electionId: CANDIDATES.id, constituencyId: 'c1' }));

    expect(desiredSetOf([listedParent, unlistedParent, noGroup], LISTED)).toStrictEqual([
      {
        id: 'n1',
        electionId: OPEN.id,
        constituencyId: 'c-new',
        electionSymbol: '7',
        parent: { kind: 'entity', entityType: 'organization', entityId: GREEN.id }
      },
      {
        id: 'n2',
        electionId: CLOSED.id,
        constituencyId: 'c-new',
        electionSymbol: '',
        parent: { kind: 'entity', entityType: 'organization', entityId: UNLISTED_PARTY.id }
      },
      { id: 'n3', electionId: CANDIDATES.id, constituencyId: 'c-new', electionSymbol: '', parent: { kind: 'none' } }
    ]);
  });

  it('leaves removed cards out and names every other card, in the cards’ order', () => {
    const stored = [
      nomination({ id: 'n1', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(GREEN) }),
      nomination({ id: 'n2', electionId: OPEN.id, constituencyId: 'c1' }),
      nomination({ id: 'n3', electionId: CANDIDATES.id, constituencyId: 'c1' })
    ];
    const cards = cardsOf('candidate', stored, [pair(CLOSED, 'c1'), pair(CANDIDATES, 'c1')]);
    expect(cards.map((card) => card.state)).toEqual(['kept', 'removed', 'kept']);

    expect(desiredSetOf(cards, LISTED).map((desired) => desired.id)).toEqual(['n1', 'n3']);
  });

  it('answers an empty set when every card is removed', () => {
    const cards = cardsOf('candidate', [nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1' })], []);

    expect(only(cards).state).toBe('removed');
    expect(desiredSetOf(cards, LISTED)).toEqual([]);
  });

  it.each([
    ['a closed list', CLOSED],
    ['lists and independents', OPEN]
  ] as const)(
    'refuses a candidate’s card with nothing chosen instead of reading it as no parent (%s)',
    (_, election) => {
      const card = newCard('candidate', election);

      expect(card.parentChoice).toBeUndefined();
      expect(() => desiredSetOf([card], LISTED)).toThrow();
    }
  );

  it('names the type of the listed entity that was chosen, where a parent may be of more than one type', () => {
    const card = newCard('organization', OPEN);
    card.parentRule = { ...card.parentRule, types: ['organization', 'alliance'] };
    card.parentChoice = COAST.id;

    expect(only(desiredSetOf([card], LISTED)).parent).toStrictEqual({
      kind: 'entity',
      entityType: 'alliance',
      entityId: COAST.id
    });
  });

  it('refuses a chosen entity that is not listed instead of naming it under a type it may not have', () => {
    const card = newCard('candidate', OPEN);
    card.parentChoice = COAST.id;

    expect(() => desiredSetOf([card], LISTED)).toThrow();
    expect(() => desiredSetOf([card], [])).toThrow();
  });

  it('refuses the typed-name option with a blank name', () => {
    const card = newCard('candidate', CLOSED);
    card.parentChoice = 'other';
    card.otherName = '  ';

    expect(() => desiredSetOf([card], LISTED)).toThrow();
  });

  it('returns fresh objects', () => {
    const card = newCard('organization', OPEN);

    const first = desiredSetOf([card], LISTED);
    const second = desiredSetOf([card], LISTED);

    expect(first).toHaveLength(1);
    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
    expect(first[0].parent).not.toBe(second[0].parent);
  });
});

describe('draftFactsOf', () => {
  /** One stored nomination of a candidate, chosen as stored. */
  function unchanged(): Array<EditorCard> {
    return [keptCard(nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1' }))];
  }

  it('says nothing is to be written for cards as stored', () => {
    expect(draftFactsOf(unchanged(), true)).toStrictEqual({
      somethingToWrite: false,
      anyKeptOrNew: true,
      hadNomination: true
    });
  });

  it('says something is to be written, and a card is kept, for a changed card', () => {
    const cards = unchanged();
    cards[0].electionSymbol = '3';

    expect(draftFactsOf(cards, true)).toStrictEqual({
      somethingToWrite: true,
      anyKeptOrNew: true,
      hadNomination: true
    });
  });

  it('says a card is new for an entity that had no nomination', () => {
    const cards = cardsOf('candidate', [], [pair(OPEN, 'c1')]);

    expect(draftFactsOf(cards, false)).toStrictEqual({
      somethingToWrite: true,
      anyKeptOrNew: true,
      hadNomination: false
    });
  });

  it('says no card is kept or new when every card is removed', () => {
    const cards = unchanged();
    cards[0].state = 'removed';

    expect(draftFactsOf(cards, true)).toStrictEqual({
      somethingToWrite: true,
      anyKeptOrNew: false,
      hadNomination: true
    });
  });

  it('says a card is kept or new when one of several is removed', () => {
    const stored = [
      nomination({ id: 'n1', electionId: OPEN.id, constituencyId: 'c1' }),
      nomination({ id: 'n2', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(GREEN) })
    ];
    const cards = cardsOf('candidate', stored, [pair(OPEN, 'c1')]);

    expect(cards.map((card) => card.state)).toEqual(['removed', 'kept']);
    expect(draftFactsOf(cards, true)).toStrictEqual({
      somethingToWrite: true,
      anyKeptOrNew: true,
      hadNomination: true
    });
  });
});

describe('sameNominations', () => {
  const FIRST = nomination({
    id: 'n1',
    electionId: OPEN.id,
    constituencyId: 'c1',
    electionSymbol: '7',
    confirmed: true,
    customData: { requestedParentOrganization: 'A New Party', other: { nested: [1, 2] } }
  });
  const SECOND = nomination({ id: 'n2', electionId: CLOSED.id, constituencyId: 'c1', parent: parentOf(GREEN) });

  /** A deep copy, so that no case passes on identity. */
  function copyOf<TValue>(value: TValue): TValue {
    return structuredClone(value);
  }

  it('is true for equal lists that share no object', () => {
    expect(sameNominations([FIRST, SECOND], copyOf([FIRST, SECOND]))).toBe(true);
  });

  it('is true for two empty lists', () => {
    expect(sameNominations([FIRST], [SECOND])).toBe(false);
    expect(sameNominations([], [])).toBe(true);
  });

  it('is true for the same rows in a different order', () => {
    expect(sameNominations([FIRST, SECOND], copyOf([SECOND, FIRST]))).toBe(true);
  });

  it('is true for custom data whose keys are in another order', () => {
    const reordered = {
      ...FIRST,
      customData: { other: { nested: [1, 2] }, requestedParentOrganization: 'A New Party' }
    };

    expect(sameNominations([FIRST], [reordered])).toBe(true);
  });

  it.each([
    ['a changed symbol', { electionSymbol: '8' }],
    ['a changed constituency', { constituencyId: 'c2' }],
    ['a changed election', { electionId: CLOSED.id }],
    ['a changed round', { electionRound: 2 }],
    ['a changed confirmation', { confirmed: false }],
    ['a changed typed name', { customData: { requestedParentOrganization: 'Another', other: { nested: [1, 2] } } }],
    [
      'changed nested custom data',
      { customData: { requestedParentOrganization: 'A New Party', other: { nested: [1] } } }
    ],
    ['removed custom data', { customData: null }],
    ['a later update', { updatedAt: '2026-10-02T08:30:00.5+00:00' }],
    ['a parent where there was none', { parent: parentOf(GREEN) }]
  ] as const)('is false for %s', (_, change) => {
    expect(sameNominations([FIRST, SECOND], [{ ...copyOf(FIRST), ...change }, SECOND])).toBe(false);
  });

  it.each([
    ['another parent', { parent: parentOf(BLUE) }],
    ['a parent of another type with the same id', { parent: { ...parentOf(GREEN), entityType: 'faction' as const } }],
    ['no parent where there was one', { parent: undefined }]
  ])('is false for %s', (_, change) => {
    expect(sameNominations([FIRST, SECOND], [FIRST, { ...copyOf(SECOND), ...change }])).toBe(false);
  });

  it.each([
    ['a missing row', [FIRST]],
    ['an added row', [FIRST, SECOND, nomination({ id: 'n3', electionId: OPEN.id, constituencyId: 'c2' })]],
    ['another row in a row’s place', [FIRST, { ...SECOND, id: 'n9' }]]
  ])('is false for %s', (_, other) => {
    expect(sameNominations([FIRST, SECOND], other)).toBe(false);
    expect(sameNominations(other, [FIRST, SECOND])).toBe(false);
  });

  it('does not compare the names a nomination is shown with', () => {
    const renamed = {
      ...copyOf(SECOND),
      electionName: 'Renamed election',
      constituencyName: 'Renamed constituency',
      parent: { ...parentOf(GREEN), name: 'Renamed party', shortName: 'RP' }
    };

    expect(sameNominations([FIRST, SECOND], [FIRST, { ...SECOND, electionSymbol: 'x' }])).toBe(false);
    expect(sameNominations([FIRST, SECOND], [FIRST, renamed])).toBe(true);
  });
});
