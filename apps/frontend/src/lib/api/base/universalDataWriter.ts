import { resolveRoute } from '$app/paths';
import { UniversalAdapter } from './universalAdapter';
import { UNIVERSAL_API_ROUTES } from './universalApiRoutes';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
import type { DataApiActionResult } from './actionResult.type';
import type {
  AbortJobOptions,
  AddressConfirmationResult,
  BasicUserData,
  ContestantUserData,
  DataWriter,
  DWReturnType,
  GetActiveJobsOptions,
  GetEntityUserDataOptions,
  GetJobProgressOptions,
  GetNominationParentOptionsOptions,
  GetPastJobsOptions,
  GetUserEntitiesOptions,
  InvitationClaimResult,
  InvitationCodeStatus,
  NominationParentOption,
  RequestAddressConfirmationOptions,
  RequestPasswordRecoveryOptions,
  RequestSignInLinkOptions,
  SetAnswersOptions,
  SetAnswersResult,
  SetEntityNominationsOptions,
  SetEntityNominationsResult,
  SetPropertiesOptions,
  StartJobOptions,
  UnverifiedAnswers,
  UpdateEntityPropertiesResult,
  UserEntity
} from './dataWriter.type';

/**
 * The value an answer setter resolves to when the write succeeded but its read-back could not be validated (decision **B3**).
 *
 * Declared HERE rather than beside its type in `dataWriter.type.ts` because that module is types-only, as every `.type.ts` under `lib/api/` is; a runtime export there would be the first and would break the convention for every consumer that imports it with `import type`. This module is the runtime base every writer already extends, so the constant is in scope wherever the setters are.
 *
 * Greppable by name on purpose: `grep -rn 'UNVERIFIED_ANSWERS'` enumerates every site that produces or consumes an unverified write, which a bare string literal would not.
 */
export const UNVERIFIED_ANSWERS: UnverifiedAnswers = 'unverified-answers';

/**
 * The abstract base class that all universal `DataWriter`s should extend.
 *
 * The subclasses must implement the protected methods. The implementations may freely throw errors.
 */
export abstract class UniversalDataWriter extends UniversalAdapter implements DataWriter {
  ////////////////////////////////////////////////////////////////////
  // PUBLIC METHODS
  ////////////////////////////////////////////////////////////////////

  checkInvitationCode(opts: { code: string }): DWReturnType<InvitationCodeStatus> {
    return this._checkInvitationCode(opts);
  }

  requestSignInLink(opts: RequestSignInLinkOptions): DWReturnType<DataApiActionResult> {
    return this._requestSignInLink(opts);
  }

  requestPasswordRecovery(opts: RequestPasswordRecoveryOptions): DWReturnType<DataApiActionResult> {
    return this._requestPasswordRecovery(opts);
  }

  requestAddressConfirmation(opts: RequestAddressConfirmationOptions): Promise<AddressConfirmationResult> {
    return this._requestAddressConfirmation(opts);
  }

  signInWithInvitationCode(opts: { code: string; password: string }): DWReturnType<DataApiActionResult> {
    return this._signInWithInvitationCode(opts);
  }

  claimInvitations(): DWReturnType<InvitationClaimResult> {
    return this._claimInvitations();
  }

  login(opts: { username: string; password: string }): DWReturnType<DataApiActionResult> {
    return this._login(opts);
  }

  async logout(): DWReturnType<DataApiActionResult> {
    const [clientResult, backendResult] = await Promise.all([
      (await this.post({
        url: UNIVERSAL_API_ROUTES.logout,
        init: {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      })) as DataApiActionResult,
      this.backendLogout()
    ]);
    if (clientResult.type === 'success' && backendResult.type === 'success') return backendResult;
    else
      return {
        type: 'failure',
        info: 'Logout failed',
        clientResult,
        backendResult
      };
  }

  async backendLogout(): DWReturnType<DataApiActionResult> {
    return this._logout();
  }

  getBasicUserData(): DWReturnType<BasicUserData> {
    return this._getBasicUserData();
  }

  setPassword(opts: { password: string }): DWReturnType<DataApiActionResult> {
    return this._setPassword(opts);
  }

  acceptTermsOfUse(): DWReturnType<DataApiActionResult> {
    return this._acceptTermsOfUse();
  }

  getUserEntities(opts: GetUserEntitiesOptions = {}): DWReturnType<Array<UserEntity>> {
    return this._getUserEntities(opts);
  }

  getEntityUserData<TNominations extends boolean | undefined>(
    opts: GetEntityUserDataOptions<TNominations>
  ): DWReturnType<ContestantUserData<TNominations> | undefined> {
    return this._getEntityUserData(opts);
  }

  updateAnswers(opts: SetAnswersOptions): DWReturnType<SetAnswersResult> {
    return this._setAnswers({ ...opts, overwrite: false });
  }

  overwriteAnswers(opts: SetAnswersOptions): DWReturnType<SetAnswersResult> {
    return this._setAnswers({ ...opts, overwrite: true });
  }

  updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<UpdateEntityPropertiesResult> {
    const { image } = opts.properties;
    if (!Object.values(opts.properties).some((value) => value !== undefined))
      throw new Error('updateEntityProperties: no property was given');
    if (image !== undefined && image !== null && !image.file)
      throw new Error('updateEntityProperties: the image carries no file');
    return this._updateEntityProperties(opts);
  }

  setEntityNominations(opts: SetEntityNominationsOptions): DWReturnType<SetEntityNominationsResult> {
    if (!opts.target?.id) throw new Error('setEntityNominations: the target entity has no id');
    if (!Array.isArray(opts.nominations)) throw new Error('setEntityNominations: the nominations are not a list');
    if (!Array.isArray(opts.readFrom)) throw new Error('setEntityNominations: the nominations read are not a list');
    return this._setEntityNominations(opts);
  }

  getNominationParentOptions(
    opts: GetNominationParentOptionsOptions
  ): DWReturnType<Array<NominationParentOption> | undefined> {
    if (!opts.target?.id) throw new Error('getNominationParentOptions: the target entity has no id');
    if (!Array.isArray(opts.contests)) throw new Error('getNominationParentOptions: the contests are not a list');
    return this._getNominationParentOptions(opts);
  }

  /////////////////////////////////////////////////////////////////////
  // Universal job management methods for the Admin App
  /////////////////////////////////////////////////////////////////////

  async getActiveJobs(opts: GetActiveJobsOptions): Promise<Array<JobInfo>> {
    const params = buildGetJobParams(opts);
    return (await this.get({
      url: UNIVERSAL_API_ROUTES.jobsActive,
      params
    })) as Array<JobInfo>;
  }

  async getPastJobs(opts: GetPastJobsOptions): Promise<Array<JobInfo>> {
    const params = buildGetJobParams(opts);
    return (await this.get({
      url: UNIVERSAL_API_ROUTES.jobsPast,
      params
    })) as Array<JobInfo>;
  }

  async startJob(body: StartJobOptions): Promise<JobInfo> {
    return (await this.post({
      url: UNIVERSAL_API_ROUTES.jobStart,
      body
    })) as JobInfo;
  }

  async getJobProgress({ jobId }: GetJobProgressOptions): Promise<JobInfo> {
    return (await this.get({
      url: resolveRoute(UNIVERSAL_API_ROUTES.jobProgress, { jobId })
    })) as JobInfo;
  }

  async abortJob({ jobId, reason }: AbortJobOptions): Promise<DataApiActionResult> {
    return (await this.post({
      url: resolveRoute(UNIVERSAL_API_ROUTES.jobAbort, { jobId }),
      body: { reason: reason || 'Admin requested abort' }
    })) as DataApiActionResult;
  }

  async abortAllJobs(): Promise<DataApiActionResult> {
    return (await this.post({
      url: UNIVERSAL_API_ROUTES.jobAbortAll
    })) as DataApiActionResult;
  }

  /////////////////////////////////////////////////////////////////////
  // PROTECTED INTERNAL METHODS TO BE IMPLEMENTED BY SUBCLASSES
  /////////////////////////////////////////////////////////////////////

  protected abstract _checkInvitationCode(opts: { code: string }): DWReturnType<InvitationCodeStatus>;
  protected abstract _requestSignInLink(opts: RequestSignInLinkOptions): DWReturnType<DataApiActionResult>;
  protected abstract _requestPasswordRecovery(opts: RequestPasswordRecoveryOptions): DWReturnType<DataApiActionResult>;
  protected abstract _requestAddressConfirmation(
    opts: RequestAddressConfirmationOptions
  ): Promise<AddressConfirmationResult>;
  protected abstract _signInWithInvitationCode(opts: {
    code: string;
    password: string;
  }): DWReturnType<DataApiActionResult>;
  protected abstract _claimInvitations(): DWReturnType<InvitationClaimResult>;
  protected abstract _login(opts: { username: string; password: string }): DWReturnType<DataApiActionResult>;
  protected abstract _logout(): DWReturnType<DataApiActionResult>;
  protected abstract _getBasicUserData(): DWReturnType<BasicUserData>;
  protected abstract _setPassword(opts: { password: string }): DWReturnType<DataApiActionResult>;
  protected abstract _acceptTermsOfUse(): DWReturnType<DataApiActionResult>;
  protected abstract _getUserEntities(opts: GetUserEntitiesOptions): DWReturnType<Array<UserEntity>>;
  protected abstract _getEntityUserData<TNominations extends boolean | undefined>(
    opts: GetEntityUserDataOptions<TNominations>
  ): DWReturnType<ContestantUserData<TNominations> | undefined>;
  protected abstract _setAnswers(opts: SetAnswersOptions & { overwrite: boolean }): DWReturnType<SetAnswersResult>;
  protected abstract _updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<UpdateEntityPropertiesResult>;
  protected abstract _setEntityNominations(opts: SetEntityNominationsOptions): DWReturnType<SetEntityNominationsResult>;
  protected abstract _getNominationParentOptions(
    opts: GetNominationParentOptionsOptions
  ): DWReturnType<Array<NominationParentOption> | undefined>;
}

/**
 * Build query string from job options for API requests.
 *
 * Handles the different parameter sets between active and past job queries:
 * - Active jobs: jobType only
 * - Past jobs: jobType, statuses array, and startFrom date
 *
 * @param opts - Job query options
 * @returns URL-encoded query string, empty string if no valid params
 */
function buildGetJobParams(opts: GetActiveJobsOptions | GetPastJobsOptions): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  // Both active and past jobs
  if (opts.jobType) params.jobType = opts.jobType;
  // Past jobs only (expect statuses as an array)
  if ('statuses' in opts && Array.isArray(opts.statuses) && opts.statuses.length) params.statuses = opts.statuses;
  if ('startFrom' in opts && opts.startFrom) params.startFrom = opts.startFrom.toISOString();
  return params;
}
