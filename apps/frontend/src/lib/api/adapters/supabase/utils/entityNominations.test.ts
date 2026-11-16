import { describe, expect, it } from 'vitest';
import { parseEntityNominations } from './entityNominations';

const SECRET = 'value-that-must-not-be-in-the-message';

/** A candidate's nomination under an organization's, as `get_entity_nominations` states it. */
const nominationWithParent = {
  id: 'nom-1',
  election_id: 'el-1',
  election_name: { en: 'Election', fi: 'Vaalit' },
  constituency_id: 'co-1',
  constituency_name: { en: 'Constituency' },
  election_round: 1,
  election_symbol: '42',
  confirmed: true,
  custom_data: { requestedParentOrganization: 'A party' },
  updated_at: '2026-10-01T12:00:00.123456+00:00',
  parent: { entity_type: 'organization', entity_id: 'org-1', name: { en: 'The Party' }, short_name: { en: 'TP' } }
};

/** A nomination with no parent and nothing stored in its optional columns. */
const nominationWithoutParent = {
  id: 'nom-2',
  election_id: 'el-2',
  election_name: { en: 'Another election' },
  constituency_id: 'co-2',
  constituency_name: { en: 'Another constituency' },
  election_round: 2,
  election_symbol: null,
  confirmed: false,
  custom_data: null,
  updated_at: '2026-10-02T08:30:00+00:00',
  parent: null
};

/**
 * The error a parse of `raw` throws.
 * @param raw - The value to parse.
 * @returns The thrown value, or `undefined` when the parse returned.
 */
function errorOf(raw: Parameters<typeof parseEntityNominations>[0]): unknown {
  try {
    parseEntityNominations(raw);
  } catch (e) {
    return e;
  }
  return undefined;
}

describe('parseEntityNominations', () => {
  it('returns null for a null answer, which is a refused read and not an empty list', () => {
    expect(parseEntityNominations(null)).toBeNull();
  });

  it('returns an empty list for an empty array', () => {
    expect(parseEntityNominations([])).toEqual([]);
  });

  it('returns the elements of a well-formed array in the order given, in the column names of the database', () => {
    expect(parseEntityNominations([nominationWithParent, nominationWithoutParent])).toEqual([
      nominationWithParent,
      nominationWithoutParent
    ]);
    expect(parseEntityNominations([nominationWithoutParent, nominationWithParent])).toEqual([
      nominationWithoutParent,
      nominationWithParent
    ]);
  });

  it('returns the parent as an object of four members, or null', () => {
    const parsed = parseEntityNominations([nominationWithParent, nominationWithoutParent]);

    expect(parsed).toHaveLength(2);
    expect(Object.keys(parsed?.[0]?.parent ?? {}).sort()).toEqual(['entity_id', 'entity_type', 'name', 'short_name']);
    expect(parsed?.[1]?.parent).toBeNull();
  });

  it('keeps the id of the entity a parent nominates', () => {
    const parsed = parseEntityNominations([
      { ...nominationWithParent, parent: { ...nominationWithParent.parent, entity_id: 'org-2' } }
    ]);

    expect(parsed?.[0]?.parent?.entity_id).toBe('org-2');
  });

  it('accepts a parent of each entity type the database has', () => {
    const types = ['candidate', 'organization', 'faction', 'alliance'];
    const parsed = parseEntityNominations(
      types.map((entity_type) => ({ ...nominationWithParent, parent: { ...nominationWithParent.parent, entity_type } }))
    );

    expect(parsed?.map((nomination) => nomination.parent?.entity_type)).toEqual(types);
  });

  it('accepts a round that is not stored and a parent with no short name', () => {
    const row = {
      ...nominationWithParent,
      election_round: null,
      parent: { ...nominationWithParent.parent, short_name: null }
    };

    expect(parseEntityNominations([row])).toEqual([row]);
  });

  it('drops members the schema does not know, in an element and in its parent', () => {
    const parsed = parseEntityNominations([
      {
        ...nominationWithParent,
        created_by: 'user-1',
        parent: { ...nominationWithParent.parent, id: 'org-1' }
      }
    ]);

    expect(parsed).toEqual([nominationWithParent]);
  });

  it.each([
    ['an object', { nominations: [] }],
    ['a string', 'nominations'],
    ['a number', 0],
    ['a boolean', false]
  ])('throws for an answer that is %s and not an array', (_name, raw) => {
    expect(() => parseEntityNominations(raw)).toThrow(/did not match its schema at: \(root\)$/);
  });

  it('throws for an absent answer', () => {
    expect(() => parseEntityNominations(undefined)).toThrow(/did not match its schema at: \(root\)$/);
  });

  it('throws for an element without an id', () => {
    const { id: _id, ...withoutId } = nominationWithParent;

    expect(() => parseEntityNominations([nominationWithoutParent, withoutId])).toThrow(
      /did not match its schema at: 1\.id$/
    );
  });

  it('throws for an element whose confirmed is not a boolean', () => {
    expect(() => parseEntityNominations([{ ...nominationWithParent, confirmed: 'true' }])).toThrow(
      /did not match its schema at: 0\.confirmed$/
    );
    expect(() => parseEntityNominations([{ ...nominationWithParent, confirmed: null }])).toThrow(
      /did not match its schema at: 0\.confirmed$/
    );
  });

  it('throws for a parent without its type, and for a parent of a type the database does not have', () => {
    const { entity_type: _type, ...parentWithoutType } = nominationWithParent.parent;

    expect(() => parseEntityNominations([{ ...nominationWithParent, parent: parentWithoutType }])).toThrow(
      /did not match its schema at: 0\.parent\.entity_type$/
    );
    expect(() =>
      parseEntityNominations([
        { ...nominationWithParent, parent: { ...nominationWithParent.parent, entity_type: 'party' } }
      ])
    ).toThrow(/did not match its schema at: 0\.parent\.entity_type$/);
  });

  it.each([
    ['is absent', undefined],
    ['is null', null],
    ['is empty', ''],
    ['is not text', 7]
  ])('throws for a parent whose entity id %s', (_name, entity_id) => {
    const { entity_id: _id, ...parentWithoutId } = nominationWithParent.parent;
    const parent = entity_id === undefined ? parentWithoutId : { ...parentWithoutId, entity_id };

    expect(() => parseEntityNominations([{ ...nominationWithParent, parent }])).toThrow(
      /did not match its schema at: 0\.parent\.entity_id$/
    );
  });

  it('keeps the time each nomination was last updated as the function states it', () => {
    expect(
      parseEntityNominations([nominationWithParent, nominationWithoutParent])?.map((row) => row.updated_at)
    ).toEqual(['2026-10-01T12:00:00.123456+00:00', '2026-10-02T08:30:00+00:00']);
  });

  it.each([
    ['is absent', undefined],
    ['is null', null],
    ['is empty', ''],
    ['is not text', 7]
  ])('throws for an element whose updated_at %s, since a write is checked against it', (_name, updated_at) => {
    const { updated_at: _time, ...withoutTime } = nominationWithParent;
    const row = updated_at === undefined ? withoutTime : { ...withoutTime, updated_at };

    expect(() => parseEntityNominations([row])).toThrow(/did not match its schema at: 0\.updated_at$/);
  });

  it('throws for an element without its parent member, which the function always states', () => {
    const { parent: _parent, ...withoutParentMember } = nominationWithParent;

    expect(() => parseEntityNominations([withoutParentMember])).toThrow(/did not match its schema at: 0\.parent$/);
  });

  it('names every refused path of one answer', () => {
    const error = errorOf([
      { ...nominationWithParent, election_id: 7 },
      { ...nominationWithoutParent, constituency_id: null }
    ]);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/did not match its schema at: 0\.election_id, 1\.constituency_id$/);
  });

  it('names the refused paths and never a stored value', () => {
    const error = errorOf([
      {
        ...nominationWithParent,
        id: { secret: SECRET },
        election_symbol: { secret: SECRET },
        confirmed: SECRET,
        parent: { ...nominationWithParent.parent, entity_type: SECRET }
      }
    ]);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('0.id');
    expect((error as Error).message).toContain('0.election_symbol');
    expect((error as Error).message).toContain('0.confirmed');
    expect((error as Error).message).toContain('0.parent.entity_type');
    expect((error as Error).message).not.toContain(SECRET);
  });
});
