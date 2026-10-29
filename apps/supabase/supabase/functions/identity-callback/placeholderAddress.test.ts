/**
 * The placeholder address of an identity-provider account, and the one domain the three runtimes that know it agree on.
 *
 * `identity-callback` creates the address, `account-access` refuses to treat it as an address anyone owns, and the frontend tells an account's address state by it. Each runtime holds its own copy of the domain, because none of them can import another's module. This spec imports the two function modules and reads all three files as text, so a copy changed alone fails here.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as accountAccess from '../account-access/placeholderAddress.ts';
import { isPlaceholderAddress, PLACEHOLDER_EMAIL_DOMAIN, placeholderAddressFor } from './placeholderAddress.ts';

const COPIES = {
  'identity-callback/placeholderAddress.ts': new URL('./placeholderAddress.ts', import.meta.url),
  'account-access/placeholderAddress.ts': new URL('../account-access/placeholderAddress.ts', import.meta.url),
  'apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts': new URL(
    '../../../../frontend/src/lib/contestant/utils/identityProviderAccount.ts',
    import.meta.url
  )
};

/** The declaration of the domain constant, with the literal it holds. */
const DECLARATION_RE = /PLACEHOLDER_EMAIL_DOMAIN = '([^']*)'/g;

/** Addresses and whether each is on the placeholder domain. */
const CASES: Array<[unknown, boolean]> = [
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
];

describe('placeholderAddressFor', () => {
  it('puts the match value before the placeholder domain', () => {
    expect(placeholderAddressFor('abc')).toBe('abc@bank-auth.placeholder');
  });

  it('builds an address on the placeholder domain', () => {
    expect(isPlaceholderAddress(placeholderAddressFor('a-persistent-subject'))).toBe(true);
  });
});

describe('isPlaceholderAddress', () => {
  it.each(CASES)('answers %j with %s', (address, expected) => {
    expect(isPlaceholderAddress(address)).toBe(expected);
  });

  it.each(CASES)('answers %j as account-access does', (address, expected) => {
    expect(accountAccess.isPlaceholderAddress(address)).toBe(expected);
  });
});

describe('one placeholder domain in each runtime', () => {
  it('is the domain identity-callback builds the address on', () => {
    expect(PLACEHOLDER_EMAIL_DOMAIN).toBe('bank-auth.placeholder');
  });

  it.each(Object.entries(COPIES))('is declared once in %s, with the same literal', (_name, url) => {
    const declarations = [...readFileSync(url, 'utf8').matchAll(DECLARATION_RE)].map(([, literal]) => literal);
    expect(declarations).toEqual([PLACEHOLDER_EMAIL_DOMAIN]);
  });

  it('is the domain account-access exports', () => {
    expect(accountAccess.PLACEHOLDER_EMAIL_DOMAIN).toBe(PLACEHOLDER_EMAIL_DOMAIN);
  });
});
