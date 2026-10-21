/**
 * Which view the root layout starts after a navigation, and what its flushes send: the real layout, mounted against fake contexts that carry the real tracking service, with the relay's network call stubbed.
 *
 * The layout starts a view in `afterNavigate` and flushes it in `onNavigate` and when the page becomes hidden. The cases hand the layout's `afterNavigate` callbacks the navigation SvelteKit hands them:
 *
 * - **The enter navigation**, the one a document's hydration makes. SvelteKit 2.70.3 builds its `to` from the router's state before it has stored the state of the page, so `to.route.id` is `null` and `to.params` is `undefined`; only `to.url` is the page's. `page` from `$app/state` is already the page's own.
 * - **A client navigation**, whose `to` carries the route id and the parameters of the page it lands on.
 *
 * What this file holds:
 *
 * 1. The page a document opens on starts a view, so its pageview goes out at the first hidden flush, together with an event buffered on it.
 * 2. The pageview of that first page goes out at the flush of the client navigation that leaves it.
 * 3. A client navigation starts the view of the page it lands on, with the parameters the pageview list allows.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RELAY_PATH } from '$lib/analytics/constants';
import { ROUTE } from '$lib/routes/route';
import type { AfterNavigate, OnNavigate } from '@sveltejs/kit';
import type { Mock } from 'vitest';
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { UserPreferences } from '$lib/contexts/app/userPreferences.type';

const { afterNavigateCallbacks, onNavigateCallbacks, page, appContextHolder } = vi.hoisted(() => ({
  /** The callbacks the layout registers with `afterNavigate`, in registration order. */
  afterNavigateCallbacks: [] as Array<(navigation: AfterNavigate) => void>,
  /** The callbacks the layout registers with `onNavigate`, in registration order. */
  onNavigateCallbacks: [] as Array<(navigation: OnNavigate) => unknown>,
  /** The page state the layout reads from `$app/state`. A case sets its route before it navigates. */
  page: {
    route: { id: null as string | null },
    params: {} as Record<string, string>,
    url: new URL('http://localhost/'),
    data: {} as Record<string, unknown>
  },
  /** The fake app context the layout gets from `initAppContext`; each case puts a new one here before mounting. */
  appContextHolder: { current: undefined as unknown }
}));

vi.mock('$app/navigation', () => ({
  afterNavigate: (callback: (navigation: AfterNavigate) => void) => {
    afterNavigateCallbacks.push(callback);
  },
  beforeNavigate: () => undefined,
  onNavigate: (callback: (navigation: OnNavigate) => unknown) => {
    onNavigateCallbacks.push(callback);
  }
}));
vi.mock('$app/state', () => ({ page, updated: { current: false } }));

vi.mock('$lib/contexts/app', () => ({ initAppContext: () => appContextHolder.current }));
vi.mock('$lib/contexts/auth', () => ({ initAuthContext: () => ({}) }));
vi.mock('$lib/contexts/component', () => ({ initComponentContext: () => ({}) }));
vi.mock('$lib/contexts/data', () => ({ initDataContext: () => ({}) }));
vi.mock('$lib/contexts/i18n', () => ({ initI18nContext: () => ({}) }));
vi.mock('$lib/contexts/layout', () => ({ initLayoutContext: () => ({ routeTitle: { current: '' } }) }));

// The components the layout renders around its page, none of which these cases look at. Each stand-in renders nothing.
vi.mock('$layouts/main', () => ({ MaintenancePage: () => undefined }));
vi.mock('$lib/components/errorMessage', () => ({ ErrorMessage: () => undefined }));
vi.mock('$lib/components/loading', () => ({ Loading: () => undefined }));
vi.mock('$lib/dynamic-components/feedback/modal', () => ({ FeedbackModal: () => undefined }));
vi.mock('$lib/utils/focusNavigationTarget', () => ({ focusNavigationTarget: () => () => undefined }));

const { trackingService } = await import('$lib/contexts/app/tracking');
const RootLayout = (await import('./+layout.svelte')).default;

/** The loader data of a project with no elections, which the layout accepts because the fake settings close the voter app. */
const LAYOUT_DATA = { appSettingsData: {}, appCustomizationData: {}, electionData: [], constituencyData: [] };

/** An active deployment in the default modes. */
const PROJECTION: AnalyticsProjection = { active: true, consentMode: 'gated', visitIdMode: 'memory' };

/** A visitor who has granted consent, so the buffered events travel with the pageview. */
const PREFERENCES = { dataCollection: { consent: 'granted', date: '2026-10-19' } } as UserPreferences;

type SentBody = {
  routeId: string;
  locale: string;
  events: Array<{ name: string; attributes: Record<string, unknown> }>;
};

/** The part of `fetch` the relay transport calls. */
type RelayFetch = (input: string, init?: RequestInit) => Promise<undefined>;

let fetchSpy: Mock<RelayFetch>;
let service: ReturnType<typeof trackingService>;
let teardown: (() => void) | undefined;

/** The bodies of the requests made to the relay, in order. */
function relayBodies(): Array<SentBody> {
  return fetchSpy.mock.calls
    .filter(([input]) => input === RELAY_PATH)
    .map(([, init]) => JSON.parse(String(init?.body)) as SentBody);
}

/** The event names of each request made to the relay, one list per request. */
function namesPerBody(): Array<Array<string>> {
  return relayBodies().map((body) => body.events.map((event) => event.name));
}

/** Point the page state at a route, as SvelteKit does before it calls the `afterNavigate` callbacks. */
function setPage(routeId: string, params: Record<string, string>, url: string): void {
  page.route = { id: routeId };
  page.params = params;
  page.url = new URL(url, 'http://localhost');
}

/** Call the layout's `afterNavigate` callbacks with the enter navigation of a document, in the shape SvelteKit 2.70.3 builds it: the page's url, no route id and no parameters. */
function enter(): void {
  const navigation = {
    from: null,
    to: { params: undefined, route: { id: null }, url: page.url, scroll: { x: 0, y: 0 } },
    willUnload: false,
    type: 'enter',
    complete: Promise.resolve()
  } as unknown as AfterNavigate;
  for (const callback of afterNavigateCallbacks) callback(navigation);
}

/** Make a client navigation to `routeId`: the `onNavigate` callbacks, the new page state, then the `afterNavigate` callbacks, in SvelteKit's order. */
function navigate(routeId: string, params: Record<string, string>, url: string): void {
  const from = { params: page.params, route: { id: page.route.id }, url: page.url };
  const to = { params, route: { id: routeId }, url: new URL(url, 'http://localhost') };
  const onNavigation = {
    from,
    to,
    willUnload: false,
    type: 'link',
    complete: Promise.resolve()
  } as unknown as OnNavigate;
  for (const callback of onNavigateCallbacks) callback(onNavigation);
  setPage(routeId, params, url);
  const afterNavigation = { ...onNavigation, to: { ...to, scroll: { x: 0, y: 0 } } } as unknown as AfterNavigate;
  for (const callback of afterNavigateCallbacks) callback(afterNavigation);
}

/** Reach the hidden flush point, as the E2E specs do: report the document hidden, dispatch `visibilitychange`, then show the real value again. */
function hide(): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  document.dispatchEvent(new Event('visibilitychange'));
  Reflect.deleteProperty(document, 'visibilityState');
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  afterNavigateCallbacks.length = 0;
  onNavigateCallbacks.length = 0;
  fetchSpy = vi.fn<RelayFetch>(() => Promise.resolve(undefined));
  vi.stubGlobal('fetch', fetchSpy);

  service = trackingService({
    appSettings: { current: { analytics: { trackEvents: true } } as unknown as AppSettings },
    userPreferences: { current: PREFERENCES },
    projection: { current: PROJECTION },
    locale: () => 'en'
  });
  appContextHolder.current = {
    appSettings: { access: { voterApp: false } },
    t: (key: string) => key,
    setDataRoot: () => undefined,
    openFeedbackModal: { set: () => undefined },
    popupQueue: { current: undefined, shift: () => undefined },
    startPageview: service.startPageview,
    startEvent: service.startEvent,
    track: service.track,
    submitAllEvents: service.submitAllEvents,
    resetAllEvents: service.resetAllEvents,
    setPageVisible: service.setPageVisible,
    analyticsGate: service.gate
  };

  const target = document.createElement('div');
  document.body.appendChild(target);
  const children = createRawSnippet(() => ({ render: () => '<div data-testid="page"></div>' }));
  const component = mount(RootLayout, { target, props: { data: LAYOUT_DATA as never, children } });
  flushSync();
  teardown = () => {
    void unmount(component);
    target.remove();
  };
});

afterEach(() => {
  teardown?.();
  teardown = undefined;
  vi.unstubAllGlobals();
});

describe('the root layout starts a view after every navigation', () => {
  it('starts the view of the page a document opens on, so its first hidden flush sends its pageview and the events buffered on it', () => {
    setPage(ROUTE.Home, {}, '/en/');
    enter();
    service.track('menu_open');

    hide();

    expect(namesPerBody(), 'one request, with the front page pageview and the event').toStrictEqual([
      ['pageview', 'menu_open']
    ]);
    expect(relayBodies()[0].routeId).toBe(ROUTE.Home);
  });

  it('sends the pageview of the page a document opens on at the flush of the navigation that leaves it', () => {
    setPage(ROUTE.Home, {}, '/en/');
    enter();

    navigate(ROUTE.Intro, {}, '/en/intro');

    expect(
      relayBodies().map((body) => body.routeId),
      'the front page pageview, sent as the intro opens'
    ).toStrictEqual([ROUTE.Home]);
    expect(namesPerBody()).toStrictEqual([['pageview']]);
  });

  it('starts the view of the page a client navigation lands on, with the parameters the pageview list allows', () => {
    setPage(ROUTE.Home, {}, '/en/');
    enter();
    navigate(ROUTE.Question, { questionId: 'question-1' }, '/en/questions/question-1');
    fetchSpy.mockClear();

    hide();

    const [body] = relayBodies();
    expect(body?.routeId).toBe(ROUTE.Question);
    expect(body?.events[0]).toMatchObject({ name: 'pageview', attributes: { params: { questionId: 'question-1' } } });
  });
});
