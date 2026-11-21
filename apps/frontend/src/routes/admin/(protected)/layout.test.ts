/**
 * The universal load of the Admin App's protected group, driven directly with a fake event.
 *
 * What this file holds:
 *
 * 1. **No session in the page data** redirects to the login page with `loginFailed`, before anything is read.
 * 2. **A read in the browser that answers nothing, with a session in the page data,** asks the writer whether the load's client still holds a session. When it holds none, the session ended elsewhere and the load redirects to the login page with `loginFailed`. When one is left, or the client cannot tell, it is an error in the reader's language: no redirect and no sign-out. The gate sends a live session straight back from the login page, so a redirect there would never end.
 * 3. **An admitted user** gets the user data and the gate the server load decided: during server rendering the server load's user data, with nothing read; in the browser the user data read with the tab's own client.
 * 4. **A user the server load did not admit** is signed out, with nothing read, and redirected to the login page with `userNotAuthorized` when the sign-out works. When it fails, the failure is logged. In the browser the writer is then asked whether a session is left: none redirects to the login page with `userNotAuthorized`, and one left, or no answer, throws a 503 in the reader's language, with no redirect, for the same reason as in 2. On the server it is not asked and the load throws the 503: the client there writes no cookies, so after its own failed sign-out it answers no session while the browser still holds one.
 * 5. **The load reads no `url`, `route` or `params`.** The event's getters for them throw, in every case, and one case reaches the end of the load to show it.
 * 6. **The Contestant App's drafts.** In the browser, a sign-out of a user who is no administrator that has ended the session removes them before the redirect: one that worked, and one that failed with no session left. One that failed with a session left removes none, and on the server nothing is removed. A load that finds no session removes none.
 * 7. **The announcements to the other tabs.** In the browser, the sign-out of a user who is no administrator is made between a `start` and an `end` announcement.
 *
 * `$lib/auth`, `$lib/api/dataWriter`, the drafts' module and the announcements' module are replaced, so no Supabase client is built and no storage is read, and `$app/environment` answers the `browser` each case sets, the server's by default. `$lib/routes` is real, and the Paraglide stub answers a message's key.
 */

import { log } from '@openvaa/app-shared';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { load } from './+layout';

const { announceLogout, createDataWriter, discardContestantDrafts, environment, getUserData, isSessionGone, logout } =
  vi.hoisted(() => ({
    announceLogout: vi.fn(),
    createDataWriter: vi.fn(),
    discardContestantDrafts: vi.fn(),
    environment: { browser: false },
    getUserData: vi.fn(),
    isSessionGone: vi.fn(),
    logout: vi.fn()
  }));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/auth', () => ({ getUserData }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/contexts/contestant/contestantDrafts', () => ({ discardContestantDrafts }));
vi.mock('$lib/auth/logoutAnnouncement', () => ({ announceLogout }));
vi.mock('$app/environment', () => ({
  get browser() {
    return environment.browser;
  }
}));

/** The generated event type names this route's own id; the erased signature below is the surface the load may touch. */
type FakeEvent = {
  data: ServerData;
  fetch: typeof fetch;
  parent: () => Promise<{ session: { userId: string; expiresAt: number } | null; supabaseClient: unknown }>;
};
const runLoad = load as unknown as (event: FakeEvent) => Promise<unknown>;

const SESSION = { userId: 'user-1', expiresAt: 1893456000 };
const ADMIN = { id: 'user-1', role: 'admin' };
const SERVER_ADMIN = { id: 'user-1', role: 'admin', email: 'admin@example.test' };

/** What the server load of the group answers. */
type ServerData = { admitted: false } | { admitted: true; gate: 'setPassword' | null; user: unknown };
const ADMITTED: ServerData = { admitted: true, gate: null, user: SERVER_ADMIN };
const NOT_ADMITTED: ServerData = { admitted: false };

/**
 * An event holding `fetch` and `parent`, whose `url`, `route` and `params` throw when read. A read of any of them would make SvelteKit rerun the load when that part of the address changes.
 * @param session - What the page data says about the session.
 * @param data - What the server load answered. An admitted user with a password by default.
 * @returns The fake event.
 */
function makeEvent(session: typeof SESSION | null, data: ServerData = ADMITTED): FakeEvent {
  const event = {
    data,
    fetch: vi.fn() as unknown as typeof fetch,
    parent: async () => ({ session, supabaseClient: {} })
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
 * Run the load and read the redirect it throws.
 * @param event - The event to run it with.
 * @returns The status and the address of the redirect.
 */
async function redirectFrom(event: FakeEvent): Promise<{ status: number; location: string }> {
  const thrown = await runLoad(event).then(
    () => undefined,
    (e: unknown) => e
  );
  if (!isRedirect(thrown)) throw new Error(`The load did not redirect: ${describeThrown(thrown)}`);
  return { status: thrown.status, location: thrown.location };
}

/**
 * Run the load and read the error page it throws.
 * @param event - The event to run it with.
 * @returns The status and the body of the error.
 */
async function httpErrorFrom(event: FakeEvent): Promise<{ status: number; body: unknown }> {
  const thrown = await runLoad(event).then(
    () => undefined,
    (e: unknown) => e
  );
  if (!isHttpError(thrown)) throw new Error(`The load did not throw an error page: ${describeThrown(thrown)}`);
  return { status: thrown.status, body: thrown.body };
}

/**
 * Say what a load threw, for the message of a failed case.
 * @param thrown - What it threw, or `undefined` when it returned.
 * @returns A line naming it.
 */
function describeThrown(thrown: unknown): string {
  if (isRedirect(thrown)) return `a ${thrown.status} redirect to ${thrown.location}`;
  if (isHttpError(thrown)) return `a ${thrown.status} error page`;
  return thrown === undefined ? 'it returned' : String(thrown);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  environment.browser = false;
});

describe("the Admin App's protected load", () => {
  it('redirects to the login page with loginFailed when the page data holds no session, and reads nothing', async () => {
    const redirected = await redirectFrom(makeEvent(null));

    expect(redirected).toEqual({
      status: 307,
      location: buildRoute({ route: 'AdminAppLogin', locale: 'en', errorMessage: 'loginFailed' })
    });
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('redirects to the login page with loginFailed when a read answers nothing and the client holds no session, and signs nobody out', async () => {
    environment.browser = true;
    getUserData.mockResolvedValue(undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    isSessionGone.mockResolvedValue(true);

    const redirected = await redirectFrom(makeEvent(SESSION));

    expect(redirected).toEqual({
      status: 307,
      location: buildRoute({ route: 'AdminAppLogin', locale: 'en', errorMessage: 'loginFailed' })
    });
    expect(isSessionGone).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('throws a 503 with the text of error.default when a read answers nothing and a session is left, and neither redirects nor signs out', async () => {
    environment.browser = true;
    getUserData.mockResolvedValue(undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    isSessionGone.mockResolvedValue(false);

    const failed = await httpErrorFrom(makeEvent(SESSION));

    expect(failed).toEqual({ status: 503, body: { message: 'error.default' } });
    expect(isSessionGone).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it("during server rendering, returns the server load's user data and gate of an admitted user, and reads nothing", async () => {
    await expect(runLoad(makeEvent(SESSION))).resolves.toEqual({ userData: SERVER_ADMIN, gate: null });
    await expect(
      runLoad(makeEvent(SESSION, { admitted: true, gate: 'setPassword', user: SERVER_ADMIN }))
    ).resolves.toEqual({ userData: SERVER_ADMIN, gate: 'setPassword' });
    expect(getUserData).not.toHaveBeenCalled();
    expect(createDataWriter).not.toHaveBeenCalled();
  });

  it("in the browser, returns the user data read with the tab's client, and passes the server load's gate on", async () => {
    environment.browser = true;
    getUserData.mockResolvedValue(ADMIN);

    await expect(
      runLoad(makeEvent(SESSION, { admitted: true, gate: 'setPassword', user: SERVER_ADMIN }))
    ).resolves.toEqual({ userData: ADMIN, gate: 'setPassword' });
    expect(getUserData).toHaveBeenCalledTimes(1);
    expect(createDataWriter).not.toHaveBeenCalled();
  });

  it('signs out once and redirects with userNotAuthorized a user who is no administrator', async () => {
    createDataWriter.mockReturnValue({ logout });
    logout.mockResolvedValue({ type: 'success' });

    const redirected = await redirectFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(redirected).toEqual({
      status: 307,
      location: buildRoute({ route: 'AdminAppLogin', locale: 'en', errorMessage: 'userNotAuthorized' })
    });
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('on the server, logs a sign-out that fails and throws a 503 with the text of error.default, with no redirect, and does not ask whether a session is left', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockRejectedValue(new Error('The logout endpoint answered 502.'));
    isSessionGone.mockResolvedValue(true);

    const failed = await httpErrorFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(failed).toEqual({ status: 503, body: { message: 'error.default' } });
    expect(isSessionGone).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('The logout endpoint answered 502.');
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('in the browser, logs a sign-out that fails and redirects with userNotAuthorized when no session is left', async () => {
    environment.browser = true;
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockRejectedValue(new Error('The logout endpoint answered 502.'));
    isSessionGone.mockResolvedValue(true);

    const redirected = await redirectFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(redirected).toEqual({
      status: 307,
      location: buildRoute({ route: 'AdminAppLogin', locale: 'en', errorMessage: 'userNotAuthorized' })
    });
    expect(isSessionGone).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('The logout endpoint answered 502.');
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('in the browser, logs a sign-out that fails and throws a 503 with the text of error.default, with no redirect, when a session is left', async () => {
    environment.browser = true;
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockRejectedValue(new Error('The logout endpoint answered 502.'));
    isSessionGone.mockResolvedValue(false);

    const failed = await httpErrorFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(failed).toEqual({ status: 503, body: { message: 'error.default' } });
    expect(isSessionGone).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('reaches its end with no read of url, route or params', async () => {
    environment.browser = true;
    getUserData.mockResolvedValue(ADMIN);

    await expect(runLoad(makeEvent(SESSION))).resolves.toHaveProperty('userData');
  });
});

describe("the Admin App's protected load and the Contestant App's drafts", () => {
  const NOT_AUTHORIZED = {
    status: 307,
    location: buildRoute({ route: 'AdminAppLogin', locale: 'en', errorMessage: 'userNotAuthorized' })
  };

  it('in the browser, a sign-out of a user who is no administrator that works removes the drafts, and redirects with userNotAuthorized', async () => {
    environment.browser = true;
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockResolvedValue({ type: 'success' });

    const redirected = await redirectFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(redirected).toEqual(NOT_AUTHORIZED);
    expect(discardContestantDrafts).toHaveBeenCalledTimes(1);
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('in the browser, a sign-out that fails with no session left removes the drafts, and redirects with userNotAuthorized', async () => {
    environment.browser = true;
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockRejectedValue(new Error('The logout endpoint answered 502.'));
    isSessionGone.mockResolvedValue(true);

    const redirected = await redirectFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(redirected).toEqual(NOT_AUTHORIZED);
    expect(discardContestantDrafts).toHaveBeenCalledTimes(1);
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('in the browser, a sign-out that fails with a session left removes no draft', async () => {
    environment.browser = true;
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockRejectedValue(new Error('The logout endpoint answered 502.'));
    isSessionGone.mockResolvedValue(false);

    const failed = await httpErrorFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(failed.status).toBe(503);
    expect(discardContestantDrafts).not.toHaveBeenCalled();
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('on the server, a sign-out that works removes no draft', async () => {
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockResolvedValue({ type: 'success' });

    const redirected = await redirectFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(redirected).toEqual(NOT_AUTHORIZED);
    expect(discardContestantDrafts).not.toHaveBeenCalled();
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('on the server, a sign-out that fails removes no draft', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockRejectedValue(new Error('The logout endpoint answered 502.'));
    isSessionGone.mockResolvedValue(true);

    const failed = await httpErrorFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(failed.status).toBe(503);
    expect(discardContestantDrafts).not.toHaveBeenCalled();
    expect(getUserData).not.toHaveBeenCalled();
  });

  it('in the browser, a load whose page data holds no session removes no draft', async () => {
    environment.browser = true;

    await redirectFrom(makeEvent(null));

    expect(discardContestantDrafts).not.toHaveBeenCalled();
  });

  it('in the browser, a read that answers nothing with no session left removes no draft', async () => {
    environment.browser = true;
    getUserData.mockResolvedValue(undefined);
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    isSessionGone.mockResolvedValue(true);

    await redirectFrom(makeEvent(SESSION));

    expect(discardContestantDrafts).not.toHaveBeenCalled();
  });
});

describe("the Admin App's protected load and the announcements to the other tabs", () => {
  it('in the browser, a user who is no administrator is signed out between a start and an end announcement', async () => {
    environment.browser = true;
    createDataWriter.mockReturnValue({ isSessionGone, logout });
    logout.mockResolvedValue({ type: 'success' });

    const redirected = await redirectFrom(makeEvent(SESSION, NOT_ADMITTED));

    expect(redirected).toEqual({
      status: 307,
      location: buildRoute({ route: 'AdminAppLogin', locale: 'en', errorMessage: 'userNotAuthorized' })
    });
    expect(announceLogout.mock.calls).toEqual([['start'], ['end']]);
    const [startOrder, endOrder] = announceLogout.mock.invocationCallOrder;
    expect(startOrder).toBeLessThan(logout.mock.invocationCallOrder[0]);
    expect(logout.mock.invocationCallOrder[0]).toBeLessThan(endOrder);
  });
  expect(getUserData).not.toHaveBeenCalled();
});
