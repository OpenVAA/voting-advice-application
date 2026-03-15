import type { SvelteHTMLElements } from 'svelte/elements';

export type ModalContainerProps = SvelteHTMLElements['dialog'] & {
  /**
   * The title of the modal
   */
  title: string;
  /**
   * Optional id of the element to autofocus when the dialog has opened. Note that this must be a focusable element. By default, the first focusable descendant will be focused. Set to `false` to entirely disable autofocus.
   */
  autofocusId?: string | false;
  /**
   * Whether to allow closing the modal by clicking outside of it. @default true
   */
  closeOnBackdropClick?: boolean;
  /**
   * Bind to this to get the modal's open state.
   */
  readonly isOpen?: boolean;
  /**
   * Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
   */
  onClose?: () => unknown;
  /**
   * Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.
   */
  onOpen?: () => unknown;
  /**
   * Bind to this to access the modal's close function.
   * @param noCallbacks - Set to `true` to prevent any callbacks from being triggered when opening or closing the modal.
   */
  readonly closeModal?: (noCallbacks?: boolean) => void;
  /**
   * Bind to this to access the modal's open function.
   * @param noCallbacks - Set to `true` to prevent any callbacks from being triggered when opening or closing the modal.
   */
  readonly openModal?: (noCallbacks?: boolean) => void;
};
