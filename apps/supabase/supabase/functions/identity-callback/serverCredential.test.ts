/**
 * The server's credential: the header the frontend server presents, compared with the configured secret.
 *
 * A missing header is a refusal that never reaches the configuration, an unset secret is a configuration failure rather than an open door, and only an equal, non-empty value is accepted.
 */

import { describe, expect, it } from 'vitest';
import { presentsServerCredential, SERVER_CREDENTIAL_HEADER } from './serverCredential';

const SECRET = 'server-secret-fixture-0123456789';

describe('SERVER_CREDENTIAL_HEADER', () => {
  it('names the header x-identity-callback-secret', () => {
    expect(SERVER_CREDENTIAL_HEADER).toBe('x-identity-callback-secret');
  });
});

describe('presentsServerCredential', () => {
  it('accepts a header equal to the configured secret', () => {
    expect(presentsServerCredential(SECRET, SECRET)).toBe(true);
  });

  it.each([
    ['a different value of the same length', `${SECRET.slice(0, -1)}X`],
    ['a value differing in its first character', `X${SECRET.slice(1)}`],
    ['a shorter value that is a prefix of the secret', SECRET.slice(0, 10)],
    ['a longer value that starts with the secret', `${SECRET}X`],
    ['the secret in another case', SECRET.toUpperCase()],
    ['the secret with surrounding white space', ` ${SECRET} `]
  ])('refuses %s', (_label, presented) => {
    expect(presentsServerCredential(presented, SECRET)).toBe(false);
  });

  it('compares characters outside ASCII by their bytes', () => {
    expect(presentsServerCredential('sala-ä-ö', 'sala-ä-ö')).toBe(true);
    expect(presentsServerCredential('sala-a-ö', 'sala-ä-ö')).toBe(false);
  });

  it.each([
    ['a missing header', null],
    ['an absent header', undefined],
    ['an empty header', '']
  ])('refuses %s', (_label, presented) => {
    expect(presentsServerCredential(presented, SECRET)).toBe(false);
  });

  it.each([
    ['a missing header', null],
    ['an absent header', undefined],
    ['an empty header', '']
  ])('refuses %s before the configured secret is consulted', (_label, presented) => {
    expect(presentsServerCredential(presented, undefined)).toBe(false);
    expect(presentsServerCredential(presented, '')).toBe(false);
  });

  it.each([
    ['unset', undefined],
    ['empty', '']
  ])('throws ERR_ENV_UNCONFIGURED naming the variable when the secret is %s', (_label, expected) => {
    expect(() => presentsServerCredential(SECRET, expected)).toThrow(
      expect.objectContaining({ code: 'ERR_ENV_UNCONFIGURED', variable: 'IDENTITY_CALLBACK_SERVER_SECRET' })
    );
  });

  it('puts neither value into the thrown message', () => {
    let message = '';
    try {
      presentsServerCredential(SECRET, '');
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('IDENTITY_CALLBACK_SERVER_SECRET');
    expect(message).not.toContain(SECRET);
  });
});
