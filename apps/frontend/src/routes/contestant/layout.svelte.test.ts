/**
 * The Contestant App's outermost layout, mounted for real against a fake contestant context and a fake page, with the real `Alert` below it.
 *
 * What this file holds: when the layout withdraws the message that a sign-out could not be confirmed. While the session reads as alive and the route is no entry route of the app's gate the message stays. On an entry route, or once the session reads as gone, the layout asks the context to clear it. The context is the shared `fakeContestantContext`, whose flags are raw state behind getters, as the real accessors are, and the page's route is rune state behind a getter.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeContestantContext } from '$lib/contexts/contestant/contestantContext.testUtils.svelte';
import { APP_GATES } from '$lib/routes/appGates';
import { ROUTE } from '$lib/routes/route';

/** The route of a page only a signed-in user is shown. */
const PROTECTED_ROUTE = ROUTE.ContestantAppSettings;
/** The route of another such page. */
const OTHER_PROTECTED_ROUTE = ROUTE.ContestantAppEntityHome;

/** The entry routes of the Contestant App's row of the gate table. */
const ENTRY_ROUTES = APP_GATES.find((gate) => gate.name === 'Contestant App')?.entryRoutes ?? [];

const MESSAGE = 'common.logoutFailed';

/** The page's route, rune state behind a getter of the stubbed page. */
const state = $state({ routeId: PROTECTED_ROUTE as string | null });

/** The context's flags as they are before a case changes them. */
const SIGNED_IN = { logoutFailed: false, isAuthenticated: true };

const { context, box } = fakeContestantContext(SIGNED_IN, (held) => ({
  /** What the real context does when the flag is cleared, as a spy. */
  clearLogoutFailure: vi.fn(() => {
    held.set({ logoutFailed: false });
  })
}));
const { clearLogoutFailure } = context;

vi.mock('$app/state', () => ({
  page: {
    get route() {
      return { id: state.routeId };
    }
  }
}));

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appType: { set: () => undefined },
    popupQueue: { push: () => undefined },
    t: (key: string) => key,
    appSettings: {
      access: { contestantApp: true },
      dataAdapter: { supportsContestantApp: true },
      notifications: {}
    }
  })
}));

vi.mock('$lib/contexts/contestant', () => ({ initContestantContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ navigation: {}, topBarSettings: { use: () => undefined } })
}));

// The components the layout renders around its page and its message, none of which these cases look at. Each stand-in renders nothing.
vi.mock('$layouts/main', () => ({ Layout: () => undefined, MaintenancePage: () => undefined }));
vi.mock('$lib/components/notification', () => ({ Notification: () => undefined }));
vi.mock('$lib/dynamic-components/navigation/contestant', () => ({ ContestantNav: () => undefined }));
vi.mock('$contestant/utils/contestantAppName', () => ({ getContestantAppName: () => 'contestant app' }));

const ContestantLayout = (await import('./+layout.svelte')).default;

let teardown: (() => void) | undefined;

/** Mount the layout, and return the element it was mounted into. */
function mountLayout(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const children = createRawSnippet(() => ({ render: () => '<div data-testid="page"></div>' }));
  const component = mount(ContestantLayout, { target, props: { children } as never });
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
  box.current = SIGNED_IN;
  state.routeId = PROTECTED_ROUTE;
});

describe('the contestant layout and the message of a failed sign-out', () => {
  it('shows the message and leaves it there while the session reads as alive on a protected route', () => {
    box.set({ logoutFailed: true });

    const target = mountLayout();

    expect(message(target), 'the message should be shown').not.toBeNull();
    expect(clearLogoutFailure).not.toHaveBeenCalled();
  });

  it('leaves the message there across a route change while the session reads as alive', () => {
    box.set({ logoutFailed: true });
    const target = mountLayout();

    state.routeId = OTHER_PROTECTED_ROUTE;
    flushSync();

    expect(message(target), 'the message should still be shown').not.toBeNull();
    expect(clearLogoutFailure).not.toHaveBeenCalled();
  });

  it('has entry routes to read', () => {
    expect(ENTRY_ROUTES).toContain('ContestantAppLogin');
  });

  it.each(ENTRY_ROUTES)(
    'withdraws the message on the entry route %s, where only a request with no session arrives, though the page data still reads as signed in',
    (entryRoute) => {
      box.set({ logoutFailed: true });
      const target = mountLayout();

      state.routeId = ROUTE[entryRoute];
      flushSync();

      expect(clearLogoutFailure).toHaveBeenCalledTimes(1);
      expect(message(target), 'the message should be gone').toBeNull();
    }
  );

  it.each([ROUTE.ContestantAppHelp, ROUTE.ContestantAppPrivacy, ROUTE.ContestantAppForgotPassword])(
    'leaves the message on %s, which has no server load and is no entry route, so nothing there can tell whether the session has gone',
    (route) => {
      box.set({ logoutFailed: true });
      const target = mountLayout();

      state.routeId = route;
      flushSync();

      expect(clearLogoutFailure).not.toHaveBeenCalled();
      expect(message(target), 'the message should still be shown').not.toBeNull();
    }
  );

  it('leaves the message on the "email sent" screen, which is no entry route, while the page data reads as signed in', () => {
    box.set({ logoutFailed: true });
    const target = mountLayout();

    state.routeId = ROUTE.ContestantAppEmailSent;
    flushSync();

    expect(clearLogoutFailure).not.toHaveBeenCalled();
    expect(message(target), 'the message should still be shown').not.toBeNull();
  });

  it('withdraws the message on a protected route once the session reads as gone', () => {
    box.set({ logoutFailed: true });
    const target = mountLayout();

    box.set({ isAuthenticated: false });
    flushSync();

    expect(clearLogoutFailure).toHaveBeenCalledTimes(1);
    expect(message(target), 'the message should be gone').toBeNull();
  });

  it('asks nothing of the context on the login route when no sign-out has failed', () => {
    state.routeId = ROUTE.ContestantAppLogin;
    box.set({ isAuthenticated: false });

    mountLayout();

    expect(clearLogoutFailure).not.toHaveBeenCalled();
  });
});
