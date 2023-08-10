/*
 * Contains both the data type and the final object class for a
 * question.
 *
 * TO DO: Figure out how to use this in combination with MatchableQuestion and
 * its subclasses from the matching algorithm
 *
 * Maybe add constituencyCategoryId as a filter as well
 */

import type {HasId, Id, RichText} from '../dataProvider.types';
import type {QuestionCategory} from './questionCategory';

export enum QuestionType {
  Text = 'Text',
  Likert4 = 'Likert4',
  Likert5 = 'Likert5',
  RankedOrder = 'RankedOrder'
}

export interface QuestionData extends HasId {
  text: RichText;
  type: QuestionType;
  shortName?: string;
  order?: number;
  info?: RichText;
  electionId?: Id;
  electionRound?: number[];
  constituencyId?: Id;
}

export class Question {
  constructor(public data: QuestionData, public category: QuestionCategory) {}

  get id() {
    return this.data.id;
  }

  get text() {
    return this.data.text ?? '';
  }

  get shortName() {
    return this.data.shortName ?? this.text;
  }

  get order() {
    return this.data.order ?? 0;
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

  get constituencyId() {
    return this.data.constituencyId ?? '';
  }

  // Here we will define more methods that can be used in the frontend.
}
