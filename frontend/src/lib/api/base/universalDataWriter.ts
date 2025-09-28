import { resolveRoute } from '$app/paths';
import { UniversalAdapter } from './universalAdapter';
import { UNIVERSAL_API_ROUTES } from './universalApiRoutes';
import { localPathToUrl } from '../utils/localPathToUrl';
import type { Id } from '@openvaa/core';
import type { JobInfo } from '$lib/server/admin/jobs/jobStore.type';
import type { DataApiActionResult } from './actionResult.type';
import type {
  AbortAllJobsOptions,
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
  SetPropertiesOptions,
  SetQuestionOptions,
  StartJobOptions,
  WithAuth
} from './dataWriter.type';

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

  login(opts: { username: string; password: string }): DWReturnType<DataApiActionResult & Partial<WithAuth>> {
    return this._login(opts);
  }

  async exchangeCodeForIdToken(opts: {
    authorizationCode: string;
    codeVerifier: string;
    redirectUri: string;
  }): DWReturnType<DataApiActionResult> {
    if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');
    const url = localPathToUrl(UNIVERSAL_API_ROUTES.token);
    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        authorizationCode: opts.authorizationCode,
        codeVerifier: opts.codeVerifier,
        redirectUri: opts.redirectUri
      })
    });
    return { type: response.ok ? 'success' : 'failure' };
  }

  async preregisterWithIdToken(opts: {
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
    const url = localPathToUrl(UNIVERSAL_API_ROUTES.preregister);
    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(opts)
    });
    return {
      type: response.ok ? 'success' : 'failure',
      response: { status: response.status }
    };
  }

  preregisterWithApiToken(
    opts: {
      body: {
        firstName: string;
        lastName: string;
        identifier: string;
        email: string;
        nominations: Array<{ electionId: Id; constituencyId: Id }>;
      };
    } & WithAuth
  ): DWReturnType<DataApiActionResult> {
    return this._preregister(opts);
  }

  async clearIdToken(): DWReturnType<DataApiActionResult> {
    const url = localPathToUrl(UNIVERSAL_API_ROUTES.token);
    const response = await this.fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return { type: response.ok ? 'success' : 'failure' };
  }

  async logout(opts: WithAuth): DWReturnType<DataApiActionResult> {
    const url = localPathToUrl(UNIVERSAL_API_ROUTES.logout);
    const [clientResult, backendResult] = await Promise.all([
      this.fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }),
      this.backendLogout(opts)
    ]);
    if (clientResult.ok && backendResult.type === 'success') return backendResult;
    else
      return {
        type: 'failure',
        info: 'Logout failed',
        clientResult,
        backendResult
      };
  }

  async backendLogout(opts: WithAuth): DWReturnType<DataApiActionResult> {
    return this._logout(opts);
  }

  getBasicUserData(opts: WithAuth): DWReturnType<BasicUserData> {
    return this._getBasicUserData(opts);
  }

  requestForgotPasswordEmail(opts: { email: string }): DWReturnType<DataApiActionResult> {
    return this._requestForgotPasswordEmail(opts);
  }

  resetPassword(opts: { code: string; password: string }): DWReturnType<DataApiActionResult> {
    return this._resetPassword(opts);
  }

  setPassword(opts: WithAuth & { currentPassword: string; password: string }): DWReturnType<DataApiActionResult> {
    return this._setPassword(opts);
  }

  getCandidateUserData<TNominations extends boolean | undefined>(
    opts: GetCandidateUserDataOptions<TNominations>
  ): DWReturnType<CandidateUserData<TNominations>> {
    return this._getCandidateUserData(opts);
  }

  updateAnswers(opts: SetAnswersOptions): DWReturnType<LocalizedCandidateData> {
    return this._setAnswers({ ...opts, overwrite: false });
  }

  overwriteAnswers(opts: SetAnswersOptions): DWReturnType<LocalizedCandidateData> {
    return this._setAnswers({ ...opts, overwrite: true });
  }

  updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
    if (!opts.properties.image?.file && opts.properties.termsOfUseAccepted === undefined)
      throw new Error(
        'Either an image file or a value for termsOfUseAccepted is required for updating entity properties'
      );
    return this._updateEntityProperties(opts);
  }

  updateQuestion(opts: SetQuestionOptions): DWReturnType<DataApiActionResult> {
    return this._updateQuestion(opts);
  }

  /////////////////////////////////////////////////////////////////////
  // Universal job management methods for the Admin App
  /////////////////////////////////////////////////////////////////////

  async getActiveJobs({ authToken, ...opts }: GetActiveJobsOptions): Promise<Array<JobInfo>> {
    const params = buildGetJobParams(opts);
    return (await this.get({
      url: UNIVERSAL_API_ROUTES.jobsActive,
      params,
      authToken
    })) as Array<JobInfo>;
  }

  async getPastJobs({ authToken, ...opts }: GetPastJobsOptions): Promise<Array<JobInfo>> {
    const params = buildGetJobParams(opts);
    return (await this.get({
      url: UNIVERSAL_API_ROUTES.jobsPast,
      params,
      authToken
    })) as Array<JobInfo>;
  }

  async startJob({ authToken, ...body }: StartJobOptions): Promise<JobInfo> {
    return (await this.post({
      url: UNIVERSAL_API_ROUTES.jobStart,
      authToken,
      body
    })) as JobInfo;
  }

  async getJobProgress({ authToken, jobId }: GetJobProgressOptions): Promise<JobInfo> {
    return (await this.get({
      url: resolveRoute(UNIVERSAL_API_ROUTES.jobProgress, { jobId }),
      authToken
    })) as JobInfo;
  }

  async abortJob({ authToken, jobId, reason }: AbortJobOptions): Promise<DataApiActionResult> {
    return (await this.post({
      url: resolveRoute(UNIVERSAL_API_ROUTES.jobAbort, { jobId }),
      authToken,
      body: { reason: reason || 'Admin requested abort' }
    })) as DataApiActionResult;
  }

  async abortAllJobs({ authToken }: AbortAllJobsOptions): Promise<DataApiActionResult> {
    return (await this.post({
      url: UNIVERSAL_API_ROUTES.jobAbortAll,
      authToken
    })) as DataApiActionResult;
  }

  /////////////////////////////////////////////////////////////////////
  // PROTECTED INTERNAL METHODS TO BE IMPLEMENTED BY SUBCLASSES
  /////////////////////////////////////////////////////////////////////

  protected abstract _preregister(
    opts: {
      body: {
        firstName: string;
        lastName: string;
        identifier: string;
        email: string;
        nominations: Array<{ electionId: Id; constituencyId: Id }>;
      };
    } & WithAuth
  ): DWReturnType<DataApiActionResult>;
  protected abstract _checkRegistrationKey(opts: { registrationKey: string }): DWReturnType<CheckRegistrationData>;
  protected abstract _register(opts: { registrationKey: string; password: string }): DWReturnType<DataApiActionResult>;
  protected abstract _login(opts: {
    username: string;
    password: string;
  }): DWReturnType<DataApiActionResult & Partial<WithAuth>>;
  protected abstract _logout(opts: WithAuth): DWReturnType<DataApiActionResult>;
  protected abstract _getBasicUserData(opts: WithAuth): DWReturnType<BasicUserData>;
  protected abstract _requestForgotPasswordEmail(opts: { email: string }): DWReturnType<DataApiActionResult>;
  protected abstract _resetPassword(opts: { code: string; password: string }): DWReturnType<DataApiActionResult>;
  protected abstract _setPassword(
    opts: WithAuth & { currentPassword: string; password: string }
  ): DWReturnType<DataApiActionResult>;
  protected abstract _getCandidateUserData<TNominations extends boolean | undefined>(
    opts: GetCandidateUserDataOptions<TNominations>
  ): DWReturnType<CandidateUserData<TNominations>>;
  protected abstract _setAnswers(
    opts: SetAnswersOptions & { overwrite: boolean }
  ): DWReturnType<LocalizedCandidateData>;
  protected abstract _updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<LocalizedCandidateData>;
  protected abstract _updateQuestion(opts: SetQuestionOptions): DWReturnType<DataApiActionResult>;
  // Remove the abstract job methods since we're implementing them directly
  // protected abstract _getJobs(opts: GetJobsOptions): Promise<Array<JobInfo>>;
  // protected abstract _startJob(opts: StartJobOptions): Promise<JobInfo>;
  // protected abstract _getJobProgress(opts: GetJobProgressOptions): Promise<JobInfo>;
  // protected abstract _abortJob(opts: AbortJobOptions): Promise<DataApiActionResult>;
  // protected abstract _abortAllJobs(opts: AbortAllJobsOptions): Promise<DataApiActionResult>;
}

/**
 * Build query string from job options for API requests.
 *
 * Handles the different parameter sets between active and past job queries:
 * - Active jobs: jobType only
 * - Past jobs: jobType, statuses array, and startFrom date
 *
 * @param opts - Job query options with authToken omitted
 * @returns URL-encoded query string, empty string if no valid params
 */
function buildGetJobParams(
  opts: Omit<GetActiveJobsOptions, 'authToken'> | Omit<GetPastJobsOptions, 'authToken'>
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  // Both active and past jobs
  if (opts.jobType) params.jobType = opts.jobType;
  // Past jobs only (expect statuses as an array)
  if ('statuses' in opts && Array.isArray(opts.statuses) && opts.statuses.length) params.statuses = opts.statuses;
  if ('startFrom' in opts && opts.startFrom) params.startFrom = opts.startFrom.toISOString();
  return params;
}
