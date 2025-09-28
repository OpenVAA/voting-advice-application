import type {
  LocalizedAnswer,
  LocalizedQuestionArguments,
  LocalizedQuestionInfoSection,
  LocalizedTermDefinition,
  LocalizedVideoContent
} from '@openvaa/app-shared';
import type { Id, Serializable } from '@openvaa/core';
import type { CandidateData, EntityType } from '@openvaa/data';
import type { GenerationMetrics } from '@openvaa/llm';
import type { AdminFeature } from '$lib/admin/features';
import type {
  ActiveJobQueryParams,
  JobInfo,
  JobMessage,
  PastJobQueryParams
} from '$lib/server/admin/jobs/jobStore.type';
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

  /**
   * Exchange an authorization code for an ID token.
   * @param authorizationCode - An authorization code received from an IdP.
   * @param redirectUri - A redirect URI used to obtain the authorization code.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  exchangeCodeForIdToken: (opts: {
    authorizationCode: string;
    codeVerifier: string;
    redirectUri: string;
  }) => DWReturnType<DataApiActionResult, TType>;

  /**
   * Create a candidate with a nomination or nominations and send a registration link.
   * @param email - Email.
   * @param nominations - Nominations.
   * @access ID token.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  preregisterWithIdToken: (opts: {
    email: string;
    nominations: Array<{ electionId: Id; constituencyId: Id }>;
    extra: {
      emailTemplate: {
        subject: string;
        text: string;
        html: string;
      };
    };
  }) => DWReturnType<DataApiActionResult & { response: Pick<Response, 'status'> }, TType>;

  /**
   * Create a candidate with a nomination or nominations and send a registration link.
   * @param firstName - First name.
   * @param lastName - Last name.
   * @param identifier - Personal identifier such as a birthdate.
   * @param email - Email.
   * @param nominations - Nominations.
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
        nominations: Array<{ electionId: Id; constituencyId: Id }>;
      };
    } & WithAuth
  ) => DWReturnType<DataApiActionResult, TType>;

  /**
   * Clear the OIDC ID token.
   */
  clearIdToken: () => DWReturnType<DataApiActionResult, TType>;

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
   * Logout a user from both the frontend and the backend.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  logout: (opts: WithAuth) => DWReturnType<DataApiActionResult, TType>;
  /**
   * Logout a user from the backend only.
   * This is mostly used by the login server api route to undo a login attempt.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  backendLogout: (opts: WithAuth) => DWReturnType<DataApiActionResult, TType>;
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

  ////////////////////////////////////////////////////////////////////
  // Methods for the Admin App
  ////////////////////////////////////////////////////////////////////

  /**
   * Update the a `Question`.
   * NB. This is a temporary implementation, which will be updated later to allow for setting other data as well, and which will return the updated, multi-locale data.
   * @param authToken - The authorization token.
   * @param id - The id of the question.
   * @param data - The data to update.
   * @returns A `Promise` resolving a `DataApiActionResult` or a `Response` containing one.
   */
  updateQuestion: (opts: SetQuestionOptions) => DWReturnType<DataApiActionResult, TType>;

  // Job management methods for the Admin App
  getActiveJobs: (opts: GetActiveJobsOptions) => DWReturnType<Array<JobInfo>, TType>;
  getPastJobs: (opts: GetPastJobsOptions) => DWReturnType<Array<JobInfo>, TType>;
  startJob: (opts: StartJobOptions) => DWReturnType<JobInfo, TType>;
  getJobProgress: (opts: GetJobProgressOptions) => DWReturnType<JobInfo, TType>;
  abortJob: (opts: AbortJobOptions) => DWReturnType<DataApiActionResult, TType>;
  abortAllJobs: (opts: AbortAllJobsOptions) => DWReturnType<DataApiActionResult, TType>;
  insertJobResult: (opts: InsertJobResultOptions) => DWReturnType<DataApiActionResult, TType>;
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
  role?: UserRole | null;
}

export type UserRole = 'candidate' | 'admin';

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
 * `CandidateData` with localized `answers` and `termsOfUseAccepted`. Used for editing.
 * @remarks
 * The naming is a bit misleading and the type could as well be `EditableCandidateData`.
 */
export type LocalizedCandidateData = CandidateData & {
  answers?: LocalizedAnswers | null;
  termsOfUseAccepted?: string | null;
};

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

/**
 * Results for an admin job.
 * TODO: Define in a more logical place when saved job listing is implemented.
 */
export type AdminJobData = {
  jobId: JobInfo['id'];
  jobType: AdminFeature;
  /**
   * Author email
   */
  author: string;
  status: 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  input?: Serializable;
  output?: Serializable;
  messages?: Array<JobMessage>;
  metadata?: GenerationMetrics;
};

////////////////////////////////////////////////////////////////////
// Types for building the params to DataWriter methods
////////////////////////////////////////////////////////////////////

export type SetAnswersOptions = WithAuth & WithTargetEntity & WithAnswerData;

export type SetPropertiesOptions = WithAuth & WithTargetEntity & WithEditableEntityProps;

export type SetQuestionOptions = WithAuth & WithTargetId & { data: TemporarySetQuestionData };

export type GetCandidateUserDataOptions<TNominations extends boolean | undefined> = WithAuth & {
  loadNominations?: TNominations;
  locale?: string;
};

export type WithAuth = {
  /**
   * The JWT token for authentication.
   */
  authToken: string;
};

export type WithTargetId = {
  id: Id;
};

export type WithTargetEntity = {
  target: {
    /**
     * The type of the target entity.
     */
    type: EntityType;
    /**
     * The id of the target entity.
     */
    id: Id;
  };
};

export type WithAnswerData = {
  answers: LocalizedAnswers;
};

export type EditableEntityProps = {
  image?: ImageWithFile;
  termsOfUseAccepted?: string | null;
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

/**
 * A temporary type for setting `Question` data, which will be updated later to allow for setting all properties. It currently supports only those `customData` properties that are not stored as their own fields in Strapi.
 */
export type TemporarySetQuestionData = {
  customData: {
    arguments?: Array<LocalizedQuestionArguments>;
    infoSections?: Array<LocalizedQuestionInfoSection>;
    terms?: Array<LocalizedTermDefinition>;
    video?: LocalizedVideoContent;
  };
};

export type GetActiveJobsOptions = WithAuth & ActiveJobQueryParams;

export type GetPastJobsOptions = WithAuth & PastJobQueryParams;

export type StartJobOptions = WithAuth & {
  feature: string;
  author: string;
};

export type GetJobProgressOptions = WithAuth & {
  jobId: string;
};

export type AbortJobOptions = WithAuth & {
  jobId: string;
  reason?: string;
};

// Most likely will be extended in the future (e.g. cancel queued jobs also?)
export type AbortAllJobsOptions = WithAuth;

export type InsertJobResultOptions = WithAuth & { data: AdminJobData };
