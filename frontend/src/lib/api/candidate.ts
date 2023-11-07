import {constants} from '$lib/utils/constants';
import {authContext} from '$lib/components/authentication/authenticationStore';

export const authenticate = async (identifier: string, password: string): Promise<any> => {
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

export const request = async <T>(
  endpoint: string[],
  params: URLSearchParams = new URLSearchParams({})
): Promise<{data: T} | undefined> => {
  const token = authContext.token;
  const url = new URL(constants.BACKEND_URL);
  url.pathname = endpoint.join('/');
  url.search = params.toString();

  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
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
