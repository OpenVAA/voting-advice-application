import type { ModalContainerProps } from './ModalContainer.type';

export type ModalProps = ModalContainerProps & {
  /**
   * Optional classes to add to the dialog box itself. Note that the basic `class` property is applied to the `<dialog>` element, which is rarely needed.
   */
  boxClass?: string;
};
