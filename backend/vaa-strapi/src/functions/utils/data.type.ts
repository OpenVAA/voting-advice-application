/**
 * The types here should match those used in the frontend.
 * TODO: Consider replacing this with type definition in the shared folder.
 */

export type LocalizedString = {
  [locale: string]: string;
};

export interface HasId {
  id: number | string;
}

export type QuestionTypeSettings =
  | {
      type: 'text';
      notLocalizable?: boolean;
    }
  | {
      type: 'boolean';
    }
  | {
      type: 'number';
      min?: number;
      max?: number;
    }
  | {
      type: 'photo';
    }
  | {
      type: 'date';
      dateType?: 'yearMonthDay' | 'yearMonth' | 'monthDay' | 'month' | 'weekday' | 'hourMinute';
      min?: Date;
      max?: Date;
    }
  | {
      type: 'link';
    }
  | {
      type: 'singleChoiceOrdinal';
      values: Array<Choice>;
      display?: 'vertical' | 'horizontal';
    }
  | {
      type: 'singleChoiceCategorical';
      values: Array<Choice>;
      display?: 'vertical' | 'horizontal';
    }
  | {
      type: 'multipleChoiceCategorical';
      values: Array<Choice>;
      display?: 'vertical' | 'horizontal';
      min?: number;
      max?: number;
    }
  | {
      type: 'preferenceOrder';
      values: Array<Choice>;
      min?: number;
      max?: number;
    };

export type Choice = {
  key: number;
  label: LocalizedString;
};

/**
 * The allowed `Answer` values for different `QuestionType`s based on their
 * `settings.type`.
 */
export type AnswerValue = {
  text: string | LocalizedString;
  boolean: boolean;
  number: number;
  photo: string;
  date: Date;
  singleChoiceOrdinal: Choice['key'];
  singleChoiceCategorical: Choice['key'];
  multipleChoiceCategorical: Array<Choice['key']>;
  preferenceOrder: Array<Choice['key']>;
};

export type EntityType = 'all' | 'candidate' | 'party';
