/**
 * The shared password-reset screen, mounted with the Admin App's props over fake contexts: its root carries the id it is given, it names the account by the address it is given, and a saved password leads to the home address it is given with the loads rerun, while a failed save says so and leads nowhere.
 */

import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

// The fake `t` returns the key. Hoisted, since the mock factories are.
const fakes = vi.hoisted(() => ({ t: (key: string): string => key, goto: vi.fn() }));

vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto: fakes.goto }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: fakes.t, darkMode: { current: false } })
}));

// The app context is the Admin App's, so the support link leads to an email.
vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    t: fakes.t,
    appType: { current: 'admin' },
    appSettings: { admin: { email: 'support@example.test' } },
    getRoute: { current: (route: string) => `/route/${route}` }
  })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined },
    topBarSettings: { use: () => undefined }
  })
}));

// jsdom ships no `window.matchMedia`, and `svelte/motion` reads it when it is imported through the `$layouts/main` barrel. The stub answers "no preference".
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

const PasswordResetScreen = (await import('./PasswordResetScreen.svelte')).default;

const ADDRESS = 'admin@example.test';
const PASSWORD = 'A-new-Passw0rd!long';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown) fn();
  teardown = [];
  fakes.goto.mockReset();
  document.body.innerHTML = '';
});

/** Mount the screen as the Admin App's page renders it, with a store of the password that answers as given. */
function mountScreen(answer: DataApiActionResult = { type: 'success' }) {
  const setPassword = vi.fn(async () => answer);
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(PasswordResetScreen, {
    target,
    props: {
      appName: 'adminApp.login.appSubtitle',
      email: ADDRESS,
      setPassword,
      homeHref: '/admin',
      testId: 'admin-password-reset'
    }
  });
  teardown.push(() => unmount(component));
  flushSync();
  return { target, setPassword };
}

/** Type the password and its confirmation into the setter's two fields, and press the main button. */
async function save(target: HTMLElement): Promise<void> {
  for (const field of target.querySelectorAll<HTMLInputElement>('input[type="password"]')) {
    field.value = PASSWORD;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
  flushSync();
  target.querySelector<HTMLButtonElement>('[data-testid="set-password-submit"]')?.click();
  for (let i = 0; i < 4; i++) await tick();
}

describe('PasswordResetScreen', () => {
  it('carries the root test id it is given and names the account by the address it is given', () => {
    const { target } = mountScreen();

    expect(target.querySelector('[data-testid="admin-password-reset"]')).not.toBeNull();
    expect(target.querySelector('[data-testid="password-reset-email"]')?.textContent?.trim()).toBe(ADDRESS);
    expect(target.textContent).toContain('adminApp.login.appSubtitle');
  });

  it('saves the password once and leads to the home address it is given, with the loads rerun', async () => {
    const { target, setPassword } = mountScreen();

    await save(target);

    expect(setPassword).toHaveBeenCalledTimes(1);
    expect(setPassword).toHaveBeenCalledWith({ password: PASSWORD });
    expect(fakes.goto).toHaveBeenCalledWith('/admin', { invalidateAll: true });
  });

  it('says a save failed and leads nowhere', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { target } = mountScreen({ type: 'failure' } as DataApiActionResult);

    await save(target);

    expect(target.querySelector('[data-testid="password-reset-error"]')).not.toBeNull();
    expect(fakes.goto).not.toHaveBeenCalled();
  });
});
