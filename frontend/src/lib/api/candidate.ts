import {get} from 'svelte/store';
import {constants} from '$lib/utils/constants';
import {candidateContext} from '$lib/utils/candidateContext';
import type {Language, User, Photo, CandidateAnswer} from '$lib/types/candidateAttributes';
import type {StrapiAnswerData, StrapiLanguageData, StrapiResponse} from './dataProvider/strapi';
import {dataProvider} from '$lib/api/dataProvider/strapi/strapiDataProvider';
import {locale} from '$lib/i18n';

function getUrl(path: string, search: Record<string, string> = {}) {
  const url = new URL(constants.PUBLIC_BACKEND_URL);
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
    body: JSON.stringify({identifier, password})
  });
}

export function register(registrationKey: string, password: string): Promise<Response> {
  return fetch(getUrl('api/auth/candidate/register'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({registrationKey, password})
  });
}

export function requestForgotPasswordLink(email: string): Promise<Response> {
  return fetch(getUrl('api/auth/forgot-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({email})
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
    body: JSON.stringify({registrationKey})
  });
}

type UserData = User & {error: unknown};

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
export async function getInfoQuestions(): Promise<Array<QuestionProps>> {
  return await dataProvider.getInfoQuestions({locale: locale.get()});
}

/**
 * Get all opinion questions.
 */
export async function getOpinionQuestions(): Promise<Array<QuestionProps>> {
  return await dataProvider.getOpinionQuestions({locale: locale.get()});
}

/**
 * Add answer to a question for the logged in user.
 */
export function addAnswer(
  questionId: string,
  value: AnswerProps['value'],
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
  value: AnswerProps['value'],
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
      value: answer.attributes.value as AnswerProps['value']
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

export async function uploadFiles(files: Array<File>) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return request(getUrl('/api/upload/'), {
    method: 'POST',
    body: formData
  });
}

export async function deleteFile(id: number) {
  return request(getUrl(`/api/upload/files/${id}`), {method: 'DELETE'});
}

export async function request(url: string, options: RequestInit = {}) {
  const token = candidateContext.token;

  // Allow providing headers, but with an enforced Authorization header
  if (!options.headers) options.headers = {};
  (options.headers as Record<string, string>)['Authorization'] = `Bearer ${get(token)}`;

  return await fetch(url, options).catch((error) => {
    console.error('Error in getting data from backend:', error);
    return undefined;
  });
}
