import type { Snippet } from 'svelte';
import type { ModalContainerProps } from './ModalContainer.type';

export type ModalProps = Omit<ModalContainerProps, 'children'> & {
  /**
   * The content of the modal.
   */
  children?: Snippet;
  /**
   * The action buttons to display.
   */
  actions?: Snippet;
  /**
   * Optional classes to add to the dialog box itself. Note that the basic `class` property is applied to the `<dialog>` element, which is rarely needed.
   */
  boxClass?: string;
};
