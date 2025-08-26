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
  GetCandidateUserDataOptions,
  GetJobProgressOptions,
  GetJobsOptions,
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

  async getJobs(opts: GetJobsOptions): Promise<Array<JobInfo>> {
    if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');

    const url = localPathToUrl(UNIVERSAL_API_ROUTES.jobs);
    const queryParams = new URLSearchParams();

    if (opts.feature) queryParams.append('feature', opts.feature);
    if (opts.status) queryParams.append('status', opts.status);
    if (opts.lastUpdate) queryParams.append('lastUpdate', opts.lastUpdate);

    const response = await this.fetch(`${url}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${opts.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get jobs: ${response.statusText}`);
    }

    return response.json();
  }

  async startJob(opts: StartJobOptions): Promise<JobInfo> {
    if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');

    const url = localPathToUrl(UNIVERSAL_API_ROUTES.jobStart);
    const jobResponse = await this.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.authToken}`
      },
      body: JSON.stringify({
        feature: opts.feature,
        author: opts.author
      })
    });

    if (!jobResponse.ok) {
      throw new Error(`Failed to start job: ${jobResponse.statusText}`);
    };
    return jobResponse.json();
  }

  async getJobProgress(opts: GetJobProgressOptions): Promise<JobInfo> {
    if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');

    const url = localPathToUrl(UNIVERSAL_API_ROUTES.jobProgress(opts.jobId));
    const response = await this.fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${opts.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get job progress: ${response.statusText}`);
    }

    return response.json();
  }

  async abortJob(opts: AbortJobOptions): Promise<DataApiActionResult> {
    if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');

    const url = localPathToUrl(UNIVERSAL_API_ROUTES.jobAbort(opts.jobId));
    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to abort job: ${response.statusText}`);
    }

    return response.json();
  }

  async abortAllJobs(opts: AbortAllJobsOptions): Promise<DataApiActionResult> {
    if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');

    const url = localPathToUrl(UNIVERSAL_API_ROUTES.jobAbortAll);
    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.authToken}`
      },
      body: JSON.stringify({
        feature: opts.feature
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to abort all jobs: ${response.statusText}`);
    }

    return response.json();
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
