import type { ModalProps } from '../Modal.type';

export type TimedModalProps = ModalProps & {
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
  onTimeout?: () => void;
};
