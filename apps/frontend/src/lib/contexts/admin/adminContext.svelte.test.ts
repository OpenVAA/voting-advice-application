/**
 * The real `AdminContextProvider`, over fakes of the two contexts it reads and of the writers it would build.
 *
 * What this file holds: the context's `logout` rejects with a sign-out's failure and does nothing after it, and after a sign-out that worked goes to the login page, carrying the reason it was given, by a full load when the navigation does not move the page. `logoutFailed` and `clearLogoutFailure` are the auth context's, read live. The entry flow of the forgot-password page asks for a recovery link made for the Admin App, in the context's locale, and a Log out that worked lets the flow go. A sign-out that works, here or in another tab, removes the Contestant App's drafts from `localStorage`; one that fails leaves them. A sign-out in another tab sends a page that reads as signed in to the login page, which says why only when another tab announced its Log out.
 *
 * `$app/environment` answers that the cases run in the browser, where the drafts are stored.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { leaveByFullLoad } from '$lib/components/preventNavigation/navigationGuards';
import { AdminContextProvider } from './adminContext.svelte';
import type { SignOutOrigin } from '$lib/api/base/dataWriter.type';

const authLogout = vi.fn(async (): Promise<void> => undefined);

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
const { auth, mounted, signOutHandlers } = vi.hoisted(() => ({
  auth: { signedIn: true, logoutFailed: false, clearLogoutFailure: vi.fn() },
  mounted: new Array<() => unknown>(),
  signOutHandlers: new Array<(origin: SignOutOrigin) => void>()
}));

vi.mock('$app/environment', () => ({ browser: true, dev: true, building: false, version: 'test' }));

vi.mock('../app', () => ({
  getAppContext: () => ({
    t: (key: string) => key,
    locale: 'fi',
    // A route named by a string, or by an object with its name and an `errorMessage`, is written as `/route/<name>`, followed by `?errorMessage=<value>` when the object carries one.
    getRoute: {
      current: (route: string | { route: string; errorMessage?: string }) => {
        if (typeof route === 'string') return `/route/${route}`;
        return route.errorMessage
          ? `/route/${route.route}?errorMessage=${route.errorMessage}`
          : `/route/${route.route}`;
      }
    }
  })
}));

/** The address the page is at when a case starts. */
const PAGE_ADDRESS = 'http://localhost/route/AdminAppHome';

// `page` is the one the box holds; the default `goto` moves it, as a navigation that went ahead does.
const { navigationBox, pageBox } = vi.hoisted(() => ({
  navigationBox: { goto: vi.fn() },
  pageBox: { page: { url: new URL('http://localhost/') } }
}));

vi.mock('$app/state', () => ({
  get page() {
    return pageBox.page;
  }
}));

vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  goto: (...args: Array<unknown>) => navigationBox.goto(...args)
}));

/** Put the page and the navigation back to what a case that sets nothing reads. */
function resetNavigation(): void {
  pageBox.page = { url: new URL(PAGE_ADDRESS) };
  navigationBox.goto.mockReset();
  navigationBox.goto.mockImplementation(async (address: string) => {
    pageBox.page.url = new URL(address, PAGE_ADDRESS);
  });
  vi.mocked(leaveByFullLoad).mockClear();
}

vi.mock('../auth', () => ({
  getAuthContext: () => ({
    get isAuthenticated() {
      return auth.signedIn;
    },
    get logoutFailed() {
      return auth.logoutFailed;
    },
    clearLogoutFailure: () => auth.clearLogoutFailure(),
    logout: () => authLogout(),
    setPassword: async () => ({ type: 'success' })
  })
}));

// The context subscribes to sign-outs in `onMount`, which runs only inside a component; these cases build it bare and run what it registered themselves.
vi.mock('svelte', (importOriginal) =>
  importOriginal<Record<string, unknown>>().then((svelte) => ({
    ...svelte,
    onMount: (callback: () => unknown) => {
      mounted.push(callback);
    }
  }))
);

// A real full load never settles, and the bare test document has nowhere to go.
vi.mock('$lib/components/preventNavigation/fullLoad', () => ({
  leaveByFullLoad: vi.fn(async () => undefined)
}));

// The announcement of a Log out between tabs. `heard` is what `heardLogoutAnnouncement` answers; the cases of a sign-out made in another tab set it.
const { announcementBox } = vi.hoisted(() => ({
  announcementBox: { heard: false, listen: vi.fn(() => () => undefined) }
}));
vi.mock('$lib/auth/logoutAnnouncement', () => ({
  heardLogoutAnnouncement: () => announcementBox.heard,
  listenForLogoutAnnouncements: () => announcementBox.listen()
}));

vi.mock('../utils/prepareAdminWriter', () => ({ prepareAdminWriter: () => ({}) }));
const { writerCalls } = vi.hoisted(() => ({ writerCalls: new Array<{ call: string; options: unknown }>() }));

vi.mock('../utils/prepareDataWriter', () => ({
  prepareDataWriter: () => ({
    requestPasswordRecovery: async (options: unknown) => {
      writerCalls.push({ call: 'requestPasswordRecovery', options });
      return { type: 'success' };
    },
    requestSignInLink: async (options: unknown) => {
      writerCalls.push({ call: 'requestSignInLink', options });
      return { type: 'success' };
    },
    onSignOut: (handler: (origin: SignOutOrigin) => void) => {
      signOutHandlers.push(handler);
      return () => undefined;
    }
  })
}));

const FAILURE = new Error('the sign-out failed');

/** Two drafts of the Contestant App, of two users, and a key of another kind. */
const DRAFT_KEYS = [
  'contestantContext-userData-editedAnswers-user-1-candidate-cand-1',
  'contestantContext-userData-editedAnswers-user-2-organization-org-1'
];
const OTHER_KEY = 'appContext-userPreferences';

/** Store the two drafts and the other key. */
function storeDrafts(): void {
  for (const key of DRAFT_KEYS) localStorage.setItem(key, JSON.stringify({ version: 1, data: { q1: { value: 1 } } }));
  localStorage.setItem(OTHER_KEY, 'kept');
}

/** The keys `localStorage` holds, sorted. */
function storedKeys(): Array<string> {
  return Object.keys(localStorage).sort();
}

/**
 * Build the context and run what it registered for its mount, so that it subscribes to the sign-outs the writer announces.
 * @returns The context and the handler it subscribed.
 */
function mountProvider(): { provider: AdminContextProvider; announce: (origin: SignOutOrigin) => void } {
  const provider = new AdminContextProvider();
  for (const callback of mounted.splice(0)) callback();
  const handler = signOutHandlers.splice(0).at(-1);
  if (!handler) throw new Error('The context subscribed to no sign-out');
  return { provider, announce: handler };
}

afterEach(() => {
  authLogout.mockReset();
  authLogout.mockImplementation(async () => undefined);
  auth.signedIn = true;
  auth.logoutFailed = false;
  auth.clearLogoutFailure.mockClear();
  mounted.length = 0;
  signOutHandlers.length = 0;
  localStorage.clear();
  resetNavigation();
  announcementBox.heard = false;
  announcementBox.listen.mockClear();
  writerCalls.length = 0;
});
resetNavigation();

const ADDRESS = 'admin@example.test';

describe('the admin context’s entry flow', () => {
  it('holds no flow when it is made', () => {
    expect(new AdminContextProvider().entryFlow).toBeUndefined();
  });

  it('asks the forgot-password page’s request once, as a recovery link made for the Admin App in the context’s locale', async () => {
    const provider = new AdminContextProvider();

    await provider.sendEntryLink({ origin: 'forgotPassword', email: ADDRESS });

    expect(writerCalls).toStrictEqual([
      { call: 'requestPasswordRecovery', options: { email: ADDRESS, locale: 'fi', app: 'admin' } }
    ]);
    expect(provider.entryFlow?.request).toMatchObject({
      origin: 'forgotPassword',
      email: ADDRESS,
      wording: 'recovery'
    });
  });

  it.each([
    ['the sign-in form', { origin: 'signIn', email: ADDRESS }],
    ['the registration screen', { origin: 'register', email: ADDRESS }],
    ['a code', { origin: 'registerSignIn', code: 'ABCD-EFGH-JKLM' }],
    ['the forgot-password page with no address', { origin: 'forgotPassword' }]
  ] as const)('asks nothing for a request from %s', async (_kind, request) => {
    const provider = new AdminContextProvider();

    await provider.sendEntryLink(request);

    expect(writerCalls).toStrictEqual([]);
  });

  it('repeats the held request on resend, and clears the flow on clear', async () => {
    const provider = new AdminContextProvider();
    await provider.sendEntryLink({ origin: 'forgotPassword', email: ADDRESS });

    await provider.resendEntryLink();
    expect(writerCalls.map(({ call }) => call)).toStrictEqual(['requestPasswordRecovery', 'requestPasswordRecovery']);

    provider.clearEntryFlow();
    expect(provider.entryFlow).toBeUndefined();
  });

  it('lets the flow go after a Log out that worked, and keeps it after one that failed', async () => {
    const provider = new AdminContextProvider();
    await provider.sendEntryLink({ origin: 'forgotPassword', email: ADDRESS });

    authLogout.mockRejectedValueOnce(FAILURE);
    await expect(provider.logout()).rejects.toBe(FAILURE);
    expect(provider.entryFlow?.request?.email).toBe(ADDRESS);

    await provider.logout();
    expect(provider.entryFlow).toBeUndefined();
  });

  it('keeps its entry-flow functions working when they are taken off the instance', async () => {
    const provider = new AdminContextProvider();
    const { sendEntryLink, resendEntryLink, clearEntryFlow } = provider;

    await sendEntryLink({ origin: 'forgotPassword', email: ADDRESS });
    await resendEntryLink();
    expect(writerCalls).toHaveLength(2);
    clearEntryFlow();
    expect(provider.entryFlow).toBeUndefined();
  });
});

describe('the admin context’s logout', () => {
  const LOGIN = '/route/AdminAppLogin';

  it('after a sign-out that works, goes to the login page', async () => {
    const provider = new AdminContextProvider();

    await provider.logout();

    expect(navigationBox.goto).toHaveBeenCalledTimes(1);
    expect(navigationBox.goto).toHaveBeenCalledWith(LOGIN, { invalidateAll: true });
    expect(leaveByFullLoad).not.toHaveBeenCalled();
  });

  it('carries the reason it is given to the login page as its errorMessage', async () => {
    const provider = new AdminContextProvider();

    await provider.logout({ reason: 'loggedOutAutomatically' });

    expect(navigationBox.goto).toHaveBeenCalledWith(`${LOGIN}?errorMessage=loggedOutAutomatically`, {
      invalidateAll: true
    });
  });

  it('leaves to the login page by a full load when the navigation does not move the page', async () => {
    navigationBox.goto.mockImplementation(async () => undefined);
    const provider = new AdminContextProvider();

    await provider.logout();

    expect(leaveByFullLoad).toHaveBeenCalledTimes(1);
    expect(leaveByFullLoad).toHaveBeenCalledWith(LOGIN);
  });

  it('leaves to the login page by a full load when the navigation rejects', async () => {
    navigationBox.goto.mockRejectedValue(new Error('the navigation failed'));
    const provider = new AdminContextProvider();

    await provider.logout();

    expect(leaveByFullLoad).toHaveBeenCalledWith(LOGIN);
  });

  it('a sign-out that fails rejects with its error and goes nowhere', async () => {
    authLogout.mockRejectedValueOnce(FAILURE);
    const provider = new AdminContextProvider();

    await expect(provider.logout()).rejects.toBe(FAILURE);

    expect(navigationBox.goto).not.toHaveBeenCalled();
    expect(leaveByFullLoad).not.toHaveBeenCalled();
  });

  it('reads the auth context’s failure flag at every access', () => {
    const provider = new AdminContextProvider();
    expect(provider.logoutFailed).toBe(false);

    auth.logoutFailed = true;

    expect(provider.logoutFailed).toBe(true);
  });

  it('logout and clearLogoutFailure work detached from the instance, clearLogoutFailure as the auth context’s', async () => {
    authLogout.mockRejectedValueOnce(FAILURE);
    const provider = new AdminContextProvider();
    const { logout, clearLogoutFailure } = provider;

    await expect(logout()).rejects.toBe(FAILURE);
    clearLogoutFailure();

    expect(auth.clearLogoutFailure).toHaveBeenCalledTimes(1);
  });
});

describe('the Admin App’s sign-outs and the Contestant App’s drafts', () => {
  it('a logout that works removes the drafts of every user, and no other key', async () => {
    storeDrafts();
    const provider = new AdminContextProvider();

    await provider.logout();

    expect(storedKeys()).toEqual([OTHER_KEY]);
  });

  it('a logout that fails leaves the drafts', async () => {
    storeDrafts();
    authLogout.mockRejectedValueOnce(FAILURE);
    const provider = new AdminContextProvider();

    await expect(provider.logout()).rejects.toBe(FAILURE);

    expect(storedKeys()).toEqual([...DRAFT_KEYS, OTHER_KEY].sort());
  });

  it('a sign-out in another tab removes the drafts, on a page that reads as signed in', () => {
    storeDrafts();
    const { announce } = mountProvider();

    announce('elsewhere');

    expect(storedKeys()).toEqual([OTHER_KEY]);
  });

  it('a sign-out in another tab removes the drafts, on a page that reads as signed out', () => {
    auth.signedIn = false;
    storeDrafts();
    const { announce } = mountProvider();

    announce('elsewhere');

    expect(storedKeys()).toEqual([OTHER_KEY]);
  });
});

describe('a sign-out made in another tab', () => {
  const LOGIN_SAYING_WHY = '/route/AdminAppLogin?errorMessage=loggedOutElsewhere';

  beforeEach(() => {
    announcementBox.heard = true;
  });

  it('listens for the announcements of the other tabs once, when it is mounted', () => {
    mountProvider();

    expect(announcementBox.listen).toHaveBeenCalledTimes(1);
  });

  it('after another tab announced its Log out, leaves to the login route with errorMessage=loggedOutElsewhere', async () => {
    const { announce } = mountProvider();

    announce('elsewhere');

    await vi.waitFor(() => expect(navigationBox.goto).toHaveBeenCalledTimes(1));
    expect(navigationBox.goto).toHaveBeenCalledWith(LOGIN_SAYING_WHY, { invalidateAll: true });
    expect(leaveByFullLoad).not.toHaveBeenCalled();
  });

  it('leaves to the same route by a full load when the navigation does not move the page', async () => {
    navigationBox.goto.mockImplementation(async () => undefined);
    const { announce } = mountProvider();

    announce('elsewhere');

    await vi.waitFor(() => expect(leaveByFullLoad).toHaveBeenCalledTimes(1));
    expect(leaveByFullLoad).toHaveBeenCalledWith(LOGIN_SAYING_WHY);
  });

  it('leaves to the same route by a full load when the navigation rejects', async () => {
    navigationBox.goto.mockRejectedValue(new Error('the navigation failed'));
    const { announce } = mountProvider();

    announce('elsewhere');

    await vi.waitFor(() => expect(leaveByFullLoad).toHaveBeenCalledTimes(1));
    expect(leaveByFullLoad).toHaveBeenCalledWith(LOGIN_SAYING_WHY);
  });

  it('with no announcement heard, leaves to the login route with no errorMessage', async () => {
    announcementBox.heard = false;
    const { announce } = mountProvider();

    announce('elsewhere');

    await vi.waitFor(() => expect(navigationBox.goto).toHaveBeenCalledTimes(1));
    expect(navigationBox.goto).toHaveBeenCalledWith('/route/AdminAppLogin', { invalidateAll: true });
    expect(leaveByFullLoad).not.toHaveBeenCalled();
  });

  it('does not leave a page that reads as signed out', async () => {
    auth.signedIn = false;
    const { announce } = mountProvider();

    announce('elsewhere');
    await Promise.resolve();

    expect(navigationBox.goto).not.toHaveBeenCalled();
    expect(leaveByFullLoad).not.toHaveBeenCalled();
  });
});
