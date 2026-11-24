import type { Snippet } from 'svelte';
import type { ButtonProps } from '$lib/components/button';
import type { ConfirmationModalProps } from '$lib/components/modal/confirmation';

export type ButtonWithConfirmationProps = Omit<ButtonProps, 'href' | 'on:click'> &
  Pick<ConfirmationModalProps, 'onCancel' | 'onConfirm' | 'cancelLabel' | 'confirmLabel'> & {
    /**
     * The question the confirmation asks: the title of the confirmation modal, or the prompt shown in place of the button when `confirmationType` is `inline`.
     */
    modalTitle: string;
    /**
     * The content of the confirmation modal, or what the inline prompt shows under its question.
     */
    children?: Snippet;
    /**
     * Whether the confirmation is asked in a modal dialog or inline, in place of the button. @default 'dialog'
     */
    confirmationType?: 'dialog' | 'inline';
    /**
     * Whether the inline prompt is shown in place of the button. Bind it to change what surrounds the button while the question is asked. Not used with `confirmationType='dialog'`. @default false
     */
    open?: boolean;
  };
