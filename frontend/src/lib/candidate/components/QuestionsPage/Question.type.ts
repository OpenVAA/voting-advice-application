export type RenderQuestionProps = {
  // The question to be rendered
  question: QuestionProps;

  //all the questions belonging to the same category
  categoryQuestions: QuestionProps[];
};
