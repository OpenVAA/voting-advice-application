/*
 * Contains both the data type and the final object class for an
 * election.
 */

import type {HasId, Id} from '../dataProvider.types';
import type {ConstituencyCategory} from './constituencyCategory';

export interface ElectionData extends HasId {
  name: string;
  date: Date;
  constituencyCategoryIds: Id[];
  shortName?: string;
  round?: number;
}

export class Election {
  constituencyCategories: ConstituencyCategory[] = [];

  constructor(public data: ElectionData) {}

  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.name;
  }

  get shortName() {
    return this.data.shortName ?? this.name;
  }

  get date() {
    return this.data.date;
  }

  get round() {
    return this.data.round ?? 0;
  }

  get constituencyCategoryIds() {
    return this.data.constituencyCategoryIds;
  }

  /**
   * A utility method to supply ConstituencyCategory objects.
   *
   * @param constituencyCategories All availale which are then filtered
   */
  supplyConstituencyCategories(constituencyCategories: ConstituencyCategory[]) {
    this.constituencyCategories = constituencyCategories.filter((c) =>
      this.constituencyCategoryIds.includes(c.id)
    );
    if (this.constituencyCategories.length !== this.constituencyCategoryIds.length) {
      throw new Error('Not enough ConstituencyCategories supplied');
    }
  }

  // Here we will define more methods that can be used in the frontend.
}
