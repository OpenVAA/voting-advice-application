import {type MaybeWrapped, type EntityWithAnswers} from '../../entity';
import {type NumericQuestion} from '../../question';
import {NumericFilter} from './numericFilter';

/**
 * A filter for numeric questions.
 */
export class NumericQuestionFilter<
  T extends MaybeWrapped<EntityWithAnswers>
> extends NumericFilter<T> {
  declare readonly options: {question: NumericQuestion; type: 'number'};

  constructor(question: NumericQuestion) {
    super({question, type: 'number'});
  }
}
