import { describe, expect, it } from 'vitest';
import {
  addressStateOf,
  hasDefaultLocaleName,
  isPlaceholderAddress,
  PLACEHOLDER_EMAIL_DOMAIN
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
