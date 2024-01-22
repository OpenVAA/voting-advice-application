import {get} from 'svelte/store';
import {constants} from '$lib/utils/constants';
import {authContext} from '$lib/utils/authenticationStore';
import type {Photo} from '$lib/types/candidateAttributes';

export const authenticate = async (identifier: string, password: string): Promise<Response> => {
  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = 'api/auth/local';

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({identifier, password})
  });
};

export const register = async (registrationKey: string, password: string): Promise<Response> => {
  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = 'api/auth/candidate/register';

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({registrationKey, password})
  });
};

export const requestForgotPasswordLink = async (email: string): Promise<Response> => {
  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = 'api/auth/forgot-password';

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({email})
  });
};

export const resetPassword = async (code: string, password: string) => {
  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = 'api/auth/reset-password';

  return await fetch(url, {
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
  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = 'api/auth/candidate/check';

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({registrationKey})
  });
};

/**
 * Get the current user's data, including candidate information
 */
export const me = async (): Promise<unknown> => {
  // TODO: Define proper type
  return request(
    ['api', 'users', 'me'],
    new URLSearchParams({
      'populate[candidate][populate][nominations][populate][party]': 'true',
      'populate[candidate][populate][nominations][populate][constituency]': 'true',
      'populate[candidate][populate][party]': 'true',
      'populate[candidate][populate][photo]': 'true',
      'populate[candidate][populate][motherTongues]': 'true'
    })
  );
};

export const updateBasicInfo = async (
  manifesto?: Text,
  age?: number,
  gender?: string,
  photo?: Photo,
  unaffiliated?: boolean
): Promise<Response> => {
  const token = authContext.token;
  const user = get(authContext.user);
  const candidate = user?.candidate;

  if (!candidate) {
    throw new Error('user.candidate is undefined');
  }

  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = `api/candidates/${candidate.id}`;

  const body = {
    data: {
      manifesto,
      age,
      gender,
      unaffiliated,
      photo: photo?.id
    }
  };

  return await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${get(token)}`
    },
    body: JSON.stringify(body)
  });
};

export const request = async <T>(
  endpoint: string[],
  params: URLSearchParams = new URLSearchParams({})
): Promise<{data: T} | undefined> => {
  const token = authContext.token;
  const url = new URL(constants.PUBLIC_BACKEND_URL);
  url.pathname = endpoint.join('/');
  url.search = params.toString();

  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${get(token)}`
    }
  })
    .then((response) => {
      return response.json() as Promise<{data: T} | undefined>;
    })
    .catch((error) => {
      console.error('Error in getting data from backend: ', error);
      return undefined;
    });
};
