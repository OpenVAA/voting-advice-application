import { describe, expect, it, vi } from 'vitest';
import { createSupabaseCookieAdapter } from './server';
import { resolveSupabaseCookiePrefix } from './universal';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * The two halves of the SSR-payload safety property (CR-03).
 *
 * `routes/+layout.server.ts` and `routes/(voters)/(located)/+layout.server.ts` publish the request's Supabase auth cookies into the HTML of EVERY page in the application, public voter routes included. Two claims make that acceptable, and until this spec neither was checked anywhere:
 *
 * 1. **The forwarded cookies are already readable by client JavaScript.** That was a transitive dependency on `@supabase/ssr`'s `DEFAULT_COOKIE_OPTIONS`; `createSupabaseCookieAdapter` now pins `httpOnly: false` after the spread, and the first case below writes a cookie whose incoming options say `httpOnly: true` to prove the pin overrides rather than merges.
 * 2. **The filter forwards ONLY those cookies.** A bare `sb-` prefix match would sweep in any future application cookie whose name happens to start with those three characters; the second group asserts the prefix is the whole storage key the client actually uses.
 */

/**
 * A minimal `RequestEvent` exposing only the cookie jar the adapter touches.
 * @returns The stub event and the `set` spy every assertion reads.
 */
function eventWithCookieSpy() {
  const set = vi.fn();
  const event = { cookies: { getAll: vi.fn(() => []), set } } as unknown as RequestEvent;
  return { event, set };
}

describe('createSupabaseCookieAdapter — the payload safety property is pinned, not inherited', () => {
  it('writes the auth cookies `httpOnly: false` even when the library asks for `httpOnly: true`', () => {
    const { event, set } = eventWithCookieSpy();

    createSupabaseCookieAdapter(event).setAll([
      { name: 'sb-127-auth-token', value: 'the-session', options: { httpOnly: true, sameSite: 'lax' } }
    ]);

    expect(set).toHaveBeenCalledTimes(1);
    const [name, value, options] = set.mock.calls[0];
    expect(name).toBe('sb-127-auth-token');
    expect(value).toBe('the-session');
    // The load-bearing assertion: if this ever reads `true`, the two payload filters are disclosing a credential the `httpOnly` flag was meant to hide.
    expect(options.httpOnly).toBe(false);
    // The pin must not eat the library's other options, nor the path the client depends on.
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
  });

  it('writes every cookie in the batch, not just the first', () => {
    const { event, set } = eventWithCookieSpy();

    createSupabaseCookieAdapter(event).setAll([
      { name: 'sb-127-auth-token.0', value: 'chunk-0', options: {} },
      { name: 'sb-127-auth-token.1', value: 'chunk-1', options: {} }
    ]);

    expect(set.mock.calls.map(([name]) => name)).toEqual(['sb-127-auth-token.0', 'sb-127-auth-token.1']);
    expect(set.mock.calls.every(([, , options]) => options.httpOnly === false)).toBe(true);
  });
});

/**
 * A `RequestEvent` exposing the cookie jar and `setHeaders`, each a spy.
 * @returns The stub event and both spies.
 */
function eventWithCookieAndHeaderSpies() {
  const set = vi.fn();
  const setHeaders = vi.fn();
  const event = { cookies: { getAll: vi.fn(() => []), set }, setHeaders } as unknown as RequestEvent;
  return { event, set, setHeaders };
}

const CACHE_HEADERS = { 'Cache-Control': 'private, no-store', Expires: '0' };

describe('createSupabaseCookieAdapter — the cache headers that come with auth cookies reach the response', () => {
  it('sets the cookies and forwards every header passed with them', () => {
    const { event, set, setHeaders } = eventWithCookieAndHeaderSpies();

    createSupabaseCookieAdapter(event).setAll(
      [{ name: 'sb-127-auth-token', value: 'the-session', options: { sameSite: 'lax' } }],
      CACHE_HEADERS
    );

    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0][2]).toMatchObject({ sameSite: 'lax', httpOnly: false, path: '/' });
    expect(setHeaders).toHaveBeenCalledTimes(1);
    expect(setHeaders).toHaveBeenCalledWith(CACHE_HEADERS);
  });

  it('does not set a header again in the same request, because SvelteKit throws on a repeated header', () => {
    const { event, set, setHeaders } = eventWithCookieAndHeaderSpies();
    const adapter = createSupabaseCookieAdapter(event);

    adapter.setAll([{ name: 'sb-127-auth-token', value: 'first', options: {} }], CACHE_HEADERS);
    adapter.setAll([{ name: 'sb-127-auth-token', value: 'second', options: {} }], {
      'cache-control': 'private, no-store',
      EXPIRES: '0'
    });

    expect(set).toHaveBeenCalledTimes(2);
    expect(setHeaders).toHaveBeenCalledTimes(1);
  });

  it('calls `setHeaders` not at all when no headers come with the cookies', () => {
    const { event, set, setHeaders } = eventWithCookieAndHeaderSpies();
    const adapter = createSupabaseCookieAdapter(event);

    adapter.setAll([{ name: 'sb-127-auth-token', value: 'the-session', options: {} }]);
    adapter.setAll([{ name: 'sb-127-auth-token', value: 'the-session', options: {} }], {});

    expect(set).toHaveBeenCalledTimes(2);
    expect(setHeaders).not.toHaveBeenCalled();
  });
});

describe('resolveSupabaseCookiePrefix — the filter is the storage key, not `sb-`', () => {
  it('derives the key `@supabase/supabase-js` computes from the project URL', () => {
    // Transcribed from the installed client: `sb-${hostname.split('.')[0]}-auth-token`.
    expect(resolveSupabaseCookiePrefix('https://abcdefgh.supabase.co')).toBe('sb-abcdefgh-auth-token');
    expect(resolveSupabaseCookiePrefix('http://127.0.0.1:54321')).toBe('sb-127-auth-token');
  });

  it('still covers the chunked and PKCE companion cookies the client writes', () => {
    const prefix = resolveSupabaseCookiePrefix('http://127.0.0.1:54321');
    for (const name of ['sb-127-auth-token', 'sb-127-auth-token.0', 'sb-127-auth-token-code-verifier'])
      expect(name.startsWith(prefix)).toBe(true);
  });

  it('does NOT match an unrelated application cookie that merely begins with `sb-`', () => {
    const prefix = resolveSupabaseCookiePrefix('http://127.0.0.1:54321');
    expect('sb-feature-flags'.startsWith(prefix)).toBe(false);
  });

  it('never throws on an unparseable URL, because both callers evaluate it at module scope', () => {
    expect(resolveSupabaseCookiePrefix('')).toBe('sb-');
    expect(resolveSupabaseCookiePrefix('not a url')).toBe('sb-');
  });
});
