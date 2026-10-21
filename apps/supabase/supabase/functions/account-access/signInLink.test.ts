/**
 * The mailed link: its shape per locale, the origins it refuses, and the rule that tells an admitted redirect from a refused one.
 */

import { describe, expect, it } from 'vitest';
import { SIGN_IN_MAIL_LOCALES } from './mailTemplates.ts';
import { buildSignInLink, callbackUrl, isRedirectAdmitted } from './signInLink.ts';
import type { SignInMailLocale } from './mailTemplates.ts';
import type { LinkType } from './signInLink.ts';

const SITE_URL = 'http://localhost:5173';

describe('callbackUrl', () => {
  it.each(SIGN_IN_MAIL_LOCALES.map((locale) => [locale]))('points at the callback of %s', (locale) => {
    expect(callbackUrl({ siteUrl: SITE_URL, locale })).toBe(`${SITE_URL}/${locale}/api/auth/callback`);
  });

  it('accepts an origin written with a trailing slash', () => {
    expect(callbackUrl({ siteUrl: 'https://vaa.example/', locale: 'fi' })).toBe(
      'https://vaa.example/fi/api/auth/callback'
    );
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
  const LINK_TYPES: Array<LinkType> = ['magiclink', 'recovery'];
  const EVERY_LOCALE_AND_TYPE = SIGN_IN_MAIL_LOCALES.flatMap((locale) =>
    LINK_TYPES.map((type): [SignInMailLocale, LinkType] => [locale, type])
  );

  it.each(EVERY_LOCALE_AND_TYPE)(
    'builds the link for %s of the type %s with exactly the two query parameters',
    (locale, type) => {
      const link = new URL(buildSignInLink({ siteUrl: SITE_URL, locale, tokenHash: 'abc123', type }));
      expect(link.origin).toBe(SITE_URL);
      expect(link.pathname).toBe(`/${locale}/api/auth/callback`);
      expect([...link.searchParams.keys()]).toEqual(['token_hash', 'type']);
      expect(link.searchParams.get('token_hash')).toBe('abc123');
      expect(link.searchParams.get('type')).toBe(type);
      expect(link.hash).toBe('');
    }
  );

  it('writes the sign-in link character for character as `<callback>?token_hash=<token>&type=magiclink`', () => {
    expect(buildSignInLink({ siteUrl: SITE_URL, locale: 'fi', tokenHash: 'abc123', type: 'magiclink' })).toBe(
      `${SITE_URL}/fi/api/auth/callback?token_hash=abc123&type=magiclink`
    );
  });

  it('writes the recovery link as the sign-in link with the type recovery and no other difference', () => {
    const signIn = buildSignInLink({ siteUrl: SITE_URL, locale: 'fi', tokenHash: 'abc123', type: 'magiclink' });
    const recovery = buildSignInLink({ siteUrl: SITE_URL, locale: 'fi', tokenHash: 'abc123', type: 'recovery' });
    expect(recovery).toBe(`${SITE_URL}/fi/api/auth/callback?token_hash=abc123&type=recovery`);
    expect(recovery).toBe(signIn.replace(/magiclink$/, 'recovery'));
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

  it.each([['invite'], ['signup'], ['email'], ['Recovery'], [''], [undefined], ['recovery&next=x']])(
    'throws for the type %j, which is outside the set of two',
    (type) => {
      expect(() =>
        buildSignInLink({ siteUrl: SITE_URL, locale: 'en', tokenHash: 'x', type: type as LinkType })
      ).toThrow();
    }
  );

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
  const requested = 'http://localhost:5173/en/api/auth/callback';

  it('is true for the Location measured for an admitted callback URL', () => {
    expect(isRedirectAdmitted({ requested, location: 'http://localhost:5173/en/api/auth/callback' })).toBe(true);
  });

  it('is false for the Location measured for a refused callback URL, which is the auth service’s own site URL', () => {
    expect(
      isRedirectAdmitted({
        requested: 'https://not-allowed.example/en/api/auth/callback',
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
    ['another origin with the same path', 'https://elsewhere.example/en/api/auth/callback'],
    ['the same host on another port', 'http://localhost:5174/en/api/auth/callback'],
    ['the same host on another scheme', 'https://localhost:5173/en/api/auth/callback'],
    ['the same origin with no path', 'http://localhost:5173'],
    ['the same origin with another locale', 'http://localhost:5173/fi/api/auth/callback'],
    ['the same origin with a longer path', 'http://localhost:5173/en/api/auth/callback/extra'],
    ['a relative path', '/en/api/auth/callback'],
    ['text that is not a URL', 'not a url']
  ])('is false for %s', (_label, location) => {
    expect(isRedirectAdmitted({ requested, location })).toBe(false);
  });

  it('is false when the requested URL itself is not a URL', () => {
    expect(isRedirectAdmitted({ requested: 'not a url', location: 'http://localhost:5173/' })).toBe(false);
  });
});
