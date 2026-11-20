/**
 * The server load of the Contestant App's protected layout, driven directly with a fake request context.
 *
 * The load runs four stages (session, user-level data and the settings, gates, the served entity list) and reads no entity: that is the entity-level load's, one level down. What this file holds:
 *
 * 0. **A session whose grants in this project open the Admin App and not this one** is redirected to the Admin App's home before anything is read, so such a user meets none of this app's gates. A project, account or global admin is; an admin who also edits a candidate or an organization, the editor of an entity alone and a project editor are not. The grants are the writer's read of those that reach this project, asked only of a session whose token holds an admin grant: an admin of another project only stays, an admin here who edits a candidate of another project only is redirected, and a read that fails is logged and redirects nobody.
 * 1. **A gated user gets the gate, the user and the arrival marker, and nothing else.** The settings are read once, before the gates; the entity list is not read and nobody is signed out, so no outcome of a later stage can pre-empt the gate. The list read is set up to REJECT in that case, so reaching it would fail it. A user whose account has no password gets the set-password gate, before the terms of use. An identity-provider account with no address gets the identity-provider gate.
 * 1a. **The two facts of the request.** The arrival marker is read from its cookie, and only `created` and `existing` count; the answers lock is read from the settings, and a failed settings read leaves answers unlocked. The marker only adds the identity-provider gate.
 * 2. **A user past the gates gets the user and the served entities**: the list is read after the user-level data and filtered by the entity types the project serves. The result holds no entity data, no question data and no part of the session.
 * 3. **The coarse role decides nothing.** A user whose role is `'admin'`, or who has none, is listed with the one served entity they edit.
 * 4. **A failed read of the user-level data** signs the user out through the sign-out helper and redirects to the login page with `loginFailed`. So does user-level data that does not say, as a boolean, whether the account has a password: the gate list is never asked about such a user.
 * 4a. **A failed read of the list** signs nobody out: the load logs it and resolves the user with an empty list and `entitiesReadFailed: true`, whatever the cause. A request for an entity made while the list cannot be read is sent to the app root by the entity-level load, as one for an entity the list does not hold is.
 * 4b. **The logout count a request carries** is withdrawn in the response only after a sign-out that worked, and kept when the sign-out fails with a session left and the load ends on the error page.
 * 5. **No session** redirects to the login page before anything is read.
 * 6. **The entity the URL names decides nothing here.** The load resolves the same data with and without the entity params.
 *
 * `$lib/api/dataWriter` and `$lib/api/dataProvider` are replaced, so no Supabase client is built. The sign-out helper and the withdrawal of the logout count are the real ones, running on the fake event.
 */

import { log } from '@openvaa/app-shared';
import { isHttpError } from '@sveltejs/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import { load as entityLoad } from './[entityType=servedEntityType]/[entityId=uuid]/+layout.server';
import { load } from './+layout.server';
import type { BasicUserData, UserEntity } from '$lib/api/base/dataWriter.type';
import type { GrantClaim, GrantShape } from '$lib/auth';
import type { AddressStateName } from '$lib/contestant/utils/identityProviderAccount';

const {
  createDataProvider,
  createDataWriter,
  getAppSettings,
  getBasicUserData,
  getEntityUserData,
  getProjectGrants,
  getQuestionData,
  getUserEntities
} = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  createDataWriter: vi.fn(),
  getAppSettings: vi.fn(),
  getBasicUserData: vi.fn(),
  getEntityUserData: vi.fn(),
  getProjectGrants: vi.fn(),
  getQuestionData: vi.fn(),
  getUserEntities: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));

const LOGIN_ROUTE = buildRoute({ route: 'ContestantAppLogin', locale: 'en' });
const LOGIN_FAILED_ROUTE = buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: 'loginFailed' });
const ADMIN_HOME_ROUTE = buildRoute({ route: 'AdminAppHome', locale: 'en' });

const PROJECT_ADMIN: GrantShape = { scope: 'project', role: 'admin' };
const ACCOUNT_ADMIN: GrantShape = { scope: 'account', role: 'admin' };
const GLOBAL_ADMIN: GrantShape = { scope: 'global', role: 'admin' };
const PROJECT_EDITOR: GrantShape = { scope: 'project', role: 'editor' };
const CANDIDATE_EDITOR: GrantShape = { scope: 'entity', role: 'editor', target_type: 'candidate' };
const ORGANIZATION_EDITOR: GrantShape = { scope: 'entity', role: 'editor', target_type: 'organization' };

/**
 * A well-formed access token carrying the given grant shapes. Its signature is meaningless: the load reads the grants of a session `safeGetSession` has already verified.
 * @param shapes - The grant shapes the token claims.
 * @returns The token.
 */
function accessTokenFor(shapes: ReadonlyArray<GrantShape>): string {
  return `header.${btoa(JSON.stringify({ grants: claimsFor(shapes) }))}.signature`;
}

/**
 * The grant claims of the given shapes, as the token and the read of the project's grants both state them.
 * @param shapes - The grant shapes.
 * @returns The claims.
 */
function claimsFor(shapes: ReadonlyArray<GrantShape>): Array<GrantClaim> {
  return shapes.map((shape) => ({
    scope: shape.scope,
    target_type: shape.scope === 'entity' ? (shape.target_type ?? 'candidate') : null,
    target_id: 'target-1',
    role: shape.role
  }));
}

/** The generated event type names this route's own id and locals; the erased signature below is the surface the load touches. */
type FakeEvent = {
  cookies: {
    get: (name: string) => string | undefined;
    delete: (name: string, options: Record<string, unknown>) => void;
  };
  fetch: typeof fetch;
  locals: {
    safeGetSession: () => Promise<{ session: unknown; user: unknown }>;
    supabase: {
      auth: {
        getSession: () => Promise<{ data: { session: unknown }; error: Error | null }>;
        signOut: (options: { scope: string }) => Promise<{ error: Error | null }>;
      };
    };
  };
  params: Record<string, string>;
  request: Request;
  url: URL;
};
type LoadFn = (event: FakeEvent) => Promise<unknown>;
const runLoad = load as unknown as LoadFn;

const fakeFetch = vi.fn() as unknown as typeof fetch;
const signOut = vi.fn();
const getSession = vi.fn();
const deleteCookie = vi.fn();

/**
 * A request context exposing only what the load touches. Every call builds its own object.
 * @param signedIn - Whether the request carries a session.
 * @param params - The route params of the request. The default is those of the app root, which has none.
 * @param cookies - The cookies the request carries, by name, read through `cookies.get` and sent in the request's `Cookie` header. None by default.
 * @param grants - The grant shapes the session's access token claims. A candidate's editor by default.
 * @param projectGrants - The grant shapes the writer's read of the grants that reach this project answers. The token's by default.
 * @returns The fake event.
 */
function makeEvent({
  signedIn = true,
  params = {},
  cookies = {},
  grants = [CANDIDATE_EDITOR],
  projectGrants = grants
}: {
  signedIn?: boolean;
  params?: Record<string, string>;
  cookies?: Record<string, string>;
  grants?: ReadonlyArray<GrantShape>;
  projectGrants?: ReadonlyArray<GrantShape>;
} = {}): FakeEvent {
  getProjectGrants.mockResolvedValue(claimsFor(projectGrants));
  return {
    cookies: { get: (name: string) => cookies[name], delete: deleteCookie },
    fetch: fakeFetch,
    locals: {
      safeGetSession: async () =>
        signedIn
          ? { session: { access_token: accessTokenFor(grants), expires_at: 1893456000 }, user: { id: 'user-1' } }
          : { session: null, user: null },
      supabase: { auth: { getSession, signOut } }
    },
    params,
    request: new Request('http://localhost/contestant', { headers: cookieHeader(cookies) }),
    url: new URL('http://localhost/contestant')
  };
}

/**
 * The `Cookie` header of a request that carries the given cookies.
 * @param cookies - The cookies, by name.
 * @returns The header, or no header for no cookies.
 */
function cookieHeader(cookies: Record<string, string>): Record<string, string> {
  const pairs = Object.entries(cookies).map(([name, value]) => `${name}=${value}`);
  return pairs.length === 0 ? {} : { cookie: pairs.join('; ') };
}

/** An id of a count's opening, as the page writes it. */
const COUNT_ID = '0123456789abcdef0123456789abcdef';

/** The cookies of a request that carries one running logout count. */
const COUNT_COOKIES = { [COOKIE.logoutPending]: COUNT_ID, [COOKIE.logoutDeadline]: COUNT_ID };

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
  addressState: AddressStateName = 'proved'
): BasicUserData {
  return {
    id: 'user-1',
    email: 'user@example.test',
    username: 'user@example.test',
    role,
    settings: {},
    termsOfUseAccepted,
    passwordSet,
    address:
      addressState === 'pending'
        ? { state: 'pending', email: 'pending@example.test' }
        : addressState === 'none'
          ? { state: 'none', pendingTaken: false }
          : { state: 'proved' },
    ownOrganizationUnnamed: false
  };
}

/** A time in the form PostgREST returns for a `timestamptz`. */
const ACCEPTED_AT = '2026-10-06T00:54:12.277826+00:00';

/** The candidate and the organization a user may be listed with. */
const CANDIDATE: UserEntity = { type: 'candidate', id: 'candidate-1', firstName: 'A', lastName: 'B', confirmed: true };
const ORGANIZATION: UserEntity = { type: 'organization', id: 'organization-1', name: 'Org', confirmed: true };

/** Settings of a project that serves the given entity types. */
function settingsServing(entityTypes: Array<UserEntity['type']>) {
  return {
    contestantApp: {
      servedEntityTypes: Object.fromEntries(entityTypes.map((entityType) => [entityType, { registrationModes: [] }]))
    }
  };
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
  createDataWriter.mockReturnValue({ getBasicUserData, getEntityUserData, getProjectGrants, getUserEntities });
  createDataProvider.mockReturnValue({ getAppSettings, getQuestionData });
  getAppSettings.mockResolvedValue(settingsServing(['candidate']));
  signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('routes/contestant/(protected)/+layout.server.ts — a session whose grants open the Admin App and not this one', () => {
  it.each([
    ['a project admin', [PROJECT_ADMIN]],
    ['an account admin', [ACCOUNT_ADMIN]],
    ['a global admin', [GLOBAL_ADMIN]],
    ['a project admin who is also a project editor', [PROJECT_ADMIN, PROJECT_EDITOR]]
  ])(
    "redirects %s to the Admin App's home before the user-level data, the settings or the list is read",
    async (_, grants) => {
      const redirected = await redirectOf(makeEvent({ grants }));

      expect(redirected).toMatchObject({ status: 303, location: ADMIN_HOME_ROUTE });
      expect(getBasicUserData).not.toHaveBeenCalled();
      expect(getAppSettings).not.toHaveBeenCalled();
      expect(getUserEntities).not.toHaveBeenCalled();
      expect(signOut).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['an admin who also edits a candidate', [PROJECT_ADMIN, CANDIDATE_EDITOR]],
    ['an admin who also edits an organization', [ACCOUNT_ADMIN, ORGANIZATION_EDITOR]],
    ["a candidate's editor", [CANDIDATE_EDITOR]],
    ['a project editor', [PROJECT_EDITOR]]
  ])('does not redirect %s, and reads the user-level data as for any user', async (_, grants) => {
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([CANDIDATE]);

    const data = await runLoad(makeEvent({ grants }));

    expect(data).toEqual({ gate: null, user, entities: [CANDIDATE] });
    expect(getBasicUserData).toHaveBeenCalledTimes(1);
  });

  it('asks nothing of the grants that reach this project for a session whose token holds no admin grant', async () => {
    getBasicUserData.mockResolvedValue(userWith(ACCEPTED_AT));
    getUserEntities.mockResolvedValue([CANDIDATE]);

    await runLoad(makeEvent({ grants: [CANDIDATE_EDITOR] }));

    expect(getProjectGrants).not.toHaveBeenCalled();
  });

  it('does not redirect an admin of another project only, and reads the user-level data as for any user', async () => {
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([]);

    const data = await runLoad(makeEvent({ grants: [PROJECT_ADMIN], projectGrants: [] }));

    expect(data).toEqual({ gate: null, user, entities: [] });
    expect(getProjectGrants).toHaveBeenCalledTimes(1);
  });

  it("redirects an admin of this project who edits a candidate of another project only to the Admin App's home", async () => {
    const redirected = await redirectOf(
      makeEvent({ grants: [PROJECT_ADMIN, CANDIDATE_EDITOR], projectGrants: [PROJECT_ADMIN] })
    );

    expect(redirected).toMatchObject({ status: 303, location: ADMIN_HOME_ROUTE });
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it('logs a failed read of the grants that reach this project and redirects nobody', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const user = userWith(ACCEPTED_AT);
    getBasicUserData.mockResolvedValue(user);
    getUserEntities.mockResolvedValue([]);
    const event = makeEvent({ grants: [PROJECT_ADMIN] });
    getProjectGrants.mockRejectedValue(new Error('The read failed.'));

    const data = await runLoad(event);

    expect(data).toEqual({ gate: null, user, entities: [] });
    expect(error).toHaveBeenCalledTimes(1);
  });
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

describe('routes/contestant/(protected)/+layout.server.ts — the logout count a request carries', () => {
  /** The names of the count's cookies the response removed. */
  function removedNames(): Array<string> {
    return deleteCookie.mock.calls.map(([name]) => name as string);
  }

  it('withdraws both cookies of the count only after a sign-out that worked, and redirects to the login page with loginFailed', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    getBasicUserData.mockRejectedValue(new Error('No active session'));

    const redirected = await redirectOf(makeEvent({ cookies: COUNT_COOKIES }));

    expect(redirected).toMatchObject({ status: 307, location: LOGIN_FAILED_ROUTE });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(removedNames()).toContain(COOKIE.logoutPending);
    expect(removedNames()).toContain(COOKIE.logoutDeadline);
    const signedOutAt = signOut.mock.invocationCallOrder[0];
    for (const removedAt of deleteCookie.mock.invocationCallOrder) expect(removedAt).toBeGreaterThan(signedOutAt);
  });

  it('keeps both cookies of the count when the sign-out fails with a session left, and ends on the error page', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    getBasicUserData.mockRejectedValue(new Error('No active session'));
    signOut.mockResolvedValue({ error: new Error('network down') });
    getSession.mockResolvedValue({ data: { session: { expires_at: 1893456000 } }, error: null });

    const failed = await redirectOf(makeEvent({ cookies: COUNT_COOKIES }));

    expect(isHttpError(failed, 503)).toBe(true);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(removedNames()).not.toContain(COOKIE.logoutPending);
    expect(removedNames()).not.toContain(COOKIE.logoutDeadline);
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
