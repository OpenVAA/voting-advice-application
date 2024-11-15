export type RenderQuestionProps = {
  /**
   * The question to be rendered
   */
  question: LegacyQuestionProps;

  /**
   * All the questions belonging to the same category
   */
  categoryQuestions: Array<LegacyQuestionProps>;
};
