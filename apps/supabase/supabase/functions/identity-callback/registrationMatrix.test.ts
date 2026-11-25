/**
 * The entity-type decision among the types `public.identity_provider_entity_types` answers, the reading of that answer, and the vocabulary of entity types.
 *
 * The rule that decides which types are allowed is the database's, and its pgTAP files assert it.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  allowedEntityTypes,
  isServedEntityType,
  resolveEntityType,
  SERVED_ENTITY_TYPES
} from './registrationMatrix.ts';
import { parseIdentityCallbackRequest } from './requestContract.ts';

const APP_SHARED_SETTINGS = new URL(
  '../../../../../packages/app-shared/src/settings/contestantAppSettings.ts',
  import.meta.url
);

describe('the vocabularies', () => {
  it('serves the entity types the Contestant App serves, in the same order', () => {
    const source = readFileSync(APP_SHARED_SETTINGS, 'utf8');
    const declared = source.match(/export const SERVED_ENTITY_TYPES = \[([^\]]*)\]/)?.[1];
    expect(declared?.match(/'([^']+)'/g)?.map((literal) => literal.slice(1, -1))).toEqual([...SERVED_ENTITY_TYPES]);
  });

  it('names candidate and organization as the entity types, in that order', () => {
    expect([...SERVED_ENTITY_TYPES]).toEqual(['candidate', 'organization']);
  });

  it('accepts in a request exactly the entity types the decision chooses among', () => {
    const request = { id_token: 'a.b.c', project_id: '00000000-0000-0000-0000-000000000001' };
    for (const entityType of SERVED_ENTITY_TYPES) {
      expect(parseIdentityCallbackRequest({ ...request, entity_type: entityType })?.entityType).toBe(entityType);
    }
    expect(parseIdentityCallbackRequest({ ...request, entity_type: 'faction' })).toBeNull();
  });
});

describe('isServedEntityType', () => {
  it('accepts each served entity type', () => {
    for (const entityType of SERVED_ENTITY_TYPES) expect(isServedEntityType(entityType)).toBe(true);
  });

  it.each([['faction'], ['Candidate'], [''], [null], [undefined], [1]])('refuses %j', (value) => {
    expect(isServedEntityType(value)).toBe(false);
  });
});

describe('allowedEntityTypes', () => {
  it.each([
    ['both types', ['candidate', 'organization'], ['candidate', 'organization']],
    ['both types in the other order', ['organization', 'candidate'], ['candidate', 'organization']],
    ['candidates alone', ['candidate'], ['candidate']],
    ['organizations alone', ['organization'], ['organization']],
    ['no type', [], []],
    ['no answer', null, []]
  ])('reads %s', (_label, answer, expected) => {
    expect(allowedEntityTypes(answer)).toEqual(expected);
  });

  it.each([
    ['a type no Contestant App serves', ['candidate', 'alliance']],
    ['a type in another case', ['Candidate']],
    ['a member that is not a string', [1]],
    ['a string', 'candidate'],
    ['an object', { candidate: true }],
    ['undefined', undefined]
  ])('reads nothing from an answer with %s', (_label, answer) => {
    expect(allowedEntityTypes(answer)).toBeNull();
  });
});

describe('resolveEntityType', () => {
  const BOTH = ['candidate', 'organization'] as const;

  it('takes a named type that is allowed', () => {
    expect(resolveEntityType(BOTH, 'organization')).toEqual({ entityType: 'organization' });
    expect(resolveEntityType(BOTH, 'candidate')).toEqual({ entityType: 'candidate' });
    expect(resolveEntityType(['organization'], 'organization')).toEqual({ entityType: 'organization' });
  });

  it('refuses a named type that is not allowed', () => {
    expect(resolveEntityType(['candidate'], 'organization')).toEqual({ refused: true });
    expect(resolveEntityType(['organization'], 'candidate')).toEqual({ refused: true });
  });

  it.each([['faction'], ['Organization'], [''], [1], [['candidate']]])('refuses the unknown type %j', (entityType) => {
    expect(resolveEntityType(BOTH, entityType)).toEqual({ refused: true });
  });

  it('takes an absent type as the one allowed type', () => {
    expect(resolveEntityType(['candidate'], null)).toEqual({ entityType: 'candidate' });
    expect(resolveEntityType(['organization'], null)).toEqual({ entityType: 'organization' });
    expect(resolveEntityType(['organization'], undefined)).toEqual({ entityType: 'organization' });
  });

  it('refuses an absent type when several types are allowed', () => {
    expect(resolveEntityType(BOTH, null)).toEqual({ refused: true });
  });

  it('refuses every type when none is allowed, as while the Contestant App is switched off', () => {
    expect(resolveEntityType([], 'candidate')).toEqual({ refused: true });
    expect(resolveEntityType([], 'organization')).toEqual({ refused: true });
    expect(resolveEntityType([], null)).toEqual({ refused: true });
  });
});
