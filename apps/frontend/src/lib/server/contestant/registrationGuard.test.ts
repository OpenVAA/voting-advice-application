/**
 * The guard of the registration addresses, driven directly with a fake request context.
 *
 * `$lib/api/dataProvider` is replaced, so no Supabase client is built: `createSupabaseAnonClient` answers a marker object and `createDataProvider` answers a provider whose `getAppSettings` each case controls. The list of offered modes is the real one.
 *
 * What this file holds:
 *
 * 1. **The decision** — whether registration is offered, for each of the two needs: any listed mode, and the code mode.
 * 2. **The refusal** — a 303 redirect to the login route in the request's locale, with no parameter, and nothing thrown where registration is offered.
 * 3. **Failing closed** — a settings read that rejects is logged and read as settings that offer nothing.
 * 4. **The read** — made through a data provider built on an anonymous client and the request's own fetch.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { isRegistrationOffered, refuseUnlessRegistrationOffered } from './registrationGuard';
import type { ContestantAppConfigInput } from '@openvaa/app-shared';
import type { RegistrationNeed } from './registrationGuard';

const { ANON_CLIENT, createDataProvider, createSupabaseAnonClient, getAppSettings } = vi.hoisted(() => ({
  ANON_CLIENT: { marker: 'anonymous client' },
  createDataProvider: vi.fn(),
  createSupabaseAnonClient: vi.fn(),
  getAppSettings: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider, createSupabaseAnonClient }));

/** What the guard touches of the request, and an address it must not read. */
type FakeEvent = {
  fetch: typeof fetch;
  locals: { currentLocale: string };
  url: URL;
};

const fakeFetch = vi.fn() as unknown as typeof fetch;

function makeEvent({ locale = 'en', search = '' }: { locale?: string; search?: string } = {}): FakeEvent {
  return {
    fetch: fakeFetch,
    locals: { currentLocale: locale },
    url: new URL(`http://localhost/${locale}/contestant/register${search}`)
  };
}

type Settings = NonNullable<ContestantAppConfigInput> & { access?: { answersLocked?: boolean } };

/** Settings as a data provider returns them: a stored partial. */
function settingsWith(
  contestantApp: NonNullable<ContestantAppConfigInput>['contestantApp'],
  { answersLocked }: { answersLocked?: boolean } = {}
): Settings {
  return answersLocked === undefined ? { contestantApp } : { contestantApp, access: { answersLocked } };
}

const EMPTY_MATRIX = settingsWith({
  entityTypes: ['candidate'],
  registrationModes: { candidate: [], organization: [] }
});
const CODE_ALONE = settingsWith({
  entityTypes: ['candidate'],
  registrationModes: { candidate: ['code'], organization: [] }
});
const EMAIL_ALONE = settingsWith({
  entityTypes: ['candidate'],
  registrationModes: { candidate: ['email'], organization: [] }
});
const PROVIDER_FOR_CANDIDATES = settingsWith({
  entityTypes: ['candidate'],
  registrationModes: { candidate: ['identity_provider'], organization: [] }
});
const PROVIDER_FOR_ORGANIZATIONS_ALONE = settingsWith({
  entityTypes: ['candidate', 'organization'],
  registrationModes: { candidate: [], organization: ['identity_provider'] }
});
const CODE_FOR_ORGANIZATIONS = settingsWith({
  entityTypes: ['organization'],
  registrationModes: { candidate: [], organization: ['code'] }
});
const CODE_FOR_AN_UNSERVED_TYPE = settingsWith({
  entityTypes: ['candidate'],
  registrationModes: { candidate: [], organization: ['code'] }
});
const EVERY_MODE_LOCKED = settingsWith(
  { entityTypes: ['candidate'], registrationModes: { candidate: ['identity_provider', 'email', 'code'] } },
  { answersLocked: true }
);
const EVERY_MODE_UNLOCKED = settingsWith(
  { entityTypes: ['candidate'], registrationModes: { candidate: ['identity_provider', 'email', 'code'] } },
  { answersLocked: false }
);

const LOGIN_ROUTE = buildRoute({ route: 'ContestantAppLogin', locale: 'en' });

/** The redirect the guard throws, or `undefined` when it resolves. */
async function redirectOf(
  event: FakeEvent,
  need: RegistrationNeed
): Promise<{ status: number; location: string } | undefined> {
  try {
    await refuseUnlessRegistrationOffered(event, need);
    return undefined;
  } catch (e) {
    return e as { status: number; location: string };
  }
}

beforeEach(() => {
  createSupabaseAnonClient.mockReturnValue(ANON_CLIENT);
  createDataProvider.mockReturnValue({ getAppSettings });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('the need for any listed mode', () => {
  it.each([
    ['an empty matrix', EMPTY_MATRIX],
    ['settings that declare nothing', {}],
    ['every mode allowed while answers are locked', EVERY_MODE_LOCKED],
    ["the provider's mode allowed for organizations alone", PROVIDER_FOR_ORGANIZATIONS_ALONE],
    ['a mode listed only in the row of an entity type the project does not serve', CODE_FOR_AN_UNSERVED_TYPE]
  ])('redirects with 303 to the login route for %s', async (_name, settings) => {
    getAppSettings.mockResolvedValue(settings);
    expect(await redirectOf(makeEvent(), 'any')).toMatchObject({ status: 303, location: LOGIN_ROUTE });
    expect(await isRegistrationOffered(makeEvent(), 'any')).toBe(false);
  });

  it.each([
    ['the code mode alone', CODE_ALONE],
    ['the email mode alone', EMAIL_ALONE],
    ["the provider's mode for candidates", PROVIDER_FOR_CANDIDATES],
    ['the code mode for organizations, the one served type', CODE_FOR_ORGANIZATIONS],
    ['every mode while answers are not locked', EVERY_MODE_UNLOCKED]
  ])('returns nothing and throws nothing for %s', async (_name, settings) => {
    getAppSettings.mockResolvedValue(settings);
    expect(await redirectOf(makeEvent(), 'any')).toBeUndefined();
    expect(await refuseUnlessRegistrationOffered(makeEvent(), 'any')).toBeUndefined();
    expect(await isRegistrationOffered(makeEvent(), 'any')).toBe(true);
  });
});

describe('the need for the code mode', () => {
  it.each([
    ['an empty matrix', EMPTY_MATRIX],
    ['settings that declare nothing', {}],
    ['the email mode alone', EMAIL_ALONE],
    ["the provider's mode for candidates", PROVIDER_FOR_CANDIDATES],
    ['every mode allowed while answers are locked', EVERY_MODE_LOCKED],
    ['the code mode listed only in the row of an entity type the project does not serve', CODE_FOR_AN_UNSERVED_TYPE]
  ])('redirects with 303 to the login route for %s', async (_name, settings) => {
    getAppSettings.mockResolvedValue(settings);
    expect(await redirectOf(makeEvent(), 'code')).toMatchObject({ status: 303, location: LOGIN_ROUTE });
    expect(await isRegistrationOffered(makeEvent(), 'code')).toBe(false);
  });

  it.each([
    ['the code mode alone', CODE_ALONE],
    ['the code mode for organizations, the one served type', CODE_FOR_ORGANIZATIONS],
    ['every mode while answers are not locked', EVERY_MODE_UNLOCKED]
  ])('returns nothing and throws nothing for %s', async (_name, settings) => {
    getAppSettings.mockResolvedValue(settings);
    expect(await redirectOf(makeEvent(), 'code')).toBeUndefined();
    expect(await isRegistrationOffered(makeEvent(), 'code')).toBe(true);
  });
});

describe('the redirect', () => {
  it.each(['en', 'fi'])("leads to the login route in the request's locale %s", async (locale) => {
    getAppSettings.mockResolvedValue(EMPTY_MATRIX);
    const redirected = await redirectOf(makeEvent({ locale }), 'any');
    expect(redirected?.status).toBe(303);
    expect(redirected?.location).toBe(buildRoute({ route: 'ContestantAppLogin', locale }));
  });

  it.each<RegistrationNeed>(['any', 'code'])(
    'carries no parameter, whatever the request carries, for the need %s',
    async (need) => {
      getAppSettings.mockResolvedValue(EMPTY_MATRIX);
      const redirected = await redirectOf(
        makeEvent({ search: '?redirectTo=https%3A%2F%2Fevil.example&next=%2Fadmin&registrationKey=abc' }),
        need
      );
      expect(redirected?.location).toBe(LOGIN_ROUTE);
      expect(redirected?.location).not.toContain('?');
    }
  );
});

describe('a settings read that fails', () => {
  it.each<RegistrationNeed>(['any', 'code'])(
    'is logged and read as settings that offer nothing, for the need %s',
    async (need) => {
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      const failure = new Error('getAppSettings: connection refused');
      getAppSettings.mockRejectedValue(failure);

      expect(await redirectOf(makeEvent(), need)).toMatchObject({ status: 303, location: LOGIN_ROUTE });
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][0]).toContain('connection refused');
      expect(error.mock.calls[0][1]).toEqual({ err: failure });
    }
  );

  it('answers the decision with false and does not reject', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    getAppSettings.mockRejectedValue(new Error('unreachable'));
    expect(await isRegistrationOffered(makeEvent(), 'any')).toBe(false);
    expect(await isRegistrationOffered(makeEvent(), 'code')).toBe(false);
  });
});

describe('the settings read', () => {
  it('goes through a data provider built on an anonymous client and the request fetch', async () => {
    getAppSettings.mockResolvedValue(CODE_ALONE);
    await refuseUnlessRegistrationOffered(makeEvent(), 'any');
    expect(createSupabaseAnonClient.mock.calls).toEqual([[{ fetch: fakeFetch }]]);
    expect(createDataProvider.mock.calls).toEqual([[{ fetch: fakeFetch, client: ANON_CLIENT }]]);
    expect(getAppSettings).toHaveBeenCalledTimes(1);
  });

  it('is made once for every call, so a changed setting is read at the next request', async () => {
    getAppSettings.mockResolvedValueOnce(CODE_ALONE).mockResolvedValueOnce(EMPTY_MATRIX);
    expect(await isRegistrationOffered(makeEvent(), 'code')).toBe(true);
    expect(await isRegistrationOffered(makeEvent(), 'code')).toBe(false);
    expect(getAppSettings).toHaveBeenCalledTimes(2);
  });
});
