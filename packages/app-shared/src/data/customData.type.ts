/**
 * Custom data properties for different `DataObject`s.
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
