import { AnyNominationVariant, AnyQuestionVariant, QuestionCategory } from '@openvaa/data';

/**
 * Custom data properties for different `DataObject`s.
 * Be sure to update the mapping below when adding new custom data properties.
 */
export type CustomData = {
  Nomination: {
    unconfirmed?: boolean;
  };
  Question: {
    allowOpen?: boolean;
    /**
     * For `QuestionInput`. If `true`, translations cannot be entered.
     */
    disableMultilingual?: boolean;
    fillingInfo?: string;
    filterable?: boolean;
    /**
     * If `true`, the question will be hidden in the Voter App but still visible in the Candidate App. Default `false`.
     */
    hidden?: boolean;
    infoSections?: Array<QuestionInfoSection>;
    /**
     * If `true`, Candidates cannot edit the question. A locked question is never considered `required`. Has no effect on opinion questions. Default `false`.
     */
    locked?: boolean;
    /**
     * For `QuestionInput`. If `true` for a text input, a `textarea` will be used instead of a `text` input.
     */
    longText?: boolean;
    /**
     * For `QuestionInput`. If provided, will set the `maxlength` of text inputs.
     */
    maxlength?: number;
    required?: boolean;
    vertical?: boolean;
    video?: CustomVideoProps;
  };
  QuestionCategory: {
    emoji?: string;
    video?: CustomVideoProps;
  };
};

/**
 * The properties for defining generated question info in customData
 */
export type QuestionInfoSection = {
  title?: string;
  content?: string;
  visible?: boolean;
};

/**
 * The properties for defining video content in customData
 */
export interface CustomVideoProps {
  title: string;
  sources: Array<string>;
  captions: string;
  poster: string;
  aspectRatio: number;
  transcript?: string;
}

/**
 * Mapping between different `DataObject`s and their custom data properties.
 */
export type CustomDataMap<TData> = TData extends AnyNominationVariant
  ? CustomData['Nomination']
  : TData extends AnyQuestionVariant
    ? CustomData['Question']
    : TData extends QuestionCategory
      ? CustomData['QuestionCategory']
      : object;
