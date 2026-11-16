/**
 * `TimedModal`, mounted for real, with its `<dialog>`'s `showModal` and `close` polyfilled and the timers and the clock faked: what the end of its count does with an `onTimeout` that has not settled, and how the count follows the wall clock when its timers do not run.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key })
}));

// jsdom has no `window.matchMedia`, and `svelte/motion` reads it when the modal is imported. The stub answers "no preference".
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

const TimedModal = (await import('./TimedModal.svelte')).default;

/** The count's length in seconds. */
const DURATION = 1;

/** How far the clock is moved to pass the count's end, in milliseconds. */
const PAST_THE_COUNT_MS = DURATION * 1000 + 100;

const proto = HTMLDialogElement.prototype as HTMLDialogElement & Record<string, unknown>;
const original = { showModal: proto.showModal, close: proto.close };

beforeAll(() => {
  // jsdom implements neither method.
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

afterAll(() => {
  proto.showModal = original.showModal;
  proto.close = original.close;
});

let teardown: Array<() => void> = [];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
  vi.useRealTimers();
});

/**
 * Mount the modal with a count of {@link DURATION} seconds, open it, and return what a case drives it through.
 *
 * @param onTimeout - The modal's `onTimeout`.
 */
function mountOpen(onTimeout: () => unknown) {
  const onClose = vi.fn();
  const target = document.createElement('div');
  document.body.appendChild(target);
  const modal = mount(TimedModal, {
    target,
    props: { title: 'The title', timerDuration: DURATION, onClose, onTimeout }
  });
  flushSync();
  teardown.push(() => {
    unmount(modal);
    target.remove();
  });
  modal.openModal();
  flushSync();
  const dialog = target.querySelector('dialog');
  expect(dialog, 'the dialog should be rendered').not.toBeNull();
  expect(dialog!.hasAttribute('open'), 'the dialog should be open').toBe(true);
  return { modal, dialog: dialog!, onClose };
}

/** Move the wall clock past the count's end with no timer run, as a document that was frozen or asleep finds it on its return. */
function movePastTheCountWithNoTimer(): void {
  vi.setSystemTime(Date.now() + PAST_THE_COUNT_MS);
}

/** The ways a document tells that it is back: shown, restored from the back-forward cache, focused or resumed. */
const RETURNS: Array<[string, () => void]> = [
  ['shown again', () => document.dispatchEvent(new Event('visibilitychange'))],
  ['restored from the back-forward cache', () => window.dispatchEvent(new Event('pageshow'))],
  ['focused again', () => window.dispatchEvent(new Event('focus'))],
  ['resumed', () => document.dispatchEvent(new Event('resume'))]
];

/** Let the work an event leaves behind run, with no timer fired. */
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  flushSync();
}

/** Run the timers past the count's end, and the work they leave behind. */
async function passTheCount(): Promise<void> {
  await vi.advanceTimersByTimeAsync(PAST_THE_COUNT_MS);
  flushSync();
}

describe("TimedModal — the count's end", () => {
  it('with an `onTimeout` still pending, the modal stays open until it settles, then closes, and `onTimeout` runs once', async () => {
    let settle!: () => void;
    const onTimeout = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)));
    const { dialog, onClose } = mountOpen(onTimeout);

    await passTheCount();

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(onClose).not.toHaveBeenCalled();

    settle();
    await vi.advanceTimersByTimeAsync(0);
    flushSync();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('closed by its own `onTimeout` before that settles, the modal is not closed again', async () => {
    const opened: { modal?: { closeModal: () => void } } = {};
    const onTimeout = vi.fn(async () => {
      opened.modal?.closeModal();
    });
    const { modal, dialog, onClose } = mountOpen(onTimeout);
    opened.modal = modal;

    await passTheCount();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('with an `onTimeout` that returns nothing, the modal closes at the count’s end', async () => {
    const onTimeout = vi.fn();
    const { dialog, onClose } = mountOpen(onTimeout);

    await passTheCount();

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('TimedModal — the count follows the wall clock', () => {
  beforeEach(() => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(RETURNS)(
    'with the wall clock past the count and no timer run, a document %s ends the count, once',
    async (_name, signalReturn) => {
      const onTimeout = vi.fn();
      const { dialog, onClose } = mountOpen(onTimeout);

      movePastTheCountWithNoTimer();
      signalReturn();
      await settle();
      signalReturn();
      for (const [, other] of RETURNS) other();
      await settle();

      expect(onTimeout).toHaveBeenCalledTimes(1);
      expect(dialog.hasAttribute('open')).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  );

  it('a document shown again before the count’s end ends nothing', async () => {
    const onTimeout = vi.fn();
    const { dialog } = mountOpen(onTimeout);

    for (const [, signalReturn] of RETURNS) signalReturn();
    await settle();

    expect(onTimeout).not.toHaveBeenCalled();
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('a document that is hidden ends nothing, even past the count’s end', async () => {
    const onTimeout = vi.fn();
    mountOpen(onTimeout);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    movePastTheCountWithNoTimer();
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('the check that runs every second ends the count once its time has come', async () => {
    const onTimeout = vi.fn();
    const { dialog } = mountOpen(onTimeout);

    await vi.advanceTimersByTimeAsync(DURATION * 1000 - 1);
    flushSync();
    expect(onTimeout).not.toHaveBeenCalled();

    await passTheCount();
    await passTheCount();

    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('closed before the count’s end, the modal ends nothing later', async () => {
    const onTimeout = vi.fn();
    const { modal, onClose } = mountOpen(onTimeout);

    modal.closeModal();
    flushSync();
    expect(onClose).toHaveBeenCalledTimes(1);

    movePastTheCountWithNoTimer();
    for (const [, signalReturn] of RETURNS) signalReturn();
    await passTheCount();

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
