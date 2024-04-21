import type {SvelteHTMLElements} from 'svelte/elements';

export type QuestionActionsProps = SvelteHTMLElements['div'] & {
  /**
   * Set to `true` if the question has already been answered. This controls which actions are shown. @default false
   */
  answered?: boolean | null;
  /**
   * Use to switch between looser and tighter layouts. @default 'default'
   */
  variant?: 'default' | 'tight' | 'icon';
  /**
   * Whether to separate `skip` and `next` actions both as events and button symbols. @default false
   */
  separateSkip?: boolean | null;
};
