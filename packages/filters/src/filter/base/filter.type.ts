import type { FilterableQuestion } from '../../question';

/**
 * These options define how to get the filterable value from the target entity.
 */
export type FilterOptions = FilterOptionsBase & (PropertyFilterOptions | QuestionFilterOptions);

/**
 * The commonn option to both types of filters.
 */
export interface FilterOptionsBase {
  /**
   * The data type of the values. They will be cast to this type.
   */
  type: 'string' | 'number' | 'boolean';
  /**
   * Whether the entities may have multiple values for the filtered property.
   */
  multipleValues?: boolean;
  /**
   * Optional name for use when displaying the filter. Has no effect on it's functionality.
   */
  name?: string;
}

/**
 * Options for filters that get their value from an entity's property.
 */
export interface PropertyFilterOptions {
  /**
   * The property name to use for getting the value.
   */
  property: string;
  /**
   * Optional sub-property name to use for getting the value.
   * NB. We only allow a two-segment path or string keys, but this could be relaxed in the future.
   */
  subProperty?: string;
  /**
   * A question cannot be defined if property is defined.
   */
  question?: never;
}

/**
 * Options for filters that get their value from a question answered by the entity.
 */
export interface QuestionFilterOptions {
  /**
   * A property cannot be defined if question is defined.
   */
  property?: never;
  /**
   * A sub-property cannot be defined if question is defined.
   */
  subProperty?: never;
  /**
   * The text question object to use for getting the value.
   */
  question: FilterableQuestion;
}
