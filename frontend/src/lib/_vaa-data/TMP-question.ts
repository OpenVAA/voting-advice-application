/**
 * Temporary test for types.
 */

import type {DataAccessor, CanUpdate, NamedObjectData} from './internal';
import {NamedObject} from './internal';

interface QuestionData extends NamedObjectData {
  text: string;
}

export class Question extends NamedObject implements DataAccessor<QuestionData> {
  constructor(
    public data: QuestionData,
    public parent: CanUpdate
  ) {
    super(data, parent);
  }

  get name(): string {
    return this.data.name ?? this.text;
  }

  get text(): string {
    return this.data.text;
  }
}
