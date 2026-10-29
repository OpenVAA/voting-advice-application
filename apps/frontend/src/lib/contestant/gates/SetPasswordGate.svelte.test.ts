/**
 * `SetPasswordGate`, mounted for real against a fake contestant context, for its Log Out button.
 *
 * What this file holds: a Log Out whose logout rejects is logged and gives the button back, as one that resolves does.
 */

import { log } from '@openvaa/app-shared';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { context, logout } = vi.hoisted(() => {
  const logout = vi.fn();
  const context = {
    t: (key: string) => key,
    logout,
    clearEntryFlow: () => undefined,
    setPassword: vi.fn(),
    user: undefined
  };
  return { context, logout };
});

vi.mock('$lib/contexts/contestant/contestantContext.svelte', () => ({ getContestantContext: () => context }));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: context.t, locale: 'en', locales: ['en'], darkMode: false })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
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

const SetPasswordGate = (await import('./SetPasswordGate.svelte')).default;

const LOGOUT = '[data-testid="set-password-logout"]';

let teardown: Array<() => void> = [];

beforeEach(() => {
  logout.mockResolvedValue(undefined);
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
  const component = mount(SetPasswordGate, { target, props: {} });
  flushSync();
  teardown.push(() => {
    unmount(component);
    target.remove();
  });
  return target;
}

/** Press Log Out, let the handler's awaited calls settle and apply the state they wrote. */
async function pressLogout(target: HTMLElement): Promise<HTMLButtonElement> {
  const button = target.querySelector<HTMLButtonElement>(LOGOUT);
  expect(button, 'the Log Out button should be rendered').not.toBeNull();
  button!.click();
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  flushSync();
  return target.querySelector<HTMLButtonElement>(LOGOUT)!;
}

describe('SetPasswordGate — Log Out', () => {
  it('logs out and gives the button back', async () => {
    const button = await pressLogout(render());

    expect(logout).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(false);
  });

  it('logs a failed Log Out and gives the button back', async () => {
    const logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    logout.mockRejectedValueOnce(new Error('navigation failed'));

    const button = await pressLogout(render());

    expect(logout).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(false);
  });
});
