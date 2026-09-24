import { resolveRoute } from '$app/paths';
import { UniversalAdapter } from './universalAdapter';
import { UNIVERSAL_API_ROUTES } from './universalApiRoutes';
import type { Id } from '@openvaa/core';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
import type { DataApiActionResult } from './actionResult.type';
import type {
  AbortJobOptions,
  BasicUserData,
  CandidateUserData,
  CheckRegistrationData,
  DataWriter,
  DWReturnType,
  GetActiveJobsOptions,
  GetCandidateUserDataOptions,
  GetJobProgressOptions,
  GetPastJobsOptions,
  LocalizedCandidateData,
  SetAnswersOptions,
  SetAnswersResult,
  SetPropertiesOptions,
  StartJobOptions,
  UnverifiedAnswers
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

  checkRegistrationKey(opts: { registrationKey: string }): DWReturnType<CheckRegistrationData> {
    return this._checkRegistrationKey(opts);
  }

  register(opts: { registrationKey: string; password: string }): DWReturnType<DataApiActionResult> {
    return this._register(opts);
  }

  login(opts: { username: string; password: string }): DWReturnType<DataApiActionResult> {
    return this._login(opts);
  }

  async exchangeCodeForIdToken(opts: {
    authorizationCode: string;
    codeVerifier: string;
    redirectUri: string;
  }): DWReturnType<DataApiActionResult> {
    return (await this.post({
      url: UNIVERSAL_API_ROUTES.token,
      body: {
        authorizationCode: opts.authorizationCode,
        codeVerifier: opts.codeVerifier,
        redirectUri: opts.redirectUri
      }
    })) as DataApiActionResult;
  }

  async preregisterWithIdToken(body: {
    email: string;
    nominations: Array<{ electionId: Id; constituencyId: Id }>;
    extra: {
      emailTemplate: {
        subject: string;
        text: string;
        html: string;
      };
    };
  }): DWReturnType<DataApiActionResult & { response: Pick<Response, 'status'> }> {
    const response = await this.post({
      url: UNIVERSAL_API_ROUTES.preregister,
      body,
      parser: 'none'
    });
    return {
      type: response.ok ? 'success' : 'failure',
      response: { status: response.status }
    };
  }

  preregisterWithApiToken(opts: {
    body: {
      firstName: string;
      lastName: string;
      identifier: string;
      email: string;
      nominations: Array<{ electionId: Id; constituencyId: Id }>;
    };
  }): DWReturnType<DataApiActionResult> {
    return this._preregister(opts);
  }

  async clearIdToken(): DWReturnType<DataApiActionResult> {
    return (await this.delete({
      url: UNIVERSAL_API_ROUTES.token
    })) as DataApiActionResult;
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

  requestForgotPasswordEmail(opts: { email: string }): DWReturnType<DataApiActionResult> {
    return this._requestForgotPasswordEmail(opts);
  }

  resetPassword(opts: { code: string; password: string }): DWReturnType<DataApiActionResult> {
    return this._resetPassword(opts);
  }

  setPassword(opts: { password: string }): DWReturnType<DataApiActionResult> {
    return this._setPassword(opts);
  }

  getCandidateUserData<TNominations extends boolean | undefined>(
    opts: GetCandidateUserDataOptions<TNominations>
  ): DWReturnType<CandidateUserData<TNominations>> {
    return this._getCandidateUserData(opts);
  }

  updateAnswers(opts: SetAnswersOptions): DWReturnType<SetAnswersResult> {
    return this._setAnswers({ ...opts, overwrite: false });
  }

  overwriteAnswers(opts: SetAnswersOptions): DWReturnType<SetAnswersResult> {
    return this._setAnswers({ ...opts, overwrite: true });
  }

  updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
    if (!opts.properties.image?.file && opts.properties.termsOfUseAccepted === undefined)
      throw new Error(
        'Either an image file or a value for termsOfUseAccepted is required for updating entity properties'
      );
    return this._updateEntityProperties(opts);
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

  protected abstract _preregister(opts: {
    body: {
      firstName: string;
      lastName: string;
      identifier: string;
      email: string;
      nominations: Array<{ electionId: Id; constituencyId: Id }>;
    };
  }): DWReturnType<DataApiActionResult>;
  protected abstract _checkRegistrationKey(opts: { registrationKey: string }): DWReturnType<CheckRegistrationData>;
  protected abstract _register(opts: { registrationKey: string; password: string }): DWReturnType<DataApiActionResult>;
  protected abstract _login(opts: { username: string; password: string }): DWReturnType<DataApiActionResult>;
  protected abstract _logout(): DWReturnType<DataApiActionResult>;
  protected abstract _getBasicUserData(): DWReturnType<BasicUserData>;
  protected abstract _requestForgotPasswordEmail(opts: { email: string }): DWReturnType<DataApiActionResult>;
  protected abstract _resetPassword(opts: { code: string; password: string }): DWReturnType<DataApiActionResult>;
  protected abstract _setPassword(opts: { password: string }): DWReturnType<DataApiActionResult>;
  protected abstract _getCandidateUserData<TNominations extends boolean | undefined>(
    opts: GetCandidateUserDataOptions<TNominations>
  ): DWReturnType<CandidateUserData<TNominations>>;
  protected abstract _setAnswers(opts: SetAnswersOptions & { overwrite: boolean }): DWReturnType<SetAnswersResult>;
  protected abstract _updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<LocalizedCandidateData>;
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
