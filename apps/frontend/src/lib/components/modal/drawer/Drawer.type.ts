import type { Snippet } from 'svelte';
import type { ModalContainerProps } from '../ModalContainer.type';

export type DrawerProps = Omit<ModalContainerProps, 'children'> & {
  /**
   * The content of the drawer.
   */
  children?: Snippet;
  /**
   * Whether to show the floating close button. @default true
   */
  showFloatingCloseButton?: boolean;
};
