import { UniversalAdapter } from './universalAdapter';
import { UNIVERSAL_API_ROUTES } from './universalApiRoutes';
import type { DataApiActionResult } from './actionResult.type';
import type {
  BasicUserData,
  CandidateUserData,
  CheckRegistrationData,
  DataWriter,
  DWReturnType,
  GetCandidateUserDataOptions,
  LocalizedCandidateData,
  SetAnswersOptions,
  SetPropertiesOptions,
  WithAuth
} from './dataWriter.type';

/**
 * The abstract base class that all universal `DataWriter`s should extend.
 *
 * The subclasses must implement the protected `_foo` methods paired with each public `Foo` method. The implementations may freely throw errors.
 */
export abstract class UniversalDataWriter extends UniversalAdapter implements DataWriter {
  ////////////////////////////////////////////////////////////////////
  // PUBLIC METHODS
  ////////////////////////////////////////////////////////////////////

  preregister(
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
  ): DWReturnType<DataApiActionResult> {
    return this._preregister(opts);
  }

  checkRegistrationKey(opts: { registrationKey: string }): DWReturnType<CheckRegistrationData> {
    return this._checkRegistrationKey(opts);
  }

  register(opts: { registrationKey: string; password: string }): DWReturnType<DataApiActionResult> {
    return this._register(opts);
  }

  login(opts: { username: string; password: string }): DWReturnType<DataApiActionResult & Partial<WithAuth>> {
    return this._login(opts);
  }

  async logout(opts: WithAuth): DWReturnType<DataApiActionResult> {
    if (!this.fetch) throw new Error('Adapter fetch is not defined. Did you call init({ fetch }) first?');
    const url = UNIVERSAL_API_ROUTES.logout;
    const [clientResult, backendResult] = await Promise.all([
      this.fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }),
      this._logout(opts)
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
    if (!opts.properties.image.file) throw new Error('Image file is required for updating entity properties');
    return this._updateEntityProperties(opts);
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
        electionDocumentIds?: Array<string>;
        constituencyDocumentId?: string;
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
}
