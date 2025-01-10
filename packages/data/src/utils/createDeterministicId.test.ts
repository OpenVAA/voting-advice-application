import { Id } from '@openvaa/core';
import { describe, expect, test } from 'vitest';
import { createDeterministicId, IdentityProps } from './createDeterministicId';

describe('createDeterministicId', () => {
  test('Should return the same id regardless of children order', () => {
    const prefix = '__';
    const type = 'alliance';
    const baseData: Omit<IdentityProps['alliance'], 'organizations'> = {
      electionId: 'election-1',
      entityType: 'alliance',
      constituencyId: 'constituency-1',
      entityId: 'candidate-1'
    };
    expect(
      createDeterministicId({
        prefix,
        type,
        data: { ...baseData, organizations: [{ entityId: '1' }, { entityId: '2' }] }
      })
    ).toBe(
      createDeterministicId({
        prefix,
        type,
        data: { ...baseData, organizations: [{ entityId: '2' }, { entityId: '1' }] }
      })
    );
  });
  test('Should return unique ids for nominations with different parent nominations', () => {
    const prefix = '__';
    const type = 'nomination';
    const baseData: IdentityProps['nomination'] = {
      electionId: 'election-1',
      entityType: 'candidate',
      constituencyId: 'constituency-1',
      entityId: 'candidate-1'
    };
    expect(
      createDeterministicId({ prefix, type, data: { ...baseData, parentNominationId: '1' } }) !==
        createDeterministicId({ prefix, type, data: { ...baseData, parentNominationId: '2' } })
    ).toBe(true);
  });
  test('Should return unique ids for minimally different objects', () => {
    const baseData: Omit<IdentityProps['nomination'], 'entityId'> = {
      electionId: 'election-1',
      entityType: 'candidate',
      constituencyId: 'constituency-1'
    };
    const ids = new Set<Id>();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      ids.add(
        createDeterministicId({
          prefix: '__',
          type: 'nomination',
          data: { ...baseData, entityId: `${i + 1}` }
        })
      );
    }
    expect(ids.size).toBe(count);
  });
});
