import type { SvelteHTMLElements } from 'svelte/elements';

export type FeedbacProps = SvelteHTMLElements['form'] & {
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
};

/**
 * The status states of the feedback form.
 */
export type SendingStatus = 'default' | 'sending' | 'sent' | 'error';
