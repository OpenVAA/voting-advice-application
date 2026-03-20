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
   * Callback triggered right before the modal is closed due to a timeout. Note that the `onClose` callback will be triggered after this.
   */
  onTimeout?: () => unknown;
};
