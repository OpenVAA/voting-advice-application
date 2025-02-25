import type { ComponentType, SvelteComponent } from 'svelte';

/**
 * A component that can be added to the modal stack.
 */
export type ModalComponent<TProps extends Record<string, unknown>> = ComponentType<SvelteComponent<TProps>>;

export interface ModalComponentProps extends Record<string, unknown> {
  /**
   * The callback to be invoked when the modal is closed. This will be used internally to remove the modal from the stack.
   */
  onClose?: () => void;
}
