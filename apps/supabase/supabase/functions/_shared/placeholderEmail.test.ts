/**
 * The placeholder email of an identity-provider account, and the one domain the Edge Functions and the frontend agree on.
 *
 * `identity-callback` creates the placeholder email and `account-access` refuses to treat it as an email address anyone owns, both through the module beside this spec; the frontend tells an account's address state by it. The frontend holds its own copy of the domain, because it cannot import an Edge Function module. This spec imports the module beside it and reads that module and the frontend's file as text, so a copy changed alone fails here.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isPlaceholderEmail, PLACEHOLDER_EMAIL_DOMAIN, placeholderEmailFor } from './placeholderEmail.ts';

const COPIES = {
  '_shared/placeholderEmail.ts': new URL('./placeholderEmail.ts', import.meta.url),
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

describe('placeholderEmailFor', () => {
  it('puts the match value before the placeholder domain', () => {
    expect(placeholderEmailFor('abc')).toBe('abc@bank-auth.placeholder');
  });

  it('builds an address on the placeholder domain', () => {
    expect(isPlaceholderEmail(placeholderEmailFor('a-persistent-subject'))).toBe(true);
  });
});

describe('isPlaceholderEmail', () => {
  it.each(CASES)('answers %j with %s', (address, expected) => {
    expect(isPlaceholderEmail(address)).toBe(expected);
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
});
