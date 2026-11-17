/**
 * `Banner`, mounted for real against fake contexts and a fake `page`, with the real `Button` and the one `LogoutButton` below it, given each app's sign-out.
 *
 * What this file holds: when the header shows Log out. The action must be on and the user signed in, in either app that has one. Signed in means that `page.data` holds the session the app's outermost load provides.
 *
 * It also holds what the Admin App's button does with the answer of its sign-out. After one that failed it logs, stays and shows nothing of its own, because the message comes from the Admin App's layout. After one that succeeded it goes on to its route, and leaves by a full load when that navigation rejected or did not move the page. Two presses are one sign-out and one navigation.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';

type App = 'contestant' | 'admin';

/** The address the page is at when a case starts. */
const PAGE_ADDRESS = 'http://localhost/admin/jobs';

/** What the case sets before it mounts the banner. */
const fake: {
  appType: App;
  logoutAction: 'show' | 'hide';
  data: { session?: { userId: string; expiresAt: number | null } | null };
  url: URL;
} = {
  appType: 'contestant',
  logoutAction: 'show',
  data: {},
  url: new URL(PAGE_ADDRESS)
};

const SESSION = { userId: 'a-user', expiresAt: 1 };

const contestantLogout = vi.fn(async () => undefined);
const adminLogout = vi.fn(async (): Promise<void> => undefined);
// By default the page moves, as a navigation that went ahead does.
const goto = vi.fn(async (address: string): Promise<void> => {
  fake.url = new URL(address, PAGE_ADDRESS);
});
// A real full load never settles. These cases read that it was asked for, and what comes after it is not theirs.
const fullLoad = vi.fn(async (_address: string): Promise<void> => undefined);

vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  goto: (...args: Array<unknown>) => (goto as (...args: Array<unknown>) => Promise<void>)(...args)
}));

vi.mock('$lib/components/preventNavigation/navigationGuards', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  leaveByFullLoad: (address: string) => fullLoad(address)
}));

vi.mock('$app/state', () => ({
  page: {
    get data() {
      return fake.data;
    },
    get url() {
      return fake.url;
    },
    params: {}
  }
}));

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appType: {
      get current() {
        return fake.appType;
      }
    },
    getRoute: { current: (route: string) => `/route/${route}` },
    openFeedbackModal: { current: () => undefined },
    t: (key: string) => key
  })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    topBarSettings: {
      get current() {
        return { actions: { logout: fake.logoutAction } };
      }
    },
    video: { hasContent: false, mode: undefined, player: undefined }
  })
}));

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    logout: contestantLogout,
    appSettings: { entities: {} },
    userData: { savedEntityData: undefined },
    answersLocked: false,
    tasks: [],
    unansweredOpinionQuestions: [],
    unansweredRequiredInfoQuestions: []
  })
}));

vi.mock('$lib/contexts/admin', () => ({
  getAdminContext: () => ({
    logout: adminLogout,
    getRoute: { current: (route: string) => `/route/${route}` },
    t: (key: string) => key
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the modal is imported. The stub answers "no preference".
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    })
  });
}

const Banner = (await import('./Banner.svelte')).default;

const APPS: Array<App> = ['contestant', 'admin'];

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  contestantLogout.mockClear();
  adminLogout.mockClear();
  goto.mockClear();
  fullLoad.mockClear();
  fake.appType = 'contestant';
  fake.logoutAction = 'show';
  fake.data = {};
  fake.url = new URL(PAGE_ADDRESS);
});

/** Mount the banner as the case has set it up and return the header's Log out, or `null` when it has none. */
function headerLogout(): HTMLButtonElement | null {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Banner, { target });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target.querySelector<HTMLButtonElement>('[data-testid="header-logout"]');
}

/** Let settled promises' reactions run, and the DOM follow them. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  flushSync();
}

/** The message that a sign-out could not be confirmed, or `null` when it is not shown. */
function failureMessage(): Element | null {
  const alert = document.querySelector('[role="alert"]');
  return alert?.textContent?.includes('common.logoutFailed') ? alert : null;
}

describe('Banner — the header’s Log out', () => {
  it.each(APPS)('the %s app shows it to a signed-in user, and pressing it signs out in that app', async (app) => {
    fake.appType = app;
    fake.data = { session: SESSION };

    const button = headerLogout();

    expect(button).not.toBeNull();
    expect(button!.disabled).toBe(false);
    button!.click();
    await Promise.resolve();
    expect(contestantLogout).toHaveBeenCalledTimes(app === 'contestant' ? 1 : 0);
    expect(adminLogout).toHaveBeenCalledTimes(app === 'admin' ? 1 : 0);
  });

  it.each(APPS)('the %s app does not show it when the session is null', (app) => {
    fake.appType = app;
    fake.data = { session: null };

    expect(headerLogout()).toBeNull();
  });

  it.each(APPS)('the %s app does not show it to a signed-in user while the action is hidden', (app) => {
    fake.appType = app;
    fake.logoutAction = 'hide';
    fake.data = { session: SESSION };

    expect(headerLogout()).toBeNull();
  });
});

describe('Banner — the Admin App’s Log out on the answer of its sign-out', () => {
  const FAILURE = new Error('the sign-out failed');
  const NAVIGATION_FAILURE = new Error('the navigation failed');
  const ROUTE_AFTER_LOGOUT = buildRoute({ route: 'AdminAppLogin' });

  /** Mount the banner of the Admin App for a signed-in user and return its Log out. */
  function adminLogoutButton(): HTMLButtonElement {
    fake.appType = 'admin';
    fake.data = { session: SESSION };
    return headerLogout()!;
  }

  it('a sign-out that succeeds is followed by the navigation to its route, with no full load and no message', async () => {
    const button = adminLogoutButton();

    button.click();
    await settle();

    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(ROUTE_AFTER_LOGOUT, { invalidateAll: true });
    expect(fullLoad).not.toHaveBeenCalled();
    expect(failureMessage()).toBeNull();
  });

  it('a navigation that leaves the address as it was is logged and followed by a full load of the route, once', async () => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    goto.mockImplementationOnce(async () => undefined);
    const button = adminLogoutButton();

    button.click();
    await settle();

    expect(fullLoad).toHaveBeenCalledTimes(1);
    expect(fullLoad).toHaveBeenCalledWith(ROUTE_AFTER_LOGOUT);
    expect(logError).toHaveBeenCalledTimes(1);
    logError.mockRestore();
  });

  it.each([
    ['with the address as it was', false],
    ['after the address changed', true]
  ])('a navigation that rejects %s is logged and followed by a full load of the route, once', async (_when, moves) => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    goto.mockImplementationOnce(async (address: string) => {
      if (moves) fake.url = new URL(address, PAGE_ADDRESS);
      throw NAVIGATION_FAILURE;
    });
    const button = adminLogoutButton();

    button.click();
    await settle();

    expect(fullLoad).toHaveBeenCalledTimes(1);
    expect(fullLoad).toHaveBeenCalledWith(ROUTE_AFTER_LOGOUT);
    expect(logError).toHaveBeenCalledTimes(1);
    logError.mockRestore();
  });

  it('a sign-out that fails is logged, with no navigation, no full load and no message from the button', async () => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    adminLogout.mockRejectedValueOnce(FAILURE);
    const button = adminLogoutButton();

    button.click();
    await settle();

    expect(failureMessage()).toBeNull();
    expect(goto).not.toHaveBeenCalled();
    expect(fullLoad).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledTimes(1);
    logError.mockRestore();
  });

  it('a press after a sign-out that failed signs out and navigates', async () => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    adminLogout.mockRejectedValueOnce(FAILURE);
    const button = adminLogoutButton();
    button.click();
    await settle();
    expect(goto).not.toHaveBeenCalled();

    button.click();
    await settle();

    expect(adminLogout).toHaveBeenCalledTimes(2);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(ROUTE_AFTER_LOGOUT, { invalidateAll: true });
    logError.mockRestore();
  });

  it('a press during the sign-out and a press during the navigation change nothing: one sign-out and one navigation', async () => {
    let endSignOut!: () => void;
    adminLogout.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          endSignOut = resolve;
        })
    );
    let endNavigation!: () => void;
    goto.mockImplementationOnce(
      (address: string) =>
        new Promise<void>((resolve) => {
          endNavigation = () => {
            fake.url = new URL(address, PAGE_ADDRESS);
            resolve();
          };
        })
    );
    const button = adminLogoutButton();

    button.click();
    await settle();
    button.click();
    await settle();
    expect(adminLogout).toHaveBeenCalledTimes(1);

    endSignOut();
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    button.click();
    await settle();

    endNavigation();
    await settle();

    expect(adminLogout).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledTimes(1);
    expect(fullLoad).not.toHaveBeenCalled();
  });
});
