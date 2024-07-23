export type InputFieldProps<TValue extends AnswerProps['value']> = {
  /**
   * The question that is to be answered.
   */
  question: QuestionProps;
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
  locked: boolean;
  /**
   * The answer to the question.
   */
  value?: TValue | null;

  previousValue?: TValue | null;

  onChange: (question: QuestionProps, value: TValue | null | undefined) => void;
};
