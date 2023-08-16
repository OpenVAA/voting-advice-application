/*
 * Contains both the data type and the final object class for a
 * question.
 *
 * TO DO: Maybe add constituencyCategoryId as a filter as well
 */

import {combineFilterValues, type FilterValue} from '../../filter';
import type {Id, RichText} from '../../data.types';
import {NamedDataObject} from '../namedDataObject';
import type {NamedDataObjectData} from '../namedDataObject';
import type {QuestionCategory} from '../questionCategory';

/**
 * The types of questions that may be answered by Entities.
 * Note that subclasses of Question that handle these must be implemented.
 */
export enum QuestionType {
  Text = 'Text',
  // TO DO:
  // Number = 'Number',
  // TextList = 'TextList'
  Likert = 'Likert' // = Ordered choice
  // TO DO:
  // Enum = 'Enum',
  // EnumList = 'EnumList',
  // RankedOrder = 'RankedOrder'
}

export type SimpleQuestionType = QuestionType.Text;
export type TemplateQuestionType = QuestionType.Likert;

/**
 * The base interface for QuestionData. There are two types of
 * Questions: SimpleQuestion and TemplateQuestion, which expect
 * different types of data
 */
export interface QuestionData extends NamedDataObjectData {
  text: RichText;
  info?: RichText;
  electionId?: FilterValue<Id>;
  electionRound?: number[];
  constituencyId?: FilterValue<Id>;
}

/**
 * A question. It must be contained within one and only one QuestionCategory.
 */
export abstract class Question extends NamedDataObject {
  constructor(public data: QuestionData, public parent: QuestionCategory) {
    super(data, parent);
  }

  get text() {
    return this.data.text ?? '';
  }

  // We override this for convenience
  get name() {
    return this.data.name ?? this.text;
  }

  get info() {
    return this.data.info ?? '';
  }

  get electionId() {
    return this.data.electionId ?? '';
  }

  get electionRound() {
    return this.data.electionRound ?? 0;
  }

  // For filtering and convenience
  get questionCategoryId() {
    return this.parent.id;
  }

  // Here we combine the constituencyIds from this and the parent category
  // for easier filtering
  get constituencyId() {
    return combineFilterValues([this.parent.constituencyId, this.data.constituencyId ?? '']);
  }
}
