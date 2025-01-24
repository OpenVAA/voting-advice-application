import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { Image } from '@openvaa/data';
import type { Readable, Writable } from 'svelte/store';
import type { ActionResult, CandidateUserData, LocalizedAnswers } from '$lib/api/base/dataWriter.type';
import type { AppContext } from '../app';
import type { QuestionBlocks } from '../utils/questionBlockStore.type';

export type CandidateContext = AppContext & {
  ////////////////////////////////////////////////////////////////////
  // Properties matching those in the VoterContext
  ////////////////////////////////////////////////////////////////////

  /**
   * The `Candidate`’s `Answer`s to the `Question`s.
   */
  entityAnswers: EntityAnswerStore;
  /**
   * The `Election`s the `Candidate` is nominated in.
   */
  effectiveElections: Readable<Array<Election>>;
  /**
   * The `Constituency`s the `Candidate` is nominated in.
   */
  effectiveConstituencies: Readable<Array<Constituency>>;
  /**
   * The non-opinion `QuestionCategory`s applicable to the effective `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  infoQuestionCategories: Readable<Array<QuestionCategory>>;
  /**
   * The non-opinion `Question`s applicable to the effective `Election`s and `Constituency`s.
   */
  infoQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * The matching `QuestionCategory`s applicable to the effective `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  opinionQuestionCategories: Readable<Array<QuestionCategory>>;
  /**
   * The matching `Question`s applicable to the effective `Election`s and `Constituency`s.
   */
  opinionQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * The `Question`s in the effective opinion `QuestionCategory`s as well as some utility methods.
   */
  effectiveQuestionBlocks: Readable<QuestionBlocks>;

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods
  // NB. These automatically handle authentication
  ////////////////////////////////////////////////////////////////////

  /**
   * Check whether the registration key is valid.
   * @param registrationKey - The registration key to check.
   * @returns A `Promise` resolving to an `ActionResult` object.
   */
  checkRegistrationKey: (opts: { registrationKey: string }) => Promise<ActionResult>;
  /**
   * Activate an already registered user with the provided registration key and password.
   * @param registrationKey - The registration key to check.
   * @param password - The user’s password.
   * @returns A `Promise` resolving to an `ActionResult` object.
   */
  register: (opts: { registrationKey: string; password: string }) => Promise<ActionResult>;
  /**
   * Login the user and initialize `userData` and `entityAnswers`.
   * @param username - The username.
   * @param password - The password.
   * @returns A `Promise` resolving to an `ActionResult` object.
   */
  login: (opts: { email: string; password: string }) => Promise<ActionResult>;
  /**
   * Logout the user.
   * @returns A `Promise` resolving to an `ActionResult` object.
   */
  logout: () => Promise<ActionResult>;
  /**
   * Request that the a password reset email sent to the user.
   * @param email - The user’s email.
   * @returns A `Promise` resolving to an `ActionResult` object.
   */
  requestForgotPasswordEmail: (opts: { email: string }) => Promise<ActionResult>;
  /**
   * Check whether the registration key is valid.
   * @param code - The password reset code.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `ActionResult` object.
   */
  resetPassword: (opts: { code: string; password: string }) => Promise<ActionResult>;
  /**
   * Change a user’s password.
   * @param currentPassword - The current password.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `ActionResult` object.
   */
  setPassword: (opts: { currentPassword: string; password: string }) => Promise<ActionResult>;
  /**
   * Update the `Candidate`’s image.
   * @param image - An `Image` object.
   * @returns A `Promise` resolving to the updated `Image` object.
   */
  updateImage: (image: Image) => Promise<Image>;
  /**
   * Update the user’s language setting.
   * @param language - The preferred language.
   * @returns A `Promise` resolving to an `ActionResult` object.
   */
  updateUserLanguage: (language: string) => Promise<ActionResult>;

  ////////////////////////////////////////////////////////////////////
  // Other properties specific to CandidateContext
  ////////////////////////////////////////////////////////////////////

  /**
   * Holds the user’s email so it can be prefilled during password changes.
   */
  newUserEmail: Writable<string | undefined>;
  /**
   * The full user data incl. answers
   */
  userData: Writable<CandidateUserData | undefined>;
  /**
   * Whether the answers can be edited.
   */
  answersLocked: Readable<boolean>;
  /**
   * The required info `Question`s that are yet to be answered.
   */
  unansweredRequiredInfoQuestions: Readable<Array<AnyQuestionVariant> | undefined>;
  /**
   * The opinion `Question`s that are yet to be answered.
   */
  unansweredOpinionQuestions: Readable<Array<AnyQuestionVariant> | undefined>;

  // Only internally used
  // token: Writable<string | undefined>;
  // loadUserData: () => Promise<void>;
};

/**
 * Subscription returns the effective answers, including unsaved ones.
 */
export type EntityAnswerStore = Readable<LocalizedAnswers> & {
  /**
   * Set an answer to a specific question.
   */
  setAnswer: (questionId: string, answer: Omit<LocalizedAnswers, 'unsaved'>) => void;
  /**
   * Delete an unsaved answer to a specific question.
   * NB. This does not intend to delete the answer in the backend. Use `setAnswer(questionId, { value: null })` for that.
   */
  deleteAnswer: (questionId: string) => void;
  /**
   * Save all unsaved answers. Resolves to `true` if any were saved.
   */
  save(): Promise<boolean | Error>;
  /**
   * Reset all answers to the saved values. Reloads the answers from the backend.
   */
  reset: () => void;
  /**
   * Is `true` if there are any unsaved answers.
   */
  hasUnsaved: boolean;
};
