/*
 * Class for the templates used by TemplateQuestion
 */

import type {NonmissingValue} from '$lib/vaa-matching';
import type {HasId, RichText} from '../../data.types';
import {DataObject} from '../dataObject';
import type {DataRoot} from '../dataRoot';
import type {TemplateQuestionType} from './question';

/**
 * The data format for the question templates
 */
export interface QuestionTemplateData extends HasId {
  type: TemplateQuestionType;
  values: ValueWithLabel[];
}

export type ValueWithLabel = {
  key: NonmissingValue;
  label: RichText;
};

/**
 * The template used by TemplateQuestion
 */
export class QuestionTemplate extends DataObject {
  constructor(public data: QuestionTemplateData, public parent: DataRoot) {
    super(data, parent);
  }

  get type() {
    return this.data.type;
  }

  get values() {
    return this.data.values;
  }

  get length() {
    return this.values.length;
  }

  /**
   * @param key The value's key
   * @returns The label for the value having key.
   */
  getValueLabel(key: NonmissingValue) {
    // Use == here bc we might accidentally pass a string instead of a number for key
    return this.values.find((v) => v.key == key)?.label;
  }
}
