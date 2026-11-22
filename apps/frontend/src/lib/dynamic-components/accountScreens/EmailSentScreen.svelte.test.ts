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
const REQUESTED = 'common.account.emailSent.resendRequested';

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

type ResendAnswer = { retryAfterSeconds: number } | undefined;

/** A repeat whose answer the test gives itself, with `answer`, while the press waits on it. */
function pendingResend() {
  let resolveAnswer: ((value: ResendAnswer) => void) | undefined;
  const promise = new Promise<ResendAnswer>((resolve) => (resolveAnswer = resolve));
  function answer(value: ResendAnswer): void {
    resolveAnswer?.(value);
  }
  return { promise, answer };
}

/** Mount the screen as the Admin App's page renders it. `answer` is what the repeat answers, or a promise of it. */
function mountScreen(request: EntryHeldRequest | undefined, answer: ResendAnswer | Promise<ResendAnswer> = undefined) {
  const resendEntryLink = vi.fn(() => Promise.resolve(answer));
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

/** What the screen's polite status region says. */
function statusText(target: HTMLElement): string | undefined {
  return target.querySelector('[data-testid="email-sent-status"]')?.textContent?.trim();
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

  it('names the wait by the button when the repeat was refused over the per-caller limit, and says no email was requested', async () => {
    const pending = pendingResend();
    const { target, resendEntryLink } = mountScreen(recoveryRequest(), pending.promise);
    const refused = '[data-testid="email-sent-resend-refused"]';
    expect(target.querySelector(refused)).toBeNull();

    await vi.advanceTimersByTimeAsync(RESEND_WAIT_SECONDS * 1000 + 1000);
    flushSync();
    const statusBeforePress = statusText(target);
    target.querySelector<HTMLButtonElement>('[data-testid="email-sent-resend"]')?.click();
    await vi.advanceTimersByTimeAsync(0);
    flushSync();

    expect(resendEntryLink).toHaveBeenCalledTimes(1);
    expect(statusText(target)).toBe(statusBeforePress);
    expect(statusText(target)).not.toContain(REQUESTED);

    pending.answer({ retryAfterSeconds: 120 });
    await vi.advanceTimersByTimeAsync(0);
    flushSync();

    const sentence = target.querySelector(refused);
    expect(sentence?.getAttribute('role')).toBe('alert');
    expect(sentence?.textContent).toContain('common.account.tooManyAttempts {"minutes":2}');
    expect(statusText(target)).toBe('');
    expect(target.querySelector(FRAME)).not.toBeNull();
  });

  it('says a new email was requested only once a repeat that is not refused has been answered', async () => {
    const pending = pendingResend();
    const { target } = mountScreen(recoveryRequest(), pending.promise);

    await vi.advanceTimersByTimeAsync(RESEND_WAIT_SECONDS * 1000 + 1000);
    flushSync();
    const statusBeforePress = statusText(target);
    target.querySelector<HTMLButtonElement>('[data-testid="email-sent-resend"]')?.click();
    await vi.advanceTimersByTimeAsync(0);
    flushSync();

    expect(statusText(target)).toBe(statusBeforePress);
    expect(statusText(target)).not.toContain(REQUESTED);

    pending.answer(undefined);
    await vi.advanceTimersByTimeAsync(0);
    flushSync();

    expect(statusText(target)).toBe(REQUESTED);
    expect(target.querySelector('[data-testid="email-sent-resend-refused"]')).toBeNull();
  });
});
