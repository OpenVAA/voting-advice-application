/**
 * `ReadFailure`, mounted for real against a fake contestant context, with the real `ErrorMessage`, `ContactSupport` and `LogoutButton` below it.
 *
 * `$app/navigation` is replaced, so a case decides when the rerun of the loads settles and how. The view is shown on a page whose URL may name no entity, so routes are built with the real `buildRoute` from an empty set of route params, and a link into the pages of an entity would throw.
 */

import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { RouteOptions } from '$lib/routes';

const { invalidateAll, logout } = vi.hoisted(() => ({
  invalidateAll: vi.fn(),
  logout: vi.fn()
}));

vi.mock('$app/navigation', async (importOriginal) => ({ ...(await importOriginal<object>()), invalidateAll }));

vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
    logout,
    appSettings: { admin: { email: 'support@example.org' }, contestantApp: { entityTypes: ['candidate'] } },
    answersLocked: false,
    tasks: [],
    userData: { savedEntityData: undefined },
    unansweredRequiredInfoQuestions: [],
    unansweredOpinionQuestions: []
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the logout button's modal is imported. The stub answers "no preference".
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

const { ReadFailure } = await import('.');

const VIEW = '[data-testid="contestant-read-failure"]';
const ERROR = '[data-testid="error-message"]';
const TRY_AGAIN = '[data-testid="contestant-read-failure-try-again"]';
const SUPPORT = '[data-testid="contestant-contact-support"]';
const LOGOUT = '[data-testid="contestant-read-failure-logout"]';

let teardown: Array<() => void> = [];

beforeEach(() => {
  invalidateAll.mockResolvedValue(undefined);
  logout.mockResolvedValue(undefined);
  // The error message logs itself when it mounts.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** Mount the view and return the element it was mounted into. */
function render(props: Record<string, unknown> = {}): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(ReadFailure, { target, props: props as never });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** The element a selector names below `root`, asserted to be there. */
function find<TElement extends Element>(root: ParentNode, selector: string): TElement {
  const element = root.querySelector<TElement>(selector);
  expect(element, `${selector} should be rendered`).not.toBeNull();
  return element!;
}

/** Whether `first` comes before `second` in document order. */
function precedes(first: Element, second: Element): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

/** Let the pending promises of a press settle and the view update. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await tick();
  flushSync();
}

describe('ReadFailure — what it shows', () => {
  it('reads in the order error message, sentence, Try again, support, logout', () => {
    const target = render();

    const view = target.querySelector(VIEW);
    expect(view, 'the view should be rendered').not.toBeNull();
    const sentence = [...view!.querySelectorAll('p')].find(
      (p) => p.textContent?.trim() === 'contestantApp.error.readFailed.content'
    );
    const sequence = [
      view!.querySelector(ERROR),
      sentence,
      view!.querySelector(TRY_AGAIN),
      view!.querySelector(SUPPORT),
      view!.querySelector(LOGOUT)
    ];
    for (const element of sequence) expect(element).toBeTruthy();
    for (let i = 1; i < sequence.length; i++) expect(precedes(sequence[i - 1]!, sequence[i]!), `step ${i}`).toBe(true);
  });

  it('heads the view with the default error message, and with a title its caller gives', () => {
    expect(render().querySelector(`${ERROR} h2`)?.textContent?.trim()).toBe('error.default');
    expect(render({ title: 'Another Title' }).querySelector(`${ERROR} h2`)?.textContent?.trim()).toBe('Another Title');
  });

  it('offers Try again as a button, the support block as a link to the Help page, and logout as a button', () => {
    const target = render();

    const tryAgain = find<HTMLElement>(target, TRY_AGAIN);
    expect(tryAgain.tagName).toBe('BUTTON');
    expect(tryAgain.textContent).toContain('contestantApp.error.readFailed.tryAgain');
    expect(tryAgain.hasAttribute('disabled')).toBe(false);

    const support = target.querySelectorAll<HTMLAnchorElement>(SUPPORT);
    expect(support).toHaveLength(1);
    expect(support[0].getAttribute('href')).toBe('/contestant/help#support');

    const logoutButton = find<HTMLElement>(target, LOGOUT);
    expect(logoutButton.tagName).toBe('BUTTON');
    expect(logoutButton.textContent).toContain('common.logout');
  });

  it('passes its class and attributes to its root, keeping its own classes', () => {
    const target = render({ class: 'bg-base-300', id: 'read-failure' });

    const view = find<HTMLElement>(target, VIEW);
    expect(view.id).toBe('read-failure');
    expect(view.classList).toContain('bg-base-300');
    expect(view.classList).toContain('flex');
  });
});

describe('ReadFailure — Try again', () => {
  it('reruns the loads once per press', async () => {
    const target = render();

    find<HTMLButtonElement>(target, TRY_AGAIN).click();
    await settle();

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it('shows that it is busy and does not rerun the loads again while a rerun is in flight', async () => {
    const pending = new Array<() => void>();
    invalidateAll.mockImplementation(() => new Promise<void>((resolve) => pending.push(resolve)));
    const target = render();
    const button = find<HTMLButtonElement>(target, TRY_AGAIN);

    button.click();
    await settle();
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.textContent).toContain('common.loading');
    button.click();
    await settle();
    expect(invalidateAll).toHaveBeenCalledTimes(1);

    pending[0]();
    await settle();
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.textContent).toContain('contestantApp.error.readFailed.tryAgain');
    find<HTMLButtonElement>(target, TRY_AGAIN).click();
    await settle();
    expect(invalidateAll).toHaveBeenCalledTimes(2);
  });

  it('keeps the view usable when the rerun itself fails', async () => {
    invalidateAll.mockRejectedValueOnce(new Error('network down'));
    const target = render();

    find<HTMLButtonElement>(target, TRY_AGAIN).click();
    await settle();

    const button = find<HTMLButtonElement>(target, TRY_AGAIN);
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(target.textContent).not.toContain('network down');
    button.click();
    await settle();
    expect(invalidateAll).toHaveBeenCalledTimes(2);
  });
});

describe('ReadFailure — logout', () => {
  it('logs the user out at once, with no entity loaded', async () => {
    const target = render();

    find<HTMLButtonElement>(target, LOGOUT).click();
    await settle();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(invalidateAll).not.toHaveBeenCalled();
  });
});
