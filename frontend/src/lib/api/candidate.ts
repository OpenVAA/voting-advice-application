import {get} from 'svelte/store';
import {constants} from '$lib/utils/constants';
import {authContext} from '$lib/utils/authenticationStore';
import type {User} from '$lib/candidate/types';

function getUrl(path: string, search: Record<string, string> = {}) {
  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = path;
  url.search = new URLSearchParams(search).toString();

  return url.toString();
}

export const authenticate = async (identifier: string, password: string): Promise<Response> => {
  return await fetch(getUrl('api/auth/local'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({identifier, password})
  });
};

export const register = async (registrationKey: string, password: string): Promise<Response> => {
  return await fetch(getUrl('api/auth/candidate/register'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({registrationKey, password})
  });
};

export const requestForgotPasswordLink = async (email: string): Promise<Response> => {
  return await fetch(getUrl('api/auth/forgot-password'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({email})
  });
};

export const resetPassword = async (code: string, password: string) => {
  return await fetch(getUrl('api/auth/reset-password'), {
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
};

export const checkRegistrationKey = async (registrationKey: string): Promise<Response> => {
  return await fetch(getUrl('api/auth/candidate/check'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({registrationKey})
  });
};

type UserData = User & {error: unknown};

/**
 * Get the current user's data, including candidate information
 */
export const me = async (): Promise<User | undefined> => {
  const res = await request(
    getUrl('api/users/me', {
      'populate[candidate][populate][nominations][populate][party]': 'true',
      'populate[candidate][populate][nominations][populate][constituency]': 'true',
      'populate[candidate][populate][party]': 'true'
    })
  );
  if (!res?.ok) return;

  const data: UserData = await res.json();
  if (data?.error) return;

  return data;
};

/**
 * Change the user's password to a new one.
 */
export const changePassword = async (currentPassword: string, password: string) => {
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
};

/**
 * Add answer to a question for the logged in user.
 */
export const addAnswer = async (
  questionId: string,
  answerKey: AnswerOption['key'],
  openAnswer?: string
): Promise<Response | undefined> => {
  const token = authContext.token;
  const candidate = get(authContext.user)?.candidate;

  if (!candidate) return;

  const body = {
    data: {
      candidate: candidate?.id,
      question: Number(questionId),
      answer: {
        key: answerKey
      },
      openAnswer: openAnswer
    }
  };

  return await fetch(getUrl('api/answers'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${get(token)}`
    },
    body: JSON.stringify(body)
  });
};

/**
 * Update an existing answer for the logged in user.
 * The answer id is sufficient to identify the answer and question.
 */
export const updateAnswer = async (
  answerId: string,
  answerKey: AnswerOption['key'],
  openAnswer?: string
): Promise<Response> => {
  const token = authContext.token;

  const body = {
    data: {
      answer: {
        key: answerKey
      },
      openAnswer: openAnswer
    }
  };

  return fetch(getUrl(`api/answers/${answerId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${get(token)}`
    },
    body: JSON.stringify(body)
  });
};

export const deleteAnswer = async (answerId: string): Promise<Response> => {
  const token = authContext.token;

  return fetch(getUrl(`api/answers/${answerId}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${get(token)}`
    }
  });
};

/**
 * Get all the answers for the logged in user.
 */
export const getExistingAnswers = async (): Promise<Response | undefined> => {
  const user = get(authContext.user)?.candidate;
  const candidateId = user?.id;

  if (!candidateId) return;

  const res = await request(
    getUrl('api/answers', {
      'populate[question]': 'true',
      'filters[candidate][id][$eq]': candidateId.toString()
    })
  );
  if (!res?.ok) return;

  return res;
};

export const request = async (url: string, options: RequestInit = {}) => {
  const token = authContext.token;

  // Allow providing headers, but with an enforced Authorization header
  if (!options.headers) options.headers = {};
  (options.headers as Record<string, string>)['Authorization'] = `Bearer ${get(token)}`;

  return fetch(url, options).catch((error) => {
    console.error('Error in getting data from backend: ', error);
    return undefined;
  });
};
