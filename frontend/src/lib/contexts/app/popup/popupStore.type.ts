import type { Readable } from 'svelte/store';
import type { PopupComponent } from './popupComponent.type';

/**
 * A store that manages a queue of popup components and resolves to the first component in the queue.
 * The popups are displayed by the layout initiating `AppContext` one at a time.
 */
export type PopupStore = Readable<PopupComponent | undefined> & {
  /**
   * Push a new popup component to the queue.
   * @param component - A component exposing the `onClose` prop.
   */
  push: (component: PopupComponent) => void;
  /**
   * Remove the first popup component from the queue. Usually called internally when the popup is closed.
   */
  shift: () => void;
};
