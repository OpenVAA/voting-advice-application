/*
 * Class for template questions, which mainly use a predefined set of values.
 * These values are provided in a separate QuestionTemplateData object.
 */

import type {NonmissingValue} from '$lib/vaa-matching';
import type {Id} from '../../data.types';
import type {QuestionCategory} from '../questionCategory';
import {Question, type QuestionData} from './question';
import type {QuestionTemplate} from './questionTemplate';

/**
 * The data format for Questions that use templates
 */
export interface TemplateQuestionData extends QuestionData {
  templateId: Id;
}

export function isTemplateQuestionData(data: QuestionData): data is TemplateQuestionData {
  return 'templateId' in data;
}

/**
 * A question. It must be contained within one and only one QuestionCategory.
 */
export class TemplateQuestion extends Question {
  constructor(
    public data: TemplateQuestionData,
    public parent: QuestionCategory,
    public template: QuestionTemplate
  ) {
    super(data, parent);
  }

  get type() {
    return this.template.type;
  }

  get values() {
    return this.template.values;
  }

  get length() {
    return this.values.length;
  }

  /**
   * @param key The value's key
   * @returns The label for the value having key.
   */
  getValueLabel(key: NonmissingValue) {
    return this.values[key].label;
  }
}
