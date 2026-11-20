import { getCustomData } from '@openvaa/app-shared';

/**
 * Which info questions an entity is required to answer, and which questions have no saved answer.
 *
 * Both functions are plain and synchronous: they keep no state, read no reactive value and build no route, so the contestant context and a server load can both import this module and reach one answer. The caller passes lists and an answers object it has already read; inside a reactive scope, that read happens in the caller's own scope.
 *
 * The parameter types are minimal structural surfaces. A question of the data model satisfies them, and so does a test fixture that carries the members read, and each function returns the caller's own question type.
 *
 * Tested in `unanswered.test.ts`.
 */

/** The part of a question the required-info filter reads: whether an answer is required, and the custom data that may lock it. */
export type RequirableQuestion = {
  readonly required: boolean;
  readonly customData?: object;
};

/** The part of a question the unanswered filter reads: its id, and `Question.isAnswered` of the data model, which says whether a saved answer answers it. */
export type AnswerableQuestion = {
  readonly id: string;
  isAnswered(answer: SavedAnswers[string]): boolean;
};

/** The part of an entity's saved answers the unanswered filter reads: by question id, an entry holding a value, or nothing. */
export type SavedAnswers = Readonly<Record<string, { readonly value?: unknown } | null | undefined>>;

/** The one member of a question's custom data the required-info filter reads. */
type LockableCustomData = {
  readonly locked?: boolean;
};

/**
 * The info questions an entity must answer: those that are required and that the entity can still edit. A locked question is never required.
 * @param infoQuestions - The info questions the entity is asked.
 * @returns A new array holding the required, unlocked questions in the order given.
 */
export function requiredInfoQuestionsOf<TQuestion extends RequirableQuestion>(
  infoQuestions: ReadonlyArray<TQuestion>
): Array<TQuestion> {
  return infoQuestions.filter((question) => {
    const customData: LockableCustomData = getCustomData<RequirableQuestion>(question);
    return question.required && !customData.locked;
  });
}

/**
 * The questions that have no saved answer, by the question's own `isAnswered`: an answer whose value is empty, or not valid for the question's type, is no answer. The Voter App hides an entity by the same method.
 *
 * With no answers object every question is unanswered. That is the one statement of what holds while no entity is loaded: a caller passes the loaded entity's answers, or nothing.
 * @param questions - The questions to look for answers to.
 * @param answers - The entity's saved answers by question id, or nothing while no entity is loaded.
 * @returns A new array holding the unanswered questions in the order given.
 */
export function unansweredQuestionsOf<TQuestion extends AnswerableQuestion>(
  questions: ReadonlyArray<TQuestion>,
  answers: SavedAnswers | null | undefined
): Array<TQuestion> {
  if (!answers) return [...questions];
  return questions.filter((question) => !question.isAnswered(answers[question.id]));
}
