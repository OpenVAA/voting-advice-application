import type {NumericQuestion, SingleChoiceQuestion, TextQuestion} from '../../question';

/**
 * These options define how to get the filterable value from the target entity.
 */
export type FilterOptions =
  | {
      /**
       * The property name to use for getting the value.
       */
      property: string;
      /**
       * Optional sub-property name to use for getting the value.
       * NB. We only allow a two-segment path or string keys, but this could be relaxed in the future.
       */
      subProperty?: string;
      /**
       * The data type of the values. They will be cast to this type.
       */
      type: 'string' | 'number' | 'boolean';
    }
  | {
      /**
       * The text question object to use for getting the value.
       */
      question: TextQuestion;
      /**
       * The data type of the values. They will be cast to this type.
       */
      type: 'string';
    }
  | {
      /**
       * The text question object to use for getting the value.
       */
      question: NumericQuestion;
      /**
       * The data type of the values. They will be cast to this type.
       */
      type: 'number';
    }
  | {
      /**
       * The text question object to use for getting the value.
       */
      question: SingleChoiceQuestion;
      /**
       * The data type of the values. They will be cast to this type.
       */
      type: 'string' | 'number' | 'boolean';
    };
