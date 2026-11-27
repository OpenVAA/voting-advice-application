/**
 * `ModalContainer`, mounted for real, with its `<dialog>`'s `showModal` and `close` polyfilled.
 *
 * What this file holds: how a `close` event of the dialog reaches `onClose`. A close the platform makes arrives with no `keydown`, and the component closes as it does for any other close. A `close` event that follows the component's own close adds nothing, and one that arrives after the dialog was opened again closes nothing.
 *
 * And what `holdOpen` refuses: while it is up, neither Escape, nor the dialog's `cancel` event, nor a close the platform forces closes the modal, while `closeModal()` still does, and the backdrop's close button is `aria-disabled`.
 *
 * And which modal an Escape closes when one is open inside another: only the inner one, while the outer stays open and runs no `onClose` until the next Escape; and that a modal which takes an Escape cancels its default action.
 *
 * Escape is pressed through `pressEscape` of `dialogPlatform.testUtils.ts`, which models the browser's own Escape handling. The browser itself is exercised by `tests/tests/specs/voter/voter-prefs-tracking.spec.ts`, in `the information dialog inside the consent prompt`.
 */

import { createRawSnippet, flushSync, mount, unmount } from 'svelte';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { polyfillDialogs, pressEscape } from './dialogPlatform.testUtils';
import type { Snippet } from 'svelte';

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key })
}));

const ModalContainer = (await import('./ModalContainer.svelte')).default;

let restoreDialogs: () => void;

beforeAll(() => {
  restoreDialogs = polyfillDialogs();
});

afterAll(() => restoreDialogs());

let teardown: Array<() => void> = [];

afterEach(() => {
  for (const fn of teardown.reverse()) fn();
  teardown = [];
});

/**
 * Mount the modal, open it, and return what a case drives it through.
 *
 * @param holdOpen - The modal's `holdOpen` at mount. The returned `props` changes it afterwards.
 * @param children - The modal's content.
 */
function mountOpen(holdOpen?: boolean, children?: Snippet) {
  const onClose = vi.fn();
  const target = document.createElement('div');
  document.body.appendChild(target);
  const props = $state({ title: 'The title', onClose, holdOpen, children });
  const modal = mount(ModalContainer, { target, props });
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
  return { modal, dialog: dialog!, onClose, props };
}

/** Fire the dialog's `close` event, as the platform does once a close has happened. */
function fireClose(dialog: HTMLDialogElement): void {
  dialog.dispatchEvent(new Event('close'));
  flushSync();
}

describe('ModalContainer — a close event of the dialog', () => {
  it('a close the platform makes, with no keydown, runs `onClose` once and leaves the modal closed', () => {
    const { dialog, onClose } = mountOpen();

    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('cancel'));
    fireClose(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog.hasAttribute('open')).toBe(false);

    dialog.dispatchEvent(new Event('transitionend'));
    flushSync();
    expect(dialog.classList.contains('hidden')).toBe(true);
  });

  it('a close event that follows `closeModal` adds nothing', () => {
    const { modal, dialog, onClose } = mountOpen();

    modal.closeModal();
    flushSync();
    fireClose(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a close event that follows Escape adds nothing', () => {
    const { dialog, onClose } = mountOpen();

    pressEscape();
    fireClose(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a close event that arrives after the dialog was opened again closes nothing', () => {
    const { modal, dialog, onClose } = mountOpen();

    modal.closeModal();
    modal.openModal();
    flushSync();
    fireClose(dialog);

    expect(dialog.hasAttribute('open')).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ModalContainer — held open', () => {
  it('Escape neither closes the modal nor runs `onClose`', () => {
    const { dialog, onClose } = mountOpen(true);

    pressEscape();

    expect(dialog.hasAttribute('open')).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("the dialog's `cancel` event is prevented", () => {
    const { dialog, onClose } = mountOpen(true);

    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    flushSync();

    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a close the platform forces leaves the dialog open again, with no `onClose`', () => {
    const { dialog, onClose } = mountOpen(true);

    dialog.removeAttribute('open');
    fireClose(dialog);

    expect(dialog.hasAttribute('open')).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('`closeModal` closes the modal and runs `onClose`', () => {
    const { modal, dialog, onClose } = mountOpen(true);

    modal.closeModal();
    flushSync();
    fireClose(dialog);

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("the backdrop's close button reads as unavailable while held, and as available once the hold is lifted", () => {
    const { dialog, props } = mountOpen(true);
    const backdropClose = dialog.querySelector('.modal-backdrop button');

    expect(backdropClose?.getAttribute('aria-disabled')).toBe('true');

    props.holdOpen = false;
    flushSync();

    expect(backdropClose?.hasAttribute('aria-disabled')).toBe(false);
  });

  it('once the hold is lifted, Escape closes the modal and runs `onClose`', () => {
    const { dialog, onClose, props } = mountOpen(true);

    pressEscape();
    props.holdOpen = false;
    flushSync();
    pressEscape();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ModalContainer — a modal open inside another', () => {
  it('Escape closes only the inner modal, and the next Escape closes the outer', () => {
    const innerOnClose = vi.fn();
    let inner: ReturnType<typeof mount> | undefined;
    const children = createRawSnippet(() => ({
      render: () => '<div class="modal-box"></div>',
      setup: (box: Element) => {
        inner = mount(ModalContainer, { target: box, props: { title: 'The inner title', onClose: innerOnClose } });
        return () => unmount(inner!);
      }
    }));
    const { dialog, onClose } = mountOpen(false, children);
    expect(inner, 'the inner modal should be mounted').toBeDefined();
    inner!.openModal();
    flushSync();
    const innerDialog = dialog.querySelector('dialog');
    expect(innerDialog?.hasAttribute('open'), 'the inner dialog should be open').toBe(true);

    pressEscape();

    expect(onClose, 'the outer `onClose` should not have run').not.toHaveBeenCalled();
    expect(dialog.hasAttribute('open'), 'the outer dialog should still be open').toBe(true);
    expect(innerDialog!.hasAttribute('open'), 'the inner dialog should be closed').toBe(false);
    expect(innerOnClose).toHaveBeenCalledTimes(1);

    pressEscape();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels the default action of an Escape it takes, so the browser closes no other dialog', () => {
    const { dialog, onClose } = mountOpen();

    const keydown = pressEscape();

    expect(keydown.defaultPrevented, 'the Escape should have its default action cancelled').toBe(true);
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ModalContainer — not held open', () => {
  it("the dialog's `cancel` event is not prevented", () => {
    const { dialog } = mountOpen();

    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    flushSync();

    expect(cancel.defaultPrevented).toBe(false);
  });
});
