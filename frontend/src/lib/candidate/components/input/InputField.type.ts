export type InputFieldProps<TValue extends AnswerProps['value']> = {
  /**
   * The question that is to be answered.
   */
  questionId: string;
  /**
   * The answer options for a single or multiple choice input.
   */
  options?: Array<AnswerOption>;
  /**
   * Footer text to be displayed below the input field.
   */
  footerText?: string;
  /**
   * Header text to be displayed above the input field.
   */
  headerText?: string;
  /**
   * Boolean value indicating whether the input field is disabled.
   */
  locked?: boolean;
  /**
   * If `true`, a compact version of the input will be shown, such as `input type="text"` instead of a `textarea`. @default false
   */
  compact?: boolean;
  /**
   * The answer to the question.
   */
  value?: TValue | null;
  /**
   * The previous value of the question.
   */
  previousValue?: TValue | null;

  onChange: ((details: { questionId: string; value: TValue | null | undefined }) => void) | undefined;
};
