/**
 * The "email sent" screen, mounted for real with its real body, resend control and support block against a fake contestant context, under a fake clock.
 *
 * The fake context's `entryFlow` is reactive behind a getter and replaced whole on every write, as the real accessor is. Its `t` returns its key, followed by its parameters when it has any; the two first sentences that name an address return their key and the address in `<strong>`, as their translations hold it. Its `getRoute` builds routes with the real `buildRoute` from an empty set of route params. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **Nothing held** — no part of the screen is rendered, and the visitor is led to the login screen in place of this history entry.
 * 2. **The frame** — the screen's marker, its three state attributes, a heading that can take focus and the envelope.
 * 3. **The address and the way back to it** — shown only for an address the user typed, with a link to the screen it was typed on.
 * 4. **Asking again** — unavailable while the count runs; a press when it has ended repeats the held request once.
 * 5. **The panel and the actions** — support as a link inside the panel's sentence and Send again after it, in the panel; no support button and no filled button; another address and the way back to the login screen among the actions.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_WAIT_SECONDS } from '$lib/contestant/entryFlow';
import { buildRoute } from '$lib/routes';
import type { EntryFlow, EntryHeldRequest } from '$lib/contestant/entryFlow';
import type { Route, RouteOptions } from '$lib/routes';

const { goto, resendEntryLink, fakeT } = vi.hoisted(() => {
  /** The first sentences that name an address, as the fake `t` writes them: their key, then the address in bold, as their translations hold it. */
  const withAddress: Record<string, string> = {
    'contestantApp.emailSent.intro.signInTo': 'contestantApp.emailSent.intro.signInTo <strong>{email}</strong>',
    'contestantApp.emailSent.intro.recoveryTo': 'contestantApp.emailSent.intro.recoveryTo <strong>{email}</strong>',
    'contestantApp.emailSent.support': 'contestantApp.emailSent.support {contactSupportLink}'
  };
  return {
    goto: vi.fn(),
    resendEntryLink: vi.fn(),
    fakeT: (key: string, params?: Record<string, unknown>): string =>
      key in withAddress
        ? withAddress[key]
            .replace('{email}', String(params?.email))
            .replace('{contactSupportLink}', String(params?.contactSupportLink))
        : params
          ? `${key} ${JSON.stringify(params)}`
          : key
  };
});

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

/** What the fake context holds. Replaced whole on every write, never changed in place. */
let heldFlow = $state.raw<EntryFlow | undefined>(undefined);

const context = {
  t: fakeT,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  resendEntryLink,
  appSettings: { admin: { email: 'support@example.test' }, contestantApp: { entityTypes: ['candidate'] } },
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

const EmailSentPage = (await import('./+page.svelte')).default;

const FRAME = '[data-testid="contestant-email-sent"]';
const ADDRESS_SHOWN = '[data-testid="email-sent-address"]';
const ASKED_AGAIN = '[data-testid="email-sent-asked-again"]';
const STATUS = '[data-testid="email-sent-status"]';
const RESEND = '[data-testid="email-sent-resend"]';
const COUNTDOWN = '[data-testid="email-sent-countdown"]';
const CHANGE_ADDRESS = '[data-testid="email-sent-change-address"]';
const RETURN = '[data-testid="email-sent-return"]';
const SUPPORT = '[data-testid="contestant-contact-support"]';
const SUPPORT_SENTENCE = '[data-testid="email-sent-support"]';
const PANEL = '[data-testid="email-sent-panel"]';
const ACTIONS = 'section[aria-label="common.primaryActions"]';

/** An arbitrary moment the fake clock starts at, and the held request settled at. */
const SETTLED_AT = Date.UTC(2030, 0, 1, 12, 0, 0);
const WAIT_MS = RESEND_WAIT_SECONDS * 1000;

const ADDRESS = 'someone@example.test';

/** The route of a key as the fake context builds it. */
function routeOf(route: Route): string {
  return buildRoute({ route }, { params: {} });
}

/**
 * A held request that settled when the fake clock started.
 * @param given - The members that differ from a request the sign-in screen made with a typed address.
 */
function requestWith(given: Partial<EntryHeldRequest> = {}): EntryHeldRequest {
  return { origin: 'signIn', email: ADDRESS, wording: 'signIn', settledAt: SETTLED_AT, askedAgain: false, ...given };
}

/** A request the screen that signs in the holder of a used code made: a code and no address. */
function codeRequest(given: Partial<EntryHeldRequest> = {}): EntryHeldRequest {
  return {
    origin: 'registerSignIn',
    code: 'a-code',
    wording: 'code',
    settledAt: SETTLED_AT,
    askedAgain: false,
    ...given
  };
}

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(SETTLED_AT);
  heldFlow = undefined;
  goto.mockResolvedValue(undefined);
  resendEntryLink.mockResolvedValue(undefined);
  // Every error message shown is also logged: keep the log out of the test output.
  vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/**
 * Mount the page over a flow, without running its effects.
 * @param held - What the context holds.
 * @returns The element the page was mounted into.
 */
function renderOver(held: EntryFlow | undefined): HTMLElement {
  heldFlow = held;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(EmailSentPage, { target, props: {} as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Mount the page over a held request, or over nothing, and run its effects. */
function render(request?: EntryHeldRequest): HTMLElement {
  const target = renderOver(request ? { request } : undefined);
  flushSync();
  return target;
}

function one<TElement extends HTMLElement = HTMLElement>(target: ParentNode, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found.length, `exactly one ${selector} should be rendered`).toBe(1);
  return found[0];
}

function press(target: HTMLElement, selector: string): void {
  one(target, selector).click();
  flushSync();
}

/** Move the fake clock on and apply what the count wrote. */
function advance(ms: number): void {
  vi.advanceTimersByTime(ms);
  flushSync();
}

/** Let awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  flushSync();
}

describe('with nothing held', () => {
  it('renders no part of the screen before the page has mounted', () => {
    const target = renderOver(undefined);
    expect(target.querySelector(FRAME)).toBeNull();
    expect(target.querySelector('h1')).toBeNull();
    expect(target.querySelector(RESEND)).toBeNull();
    expect(goto).not.toHaveBeenCalled();
  });

  it('leads to the login screen in place of this history entry, and still renders nothing', () => {
    const target = render();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(routeOf('ContestantAppLogin'), { replaceState: true });
    expect(target.querySelector(FRAME)).toBeNull();
    expect(target.querySelector('h1')).toBeNull();
    expect(target.querySelector(RESEND)).toBeNull();
    expect(target.querySelector(SUPPORT)).toBeNull();
    expect(resendEntryLink).not.toHaveBeenCalled();
  });

  it('does the same over a flow that holds a registration code and no request', () => {
    const target = renderOver({ code: { code: 'a-code', status: 'valid' } });
    flushSync();
    expect(target.querySelector(FRAME)).toBeNull();
    expect(goto).toHaveBeenCalledWith(routeOf('ContestantAppLogin'), { replaceState: true });
  });

  it('leaves the screen when the held request goes while it is shown', () => {
    const target = render(requestWith());
    expect(target.querySelector(FRAME)).not.toBeNull();
    expect(goto).not.toHaveBeenCalled();
    heldFlow = undefined;
    flushSync();
    expect(target.querySelector(FRAME)).toBeNull();
    expect(goto).toHaveBeenCalledTimes(1);
    expect(goto).toHaveBeenCalledWith(routeOf('ContestantAppLogin'), { replaceState: true });
  });
});

describe('the frame', () => {
  it.each([
    ['signIn', requestWith()],
    ['recovery', requestWith({ origin: 'forgotPassword', wording: 'recovery' })],
    ['code', codeRequest()]
  ] as const)('carries the wording %s of the held request, and shows its first sentence', (wording, request) => {
    const target = render(request);
    expect(one(target, FRAME).getAttribute('data-wording')).toBe(wording);
    expect(target.textContent).toContain(`contestantApp.emailSent.intro.${wording}`);
    expect(goto).not.toHaveBeenCalled();
  });

  it("has one heading that can take focus, under the app's name", () => {
    const target = render(requestWith());
    const heading = one(target, 'h1');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(heading.textContent?.trim()).toBe('contestantApp.emailSent.title');
    expect(target.textContent).toContain('dynamic.contestantAppName.');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it('shows the envelope as a presentational figure', () => {
    const target = render(requestWith());
    expect(one(target, 'figure[role="presentation"]').textContent?.trim()).toBe('contestantApp.emailSent.heroEmoji');
  });

  it('says that the request was asked again when the held request says so', () => {
    expect(render(requestWith()).querySelector(ASKED_AGAIN)).toBeNull();
    expect(render(requestWith({ askedAgain: true })).querySelector(ASKED_AGAIN)).not.toBeNull();
  });

  it('follows a request that replaces the held one', () => {
    const target = render(requestWith());
    heldFlow = { request: requestWith({ origin: 'forgotPassword', wording: 'recovery' }) };
    flushSync();
    expect(one(target, FRAME).getAttribute('data-wording')).toBe('recovery');
  });
});

describe('the address and the way back to it', () => {
  it('names the address the user typed, as text in bold, in the first sentence', () => {
    const target = render(requestWith());
    expect(one(target, FRAME).getAttribute('data-address')).toBe('shown');
    const address = one(target, ADDRESS_SHOWN);
    expect(address.tagName).toBe('STRONG');
    expect(address.textContent).toBe(ADDRESS);
    const intro = address.closest('p');
    expect(intro?.textContent?.trim()).toBe(`contestantApp.emailSent.intro.signInTo ${ADDRESS}`);
    expect(target.querySelector('dl')).toBeNull();
  });

  it.each([
    ['the sign-in screen', 'signIn', 'ContestantAppSignIn'],
    ['the registration page', 'register', 'ContestantAppRegister'],
    ['the forgot-password page', 'forgotPassword', 'ContestantAppForgotPassword'],
    ['the screen that takes the address for a registration code', 'registerEmail', 'ContestantAppRegisterEmail']
  ] as const)('links back to %s for an address typed there', (_name, origin, route) => {
    const target = render(requestWith({ origin, wording: origin === 'forgotPassword' ? 'recovery' : 'signIn' }));
    const link = one(target, CHANGE_ADDRESS);
    expect(link.getAttribute('href')).toBe(routeOf(route));
    expect(link.textContent?.trim()).toBe('contestantApp.emailSent.changeAddress');
  });

  it('links back to the screen that took the address for a code the flow still holds', () => {
    const target = renderOver({
      code: { code: 'a-code', status: 'valid' },
      request: requestWith({ origin: 'registerEmail', code: 'a-code' })
    });
    flushSync();
    expect(one(target, FRAME).getAttribute('data-address')).toBe('shown');
    expect(one(target, ADDRESS_SHOWN).textContent).toBe(ADDRESS);
    expect(one(target, CHANGE_ADDRESS).getAttribute('href')).toBe(routeOf('ContestantAppRegisterEmail'));
    expect(target.innerHTML, 'the code is nowhere in the document').not.toContain('a-code');
  });

  it('shows neither an address nor a link back for a request made with a code alone', () => {
    const target = render(codeRequest());
    expect(one(target, FRAME).getAttribute('data-address')).toBe('none');
    expect(target.querySelector(ADDRESS_SHOWN)).toBeNull();
    expect(target.querySelector(CHANGE_ADDRESS)).toBeNull();
    expect(target.textContent).toContain('contestantApp.emailSent.notFound.withoutAddress');
  });

  it('shows neither for the code wording even when the request carries an address', () => {
    const target = render(codeRequest({ email: ADDRESS }));
    expect(one(target, FRAME).getAttribute('data-address')).toBe('none');
    expect(target.querySelector(ADDRESS_SHOWN)).toBeNull();
    expect(target.querySelector(CHANGE_ADDRESS)).toBeNull();
    expect(target.textContent).not.toContain(ADDRESS);
  });
});

describe('asking again', () => {
  it('is unavailable while the count runs, and a press calls nothing', () => {
    const target = render(requestWith());
    expect(one(target, FRAME).getAttribute('data-resend')).toBe('waiting');
    const resend = one(target, RESEND);
    expect(resend.getAttribute('aria-disabled')).toBe('true');
    expect(resend.getAttribute('aria-describedby')).toBe(one(target, COUNTDOWN).id);
    expect(resend.contains(one(target, COUNTDOWN)), 'the count is inside Send again').toBe(true);
    expect(one(target, COUNTDOWN).textContent).toContain('contestantApp.emailSent.resendIn');
    expect(one(target, COUNTDOWN).textContent).toContain(`"seconds":${RESEND_WAIT_SECONDS}`);
    press(target, RESEND);
    expect(resendEntryLink).not.toHaveBeenCalled();
    expect(one(target, STATUS).textContent?.trim()).toBe('');
  });

  it('counts down on the clock, and is ready when the count has ended', () => {
    const target = render(requestWith());
    advance(10_000);
    expect(one(target, COUNTDOWN).textContent).toContain(`"seconds":${RESEND_WAIT_SECONDS - 10}`);
    expect(one(target, FRAME).getAttribute('data-resend')).toBe('waiting');
    advance(WAIT_MS - 10_000);
    expect(one(target, FRAME).getAttribute('data-resend')).toBe('ready');
    expect(target.querySelector(COUNTDOWN)).toBeNull();
    expect(one(target, RESEND).hasAttribute('aria-disabled')).toBe(false);
    expect(one(target, STATUS).textContent?.trim()).toBe('contestantApp.emailSent.resendReady');
  });

  it('is ready at once for a request that settled longer ago than the wait', () => {
    const target = render(requestWith({ settledAt: SETTLED_AT - WAIT_MS }));
    expect(one(target, FRAME).getAttribute('data-resend')).toBe('ready');
  });

  it('repeats the held request once on a press when ready, and says so', async () => {
    const settlers = new Array<() => void>();
    resendEntryLink.mockReturnValue(new Promise<void>((resolve) => settlers.push(resolve)));
    const target = render(requestWith());
    advance(WAIT_MS);
    press(target, RESEND);
    await settle();
    expect(resendEntryLink).toHaveBeenCalledTimes(1);
    expect(resendEntryLink).toHaveBeenCalledWith();
    expect(one(target, STATUS).textContent?.trim()).toBe('contestantApp.emailSent.resendRequested');
    const resend = one(target, RESEND);
    expect(resend.getAttribute('aria-busy')).toBe('true');
    expect(resend.getAttribute('aria-disabled')).toBe('true');
    press(target, RESEND);
    expect(resendEntryLink, 'a press while the request runs calls nothing').toHaveBeenCalledTimes(1);

    heldFlow = { request: requestWith({ settledAt: Date.now() }) };
    settlers[0]();
    await settle();
    expect(one(target, RESEND).hasAttribute('aria-busy')).toBe(false);
    expect(one(target, FRAME).getAttribute('data-resend')).toBe('waiting');
    expect(one(target, COUNTDOWN).textContent).toContain(`"seconds":${RESEND_WAIT_SECONDS}`);
    expect(one(target, STATUS).textContent?.trim()).toBe('contestantApp.emailSent.resendRequested');
  });

  it('shows the same screen whatever the repeated request resolved to', async () => {
    resendEntryLink.mockResolvedValue({ type: 'failure' });
    const target = render(requestWith());
    advance(WAIT_MS);
    const before = one(target, FRAME).getAttribute('data-wording');
    press(target, RESEND);
    await settle();
    expect(one(target, FRAME).getAttribute('data-wording')).toBe(before);
    expect(target.querySelector('[data-testid="error-message"]')).toBeNull();
    expect(target.querySelector('[role="alert"]')).toBeNull();
    expect(one(target, STATUS).textContent?.trim()).toBe('contestantApp.emailSent.resendRequested');
  });

  it('stops reading the clock when the page is destroyed', () => {
    render(requestWith());
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    for (const fn of teardown.reverse()) fn();
    teardown = [];
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('the panel and the actions', () => {
  it('gives support as a link inside the panel’s sentence, to the support section of the Help page, and by no button', () => {
    const target = render(requestWith());
    const sentence = one(one(target, PANEL), SUPPORT_SENTENCE);
    expect(sentence.textContent).toContain('contestantApp.emailSent.support');
    const links = sentence.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe(`${routeOf('ContestantAppHelp')}#support`);
    expect(target.querySelector(SUPPORT)).toBeNull();
  });

  it.each([
    ['a typed address', requestWith()],
    ['a code alone', codeRequest()],
    ['a request asked again', requestWith({ askedAgain: true })]
  ])('holds the support sentence, no support button and no filled button with %s', (_name, request) => {
    const target = render(request);
    one(target, SUPPORT_SENTENCE);
    expect(target.querySelector(SUPPORT)).toBeNull();
    expect(target.querySelector('.btn-primary')).toBeNull();
    advance(WAIT_MS);
    one(target, SUPPORT_SENTENCE);
    expect(target.querySelector('.btn-primary')).toBeNull();
  });

  it('puts Send again inside the panel, after its hints and its support sentence, and outside the actions', () => {
    const target = render(requestWith({ askedAgain: true }));
    const panel = one(target, PANEL);
    const resend = one(panel, RESEND);
    const order = [one(panel, ASKED_AGAIN), one(panel, SUPPORT_SENTENCE), resend];
    for (let i = 1; i < order.length; i += 1)
      expect(
        order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING,
        `part ${i} of the panel should follow part ${i - 1}`
      ).toBeTruthy();
    expect(one(target, ACTIONS).contains(resend)).toBe(false);
  });

  it('leads back to the login screen', () => {
    const target = render(requestWith());
    expect(one(target, RETURN).getAttribute('href')).toBe(routeOf('ContestantAppLogin'));
  });

  it("are in order among the page's actions: another address, return", () => {
    const target = render(requestWith());
    const actions = one(target, ACTIONS);
    expect(actions.querySelector(RESEND)).toBeNull();
    const order = [CHANGE_ADDRESS, RETURN].map((selector) => one(actions, selector));
    expect(
      order[0].compareDocumentPosition(order[1]) & Node.DOCUMENT_POSITION_FOLLOWING,
      'return should follow another address'
    ).toBeTruthy();
  });
});
