import type {
  LocalizedAnswer,
  LocalizedQuestionArguments,
  LocalizedQuestionInfoSection,
  LocalizedString,
  LocalizedTermDefinition,
  LocalizedVideoContent,
  ServedEntityType
} from '@openvaa/app-shared';
import type { Id, Serializable } from '@openvaa/core';
import type { AllianceData, CandidateData, Colors, EntityType, Image, OrganizationData } from '@openvaa/data';
import type { AdminFeature } from '$lib/admin/features';
import type { AddressState } from '$lib/contestant/utils/identityProviderAccount';
import type {
  ActiveJobQueryParams,
  JobInfo,
  JobMessage,
  PastJobQueryParams
} from '$lib/server/admin/jobs/jobStore.type';
import type { DataApiActionResult } from './actionResult.type';
import type { AdapterType } from './adapterType.type';

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
  checkInvitationCode: (opts: { code: string }) => DWReturnType<InvitationCodeStatus, TType>;
  /**
   * Ask for a sign-in link to be mailed, in the project this adapter serves. The caller needs no session. The backend answers every request alike, whether or not a mail is sent, so a success says only that the request was received.
   * @param email - The address to mail. Ignored when `code` names a used code, whose mail goes to the address of whoever claimed it.
   * @param code - An invitation code. At least one of `email` and `code` is given.
   * @param locale - The locale the mail is written in and its link leads to.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   * @throws An error if the request cannot be made or its answer does not have the expected shape.
   */
  requestSignInLink: (opts: RequestSignInLinkOptions) => DWReturnType<DataApiActionResult, TType>;
  /**
   * Ask for a password-recovery link to be mailed, in the project this adapter serves. The caller needs no session. The backend answers every request alike, so a success says only that the request was received: it never tells whether the address has an account, nor whether a mail is sent.
   * @param email - The address to mail.
   * @param locale - The locale the mail is written in and its link leads to.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   * @throws An error if the request cannot be made or its answer does not have the expected shape.
   */
  requestPasswordRecovery: (opts: RequestPasswordRecoveryOptions) => DWReturnType<DataApiActionResult, TType>;
  /**
   * Ask, as the signed-in user, for an address the user typed to be proved, in the project this adapter serves. Only an account an identity provider made that has no proved address may ask: the backend mails the address a link, and the address becomes the account's only when that link is opened. The call carries the session of the client it is made on.
   * @param email - The address the user typed.
   * @param locale - The locale the mail is written in and its link leads to.
   * @returns A `Promise` resolving to an {@link AddressConfirmationResult}. A refused session, any other answer and a failed call all resolve to `refused`.
   */
  requestAddressConfirmation: (opts: RequestAddressConfirmationOptions) => Promise<AddressConfirmationResult>;
  /**
   * Sign in the user who claimed an invitation code, with that code and their password, in the project this adapter serves. The session is established on this adapter's own client, so on the server its cookies are written to the response of the request that client belongs to. No token is returned.
   * @param code - The code as typed.
   * @param password - The user’s password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one: a success when a session was established, and a failure for an unknown code, a wrong password and every other refusal, which the backend does not tell apart.
   * @throws An error if the request cannot be made, its answer does not have the expected shape, or the session cannot be established.
   */
  signInWithInvitationCode: (opts: { code: string; password: string }) => DWReturnType<DataApiActionResult, TType>;
  /**
   * Turn the signed-in user’s open invitations in the project this adapter serves into grants. The backend decides whose invitations they are from the session alone: the call names the project and nothing that identifies a user. A grant written here is not in the session’s access token until the session is refreshed.
   * @returns A `Promise` resolving to the grants written, the promises left open and whether the user has a password, or a `Response` containing them.
   * @throws An error if the claim fails or its answer does not have the expected shape. A failed claim is never reported as an empty one.
   */
  claimInvitations: () => DWReturnType<InvitationClaimResult, TType>;

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
   * Change a user’s password. Authorisation comes from the caller’s active session, not from a supplied current password.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  setPassword: (opts: { password: string }) => DWReturnType<DataApiActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Terms of use
  ////////////////////////////////////////////////////////////////////

  /**
   * Record the signed-in user’s acceptance of the terms of use for the project this adapter serves. Authorisation comes from the caller’s active session. Recording an acceptance that already exists is not an error and leaves the earlier one as it is.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  acceptTermsOfUse: () => DWReturnType<DataApiActionResult, TType>;

  ////////////////////////////////////////////////////////////////////
  // Getting data owned by the user
  ////////////////////////////////////////////////////////////////////

  /**
   * List the entities the signed-in user edits in the project this adapter serves, of every entity type the application can serve. Authorisation comes from the caller’s active session.
   * @param locale - The locale the entities’ localized values are translated to.
   * @returns A `Promise` resolving to the entities, in the order the backend listed them, or a `Response` containing them. A user who edits nothing resolves to an empty array.
   * @throws An error if the list cannot be read or does not have the expected shape. A failed read is never reported as an empty list.
   */
  getUserEntities: (opts?: GetUserEntitiesOptions) => DWReturnType<Array<UserEntity>, TType>;

  /**
   * Get the editable data of one entity the signed-in user edits in the project this adapter serves.
   * @param type - The type of the entity.
   * @param id - The id of the entity.
   * @param loadNominations - If `true`, the entity’s nominations are also loaded. When updating the user data after initial load, nominations need not be reloaded.
   * @param locale - The locale the entity’s localized properties and the names in its nominations are translated to. Its answers are left untranslated.
   * @returns A `Promise` resolving to the entity’s user data, or to `undefined` when the backend holds no such entity for this user or refuses the user its nominations, or a `Response` containing either.
   * @throws An error if a read fails or its answer does not have the expected shape. A failed read is never reported as `undefined`, and a failed or refused nominations read never as an empty list.
   */
  getEntityUserData: <TNominations extends boolean | undefined>(
    opts: GetEntityUserDataOptions<TNominations>
  ) => DWReturnType<ContestantUserData<TNominations> | undefined, TType>;

  /**
   * List the entities one of an entity's nominations may be placed under, in the project this adapter serves: the organizations for a candidate, the alliances for an organization. The entity is one the signed-in user edits.
   * @param target.type - The type of the entity whose nominations are being edited.
   * @param target.id - The id of that entity.
   * @param contests - The contests to say of each option whether it is nominated there.
   * @param locale - The locale the options' names are translated to.
   * @returns A `Promise` resolving to the options, each an entity in the form a `DataRoot` is given entities in with the contests it is nominated at, or to `undefined` when the backend refuses the read, or a `Response` containing either. A project that lists nothing the entity may be placed under resolves to an empty array.
   * @throws An error if the target has no id, if `contests` is not a list, or if the read fails or its answer does not have the expected shape. A failed or refused read is never reported as an empty list.
   */
  getNominationParentOptions: (
    opts: GetNominationParentOptionsOptions
  ) => DWReturnType<Array<NominationParentOption> | undefined, TType>;

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
  updateEntityProperties: (opts: SetPropertiesOptions) => DWReturnType<UpdateEntityPropertiesResult, TType>;
  /**
   * Write the nominations of an entity owned by the user as one whole: after the call the entity has the nominations given and no others, of those in elections it may be nominated in. Either every change is stored or none is.
   * @param target.type - The type of the entity.
   * @param target.id - The id of the entity.
   * @param nominations - Every nomination the entity is to have, see {@link DesiredNomination}. A stored nomination that is left out is removed.
   * @param readFrom - The entity's nominations in the write's reach as they were read when `nominations` was computed, each with its `updatedAt`.
   * @returns A `Promise` resolving to a {@link SetEntityNominationsResult}, or a `Response` containing one: the counts of what was stored, or the refused result naming its reason when the backend refuses the write because the nominations have changed since `readFrom` was read, because a removed nomination has others listed under it, because the caller holds too many unconfirmed parent nominations or because the project's answers are locked, in which case nothing of the call was stored.
   * @throws An error if the target has no id, if `nominations` or `readFrom` is not a list, or if the write fails for any reason other than the four named refusals.
   */
  setEntityNominations: (opts: SetEntityNominationsOptions) => DWReturnType<SetEntityNominationsResult, TType>;

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
  /**
   * When the user accepted the terms of use for the project this adapter serves, as the database stamped it. `null` when they have not accepted. When the acceptance cannot be read, the read of the user's data fails instead.
   */
  termsOfUseAccepted: string | null;
  /**
   * Whether the user's account has a password, read on every call of `getBasicUserData`. A user who signed in by a mailed link and has not set one reads `false`. It is always a boolean: when it cannot be read, the read of the user's data fails instead.
   */
  passwordSet: boolean;
  /**
   * The state of the account's address, told by `addressStateOf` from the verified user's address, pending address and the identity provider its `app_metadata` names. `none` and `pending` belong to an account an identity provider made that holds only its placeholder address; every other account is `proved`. A pending address that is now another account's reads as `none`, with `pendingEmailTaken` set.
   */
  addressState: AddressState;
  /**
   * The address awaiting proof by the link mailed to it, shown to its own owner. Set only in the state `pending`, `null` otherwise.
   */
  pendingEmail: string | null;
  /**
   * Whether the organization the identity registered through the identity provider in this project, named by the record `identity-callback` keeps in the account's `app_metadata`, is among the entities the user edits and has no name with text in the adapter's default locale. `false` for every other organization the user edits, whatever its name.
   */
  ownOrganizationUnnamed: boolean;
  /**
   * Whether the address the account was waiting to prove has since become another account's, as the user-level read answers it for the caller alone. Only an account that was `pending` reads `true`, and it then reads `addressState` as `none` and `pendingEmail` as `null`. It is always a boolean: when it cannot be read, the read of the user's data fails instead.
   */
  pendingEmailTaken: boolean;
}

/**
 * The coarse role of a signed-in user, derived from the grant shapes in their access token: `'admin'` when it carries a grant that opens the Admin App, otherwise `'contestant'` when it carries one that opens the Contestant App. An admin grant is tested first, so a user holding both is an `'admin'`.
 *
 * It is a summary for the app-entry gates, not authorisation: the database's policies decide what a user may read or write.
 */
export type UserRole = 'contestant' | 'admin';

/**
 * What the backend says about an invitation code: `valid` when it can still be claimed, `used` when it has been claimed, and `unknown` for a code that is expired or that the project does not hold.
 */
export type InvitationCodeStatus = 'valid' | 'used' | 'unknown';

/**
 * One grant an invitation promised, in the column names of the database’s `grants` table.
 */
export type ClaimedInvitation = {
  scope: string;
  target_type: string | null;
  target_id: string | null;
  role: string;
};

/**
 * Why a promised grant was not written: the candidate already has another editor, the target is not in the project, or `other` for a reason the database gives that this application does not know.
 */
export type InvitationSkipReason = 'candidate_has_editor' | 'target_not_in_project' | 'other';

/**
 * One promised grant that was not written. Its invitation stays open, so it is reported again by every later claim.
 */
export type SkippedInvitation = ClaimedInvitation & {
  reason: InvitationSkipReason;
};

/**
 * What a claim of the signed-in user’s invitations came to.
 */
export type InvitationClaimResult = {
  /**
   * The grants this claim wrote. Empty when the user had no open invitation.
   */
  claimed: Array<ClaimedInvitation>;
  /**
   * The promises this claim left open.
   */
  skipped: Array<SkippedInvitation>;
  /**
   * Whether the user has a password. A user created by a sign-in link has none until they set one.
   */
  passwordSet: boolean;
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
};

/**
 * `OrganizationData` with localized `answers`. Used for editing.
 */
export type LocalizedOrganizationData = OrganizationData & {
  answers?: LocalizedAnswers | null;
};

/**
 * The editable data of an entity of either served type, discriminated by `type`.
 */
export type LocalizedEntityData = LocalizedCandidateData | LocalizedOrganizationData;

/**
 * The members every listed entity carries, whatever its type.
 */
type UserEntityBase = {
  id: Id;
  shortName?: string;
  image?: Image;
  /**
   * The colours the entity is shown in: parsed and adjusted for contrast, as the public data's are, so not the stored value. Left out for an entity with no colour and for a stored value that is not a colour.
   */
  color?: Colors;
  /**
   * Whether the entity has been confirmed by an administrator.
   */
  confirmed: boolean;
};

/**
 * One entity the signed-in user edits, as listed by `getUserEntities`: what is needed to show the entity and to ask for its data. Discriminated by `type`.
 */
export type UserEntity =
  | (UserEntityBase & { type: 'candidate'; firstName: string; lastName: string })
  | (UserEntityBase & { type: 'organization'; name: string });

/**
 * The names of an entity as they are stored: one entry for each locale, or `null` where nothing is stored.
 */
export type LocalizedEntityNames = {
  /**
   * The name by locale.
   */
  name: LocalizedString | null;
  /**
   * The short name by locale.
   */
  shortName: LocalizedString | null;
};

/**
 * The entity one of an entity's nominations is nominated under: the party of a candidate, the alliance of a party.
 */
export type EntityNominationParent = {
  /**
   * The type of the entity.
   */
  entityType: EntityType;
  /**
   * The id of the entity.
   */
  entityId: Id;
  /**
   * The entity's name, translated to one locale. Empty when no locale holds a name.
   */
  name: string;
  /**
   * The entity's short name, translated to one locale. Left out when it has none.
   */
  shortName?: string;
};

/**
 * One nomination of an entity the signed-in user edits, as that entity's editor is shown it. It carries the names it is shown with, so it is read without a `DataRoot`.
 */
export type EntityNomination = {
  /**
   * The nomination's id.
   */
  id: Id;
  /**
   * The id of the election the entity is nominated in.
   */
  electionId: Id;
  /**
   * The election's name, translated to one locale. Empty when no locale holds a name.
   */
  electionName: string;
  /**
   * The id of the constituency the entity is nominated in.
   */
  constituencyId: Id;
  /**
   * The constituency's name, translated to one locale. Empty when no locale holds a name.
   */
  constituencyName: string;
  /**
   * The round of the election the nomination is for: 1 when none is stored.
   */
  electionRound: number;
  /**
   * The symbol the entity stands under in the election, such as a candidate's number. Empty when it has none.
   */
  electionSymbol: string;
  /**
   * Whether the nomination has been confirmed by an administrator.
   */
  confirmed: boolean;
  /**
   * The nomination's custom data as stored, or `null` when it holds none.
   */
  customData: Record<string, unknown> | null;
  /**
   * When the nomination was last updated, as the database states it. A write of the entity's nominations hands it back, so that the write is refused when the nomination has changed since.
   */
  updatedAt: string;
  /**
   * The entity the nomination is nominated under. Left out for a nomination with no parent.
   */
  parent?: EntityNominationParent;
};

/**
 * What one of an entity's nominations is to stand under after a write, discriminated by `kind`.
 * - `none`: under nothing, and no typed name is stored.
 * - `entity`: under the nomination of the entity named, at the nomination's own contest. An entity with no nomination there is given one, which an administrator confirms.
 * - `other`: under nothing, with the name of an entity the project does not list, as its editor typed it. The name is stored with the nomination, without surrounding white space.
 * - `keep`: the stored parent and the stored typed name are left as they are. Only a nomination that carries an `id` and stays in its constituency may say so.
 */
export type NominationParentChoice =
  | { kind: 'none' }
  | { kind: 'entity'; entityType: EntityType; entityId: Id }
  | { kind: 'other'; name: string }
  | { kind: 'keep' };

/**
 * One nomination an entity is to have after a write of its nominations.
 */
export type DesiredNomination = {
  /**
   * The id of the stored nomination this one describes. Left out for a nomination that is not stored yet.
   */
  id?: Id;
  /**
   * The id of the election the entity is nominated in. The round is the election's current one and is not stated.
   */
  electionId: Id;
  /**
   * The id of the constituency the entity is nominated in. For a stored nomination, a constituency other than the stored one replaces the nomination with a new one.
   */
  constituencyId: Id;
  /**
   * The symbol the entity stands under in the election, such as a candidate's number. Surrounding white space is not stored, and a blank symbol is stored as none.
   */
  electionSymbol: string;
  /**
   * What the nomination stands under.
   */
  parent: NominationParentChoice;
};

/**
 * What `setEntityNominations` resolves to, discriminated by `type`.
 * - `saved`: the entity's nominations are the ones given. `inserted`, `updated`, `deleted` and `unchanged` count the entity's own nominations, a nomination moved to another constituency once under `deleted` and once under `inserted`; `parentsCreated` counts the nominations created for the entities named as parents.
 * - `refused`: the backend refused the write for the `reason` named, and nothing of the call was stored.
 *   - `changed`: the entity's nominations are no longer those the set was computed from: one was created, moved, edited or removed since they were read.
 *   - `hasCandidates`: a nomination the write removes, or moves to another constituency, has other nominations listed under it.
 *   - `tooManyPending`: the write would create a parent's nomination while the caller already holds the most unconfirmed ones a caller may.
 *   - `answersLocked`: the project's answers are locked, and the caller may not edit the project's nominations.
 */
export type SetEntityNominationsResult =
  | { type: 'saved'; inserted: number; updated: number; deleted: number; unchanged: number; parentsCreated: number }
  | { type: 'refused'; reason: 'changed' | 'hasCandidates' | 'tooManyPending' | 'answersLocked' };

/**
 * An election and a constituency of it: the place a nomination is for.
 */
export type NominationContest = {
  /**
   * The id of the election.
   */
  electionId: Id;
  /**
   * The id of the constituency.
   */
  constituencyId: Id;
};

/**
 * One entity an entity may place a nomination under: an organization for a candidate, an alliance for an organization.
 */
export type NominationParentOption = {
  /**
   * The entity, in the form a `DataRoot` is given entities in. Its `name` and `shortName` are translated to one locale and its colours are adjusted for contrast. Nothing but its type, id, names, colour and image is stated.
   */
  entity: OrganizationData | AllianceData;
  /**
   * The contests, of those asked about, at which the entity is nominated, in the order they were asked about.
   */
  nominatedIn: ReadonlyArray<NominationContest>;
};

/**
 * The data of one entity the signed-in user edits. The user-level data is not part of it: it is read once by `getBasicUserData`.
 * @typeParam TNominations - Whether to include the `nominations` property, defaulting to `false`.
 */
export type ContestantUserData<TNominations extends boolean | undefined = undefined> = {
  /**
   * The data for the entity the `User` edits, of either served type. Its `name` and `shortName` are translated to one locale.
   */
  entity: LocalizedEntityData;
  /**
   * The entity's name and short name in every locale they are stored in, for an entity whose names are localized: an organization has them and a candidate does not. They are held beside the entity because the entity data is the form a `DataRoot` is given, whose names are single strings.
   */
  localizedNames?: LocalizedEntityNames;
  /**
   * The entity's own nominations, confirmed or not, as the one read of them returns them and in its order. An entity with no nomination has an empty list.
   */
  nominations: TNominations extends true ? Array<EntityNomination> : undefined;
};

/**
 * The properties a write stored, in the form `getEntityUserData` gives them on the entity. A member is present only when its property was among those written.
 */
export type SavedEntityProps = {
  /**
   * The stored image, or `null` when the entity has none.
   */
  image?: Image | null;
  /**
   * An organization's name, translated to one locale. Empty when no locale holds a name.
   */
  name?: string;
  /**
   * An organization's short name, translated to one locale, or `null` when it has none.
   */
  shortName?: string | null;
  /**
   * An organization's colour, or `null` when it has none.
   */
  color?: Colors | null;
  /**
   * A candidate's first name.
   */
  firstName?: string;
  /**
   * A candidate's last name.
   */
  lastName?: string;
};

/**
 * What `updateEntityProperties` resolves to, discriminated by `type`.
 * - `saved`: the properties given were stored. `properties` holds them as an entity read gives them, and `localizedNames` holds each written name as stored by locale; each holds a member only for a property that was written.
 * - `nameRefused`: the backend refused the write because it changes a name of an entity that has been confirmed. Nothing of the call was stored.
 */
export type UpdateEntityPropertiesResult =
  | { type: 'saved'; properties: SavedEntityProps; localizedNames: Partial<LocalizedEntityNames> }
  | { type: 'nameRefused' };

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

export type SetPropertiesOptions = WithTargetEntity &
  WithEditableEntityProps & {
    /**
     * The locale the written names are translated to in the result. Defaults to the adapter's default locale, as in `getEntityUserData`.
     */
    locale?: string;
  };

/**
 * What a write of an entity's nominations carries: the entity, every nomination it is to have, and the nominations the list was computed from. A stored nomination the list leaves out is removed, so an empty list removes them all.
 */
export type SetEntityNominationsOptions = WithTargetEntity & {
  nominations: ReadonlyArray<DesiredNomination>;
  /**
   * The entity's nominations that the write may change, as they were read when `nominations` was computed from them: every one of them, and no other. The write is refused as `changed` when the stored ones differ, so that a nomination created, moved or edited since the read is neither removed nor written back.
   */
  readFrom: ReadonlyArray<Pick<EntityNomination, 'id' | 'updatedAt'>>;
};

/**
 * What a read of an entity's parent options carries: the entity, the contests to say of each option whether it is nominated there, and the locale the options' names are translated to.
 */
export type GetNominationParentOptionsOptions = WithTargetEntity & {
  contests: ReadonlyArray<NominationContest>;
  locale: string;
};

export type SetQuestionOptions = WithTargetId & { data: TemporarySetQuestionData };

export type GetUserEntitiesOptions = {
  locale?: string;
};

/**
 * What a request for a sign-in link carries: the locale of the mail, and an address, an invitation code or both.
 */
export type RequestSignInLinkOptions = {
  locale: string;
} & ({ email: string; code?: string } | { email?: string; code: string });

/**
 * What a request for a password-recovery link carries: the address to mail and the locale of the mail.
 */
export type RequestPasswordRecoveryOptions = { email: string; locale: string };

/**
 * What a request for an address to be proved carries: the address the user typed and the locale of the mail.
 */
export type RequestAddressConfirmationOptions = { email: string; locale: string };

/**
 * What a request for an address to be proved comes to.
 * - `sent`: a link was mailed to the address.
 * - `in-use`: the address is another account's.
 * - `refused`: anything else, with nothing mailed.
 */
export type AddressConfirmationResult = 'sent' | 'in-use' | 'refused';

export type GetEntityUserDataOptions<TNominations extends boolean | undefined> = {
  /**
   * The type of the entity to read.
   */
  type: ServedEntityType;
  /**
   * The id of the entity to read.
   */
  id: Id;
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

/**
 * The one colour an entity's editor stores: a hex colour, `#` followed by three or six hexadecimal digits, for the default theme. The colour of the dark theme is derived when the entity is read.
 */
export type EditableEntityColor = {
  normal: string;
};

/**
 * The properties of an entity that its editor may write, beside its answers. Which of them an entity has depends on its type: `image` belongs to both served types, `name`, `shortName` and `color` to an organization, and `firstName` and `lastName` to a candidate. A write carries the properties that changed and no others.
 */
export type EditableEntityProps = {
  /**
   * The entity's image, a candidate's portrait or an organization's logo, with the file to upload, or `null` to remove the stored image. The database deletes the stored file once the entity no longer names it.
   */
  image?: ImageWithFile | null;
  /**
   * An organization's name by locale. Entries are trimmed and blank ones are not stored; a name with no entry left, or `null`, is stored as no name.
   */
  name?: LocalizedString | null;
  /**
   * An organization's short name by locale, normalised as `name` is, or `null` to clear it.
   */
  shortName?: LocalizedString | null;
  /**
   * An organization's colour, or `null` to clear it. A stored colour is replaced whole.
   */
  color?: EditableEntityColor | null;
  /**
   * A candidate's first name. Surrounding whitespace is not stored.
   */
  firstName?: string;
  /**
   * A candidate's last name. Surrounding whitespace is not stored.
   */
  lastName?: string;
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
