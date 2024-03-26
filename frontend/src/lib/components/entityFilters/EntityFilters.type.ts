import type {SvelteHTMLElements} from 'svelte/elements';
import type {Filter} from '$voter/vaa-filters';

export type EntityFiltersProps = SvelteHTMLElements['div'] &
  (EntityFiltersPropsTemplate<CandidateProps> | EntityFiltersPropsTemplate<PartyProps>);

/**
 * The template ensures that both the targets and the filter have the same entity type.
 */
type EntityFiltersPropsTemplate<E extends EntityProps> = {
  /**
   * The filter objects to show.
   */
  filters: {
    title: string;
    filter: Filter<E | RankingProps<E>, unknown>;
  }[];
  /**
   *  The target entitiess of the filter objects. Note that these will only be used to get value options, not for actual filtering.
   */
  targets: Array<E | RankingProps<E>>;
};
