import type { ComponentType, SvelteComponent } from 'svelte';

/**
 * A component that can be added to the popup queue.
 */
export type ModalComponent<TProps extends Record<string, unknown>> = ComponentType<SvelteComponent<TProps>>;

export interface ModalComponentProps extends Record<string, unknown> {
  /**
   * The callback to be invoked when the popup is closed. This will be used internally to remove the popup from the queue.
   */
  onClose?: () => void;
}
