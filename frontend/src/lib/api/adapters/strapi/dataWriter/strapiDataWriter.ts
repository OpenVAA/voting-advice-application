import { ENTITY_TYPE } from '@openvaa/data';
import { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import { strapiAdapterMixin } from '../strapiAdapter';
import { parseCandidate, parseNominations, parseUser } from '../utils';
import type { Id } from '@openvaa/core';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type {
  BasicUserData,
  CandidateUserData,
  CheckRegistrationData,
  DWReturnType,
  GetCandidateUserDataOptions,
  LocalizedCandidateData,
  SetAnswersOptions,
  SetPropertiesOptions,
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

  protected _checkRegistrationKey(body: { registrationKey: string }): Promise<CheckRegistrationData> {
    // Throws if failed
    return this.apiPost({
      endpoint: 'checkRegistrationKey',
      body
    }).then((data) => ({ type: 'success', ...data }));
  }

  protected _register(body: { registrationKey: string; password: string }): Promise<DataApiActionResult> {
    // Throws if failed
    return this.apiPost({
      endpoint: 'registerCandidate',
      body
    }).then(() => ({ type: 'success' }));
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
    const data = await this.apiGet({ endpoint: 'basicUserData', authToken, disableCache: true });
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
        }
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
        ? parseNominations(data.candidate.nominations, locale ?? null)
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
  }: SetAnswersOptions & { overwrite: boolean }): DWReturnType<LocalizedCandidateData> {
    if (type !== ENTITY_TYPE.Candidate) throw new Error(`Unsupported entity type for setting answers: ${type}`);
    const data = await this.apiPost({
      endpoint: overwrite ? 'overwriteAnswers' : 'updateAnswers',
      endpointParams: { id },
      body: { data: answers },
      authToken
    });
    if (!data) throw new Error('Expected a CandidateData object, but got none.');
    return parseCandidate(data, null, { dontTranslateAnswers: true });
  }

  protected async _updateEntityProperties({
    authToken,
    target,
    properties: { image, termsOfUseAccepted }
  }: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
    let imageId: string | undefined;
    if (image?.file) {
      const data = await this.apiUpload({ authToken, target, files: [image.file!] });
      if (data?.length !== 1 || !data?.[0].documentId)
        throw new Error('Expected a single image object, but got something else.');
      imageId = data[0].documentId;
    }
    const candidate = await this.apiPost({
      endpoint: 'setProperties',
      endpointParams: { id: target.id },
      body: {
        data: {
          image: imageId,
          termsOfUseAccepted
        }
      },
      authToken
    });
    if (!candidate) throw new Error('Expected a CandidateData object, but got none.');
    return parseCandidate(candidate, null, { dontTranslateAnswers: true });
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
