/**
 * The server load and the form action of the registration page, each driven directly with a fake request context.
 *
 * The data-provider factory is replaced, so no client is built. The guard of the registration addresses is the real one, over settings that offer the email mode.
 *
 * What this file holds:
 *
 * 1. **The marker of a confirmed address** — the load answers whether the request carries the cookie a browser receives once it has confirmed an address, and reads nothing of the address bar for it.
 * 2. **The dismissal** — the action `dismissRegistered` removes that cookie on the path it was set on and answers success.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import * as server from './+page.server';

const { createDataProvider, createSupabaseAnonClient, getAppSettings } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  createSupabaseAnonClient: vi.fn(),
  getAppSettings: vi.fn()
}));

vi.mock('$lib/api/dataProvider', () => ({ createDataProvider, createSupabaseAnonClient }));

const LOCALE = 'fi';

/** Settings of a project that serves candidates and allows them the given registration modes. */
function settingsFor(modes: Array<string>) {
  return {
    access: { answersLocked: false },
    contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: modes, organization: [] } }
  };
}

/** What the load and the action touch of the request. */
type FakeEvent = {
  fetch: typeof fetch;
  locals: { currentLocale: string };
  cookies: { get: (name: string) => string | undefined; delete: (name: string, options: unknown) => void };
  readonly url: URL;
};
const runLoad = server.load as unknown as (event: FakeEvent) => Promise<unknown>;

/** A cookie the action removed. */
type CookieRemoval = { name: string; options: unknown };

/** The cookies the requests of the running test removed, oldest first. */
let removals: Array<CookieRemoval> = [];

/** The properties of the address bar each request had read, by request. */
let urlReads: Array<string | symbol> = [];

/**
 * A request carrying the given cookies. Its `url` records every property read of it.
 * @param cookies - The request's cookies, by name.
 */
function requestWith(cookies: Record<string, string> = {}): FakeEvent {
  const url = new Proxy(new URL(`http://localhost/${LOCALE}/contestant/register`), {
    get(target, property) {
      urlReads.push(property);
      return Reflect.get(target, property, target);
    }
  });
  return {
    fetch: vi.fn() as unknown as typeof fetch,
    locals: { currentLocale: LOCALE },
    cookies: {
      get: (name: string) => cookies[name],
      delete: (name: string, options: unknown) => {
        removals.push({ name, options });
      }
    },
    get url() {
      urlReads.push('url');
      return url;
    }
  };
}

beforeEach(() => {
  urlReads = [];
  removals = [];
  createSupabaseAnonClient.mockReturnValue({});
  createDataProvider.mockReturnValue({ getAppSettings });
  getAppSettings.mockResolvedValue(settingsFor(['email']));
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('the marker of a confirmed address', () => {
  it('answers that the browser has confirmed an address when the request carries the marker, reading nothing of the address bar', async () => {
    expect(await runLoad(requestWith({ [COOKIE.registered]: '1' }))).toEqual({ registered: true });
    expect(urlReads).toEqual([]);
  });

  it('answers that it has not when the request carries no marker, or other cookies alone, reading nothing of the address bar', async () => {
    expect(await runLoad(requestWith())).toEqual({ registered: false });
    expect(await runLoad(requestWith({ [COOKIE.identityProviderArrival]: 'created' }))).toEqual({ registered: false });
    expect(urlReads).toEqual([]);
  });
});

describe('the dismissal', () => {
  it('removes the marker on the path it was set on and answers success, reading nothing of the address bar', async () => {
    const actions = (server as { actions?: Record<string, unknown> }).actions;
    expect(typeof actions?.dismissRegistered, 'the page has the action dismissRegistered').toBe('function');
    const dismissRegistered = actions?.dismissRegistered as (event: FakeEvent) => Promise<unknown>;

    const answer = await dismissRegistered(requestWith({ [COOKIE.registered]: '1' }));

    expect(answer).toBeUndefined();
    expect(removals).toEqual([{ name: COOKIE.registered, options: { path: '/' } }]);
    expect(urlReads).toEqual([]);
  });
});
