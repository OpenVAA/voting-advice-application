import { ENTITY_TYPE } from '@openvaa/data';
import { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import { strapiAdapterMixin } from '../strapiAdapter';
import { parseCandidate, parseNominations, parseUser } from '../utils';
import type { Id } from '@openvaa/core';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type {
  BasicUserData,
  CandidateUserData,
  DWReturnType,
  GetCandidateUserDataOptions,
  InsertJobResultOptions,
  LocalizedAnswers,
  SendEmailResult,
  SetAnswersOptions,
  SetPropertiesOptions,
  SetQuestionOptions,
  UpdatedEntityProps,
  WithAuth
} from '$lib/api/base/dataWriter.type';
import type { Params } from '../strapiAdapter.type';

export class StrapiDataWriter extends strapiAdapterMixin(UniversalDataWriter) {
  ////////////////////////////////////////////////////////////////////
  // Registration
  ////////////////////////////////////////////////////////////////////

  protected async _preregister({
    body,
    authToken
  }: {
    body: {
      firstName: string;
      lastName: string;
      identifier: string;
      email: string;
      nominations: Array<{ electionId: Id; constituencyId: Id }>;
    };
  } & WithAuth): Promise<DataApiActionResult> {
    // Throws if failed
    await this.apiPost({
      endpoint: 'preregisterCandidate',
      body,
      authToken
    });
    return { type: 'success' };
  }

  ////////////////////////////////////////////////////////////////////
  // Registration
  ////////////////////////////////////////////////////////////////////

  protected _register({ password }: { password: string }): Promise<DataApiActionResult> {
    throw new Error('StrapiDataWriter._register: registration key flow removed from interface');
  }

  ////////////////////////////////////////////////////////////////////
  // Logging in and out
  ////////////////////////////////////////////////////////////////////

  protected async _login({
    username: identifier,
    password
  }: {
    username: string;
    password: string;
  }): DWReturnType<DataApiActionResult & Partial<WithAuth>> {
    const { jwt: authToken } = await this.apiPost({
      endpoint: 'login',
      body: { identifier, password }
    });
    if (!authToken) return { type: 'failure' };
    return {
      type: 'success',
      authToken
    };
  }

  /**
   * Logging out of Strapi only necessitates the removal of the `jwt` token from the client-side, which is handled by `UniversalDataWriter`.
   */
  protected _logout(): Promise<DataApiActionResult> {
    return Promise.resolve({
      type: 'success',
      info: 'No logout necessary in Strapi'
    });
  }

  protected async _getBasicUserData({ authToken }: WithAuth): DWReturnType<BasicUserData> {
    const data = await this.apiGet({
      endpoint: 'basicUserData',
      authToken,
      disableCache: true,
      params: {
        populate: {
          role: 'true'
        }
      }
    });
    if (!data) throw new Error('Expected one BasicUserData object, but got none.');
    return parseUser(data);
  }

  ////////////////////////////////////////////////////////////////////
  // Password handling
  ////////////////////////////////////////////////////////////////////

  protected _requestForgotPasswordEmail(body: { email: string }): Promise<DataApiActionResult> {
    return this.apiPost({
      endpoint: 'forgotPassword',
      body
    }).then(() => ({ type: 'success' }));
  }

  protected _resetPassword({ code, password }: { code: string; password: string }): Promise<DataApiActionResult> {
    return this.apiPost({
      endpoint: 'resetPassword',
      body: {
        // Password confirmation is already expected to be done by the caller
        passwordConfirmation: password,
        code,
        password
      }
    }).then(() => ({ type: 'success' }));
  }

  protected _setPassword({
    authToken,
    currentPassword,
    password
  }: WithAuth & { currentPassword: string; password: string }): Promise<DataApiActionResult> {
    return this.apiPost({
      endpoint: 'setPassword',
      body: {
        currentPassword,
        password,
        passwordConfirmation: password
      },
      authToken
    }).then(() => ({ type: 'success' }));
  }

  ////////////////////////////////////////////////////////////////////
  // Getting data owned by the user
  ////////////////////////////////////////////////////////////////////

  protected async _getCandidateUserData<TNominations extends boolean | undefined>({
    authToken,
    loadNominations,
    locale
  }: GetCandidateUserDataOptions<TNominations>): DWReturnType<CandidateUserData<TNominations>> {
    const params: Params = {
      populate: {
        candidate: {
          populate: {
            nominations: loadNominations ? { populate: '*' } : 'false',
            image: 'true'
          }
        },
        role: 'true'
      }
    };
    const data = await this.apiGet({
      endpoint: 'candidateUserData',
      params,
      authToken,
      disableCache: true
    });
    if (!data?.candidate) throw new Error('Expected a CandidateUserData object with a candidate, but got none.');
    // A localized version of the candidate data with answers untranslated
    const candidate = parseCandidate(data.candidate, locale ?? null, {
      dontTranslateAnswers: true
    });
    const user = parseUser(data);
    // If loadNominations is true, always return nominations data even if empty; if false, return undefined
    const nominations = loadNominations
      ? data.candidate.nominations
        ? parseNominations({ nominations: data.candidate.nominations, locale: locale ?? null })
        : {}
      : undefined;
    return { user, candidate, nominations } as CandidateUserData<TNominations>;
  }

  ////////////////////////////////////////////////////////////////////
  // Setting data owned by the user
  // NB. All setters return the whole updated entity data for synchronization.
  ////////////////////////////////////////////////////////////////////

  protected async _setAnswers({
    authToken,
    target: { type, id },
    answers,
    overwrite
  }: SetAnswersOptions & { overwrite: boolean }): DWReturnType<LocalizedAnswers> {
    if (type !== ENTITY_TYPE.Candidate) throw new Error(`Unsupported entity type for setting answers: ${type}`);
    const data = await this.apiPost({
      endpoint: overwrite ? 'overwriteAnswers' : 'updateAnswers',
      endpointParams: { id },
      body: { data: answers },
      authToken
    });
    if (!data) throw new Error('Expected a CandidateData object, but got none.');
    const parsed = parseCandidate(data, null, { dontTranslateAnswers: true });
    return parsed.answers ?? {};
  }

  protected async _updateEntityProperties({
    authToken,
    target,
    properties: { termsOfUseAccepted }
  }: SetPropertiesOptions): DWReturnType<UpdatedEntityProps> {
    const candidate = await this.apiPost({
      endpoint: 'setProperties',
      endpointParams: { id: target.id },
      body: {
        data: {
          termsOfUseAccepted
        }
      },
      authToken
    });
    if (!candidate) throw new Error('Expected a CandidateData object, but got none.');
    const parsed = parseCandidate(candidate, null, { dontTranslateAnswers: true });
    return { termsOfUseAccepted: parsed.termsOfUseAccepted };
  }

  ////////////////////////////////////////////////////////////////////
  // Methods for the Admin App
  ////////////////////////////////////////////////////////////////////

  protected async _updateQuestion({
    authToken,
    id,
    data: { customData }
  }: SetQuestionOptions): DWReturnType<DataApiActionResult> {
    if (!customData || typeof customData !== 'object')
      throw new Error(`Expected a customData object but got type: ${typeof customData}`);
    const data = await this.apiPost({
      endpoint: 'updateQuestion',
      endpointParams: { id },
      body: { data: customData },
      authToken
    });
    if (!data) throw new Error('Expected a QuestionData object, but got none.');
    return { type: 'success' };
  }

  protected async _insertJobResult({ authToken, data }: InsertJobResultOptions): DWReturnType<DataApiActionResult> {
    await this.apiPost({
      endpoint: 'adminJobs',
      body: { data },
      authToken
    });
    return { type: 'success' };
  }

  protected _sendEmail(): Promise<SendEmailResult> {
    throw new Error('StrapiDataWriter._sendEmail not implemented');
  }

  ////////////////////////////////////////////////////////////////////
  // Internal utilities
  ////////////////////////////////////////////////////////////////////

  // const user = get(candidateContext.user);
  // const candidate = user?.candidate;

  // if (!candidate) {
  //   throw new Error('user.candidate is undefined');
  // }

  // return await request(getUrl(`api/candidates/${candidate.id}`), {
  //   method: 'PUT',
  //   body: JSON.stringify({
  //     data: {
  //       image: image?.id
  //     }
  //   }),
  //   headers: {
  //     'Content-Type': 'application/json'
  //   }
  // });

  // if (typeof file === 'string' && file.startsWith('data:')) {
  //   const res = await fetch(file);
  //   const blob = await res.blob();
  //   const filename = `file_${getUUID()}.${blob.type.split('/')[1]}`;
  //   formData.append('files', blob, filename);
  // }
}
