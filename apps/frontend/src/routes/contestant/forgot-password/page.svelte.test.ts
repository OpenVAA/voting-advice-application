/**
 * The forgot-password page, mounted for real with its real email field against a fake contestant context.
 *
 * The fake context's `t` returns its key, and its `getRoute` builds routes with the real `buildRoute` from an empty set of route params. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The frame** — the page's marker, a heading that can take focus, the sentence above the form and the way back to the sign-in screen.
 * 2. **The form** — one form declared as a post with the one address field, filled from the `email` search parameter of the page's address, and a submit button outside it that is tied to it and unavailable until the page has mounted.
 * 3. **The main button** — nothing is asked for an empty or an unusable address, and the field says why; otherwise a recovery link is asked for once with the trimmed address, and the "email sent" screen opens when the request has settled, whatever it settled as.
 * 4. **What the page never shows** — no message about what became of the request.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

const { goto, sendEntryLink } = vi.hoisted(() => ({ goto: vi.fn(), sendEntryLink: vi.fn() }));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  sendEntryLink,
  appSettings: { contestantApp: { entityTypes: ['candidate'] } }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: context.t, darkMode: { current: false } })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined },
    topBarSettings: { use: () => undefined }
  })
}));

// jsdom ships no `window.matchMedia`, and `svelte/motion` reads it when it is imported. The page reaches it through the `$layouts/main` barrel, so without this the file fails at import. The stub answers "no preference".
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

const ForgotPasswordPage = (await import('./+page.svelte')).default;

const FRAME = '[data-testid="contestant-forgot-password"]';
const EMAIL = '[data-testid="forgot-password-email"]';
const EMAIL_ERROR = '[data-testid="forgot-password-email-error"]';
const SUBMIT = '[data-testid="forgot-password-submit"]';
const RETURN = '[data-testid="forgot-password-return"]';

const ADDRESS = 'someone@example.test';

const SIGN_IN_ROUTE = buildRoute({ route: 'ContestantAppSignIn' }, { params: {} });
const EMAIL_SENT_ROUTE = buildRoute({ route: 'ContestantAppEmailSent' }, { params: {} });

let teardown: Array<() => void> = [];

/** Set the address the stubbed `page` answers with. The application's type narrows the pathname to the route tree, which the stub's plain member does not. */
function setAddress(address: string): void {
  (page as { url: URL }).url = new URL(address);
}

beforeEach(() => {
  setAddress('http://localhost/en/contestant/forgot-password');
  goto.mockResolvedValue(undefined);
  sendEntryLink.mockResolvedValue(undefined);
  // Every message shown is also logged as an error: keep the log out of the test output.
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  setAddress('http://localhost/');
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** Mount the page without running its effects, as the server's markup is before the page's script has run. */
function renderUnmounted(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ForgotPasswordPage, { target, props: {} as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Mount the page and run its effects. */
function render(): HTMLElement {
  const target = renderUnmounted();
  flushSync();
  return target;
}

function one<TElement extends HTMLElement = HTMLElement>(target: ParentNode, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found.length, `exactly one ${selector} should be rendered`).toBe(1);
  return found[0];
}

/** Type a value into the address field, as a user does. */
function type(target: HTMLElement, value: string): void {
  const input = one<HTMLInputElement>(target, EMAIL);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

function press(target: HTMLElement, selector: string): void {
  one(target, selector).click();
  flushSync();
}

/** Submit the form as Enter in the field does, without a press of the button. */
function submit(target: HTMLElement): Event {
  const event = new Event('submit', { bubbles: true, cancelable: true });
  one(target, 'form').dispatchEvent(event);
  flushSync();
  return event;
}

/** Let awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  flushSync();
}

/** The sentence of an inline message, without the emoji before it. */
function messageOf(message: HTMLElement): string | undefined {
  return message.textContent?.replace('dynamic.error.heroEmoji', '').trim();
}

/** The label of a button: the last text in it, after the spinner's own label while it is loading. */
function labelOf(button: HTMLElement): string | undefined {
  return one(button, '.uc-first').textContent?.trim();
}

describe('the frame', () => {
  it("carries the page's marker", () => {
    const target = render();
    expect(one(target, FRAME)).toBeTruthy();
  });

  it("has the page's first-level heading, which can take focus, under the app's name", () => {
    const target = render();
    const heading = one(target, 'h1');
    expect(heading.textContent?.trim()).toBe('contestantApp.resetPassword.title');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(target.textContent).toContain('dynamic.contestantAppName.');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it('says what the address is for', () => {
    const target = render();
    expect(target.textContent).toContain('contestantApp.resetPassword.ingress');
  });

  it('leads back to the sign-in screen', () => {
    const target = render();
    const link = one(target, RETURN);
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(link.textContent?.trim()).toBe('common.return');
  });
});

describe('the form', () => {
  it('is one form declared as a post, with validation left to the page', () => {
    const target = render();
    const form = one<HTMLFormElement>(target, 'form');
    expect(form.getAttribute('method')).toBe('POST');
    expect(form.noValidate).toBe(true);
    expect(form.id).not.toBe('');
  });

  it('holds the one address field, with a visible label and no placeholder', () => {
    const target = render();
    const form = one(target, 'form');
    const email = one<HTMLInputElement>(form, EMAIL);
    expect(email.type).toBe('email');
    expect(email.name).toBe('email');
    expect(email.getAttribute('autocomplete')).toBe('email');
    expect(email.getAttribute('placeholder')).toBeNull();
    expect(one(target, `label[for="${email.id}"]`).textContent?.trim()).toBe('common.email');
    expect(form.querySelectorAll('input').length, 'the form holds the address field and nothing else').toBe(1);
  });

  it('leaves the field empty when the address has no email parameter', () => {
    const target = render();
    expect(one<HTMLInputElement>(target, EMAIL).value).toBe('');
  });

  it("fills the field from the address's email parameter, as it is written there", () => {
    setAddress(
      `http://localhost/en/contestant/forgot-password?email=${encodeURIComponent('someone+tag@example.test')}`
    );
    const target = render();
    expect(one<HTMLInputElement>(target, EMAIL).value).toBe('someone+tag@example.test');
  });

  it('fills the field before the page has mounted, so it is in the markup the server renders', () => {
    setAddress(`http://localhost/en/contestant/forgot-password?email=${encodeURIComponent(ADDRESS)}`);
    const target = renderUnmounted();
    expect(one<HTMLInputElement>(target, EMAIL).value).toBe(ADDRESS);
  });

  it('asks for a recovery link with the filled address once the button is pressed, and not before', async () => {
    setAddress(`http://localhost/en/contestant/forgot-password?email=${encodeURIComponent(ADDRESS)}`);
    const target = render();
    await settle();
    expect(sendEntryLink, 'a filled field asks for nothing by itself').not.toHaveBeenCalled();
    press(target, SUBMIT);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(sendEntryLink).toHaveBeenCalledWith({ origin: 'forgotPassword', email: ADDRESS });
  });

  it("has its submit button outside it, among the page's actions, tied to it by its id", () => {
    const target = render();
    const form = one<HTMLFormElement>(target, 'form');
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('submit');
    expect(button.getAttribute('form')).toBe(form.id);
    expect(form.contains(button)).toBe(false);
    expect(button.closest('section')?.getAttribute('aria-label')).toBe('common.primaryActions');
    expect(button.textContent?.trim()).toBe('contestantApp.resetPassword.sendLink');
  });

  it('has a submit button that is natively disabled until the page has mounted', () => {
    const target = renderUnmounted();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    flushSync();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
  });
});

describe('the main button', () => {
  it('asks for nothing with an empty field, and says at the field that an address is needed', async () => {
    const target = render();
    press(target, SUBMIT);
    await settle();
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    const email = one<HTMLInputElement>(target, EMAIL);
    const error = one(target, EMAIL_ERROR);
    expect(messageOf(error)).toBe('contestantApp.login.emailRequired');
    expect(error.getAttribute('role')).toBe('alert');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(email);
  });

  it('takes a field that holds only spaces as empty', async () => {
    const target = render();
    type(target, '   ');
    press(target, SUBMIT);
    await settle();
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(messageOf(one(target, EMAIL_ERROR))).toBe('contestantApp.login.emailRequired');
  });

  it('asks for nothing with text that is no address, and says so at the field', async () => {
    const target = render();
    type(target, 'not-an-address');
    press(target, SUBMIT);
    await settle();
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    const email = one<HTMLInputElement>(target, EMAIL);
    expect(messageOf(one(target, EMAIL_ERROR))).toBe('components.input.error.invalidEmail');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(email);
  });

  it("removes the field's error on the next edit", () => {
    const target = render();
    press(target, SUBMIT);
    expect(target.querySelector(EMAIL_ERROR)).not.toBeNull();
    type(target, 's');
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
  });

  it('asks for a recovery link once, from this page, with the address trimmed', () => {
    const target = render();
    type(target, `  ${ADDRESS} `);
    press(target, SUBMIT);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(sendEntryLink).toHaveBeenCalledWith({ origin: 'forgotPassword', email: ADDRESS });
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
  });

  it('does the same for a submit of the form without a press of the button, and never posts the form', () => {
    const target = render();
    type(target, ADDRESS);
    const event = submit(target);
    expect(event.defaultPrevented, 'the form is never posted').toBe(true);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(sendEntryLink).toHaveBeenCalledWith({ origin: 'forgotPassword', email: ADDRESS });
  });

  it('reads "Loading…" and takes no second submit while its request runs, and leaves only then', async () => {
    const settlers = new Array<() => void>();
    sendEntryLink.mockReturnValue(new Promise<void>((resolve) => settlers.push(resolve)));
    const target = render();
    type(target, ADDRESS);
    press(target, SUBMIT);
    await settle();
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(labelOf(button)).toBe('common.loading');
    expect(button.disabled).toBe(true);
    press(target, SUBMIT);
    submit(target);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(goto, 'the page stays until the request has settled').not.toHaveBeenCalled();

    settlers[0]();
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(EMAIL_SENT_ROUTE);
  });

  it('opens the "email sent" screen whatever the request resolved to', async () => {
    sendEntryLink.mockResolvedValue({ type: 'failure' });
    const target = render();
    type(target, ADDRESS);
    press(target, SUBMIT);
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(EMAIL_SENT_ROUTE);
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
  });
});

describe('what the page never shows', () => {
  it.each([
    ['nothing', undefined],
    ['a success', { type: 'success' }],
    ['a failure', { type: 'failure' }]
  ])('shows no message about the request when it resolved to %s', async (_name, resolved) => {
    sendEntryLink.mockResolvedValue(resolved);
    const target = render();
    const before = target.querySelectorAll('[role="alert"], [role="status"], [data-testid*="success"]').length;
    type(target, ADDRESS);
    press(target, SUBMIT);
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(before, 'the page starts with no message').toBe(0);
    expect(target.querySelectorAll('[role="alert"], [role="status"], [data-testid*="success"]').length).toBe(0);
    expect(target.querySelector('[data-testid="forgot-password-error"]')).toBeNull();
    // The form is still the page's only one: the page shows no other state of itself.
    expect(one(target, 'form').contains(one(target, EMAIL))).toBe(true);
  });
});
