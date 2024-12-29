import type { SvelteHTMLElements } from 'svelte/elements';
export type CategoryTagProps = SvelteHTMLElements['span'] & {
  /**
   * The QuestionCategory object
   */
  category: LegacyQuestionCategoryProps;
  /**
   * Whether to use an abbreviation or the full name. @default 'default'
   */
  variant?: 'default' | 'short';
};
