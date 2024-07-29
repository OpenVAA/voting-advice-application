export type InputFieldProps<TValue extends AnswerProps['value']> = {
  /**
   * The question that is to be answered.
   */
  questionId: string;
  /**
   * The options for the question that is to be answered.
   */
  questionOptions?: Array<AnswerOption>;
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
   * The answer to the question.
   */
  value?: TValue | null;
  /**
   * The previous value of the question.
   */
  previousValue?: TValue | null;

  onChange: (details: {questionId: string; value: TValue | null | undefined}) => void;
};
