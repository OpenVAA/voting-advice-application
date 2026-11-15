/**
 * The screen that takes an email address for a registration code, mounted for real with its real fields against a fake contestant context.
 *
 * The fake context's `entryFlow` is reactive behind a getter and replaced whole on every write, as the real accessor is. Its `t` returns its key, and its `getRoute` builds routes with the real `buildRoute` from an empty set of route params. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **Without a valid code held** — no part of the screen is rendered, and the visitor is led to the registration page in place of this history entry.
 * 2. **The frame** — the screen's marker, a heading that can take focus and the sentence above the form.
 * 3. **The form** — one form with the two address fields, a submit button outside it that is tied to it, and nothing of the code in the document.
 * 4. **Continue** — nothing is sent for two fields that do not hold one usable address; otherwise a link is asked for once with the address and the held code, and the "email sent" screen opens when the request has settled.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { EntryFlow, EntryHeldCode, EntryHeldRequest } from '$lib/contestant/entryFlow';
import type { RouteOptions } from '$lib/routes';

const { goto, sendEntryLink } = vi.hoisted(() => ({ goto: vi.fn(), sendEntryLink: vi.fn() }));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

/** What the fake context holds. Replaced whole on every write, never changed in place. */
let heldFlow = $state.raw<EntryFlow | undefined>(undefined);

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  sendEntryLink,
  appSettings: { contestantApp: { entityTypes: ['candidate'] } },
  get entryFlow() {
    return heldFlow;
  }
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

const EmailEntryPage = (await import('./+page.svelte')).default;

const FRAME = '[data-testid="contestant-register-email"]';
const EMAIL = '[data-testid="email-entry-email"]';
const EMAIL_ERROR = '[data-testid="email-entry-email-error"]';
const CONFIRMATION = '[data-testid="email-entry-confirmation"]';
const CONFIRMATION_ERROR = '[data-testid="email-entry-confirmation-error"]';
const SUBMIT = '[data-testid="register-email-submit"]';
const RETURN = '[data-testid="register-email-return"]';

const ADDRESS = 'someone@example.test';
const HELD_CODE = 'a-held-code';

const REGISTER_ROUTE = buildRoute({ route: 'ContestantAppRegister' }, { params: {} });
const EMAIL_SENT_ROUTE = buildRoute({ route: 'ContestantAppEmailSent' }, { params: {} });

/** A link request made on the sign-in screen, which carries no code. */
const HELD_REQUEST: EntryHeldRequest = {
  origin: 'signIn',
  email: ADDRESS,
  wording: 'signIn',
  settledAt: 0,
  askedAgain: false
};

/** A flow that holds a checked code and nothing else. */
function flowWith(status: EntryHeldCode['status']): EntryFlow {
  return { code: { code: HELD_CODE, status } };
}

let teardown: Array<() => void> = [];

beforeEach(() => {
  heldFlow = undefined;
  goto.mockResolvedValue(undefined);
  sendEntryLink.mockResolvedValue(undefined);
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
 * Mount the page over a flow, without running its effects.
 * @param held - What the context holds.
 * @returns The element the page was mounted into.
 */
function renderUnmounted(held: EntryFlow | undefined): HTMLElement {
  heldFlow = held;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(EmailEntryPage, { target, props: {} as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/**
 * Mount the page over a flow and run its effects.
 * @param held - What the context holds. With no argument at all, a valid code; an explicit `undefined` is a context that holds nothing.
 */
function render(...held: [] | [EntryFlow | undefined]): HTMLElement {
  const target = renderUnmounted(held.length ? held[0] : flowWith('valid'));
  flushSync();
  return target;
}

function one<TElement extends HTMLElement = HTMLElement>(target: ParentNode, selector: string): TElement {
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

function press(target: HTMLElement, selector: string): void {
  one(target, selector).click();
  flushSync();
}

/** Submit the form as Enter in a field does, without a press of the button. */
function submit(target: HTMLElement): void {
  one(target, 'form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
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

describe('without a valid code held', () => {
  it.each([
    ['nothing', undefined],
    ['a used code', flowWith('used')]
  ])('renders no part of the screen over %s, before the page has mounted', (_name, held) => {
    const target = renderUnmounted(held);
    expect(target.querySelector(FRAME)).toBeNull();
    expect(target.querySelector('form')).toBeNull();
    expect(target.querySelector('h1')).toBeNull();
    expect(goto).not.toHaveBeenCalled();
  });

  it.each([
    ['nothing', undefined],
    ['a used code', flowWith('used')],
    ['a link request and no code', { request: HELD_REQUEST }]
  ])(
    'leads to the registration page in place of this history entry over %s, and still renders nothing',
    (_name, held) => {
      const target = render(held);
      expect(goto).toHaveBeenCalledTimes(1);
      expect(goto).toHaveBeenCalledWith(REGISTER_ROUTE, { replaceState: true });
      expect(target.querySelector(FRAME)).toBeNull();
      expect(target.textContent?.trim()).toBe('');
      expect(sendEntryLink).not.toHaveBeenCalled();
    }
  );

  it('stays where it is over a valid code', () => {
    const target = render();
    one(target, FRAME);
    expect(goto).not.toHaveBeenCalled();
  });

  it('leaves the screen when the held code goes while it is shown', () => {
    const target = render();
    heldFlow = undefined;
    flushSync();
    expect(target.querySelector(FRAME)).toBeNull();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(REGISTER_ROUTE, { replaceState: true });
  });
});

describe('the frame', () => {
  it("has one heading that can take focus, under the app's name", () => {
    const target = render();
    const heading = one(target, 'h1');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(heading.textContent?.trim()).toBe('contestantApp.register.emailEntry.title');
    expect(target.textContent).toContain('dynamic.contestantAppName.');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it('says what the address is for', () => {
    const target = render();
    expect(target.textContent).toContain('contestantApp.register.emailEntry.ingress');
  });

  it('leads back to the registration page', () => {
    const target = render();
    const link = one(target, RETURN);
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe(REGISTER_ROUTE);
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

  it('holds the address and its confirmation, each with a visible label and a name of its own', () => {
    const target = render();
    const form = one(target, 'form');
    const email = one<HTMLInputElement>(form, EMAIL);
    const confirmation = one<HTMLInputElement>(form, CONFIRMATION);
    expect(email.type).toBe('email');
    expect(confirmation.type).toBe('email');
    expect(email.name).not.toBe(confirmation.name);
    expect(one(target, `label[for="${email.id}"]`).textContent?.trim()).toBe('common.email');
    expect(one(target, `label[for="${confirmation.id}"]`).textContent?.trim()).toBe('common.emailConfirmation');
    expect(form.querySelectorAll('input').length, 'the form holds the two address fields and nothing else').toBe(2);
  });

  it('holds the code nowhere in the document', () => {
    const target = render();
    expect(target.innerHTML).not.toContain(HELD_CODE);
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
    expect(button.textContent?.trim()).toBe('common.continue');
  });

  it('has a submit button that is natively disabled until the page has mounted', () => {
    const target = renderUnmounted(flowWith('valid'));
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    flushSync();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
  });
});

describe('Continue', () => {
  it('sends nothing with both fields empty, says what to enter at each and focuses the first', async () => {
    const target = render();
    press(target, SUBMIT);
    await settle();
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(messageOf(one(target, EMAIL_ERROR))).toBe('contestantApp.login.emailRequired');
    expect(messageOf(one(target, CONFIRMATION_ERROR))).toBe('contestantApp.login.emailRequired');
    expect(document.activeElement).toBe(one(target, EMAIL));
    expect(labelOf(one(target, SUBMIT))).toBe('common.continue');
  });

  it('sends nothing with the confirmation empty, and focuses the confirmation', async () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    press(target, SUBMIT);
    await settle();
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
    expect(document.activeElement).toBe(one(target, CONFIRMATION));
  });

  it('sends nothing for an address the control reports invalid', async () => {
    const target = render();
    type(target, EMAIL, 'not-an-address');
    type(target, CONFIRMATION, 'not-an-address');
    press(target, SUBMIT);
    await settle();
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(messageOf(one(target, EMAIL_ERROR))).toBe('components.input.error.invalidEmail');
  });

  it('sends nothing for two addresses that differ, and says so at the confirmation', async () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    type(target, CONFIRMATION, 'someone.else@example.test');
    press(target, SUBMIT);
    await settle();
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    const confirmation = one<HTMLInputElement>(target, CONFIRMATION);
    const error = one(target, CONFIRMATION_ERROR);
    expect(messageOf(error)).toBe('contestantApp.register.emailEntry.mismatch');
    expect(error.getAttribute('role')).toBe('alert');
    expect(confirmation.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(confirmation);
  });

  it('removes the mismatch on the next edit of either field', () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    type(target, CONFIRMATION, 'someone.else@example.test');
    press(target, SUBMIT);
    expect(target.querySelector(CONFIRMATION_ERROR)).not.toBeNull();
    type(target, EMAIL, `${ADDRESS}x`);
    expect(target.querySelector(CONFIRMATION_ERROR)).toBeNull();
  });

  it('asks for a link once, from this screen, with the address and the held code', () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    type(target, CONFIRMATION, ADDRESS);
    press(target, SUBMIT);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(sendEntryLink).toHaveBeenCalledWith({ origin: 'registerEmail', email: ADDRESS, code: HELD_CODE });
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
    expect(target.querySelector(CONFIRMATION_ERROR)).toBeNull();
  });

  it('takes two addresses that differ in case and outer spaces as one, and sends the first trimmed', () => {
    const target = render();
    type(target, EMAIL, '  Someone@Example.test ');
    type(target, CONFIRMATION, 'someone@example.test');
    press(target, SUBMIT);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(sendEntryLink).toHaveBeenCalledWith({
      origin: 'registerEmail',
      email: 'Someone@Example.test',
      code: HELD_CODE
    });
  });

  it('does the same for a submit of the form without a press of the button', () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    type(target, CONFIRMATION, ADDRESS);
    const event = new Event('submit', { bubbles: true, cancelable: true });
    one(target, 'form').dispatchEvent(event);
    expect(event.defaultPrevented, 'the form is never posted').toBe(true);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
  });

  it('reads "Loading…" and takes no second submit while its request runs, and leaves only then', async () => {
    const settlers = new Array<() => void>();
    sendEntryLink.mockReturnValue(new Promise<void>((resolve) => settlers.push(resolve)));
    const target = render();
    type(target, EMAIL, ADDRESS);
    type(target, CONFIRMATION, ADDRESS);
    press(target, SUBMIT);
    await settle();
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(labelOf(button)).toBe('common.loading');
    expect(button.disabled).toBe(true);
    press(target, SUBMIT);
    submit(target);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(goto, 'the screen stays until the request has settled').not.toHaveBeenCalled();

    settlers[0]();
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(EMAIL_SENT_ROUTE);
  });

  it('opens the "email sent" screen whatever the request resolved to', async () => {
    sendEntryLink.mockResolvedValue({ type: 'failure' });
    const target = render();
    type(target, EMAIL, ADDRESS);
    type(target, CONFIRMATION, ADDRESS);
    press(target, SUBMIT);
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(EMAIL_SENT_ROUTE);
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
    expect(target.querySelector(CONFIRMATION_ERROR)).toBeNull();
  });
});
