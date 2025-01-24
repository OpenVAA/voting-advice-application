import type { Id } from '@openvaa/core';
import type { Answer, CandidateData, EntityType, Image } from '@openvaa/data';
import type { AdapterType } from './adapterType.type';
import type { DPReturnType } from './dataProvider.type';

/**
 * The `DataWriter` interface defines the core app API calls for writing data to the backen, authenticating, and functions requiring authentication.
 */
export interface DataWriter<TType extends AdapterType = 'universal'> {
  ////////////////////////////////////////////////////////////////////
  // Registration
  ////////////////////////////////////////////////////////////////////

  /**
   * Check whether the registration key is valid.
   * @param registrationKey - The registration key to check.
   * @returns A `Promise` resolving to an `ActionResult` object or a `Response` containing one.
   */
  checkRegistrationKey: (opts: { registrationKey: string }) => DWReturnType<ActionResult, TType>;
  /**
   * Activate an already registered user with the provided registration key and password.
   * @param registrationKey - The registration key to check.
   * @param password - The user’s password.
   * @returns A `Promise` resolving to an `ActionResult` object or a `Response` containing one.
   */
  register: (opts: { registrationKey: string; password: string }) => DWReturnType<ActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Logging in and out
  ////////////////////////////////////////////////////////////////////

  /**
   * Login a user.
   * @param username - The username.
   * @param password - The password.
   * @returns A `Promise` resolving to an object with the `authToken` or a `Response` containing one.
   */
  login: (opts: { username: string; password: string }) => DWReturnType<ActionResult & WithAuth, TType>;
  /**
   * Logout a user.
   * @returns A `Promise` resolving to an `ActionResult` object or a `Response` containing one.
   */
  logout: () => DWReturnType<ActionResult, TType>;
  /**
   * Get the basic data for a user, mostly their username, email, and preferred language.
   * @param authToken - The authorization token.
   * @returns A `Promise` resolving to a `BasicUserData` object or a `Response` containing one.
   */
  getBasicUserData: (opts: WithAuth) => DWReturnType<BasicUserData, TType>;

  ////////////////////////////////////////////////////////////////////
  // Password handling
  ////////////////////////////////////////////////////////////////////

  /**
   * Request that the a password reset email sent to the user.
   * @param email - The user’s email.
   * @returns A `Promise` resolving to an `ActionResult` object or a `Response` containing one.
   */
  requestForgotPasswordEmail: (opts: { email: string }) => DWReturnType<ActionResult, TType>;
  /**
   * Check whether the registration key is valid.
   * @param code - The password reset code.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `ActionResult` object or a `Response` containing one.
   */
  resetPassword: (opts: { code: string; password: string }) => DWReturnType<ActionResult, TType>;
  /**
   * Change a user’s password.
   * @param currentPassword - The current password.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `ActionResult` object or a `Response` containing one.
   */
  setPassword: (opts: { currentPassword: string; password: string }) => DWReturnType<ActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Getting data owned by the user
  ////////////////////////////////////////////////////////////////////

  /**
   * Check whether the registration key is valid.
   * @param authToken - The authorization token.
   * @returns A `Promise` resolving to a `CandidateUserData` object or a `Response` containing one.
   */
  getCandidateUserData: (opts: WithAuth) => DWReturnType<CandidateUserData, TType>;

  ////////////////////////////////////////////////////////////////////
  // Setting data owned by the user
  ////////////////////////////////////////////////////////////////////

  /**
   * Update the `answers` of an entity owned by the user, replacing any existing answers. Answers with `null` values are removed.
   * @param authToken - The authorization token.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param answers - A `LocalizedAnswers` object containing the answers to update.
   * @returns A `Promise` resolving the updated `LocalizedAnswers` object or a `Response` containing one.
   */
  updateAnswers: (opts: WithAuth & WithTargetEntity & WithAnswerData) => DWReturnType<LocalizedAnswers, TType>;
  /**
   * Overwrite the whole `answers` property of an entity owned by the user.
   * @param authToken - The authorization token.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param answers - A `LocalizedAnswers` object containing the new `answers`.
   * @returns A `Promise` resolving the updated `LocalizedAnswers` object or a `Response` containing one.
   */
  overwriteAnswers: (opts: WithAuth & WithTargetEntity & WithAnswerData) => DWReturnType<LocalizedAnswers, TType>;
  /**
   * Update any editable properties of an entity owned by the user.
   * @param authToken - The authorization token.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param properties - An object containing the properties to update.
   * @returns A `Promise` resolving the updated `EditableEntityProps` object or a `Response` containing one.
   */
  updateEntityProperties: (
    opts: WithAuth & WithTargetEntity & WithEditableEntityProps
  ) => DWReturnType<EditableEntityProps, TType>;
  /**
   * Update the user settings.
   * @param authToken - The authorization token.
   * @param settings - An object containing the settings to update.
   * @returns A `Promise` resolving the updated `UserSettings` object or a `Response` containing one.
   */
  updateUserSettings: (opts: WithAuth & WithUserSettings) => DWReturnType<UserSettings, TType>;
}

////////////////////////////////////////////////////////////////////
// Return types for the DataWriter methods
////////////////////////////////////////////////////////////////////

/**
 * Constructs the type of the return value of the data getter methods, which are `Response`s of JSON strings on the server and serializable objects on the client.
 */
export type DWReturnType<TData, TType extends AdapterType = 'universal'> = Promise<
  TType extends 'server' ? Response : TData
>;

/**
 * The format for the data returned by actions which either succeed or fail but return no other data.
 */
export interface ActionResult {
  success: boolean;
}

/**
 * The minimal data needed for a logged-in `User`.
 */
export interface BasicUserData extends WithUserSettings {
  id: Id;
  email: string;
  username: string;
  confirmed: boolean;
  blocked: boolean;
}

/**
 * An `Answer` with string values possibly localized.
 */
export type LocalizedAnswer = Answer & { info?: LocalizedString | null };

/**
 * An `Answers` dictionary with `LocalizedAnswer`s.
 */
export type LocalizedAnswers = {
  [questionId: Id]: LocalizedAnswer | null;
};

/**
 * `CandidateData` with localized `answers`. Used for editing.
 */
export type LocalizedCandidateData = CandidateData & { answers: LocalizedAnswers };

/**
 * The data owned by a candidate `User`.
 */
export type CandidateUserData = {
  /**
   * The data for the `User`.
   */
  user: BasicUserData;
  /**
   * The data for the `Candidate` owned by the `User`.
   */
  candidate: LocalizedCandidateData;
  /**
   * The `Nomination`s the `Candidate` has and their linked `Entity`s, e.g. organizations.
   */
  nominations: DPReturnType<'nominations'>;
};

////////////////////////////////////////////////////////////////////
// Types for building the params to DataWriter methods
////////////////////////////////////////////////////////////////////

export type WithAuth = {
  authToken: string;
};

export type WithTargetEntity = {
  target: {
    type: EntityType;
    id: Id;
  };
};

export type WithAnswerData = {
  answers: LocalizedAnswers;
};

export type EditableEntityProps = {
  image: Image;
};

export type WithEditableEntityProps = {
  properties: EditableEntityProps;
};

export type UserSettings = {
  language: string;
};

export type WithUserSettings = {
  settings: UserSettings;
};
