/**
 * `DataConsentPopup`, mounted against a fake app context, with its dialogs' `showModal` and `close` polyfilled.
 *
 * What this file holds: the prompt opens as a modal dialog on mount; every close without a choice (Escape, the close button, the backdrop, a close the platform makes) records `denied` once and then runs the caller's `onClose`; a choice made with the consent control records that choice alone; an Escape meant for the information dialog opened inside the prompt closes only that dialog; and a View Transition started while the prompt is open runs without names, while one started after it closed runs with them.
 *
 * Escape is pressed through `pressEscape` of `dialogPlatform.testUtils.ts`, which models the browser's own Escape handling. The browser itself is exercised by `tests/tests/specs/voter/voter-prefs-tracking.spec.ts`, in `the information dialog inside the consent prompt`.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { polyfillDialogs, pressEscape } from '$lib/components/modal/dialogPlatform.testUtils';
import { startViewTransition, VT_NO_NAMES_CLASS } from '$lib/utils/viewTransition';

const { context, route, setDataConsent } = vi.hoisted(() => {
  const route: { id: string | null } = { id: '/(voters)' };
  const setDataConsent = vi.fn();
  const context = {
    t: (key: string) => key,
    setDataConsent,
    userPreferences: {
      get current() {
        return {};
      }
    }
  };
  return { context, route, setDataConsent };
});

vi.mock('$app/state', () => ({ page: { route } }));
vi.mock('$lib/contexts/app', () => ({ getAppContext: () => context }));
vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

const DataConsentPopup = (await import('./DataConsentPopup.svelte')).default;

const TITLE = 'common.privacy.dataCollection.title';
const GRANTED = 'privacy.dataConsentLabel.granted';
const DENIED = 'privacy.dataConsentLabel.denied';
const INFO = 'privacy.dataConsentInfoButton';

let restoreDialogs: () => void;

beforeAll(() => {
  restoreDialogs = polyfillDialogs();
});

afterAll(() => restoreDialogs());

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  Reflect.deleteProperty(document, 'startViewTransition');
  document.documentElement.classList.remove(VT_NO_NAMES_CLASS);
  vi.clearAllMocks();
});

/** Mount the prompt and return its dialog, the caller's `onClose` and a lookup of a button by its text or its accessible label. */
function mountPrompt() {
  const onClose = vi.fn();
  const target = document.createElement('div');
  document.body.appendChild(target);
  const popup = mount(DataConsentPopup, { target, props: { onClose } });
  flushSync();
  teardown.push(() => {
    unmount(popup);
    target.remove();
  });
  const prompt = target.querySelector('dialog');
  if (!prompt) throw new Error('the prompt rendered no dialog');
  function button(text: string, scope: ParentNode = prompt!): HTMLButtonElement {
    const found = [...scope.querySelectorAll('button')].find(
      (b) => b.textContent?.includes(text) || b.getAttribute('aria-label') === text
    );
    if (!found) throw new Error(`no button with the text or label ${text}`);
    return found;
  }
  return { prompt, target, onClose, button };
}

/** Assert that one `denied` was recorded, before the caller's `onClose` ran once. */
function expectOneDeclineThenClose(onClose: ReturnType<typeof vi.fn>): void {
  expect(setDataConsent.mock.calls, 'one decline should be recorded').toEqual([['denied']]);
  expect(onClose, "the caller's onClose should run once").toHaveBeenCalledTimes(1);
  expect(setDataConsent.mock.invocationCallOrder[0]).toBeLessThan(onClose.mock.invocationCallOrder[0]);
}

describe('DataConsentPopup — a modal dialog', () => {
  it('opens on mount as the one open dialog, named by its title', () => {
    const { prompt, target } = mountPrompt();

    const open = target.querySelectorAll('dialog[open]');
    expect(open).toHaveLength(1);
    expect(open[0]).toBe(prompt);
    expect(prompt.getAttribute('aria-label')).toBe(TITLE);
    expect(setDataConsent).not.toHaveBeenCalled();
  });
});

describe('DataConsentPopup — every close without a choice declines', () => {
  it('Escape records `denied`, then runs onClose', () => {
    const { prompt, onClose } = mountPrompt();

    pressEscape();

    expect(prompt.hasAttribute('open')).toBe(false);
    expectOneDeclineThenClose(onClose);
  });

  it('the close button records `denied`, then runs onClose', () => {
    const { prompt, onClose } = mountPrompt();

    const closeButton = prompt.querySelector<HTMLButtonElement>(':scope > .modal-box > button.btn-circle');
    if (!closeButton) throw new Error('no close button in the prompt');
    closeButton.click();
    flushSync();

    expect(prompt.hasAttribute('open')).toBe(false);
    expectOneDeclineThenClose(onClose);
  });

  it('a click on the backdrop records `denied`, then runs onClose', () => {
    const { prompt, onClose } = mountPrompt();

    const backdrop = prompt.querySelector<HTMLButtonElement>(':scope > .modal-backdrop > button');
    if (!backdrop) throw new Error('no backdrop button in the prompt');
    backdrop.click();
    flushSync();

    expect(prompt.hasAttribute('open')).toBe(false);
    expectOneDeclineThenClose(onClose);
  });

  it('a close the platform makes records `denied`, then runs onClose', () => {
    const { prompt, onClose } = mountPrompt();

    prompt.removeAttribute('open');
    prompt.dispatchEvent(new Event('close'));
    flushSync();

    expectOneDeclineThenClose(onClose);
  });
});

describe('DataConsentPopup — a choice', () => {
  it('the grant button records `granted` once, and the close that follows adds nothing', () => {
    const { prompt, onClose, button } = mountPrompt();

    button(GRANTED).click();
    flushSync();

    expect(prompt.hasAttribute('open')).toBe(false);
    expect(setDataConsent.mock.calls).toEqual([['granted']]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('the decline button records `denied` once, and the close that follows adds nothing', () => {
    const { prompt, onClose, button } = mountPrompt();

    button(DENIED).click();
    flushSync();

    expect(prompt.hasAttribute('open')).toBe(false);
    expect(setDataConsent.mock.calls).toEqual([['denied']]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('DataConsentPopup — the information dialog inside it', () => {
  it('one Escape closes only the information dialog, and records nothing', () => {
    const { prompt, onClose, button } = mountPrompt();

    button(INFO).click();
    flushSync();
    const info = [...prompt.querySelectorAll('dialog')].find((d) => d !== prompt);
    expect(info?.hasAttribute('open'), 'the information dialog should be open').toBe(true);

    pressEscape();

    expect(info?.hasAttribute('open'), 'the information dialog should be closed').toBe(false);
    expect(prompt.hasAttribute('open'), 'the prompt should stay open').toBe(true);
    expect(setDataConsent).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('DataConsentPopup — View Transitions', () => {
  function stubTransition(): void {
    const start = vi.fn((callback: () => void) => {
      callback();
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn()
      };
    });
    Object.defineProperty(document, 'startViewTransition', { value: start, configurable: true });
  }

  async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  it('a transition started while the prompt is open runs without names, and one started after it closed runs with them', async () => {
    mountPrompt();
    stubTransition();
    const root = document.documentElement;

    startViewTransition(() => undefined);
    expect(root.classList.contains(VT_NO_NAMES_CLASS), 'the names should be stripped while the prompt is open').toBe(
      true
    );
    await settle();

    pressEscape();
    startViewTransition(() => undefined);
    expect(root.classList.contains(VT_NO_NAMES_CLASS), 'the names should be kept after the prompt closed').toBe(false);
    await settle();
    expect(root.classList.contains(VT_NO_NAMES_CLASS)).toBe(false);
  });
});
