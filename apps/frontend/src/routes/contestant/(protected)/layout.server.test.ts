/**
 * The server load of the Contestant App's protected layout, driven directly with a fake request context.
 *
 * The load runs four stages (session, user-level data, gates, the served entity list) and reads no entity: that is the entity-level load's, one level down. What this file holds:
 *
 * 1. **A gated user gets the gate and nothing else.** Neither the entity list nor the settings is read and nobody is signed out, so no outcome of a later stage can pre-empt the gate. The list read is set up to REJECT in that case, so reaching it would fail it. A user whose account has no password gets the set-password gate, before the terms of use.
 * 2. **A user past the gates gets the user and the served entities**: the list is read after the user-level data and filtered by the entity types the project serves. The result holds no entity data, no question data and no part of the session.
 * 3. **The coarse role decides nothing.** A user whose role is `'admin'`, or who has none, is listed with the one served entity they edit.
 * 4. **A failed read of the user-level data or of the list** signs the user out through the sign-out helper and redirects to the login page with `loginFailed`. So does user-level data that does not say, as a boolean, whether the account has a password: the gate list is never asked about such a user.
 * 5. **No session** redirects to the login page before anything is read.
 * 6. **The entity the URL names decides nothing here.** The load resolves the same data with and without the entity params.
 *
 * `$lib/api/dataWriter` and `$lib/api/dataProvider` are replaced, so no Supabase client is built. The sign-out helper is the real one, running on the fake locals.
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
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
 * @returns The fake event.
 */
function makeEvent({
  signedIn = true,
  params = {}
}: { signedIn?: boolean; params?: Record<string, string> } = {}): FakeEvent {
  return {
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
 * @returns The user.
 */
function userWith(
  termsOfUseAccepted: string | null,
  role: BasicUserData['role'] = 'contestant',
  passwordSet = true
): BasicUserData {
  return {
    id: 'user-1',
    email: 'user@example.test',
    username: 'user@example.test',
    role,
    settings: {},
    termsOfUseAccepted,
    passwordSet
  } as BasicUserData;
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
  it('returns the gate and the user-level data only, and reads neither the list nor an entity', async () => {
    const user = userWith(null);
    getBasicUserData.mockResolvedValue(user);
    // If the load read past the gate, the list read would sign the user out and reject the load.
    getUserEntities.mockRejectedValue(new Error("Failed to list the user's entities: no data"));

    const data = await runLoad(makeEvent());

    expect(data).toEqual({ gate: 'termsOfUse', user });
    expect(getBasicUserData).toHaveBeenCalledTimes(1);
    expect(getUserEntities).not.toHaveBeenCalled();
    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(getAppSettings).not.toHaveBeenCalled();
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(createDataProvider).not.toHaveBeenCalled();
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

      expect(data).toEqual({ gate: 'setPassword', user });
      expect(Object.keys(data as object).sort()).toEqual(['gate', 'user']);
      expect(getBasicUserData).toHaveBeenCalledTimes(1);
      expect(getUserEntities).not.toHaveBeenCalled();
      expect(getEntityUserData).not.toHaveBeenCalled();
      expect(getAppSettings).not.toHaveBeenCalled();
      expect(createDataProvider).not.toHaveBeenCalled();
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
    expect(Object.keys(data).sort()).toEqual(['gate', 'user']);
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

  it('reads the user-level data before the list', async () => {
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([CANDIDATE]);

    await runLoad(makeEvent());

    expect(getBasicUserData.mock.invocationCallOrder[0]).toBeLessThan(getUserEntities.mock.invocationCallOrder[0]);
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
  it('signs the user out with loginFailed, and reads no entity', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const failure = new Error("The list of the user's entities did not match its schema at: entities");
    getBasicUserData.mockResolvedValue(userWith(ACCEPTED_AT));
    getUserEntities.mockRejectedValue(failure);

    const redirected = await redirectOf(makeEvent());

    expect(redirected).toMatchObject({ status: 307, location: LOGIN_FAILED_ROUTE });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(getEntityUserData).not.toHaveBeenCalled();
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(error.mock.calls[0][1]).toEqual({ err: failure });
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
