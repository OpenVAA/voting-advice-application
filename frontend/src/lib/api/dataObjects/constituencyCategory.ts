/*
 * Contains both the data type and the final object class for a
 * constituency category.
 */

import type {HasId, RichText} from '../dataProvider.types';
import {Constituency} from './constituency';
import type {ConstituencyData} from './constituency';

export interface ConstituencyCategoryData extends HasId {
  name: string;
  shortName?: string;
  constituencies: ConstituencyData[];
  order?: number;
  info?: RichText;
}

export class ConstituencyCategory {
  constituencies: Constituency[] = [];

  constructor(public data: ConstituencyCategoryData) {
    this.initialize();
  }

  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.name ?? '';
  }

  get shortName() {
    return this.data.shortName ?? this.name;
  }

  get order() {
    return this.data.order ?? 0;
  }

  get info() {
    return this.data.info ?? '';
  }

  initialize(): void {
    if (this.data.constituencies?.length) {
      this.constituencies = this.data.constituencies.map((d) => new Constituency(d));
    }
  }

  // Here we will define more methods that can be used in the frontend.
}
