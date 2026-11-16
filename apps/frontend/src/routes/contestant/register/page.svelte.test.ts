/**
 * The registration page, mounted for real with the real mode selector and fields against a fake contestant context.
 *
 * The fake context's `appSettings` is reactive behind a getter, as the real accessor is, and each case sets the registration matrix it reads. Its `t` returns its key, and its `getRoute` builds routes with the real `buildRoute` from an empty set of route params. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The frame** — the screen's marker with the listed modes, the chosen mode and the screen's state, a heading that can take focus, and the two links.
 * 2. **Several modes** — nothing chosen on arrival, one panel at a time, what was typed kept, and Continue with none chosen.
 * 3. **One mode** — its panel directly, with no group.
 * 4. **The forms** — a form of its own for each panel that has a field, declared as a post, holding one field; the radios in none; Continue tied to the open form.
 * 5. **The email mode** — nothing sent for an empty or unusable address; otherwise one link request and the "email sent" screen.
 * 6. **The code mode** — nothing sent for an empty code; a valid and a used code held and led on; every other answer, and a failed check, shown as one sentence.
 * 7. **The provider's mode** — its paragraph with no form, and Continue to the pre-registration start.
 * 8. **Before the script has loaded** — the main button natively disabled.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { RegistrationMode } from '@openvaa/app-shared';
import type { RouteOptions } from '$lib/routes';

const { checkInvitationCode, goto, holdEntryCode, sendEntryLink } = vi.hoisted(() => ({
  checkInvitationCode: vi.fn(),
  goto: vi.fn(),
  holdEntryCode: vi.fn(),
  sendEntryLink: vi.fn()
}));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

type FakeSettings = {
  contestantApp: { entityTypes: Array<string>; registrationModes: Record<string, Array<RegistrationMode>> };
  access?: { answersLocked: boolean };
};

/** The settings the fake context holds. Replaced whole on every write, never changed in place. */
let heldSettings = $state.raw<FakeSettings>(settingsFor([]));

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  checkInvitationCode,
  holdEntryCode,
  sendEntryLink,
  get appSettings() {
    return heldSettings;
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

const RegisterPage = (await import('./+page.svelte')).default;

const FRAME = '[data-testid="contestant-register"]';
const OPTION = '[data-testid="register-mode-option"]';
const RADIO = '[data-testid="register-mode-input"]';
const PANEL = '[data-testid="register-mode-panel"]';
const MODES_ERROR = '[data-testid="register-modes-error"]';
const EMAIL = '[data-testid="register-email"]';
const EMAIL_ERROR = '[data-testid="register-email-error"]';
const CODE = '[data-testid="register-code"]';
const CODE_ERROR = '[data-testid="register-code-error"]';
const SUBMIT = '[data-testid="register-submit"]';
const LOGIN_LINK = '[data-testid="register-login-link"]';
const RETURN = '[data-testid="register-return"]';

const ADDRESS = 'someone@example.test';
const TYPED_CODE = 'abcd-efgh-jkmn';

const LOGIN_ROUTE = buildRoute({ route: 'ContestantAppLogin' }, { params: {} });
const SIGN_IN_ROUTE = buildRoute({ route: 'ContestantAppSignIn' }, { params: {} });
const EMAIL_SENT_ROUTE = buildRoute({ route: 'ContestantAppEmailSent' }, { params: {} });
const EMAIL_ENTRY_ROUTE = buildRoute({ route: 'ContestantAppRegisterEmail' }, { params: {} });
const CODE_SIGN_IN_ROUTE = buildRoute({ route: 'ContestantAppRegisterSignIn' }, { params: {} });
const PREREGISTER_ROUTE = buildRoute({ route: 'ContestantAppPreregister' }, { params: {} });

const ALL_MODES: Array<RegistrationMode> = ['identity_provider', 'email', 'code'];

/** Settings of a project that serves candidates and allows them the given modes. */
function settingsFor(modes: Array<RegistrationMode>): FakeSettings {
  return { contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: modes, organization: [] } } };
}

let teardown: Array<() => void> = [];

beforeEach(() => {
  heldSettings = settingsFor([]);
  goto.mockResolvedValue(undefined);
  sendEntryLink.mockResolvedValue(undefined);
  checkInvitationCode.mockResolvedValue('unknown');
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
 * Mount the page for a project that allows candidates the given modes, without running its effects.
 * @param modes - The allowed modes, in any order.
 * @returns The element the page was mounted into.
 */
function renderUnmounted(modes: Array<RegistrationMode>): HTMLElement {
  heldSettings = settingsFor(modes);
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(RegisterPage, { target, props: {} as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Mount the page for a project that allows candidates the given modes, and run its effects. */
function render(modes: Array<RegistrationMode>): HTMLElement {
  const target = renderUnmounted(modes);
  flushSync();
  return target;
}

function one<TElement extends HTMLElement = HTMLElement>(target: ParentNode, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found.length, `exactly one ${selector} should be rendered`).toBe(1);
  return found[0];
}

function radioOf(target: HTMLElement, mode: RegistrationMode): HTMLInputElement {
  return one<HTMLInputElement>(target, `${OPTION}[data-mode="${mode}"] ${RADIO}`);
}

/** Choose a mode as a press on its radio does. */
function choose(target: HTMLElement, mode: RegistrationMode): void {
  radioOf(target, mode).click();
  flushSync();
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

/** Submit the one form in the document as Enter in its field does, and answer whether the browser's own post was prevented. */
function submit(target: HTMLElement): boolean {
  const event = new Event('submit', { bubbles: true, cancelable: true });
  one(target, 'form').dispatchEvent(event);
  flushSync();
  return event.defaultPrevented;
}

/** Let awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  flushSync();
}

/** A promise with its two handles, for a request a case settles when it chooses to. */
function deferred<TValue>(): {
  promise: Promise<TValue>;
  resolve: (value: TValue) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: TValue) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<TValue>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('the frame', () => {
  it.each<[Array<RegistrationMode>, string]>([
    [['code', 'email', 'identity_provider'], 'identity_provider email code'],
    [['code', 'email'], 'email code'],
    [['code'], 'code'],
    [['email'], 'email'],
    [['identity_provider'], 'identity_provider']
  ])('states the listed modes of %j in listing order as %s', (modes, listed) => {
    const frame = one(render(modes), FRAME);
    expect(frame.getAttribute('data-modes')).toBe(listed);
  });

  it('states that nothing is being checked', () => {
    expect(one(render(ALL_MODES), FRAME).getAttribute('data-register-state')).toBe('idle');
  });

  it('renders a heading that can take focus and reads the page title', () => {
    const heading = one(render(ALL_MODES), 'h1');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(heading.textContent).toContain('contestantApp.register.title');
  });

  it('links to the sign-in screen and back to the login screen', () => {
    const target = render(ALL_MODES);
    expect(one(target, LOGIN_LINK).getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(one(target, RETURN).getAttribute('href')).toBe(LOGIN_ROUTE);
  });

  it('adds no dialog and names no element for a view transition', () => {
    const target = render(ALL_MODES);
    choose(target, 'code');
    expect(target.querySelector('dialog')).toBeNull();
    const named = Array.from(target.querySelectorAll<HTMLElement>(`${FRAME} [style*="view-transition-name"]`));
    expect(named).toEqual([]);
  });

  it('follows a matrix that changes under the mounted page', () => {
    const target = render(['email', 'code']);
    choose(target, 'code');
    heldSettings = settingsFor(['email']);
    flushSync();
    const frame = one(target, FRAME);
    expect(frame.getAttribute('data-modes')).toBe('email');
    expect(frame.getAttribute('data-mode-selected')).toBe('email');
    expect(target.querySelectorAll(CODE)).toHaveLength(0);
  });
});

describe('several modes', () => {
  it('has nothing chosen on arrival: no radio checked, no panel, no field and no form', () => {
    const target = render(ALL_MODES);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe('');
    const radios = Array.from(target.querySelectorAll<HTMLInputElement>(RADIO));
    expect(radios.map((radio) => radio.value)).toEqual(ALL_MODES);
    expect(radios.some((radio) => radio.checked)).toBe(false);
    expect(target.querySelectorAll(PANEL)).toHaveLength(0);
    expect(target.querySelectorAll('form')).toHaveLength(0);
    expect(target.querySelectorAll(`${EMAIL}, ${CODE}`)).toHaveLength(0);
  });

  it.each<RegistrationMode>(ALL_MODES)('opens the panel of %s alone when it is chosen, and says so', (mode) => {
    const target = render(ALL_MODES);
    choose(target, mode);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe(mode);
    expect(one(target, PANEL).getAttribute('data-mode')).toBe(mode);
  });

  it('keeps what was typed in a panel when another mode is chosen and the first is chosen back', () => {
    const target = render(['email', 'code']);
    choose(target, 'email');
    type(target, EMAIL, ADDRESS);
    choose(target, 'code');
    type(target, CODE, TYPED_CODE);
    expect(target.querySelectorAll(EMAIL)).toHaveLength(0);

    choose(target, 'email');
    expect(one<HTMLInputElement>(target, EMAIL).value).toBe(ADDRESS);
    choose(target, 'code');
    expect(one<HTMLInputElement>(target, CODE).value).toBe(TYPED_CODE);
  });

  it('on Continue with none chosen says to choose one, names that as the description of the group, focuses the first radio and sends nothing', () => {
    const target = render(ALL_MODES);
    press(target, SUBMIT);

    const error = one(target, MODES_ERROR);
    expect(error.textContent).toContain('contestantApp.register.modes.required');
    expect(error.getAttribute('role')).toBe('alert');
    const fieldset = one(target, 'fieldset');
    expect(fieldset.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
    expect(document.activeElement).toBe(target.querySelectorAll(RADIO)[0]);

    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(checkInvitationCode).not.toHaveBeenCalled();
    expect(holdEntryCode).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });

  it('removes the error of the group when a mode is chosen', () => {
    const target = render(ALL_MODES);
    press(target, SUBMIT);
    choose(target, 'email');
    expect(target.querySelectorAll(MODES_ERROR)).toHaveLength(0);
  });
});

describe('one mode', () => {
  it.each<[RegistrationMode, string]>([
    ['email', EMAIL],
    ['code', CODE]
  ])('renders the panel of %s directly, with no group, no radio and no block', (mode, field) => {
    const target = render([mode]);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe(mode);
    one(target, field);
    one(target, 'form');
    expect(target.querySelectorAll('fieldset')).toHaveLength(0);
    expect(target.querySelectorAll(RADIO)).toHaveLength(0);
    expect(target.querySelectorAll(OPTION)).toHaveLength(0);
    expect(target.querySelectorAll(PANEL)).toHaveLength(0);
  });

  it("renders the provider's paragraph directly, with no group and no form", () => {
    const target = render(['identity_provider']);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe('identity_provider');
    expect(target.textContent).toContain('contestantApp.preregister.identification.start.content');
    expect(target.querySelectorAll('fieldset, form')).toHaveLength(0);
  });
});

describe('the forms', () => {
  it.each<[RegistrationMode, string, string]>([
    ['email', EMAIL, 'email'],
    ['code', CODE, 'code']
  ])('gives the panel of %s a form of its own, declared as a post, holding that one field', (mode, field, name) => {
    const target = render(ALL_MODES);
    choose(target, mode);
    const form = one<HTMLFormElement>(target, 'form');
    expect(form.getAttribute('method')).toBe('POST');
    expect(form.hasAttribute('novalidate')).toBe(true);
    expect(form.hasAttribute('action')).toBe(false);
    const controls = Array.from(form.querySelectorAll<HTMLInputElement>('input, select, textarea'));
    expect(controls).toEqual([one(target, field)]);
    expect(controls[0].getAttribute('name')).toBe(name);
  });

  it('gives the two forms different ids', () => {
    const target = render(['email', 'code']);
    choose(target, 'email');
    const emailFormId = one(target, 'form').id;
    choose(target, 'code');
    const codeFormId = one(target, 'form').id;
    expect(emailFormId).not.toBe('');
    expect(codeFormId).not.toBe('');
    expect(codeFormId).not.toBe(emailFormId);
  });

  it('holds the radios in no form', () => {
    const target = render(ALL_MODES);
    choose(target, 'code');
    for (const radio of Array.from(target.querySelectorAll<HTMLInputElement>(RADIO))) {
      expect(radio.closest('form')).toBeNull();
      expect(radio.hasAttribute('form')).toBe(false);
    }
  });

  it('ties Continue to the open form as its submit button, outside that form', () => {
    const target = render(['email', 'code']);
    for (const mode of ['email', 'code'] as const) {
      choose(target, mode);
      const form = one(target, 'form');
      const button = one<HTMLButtonElement>(target, SUBMIT);
      expect(button.getAttribute('type')).toBe('submit');
      expect(button.getAttribute('form')).toBe(form.id);
      expect(form.contains(button)).toBe(false);
    }
  });

  it.each<[string, Array<RegistrationMode>, RegistrationMode | undefined]>([
    ['nothing is chosen', ALL_MODES, undefined],
    ["the provider's panel is open", ALL_MODES, 'identity_provider']
  ])('makes Continue a plain button tied to no form while %s', (_name, modes, mode) => {
    const target = render(modes);
    if (mode) choose(target, mode);
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('form')).toBe(false);
  });

  it('reads Continue as its label', () => {
    expect(one(render(ALL_MODES), SUBMIT).textContent).toContain('common.continue');
  });
});

describe('the email mode', () => {
  it.each<[string, string, string]>([
    ['an empty field', '', 'contestantApp.login.emailRequired'],
    ['a field holding spaces alone', '   ', 'contestantApp.login.emailRequired'],
    ['an address the control reports invalid', 'not-an-address', 'components.input.error.invalidEmail']
  ])('sends nothing for %s, says what to enter at the field and focuses it', async (_name, typed, message) => {
    const target = render(['email', 'code']);
    choose(target, 'email');
    type(target, EMAIL, typed);

    expect(submit(target)).toBe(true);
    await settle();

    const input = one<HTMLInputElement>(target, EMAIL);
    expect(one(target, EMAIL_ERROR).textContent).toContain(message);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input);
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });

  it('tells a browser that the field holds an email address', () => {
    const target = render(['email']);
    const input = one<HTMLInputElement>(target, EMAIL);
    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('email');
  });

  it('asks for one link with the trimmed address and the origin of this page, then opens the "email sent" screen', async () => {
    const target = render(['email', 'code']);
    choose(target, 'email');
    type(target, EMAIL, ADDRESS);

    expect(submit(target)).toBe(true);
    await settle();

    expect(sendEntryLink.mock.calls).toEqual([[{ origin: 'register', email: ADDRESS }]]);
    expect(goto.mock.calls).toEqual([[EMAIL_SENT_ROUTE]]);
    expect(checkInvitationCode).not.toHaveBeenCalled();
    expect(holdEntryCode).not.toHaveBeenCalled();
  });

  it('opens the "email sent" screen only once the request has settled, and reads Continue as loading until then', async () => {
    const request = deferred<void>();
    sendEntryLink.mockReturnValue(request.promise);
    const target = render(['email']);
    type(target, EMAIL, ADDRESS);
    submit(target);
    await settle();

    expect(goto).not.toHaveBeenCalled();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    expect(one(target, FRAME).getAttribute('data-register-state')).toBe('idle');

    request.resolve();
    await settle();
    expect(goto.mock.calls).toEqual([[EMAIL_SENT_ROUTE]]);
  });

  it('sends nothing more for a second submit while the request runs', async () => {
    sendEntryLink.mockReturnValue(deferred<void>().promise);
    const target = render(['email']);
    type(target, EMAIL, ADDRESS);
    submit(target);
    await settle();
    submit(target);
    await settle();
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
  });

  it('puts the address in no address: the navigation carries the route alone', async () => {
    const target = render(['email']);
    type(target, EMAIL, ADDRESS);
    submit(target);
    await settle();
    expect(String(goto.mock.calls[0][0])).not.toContain('@');
    expect(goto.mock.calls[0]).toHaveLength(1);
  });
});

describe('the code mode', () => {
  it.each<[string, string]>([
    ['an empty field', ''],
    ['a field holding spaces alone', '   ']
  ])('sends nothing for %s, says to enter the code at the field and focuses it', async (_name, typed) => {
    const target = render(['email', 'code']);
    choose(target, 'code');
    type(target, CODE, typed);

    expect(submit(target)).toBe(true);
    await settle();

    const error = one(target, CODE_ERROR);
    expect(error.textContent).toContain('contestantApp.register.codeRequired');
    expect(error.getAttribute('data-reason')).toBe('required');
    expect(document.activeElement).toBe(one(target, CODE));
    expect(checkInvitationCode).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });

  it.each<['valid' | 'used', string]>([
    ['valid', EMAIL_ENTRY_ROUTE],
    ['used', CODE_SIGN_IN_ROUTE]
  ])('holds a %s code with its status and then leads to %s', async (status, route) => {
    checkInvitationCode.mockResolvedValue(status);
    const order = new Array<string>();
    holdEntryCode.mockImplementation(() => order.push('hold'));
    goto.mockImplementation(async () => {
      order.push('goto');
    });
    const target = render(['email', 'code']);
    choose(target, 'code');
    type(target, CODE, `  ${TYPED_CODE} `);

    expect(submit(target)).toBe(true);
    await settle();

    expect(checkInvitationCode.mock.calls).toEqual([[{ code: TYPED_CODE }]]);
    expect(holdEntryCode.mock.calls).toEqual([[{ code: TYPED_CODE, status }]]);
    expect(goto.mock.calls).toEqual([[route]]);
    expect(order).toEqual(['hold', 'goto']);
    expect(target.querySelectorAll(CODE_ERROR)).toHaveLength(0);
    expect(sendEntryLink).not.toHaveBeenCalled();
  });

  it.each<[string, () => void]>([
    ['an unknown code', () => checkInvitationCode.mockResolvedValue('unknown')],
    ['a check that rejects', () => checkInvitationCode.mockRejectedValue(new Error('the function answered 500'))],
    ['an answer the page does not know', () => checkInvitationCode.mockResolvedValue('expired')],
    ['no answer at all', () => checkInvitationCode.mockResolvedValue(undefined)]
  ])('shows the one sentence for %s, keeps the code as typed and focuses the field', async (_name, answer) => {
    answer();
    const target = render(['email', 'code']);
    choose(target, 'code');
    type(target, CODE, TYPED_CODE);

    submit(target);
    await settle();

    const input = one<HTMLInputElement>(target, CODE);
    const error = one(target, CODE_ERROR);
    expect(error.textContent).toContain('contestantApp.register.codeUnconfirmed');
    expect(error.getAttribute('data-reason')).toBe('unconfirmed');
    expect(error.getAttribute('role')).toBe('alert');
    expect(input.value).toBe(TYPED_CODE);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input);
    expect(one(target, FRAME).getAttribute('data-register-state')).toBe('idle');
    expect(holdEntryCode).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });

  it('shows the same sentence when the same unconfirmed code is checked again', async () => {
    const target = render(['code']);
    type(target, CODE, TYPED_CODE);
    submit(target);
    await settle();
    const first = one(target, CODE_ERROR).textContent;

    submit(target);
    await settle();
    expect(checkInvitationCode).toHaveBeenCalledTimes(2);
    expect(one(target, CODE_ERROR).textContent).toBe(first);
    expect(one(target, CODE_ERROR).getAttribute('data-reason')).toBe('unconfirmed');
  });

  it('says that a code is being checked until the answer, and reads Continue as loading', async () => {
    const check = deferred<string>();
    checkInvitationCode.mockReturnValue(check.promise);
    const target = render(['email', 'code']);
    choose(target, 'code');
    type(target, CODE, TYPED_CODE);
    submit(target);
    await settle();

    expect(one(target, FRAME).getAttribute('data-register-state')).toBe('checking');
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    expect(one<HTMLInputElement>(target, CODE).value).toBe(TYPED_CODE);
    expect(target.querySelectorAll(RADIO)).toHaveLength(2);

    check.resolve('unknown');
    await settle();
    expect(one(target, FRAME).getAttribute('data-register-state')).toBe('idle');
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
  });

  it('sends nothing more for a second submit while a code is being checked', async () => {
    checkInvitationCode.mockReturnValue(deferred<string>().promise);
    const target = render(['code']);
    type(target, CODE, TYPED_CODE);
    submit(target);
    await settle();
    submit(target);
    await settle();
    expect(checkInvitationCode).toHaveBeenCalledTimes(1);
  });

  it('puts the code in no address: the navigation carries the route alone', async () => {
    checkInvitationCode.mockResolvedValue('valid');
    const target = render(['code']);
    type(target, CODE, TYPED_CODE);
    submit(target);
    await settle();
    expect(String(goto.mock.calls[0][0])).not.toContain(TYPED_CODE);
    expect(goto.mock.calls[0]).toHaveLength(1);
  });
});

describe("the provider's mode", () => {
  it('shows its paragraph with no field and no form', () => {
    const target = render(ALL_MODES);
    choose(target, 'identity_provider');
    const panel = one(target, PANEL);
    expect(panel.textContent).toContain('contestantApp.preregister.identification.start.content');
    expect(panel.querySelectorAll('form, input, select, textarea')).toHaveLength(0);
  });

  it('on Continue opens the pre-registration start and sends nothing', async () => {
    const target = render(ALL_MODES);
    choose(target, 'identity_provider');
    press(target, SUBMIT);
    await settle();

    expect(goto.mock.calls).toEqual([[PREREGISTER_ROUTE]]);
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(checkInvitationCode).not.toHaveBeenCalled();
    expect(holdEntryCode).not.toHaveBeenCalled();
  });
});

describe('before the script of the page has loaded', () => {
  it.each<[string, Array<RegistrationMode>]>([
    ['several modes', ALL_MODES],
    ['one mode', ['code']]
  ])('has the main button natively disabled with %s, and enabled once the page has mounted', (_name, modes) => {
    const target = renderUnmounted(modes);
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    flushSync();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
  });
});
