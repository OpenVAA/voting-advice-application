/**
 * An action that adds an event handler that fires when a keyboard user's
 * focus moves out from the element or any of its descendants.
 *
 * Due to different browser behaviours, we have to do the detection in a
 * bit of a contrived manner:
 * - When the users moves the focus within the focusable elements of the
 *   container, the following events are fired: `keydown` (Tab),
 *   `focusout`, `focusin` and `keyup` (Tab).
 * - If the focus moves out of the container, only the first two are
 *   fired.
 * - We listen for the `keydown` (Tab) event and then set a timeout to
 *   check whether we have received focus, and if not, we assume the focus
 *   has left the container. We listen to `focusout` and `focusin` to
 *   track whether we have focus or not. (We cannot use
 *   `document.activeElement` because it's not reliable.)
 *
 * @param node The target element
 * @param callback The event handler to call
 *
 * @example `<Navigation on:keyboardFocusOut={closeDrawer} />`
 */
export function onKeyboardFocusOut(node: HTMLElement, callback: () => void) {
  let focused = false;
  function onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Tab') {
      setTimeout(() => {
        if (!focused) callback();
      }, 50);
    }
  }
  function onFocusOut() {
    return (focused = false);
  }
  function onFocusIn() {
    return (focused = true);
  }
  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('focusout', onFocusOut);
  node.addEventListener('focusin', onFocusIn);
  return {
    destroy: () => {
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('focusin', onFocusIn);
      node.removeEventListener('focusout', onFocusOut);
    }
  };
}
