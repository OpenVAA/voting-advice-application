import type {SvelteHTMLElements} from 'svelte/elements';

export type ModalProps = SvelteHTMLElements['dialog'] & {
  /**
   * The title of the modal
   */
  title: string;
  /**
   * Optional id of the element to autofocus when the dialog has opened. Note that this must be a focusable element. By default, the first focusable descendant will be focused.
   */
  autofocusId?: string;
  /**
   * Optional classes to add to the dialog box itself. Note that the basic `class` property is applied to the `<dialog>` element, which is rarely needed.
   */
  boxClass?: string;
  /**
   * Whether to allow closing the modal by clicking outside of it. @default true
   */
  closeOnBackdropClick?: boolean;
  /**
   * Bind to this to get the modal's open state.
   */
  readonly isOpen?: boolean;
};
