import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { AUTH_TOKEN_KEY } from '$lib/auth/authToken';
import { logDebugError } from '$lib/utils/logger';
import type { Cookies } from '@sveltejs/kit';
import type { BasicUserData } from '$lib/api/base/dataWriter.type';

/**
 * A utility for getting the user data in a load or server function. In addition to `fetch`, you must provide one and only one of `authToken`, `cookies` or `parent`.
 * TODO: When updating the backend, use the claims in the JWT token instead making the roundtrip to the backend for each request.
 * @param fetch - The fetch function for making API requests.
 * @param authToken - The authentication token for the user.
 * @param cookies - The cookies object from which the token will be gotten.
 * @param parent - The parent data loader, yielding the token.
 * @returns BasicUserData or undefined if user data is not available.
 */
export async function getUserData({
  fetch,
  authToken,
  cookies,
  parent
}: {
  fetch: Fetch;
} & (
  | {
      authToken: string;
      cookies?: never;
      parent?: never;
    }
  | {
      authToken?: never;
      cookies: Cookies;
      parent?: never;
    }
  | {
      authToken?: never;
      cookies?: never;
      parent: () => Promise<{ token?: string }>;
    }
)): Promise<BasicUserData | undefined> {
  if ([authToken, cookies, parent].filter((x) => x).length !== 1)
    throw new Error('Exactly one of authToken, cookies, or parent must be provided.');

  if (cookies) authToken = cookies.get(AUTH_TOKEN_KEY);
  if (parent) authToken = (await parent()).token;

  if (!authToken) return undefined;

  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  const userData = await dataWriter.getBasicUserData({ authToken }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
    return undefined;
  });

  return userData;
}
