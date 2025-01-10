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
   * Submit the feedback or close the modal if it's already been submitted.
   */
  readonly submit?: () => Promise<void>;
  /**
   * Reset the form so that if the user opens it again, they can fill new feedback. You should call this when closing any modal containing the feedback.
   */
  readonly reset?: () => void;
};

/**
 * The status states of the feedback form.
 */
export type SendingStatus = 'default' | 'sending' | 'sent' | 'error';
