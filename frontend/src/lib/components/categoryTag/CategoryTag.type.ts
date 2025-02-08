import type { QuestionCategory } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';
export type CategoryTagProps = SvelteHTMLElements['span'] & {
  /**
   * The `QuestionCategory` object
   */
  category: QuestionCategory;
  /**
   * Whether to use an abbreviation or the full name. @default 'full'
   */
  variant?: 'short' | 'full';
  /**
   * An optional suffix to add after the category name, e.g. '1/3'. @default undefined
   */
  suffix?: string;
};
