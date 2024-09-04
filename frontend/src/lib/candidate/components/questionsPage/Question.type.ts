export type RenderQuestionProps = {
  /**
   * The question to be rendered
   */
  question: QuestionProps;

  /**
   * All the questions belonging to the same category
   */
  categoryQuestions: Array<QuestionProps>;
};
