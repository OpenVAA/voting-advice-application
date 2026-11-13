/**
 * Where focus goes when the Contestant App's protected layout replaces the view it renders without a navigation: the real layout, mounted against a fake context, with the real terms-of-use gate and, below it, the real root page or a marker page.
 *
 * A rerun load replaces the layout's `data` in place. The cases do the same: the layout's props are held in `$state`, a case assigns a new `data` object and flushes.
 *
 * What this file holds:
 *
 * 1. **Nothing is requested when no view was replaced.** Not on first render, with a gate or without one, and not on a rerun that returns the same view in a new data object.
 * 2. **A replaced view hands focus to the heading of the view that replaced it.** A gate replaced by the selection screen, by the "nothing to edit" view, and by a page whose heading renders after the first frame; and a page replaced by a gate.
 * 3. **Nothing is requested while a navigation is in flight.** That navigation moves focus itself when it completes.
 * 4. **A pending wait ends with the layout and with the next replacement, and outlasts a rerun that returns the same view.**
 *
 * `focusNavigationTarget` is wrapped, not replaced: the wrapper counts the layout's requests and records each cancel function it hands out, and the real helper still schedules the lookup, waits for a late heading and moves focus. The cases therefore read `document.activeElement`, which a replaced helper could not move.
 *
 * A frame is awaited through `requestAnimationFrame`, which is what the helper schedules its first lookup with.
 */

import { DataRoot } from '@openvaa/data';
import { createRawSnippet, flushSync, mount, unmount, untrack } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import type { Snippet } from 'svelte';
import type { Mock, MockInstance } from 'vitest';
import type { UserEntity } from '$lib/api/base/dataWriter.type';
import type { RouteOptions } from '$lib/routes';
import type * as FocusNavigationTargetModule from '$lib/utils/focusNavigationTarget';

const { cancels, navigating, requestFocus } = vi.hoisted(() => ({
  /** The cancel function handed out for each request, in request order. */
  cancels: [] as Array<Mock<() => void>>,
  /** The navigation state the layout reads. Idle unless a case sets `to`. */
  navigating: {
    from: null,
    to: null as { url: URL } | null,
    type: null,
    willUnload: null,
    delta: null,
    complete: null
  },
  requestFocus: vi.fn<() => () => void>()
}));

vi.mock('$lib/utils/focusNavigationTarget', async (importOriginal) => {
  const original = await importOriginal<typeof FocusNavigationTargetModule>();
  requestFocus.mockImplementation(() => {
    const cancel = vi.fn(original.focusNavigationTarget());
    cancels.push(cancel);
    return cancel;
  });
  return { ...original, focusNavigationTarget: requestFocus };
});

vi.mock('$app/state', async (importOriginal) => ({ ...(await importOriginal<object>()), navigating }));

const ZOE: UserEntity = {
  type: 'candidate',
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Zoe',
  lastName: 'Zeta',
  confirmed: true
};
const ADA: UserEntity = {
  type: 'candidate',
  id: '22222222-2222-4222-8222-222222222222',
  firstName: 'Ada',
  lastName: 'Alpha',
  confirmed: false
};

const state = $state<{ entities: ReadonlyArray<UserEntity>; version: number }>({ entities: [], version: 0 });

let dataRoot = new DataRoot();

/** One object for both import paths of the contestant context: what the gate reads, and what the root page and the views below it read. */
const context = {
  appType: { current: 'contestant' },
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
  startEvent: () => undefined,
  logout: async () => undefined,
  acceptTermsOfUse: async () => ({ type: 'success' }),
  setDataRoot: (updater: (dr: DataRoot) => void) =>
    untrack(() => {
      updater(dataRoot);
      state.version++;
    }),
  appSettings: {
    admin: { email: 'support@example.org' },
    contestantApp: { entityTypes: ['candidate', 'organization'] },
    results: { cardContents: { candidate: [], organization: [] } },
    analytics: { trackEvents: false }
  },
  // No analytics provider and trackEvents off: the terms show no usage-data section and the gate offers no opt-out.
  analyticsGate: {
    current: {
      projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
      globalPrivacyControl: false,
      trackEvents: false,
      consent: undefined
    }
  },
  locale: 'en',
  answersLocked: false,
  unansweredRequiredInfoQuestions: [],
  unansweredOpinionQuestions: [],
  userData: { savedEntityData: undefined, init: () => undefined },
  user: { email: 'user@example.org' },
  get entities() {
    return state.entities;
  },
  get dataRoot() {
    void state.version;
    return dataRoot;
  }
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));
vi.mock('$lib/contexts/voter', () => ({ getVoterContext: () => undefined }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));
vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({
    video: { hasContent: false },
    setRouteTitle: () => undefined,
    pageStyles: { push: () => () => undefined }
  })
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

const ProtectedLayout = (await import('./+layout.svelte')).default;
const RootPage = (await import('./+page.svelte')).default;

const USER = {
  id: 'user-1',
  email: 'user@example.org',
  username: 'user@example.org',
  role: 'contestant',
  passwordSet: true
};

/** Load data for a user who must pass the terms-of-use gate. A new object on every call, as every rerun load returns one. */
function gatedData(): object {
  return { gate: 'termsOfUse', user: { ...USER, termsOfUseAccepted: null } };
}

/** Load data for a user past the gates. A new object on every call. */
function ungatedData(): object {
  return { gate: null, user: { ...USER, termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00' } };
}

const CONTINUE = '[data-testid="terms-of-use-submit"]';
const MARKER_PAGE = '[data-testid="page"]';
const GATE_TITLE = 'dynamic.contestantAppPrivacy.consent.title';

/** A page with no heading: its heading, if any, is appended by the case. */
const markerPage = createRawSnippet(() => ({ render: () => '<div data-testid="page"></div>' }));

/** The real root page in one of its two views, mounted into the layout's page slot and unmounted with it. */
function rootPage(view: 'nothingToEdit' | 'select'): Snippet {
  return createRawSnippet(() => ({
    render: () => '<div data-testid="page"></div>',
    setup: (element) => {
      const component = mount(RootPage, { target: element, props: { data: { view } } as never });
      return () => {
        void unmount(component);
      };
    }
  }));
}

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  (document.activeElement as HTMLElement | null)?.blur?.();
  navigating.to = null;
  requestFocus.mockClear();
  cancels.length = 0;
  dataRoot = new DataRoot();
  state.entities = [];
});

/**
 * Mount the layout over a page.
 * @returns The element it was mounted into, `rerun` for replacing its load data as a rerun load does, and `destroy` for unmounting it before the case ends.
 */
function render(
  data: object,
  page: Snippet = markerPage
): { target: HTMLElement; rerun: (next: object) => void; destroy: () => void } {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const props = $state({ data: data as never, children: page });
  const component = mount(ProtectedLayout, { target, props });
  flushSync();
  let mounted = true;
  function destroy(): void {
    if (!mounted) return;
    mounted = false;
    void unmount(component);
  }
  teardown.push(() => {
    destroy();
    target.remove();
  });
  return {
    target,
    rerun: (next) => {
      props.data = next as never;
      flushSync();
    },
    destroy
  };
}

/** Wait for the next animation frame, by which the helper has made its first lookup. */
function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Let a `MutationObserver` deliver its records, which it does asynchronously. */
async function mutationsDelivered(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Append a heading that can take focus to `parent`, as a page whose heading renders late does. */
function appendHeading(parent: Element): HTMLHeadingElement {
  const heading = document.createElement('h1');
  heading.setAttribute('tabindex', '-1');
  heading.textContent = 'A late heading';
  parent.appendChild(heading);
  teardown.push(() => heading.remove());
  return heading;
}

/** Record every `focus()` call on an element until the case ends. */
function spyOnFocus(): MockInstance<HTMLElement['focus']> {
  const spy = vi.spyOn(HTMLElement.prototype, 'focus');
  teardown.push(() => spy.mockRestore());
  return spy;
}

/** The one heading of the view below `target`. */
function headingOf(target: HTMLElement): HTMLElement {
  const headings = target.querySelectorAll<HTMLElement>('h1');
  expect(headings, 'the view should hold exactly one h1').toHaveLength(1);
  return headings[0];
}

describe('contestant protected layout — no view was replaced', () => {
  it('requests no focus move on first render with a gate', async () => {
    render(gatedData());
    await frame();

    expect(requestFocus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });

  it('requests no focus move on first render without a gate', async () => {
    render(ungatedData(), rootPage('select'));
    await frame();

    expect(requestFocus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });

  it('requests no focus move when a rerun returns the same gate in a new data object', async () => {
    const { target, rerun } = render(gatedData());

    rerun(gatedData());
    await frame();

    expect(target.querySelector(CONTINUE)).not.toBeNull();
    expect(requestFocus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });

  it('requests no focus move when a rerun returns the page again', async () => {
    const { target, rerun } = render(ungatedData(), rootPage('nothingToEdit'));

    rerun(ungatedData());
    await frame();

    expect(target.querySelector(MARKER_PAGE)).not.toBeNull();
    expect(requestFocus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });
});

describe('contestant protected layout — a view replaced without a navigation', () => {
  it.each([
    { view: 'select' as const, name: 'the selection screen', title: 'contestantApp.entitySelection.title' },
    { view: 'nothingToEdit' as const, name: 'the "nothing to edit" view', title: 'contestantApp.nothingToEdit.title' }
  ])('moves focus to the heading of $name when it replaces a gate', async ({ view, title }) => {
    state.entities = view === 'select' ? [ZOE, ADA] : [];
    const { target, rerun } = render(gatedData(), rootPage(view));
    const focus = spyOnFocus();

    rerun(ungatedData());

    expect(requestFocus).toHaveBeenCalledTimes(1);
    expect(target.querySelector(CONTINUE), 'the gate should have left the document').toBeNull();

    await frame();

    const heading = headingOf(target);
    expect(heading.textContent?.trim()).toBe(title);
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(heading);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus.mock.contexts[0]).toBe(heading);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('waits for a heading that renders after the first frame, and moves focus to it when it appears', async () => {
    const { target, rerun } = render(gatedData());

    rerun(ungatedData());

    expect(requestFocus).toHaveBeenCalledTimes(1);

    await frame();

    expect(target.querySelector('h1')).toBeNull();
    expect(document.activeElement).toBe(document.body);

    const heading = appendHeading(target.querySelector(MARKER_PAGE)!);
    await mutationsDelivered();

    expect(document.activeElement).toBe(heading);
  });

  it('moves focus to the heading of a gate that replaces a page', async () => {
    const { target, rerun } = render(ungatedData());

    rerun(gatedData());

    expect(requestFocus).toHaveBeenCalledTimes(1);
    expect(target.querySelector(MARKER_PAGE), 'the page should have left the document').toBeNull();

    await frame();

    const heading = headingOf(target);
    expect(heading.textContent?.trim()).toBe(GATE_TITLE);
    expect(document.activeElement).toBe(heading);
  });
});

describe('contestant protected layout — a view replaced while a navigation is in flight', () => {
  it('requests no focus move: the navigation moves focus itself when it completes', async () => {
    state.entities = [ZOE, ADA];
    const { target, rerun } = render(gatedData(), rootPage('select'));
    navigating.to = { url: new URL(`http://localhost/contestant/candidate/${ZOE.id}`) };

    rerun(ungatedData());
    await frame();

    expect(target.querySelector(CONTINUE), 'the gate should have left the document').toBeNull();
    expect(requestFocus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
  });
});

describe('contestant protected layout — a pending wait', () => {
  it('ends with the layout: a heading that appears after the layout is unmounted is not focused', async () => {
    const { rerun, destroy } = render(gatedData());

    rerun(ungatedData());

    expect(requestFocus).toHaveBeenCalledTimes(1);

    await frame();
    destroy();
    const heading = appendHeading(document.body);
    await mutationsDelivered();

    expect(cancels[0]).toHaveBeenCalled();
    expect(document.activeElement).not.toBe(heading);
    expect(document.activeElement).toBe(document.body);
  });

  it('outlasts a rerun that returns the same view: the heading is still focused when it appears', async () => {
    const { target, rerun } = render(gatedData());

    rerun(ungatedData());

    expect(requestFocus).toHaveBeenCalledTimes(1);

    await frame();
    rerun(ungatedData());

    expect(requestFocus).toHaveBeenCalledTimes(1);
    expect(cancels[0], 'the pending wait should not have been cancelled').not.toHaveBeenCalled();

    const heading = appendHeading(target.querySelector(MARKER_PAGE)!);
    await mutationsDelivered();

    expect(document.activeElement).toBe(heading);
  });

  it('ends with the next replacement: focus is moved once, to the heading of the view shown last', async () => {
    const { target, rerun } = render(gatedData());
    const focus = spyOnFocus();

    rerun(ungatedData());

    expect(requestFocus).toHaveBeenCalledTimes(1);

    await frame();

    expect(document.activeElement, 'the page has no heading yet, so the first wait is pending').toBe(document.body);

    rerun(gatedData());

    expect(requestFocus).toHaveBeenCalledTimes(2);
    expect(cancels[0], 'the first wait should have been cancelled').toHaveBeenCalledTimes(1);

    await mutationsDelivered();
    await frame();

    const heading = headingOf(target);
    expect(heading.textContent?.trim()).toBe(GATE_TITLE);
    expect(document.activeElement).toBe(heading);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(focus.mock.contexts[0]).toBe(heading);
  });
});
