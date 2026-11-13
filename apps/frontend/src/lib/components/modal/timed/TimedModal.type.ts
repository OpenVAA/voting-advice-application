import type { Snippet } from 'svelte';
import type { ModalProps } from '../Modal.type';

export type TimedModalProps = Omit<ModalProps, 'children' | 'actions'> & {
  /**
   * The content of the timed modal.
   */
  children?: Snippet;
  /**
   * The action buttons to display.
   */
  actions?: Snippet;
  /**
   * Logout timer duration in seconds. @default 30
   */
  timerDuration?: number;
  /**
   * Bind to this to get time left in seconds
   */
  timeLeft?: number;
  /**
   * Callback triggered when the count ends. The modal stays open until a promise it returns settles, and then closes if it is still open. Note that the `onClose` callback will be triggered after this.
   */
  onTimeout?: () => unknown;
};
