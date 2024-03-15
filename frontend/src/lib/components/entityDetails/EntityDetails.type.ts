import type {EntityCardProps} from '$lib/components/entityCard';

export type EntityDetailsProps = EntityCardProps & {
  /**
   * The list of Question objects to use for showing for on the basic (non-opinion) information tab.
   */
  infoQuestions: QuestionProps[];
  /**
   * The list of Question objects to use for showing for on the opinions tab.
   */
  opinionQuestions: QuestionProps[];
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
