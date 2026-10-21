/**
 * What is known of the opinion questions the edited entity is asked: `loading` until the entity's question data is loaded, then `none` for an entity that is asked no opinion question and `some` for one that is asked any.
 */
export type OpinionQuestionsState = 'loading' | 'none' | 'some';

/**
 * Tell what is known of the opinion questions the edited entity is asked.
 *
 * An empty list says nothing by itself: the list is empty before the entity's question data is loaded, on the server and on first paint among them. A page therefore leaves out what it offers for answering questions only for `none`, and never for `loading`.
 * @param questionsReady - Whether the entity's question data is loaded, as the contestant context's `questionsReady` says.
 * @param questionCount - The number of opinion questions the contestant context lists.
 * @returns The state.
 */
export function opinionQuestionsStateOf({
  questionsReady,
  questionCount
}: {
  questionsReady: boolean;
  questionCount: number;
}): OpinionQuestionsState {
  if (!questionsReady) return 'loading';
  return questionCount === 0 ? 'none' : 'some';
}
