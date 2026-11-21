/**
 * The server load of the Admin App's protected group, driven directly with a fake request context.
 *
 * The load decides in four steps: the session, the admission, the user-level data, the gate. What this file holds:
 *
 * 1. **No session** redirects to the login page with `loginFailed`, and nothing is read.
 * 2. **Admission is a match of the grants that reach this project against the Admin App's grant shapes.** A session whose token holds neither an admin nor a contestant grant is answered `{ admitted: false }` with no read and no gate, and the project's grants are not asked for. One whose token holds an admin grant is admitted only when the writer's read of the grants that reach this project holds one: an admin of another project only is answered `{ admitted: false }`, and an admin grant beside an editor grant is admitted, and so is a project editor of this project. A read of those grants that fails is answered as a failed read of the user-level data is (5).
 * 3. **A refused user at home in the Contestant App alone** is answered `{ admitted: false, home: 'contestant' }`, with no user-level data read: a candidate editor here, and an admin of another project whose only grant here is a candidate editor grant. A contestant token whose grants here open neither app, and one whose read of those grants fails, which is logged, are answered `{ admitted: false }`.
 * 4. **The gate.** An admitted user whose account has no password, on a proved address, gets the set-password gate; one with a password gets none. Either way the answer holds the user-level data and no part of the session.
 * 5. **A failed read signs nobody out.** A read that answers nothing, or user-level data that does not say as a boolean whether the account has a password, asks the request's client whether a session is left: none redirects to the login page with `loginFailed`; one left ends on a 503 in the reader's language.
 * 6. **The load reads no `url`, `route` or `params`.** The event's getters for them throw in every case.
 *
 * `$lib/api/dataWriter` is replaced, so no Supabase client is built; the session check is the writer's. The grant reading is the real one, running on the fake event's session.
 */

import { log } from '@openvaa/app-shared';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { load } from './+layout.server';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';
import type { GrantClaim, GrantShape } from '$lib/auth';

const { createDataWriter, getBasicUserData, getProjectGrants, isSessionGone } = vi.hoisted(() => ({
  createDataWriter: vi.fn(),
  getBasicUserData: vi.fn(),
  getProjectGrants: vi.fn(),
  isSessionGone: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));

const LOGIN_FAILED_ROUTE = buildRoute({ route: 'AdminAppLogin', locale: 'en', errorMessage: 'loginFailed' });

const ADMIN_GRANT: GrantShape = { scope: 'project', role: 'admin' };
const CANDIDATE_EDITOR_GRANT: GrantShape = { scope: 'entity', role: 'editor', target_type: 'candidate' };
const PROJECT_EDITOR_GRANT: GrantShape = { scope: 'project', role: 'editor' };

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
    target_id: 'proj-1',
    role: shape.role
  }));
}

/** The generated event type names this route's own id and locals; the erased signature below is the surface the load may touch. */
type FakeEvent = {
  fetch: typeof fetch;
  locals: {
    safeGetSession: () => Promise<{ session: unknown; user: unknown }>;
  };
};
const runLoad = load as unknown as (event: FakeEvent) => Promise<unknown>;

/**
 * A request context exposing only what the load may touch, whose `url`, `route` and `params` throw when read. The writer's read of the grants that reach this project answers `projectGrants`.
 * @param grants - The grant shapes of the session's token, or `null` for a request with no session.
 * @param projectGrants - The grant shapes that reach this project. The token's by default.
 * @returns The fake event.
 */
function makeEvent(
  grants: ReadonlyArray<GrantShape> | null,
  projectGrants: ReadonlyArray<GrantShape> = grants ?? []
): FakeEvent {
  getProjectGrants.mockResolvedValue(claimsFor(projectGrants));
  const event: FakeEvent = {
    fetch: vi.fn() as unknown as typeof fetch,
    locals: {
      safeGetSession: async () =>
        grants === null
          ? { session: null, user: null }
          : { session: { access_token: accessTokenFor(grants), expires_at: 1893456000 }, user: { id: 'admin-1' } }
    }
  };
  for (const name of ['url', 'route', 'params']) {
    Object.defineProperty(event, name, {
      get: () => {
        throw new Error(`The load read event.${name}`);
      }
    });
  }
  return event;
}

/**
 * User-level data of an admin.
 * @param passwordSet - Whether the account has a password.
 * @returns The user.
 */
function adminWith(passwordSet: boolean): BasicUserData {
  return {
    id: 'admin-1',
    email: 'admin@example.test',
    username: 'admin@example.test',
    role: 'admin',
    settings: {},
    termsOfUseAccepted: null,
    passwordSet,
    address: { state: 'proved' },
    ownOrganizationId: null,
    ownOrganizationUnnamed: false
  };
}

/**
 * Run the load and read what it throws.
 * @param event - The event to run it with.
 * @returns What it threw, or `undefined` when it returned.
 */
async function thrownBy(event: FakeEvent): Promise<unknown> {
  return runLoad(event).then(
    () => undefined,
    (e: unknown) => e
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe("the Admin App's protected server load", () => {
  it('redirects to the login page with loginFailed when the request has no session, and reads nothing', async () => {
    const thrown = await thrownBy(makeEvent(null));

    expect(isRedirect(thrown) && { status: thrown.status, location: thrown.location }).toEqual({
      status: 307,
      location: LOGIN_FAILED_ROUTE
    });
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it("sends a candidate editor of this project to the Contestant App's home, and reads no user-level data", async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });

    await expect(runLoad(makeEvent([CANDIDATE_EDITOR_GRANT]))).resolves.toEqual({
      admitted: false,
      home: 'contestant'
    });
    expect(getProjectGrants).toHaveBeenCalledTimes(1);
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it('answers a candidate editor of another project only with admitted false', async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });

    await expect(runLoad(makeEvent([CANDIDATE_EDITOR_GRANT], []))).resolves.toEqual({ admitted: false });
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it('answers a candidate editor whose read of the grants that reach this project fails with admitted false, and logs it', async () => {
    const logged = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    const event = makeEvent([CANDIDATE_EDITOR_GRANT]);
    getProjectGrants.mockRejectedValue(new Error('The read failed.'));

    await expect(runLoad(event)).resolves.toEqual({ admitted: false });
    expect(logged).toHaveBeenCalledTimes(1);
    expect(isSessionGone).not.toHaveBeenCalled();
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it('answers an admin of another project only with admitted false, and reads no user-level data', async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });

    await expect(runLoad(makeEvent([ADMIN_GRANT], []))).resolves.toEqual({ admitted: false });
    expect(getProjectGrants).toHaveBeenCalledTimes(1);
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it("sends an admin whose only grant here is a candidate editor grant to the Contestant App's home", async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });

    await expect(runLoad(makeEvent([ADMIN_GRANT, CANDIDATE_EDITOR_GRANT], [CANDIDATE_EDITOR_GRANT]))).resolves.toEqual({
      admitted: false,
      home: 'contestant'
    });
    expect(getProjectGrants).toHaveBeenCalledTimes(1);
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it('answers a failed read of the grants that reach this project, with a session left, with a 503, and signs nobody out', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    const event = makeEvent([ADMIN_GRANT]);
    getProjectGrants.mockRejectedValue(new Error('The read failed.'));
    isSessionGone.mockResolvedValue(false);

    const thrown = await thrownBy(event);

    expect(isHttpError(thrown) && { status: thrown.status, body: thrown.body }).toEqual({
      status: 503,
      body: { message: 'error.default' }
    });
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it('redirects a failed read of the grants that reach this project, with no session left, to the login page with loginFailed', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    const event = makeEvent([ADMIN_GRANT]);
    getProjectGrants.mockRejectedValue(new Error('The read failed.'));
    isSessionGone.mockResolvedValue(true);

    const thrown = await thrownBy(event);

    expect(isRedirect(thrown) && { status: thrown.status, location: thrown.location }).toEqual({
      status: 307,
      location: LOGIN_FAILED_ROUTE
    });
  });

  it('answers a session with no grants with admitted false, and reads nothing', async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });

    await expect(runLoad(makeEvent([]))).resolves.toEqual({ admitted: false });
    expect(getProjectGrants).not.toHaveBeenCalled();
    expect(getBasicUserData).not.toHaveBeenCalled();
  });

  it('admits a session with an admin grant beside a candidate editor grant', async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    getBasicUserData.mockResolvedValue(adminWith(true));

    await expect(runLoad(makeEvent([CANDIDATE_EDITOR_GRANT, ADMIN_GRANT]))).resolves.toEqual({
      admitted: true,
      gate: null,
      user: adminWith(true)
    });
  });

  it('admits a project editor of this project', async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    getBasicUserData.mockResolvedValue(adminWith(true));

    await expect(runLoad(makeEvent([PROJECT_EDITOR_GRANT]))).resolves.toEqual({
      admitted: true,
      gate: null,
      user: adminWith(true)
    });
  });

  it('gives an admitted user whose account has no password the set-password gate', async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    getBasicUserData.mockResolvedValue(adminWith(false));

    await expect(runLoad(makeEvent([ADMIN_GRANT]))).resolves.toEqual({
      admitted: true,
      gate: 'setPassword',
      user: adminWith(false)
    });
  });

  it('gives an admitted user with a password no gate, and returns no part of the session', async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    getBasicUserData.mockResolvedValue(adminWith(true));

    const data = await runLoad(makeEvent([ADMIN_GRANT]));

    expect(data).toEqual({ admitted: true, gate: null, user: adminWith(true) });
    expect(JSON.stringify(data)).not.toContain('access_token');
    expect(JSON.stringify(data)).not.toContain('header.');
  });

  it('answers a failed read with a session left with a 503 in the reader’s language, and signs nobody out', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    getBasicUserData.mockRejectedValue(new Error('The read failed.'));
    isSessionGone.mockResolvedValue(false);

    const thrown = await thrownBy(makeEvent([ADMIN_GRANT]));

    expect(isHttpError(thrown) && { status: thrown.status, body: thrown.body }).toEqual({
      status: 503,
      body: { message: 'error.default' }
    });
    expect(isSessionGone).toHaveBeenCalledTimes(1);
  });

  it('redirects a failed read with no session left to the login page with loginFailed', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    getBasicUserData.mockResolvedValue(undefined);
    isSessionGone.mockResolvedValue(true);

    const thrown = await thrownBy(makeEvent([ADMIN_GRANT]));

    expect(isRedirect(thrown) && { status: thrown.status, location: thrown.location }).toEqual({
      status: 307,
      location: LOGIN_FAILED_ROUTE
    });
  });

  it('reads user-level data whose password fact is not a boolean as a failed read', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    getBasicUserData.mockResolvedValue({ ...adminWith(true), passwordSet: undefined });
    isSessionGone.mockResolvedValue(false);

    const thrown = await thrownBy(makeEvent([ADMIN_GRANT]));

    expect(isHttpError(thrown) && thrown.status).toBe(503);
  });

  it('reaches its end with no read of url, route or params', async () => {
    createDataWriter.mockReturnValue({ getBasicUserData, getProjectGrants, isSessionGone });
    getBasicUserData.mockResolvedValue(adminWith(false));

    await expect(runLoad(makeEvent([ADMIN_GRANT]))).resolves.toHaveProperty('gate', 'setPassword');
  });
});
