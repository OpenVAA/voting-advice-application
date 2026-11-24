import { describe, expect, it } from 'vitest';
import { parseCallerAccountState, parseRegisteredOrganization, parseUserEntities } from './userEntities';

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
    const entries = parseUserEntities({ entities: [{ ...candidateEntry, added_later: 1 }], added_later: true });

    expect(entries).toEqual([candidateEntry]);
  });

  it('throws for an answer without entities', () => {
    expect(() => parseUserEntities({})).toThrow(
      /^The answer of get_user_entities did not match its schema at: entities$/
    );
  });

  it('throws for an absent answer', () => {
    expect(() => parseUserEntities(null)).toThrow(
      /^The answer of get_user_entities did not match its schema at: \(root\)$/
    );
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

describe('parseCallerAccountState', () => {
  it.each([
    [true, false],
    [false, true],
    [true, true],
    [false, false]
  ])(
    'returns password_set %s and pending_email_taken %s as the answer holds them',
    (password_set, pending_email_taken) => {
      expect(parseCallerAccountState({ password_set, pending_email_taken })).toEqual({
        passwordSet: password_set,
        pendingEmailTaken: pending_email_taken
      });
    }
  );

  it('drops members the schema does not know', () => {
    expect(parseCallerAccountState({ password_set: true, pending_email_taken: false, added_later: 1 })).toEqual({
      passwordSet: true,
      pendingEmailTaken: false
    });
  });

  it.each([
    ['absent', { pending_email_taken: false }],
    ['null', { password_set: null, pending_email_taken: false }],
    ['a string', { password_set: 'true', pending_email_taken: false }],
    ['a number', { password_set: 1, pending_email_taken: false }]
  ])('throws when password_set is %s', (_label, answer) => {
    expect(() => parseCallerAccountState(answer)).toThrow(
      /^The answer of get_caller_account_state did not match its schema at: password_set$/
    );
  });

  it.each([
    ['absent', { password_set: true }],
    ['null', { password_set: true, pending_email_taken: null }],
    ['a string', { password_set: true, pending_email_taken: 'false' }],
    ['a number', { password_set: true, pending_email_taken: 0 }]
  ])('throws when pending_email_taken is %s', (_label, answer) => {
    expect(() => parseCallerAccountState(answer)).toThrow(
      /^The answer of get_caller_account_state did not match its schema at: pending_email_taken$/
    );
  });

  it('names each refused path once', () => {
    expect(() => parseCallerAccountState({})).toThrow(
      /^The answer of get_caller_account_state did not match its schema at: password_set, pending_email_taken$/
    );
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a boolean', true],
    ['a string', 'true'],
    ['an array', [true]]
  ])('throws for an answer that is %s and no object', (_label, answer) => {
    expect(() => parseCallerAccountState(answer)).toThrow(
      /^The answer of get_caller_account_state did not match its schema at: \(root\)$/
    );
  });

  it('names the refused path and never a stored value', () => {
    expect(() => parseCallerAccountState({ password_set: SECRET, pending_email_taken: SECRET })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining(SECRET) })
    );
  });
});

describe('parseRegisteredOrganization', () => {
  const ORGANIZATION = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';

  it('returns the organization the answer names, beside the entities', () => {
    expect(parseRegisteredOrganization({ entities: [organizationEntry], organization: ORGANIZATION })).toBe(
      ORGANIZATION
    );
  });

  it('returns null for an answer that names none', () => {
    expect(parseRegisteredOrganization({ entities: [] })).toBeNull();
  });

  it.each([
    ['not a uuid', 'org-1'],
    ['a number', 42],
    ['null', null]
  ])('throws when organization is %s', (_label, organization) => {
    expect(() => parseRegisteredOrganization({ entities: [], organization })).toThrow(
      /^The answer of get_user_entities did not match its schema at: organization$/
    );
  });

  it('throws for an answer that is no object, and never names a stored value', () => {
    expect(() => parseRegisteredOrganization(null)).toThrow(/at: \(root\)$/);
    expect(() => parseRegisteredOrganization({ organization: SECRET })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining(SECRET) })
    );
  });
});
