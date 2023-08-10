/*
 * Contains both the data type and the final object class for a
 * constituency.
 */

import type {HasId} from '../dataProvider.types';

export interface ConstituencyData extends HasId {
  name: string;
  shortName?: string;
  order?: number;
  children?: ConstituencyData[];
}

export class Constituency {
  children: Constituency[] = [];

  constructor(public data: ConstituencyData) {
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

  initialize(): void {
    if (this.data.children?.length) {
      this.children = this.data.children.map((d) => new Constituency(d));
    }
  }

  // Here we will define more methods that can be used in the frontend.
}
