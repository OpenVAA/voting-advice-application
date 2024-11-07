import type { Constituency, DataObjectData, Election, EntityType, FilterValue, Id } from '../../../internal';

export interface QuestionAndCategoryBaseData extends DataObjectData {
  // From HasId
  // - id: Id;
  //
  // From DataObjectData
  // - color?: Colors | null;
  // - image?: Image | null;
  // - name?: string;
  // - shortName?: string;
  // - info?: string;
  // - order?: number;
  // - customData?: object;
  // - subtype?: string;
  // - isGenerated?: boolean;
  //
  // From DataObjectData
  // - color?: Colors | null;
  // - image?: Image | null;
  // - name?: string;
  // - shortName?: string;

  /**
   * An optional filter value that contains the ids of elections for which this question or category should only be shown.
   */
  electionIds?: FilterValue<Id>;
  /**
   * An optional filter value that contains the numbers of the election rounds for which this question or category should only be shown.
   */
  electionRounds?: FilterValue<number>;
  /**
   * An optional filter value that contains the ids of constituencies for which this question or category should only be shown.
   */
  constituencyIds?: FilterValue<Id>;
  /**
   * An optional filter value that contains the entity types for which this question or category should only be shown.
   */
  entityTypes?: FilterValue<EntityType>;
}
/**
 * The targets passed to the filter for questions and question categories.
 */

export type FilterTargets = {
  elections?: FilterValue<Election>;
  electionRounds?: FilterValue<number>;
  entityTypes?: FilterValue<EntityType>;
  constituencies?: FilterValue<Constituency>;
};
