/*
 * Contains an abstract base class for getting the necessary data.
 * Agnostic to specific database or API calls.
 *
 * TO DO: Possibly remove some calls and include ConstiuencyCats in
 * the Elections and Questions in QuestionCategories but allow
 * filtering, which can be implemented by the provider or in its
 * underlying external API call.
 *
 * TO DO: Figure out whether this should actually be an interface.
 * The case for a base class is that, we might want to implement some
 * utility methods already in the base class.
 *
 * TO DO: Add sorting by order and by name and apply it automatically
 * to the results. Also expose it so that it can be used elsewhere.
 */

import type {AppLabels, Id} from './dataProvider.types';
import type {ElectionData} from './dataObjects/election';
import type {ConstituencyCategoryData} from './dataObjects/constituencyCategory';
import type {QuestionCategoryData} from './dataObjects/questionCategory';
import type {QuestionData} from './dataObjects/question';
import type {CandidateData} from './dataObjects/candidate';

export type IdFilterValue = Id | Id[];

export interface QueryFilter {
  id?: IdFilterValue;
}

export interface EntityQueryOptions extends QueryFilter {
  electionId?: IdFilterValue;
  constituencyId?: IdFilterValue;
}

export interface QuestionQueryFilter extends QueryFilter {
  constituencyId?: IdFilterValue;
}

// TO DO: Create default methods to handle filtering and caching if not
// handled by the derived class
export abstract class DataProvider {
  getAppLabels(): Promise<AppLabels> {
    throw new Error('Not Implemented');
  }

  getElectionsData(filter?: QueryFilter): Promise<ElectionData[]> {
    throw new Error('Not Implemented');
  }

  getConstituencyCategoriesData(filter?: QueryFilter): Promise<ConstituencyCategoryData[]> {
    throw new Error('Not Implemented');
  }

  getQuestionCategoriesData(filter?: QuestionQueryFilter): Promise<QuestionCategoryData[]> {
    throw new Error('Not Implemented');
  }

  getQuestionsData(filter?: QuestionQueryFilter): Promise<QuestionData[]> {
    throw new Error('Not Implemented');
  }

  getCandidatesData(options?: EntityQueryOptions): Promise<CandidateData[]> {
    throw new Error('Not Implemented');
  }

  /**
   * A utility class method to use a simple filter on the data. The filter contains key-
   * value pairs where the key is the name of the property to match in data and the value
   * is a single value or an array of values to match. If the value is empty, the filter
   * has no effect.
   *
   * TO DO: Separate from the class and move to utils (with a sorting utility as well).
   * TO DO: Make checking for a empty filter value more formal
   * TO DO: Enable multiple values for item[key], such as constituencyId: ['a', 'b']
   *        Or includedConstituencyIds: ['a', 'b'] and excludedConstituencyIds: ['c', 'd']
   * TO DO: Add support for lazy subobject loading
   *
   * @param filter Object containing keys with single of lists of values to match in data
   * @param data The data to filter
   * @returns Filtered data
   */
  static applyFilter<F extends QueryFilter, T extends Record<string, unknown>>(
    filter: F,
    data: T[]
  ): T[] {
    let filteredData = data;
    for (const [key, value] of Object.entries(filter)) {
      if (value != null && value != '' && value.length !== 0) {
        const values = Array.isArray(value) ? value : [value];
        filteredData = filteredData.filter(
          (item) =>
            item[key] == null ||
            item[key] != '' || // Empty key
            (key in item && values.includes(item[key])) // Matching key
        );
      }
    }
    return filteredData;
  }

  // These other entity getters should also be implemented.
  // getElectoralAlliancesData, getPoliticalOrganisationsData, getOrganisationFactionsData
}
