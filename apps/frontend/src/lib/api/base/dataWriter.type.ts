import type {
  LocalizedAnswer,
  LocalizedQuestionArguments,
  LocalizedQuestionInfoSection,
  LocalizedTermDefinition,
  LocalizedVideoContent
} from '@openvaa/app-shared';
import type { Id, Serializable } from '@openvaa/core';
import type { CandidateData, EntityType } from '@openvaa/data';
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
  // Invitations
  ////////////////////////////////////////////////////////////////////

  /**
   * Ask whether an invitation code of the project this adapter serves is valid, used or unknown. The caller needs no session. The answer says nothing else about the invitation or about whoever claimed it.
   * @param code - The code as typed.
   * @returns A `Promise` resolving to the status, or a `Response` containing it.
   * @throws An error if the check cannot be made or its answer does not have the expected shape.
   */
  exchangeCodeForIdToken: (opts: {
    authorizationCode: string;
    codeVerifier: string;
    redirectUri: string;
  }) => DWReturnType<DataApiActionResult, TType>;

  /**
   * Ask for a sign-in link to be mailed, in the project this adapter serves. The caller needs no session. The backend answers every request alike, whether or not a mail is sent, so a success says only that the request was received.
   * @param email - The address to mail. Ignored when `code` names a used code, whose mail goes to the address of whoever claimed it.
   * @param code - An invitation code. At least one of `email` and `code` is given.
   * @param locale - The locale the mail is written in and its link leads to.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   * @throws An error if the request cannot be made or its answer does not have the expected shape.
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
   * @param identifier - Personal identifier such as the OIDC `sub` claim.
   * @param email - Email.
   * @param nominations - Nominations.
   * Access:  API token.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   * @throws An error if the request cannot be made or its answer does not have the expected shape.
   */
  preregisterWithApiToken: (opts: {
    body: {
      firstName: string;
      lastName: string;
      identifier: string;
      email: string;
      nominations: Array<{ electionId: Id; constituencyId: Id }>;
    };
  }) => DWReturnType<DataApiActionResult, TType>;

  /**
   * Ask, as the signed-in user, for an address the user typed to be proved, in the project this adapter serves. Only an account an identity provider made that has no proved address may ask: the backend mails the address a link, and the address becomes the account's only when that link is opened. The call carries the session of the client it is made on.
   * @param email - The address the user typed.
   * @param locale - The locale the mail is written in and its link leads to.
   * @returns A `Promise` resolving to an {@link AddressConfirmationResult}. A refused session, any other answer and a failed call all resolve to `refused`.
   */
  clearIdToken: () => DWReturnType<DataApiActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Registration
  ////////////////////////////////////////////////////////////////////

  /**
   * Sign in the user who claimed an invitation code, with that code and their password, in the project this adapter serves. The session is established on this adapter's own client, so on the server its cookies are written to the response of the request that client belongs to. No token is returned.
   * @param code - The code as typed.
   * @param password - The user’s password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one: a success when a session was established, and a failure for an unknown code, a wrong password and every other refusal, which the backend does not tell apart.
   * @throws An error if the request cannot be made, its answer does not have the expected shape, or the session cannot be established.
   */
  checkRegistrationKey: (opts: { registrationKey: string }) => DWReturnType<CheckRegistrationData, TType>;
  /**
   * Turn the signed-in user’s open invitations in the project this adapter serves into grants. The backend decides whose invitations they are from the session alone: the call names the project and nothing that identifies a user. A grant written here is not in the session’s access token until the session is refreshed.
   * @returns A `Promise` resolving to the grants written, the promises left open and whether the user has a password, or a `Response` containing them.
   * @throws An error if the claim fails or its answer does not have the expected shape. A failed claim is never reported as an empty one.
   */
  register: (opts: { registrationKey: string; password: string }) => DWReturnType<DataApiActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Logging in and out
  ////////////////////////////////////////////////////////////////////

  /**
   * Login a user.
   * @param username - The username.
   * @param password - The password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one. Authorisation is carried by the session, so no token is returned.
   */
  login: (opts: { username: string; password: string }) => DWReturnType<DataApiActionResult, TType>;
  /**
   * Logout a user from both the frontend and the backend.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  logout: () => DWReturnType<DataApiActionResult, TType>;
  /**
   * Logout a user from the backend only.
   * This is mostly used by the login server api route to undo a login attempt.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  backendLogout: () => DWReturnType<DataApiActionResult, TType>;
  /**
   * Get the basic data for a user, mostly their username, email, and preferred language. Every call also reads whether the user's account has a password, and the call rejects when that cannot be read: a failed read of it is never answered as a value.
   * @returns A `Promise` resolving to a `BasicUserData` object or a `Response` containing one.
   */
  getBasicUserData: () => DWReturnType<BasicUserData, TType>;

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
   * Record the signed-in user’s acceptance of the terms of use for the project this adapter serves. Authorisation comes from the caller’s active session. Recording an acceptance that already exists is not an error and leaves the earlier one as it is.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  setPassword: (opts: { password: string }) => DWReturnType<DataApiActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Getting data owned by the user
  ////////////////////////////////////////////////////////////////////

  /**
   * Check whether the registration key is valid.
   * @param loadNominations - If `true`, the `Candidate`’s `Nomination`s and related `Entity`s are also loaded. When updating the user data after initial load, nominations need not be reloaded.
   * @param locale - The `Nomination`-related data are translated to the specified `locale`. Note that the `Candidate` data itself is left untranslated.
   * @returns A `Promise` resolving to a `CandidateUserData` object or a `Response` containing one.
   */
  getCandidateUserData: <TNominations extends boolean | undefined>(
    opts: GetCandidateUserDataOptions<TNominations>
  ) => DWReturnType<CandidateUserData<TNominations>, TType>;

  ////////////////////////////////////////////////////////////////////
  // Setting data owned by the user NB. The answer setters (`updateAnswers`/`overwriteAnswers`) return only the updated `LocalizedAnswers` map for synchronization — or {@link UNVERIFIED_ANSWERS}, when the write succeeded but its read-back could not be validated — while the property setter (`updateEntityProperties`) returns the properties it wrote and no others, or says that a changed name was refused, and the nominations setter (`setEntityNominations`) returns the counts of what it stored, or says which of four named refusals it met.
  ////////////////////////////////////////////////////////////////////

  /**
   * Update the `answers` of an entity owned by the user, replacing any existing answers. Answers with `null` values are removed.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param answers - A `LocalizedAnswers` object containing the answers to update.
   * @returns A `Promise` resolving the updated `LocalizedAnswers` for the entity, or {@link UNVERIFIED_ANSWERS} when the write succeeded but its read-back could not be validated, or a `Response` containing either.
   * @throws An `AnswersLockedError` when the backend refuses the write because the project's answers are locked, and an error when the write fails for any other reason.
   */
  updateAnswers: (opts: SetAnswersOptions) => DWReturnType<SetAnswersResult, TType>;
  /**
   * Overwrite the whole `answers` property of an entity owned by the user.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param answers - A `LocalizedAnswers` object containing the new `answers`.
   * @returns A `Promise` resolving the updated `LocalizedAnswers` for the entity, or {@link UNVERIFIED_ANSWERS} when the write succeeded but its read-back could not be validated, or a `Response` containing either.
   * @throws An `AnswersLockedError` when the backend refuses the write because the project's answers are locked, and an error when the write fails for any other reason.
   */
  overwriteAnswers: (opts: SetAnswersOptions) => DWReturnType<SetAnswersResult, TType>;
  /**
   * Update editable properties of an entity owned by the user. The properties given are written and no others, so the call carries the properties that changed.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param properties - The properties to store. Which properties an entity has depends on its type, see {@link EditableEntityProps}.
   * @param locale - The locale the written names are translated to in the result, as `getEntityUserData` translates them.
   * @returns A `Promise` resolving to an {@link UpdateEntityPropertiesResult}, or a `Response` containing one: the properties as stored, or the name-refused result when the backend refuses a changed name because the entity has been confirmed, in which case nothing of the call was stored.
   * @throws An error if no property is given, if `properties.image` is neither `null` nor carries a file, if a property does not belong to the entity's type, if a value does not have the form its property is stored in, or if the write fails for any reason other than a refused name.
   */
  updateEntityProperties: (opts: SetPropertiesOptions) => DWReturnType<LocalizedCandidateData, TType>;

  // TODO: Implement
  // /**
  //  * Update the user settings.
  //  * @param settings - An object containing the settings to update.
  //  * @returns A `Promise` resolving the updated `UserSettings` object or a `Response` containing one.
  //  */
  // updateUserSettings: (opts: WithUserSettings) => DWReturnType<UserSettings, TType>;

  ////////////////////////////////////////////////////////////////////
  // Methods for the Admin App
  ////////////////////////////////////////////////////////////////////

  // Job management methods for the Admin App
  getActiveJobs: (opts: GetActiveJobsOptions) => DWReturnType<Array<JobInfo>, TType>;
  getPastJobs: (opts: GetPastJobsOptions) => DWReturnType<Array<JobInfo>, TType>;
  startJob: (opts: StartJobOptions) => DWReturnType<JobInfo, TType>;
  getJobProgress: (opts: GetJobProgressOptions) => DWReturnType<JobInfo, TType>;
  abortJob: (opts: AbortJobOptions) => DWReturnType<DataApiActionResult, TType>;
  abortAllJobs: () => DWReturnType<DataApiActionResult, TType>;
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
 *
 * Every member is read from the verified user and the user-level read the database answers for the caller alone, never from the session object or the URL.
 */
export interface BasicUserData extends WithUserSettings {
  id: Id;
  /**
   * The account's address, the one the user signs in with. Empty when the account has no address of its holder's own: an account an identity provider made holds a placeholder address until a typed address is proved, and a placeholder address is never held here.
   */
  email: string;
  /**
   * The same address as `email`, for a password manager's user-name field. Never a placeholder address, for the same reason.
   */
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
 * What an answer setter reports when the write SUCCEEDED but the value it read back could not be validated (decision **B3**, requirement **D8**).
 *
 * The write is not in doubt — the RPC returned without an error. What is in doubt is the state the adapter is about to report as the entity's new answers, and reporting an unverified state as a verified one is what let a malformed read-back clear a candidate's edit buffer (fact 5). This says "the write happened, its result is unknown" instead.
 *
 * A STRING rather than an empty object or a branded record. `LocalizedAnswers` is an open record keyed by question id, so any object-shaped sentinel could in principle collide with a real question id — `{ unverified: true }` is indistinguishable from an entity that answered a question called `unverified`. A string can never be a `LocalizedAnswers`, so the union narrows unambiguously and no collision is expressible. It also survives the `devalue` serialization boundary, which a `Symbol` would not (the reason decision **B1** rejected symbol branding).
 */
export type UnverifiedAnswers = 'unverified-answers';

/**
 * What the answer setters resolve to: the validated answers map, or {@link UnverifiedAnswers}.
 *
 * The union is deliberately NOT collapsible by a `??` or a spread — the two arms have different TYPES, so a consumer that ignores the distinction fails to typecheck rather than silently degrading. That is the property requirement **D8** asks for and the one the previous `?? {}` destroyed.
 */
export type SetAnswersResult = LocalizedAnswers | UnverifiedAnswers;

/**
 * `CandidateData` with localized `answers`. Used for editing.
 * @remarks The naming is a bit misleading and the type could as well be `EditableCandidateData`.
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
   * The stored image, or `null` when the entity has none.
   */
  user: BasicUserData;
  /**
   * An organization's name, translated to one locale. Empty when no locale holds a name.
   */
  candidate: LocalizedCandidateData;
  /**
   * An organization's short name, translated to one locale, or `null` when it has none.
   */
  nominations: TNominations extends true ? DPDataType['nominations'] : undefined;
};

/**
 * Result of an admin job.
 * TODO: Define in a more logical place when saved job listing is implemented.
 */
export type AdminJobRecord = {
  jobId: JobInfo['id'];
  jobType: AdminFeature;
  electionId: Id;
  /**
   * Author email
   */
  author: string;
  endStatus: 'completed' | 'failed' | 'aborted'; // TODO: this could be dynamic, right?
  startTime?: string;
  endTime?: string;
  input?: Serializable;
  output?: Serializable;
  messages?: Array<JobMessage>;
  metadata?: Serializable;
};

////////////////////////////////////////////////////////////////////
// Types for building the params to DataWriter methods
////////////////////////////////////////////////////////////////////

export type SetAnswersOptions = WithTargetEntity & WithAnswerData;

export type SetPropertiesOptions = WithTargetEntity & WithEditableEntityProps;

export type SetQuestionOptions = WithTargetId & { data: TemporarySetQuestionData };

export type GetCandidateUserDataOptions<TNominations extends boolean | undefined> = {
  loadNominations?: TNominations;
  locale?: string;
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
 * A temporary type for setting `Question` data, which will be updated later to allow for setting all properties. It currently supports only `customData` properties.
 */
export type TemporarySetQuestionData = {
  customData: {
    arguments?: Array<LocalizedQuestionArguments>;
    infoSections?: Array<LocalizedQuestionInfoSection>;
    terms?: Array<LocalizedTermDefinition>;
    video?: LocalizedVideoContent;
  };
};

export type GetActiveJobsOptions = ActiveJobQueryParams;

export type GetPastJobsOptions = PastJobQueryParams;

export type StartJobOptions = {
  feature: string;
  author: string;
};

export type GetJobProgressOptions = {
  jobId: string;
};

export type AbortJobOptions = {
  jobId: string;
  reason?: string;
};

export type InsertJobResultOptions = { data: AdminJobRecord };
