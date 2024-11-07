import type { TextFilter } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

export type TextEntityFilterProps = SvelteHTMLElements['form'] & {
  /**
   * The text filter object.
   */
  filter: TextFilter<MaybeRanked>;
  /**
   * The placeholder text. @default $t('components.entityFilters.text.placeholder')
   */
  placeholder?: string;
  /**
   * The styling variant for the text field. @default 'default'
   */
  variant?: 'default' | 'discrete';
};
