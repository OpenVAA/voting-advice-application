import type {CardProps} from '$lib/components/shared/card';
export type EntityCardProps = CardProps & {
  /**
   * The context in which the card is used, affects layout. @default 'list'
   */
  context?: 'list' | 'details';
} & (
    | {
        /**
         * If supplying a ranking, `entity` cannot be supplied.
         */
        entity?: never;
        /**
         * A ranked entity, i.e. a candidate or a party.
         */
        ranking: RankingProps<EntityProps>;
      }
    | {
        /**
         * A candidate or a party if no rankings are available.
         */
        entity: EntityProps;
        /**
         * If supplying an entity, `ranking` cannot be supplied.
         */
        ranking?: never;
      }
  );
