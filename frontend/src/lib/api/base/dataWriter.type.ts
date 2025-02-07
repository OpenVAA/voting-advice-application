import type { LocalizedAnswer } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { CandidateData, EntityType } from '@openvaa/data';
import type { DataApiActionResult } from './actionResult.type';
import type { AdapterType } from './adapterType.type';
import type { DPDataType } from './dataTypes';

/**
 * The `DataWriter` interface defines the core app API calls for writing data to the backen, authenticating, and functions requiring authentication.
 */
export interface DataWriter<TType extends AdapterType = 'universal'> {
  ////////////////////////////////////////////////////////////////////
  // Preregistration
  ////////////////////////////////////////////////////////////////////

  exchangeAuthorizationCode: (opts: {
    authorizationCode: string;
    redirectUri: string;
  }) => DWReturnType<DataApiActionResult>;

  /**
   * Creates a candidate with a nomination or nominations and send a registration link.
   * @param email - Email.
   * @param electionDocumentIds - Election document IDs.
   * @param constituencyDocumentId - Constituency document ID.
   * @access ID token.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  preregisterWithIdToken: (opts: {
    email: string;
    electionIds?: Array<string>;
    constituencyId?: string;
  }) => DWReturnType<DataApiActionResult>;

  /**
   * Creates a candidate with a nomination or nominations and send a registration link.
   * @param firstName - First name.
   * @param lastName - Last name.
   * @param identifier - Personal identifier such as a birthdate.
   * @param email - Email.
   * @param electionDocumentIds - Election document IDs.
   * @param constituencyDocumentId - Constituency document ID.
   * @access API token.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  preregisterWithApiToken: (
    opts: {
      body: {
        firstName: string;
        lastName: string;
        identifier: string;
        email: string;
        electionDocumentIds?: Array<string>;
        constituencyDocumentId?: string;
      };
    } & WithAuth
  ) => DWReturnType<DataApiActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Registration
  ////////////////////////////////////////////////////////////////////

  /**
   * Check whether the registration key is valid.
   * @param registrationKey - The registration key to check.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  checkRegistrationKey: (opts: { registrationKey: string }) => DWReturnType<CheckRegistrationData, TType>;
  /**
   * Activate an already registered user with the provided registration key and password.
   * @param registrationKey - The registration key to check.
   * @param password - The user’s password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  register: (opts: { registrationKey: string; password: string }) => DWReturnType<DataApiActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Logging in and out
  ////////////////////////////////////////////////////////////////////

  /**
   * Login a user.
   * @param username - The username.
   * @param password - The password.
   * @returns A `Promise` resolving to an object with the `authToken` or a `Response` containing one.
   */
  login: (opts: { username: string; password: string }) => DWReturnType<DataApiActionResult & Partial<WithAuth>, TType>;
  /**
   * Logout a user.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  logout: (opts: WithAuth) => DWReturnType<DataApiActionResult, TType>;
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
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  requestForgotPasswordEmail: (opts: { email: string }) => DWReturnType<DataApiActionResult, TType>;
  /**
   * Check whether the registration key is valid.
   * @param code - The password reset code.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  resetPassword: (opts: { code: string; password: string }) => DWReturnType<DataApiActionResult, TType>;
  /**
   * Change a user’s password.
   * @param currentPassword - The current password.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  setPassword: (
    opts: WithAuth & { currentPassword: string; password: string }
  ) => DWReturnType<DataApiActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Getting data owned by the user
  ////////////////////////////////////////////////////////////////////

  /**
   * Check whether the registration key is valid.
   * @param authToken - The authorization token.
   * @param loadNominations - If `true`, the `Candidate`’s `Nomination`s and related `Entity`s are also loaded. When updating the user data after initial load, nominations need not be reloaded.
   * @param locale - The `Nomination`-related data are translated to the specified `locale`. Note that the `Candidate` data itself is left untranslated.
   * @returns A `Promise` resolving to a `CandidateUserData` object or a `Response` containing one.
   */
  getCandidateUserData: <TNominations extends boolean | undefined>(
    opts: GetCandidateUserDataOptions<TNominations>
  ) => DWReturnType<CandidateUserData<TNominations>, TType>;

  ////////////////////////////////////////////////////////////////////
  // Setting data owned by the user
  // NB. All setters return the whole updated entity data for synchronization.
  ////////////////////////////////////////////////////////////////////

  /**
   * Update the `answers` of an entity owned by the user, replacing any existing answers. Answers with `null` values are removed.
   * @param authToken - The authorization token.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param answers - A `LocalizedAnswers` object containing the answers to update.
   * @returns A `Promise` resolving the updated `LocalizedCandidateData` object or a `Response` containing one.
   */
  updateAnswers: (opts: SetAnswersOptions) => DWReturnType<LocalizedCandidateData, TType>;
  /**
   * Overwrite the whole `answers` property of an entity owned by the user.
   * @param authToken - The authorization token.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param answers - A `LocalizedAnswers` object containing the new `answers`.
   * @returns A `Promise` resolving the updated `LocalizedCandidateData` object or a `Response` containing one.
   */
  overwriteAnswers: (opts: SetAnswersOptions) => DWReturnType<LocalizedCandidateData, TType>;
  /**
   * Update any editable properties of an entity owned by the user.
   * @param authToken - The authorization token.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param properties - An object containing the properties to update.
   * @returns A `Promise` resolving the updated `LocalizedCandidateData` object or a `Response` containing one.
   */
  updateEntityProperties: (opts: SetPropertiesOptions) => DWReturnType<LocalizedCandidateData, TType>;

  // TODO: Implement
  // /**
  //  * Update the user settings.
  //  * @param authToken - The authorization token.
  //  * @param settings - An object containing the settings to update.
  //  * @returns A `Promise` resolving the updated `UserSettings` object or a `Response` containing one.
  //  */
  // updateUserSettings: (opts: WithAuth & WithUserSettings) => DWReturnType<UserSettings, TType>;
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
 * The minimal data needed for a logged-in `User`.
 */
export interface BasicUserData extends WithUserSettings {
  id: Id;
  email: string;
  username: string;
  confirmed: boolean;
  blocked: boolean;
}

export type CheckRegistrationData = DataApiActionResult & {
  email: string;
  firstName: string;
  lastName: string;
};

/**
 * An `Answers` dictionary with `LocalizedAnswer`s.
 */
export type LocalizedAnswers = {
  [questionId: Id]: LocalizedAnswer | null;
};

/**
 * `CandidateData` with localized `answers`. Used for editing.
 */
export type LocalizedCandidateData = CandidateData & { answers?: LocalizedAnswers | null };

/**
 * The data owned by a candidate `User`.
 * @typeParam TNominations - Whether to include the `nominations` property, defaulting to `false`.
 */
export type CandidateUserData<TNominations extends boolean | undefined = undefined> = {
  /**
   * The data for the `User`.
   */
  user: BasicUserData;
  /**
   * The data for the `Candidate` owned by the `User`.
   */
  candidate: LocalizedCandidateData;
  /**
   * The partial nominations the `Candidate` has and their linked `Entity`s, e.g. organizations.
   */
  nominations: TNominations extends true ? DPDataType['nominations'] : undefined;
};

////////////////////////////////////////////////////////////////////
// Types for building the params to DataWriter methods
////////////////////////////////////////////////////////////////////

export type SetAnswersOptions = WithAuth & WithTargetEntity & WithAnswerData;

export type SetPropertiesOptions = WithAuth & WithTargetEntity & WithEditableEntityProps;

export type GetCandidateUserDataOptions<TNominations extends boolean | undefined> = WithAuth & {
  loadNominations?: TNominations;
  locale?: string;
};

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
  image: ImageWithFile;
};

export type WithEditableEntityProps = {
  properties: EditableEntityProps;
};

export type UserSettings = {
  language?: string;
};

export type WithUserSettings = {
  settings: UserSettings;
};
