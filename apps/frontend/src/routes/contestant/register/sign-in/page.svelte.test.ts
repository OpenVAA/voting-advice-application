/**
 * The screen that signs in the holder of a claimed registration code, mounted for real with its real password field against a fake contestant context.
 *
 * The fake context's `entryFlow` is reactive behind a getter and replaced whole on every write, as the real accessor is. Its `t` returns its key, and its `getRoute` builds routes with the real `buildRoute` from an empty set of route params. `$app/forms` is replaced: the fake `enhance` listens for the form's submit event as the real one does, hands the page's callback the posted form data and a `cancel`, and keeps what the callback returned so that a test can answer the post with a result of its choice. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **Without a used code held** — no part of the screen is rendered, and the visitor is led to the registration page in place of this history entry.
 * 2. **The frame** — the screen's marker and state, a heading that can take focus, and the sentence above the form.
 * 3. **The form** — one form posted to the server, holding the held code in a hidden field and the password, and no address of any kind; a submit button outside it that is tied to it.
 * 4. **Signing in** — a press with no password sends nothing; a refusal shows one of three sentences by its status; a sign-in follows the action's redirect and then clears the entry flow.
 * 5. **A page rendered after a post** — shows the refusal the action answered with.
 * 6. **Asking for a link** — a link is asked for once with the held code and no address, and the "email sent" screen opens when the request has settled.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { EntryFlow, EntryHeldCode, EntryHeldRequest } from '$lib/contestant/entryFlow';
import type { RouteOptions } from '$lib/routes';

/** A post the fake `enhance` saw: what was posted, whether the page cancelled it, and the page's handler for its result. */
type Submission = {
  formData: FormData;
  cancelled: boolean;
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
      const submission: Submission = { formData, cancelled: false, answer: async () => undefined };
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

/** What the fake context holds. Replaced whole on every write, never changed in place. */
let heldFlow = $state.raw<EntryFlow | undefined>(undefined);

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  sendEntryLink,
  clearEntryFlow,
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

const CodeSignInPage = (await import('./+page.svelte')).default;

const FRAME = '[data-testid="contestant-register-sign-in"]';
const PASSWORD = '[data-testid="password-field"]';
const PASSWORD_ERROR = '[data-testid="register-sign-in-password-error"]';
const FAILURE = '[data-testid="register-sign-in-error"]';
const FORGOT_PASSWORD = '[data-testid="register-sign-in-forgot-password-link"]';
const SUBMIT = '[data-testid="register-sign-in-submit"]';
const REQUEST_LINK = '[data-testid="register-sign-in-request-link"]';
const RETURN = '[data-testid="register-sign-in-return"]';

const HELD_CODE = 'a-held-code';
const PASS_PHRASE = 'a pass phrase';
const ADDRESS = 'someone@example.test';

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
  applyAction.mockResolvedValue(undefined);
  // Every message shown is also logged as an error: keep the log out of the test output.
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  submissions.length = 0;
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/**
 * Mount the page over a flow, without running its effects.
 * @param held - What the context holds.
 * @param props - The page's props.
 * @returns The element the page was mounted into.
 */
function renderUnmounted(held: EntryFlow | undefined, props: Record<string, unknown> = {}): HTMLElement {
  heldFlow = held;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(CodeSignInPage, { target, props: { form: null, ...props } as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Mount the page over a flow that holds a used code, and run its effects. */
function render(props: Record<string, unknown> = {}): HTMLElement {
  const target = renderUnmounted(flowWith('used'), props);
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

/** Type the password and press the main button. */
function signIn(target: HTMLElement): Submission {
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

describe('without a used code held', () => {
  it.each([
    ['nothing', undefined],
    ['a valid code', flowWith('valid')]
  ])('renders no part of the screen over %s, before the page has mounted', (_name, held) => {
    const target = renderUnmounted(held);
    expect(target.querySelector(FRAME)).toBeNull();
    expect(target.querySelector('form')).toBeNull();
    expect(target.querySelector('h1')).toBeNull();
    expect(goto).not.toHaveBeenCalled();
  });

  it.each([
    ['nothing', undefined],
    ['a valid code', flowWith('valid')],
    ['a link request and no code', { request: HELD_REQUEST }]
  ])(
    'leads to the registration page in place of this history entry over %s, and still renders nothing',
    (_name, held) => {
      const target = renderUnmounted(held);
      flushSync();
      expect(goto).toHaveBeenCalledTimes(1);
      expect(goto).toHaveBeenCalledWith(REGISTER_ROUTE, { replaceState: true });
      expect(target.querySelector(FRAME)).toBeNull();
      expect(target.textContent?.trim()).toBe('');
      expect(sendEntryLink).not.toHaveBeenCalled();
      expect(posts.length).toBe(0);
    }
  );

  it('renders nothing of a refusal either, when the page is rendered after a post with nothing held', () => {
    const target = renderUnmounted(undefined, { form: { status: 400 } });
    flushSync();
    expect(target.textContent?.trim()).toBe('');
    expect(goto).toHaveBeenCalledWith(REGISTER_ROUTE, { replaceState: true });
  });

  it('stays where it is over a used code', () => {
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
  it('carries the marker of the screen and is idle', () => {
    const target = render();
    expect(stateOf(target)).toBe('idle');
  });

  it("has one heading that can take focus, with a title of its own, under the app's name", () => {
    const target = render();
    const heading = one(target, 'h1');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(heading.textContent?.trim()).toBe('contestantApp.register.signIn.title');
    expect(target.textContent).toContain('dynamic.contestantAppName.');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it('says that the user has registered and what to enter', () => {
    const target = render();
    expect(target.textContent).toContain('contestantApp.register.signIn.ingress');
  });

  it('leads back to the registration page', () => {
    const target = render();
    const link = one(target, RETURN);
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe(REGISTER_ROUTE);
    expect(link.textContent?.trim()).toBe('common.return');
  });

  it('has its actions in order: sign in, ask for a link, return', () => {
    const target = render();
    const actions = Array.from(
      one(target, 'section[aria-label="common.primaryActions"]').querySelectorAll('[data-testid]')
    ).map((element) => element.getAttribute('data-testid'));
    expect(actions).toEqual(['register-sign-in-submit', 'register-sign-in-request-link', 'register-sign-in-return']);
  });
});

describe('the form', () => {
  it('is one form posted to the server, with validation left to the page', () => {
    const target = render();
    const form = one<HTMLFormElement>(target, 'form');
    expect(form.getAttribute('method')).toBe('POST');
    expect(form.noValidate).toBe(true);
    expect(form.getAttribute('action'), 'the form posts to its own address, which carries nothing').toBeNull();
    expect(form.id).not.toBe('');
  });

  it('holds the held code in a hidden field named code', () => {
    const target = render();
    const hidden = one<HTMLInputElement>(one(target, 'form'), 'input[name="code"]');
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe(HELD_CODE);
  });

  it('holds the code in that field and nowhere else in the document', () => {
    const target = render();
    expect(target.innerHTML.split(HELD_CODE).length - 1).toBe(1);
    expect(target.textContent).not.toContain(HELD_CODE);
  });

  it('holds the password field, declared as the current password, under a visible label', () => {
    const target = render();
    const input = one<HTMLInputElement>(one(target, 'form'), PASSWORD);
    expect(input.name).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('current-password');
    expect(one(target, `label[for="${input.id}"]`).textContent?.trim()).toBe('common.password');
  });

  it('asks for no address and shows none', () => {
    const target = render();
    expect(target.querySelector('input[type="email"]')).toBeNull();
    expect(target.querySelector('input[name="email"]')).toBeNull();
    expect(target.querySelector('input[name="username"]')).toBeNull();
    const names = Array.from(target.querySelectorAll('input')).map((input) => input.name);
    expect(names.sort()).toEqual(['code', 'password']);
    expect(target.textContent).not.toContain('@');
  });

  it('links to the forgot-password page from inside the form', () => {
    const target = render();
    const link = one(one(target, 'form'), FORGOT_PASSWORD);
    expect(link.getAttribute('href')).toBe(buildRoute({ route: 'ContestantAppForgotPassword' }, { params: {} }));
  });

  it("has its submit button outside it, among the page's actions, tied to it by its id", () => {
    const target = render();
    const form = one<HTMLFormElement>(target, 'form');
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('submit');
    expect(button.getAttribute('form')).toBe(form.id);
    expect(form.contains(button)).toBe(false);
    expect(button.textContent?.trim()).toBe('common.login');
    expect(button.disabled).toBe(false);
  });

  it('is submitted by a press of that button, with the held code and the password in its body', () => {
    const target = render();
    const submission = signIn(target);
    expect(submission.cancelled).toBe(false);
    expect(submission.formData.get('code')).toBe(HELD_CODE);
    expect(submission.formData.get('password')).toBe(PASS_PHRASE);
    expect(Array.from(submission.formData.keys()).sort()).toEqual(['code', 'password']);
  });
});

describe('signing in', () => {
  it('sends nothing with the password empty, says what to enter at the field and focuses it', () => {
    const target = render();
    press(target, SUBMIT);
    expect(posts.length).toBe(1);
    expect(posts[0].cancelled).toBe(true);
    const input = one<HTMLInputElement>(target, PASSWORD);
    const error = one(target, PASSWORD_ERROR);
    expect(messageOf(error)).toBe('contestantApp.login.passwordRequired');
    expect(error.getAttribute('role')).toBe('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
    expect(document.activeElement).toBe(input);
    expect(stateOf(target)).toBe('idle');
    expect(labelOf(one(target, SUBMIT))).toBe('common.login');
  });

  it('clears that message when the password is edited', () => {
    const target = render();
    press(target, SUBMIT);
    expect(target.querySelector(PASSWORD_ERROR)).not.toBeNull();
    type(target, PASSWORD, 'a');
    expect(target.querySelector(PASSWORD_ERROR)).toBeNull();
  });

  it('sends a password of spaces alone', () => {
    const target = render();
    type(target, PASSWORD, '   ');
    press(target, SUBMIT);
    expect(posts[0].cancelled).toBe(false);
  });

  it('reads "Loading…" and sends nothing for a second submit while the sign-in runs', () => {
    const target = render();
    signIn(target);
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(stateOf(target)).toBe('submitting');
    expect(labelOf(button)).toBe('common.loading');
    expect(button.disabled).toBe(true);
    press(target, SUBMIT);
    expect(posts.length, 'a press of the unavailable button submits nothing').toBe(1);
    submit(target);
    expect(posts.length).toBe(2);
    expect(posts[1].cancelled, 'a submit that reaches the page while one runs is cancelled').toBe(true);
    expect(stateOf(target)).toBe('submitting');
    expect(one<HTMLInputElement>(target, PASSWORD).value).toBe(PASS_PHRASE);
  });

  it.each([
    [400, 'contestantApp.register.signIn.failed'],
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

  it('keeps the code, enables the button again and applies nothing after a refusal', async () => {
    const target = render();
    const submission = signIn(target);
    await submission.answer({ type: 'failure', status: 400, data: { status: 400 } });
    flushSync();
    expect(one<HTMLInputElement>(target, 'input[name="code"]').value).toBe(HELD_CODE);
    const button = one<HTMLButtonElement>(target, SUBMIT);
    expect(button.disabled).toBe(false);
    expect(button.textContent?.trim()).toBe('common.login');
    expect(applyAction).not.toHaveBeenCalled();
    expect(clearEntryFlow).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(target.querySelector(PASSWORD_ERROR)).toBeNull();
  });

  it('leaves focus on the button after a refusal, also when the browser dropped it while the button was unavailable', async () => {
    const target = render();
    type(target, PASSWORD, PASS_PHRASE);
    const button = one<HTMLButtonElement>(target, SUBMIT);
    button.focus();
    press(target, SUBMIT);
    // jsdom keeps focus on a button that becomes disabled, where a browser may drop it: drop it by hand.
    const password = one(target, PASSWORD);
    password.focus();
    password.blur();
    expect(document.activeElement).toBe(document.body);
    await posts[0].answer({ type: 'failure', status: 400, data: { status: 400 } });
    await settle();
    expect(document.activeElement).toBe(button);
  });

  it('hides the last refusal while the next sign-in runs', async () => {
    const target = render();
    const first = signIn(target);
    await first.answer({ type: 'failure', status: 400, data: { status: 400 } });
    flushSync();
    press(target, SUBMIT);
    expect(posts.length).toBe(2);
    expect(posts[1].cancelled).toBe(false);
    expect(stateOf(target)).toBe('submitting');
    expect(target.querySelector(FAILURE)).toBeNull();
  });

  it("follows the action's redirect, and clears the entry flow only when that has ended", async () => {
    const order = new Array<string>();
    const navigations = new Array<() => void>();
    clearEntryFlow.mockImplementation(() => order.push('clear'));
    applyAction.mockImplementation(() => {
      order.push('apply');
      return new Promise<void>((resolve) => navigations.push(resolve));
    });
    const target = render();
    const submission = signIn(target);
    const result = { type: 'redirect', status: 303, location: '/en/contestant' };
    const answered = submission.answer(result);
    await settle();
    expect(order, 'the code is held, and the screen shown, while the redirect is followed').toEqual(['apply']);
    expect(applyAction).toHaveBeenCalledWith(result);
    one(target, FRAME);
    expect(goto, 'nothing leads to the registration page meanwhile').not.toHaveBeenCalled();

    navigations[0]();
    await answered;
    expect(order).toEqual(['apply', 'clear']);
    expect(target.querySelector(FAILURE)).toBeNull();
  });

  it('applies an error of the post and keeps the entry flow', async () => {
    const target = render();
    const submission = signIn(target);
    const result = { type: 'error', error: new Error('the post failed') };
    await submission.answer(result);
    flushSync();
    expect(applyAction).toHaveBeenCalledWith(result);
    expect(clearEntryFlow).not.toHaveBeenCalled();
    expect(stateOf(target)).toBe('idle');
  });
});

describe('a page rendered after a post', () => {
  it.each([
    [400, 'contestantApp.register.signIn.failed'],
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

describe('asking for a link', () => {
  it('is a plain button that cannot post the form, described by its line', () => {
    const target = render();
    const button = one<HTMLButtonElement>(target, REQUEST_LINK);
    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('button');
    expect(button.hasAttribute('form')).toBe(false);
    expect(one(target, 'form').contains(button)).toBe(false);
    expect(button.textContent?.trim()).toBe('contestantApp.login.noPasswordYet');
    const line = target.ownerDocument.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(line?.textContent?.trim()).toBe('contestantApp.register.signIn.noPasswordYetInfo');
  });

  it('is natively disabled until the page has mounted, and the submit button is not', () => {
    const target = renderUnmounted(flowWith('used'));
    expect(one<HTMLButtonElement>(target, REQUEST_LINK).disabled).toBe(true);
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
    flushSync();
    expect(one<HTMLButtonElement>(target, REQUEST_LINK).disabled).toBe(false);
  });

  it('asks for a link once, from this screen, with the held code and no address, and posts nothing', () => {
    const target = render();
    type(target, PASSWORD, PASS_PHRASE);
    press(target, REQUEST_LINK);
    expect(sendEntryLink).toHaveBeenCalledTimes(1);
    expect(sendEntryLink).toHaveBeenCalledWith({ origin: 'registerSignIn', code: HELD_CODE });
    expect(Object.keys(sendEntryLink.mock.calls[0][0]).sort()).toEqual(['code', 'origin']);
    expect(posts.length).toBe(0);
    expect(target.querySelector(PASSWORD_ERROR), 'the password is not asked for').toBeNull();
  });

  it('reads "Loading…" and takes no second press while its request runs, and leaves only then', async () => {
    const settlers = new Array<() => void>();
    sendEntryLink.mockReturnValue(new Promise<void>((resolve) => settlers.push(resolve)));
    const target = render();
    press(target, REQUEST_LINK);
    await settle();
    const button = one<HTMLButtonElement>(target, REQUEST_LINK);
    expect(labelOf(button)).toBe('common.loading');
    expect(button.disabled).toBe(true);
    press(target, REQUEST_LINK);
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
    press(target, REQUEST_LINK);
    await settle();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(EMAIL_SENT_ROUTE);
    expect(target.querySelector(FAILURE)).toBeNull();
    expect(stateOf(target)).toBe('idle');
  });
});
