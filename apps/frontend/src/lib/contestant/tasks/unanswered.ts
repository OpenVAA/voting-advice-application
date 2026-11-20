import { getCustomData, isImage, isLocalizedString, isPlainObject } from '@openvaa/app-shared';
import type { LocalizedString } from '@openvaa/app-shared';

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
 * The questions that have no saved answer, by the question's own `isAnswered`: an answer whose value is empty, or not valid for the question's type, is no answer. The Voter App hides an entity by the same method. The answers are taken in their stored shape and each is read in the data model's shape first (see `answerOfStored`).
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
  return questions.filter((question) => !question.isAnswered(answerOfStored(answers[question.id])));
}

/**
 * A saved answer in the shape a question of the data model reads. An entity's own answers are held as they are stored: a text is a localized string, a list of texts a list of them, and an image a storage path. Each is given here in the shape the Voter App reads it in, so that `isAnswered` judges the same value in both apps.
 *
 * A localized string becomes the first of its texts that is not blank, or an empty string when none is. Which locale is read does not decide whether the question is answered, because the Voter App falls back to another locale's text when the reading locale has none. A stored image becomes an image whose url is its path, which is enough for the question to judge it.
 * @param answer - The saved answer, or nothing.
 * @returns The answer with its value in the data model's shape, or the answer as given when its value needs no change.
 */
function answerOfStored(answer: SavedAnswers[string]): SavedAnswers[string] {
  const value = answer?.value;
  if (!answer || value == null) return answer;
  if (isStoredImage(value)) return { ...answer, value: { url: value.path } };
  if (isLocalizedString(value)) return { ...answer, value: textOf(value) };
  if (Array.isArray(value) && value.length > 0 && value.every((item) => isLocalizedString(item)))
    return { ...answer, value: value.map(textOf) };
  return answer;
}

/** Whether a value is an image as it is stored: an object with a storage path and no url. */
function isStoredImage(value: unknown): value is { readonly path: string } {
  return isPlainObject(value) && !isImage(value) && typeof value.path === 'string';
}

/** The first text of a localized string that is not blank, or an empty string. */
function textOf(value: LocalizedString): string {
  return Object.values(value).find((text) => typeof text === 'string' && text.trim() !== '') ?? '';
}
