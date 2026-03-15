import type { ModalProps } from '../Modal.type';

export type ConfirmationModalProps = Omit<ModalProps, 'autofocusId' | 'closeOnBackdropClick' | 'onClose'> & {
  /**
   * The action to peform when the user confirms.
   */
  onConfirm: () => unknown;
  /**
   * The action to peform when the user cancels.
   */
  onCancel?: () => unknown;
  /**
   * Optional label for the confirm button. @default t('common.continue')
   */
  confirmLabel?: string;
  /**
   * Optional label for the cancel button. @default t('common.cancel')
   */
  cancelLabel?: string;
};
