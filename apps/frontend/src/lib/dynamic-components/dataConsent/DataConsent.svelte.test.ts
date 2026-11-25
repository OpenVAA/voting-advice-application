/**
 * `DataConsent`, mounted against a fake app context, for which stored consent choice it shows and changes: the Contestant App's own choice (`contestantDataConsent`) on a Contestant route, the voter app's (`dataCollection`) everywhere else.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserPreferences } from '$lib/contexts/app/userPreferences.type';

const { box, context, route, setDataConsent } = vi.hoisted(() => {
  const box = { prefs: {} as Record<string, unknown> };
  const route: { id: string | null } = { id: null };
  const setDataConsent = vi.fn();
  const context = {
    t: (key: string) => key,
    setDataConsent,
    userPreferences: {
      get current() {
        return box.prefs;
      }
    }
  };
  return { box, context, route, setDataConsent };
});

vi.mock('$app/state', () => ({ page: { route } }));
vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const DataConsent = (await import('./DataConsent.svelte')).default;

const GRANTED = 'privacy.dataConsentLabel.granted';
const DENIED = 'privacy.dataConsentLabel.denied';

describe('DataConsent — the choice of the current app', () => {
  let target: HTMLElement;
  let component: ReturnType<typeof mount> | undefined;

  beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
    route.id = null;
    box.prefs = {};
  });

  afterEach(() => {
    if (component) unmount(component);
    component = undefined;
    target.remove();
    vi.clearAllMocks();
  });

  function render(prefs: Partial<UserPreferences>) {
    box.prefs = prefs as Record<string, unknown>;
    component = mount(DataConsent, { target, props: { description: 'none' } });
    flushSync();
  }

  function button(label: string): HTMLButtonElement {
    const found = [...target.querySelectorAll('button')].find((b) => b.textContent?.includes(label));
    if (!found) throw new Error(`no button labelled ${label}`);
    return found;
  }

  const BOTH = {
    dataCollection: { consent: 'denied', date: '2026-10-19' },
    contestantDataConsent: { consent: 'granted', date: '2026-10-19' }
  } as const;

  it('on a Contestant route shows the contestant choice', () => {
    route.id = '/contestant/privacy';
    render(BOTH);
    expect(button(GRANTED).disabled).toBe(true);
    expect(button(DENIED).disabled).toBe(false);
  });

  it('on a voter route shows the voter choice', () => {
    route.id = '/(voters)/privacy';
    render(BOTH);
    expect(button(GRANTED).disabled).toBe(false);
    expect(button(DENIED).disabled).toBe(true);
  });

  it('on a voter route a contestant grant leaves both choices open', () => {
    route.id = '/(voters)/privacy';
    render({ contestantDataConsent: BOTH.contestantDataConsent });
    expect(button(GRANTED).disabled).toBe(false);
    expect(button(DENIED).disabled).toBe(false);
    button(GRANTED).click();
    expect(setDataConsent).toHaveBeenCalledWith('granted');
  });
});
