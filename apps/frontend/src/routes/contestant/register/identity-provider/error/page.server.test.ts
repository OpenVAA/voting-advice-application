/**
 * The server load of the identity provider's error screen, driven directly with a fake request context.
 *
 * `$lib/api/dataProvider` is replaced, so no Supabase client is built: `createSupabaseAnonClient` answers a marker object and `createDataProvider` answers a provider whose `getAppSettings` each case controls. The class table and the list of offered modes are the real ones.
 *
 * What this file holds:
 *
 * 1. **The class** — each code's class, and the retry class for a missing, an unknown and a crafted value.
 * 2. **Nothing else** — the answer holds the class and whether Try again is offered, and no part of the parameter.
 * 3. **Try again** — offered while the provider's mode is listed, not otherwise, and not when the settings cannot be read.
 * 4. **No refusal** — the page is served when the project offers no registration at all.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

const { ANON_CLIENT, createDataProvider, createSupabaseAnonClient, getAppSettings } = vi.hoisted(() => ({
  ANON_CLIENT: { marker: 'anonymous client' },
  createDataProvider: vi.fn(),
  createSupabaseAnonClient: vi.fn(),
  getAppSettings: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider, createSupabaseAnonClient }));

const fakeFetch = vi.fn() as unknown as typeof fetch;

/** A value no code spells, holding markup and a quote, as a crafted link would. */
const CRAFTED = '"><script>alert(1)</script>';

const PROVIDER_LISTED = {
  contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: ['identity_provider', 'email'] } }
};
const PROVIDER_NOT_LISTED = {
  contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: ['email', 'code'] } }
};
const NOTHING_LISTED = {
  contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: [] } }
};
const PROVIDER_LOCKED = { ...PROVIDER_LISTED, access: { answersLocked: true } };

/**
 * A request for the error screen.
 * @param error - The `error` search parameter, or `undefined` for none.
 */
function makeEvent(error?: string) {
  const url = new URL('http://localhost/contestant/register/identity-provider/error');
  if (error !== undefined) url.searchParams.set('error', error);
  return { fetch: fakeFetch, url, locals: { currentLocale: 'en' } } as unknown as Parameters<typeof load>[0];
}

async function run(error?: string): Promise<Record<string, unknown>> {
  return (await load(makeEvent(error))) as Record<string, unknown>;
}

beforeEach(() => {
  createSupabaseAnonClient.mockReturnValue(ANON_CLIENT);
  createDataProvider.mockReturnValue({ getAppSettings });
  getAppSettings.mockResolvedValue(PROVIDER_LISTED);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('the class', () => {
  it.each([
    ['cancelled', 'cancelled'],
    ['invalid_state', 'retry'],
    ['missing_code', 'retry'],
    ['token_exchange_failed', 'retry'],
    ['provider_error', 'retry'],
    ['registration_failed', 'retry'],
    ['invalid_token', 'noRetry'],
    ['mode_not_allowed', 'noRetry'],
    ['configuration_error', 'noRetry']
  ])('answers %s with the class %s', async (code, errorClass) => {
    expect((await run(code)).errorClass).toBe(errorClass);
  });

  it.each([undefined, '', 'access_denied', 'constructor', CRAFTED])(
    'answers %j with the retry class',
    async (value) => {
      expect((await run(value)).errorClass).toBe('retry');
    }
  );
});

describe('nothing else', () => {
  it.each(['cancelled', 'configuration_error', CRAFTED, 'login_required'])(
    'answers %j with the class and the offer alone',
    async (value) => {
      expect(Object.keys(await run(value)).sort()).toEqual(['errorClass', 'providerOffered']);
    }
  );

  it('returns no part of a crafted parameter', async () => {
    const answer = JSON.stringify(await run(CRAFTED));
    expect(answer).not.toContain('script');
    expect(answer).not.toContain('alert');
  });
});

describe('Try again', () => {
  it("is offered while the provider's mode is listed", async () => {
    expect((await run('cancelled')).providerOffered).toBe(true);
  });

  it.each([
    ["the provider's mode is not allowed", PROVIDER_NOT_LISTED],
    ['no mode is allowed', NOTHING_LISTED],
    ['answers are locked', PROVIDER_LOCKED]
  ])('is not offered when %s', async (_name, settings) => {
    getAppSettings.mockResolvedValue(settings);
    expect((await run('cancelled')).providerOffered).toBe(false);
  });

  it('is not offered when the settings cannot be read, and the failure is logged', async () => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    getAppSettings.mockRejectedValue(new Error('read failed'));
    expect(await run('retry')).toEqual({ errorClass: 'retry', providerOffered: false });
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("reads the settings through an anonymous client and the request's own fetch", async () => {
    await run('cancelled');
    expect(createSupabaseAnonClient).toHaveBeenCalledWith({ fetch: fakeFetch });
    expect(createDataProvider).toHaveBeenCalledWith({ fetch: fakeFetch, client: ANON_CLIENT });
  });
});

describe('no refusal', () => {
  it('serves the page when the project offers no registration', async () => {
    getAppSettings.mockResolvedValue(NOTHING_LISTED);
    await expect(run('mode_not_allowed')).resolves.toEqual({ errorClass: 'noRetry', providerOffered: false });
  });
});
