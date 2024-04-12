import type {CardProps} from '$lib/components/shared/card';
export type EntityCardProps = CardProps & {
  /**
   * A possibly ranked entity, e.g. candidate or a party.
   */
  content: MaybeRanked;
  /**
   * The context in which the card is used, affects layout. @default 'list'
   */
  context?: 'list' | 'details';
};
