/**
 * The `<dialog>` platform for the modal component tests in jsdom: a polyfill of `showModal` and `close`, which jsdom lacks, and an Escape press that the browser's own Escape handling follows.
 *
 * The polyfill records the order in which dialogs were opened, so that a press can find the topmost open dialog as a browser does.
 */

import { flushSync } from 'svelte';

/** The dialogs opened with `showModal`, the topmost last. */
let openOrder: Array<HTMLDialogElement> = [];

/**
 * Replace `HTMLDialogElement.prototype.showModal` and `close` with writes of the `open` attribute, recording the order in which dialogs are opened. A polyfilled `close()` fires no `close` event of its own.
 *
 * @returns A function that restores the original methods and forgets the recorded order.
 */
export function polyfillDialogs(): () => void {
  const proto = HTMLDialogElement.prototype;
  const original = { showModal: proto.showModal, close: proto.close };
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
    openOrder = [...openOrder.filter((dialog) => dialog !== this), this];
  };
  proto.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    openOrder = openOrder.filter((dialog) => dialog !== this);
  };
  return () => {
    proto.showModal = original.showModal;
    proto.close = original.close;
    openOrder = [];
  };
}

/**
 * Press Escape on the document, where the modals listen for it, and then do what a browser does with an Escape no listener cancelled: send a cancelable `cancel` to the topmost open dialog and, unless that is cancelled, close the dialog and fire its `close` event.
 *
 * Needs `polyfillDialogs`, whose recorded order names the topmost open dialog.
 *
 * @returns The `keydown` event, whose `defaultPrevented` tells whether a listener cancelled the browser's handling.
 */
export function pressEscape(): KeyboardEvent {
  const keydown = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  document.dispatchEvent(keydown);
  flushSync();
  if (!keydown.defaultPrevented) {
    const topmost = [...openOrder].reverse().find((dialog) => dialog.isConnected && dialog.hasAttribute('open'));
    if (topmost) {
      const cancel = new Event('cancel', { cancelable: true });
      topmost.dispatchEvent(cancel);
      if (!cancel.defaultPrevented) {
        topmost.close();
        topmost.dispatchEvent(new Event('close'));
      }
      flushSync();
    }
  }
  return keydown;
}
