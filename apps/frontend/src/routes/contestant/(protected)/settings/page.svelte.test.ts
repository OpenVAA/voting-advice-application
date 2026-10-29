/**
 * The settings page of the Contestant App, mounted for real against a fake contestant context, a fake component context and a stubbed endpoint.
 *
 * Messages render as their keys, a message with a payload as its key followed by the payload, so a case reads which sentence is shown and not its words.
 *
 * What this file holds:
 *
 * 1. **A proved address** — the account's address in the locked field with its description, nothing of a pending address, and the address given to the change-password form as its user name.
 * 2. **An address awaiting its link** — the pending address in the locked field with the sentence that it has not been confirmed, Send again with its count and status, and no user name for the change-password form.
 * 3. **Another address** — "Use another email address" shows the address fields and the save button; an incomplete pair sends nothing; a valid pair is saved and the loads rerun; an address another account holds is told at the address field; any other failure is told under the fields.
 * 4. **No address** — no address anywhere.
 * 5. **The way back** — Return leads to the app's root, which names no entity: the page is the user's own and is reached from every state, with no entity, one or several.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_WAIT_SECONDS } from '$lib/contestant/entryFlow';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';

const { box, context, fetchMock, invalidateAll } = vi.hoisted(() => {
  /** Reads the user-level data; pointed at a reactive value once the module's runes are available. */
  const box = { readUser: (): BasicUserData | undefined => undefined };
  const invalidateAll = vi.fn();
  const fetchMock = vi.fn();
  /** A message with a payload renders as its key followed by the payload. */
  function t(key: string, payload?: Record<string, unknown>): string {
    return payload ? `${key} ${JSON.stringify(payload)}` : key;
  }
  const context = {
    t,
    getRoute: { current: (route: string) => `/route/${route}` },
    setPassword: vi.fn(),
    get user() {
      return box.readUser();
    }
  };
  return { box, context, fetchMock, invalidateAll };
});

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: context.t,
    locale: 'en',
    locales: ['en'],
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined }
  })
}));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  invalidateAll
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the `$layouts/main` barrel loads the header. The stub answers "no preference".
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

const Page = (await import('./+page.svelte')).default;

/** The user-level data the fake context answers with, reactive as the real accessor is. */
let currentUser = $state.raw<BasicUserData | undefined>(undefined);
box.readUser = () => currentUser;

const ENDPOINT = '/api/contestant/identity-provider';
const PENDING = 'waiting@example.org';
const PROVED = 'proved@example.org';
const TYPED = 'typed@example.org';

const SEL = {
  email: '[data-testid="settings-email"]',
  resend: '[data-testid="settings-email-pending-resend"]',
  countdown: '[data-testid="settings-email-pending-countdown"]',
  status: '[data-testid="settings-email-pending-status"]',
  change: '[data-testid="settings-email-pending-change"]',
  save: '[data-testid="settings-email-save"]',
  error: '[data-testid="settings-email-error"]',
  entryEmail: '[data-testid="email-entry-email"]',
  entryConfirmation: '[data-testid="email-entry-confirmation"]',
  entryEmailError: '[data-testid="email-entry-email-error"]',
  username: 'input[autocomplete="username"]',
  return: '[data-testid="settings-return"]'
};

const KEY = {
  emailDescription: 'contestantApp.settings.emailDescription',
  emailPendingInfo: 'contestantApp.settings.emailPendingInfo',
  saveEmail: 'contestantApp.settings.saveEmail',
  changeAddress: 'contestantApp.emailSent.changeAddress',
  resend: 'contestantApp.emailSent.resend',
  resendRequested: 'contestantApp.emailSent.resendRequested',
  resendReady: 'contestantApp.emailSent.resendReady',
  emailInUse: 'contestantApp.identityProvider.emailInUse',
  saveFailed: 'contestantApp.identityProvider.saveFailed'
};

/** User-level data, changed by `overrides`. */
function userWith(overrides: Partial<Omit<BasicUserData, 'settings'>> = {}): BasicUserData {
  return {
    id: 'user-1',
    settings: {},
    email: '',
    username: '',
    termsOfUseAccepted: '2026-01-01T00:00:00Z',
    passwordSet: false,
    addressState: 'none',
    pendingEmail: null,
    ownOrganizationUnnamed: false,
    pendingEmailTaken: false,
    ...overrides
  };
}

const PENDING_USER = userWith({ addressState: 'pending', pendingEmail: PENDING });
const PROVED_USER = userWith({ addressState: 'proved', email: PROVED, username: PROVED, passwordSet: true });

/** The endpoint answering `result`. */
function answer(result: string): Response {
  return new Response(JSON.stringify({ result }), { status: 200, headers: { 'content-type': 'application/json' } });
}

let teardown: Array<() => void> = [];

beforeEach(() => {
  invalidateAll.mockResolvedValue(undefined);
  fetchMock.mockResolvedValue(answer('saved'));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

/** Mount the page for a user. */
function render(user: BasicUserData | undefined): HTMLElement {
  currentUser = user;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(Page, { target, props: {} });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

function one<TElement extends Element = HTMLElement>(target: ParentNode, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found, `exactly one ${selector}`).toHaveLength(1);
  return found[0];
}

/** The locked address control, which carries the test id itself. */
function addressControl(target: HTMLElement): HTMLInputElement {
  return one<HTMLInputElement>(target, SEL.email);
}

/** The section of the address: the locked control with its label and info line, and what goes with it. */
function addressSection(target: HTMLElement): HTMLElement {
  return addressControl(target).closest('section')!;
}

/** Let the awaited calls of a handler settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  flushSync();
}

async function press(target: HTMLElement, selector: string): Promise<void> {
  const element = one(target, selector);
  element.focus();
  element.click();
  await settle();
}

/** Type into a control the way a browser reports it. */
function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** The bodies of the requests made to the endpoint. */
function requests(): Array<unknown> {
  return fetchMock.mock.calls.map((call) => {
    const [url, init] = call as [string, RequestInit];
    expect(url).toBe(ENDPOINT);
    return JSON.parse(String(init.body));
  });
}

describe('the settings page — a proved address', () => {
  it('shows the account’s address with its description, and nothing of a pending address', () => {
    const target = render(PROVED_USER);

    expect(addressControl(target).value).toBe(PROVED);
    expect(addressSection(target).textContent).toContain(KEY.emailDescription);
    expect(target.textContent).not.toContain(KEY.emailPendingInfo);
    for (const selector of [SEL.resend, SEL.status, SEL.change, SEL.save, SEL.entryEmail])
      expect(target.querySelector(selector), selector).toBeNull();
  });

  it('gives the change-password form the account’s address as its user name', () => {
    const target = render(PROVED_USER);

    expect(one<HTMLInputElement>(target, SEL.username).value).toBe(PROVED);
  });
});

describe('the settings page — an address awaiting its link', () => {
  it('shows the pending address in the locked field, saying it has not been confirmed, with Send again and Use another email address', () => {
    const target = render(PENDING_USER);

    const control = addressControl(target);
    expect(control.value).toBe(PENDING);
    expect(addressSection(target).textContent).toContain(KEY.emailPendingInfo);
    expect(addressSection(target).textContent).not.toContain(KEY.emailDescription);
    expect(control.labels?.[0]?.textContent).toContain('common.email');
    const resend = one(target, SEL.resend);
    expect(resend.textContent).toContain(KEY.resend);
    expect(resend.hasAttribute('aria-disabled')).toBe(false);
    expect(one(target, SEL.change).textContent).toContain(KEY.changeAddress);
    const status = one(target, SEL.status);
    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent?.trim()).toBe('');
    expect(target.querySelector(SEL.entryEmail)).toBeNull();
    expect(target.querySelector(SEL.save)).toBeNull();
  });

  it('gives the change-password form no user name', () => {
    const target = render(PENDING_USER);

    expect(target.querySelector(SEL.username)).toBeNull();
    expect(target.innerHTML).not.toContain('autocomplete="username"');
  });

  it('asks for the link again, announces it, and is unavailable but focused and described by its count until the count ends', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    fetchMock.mockResolvedValue(answer('sent'));
    const target = render(PENDING_USER);

    await press(target, SEL.resend);

    expect(requests()).toEqual([{ intent: 'resend' }]);
    const resend = one(target, SEL.resend);
    expect(document.activeElement).toBe(resend);
    expect(resend.getAttribute('aria-disabled')).toBe('true');
    const countdown = one(target, SEL.countdown);
    expect(resend.getAttribute('aria-describedby')).toBe(countdown.id);
    expect(resend.contains(countdown), 'the count is inside Send again').toBe(true);
    expect(countdown.textContent).toContain('contestantApp.emailSent.resendIn');
    expect(countdown.textContent).toContain(`"seconds":${RESEND_WAIT_SECONDS}`);
    expect(one(target, SEL.status).textContent?.trim()).toBe(KEY.resendRequested);

    await press(target, SEL.resend);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(RESEND_WAIT_SECONDS * 1000);
    flushSync();
    expect(one(target, SEL.resend).hasAttribute('aria-disabled')).toBe(false);
    expect(target.querySelector(SEL.countdown)).toBeNull();
    expect(one(target, SEL.status).textContent?.trim()).toBe(KEY.resendReady);
  });
});

describe('the settings page — another address', () => {
  it('shows the address fields and the save button in place, with focus on the first field, and keeps the pending address until a new one is saved', async () => {
    const target = render(PENDING_USER);

    await press(target, SEL.change);

    expect(document.activeElement).toBe(one(target, SEL.entryEmail));
    expect(one(target, SEL.save).textContent).toContain(KEY.saveEmail);
    expect(one<HTMLButtonElement>(target, SEL.save).getAttribute('type')).toBe('submit');
    expect(target.querySelector(SEL.change)).toBeNull();
    expect(addressControl(target).value).toBe(PENDING);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends nothing for a pair of fields in error', async () => {
    const target = render(PENDING_USER);
    await press(target, SEL.change);

    type(one<HTMLInputElement>(target, SEL.entryEmail), TYPED);
    type(one<HTMLInputElement>(target, SEL.entryConfirmation), 'other@example.org');
    await press(target, SEL.save);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
  });

  it('saves a valid address, reruns the loads and shows the address the loads read as pending', async () => {
    const target = render(PENDING_USER);
    await press(target, SEL.change);

    type(one<HTMLInputElement>(target, SEL.entryEmail), TYPED);
    type(one<HTMLInputElement>(target, SEL.entryConfirmation), TYPED);
    await press(target, SEL.save);

    expect(requests()).toEqual([{ intent: 'save', email: TYPED }]);
    expect(invalidateAll).toHaveBeenCalledTimes(1);

    currentUser = userWith({ addressState: 'pending', pendingEmail: TYPED });
    flushSync();
    expect(addressControl(target).value).toBe(TYPED);
    expect(target.querySelector(SEL.entryEmail)).toBeNull();
    one(target, SEL.change);
  });

  it('tells an address another account holds at the address field, with focus there, and reruns nothing', async () => {
    fetchMock.mockResolvedValue(answer('in-use'));
    const target = render(PENDING_USER);
    await press(target, SEL.change);

    type(one<HTMLInputElement>(target, SEL.entryEmail), TYPED);
    type(one<HTMLInputElement>(target, SEL.entryConfirmation), TYPED);
    await press(target, SEL.save);
    await settle();

    const error = one(target, SEL.entryEmailError);
    expect(error.getAttribute('data-reason')).toBe('in-use');
    expect(error.textContent).toContain(KEY.emailInUse);
    expect(document.activeElement).toBe(one(target, SEL.entryEmail));
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(target.querySelector(SEL.error)).toBeNull();
  });

  it('tells any other failure under the fields, keeps what was typed and reruns nothing', async () => {
    fetchMock.mockResolvedValue(answer('failed'));
    const target = render(PENDING_USER);
    await press(target, SEL.change);

    type(one<HTMLInputElement>(target, SEL.entryEmail), TYPED);
    type(one<HTMLInputElement>(target, SEL.entryConfirmation), TYPED);
    await press(target, SEL.save);

    const error = one(target, SEL.error);
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain(KEY.saveFailed);
    expect(one<HTMLInputElement>(target, SEL.entryEmail).value).toBe(TYPED);
    expect(invalidateAll).not.toHaveBeenCalled();
  });
});

describe('the settings page — no address', () => {
  it('shows no address, nothing of a pending address and no user name', () => {
    const target = render(userWith({ addressState: 'none' }));

    expect(addressControl(target).value).toBe('');
    for (const selector of [SEL.resend, SEL.status, SEL.change, SEL.username])
      expect(target.querySelector(selector), selector).toBeNull();
  });
});

describe('the settings page — the way back', () => {
  it.each([
    ['a proved address', PROVED_USER],
    ['an address awaiting its link', PENDING_USER],
    ['no address', userWith({ addressState: 'none' })]
  ] as const)('leads Return to the app root, for %s', (_, user) => {
    const target = render(user);

    expect(one<HTMLAnchorElement>(target, SEL.return).getAttribute('href')).toBe('/route/ContestantAppHome');
  });
});
