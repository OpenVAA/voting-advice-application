/**
 * The Contestant App's protected layout and the set-password gate it renders, mounted for real against a fake context, with the real password setter inside the gate.
 *
 * What this file holds:
 *
 * 1. **A gated load renders the gate in place of the page.** The page is not rendered, and the layout provides nothing to the context and logs nothing.
 * 2. **What the view holds.** The page's own first-level heading, the reason, the address of the signed-in user as text and as the form's user-name field, the two password fields, the main button and Log Out; no hero, no dialog and nothing that dismisses the view.
 * 3. **The main button is a submit button tied to the form**, and it is unavailable only until the view has mounted.
 * 4. **A press with a password the form does not accept saves nothing.** The field says why and the load is not rerun.
 * 5. **A failed save is shown and the form stays.** The view says so with its own sentence, what was typed is kept, the load is not rerun, and a second press saves again.
 * 6. **A saved password reruns the load, and nothing else advances the view.** `invalidateAll` is called once, after the save. The gate is still mounted afterwards, because the stubbed `invalidateAll` reruns no load: only load data without the gate removes it.
 * 7. **Log Out calls the context's `logout`** and saves nothing.
 * 8. **An ungated load renders the page and no gate.**
 *
 * The fake context's `user` is the user of the load data the layout was given, which is how the real context derives it. The assertions are on the DOM rather than on component state: what matters is what the user is shown.
 */

import { log } from '@openvaa/app-shared';
import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { clearEntryFlow, context, initUserData, invalidateAll, logout, setDataRoot, setPassword } = vi.hoisted(() => {
  const mocks = {
    clearEntryFlow: vi.fn(),
    initUserData: vi.fn(),
    invalidateAll: vi.fn(),
    logout: vi.fn(),
    setDataRoot: vi.fn(),
    setPassword: vi.fn()
  };
  /** The load data the layout was last given, whose user the context hands on. */
  const held: { data: { user?: unknown } } = { data: {} };
  const context = {
    held,
    t: (key: string) => key,
    setDataRoot: mocks.setDataRoot,
    logout: mocks.logout,
    setPassword: mocks.setPassword,
    clearEntryFlow: mocks.clearEntryFlow,
    acceptTermsOfUse: async () => ({ type: 'success' }),
    userData: { init: mocks.initUserData },
    appSettings: { analytics: { trackEvents: false } },
    // No analytics provider and trackEvents off: the terms show no usage-data section and the gate offers no opt-out.
    analyticsGate: {
      current: {
        projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
        globalPrivacyControl: false,
        trackEvents: false,
        consent: undefined
      }
    },
    get user() {
      return held.data.user;
    }
  };
  return { ...mocks, context };
});

vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
}));

// The other members stay the resolvable stubs: components the layout reaches import them too.
vi.mock('$app/navigation', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  invalidateAll
}));

/**
 * jsdom ships no `window.matchMedia`, and `svelte/motion` reads it at module-evaluation time to honour `prefers-reduced-motion`. The gates reach it through the layout components and through the rule list's progress bar, so without this the suite fails during import and never reaches an assertion. The stub answers "no preference", which is the browser default the components are authored against.
 */
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

const ProtectedLayout = (await import('./+layout.svelte')).default;

/** A made-up address of the signed-in user. */
const ADDRESS = 'person.with-a-long-name@example.test';

const USER = { id: 'user-1', email: ADDRESS, username: ADDRESS, role: 'contestant', termsOfUseAccepted: null };

/** A password that satisfies every rule the form lists, and another. */
const VALID_PASSWORD = 'Abcdef1!';
const OTHER_VALID_PASSWORD = 'Zyxwvu9?';

/** A password that breaks the length rule and three of the character rules. */
const RULE_BREAKING_PASSWORD = 'abc';

const GATE = '[data-testid="contestant-set-password-gate"]';
const SUBMIT = '[data-testid="set-password-submit"]';
const LOGOUT = '[data-testid="set-password-logout"]';
const SAVE_ERROR = '[data-testid="set-password-error"]';
const SHOWN_ADDRESS = '[data-testid="set-password-email"]';
const PASSWORD = '[data-testid="password-setter-password"] input';
const CONFIRMATION = '[data-testid="password-setter-confirmation"] input';
const PASSWORD_ERROR = '[data-testid="password-setter-password-error"]';
const PAGE = '[data-testid="page"]';

/** Load data for a user who must set a password: the gate and the user-level data, and no entity data. */
function gatedData(user: object = USER) {
  return { gate: 'setPassword', user: { ...user, passwordSet: false } };
}

/** Load data for a user past the gates. */
function ungatedData() {
  return { gate: null, user: { ...USER, termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00', passwordSet: true } };
}

let teardown: Array<() => void> = [];
let logError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  setPassword.mockResolvedValue({ type: 'success' });
  logout.mockResolvedValue(undefined);
  invalidateAll.mockResolvedValue(undefined);
  logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  context.held.data = {};
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** The page the layout renders below itself, as a marker element. */
const page = createRawSnippet(() => ({ render: () => '<div data-testid="page"></div>' }));

function render(data: { gate: string | null; user?: unknown }): HTMLElement {
  context.held.data = data;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ProtectedLayout, {
    target,
    props: { data: data as never, children: page }
  });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

function one<TElement extends Element>(target: HTMLElement, selector: string): TElement {
  const found = target.querySelectorAll<TElement>(selector);
  expect(found.length, `elements matching ${selector}`).toBe(1);
  return found[0];
}

/** Type into a field, as a user does. */
function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** Let the submit handler's awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
  flushSync();
}

/** The form the main button names, by the button's own `form` attribute. */
function formOf(target: HTMLElement): HTMLFormElement {
  const formId = one<HTMLButtonElement>(target, SUBMIT).getAttribute('form');
  expect(formId, 'the main button names a form').toBeTruthy();
  const form = document.getElementById(formId!);
  expect(form, 'the form the main button names exists').toBeInstanceOf(HTMLFormElement);
  return form as HTMLFormElement;
}

/**
 * Submit the form the main button names, as a press of that button does.
 * @returns Whether the page prevented the form's own post.
 */
async function pressSetPassword(target: HTMLElement): Promise<boolean> {
  const submit = new SubmitEvent('submit', {
    bubbles: true,
    cancelable: true,
    submitter: one<HTMLButtonElement>(target, SUBMIT)
  });
  formOf(target).dispatchEvent(submit);
  await settle();
  return submit.defaultPrevented;
}

/** Type a password and its confirmation. */
function typePasswords(target: HTMLElement, password: string, confirmation = password): void {
  type(one<HTMLInputElement>(target, PASSWORD), password);
  type(one<HTMLInputElement>(target, CONFIRMATION), confirmation);
}

describe('contestant protected layout — a load gated on the password', () => {
  it('renders the set-password view in place of the page, provides no data to the context and logs no error', () => {
    const target = render(gatedData());

    expect(one(target, GATE).getAttribute('data-set-password-state')).toBe('idle');
    expect(target.querySelector(PAGE)).toBeNull();
    expect(target.querySelector('[data-testid="terms-of-use-submit"]')).toBeNull();
    expect(setDataRoot).not.toHaveBeenCalled();
    expect(initUserData).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
    expect(setPassword).not.toHaveBeenCalled();
  });

  it("shows the page's own heading, which can take focus, and the reason, and no hero", () => {
    const target = render(gatedData());

    const heading = one<HTMLHeadingElement>(target, 'h1');
    expect(heading.textContent?.trim()).toBe('contestantApp.setPassword.title');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(one(target, GATE).textContent).toContain('contestantApp.setPassword.why');
    expect(target.querySelector('figure')).toBeNull();
  });

  it("shows the address of the load data's user as text, and holds it in the form's user-name field, which is not rendered", () => {
    const target = render(gatedData());

    const shown = one<HTMLElement>(target, SHOWN_ADDRESS);
    expect(shown.tagName).toBe('DD');
    expect(shown.textContent?.trim()).toBe(ADDRESS);
    expect(shown.getAttribute('translate')).toBe('no');
    expect(shown.previousElementSibling?.textContent?.trim()).toBe('contestantApp.nothingToEdit.signedInAs');
    const username = one<HTMLInputElement>(formOf(target), 'input[name="username"]');
    expect(username.value).toBe(ADDRESS);
    expect(username.readOnly).toBe(true);
    expect(username.classList.contains('hidden')).toBe(true);
  });

  it('shows the address of another user when the load data holds another user', () => {
    const other = 'another.person@example.test';
    const target = render(gatedData({ ...USER, id: 'user-2', email: other, username: other }));

    expect(one(target, SHOWN_ADDRESS).textContent?.trim()).toBe(other);
    expect(one<HTMLInputElement>(formOf(target), 'input[name="username"]').value).toBe(other);
    expect(target.textContent).not.toContain(ADDRESS);
  });

  it('never asks for a current password, and holds no dialog and no way to dismiss the view', () => {
    const target = render(gatedData());

    expect(target.querySelectorAll('input[type="password"]').length).toBe(2);
    expect(target.querySelector('input[autocomplete="current-password"]')).toBeNull();
    expect(target.querySelector('dialog')).toBeNull();
    // The view's actions are the main button and Log Out, and nothing else.
    expect(
      [...one(target, GATE).querySelectorAll('section button, section a')].map((control) =>
        control.getAttribute('data-testid')
      )
    ).toEqual(['set-password-submit', 'set-password-logout']);
  });
});

describe('contestant protected layout — the set-password view’s main button', () => {
  it('is a submit button tied to the form that holds the two fields, and is available once the view has mounted', () => {
    const target = render(gatedData());

    const submit = one<HTMLButtonElement>(target, SUBMIT);
    expect(submit.tagName).toBe('BUTTON');
    expect(submit.getAttribute('type')).toBe('submit');
    const form = formOf(target);
    expect(form.contains(submit), 'the button stands outside the form it names').toBe(false);
    expect(form.contains(one(target, PASSWORD))).toBe(true);
    expect(form.contains(one(target, CONFIRMATION))).toBe(true);
    expect(submit.textContent).toContain('contestantApp.setPassword.setPassword');
    expect(submit.disabled).toBe(false);
  });

  it('prevents the form’s own post and saves nothing for a password the form does not accept, and says why at the field', async () => {
    const target = render(gatedData());
    typePasswords(target, RULE_BREAKING_PASSWORD);
    logError.mockClear();

    const prevented = await pressSetPassword(target);

    expect(prevented).toBe(true);
    expect(setPassword).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(one(target, PASSWORD_ERROR).textContent).toContain('contestantApp.setPassword.passwordNotValid');
    expect(one(target, GATE).getAttribute('data-set-password-state')).toBe('idle');
    expect(target.querySelector(SAVE_ERROR)).toBeNull();
  });

  it('saves nothing when the confirmation differs', async () => {
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD, OTHER_VALID_PASSWORD);

    await pressSetPassword(target);

    expect(setPassword).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
  });
});

describe('contestant protected layout — saving a password', () => {
  it('saves the typed password once, reruns the load once after it, clears the entry flow and shows no alert', async () => {
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD);

    const prevented = await pressSetPassword(target);

    expect(prevented).toBe(true);
    expect(setPassword.mock.calls).toEqual([[{ password: VALID_PASSWORD }]]);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(setPassword.mock.invocationCallOrder[0]).toBeLessThan(invalidateAll.mock.invocationCallOrder[0]);
    expect(clearEntryFlow).toHaveBeenCalledTimes(1);
    expect(target.querySelector(SAVE_ERROR)).toBeNull();
    expect(logError).not.toHaveBeenCalled();
  });

  it('keeps the view until the load data changes: no local state advances past it', async () => {
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD);

    await pressSetPassword(target);

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(target.querySelectorAll(GATE).length).toBe(1);
    expect(target.querySelector(PAGE)).toBeNull();
  });

  it('reads "Saving…" and is unavailable from the press until the rerun has finished', async () => {
    const save: { finish: (result: { type: string }) => void } = { finish: () => undefined };
    setPassword.mockReturnValue(
      new Promise((resolve) => {
        save.finish = resolve;
      })
    );
    const rerun: { finish: () => void } = { finish: () => undefined };
    invalidateAll.mockReturnValue(
      new Promise<void>((resolve) => {
        rerun.finish = resolve;
      })
    );
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD);

    await pressSetPassword(target);

    expect(one(target, GATE).getAttribute('data-set-password-state')).toBe('saving');
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);
    expect(one(target, SUBMIT).textContent).toContain('common.saving');
    expect(invalidateAll).not.toHaveBeenCalled();

    save.finish({ type: 'success' });
    await settle();

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(one(target, GATE).getAttribute('data-set-password-state'), 'while the load reruns').toBe('saving');
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(true);

    rerun.finish();
    await settle();

    expect(one(target, GATE).getAttribute('data-set-password-state')).toBe('idle');
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
  });

  it('makes one save for two presses while the first is running', async () => {
    setPassword.mockReturnValue(new Promise(() => undefined));
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD);

    await pressSetPassword(target);
    await pressSetPassword(target);

    expect(setPassword).toHaveBeenCalledTimes(1);
  });
});

describe('contestant protected layout — a password that could not be saved', () => {
  it.each([
    ['the save rejects', () => setPassword.mockRejectedValue(new Error('New password should be different'))],
    ['the save answers with something other than a success', () => setPassword.mockResolvedValue({ type: 'failure' })]
  ])('says so, keeps the form and what was typed, and does not rerun the load when %s', async (_, arrange) => {
    arrange();
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD);

    await pressSetPassword(target);

    expect(setPassword).toHaveBeenCalledTimes(1);
    expect(one(target, GATE).getAttribute('data-set-password-state')).toBe('failed');
    const alert = one<HTMLElement>(target, SAVE_ERROR);
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toContain('contestantApp.setPassword.error');
    expect(one<HTMLInputElement>(target, PASSWORD).value).toBe(VALID_PASSWORD);
    expect(one<HTMLInputElement>(target, CONFIRMATION).value).toBe(VALID_PASSWORD);
    expect(one<HTMLButtonElement>(target, SUBMIT).disabled).toBe(false);
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(clearEntryFlow).not.toHaveBeenCalled();
    expect(target.querySelector(PAGE)).toBeNull();
  });

  it('gives focus back to the main button when the browser dropped it while the button was unavailable', async () => {
    const save: { fail: (error: Error) => void } = { fail: () => undefined };
    setPassword.mockReturnValue(
      new Promise((_, reject) => {
        save.fail = reject;
      })
    );
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD);
    const submit = one<HTMLButtonElement>(target, SUBMIT);
    submit.focus();
    expect(document.activeElement).toBe(submit);

    await pressSetPassword(target);
    // A browser moves focus to the body when the focused button becomes unavailable. jsdom keeps it there, so the case takes it away through an element it then removes.
    const elsewhere = document.createElement('input');
    document.body.appendChild(elsewhere);
    elsewhere.focus();
    elsewhere.remove();
    expect(document.activeElement).toBe(document.body);
    save.fail(new Error('the auth service is unreachable'));
    await settle();

    expect(one(target, GATE).getAttribute('data-set-password-state')).toBe('failed');
    expect(document.activeElement).toBe(one(target, SUBMIT));
  });

  it('saves again on a second press, and removes the alert while it does', async () => {
    setPassword.mockRejectedValueOnce(new Error('the auth service is unreachable'));
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD);
    await pressSetPassword(target);
    expect(target.querySelectorAll(SAVE_ERROR).length).toBe(1);

    await pressSetPassword(target);

    expect(setPassword).toHaveBeenCalledTimes(2);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(target.querySelector(SAVE_ERROR)).toBeNull();
  });
});

describe('contestant protected layout — the set-password view’s Log Out', () => {
  it('calls the context’s logout at once, asks nothing and saves nothing', async () => {
    const target = render(gatedData());
    const button = one<HTMLButtonElement>(target, LOGOUT);
    expect(button.textContent).toContain('common.logout');
    expect(button.getAttribute('type')).not.toBe('submit');

    button.click();
    await settle();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(setPassword).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(target.querySelector('dialog')).toBeNull();
  });

  it('is available after a failed save', async () => {
    setPassword.mockRejectedValue(new Error('the auth service is unreachable'));
    const target = render(gatedData());
    typePasswords(target, VALID_PASSWORD);
    await pressSetPassword(target);

    one<HTMLButtonElement>(target, LOGOUT).click();
    await settle();

    expect(logout).toHaveBeenCalledTimes(1);
  });
});

describe('contestant protected layout — a load not gated on the password', () => {
  it('renders the page and no gate for an ungated load', () => {
    const target = render(ungatedData());

    expect(target.querySelector(GATE)).toBeNull();
    expect(target.querySelector(SUBMIT)).toBeNull();
    expect(target.querySelectorAll(PAGE).length).toBe(1);
    expect(setPassword).not.toHaveBeenCalled();
  });

  it('renders the terms of use, and not the set-password view, for a load gated on the terms', () => {
    const target = render({ gate: 'termsOfUse', user: { ...USER, passwordSet: true } });

    expect(target.querySelector(GATE)).toBeNull();
    expect(target.querySelectorAll('[data-testid="terms-of-use-submit"]').length).toBe(1);
    expect(target.querySelector(PAGE)).toBeNull();
  });
});
