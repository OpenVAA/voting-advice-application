import type { ButtonProps } from '$lib/components/button';
import type { ConfirmationModalProps } from '$lib/components/modal/confirmation';

export type ButtonWithConfirmationProps = Omit<ButtonProps, 'href' | 'on:click'> &
  Pick<ConfirmationModalProps, 'onCancel' | 'onConfirm' | 'cancelLabel' | 'confirmLabel'> & {
    /**
     * The title of the confirmation modal.
     */
    modalTitle: string;
  };
