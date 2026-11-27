/**
 * The modal dialogs open on the page, in the order they were shown, so that each modal component can tell whether it is the one in front.
 *
 * Every modal listens for Escape on `document`, and the order in which those listeners run is the order they were registered, not the order the dialogs stack in. A modal therefore takes an Escape only when `isTopmostDialog` names its own dialog. `ModalContainer` and `DrawerHost` push their dialog right after `showModal()` and remove it on every close path and on teardown.
 *
 * Client-only: the dialogs are pushed from `showModal()` call sites, which never run during SSR.
 */

/** The open modal dialogs, the topmost last. */
let stack: Array<HTMLDialogElement> = [];

/**
 * Record a dialog as the topmost open modal. A dialog already recorded moves to the top, as `showModal()` on it does in the browser's top layer.
 * @param dialog - The dialog just shown with `showModal()`.
 */
export function pushOpenDialog(dialog: HTMLDialogElement): void {
  stack = [...stack.filter((d) => d !== dialog), dialog];
}

/**
 * Forget a dialog that has closed or is being torn down. Removing one that is not recorded does nothing.
 * @param dialog - The dialog to remove.
 */
export function removeOpenDialog(dialog: HTMLDialogElement | undefined): void {
  if (!dialog) return;
  stack = stack.filter((d) => d !== dialog);
}

/**
 * Whether a dialog is the topmost open modal, the one an Escape belongs to.
 * @param dialog - The dialog to test.
 * @returns `true` when the dialog was the last recorded and is still recorded.
 */
export function isTopmostDialog(dialog: HTMLDialogElement | undefined): boolean {
  return !!dialog && stack[stack.length - 1] === dialog;
}
