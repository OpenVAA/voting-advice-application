export type inputFieldProps = {
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
  questionsLocked: boolean;
  /**
   * The answer to the question.
   */
  value: AnswePropsValue;
};
