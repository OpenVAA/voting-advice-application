import type { SvelteHTMLElements } from 'svelte/elements';

export type QuestionActionsProps = SvelteHTMLElements['div'] & {
  /**
   * Set to `true` if the question has already been answered. This controls which actions are shown. @default false
   */
  answered?: boolean;
  /**
   * Whether to disable all the actions. @default false
   */
  disabled?: boolean;
  /**
   * Whether to disable the previous button. @default false
   */
  disablePrevious?: boolean;
  /**
   * Use to switch between looser and tighter layouts. @default 'default'
   */
  variant?: 'default' | 'tight' | 'icon';
  /**
   * Whether to separate `skip` and `next` actions both as events and button symbols. @default false
   */
  separateSkip?: boolean;
  /**
   * The text label for the `next` button. @default $t('questions.next') or $t('questions.skip')
   */
  nextLabel?: string;
  /**
   * The text label for the `previous` button. @default $t('questions.previous')
   */
  previousLabel?: string;
  /**
   * Triggered when the user has clicked on the delete answer button. This is only available if `answered` is `true`.
   */
  onDelete?: () => void;
  /**
   * Triggered when the user has clicked on the next button. This is only available if `answered` is `true` or `separateSkip` is `true`.
   */
  onNext?: () => void;
  /**
   * Triggered when the user has clicked on the previous button.
   */
  onPrevious?: () => void;
  /**
   * Triggered when user has clicked on the skip button. This is only available if `answered` is `false` and `separateSkip` is `true`.
   */
  onSkip?: () => void;
};
