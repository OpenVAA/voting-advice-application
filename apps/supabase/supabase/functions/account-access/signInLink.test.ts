/**
 * The mailed link: its shape per locale, the origins it refuses, and the rule that tells an admitted redirect from a refused one.
 */

import { describe, expect, it } from 'vitest';
import { SIGN_IN_MAIL_LOCALES } from './mailTemplates.ts';
import { buildSignInLink, callbackUrl, isRedirectAdmitted, LINK_TYPES as MODULE_LINK_TYPES } from './signInLink.ts';
import type { SignInMailLocale } from './mailTemplates.ts';
import type { LinkType } from './signInLink.ts';

const SITE_URL = 'http://localhost:5173';

describe('callbackUrl', () => {
  it.each(SIGN_IN_MAIL_LOCALES.map((locale) => [locale]))('points at the confirm page of %s', (locale) => {
    expect(callbackUrl({ siteUrl: SITE_URL, locale })).toBe(`${SITE_URL}/${locale}/auth/confirm`);
  });

  it('accepts an origin written with a trailing slash', () => {
    expect(callbackUrl({ siteUrl: 'https://vaa.example/', locale: 'fi' })).toBe('https://vaa.example/fi/auth/confirm');
  });

  it.each([
    ['a path', 'https://vaa.example/app'],
    ['a query', 'https://vaa.example/?next=1'],
    ['a fragment', 'https://vaa.example/#top'],
    ['the scheme javascript:', 'javascript:alert(1)'],
    ['the scheme data:', 'data:text/html,x'],
    ['the scheme file:', 'file:///etc/hosts'],
    ['credentials', 'https://user:secret@vaa.example'],
    ['no scheme', 'vaa.example'],
    ['an empty string', '']
  ])('throws for a site URL with %s', (_label, siteUrl) => {
    expect(() => callbackUrl({ siteUrl, locale: 'en' })).toThrow();
  });

  it.each([['de'], ['../admin'], ['en/../..'], ['__proto__'], ['']])(
    'throws for the locale %j, which is outside the set',
    (locale) => {
      expect(() => callbackUrl({ siteUrl: SITE_URL, locale: locale as SignInMailLocale })).toThrow();
    }
  );
});

describe('buildSignInLink', () => {
  const LINK_TYPES: Array<LinkType> = ['magiclink', 'recovery', 'email_change'];

  it('names exactly three types: the sign-in link, the recovery link and the address-confirmation link', () => {
    expect([...MODULE_LINK_TYPES]).toEqual(LINK_TYPES);
  });
  const EVERY_LOCALE_AND_TYPE = SIGN_IN_MAIL_LOCALES.flatMap((locale) =>
    LINK_TYPES.map((type): [SignInMailLocale, LinkType] => [locale, type])
  );

  it.each(EVERY_LOCALE_AND_TYPE)(
    'builds the link for %s of the type %s with exactly the two query parameters',
    (locale, type) => {
      const link = new URL(buildSignInLink({ siteUrl: SITE_URL, locale, tokenHash: 'abc123', type }));
      expect(link.origin).toBe(SITE_URL);
      expect(link.pathname).toBe(`/${locale}/auth/confirm`);
      expect([...link.searchParams.keys()]).toEqual(['token_hash', 'type']);
      expect(link.searchParams.get('token_hash')).toBe('abc123');
      expect(link.searchParams.get('type')).toBe(type);
      expect(link.hash).toBe('');
    }
  );

  it('writes the sign-in link character for character as `<confirm page>?token_hash=<token>&type=magiclink`', () => {
    expect(buildSignInLink({ siteUrl: SITE_URL, locale: 'fi', tokenHash: 'abc123', type: 'magiclink' })).toBe(
      `${SITE_URL}/fi/auth/confirm?token_hash=abc123&type=magiclink`
    );
  });

  it('writes the recovery link as the sign-in link with the type recovery and no other difference', () => {
    const signIn = buildSignInLink({ siteUrl: SITE_URL, locale: 'fi', tokenHash: 'abc123', type: 'magiclink' });
    const recovery = buildSignInLink({ siteUrl: SITE_URL, locale: 'fi', tokenHash: 'abc123', type: 'recovery' });
    expect(recovery).toBe(`${SITE_URL}/fi/auth/confirm?token_hash=abc123&type=recovery`);
    expect(recovery).toBe(signIn.replace(/magiclink$/, 'recovery'));
  });

  it('writes the address-confirmation link as the sign-in link with the type email_change and no other difference', () => {
    const signIn = buildSignInLink({ siteUrl: SITE_URL, locale: 'fi', tokenHash: 'abc123', type: 'magiclink' });
    const confirmation = buildSignInLink({
      siteUrl: SITE_URL,
      locale: 'fi',
      tokenHash: 'abc123',
      type: 'email_change'
    });
    expect(confirmation).toBe(`${SITE_URL}/fi/auth/confirm?token_hash=abc123&type=email_change`);
    expect(confirmation).toBe(signIn.replace(/magiclink$/, 'email_change'));
  });

  it.each(LINK_TYPES.map((type) => [type]))(
    'carries a token holding &, = and # through a round trip in a link of the type %s',
    (type) => {
      const tokenHash = 'a&type=invite=b#c&next=https://elsewhere.example';
      const link = new URL(buildSignInLink({ siteUrl: SITE_URL, locale: 'en', tokenHash, type }));
      expect(link.searchParams.get('token_hash')).toBe(tokenHash);
      expect(link.searchParams.getAll('type')).toEqual([type]);
      expect([...link.searchParams.keys()]).toEqual(['token_hash', 'type']);
      expect(link.hash).toBe('');
    }
  );

  it.each([
    ['invite'],
    ['signup'],
    ['email'],
    ['email_change_current'],
    ['email_change_new'],
    ['Recovery'],
    [''],
    [undefined],
    ['recovery&next=x']
  ])('throws for the type %j, which is outside the set of three', (type) => {
    expect(() =>
      buildSignInLink({ siteUrl: SITE_URL, locale: 'en', tokenHash: 'x', type: type as LinkType })
    ).toThrow();
  });

  it.each(LINK_TYPES.map((type) => [type]))(
    'throws for a site URL that is not a bare origin, for a link of the type %s',
    (type) => {
      expect(() =>
        buildSignInLink({ siteUrl: 'https://vaa.example/app', locale: 'en', tokenHash: 'x', type })
      ).toThrow();
      expect(() => buildSignInLink({ siteUrl: 'javascript:alert(1)', locale: 'en', tokenHash: 'x', type })).toThrow();
      expect(() => buildSignInLink({ siteUrl: '', locale: 'en', tokenHash: 'x', type })).toThrow();
    }
  );
});

describe('isRedirectAdmitted', () => {
  const requested = 'http://localhost:5173/en/auth/confirm';

  it('is true for the Location measured for an admitted confirm page URL', () => {
    expect(isRedirectAdmitted({ requested, location: 'http://localhost:5173/en/auth/confirm' })).toBe(true);
  });

  it('is false for the Location measured for a refused confirm page URL, which is the auth service’s own site URL', () => {
    expect(
      isRedirectAdmitted({
        requested: 'https://not-allowed.example/en/auth/confirm',
        location: 'http://127.0.0.1:5173'
      })
    ).toBe(false);
  });

  it('does not compare the query and the fragment, which carry the service’s error text', () => {
    expect(isRedirectAdmitted({ requested, location: `${requested}#error=access_denied&error_code=otp_expired` })).toBe(
      true
    );
    expect(isRedirectAdmitted({ requested, location: `${requested}?error=access_denied` })).toBe(true);
  });

  it.each([
    ['a missing header', null],
    ['an undefined header', undefined],
    ['an empty header', ''],
    ['another origin with the same path', 'https://elsewhere.example/en/auth/confirm'],
    ['the same host on another port', 'http://localhost:5174/en/auth/confirm'],
    ['the same host on another scheme', 'https://localhost:5173/en/auth/confirm'],
    ['the same origin with no path', 'http://localhost:5173'],
    ['the same origin with another locale', 'http://localhost:5173/fi/auth/confirm'],
    ['the same origin with a longer path', 'http://localhost:5173/en/auth/confirm/extra'],
    ['a relative path', '/en/auth/confirm'],
    ['text that is not a URL', 'not a url']
  ])('is false for %s', (_label, location) => {
    expect(isRedirectAdmitted({ requested, location })).toBe(false);
  });

  it('is false when the requested URL itself is not a URL', () => {
    expect(isRedirectAdmitted({ requested: 'not a url', location: 'http://localhost:5173/' })).toBe(false);
  });
});
