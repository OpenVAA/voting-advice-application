/**
 * The shared "email sent" screen, mounted with the Admin App's props over fake contexts: it renders nothing without a held request, shows the held request's wording and address under the root id it is given, leads back only to an address screen it is given, and repeats the held request through the function it is given.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_WAIT_SECONDS } from '$lib/auth/entryFlow';
import type { EntryHeldRequest } from '$lib/auth/entryFlow';

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
    getRoute: { current: (route: string) => `/route/${route}` },
    track: () => undefined
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

const EmailSentScreen = (await import('./EmailSentScreen.svelte')).default;

const ADDRESS = 'admin@example.test';
const SETTLED_AT = Date.UTC(2030, 0, 1, 12, 0, 0);
const FRAME = '[data-testid="admin-email-sent"]';

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(SETTLED_AT);
});

afterEach(() => {
  for (const fn of teardown) fn();
  teardown = [];
  vi.useRealTimers();
  document.body.innerHTML = '';
});

/** A request the forgot-password page made, settled when the fake clock started. */
function recoveryRequest(given: Partial<EntryHeldRequest> = {}): EntryHeldRequest {
  return {
    origin: 'forgotPassword',
    email: ADDRESS,
    wording: 'recovery',
    settledAt: SETTLED_AT,
    askedAgain: false,
    ...given
  };
}

/** Mount the screen as the Admin App's page renders it. */
function mountScreen(request: EntryHeldRequest | undefined) {
  const resendEntryLink = vi.fn(async () => undefined);
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(EmailSentScreen, {
    target,
    props: {
      appName: 'adminApp.login.appSubtitle',
      request,
      resendEntryLink,
      addressScreenHrefs: { forgotPassword: '/admin/forgot-password' },
      returnHref: '/admin/login',
      testId: 'admin-email-sent'
    }
  });
  teardown.push(() => unmount(component));
  flushSync();
  return { target, resendEntryLink };
}

describe('EmailSentScreen', () => {
  it('renders nothing without a held request', () => {
    const { target } = mountScreen(undefined);

    expect(target.querySelector(FRAME)).toBeNull();
  });

  it('shows the held request’s wording and address under the root id it is given', () => {
    const { target } = mountScreen(recoveryRequest());

    const frame = target.querySelector(FRAME);
    expect(frame?.getAttribute('data-wording')).toBe('recovery');
    expect(frame?.getAttribute('data-address')).toBe('shown');
    expect(target.querySelector('[data-testid="email-sent-intro"]')?.textContent).toContain(ADDRESS);
    expect(target.textContent).toContain('adminApp.login.appSubtitle');
  });

  it('leads back to the address screen it is given for the request’s origin, and the way back it is given', () => {
    const { target } = mountScreen(recoveryRequest());

    expect(target.querySelector('[data-testid="email-sent-change-address"]')?.getAttribute('href')).toBe(
      '/admin/forgot-password'
    );
    expect(target.querySelector('[data-testid="email-sent-return"]')?.getAttribute('href')).toBe('/admin/login');
  });

  it('renders no link back for an origin it is given no screen for', () => {
    const { target } = mountScreen(recoveryRequest({ origin: 'signIn', wording: 'signIn' }));

    expect(target.querySelector(FRAME)).not.toBeNull();
    expect(target.querySelector('[data-testid="email-sent-change-address"]')).toBeNull();
  });

  it('repeats the held request through the function it is given once the wait has passed', async () => {
    const { target, resendEntryLink } = mountScreen(recoveryRequest());

    await vi.advanceTimersByTimeAsync(RESEND_WAIT_SECONDS * 1000 + 1000);
    flushSync();
    target.querySelector<HTMLButtonElement>('[data-testid="email-sent-resend"]')?.click();
    flushSync();

    expect(resendEntryLink).toHaveBeenCalledTimes(1);
  });
});
