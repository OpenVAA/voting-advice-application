/**
 * `userEntityDisplayName` against a real `DataRoot`: the string it returns for a listed entity equals the `name` of the object the root builds from the same data, so a card, the menu and the sort order name an entity alike.
 */

import { DataRoot } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import { userEntityData, userEntityDisplayName } from './userEntityDisplayName';
import type { UserEntity } from '$lib/api/base/dataWriter.type';

const CANDIDATE: UserEntity = {
  type: 'candidate',
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Alice',
  lastName: 'Alpha',
  confirmed: true
};
const LAST_NAME_ONLY: UserEntity = {
  type: 'candidate',
  id: '22222222-2222-4222-8222-222222222222',
  firstName: '',
  lastName: 'Beta',
  confirmed: false
};
const ORGANIZATION: UserEntity = {
  type: 'organization',
  id: '33333333-3333-4333-8333-333333333333',
  name: 'The Example Party',
  confirmed: true
};
const ORGANIZATION_WITH_SHORT_NAME: UserEntity = {
  type: 'organization',
  id: '44444444-4444-4444-8444-444444444444',
  name: 'The Long Example Party',
  shortName: 'LEP',
  confirmed: true
};

const ENTITIES = [CANDIDATE, LAST_NAME_ONLY, ORGANIZATION, ORGANIZATION_WITH_SHORT_NAME];

describe('userEntityDisplayName', () => {
  it.each([
    ['a candidate', CANDIDATE, 'Alice Alpha'],
    ['a candidate with only a last name', LAST_NAME_ONLY, ' Beta'],
    ['an organization', ORGANIZATION, 'The Example Party'],
    ['an organization with a short name', ORGANIZATION_WITH_SHORT_NAME, 'The Long Example Party']
  ] as const)('equals the name of the data root’s object for %s', (_, entity, expected) => {
    const dataRoot = new DataRoot();
    dataRoot.provideEntityData(ENTITIES.map(userEntityData));

    const name = userEntityDisplayName(entity, dataRoot);

    expect(name).toBe(dataRoot.getEntity(entity.type, entity.id).name);
    expect(name).toBe(expected);
  });

  it('needs no entity to be provided to the data root', () => {
    const dataRoot = new DataRoot();

    expect(userEntityDisplayName(CANDIDATE, dataRoot)).toBe('Alice Alpha');
    expect(userEntityDisplayName(ORGANIZATION, dataRoot)).toBe('The Example Party');
    expect(() => dataRoot.getEntity('candidate', CANDIDATE.id)).toThrow();
  });

  it('follows the formatter the data root is set to', () => {
    const dataRoot = new DataRoot();
    dataRoot.provideEntityData(ENTITIES.map(userEntityData));
    dataRoot.setFormatter('candidateName', ({ object }) => `${object.lastName}, ${object.firstName}`);

    expect(userEntityDisplayName(CANDIDATE, dataRoot)).toBe('Alpha, Alice');
    expect(userEntityDisplayName(CANDIDATE, dataRoot)).toBe(dataRoot.getEntity('candidate', CANDIDATE.id).name);
  });
});

describe('userEntityData', () => {
  it('carries the members a card shows and leaves out the confirmation state', () => {
    const image = { url: 'https://example.org/a.jpg' };
    const color = { normal: '#123456' };

    expect(userEntityData({ ...CANDIDATE, shortName: 'A. A.', image, color, confirmed: false })).toEqual({
      type: 'candidate',
      id: CANDIDATE.id,
      firstName: 'Alice',
      lastName: 'Alpha',
      shortName: 'A. A.',
      image,
      color
    });
    expect(userEntityData(ORGANIZATION_WITH_SHORT_NAME)).toEqual({
      type: 'organization',
      id: ORGANIZATION_WITH_SHORT_NAME.id,
      name: 'The Long Example Party',
      shortName: 'LEP',
      image: undefined,
      color: undefined
    });
  });
});
