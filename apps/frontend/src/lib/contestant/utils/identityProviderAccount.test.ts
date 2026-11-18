import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import {
  addressStateOf,
  hasDefaultLocaleName,
  isPlaceholderAddress,
  ownOrganizationId,
  PLACEHOLDER_EMAIL_DOMAIN,
  REGISTERED_ENTITIES_KEY
} from './identityProviderAccount';
import type { AddressState } from './identityProviderAccount';

/**
 * An account's address state, told from the verified user alone, and the placeholder address it is told by.
 */

const PLACEHOLDER = `a-subject@${PLACEHOLDER_EMAIL_DOMAIN}`;
const PROVIDER = 'idura-ftn';

describe('isPlaceholderAddress', () => {
  it.each<[unknown, boolean]>([
    ['abc@bank-auth.placeholder', true],
    ['ABC@BANK-AUTH.PLACEHOLDER', true],
    ['  abc@bank-auth.placeholder  ', true],
    ['a@b@bank-auth.placeholder', true],
    ['person@example.org', false],
    ['abc@bank-auth.placeholder.example.org', false],
    ['abc@sub.bank-auth.placeholder', false],
    ['abc@xbank-auth.placeholder', false],
    ['bank-auth.placeholder', false],
    ['@bank-auth.placeholder', false],
    ['abc@', false],
    ['', false],
    [null, false],
    [undefined, false],
    [42, false]
  ])('answers %j with %s', (address, expected) => {
    expect(isPlaceholderAddress(address)).toBe(expected);
  });
});

describe('addressStateOf', () => {
  it.each<[string, Parameters<typeof addressStateOf>[0], AddressState]>([
    [
      'an account no identity provider made, on a real address',
      { email: 'person@example.org', newEmail: null, identityProvider: undefined },
      'proved'
    ],
    [
      'an account no identity provider made, even on the placeholder domain',
      { email: PLACEHOLDER, newEmail: null, identityProvider: undefined },
      'proved'
    ],
    [
      'an account whose provider is not named by a string',
      { email: PLACEHOLDER, newEmail: null, identityProvider: { name: PROVIDER } },
      'proved'
    ],
    [
      'an identity-provider account on a real address',
      { email: 'person@example.org', newEmail: null, identityProvider: PROVIDER },
      'proved'
    ],
    [
      'an identity-provider account on a real address, with another one pending',
      { email: 'person@example.org', newEmail: 'other@example.org', identityProvider: PROVIDER },
      'proved'
    ],
    [
      'an identity-provider account on the placeholder, with an address pending',
      { email: PLACEHOLDER, newEmail: 'person@example.org', identityProvider: PROVIDER },
      'pending'
    ],
    [
      'an identity-provider account on the placeholder in another case and with spaces around it, with an address pending',
      { email: `  ${PLACEHOLDER.toUpperCase()} `, newEmail: 'person@example.org', identityProvider: PROVIDER },
      'pending'
    ],
    [
      'an identity-provider account on the placeholder, with nothing pending',
      { email: PLACEHOLDER, newEmail: null, identityProvider: PROVIDER },
      'none'
    ],
    [
      'an identity-provider account on the placeholder, with an empty pending address',
      { email: PLACEHOLDER, newEmail: '', identityProvider: PROVIDER },
      'none'
    ],
    [
      'an identity-provider account on the placeholder, with a blank pending address',
      { email: PLACEHOLDER, newEmail: '   ', identityProvider: PROVIDER },
      'none'
    ],
    [
      'an identity-provider account on the placeholder in another case, with nothing pending',
      { email: PLACEHOLDER.toUpperCase(), newEmail: undefined, identityProvider: PROVIDER },
      'none'
    ],
    [
      'an identity-provider account with no address and nothing pending',
      { email: undefined, newEmail: undefined, identityProvider: PROVIDER },
      'none'
    ],
    [
      'an identity-provider account with no address and an address pending',
      { email: '', newEmail: 'person@example.org', identityProvider: PROVIDER },
      'pending'
    ]
  ])('reads %s', (_label, user, expected) => {
    expect(addressStateOf(user)).toBe(expected);
  });
});

const PROJECT = '00000000-0000-0000-0000-000000000001';
const OTHER_PROJECT = '00000000-0000-0000-0000-000000000002';
const ORGANIZATION = '6f1c2a3b-4d5e-4f60-8a71-92b3c4d5e6f7';
const CANDIDATE = '7a2b3c4d-5e6f-4a70-8b81-a2c3d4e5f607';

describe('REGISTERED_ENTITIES_KEY', () => {
  it('is the key identity-callback writes the record under', () => {
    const source = fs.readFileSync(
      path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../../../../supabase/supabase/functions/identity-callback/ownEntity.ts'
      ),
      'utf8'
    );
    const declared = [...source.matchAll(/export const REGISTERED_ENTITIES_KEY = '([^']*)';/g)].map(([, key]) => key);
    expect(declared).toEqual([REGISTERED_ENTITIES_KEY]);
  });
});

describe('ownOrganizationId', () => {
  it('reads the organization the record names for the project', () => {
    const appMetadata = {
      identity_provider: PROVIDER,
      [REGISTERED_ENTITIES_KEY]: { [PROJECT]: { candidate: CANDIDATE, organization: ORGANIZATION } }
    };
    expect(ownOrganizationId(appMetadata, PROJECT)).toBe(ORGANIZATION);
  });

  it.each<[string, unknown]>([
    ['no metadata', undefined],
    ['null metadata', null],
    ['metadata that is not an object', 'registered'],
    ['metadata with no record', { identity_provider: PROVIDER }],
    ['a record that is not an object', { [REGISTERED_ENTITIES_KEY]: 'x' }],
    [
      'a record for another project only',
      { [REGISTERED_ENTITIES_KEY]: { [OTHER_PROJECT]: { organization: ORGANIZATION } } }
    ],
    ['a record of a candidate only', { [REGISTERED_ENTITIES_KEY]: { [PROJECT]: { candidate: CANDIDATE } } }],
    ['a project entry that is not an object', { [REGISTERED_ENTITIES_KEY]: { [PROJECT]: ORGANIZATION } }],
    ['an organization that is not a uuid', { [REGISTERED_ENTITIES_KEY]: { [PROJECT]: { organization: 'org-1' } } }],
    ['an organization that is not a string', { [REGISTERED_ENTITIES_KEY]: { [PROJECT]: { organization: 42 } } }],
    ['a record as an array', { [REGISTERED_ENTITIES_KEY]: [ORGANIZATION] }]
  ])('answers null for %s', (_label, appMetadata) => {
    expect(ownOrganizationId(appMetadata, PROJECT)).toBeNull();
  });

  it('reads only own members, never one an object inherits', () => {
    const inherited = Object.create({ [PROJECT]: { organization: ORGANIZATION } });
    expect(ownOrganizationId({ [REGISTERED_ENTITIES_KEY]: inherited }, PROJECT)).toBeNull();
    const entry = Object.create({ organization: ORGANIZATION });
    expect(ownOrganizationId({ [REGISTERED_ENTITIES_KEY]: { [PROJECT]: entry } }, PROJECT)).toBeNull();
  });
});

describe('hasDefaultLocaleName', () => {
  it.each<[string, unknown, boolean]>([
    ['a name in the locale', { en: 'The Party', fi: 'Puolue' }, true],
    ['a name with spaces around it', { en: '  The Party ' }, true],
    ['a name in another locale only', { fi: 'Puolue' }, false],
    ['a blank name in the locale', { en: '   ', fi: 'Puolue' }, false],
    ['an empty name in the locale', { en: '' }, false],
    ['a name that is not a string', { en: 42 }, false],
    ['an empty object', {}, false],
    ['null', null, false],
    ['undefined', undefined, false],
    ['a plain string', 'The Party', false],
    ['an array', ['The Party'], false]
  ])('answers %s with %s', (_label, name, expected) => {
    expect(hasDefaultLocaleName(name, 'en')).toBe(expected);
  });

  it('reads only an own member, never one the object inherits', () => {
    expect(hasDefaultLocaleName(Object.create({ en: 'The Party' }), 'en')).toBe(false);
  });
});
