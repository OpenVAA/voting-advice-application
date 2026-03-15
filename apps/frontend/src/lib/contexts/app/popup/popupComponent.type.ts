import type { ComponentType, SvelteComponent } from 'svelte';

/**
 * An item that can be added to the popup queue.
 */
export type PopupQueueItem = {
  /**
   * The component to be displayed in the popup.
   */
  component: PopupComponent;
  /**
   * Optional props to be passed to the component when it is rendered.
   */
  props?: PopupComponentProps;
};

/**
 * A component that can be added to the popup queue.
 */
export type PopupComponent = ComponentType<SvelteComponent<PopupComponentProps>>;

export interface PopupComponentProps extends Record<string, unknown> {
  /**
   * The callback to be invoked when the popup is closed. This will be used internally to remove the popup from the queue.
   */
  onClose?: () => void;
}
