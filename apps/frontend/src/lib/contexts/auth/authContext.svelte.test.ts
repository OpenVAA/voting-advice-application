import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContextProvider } from './authContext.svelte';

// `vi.mock` factories are hoisted to the top of the file, so the mutable holders they reference must be created via `vi.hoisted` (also hoisted, evaluated first).
// `sessionSource` is an indirection: the mocked `page.data.session` getter calls `sessionSource.read()`. To prove the `$derived isAuthenticated` re-evaluates, the test installs a `$state`-BACKED reader (runes can't run at hoisted module scope, so the reactive cell is created inside `$effect.root` and wired in here).
// `writer` is the stub the arrow-field DataWriter wrappers forward to.
// `withdrawAnyCount` stands in for the removal of the logout modal's count and `announceLogout` for the start and end announcements to the other tabs, so their calls can be ordered against the writer's sign-out.
const { announceLogout, sessionSource, withdrawAnyCount, writer } = vi.hoisted(() => ({
  announceLogout: vi.fn(),
  sessionSource: { read: () => null as unknown },
  withdrawAnyCount: vi.fn(),
  writer: {
    logout: vi.fn(async () => undefined),
    setPassword: vi.fn(async () => ({}) as never)
  }
}));

vi.mock('$lib/auth/logoutDeadline', () => ({ withdrawAnyCount }));
vi.mock('$lib/auth/logoutAnnouncement', () => ({ announceLogout }));

// `isAuthenticated` is `$derived(!!page.data.session)`. The mocked `page.data` getter delegates to `sessionSource.read()`, which the test backs with a `$state` cell so toggling it propagates through the `$derived`.
vi.mock('$app/state', () => ({
  page: {
    get data() {
      return { session: sessionSource.read() };
    }
  }
}));

// The arrow-field DataWriter wrappers call `prepareDataWriter()` and forward to the writer it builds. Stub it so the wrappers are invocable without a live DataWriter; we assert the wrappers are callable / detach-safe, NOT the DataWriter behavior (that is the adapter's contract, unchanged here).
vi.mock('../utils/prepareDataWriter', () => ({
  prepareDataWriter: vi.fn(() => writer)
}));

describe('AuthContextProvider', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    sessionSource.read = () => null;
    vi.clearAllMocks();
  });

  /**
   * Construct the provider inside an `$effect.root` so its `$derived` field settles. A `$state`-backed `session` cell is created in the same root and wired into `sessionSource.read`, so flipping it via the returned `setSession` propagates through the `$derived isAuthenticated`. Returns the instance plus the setter.
   */
  function setup(initial: unknown = null): {
    auth: AuthContextProvider;
    setSession: (v: unknown) => void;
  } {
    let auth!: AuthContextProvider;
    let setSession!: (v: unknown) => void;
    cleanup = $effect.root(() => {
      let session = $state(initial);
      sessionSource.read = () => session;
      setSession = (v: unknown) => {
        session = v;
      };
      auth = new AuthContextProvider();
    });
    flushSync();
    return { auth, setSession };
  }

  // Behavior 1 — reactive $derived field over page.data.session.
  it('isAuthenticated reflects page.data.session and re-evaluates reactively when it toggles', () => {
    const { auth, setSession } = setup(null);
    expect(auth.isAuthenticated).toBe(false);

    setSession({ user: { id: 'u1' } });
    flushSync();
    expect(auth.isAuthenticated).toBe(true);

    setSession(null);
    flushSync();
    expect(auth.isAuthenticated).toBe(false);
  });

  // Behavior 2 — arrow-function fields survive destructure/detach (capture this).
  it('logout survives destructure and does not throw a this-related error when detached', async () => {
    const { auth } = setup();
    const { logout } = auth;
    await expect(logout()).resolves.toBeUndefined();
    expect(writer.logout).toHaveBeenCalledOnce();
  });

  it('logout rejects with the error of a writer whose sign-out failed', async () => {
    const { auth } = setup();
    const failure = new Error('the sign-out failed');
    writer.logout.mockRejectedValueOnce(failure);
    await expect(auth.logout()).rejects.toBe(failure);
  });

  it('logout resolves when the sign-out succeeded', async () => {
    const { auth } = setup();
    await expect(auth.logout()).resolves.toBeUndefined();
  });

  it("logout withdraws every logout count before the writer's sign-out", async () => {
    const { auth } = setup();
    await auth.logout();
    expect(withdrawAnyCount).toHaveBeenCalledOnce();
    expect(writer.logout).toHaveBeenCalledOnce();
    expect(withdrawAnyCount.mock.invocationCallOrder[0]).toBeLessThan(writer.logout.mock.invocationCallOrder[0]);
  });

  it('logout withdraws every logout count also when the sign-out then fails', async () => {
    const { auth } = setup();
    writer.logout.mockRejectedValueOnce(new Error('the sign-out failed'));
    await expect(auth.logout()).rejects.toThrow('the sign-out failed');
    expect(withdrawAnyCount).toHaveBeenCalledOnce();
    expect(withdrawAnyCount.mock.invocationCallOrder[0]).toBeLessThan(writer.logout.mock.invocationCallOrder[0]);
  });

  it("logout announces its start after withdrawing every count, then calls the writer's sign-out, then announces its end", async () => {
    const { auth } = setup();
    await auth.logout();
    expect(announceLogout.mock.calls).toEqual([['start'], ['end']]);
    const [startOrder, endOrder] = announceLogout.mock.invocationCallOrder;
    expect(withdrawAnyCount.mock.invocationCallOrder[0]).toBeLessThan(startOrder);
    expect(startOrder).toBeLessThan(writer.logout.mock.invocationCallOrder[0]);
    expect(writer.logout.mock.invocationCallOrder[0]).toBeLessThan(endOrder);
  });

  it('logout announces its end also when the sign-out then fails', async () => {
    const { auth } = setup();
    writer.logout.mockRejectedValueOnce(new Error('the sign-out failed'));
    await expect(auth.logout()).rejects.toThrow('the sign-out failed');
    expect(announceLogout.mock.calls).toEqual([['start'], ['end']]);
    const [startOrder, endOrder] = announceLogout.mock.invocationCallOrder;
    expect(startOrder).toBeLessThan(writer.logout.mock.invocationCallOrder[0]);
    expect(writer.logout.mock.invocationCallOrder[0]).toBeLessThan(endOrder);
  });

  it('both DataWriter wrappers are functions (arrow fields) and are detachable', () => {
    const { auth } = setup();
    const { logout, setPassword } = auth;
    for (const fn of [logout, setPassword]) {
      expect(typeof fn).toBe('function');
    }
  });

  it('setPassword survives destructure and forwards the new password alone', async () => {
    const { auth } = setup();
    const { setPassword } = auth;
    await setPassword({ password: 'a-new-password' });
    expect(writer.setPassword).toHaveBeenCalledOnce();
    expect(writer.setPassword).toHaveBeenCalledWith({ password: 'a-new-password' });
  });

  it('a sign-out that succeeds holds no failure', async () => {
    const { auth } = setup();
    await auth.logout();
    expect(auth.logoutFailed).toBe(false);
  });

  it('a sign-out that fails holds the failure', async () => {
    const { auth } = setup();
    writer.logout.mockRejectedValueOnce(new Error('the sign-out failed'));
    await expect(auth.logout()).rejects.toThrow('the sign-out failed');
    expect(auth.logoutFailed).toBe(true);
  });

  it('the next sign-out clears the failure as it starts and, resolving, leaves it cleared', async () => {
    const { auth } = setup();
    writer.logout.mockRejectedValueOnce(new Error('the sign-out failed'));
    await expect(auth.logout()).rejects.toThrow('the sign-out failed');

    let endSignOut!: () => void;
    writer.logout.mockImplementationOnce(
      () =>
        new Promise<undefined>((resolve) => {
          endSignOut = () => resolve(undefined);
        })
    );
    const running = auth.logout();
    expect(auth.logoutFailed).toBe(false);

    endSignOut();
    await running;
    expect(auth.logoutFailed).toBe(false);
  });

  it('clearLogoutFailure clears the failure, also detached from the instance', async () => {
    const { auth } = setup();
    const { clearLogoutFailure } = auth;
    writer.logout.mockRejectedValueOnce(new Error('the sign-out failed'));
    await expect(auth.logout()).rejects.toThrow('the sign-out failed');

    clearLogoutFailure();

    expect(auth.logoutFailed).toBe(false);
  });

  it('an effect that reads the failure flag follows it', async () => {
    const { auth } = setup();
    const seen: Array<boolean> = [];
    const stop = $effect.root(() => {
      $effect(() => {
        seen.push(auth.logoutFailed);
      });
    });
    flushSync();

    writer.logout.mockRejectedValueOnce(new Error('the sign-out failed'));
    await expect(auth.logout()).rejects.toThrow('the sign-out failed');
    flushSync();

    stop();
    expect(seen).toEqual([false, true]);
  });

  it('offers the session flag, the failure flag, logout, clearLogoutFailure and setPassword, and no other member', () => {
    const { auth } = setup();
    expect(Object.keys(auth).sort()).toEqual([
      'clearLogoutFailure',
      'isAuthenticated',
      'logout',
      'logoutFailed',
      'setPassword'
    ]);
  });

  // Behavior 3 — own-enumerable members survive the `{ ...authContext }` spread (the contestantContext line ~367 contract).
  it('spreading the instance preserves isAuthenticated + both wrappers as own-enumerable properties', () => {
    const { auth } = setup({ user: { id: 'u1' } });
    const spread = { ...auth };
    expect('isAuthenticated' in spread).toBe(true);
    expect('logout' in spread).toBe(true);
    expect('setPassword' in spread).toBe(true);
    // The spread snapshots the current $derived value (own enumerable property).
    expect(spread.isAuthenticated).toBe(true);
  });
});
