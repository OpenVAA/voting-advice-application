/**
 * `TermsOfUseGate`, mounted for real against a fake contestant context, for what accepting the terms writes to the visitor's consent choice.
 *
 * What this file holds:
 *
 * 1. **The opt-out is offered only when events could be sent in gated mode.** With tracking on in gated mode the box is rendered; with `trackEvents` off, in consent-free mode, under Global Privacy Control or with no provider configured it is not.
 * 2. **Accepting writes the choice only when the box was shown.** Unticked writes `granted`, ticked writes `denied`; with no box nothing is written. A failed acceptance writes nothing.
 * 3. **A stored refusal is kept.** When this browser already holds `denied`, the box starts ticked, so accepting writes `denied` again.
 * 4. **The choice is written before the load is rerun.**
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { GateInput } from '$lib/contexts/app/tracking/gates';
import type { ConsentStatus } from '$lib/contexts/app/userPreferences.type';

const { acceptTermsOfUse, box, context, invalidateAll, setDataConsent } = vi.hoisted(() => {
  const box = { gate: undefined as unknown as GateInput };
  const acceptTermsOfUse = vi.fn();
  const invalidateAll = vi.fn();
  const setDataConsent = vi.fn();
  /** One object for the contestant context the gate reads and the app context the terms read. */
  const context = {
    t: (key: string) => key,
    logout: async () => undefined,
    acceptTermsOfUse,
    setDataConsent,
    get appSettings() {
      return { analytics: { trackEvents: box.gate.trackEvents } };
    },
    analyticsGate: {
      get current() {
        return box.gate;
      }
    }
  };
  return { acceptTermsOfUse, box, context, invalidateAll, setDataConsent };
});

vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
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

const TermsOfUseGate = (await import('./TermsOfUseGate.svelte')).default;

const OPT_OUT = '[data-testid="terms-tracking-opt-out"]';

/** A gate input with tracking on in gated mode, a provider configured, no Global Privacy Control and no stored choice, changed by `overrides`. */
function gateInput(
  overrides: Partial<Omit<GateInput, 'projection'>> & { projection?: Partial<AnalyticsProjection> } = {}
): GateInput {
  const { projection, ...rest } = overrides;
  return {
    projection: { active: true, consentMode: 'gated', visitIdMode: 'memory', ...projection },
    globalPrivacyControl: false,
    trackEvents: true,
    consent: undefined,
    ...rest
  };
}

let teardown: Array<() => void> = [];

beforeEach(() => {
  box.gate = gateInput();
  acceptTermsOfUse.mockResolvedValue({ type: 'success' });
  invalidateAll.mockResolvedValue(undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

function render(): HTMLElement {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const component = mount(TermsOfUseGate, { target, props: {} });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

function optOutOf(target: HTMLElement): HTMLInputElement | null {
  return target.querySelector<HTMLInputElement>(OPT_OUT);
}

/** Tick or untick a checkbox as a user does. */
function setChecked(checkbox: HTMLInputElement, checked: boolean): void {
  checkbox.checked = checked;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  checkbox.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** Let the submit handler's awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  flushSync();
}

/** Tick the acceptance checkbox and press Continue. */
async function acceptAndSubmit(target: HTMLElement): Promise<void> {
  const terms = target.querySelector<HTMLInputElement>('[data-testid="terms-checkbox"]');
  expect(terms, 'the terms checkbox should be rendered').not.toBeNull();
  setChecked(terms!, true);
  const submit = target.querySelector<HTMLButtonElement>('[data-testid="terms-of-use-submit"]');
  expect(submit, 'the Continue button should be rendered').not.toBeNull();
  submit!.click();
  await settle();
}

describe('TermsOfUseGate — the tracking opt-out', () => {
  it('offers the box unticked and writes granted on acceptance when no choice is stored', async () => {
    const target = render();

    const optOut = optOutOf(target);
    expect(optOut, 'the opt-out should be rendered').not.toBeNull();
    expect(optOut!.checked).toBe(false);

    await acceptAndSubmit(target);

    expect(acceptTermsOfUse).toHaveBeenCalledTimes(1);
    expect(setDataConsent).toHaveBeenCalledTimes(1);
    expect(setDataConsent).toHaveBeenCalledWith('granted');
  });

  it('writes denied on acceptance when the box is ticked', async () => {
    const target = render();

    setChecked(optOutOf(target)!, true);
    await acceptAndSubmit(target);

    expect(setDataConsent).toHaveBeenCalledTimes(1);
    expect(setDataConsent).toHaveBeenCalledWith('denied');
  });

  it.each<ConsentStatus>(['granted', 'indetermined'])(
    'offers the box unticked when the stored choice is %s',
    (consent) => {
      box.gate = gateInput({ consent });

      expect(optOutOf(render())?.checked).toBe(false);
    }
  );

  it('offers the box ticked when this browser holds denied, so accepting writes denied again', async () => {
    box.gate = gateInput({ consent: 'denied' });
    const target = render();

    expect(optOutOf(target)?.checked).toBe(true);

    await acceptAndSubmit(target);

    expect(setDataConsent).toHaveBeenCalledTimes(1);
    expect(setDataConsent).toHaveBeenCalledWith('denied');
  });

  it.each([
    { name: 'trackEvents is off', input: () => gateInput({ trackEvents: false }) },
    { name: 'the consent mode is free', input: () => gateInput({ projection: { consentMode: 'free' } }) },
    { name: 'Global Privacy Control is set', input: () => gateInput({ globalPrivacyControl: true }) },
    { name: 'no provider is configured', input: () => gateInput({ projection: { active: false } }) }
  ])('shows no box and writes nothing on acceptance when $name', async ({ input }) => {
    box.gate = input();
    const target = render();

    expect(optOutOf(target)).toBeNull();

    await acceptAndSubmit(target);

    expect(acceptTermsOfUse).toHaveBeenCalledTimes(1);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(setDataConsent).not.toHaveBeenCalled();
  });

  it('writes nothing when the acceptance is not recorded', async () => {
    acceptTermsOfUse.mockResolvedValue({ type: 'failure' });
    const target = render();

    await acceptAndSubmit(target);

    expect(acceptTermsOfUse).toHaveBeenCalledTimes(1);
    expect(target.querySelector('[data-testid="tou-save-error"]')).not.toBeNull();
    expect(setDataConsent).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
  });

  it('writes the choice after the acceptance and before the load is rerun', async () => {
    const target = render();

    await acceptAndSubmit(target);

    expect(setDataConsent).toHaveBeenCalledTimes(1);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(acceptTermsOfUse.mock.invocationCallOrder[0]).toBeLessThan(setDataConsent.mock.invocationCallOrder[0]);
    expect(setDataConsent.mock.invocationCallOrder[0]).toBeLessThan(invalidateAll.mock.invocationCallOrder[0]);
  });
});
