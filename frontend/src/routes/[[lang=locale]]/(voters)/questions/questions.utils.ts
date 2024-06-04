import {logDebugError} from '$lib/utils/logger';

/**
 * Sort and filter `questions` by `selectedCategories` and `firstQuestionId`.
 */
export function filterAndSortQuestions(
  questions: QuestionProps[],
  firstQuestionId: string | null,
  selectedCategories: string[] | null
) {
  let questionsOut = [...questions];

  // Filter questions if we have selected categories
  if (selectedCategories) {
    const filtered = questionsOut.filter((q) => selectedCategories!.includes(q.category.id));
    if (filtered.length === 0) {
      logDebugError(
        `Selected categories ${selectedCategories.join(', ')} did not overlap with any of the available questions!`
      );
    } else {
      questionsOut = filtered;
    }
  }

  // If a first question is saved in session storage, move it along with its category first and maintain the original question order otherwise
  if (firstQuestionId) {
    const firstQst = questionsOut.find((q) => q.id == firstQuestionId);
    if (firstQst) {
      const catId = firstQst.category.id;
      questionsOut.sort((a, b) => {
        if (a.id === firstQuestionId) return -1;
        if (b.id === firstQuestionId) return 1;
        if (a.category.id === catId) {
          if (b.category.id === catId) return 0;
          return -1;
        }
        if (b.category.id === catId) return 1;
        return 0;
      });
    }
  }
  return questionsOut;
}
