/**
 * The registration page, mounted for real with the real mode selector and fields against a fake contestant context.
 *
 * The fake context's `appSettings` is reactive behind a getter, as the real accessor is, and each case sets the registration matrix it reads. Its `t` returns its key, and its `getRoute` builds routes with the real `buildRoute` from an empty set of route params. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The frame** — the screen's marker with the listed modes, the chosen mode and the screen's state, a heading that can take focus, and the two links; and the hero emoji above the heading.
 * 2. **Several modes** — nothing chosen on arrival, one panel at a time, what was typed kept, and Continue with none chosen.
 * 3. **One mode** — its panel directly, with no group.
 * 4. **The forms** — a form of its own for each panel that has a field, declared as a post, holding one field; the radios in none; Continue tied to the open form.
 * 5. **The email mode** — nothing sent for an empty or unusable address; otherwise one link request and the "email sent" screen.
 * 6. **The code mode** — nothing sent for an empty code; a valid and a used code held and led on; every other answer, and a failed check, shown as one sentence.
 * 7. **The provider's mode** — a form naming the one type it registers; Continue posts that type to the authorize endpoint and leaves for the provider, keeps its loading form until the page is left, leads a refusal and any other failure to the error screen, and ends the loading form when the page is shown again from the page cache.
 * 8. **The provider's types** — the types the matrix allows the provider's mode, read through the same function as the listed modes: one is named and sent without a question; two are asked as a group of bordered radios with nothing chosen on arrival, Continue with none chosen says so and sends nothing, and the chosen type is sent and kept while the page is shown.
 * 9. **Before the script has loaded** — the main button natively disabled.
 * 10. **The notice for a browser that has confirmed an address** — shown above the modes only when the page's data says so, with its title as a heading, its sentence and links to the login and the forgot-password screens; its Dismiss posts to the page's `dismissRegistered` action and, once that has succeeded, the notice is gone without a reload and focus is on the page's heading.
 *
 * `$app/forms` is replaced: the fake `enhance` listens for a form's submit event as the real one does, hands the page's callback the posted form data and a `cancel`, and keeps what the callback returned so that a test can answer the post with a result of its choice.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import { buildRoute } from '$lib/routes';
import type { RegistrationMode } from '@openvaa/app-shared';
import type { RouteOptions } from '$lib/routes';

/** A post the fake `enhance` saw: the form, whether the page cancelled it, and the page's handler for its result. */
type Submission = {
  form: HTMLFormElement;
  cancelled: boolean;
  answer: (result: Record<string, unknown>) => Promise<void>;
};

const { applyAction, checkInvitationCode, goto, holdEntryCode, leaveFor, localizeHref, sendEntryLink, submissions } =
  vi.hoisted(() => ({
    applyAction: vi.fn(),
    checkInvitationCode: vi.fn(),
    goto: vi.fn(),
    holdEntryCode: vi.fn(),
    leaveFor: vi.fn(),
    localizeHref: vi.fn((href: string) => href),
    sendEntryLink: vi.fn(),
    submissions: new Array<unknown>()
  }));

/** The posts the fake `enhance` saw, oldest first. */
const posts = submissions as Array<Submission>;

vi.mock('$app/forms', () => ({
  applyAction,
  enhance: (
    form: HTMLFormElement,
    submit?: (input: Record<string, unknown>) => ((input: Record<string, unknown>) => Promise<void>) | void
  ) => {
    function onsubmit(event: SubmitEvent): void {
      event.preventDefault();
      const formData = new FormData(form);
      const submission: Submission = { form, cancelled: false, answer: async () => undefined };
      const handler = submit?.({
        formData,
        formElement: form,
        submitter: event.submitter,
        cancel: () => {
          submission.cancelled = true;
        }
      });
      submission.answer = async (result) => {
        if (handler) await handler({ result, formData, formElement: form, update: async () => undefined });
      };
      submissions.push(submission);
    }
    form.addEventListener('submit', onsubmit);
    return { destroy: () => form.removeEventListener('submit', onsubmit) };
  }
}));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

// The document's `location` cannot be replaced here, so the departure is observed at the module that performs it.
vi.mock('$lib/utils/leaveFor', () => ({ leaveFor }));

// The other members stay the test stubs; a case chooses the locale `localizeHref` puts in front of a path.
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({ ...(await importOriginal<object>()), localizeHref }));

type FakeSettings = {
  contestantApp: { entityTypes: Array<string>; registrationModes: Record<string, Array<RegistrationMode>> };
  access?: { answersLocked: boolean };
};

/** The settings the fake context holds. Replaced whole on every write, never changed in place. */
let heldSettings = $state.raw<FakeSettings>(settingsFor([]));

/** The page's data, as its server load answers it. */
let heldData: { registered: boolean } = { registered: false };

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
const PROVIDER_FORM = '[data-testid="register-identity-provider-form"]';
const NOTICE = '[data-testid="contestant-register-registered-notice"]';
const NOTICE_LOGIN = '[data-testid="contestant-register-registered-notice-login"]';
const NOTICE_FORGOT_PASSWORD = '[data-testid="contestant-register-registered-notice-forgot-password"]';
const NOTICE_DISMISS = '[data-testid="contestant-register-registered-notice-dismiss"]';

const ADDRESS = 'someone@example.test';
const TYPED_CODE = 'abcd-efgh-jkmn';

const LOGIN_ROUTE = buildRoute({ route: 'ContestantAppLogin' }, { params: {} });
const SIGN_IN_ROUTE = buildRoute({ route: 'ContestantAppSignIn' }, { params: {} });
const EMAIL_SENT_ROUTE = buildRoute({ route: 'ContestantAppEmailSent' }, { params: {} });
const EMAIL_ENTRY_ROUTE = buildRoute({ route: 'ContestantAppRegisterEmail' }, { params: {} });
const CODE_SIGN_IN_ROUTE = buildRoute({ route: 'ContestantAppRegisterSignIn' }, { params: {} });
const FORGOT_PASSWORD_ROUTE = buildRoute({ route: 'ContestantAppForgotPassword' }, { params: {} });

/** The identity provider's error screen for a code. */
function errorScreen(error: string): string {
  return buildRoute({ route: 'ContestantAppIdentityProviderError', error }, { params: {} });
}

const AUTHORIZE_ENDPOINT = '/api/oidc/authorize';
const AUTHORIZE_URL = 'https://provider.example/authorize?request=signed';

/** The intro sentence and the info line of the provider's panel. */
const PROVIDER_INTRO = 'contestantApp.register.identityProvider.intro.candidate';
const PROVIDER_INFO = 'contestantApp.register.identityProvider.redirectInfo';

const TYPE_GROUP = '[data-testid="register-entity-types"]';
const TYPE_RADIO = '[data-testid="register-entity-type-input"]';
const TYPE_ERROR = '[data-testid="register-entity-types-error"]';

const ALL_MODES: Array<RegistrationMode> = ['identity_provider', 'email', 'code'];

/** Settings of a project that serves candidates and allows them the given modes. */
function settingsFor(modes: Array<RegistrationMode>): FakeSettings {
  return { contestantApp: { entityTypes: ['candidate'], registrationModes: { candidate: modes, organization: [] } } };
}

/** Settings of a project that serves both entity types: the candidates' row holds the given modes, and the organizations' row the identity provider's mode alone. */
function settingsForBothTypes(candidateModes: Array<RegistrationMode>): FakeSettings {
  return {
    contestantApp: {
      entityTypes: ['candidate', 'organization'],
      registrationModes: { candidate: candidateModes, organization: ['identity_provider'] }
    }
  };
}

let teardown: Array<() => void> = [];

/** The `fetch` the page calls, answered by each case. */
const fetchMock = vi.fn();

/** A response of the authorize endpoint. */
function answer(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  localizeHref.mockImplementation((href: string) => href);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(answer(200, { authorizeUrl: AUTHORIZE_URL }));
  heldSettings = settingsFor([]);
  heldData = { registered: false };
  goto.mockResolvedValue(undefined);
  sendEntryLink.mockResolvedValue(undefined);
  checkInvitationCode.mockResolvedValue('unknown');
  // Every message shown is also logged as an error: keep the log out of the test output.
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  submissions.length = 0;
  page.url = new URL('http://localhost/') as typeof page.url;
  vi.unstubAllGlobals();
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
  const component = mount(RegisterPage, { target, props: { data: heldData } as never });
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

/** Mount the page for the given settings, and run its effects. */
function renderWith(settings: FakeSettings): HTMLElement {
  heldSettings = settings;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(RegisterPage, { target, props: { data: heldData } as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  flushSync();
  return target;
}

function typeRadioOf(target: HTMLElement, type: string): HTMLInputElement {
  return one<HTMLInputElement>(target, `${TYPE_RADIO}[data-entity-type="${type}"]`);
}

/** The body of the one request made to the authorize endpoint. */
function sentBody(): unknown {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  return JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));
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

describe('the hero', () => {
  it('shows the registration emoji above the heading, hidden from assistive technology', () => {
    const target = render(['email', 'code']);

    const heroes = [...target.querySelectorAll<HTMLElement>('[role="img"]')].filter(
      (element) => element.textContent?.trim() === 'contestantApp.register.heroEmoji'
    );
    expect(heroes).toHaveLength(1);
    expect(heroes[0].getAttribute('aria-hidden')).toBe('true');
    const heading = one(target, 'h1');
    expect(heroes[0].compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it("renders the provider's form directly, naming the one type it registers, with no group and no question", () => {
    const target = render(['identity_provider']);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe('identity_provider');
    const form = one(target, PROVIDER_FORM);
    expect(form.getAttribute('data-entity-types')).toBe('candidate');
    expect(form.textContent).toContain(PROVIDER_INTRO);
    expect(form.textContent).toContain(PROVIDER_INFO);
    expect(target.querySelectorAll('fieldset')).toHaveLength(0);
    expect(target.querySelectorAll('input, select, textarea')).toHaveLength(0);
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

  it('makes Continue a plain button tied to no form while nothing is chosen', () => {
    const button = one<HTMLButtonElement>(render(ALL_MODES), SUBMIT);
    expect(button.getAttribute('type')).toBe('button');
    expect(button.hasAttribute('form')).toBe(false);
  });

  it("gives the provider's panel a form of its own, declared as a post with no action, and ties Continue to it", () => {
    const target = render(ALL_MODES);
    choose(target, 'identity_provider');
    const form = one<HTMLFormElement>(target, PROVIDER_FORM);
    expect(form.tagName).toBe('FORM');
    expect(form.getAttribute('method')).toBe('POST');
    expect(form.hasAttribute('novalidate')).toBe(true);
    expect(form.hasAttribute('action')).toBe(false);
    expect(form.id).not.toBe('');
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(button.getAttribute('type')).toBe('submit');
    expect(button.getAttribute('form')).toBe(form.id);
    expect(form.contains(button)).toBe(false);
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
  it('shows its sentence and its info line with no field', () => {
    const target = render(ALL_MODES);
    choose(target, 'identity_provider');
    const panel = one(target, PANEL);
    expect(panel.textContent).toContain(PROVIDER_INTRO);
    expect(panel.textContent).toContain(PROVIDER_INFO);
    expect(panel.querySelectorAll('input, select, textarea')).toHaveLength(0);
  });

  it('on Continue posts the type to the authorize endpoint and leaves for the address it answers', async () => {
    const target = render(ALL_MODES);
    choose(target, 'identity_provider');
    press(target, SUBMIT);
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(AUTHORIZE_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ entityType: 'candidate' });
    expect(leaveFor.mock.calls).toEqual([[AUTHORIZE_URL]]);
    expect(goto).not.toHaveBeenCalled();
    expect(sendEntryLink).not.toHaveBeenCalled();
    expect(checkInvitationCode).not.toHaveBeenCalled();
  });

  it("posts to the authorize endpoint under the page's locale, so the provider is asked for that locale", async () => {
    localizeHref.mockImplementation((href: string) => `/fi${href}`);
    const target = render(ALL_MODES);
    choose(target, 'identity_provider');
    press(target, SUBMIT);
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`/fi${AUTHORIZE_ENDPOINT}`);
  });

  it("prevents the browser's own post of the form", async () => {
    const target = render(['identity_provider']);
    expect(submit(target)).toBe(true);
    await settle();
  });

  it('sends the one type with one listed mode too', async () => {
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();
    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({
      entityType: 'candidate'
    });
  });

  it('reads Continue as loading from the press, and keeps it so after the browser was sent away', async () => {
    const request = deferred<Response>();
    fetchMock.mockReturnValue(request.promise);
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    expect(one(target, SUBMIT).textContent).toContain('common.loading');

    request.resolve(answer(200, { authorizeUrl: AUTHORIZE_URL }));
    await settle();
    expect(leaveFor).toHaveBeenCalledTimes(1);
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
  });

  it('sends nothing more for a second submit while the page is being left', async () => {
    fetchMock.mockReturnValue(deferred<Response>().promise);
    const target = render(['identity_provider']);
    submit(target);
    await settle();
    submit(target);
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('leads a refusal of the type to the error screen with mode_not_allowed', async () => {
    fetchMock.mockResolvedValue(answer(403, { error: 'mode_not_allowed' }));
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();
    expect(goto.mock.calls).toEqual([[errorScreen('mode_not_allowed')]]);
    expect(leaveFor).not.toHaveBeenCalled();
  });

  it.each<[string, () => void]>([
    ['an outage', () => fetchMock.mockResolvedValue(answer(503, { error: 'unavailable' }))],
    ['a server error', () => fetchMock.mockResolvedValue(answer(500, { message: 'failed' }))],
    ['a request that rejects', () => fetchMock.mockRejectedValue(new TypeError('network'))],
    ['an answer with no address', () => fetchMock.mockResolvedValue(answer(200, {}))],
    ['an answer whose address is not a string', () => fetchMock.mockResolvedValue(answer(200, { authorizeUrl: 1 }))],
    [
      'an answer that is not JSON',
      () =>
        fetchMock.mockResolvedValue(
          new Response('not json', { status: 200, headers: { 'Content-Type': 'text/plain' } })
        )
    ]
  ])('leads %s to the error screen with registration_failed', async (_name, arrange) => {
    arrange();
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();
    expect(goto.mock.calls).toEqual([[errorScreen('registration_failed')]]);
    expect(leaveFor).not.toHaveBeenCalled();
  });

  it('keeps the loading form after a failure, while the error screen is opened', async () => {
    fetchMock.mockResolvedValue(answer(503, { error: 'unavailable' }));
    goto.mockReturnValue(new Promise(() => undefined));
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
  });

  it('shows no error of its own for a failure', async () => {
    fetchMock.mockResolvedValue(answer(403, { error: 'mode_not_allowed' }));
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();
    expect(target.querySelectorAll('[role="alert"]')).toHaveLength(0);
  });

  it('puts the type in no address and in no storage', async () => {
    fetchMock.mockResolvedValue(answer(403, { error: 'mode_not_allowed' }));
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();
    expect(String(goto.mock.calls[0][0])).not.toContain('candidate');
    expect(document.cookie).not.toContain('candidate');
    expect(JSON.stringify({ ...localStorage })).not.toContain('candidate');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('candidate');
  });

  it('ends the loading form when the page is shown again from the page cache', async () => {
    fetchMock.mockReturnValue(deferred<Response>().promise);
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    flushSync();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
    expect(one(target, SUBMIT).textContent).toContain('common.continue');
  });

  it('keeps the loading form for a page shown without the page cache', async () => {
    fetchMock.mockReturnValue(deferred<Response>().promise);
    const target = render(['identity_provider']);
    press(target, SUBMIT);
    await settle();

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));
    flushSync();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
  });
});

describe("the provider's types", () => {
  it('names the one type allowed, organizations, asks nothing and sends it', async () => {
    const target = renderWith({
      contestantApp: {
        entityTypes: ['candidate', 'organization'],
        registrationModes: { candidate: [], organization: ['identity_provider'] }
      }
    });
    expect(one(target, FRAME).getAttribute('data-modes')).toBe('identity_provider');
    const form = one(target, PROVIDER_FORM);
    expect(form.getAttribute('data-entity-types')).toBe('organization');
    expect(form.textContent).toContain('contestantApp.register.identityProvider.intro.organization');
    expect(form.textContent).not.toContain(PROVIDER_INTRO);
    expect(target.querySelectorAll(TYPE_GROUP)).toHaveLength(0);
    expect(target.querySelectorAll('fieldset')).toHaveLength(0);

    press(target, SUBMIT);
    await settle();
    expect(sentBody()).toEqual({ entityType: 'organization' });
  });

  it('asks which type with two allowed: the sentence for both, a named group and two radios, none checked on arrival', () => {
    const target = renderWith(settingsForBothTypes(['identity_provider']));
    const form = one(target, PROVIDER_FORM);
    expect(form.getAttribute('data-entity-types')).toBe('candidate organization');
    expect(form.textContent).toContain('contestantApp.register.identityProvider.intro.both');
    expect(form.textContent).toContain(PROVIDER_INFO);

    const group = one<HTMLFieldSetElement>(target, TYPE_GROUP);
    expect(group.tagName).toBe('FIELDSET');
    expect(form.contains(group)).toBe(true);
    expect(group.querySelector('legend')?.textContent).toContain(
      'contestantApp.register.identityProvider.types.legend'
    );
    const radios = Array.from(group.querySelectorAll<HTMLInputElement>(TYPE_RADIO));
    expect(radios.map((radio) => radio.getAttribute('data-entity-type'))).toEqual(['candidate', 'organization']);
    expect(radios.map((radio) => radio.type)).toEqual(['radio', 'radio']);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(radios.some((radio) => radio.checked)).toBe(false);
    expect(radios[0].closest('label')?.textContent).toContain(
      'contestantApp.register.identityProvider.types.candidate'
    );
    expect(radios[1].closest('label')?.textContent).toContain(
      'contestantApp.register.identityProvider.types.organization'
    );
    expect(target.querySelectorAll(TYPE_ERROR)).toHaveLength(0);
    expect(group.getAttribute('aria-describedby')).toBeNull();
  });

  it('renders each type as a bordered radio inside a label of its own that holds the type’s text', () => {
    const target = renderWith(settingsForBothTypes(['identity_provider']));
    const radios = Array.from(one(target, TYPE_GROUP).querySelectorAll<HTMLInputElement>(TYPE_RADIO));

    expect(radios).toHaveLength(2);
    for (const radio of radios) {
      for (const name of ['radio', 'radio-primary', 'border']) expect(radio.classList.contains(name)).toBe(true);
      expect(radio.closest('label')?.querySelectorAll('input')).toHaveLength(1);
    }
    expect(radios[1].closest('label')?.textContent?.trim()).toBe(
      'contestantApp.register.identityProvider.types.organization'
    );
  });

  it('on Continue with no type chosen says to choose one as the description of the group, focuses the first type and sends nothing', async () => {
    const target = renderWith(settingsForBothTypes(['identity_provider']));
    press(target, SUBMIT);
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(leaveFor).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    const error = one(target, TYPE_ERROR);
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('contestantApp.register.identityProvider.types.required');
    expect(one(target, TYPE_GROUP).getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
    expect(document.activeElement).toBe(typeRadioOf(target, 'candidate'));
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
  });

  it('removes the error of the group when a type is chosen, and sends the chosen type', async () => {
    const target = renderWith(settingsForBothTypes(['identity_provider']));
    press(target, SUBMIT);
    await settle();
    typeRadioOf(target, 'organization').click();
    flushSync();
    expect(target.querySelectorAll(TYPE_ERROR)).toHaveLength(0);
    expect(one(target, TYPE_GROUP).getAttribute('aria-describedby')).toBeNull();

    press(target, SUBMIT);
    await settle();
    expect(sentBody()).toEqual({ entityType: 'organization' });
    expect(leaveFor.mock.calls).toEqual([[AUTHORIZE_URL]]);
  });

  it('sends the candidate when the candidate is chosen', async () => {
    const target = renderWith(settingsForBothTypes(['identity_provider']));
    typeRadioOf(target, 'candidate').click();
    flushSync();
    press(target, SUBMIT);
    await settle();
    expect(sentBody()).toEqual({ entityType: 'candidate' });
  });

  it("asks inside the provider's option among several modes, and keeps the chosen type when another mode is chosen and the provider's back", () => {
    const target = renderWith(settingsForBothTypes(ALL_MODES));
    expect(target.querySelectorAll(TYPE_GROUP)).toHaveLength(0);
    choose(target, 'identity_provider');
    const panel = one(target, PANEL);
    expect(panel.contains(one(target, TYPE_GROUP))).toBe(true);

    typeRadioOf(target, 'organization').click();
    flushSync();
    choose(target, 'email');
    expect(target.querySelectorAll(TYPE_GROUP)).toHaveLength(0);
    choose(target, 'identity_provider');
    expect(typeRadioOf(target, 'organization').checked).toBe(true);
    expect(typeRadioOf(target, 'candidate').checked).toBe(false);
  });

  it('asks nothing and lists nothing for the provider while answers are locked', () => {
    const target = renderWith({
      ...settingsForBothTypes(['identity_provider', 'email']),
      access: { answersLocked: true }
    });
    expect(one(target, FRAME).getAttribute('data-modes')).toBe('');
    expect(target.querySelectorAll(PROVIDER_FORM)).toHaveLength(0);
    expect(target.querySelectorAll(TYPE_GROUP)).toHaveLength(0);
  });
});

describe('before the script of the page has loaded', () => {
  it.each<[string, Array<RegistrationMode>]>([
    ['several modes', ALL_MODES],
    ['one mode', ['code']],
    ["the provider's mode alone", ['identity_provider']]
  ])('has the main button natively disabled with %s, and enabled once the page has mounted', (_name, modes) => {
    const target = renderUnmounted(modes);
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    flushSync();
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
  });
});

describe('a mode named in the address', () => {
  /** Point the page's address at the registration page with the given search. */
  function arriveWith(search: string): void {
    page.url = new URL(`http://localhost/contestant/register${search}`) as typeof page.url;
  }

  it("opens the provider's option when it is listed among several", () => {
    arriveWith('?mode=identity_provider');
    const target = render(ALL_MODES);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe('identity_provider');
    expect(radioOf(target, 'identity_provider').checked).toBe(true);
    expect(one(target, PANEL).textContent).toContain(PROVIDER_INTRO);
  });

  it('opens another listed mode it names', () => {
    arriveWith('?mode=code');
    const target = render(ALL_MODES);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe('code');
  });

  it.each(['?mode=identity_provider', '?mode=nonsense', '?mode=constructor', '?mode=', ''])(
    'chooses nothing for %j when the mode is not listed',
    (search) => {
      arriveWith(search);
      const target = render(['email', 'code']);
      expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe('');
      expect(target.querySelectorAll(PANEL)).toHaveLength(0);
    }
  );

  it('changes nothing with one listed mode', () => {
    arriveWith('?mode=identity_provider');
    const target = render(['code']);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe('code');
  });

  it('chooses nothing on arrival without the parameter', () => {
    arriveWith('');
    const target = render(ALL_MODES);
    expect(one(target, FRAME).getAttribute('data-mode-selected')).toBe('');
  });
});

describe('the notice for a browser that has confirmed an address', () => {
  it('is not shown to a browser that has not confirmed one, and is shown to one that has', () => {
    expect(render(ALL_MODES).querySelectorAll(NOTICE)).toHaveLength(0);

    heldData = { registered: true };
    expect(render(ALL_MODES).querySelectorAll(NOTICE)).toHaveLength(1);
  });

  it('stands above the modes, named by its title as a heading, with its sentence', () => {
    heldData = { registered: true };
    const target = render(ALL_MODES);

    const notice = one(target, NOTICE);
    const heading = one(notice, 'h2');
    expect(heading.textContent?.trim()).toBe('contestantApp.register.registeredNotice.title');
    expect(heading.id).not.toBe('');
    expect(notice.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(notice.textContent).toContain('contestantApp.register.registeredNotice.content');
    const firstOption = target.querySelector(OPTION);
    expect(firstOption).not.toBeNull();
    expect(notice.compareDocumentPosition(firstOption as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('links to the login screen and to the forgot-password screen', () => {
    heldData = { registered: true };
    const notice = one(render(['email']), NOTICE);

    const login = one<HTMLAnchorElement>(notice, NOTICE_LOGIN);
    expect(login.getAttribute('href')).toBe(LOGIN_ROUTE);
    expect(login.textContent).toContain('common.login');
    const forgotPassword = one<HTMLAnchorElement>(notice, NOTICE_FORGOT_PASSWORD);
    expect(forgotPassword.getAttribute('href')).toBe(FORGOT_PASSWORD_ROUTE);
    expect(forgotPassword.textContent).toContain('contestantApp.login.forgotPassword');
  });

  it('offers a Dismiss that posts to the action dismissRegistered, in a form of its own inside the notice', () => {
    heldData = { registered: true };
    const notice = one(render(['email']), NOTICE);

    const form = one<HTMLFormElement>(notice, 'form');
    expect(form.getAttribute('method')?.toUpperCase()).toBe('POST');
    expect(form.getAttribute('action')).toBe('?/dismissRegistered');
    const dismiss = one<HTMLButtonElement>(form, NOTICE_DISMISS);
    expect(dismiss.type).toBe('submit');
    expect(dismiss.textContent).toContain('common.close');
  });

  it('is gone without a reload once the dismissal has succeeded, and focus is on the page heading', async () => {
    heldData = { registered: true };
    const target = render(['email']);

    press(target, NOTICE_DISMISS);
    expect(posts).toHaveLength(1);
    expect(posts[0].cancelled).toBe(false);
    expect(posts[0].form.getAttribute('action')).toBe('?/dismissRegistered');
    expect(target.querySelectorAll(NOTICE)).toHaveLength(1);

    await posts[0].answer({ type: 'success', status: 200 });
    await settle();

    expect(target.querySelectorAll(NOTICE)).toHaveLength(0);
    expect(document.activeElement).toBe(one(target, 'h1'));
    expect(goto).not.toHaveBeenCalled();
  });

  it('stays while the dismissal has failed, and hands the result to the page', async () => {
    heldData = { registered: true };
    const target = render(['email']);

    press(target, NOTICE_DISMISS);
    expect(posts).toHaveLength(1);
    const failure = { type: 'error', status: 500, error: new Error('the action failed') };
    await posts[0].answer(failure);
    await settle();

    expect(target.querySelectorAll(NOTICE)).toHaveLength(1);
    expect(applyAction).toHaveBeenCalledWith(failure);
  });
});
