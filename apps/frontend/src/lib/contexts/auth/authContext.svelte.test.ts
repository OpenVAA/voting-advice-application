import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContextProvider } from './authContext.svelte';

// `vi.mock` factories are hoisted to the top of the file, so the mutable holders
// they reference must be created via `vi.hoisted` (also hoisted, evaluated first).
// `sessionSource` is an indirection: the mocked `page.data.session` getter calls
// `sessionSource.read()`. To prove the `$derived isAuthenticated` re-evaluates,
// the test installs a `$state`-BACKED reader (runes can't run at hoisted module
// scope, so the reactive cell is created inside `$effect.root` and wired in here).
// `writer` is the stub the arrow-field DataWriter wrappers forward to.
const { sessionSource, writer } = vi.hoisted(() => ({
  sessionSource: { read: () => null as unknown },
  writer: {
    logout: vi.fn(async () => undefined),
    requestForgotPasswordEmail: vi.fn(async () => ({}) as never),
    resetPassword: vi.fn(async () => ({}) as never),
    setPassword: vi.fn(async () => ({}) as never)
  }
}));

// `isAuthenticated` is `$derived(!!page.data.session)`. The mocked `page.data`
// getter delegates to `sessionSource.read()`, which the test backs with a `$state`
// cell so toggling it propagates through the `$derived`.
vi.mock('$app/state', () => ({
  page: {
    get data() {
      return { session: sessionSource.read() };
    }
  }
}));

// The arrow-field DataWriter wrappers await `prepareDataWriter(dataWriterPromise)`
// then forward to the resolved writer. Stub both so the wrappers are invocable
// without a live DataWriter; we assert the wrappers are callable / detach-safe,
// NOT the DataWriter behavior (that is the adapter's contract, unchanged here).
vi.mock('$lib/api/dataWriter', () => ({ dataWriter: writer }));
vi.mock('../utils/prepareDataWriter', () => ({
  prepareDataWriter: vi.fn(async () => writer)
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
   * Construct the provider inside an `$effect.root` so its `$derived` field
   * settles. A `$state`-backed `session` cell is created in the same root and
   * wired into `sessionSource.read`, so flipping it via the returned `setSession`
   * propagates through the `$derived isAuthenticated`. Returns the instance plus
   * the setter.
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

  it('all four DataWriter wrappers are functions (arrow fields) and are detachable', () => {
    const { auth } = setup();
    const { logout, requestForgotPasswordEmail, resetPassword, setPassword } = auth;
    for (const fn of [logout, requestForgotPasswordEmail, resetPassword, setPassword]) {
      expect(typeof fn).toBe('function');
    }
  });

  // Behavior 3 — own-enumerable members survive the `{ ...authContext }` spread
  // (the candidateContext line ~367 contract).
  it('spreading the instance preserves isAuthenticated + all four wrappers as own-enumerable properties', () => {
    const { auth } = setup({ user: { id: 'u1' } });
    const spread = { ...auth };
    expect('isAuthenticated' in spread).toBe(true);
    expect('logout' in spread).toBe(true);
    expect('requestForgotPasswordEmail' in spread).toBe(true);
    expect('resetPassword' in spread).toBe(true);
    expect('setPassword' in spread).toBe(true);
    // The spread snapshots the current $derived value (own enumerable property).
    expect(spread.isAuthenticated).toBe(true);
  });
});
