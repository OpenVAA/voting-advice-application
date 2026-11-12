import type { SvelteHTMLElements } from 'svelte/elements';

export type FeedbackProps = SvelteHTMLElements['form'] & {
  /**
   * Whether to show the standard action buttons below the feedback form. @default true
   */
  showActions?: boolean;
  /**
   * The layout variant of the feedback form. @default 'default'
   */
  variant?: 'default' | 'compact';
  /**
   * Bind to this to know whether the feedback can be submitted, i.e. the user has entered something. @default false
   */
  readonly canSubmit?: boolean;
  /**
   * Bind to this to access the status of the feedback form. @default 'default'
   */
  readonly status?: SendingStatus;
  /**
   * Callback fired when the user clicks the cancel button or after submitting/error, indicating that the form should close.
   */
  onCancel?: () => void;
  /**
   * Callback fired when there is an error sending the feedback.
   */
  onError?: () => void;
  /**
   * Callback fired when the feedback is successfully sent.
   */
  onSent?: () => void;
};

/**
 * The status states of the feedback form.
 */
export type SendingStatus = 'default' | 'sending' | 'sent' | 'error';
