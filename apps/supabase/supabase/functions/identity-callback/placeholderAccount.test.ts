/**
 * The account found on an identity's placeholder address when the invite answers that the address is taken: how it is matched, and whether its record is kept, written afresh or refused.
 */

import { describe, expect, it } from 'vitest';
import { existingAccountSetup, holdsPlaceholderAddress } from './placeholderAccount.ts';
import { placeholderAddressFor } from './placeholderAddress.ts';

const MATCH_VALUE = 'AbC123xYz';
const PLACEHOLDER = placeholderAddressFor(MATCH_VALUE);
const PROJECT = '00000000-0000-0000-0000-000000000001';
const ENTITY = '11111111-2222-3333-4444-555555555555';

describe('holdsPlaceholderAddress', () => {
  it('matches the address the auth service stores, lower-cased, for a subject identifier with capitals', () => {
    expect(holdsPlaceholderAddress({ email: PLACEHOLDER.toLowerCase() }, PLACEHOLDER)).toBe(true);
  });

  it('matches whatever the case and surrounding white space of either side', () => {
    expect(holdsPlaceholderAddress({ email: `  ${PLACEHOLDER.toUpperCase()} ` }, PLACEHOLDER)).toBe(true);
    expect(holdsPlaceholderAddress({ email: PLACEHOLDER }, `  ${PLACEHOLDER.toLowerCase()}`)).toBe(true);
  });

  it.each([
    ['another placeholder', { email: placeholderAddressFor('another') }],
    ['no address', { email: null }],
    ['an absent address', {}],
    ['an address that is not a string', { email: 7 }]
  ])('does not match %s', (_label, account) => {
    expect(holdsPlaceholderAddress(account, PLACEHOLDER)).toBe(false);
  });

  it('does not match an empty placeholder against an empty address', () => {
    expect(holdsPlaceholderAddress({ email: '' }, '')).toBe(false);
  });
});

describe('existingAccountSetup', () => {
  it('keeps the record of an account that already carries this identity’s match value', () => {
    const appMetadata = {
      identity_provider: 'idura',
      identity_match_prop: 'sub',
      identity_match_value: MATCH_VALUE,
      registered_entities: { [PROJECT]: { candidate: ENTITY } }
    };
    expect(existingAccountSetup(appMetadata, MATCH_VALUE)).toEqual({ kind: 'keep', appMetadata });
  });

  it.each([
    ['no metadata', null],
    ['metadata of no identity', { provider: 'email' }],
    ['an empty match value', { identity_match_value: '' }],
    ['a match value that is not a string', { identity_match_value: 7 }],
    ['an array', []]
  ])('writes the record afresh for an account with %s', (_label, appMetadata) => {
    expect(existingAccountSetup(appMetadata, MATCH_VALUE)).toEqual({ kind: 'initialise' });
  });

  it('refuses an account that carries another identity’s match value, which the case-blind address can name', () => {
    const appMetadata = { identity_match_value: MATCH_VALUE.toLowerCase(), registered_entities: {} };
    expect(existingAccountSetup(appMetadata, MATCH_VALUE)).toEqual({ kind: 'refuse' });
  });

  it('reads no inherited match value', () => {
    expect(existingAccountSetup(Object.create({ identity_match_value: MATCH_VALUE }), MATCH_VALUE)).toEqual({
      kind: 'initialise'
    });
  });
});
