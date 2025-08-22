/**
 * These data types extend those defined by `@openvaa/data` and are shared between the frontend and backend.
 */

import type { Choice, Image, QUESTION_TYPE } from '@openvaa/data';
import type { LocalizedChoice, LocalizedString } from './localized.type';

/**
 * Allowed settings for different `QuestionType`s. These are converted into properties of the `@openvaa/data` `Question` objects.
 */
export type QuestionTypeSettings =
  | {
      type: typeof QUESTION_TYPE.Text;
      notLocalizable?: boolean;
    }
  | {
      type: typeof QUESTION_TYPE.Boolean;
    }
  | {
      type: typeof QUESTION_TYPE.Number;
      min?: number;
      max?: number;
    }
  | {
      type: typeof QUESTION_TYPE.Image;
    }
  | {
      type: typeof QUESTION_TYPE.Date;
      dateType?: QuestionSettingsDateType;
      min?: string;
      max?: string;
    }
  | {
      /** Link is an extended type, whic is treated the same way as a text question */
      type: 'link';
    }
  | {
      type: typeof QUESTION_TYPE.SingleChoiceOrdinal;
      choices: Array<LocalizedChoice>;
      display?: QuestionSettingsDisplayType;
    }
  | {
      type: typeof QUESTION_TYPE.SingleChoiceCategorical;
      choices: Array<LocalizedChoice>;
      display?: QuestionSettingsDisplayType;
    }
  | {
      type: typeof QUESTION_TYPE.MultipleChoiceCategorical;
      choices: Array<LocalizedChoice>;
      display?: QuestionSettingsDisplayType;
      min?: number;
      max?: number;
    };
// Not supported yet
// | {
//     type: typeof QUESTION_TYPE.PreferenceOrder;
//     choices: Array<LocalizedChoice>;
//     min?: number;
//     max?: number;
//   };

export type QuestionSettingsDateType = 'yearMonthDay' | 'yearMonth' | 'monthDay' | 'month' | 'weekday';

export type QuestionSettingsDisplayType = 'vertical' | 'horizontal';

/**
 * The allowed `Answer` choices for different `QuestionType`s based on their `settings.type`.
 */
export type AnswerValue = {
  [QUESTION_TYPE.Text]: string | LocalizedString;
  [QUESTION_TYPE.Boolean]: boolean;
  [QUESTION_TYPE.Number]: number;
  /** Link is an extended type, whic is treated the same way as a text question */
  link: string;
  [QUESTION_TYPE.Date]: Date;
  [QUESTION_TYPE.Image]: Image;
  [QUESTION_TYPE.SingleChoiceCategorical]: Choice['id'];
  [QUESTION_TYPE.SingleChoiceOrdinal]: Choice['id'];
  [QUESTION_TYPE.MultipleChoiceCategorical]: Array<Choice['id']>;
  // preferenceOrder: Array<Choice['id']>;
};
