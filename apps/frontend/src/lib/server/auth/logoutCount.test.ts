/**
 * The server's withdrawal of the logout modal's count at a sign-in, driven with a fake request event.
 *
 * The event's cookies answer `get` as SvelteKit's do: a value written into this response first, then the request's own header. Every removal is recorded in one list, so the names, the domains and the attributes of each are read off it.
 *
 * @vitest-environment node
 */

import { describe, expect, it } from 'vitest';
import { LOGOUT_DEADLINE_SETTLED } from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import { withdrawLogoutCount } from './logoutCount';
import type { RequestEvent } from '@sveltejs/kit';

/** An id of a count's opening, as the page writes it. */
const COUNT_ID = '0123456789abcdef0123456789abcdef';

/** A cookie of the request that is neither name of the count. */
const OTHER_COOKIE = 'sb-127-auth-token=a-session';

/** A removal the helper made. */
type Removal = { name: string; options: Record<string, unknown> };

/**
 * A request event with the given address and `Cookie` header.
 * @param options.address - The request's address.
 * @param options.cookie - The request's `Cookie` header, or `undefined` for none.
 * @param options.written - The values written into this response before the helper runs, by name, as the request hook writes the settled marker.
 * @returns The event and the removals the helper makes on it.
 */
function eventWith({
  address,
  cookie,
  written = {}
}: {
  address: string;
  cookie?: string;
  written?: Record<string, string>;
}): { event: Pick<RequestEvent, 'cookies' | 'request' | 'url'>; removals: Array<Removal> } {
  const removals: Array<Removal> = [];
  function headerValue(name: string): string | undefined {
    return (cookie ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .find(([key]) => key === name)?.[1];
  }
  const cookies = {
    get: (name: string) => (name in written ? written[name] : headerValue(name)),
    delete: (name: string, options: Record<string, unknown>) => {
      removals.push({ name, options });
    }
  };
  return {
    event: {
      cookies: cookies as unknown as RequestEvent['cookies'],
      request: new Request(address, { headers: cookie === undefined ? {} : { cookie } }),
      url: new URL(address)
    },
    removals
  };
}

/** The attributes of every removal, as the page and the request hook write the two cookies. */
function attributes(secure: boolean, domain?: string): Record<string, unknown> {
  return { path: '/', httpOnly: false, sameSite: 'lax', secure, ...(domain ? { domain } : {}) };
}

describe('withdrawLogoutCount', () => {
  it('removes nothing from a request that carries neither cookie of the count', () => {
    const { event, removals } = eventWith({ address: 'http://localhost/en/contestant/login', cookie: OTHER_COOKIE });
    withdrawLogoutCount(event);
    expect(removals).toEqual([]);
  });

  it('removes nothing from a request that carries no cookie at all', () => {
    const { event, removals } = eventWith({ address: 'http://localhost/en/contestant/login' });
    withdrawLogoutCount(event);
    expect(removals).toEqual([]);
  });

  it('on localhost, removes both cookies host-only, not secure, and for no domain', () => {
    const { event, removals } = eventWith({
      address: 'http://localhost/en/contestant/login',
      cookie: `${OTHER_COOKIE}; ${COOKIE.logoutPending}=${COUNT_ID}; ${COOKIE.logoutDeadline}=${COUNT_ID}`
    });
    withdrawLogoutCount(event);
    expect(removals).toEqual([
      { name: COOKIE.logoutPending, options: attributes(false) },
      { name: COOKIE.logoutDeadline, options: attributes(false) }
    ]);
  });

  it('on https://app.example.org, removes both cookies host-only, for the host and for its parent domain, secure', () => {
    const { event, removals } = eventWith({
      address: 'https://app.example.org/en/contestant/login',
      cookie: `${COOKIE.logoutPending}=${COUNT_ID}; ${COOKIE.logoutDeadline}=${COUNT_ID}`
    });
    withdrawLogoutCount(event);
    expect(removals).toEqual([
      { name: COOKIE.logoutPending, options: attributes(true) },
      { name: COOKIE.logoutPending, options: attributes(true, 'app.example.org') },
      { name: COOKIE.logoutPending, options: attributes(true, 'example.org') },
      { name: COOKIE.logoutDeadline, options: attributes(true) },
      { name: COOKIE.logoutDeadline, options: attributes(true, 'app.example.org') },
      { name: COOKIE.logoutDeadline, options: attributes(true, 'example.org') }
    ]);
  });

  it('removes both cookies from a request that carries the deadline alone', () => {
    const { event, removals } = eventWith({
      address: 'http://localhost/en/contestant/login',
      cookie: `${COOKIE.logoutDeadline}=${COUNT_ID}`
    });
    withdrawLogoutCount(event);
    expect(removals.map(({ name }) => name)).toEqual([COOKIE.logoutPending, COOKIE.logoutDeadline]);
  });

  it('removes nothing from a request that carries the settled marker', () => {
    const { event, removals } = eventWith({
      address: 'http://localhost/en/contestant/login',
      cookie: `${COOKIE.logoutPending}=${LOGOUT_DEADLINE_SETTLED}`
    });
    withdrawLogoutCount(event);
    expect(removals).toEqual([]);
  });

  it('removes nothing from a request that carries the settled marker beside an id', () => {
    const { event, removals } = eventWith({
      address: 'http://localhost/en/contestant/login',
      cookie: `${COOKIE.logoutPending}=${COUNT_ID}; ${COOKIE.logoutPending}=${LOGOUT_DEADLINE_SETTLED}`
    });
    withdrawLogoutCount(event);
    expect(removals).toEqual([]);
  });

  it('removes nothing from a request with a run-out id when the request hook has written the settled marker into the response', () => {
    const { event, removals } = eventWith({
      address: 'http://localhost/en/contestant/login',
      cookie: `${COOKIE.logoutPending}=${COUNT_ID}`,
      written: { [COOKIE.logoutPending]: LOGOUT_DEADLINE_SETTLED }
    });
    withdrawLogoutCount(event);
    expect(removals).toEqual([]);
  });

  it("removes both cookies from a request with a run-out id when the request hook's sign-out failed and wrote nothing", () => {
    const { event, removals } = eventWith({
      address: 'http://localhost/en/contestant/login',
      cookie: `${COOKIE.logoutPending}=${COUNT_ID}`
    });
    withdrawLogoutCount(event);
    expect(removals).toEqual([
      { name: COOKIE.logoutPending, options: attributes(false) },
      { name: COOKIE.logoutDeadline, options: attributes(false) }
    ]);
  });
});
