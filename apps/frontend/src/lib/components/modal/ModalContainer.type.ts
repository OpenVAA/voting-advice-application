import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type ModalContainerProps = SvelteHTMLElements['dialog'] & {
  /**
   * The content of the modal.
   */
  children?: Snippet;
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
   * Whether the modal is open. Use `bind:isOpen` to track this.
   */
  isOpen?: boolean;
  /**
   * Callback for when the modal closes. Note that the modal may still be transitioning to `hidden`.
   */
  onClose?: () => unknown;
  /**
   * Callback for when the modal opens. Note that the modal may still be transitioning from `hidden`.
   */
  onOpen?: () => unknown;
};
