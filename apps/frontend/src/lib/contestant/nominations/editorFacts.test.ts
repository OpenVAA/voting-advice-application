import { describe, expect, it } from 'vitest';
import {
  admissibleElectionsOf,
  choosesSeveralConstituenciesOf,
  constituencyChoiceOf,
  nominationsEditableOf,
  startingSelectionOf,
  writableNominationsOf
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

describe('writableNominationsOf', () => {
  /** One nomination of an entity: the member the function reads, and an id to tell the rows apart. */
  function nomination(id: string, writable: boolean) {
    return { id, writable };
  }

  it('holds the nominations the database marks writable, the objects given, in the order given', () => {
    const nominations = [nomination('z', true), nomination('out', false), nomination('a', true)];

    const writable = writableNominationsOf(nominations);

    expect(writable.map((row) => row.id)).toEqual(['z', 'a']);
    expect(writable[0]).toBe(nominations[0]);
    expect(writable).not.toBe(nominations);
  });

  it('answers nothing for no nomination, and for none that is writable', () => {
    expect(writableNominationsOf([])).toEqual([]);
    expect(writableNominationsOf([nomination('a', false)])).toEqual([]);
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
      { electionId: 'closed-list', constituencyIds: ['north'] }
    ]);
  });

  it('answers an election with two nominations once, with both constituencies in the order met', () => {
    const starting = startingSelectionOf([
      nomination(CLOSED_LIST, 'north'),
      nomination(OPEN_LIST, 'nation'),
      nomination(CLOSED_LIST, 'south')
    ]);

    expect(starting).toEqual([
      { electionId: 'closed-list', constituencyIds: ['north', 'south'] },
      { electionId: 'open-list', constituencyIds: ['nation'] }
    ]);
  });

  it('answers a constituency held twice in one election once', () => {
    expect(startingSelectionOf([nomination(CLOSED_LIST, 'north'), nomination(CLOSED_LIST, 'north')])).toEqual([
      { electionId: 'closed-list', constituencyIds: ['north'] }
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
});

describe('constituencyChoiceOf', () => {
  const NOMINATIONS = [
    { electionId: 'closed-list', constituencyId: 'north' },
    { electionId: 'open-list', constituencyId: 'nation' },
    { electionId: 'closed-list', constituencyId: 'south' }
  ];

  it('leaves a chosen election with no nomination, and one with a single nomination, to choose', () => {
    expect(
      constituencyChoiceOf({
        chosenElectionIds: ['candidates-only', 'open-list'],
        nominations: NOMINATIONS,
        severalConstituencies: false
      })
    ).toEqual({ toChoose: ['candidates-only', 'open-list'], kept: [] });
  });

  it('keeps a chosen election with several nominations', () => {
    expect(
      constituencyChoiceOf({
        chosenElectionIds: ['closed-list'],
        nominations: NOMINATIONS,
        severalConstituencies: false
      })
    ).toEqual({
      toChoose: [],
      kept: ['closed-list']
    });
  });

  it('puts an election that is not chosen in neither list', () => {
    expect(
      constituencyChoiceOf({ chosenElectionIds: ['open-list'], nominations: NOMINATIONS, severalConstituencies: false })
    ).toEqual({
      toChoose: ['open-list'],
      kept: []
    });
    expect(
      constituencyChoiceOf({ chosenElectionIds: [], nominations: NOMINATIONS, severalConstituencies: false })
    ).toEqual({
      toChoose: [],
      kept: []
    });
  });

  it('follows the order of the chosen ids, each once, and answers an object of its own', () => {
    const chosenElectionIds = ['open-list', 'closed-list', 'candidates-only', 'open-list'];

    const first = constituencyChoiceOf({ chosenElectionIds, nominations: NOMINATIONS, severalConstituencies: false });
    const second = constituencyChoiceOf({ chosenElectionIds, nominations: NOMINATIONS, severalConstituencies: false });

    expect(first).toEqual({ toChoose: ['open-list', 'candidates-only'], kept: ['closed-list'] });
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.toChoose).not.toBe(first.toChoose);
  });

  it('keeps no election for an entity that chooses several constituencies in one election', () => {
    expect(
      constituencyChoiceOf({
        chosenElectionIds: ['closed-list', 'open-list'],
        nominations: NOMINATIONS,
        severalConstituencies: true
      })
    ).toEqual({ toChoose: ['closed-list', 'open-list'], kept: [] });
  });

  it('leaves every chosen election to choose for an entity with no nomination', () => {
    expect(
      constituencyChoiceOf({
        chosenElectionIds: ['closed-list', 'open-list'],
        nominations: [],
        severalConstituencies: false
      })
    ).toEqual({
      toChoose: ['closed-list', 'open-list'],
      kept: []
    });
  });
});

describe('choosesSeveralConstituenciesOf', () => {
  it('lets an organization choose several constituencies in one election, and a candidate one', () => {
    expect(choosesSeveralConstituenciesOf('organization')).toBe(true);
    expect(choosesSeveralConstituenciesOf('candidate')).toBe(false);
  });
});

describe('the barrel', () => {
  it('exports both modules', async () => {
    const barrel = await import('.');

    for (const name of [
      'nominationsEditableOf',
      'admissibleElectionsOf',
      'writableNominationsOf',
      'startingSelectionOf',
      'choosesSeveralConstituenciesOf',
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
