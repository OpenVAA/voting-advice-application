/**
 * The Admin App's outermost layout, mounted for real against a fake admin context and a fake page, with the real `Alert` below it.
 *
 * What this file holds: where the layout shows the message that a sign-out could not be confirmed, and when it withdraws it. `Layout` is a stand-in that renders nothing, children included, so a message found here lies outside it. While the session reads as alive and the route is no entry route of the app's gate the message stays. On an entry route, or once the session reads as gone, the layout asks the context to clear it. The context's flags and the page's route are rune state behind getters, as the real accessors are.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_GATES } from '$lib/routes/appGates';
import { ROUTE } from '$lib/routes/route';

/** The route of a page only a signed-in admin is shown. */
const PROTECTED_ROUTE = ROUTE.AdminAppHome;
/** The route of another such page. */
const OTHER_PROTECTED_ROUTE = ROUTE.AdminAppJobs;

/** The entry routes of the Admin App's row of the gate table. */
const ENTRY_ROUTES = APP_GATES.find((gate) => gate.loginRoute === 'AdminAppLogin')?.entryRoutes ?? [];

const MESSAGE = 'common.logoutFailed';

const state = $state({
  logoutFailed: false,
  isAuthenticated: true,
  routeId: PROTECTED_ROUTE as string | null
});

/** What the real context does when the flag is cleared, as a spy. */
const clearLogoutFailure = vi.fn(() => {
  state.logoutFailed = false;
});

vi.mock('$app/state', () => ({
  page: {
    get route() {
      return { id: state.routeId };
    }
  }
}));

vi.mock('$lib/contexts/admin', () => ({
  initAdminContext: () => ({
    appType: { set: () => undefined },
    t: (key: string) => key,
    appSettings: {
      access: { adminApp: true },
      dataAdapter: { supportsAdminApp: true }
    },
    clearLogoutFailure,
    get logoutFailed() {
      return state.logoutFailed;
    },
    get isAuthenticated() {
      return state.isAuthenticated;
    }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ navigation: {}, topBarSettings: { use: () => undefined } })
}));

// The components the layout renders around its page and its message, none of which these cases look at. Each stand-in renders nothing.
vi.mock('$layouts/main', () => ({ Layout: () => undefined, MaintenancePage: () => undefined }));
vi.mock('$lib/dynamic-components/navigation/admin', () => ({ AdminNav: () => undefined }));

const AdminLayout = (await import('./+layout.svelte')).default;

let teardown: (() => void) | undefined;

/** Mount the layout, and return the element it was mounted into. */
function mountLayout(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const children = createRawSnippet(() => ({ render: () => '<div data-testid="page"></div>' }));
  const component = mount(AdminLayout, { target, props: { children } as never });
  flushSync();
  teardown = () => {
    void unmount(component);
    target.remove();
  };
  return target;
}

/** The message, or `null` when the layout renders none. */
function message(target: HTMLElement): Element | null {
  const alert = target.querySelector('[role="alert"]');
  return alert?.textContent?.includes(MESSAGE) ? alert : null;
}

afterEach(() => {
  teardown?.();
  teardown = undefined;
  clearLogoutFailure.mockClear();
  state.logoutFailed = false;
  state.isAuthenticated = true;
  state.routeId = PROTECTED_ROUTE;
});

describe('the admin layout and the message of a failed sign-out', () => {
  it('shows the message as an alert, outside any header, and shows none while no sign-out has failed', () => {
    const target = mountLayout();
    expect(message(target), 'no message should be shown').toBeNull();

    state.logoutFailed = true;
    flushSync();

    const shown = message(target);
    expect(shown, 'the message should be shown').not.toBeNull();
    expect(shown!.closest('header')).toBeNull();
  });

  it('its Close asks the context to clear the failure, and the message goes', () => {
    state.logoutFailed = true;
    const target = mountLayout();
    expect(message(target), 'the message should be shown').not.toBeNull();

    message(target)!.querySelector('button')!.click();
    flushSync();

    expect(clearLogoutFailure).toHaveBeenCalledTimes(1);
    expect(message(target), 'the message should be gone').toBeNull();
  });

  it('leaves the message there on a protected route while the session reads as alive, and across a route change', () => {
    state.logoutFailed = true;
    const target = mountLayout();
    expect(message(target), 'the message should be shown').not.toBeNull();

    state.routeId = OTHER_PROTECTED_ROUTE;
    flushSync();

    expect(message(target), 'the message should still be shown').not.toBeNull();
    expect(clearLogoutFailure).not.toHaveBeenCalled();
  });

  it('has entry routes to read', () => {
    expect(ENTRY_ROUTES).toContain('AdminAppLogin');
  });

  it.each(ENTRY_ROUTES)(
    'withdraws the message on the entry route %s, where only a request with no session arrives, though the page data still reads as signed in',
    (key) => {
      state.logoutFailed = true;
      const target = mountLayout();

      state.routeId = ROUTE[key];
      flushSync();

      expect(clearLogoutFailure).toHaveBeenCalledTimes(1);
      expect(message(target), 'the message should be gone').toBeNull();
    }
  );

  it('keeps a message raised on another protected route while the session reads as alive', () => {
    state.routeId = OTHER_PROTECTED_ROUTE;
    const target = mountLayout();

    state.logoutFailed = true;
    flushSync();

    expect(clearLogoutFailure).not.toHaveBeenCalled();
    expect(message(target), 'the message should be shown').not.toBeNull();
  });

  it('withdraws the message on a protected route once the session reads as gone', () => {
    state.logoutFailed = true;
    const target = mountLayout();

    state.isAuthenticated = false;
    flushSync();

    expect(clearLogoutFailure).toHaveBeenCalledTimes(1);
    expect(message(target), 'the message should be gone').toBeNull();
  });

  it('asks nothing of the context on the login route when no sign-out has failed', () => {
    state.routeId = ROUTE.AdminAppLogin;
    state.isAuthenticated = false;

    mountLayout();

    expect(clearLogoutFailure).not.toHaveBeenCalled();
  });
});
