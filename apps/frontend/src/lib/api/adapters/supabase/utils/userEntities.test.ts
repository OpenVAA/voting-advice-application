import { describe, expect, it } from 'vitest';
import { parseCallerPasswordSet, parseUserEntities } from './userEntities';

const SECRET = 'value-that-must-not-be-in-the-message';

const candidateEntry = {
  entity_type: 'candidate',
  id: 'cand-1',
  first_name: 'Ada',
  last_name: 'Lovelace',
  short_name: null,
  image: { path: 'project/candidates/cand-1/portrait.jpg' },
  color: null,
  confirmed: true
};

const organizationEntry = {
  entity_type: 'organization',
  id: 'org-1',
  name: { en: 'The Party' },
  short_name: { en: 'TP' },
  image: null,
  color: { normal: '#112233' },
  confirmed: false
};

describe('parseUserEntities', () => {
  it('returns the entries of a well-formed mixed answer in the order listed', () => {
    const entries = parseUserEntities({ entities: [candidateEntry, organizationEntry] });

    expect(entries).toEqual([candidateEntry, organizationEntry]);
  });

  it('returns an empty list for an answer whose entities array is empty', () => {
    expect(parseUserEntities({ entities: [] })).toEqual([]);
  });

  it('drops members the schema does not know, at the top level and inside an entry', () => {
    const entries = parseUserEntities({ entities: [{ ...candidateEntry, added_later: 1 }], password_set: true });

    expect(entries).toEqual([candidateEntry]);
  });

  it('throws for an answer without entities', () => {
    expect(() => parseUserEntities({})).toThrow(/did not match its schema at: entities$/);
  });

  it('throws for an absent answer', () => {
    expect(() => parseUserEntities(null)).toThrow(/did not match its schema at: \(root\)$/);
    expect(() => parseUserEntities(undefined)).toThrow(/did not match its schema/);
  });

  it('throws for an entry with an unknown entity_type', () => {
    expect(() =>
      parseUserEntities({ entities: [candidateEntry, { ...organizationEntry, entity_type: 'faction' }] })
    ).toThrow(/did not match its schema at: entities\.1\.entity_type$/);
  });

  it('throws for an entry missing id', () => {
    const { id: _id, ...withoutId } = candidateEntry;

    expect(() => parseUserEntities({ entities: [withoutId] })).toThrow(/did not match its schema at: entities\.0\.id$/);
  });

  it('names the refused paths and never a stored value', () => {
    const error = (() => {
      try {
        parseUserEntities({ entities: [{ ...candidateEntry, first_name: { secret: SECRET } }] });
      } catch (e) {
        return e;
      }
    })();

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('entities.0.first_name');
    expect((error as Error).message).not.toContain(SECRET);
  });
});

describe('parseCallerPasswordSet', () => {
  it('returns true for an answer whose password_set is true', () => {
    expect(parseCallerPasswordSet({ entities: [], password_set: true })).toBe(true);
  });

  it('returns false for an answer whose password_set is false', () => {
    expect(parseCallerPasswordSet({ entities: [], password_set: false })).toBe(false);
  });

  it('reads the fact whatever the entities member holds', () => {
    expect(parseCallerPasswordSet({ entities: [candidateEntry, organizationEntry], password_set: true })).toBe(true);
    expect(parseCallerPasswordSet({ password_set: true })).toBe(true);
  });

  it.each([
    ['absent', { entities: [] }],
    ['null', { entities: [], password_set: null }],
    ['a string', { entities: [], password_set: 'true' }],
    ['a number', { entities: [], password_set: 1 }]
  ])('throws when password_set is %s', (_label, answer) => {
    expect(() => parseCallerPasswordSet(answer)).toThrow(/password fact did not match its schema at: password_set$/);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a boolean', true],
    ['a string', 'true'],
    ['an array', [true]]
  ])('throws for an answer that is %s and no object', (_label, answer) => {
    expect(() => parseCallerPasswordSet(answer)).toThrow(/password fact did not match its schema at: \(root\)$/);
  });

  it('names the refused path and never a stored value', () => {
    const error = (() => {
      try {
        parseCallerPasswordSet({ entities: [], password_set: SECRET });
      } catch (e) {
        return e;
      }
    })();

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('password_set');
    expect((error as Error).message).not.toContain(SECRET);
  });
});
