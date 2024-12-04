import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';

/**
 * Any filter in getData options.
 */
export type AnyFilter = FilterByConstituency & FilterByElection & FilterByEntityType & FilterById;

export type FilterById = {
  /**
   * The id of a single object to load.
   */
  id?: FilterValue<Id>;
};

export type FilterByElection = {
  /**
   * The id of the election to restrict results to.
   */
  electionId?: FilterValue<Id>;
};

export type FilterByConstituency = {
  /**
   * The id of the constituency to restrict results to.
   */
  constituencyId?: FilterValue<Id>;
};

export type FilterByEntityType = {
  /**
   * The type of the entity to restrict results to. NB. This cannot be an array.
   */
  entityType?: EntityType;
};

/**
 * A filter value passed to the getData methods can be a single value or an array of values.
 */
export type FilterValue<TType = string> = TType | Array<TType>;
