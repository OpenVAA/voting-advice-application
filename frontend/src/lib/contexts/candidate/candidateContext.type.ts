import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { Readable, Writable } from 'svelte/store';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { AppContext } from '../app';
import type { QuestionBlocks } from '../utils/questionBlockStore.type';
import type { UserDataStore } from './userDataStore.type';

export type CandidateContext = AppContext & {
  ////////////////////////////////////////////////////////////////////
  // Properties matching those in the VoterContext
  ////////////////////////////////////////////////////////////////////

  /**
   * Whether `Election`s can be selected.
   */
  electionsSelectable: Readable<boolean>;
  /**
   * Whether `Constituency`s can be selected.
   */
  constituenciesSelectable: Readable<boolean>;
  /**
   * The `Id`s ...
   */
  preselectedElections: Readable<Array<Id>>;
  /**
   * The `Id`s ...
   */
  preselectedConstituencies: Readable<{ [electionId: Id]: Id }>;
  /**
   * The `Election`s the `Candidate` is nominated in.
   */
  selectedElections: Readable<Array<Election>>;
  /**
   * The `Constituency`s the `Candidate` is nominated in.
   */
  selectedConstituencies: Readable<Array<Constituency>>;
  /**
   * The non-opinion `QuestionCategory`s applicable to the selected `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  infoQuestionCategories: Readable<Array<QuestionCategory>>;
  /**
   * The non-opinion `Question`s applicable to the selected `Election`s and `Constituency`s.
   */
  infoQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * The matching `QuestionCategory`s applicable to the selected `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  opinionQuestionCategories: Readable<Array<QuestionCategory>>;
  /**
   * The matching `Question`s applicable to the selected `Election`s and `Constituency`s.
   */
  opinionQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * The applicable opinion `Question`s applicable to the selected `Election`s and `Constituency`s.
   */
  questionBlocks: Readable<QuestionBlocks>;

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods
  // NB. These automatically handle authentication
  ////////////////////////////////////////////////////////////////////

  /**
   * Check whether the registration key is valid.
   * @param registrationKey - The registration key to check.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  checkRegistrationKey: (opts: { registrationKey: string }) => ReturnType<DataWriter['checkRegistrationKey']>;
  /**
   * Activate an already registered user with the provided registration key and password.
   * @param registrationKey - The registration key to check.
   * @param password - The user’s password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  register: (opts: { registrationKey: string; password: string }) => ReturnType<DataWriter['register']>;
  /**
   * Logout the user and redirect to the login page.
   * @returns A `Promise` resolving when the redirection is complete.
   */
  logout: () => Promise<void>;
  /**
   * Request that the a password reset email sent to the user.
   * @param email - The user’s email.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  requestForgotPasswordEmail: (opts: { email: string }) => ReturnType<DataWriter['requestForgotPasswordEmail']>;
  /**
   * Check whether the registration key is valid.
   * @param code - The password reset code.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  resetPassword: (opts: { code: string; password: string }) => ReturnType<DataWriter['resetPassword']>;
  /**
   * Change a user’s password.
   * @param currentPassword - The current password.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  setPassword: (opts: { currentPassword: string; password: string }) => ReturnType<DataWriter['setPassword']>;

  exchangeCodeForIdToken: (opts: { authorizationCode: string; redirectUri: string }) => Promise<void>;

  /**
   * Creates a candidate with a nomination or nominations, then emails a registration link.
   * Expects a valid ID token in the cookies.
   * @param email - Email.
   * @param electionIds - Election IDs.
   * @param constituencyId - Constituency ID.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  preregister: (opts: {
    email: string;
    nominations: Array<{ electionDocumentId: Id; constituencyDocumentId: Id }>;
  }) => ReturnType<DataWriter['preregisterWithIdToken']>;

  clearIdToken: () => Promise<void>;

  ////////////////////////////////////////////////////////////////////
  // Other properties specific to CandidateContext
  ////////////////////////////////////////////////////////////////////

  /**
   * An extended store that holds all data owned by the user. When subscribed to, it returns a composite of the initial data and any unsaved `Answer`s and properties. Dedicated methods are provided for loading, saving, setting or resetting data.
   *
   * NB. Before using the store, its `init` method must be called with the initial `CandidateUserData`.
   */
  userData: UserDataStore;
  /**
   * Holds the jwt token. NB. The context’s internal methods use it automatically for authentication.
   */
  authToken: Readable<string | undefined>;
  // idTokenClaims: Readable<{ firstName: string; lastName: string } | undefined>;
  /**
   * Holds the user’s email so it can be prefilled during password changes.
   */
  newUserEmail: Writable<string | undefined>;
  /**
   * Whether the answers can be edited.
   */
  answersLocked: Readable<boolean>;
  /**
   * Required info `Question`s.
   */
  requiredInfoQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * The required info `Question`s that are yet to be answered.
   */
  unansweredRequiredInfoQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * The opinion `Question`s that are yet to be answered.
   */
  unansweredOpinionQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * Whether the profile is fully complete.
   */
  profileComplete: Readable<boolean>;
};
