import {error} from '@sveltejs/kit';

/**
 * Extract the categories from a list of questions, throwing on any duplicated categories (by id).
 * @param questions An array of QuestionProps
 */
export function extractCategories(
  questions: {category: QuestionCategoryProps}[]
): QuestionCategoryProps[] {
  const categories = Array.from(new Set(questions.map((q) => q.category)));
  const catIds = new Set<string>();
  for (const category of categories) {
    if (catIds.has(category.id)) error(500, `Duplicate category id ${category.id}`);
    catIds.add(category.id);
  }
  return categories;
}

/**
 * Performs basic filtering for questions.
 * @param questions
 */
export function filterVisible(questions: QuestionProps[]): QuestionProps[] {
  return questions.filter((q) => !q.hidden);
}
