/**
 * The password-reset page, mounted for real with the real password setter and support block against a fake contestant context.
 *
 * The page is given the data its server load returns: the address of the signed-in user. The fake context's `t` returns its key, and its `getRoute` builds routes with the real `buildRoute` from an empty set of route params. `$app/state` is replaced by a page whose address holds a `code` and a link `type`, and which counts every read of it. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The frame** — the page's marker, a heading that can take focus, and the support block.
 * 2. **The account** — the address as text under its label and in the form's user-name field, and neither where the load returned no address.
 * 3. **The main button** — a submit button outside the form, tied to it, and unavailable only until the page has mounted and while a save runs.
 * 4. **A press with a password the form does not accept** saves nothing, and the field says why.
 * 5. **A failed save** is shown with its own sentence, and the form stays with what was typed.
 * 6. **A saved password** leaves for the app root, once, with the loads rerun.
 * 7. **The address is not read** — the page looks at no part of the URL.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

const { goto, setPassword, addressReads } = vi.hoisted(() => ({
  goto: vi.fn(),
  setPassword: vi.fn(),
  addressReads: { count: 0 }
}));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

// An address that names a code and a link type, as a link somebody rewrote would. Every read of it is counted.
vi.mock('$app/state', () => ({
  page: {
    get url() {
      addressReads.count += 1;
      return new URL('http://localhost/contestant/password-reset?code=abc&type=recovery');
    },
    data: {},
    params: {}
  }
}));

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  setPassword,
  appSettings: { admin: { email: 'support@example.test' }, contestantApp: { entityTypes: ['candidate'] } }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({ getContestantContext: () => context }));

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

// jsdom ships no `window.matchMedia`, and `svelte/motion` reads it when it is imported. The page reaches it through the `$layouts/main` barrel and through the rule list's progress bar, so without this the file fails at import. The stub answers "no preference".
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

const PasswordResetPage = (await import('./+page.svelte')).default;

/** A made-up address of the signed-in user. */
const ADDRESS = 'person.with-a-long-name@example.test';

/** A password that satisfies every rule the form lists, and another. */
const VALID_PASSWORD = 'Abcdef1!';
const OTHER_VALID_PASSWORD = 'Zyxwvu9?';

/** A password that breaks the length rule and three of the character rules. */
const RULE_BREAKING_PASSWORD = 'abc';

const FRAME = '[data-testid="contestant-password-reset"]';
const SUBMIT = '[data-testid="set-password-submit"]';
const SAVE_ERROR = '[data-testid="password-reset-error"]';
const SHOWN_ADDRESS = '[data-testid="password-reset-email"]';
const PASSWORD = '[data-testid="password-setter-password"] input';
const CONFIRMATION = '[data-testid="password-setter-confirmation"] input';
const PASSWORD_ERROR = '[data-testid="password-setter-password-error"]';
const SUPPORT = '[data-testid="contestant-contact-support"]';

const HOME_ROUTE = buildRoute({ route: 'ContestantAppHome' }, { params: {} });

let teardown: Array<() => void> = [];

beforeEach(() => {
  addressReads.count = 0;
  goto.mockResolvedValue(undefined);
  setPassword.mockResolvedValue({ type: 'success' });
  // Every message shown is also logged as an error: keep the log out of the test output.
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/**
 * Mount the page over the data of its load, without running its effects, as the server's markup is before the page's script has run.
 * @param email - The address the load returned. With no argument, a user's address; an explicit `undefined` is an account that has none.
 */
function renderUnmounted(...email: [] | [string | undefined]): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(PasswordResetPage, {
    target,
    props: { data: { email: email.length ? email[0] : ADDRESS } } as never
  });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Mount the page and run its effects. */
function render(...email: [] | [string | undefined]): HTMLElement {
  const target = renderUnmounted(...email);
  flushSync();
  return target;
}

function one<TElement extends Element = HTMLElement>(target: ParentNode, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found.length, `exactly one ${selector} should be rendered`).toBe(1);
  return found[0];
}

/** Type a value into a control, as a user does. */
function type(target: HTMLElement, selector: string, value: string): void {
  const input = one<HTMLInputElement>(target, selector);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** Type a password and the same password as its confirmation. */
function typeBoth(target: HTMLElement, password: string): void {
  type(target, PASSWORD, password);
  type(target, CONFIRMATION, password);
}

function press(target: HTMLElement, selector: string): void {
  one<HTMLElement>(target, selector).click();
  flushSync();
}

/** Let the submit handler's awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
  flushSync();
}

/** The sentence of an inline message, without the emoji before it. */
function messageOf(message: Element): string | undefined {
  return message.textContent?.replace('dynamic.error.heroEmoji', '').trim();
}

/** The label of a button: the last text in it, after the spinner's own label while it is loading. */
function labelOf(button: Element): string | undefined {
  return one(button, '.uc-first').textContent?.trim();
}

describe('the frame', () => {
  it("carries the page's marker", () => {
    const target = render();
    expect(one(target, FRAME)).toBeTruthy();
  });

  it("has the page's first-level heading, which can take focus, under the app's name", () => {
    const target = render();
    const heading = one<HTMLElement>(target, 'h1');
    expect(heading.textContent?.trim()).toBe('contestantApp.resetPassword.createNewPassword');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(target.textContent).toContain('dynamic.contestantAppName.');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it("offers support among the page's actions, as a plain button", () => {
    const target = render();
    const support = one(target, SUPPORT);
    expect(support.closest('section')?.getAttribute('aria-label')).toBe('common.primaryActions');
    expect(support.textContent?.trim()).toBe('contestantApp.common.contactSupport');
    expect(support.className).not.toContain('btn-base-300');
  });
});

describe('the account', () => {
  it('names the account by its address, as text under its label', () => {
    const target = render();
    const address = one(target, SHOWN_ADDRESS);
    expect(address.tagName).toBe('DD');
    expect(address.textContent?.trim()).toBe(ADDRESS);
    expect(address.getAttribute('translate')).toBe('no');
    expect(one(target, 'dt').textContent?.trim()).toBe('contestantApp.nothingToEdit.signedInAs');
  });

  it("hands the address to the form's user-name field, which is read-only and not rendered", () => {
    const target = render();
    const username = one<HTMLInputElement>(target, 'form input[name="username"]');
    expect(username.value).toBe(ADDRESS);
    expect(username.readOnly).toBe(true);
    expect(username.getAttribute('autocomplete')).toBe('username');
    expect(username.classList.contains('hidden')).toBe(true);
  });

  it('holds the address in the markup before the page has mounted', () => {
    const target = renderUnmounted();
    expect(one(target, SHOWN_ADDRESS).textContent?.trim()).toBe(ADDRESS);
    expect(one<HTMLInputElement>(target, 'form input[name="username"]').value).toBe(ADDRESS);
  });

  it('shows neither the label nor a user-name field for an account with no address', () => {
    const target = render(undefined);
    expect(target.querySelector(SHOWN_ADDRESS)).toBeNull();
    expect(target.querySelector('dt')).toBeNull();
    expect(target.querySelector('form input[name="username"]')).toBeNull();
    expect(one(target, PASSWORD)).toBeTruthy();
  });
});

describe('the main button', () => {
  it("is a submit button outside the form, among the page's actions, tied to the form by its id", () => {
    const target = render();
    const form = one<HTMLFormElement>(target, 'form');
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('submit');
    expect(form.id).not.toBe('');
    expect(button.getAttribute('form')).toBe(form.id);
    expect(form.contains(button)).toBe(false);
    expect(button.closest('section')?.getAttribute('aria-label')).toBe('common.primaryActions');
    expect(labelOf(button)).toBe('contestantApp.setPassword.setPassword');
  });

  it('is natively disabled until the page has mounted', () => {
    const target = renderUnmounted();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    flushSync();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
  });

  it('can be pressed, and keeps its label, whatever the fields hold', () => {
    const target = render();
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(button.disabled).toBe(false);
    typeBoth(target, RULE_BREAKING_PASSWORD);
    expect(button.disabled).toBe(false);
    expect(labelOf(button)).toBe('contestantApp.setPassword.setPassword');
    typeBoth(target, VALID_PASSWORD);
    expect(button.disabled).toBe(false);
    expect(labelOf(button)).toBe('contestantApp.setPassword.setPassword');
  });
});

describe('a press with a password the form does not accept', () => {
  it.each([
    ['both fields empty', '', ''],
    ['a password that breaks the rules', RULE_BREAKING_PASSWORD, RULE_BREAKING_PASSWORD]
  ])('saves nothing with %s, and says why at the password field', async (_name, password, confirmation) => {
    const target = render();
    type(target, PASSWORD, password);
    type(target, CONFIRMATION, confirmation);
    press(target, SUBMIT);
    await settle();
    expect(setPassword).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(one(target, PASSWORD_ERROR).getAttribute('role')).toBe('alert');
    expect(one(target, PASSWORD).getAttribute('aria-invalid')).toBe('true');
    expect(target.querySelector(SAVE_ERROR)).toBeNull();
  });

  it('never posts the form', () => {
    const target = render();
    const event = new Event('submit', { bubbles: true, cancelable: true });
    one(target, 'form').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('a failed save', () => {
  it.each([
    ['rejects', () => setPassword.mockRejectedValue(new Error('the service is down'))],
    ['resolves to something other than a success', () => setPassword.mockResolvedValue({ type: 'failure' })],
    ['resolves to nothing', () => setPassword.mockResolvedValue(undefined)]
  ])('is shown with its own sentence when the save %s, and the form stays', async (_name, arrange) => {
    arrange();
    const target = render();
    typeBoth(target, VALID_PASSWORD);
    press(target, SUBMIT);
    await settle();
    expect(setPassword).toHaveBeenCalledTimes(1);
    expect(goto).not.toHaveBeenCalled();
    const error = one(target, SAVE_ERROR);
    expect(messageOf(error)).toBe('contestantApp.setPassword.error');
    expect(error.getAttribute('role')).toBe('alert');
    expect(one<HTMLInputElement>(target, PASSWORD).value).toBe(VALID_PASSWORD);
    expect(one<HTMLInputElement>(target, CONFIRMATION).value).toBe(VALID_PASSWORD);
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(button.disabled).toBe(false);
    expect(labelOf(button)).toBe('contestantApp.setPassword.setPassword');
  });

  it('is cleared by the next press, which saves again', async () => {
    setPassword.mockRejectedValueOnce(new Error('the service is down'));
    const target = render();
    typeBoth(target, VALID_PASSWORD);
    press(target, SUBMIT);
    await settle();
    expect(target.querySelector(SAVE_ERROR)).not.toBeNull();

    typeBoth(target, OTHER_VALID_PASSWORD);
    press(target, SUBMIT);
    await settle();
    expect(setPassword).toHaveBeenCalledTimes(2);
    expect(setPassword).toHaveBeenLastCalledWith({ password: OTHER_VALID_PASSWORD });
    expect(target.querySelector(SAVE_ERROR)).toBeNull();
    expect(goto).toHaveBeenCalledTimes(1);
  });
});

describe('a saved password', () => {
  it('is saved once with what was typed, and the user leaves for the app root with the loads rerun', async () => {
    const target = render();
    typeBoth(target, VALID_PASSWORD);
    press(target, SUBMIT);
    await settle();
    expect(setPassword).toHaveBeenCalledTimes(1);
    expect(setPassword).toHaveBeenCalledWith({ password: VALID_PASSWORD });
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(HOME_ROUTE, { invalidateAll: true });
    expect(setPassword.mock.invocationCallOrder[0]).toBeLessThan(goto.mock.invocationCallOrder[0]);
    expect(target.querySelector(SAVE_ERROR)).toBeNull();
  });

  it('reads "Saving…" and takes no second press from the press until the navigation has ended', async () => {
    const saves = new Array<(result: unknown) => void>();
    const navigations = new Array<() => void>();
    setPassword.mockReturnValue(new Promise((resolve) => saves.push(resolve)));
    goto.mockReturnValue(new Promise<void>((resolve) => navigations.push(resolve)));
    const target = render();
    typeBoth(target, VALID_PASSWORD);
    press(target, SUBMIT);
    await settle();
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(labelOf(button)).toBe('common.saving');
    expect(button.disabled).toBe(true);
    one(target, 'form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(setPassword).toHaveBeenCalledTimes(1);
    expect(goto, 'the user stays until the password is saved').not.toHaveBeenCalled();

    saves[0]({ type: 'success' });
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(labelOf(button), 'the button keeps saving while the navigation runs').toBe('common.saving');
    expect(button.disabled).toBe(true);

    navigations[0]();
    await settle();
    expect(labelOf(button)).toBe('contestantApp.setPassword.setPassword');
  });
});

describe('the address is not read', () => {
  it('looks at no part of the URL: not when it is mounted, not for a save', async () => {
    const target = render();
    typeBoth(target, VALID_PASSWORD);
    press(target, SUBMIT);
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(addressReads.count).toBe(0);
  });

  it('saves through the one method that sets a password, whatever the URL holds', async () => {
    const target = render();
    typeBoth(target, VALID_PASSWORD);
    press(target, SUBMIT);
    await settle();
    expect(setPassword).toHaveBeenCalledWith({ password: VALID_PASSWORD });
    expect(goto).toHaveBeenCalledWith(HOME_ROUTE, { invalidateAll: true });
  });
});
