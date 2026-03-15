import type { ModalContainerProps } from '../ModalContainer.type';

export type DrawerProps = ModalContainerProps & {
  /**
   * Whether to show the floating close button. @default true
   */
  showFloatingCloseButton?: boolean;
};
