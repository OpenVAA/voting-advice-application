import type { Readable } from 'svelte/store';
import type { ModalComponent } from './modalComponent.type';

/**
 * A store that manages a stack of popup components and resolves to the top component in the stack.
 * The popups are displayed by the layout initiating `AppContext` one at a time.
 */
export type ModalStore = Readable<
  { component: ModalComponent<Record<string, unknown>>; props: Record<string, unknown> } | undefined
> & {
  /**
   * Push a new popup component to the stack.
   * @param component - A component exposing the `onClose` prop.
   */
  push: <T extends Record<string, unknown>>(component: ModalComponent<T>, props?: T) => void;

  /**
   * Remove the top popup component from the stack. Usually called internally when the popup is closed.
   */
  pop: () => void;
};
