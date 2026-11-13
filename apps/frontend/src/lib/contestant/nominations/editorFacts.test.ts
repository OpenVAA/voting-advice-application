import { describe, expect, it } from 'vitest';
import {
  admissibleElectionsOf,
  constituencyChoiceOf,
  inReachNominationsOf,
  nominationsEditableOf,
  startingSelectionOf
} from './editorFacts';
import type { NominationShape } from '@openvaa/data';

/**
 * The contract of `editorFacts.ts`: who may edit nominations, which elections admit an entity, which nominations the editor manages, and what the selection starts from for an entity that has nominations. The module is given values, so the elections and nominations here are plain objects that hold the members it reads.
 */

type TestElection = { id: string; round: number; nominationShape: NominationShape };

const CLOSED_LIST: TestElection = { id: 'closed-list', round: 1, nominationShape: 'organization_list' };
const OPEN_LIST: TestElection = { id: 'open-list', round: 1, nominationShape: 'organization_list_and_independents' };
const CANDIDATES_ONLY: TestElection = { id: 'candidates-only', round: 1, nominationShape: 'candidate_only' };
const ORGANIZATIONS_ONLY: TestElection = { id: 'organizations-only', round: 1, nominationShape: 'organization_only' };
const SECOND_ROUND: TestElection = {
  id: 'second-round',
  round: 2,
  nominationShape: 'organization_list_and_independents'
};

const ELECTIONS = [CLOSED_LIST, CANDIDATES_ONLY, OPEN_LIST, ORGANIZATIONS_ONLY, SECOND_ROUND];

describe('nominationsEditableOf', () => {
  it.each([
    [false, false, true],
    [true, false, false],
    [false, true, false],
    [true, true, false]
  ])('with nominationsLocked %s and answersLocked %s answers %s', (nominationsLocked, answersLocked, expected) => {
    expect(nominationsEditableOf({ nominationsLocked, answersLocked })).toBe(expected);
  });
});

describe('admissibleElectionsOf', () => {
  it('leaves an organizations-only election out for a candidate, and keeps the given order', () => {
    expect(admissibleElectionsOf(ELECTIONS, 'candidate').map((election) => election.id)).toEqual([
      'closed-list',
      'candidates-only',
      'open-list',
      'second-round'
    ]);
  });

  it('leaves a candidates-only election out for an organization, and keeps the given order', () => {
    expect(admissibleElectionsOf(ELECTIONS, 'organization').map((election) => election.id)).toEqual([
      'closed-list',
      'open-list',
      'organizations-only',
      'second-round'
    ]);
  });

  it('follows the order it is given, whatever that is', () => {
    const reversed = [...ELECTIONS].reverse();

    expect(admissibleElectionsOf(reversed, 'candidate').map((election) => election.id)).toEqual([
      'second-round',
      'open-list',
      'candidates-only',
      'closed-list'
    ]);
  });

  it('answers the objects it was given, in a list of its own', () => {
    const first = admissibleElectionsOf(ELECTIONS, 'candidate');
    const second = admissibleElectionsOf(ELECTIONS, 'candidate');

    expect(first).toHaveLength(4);
    expect(first[0]).toBe(CLOSED_LIST);
    expect(first).not.toBe(second);
    expect(first).not.toBe(ELECTIONS);
  });

  it('answers nothing for no election', () => {
    expect(admissibleElectionsOf(ELECTIONS, 'candidate')).not.toEqual([]);
    expect(admissibleElectionsOf([], 'candidate')).toEqual([]);
  });
});

describe('inReachNominationsOf', () => {
  /** One nomination of an entity: the members the function reads, and an id to tell the rows apart. */
  function nomination(id: string, election: TestElection, electionRound = election.round) {
    return { id, electionId: election.id, electionRound };
  }

  it('holds a nomination at its election’s current round in an admissible election', () => {
    const nominations = [nomination('a', OPEN_LIST), nomination('b', SECOND_ROUND), nomination('c', CANDIDATES_ONLY)];

    const inReach = inReachNominationsOf({ nominations, elections: ELECTIONS, entityType: 'candidate' });

    expect(inReach.map((row) => row.id)).toEqual(['a', 'b', 'c']);
    expect(inReach[0]).toBe(nominations[0]);
    expect(inReach).not.toBe(nominations);
  });

  it('leaves out a nomination at another round than its election’s current one', () => {
    const nominations = [
      nomination('first-round-row', SECOND_ROUND, 1),
      nomination('current-row', SECOND_ROUND),
      nomination('later-row', OPEN_LIST, 2)
    ];

    const inReach = inReachNominationsOf({ nominations, elections: ELECTIONS, entityType: 'candidate' });

    expect(inReach.map((row) => row.id)).toEqual(['current-row']);
  });

  it.each([
    ['candidate', ORGANIZATIONS_ONLY, CANDIDATES_ONLY],
    ['organization', CANDIDATES_ONLY, ORGANIZATIONS_ONLY]
  ] as const)(
    'leaves out a nomination of a %s in an election that does not admit it',
    (entityType, refusing, admitting) => {
      const nominations = [nomination('refused', refusing), nomination('admitted', admitting)];

      const inReach = inReachNominationsOf({ nominations, elections: ELECTIONS, entityType });

      expect(inReach.map((row) => row.id)).toEqual(['admitted']);
    }
  );

  it('leaves out a nomination in an election that is not among those given', () => {
    const nominations = [nomination('known', OPEN_LIST), nomination('unknown', CLOSED_LIST)];

    const inReach = inReachNominationsOf({
      nominations,
      elections: [OPEN_LIST, CANDIDATES_ONLY],
      entityType: 'candidate'
    });

    expect(inReach.map((row) => row.id)).toEqual(['known']);
  });

  it('keeps the order of the nominations, and every row of one election', () => {
    const nominations = [
      nomination('z', OPEN_LIST),
      nomination('a', CLOSED_LIST),
      nomination('m', OPEN_LIST),
      nomination('out', ORGANIZATIONS_ONLY)
    ];

    const inReach = inReachNominationsOf({ nominations, elections: ELECTIONS, entityType: 'candidate' });

    expect(inReach.map((row) => row.id)).toEqual(['z', 'a', 'm']);
  });

  it('answers nothing for no nomination', () => {
    expect(
      inReachNominationsOf({ nominations: [nomination('a', OPEN_LIST)], elections: ELECTIONS, entityType: 'candidate' })
    ).toHaveLength(1);
    expect(inReachNominationsOf({ nominations: [], elections: ELECTIONS, entityType: 'candidate' })).toEqual([]);
  });
});

describe('startingSelectionOf', () => {
  /** One nomination of an entity, as the function reads it. */
  function nomination(election: TestElection, constituencyId: string, electionRound = election.round) {
    return { electionId: election.id, constituencyId, electionRound };
  }

  it('answers no election for an entity with no nomination', () => {
    expect(startingSelectionOf([])).toEqual([]);
  });

  it('answers the election and the constituency of one nomination', () => {
    expect(startingSelectionOf([nomination(CLOSED_LIST, 'north')])).toEqual([
      { electionId: 'closed-list', constituencyId: 'north' }
    ]);
  });

  it('answers an election with two nominations once, with no constituency', () => {
    const starting = startingSelectionOf([
      nomination(CLOSED_LIST, 'north'),
      nomination(OPEN_LIST, 'nation'),
      nomination(CLOSED_LIST, 'south')
    ]);

    expect(starting).toEqual([{ electionId: 'closed-list' }, { electionId: 'open-list', constituencyId: 'nation' }]);
    expect(starting[0]).not.toHaveProperty('constituencyId');
  });

  it('answers an election with two nominations in one constituency with no constituency either', () => {
    expect(startingSelectionOf([nomination(CLOSED_LIST, 'north'), nomination(CLOSED_LIST, 'north')])).toEqual([
      { electionId: 'closed-list' }
    ]);
  });

  it('follows the order in which the elections are first met, and answers objects of its own', () => {
    const nominations = [nomination(OPEN_LIST, 'nation'), nomination(CLOSED_LIST, 'north')];

    const first = startingSelectionOf(nominations);
    const second = startingSelectionOf(nominations);

    expect(first.map((election) => election.electionId)).toEqual(['open-list', 'closed-list']);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second[0]).not.toBe(first[0]);
    expect(nominations).toEqual([nomination(OPEN_LIST, 'nation'), nomination(CLOSED_LIST, 'north')]);
  });

  it('reads the nominations in reach it is given: one at another round, or in an election that does not admit the entity, is not in the answer', () => {
    const nominations = [
      nomination(CLOSED_LIST, 'north'),
      nomination(OPEN_LIST, 'nation', 2),
      nomination(ORGANIZATIONS_ONLY, 'nation')
    ];

    const inReach = inReachNominationsOf({ nominations, elections: ELECTIONS, entityType: 'candidate' });

    expect(startingSelectionOf(inReach)).toEqual([{ electionId: 'closed-list', constituencyId: 'north' }]);
  });
});

describe('constituencyChoiceOf', () => {
  const NOMINATIONS = [
    { electionId: 'closed-list', constituencyId: 'north' },
    { electionId: 'open-list', constituencyId: 'nation' },
    { electionId: 'closed-list', constituencyId: 'south' }
  ];

  it('leaves a chosen election with no nomination, and one with a single nomination, to choose', () => {
    expect(
      constituencyChoiceOf({ chosenElectionIds: ['candidates-only', 'open-list'], nominations: NOMINATIONS })
    ).toEqual({ toChoose: ['candidates-only', 'open-list'], kept: [] });
  });

  it('keeps a chosen election with several nominations', () => {
    expect(constituencyChoiceOf({ chosenElectionIds: ['closed-list'], nominations: NOMINATIONS })).toEqual({
      toChoose: [],
      kept: ['closed-list']
    });
  });

  it('puts an election that is not chosen in neither list', () => {
    expect(constituencyChoiceOf({ chosenElectionIds: ['open-list'], nominations: NOMINATIONS })).toEqual({
      toChoose: ['open-list'],
      kept: []
    });
    expect(constituencyChoiceOf({ chosenElectionIds: [], nominations: NOMINATIONS })).toEqual({
      toChoose: [],
      kept: []
    });
  });

  it('follows the order of the chosen ids, each once, and answers an object of its own', () => {
    const chosenElectionIds = ['open-list', 'closed-list', 'candidates-only', 'open-list'];

    const first = constituencyChoiceOf({ chosenElectionIds, nominations: NOMINATIONS });
    const second = constituencyChoiceOf({ chosenElectionIds, nominations: NOMINATIONS });

    expect(first).toEqual({ toChoose: ['open-list', 'candidates-only'], kept: ['closed-list'] });
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.toChoose).not.toBe(first.toChoose);
  });

  it('leaves every chosen election to choose for an entity with no nomination', () => {
    expect(constituencyChoiceOf({ chosenElectionIds: ['closed-list', 'open-list'], nominations: [] })).toEqual({
      toChoose: ['closed-list', 'open-list'],
      kept: []
    });
  });
});

describe('the barrel', () => {
  it('exports both modules', async () => {
    const barrel = await import('.');

    for (const name of [
      'nominationsEditableOf',
      'admissibleElectionsOf',
      'inReachNominationsOf',
      'startingSelectionOf',
      'constituencyChoiceOf',
      'buildCards',
      'parentChoicesOf',
      'somethingToWrite',
      'validateCards',
      'desiredSetOf',
      'draftFactsOf',
      'sameNominations'
    ])
      expect(typeof (barrel as Record<string, unknown>)[name], name).toBe('function');
  });
});
