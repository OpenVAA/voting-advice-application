/**
 * The sign-in screen, mounted for real with its real fields against a fake contestant context.
 *
 * The fake context's `t` returns its key, its `getRoute` builds routes with the real `buildRoute` from an empty set of route params, and its `appSettings` and `answersLocked` are reactive behind getters, as the real accessors are. `$app/forms` is replaced: the fake `enhance` listens for the form's submit event as the real one does, hands the page's callback the posted form data and a `cancel`, and keeps what the callback returned so that a test can answer the post with a result of its choice. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The frame** — the screen's marker and state, a heading that can take focus, and the sentence above the form.
 * 2. **The form** — one form posted to the server, its two fields, its hidden redirect target, and a submit button outside it that is tied to it.
 * 3. **When the link for a user without a password is offered** — by the registration modes alone, whatever the answers lock says.
 * 4. **The links to the forgot-password page** — inside the form, carrying the typed address; neither asks for anything.
 * 5. **Signing in** — a press with something missing sends nothing; a refusal shows one of three sentences by its status; a sign-in clears the entry flow and follows the action's redirect.
 * 6. **A page rendered after a post** — shows the refusal the action answered with.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

/** A post the fake `enhance` saw: what was posted, whether the page cancelled it, and the page's handler for its result. */
type Submission = {
  formData: FormData;
  cancelled: boolean;
  submitter: HTMLElement | null;
  answer: (result: Record<string, unknown>) => Promise<void>;
};

const { applyAction, clearEntryFlow, goto, sendEntryLink, submissions } = vi.hoisted(() => ({
  applyAction: vi.fn(),
  clearEntryFlow: vi.fn(),
  goto: vi.fn(),
  sendEntryLink: vi.fn(),
  submissions: new Array<unknown>()
}));

/** The posts the fake `enhance` saw, oldest first. */
const posts = submissions as Array<Submission>;

vi.mock('$app/forms', () => ({
  applyAction,
  enhance: (
    form: HTMLFormElement,
    submit: (input: Record<string, unknown>) => ((input: Record<string, unknown>) => Promise<void>) | undefined
  ) => {
    function onsubmit(event: SubmitEvent): void {
      event.preventDefault();
      const formData = new FormData(form);
      const submission: Submission = {
        formData,
        cancelled: false,
        submitter: event.submitter,
        answer: async () => undefined
      };
      const handler = submit({
        formData,
        formElement: form,
        submitter: event.submitter,
        cancel: () => {
          submission.cancelled = true;
        }
      });
      submission.answer = async (result) => {
        await handler?.({ result, formData, formElement: form });
      };
      submissions.push(submission);
    }
    form.addEventListener('submit', onsubmit);
    return { destroy: () => form.removeEventListener('submit', onsubmit) };
  }
}));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

type Modes = Array<'identity_provider' | 'email' | 'code'>;

const settings = $state<{ candidate: Modes; organization: Modes; answersLocked: boolean }>({
  candidate: ['email'],
  organization: [],
  answersLocked: false
});

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  sendEntryLink,
  clearEntryFlow,
  get appSettings() {
    return {
      contestantApp: {
        entityTypes: ['candidate', 'organization'],
        registrationModes: { candidate: settings.candidate, organization: settings.organization }
      },
      access: { answersLocked: settings.answersLocked }
    };
  },
  get answersLocked() {
    return settings.answersLocked;
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
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

const SignInPage = (await import('./+page.svelte')).default;

const FRAME = '[data-testid="contestant-sign-in"]';
const EMAIL = '[data-testid="login-email"]';
const EMAIL_ERROR = '[data-testid="login-email-error"]';
const PASSWORD = '[data-testid="password-field"]';
const PASSWORD_ERROR = '[data-testid="login-password-error"]';
const FAILURE = '[data-testid="login-errorMessage"]';
const SUBMIT = '[data-testid="login-submit"]';
const FORGOT_PASSWORD = '[data-testid="login-forgot-password-link"]';
const NO_PASSWORD_YET = '[data-testid="login-no-password-yet-link"]';
const RETURN = '[data-testid="login-return"]';
const LOCKED_INFO = '[data-testid="login-answers-locked-info"]';

const ADDRESS = 'someone@example.test';
const PASS_PHRASE = 'a pass phrase';

const LOGIN_ROUTE = buildRoute({ route: 'ContestantAppLogin' }, { params: {} });
const FORGOT_PASSWORD_ROUTE = buildRoute({ route: 'ContestantAppForgotPassword' }, { params: {} });

let teardown: Array<() => void> = [];

/** Set the address the stubbed `page` answers with. The application's type narrows the pathname to the route tree, which the stub's plain member does not. */
function setAddress(address: string): void {
  (page as { url: URL }).url = new URL(address);
}

beforeEach(() => {
  settings.candidate = ['email'];
  settings.organization = [];
  settings.answersLocked = false;
  setAddress('http://localhost/en/contestant/login/email');
  sendEntryLink.mockResolvedValue(undefined);
  goto.mockResolvedValue(undefined);
  applyAction.mockResolvedValue(undefined);
  // Every message shown is also logged as an error: keep the log out of the test output.
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  submissions.length = 0;
  setAddress('http://localhost/');
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/**
 * Mount the page without running its effects, as the server's markup is before the page's script has run.
 * @param props - The page's props.
 * @returns The element the page was mounted into.
 */
function renderUnmounted(props: Record<string, unknown> = {}): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(SignInPage, { target, props: { form: null, ...props } as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Mount the page and run its effects, as when its script has loaded. */
function render(props: Record<string, unknown> = {}): HTMLElement {
  const target = renderUnmounted(props);
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

/** Let awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  flushSync();
}

/** Fill both fields and press the main button. */
function signIn(target: HTMLElement): Submission {
  type(target, EMAIL, ADDRESS);
  type(target, PASSWORD, PASS_PHRASE);
  press(target, SUBMIT);
  expect(posts.length, 'the form should have been submitted once').toBe(1);
  return posts[0];
}

/** The sentence of an inline message, without the emoji before it. */
function messageOf(message: HTMLElement): string | undefined {
  return message.textContent?.replace('dynamic.error.heroEmoji', '').trim();
}

/** The label of a button: the last text in it, after the spinner's own label while it is loading. */
function labelOf(button: HTMLElement): string | undefined {
  return one(button, '.uc-first').textContent?.trim();
}

function stateOf(target: HTMLElement): string | null {
  return one(target, FRAME).getAttribute('data-sign-in-state');
}

describe('the frame', () => {
  it('carries the marker of the screen and is idle', () => {
    const target = render();
    expect(stateOf(target)).toBe('idle');
  });

  it("has one heading that can take focus, under the app's name", () => {
    const target = render();
    const heading = one(target, 'h1');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(heading.textContent?.trim()).toBe('contestantApp.login.title');
    expect(target.textContent).toContain('dynamic.contestantAppName.');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it('says what to enter', () => {
    const target = render();
    expect(target.textContent).toContain('contestantApp.login.enterEmailAndPassword');
    expect(target.querySelector(LOCKED_INFO)).toBeNull();
  });

  it('says that answers are locked while they are, in place of that sentence', () => {
    settings.answersLocked = true;
    const target = render();
    expect(one(target, LOCKED_INFO).textContent?.trim()).toBe('contestantApp.login.answersLockedInfo');
    expect(target.textContent).not.toContain('contestantApp.login.enterEmailAndPassword');
  });

  it('follows the answers lock when it changes', () => {
    const target = render();
    settings.answersLocked = true;
    flushSync();
    expect(target.querySelector(LOCKED_INFO)).not.toBeNull();
  });

  it('leads back to the login screen', () => {
    const target = render();
    expect(one(target, RETURN).getAttribute('href')).toBe(LOGIN_ROUTE);
  });
});

describe('the form', () => {
  it('is one form posted to the server, with validation left to the page', () => {
    const target = render();
    const form = one<HTMLFormElement>(target, 'form');
    expect(form.getAttribute('method')).toBe('POST');
    expect(form.noValidate).toBe(true);
    expect(form.getAttribute('action'), 'the form posts to its own address').toBeNull();
    expect(form.id).not.toBe('');
  });

  it('holds the email field, declared as the user name of a sign-in', () => {
    const target = render();
    const input = one<HTMLInputElement>(one(target, 'form'), EMAIL);
    expect(input.type).toBe('email');
    expect(input.name).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('username');
    expect(one(target, `label[for="${input.id}"]`).textContent?.trim()).toBe('common.email');
  });

  it('holds the password field, declared as the current password', () => {
    const target = render();
    const input = one<HTMLInputElement>(one(target, 'form'), PASSWORD);
    expect(input.name).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
  });

  it('links to the forgot-password page from inside the form', () => {
    const target = render();
    const link = one(one(target, 'form'), '[data-testid="login-forgot-password-link"]');
    expect(link.getAttribute('href')).toBe(buildRoute({ route: 'ContestantAppForgotPassword' }, { params: {} }));
  });

  it("passes the address bar's redirect target on in a hidden field", () => {
    setAddress('http://localhost/en/contestant/login/email?redirectTo=contestant%2Fhelp');
    const target = render();
    const hidden = one<HTMLInputElement>(one(target, 'form'), 'input[name="redirectTo"]');
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe('contestant/help');
  });

  it('posts an empty redirect target when the address bar has none', () => {
    const target = render();
    expect(one<HTMLInputElement>(target, 'input[name="redirectTo"]').value).toBe('');
  });

  it("has its submit button outside it, among the page's actions, tied to it by its id", () => {
    const target = render();
    const form = one<HTMLFormElement>(target, 'form');
    const submit = one<HTMLButtonElement>(target, SUBMIT);
    expect(submit.tagName).toBe('BUTTON');
    expect(submit.type).toBe('submit');
    expect(submit.getAttribute('form')).toBe(form.id);
    expect(form.contains(submit)).toBe(false);
    expect(submit.closest('section')?.getAttribute('aria-label')).toBe('common.primaryActions');
    expect(submit.textContent?.trim()).toBe('common.login');
    expect(submit.disabled).toBe(false);
  });

  it('is submitted by a press of that button', () => {
    const target = render();
    const submission = signIn(target);
    expect(submission.cancelled).toBe(false);
    expect(submission.formData.get('email')).toBe(ADDRESS);
    expect(submission.formData.get('password')).toBe(PASS_PHRASE);
  });
});

describe('when the link for a user without a password is offered', () => {
  const CASES: Array<[string, { candidate: Modes; organization: Modes; answersLocked?: boolean }, boolean]> = [
    ['the email mode alone', { candidate: ['email'], organization: [] }, true],
    ['the identity provider alone', { candidate: ['identity_provider'], organization: [] }, true],
    ['the identity provider for organizations alone', { candidate: [], organization: ['identity_provider'] }, true],
    ['both modes', { candidate: ['identity_provider', 'email'], organization: ['email'] }, true],
    ['the code mode alone', { candidate: ['code'], organization: ['code'] }, false],
    ['no mode', { candidate: [], organization: [] }, false],
    ['the email mode while answers are locked', { candidate: ['email'], organization: [], answersLocked: true }, true]
  ];

  it.each(CASES)('with %s', (_name, { candidate, organization, answersLocked = false }, offered) => {
    settings.candidate = candidate;
    settings.organization = organization;
    settings.answersLocked = answersLocked;
    const target = render();
    one(target, SUBMIT);
    expect(target.querySelectorAll(NO_PASSWORD_YET).length).toBe(offered ? 1 : 0);
    expect(target.querySelectorAll(FORGOT_PASSWORD).length).toBe(1);
  });

  it('follows the settings when they change', () => {
    settings.candidate = ['code'];
    const target = render();
    expect(target.querySelector(NO_PASSWORD_YET)).toBeNull();
    settings.candidate = ['code', 'email'];
    flushSync();
    expect(target.querySelector(NO_PASSWORD_YET)).not.toBeNull();
  });
});

describe('the links to the forgot-password page', () => {
  it('are both inside the form, as links that need no script', () => {
    const target = renderUnmounted();
    const form = one(target, 'form');
    for (const selector of [FORGOT_PASSWORD, NO_PASSWORD_YET]) {
      const link = one(form, selector);
      expect(link.tagName).toBe('A');
      expect(new URL(link.getAttribute('href')!, 'http://localhost').pathname).toBe(FORGOT_PASSWORD_ROUTE);
    }
    expect(one(target, NO_PASSWORD_YET).textContent?.trim()).toBe('contestantApp.login.noPasswordYet');
  });

  it('carry no address while none is typed', () => {
    const target = render();
    expect(one(target, FORGOT_PASSWORD).getAttribute('href')).toBe(FORGOT_PASSWORD_ROUTE);
    expect(one(target, NO_PASSWORD_YET).getAttribute('href')).toBe(FORGOT_PASSWORD_ROUTE);
  });

  it('carry the address as it is typed', () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    for (const selector of [FORGOT_PASSWORD, NO_PASSWORD_YET]) {
      const href = new URL(one(target, selector).getAttribute('href')!, 'http://localhost');
      expect(href.pathname).toBe(FORGOT_PASSWORD_ROUTE);
      expect(href.searchParams.get('email')).toBe(ADDRESS);
    }
  });

  it('ask for nothing, need no address and say nothing at the field', () => {
    const target = render();
    const actions = one(target, SUBMIT).closest('section');
    const buttons = [...(actions?.querySelectorAll('button') ?? [])].map((button) =>
      button.getAttribute('data-testid')
    );
    expect(buttons, "the page's actions hold no button that asks for a link").toEqual(['login-submit']);
    expect(target.querySelector('[data-testid="login-request-link"]')).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.login.noPasswordYetInfo');
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
    expect(sendEntryLink).not.toHaveBeenCalled();
  });
});

describe('signing in', () => {
  it('sends nothing with both fields empty, says what to enter at each and focuses the first', () => {
    const target = render();
    press(target, SUBMIT);
    expect(posts.length).toBe(1);
    expect(posts[0].cancelled).toBe(true);
    expect(messageOf(one(target, EMAIL_ERROR))).toBe('contestantApp.login.emailRequired');
    expect(messageOf(one(target, PASSWORD_ERROR))).toBe('contestantApp.login.passwordRequired');
    expect(document.activeElement).toBe(one(target, EMAIL));
    expect(stateOf(target)).toBe('idle');
    expect(one<HTMLButtonElement>(target, SUBMIT).textContent?.trim()).toBe('common.login');
  });

  it('sends nothing with the address missing, and focuses the address', () => {
    const target = render();
    type(target, PASSWORD, PASS_PHRASE);
    press(target, SUBMIT);
    expect(posts[0].cancelled).toBe(true);
    expect(target.querySelector(EMAIL_ERROR)).not.toBeNull();
    expect(target.querySelector(PASSWORD_ERROR)).toBeNull();
    expect(document.activeElement).toBe(one(target, EMAIL));
  });

  it('sends nothing with the password missing, and focuses the password', () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    press(target, SUBMIT);
    expect(posts[0].cancelled).toBe(true);
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
    const input = one<HTMLInputElement>(target, PASSWORD);
    const error = one(target, PASSWORD_ERROR);
    expect(messageOf(error)).toBe('contestantApp.login.passwordRequired');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
    expect(document.activeElement).toBe(input);
  });

  it('sends a password of spaces alone', () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    type(target, PASSWORD, '   ');
    press(target, SUBMIT);
    expect(posts[0].cancelled).toBe(false);
  });

  it('reads "Loading…" and takes no second press while the sign-in runs', () => {
    const target = render();
    signIn(target);
    const submit = one<HTMLButtonElement>(target, SUBMIT);
    expect(stateOf(target)).toBe('submitting');
    expect(labelOf(submit)).toBe('common.loading');
    expect(submit.disabled).toBe(true);
    press(target, SUBMIT);
    expect(posts.length).toBe(1);
    expect(one<HTMLInputElement>(target, EMAIL).value).toBe(ADDRESS);
    expect(one<HTMLInputElement>(target, PASSWORD).value).toBe(PASS_PHRASE);
  });

  it.each([
    [400, 'error.wrongEmailOrPassword'],
    [403, 'contestantApp.login.noProfile'],
    [500, 'contestantApp.login.unknownError'],
    [429, 'contestantApp.login.unknownError']
  ])('shows one sentence for a refusal with %i', async (status, sentence) => {
    const target = render();
    const submission = signIn(target);
    await submission.answer({ type: 'failure', status, data: { status } });
    flushSync();
    const failure = one(target, FAILURE);
    expect(messageOf(failure)).toBe(sentence);
    expect(failure.getAttribute('role')).toBe('alert');
    expect(failure.getAttribute('data-status')).toBe(String(status));
    expect(stateOf(target)).toBe('failed');
  });

  it('keeps the address, enables the button again and applies nothing after a refusal', async () => {
    const target = render();
    const submission = signIn(target);
    await submission.answer({ type: 'failure', status: 400, data: { status: 400 } });
    flushSync();
    expect(one<HTMLInputElement>(target, EMAIL).value).toBe(ADDRESS);
    const submit = one<HTMLButtonElement>(target, SUBMIT);
    expect(submit.disabled).toBe(false);
    expect(submit.textContent?.trim()).toBe('common.login');
    expect(applyAction).not.toHaveBeenCalled();
    expect(clearEntryFlow).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(target.querySelector(EMAIL_ERROR)).toBeNull();
    expect(target.querySelector(PASSWORD_ERROR)).toBeNull();
  });

  it('leaves focus on the button after a refusal, also when the browser dropped it while the button was unavailable', async () => {
    const target = render();
    type(target, EMAIL, ADDRESS);
    type(target, PASSWORD, PASS_PHRASE);
    const submit = one<HTMLButtonElement>(target, SUBMIT);
    submit.focus();
    press(target, SUBMIT);
    // jsdom keeps focus on a button that becomes disabled, where a browser may drop it: drop it by hand.
    const email = one(target, EMAIL);
    email.focus();
    email.blur();
    expect(document.activeElement).toBe(document.body);
    await posts[0].answer({ type: 'failure', status: 400, data: { status: 400 } });
    await settle();
    expect(document.activeElement).toBe(submit);
  });

  it('hides the last refusal while the next sign-in runs', async () => {
    const target = render();
    const first = signIn(target);
    await first.answer({ type: 'failure', status: 400, data: { status: 400 } });
    flushSync();
    press(target, SUBMIT);
    expect(posts.length).toBe(2);
    expect(stateOf(target)).toBe('submitting');
    expect(target.querySelector(FAILURE)).toBeNull();
  });

  it("clears the entry flow and then follows the action's redirect", async () => {
    const order = new Array<string>();
    clearEntryFlow.mockImplementation(() => order.push('clear'));
    applyAction.mockImplementation(async () => {
      order.push('apply');
    });
    const target = render();
    const submission = signIn(target);
    const result = { type: 'redirect', status: 303, location: '/en/contestant' };
    await submission.answer(result);
    flushSync();
    expect(order).toEqual(['clear', 'apply']);
    expect(applyAction).toHaveBeenCalledWith(result);
    expect(target.querySelector(FAILURE)).toBeNull();
  });
});

describe('a page rendered after a post', () => {
  it.each([
    [400, 'error.wrongEmailOrPassword'],
    [403, 'contestantApp.login.noProfile'],
    [500, 'contestantApp.login.unknownError']
  ])("shows the sentence for the action's refusal with %i", (status, sentence) => {
    const target = render({ form: { status } });
    const failure = one(target, FAILURE);
    expect(messageOf(failure)).toBe(sentence);
    expect(failure.getAttribute('data-status')).toBe(String(status));
    expect(stateOf(target)).toBe('failed');
  });

  it('shows no refusal when nothing was posted', () => {
    const target = render({ form: null });
    expect(target.querySelector(FAILURE)).toBeNull();
    expect(stateOf(target)).toBe('idle');
  });
});
