import type { Readable } from 'svelte/store';
import type { ModalComponent } from './modalComponent.type';

/**
 * A store that manages a stack of modal components and resolves to the top component in the stack.
 * The modals are displayed by the layout initiating `AppContext` one at a time.
 */
export type ModalStore = Readable<
  { component: ModalComponent<Record<string, unknown>>; props: Record<string, unknown> } | undefined
> & {
  /**
   * Push a new modal component to the stack.
   * @param component - A component exposing the `onClose` prop.
   */
  push: <TProps extends Record<string, unknown>>(component: ModalComponent<TProps>, props?: TProps) => void;

  /**
   * Remove the top modal component from the stack. Usually called internally when the modal is closed.
   */
  pop: () => void;
};
