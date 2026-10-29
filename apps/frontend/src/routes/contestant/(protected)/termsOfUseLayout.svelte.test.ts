/**
 * The Contestant App's protected layout and the terms-of-use gate it renders, mounted for real against a fake context.
 *
 * What this file holds:
 *
 * 1. **A gated load renders the gate in place of the page.** The box starts unticked and Continue is disabled until it is ticked. The page is not rendered, and the layout provides nothing to the context and logs nothing.
 * 2. **A failed acceptance is shown and the form stays.** The user is told with the save-failed message, and the load is not rerun.
 * 3. **A recorded acceptance reruns the load, and nothing else advances the view.** `invalidateAll` is called once. The gate is still mounted afterwards, because the stubbed `invalidateAll` reruns no load: only load data without a gate removes it.
 * 4. **An ungated load renders the page and no gate.** The layout provides nothing to the context itself: applying the entity's data is the entity layout's, one level down.
 *
 * The assertions are on the DOM rather than on component state: what matters is what the user is shown.
 */

import { log } from '@openvaa/app-shared';
import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { acceptTermsOfUse, initUserData, invalidateAll, setDataRoot } = vi.hoisted(() => ({
  acceptTermsOfUse: vi.fn(),
  initUserData: vi.fn(),
  invalidateAll: vi.fn(),
  setDataRoot: vi.fn()
}));

vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    setDataRoot,
    logout: async () => undefined,
    acceptTermsOfUse,
    userData: { init: initUserData },
    // No analytics provider and trackEvents off: the terms show no usage-data section and the gate offers no opt-out.
    analyticsGate: {
      current: {
        projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
        globalPrivacyControl: false,
        trackEvents: false,
        consent: undefined
      }
    }
  })
}));

vi.mock('$lib/contexts/app', () => ({
  getAppContext: () => ({
    appSettings: { analytics: { trackEvents: false } },
    analyticsGate: {
      current: {
        projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
        globalPrivacyControl: false,
        trackEvents: false,
        consent: undefined
      }
    }
  })
}));

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
 * jsdom ships no `window.matchMedia`, and `svelte/motion` reads it at module-evaluation time to honour `prefers-reduced-motion`. The gate reaches the layout components through the `$layouts/main` barrel, which loads `Header.svelte` and therefore the logout button's `TimedModal` transitively, so without this the suite fails during import and never reaches an assertion. The stub answers "no preference", which is the browser default the components are authored against.
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

const USER = {
  id: 'user-1',
  email: 'user@example.test',
  username: 'user@example.test',
  role: 'contestant',
  passwordSet: true
};

/** Loader data for a user who must pass the terms-of-use gate: the gate and the user-level data, and no entity data. */
function gatedData() {
  return { gate: 'termsOfUse', user: { ...USER, termsOfUseAccepted: null } };
}

/** Loader data for a user past the gates. */
function ungatedData() {
  const user = { ...USER, termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00' };
  return {
    gate: null,
    user
  };
}

let teardown: Array<() => void> = [];
let logError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  acceptTermsOfUse.mockResolvedValue({ type: 'success' });
  invalidateAll.mockResolvedValue(undefined);
  logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

/** The page the layout renders below itself, as a marker element. */
const page = createRawSnippet(() => ({ render: () => '<div data-testid="page"></div>' }));

function render(data: object): HTMLElement {
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

function checkboxOf(target: HTMLElement): HTMLInputElement {
  const checkbox = target.querySelector<HTMLInputElement>('[data-testid="terms-checkbox"]');
  expect(checkbox, 'the terms checkbox should be rendered').not.toBeNull();
  return checkbox!;
}

function submitOf(target: HTMLElement): HTMLButtonElement {
  const submit = target.querySelector<HTMLButtonElement>('[data-testid="terms-of-use-submit"]');
  expect(submit, 'the Continue button should be rendered').not.toBeNull();
  return submit!;
}

/** Let the submit handler's awaited calls settle, then apply the state they wrote. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  flushSync();
}

/** Tick the acceptance checkbox and press Continue, as a user does. */
async function acceptAndSubmit(target: HTMLElement): Promise<void> {
  const checkbox = checkboxOf(target);
  checkbox.checked = true;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  checkbox.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();

  submitOf(target).click();
  await settle();
}

describe('contestant protected layout — a gated load', () => {
  it('renders the terms-of-use gate with the box unticked and Continue disabled until it is ticked', () => {
    const target = render(gatedData());

    const checkbox = checkboxOf(target);
    expect(checkbox.checked, 'the box must never be pre-ticked').toBe(false);
    expect(submitOf(target).disabled).toBe(true);

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    checkbox.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();

    expect(submitOf(target).disabled).toBe(false);
    expect(acceptTermsOfUse, 'ticking the box alone records nothing').not.toHaveBeenCalled();
  });

  it('renders no page, provides no data to the context and logs no error', () => {
    const target = render(gatedData());

    expect(target.querySelector('[data-testid="page"]')).toBeNull();
    expect(setDataRoot).not.toHaveBeenCalled();
    expect(initUserData).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });
});

describe('contestant protected layout — accepting the terms of use', () => {
  it('shows the save-failed message, keeps the form and does not rerun the load when the acceptance rejects', async () => {
    acceptTermsOfUse.mockRejectedValue(new Error('acceptTermsOfUse: permission denied'));
    const target = render(gatedData());

    await acceptAndSubmit(target);

    expect(acceptTermsOfUse).toHaveBeenCalledTimes(1);
    const alert = target.querySelector('[data-testid="tou-save-error"]');
    expect(alert, 'a failed acceptance must surface the save-failed message').not.toBeNull();
    expect(alert?.textContent?.trim()).toBe('contestantApp.error.saveFailed');
    expect(alert?.getAttribute('role')).toBe('alert');
    expect(target.querySelector('[data-testid="terms-of-use-submit"]')).not.toBeNull();
    expect(invalidateAll).not.toHaveBeenCalled();
  });

  it('treats a result that is not a success as a failure', async () => {
    acceptTermsOfUse.mockResolvedValue({ type: 'failure' });
    const target = render(gatedData());

    await acceptAndSubmit(target);

    expect(target.querySelector('[data-testid="tou-save-error"]')).not.toBeNull();
    expect(target.querySelector('[data-testid="terms-of-use-submit"]')).not.toBeNull();
    expect(invalidateAll).not.toHaveBeenCalled();
  });

  it('records the acceptance once, reruns the load once and shows no alert when the acceptance resolves', async () => {
    const target = render(gatedData());

    await acceptAndSubmit(target);

    expect(acceptTermsOfUse).toHaveBeenCalledTimes(1);
    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(acceptTermsOfUse.mock.invocationCallOrder[0]).toBeLessThan(invalidateAll.mock.invocationCallOrder[0]);
    expect(target.querySelector('[data-testid="tou-save-error"]')).toBeNull();
    expect(logError).not.toHaveBeenCalled();
  });

  it('keeps the gate until the load data changes: no local state advances past it', async () => {
    const target = render(gatedData());

    await acceptAndSubmit(target);

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(target.querySelector('[data-testid="terms-of-use-submit"]')).not.toBeNull();
  });

  it('keeps Continue loading until the rerun has finished', async () => {
    const rerun: { finish: () => void } = { finish: () => undefined };
    invalidateAll.mockReturnValue(
      new Promise<void>((resolve) => {
        rerun.finish = resolve;
      })
    );
    const target = render(gatedData());

    await acceptAndSubmit(target);

    expect(invalidateAll).toHaveBeenCalledTimes(1);
    expect(submitOf(target).disabled, 'Continue must stay busy while the load reruns').toBe(true);

    rerun.finish();
    await settle();

    expect(submitOf(target).disabled).toBe(false);
  });
});

describe('contestant protected layout — an ungated load', () => {
  it('renders the page and no gate, and provides nothing to the context itself', () => {
    const target = render(ungatedData());

    expect(target.querySelector('[data-testid="terms-of-use-submit"]')).toBeNull();
    expect(target.querySelector('[data-testid="terms-checkbox"]')).toBeNull();
    expect(target.querySelector('[data-testid="page"]')).not.toBeNull();
    expect(setDataRoot).not.toHaveBeenCalled();
    expect(initUserData).not.toHaveBeenCalled();
    expect(logError).not.toHaveBeenCalled();
  });
});
