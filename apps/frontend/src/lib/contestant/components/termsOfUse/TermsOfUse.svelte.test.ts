/**
 * `TermsOfUse`, mounted for real against a fake app context.
 *
 * What this file holds:
 *
 * 1. **Whether the section is shown** — the usage-data section is rendered when `trackEvents` is on and a provider is configured, and not when either is off. The visitor's own Global Privacy Control signal does not hide it, because the terms are the same statement to every user. The four cases are each other's controls.
 * 2. **Which text it shows** — the consent-gated text, which names the opt-out box, in mode `gated`, and the consent-free text, which names none, in mode `free`. The two cases are each other's controls.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { INACTIVE_PROJECTION } from '$lib/analytics/modes';
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { SendPolicyInput } from '$lib/contexts/app/tracking/sendPolicy';

const { box } = vi.hoisted(() => ({
  box: { trackEvents: true, policy: undefined as unknown as SendPolicyInput }
}));

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    t: (key: string) => key,
    get appSettings() {
      return { analytics: { trackEvents: box.trackEvents } };
    },
    analyticsPolicy: {
      get current() {
        return box.policy;
      }
    }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { TermsOfUse } = await import('.');

const TITLE = 'privacy.usageData.title';
const GATED_CONTENT = 'privacy.usageData.content.gated';
const FREE_CONTENT = 'privacy.usageData.content.free';

/** A send-policy input with a provider configured or not, the Global Privacy Control signal on or off, and a consent mode (`gated` unless given). */
function policyInput({
  active,
  globalPrivacyControl,
  consentMode = 'gated'
}: {
  active: boolean;
  globalPrivacyControl: boolean;
  consentMode?: AnalyticsProjection['consentMode'];
}): SendPolicyInput {
  return {
    projection: { ...INACTIVE_PROJECTION, active, consentMode },
    globalPrivacyControl,
    trackEvents: box.trackEvents,
    consent: undefined
  };
}

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/** Mount the terms and return their text. */
function renderText(): string {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(TermsOfUse, { target, props: {} });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target.textContent ?? '';
}

describe('TermsOfUse — the usage-data section', () => {
  it.each([
    { trackEvents: true, active: true, globalPrivacyControl: false, shown: true },
    { trackEvents: false, active: true, globalPrivacyControl: false, shown: false },
    { trackEvents: true, active: false, globalPrivacyControl: false, shown: false },
    { trackEvents: true, active: true, globalPrivacyControl: true, shown: true }
  ])(
    'trackEvents $trackEvents, provider configured $active, Global Privacy Control $globalPrivacyControl: shown $shown',
    ({ trackEvents, active, globalPrivacyControl, shown }) => {
      box.trackEvents = trackEvents;
      box.policy = policyInput({ active, globalPrivacyControl });

      const text = renderText();

      expect(text.includes(TITLE), TITLE).toBe(shown);
      expect(text.includes(GATED_CONTENT), GATED_CONTENT).toBe(shown);
    }
  );

  it('keeps the two dynamic sections whether or not it shows the usage-data section', () => {
    box.trackEvents = false;
    box.policy = policyInput({ active: true, globalPrivacyControl: false });

    const text = renderText();

    expect(text).toContain('dynamic.contestantAppPrivacy.registryStatement.title');
    expect(text).toContain('dynamic.contestantAppPrivacy.otherTermsOfUse.title');
  });
});

describe('TermsOfUse — the usage-data text', () => {
  it.each([
    { consentMode: 'gated' as const, shownKey: GATED_CONTENT, hiddenKey: FREE_CONTENT },
    { consentMode: 'free' as const, shownKey: FREE_CONTENT, hiddenKey: GATED_CONTENT }
  ])('consent mode $consentMode shows $shownKey and not $hiddenKey', ({ consentMode, shownKey, hiddenKey }) => {
    box.trackEvents = true;
    box.policy = policyInput({ active: true, globalPrivacyControl: false, consentMode });

    const text = renderText();

    expect(text.includes(shownKey), shownKey).toBe(true);
    expect(text.includes(hiddenKey), hiddenKey).toBe(false);
  });
});
