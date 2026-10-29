/**
 * `IdentityProviderGate`, mounted for real against a fake contestant context, a fake page and a stubbed endpoint.
 *
 * The user-level data and the answers lock are read through the context, the arrival marker through the page's data. Messages render as their keys, a message with a payload as its key followed by the payload, so a case reads which sentence is shown and not its words.
 *
 * What this file holds:
 *
 * 1. **The variants** — which title, lead, address, fields and actions each combination of the address state, the marker, an unnamed party and the answers lock shows, and the state attributes on the container.
 * 2. **What is never shown** — the placeholder address nowhere, the pending address only in the variant that waits for its link.
 * 3. **Continue with a form** — an incomplete form sends nothing and focuses the first field in error; a complete one saves and reruns the loads; an address another account holds is told at its field; any other failure is one sentence under the form.
 * 4. **Continue without a form** — the arrival notice is acknowledged and the loads rerun.
 * 5. **Send again** — the request, the count, the two announcements, and the button kept a tab stop.
 * 6. **Another address and Log Out.**
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESEND_WAIT_SECONDS } from '$lib/contestant/entryFlow';
import { requiredNameLocale } from '$lib/contestant/utils/nameRule';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';

const { box, context, fetchMock, invalidateAll, logout } = vi.hoisted(() => {
  const box = {
    user: undefined as unknown as BasicUserData | undefined,
    answersLocked: false,
    pageData: {} as Record<string, unknown>,
    locales: ['en'] as ReadonlyArray<string>
  };
  const invalidateAll = vi.fn();
  const logout = vi.fn();
  const fetchMock = vi.fn();
  /** A message with a payload renders as its key followed by the payload. */
  function t(key: string, payload?: Record<string, unknown>): string {
    return payload ? `${key} ${JSON.stringify(payload)}` : key;
  }
  const context = {
    t,
    logout,
    get user() {
      return box.user;
    },
    get answersLocked() {
      return box.answersLocked;
    }
  };
  return { box, context, fetchMock, invalidateAll, logout };
});

vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({ getContestantContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({
    t: context.t,
    get locale() {
      return box.locales[0];
    },
    get locales() {
      return box.locales;
    },
    translate: (value: unknown) => (typeof value === 'string' ? value : ''),
    darkMode: false
  })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
}));

vi.mock('$app/state', () => ({
  page: {
    get data() {
      return box.pageData;
    }
  }
}));

// The other members stay the resolvable stubs: components the gate reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  invalidateAll
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the gate's layout components are imported. The stub answers "no preference".
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

const IdentityProviderGate = (await import('./IdentityProviderGate.svelte')).default;

const DEFAULT_LOCALE = requiredNameLocale();
/** A supported locale other than the default one, displayed first, so that the default locale's field is not the first control. */
const OTHER_LOCALE = DEFAULT_LOCALE === 'fi' ? 'sv' : 'fi';

const ENDPOINT = '/api/contestant/identity-provider';
const PLACEHOLDER_DOMAIN = 'bank-auth.placeholder';
const PENDING = 'waiting@example.org';
const PROVED = 'proved@example.org';
const TYPED = 'typed@example.org';

const SEL = {
  container: '[data-testid="contestant-identity-provider-gate"]',
  lead: '[data-testid="identity-provider-gate-lead"]',
  address: '[data-testid="identity-provider-gate-address"]',
  name: '[data-testid="identity-provider-gate-name"]',
  nameError: '[data-testid="identity-provider-gate-name-error"]',
  shortName: '[data-testid="identity-provider-gate-short-name"]',
  resend: '[data-testid="identity-provider-gate-resend"]',
  countdown: '[data-testid="identity-provider-gate-countdown"]',
  status: '[data-testid="identity-provider-gate-status"]',
  changeAddress: '[data-testid="identity-provider-gate-change-address"]',
  submit: '[data-testid="identity-provider-gate-submit"]',
  error: '[data-testid="identity-provider-gate-error"]',
  logout: '[data-testid="identity-provider-gate-logout"]',
  email: '[data-testid="email-entry-email"]',
  confirmation: '[data-testid="email-entry-confirmation"]',
  emailError: '[data-testid="email-entry-email-error"]',
  confirmationError: '[data-testid="email-entry-confirmation-error"]'
};

const KEY = {
  titleComplete: 'contestantApp.identityProvider.title.complete',
  titleAlready: 'contestantApp.identityProvider.title.alreadyRegistered',
  identified: 'contestantApp.identityProvider.identified',
  emailIntro: 'contestantApp.identityProvider.emailIntro',
  nameIntro: 'contestantApp.identityProvider.nameIntro',
  none: 'contestantApp.identityProvider.alreadyRegistered.none',
  pending: 'contestantApp.identityProvider.alreadyRegistered.pending',
  proved: 'contestantApp.identityProvider.alreadyRegistered.proved',
  awaiting: 'contestantApp.identityProvider.awaitingConfirmation',
  signInEmail: 'contestantApp.identityProvider.signInEmail',
  emailInUse: 'contestantApp.identityProvider.emailInUse',
  takenNotice: 'contestantApp.identityProvider.emailTakenNotice',
  nameRequired: 'contestantApp.identityProvider.nameRequired',
  saveFailed: 'contestantApp.identityProvider.saveFailed',
  hero: 'contestantApp.identityProvider.heroEmoji',
  nameSentence: 'dynamic.contestantAppBasicInfo.identity.name.editable.organization',
  resendRequested: 'contestantApp.emailSent.resendRequested',
  resendReady: 'contestantApp.emailSent.resendReady',
  resendIn: 'contestantApp.emailSent.resendIn'
};

/** User-level data of an identity-provider account with no address, changed by `overrides`. */
function userWith(overrides: Partial<BasicUserData> = {}): BasicUserData {
  return {
    id: 'user-1',
    email: '',
    username: '',
    termsOfUseAccepted: null,
    passwordSet: false,
    addressState: 'none',
    pendingEmail: null,
    ownOrganizationUnnamed: false,
    pendingEmailTaken: false,
    ...overrides
  } as BasicUserData;
}

/** The endpoint answering `result`. */
function answer(result: string): Response {
  return new Response(JSON.stringify({ result }), { status: 200, headers: { 'content-type': 'application/json' } });
}

let teardown: Array<() => void> = [];

beforeEach(() => {
  box.user = userWith();
  box.answersLocked = false;
  box.pageData = {};
  box.locales = [OTHER_LOCALE, DEFAULT_LOCALE];
  invalidateAll.mockResolvedValue(undefined);
  logout.mockResolvedValue(undefined);
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

/** Mount the view for the given facts. */
function render({
  user = userWith(),
  arrival,
  answersLocked = false
}: { user?: BasicUserData; arrival?: 'created' | 'existing'; answersLocked?: boolean } = {}): HTMLElement {
  box.user = user;
  box.answersLocked = answersLocked;
  box.pageData = arrival ? { arrival } : {};
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(IdentityProviderGate, { target, props: {} });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

function one<TElement extends Element = HTMLElement>(target: HTMLElement, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found, `exactly one ${selector}`).toHaveLength(1);
  return found[0];
}

function container(target: HTMLElement): HTMLElement {
  return one(target, SEL.container);
}

function attributes(target: HTMLElement): Record<string, string | null> {
  const root = container(target);
  return {
    variant: root.getAttribute('data-variant'),
    addressState: root.getAttribute('data-address-state'),
    asks: root.getAttribute('data-asks'),
    gateState: root.getAttribute('data-gate-state')
  };
}

function text(target: HTMLElement): string {
  return target.textContent ?? '';
}

/** The control of the name field for a locale. */
function nameControl(target: HTMLElement, locale: string): HTMLInputElement {
  return one<HTMLInputElement>(one(target, SEL.name), `input[lang="${locale}"]`);
}

/** Type into a control the way a browser reports it, both as it is typed and as it is committed. */
function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

function fillAddress(target: HTMLElement, address = TYPED): void {
  type(one<HTMLInputElement>(target, SEL.email), address);
  type(one<HTMLInputElement>(target, SEL.confirmation), address);
}

/** Let the awaited calls of a handler settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  flushSync();
}

async function press(target: HTMLElement, selector: string): Promise<void> {
  const button = one<HTMLButtonElement>(target, selector);
  button.focus();
  button.click();
  flushSync();
  await settle();
}

/** The parsed bodies of the requests the view made. */
function requests(): Array<{ url: unknown; init: RequestInit; body: Record<string, unknown> }> {
  return fetchMock.mock.calls.map((call) => {
    const [url, init] = call as [unknown, RequestInit];
    return { url, init, body: JSON.parse(String(init.body)) as Record<string, unknown> };
  });
}

describe('IdentityProviderGate — the variants', () => {
  it('asks a new user for an email address under "Complete your registration"', () => {
    const target = render();

    expect(attributes(target)).toEqual({ variant: 'new', addressState: 'none', asks: 'email', gateState: 'idle' });
    expect(one(target, 'h1').textContent).toContain(KEY.titleComplete);
    expect(one(target, SEL.lead).textContent).toBe(KEY.identified);
    expect(text(target)).toContain(KEY.emailIntro);
    one(target, SEL.email);
    one(target, SEL.confirmation);
    expect(target.querySelector(SEL.name)).toBeNull();
    expect(target.querySelector(SEL.address)).toBeNull();
    expect(target.querySelector(SEL.resend)).toBeNull();
    expect(one<HTMLButtonElement>(target, SEL.submit).getAttribute('type')).toBe('submit');
    one(target, SEL.logout);
  });

  it('shows the hero only on the arrival that created the account', () => {
    expect(text(render({ arrival: 'created' }))).toContain(KEY.hero);
    expect(text(render())).not.toContain(KEY.hero);
    expect(text(render({ arrival: 'existing' }))).not.toContain(KEY.hero);
  });

  it('asks a new party for its name and abbreviation before the address', () => {
    const target = render({ user: userWith({ ownOrganizationUnnamed: true }), arrival: 'created' });

    expect(attributes(target).asks).toBe('name email');
    expect(text(target)).toContain(KEY.nameSentence);
    const name = one(target, SEL.name);
    one(target, SEL.shortName);
    const email = one(target, SEL.email);
    expect(name.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nameControl(target, DEFAULT_LOCALE).getAttribute('aria-required')).toBe('true');
  });

  it('tells a returning user with no address that they have registered, and asks for the address', () => {
    const target = render({ arrival: 'existing' });

    expect(attributes(target)).toEqual({
      variant: 'returning',
      addressState: 'none',
      asks: 'email',
      gateState: 'idle'
    });
    expect(one(target, 'h1').textContent).toContain(KEY.titleAlready);
    expect(one(target, SEL.lead).textContent).toBe(KEY.none);
    one(target, SEL.email);
  });

  it('asks a returning user with no address and an unnamed party for both', () => {
    const target = render({ user: userWith({ ownOrganizationUnnamed: true }), arrival: 'existing' });

    expect(attributes(target).asks).toBe('name email');
    one(target, SEL.name);
    one(target, SEL.email);
  });

  it('shows a returning user the address awaiting confirmation, with Send again and Use another email address, and no form', () => {
    const target = render({
      user: userWith({ addressState: 'pending', pendingEmail: PENDING }),
      arrival: 'existing'
    });

    expect(attributes(target)).toEqual({ variant: 'returning', addressState: 'pending', asks: '', gateState: 'idle' });
    expect(one(target, SEL.lead).textContent).toBe(KEY.pending);
    expect(one(target, SEL.address).textContent?.trim()).toBe(PENDING);
    expect(one(target, 'dt').textContent).toBe(KEY.awaiting);
    one(target, SEL.resend);
    one(target, SEL.changeAddress);
    expect(one(target, SEL.status).getAttribute('role')).toBe('status');
    expect(target.querySelector('form')).toBeNull();
    expect(target.querySelector('input')).toBeNull();
    expect(one<HTMLButtonElement>(target, SEL.submit).getAttribute('type')).toBe('button');
  });

  it('shows a returning user with a proved address the address to sign in with next time', () => {
    const target = render({
      user: userWith({ addressState: 'proved', email: PROVED, username: PROVED }),
      arrival: 'existing'
    });

    expect(attributes(target)).toEqual({ variant: 'returning', addressState: 'proved', asks: '', gateState: 'idle' });
    expect(one(target, SEL.lead).textContent).toBe(KEY.proved);
    expect(one(target, SEL.address).textContent?.trim()).toBe(PROVED);
    expect(one(target, 'dt').textContent).toBe(KEY.signInEmail);
    expect(target.querySelector(SEL.resend)).toBeNull();
    expect(target.querySelector(SEL.changeAddress)).toBeNull();
    expect(target.querySelector('form')).toBeNull();
  });

  it.each([
    { state: 'pending' as const, extra: { pendingEmail: PENDING } },
    { state: 'proved' as const, extra: { email: PROVED, username: PROVED } }
  ])('asks only for the party’s name when the address is $state and the party is unnamed', ({ state, extra }) => {
    const target = render({ user: userWith({ addressState: state, ownOrganizationUnnamed: true, ...extra }) });

    expect(attributes(target)).toEqual({ variant: 'new', addressState: state, asks: 'name', gateState: 'idle' });
    expect(one(target, SEL.lead).textContent).toBe(KEY.nameIntro);
    one(target, SEL.name);
    expect(target.querySelector(SEL.email)).toBeNull();
    expect(target.querySelector(SEL.address)).toBeNull();
    expect(target.querySelector(SEL.resend)).toBeNull();
  });

  it('leads with the notice when the address the user gave is now another account’s', () => {
    const target = render({ user: userWith({ pendingEmailTaken: true }), arrival: 'existing' });

    expect(attributes(target).asks).toBe('email');
    expect(one(target, SEL.lead).textContent).toBe(KEY.takenNotice);
    one(target, SEL.email);
  });

  it('asks for no name while answers are locked', () => {
    const target = render({ user: userWith({ ownOrganizationUnnamed: true }), answersLocked: true });

    expect(attributes(target).asks).toBe('email');
    expect(target.querySelector(SEL.name)).toBeNull();
    expect(target.querySelector(SEL.shortName)).toBeNull();
    expect(text(target)).not.toContain(KEY.nameSentence);
  });
});

describe('IdentityProviderGate — what is never shown', () => {
  function placeholderUser(overrides: Partial<BasicUserData>): BasicUserData {
    return userWith({ email: '', username: '', ...overrides });
  }

  it.each([
    { name: 'no address', user: placeholderUser({}), arrival: undefined },
    { name: 'no address, returning', user: placeholderUser({}), arrival: 'existing' as const },
    {
      name: 'pending',
      user: placeholderUser({ addressState: 'pending', pendingEmail: PENDING }),
      arrival: 'existing' as const
    },
    {
      name: 'pending, party unnamed',
      user: placeholderUser({ addressState: 'pending', pendingEmail: PENDING, ownOrganizationUnnamed: true }),
      arrival: undefined
    }
  ])('renders no placeholder address for an account with $name', ({ user, arrival }) => {
    const target = render({ user, arrival });

    expect(target.innerHTML).not.toContain(PLACEHOLDER_DOMAIN);
  });

  it('shows the pending address only while the view waits for its link', async () => {
    const pending = { addressState: 'pending' as const, pendingEmail: PENDING };

    expect(render({ user: userWith(pending), arrival: 'existing' }).innerHTML).toContain(PENDING);
    expect(render({ user: userWith({ ...pending, ownOrganizationUnnamed: true }) }).innerHTML).not.toContain(PENDING);

    const switched = render({ user: userWith(pending), arrival: 'existing' });
    await press(switched, SEL.changeAddress);
    expect(switched.innerHTML).not.toContain(PENDING);
  });
});

describe('IdentityProviderGate — Continue with a form', () => {
  it('sends nothing for an empty form, shows each error and focuses the name’s default-locale control first', async () => {
    const target = render({ user: userWith({ ownOrganizationUnnamed: true }) });

    await press(target, SEL.submit);

    expect(fetchMock).not.toHaveBeenCalled();
    const nameError = one(target, SEL.nameError);
    expect(nameError.getAttribute('role')).toBe('alert');
    expect(nameError.textContent).toContain(KEY.nameRequired);
    expect(nameError.textContent).toContain(`lang.${DEFAULT_LOCALE}`);
    const control = nameControl(target, DEFAULT_LOCALE);
    expect(control.getAttribute('aria-describedby')).toContain(nameError.id);
    one(target, SEL.emailError);
    one(target, SEL.confirmationError);
    expect(document.activeElement).toBe(control);
  });

  it('focuses the first address field when the name is given and the address is not', async () => {
    const target = render({ user: userWith({ ownOrganizationUnnamed: true }) });
    type(nameControl(target, DEFAULT_LOCALE), 'A Party');

    await press(target, SEL.submit);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(target.querySelector(SEL.nameError)).toBeNull();
    expect(document.activeElement).toBe(one(target, SEL.email));
  });

  it('sends nothing while the name has text only in another locale', async () => {
    const target = render({ user: userWith({ ownOrganizationUnnamed: true }) });
    type(nameControl(target, OTHER_LOCALE), 'A Party');
    fillAddress(target);

    await press(target, SEL.submit);

    expect(fetchMock).not.toHaveBeenCalled();
    one(target, SEL.nameError);
    expect(document.activeElement).toBe(nameControl(target, DEFAULT_LOCALE));
  });

  it('removes the name’s error once the name is given', async () => {
    const target = render({ user: userWith({ ownOrganizationUnnamed: true }) });
    await press(target, SEL.submit);
    one(target, SEL.nameError);

    type(nameControl(target, DEFAULT_LOCALE), 'A Party');

    expect(target.querySelector(SEL.nameError)).toBeNull();
  });

  it('saves the names and the address as JSON to the endpoint, shows that it is saving, then reruns the loads', async () => {
    const { promise, resolve } = Promise.withResolvers<Response>();
    fetchMock.mockReturnValue(promise);
    const target = render({ user: userWith({ ownOrganizationUnnamed: true }), arrival: 'created' });
    type(nameControl(target, DEFAULT_LOCALE), 'A Party');
    // The abbreviation is not required, so only the displayed locale's field is on screen.
    type(one<HTMLInputElement>(one(target, SEL.shortName), `input[lang="${OTHER_LOCALE}"]`), 'AP');
    fillAddress(target);

    await press(target, SEL.submit);

    expect(attributes(target).gateState).toBe('saving');
    expect(invalidateAll).not.toHaveBeenCalled();
    const [request] = requests();
    expect(request.url).toBe(ENDPOINT);
    expect(request.init.method).toBe('POST');
    expect(new Headers(request.init.headers).get('content-type')).toBe('application/json');
    expect(request.body).toEqual({
      intent: 'save',
      name: { [DEFAULT_LOCALE]: 'A Party' },
      shortName: { [OTHER_LOCALE]: 'AP' },
      email: TYPED
    });

    resolve(answer('saved'));
    await settle();

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('saves the address alone when no name is asked', async () => {
    const target = render();
    fillAddress(target);

    await press(target, SEL.submit);

    expect(requests().map(({ body }) => body)).toEqual([{ intent: 'save', email: TYPED }]);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('saves the name alone when only the name is asked', async () => {
    const target = render({ user: userWith({ addressState: 'proved', email: PROVED, ownOrganizationUnnamed: true }) });
    type(nameControl(target, DEFAULT_LOCALE), 'A Party');

    await press(target, SEL.submit);

    expect(requests().map(({ body }) => body)).toEqual([{ intent: 'save', name: { [DEFAULT_LOCALE]: 'A Party' } }]);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
  });

  it('tells at the address field that another account holds the address, and focuses it', async () => {
    fetchMock.mockResolvedValue(answer('in-use'));
    const target = render();
    fillAddress(target);

    await press(target, SEL.submit);

    const error = one(target, SEL.emailError);
    expect(error.textContent).toContain(KEY.emailInUse);
    expect(error.getAttribute('data-reason')).toBe('in-use');
    expect(document.activeElement).toBe(one(target, SEL.email));
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(target.querySelector(SEL.error)).toBeNull();
    expect(attributes(target).gateState).toBe('idle');
  });

  it.each([
    { name: 'answers failed', reply: () => Promise.resolve(answer('failed')) },
    { name: 'answers something unknown', reply: () => Promise.resolve(answer('maybe')) },
    { name: 'cannot be reached', reply: () => Promise.reject(new TypeError('Failed to fetch')) }
  ])(
    'says the save failed when the endpoint $name, keeps what was typed, and retries on a second press',
    async ({ reply }) => {
      fetchMock.mockImplementation(reply);
      const target = render();
      fillAddress(target);

      await press(target, SEL.submit);

      const error = one(target, SEL.error);
      expect(error.getAttribute('role')).toBe('alert');
      expect(error.textContent).toContain(KEY.saveFailed);
      expect(attributes(target).gateState).toBe('failed');
      expect(one<HTMLInputElement>(target, SEL.email).value).toBe(TYPED);
      expect(one<HTMLInputElement>(target, SEL.confirmation).value).toBe(TYPED);
      expect(document.activeElement).toBe(one(target, SEL.submit));
      expect(invalidateAll).not.toHaveBeenCalled();

      fetchMock.mockResolvedValue(answer('saved'));
      await press(target, SEL.submit);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(invalidateAll).toHaveBeenCalledTimes(1);
    }
  );
});

describe('IdentityProviderGate — Continue without a form', () => {
  it.each([
    { state: 'pending' as const, extra: { pendingEmail: PENDING } },
    { state: 'proved' as const, extra: { email: PROVED, username: PROVED } }
  ])('acknowledges the arrival and reruns the loads when the address is $state', async ({ state, extra }) => {
    fetchMock.mockResolvedValue(answer('acknowledged'));
    const target = render({ user: userWith({ addressState: state, ...extra }), arrival: 'existing' });

    await press(target, SEL.submit);

    expect(requests().map(({ body }) => body)).toEqual([{ intent: 'acknowledge' }]);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(invalidateAll.mock.invocationCallOrder[0]);
  });

  it('says the request failed and reruns nothing when the acknowledgement fails', async () => {
    fetchMock.mockResolvedValue(answer('failed'));
    const target = render({ user: userWith({ addressState: 'proved', email: PROVED }), arrival: 'existing' });

    await press(target, SEL.submit);

    expect(one(target, SEL.error).textContent).toContain(KEY.saveFailed);
    expect(invalidateAll).not.toHaveBeenCalled();
  });
});

describe('IdentityProviderGate — Send again', () => {
  function pendingUser(): BasicUserData {
    return userWith({ addressState: 'pending', pendingEmail: PENDING });
  }

  it('is available on arrival, with no count and nothing announced', () => {
    const target = render({ user: pendingUser(), arrival: 'existing' });

    const resend = one(target, SEL.resend);
    expect(resend.hasAttribute('aria-disabled')).toBe(false);
    expect(resend.hasAttribute('aria-describedby')).toBe(false);
    expect(target.querySelector(SEL.countdown)).toBeNull();
    expect(one(target, SEL.status).textContent?.trim()).toBe('');
  });

  it('asks for the link again, announces it, and is unavailable but focused and described by its count until the count ends', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    fetchMock.mockResolvedValue(answer('sent'));
    const target = render({ user: pendingUser(), arrival: 'existing' });

    await press(target, SEL.resend);

    expect(requests().map(({ body }) => body)).toEqual([{ intent: 'resend' }]);
    const resend = one(target, SEL.resend);
    expect(document.activeElement).toBe(resend);
    expect(resend.getAttribute('aria-disabled')).toBe('true');
    expect(resend.tabIndex).toBe(0);
    const countdown = one(target, SEL.countdown);
    expect(resend.getAttribute('aria-describedby')).toBe(countdown.id);
    expect(resend.contains(countdown), 'the count is inside Send again').toBe(true);
    expect(countdown.textContent).toContain(KEY.resendIn);
    expect(countdown.textContent).toContain(`"seconds":${RESEND_WAIT_SECONDS}`);
    expect(one(target, SEL.status).textContent?.trim()).toBe(KEY.resendRequested);

    await press(target, SEL.resend);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime((RESEND_WAIT_SECONDS - 1) * 1000);
    flushSync();
    expect(one(target, SEL.resend).getAttribute('aria-disabled')).toBe('true');
    expect(one(target, SEL.status).textContent?.trim()).toBe(KEY.resendRequested);

    vi.advanceTimersByTime(1000);
    flushSync();
    expect(one(target, SEL.resend).hasAttribute('aria-disabled')).toBe(false);
    expect(target.querySelector(SEL.countdown)).toBeNull();
    expect(one(target, SEL.status).textContent?.trim()).toBe(KEY.resendReady);
    expect(document.activeElement).toBe(one(target, SEL.resend));

    await press(target, SEL.resend);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('IdentityProviderGate — another address and Log Out', () => {
  it('replaces the pending address by the email form in place and focuses its first field', async () => {
    const target = render({ user: userWith({ addressState: 'pending', pendingEmail: PENDING }), arrival: 'existing' });

    await press(target, SEL.changeAddress);

    expect(attributes(target).asks).toBe('email');
    expect(target.querySelector(SEL.address)).toBeNull();
    expect(target.querySelector(SEL.resend)).toBeNull();
    expect(one(target, SEL.lead).textContent).toBe(KEY.pending);
    expect(document.activeElement).toBe(one(target, SEL.email));
    expect(one<HTMLButtonElement>(target, SEL.submit).getAttribute('type')).toBe('submit');
    expect(fetchMock).not.toHaveBeenCalled();

    fillAddress(target);
    await press(target, SEL.submit);

    expect(requests().map(({ body }) => body)).toEqual([{ intent: 'save', email: TYPED }]);
  });

  it('logs out on Log Out and sends nothing', async () => {
    const target = render();
    fillAddress(target);

    await press(target, SEL.logout);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs a failed Log Out and gives the button back', async () => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    logout.mockRejectedValueOnce(new Error('navigation failed'));
    const target = render();

    await press(target, SEL.logout);

    expect(logError).toHaveBeenCalledTimes(1);
    expect(one<HTMLButtonElement>(target, SEL.logout).disabled).toBe(false);
  });
});
