/**
 * The server load of the Contestant App's protected layout, driven directly with a fake request context.
 *
 * The load runs four stages (session, user-level data and the settings, gates, the served entity list) and reads no entity: that is the entity-level load's, one level down. What this file holds:
 *
 * 1. **A gated user gets the gate, the user and the arrival marker, and nothing else.** The settings are read once, before the gates; the entity list is not read and nobody is signed out, so no outcome of a later stage can pre-empt the gate. The list read is set up to REJECT in that case, so reaching it would fail it. A user whose account has no password gets the set-password gate, before the terms of use. An identity-provider account with no address gets the identity-provider gate.
 * 1a. **The two facts of the request.** The arrival marker is read from its cookie, and only `created` and `existing` count; the answers lock is read from the settings, and a failed settings read leaves answers unlocked. The marker only adds the identity-provider gate.
 * 2. **A user past the gates gets the user and the served entities**: the list is read after the user-level data and filtered by the entity types the project serves. The result holds no entity data, no question data and no part of the session.
 * 3. **The coarse role decides nothing.** A user whose role is `'admin'`, or who has none, is listed with the one served entity they edit.
 * 4. **A failed read of the user-level data** signs the user out through the sign-out helper and redirects to the login page with `loginFailed`. So does user-level data that does not say, as a boolean, whether the account has a password: the gate list is never asked about such a user.
 * 4a. **A failed read of the list** signs nobody out: the load logs it and resolves the user with an empty list and `entitiesReadFailed: true`, whatever the cause. A request for an entity made while the list cannot be read is sent to the app root by the entity-level load, as one for an entity the list does not hold is.
 * 5. **No session** redirects to the login page before anything is read.
 * 6. **The entity the URL names decides nothing here.** The load resolves the same data with and without the entity params.
 *
 * `$lib/api/dataWriter` and `$lib/api/dataProvider` are replaced, so no Supabase client is built. The sign-out helper is the real one, running on the fake locals.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { load as entityLoad } from './[entityType=servedEntityType]/[entityId=uuid]/+layout.server';
import { load } from './+layout.server';
import type { BasicUserData, UserEntity } from '$lib/api/base/dataWriter.type';

const {
  createDataProvider,
  createDataWriter,
  getAppSettings,
  getBasicUserData,
  getEntityUserData,
  getQuestionData,
  getUserEntities
} = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  createDataWriter: vi.fn(),
  getAppSettings: vi.fn(),
  getBasicUserData: vi.fn(),
  getEntityUserData: vi.fn(),
  getQuestionData: vi.fn(),
  getUserEntities: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));

const LOGIN_ROUTE = buildRoute({ route: 'ContestantAppLogin', locale: 'en' });
const LOGIN_FAILED_ROUTE = buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: 'loginFailed' });

/** The generated event type names this route's own id and locals; the erased signature below is the surface the load touches. */
type FakeEvent = {
  cookies: { get: (name: string) => string | undefined };
  fetch: typeof fetch;
  locals: {
    safeGetSession: () => Promise<{ session: unknown; user: unknown }>;
    supabase: { auth: { signOut: (options: { scope: string }) => Promise<{ error: null }> } };
  };
  params: Record<string, string>;
};
type LoadFn = (event: FakeEvent) => Promise<unknown>;
const runLoad = load as unknown as LoadFn;

const fakeFetch = vi.fn() as unknown as typeof fetch;
const signOut = vi.fn();

/**
 * A request context exposing only what the load touches. Every call builds its own object.
 * @param signedIn - Whether the request carries a session.
 * @param params - The route params of the request. The default is those of the app root, which has none.
 * @param cookies - The cookies the request carries, by name. None by default.
 * @returns The fake event.
 */
function makeEvent({
  signedIn = true,
  params = {},
  cookies = {}
}: { signedIn?: boolean; params?: Record<string, string>; cookies?: Record<string, string> } = {}): FakeEvent {
  return {
    cookies: { get: (name: string) => cookies[name] },
    fetch: fakeFetch,
    locals: {
      safeGetSession: async () =>
        signedIn ? { session: { expires_at: 1893456000 }, user: { id: 'user-1' } } : { session: null, user: null },
      supabase: { auth: { signOut } }
    },
    params
  };
}

/**
 * User-level data with the given acceptance.
 * @param termsOfUseAccepted - The stored acceptance time, or `null` for none.
 * @param role - The user's coarse role.
 * @param passwordSet - Whether the account has a password. It has one by default.
 * @param addressState - The state of the account's address. Proved by default.
 * @returns The user.
 */
function userWith(
  termsOfUseAccepted: string | null,
  role: BasicUserData['role'] = 'contestant',
  passwordSet = true,
  addressState: BasicUserData['addressState'] = 'proved'
): BasicUserData {
  return {
    id: 'user-1',
    email: 'user@example.test',
    username: 'user@example.test',
    role,
    settings: {},
    termsOfUseAccepted,
    passwordSet,
    addressState,
    pendingEmail: null,
    ownOrganizationUnnamed: false,
    pendingEmailTaken: false
  };
}

/** A time in the form PostgREST returns for a `timestamptz`. */
const ACCEPTED_AT = '2026-10-06T00:54:12.277826+00:00';

/** The candidate and the organization a user may be listed with. */
const CANDIDATE: UserEntity = { type: 'candidate', id: 'candidate-1', firstName: 'A', lastName: 'B', confirmed: true };
const ORGANIZATION: UserEntity = { type: 'organization', id: 'organization-1', name: 'Org', confirmed: true };

/** Settings of a project that serves the given entity types. */
function settingsServing(entityTypes: Array<UserEntity['type']>) {
  return { contestantApp: { entityTypes } };
}

/** The redirect the load throws, or `undefined` when it resolves. */
async function redirectOf(event: FakeEvent): Promise<{ status: number; location: string } | undefined> {
  try {
    await runLoad(event);
    return undefined;
  } catch (e) {
    return e as { status: number; location: string };
  }
}

beforeEach(() => {
  createDataWriter.mockReturnValue({ getBasicUserData, getEntityUserData, getUserEntities });
  createDataProvider.mockReturnValue({ getAppSettings, getQuestionData });
  getAppSettings.mockResolvedValue(settingsServing(['candidate']));
  signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('routes/contestant/(protected)/+layout.server.ts — a user who must pass a gate', () => {
  it('returns the gate, the user-level data and the arrival marker only, reads the settings once, and reads neither the list nor an entity', async () => {
    const user = userWith(null);
    getBasicUserData.mockResolvedValue(user);
    // If the load read past the gate, the list read would sign the user out and reject the load.
    getUserEntities.mockRejectedValue(new Error("Failed to list the user's entities: no data"));

    const data = await runLoad(makeEvent());

    expect(data).toEqual({ gate: 'termsOfUse', user, arrival: null });
    expect(getBasicUserData).toHaveBeenCalledTimes(1);
    expect(getAppSettings).toHaveBeenCalledTimes(1);
    expect(getUserEntities).not.toHaveBeenCalled();
    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each([
    ['who has not accepted the terms of use either', null],
    ['who has accepted the terms of use', ACCEPTED_AT]
  ])(
    'returns the set-password gate for a user with no password %s, and reads neither the list nor an entity',
    async (_, termsOfUseAccepted) => {
      const user = userWith(termsOfUseAccepted, 'contestant', false);
      getBasicUserData.mockResolvedValue(user);
      // If the load read past the gate, the list read would sign the user out and reject the load.
      getUserEntities.mockRejectedValue(new Error("Failed to list the user's entities: no data"));

      const data = await runLoad(makeEvent());

      expect(data).toEqual({ gate: 'setPassword', user, arrival: null });
      expect(Object.keys(data as object).sort()).toEqual(['arrival', 'gate', 'user']);
      expect(getBasicUserData).toHaveBeenCalledTimes(1);
      expect(getUserEntities).not.toHaveBeenCalled();
      expect(getEntityUserData).not.toHaveBeenCalled();
      expect(getAppSettings).toHaveBeenCalledTimes(1);
      expect(signOut).not.toHaveBeenCalled();
    }
  );

  it('reads the user-level data with no argument', async () => {
    getBasicUserData.mockResolvedValue(userWith(null));

    await runLoad(makeEvent());

    expect(getBasicUserData.mock.calls).toEqual([[]]);
  });

  it('hands back the user it read, so the layout shows the gate on user-level data', async () => {
    const user = userWith(null);
    getBasicUserData.mockResolvedValue(user);

    const data = (await runLoad(makeEvent())) as { user: BasicUserData };

    expect(data.user).toBe(user);
    expect(Object.keys(data).sort()).toEqual(['arrival', 'gate', 'user']);
  });
});

describe('routes/contestant/(protected)/+layout.server.ts — a user past the gates', () => {
  it('returns no gate, the user and the served entities, and nothing of an entity, its questions or the session', async () => {
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([CANDIDATE]);

    const data = await runLoad(makeEvent());

    expect(data).toEqual({
      gate: null,
      user,
      entities: [CANDIDATE]
    });
    expect(Object.keys(data as object).sort()).toEqual(['entities', 'gate', 'user']);
    expect(getUserEntities).toHaveBeenCalledTimes(1);
    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('reads the settings once, and both the user-level data and the settings before the list', async () => {
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([CANDIDATE]);

    await runLoad(makeEvent());

    expect(getAppSettings).toHaveBeenCalledTimes(1);
    expect(getBasicUserData.mock.invocationCallOrder[0]).toBeLessThan(getAppSettings.mock.invocationCallOrder[0]);
    expect(getAppSettings.mock.invocationCallOrder[0]).toBeLessThan(getUserEntities.mock.invocationCallOrder[0]);
  });

  it('reads the user-level data before the list', async () => {
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([CANDIDATE]);

    await runLoad(makeEvent());

    expect(getBasicUserData.mock.invocationCallOrder[0]).toBeLessThan(getUserEntities.mock.invocationCallOrder[0]);
  });
});

describe('routes/contestant/(protected)/+layout.server.ts — the arrival marker and the answers lock', () => {
  const ARRIVAL = 'identity_provider_arrival';

  it('returns the identity-provider gate for an account with no address, and no marker', async () => {
    const user = userWith(null, 'contestant', false, 'none');
    getBasicUserData.mockResolvedValue(user);

    const data = await runLoad(makeEvent());

    expect(data).toEqual({ gate: 'identityProvider', user, arrival: null });
    expect(getUserEntities).not.toHaveBeenCalled();
  });

  it.each(['created', 'existing'])('returns the marker %s with the gate it read it for', async (value) => {
    const user = userWith(null, 'contestant', false, 'none');
    getBasicUserData.mockResolvedValue(user);

    const data = await runLoad(makeEvent({ cookies: { [ARRIVAL]: value } }));

    expect(data).toEqual({ gate: 'identityProvider', user, arrival: value });
  });

  it('reads any other value of the marker cookie as no marker', async () => {
    const user = userWith(null, 'contestant', false, 'none');
    getBasicUserData.mockResolvedValue(user);

    for (const value of ['', 'EXISTING', 'found', 'true']) {
      expect(await runLoad(makeEvent({ cookies: { [ARRIVAL]: value } })), `marker ${JSON.stringify(value)}`).toEqual({
        gate: 'identityProvider',
        user,
        arrival: null
      });
    }
  });

  it('adds the identity-provider gate once the provider found an account with an address, and not otherwise', async () => {
    const user = userWith(ACCEPTED_AT, 'contestant', true, 'pending');
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([CANDIDATE]);

    expect(await runLoad(makeEvent({ cookies: { [ARRIVAL]: 'existing' } }))).toEqual({
      gate: 'identityProvider',
      user,
      arrival: 'existing'
    });
    expect(await runLoad(makeEvent({ cookies: { [ARRIVAL]: 'created' } }))).toEqual({
      gate: null,
      user,
      entities: [CANDIDATE]
    });
  });

  it('never removes a gate for a marker: an account with no address gets the gate with every marker and with none', async () => {
    const user = userWith(ACCEPTED_AT, 'contestant', true, 'none');
    getBasicUserData.mockResolvedValue(user);

    const markers: Array<Record<string, string>> = [
      {},
      { [ARRIVAL]: 'created' },
      { [ARRIVAL]: 'existing' },
      { [ARRIVAL]: 'other' }
    ];
    for (const cookies of markers) {
      expect(((await runLoad(makeEvent({ cookies }))) as { gate: unknown }).gate).toBe('identityProvider');
    }
  });

  it('asks for the name of an unnamed own party while answers are not locked, and not while they are', async () => {
    const user = { ...userWith(ACCEPTED_AT, 'contestant', true, 'proved'), ownOrganizationUnnamed: true };
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([ORGANIZATION]);
    getAppSettings.mockResolvedValue({
      ...settingsServing(['candidate', 'organization']),
      access: { answersLocked: false }
    });

    expect(((await runLoad(makeEvent())) as { gate: unknown }).gate).toBe('identityProvider');

    getAppSettings.mockResolvedValue({
      ...settingsServing(['candidate', 'organization']),
      access: { answersLocked: true }
    });

    expect(await runLoad(makeEvent())).toEqual({ gate: null, user, entities: [ORGANIZATION] });
  });

  it('reads a failed settings read as answers not locked, logs it once and still decides the gates', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const user = { ...userWith(ACCEPTED_AT, 'contestant', true, 'proved'), ownOrganizationUnnamed: true };
    getBasicUserData.mockResolvedValue(user);
    getAppSettings.mockRejectedValue(new Error('settings unavailable'));

    const data = await runLoad(makeEvent());

    expect(data).toEqual({ gate: 'identityProvider', user, arrival: null });
    expect(error).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/+layout.server.ts — the entity the URL names', () => {
  it.each([
    ['an ungated user', ACCEPTED_AT],
    ['a gated user', null]
  ])('resolves the same data with and without the entity params for %s', async (_, termsOfUseAccepted) => {
    const user = userWith(termsOfUseAccepted);
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([CANDIDATE, ORGANIZATION]);
    getAppSettings.mockResolvedValue(settingsServing(['candidate', 'organization']));

    const atTheRoot = await runLoad(makeEvent());
    const onTheCandidate = await runLoad(makeEvent({ params: { entityType: CANDIDATE.type, entityId: CANDIDATE.id } }));
    const onAnEntityNotListed = await runLoad(
      makeEvent({ params: { entityType: 'organization', entityId: 'organization-2', questionId: 'q-1' } })
    );

    expect(onTheCandidate).toEqual(atTheRoot);
    expect(onAnEntityNotListed).toEqual(atTheRoot);
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/+layout.server.ts — the coarse role decides nothing', () => {
  // `'admin'` is an administrator who also edits an entity; `null` is a token issued before the grant was written.
  it.each([['admin'], [null]] as const)(
    'lists the one served entity a user whose role is %s edits, and signs nobody out',
    async (role) => {
      const user = userWith(ACCEPTED_AT, role);
      getBasicUserData.mockResolvedValue(user);
      getUserEntities.mockResolvedValue([CANDIDATE]);

      const data = await runLoad(makeEvent());

      expect(data).toEqual({
        gate: null,
        user,
        entities: [CANDIDATE]
      });
      expect(signOut).not.toHaveBeenCalled();
    }
  );
});

describe('routes/contestant/(protected)/+layout.server.ts — the entity types the project serves', () => {
  it('drops an organization when the project serves candidates only', async () => {
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getAppSettings.mockResolvedValue(settingsServing(['candidate']));
    getUserEntities.mockResolvedValue([ORGANIZATION, CANDIDATE]);

    const data = (await runLoad(makeEvent())) as { entities: Array<UserEntity> };

    expect(data.entities).toEqual([CANDIDATE]);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('keeps an organization when the project serves both types', async () => {
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getAppSettings.mockResolvedValue(settingsServing(['candidate', 'organization']));
    getUserEntities.mockResolvedValue([ORGANIZATION]);

    const data = await runLoad(makeEvent());

    expect(data).toEqual({
      gate: null,
      user,
      entities: [ORGANIZATION]
    });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('reads a failed settings read as the shipped default of served types, and logs it', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getAppSettings.mockRejectedValue(new Error('settings unavailable'));
    getUserEntities.mockResolvedValue([ORGANIZATION, CANDIDATE]);

    const data = (await runLoad(makeEvent())) as { entities: Array<UserEntity> };

    expect(data.entities).toEqual([CANDIDATE]);
    expect(error).toHaveBeenCalledTimes(1);
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/+layout.server.ts — the entity list cannot be read', () => {
  it.each([
    ['a schema mismatch', new Error("The list of the user's entities did not match its schema at: entities")],
    ['a network error', new TypeError('fetch failed')],
    ['a server error', new Error("Failed to list the user's entities: 500")]
  ] as const)(
    'answers %s with the user, an empty list and the read failure, logs it, and signs nobody out',
    async (_, failure) => {
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      getBasicUserData.mockResolvedValue(userWith(ACCEPTED_AT));
      getUserEntities.mockRejectedValue(failure);

      const loading = runLoad(makeEvent());

      await expect(loading).resolves.toEqual({
        gate: null,
        user: userWith(ACCEPTED_AT),
        entities: [],
        entitiesReadFailed: true
      });
      expect(signOut).not.toHaveBeenCalled();
      expect(getEntityUserData).not.toHaveBeenCalled();
      expect(getQuestionData).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][1]).toEqual({ err: failure });
    }
  );

  it('sends a request for an entity to the app root, where the read failure is shown, and reads no entity', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    getBasicUserData.mockResolvedValue(userWith(ACCEPTED_AT));
    getUserEntities.mockRejectedValue(new TypeError('fetch failed'));
    const params = { entityType: CANDIDATE.type, entityId: CANDIDATE.id };
    const event = makeEvent({ params });

    const listing = runLoad(event);
    await expect(listing).resolves.toMatchObject({ gate: null, entities: [], entitiesReadFailed: true });
    const parent = await listing;
    const redirected = await (entityLoad as unknown as (event: unknown) => Promise<unknown>)({
      fetch: fakeFetch,
      locals: event.locals,
      params,
      parent: async () => parent
    }).then(
      () => undefined,
      (e: { status: number; location: string }) => e
    );

    expect(redirected).toMatchObject({
      status: 307,
      location: buildRoute({ route: 'ContestantAppHome', locale: 'en' })
    });
    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('routes/contestant/(protected)/+layout.server.ts — the user-level data cannot be read', () => {
  it('signs the user out and redirects to the login page with loginFailed', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const failure = new Error('No active session');
    getBasicUserData.mockRejectedValue(failure);

    const redirected = await redirectOf(makeEvent());

    expect(redirected).toMatchObject({ status: 307, location: LOGIN_FAILED_ROUTE });
    expect(LOGIN_FAILED_ROUTE).toContain('loginFailed');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(getUserEntities).not.toHaveBeenCalled();
    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][1]).toEqual({ err: failure });
  });
});

describe('routes/contestant/(protected)/+layout.server.ts — user-level data that does not say whether the account has a password', () => {
  it.each([
    ['holds no such member', undefined],
    ['holds null for it', null],
    ['holds a text for it', 'true']
  ])(
    'signs the user out with loginFailed when the user object %s, and asks no gate and reads no list',
    async (_, value) => {
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      const user = { ...userWith(ACCEPTED_AT), passwordSet: value } as unknown as BasicUserData;
      if (value === undefined) delete (user as Partial<BasicUserData>).passwordSet;
      getBasicUserData.mockResolvedValue(user);
      getUserEntities.mockResolvedValue([CANDIDATE]);

      const redirected = await redirectOf(makeEvent());

      expect(redirected).toMatchObject({ status: 307, location: LOGIN_FAILED_ROUTE });
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(getUserEntities).not.toHaveBeenCalled();
      expect(getEntityUserData).not.toHaveBeenCalled();
      expect(createDataProvider).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);
    }
  );

  it('signs the same user out when they have not accepted the terms either, instead of showing the terms', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const user = userWith(null);
    delete (user as Partial<BasicUserData>).passwordSet;
    getBasicUserData.mockResolvedValue(user);

    const redirected = await redirectOf(makeEvent());

    expect(redirected).toMatchObject({ status: 307, location: LOGIN_FAILED_ROUTE });
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});

describe('routes/contestant/(protected)/+layout.server.ts — no session', () => {
  it('redirects to the login page and reads nothing', async () => {
    const redirected = await redirectOf(makeEvent({ signedIn: false }));

    expect(redirected).toMatchObject({ status: 307, location: LOGIN_ROUTE });
    expect(LOGIN_ROUTE).not.toContain('errorMessage');
    expect(getBasicUserData).not.toHaveBeenCalled();
    expect(getUserEntities).not.toHaveBeenCalled();
    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});
