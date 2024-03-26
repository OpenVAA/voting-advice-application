import type {SvelteHTMLElements} from 'svelte/elements';
import type {ObjectFilter, ChoiceQuestionFilter} from '$voter/vaa-filters';

export type EnumeratedEntityFilterProps = SvelteHTMLElements['form'] & {
  /**
   * The object filter object.
   */
  filter:
    | ObjectFilter<EntityProps | RankingProps, PartyProps>
    | ChoiceQuestionFilter<EntityProps | RankingProps>;
  /**
   * The targets of the filter objects.
   */
  targets: Array<EntityProps | RankingProps>;
};
