import type { SvelteHTMLElements } from 'svelte/elements';
export type CategoryTagProps = SvelteHTMLElements['span'] & {
  /**
   * The QuestionCategory object
   */
  category: QuestionCategoryProps;
  /**
   * Whether to use an abbreviation or the full name. @default 'default'
   */
  variant?: 'default' | 'short';
};
