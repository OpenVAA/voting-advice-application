/**
 * Unit tests for the received-link helpers: the shape assertion refuses everything that is not a confirm page link of the type it was asked for, `magiclink`, `recovery` or `email_change`, the move to the run's origin changes the origin and no other character, and opening a link goes to it, waits for the confirm page and presses its Continue, over a page stub that records what was done to it.
 *
 * Run: yarn vitest run --config tests/vitest.config.ts mailedLink
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertSignInLinkShape, openMailedLink, runOriginFromEnv, toRunOrigin } from './mailedLink';
import { testIds } from './testIds';
import type { Page } from '@playwright/test';
import type { MailedLinkType } from './mailedLink';

/** A token that changes under any decode-and-encode round trip: an escaped plus sign, a hyphen and an underscore. */
const TOKEN = 'ab%2Bcd-ef_gh';

/** Everything of a sign-in link after its origin. */
const PATH_AND_QUERY = `/en/auth/confirm?token_hash=${TOKEN}&type=magiclink`;

const RUN_ORIGIN = 'http://localhost:5273';

/** The part of an absolute URL after its scheme and authority, cut as a string. */
function afterOrigin(link: string): string {
  return link.slice(link.indexOf('/', link.indexOf('://') + 3));
}

describe('assertSignInLinkShape', () => {
  it('accepts a confirm page link for the requested locale and returns its token, decoded once', () => {
    expect(assertSignInLinkShape(`http://localhost:5173${PATH_AND_QUERY}`, { locale: 'en' })).toBe('ab+cd-ef_gh');
  });

  it('accepts the parameters in either order', () => {
    const link = 'http://localhost:5173/fi/auth/confirm?type=magiclink&token_hash=abc';
    expect(assertSignInLinkShape(link, { locale: 'fi' })).toBe('abc');
  });

  it("refuses the auth service's own verify link", () => {
    const link = 'http://localhost:54321/auth/v1/verify?token=abc&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the path is \/auth\/v1\/verify/);
  });

  it('refuses a confirm page link of another locale', () => {
    const link = 'http://localhost:5173/fi/auth/confirm?token_hash=abc&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/expected \/en\/auth\/confirm/);
  });

  it('refuses a link to the auth callback of the requested locale', () => {
    const link = 'http://localhost:5173/en/api/auth/callback?token_hash=abc&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the path is \/en\/api\/auth\/callback/);
  });

  it('refuses a confirm page link with no locale segment', () => {
    const link = 'http://localhost:5173/auth/confirm?token_hash=abc&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the path is/);
  });

  it('refuses a third query parameter', () => {
    const link = 'http://localhost:5173/en/auth/confirm?token_hash=abc&type=magiclink&next=%2Fadmin';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/expected exactly \[token_hash, type\]/);
  });

  it('refuses a repeated parameter', () => {
    const link = 'http://localhost:5173/en/auth/confirm?token_hash=abc&token_hash=def&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/expected exactly/);
  });

  it('refuses a missing parameter', () => {
    const link = 'http://localhost:5173/en/auth/confirm?token_hash=abc';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/expected exactly/);
  });

  it('refuses another type', () => {
    const link = 'http://localhost:5173/en/auth/confirm?token_hash=abc&type=invite';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the type is not magiclink/);
  });

  it('refuses an empty token', () => {
    const link = 'http://localhost:5173/en/auth/confirm?token_hash=&type=magiclink';
    expect(() => assertSignInLinkShape(link, { locale: 'en' })).toThrow(/the token_hash is empty/);
  });

  it('refuses a link with credentials or a fragment', () => {
    expect(() =>
      assertSignInLinkShape('http://user:secret@localhost:5173/en/auth/confirm?token_hash=abc&type=magiclink', {
        locale: 'en'
      })
    ).toThrow(/carries credentials/);
    expect(() =>
      assertSignInLinkShape('http://localhost:5173/en/auth/confirm?token_hash=abc&type=magiclink#x', {
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
      `http://localhost:5173/en/auth/confirm?token_hash=${secret}&type=magiclink&extra=${secret}`,
      `http://localhost:5173/en/auth/confirm?token_hash=${secret}&type=invite`,
      `http://localhost:5173/en/auth/confirm?token_hash=${secret}&type=magiclink#${secret}`,
      `/en/auth/confirm?token_hash=${secret}&type=magiclink`
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

describe('assertSignInLinkShape, asked for the sign-in or the recovery link type', () => {
  /** A confirm page link of a type, for the English locale. */
  function confirmPageLink(type: string): string {
    return `http://localhost:5173/en/auth/confirm?token_hash=${TOKEN}&type=${type}`;
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

  it('asked for recovery, accepts a confirm page link whose only parameters are the token and type=recovery', () => {
    expect(refusalOf(confirmPageLink('recovery'), 'recovery')).toBe('');
    expect(assertSignInLinkShape(confirmPageLink('recovery'), { locale: 'en', type: 'recovery' })).toBe('ab+cd-ef_gh');
  });

  it('asked for recovery, accepts the parameters in either order', () => {
    const link = 'http://localhost:5173/fi/auth/confirm?type=recovery&token_hash=abc';
    expect(() => assertSignInLinkShape(link, { locale: 'fi', type: 'recovery' })).not.toThrow();
  });

  it('asked for recovery, refuses a magiclink link', () => {
    expect(refusalOf(confirmPageLink('magiclink'), 'recovery')).toMatch(/the type is not recovery/);
  });

  it('asked for magiclink, refuses a recovery link', () => {
    expect(refusalOf(confirmPageLink('recovery'), 'magiclink')).toMatch(/the type is not magiclink/);
  });

  it('asked for no type, asserts a magiclink link: it accepts one and refuses a recovery link', () => {
    expect(assertSignInLinkShape(confirmPageLink('magiclink'), { locale: 'en' })).toBe('ab+cd-ef_gh');
    expect(() => assertSignInLinkShape(confirmPageLink('recovery'), { locale: 'en' })).toThrow(
      /the type is not magiclink/
    );
  });

  it.each<MailedLinkType>(['magiclink', 'recovery'])('asked for %s, refuses a third query parameter', (type) => {
    expect(refusalOf(`${confirmPageLink(type)}&next=%2Fadmin`, type)).toMatch(/expected exactly \[token_hash, type\]/);
  });

  it.each<MailedLinkType>(['magiclink', 'recovery'])('asked for %s, refuses another path', (type) => {
    const link = `http://localhost:54321/auth/v1/verify?token_hash=abc&type=${type}`;
    expect(refusalOf(link, type)).toMatch(/the path is \/auth\/v1\/verify/);
  });

  it.each<MailedLinkType>(['magiclink', 'recovery'])('asked for %s, refuses a third type', (type) => {
    expect(refusalOf(confirmPageLink('invite'), type)).toMatch(new RegExp(`the type is not ${type}`));
    expect(refusalOf(confirmPageLink('signup'), type)).toMatch(new RegExp(`the type is not ${type}`));
  });

  it('refuses to assert a type it does not name, even for a link of that type', () => {
    const outside = 'invite' as MailedLinkType;
    expect(refusalOf(confirmPageLink('invite'), outside)).toMatch(
      /can assert only the types \[magiclink, recovery, email_change\]/
    );
  });

  it('never puts the token of a recovery link into an error message', () => {
    const secret = 'S3CR3T-TOKEN-VALUE';
    const refusals = [
      refusalOf(`http://localhost:5173/en/auth/confirm?token_hash=${secret}&type=magiclink`, 'recovery'),
      refusalOf(`http://localhost:5173/en/auth/confirm?token_hash=${secret}&type=recovery`, 'magiclink'),
      refusalOf(`http://localhost:5173/en/auth/confirm?token_hash=${secret}&type=recovery&x=${secret}`, 'recovery')
    ];
    for (const message of refusals) {
      expect(message).not.toBe('');
      expect(message.includes(secret)).toBe(false);
    }
  });
});

describe('assertSignInLinkShape, asked for an address-confirmation link', () => {
  /** An address-confirmation link as the function mails it, for a locale. */
  function addressConfirmationLink(locale: string): string {
    return `http://localhost:5173/${locale}/auth/confirm?token_hash=${TOKEN}&type=email_change`;
  }

  it('accepts a confirm page link of type email_change under a locale, and the move to the run origin changes nothing else', () => {
    const link = addressConfirmationLink('fi');
    expect(assertSignInLinkShape(link, { locale: 'fi', type: 'email_change' })).toBe('ab+cd-ef_gh');
    const moved = toRunOrigin(link, RUN_ORIGIN);
    expect(afterOrigin(moved)).toBe(afterOrigin(link));
    expect(assertSignInLinkShape(moved, { locale: 'fi', type: 'email_change' })).toBe('ab+cd-ef_gh');
  });

  it.each(['invite', 'signup', 'email'])('asked for email_change, refuses a link of type %s', (type) => {
    const link = `http://localhost:5173/en/auth/confirm?token_hash=${TOKEN}&type=${type}`;
    expect(() => assertSignInLinkShape(link, { locale: 'en', type: 'email_change' })).toThrow(
      /the type is not email_change/
    );
  });

  it('refuses to be asked for a type it does not name', () => {
    for (const outside of ['invite', 'signup', 'email']) {
      const link = `http://localhost:5173/en/auth/confirm?token_hash=${TOKEN}&type=${outside}`;
      expect(() => assertSignInLinkShape(link, { locale: 'en', type: outside as MailedLinkType })).toThrow(
        /can assert only the types/
      );
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
    const rest = '/en/auth/confirm?token_hash=ab%2bcd%7Eef~gh&type=magiclink';
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

describe('openMailedLink', () => {
  /** A received link on the run's origin: the confirm page, with the token and the type. */
  const LINK = `${RUN_ORIGIN}${PATH_AND_QUERY}`;

  /**
   * A page that records each thing done to it. `goto` puts the browser on the confirm page, and a click on Continue moves it to the Contestant App's root.
   *
   * @param options.leavesOnContinue - Whether a click on Continue moves the browser off the confirm page.
   */
  function recordingPage({ leavesOnContinue = true }: { leavesOnContinue?: boolean } = {}) {
    const done = new Array<string>();
    const gotoArguments = new Array<string>();
    let current = 'about:blank';
    const ids = testIds.auth.confirm;
    const continueButton = {
      click: async () => {
        done.push('click continue');
        if (leavesOnContinue) current = `${RUN_ORIGIN}/en/contestant`;
      }
    };
    const root = {
      waitFor: async ({ state }: { state?: string } = {}) => {
        done.push(`wait for the page ${state}`);
      },
      getByTestId: (id: string) => {
        if (id !== ids.continue) throw new Error(`the helper looked for ${id} in the confirm page`);
        return continueButton;
      }
    };
    const page = {
      goto: async (url: string) => {
        done.push('goto');
        gotoArguments.push(url);
        current = `${RUN_ORIGIN}/en/auth/confirm?token_hash=${TOKEN}&type=magiclink`;
        return null;
      },
      getByTestId: (id: string) => {
        if (id !== ids.page) throw new Error(`the helper looked for ${id} on the page`);
        return root;
      },
      url: () => current
    };
    return { page: page as unknown as Page, done, gotoArguments };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('goes to the link as it is given, waits for the confirm page, presses Continue and returns once the browser has left the page', async () => {
    const { page, done, gotoArguments } = recordingPage();

    await openMailedLink(page, LINK);

    expect(done).toEqual(['goto', 'wait for the page visible', 'click continue']);
    expect(gotoArguments).toHaveLength(1);
    expect(gotoArguments[0] === LINK, 'the URL went to goto unchanged').toBe(true);
    expect(new URL(page.url()).pathname).toBe('/en/contestant');
  });

  it('logs nothing, so the link and its token reach no output', async () => {
    const written = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'info'),
      vi.spyOn(console, 'warn'),
      vi.spyOn(console, 'error'),
      vi.spyOn(console, 'debug')
    ];
    const { page } = recordingPage();

    await openMailedLink(page, LINK);

    for (const spy of written) expect(spy).not.toHaveBeenCalled();
  });
});
