/**
 * The voter app's privacy page, mounted for real against a fake app context.
 *
 * The fake context's `t` returns its key. Its analytics send-policy input has an active relay, and the visitor sends Global Privacy Control, so the page renders its analytics text and no consent control. Each test can change `trackEvents`, the visit-id mode and the survey link template before mounting; `afterEach` restores them. Assertions are on the DOM rather than on component state.
 *
 * What this file holds:
 *
 * 1. **The heading** — the page's one heading can take focus, and the root layout's post-navigation focus reset lands on it.
 * 2. **The analytics section** — the description of the usage events is shown only with `trackEvents` on, while the page-view count and the Global Privacy Control rule are shown either way. The survey notice is shown only when the survey link template holds the `{sessionId}` placeholder and the visit-id mode is `memory`. Each case has its control.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusNavigationTarget } from '$lib/utils/focusNavigationTarget';

const DEFAULT_LINK_TEMPLATE = 'https://survey.example/?visit={sessionId}';

const box = {
  trackEvents: true,
  visitIdMode: 'memory' as 'memory' | 'none',
  linkTemplate: DEFAULT_LINK_TEMPLATE as string | undefined
};

const context = {
  t: (key: string) => key,
  getRoute: { current: () => '/' },
  get appSettings() {
    return { survey: box.linkTemplate === undefined ? undefined : { linkTemplate: box.linkTemplate } };
  },
  analyticsPolicy: {
    get current() {
      return {
        projection: { active: true, consentMode: 'gated', visitIdMode: box.visitIdMode },
        globalPrivacyControl: true,
        trackEvents: box.trackEvents,
        consent: undefined
      };
    }
  }
};

vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));

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

const PrivacyPage = (await import('./+page.svelte')).default;

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  box.trackEvents = true;
  box.visitIdMode = 'memory';
  box.linkTemplate = DEFAULT_LINK_TEMPLATE;
});

/** Mount the page and run its effects. */
function render(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(PrivacyPage, { target, props: {} as never });
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  flushSync();
  return target;
}

describe('the heading', () => {
  it('is the one heading of the page, can take focus and reads the page title', () => {
    const target = render();
    const headings = target.querySelectorAll<HTMLElement>('h1');
    expect(headings.length, 'exactly one h1 should be rendered').toBe(1);
    const heading = headings[0];
    expect(heading.textContent?.trim()).toBe('privacy.title');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });

  it("receives the root layout's post-navigation focus reset", () => {
    const target = render();
    const cancel = focusNavigationTarget({ schedule: (callback) => callback() });
    teardown.push(cancel);
    expect(document.activeElement).toBe(target.querySelector('h1'));
  });
});

describe('the analytics section', () => {
  it.each([
    { trackEvents: true, described: true },
    { trackEvents: false, described: false }
  ])(
    'trackEvents $trackEvents: usage events described $described, page views and Global Privacy Control always',
    ({ trackEvents, described }) => {
      box.trackEvents = trackEvents;

      const text = render().textContent ?? '';

      expect(text.includes('privacy.analytics.content.gated'), 'privacy.analytics.content.gated').toBe(described);
      expect(text).not.toContain('privacy.analytics.content.free');
      expect(text).toContain('privacy.analytics.pageviews');
      expect(text).toContain('privacy.analytics.gpc');
    }
  );

  it.each([
    { linkTemplate: DEFAULT_LINK_TEMPLATE, visitIdMode: 'memory' as const, shown: true },
    { linkTemplate: 'https://survey.example/?visit={ sessionId }', visitIdMode: 'memory' as const, shown: true },
    { linkTemplate: 'https://survey.example/', visitIdMode: 'memory' as const, shown: false },
    { linkTemplate: undefined, visitIdMode: 'memory' as const, shown: false },
    { linkTemplate: DEFAULT_LINK_TEMPLATE, visitIdMode: 'none' as const, shown: false }
  ])(
    'survey link template $linkTemplate, visit-id mode $visitIdMode: survey notice shown $shown',
    ({ linkTemplate, visitIdMode, shown }) => {
      box.linkTemplate = linkTemplate;
      box.visitIdMode = visitIdMode;

      const text = render().textContent ?? '';

      expect(text.includes('privacy.analytics.survey'), 'privacy.analytics.survey').toBe(shown);
    }
  );
});
