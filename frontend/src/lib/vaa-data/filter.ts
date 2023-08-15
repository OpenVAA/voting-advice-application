/*
 * A simple filter utility for DataObjects. Note that filter definitions
 * following this convention are used both for querying data from
 * DataProvider subclasses and in the collections of DataObjects created
 * from the raw data.
 */

import type {Id} from './data.types';
import type {DataObject, DataObjectData, EntityType} from './dataObjects';
import {isEmpty} from './utils';

export type Filterable = DataObject | DataObjectData | Record<string, unknown>;

/**
 * Used for queries when getting items from the data provider or the
 * data root.
 */
export type FilterValue<T> = T | CanonicalFilterValue<T>;
type CanonicalFilterValue<T> = T[];

/**
 * Filter definitions following this convention are used both for
 * querying data from DataProvider subclasses and in the collections of
 * DataObjects created from the raw data. Note that not all of the
 * filters may be applicable in all situations.
 */
export interface QueryFilter {
  locale?: FilterValue<string>;
  id?: FilterValue<Id>;
  // election?: FilterValue<Election>;
  electionId?: FilterValue<Id>;
  electionRound?: FilterValue<number>;
  nominationId?: FilterValue<Id>;
  entityType?: FilterValue<EntityType>;
  // constituency?: FilterValue<Constituency>;
  constituencyId?: FilterValue<Id>;
  questionCategoryId?: FilterValue<Id>;
  allianceIds?: FilterValue<Id>;
  factionIds?: FilterValue<Id>;
  organizationIds?: FilterValue<Id>;
  personIds?: FilterValue<Id>;
  allianceNominationIds?: FilterValue<Id>;
  factionNominationIds?: FilterValue<Id>;
  organizationNominationIds?: FilterValue<Id>;
  personNominationIds?: FilterValue<Id>;
}

/**
 * Apply a simple filter on the data. The filter contains key-
 * value pairs where the key is the name of the property to match in data and the value
 * is a single value or an array of values to match. If the value is empty, the filter
 * has no effect.
 *
 * NB. The filter only works naïvely on properties of items themselves. Thus, if,
 * for example, filtering ConstituencyCategoryData by electionId it will normally not
 * be affected because the electionId is implicitly set by their ancestor Election.
 *
 * TO DO: Enable multiple values for item[key], such as constituencyId: ['a', 'b']
 *        Or includedConstituencyIds: ['a', 'b'] and excludedConstituencyIds: ['c', 'd']
 *        See README for more details
 *
 * @param items The objects or data to filter
 * @param filter Object containing keys with single of lists of values to match in data
 * @returns Filtered data
 */
export function filterItems<T extends Filterable>(items: T[], filter: QueryFilter): T[] {
  for (const [key, value] of Object.entries(filter)) {
    if (!isEmpty(value)) {
      const values = harmonize(value);
      items = items.filter((item) => {
        if (!(key in item)) {
          // The item's own id must match. The other filters are treated
          // as not applicable when the key is not present.
          return key === 'id' ? false : true;
        }
        const itVal = item[key as keyof T];
        // Empty key is treated as a match
        if (isEmpty(itVal)) {
          return true;
        }
        // There item's value might be a singleton or an array
        for (const v of harmonize(itVal)) {
          if (values.includes(v)) {
            return true;
          }
        }
        // No matches
        return false;
      });
    }
  }
  return items;
}

/** A utility for making sure filter values are of an exaxt type */
function harmonize<T>(value: FilterValue<T>): CanonicalFilterValue<T> {
  return Array.isArray(value) ? value : [value];
}

/**
 * A utility to combine FilterValues from a hierarchy of items. This
 * function should always be used when combining the filters because
 * the logic may change later.
 * @param values The FilterValues in descending hierarchical order,
 * e.g. [parent.constituencyId, child.constituencyId].
 * @returns The combined FilterValue that can be passed to filterItems
 * in place of child items.
 */
export function combineFilterValues<T>(values: FilterValue<T>[]): CanonicalFilterValue<T> {
  // With the current filter definitions, the result is the intersection
  // of the filter values. Later, if we allow for in- and notIn-types of
  // filters, this may well change.
  return values.map((v) => harmonize(v)).reduce((a, b) => a.filter((c) => b.includes(c)));
}
