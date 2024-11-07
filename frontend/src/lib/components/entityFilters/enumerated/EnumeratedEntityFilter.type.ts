import type { ChoiceQuestionFilter,ObjectFilter } from '@openvaa/filters';
import type { SvelteHTMLElements } from 'svelte/elements';

export type EnumeratedEntityFilterProps = SvelteHTMLElements['form'] & {
  /**
   * The object filter object.
   */
  filter: ObjectFilter<MaybeRanked, PartyProps> | ChoiceQuestionFilter<MaybeRanked>;
  /**
   * The targets of the filter objects.
   */
  targets: Array<MaybeRanked>;
};
