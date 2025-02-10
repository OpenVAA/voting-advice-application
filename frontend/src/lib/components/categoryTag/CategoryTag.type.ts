import type { QuestionCategory } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';
export type CategoryTagProps = SvelteHTMLElements['span'] & {
  /**
   * The `QuestionCategory` object
   */
  category: QuestionCategory;
  /**
   * Whether to use an abbreviation or the full name. @default 'default'
   */
  variant?: 'default' | 'short';
};
