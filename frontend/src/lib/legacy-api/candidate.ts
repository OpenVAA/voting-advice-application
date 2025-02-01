import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { locale } from '$lib/i18n';
import { dataProvider } from '$lib/legacy-api/dataProvider/strapi/strapiDataProvider';
import { constants } from '$lib/utils/constants';
import { candidateContext } from '$lib/utils/legacy-candidateContext';
import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
import type { Candidate, CandidateAnswer, Language, Photo, User } from '$types/legacy-candidateAttributes';
import type { StrapiAnswerData, StrapiLanguageData, StrapiResponse } from './dataProvider/strapi';

function getUrl(path: string, search: Record<string, string> = {}) {
  const url = new URL(browser ? constants.PUBLIC_BROWSER_BACKEND_URL : constants.PUBLIC_SERVER_BACKEND_URL);
  url.pathname = path;
  url.search = new URLSearchParams(search).toString();

  return url.toString();
}

export function authenticate(identifier: string, password: string): Promise<Response> {
  return fetch(getUrl('api/auth/local'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ identifier, password })
  });
}

export function register(registrationKey: string, password: string): Promise<Response> {
  return fetch(getUrl('api/auth/candidate/register'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ registrationKey, password })
  });
}

export function requestForgotPasswordLink(email: string): Promise<Response> {
  return fetch(getUrl('api/auth/forgot-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
}

export function resetPassword(code: string, password: string): Promise<Response> {
  return fetch(getUrl('api/auth/reset-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: code,
      password: password,
      // We leave it up to the UI to do the validation if the password confirmation is correct
      passwordConfirmation: password
    })
  });
}

export function checkRegistrationKey(registrationKey: string): Promise<Response> {
  return fetch(getUrl('api/auth/candidate/check'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ registrationKey })
  });
}

type UserData = User & { error: unknown };

/**
 * Get the current user's data, including candidate information
 */
export async function me(): Promise<User | undefined> {
  const res = await request(
    getUrl('api/users/me', {
      'populate[candidate][populate][nomination][populate][party]': 'true',
      'populate[candidate][populate][nomination][populate][constituency]': 'true',
      'populate[candidate][populate][nomination][populate][election]': 'true',
      'populate[candidate][populate][party]': 'true',
      'populate[candidate][populate][photo]': 'true',
      'populate[candidate][populate][gender]': 'true',
      'populate[candidate][populate][motherTongues]': 'true',
      'populate[candidate][populate][appLanguage]': 'true'
    })
  );

  if (!res?.ok) return;

  const data: UserData = await res.json();
  if (data?.error) return;

  return data;
}

/**
 * Get the current candidate user
 */
export async function getGeneralUserData(token: string): Promise<Candidate | undefined> {
  const res = await request(
    getUrl('api/users/me', {
      'populate[candidate][populate][appLanguage]': 'true'
    }),
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res?.ok) return;

  const data: UserData = await res.json();
  if (data?.error) return;

  return data.candidate;
}

export async function updatePhoto(photo: Photo) {
  const user = get(candidateContext.user);
  const candidate = user?.candidate;

  if (!candidate) {
    throw new Error('user.candidate is undefined');
  }

  return await request(getUrl(`api/candidates/${candidate.id}`), {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        photo: photo?.id
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Change the user's preferred language for the app.
 */
export async function updateAppLanguage(language: Language) {
  const user = get(candidateContext.user);
  const candidate = user?.candidate;

  if (!candidate) {
    throw new Error('user.candidate is undefined');
  }

  return await request(getUrl(`api/candidates/${candidate.id}`), {
    method: 'PUT',
    body: JSON.stringify({
      data: {
        appLanguage: language?.id
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Change the user's password to a new one.
 */
export async function changePassword(currentPassword: string, password: string) {
  return request(getUrl('api/auth/change-password'), {
    method: 'POST',
    body: JSON.stringify({
      currentPassword,
      password,
      passwordConfirmation: password
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Get all info questions.
 */
export async function getInfoQuestions(): Promise<Array<LegacyQuestionProps>> {
  return await dataProvider.getInfoQuestions({ locale: locale.get() });
}

/**
 * Get all opinion questions.
 */
export async function getOpinionQuestions(): Promise<Array<LegacyQuestionProps>> {
  return await dataProvider.getOpinionQuestions({ locale: locale.get() });
}

/**
 * Add answer to a question for the logged in user.
 */
export function addAnswer(
  questionId: string,
  value: LegacyAnswerProps['value'],
  openAnswer?: LocalizedString
): Promise<Response | undefined> {
  return request(getUrl('api/answers'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        question: questionId,
        value: value,
        openAnswer
      }
    })
  });
}

/**
 * Update an existing answer for the logged in user.
 * The answer id is sufficient to identify the answer and question.
 */
export async function updateAnswer(
  answerId: string,
  value: LegacyAnswerProps['value'],
  openAnswer?: LocalizedString
): Promise<Response | undefined> {
  return request(getUrl(`api/answers/${answerId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        value: value,
        openAnswer
      }
    })
  });
}

/**
 * Delete an existing answer for the logged in user.
 */
export async function deleteAnswer(answerId: string): Promise<Response | undefined> {
  return request(getUrl(`api/answers/${answerId}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Get all opinion answers for the logged in user.
 */
export async function getOpinionAnswers(): Promise<Record<string, CandidateAnswer> | undefined> {
  const user = get(candidateContext.user)?.candidate;
  const candidateId = user?.id;

  if (!candidateId) return;

  const res = await request(
    getUrl('api/answers', {
      'populate[question][populate][category]': 'true',
      'filters[candidate][id][$eq]': `${candidateId}`,
      'filters[question][category][type][$eq]': 'opinion'
    })
  );

  if (!res?.ok) return;

  const answerData: StrapiResponse<Array<StrapiAnswerData>> = await res.json();

  // Parse the data into a more usable format where the question ID is the key
  const answers: Record<string, CandidateAnswer> = {};

  answerData.data.forEach((answer) => {
    answers[answer.attributes.question.data.id] = {
      id: `${answer.id}`,
      value: answer.attributes.value,
      openAnswer: answer.attributes.openAnswer
    };
  });

  return answers;
}

/**
 * Get all info answers for the logged in user.
 */
export async function getInfoAnswers(): Promise<Record<string, CandidateAnswer> | undefined> {
  const user = get(candidateContext.user)?.candidate;
  const candidateId = user?.id;

  if (!candidateId) return;

  const res = await request(
    getUrl('api/answers', {
      'populate[question][populate][category]': 'true',
      'filters[candidate][id][$eq]': `${candidateId}`,
      'filters[question][category][type][$eq]': 'info'
    })
  );

  if (!res?.ok) return;

  const answerData: StrapiResponse<Array<StrapiAnswerData>> = await res.json();

  // Parse the data into a more usable format where the question ID is the key
  const answers: Record<string, CandidateAnswer> = {};

  answerData.data.forEach((answer) => {
    answers[answer.attributes.question.data.id] = {
      id: `${answer.id}`,
      value: answer.attributes.value as LegacyAnswerProps['value']
    };
  });

  return answers;
}

export async function getLanguages(): Promise<Array<StrapiLanguageData> | undefined> {
  const res = await request(
    getUrl('api/languages', {
      'populate[language]': 'true'
    })
  );
  if (!res?.ok) return undefined;

  const resJson = await res.json();
  return resJson.data;
}

/**
 * Get all parties.
 */
export async function getParties(): Promise<Array<LegacyPartyProps>> {
  return await dataProvider.getAllParties({ locale: locale.get() });
}

export async function uploadFiles(files: Array<File>) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return request(getUrl('/api/upload/'), {
    method: 'POST',
    body: formData
  });
}

export async function deleteFile(id: number) {
  return request(getUrl(`/api/upload/files/${id}`), { method: 'DELETE' });
}

export async function request(url: string, options: RequestInit = {}) {
  options.headers ??= {};

  const headers = options.headers as Record<string, string>;

  if (!headers['Authorization']) {
    headers['Authorization'] = `Bearer ${get(page).data.token}`;
  }

  const response = await fetch(url, options).catch((error) => {
    console.error('Error in getting data from backend:', error);
    return undefined;
  });

  if (response?.status === 401) {
    await logout();
  }

  return response;
}

/**
 * This function can be triggered by both Svelte server and client sides.
 *  - Svelte's server fetch API requires an absolute URL
 *  - a special host address is needed within the Docker network to reach a service (relevant for local environments and E2E tests)
 */
export async function logout() {
  await fetch(
    `${browser ? constants.PUBLIC_BROWSER_FRONTEND_URL : constants.PUBLIC_SERVER_FRONTEND_URL}/api/candidate/logout`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  candidateContext.user.set(null);
  await goto(get(getRoute)(ROUTE.CandAppLogin), { invalidateAll: true });
}
