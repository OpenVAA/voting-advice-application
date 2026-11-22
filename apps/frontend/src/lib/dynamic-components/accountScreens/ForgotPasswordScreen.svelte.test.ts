/**
 * The shared forgot-password screen, mounted with the Admin App's props over fake contexts: its root carries the id it is given, its way back is the address it is given, and a usable address is asked for once and leads to the "email sent" address it is given.
 */

import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The fake `t` returns the key, followed by its parameters when there are any. Hoisted, since the mock factories are.
const fakes = vi.hoisted(() => ({
  t: (key: string, params?: Record<string, unknown>): string => (params ? `${key} ${JSON.stringify(params)}` : key)
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: fakes.t, darkMode: { current: false } })
}));

// The app context is the Admin App's, so a support link the screen renders leads to an email.
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

const { goto } = vi.hoisted(() => ({ goto: vi.fn() }));
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

const ForgotPasswordScreen = (await import('./ForgotPasswordScreen.svelte')).default;

const ADDRESS = 'admin@example.test';

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown) fn();
  teardown = [];
  goto.mockReset();
  document.body.innerHTML = '';
});

/** Mount the screen as the Admin App's page renders it, with a request function that records its requests. */
function mountScreen(answer: { retryAfterSeconds: number } | undefined = undefined) {
  const sendEntryLink = vi.fn(async () => answer);
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ForgotPasswordScreen, {
    target,
    props: {
      appName: 'adminApp.login.appSubtitle',
      sendEntryLink,
      emailSentHref: '/admin/email-sent',
      returnHref: '/admin/login',
      testId: 'admin-forgot-password'
    }
  });
  teardown.push(() => unmount(component));
  flushSync();
  return { target, sendEntryLink };
}

/** Type into the address field and press the main button. */
async function submit(target: HTMLElement, address: string): Promise<void> {
  const field = target.querySelector<HTMLInputElement>('[data-testid="forgot-password-email"]');
  if (!field) throw new Error('the screen renders no address field');
  field.value = address;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
  target.querySelector<HTMLButtonElement>('[data-testid="forgot-password-submit"]')?.click();
  await tick();
  await Promise.resolve();
  await tick();
}

describe('ForgotPasswordScreen', () => {
  it('carries the root test id, the app name and the way back it is given', () => {
    const { target } = mountScreen();

    expect(target.querySelector('[data-testid="admin-forgot-password"]')).not.toBeNull();
    expect(target.textContent).toContain('adminApp.login.appSubtitle');
    expect(target.querySelector('[data-testid="forgot-password-return"]')?.getAttribute('href')).toBe('/admin/login');
  });

  it('asks once for the trimmed address from the forgot-password origin, and then opens the "email sent" address it is given', async () => {
    const { target, sendEntryLink } = mountScreen();

    await submit(target, `  ${ADDRESS} `);

    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(sendEntryLink).toHaveBeenCalledWith({ origin: 'forgotPassword', email: ADDRESS });
    expect(goto).toHaveBeenCalledWith('/admin/email-sent');
  });

  it('stays on a request refused over the per-caller limit, and names the wait at the field, which takes focus', async () => {
    const { target, sendEntryLink } = mountScreen({ retryAfterSeconds: 61 });

    await submit(target, ADDRESS);
    await tick();

    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
    expect(target.querySelector('[data-testid="forgot-password-email-error"]')?.textContent).toContain(
      'common.account.tooManyAttempts {"minutes":2}'
    );
    expect(document.activeElement).toBe(target.querySelector('[data-testid="forgot-password-email"]'));
    expect(target.querySelector<HTMLInputElement>('[data-testid="forgot-password-email"]')?.value).toBe(ADDRESS);
  });

  it('takes another press once the navigation to the "email sent" address has failed', async () => {
    const { target, sendEntryLink } = mountScreen();
    goto.mockRejectedValueOnce(new Error('The navigation was aborted.'));

    await submit(target, ADDRESS).catch(() => undefined);
    await submit(target, ADDRESS);

    expect(sendEntryLink).toHaveBeenCalledTimes(2);
    expect(goto).toHaveBeenCalledTimes(2);
  });

  it('asks nothing for an empty address, and says why', async () => {
    const { target, sendEntryLink } = mountScreen();

    await submit(target, '');

    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(target.querySelector('[data-testid="forgot-password-email-error"]')?.textContent).toContain(
      'common.account.emailRequired'
    );
  });
});
