import type { SvelteHTMLElements } from 'svelte/elements';

export type ModalContainerProps = SvelteHTMLElements['dialog'] & {
  /**
   * The title of the modal
   */
  title: string;
  /**
  /**
   * Optional id of the element to autofocus when the dialog has opened. Note that this must be a focusable element. By default, the first focusable descendant will be focused.
   */
  autofocusId?: string;
  /**
   * Whether to allow closing the modal by clicking outside of it. @default true
   */
  closeOnBackdropClick?: boolean;
  /**
   * Bind to this to get the modal's open state.
   */
  readonly isOpen?: boolean;

  /**
   * Bind to this to access the modal's close function.
   */
  readonly closeModal?: () => void;

  /**
   * Bind to this to access the modal's open function.
   */
  readonly openModal?: () => void;
};
