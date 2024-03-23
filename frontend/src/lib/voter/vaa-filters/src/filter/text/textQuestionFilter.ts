import {type MaybeWrapped, type EntityWithAnswers} from '../../entity';
import {type TextQuestion} from '../../question';
import {TextFilter} from './textFilter';

/**
 * A filter for entities with a text question.
 */
export class TextQuestionFilter<T extends MaybeWrapped<EntityWithAnswers>> extends TextFilter<T> {
  declare readonly options: {question: TextQuestion; type: 'string'};

  constructor(question: TextQuestion) {
    super({question, type: 'string'});
  }
}
