/**
 * The account `public.identity_account_find` answers for an identity: how its answer is read, and whether the account is kept, finished or refused.
 */

import { describe, expect, it } from 'vitest';
import { existingAccountSetup, identityAccountOf } from './placeholderAccount.ts';

const MATCH_VALUE = 'AbC123xYz';
const USER_ID = '11111111-2222-3333-4444-555555555555';
const PLACEHOLDER = 'abc123xyz@bank-auth.placeholder';

describe('identityAccountOf', () => {
  it('reads the id, the address and the app metadata of the account found', () => {
    const metadata = { identity_provider: 'idura', identity_match_value: MATCH_VALUE };
    expect(identityAccountOf({ id: USER_ID, email: PLACEHOLDER, raw_app_meta_data: metadata })).toEqual({
      id: USER_ID,
      email: PLACEHOLDER,
      appMetadata: metadata
    });
  });

  it('reads an account with no address and no metadata', () => {
    expect(identityAccountOf({ id: USER_ID, email: null, raw_app_meta_data: null })).toEqual({
      id: USER_ID,
      email: null,
      appMetadata: null
    });
    expect(identityAccountOf({ id: USER_ID })).toEqual({ id: USER_ID, email: null, appMetadata: null });
  });

  it('reads no account from a null answer', () => {
    expect(identityAccountOf(null)).toBeNull();
  });

  it.each([
    ['undefined', undefined],
    ['a string', USER_ID],
    ['an array', [{ id: USER_ID }]],
    ['an id that is not a uuid', { id: 'user-1' }],
    ['no id', { email: PLACEHOLDER }],
    ['an address that is not a string', { id: USER_ID, email: 7 }],
    ['metadata that is not an object', { id: USER_ID, raw_app_meta_data: 'x' }],
    ['metadata that is an array', { id: USER_ID, raw_app_meta_data: [] }]
  ])('throws for %s, and names no id or address', (_label, answer) => {
    let thrown: unknown;
    try {
      identityAccountOf(answer);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ code: 'ERR_ACCOUNT_LOOKUP_FAILED' });
    expect((thrown as Error).message).not.toContain(USER_ID);
    expect((thrown as Error).message).not.toContain(PLACEHOLDER);
  });
});

describe('existingAccountSetup', () => {
  it('keeps an account that already carries this identity’s match value', () => {
    const appMetadata = {
      identity_provider: 'idura',
      identity_match_prop: 'sub',
      identity_match_value: MATCH_VALUE
    };
    expect(existingAccountSetup(appMetadata, MATCH_VALUE)).toEqual({ kind: 'keep', appMetadata });
  });

  it.each([
    ['no metadata', null],
    ['metadata of no identity', { provider: 'email' }],
    ['an empty match value', { identity_match_value: '' }],
    ['a match value that is not a string', { identity_match_value: 7 }],
    ['an array', []]
  ])('finishes an account with %s', (_label, appMetadata) => {
    expect(existingAccountSetup(appMetadata, MATCH_VALUE)).toEqual({ kind: 'initialise' });
  });

  it('refuses an account that carries another identity’s match value, which the case-blind address can name', () => {
    const appMetadata = { identity_match_value: MATCH_VALUE.toLowerCase() };
    expect(existingAccountSetup(appMetadata, MATCH_VALUE)).toEqual({ kind: 'refuse' });
  });

  it('reads no inherited match value', () => {
    expect(existingAccountSetup(Object.create({ identity_match_value: MATCH_VALUE }), MATCH_VALUE)).toEqual({
      kind: 'initialise'
    });
  });
});
