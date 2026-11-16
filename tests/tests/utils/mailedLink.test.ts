/**
 * Unit tests for the received-link helpers: the shape assertion refuses everything that is not a callback link of the type it was asked for, `magiclink` or `recovery`, and the move to the run's origin changes the origin and no other character.
 *
 * Run: yarn vitest run --config tests/vitest.config.ts mailedLink
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertSignInLinkShape, runOriginFromEnv, toRunOrigin } from './mailedLink';
import type { MailedLinkType } from './mailedLink';

/** A token that changes under any decode-and-encode round trip: an escaped plus sign, a hyphen and an underscore. */
const TOKEN = 'ab%2Bcd-ef_gh';

/** Everything of a sign-in link after its origin. */
const PATH_AND_QUERY = `/en/api/auth/callback?token_hash=${TOKEN}&type=magiclink`;

const RUN_ORIGIN = 'http://localhost:5273';

/** The part of an absolute URL after its scheme and authority, cut as a string. */
function afterOrigin(link: string): string {
  return link.slice(link.indexOf('/', link.indexOf('://') + 3));
}

describe('assertSignInLinkShape', () => {
  it('accepts a callback link for the requested locale and returns its token, decoded once', () => {
    expect(assertSignInLinkShape(`http://localhost:5173${PATH_AND_QUERY}`, { locale: 'en' })).toBe('ab+cd-ef_gh');
  });

  it('accepts the parameters in either order', () => {
    const link = 'http://localhost:5173/fi/api/auth/callback?type=magiclink&token_hash=abc';
    expect(assertSignInLinkShape(link, { locale: 'fi' })).toBe('abc');
  });

  it("refuses the auth service's own verify link", () => {
    const link = 'http://localhost:54321/auth/v1/verify?token=abc&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the path is \/auth\/v1\/verify/);
  });

  it('refuses a callback link of another locale', () => {
    const link = 'http://localhost:5173/fi/api/auth/callback?token_hash=abc&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/expected \/en\/api\/auth\/callback/);
  });

  it('refuses a callback link with no locale segment', () => {
    const link = 'http://localhost:5173/api/auth/callback?token_hash=abc&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the path is/);
  });

  it('refuses a third query parameter', () => {
    const link = 'http://localhost:5173/en/api/auth/callback?token_hash=abc&type=magiclink&next=%2Fadmin';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/expected exactly \[token_hash, type\]/);
  });

  it('refuses a repeated parameter', () => {
    const link = 'http://localhost:5173/en/api/auth/callback?token_hash=abc&token_hash=def&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/expected exactly/);
  });

  it('refuses a missing parameter', () => {
    const link = 'http://localhost:5173/en/api/auth/callback?token_hash=abc';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/expected exactly/);
  });

  it('refuses another type', () => {
    const link = 'http://localhost:5173/en/api/auth/callback?token_hash=abc&type=invite';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the type is not magiclink/);
  });

  it('refuses an empty token', () => {
    const link = 'http://localhost:5173/en/api/auth/callback?token_hash=&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the token_hash is empty/);
  });

  it('refuses a link with credentials or a fragment', () => {
    expect(() =>
      assertSignInLinkShape('http://user:secret@localhost:5173/en/api/auth/callback?token_hash=abc&type=magiclink', {
        locale: 'en'
      })
    ).toThrow(/carries credentials/);
    expect(() =>
      assertSignInLinkShape('http://localhost:5173/en/api/auth/callback?token_hash=abc&type=magiclink#x', {
        locale: 'en'
      })
    ).toThrow(/carries a fragment/);
  });

  it('refuses a string that is not an absolute URL', () => {
    expect(() => assertSignInLinkShape(PATH_AND_QUERY, { locale: 'en' })).toThrow(/does not parse/);
  });

  it('never puts the token or the query string into an error message', () => {
    const secret = 'S3CR3T-TOKEN-VALUE';
    const links = [
      `http://localhost:54321/auth/v1/verify?token=${secret}&type=magiclink`,
      `http://localhost:5173/en/api/auth/callback?token_hash=${secret}&type=magiclink&extra=${secret}`,
      `http://localhost:5173/en/api/auth/callback?token_hash=${secret}&type=invite`,
      `http://localhost:5173/en/api/auth/callback?token_hash=${secret}&type=magiclink#${secret}`,
      `/en/api/auth/callback?token_hash=${secret}&type=magiclink`
    ];
    for (const link of links) {
      const message = (() => {
        try {
          assertSignInLinkShape(link, { locale: 'en' });
          return '';
        } catch (e) {
          return (e as Error).message;
        }
      })();
      expect(message).not.toBe('');
      expect(message.includes(secret)).toBe(false);
    }
  });
});

describe('assertSignInLinkShape, asked for one of the two link types', () => {
  /** A callback link of a type, for the English locale. */
  function callbackLink(type: string): string {
    return `http://localhost:5173/en/api/auth/callback?token_hash=${TOKEN}&type=${type}`;
  }

  /** The message the assertion throws for a link, or the empty string when it accepts the link. */
  function refusalOf(link: string, type: MailedLinkType): string {
    try {
      assertSignInLinkShape(link, { locale: 'en', type });
      return '';
    } catch (e) {
      return (e as Error).message;
    }
  }

  it('asked for recovery, accepts a callback link whose only parameters are the token and type=recovery', () => {
    expect(refusalOf(callbackLink('recovery'), 'recovery')).toBe('');
    expect(assertSignInLinkShape(callbackLink('recovery'), { locale: 'en', type: 'recovery' })).toBe('ab+cd-ef_gh');
  });

  it('asked for recovery, accepts the parameters in either order', () => {
    const link = 'http://localhost:5173/fi/api/auth/callback?type=recovery&token_hash=abc';
    expect(() => assertSignInLinkShape(link, { locale: 'fi', type: 'recovery' })).not.toThrow();
  });

  it('asked for recovery, refuses a magiclink link', () => {
    expect(refusalOf(callbackLink('magiclink'), 'recovery')).toMatch(/the type is not recovery/);
  });

  it('asked for magiclink, refuses a recovery link', () => {
    expect(refusalOf(callbackLink('recovery'), 'magiclink')).toMatch(/the type is not magiclink/);
  });

  it('asked for no type, asserts a magiclink link: it accepts one and refuses a recovery link', () => {
    expect(assertSignInLinkShape(callbackLink('magiclink'), { locale: 'en' })).toBe('ab+cd-ef_gh');
    expect(() => assertSignInLinkShape(callbackLink('recovery'), { locale: 'en' })).toThrow(
      /the type is not magiclink/
    );
  });

  it.each<MailedLinkType>(['magiclink', 'recovery'])('asked for %s, refuses a third query parameter', (type) => {
    expect(refusalOf(`${callbackLink(type)}&next=%2Fadmin`, type)).toMatch(/expected exactly \[token_hash, type\]/);
  });

  it.each<MailedLinkType>(['magiclink', 'recovery'])('asked for %s, refuses another path', (type) => {
    const link = `http://localhost:54321/auth/v1/verify?token_hash=abc&type=${type}`;
    expect(refusalOf(link, type)).toMatch(/the path is \/auth\/v1\/verify/);
  });

  it.each<MailedLinkType>(['magiclink', 'recovery'])('asked for %s, refuses a third type', (type) => {
    expect(refusalOf(callbackLink('invite'), type)).toMatch(new RegExp(`the type is not ${type}`));
    expect(refusalOf(callbackLink('signup'), type)).toMatch(new RegExp(`the type is not ${type}`));
  });

  it('refuses to assert a type outside the two, even for a link of that type', () => {
    const outside = 'invite' as MailedLinkType;
    expect(refusalOf(callbackLink('invite'), outside)).toMatch(/can assert only the types \[magiclink, recovery\]/);
  });

  it('never puts the token of a recovery link into an error message', () => {
    const secret = 'S3CR3T-TOKEN-VALUE';
    const refusals = [
      refusalOf(`http://localhost:5173/en/api/auth/callback?token_hash=${secret}&type=magiclink`, 'recovery'),
      refusalOf(`http://localhost:5173/en/api/auth/callback?token_hash=${secret}&type=recovery`, 'magiclink'),
      refusalOf(`http://localhost:5173/en/api/auth/callback?token_hash=${secret}&type=recovery&x=${secret}`, 'recovery')
    ];
    for (const message of refusals) {
      expect(message).not.toBe('');
      expect(message.includes(secret)).toBe(false);
    }
  });
});

describe('toRunOrigin', () => {
  it('leaves the path and the query string as they are, character for character', () => {
    const moved = toRunOrigin(`http://localhost:5173${PATH_AND_QUERY}`, RUN_ORIGIN);
    expect(afterOrigin(moved)).toBe(PATH_AND_QUERY);
    expect(moved).toBe(`${RUN_ORIGIN}${PATH_AND_QUERY}`);
  });

  it('leaves escapes a parser would rewrite as they are: a lower-case escape, an escaped tilde and a bare one', () => {
    const rest = '/en/api/auth/callback?token_hash=ab%2bcd%7Eef~gh&type=magiclink';
    const moved = toRunOrigin(`http://localhost:5173${rest}`, RUN_ORIGIN);
    expect(afterOrigin(moved)).toBe(rest);
  });

  it('moves a link on 127.0.0.1:5173 and one on localhost:5173 to the same run origin', () => {
    const fromLoopback = toRunOrigin(`http://127.0.0.1:5173${PATH_AND_QUERY}`, RUN_ORIGIN);
    const fromLocalhost = toRunOrigin(`http://localhost:5173${PATH_AND_QUERY}`, RUN_ORIGIN);
    expect(fromLoopback).toBe(`${RUN_ORIGIN}${PATH_AND_QUERY}`);
    expect(fromLocalhost).toBe(fromLoopback);
  });

  it('replaces the scheme and the port as well as the host', () => {
    const moved = toRunOrigin(`https://vaa.example.org${PATH_AND_QUERY}`, RUN_ORIGIN);
    expect(moved).toBe(`${RUN_ORIGIN}${PATH_AND_QUERY}`);
  });

  it('uses only the origin of the run origin it is given', () => {
    const moved = toRunOrigin(`http://localhost:5173${PATH_AND_QUERY}`, `${RUN_ORIGIN}/some/path?x=1`);
    expect(moved).toBe(`${RUN_ORIGIN}${PATH_AND_QUERY}`);
  });

  it('keeps a link that the shape assertion accepts acceptable, with the same token', () => {
    const link = `http://localhost:5173${PATH_AND_QUERY}`;
    const moved = toRunOrigin(link, RUN_ORIGIN);
    expect(assertSignInLinkShape(moved, { locale: 'en' })).toBe(assertSignInLinkShape(link, { locale: 'en' }));
  });

  it('refuses a link that is not an absolute URL, and a run origin that does not parse', () => {
    expect(() => toRunOrigin(PATH_AND_QUERY, RUN_ORIGIN)).toThrow(/not an absolute URL/);
    expect(() => toRunOrigin(`http://localhost:5173${PATH_AND_QUERY}`, 'not a url')).toThrow(/does not parse/);
  });
});

describe('runOriginFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('names localhost on FRONTEND_PORT', () => {
    vi.stubEnv('FRONTEND_PORT', '5273');
    expect(runOriginFromEnv()).toBe('http://localhost:5273');
  });

  it('falls back to port 5173 when FRONTEND_PORT is empty', () => {
    vi.stubEnv('FRONTEND_PORT', '');
    expect(runOriginFromEnv()).toBe('http://localhost:5173');
  });
});
