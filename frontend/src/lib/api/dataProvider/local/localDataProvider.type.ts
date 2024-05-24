/**
 * A format for storing questions so that they do not contain the whole category object but only its id.
 */
export type LocalQuestionProps = Omit<QuestionProps, 'category'> & {categoryId: string};

/**
 * A format for storing question categories so that they do not yet contain questions.
 */
export type LocalQuestionCategoryProps = Omit<QuestionCategoryProps, 'questions'>;
