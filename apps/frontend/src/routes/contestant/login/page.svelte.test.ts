/**
 * The login screen, mounted for real against a fake contestant context.
 *
 * The fake context's `t` returns its key, its `getRoute` builds routes with the real `buildRoute` over the stubbed page's address, as the real one does, and its `appSettings` and `answersLocked` are reactive behind getters, as the real accessors are. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The frame** — the screen's marker and what it states about itself, a heading that can take focus and holds the app's name, and no field.
 * 2. **The entries** — "Sign in with email" always, "Register" exactly when a registration mode is listed, each a link that works with no script.
 * 3. **While answers are locked** — the sentence, and no "Register".
 * 4. **The notice** — a sentence for each of the two reasons a visitor is sent here with, and nothing for any other text in the address bar.
 * 5. **A deep link's target** — carried on by the first entry as it is, and by nothing else.
 * 6. **The links under the entries** — the help page, and the voter app where it is accessible.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from '$app/state';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

const { goto } = vi.hoisted(() => ({ goto: vi.fn() }));

// The other members stay the resolvable stubs: components the page reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), goto }));

type Modes = Array<'identity_provider' | 'email' | 'code'>;

const settings = $state<{
  entityTypes: Array<'candidate' | 'organization'>;
  candidate: Modes;
  organization: Modes;
  answersLocked: boolean;
  voterApp: boolean;
}>({
  entityTypes: ['candidate', 'organization'],
  candidate: ['email', 'code'],
  organization: [],
  answersLocked: false,
  voterApp: false
});

const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {}, url: page.url }) },
  appCustomization: { current: {} },
  darkMode: { current: false },
  get appSettings() {
    return {
      contestantApp: {
        entityTypes: settings.entityTypes,
        registrationModes: { candidate: settings.candidate, organization: settings.organization }
      },
      access: { answersLocked: settings.answersLocked, voterApp: settings.voterApp }
    };
  },
  get answersLocked() {
    return settings.answersLocked;
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({ t: (key: string) => key, appCustomization: { current: {} } })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { topBarUse } = vi.hoisted(() => ({ topBarUse: vi.fn() }));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { use: () => undefined },
    topBarSettings: { use: topBarUse }
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

const LoginPage = (await import('./+page.svelte')).default;

const FRAME = '[data-testid="contestant-login"]';
const SIGN_IN = '[data-testid="login-sign-in-link"]';
const REGISTER = '[data-testid="login-register-link"]';
const NOTICE = '[data-testid="login-notice"]';
const LOCKED_INFO = '[data-testid="login-answers-locked-info"]';
const HELP = '[data-testid="login-help-link"]';
const VOTER_APP = '[data-testid="login-voter-app-link"]';

const LOGIN_ADDRESS = 'http://localhost/en/contestant/login';
const SIGN_IN_ROUTE = buildRoute({ route: 'ContestantAppSignIn' }, { params: {} });
const REGISTER_ROUTE = buildRoute({ route: 'ContestantAppRegister' }, { params: {} });

let teardown: Array<() => void> = [];

/** Set the address the stubbed `page` answers with. The application's type narrows the pathname to the route tree, which the stub's plain member does not. */
function setAddress(address: string): void {
  (page as { url: URL }).url = new URL(address);
}

beforeEach(() => {
  settings.entityTypes = ['candidate', 'organization'];
  settings.candidate = ['email', 'code'];
  settings.organization = [];
  settings.answersLocked = false;
  settings.voterApp = false;
  setAddress(LOGIN_ADDRESS);
  goto.mockResolvedValue(undefined);
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

/**
 * Mount the page without running its effects, as the server's markup is before the page's script has run.
 * @returns The element the page was mounted into.
 */
function renderUnmounted(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(LoginPage, { target, props: {} as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Mount the page and run its effects, as when its script has loaded. */
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

/** The label of a button: its text, as a user reads it. */
function labelOf(button: HTMLElement): string | undefined {
  return one(button, '.uc-first').textContent?.trim();
}

/** The sentence of an inline message, without the emoji before it. */
function messageOf(message: HTMLElement): string | undefined {
  return message.textContent?.replace('dynamic.error.heroEmoji', '').trim();
}

/** Whether `first` stands before `second` in the document. */
function precedes(first: Node, second: Node): boolean {
  return (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

describe('the frame', () => {
  it('carries the marker of the screen and says what it offers', () => {
    const target = render();
    const frame = one(target, FRAME);
    expect(frame.getAttribute('data-register-offered')).toBe('true');
    expect(frame.getAttribute('data-answers-locked')).toBe('false');
  });

  it("has one heading that can take focus and holds the app's name", () => {
    const target = render();
    const heading = one(target, 'h1');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(heading.textContent?.trim()).toBe('dynamic.contestantAppName.candidateAndOrganization');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it('names the app after the entity types the project serves', () => {
    settings.entityTypes = ['organization'];
    const target = render();
    expect(one(target, 'h1').textContent?.trim()).toBe('dynamic.contestantAppName.organization');
  });

  it('holds no form and no field', () => {
    const target = render();
    expect(target.querySelector('form')).toBeNull();
    expect(target.querySelector('input, textarea, select')).toBeNull();
  });

  it('shows the contestant poster in the top bar', () => {
    render();
    expect(topBarUse).toHaveBeenCalledWith({ imageSrc: '/images/hero-contestant.png' });
  });
});

describe('the entries', () => {
  it('offers both as links, sign-in first, with "Or" between them', () => {
    const target = render();
    const signIn = one<HTMLAnchorElement>(target, SIGN_IN);
    const register = one<HTMLAnchorElement>(target, REGISTER);
    expect(signIn.tagName).toBe('A');
    expect(signIn.getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(labelOf(signIn)).toBe('contestantApp.login.signInWithEmail');
    expect(register.tagName).toBe('A');
    expect(register.getAttribute('href')).toBe(REGISTER_ROUTE);
    expect(labelOf(register)).toBe('contestantApp.register.register');

    const divider = one(target, '.divider');
    expect(divider.textContent?.trim()).toBe('common.or');
    expect(precedes(signIn, divider), '"Or" follows the sign-in entry').toBe(true);
    expect(precedes(divider, register), '"Or" comes before Register').toBe(true);
  });

  it('renders both entries as links before the script has run', () => {
    const target = renderUnmounted();
    expect(one(target, SIGN_IN).getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(one(target, REGISTER).getAttribute('href')).toBe(REGISTER_ROUTE);
    expect(one(target, SIGN_IN).hasAttribute('disabled')).toBe(false);
    expect(one(target, REGISTER).hasAttribute('disabled')).toBe(false);
  });

  it.each<[string, Modes]>([
    ['the email mode alone', ['email']],
    ['the code mode alone', ['code']],
    ["the identity provider's mode alone", ['identity_provider']]
  ])('offers Register for %s', (_, modes) => {
    settings.candidate = modes;
    const target = render();
    expect(one(target, FRAME).getAttribute('data-register-offered')).toBe('true');
    expect(target.querySelectorAll(REGISTER)).toHaveLength(1);
  });

  it('offers sign-in alone where no mode is listed: no Register, no "Or" and nothing in their place', () => {
    settings.candidate = [];
    const target = render();
    expect(one(target, FRAME).getAttribute('data-register-offered')).toBe('false');
    expect(one(target, SIGN_IN).getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(target.querySelector(REGISTER)).toBeNull();
    expect(target.querySelector('.divider')).toBeNull();
    expect(target.querySelector('[disabled], [aria-disabled="true"], [hidden]')).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.register.register');
    expect(target.textContent).not.toContain('common.or');
  });

  it("offers no Register where the identity provider's mode is allowed for organizations alone", () => {
    settings.candidate = [];
    settings.organization = ['identity_provider'];
    const target = render();
    expect(one(target, FRAME).getAttribute('data-register-offered')).toBe('false');
    expect(target.querySelector(REGISTER)).toBeNull();
  });

  it('offers no Register for a mode of an entity type the project does not serve', () => {
    settings.entityTypes = ['candidate'];
    settings.candidate = [];
    settings.organization = ['code'];
    const target = render();
    expect(target.querySelector(REGISTER)).toBeNull();
  });

  it('follows the registration modes when they change', () => {
    settings.candidate = [];
    const target = render();
    expect(target.querySelector(REGISTER)).toBeNull();
    settings.candidate = ['code'];
    flushSync();
    expect(one(target, FRAME).getAttribute('data-register-offered')).toBe('true');
    expect(target.querySelectorAll(REGISTER)).toHaveLength(1);
    expect(target.querySelectorAll('.divider')).toHaveLength(1);
  });

  it('leads nowhere else: not to the pre-registration start, and not to the forgot-password page', () => {
    settings.candidate = ['identity_provider', 'email', 'code'];
    const target = render();
    const addresses = Array.from(target.querySelectorAll('a[href]')).map((link) => link.getAttribute('href'));
    expect(addresses).not.toContain(buildRoute({ route: 'ContestantAppPreregister' }, { params: {} }));
    expect(addresses).not.toContain(buildRoute({ route: 'ContestantAppForgotPassword' }, { params: {} }));
    expect(target.querySelector('[data-testid="login-preregister"]')).toBeNull();
    expect(target.querySelector('[data-testid="login-show"]')).toBeNull();
    expect(target.querySelector('[data-testid="login-forgot-password-link"]')).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.login.forgotPassword');
  });
});

describe('while answers are locked', () => {
  it('says so under the title, and offers sign-in alone', () => {
    settings.answersLocked = true;
    const target = render();
    const frame = one(target, FRAME);
    expect(frame.getAttribute('data-answers-locked')).toBe('true');
    expect(frame.getAttribute('data-register-offered')).toBe('false');
    const sentence = one(target, LOCKED_INFO);
    expect(sentence.textContent?.trim()).toBe('contestantApp.login.answersLockedInfo');
    expect(precedes(one(target, 'h1'), sentence), 'the sentence follows the title').toBe(true);
    expect(one(target, SIGN_IN).getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(target.querySelector(REGISTER)).toBeNull();
    expect(target.querySelector('.divider')).toBeNull();
  });

  it('shows no such sentence otherwise', () => {
    const target = render();
    expect(target.querySelector(LOCKED_INFO)).toBeNull();
    expect(target.textContent).not.toContain('contestantApp.login.answersLockedInfo');
  });

  it('follows the answers lock when it changes', () => {
    const target = render();
    settings.answersLocked = true;
    flushSync();
    expect(one(target, FRAME).getAttribute('data-answers-locked')).toBe('true');
    expect(target.querySelectorAll(LOCKED_INFO)).toHaveLength(1);
    expect(target.querySelector(REGISTER)).toBeNull();
  });
});

describe('the notice', () => {
  it('shows none for a visitor who was sent here with no reason', () => {
    const target = render();
    expect(target.querySelector(NOTICE)).toBeNull();
    expect(target.querySelector('[role="alert"]')).toBeNull();
  });

  it.each([
    ['loginFailed', 'contestantApp.login.signedOut'],
    ['authError', 'contestantApp.login.linkFailed']
  ])('says why for the reason %s, as an alert under the title', (reason, key) => {
    setAddress(`${LOGIN_ADDRESS}?errorMessage=${reason}`);
    const target = render();
    const notice = one(target, NOTICE);
    expect(notice.getAttribute('data-reason')).toBe(reason);
    expect(notice.getAttribute('role')).toBe('alert');
    expect(messageOf(notice)).toBe(key);
    expect(precedes(one(target, 'h1'), notice), 'the notice follows the title').toBe(true);
    expect(precedes(notice, one(target, SIGN_IN)), 'the notice comes before the entries').toBe(true);
  });

  it('does not show the message of a refused password for either reason', () => {
    setAddress(`${LOGIN_ADDRESS}?errorMessage=loginFailed`);
    const target = render();
    expect(target.textContent).not.toContain('error.loginFailed');
    expect(target.textContent).not.toContain('error.wrongEmailOrPassword');
  });

  it.each([
    'userNotAuthorized',
    'constructor',
    'toString',
    '__proto__',
    'contestantApp.login.signedOut',
    'Your account is locked. Sign in at example.test',
    '<img src=x onerror=alert(1)>',
    ''
  ])('shows nothing for other text in the address bar (%s)', (text) => {
    setAddress(`${LOGIN_ADDRESS}?${new URLSearchParams({ errorMessage: text })}`);
    const target = render();
    expect(target.querySelector(NOTICE)).toBeNull();
    expect(target.querySelector('[role="alert"]')).toBeNull();
    expect(target.querySelector('img')).toBeNull();
    expect(target.textContent).not.toContain('example.test');
    expect(target.textContent).not.toContain('onerror');
  });

  it('keeps both entries beside a notice', () => {
    setAddress(`${LOGIN_ADDRESS}?errorMessage=authError`);
    const target = render();
    expect(one(target, SIGN_IN).getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(one(target, REGISTER).getAttribute('href')).toBe(REGISTER_ROUTE);
  });
});

describe("a deep link's target", () => {
  const TARGET = 'contestant/candidate/00000000-0000-4000-8000-000000000001/profile';

  it('is carried on by "Sign in with email" as it is, and by nothing else', () => {
    setAddress(`${LOGIN_ADDRESS}?${new URLSearchParams({ redirectTo: TARGET })}`);
    const target = render();
    const signIn = new URL(one<HTMLAnchorElement>(target, SIGN_IN).getAttribute('href') ?? '', LOGIN_ADDRESS);
    expect(signIn.pathname).toBe(SIGN_IN_ROUTE);
    expect(Array.from(signIn.searchParams.entries())).toEqual([['redirectTo', TARGET]]);

    expect(one(target, REGISTER).getAttribute('href')).toBe(REGISTER_ROUTE);
    expect(one(target, HELP).getAttribute('href')).toBe(buildRoute({ route: 'ContestantAppHelp' }, { params: {} }));
  });

  it.each(['//example.test/x', 'https://example.test/x', '../admin', 'a b&c=d#e'])(
    'is passed on unread and percent-encoded, whatever it holds (%s)',
    (value) => {
      setAddress(`${LOGIN_ADDRESS}?${new URLSearchParams({ redirectTo: value })}`);
      const target = render();
      const signIn = new URL(one<HTMLAnchorElement>(target, SIGN_IN).getAttribute('href') ?? '', LOGIN_ADDRESS);
      expect(signIn.origin).toBe('http://localhost');
      expect(signIn.pathname).toBe(SIGN_IN_ROUTE);
      expect(signIn.searchParams.get('redirectTo')).toBe(value);
      expect(signIn.hash).toBe('');
      expect(one(target, REGISTER).getAttribute('href')).toBe(REGISTER_ROUTE);
    }
  );

  it('is not rendered and is navigated to by nothing', () => {
    setAddress(`${LOGIN_ADDRESS}?${new URLSearchParams({ redirectTo: TARGET })}`);
    const target = render();
    expect(target.textContent).not.toContain(TARGET);
    expect(goto).not.toHaveBeenCalled();
  });

  it('leaves the sign-in entry at its bare address where the address bar holds none', () => {
    const target = render();
    expect(one(target, SIGN_IN).getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(one(target, SIGN_IN).getAttribute('href')).not.toContain('?');
  });

  it('carries no notice reason on to either entry', () => {
    setAddress(`${LOGIN_ADDRESS}?errorMessage=authError`);
    const target = render();
    expect(one(target, SIGN_IN).getAttribute('href')).toBe(SIGN_IN_ROUTE);
    expect(one(target, REGISTER).getAttribute('href')).toBe(REGISTER_ROUTE);
  });
});

describe('the links under the entries', () => {
  it('leads to the help page', () => {
    const target = render();
    const help = one(target, HELP);
    expect(help.getAttribute('href')).toBe(buildRoute({ route: 'ContestantAppHelp' }, { params: {} }));
    expect(precedes(one(target, SIGN_IN), help), 'the help link follows the entries').toBe(true);
  });

  it('leads to the voter app only where it is accessible', () => {
    const target = render();
    expect(target.querySelector(VOTER_APP)).toBeNull();
    settings.voterApp = true;
    flushSync();
    one(target, VOTER_APP).click();
    expect(goto).toHaveBeenCalledWith(buildRoute({ route: 'Home' }, { params: {} }), { invalidateAll: true });
  });
});
