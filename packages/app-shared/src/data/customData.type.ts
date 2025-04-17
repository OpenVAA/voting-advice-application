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
    infoSections?: Array<QuestionInfoSection>;
    terms?: Array<TermDefinition>;
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
  };
};

/**
 * The properties for defining generated question info in customData
 */
export type QuestionInfoSection = {
  title: string;
  content: string;
  visible: boolean;
};

/**
 * The properties for defining term definitions in customData
 */
export type TermDefinition = {
  /** The strings that trigger the popup. There may in theory be many different forms in the same question. */
  triggers?: Array<string>;

  /** Title of the term explanation (the term) */
  title?: string;

  /** Term explanation */
  content?: string;
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
